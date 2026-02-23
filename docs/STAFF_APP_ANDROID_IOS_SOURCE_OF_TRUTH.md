# Schedulaa Mobile App Source Of Truth (Android First, iOS Next)

Updated: 2026-02-22

## 1) Goal

Ship one mobile app (`Schedulaa`) for both employee + manager workflows by:

1. Reusing the existing React frontend with an app-mode shell (`/app` routes).
2. Wrapping the built web app with Capacitor for Android and iOS.

No push notifications required for v1.

## 2) Repo + Working Location

Canonical repo for this work:

- `~/work/scheduler2/frontend`
- Remote: `git@github.com:uc4u2/scheduling-frontend.git`

Do not run mobile-app git commands from marketing repo.

## 3) Branching / Safety Checkpoints

Primary working branch:

- `mobile/staff-app-mode`

Checkpoint tag:

- `checkpoint-android-v0`

Meaning:

1. You can always return to checkpoint state with git checkout/cherry-pick/revert workflows.
2. Branch + tag are already pushed to origin.

## 4) What Has Been Implemented So Far

### A) React app-mode shell

Implemented route namespace:

- `/app`
- `/app/employee/*`
- `/app/manager/*`

Key files:

- `src/App.js`
- `src/NavBar.js`
- `src/mobile/AppRoleGate.jsx`
- `src/mobile/StaffAppShell.jsx`
- `src/mobile/BottomTabs.jsx`
- `src/mobile/MoreDrawer.jsx`
- `src/mobile/navConfig.js`
- `src/mobile/pages/EmployeeTodayPage.jsx`
- `src/mobile/pages/ManagerTodayPage.jsx`
- `src/mobile/pages/MobileSubtabListPage.jsx`
- `src/mobile/pages/ManagerEmployeesListPage.jsx`
- `src/mobile/pages/ManagerServicesListPage.jsx`
- `src/mobile/pages/ManagerBookingsListPage.jsx`
- `src/mobile/pages/EmployeeCalendarPage.jsx`
- `src/mobile/pages/EmployeeBookingsListPage.jsx`

### B) Android-first tab mapping fixes

Employee app tabs:

1. `calendar` -> employee calendar page
2. `shifts` -> My Time (clock in/out)
3. `bookings` -> employee bookings list

Manager app tabs:

1. `calendar` -> team calendar view
2. `shifts` -> shifts & availability entry
3. `services-bookings` -> subtab list linking to existing manager pages

### C) Native runtime behavior

Native-only app entry redirect implemented:

- If running inside Capacitor native runtime, app root redirects to `/app`.
- Browser/web behavior remains normal.

### D) Capacitor scaffolding

Installed + initialized:

- `@capacitor/core`
- `@capacitor/cli`
- `@capacitor/android`
- `@capacitor/ios`

Created:

- `capacitor.config.ts`
- `android/`
- `ios/`

### E) Branding updates started

Updated:

- `public/manifest.json` (`name`/`short_name` => `Schedulaa`, `start_url` => `/app`)
- `android/app/src/main/res/values/strings.xml` app name => `Schedulaa`

## 5) Build + Sync Commands (Source Of Truth)

Always run from:

- `cd ~/work/scheduler2/frontend`

Then:

```bash
npm run build
npx cap sync
```

## 6) Android Studio Workflow (Current Phase)

Project location to open in Android Studio:

- `~/work/scheduler2/frontend/android`

Run flow:

1. Wait for Gradle sync.
2. Create run config (`app`, default activity) if needed.
3. Create emulator (`Tools` -> `Device Manager` -> `Create device`).
4. Press Run.

If web code changed:

1. In terminal run `npm run build && npx cap sync`.
2. Return to Android Studio and Run again.

## 7) Signed AAB Flow (Play Console)

In Android Studio:

1. `Build` -> `Generate Signed Bundle / APK...`
2. Select `Android App Bundle`
3. Choose/create keystore + key alias
4. Build variant: `release`
5. Generate `.aab`
6. Upload to Play Console (`Internal testing` first)

Current Android version fields:

- `android/app/build.gradle`
- `versionCode 1`
- `versionName "1.0.0"`

Rule:

1. Increase `versionCode` for every new upload.
2. Keep `versionName` human-readable release version.

## 8) Icon + Splash Asset Plan

Capacitor asset source files expected:

- `resources/icon.png` (1024x1024)
- `resources/splash.png` (2732x2732)

Generation commands:

```bash
npm i -D @capacitor/assets
npx capacitor-assets generate --android
npx cap sync
```

Note:

1. In restricted network environments, npm install can fail.
2. Re-run on network-enabled machine.

## 9) Git Push Workflow (Canonical)

From `~/work/scheduler2/frontend`:

```bash
git status
git add <files>
git commit -m "<message>"
git push
```

For new branch:

```bash
git push -u origin <branch-name>
```

For tags:

```bash
git push origin <tag-name>
```

## 10) Revert / Recovery Workflow

To inspect checkpoint:

```bash
git show checkpoint-android-v0 --stat
```

To create recovery branch from checkpoint:

```bash
git checkout -b recovery/from-checkpoint checkpoint-android-v0
```

To reset current branch hard to checkpoint (destructive; only if intentional):

```bash
git checkout mobile/staff-app-mode
git reset --hard checkpoint-android-v0
```

## 11) Next Milestones

1. Finish Android icon/splash generation with final brand assets.
2. Validate login + manager/employee app routes on emulator.
3. Produce and upload first internal-test AAB.
4. After Android stabilization, apply same Capacitor flow for iOS archive + TestFlight.

## 12) Daily Operator Checklist

Run this in order for every Android iteration:

1. `cd ~/work/scheduler2/frontend`
2. `git checkout mobile/staff-app-mode`
3. `git pull`
4. Make code/content changes.
5. `npm run build`
6. `npx cap sync`
7. Open Android Studio project at `frontend/android` and run emulator test.
8. If release candidate: generate signed AAB (`Build` -> `Generate Signed Bundle / APK...`).
9. `git add -A && git commit -m "<clear message>" && git push`
10. Update this doc if workflow, paths, versions, or release rules changed.
