# Schedulaa Staff Mobile App (Capacitor)

## Current setup
- App name: `Schedulaa Staff`
- Bundle ID: `com.schedulaa.staff`
- Capacitor web directory: `build`
- Shared app mode routes: `/app`, `/app/employee/*`, `/app/manager/*`

## Build and sync
```bash
npm run build
npx cap sync
```

## Open native projects
```bash
npx cap open android
npx cap open ios
```

## Android Play Store (AAB)
1. Open Android Studio from `npx cap open android`.
2. Set signing config.
3. Build `Release` Android App Bundle (`.aab`).
4. Upload to Play Console.

## iOS App Store
1. Open Xcode from `npx cap open ios`.
2. Set Team, Signing, and provisioning profile.
3. Archive from `Product -> Archive`.
4. Upload through Organizer to App Store Connect.

## App links / universal links
Not implemented yet.

Recommended next step:
1. Configure Associated Domains on iOS and intent filters on Android.
2. Map marketing/app URLs to open `/#/app` or `/app` directly in mobile shell.

## Icons and splash
Capacitor defaults are still in place.

Recommended next step:
1. Add branded icon/splash assets and regenerate native resources before store submission.
