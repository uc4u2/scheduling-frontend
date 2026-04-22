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

Stable latest key:

`assets/apk/schedulaa-staff-latest.apk`

## Public URLs

Archived:

`https://pub-6cbed1dd8177417b96763fc4eb930d09.r2.dev/assets/apk/releases/schedulaa-staff-2026-04-22.apk`

Stable:

`https://pub-6cbed1dd8177417b96763fc4eb930d09.r2.dev/assets/apk/schedulaa-staff-latest.apk`

## Why Windows upload was used for the final signed release

The Linux/WSL path to the R2 S3 endpoint was unstable for large APK uploads.

Failures seen:

- multipart `?uploads` endpoint failures
- SSL EOF / endpoint connection failures
- bucket-internal copy attempts failing intermittently

The reliable solution was:

- use Windows `aws.exe`
- upload the signed release APK from the Windows repo directly

This avoided the unstable Linux-to-R2 path.

## Windows upload pattern

The final working pattern used:

- signed artifact from:
  - `C:\Users\youse\StudioProjects\schedulaa-frontend\android\app\build\outputs\apk\release\app-release.apk`
- credentials sourced from the backend `.env` source of truth
- upload executed with Windows `aws.exe`

The important operational rule is:

- for large signed APK uploads, prefer Windows `aws.exe` if Linux/WSL R2 uploads start failing

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

```powershell
cd C:\Users\youse\StudioProjects\schedulaa-frontend
git stash push -u -m "before-sync-from-linux-source-YYYY-MM-DD"
robocopy "\\wsl$\Ubuntu\home\uc4u2\work\scheduler2\frontend" "C:\Users\youse\StudioProjects\schedulaa-frontend" /E /R:2 /W:2 /XD .git node_modules build android\app\build android\.gradle /XF npm-debug.log yarn-error.log
```

## 2. Verify the expected source arrived

```powershell
cd C:\Users\youse\StudioProjects\schedulaa-frontend
git branch --show-current
rg -n "MobileLayout|MobileTodayPage|MobileMorePage|LegacyMobileAppRedirect|path=\"/app\"" src/App.js
```

## 3. Build the web assets and sync Capacitor

```powershell
cd C:\Users\youse\StudioProjects\schedulaa-frontend
npm install
npm run build
npx cap sync android
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

- use Windows `aws.exe`
- upload the signed `app-release.apk`
- write both the archived key and the stable latest key

## 7. Verify both public URLs

```powershell
curl.exe -I "https://pub-6cbed1dd8177417b96763fc4eb930d09.r2.dev/assets/apk/releases/schedulaa-staff-YYYY-MM-DD.apk"
curl.exe -I "https://pub-6cbed1dd8177417b96763fc4eb930d09.r2.dev/assets/apk/schedulaa-staff-latest.apk"
```

Both must return:

- `HTTP/1.1 200 OK`

## 8. Verify demo page env/fallback still points to stable

Use:

- `REACT_APP_ANDROID_APK_URL`

or keep the code fallback on the stable latest URL.

## 9. Deploy frontend

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

Lesson:

- for large signed APK uploads, use Windows `aws.exe` if needed

## 5. Never lose the keystore

Problem:

- release continuity depends on the same signing key

Lesson:

- back up:
  - `android/upload-keystore.jks`
  - `android/key.properties`

# Current known-good state

Source repo commit with signed Android delivery support:

- `4188f11fe` `Add signed Android release delivery`

Current stable APK URL:

- `https://pub-6cbed1dd8177417b96763fc4eb930d09.r2.dev/assets/apk/schedulaa-staff-latest.apk`

Current archived APK URL:

- `https://pub-6cbed1dd8177417b96763fc4eb930d09.r2.dev/assets/apk/releases/schedulaa-staff-2026-04-22.apk`

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
