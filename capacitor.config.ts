import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.toukanno.rhythmstriker',
  appName: 'Rhythm Striker',
  webDir: 'dist',
  server: {
    // Use inline web assets for offline support
    androidScheme: 'https',
  },
  ios: {
    // Prevent iOS from bouncing the webview on scroll
    scrollEnabled: false,
    // Use full screen (no status bar overlap)
    preferredContentMode: 'mobile',
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 1000,
      backgroundColor: '#1a0a2e',
    },
  },
};

export default config;
