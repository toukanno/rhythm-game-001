#!/usr/bin/env python3
"""
Advanced beatmap generator — produces rhythm-synced beatmaps from audio analysis.
Uses librosa for beat tracking, onset detection, spectral analysis, and section detection.
"""

import librosa
import numpy as np
import json, os, glob, sys

LANE_COUNT = 6
MID = LANE_COUNT // 2
MAX_LANE = LANE_COUNT - 1

# ─── Audio analysis ──────────────────────────────────────────────────────────

def analyze_song(path: str):
    """Full audio analysis: beats, onsets, sections, energy."""
    y, sr = librosa.load(path, sr=22050, duration=240)
    duration = len(y) / sr

    # --- BPM and beat positions ---
    tempo, beat_frames = librosa.beat.beat_track(y=y, sr=sr, units='frames')
    bpm = float(tempo[0]) if hasattr(tempo, '__len__') else float(tempo)
    if bpm < 80:
        bpm *= 2
    bpm = round(bpm)
    beat_times = librosa.frames_to_time(beat_frames, sr=sr)

    # --- Onset detection (combine spectral flux + energy) ---
    onset_env = librosa.onset.onset_strength(y=y, sr=sr)
    # Strong onsets (high threshold)
    strong_frames = librosa.onset.onset_detect(
        y=y, sr=sr, onset_envelope=onset_env, delta=0.08, wait=4
    )
    strong_times = librosa.frames_to_time(strong_frames, sr=sr)
    # Medium onsets
    medium_frames = librosa.onset.onset_detect(
        y=y, sr=sr, onset_envelope=onset_env, delta=0.04, wait=3
    )
    medium_times = librosa.frames_to_time(medium_frames, sr=sr)
    # Dense onsets (low threshold for HARD)
    dense_frames = librosa.onset.onset_detect(
        y=y, sr=sr, onset_envelope=onset_env, delta=0.02, wait=2
    )
    dense_times = librosa.frames_to_time(dense_frames, sr=sr)

    # --- Energy envelope (for section detection) ---
    hop = 512
    rms = librosa.feature.rms(y=y, hop_length=hop)[0]
    rms_times = librosa.frames_to_time(np.arange(len(rms)), sr=sr, hop_length=hop)
    # Smooth energy
    from scipy.ndimage import uniform_filter1d
    rms_smooth = uniform_filter1d(rms, size=50)

    # --- Section detection via energy thresholds ---
    if len(rms_smooth) > 0:
        e_mean = np.mean(rms_smooth)
        e_std = np.std(rms_smooth)
        high_threshold = e_mean + 0.5 * e_std
        low_threshold = e_mean - 0.3 * e_std
    else:
        high_threshold = 0.5
        low_threshold = 0.1

    # Build section map: for each beat, classify as intro/verse/chorus/outro
    def get_energy_at(t):
        idx = np.searchsorted(rms_times, t)
        idx = min(idx, len(rms_smooth) - 1)
        return rms_smooth[idx] if idx >= 0 else 0

    def classify_section(t):
        if t < 3.0:
            return 'intro'
        if t > duration - 4.0:
            return 'outro'
        e = get_energy_at(t)
        if e >= high_threshold:
            return 'chorus'
        elif e <= low_threshold:
            return 'bridge'
        else:
            return 'verse'

    # --- Spectral features for lane assignment ---
    chroma = librosa.feature.chroma_stft(y=y, sr=sr, hop_length=hop)
    spectral_centroid = librosa.feature.spectral_centroid(y=y, sr=sr, hop_length=hop)[0]
    sc_times = librosa.frames_to_time(np.arange(len(spectral_centroid)), sr=sr, hop_length=hop)

    def get_pitch_lane(t):
        """Map spectral centroid to a lane (higher pitch → higher lane index)."""
        idx = np.searchsorted(sc_times, t)
        idx = min(idx, len(spectral_centroid) - 1)
        sc = spectral_centroid[idx] if idx >= 0 else 2000
        # Normalize: typical vocal range 200-4000 Hz centroid
        normalized = (sc - 300) / 3500
        normalized = max(0, min(1, normalized))
        return int(normalized * MAX_LANE)

    return {
        'bpm': bpm,
        'duration': duration,
        'beat_times': beat_times,
        'strong_times': strong_times,
        'medium_times': medium_times,
        'dense_times': dense_times,
        'classify_section': classify_section,
        'get_pitch_lane': get_pitch_lane,
        'get_energy_at': get_energy_at,
    }


# ─── Beatmap generation ─────────────────────────────────────────────────────

def snap_to_grid(times, beat_times, tolerance_ms=50):
    """Snap onset times to nearest beat if within tolerance."""
    snapped = []
    for t in times:
        diffs = np.abs(beat_times - t)
        min_idx = np.argmin(diffs)
        if diffs[min_idx] < tolerance_ms / 1000:
            snapped.append(beat_times[min_idx])
        else:
            snapped.append(t)
    return np.array(snapped)


def filter_min_gap(times, min_gap_ms):
    """Remove times too close together."""
    if len(times) == 0:
        return times
    result = [times[0]]
    for t in times[1:]:
        if (t - result[-1]) >= min_gap_ms / 1000:
            result.append(t)
    return np.array(result)


def generate_lane_sequence(times, analysis, section_func):
    """Generate musically logical lane assignments."""
    lanes = []
    prev_lane = MID
    for t in times:
        section = section_func(t)
        pitch_lane = analysis['get_pitch_lane'](t)

        if section == 'intro' or section == 'outro':
            # Stick to center lanes
            lane = MID + np.clip(pitch_lane - MID, -1, 1)
        elif section == 'chorus':
            # Use full lane range, follow pitch more closely
            lane = pitch_lane
        else:
            # Verse: moderate movement, blend pitch with smooth movement
            target = pitch_lane
            # Don't jump more than 2 lanes at a time
            diff = target - prev_lane
            lane = prev_lane + np.clip(diff, -2, 2)

        lane = int(max(0, min(MAX_LANE, lane)))
        lanes.append(lane)
        prev_lane = lane
    return lanes


def create_rhythm_pattern(beat_times, section_func, difficulty):
    """Create repeating rhythmic patterns within sections."""
    patterns = {
        'intro': {
            'EASY': [1, 0, 0, 0],
            'NORMAL': [1, 0, 1, 0],
            'HARD': [1, 0, 1, 0],
        },
        'verse': {
            'EASY': [1, 0, 1, 0],
            'NORMAL': [1, 0, 1, 1],
            'HARD': [1, 1, 1, 1],
        },
        'chorus': {
            'EASY': [1, 0, 1, 0],
            'NORMAL': [1, 1, 1, 0],
            'HARD': [1, 1, 1, 1],
        },
        'bridge': {
            'EASY': [1, 0, 0, 0],
            'NORMAL': [1, 0, 1, 0],
            'HARD': [1, 1, 1, 0],
        },
        'outro': {
            'EASY': [1, 0, 0, 0],
            'NORMAL': [1, 0, 0, 0],
            'HARD': [1, 0, 1, 0],
        },
    }
    selected = []
    for i, bt in enumerate(beat_times):
        section = section_func(bt)
        pat = patterns.get(section, patterns['verse'])[difficulty]
        if pat[i % len(pat)]:
            selected.append(bt)
    return np.array(selected)


def generate_beatmap(path, title, artist, difficulty, analysis=None):
    """Generate a single beatmap for the given difficulty."""
    if analysis is None:
        analysis = analyze_song(path)

    bpm = analysis['bpm']
    duration = analysis['duration']
    beat_times = analysis['beat_times']
    section_func = analysis['classify_section']
    beat_ms = 60000 / bpm

    notes = []

    if difficulty == 'EASY':
        # Quarter notes on main beats, filtered by section patterns
        times = create_rhythm_pattern(beat_times, section_func, 'EASY')
        times = filter_min_gap(times, 300)
        # Remove first 2s and last 2s
        times = times[(times > 2.0) & (times < duration - 2.0)]
        lanes = generate_lane_sequence(times, analysis, section_func)

        for t, lane in zip(times, lanes):
            notes.append({'lane': lane, 'time': int(t * 1000), 'type': 'tap'})

        # A few holds in chorus sections
        hold_count = 0
        for i, bt in enumerate(beat_times):
            if bt < 4 or bt > duration - 4:
                continue
            if section_func(bt) == 'chorus' and i % 16 == 0 and hold_count < 4:
                notes.append({
                    'lane': MID, 'time': int(bt * 1000),
                    'type': 'hold', 'duration': int(beat_ms * 2)
                })
                hold_count += 1

    elif difficulty == 'NORMAL':
        # Beats + strong onsets, snapped to grid
        beat_set = set(beat_times.tolist())
        combined = np.unique(np.concatenate([
            beat_times,
            snap_to_grid(analysis['strong_times'], beat_times, 60),
        ]))
        combined = np.sort(combined)
        # Apply section-based density
        selected = []
        for i, t in enumerate(combined):
            section = section_func(t)
            if section == 'chorus':
                selected.append(t)  # keep all in chorus
            elif section == 'verse':
                if i % 2 == 0 or t in beat_set:
                    selected.append(t)
            else:
                if t in beat_set:
                    selected.append(t)
        times = filter_min_gap(np.array(selected), 150)
        times = times[(times > 1.5) & (times < duration - 1.5)]
        lanes = generate_lane_sequence(times, analysis, section_func)

        for t, lane in zip(times, lanes):
            notes.append({'lane': lane, 'time': int(t * 1000), 'type': 'tap'})

        # Doubles in chorus
        double_count = 0
        for i, bt in enumerate(beat_times):
            if section_func(bt) == 'chorus' and i % 8 == 4 and double_count < 8:
                mirror = MAX_LANE - analysis['get_pitch_lane'](bt)
                notes.append({'lane': max(0, min(MAX_LANE, mirror)), 'time': int(bt * 1000), 'type': 'tap'})
                double_count += 1

        # Holds on sustained sections
        hold_count = 0
        for i, bt in enumerate(beat_times):
            if bt < 3 or bt > duration - 3:
                continue
            if i % 12 == 0 and hold_count < 6:
                lane = analysis['get_pitch_lane'](bt)
                notes.append({
                    'lane': lane, 'time': int(bt * 1000),
                    'type': 'hold', 'duration': int(beat_ms * 2)
                })
                hold_count += 1

        # Flicks on section transitions
        flick_count = 0
        for i, bt in enumerate(beat_times[1:], 1):
            prev_section = section_func(beat_times[i-1])
            curr_section = section_func(bt)
            if prev_section != curr_section and flick_count < 5:
                notes.append({'lane': MID, 'time': int(bt * 1000), 'type': 'flick'})
                flick_count += 1

    elif difficulty == 'HARD':
        # All beats + medium onsets + dense onsets in chorus
        combined = np.unique(np.concatenate([
            beat_times,
            snap_to_grid(analysis['medium_times'], beat_times, 40),
        ]))
        # Add dense onsets only in chorus
        for t in analysis['dense_times']:
            if section_func(t) == 'chorus':
                combined = np.append(combined, t)
        combined = np.unique(np.sort(combined))
        times = filter_min_gap(combined, 80)
        times = times[(times > 1.0) & (times < duration - 1.0)]
        lanes = generate_lane_sequence(times, analysis, section_func)

        for t, lane in zip(times, lanes):
            notes.append({'lane': lane, 'time': int(t * 1000), 'type': 'tap'})

        # Frequent doubles in chorus
        double_count = 0
        for i, bt in enumerate(beat_times):
            if bt < 2 or bt > duration - 2:
                continue
            section = section_func(bt)
            if section == 'chorus' and i % 4 == 2 and double_count < 15:
                pl = analysis['get_pitch_lane'](bt)
                mirror = MAX_LANE - pl
                if mirror != pl:
                    notes.append({'lane': mirror, 'time': int(bt * 1000), 'type': 'tap'})
                    double_count += 1

        # Triples at climax
        triple_count = 0
        for i, bt in enumerate(beat_times):
            if section_func(bt) == 'chorus' and i % 16 == 0 and triple_count < 4:
                for lane in [0, MID, MAX_LANE]:
                    notes.append({'lane': lane, 'time': int(bt * 1000), 'type': 'tap'})
                triple_count += 1

        # More holds
        hold_count = 0
        for i, bt in enumerate(beat_times):
            if bt < 2 or bt > duration - 2:
                continue
            if i % 8 == 0 and hold_count < 10:
                lane = analysis['get_pitch_lane'](bt)
                dur = beat_ms * (2 if section_func(bt) != 'chorus' else 3)
                notes.append({
                    'lane': lane, 'time': int(bt * 1000),
                    'type': 'hold', 'duration': int(dur)
                })
                hold_count += 1

        # Flicks on accents and transitions
        flick_count = 0
        for i, bt in enumerate(beat_times):
            if bt < duration * 0.2 or bt > duration - 2:
                continue
            section = section_func(bt)
            if section == 'chorus' and i % 8 == 0 and flick_count < 10:
                notes.append({
                    'lane': analysis['get_pitch_lane'](bt),
                    'time': int(bt * 1000), 'type': 'flick'
                })
                flick_count += 1

    # --- Deduplicate and sort ---
    notes.sort(key=lambda n: (n['time'], n['lane']))
    seen = set()
    unique = []
    for n in notes:
        key = (n['time'], n['lane'])
        if key not in seen:
            seen.add(key)
            unique.append(n)

    return {
        'title': title,
        'artist': artist,
        'difficulty': difficulty.upper(),
        'bpm': bpm,
        'audioFile': f"songs/{os.path.basename(path)}",
        'offset': 0,
        'notes': unique,
    }


# ─── Main ────────────────────────────────────────────────────────────────────

def get_song_meta(fname):
    """Get title and artist from existing EASY beatmap if available."""
    easy_path = f"public/beatmaps/{fname.replace('.mp3', '_easy.json')}"
    if os.path.exists(easy_path):
        with open(easy_path) as f:
            bm = json.load(f)
        return bm.get('title', fname), bm.get('artist', 'Unknown')
    return fname.replace('.mp3', '').replace('_', ' ').title(), 'Unknown'


def main():
    song_dir = 'public/songs'
    beatmap_dir = 'public/beatmaps'
    songs = sorted(glob.glob(f'{song_dir}/*.mp3'))
    print(f"Processing {len(songs)} songs...")

    total = 0
    errors = 0

    for path in songs:
        fname = os.path.basename(path)
        base = fname.replace('.mp3', '')
        title, artist = get_song_meta(fname)

        try:
            # Analyze once, reuse for all difficulties
            analysis = analyze_song(path)

            for diff in ['EASY', 'NORMAL', 'HARD']:
                bm = generate_beatmap(path, title, artist, diff, analysis)
                outpath = f"{beatmap_dir}/{base}_{diff.lower()}.json"
                with open(outpath, 'w') as f:
                    json.dump(bm, f, indent=2, ensure_ascii=False)
                total += 1
                print(f"  {base}_{diff.lower()}: {len(bm['notes'])} notes ({analysis['bpm']} BPM)")

        except Exception as e:
            print(f"  ERROR {base}: {e}")
            errors += 1

    print(f"\nDone: {total} beatmaps generated, {errors} errors")


if __name__ == '__main__':
    main()
