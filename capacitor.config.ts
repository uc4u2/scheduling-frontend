import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.schedulaa.staff',
  appName: 'Schedulaa Staff',
  webDir: 'build',
  server: {
    url: 'https://app.schedulaa.com',
    cleartext: false
  }
};

export default config;
