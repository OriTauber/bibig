import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.bibig.app',
  appName: 'bibig',
  webDir: 'dist',
  server: { cleartext: true },
  plugins: {
    FirebaseAuthentication: { providers: ['google.com'] },
  },
}

export default config
