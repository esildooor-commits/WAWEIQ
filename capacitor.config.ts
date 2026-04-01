import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.waveiq.app',
  appName: 'WaveIQ',
  webDir: 'dist',
  bundledWebRuntime: false,
  server: {
    androidScheme: 'http',
    cleartext: true,
  },
};

export default config;