---
title: Android App Release Source Of Truth
description: Source of truth for Schedulaa Android source sync, Android Studio workflow, signed release APK builds, Cloudflare R2 public APK hosting, and demo-page download wiring.
---

# Purpose

This document is the source of truth for the Schedulaa Android app workflow.

It records:

- which repo copy is the real source of truth
- which Windows folder Android Studio must open
- how to sync updated source into the Android Studio copy safely
- how to build debug vs signed release APKs
- how Android release signing is configured
- how the APK is uploaded to Cloudflare R2 public assets
- how the demo page points to the Android APK download
- what failed during rollout and what to avoid next time

This is meant to reduce repeat confusion for future Android updates and to make the later iOS rollout easier.

# Current native plugin dependencies

The Android app now includes native Capacitor plugin dependencies in addition to the web bundle.

Current relevant native plugin:

- `@capacitor/geolocation`

Why this matters:

- adding a new Capacitor plugin is not just a frontend source change
- the Windows repo must have the dependency installed with `npm install`
- the Android project must be refreshed with `npx cap sync android`
- the signed APK must be rebuilt after the sync

If the Windows repo has the updated source but stale `node_modules`, `npm run build` can fail with `Module not found` errors even though the Linux repo is correct.

# Current architecture

There are two frontend copies involved during Android work:

1. Real source repo
   - `/home/uc4u2/work/scheduler2/frontend`
   - this is the main repo Codex edits and commits

2. Windows Android Studio working copy
   - `C:\Users\youse\StudioProjects\schedulaa-frontend`
   - Android Studio reads/builds from here

Important rule:

- Android Studio does not automatically reflect changes made in the Linux repo.
- Source must be synced from folder 1 into folder 2 before Android rebuild/install.

# Android Studio path

Android Studio must be opened on exactly:

`C:\Users\youse\StudioProjects\schedulaa-frontend\android`

If Android Studio is opened on any other `android` folder, the app may package stale source and show old UI.

# Native route source of truth

Current native/mobile routing source of truth:

- manager starts on `/manager/dashboard`
- employee / recruiter starts on `/employee/my-time`
- client starts on `/dashboard`
- `/app/*` is now legacy compatibility only and redirects into current maintained routes

Related files:

- `frontend/src/App.js`
- `frontend/MOBILE_WORKFLOW.md`

# Safe sync from Linux source to Windows Android Studio copy

Use this exact Windows PowerShell flow before Android rebuilds.

## Step 1: stash local Windows-only changes first

```powershell
cd C:\Users\youse\StudioProjects\schedulaa-frontend
git stash push -u -m "before-sync-from-linux-source-2026-04-22"
git stash list
```

## Step 2: copy source from Linux repo into Windows repo

```powershell
cd C:\Users\youse\StudioProjects\schedulaa-frontend
robocopy "\\wsl$\Ubuntu\home\uc4u2\work\scheduler2\frontend" "C:\Users\youse\StudioProjects\schedulaa-frontend" /E /R:2 /W:2 /XD .git node_modules build android\app\build android\.gradle /XF npm-debug.log yarn-error.log
```

If the WSL distro is not `Ubuntu`, check first:

```powershell
wsl -l -q
```

Then replace `Ubuntu` in the path.

## Step 3: verify the new source actually arrived

For the mobile shell fix specifically:

```powershell
cd C:\Users\youse\StudioProjects\schedulaa-frontend
rg -n "MobileLayout|MobileTodayPage|MobileMorePage|LegacyMobileAppRedirect|path=\"/app\"" src/App.js
```

Expected shape:

- `LegacyMobileAppRedirect` exists
- `MobileLayout`, `MobileTodayPage`, `MobileMorePage` are no longer imported/used in `src/App.js`

For the mobile drawer hardening fix specifically:

```powershell
cd C:\Users\youse\StudioProjects\schedulaa-frontend
rg -n "Harden mobile manager drawer surface|backdropFilter|BackdropProps" src\NewManagementDashboard.js
```

# Android debug build workflow

This is for local testing in emulator/device, not public customer download.

From Windows PowerShell:

```powershell
cd C:\Users\youse\StudioProjects\schedulaa-frontend
npm install
npm run build
npx cap sync android

& "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" uninstall com.schedulaa.app
& "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" uninstall com.schedulaa.staff.devfix

cd C:\Users\youse\StudioProjects\schedulaa-frontend\android
.\gradlew.bat :app:installDebug
```

Launch:

```powershell
& "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" shell monkey -p com.schedulaa.app -c android.intent.category.LAUNCHER 1
```

If the installed package is different, replace the package name with the one that resolves on device.

# API target for the Android app

For local Android builds, native runtime can point to live Render backend explicitly.

Local env file:

`C:\Users\youse\StudioProjects\schedulaa-frontend\.env.local`

Relevant values:

```env
REACT_APP_NATIVE_API_URL=https://scheduling-application.onrender.com
REACT_APP_CAPACITOR_API_URL=https://scheduling-application.onrender.com
```

Then rebuild:

```powershell
cd C:\Users\youse\StudioProjects\schedulaa-frontend
npm run build
npx cap sync android
```

This avoids emulator-local networking issues when login or API connectivity matters more than local backend testing.

# Release signing source of truth

## Committed project support

Committed files:

- `frontend/.gitignore`
- `frontend/android/app/build.gradle`

The committed Gradle config now supports local release signing using:

- `android/key.properties`
- `android/upload-keystore.jks`

These are intentionally local-only and ignored by git.

## Local signing files

Current Windows local signing files:

- `C:\Users\youse\StudioProjects\schedulaa-frontend\android\upload-keystore.jks`
- `C:\Users\youse\StudioProjects\schedulaa-frontend\android\key.properties`

These files are required to keep shipping updates signed with the same key.

Critical rule:

- Back up both files outside the repo.
- Losing the keystore breaks future update continuity for installed Android apps.

## Current build.gradle behavior

`android/app/build.gradle` now:

- loads `android/key.properties` if present
- defines `signingConfigs.release`
- applies release signing to `buildTypes.release`
- resolves `storeFile` via `rootProject.file(...)`

That last part matters because the keystore lives at:

- `android/upload-keystore.jks`

not:

- `android/app/upload-keystore.jks`

# Signed release APK build workflow

This must be run from the Windows Android Studio copy because:

- Windows already has the active JDK and Android SDK toolchain
- Android Studio project lives there
- the final signed build path is there

## Build signed release

```powershell
cd C:\Users\youse\StudioProjects\schedulaa-frontend\android
.\gradlew.bat assembleRelease
```

## Signed artifact path

Current signed release artifact path:

`C:\Users\youse\StudioProjects\schedulaa-frontend\android\app\build\outputs\apk\release\app-release.apk`

This is the production-safe direct-download APK path.

## Output metadata file

`C:\Users\youse\StudioProjects\schedulaa-frontend\android\app\build\outputs\apk\release\output-metadata.json`

Current expected output name:

- `app-release.apk`

# Cloudflare R2 public APK hosting

This uses the same public-assets lane as demo videos.

Related backend source of truth:

- `backend/docs/cloudflare-r2.md`

Important rules:

- use public bucket: `schedulaa-public-assets`
- do not use private uploads bucket
- do not use signed/private URLs for this V1
- do not build a heavy backend asset manager for APK hosting

## Public keys

Archived release key:

`assets/apk/releases/schedulaa-staff-2026-04-22.apk`

Latest archived release key:

`assets/apk/releases/schedulaa-staff-2026-04-26-v1.apk`

Stable latest key:

`assets/apk/schedulaa-staff-latest.apk`

## Public URLs

Archived:

`https://pub-6cbed1dd8177417b96763fc4eb930d09.r2.dev/assets/apk/releases/schedulaa-staff-2026-04-22.apk`

Latest archived:

`https://pub-6cbed1dd8177417b96763fc4eb930d09.r2.dev/assets/apk/releases/schedulaa-staff-2026-04-26-v1.apk`

Stable:

`https://pub-6cbed1dd8177417b96763fc4eb930d09.r2.dev/assets/apk/schedulaa-staff-latest.apk`

## Required R2 APK metadata

If this metadata is missing, Android browsers may download the file as `.apk.zip` or try to extract it instead of installing it.

Required headers:

- `Content-Type: application/vnd.android.package-archive`
- `Content-Disposition: attachment; filename=schedulaa-staff-latest.apk`

For archived builds, set `Content-Disposition` to the archived APK filename.

## Current reliable upload pattern

The signed APK upload path had two separate failure modes:

- `aws.exe` / AWS CLI multipart uploads to R2 could fail mid-transfer with TLS EOF errors
- reusing the stable `schedulaa-staff-latest.apk` URL could make Android/browser caching confusing during verification

The final reliable solution was:

- keep building the signed release APK on Windows
- upload the APK bytes to `schedulaa-public-assets` with a direct multipart client that retries individual parts
- write the archived release key first
- then bucket-side copy that archived object to `assets/apk/schedulaa-staff-latest.apk`
- verify both public URLs and APK headers after upload

Important operational rule:

- validate a new Android release from the archived versioned URL first
- use the stable `latest` URL only after the archived build is confirmed downloadable/installable
- the public `latest` URL is still correct for the landing/demo page

## April 26, 2026 v1 release

This is the current validated Android direct-download release.

Why it mattered:

- it includes the later employee mobile updates such as the My Shift drawer changes
- the archived and stable public APK objects were revalidated after repeated CLI transport failures

Release details:

- archived key:
  - `assets/apk/releases/schedulaa-staff-2026-04-26-v1.apk`
- archived public URL:
  - `https://pub-6cbed1dd8177417b96763fc4eb930d09.r2.dev/assets/apk/releases/schedulaa-staff-2026-04-26-v1.apk`
- stable key refreshed:
  - `assets/apk/schedulaa-staff-latest.apk`
- stable public URL:
  - `https://pub-6cbed1dd8177417b96763fc4eb930d09.r2.dev/assets/apk/schedulaa-staff-latest.apk`
- verified signed artifact:
  - `versionCode: 10000`
  - `versionName: 1.0.0`
- verified APK SHA256:
  - `91538499c34a26196edcc4ceaec0ccfae3ed90bd5d5303ccbf86146631835332`

Final working upload pattern used:

1. rebuild signed release APK on Windows
2. upload archived build to `schedulaa-public-assets` with a direct multipart uploader that retries per part
3. refresh stable latest with bucket-side `copy-object`
4. verify public headers return:
   - `Content-Type: application/vnd.android.package-archive`
   - `Content-Disposition: attachment; filename=...apk`
5. verify the public archived object hash matches the local signed APK

# Demo page / frontend download wiring

Related docs:

- `frontend/docs/demo-page.md`

Current implementation file:

- `frontend/src/landing/pages/DemoPage.js`

Current env/config support:

```env
REACT_APP_ANDROID_APK_URL=https://pub-6cbed1dd8177417b96763fc4eb930d09.r2.dev/assets/apk/schedulaa-staff-latest.apk
```

Current fallback behavior in code:

- fallback points to the stable latest APK URL
- demo page contains:
  - hero CTA button
  - Android install card

Current best practice:

- keep production pointed to the stable latest URL
- keep archived versioned URL for rollback/reference only

# End-to-end release flow

Use this exact order for future Android releases.

## 1. Sync source into the Windows Android Studio copy

Recommended script:

- `frontend/scripts/sync-frontend-from-wsl.ps1`

```powershell
powershell -ExecutionPolicy Bypass -File "\\wsl$\Ubuntu\home\uc4u2\work\scheduler2\frontend\scripts\sync-frontend-from-wsl.ps1" -RunBuild -RunCapSync
```

## 2. Verify the expected source arrived

```powershell
cd C:\Users\youse\StudioProjects\schedulaa-frontend
git branch --show-current
rg -n "MobileLayout|MobileTodayPage|MobileMorePage|LegacyMobileAppRedirect|path=\"/app\"" src/App.js
```

## 3. Build the web assets and sync Capacitor

If you used `sync-frontend-from-wsl.ps1 -RunBuild -RunCapSync`, this step is already handled.

Important exception:

- if the Linux repo added a new npm / Capacitor dependency, run `npm install` in the Windows repo first
- the sync script intentionally does not copy `node_modules`

```powershell
cd C:\Users\youse\StudioProjects\schedulaa-frontend
npm install
```

## 4. Build signed release APK

```powershell
cd C:\Users\youse\StudioProjects\schedulaa-frontend\android
.\gradlew.bat assembleRelease
```

## 5. Verify signed artifact exists

```powershell
Get-ChildItem C:\Users\youse\StudioProjects\schedulaa-frontend\android\app\build\outputs\apk\release
Get-Content C:\Users\youse\StudioProjects\schedulaa-frontend\android\app\build\outputs\apk\release\output-metadata.json
```

## 6. Upload signed release APK to R2

Preferred operational method:

- build the signed `app-release.apk` on Windows
- upload the archived key first
- refresh the stable latest key second
- ensure APK metadata is set:
  - `Content-Type: application/vnd.android.package-archive`
  - `Content-Disposition: attachment; filename=...apk`

Current fallback rule:

- if AWS CLI multipart upload to R2 fails mid-transfer with SSL EOF errors, use a direct multipart uploader with per-part retries instead of restarting the whole release flow
- do not assume a successful local rebuild means the stable public URL is refreshed

Recommended script:

- `frontend/scripts/release-android-apk-to-r2.ps1`

What this script does:

- does not build the APK
- only uploads the existing signed `app-release.apk`
- uses `s3api put-object` and `copy-object`
- sets APK metadata to avoid `.apk.zip` downloads
- verifies public URLs unless `-SkipVerify` is passed
- does not hardcode secrets

Windows repo usage:

```powershell
cd C:\Users\youse\StudioProjects\schedulaa-frontend
powershell -ExecutionPolicy Bypass -File .\scripts\release-android-apk-to-r2.ps1 -ReleaseKeySuffix YYYY-MM-DD-v1
```

If you are already inside the Android folder:

```powershell
powershell -ExecutionPolicy Bypass -File ..\scripts\release-android-apk-to-r2.ps1 -ReleaseKeySuffix YYYY-MM-DD-v1
```

One-time Windows AWS profile setup:

```powershell
aws configure set aws_access_key_id <PUBLIC_ASSETS_ACCESS_KEY_ID> --profile r2-public
aws configure set aws_secret_access_key <PUBLIC_ASSETS_SECRET_ACCESS_KEY> --profile r2-public
aws configure set region auto --profile r2-public
aws configure set output json --profile r2-public
```

After that one-time setup, the release script defaults to `r2-public`, so future uploads do not need repeated authentication flags.

## 7. Verify both public URLs

```powershell
curl.exe -I "https://pub-6cbed1dd8177417b96763fc4eb930d09.r2.dev/assets/apk/releases/schedulaa-staff-YYYY-MM-DD.apk"
curl.exe -I "https://pub-6cbed1dd8177417b96763fc4eb930d09.r2.dev/assets/apk/schedulaa-staff-latest.apk"
```

Both must return:

- `HTTP/1.1 200 OK`
- `Content-Type: application/vnd.android.package-archive`

And the latest key should return:

- `Content-Disposition: attachment; filename=schedulaa-staff-latest.apk`

## 8. Validate from the archived URL first

For real-device validation:

- first download and install from the archived versioned URL
- only use `schedulaa-staff-latest.apk` after the archived file is confirmed

Why:

- Android browsers and download managers can cache `schedulaa-staff-latest.apk`
- a fresh archived filename avoids false negatives when checking whether the new build is live

## 9. Verify demo page env/fallback still points to stable

Use:

- `REACT_APP_ANDROID_APK_URL`

or keep the code fallback on the stable latest URL.

## 10. Deploy frontend

Deploy the frontend commit that contains the latest demo page / APK CTA state.

# Known challenges and lessons learned

## 1. Two-folder confusion is real

Problem:

- Linux repo was current
- Windows Android Studio repo was stale
- Android kept showing old UI

Lesson:

- always sync folder 1 into folder 2 before Android rebuilds

## 2. Android Studio path matters

Problem:

- if Android Studio opens a different `android` folder, the wrong source gets packaged

Lesson:

- Android Studio must open exactly:
  - `C:\Users\youse\StudioProjects\schedulaa-frontend\android`

## 3. Unsigned release APK is not good enough

Problem:

- `app-release-unsigned.apk` existed
- it was not production-safe for customer download

Lesson:

- always use signed `app-release.apk`

## 4. Linux-to-R2 large APK uploads were unstable

Problem:

- multipart upload init failures
- SSL EOF issues
- intermittent endpoint connection failures
- repeated EOF failures on both Linux and Windows multipart paths for large APK uploads

Lesson:

- for large signed APK uploads, use Windows `aws.exe` if needed
- if `s3 cp` keeps failing, switch to:
  - `s3api put-object`
  - then `s3api copy-object`

## 5. APK metadata matters for Android installs

Problem:

- R2 object was valid but served as generic zip
- Android downloaded `.apk.zip`
- user had to rename the file manually before install

Lesson:

- always verify the public APK headers after upload
- set:
  - `Content-Type: application/vnd.android.package-archive`
  - `Content-Disposition: attachment; filename=...apk`

## 6. Never lose the keystore

Problem:

- release continuity depends on the same signing key

Lesson:

- back up:
  - `android/upload-keystore.jks`
  - `android/key.properties`

## 7. Native punch-location support needs plugin + manifest + rebuild

Problem:

- Android punch-location capture was reporting `denied` without ever prompting the user
- the app was using web geolocation only
- the Android manifest did not declare location permissions

Lesson:

- Android punch-location capture now depends on all of the following:
  - `@capacitor/geolocation`
  - `android.permission.ACCESS_COARSE_LOCATION`
  - `android.permission.ACCESS_FINE_LOCATION`
  - `npx cap sync android`
  - rebuilt signed APK

- punch-location behavior on Android is now:
  - permission is requested during punch capture when mode is `optional`
  - if denied once, the app can request again on a later punch
  - if permanently denied by Android system choice, the user must re-enable it in app settings
  - punching still never blocks

# Current known-good state

Source repo commit with signed Android delivery support:

- `4188f11fe` `Add signed Android release delivery`

Current stable APK URL:

- `https://pub-6cbed1dd8177417b96763fc4eb930d09.r2.dev/assets/apk/schedulaa-staff-latest.apk`

Current archived APK URL:

- `https://pub-6cbed1dd8177417b96763fc4eb930d09.r2.dev/assets/apk/releases/schedulaa-staff-2026-04-22.apk`

Current latest archived APK URL:

- `https://pub-6cbed1dd8177417b96763fc4eb930d09.r2.dev/assets/apk/releases/schedulaa-staff-2026-04-24-v2.apk`

Current latest archived APK URL after native geolocation release:

- `https://pub-6cbed1dd8177417b96763fc4eb930d09.r2.dev/assets/apk/releases/schedulaa-staff-2026-04-25-v6.apk`

Current signed artifact path:

- `C:\Users\youse\StudioProjects\schedulaa-frontend\android\app\build\outputs\apk\release\app-release.apk`

# iOS future notes

When iOS rollout starts, keep the same structure:

- one source-of-truth repo
- one Mac/Xcode working copy if separate
- documented sync path if multiple copies exist
- local-only signing material ignored by git
- versioned archived artifact plus stable latest artifact
- public download/testflight/App Store path documented separately

Create a dedicated iOS source-of-truth document when that work begins.

Do not mix iOS signing assumptions into this Android document.
