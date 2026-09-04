import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.github.ramialjohi.diceroguelite',
  appName: 'Dice Roguelite',
  // Capacitor serves the build from the device, not from a /<repo>/ URL, so the
  // web build fed to it must be produced with BASE_PATH=/ (see npm run build:apk).
  webDir: 'dist',
  android: {
    backgroundColor: '#0b0d14',
  },
};

export default config;
