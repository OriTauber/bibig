# bibig for Android

The Android project is in `android/` and uses Capacitor 7.6.9, Android Gradle Plugin (AGP) 8.7.2, and Gradle 8.11.1.

## Build and sync

```powershell
npm run android:sync
npm run android:open
```

`android:sync` builds the React app and copies the result into the Android project. Open Android Studio, select an emulator or connected device, then run the app.

Android Studio needs an installed Android SDK. Its location belongs in the ignored `android/local.properties` file, for example:

```properties
sdk.dir=C\:\\Users\\YOUR_WINDOWS_USER\\AppData\\Local\\Android\\Sdk
```

Set Android Studio's **Gradle JDK** to `C:\Program Files\Java\jdk-21` on this PC before building or running the app. Use the standard JDK rather than the Android Studio embedded JDK or a GraalVM installation.

## API URLs

The frontend automatically uses `/api` in the browser and `http://10.0.2.2:3001/api` in an Android emulator. Set `VITE_API_URL` only when you need to override that default:

| Target | Value |
| --- | --- |
| Browser with Vite | `/api` |
| Android emulator | `http://10.0.2.2:3001/api` |
| Phone on your Wi-Fi | `http://YOUR_PC_IPV4:3001/api` |
| Production | `https://api.example.com/api` |

For a phone on Wi-Fi, replace `YOUR_PC_IPV4` with the IPv4 address from `ipconfig`. Start the backend with `npm run backend:dev`; it listens on your LAN interfaces. Allow Node.js through Windows Firewall on private networks if the phone cannot connect.

`android:usesCleartextTraffic="true"` is enabled only to support local HTTP development. Before distributing the app, deploy the API with HTTPS and remove this attribute plus `cleartext: true` from `capacitor.config.ts`.

## Authentication

Email/password accounts work through the API URL above. Google sign-in uses the native Firebase flow on Android and Google Identity Services in the browser. Keep Firebase's Android configuration file at `android/app/google-services.json`, enable Google in Firebase Authentication, and add the debug SHA-1 fingerprint for local emulator builds. After changing that file, run `npm run android:sync` and rebuild the app.

## Offline behavior

The same IndexedDB cache and sync queue used by the browser run inside Capacitor's Android WebView. Sign in once while connected to cache account workouts, then create, edit, and delete them offline. Start the backend again and use Sync now to upload queued changes.
