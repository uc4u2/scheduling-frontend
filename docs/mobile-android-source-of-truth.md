# Schedulaa Android App Runbook (Source of Truth)

## 1) Scope and architecture

This document is the operational source of truth for the Android app work based on Capacitor.

- Frontend repo: `/home/uc4u2/work/scheduler2/frontend`
- Backend repo: `/home/uc4u2/work/scheduler2/backend`
- Marketing repo: `/home/uc4u2/work/scheduler2/schedulaa-marketing-techwind`
- Active mobile branch (frontend): `mobile/2026-02-23-android-init`
- Windows Android Studio working copy:
  - `C:\Users\youse\StudioProjects\schedulaa-frontend`

App model:
- Android app is a Capacitor WebView shell using frontend build assets.
- Native runtime is detected in FE and used to force mobile app behavior.
- Desktop web behavior must remain unchanged.

## 2) What was installed / initialized

In frontend repo:
- Capacitor Android bootstrap (android project under `frontend/android/`)
- Mobile runtime helpers (`src/utils/runtime.js`)
- Mobile shell components (layout/drawer/quick actions/tabs)
- Native splash and launcher icon assets under `android/app/src/main/res/*`

Typical dependency/tools used:
- Node + npm
- `react-scripts`
- Capacitor CLI (`npx cap ...`)
- Android SDK + `adb`

## 3) Key frontend files touched for mobile mode

Core runtime/routing:
- `src/utils/runtime.js`
- `src/App.js`
- `src/Login.js`

Mobile shell/UI:
- `src/components/mobile/MobileLayout.jsx`
- `src/components/mobile/MobileDrawer.jsx`
- `src/components/mobile/MobileQuickActions.jsx`
- `src/components/mobile/MobileTodayPage.jsx`

Manager/employee mobile behavior pages:
- `src/NewManagementDashboard.js`
- `src/pages/sections/Team.js`
- `src/pages/sections/TimeEntriesPanel.js`
- `src/pages/sections/AllEmployeeSlotsCalendar.js`
- `src/pages/sections/management/SecondNewManagementDashboard.js`
- `src/pages/recruiter/RecruiterMyTimePage.jsx`
- `src/pages/recruiter/RecruiterMyShiftsPage.jsx`
- `src/components/recruiter/RecruiterTabs.jsx`
- `src/MySetmoreCalendar.js`

Android native assets/config:
- `android/app/src/main/AndroidManifest.xml`
- `android/app/src/main/res/values/styles.xml`
- `android/app/src/main/res/drawable/launch_splash.xml`
- `android/app/src/main/res/mipmap-*/ic_launcher*.png`
- `android/app/src/main/res/drawable*/splash.png`
- `assets/icon.png`
- `assets/icon-foreground.png`
- `assets/icon-background.png`

## 4) Backend/marketing touchpoints relevant to mobile work

Backend (`scheduling-application`) updates used in this phase:
- Industry directory link fields exposed (public URL/domain use-cases)
- No backend business logic refactor for mobile shell itself

Marketing (`schedulaa-marketing-techwind`) updates used in this phase:
- Industries page link behavior and UI fixes
- Landing hero/layout spacing fixes

## 5) Golden daily workflow (do this in order)

### A) Develop in WSL source repo

```bash
cd /home/uc4u2/work/scheduler2/frontend
git checkout mobile/2026-02-23-android-init
git pull origin mobile/2026-02-23-android-init
```

### B) Sync changed files to Windows Android Studio copy

Preferred (targeted copy, fastest):

```bash
SRC=/home/uc4u2/work/scheduler2/frontend
WIN=/mnt/c/Users/youse/StudioProjects/schedulaa-frontend

# example targeted copy
cp "$SRC/src/pages/sections/AllEmployeeSlotsCalendar.js" \
   "$WIN/src/pages/sections/AllEmployeeSlotsCalendar.js"
```

Fallback (full sync, slower):

```bash
SRC=/home/uc4u2/work/scheduler2/frontend
WIN=/mnt/c/Users/youse/StudioProjects/schedulaa-frontend

rsync -a --delete \
  --exclude .git \
  --exclude node_modules \
  --exclude build \
  --exclude android/app/build \
  "$SRC/" "$WIN/"
```

### C) Build + sync Capacitor on Windows

```powershell
cd C:\Users\youse\StudioProjects\schedulaa-frontend

# avoid lint-gate issues from unrelated files
$env:DISABLE_ESLINT_PLUGIN="true"

npx react-scripts build
npx cap sync android
```

### D) Reinstall clean app on device/emulator

```powershell
adb uninstall com.schedulaa.app
```

If app still cached/stale, also clear data (only if installed):

```powershell
adb shell pm clear com.schedulaa.app
```

Then run from Android Studio.

## 6) Source-of-truth checks before testing

On Windows copy:

```powershell
cd C:\Users\youse\StudioProjects\schedulaa-frontend
git rev-parse --abbrev-ref HEAD
git log -1 --oneline
```

Expect:
- correct branch: `mobile/2026-02-23-android-init`
- latest expected commit hash/message

Also verify key code markers exist:

```powershell
Select-String -Path src\App.js -Pattern "nativeRootRedirect|showAppChrome = !isEmbed && !nativeRuntime"
Select-String -Path src\utils\runtime.js -Pattern "Capacitor|getPlatform|isNativePlatform"
```

## 7) Git workflow (frontend mobile branch)

From WSL frontend repo:

```bash
cd /home/uc4u2/work/scheduler2/frontend
git status
git add -A
git commit -m "feat(mobile): <short description>"
git push origin mobile/2026-02-23-android-init
```

## 8) Backend + frontend deploy workflow (Render)

Backend:

```bash
cd /home/uc4u2/work/scheduler2/backend
git pull --rebase origin main
git status
git add <files>
git commit -m "feat: <message>"
git push origin main
render deploys create srv-cvcvgb3v2p9s73ca8dg0 --confirm
```

Frontend web app (not Android shell):

```bash
cd /home/uc4u2/work/scheduler2/frontend
git status
git add <files>
git commit -m "feat: <message>"
git push origin main
render deploys create srv-cvev5et2ng1s73d03bk0 --confirm
```

Marketing:

```bash
cd /home/uc4u2/work/scheduler2/schedulaa-marketing-techwind
git status
git add -A
git commit -m "fix(marketing): <message>"
git push origin main
```

## 9) Common issues and exact fixes

1. `adb: command not found` (Windows)
- Set SDK path in PowerShell:

```powershell
$env:ANDROID_SDK_ROOT="$env:LOCALAPPDATA\Android\Sdk"
$env:Path += ";$env:ANDROID_SDK_ROOT\platform-tools"
adb devices
```

2. `cross-env is not recognized`
- Use direct build command instead of `npm run build`:

```powershell
npx react-scripts build
```

3. Android shows old UI after changes
- Cause: wrong folder, stale build, or no reinstall.
- Fix: ensure Windows copy has latest files, run build+sync, uninstall app, run again.

4. WSL `Select-String` errors
- `Select-String` is PowerShell only.
- In WSL use `rg`/`grep` instead.

5. `adb shell pm clear` returns `Failed`
- Usually app already uninstalled; install/run app first, then clear if needed.

6. WebView `simple_file_enumerator` cache warnings
- Common emulator/WebView cache noise; not usually fatal by itself.

## 10) Mobile behavior standards (must keep)

- Native runtime must never show marketing pages.
- Desktop behavior must not be changed by mobile-only patches.
- Stripe/upgrade/payment actions are web-only in mobile compliance mode.
- Manager and employee quick actions should remain role-appropriate.
- Mobile calendar defaults:
  - manager slot/checkout/shift mobile -> day-first UX
  - employee mobile calendar uses compact strip + day chips

## 11) Recommended release checklist

Before handing a mobile build:

1. Verify branch + commit hash.
2. Build FE in Windows copy.
3. `npx cap sync android`.
4. Fresh uninstall/reinstall app.
5. Smoke test routes:
   - login redirect
   - manager quick actions
   - employee quick actions
   - drawer workspace switch
6. Confirm no marketing splash inside authenticated native flow.
7. Confirm Stripe/upgrade blocked in native compliance mode.

## 12) Project folder map

- WSL source of truth (dev):
  - `/home/uc4u2/work/scheduler2/frontend`
- Windows Android Studio project:
  - `C:\Users\youse\StudioProjects\schedulaa-frontend`
- Capacitor Android native project inside frontend:
  - `frontend/android/`

Important: Android Studio runs what exists in the Windows path, not automatically the WSL repo.
Always sync WSL changes into Windows path before building Android.
