import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.toukanno.rhythmstriker',
  appName: 'リズムストライカー',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  ios: {
    scheme: 'Rhythm Striker',
    scrollEnabled: false,
    allowsLinkPreview: false,
    preferredContentMode: 'mobile',
    backgroundColor: '#1a0a2e',
    contentInset: 'always',
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 1500,
      launchFadeOutDuration: 300,
      backgroundColor: '#1a0a2e',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
  },
};

export default config;
