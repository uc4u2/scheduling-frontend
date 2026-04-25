# Punch Location Evidence UI Source of Truth

This document is the frontend source of truth for Schedulaa punch-location evidence UI. The backend canonical source is:

- `backend/docs/PUNCH_LOCATION_EVIDENCE_SOURCE_OF_TRUTH.md`

## UI Goal

Collect advisory location evidence only when an employee taps Clock In or Clock Out, then let managers review that evidence in a dedicated Punch Locations tab.

The UI must make clear that this evidence is review-only and never blocks a punch.

## Employee UI

Source file:

- `frontend/src/pages/sections/SecondEmployeeShiftView.js`

Behavior:

- Reads `timeSummary.policy.punch_location_mode`.
- If mode is `off`, it does not attempt location capture.
- If mode is `optional`, it attempts one foreground location capture inside the Clock In / Clock Out click handler.
- It does not request location on page load.
- It does not use `watchPosition`.
- It does not request background location.
- It always continues the punch even when location fails.

Native Android behavior:

- Android uses `@capacitor/geolocation` instead of relying only on browser geolocation.
- The app checks native permission first and requests it during punch capture when needed.
- If the user denied permission once, the app can request again on a later punch.
- If the user permanently denies location via Android system choice, Android stops re-prompting and the user must re-enable permission in app settings.
- Android manifest must include:
  - `android.permission.ACCESS_COARSE_LOCATION`
  - `android.permission.ACCESS_FINE_LOCATION`

Web behavior:

- Web continues to use `navigator.geolocation.getCurrentPosition(...)`.

Geolocation options:

- `enableHighAccuracy: true`
- `timeout: 10000`
- `maximumAge: 0`

Employee messages:

- `Getting location evidence...`
- `Location could not be verified in time. Your punch was still recorded.`
- `Location permission denied. Your punch was still recorded. The app can request location again on a future punch.`
- `Location services are unavailable. Your punch was still recorded.`

Payload sent to backend:

```json
{
  "location": {
    "lat": 44.10365,
    "lng": -79.564942,
    "accuracy_m": 5,
    "captured_at": "2026-04-10T21:15:16.000Z",
    "permission_state": "granted",
    "capture_delay_ms": 1234
  }
}
```

If coordinates are unavailable, the payload may include only state and delay:

```json
{
  "location": {
    "permission_state": "timeout",
    "capture_delay_ms": 10000
  }
}
```

## Settings UI

Source file:

- `frontend/src/pages/sections/SettingsTimeTracking.js`

Setting:

- `punch_location_mode`

Allowed UI values:

- `off`
- `optional`

Helper copy should continue to communicate:

- optional mode attempts one foreground location capture during clock in/out
- it never blocks punching

There must be no `required` mode in the UI unless the product, backend, privacy policy, and source-of-truth docs are updated first.

## Manager UI

Dashboard registration:

- `frontend/src/NewManagementDashboard.js`
- key: `time-tracking-locations`
- label: `Punch Locations`

Panel source:

- `frontend/src/pages/sections/PunchLocationsPanel.js`

Endpoint consumed:

- `GET /manager/time-entries/locations`

Filters:

- `start_date`
- `end_date`
- `department_id`
- `recruiter_id`

The filters should stay aligned with:

- `frontend/src/pages/sections/TimeEntriesPanel.js`
- `frontend/src/pages/sections/FraudAnomaliesPanel.js`

Manager table shows:

- employee
- date
- clock in time
- clock in location/evidence
- clock out time
- clock out location/evidence
- map link when coordinates exist
- accuracy when available
- permission state when coordinates are missing
- `Slow location` chip when `capture_delay_ms > 5000`

## Display Rules

Location cell priority:

1. If coordinates exist, show latitude/longitude, map link, accuracy, state, and delay indicators when available.
2. If coordinates do not exist but permission state exists, show the state chip.
3. If no evidence exists, show `No evidence`.

State chips must remain readable on the light manager dashboard background.

Slow location is advisory only. It must not block or automatically flag payroll.

## Privacy-Safe UI Rules

The UI must not imply continuous tracking.

Avoid copy like:

- tracking employees
- live location
- real-time GPS
- always-on monitoring
- geofence enforcement

Preferred language:

- punch-location evidence
- advisory GPS evidence
- captured only when employees tap Clock In or Clock Out
- review-only
- never blocks a punch

## Regression Areas

When this UI changes, manually test:

- mode `off`: no location prompt and punches still work
- mode `optional`: one foreground prompt during punch
- permission granted: coordinates appear in Punch Locations
- permission denied: punch succeeds and state appears
- permission denied once on Android: app can request again on a later punch
- permanently denied on Android: punch succeeds, denied state appears, Android no longer re-prompts until settings are changed
- timeout: punch succeeds and timeout state appears
- unsupported browser: punch succeeds and unsupported state appears
- weak accuracy: punch succeeds and evidence is still review-only
- Clock In evidence and Clock Out evidence separately
- Time Tracking approvals still render and work
- Fraud / Anomalies filters still render and work
- Punch Locations filters by date, department, and employee
- frontend production build succeeds
