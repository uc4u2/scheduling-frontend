---
title: iOS App Release Source Of Truth
description: Source of truth for Schedulaa iOS production planning, current mobile readiness, Apple distribution constraints, and the future TestFlight/App Store implementation path.
---

# Purpose

This document preserves the current iOS investigation so the team can resume implementation later without losing context.

This is a documentation-only checkpoint.

Important current rule:

- do not install `@capacitor/ios` yet
- do not run `npx cap add ios` yet
- do not generate `frontend/ios` yet
- do not add Apple signing files, credentials, or secrets to the repo

# Current repo state

Current verified state:

- `frontend/capacitor.config.ts` exists
- current Capacitor config values are:
  - `appId: com.schedulaa.app`
  - `appName: Schedulaa`
  - `webDir: build`
- Android Capacitor support exists today
- iOS Capacitor support does not exist yet
- `@capacitor/ios` is not installed
- `frontend/ios` is currently missing

Current native-related dependencies in `frontend/package.json`:

- `@capacitor/android`
- `@capacitor/core`
- `@capacitor/geolocation`

Missing native dependency for future iOS work:

- `@capacitor/ios`

# Why iOS matters for Schedulaa

iOS is required for a serious employee clock-in/out mobile experience.

Business reason:

- employees need reliable app-like access from iPhone
- employee clock-in/out is a real field workflow, not a marketing demo workflow
- the website alone is not enough after advertising and mobile adoption start growing
- employees need stable mobile login, dashboard access, native permission handling, and consistent punch flows

Practical product reason:

- employee clock-in/out should feel like an app workflow, not a fragile browser workaround
- iPhone users expect permission prompts, camera/photo selection, and mobile persistence to behave natively
- the launch path should be production-grade:
  - TestFlight first
  - App Store second

# What can be reused from Android

The iOS effort does not start from zero.

Reusable pieces already exist:

- the existing React frontend app
- the current Capacitor config pattern
- the current production backend API base URL logic for native runtime
- the current login flow
- the employee landing route:
  - `/employee/my-time`
- the employee mobile workspace component:
  - `SecondEmployeeShiftView`
- existing clock-in/out endpoints
- the optional location evidence model
- current file/photo upload flows
- the Android release source-of-truth style and release discipline

Important reuse conclusion:

- the main missing work for iOS is native packaging, Xcode, signing, Apple distribution, and QA
- the business workflow itself already exists in the web app and Android-capable frontend

# iOS distribution reality

Android and iOS distribution are different.

Android direct-download path:

- Android APK can be hosted on Cloudflare R2
- Android can be distributed from a public direct-download URL

iOS reality:

- iOS does not have a public R2/direct-download equivalent for normal production users
- iOS app distribution must follow Apple’s path

Correct iOS release path:

- Capacitor iOS project
- Xcode build/signing
- TestFlight
- App Store

Important rule:

- do not try to model iOS release flow after the Android APK/R2 flow
- Android and iOS distribution must stay documented separately

# Technical readiness found in investigation

Current investigation conclusions:

- backend is not a blocker for iOS employee clock-in/out
- native API configuration already supports the production backend
- employee login route is already native-aware
- employee clock-in/out APIs already exist
- location evidence already uses `@capacitor/geolocation`
- current photo upload uses web file input and is acceptable for V1 iOS

## Native API base behavior

Current native runtime API logic already supports production backend access.

Relevant file:

- `frontend/src/utils/api.js`

Current behavior:

- native runtime uses:
  - `REACT_APP_CAPACITOR_API_URL`
  - or `REACT_APP_NATIVE_API_URL`
- fallback points to:
  - `https://scheduling-application.onrender.com`

This is good for iOS because it means the app can target the production backend without requiring a special backend rewrite.

## Login flow readiness

Relevant file:

- `frontend/src/Login.js`

Current behavior:

- employee and recruiter mobile/native login paths already route to:
  - `/employee/my-time`

This means iOS does not need a new post-login routing model for employee time tracking.

## Employee dashboard readiness

Relevant files:

- `frontend/src/pages/recruiter/RecruiterMyTimePage.jsx`
- `frontend/src/pages/sections/SecondEmployeeShiftView.js`

Current mobile employee workflow already includes:

- employee dashboard access
- time summary
- clock in
- clock out
- break start/end
- leave
- shift history
- field photo upload
- manager-facing related mobile behavior already separated elsewhere

## Clock-in/out readiness

Relevant file:

- `frontend/src/utils/api.js`

Existing employee time APIs:

- `POST /employee/shifts/:id/clock-in`
- `POST /employee/shifts/:id/clock-out`
- `POST /employee/shifts/:id/break-start`
- `POST /employee/shifts/:id/break-end`

Conclusion:

- the core employee time-tracking workflow already exists
- iOS should reuse the same backend routes and the same source of truth

## Optional location evidence readiness

Relevant file:

- `frontend/src/pages/sections/SecondEmployeeShiftView.js`

Current behavior:

- location evidence is only attempted when time-tracking policy enables optional punch location mode
- native runtime uses `@capacitor/geolocation`
- if permission is denied or location is unavailable, punch still succeeds

This is already a production-friendly model for iPhone:

- location can be requested
- location does not hard-block clock-in/out if unavailable
- the policy remains backend-driven

## Photo upload readiness

Relevant file:

- `frontend/src/pages/sections/SecondEmployeeShiftView.js`

Current behavior:

- photo upload currently uses a standard web file input
- accepted types are image uploads such as JPG, PNG, and WebP
- this is acceptable for V1 iOS because WKWebView can hand off to the iPhone file/photo picker

Conclusion:

- iOS does not require an immediate native camera plugin to support the first production pass
- photo/file selection can work with the current web input model first

# Missing pieces

These are the major missing pieces before iOS becomes a real production app:

- `@capacitor/ios`
- `frontend/ios` Xcode project
- Xcode signing setup
- iOS `Info.plist` permission strings
- Mac/Xcode build workflow
- Apple Developer account setup
- App Store Connect app setup
- TestFlight release pipeline
- D-U-N-S-backed Organization account for the serious production path

# Required future iOS permissions

Documented here only. Do not implement yet.

## Location

`NSLocationWhenInUseUsageDescription`

Recommended value:

`Schedulaa uses your location during clock in and clock out to record optional attendance evidence when your employer enables it.`

## Camera

`NSCameraUsageDescription`

Recommended value:

`Schedulaa can use the camera when you choose to capture shift or work photos.`

## Photo library

`NSPhotoLibraryUsageDescription`

Recommended value:

`Schedulaa can access your photo library when you choose photos to upload for shifts or work records.`

## Notifications

Do not add notification permission yet.

Current rule:

- no iOS notification permission should be added unless push notifications are actually implemented later

# Recommended future implementation phases

## Phase 1: Safe repo preparation

Goal:

- make iOS support exist safely in the repo without touching Apple signing yet

Planned steps:

- `npm install @capacitor/ios`
- `npx cap add ios`
- generate `frontend/ios`
- update `.gitignore` if needed

## Phase 2: Mac/Xcode buildability

Goal:

- make sure the iOS app opens and boots in Xcode/simulator

Planned Mac commands:

```bash
npm install
npm run build
npx cap sync ios
npx cap open ios
```

Planned validation:

- confirm app boots in iOS simulator
- confirm login page loads
- confirm native runtime points to the intended backend

## Phase 3: Permission strings

Goal:

- add only the real iOS permissions required by actual current app behavior

Planned rule:

- add location, camera, and photo-library strings only
- do not add extra permissions “just in case”

## Phase 4: Real iPhone QA

Goal:

- validate the real employee workflow on physical iPhones

Required QA items:

- employee login
- employee lands on `/employee/my-time`
- clock in
- clock out
- location permission allowed
- location permission denied
- break start/end
- photo upload
- logout/login persistence

## Phase 5: Apple release prep

Goal:

- prepare the business and distribution infrastructure

Required work:

- Apple Developer Organization enrollment
- D-U-N-S
- App Store Connect app record
- TestFlight build setup
- screenshots/assets
- privacy metadata

## Phase 6: TestFlight first

Goal:

- release first to internal testers and validate real device behavior before App Store submission

## Phase 7: App Store release

Goal:

- production iOS release after TestFlight validation is stable

# Recommended deployment target

Recommended future deployment target:

- iOS 15.0+

Why:

- modern enough for a serious production support baseline
- broad practical iPhone coverage
- avoids carrying very old iOS edge cases unless business specifically requires them
- better fit for a stable employee clock-in/out product than trying to support very old devices too early

# What not to commit

Do not commit any of the following:

- Apple credentials
- Apple certificates
- provisioning profiles
- signing secrets
- local keychain exports
- derived build artifacts
- user-specific Xcode settings files if not appropriate for shared repo state
- any local-only signing or Apple account configuration

General principle:

- repo should contain reproducible project structure, not private Apple release secrets

# Future implementation command

When the team is ready to actually start iOS implementation, this is the ready-to-copy Codex command starter:

```text
Implement the initial iOS Capacitor setup for Schedulaa as a serious production app.

Scope:
- install @capacitor/ios
- run npx cap add ios
- generate frontend/ios
- keep appId com.schedulaa.app
- keep app name Schedulaa
- do not add Apple signing secrets
- do not change backend unless a real blocker is found
- add/update frontend/docs/ios-app-release-source-of-truth.md as needed
- update .gitignore for safe iOS/Xcode generated files
- run npm run build
- run npx cap sync ios
- report exact files changed and exact Mac/Xcode steps still required
```

# Relationship to Android source of truth

Android and iOS release tracks must stay separate.

Android source of truth remains:

- `frontend/docs/android-app-release-source-of-truth.md`

Relationship rule:

- Android uses a direct APK + Cloudflare R2 distribution path
- iOS must use Apple distribution
- do not merge the Android APK hosting workflow into the iOS release workflow

# Summary

Current bottom line:

- Schedulaa already has the employee workflow needed for an iOS app
- backend is not the blocker
- the missing work is native iOS packaging, signing, Apple distribution, and real device QA
- this document is the checkpoint for the next implementation phase
