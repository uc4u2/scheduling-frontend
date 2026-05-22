# Payroll Provider Sync UI Plan

## Goal

Add a future Payroll Provider Sync UI without breaking or duplicating:
- current Payroll Preview
- current History view
- current Raw payroll data page
- current QuickBooks/Xero accounting export buttons

This plan is implementation guidance only.

No UI behavior is changed by this document.

## Current frontend source of truth

### Payroll page container
Main container:
- `frontend/src/pages/sections/Payroll.js`

Current state:
- `viewMode` controls the active payroll view
- current values:
  - `preview`
  - `history`

Current rendering:
- `Preview` view renders `PayrollPreview`
- `History` view renders saved payroll history table
- `Advanced: Exports` and `Company Payroll Reports` live inside `Payroll.js` under preview mode

### Payroll filters
Shared filter component:
- `frontend/src/pages/sections/PayrollFilters.js`

Current shared filter state owned by `Payroll.js`:
- `departmentFilter`
- `selectedRecruiter`
- `startDate`
- `endDate`
- `region`
- `payFrequency`
- `includeArchived`

Important detail:
- province/state is currently local UI state inside `PayrollFilters.js`
- provider-sync should reuse that value later, which likely means lifting it explicitly into `Payroll.js`

### Current accounting export buttons
Accounting export UI:
- `frontend/src/pages/sections/PayrollPreview.js`

Current QuickBooks/Xero actions use:
- `quickbooksIntegration.status()`
- `quickbooksIntegration.validate()`
- `quickbooksIntegration.exportPayroll({ payroll_id })`
- `xeroIntegration.status()`
- `xeroIntegration.validate()`
- `xeroIntegration.exportPayroll({ payroll_id })`

These are accounting journal export only.

They are not provider payroll sync.

### Raw payroll page
Raw/detail page:
- `frontend/src/pages/sections/PayrollRawPage.js`

Purpose:
- audit/detail/raw payroll reporting
- finalized/raw preview export support
- not the best place for provider-sync execution

### Routing / menu
Manager menu source:
- `frontend/src/NewManagementDashboard.js`

Current payroll menu entries already include:
- Payroll
- Saved Payrolls
- Tax
- ROE
- T4
- W2
- Raw payroll data
- Payroll Audit
- Invoices

Current route shell:
- `frontend/src/App.js`

## Recommended UI architecture

### Add a third payroll view
In `frontend/src/pages/sections/Payroll.js`:
- keep existing views:
  - `preview`
  - `history`
- add new third view:
  - `provider-sync`

Recommended UI labels:
- `Preview`
- `History`
- `Provider Sync`

Reason:
- Provider Sync is a pay-period execution workflow
- it belongs with payroll run preparation
- it should stay separate from accounting journal export buttons

### New component
Create:
- `frontend/src/pages/sections/PayrollProviderSync.js`

This component should be a sibling of:
- `PayrollPreview.js`
- `PayrollRawPage.js`

It should not be embedded inside `PayrollPreview.js`.

Reason:
- embedding it in `PayrollPreview.js` would blur the line between:
  - accounting export
  - provider payroll sync

## State reuse plan

`PayrollProviderSync.js` should reuse the shared state already owned by `Payroll.js`.

Use these existing values:
- `departmentFilter`
- `selectedRecruiter`
- `startDate`
- `endDate`
- `region`
- `payFrequency`
- `includeArchived`
- recruiter list / filtered recruiter context if needed for display

### Province/state handling
Current issue:
- province/state is local to `PayrollFilters.js`
- provider-sync also needs province/state for provider-run creation and validation

Recommended change in the future implementation branch:
- lift province/state into `Payroll.js`
- pass it into both:
  - `PayrollFilters.js`
  - `PayrollProviderSync.js`

Do not duplicate province/state state in the new Provider Sync component.

## New API wrapper plan

Add a dedicated provider-sync API wrapper in:
- `frontend/src/utils/api.js`

Do not extend these existing wrappers for provider-sync execution:
- `quickbooksIntegration`
- `xeroIntegration`

Those wrappers remain accounting-export oriented.

Recommended new wrapper shape:
- `payrollProviderSync.status(provider, params)`
- `payrollProviderSync.listRuns(params)`
- `payrollProviderSync.rawPreview(payload)`
- `payrollProviderSync.createFromRaw(payload)`
- `payrollProviderSync.validate(runId)`
- `payrollProviderSync.quickbooksPayloadPreview(runId)`
- `payrollProviderSync.csvDownload(runId)`
- optionally later:
  - `payrollProviderSync.listEmployeeMappings(provider, params)`
  - `payrollProviderSync.listPayItemMappings(provider, params)`

## Backend endpoints to use

### Provider setup / capability
- `GET /automation/payroll/provider-setup/status?provider=quickbooks`

Use for:
- connection status
- capability status
- missing scopes
- employee mapping count
- pay item mapping count
- readiness
- setup steps

### Provider run preparation
- `POST /automation/payroll/provider-runs/raw-preview`
- `POST /automation/payroll/provider-runs/create-from-raw`

Use for:
- previewing provider-sync source data for the selected period
- creating a persisted provider run

### Validation / inspection
- `POST /automation/payroll/provider-runs/<id>/validate`
- `GET /automation/payroll/provider-runs/<id>`
- `GET /automation/payroll/provider-runs/<id>/provider-payload-preview?provider=quickbooks`

Use for:
- run readiness checks
- run detail display
- QuickBooks payload inspection before any submit path

### CSV fallback
- `GET /automation/payroll/provider-runs/<id>/csv-download`

Use for:
- safe provider-ready raw-time CSV export

## Recommended Provider Sync UX

### Section 1: Setup status
Display:
- provider connection state
- provider company ref
- environment
- supports accounting / time capability
- missing scopes
- readiness
- setup steps
- employee mapping count
- pay item mapping count

This is read-only status guidance.

### Section 1B: Mapping readiness
Display:
- mapped employees count
- unmapped employees count for the current run
- mapped pay item count
- missing pay item mappings
- required mappings for the current run
- optional mappings available but not required this period

The UI should distinguish:
- required because a line exists this period
- optional because the mapping exists but no line uses it this period

### Section 2: Prepare run
Inputs come from existing Payroll page state:
- department
- optional employee
- start/end date
- region
- pay frequency
- province/state if lifted

Primary action:
- `Prepare QuickBooks Payroll Data`

Copy guidance:
- `Provider Sync prepares payroll-ready inputs from approved time, payroll-ready leave, and saved Payroll Preview adjustments. Official payroll is completed in QuickBooks or your payroll provider.`
- if no saved adjustments exist:
  - `No saved Payroll Preview adjustments found for this period. Provider Sync will use approved time and leave only.`
- if saved adjustments exist:
  - `Saved Payroll Preview adjustments will be included.`

This should call:
- `raw-preview`

Show:
- employee count
- line count
- total hours
- regular hours
- overtime hours
- holiday hours
- paid leave hours
- gross preview total
- adjustment line count
- adjustment total
- adjustment types found
- warnings
- errors
- duplicate existing run if detected

### Section 3: Create run
Action:
- `Create Provider Run`

This should call:
- `create-from-raw`

Result:
- persist run id
- load run detail

### Section 4: Validate run
Action:
- `Validate Mappings`

This should call:
- `validate`

Show:
- validation errors
- validation warnings
- missing employee mappings
- missing pay item mappings
- blocked employees
- negative/invalid lines
- adjustment-only line count
- unpaid leave visibility rows
- accounting-only QuickBooks warning
- live QuickBooks payroll/time submit not enabled

### Section 5: QuickBooks payload preview
Action:
- `Preview QuickBooks Payload`

This should call:
- `provider-payload-preview?provider=quickbooks`

Show:
- line previews
- provider employee id
- work date
- earning key
- provider item id
- hours
- rate
- amount preview
- row/line errors

This must remain read-only.

### Section 5B: Mapping management
Actions:
- list unmapped employees for the current run
- save provider employee IDs manually
- bootstrap employee mappings from legacy IDs
- save pay item mappings manually

Rules:
- never use `external_payroll_employee_id` directly except bootstrap
- do not overwrite existing mappings silently

### Section 6: CSV fallback
Action:
- `Download Provider CSV`

This should call:
- `csv-download`

Purpose:
- safe fallback handoff
- not a claim of provider-completed payroll

Workflow wording:
- use `Save payroll-ready adjustments`
- use `Payroll-ready inputs`
- use `Preview provider payload`
- use `Download Provider Sync CSV`
- use `Complete payroll inside provider`

Avoid:
- `Run payroll`
- `Pay employees`
- `Submit official payroll`

Status/warning copy:
- show `QuickBooks official import format: not verified yet`
- show that Provider Sync CSV is recommended for accountant/provider/QuickBooks handoff
- rename the old Advanced Export provider CSV to `Legacy Finalized Payroll Export`

### Section 7: Run history
Display recent provider runs with:
- pay period
- provider
- created by
- created at
- source hash
- employee count
- line count
- total hours
- adjustment total
- status
- payload previewed yes/no
- csv exported yes/no

Allowed status framing:
- draft
- validated
- payload_previewed
- csv_exported
- failed
- unsupported

Do not use:
- payroll_submitted
- payroll_completed
- employees_paid

## Rendering recommendation in Payroll.js

Recommended render order:
1. keep current filter panel at the top
2. keep current `Preview` behavior unchanged
3. keep current `History` behavior unchanged
4. add `Provider Sync` as a separate third view

Pseudo-structure:
- `viewMode === "preview"` -> current preview UI
- `viewMode === "history"` -> current history UI
- `viewMode === "provider-sync"` -> render `PayrollProviderSync`

## Important state-management rule

Current `handleChangeViewMode` in `Payroll.js` resets preview/history state generically.

Future implementation should make tab-change reset behavior mode-aware.

Reason:
- provider-sync needs its own state:
  - setup status
  - preview payload
  - provider run id
  - validation result
- that state should not be mixed into preview state
- and preview/history should not be broken by a generic reset pattern

## What must remain unchanged

Do not repurpose these existing UI elements for provider-sync:
- QuickBooks status chip in `PayrollPreview.js`
- Xero status chip in `PayrollPreview.js`
- `Sync to QuickBooks` button in `PayrollPreview.js`
- `Sync to Xero` button in `PayrollPreview.js`

They remain accounting journal export only.

Existing button semantics:
- QuickBooks button -> `POST /integrations/quickbooks/export-payroll`
- Xero button -> `POST /integrations/xero/export-payroll`

These must not start calling provider-sync endpoints.

## Later label cleanup

When frontend provider-sync ships, later rename the accounting export labels for clarity.

Recommended future labels:
- `Post accounting journal to QuickBooks`
- `Post accounting journal to Xero`

Recommended helper text:
- `Connect QuickBooks from Settings → QuickBooks to enable payroll accounting exports.`
- `Connect Xero from Settings → Xero to enable payroll accounting exports.`

Current safe QuickBooks product statement:
- Provider Sync can prepare payroll-ready inputs for QuickBooks review workflows
- QuickBooks payload preview is read-only
- Provider Sync CSV is the recommended current handoff output
- official QuickBooks Payroll submit is not implemented

Do not rename them in the provider-sync backend-only branch.

## Why Provider Sync should not live in Raw Payroll Data page

`PayrollRawPage.js` is useful for:
- raw/detail inspection
- accountant review
- finalized/raw preview exports

But it is not the best home for provider-sync execution because:
- provider-sync is a pay-period workflow
- it should live next to the payroll run controls
- it should reuse the same pay-period filter state as the main Payroll page

Raw Payroll Data can still support provider-sync later as a troubleshooting / audit surface.

## Recommended implementation sequence for the next frontend branch

1. Add provider-sync API wrapper to `frontend/src/utils/api.js`
2. Create `frontend/src/pages/sections/PayrollProviderSync.js`
3. Lift province/state into `Payroll.js`
4. Update `PayrollFilters.js` to use lifted province/state
5. Add `provider-sync` as third `viewMode` in `Payroll.js`
6. Render `PayrollProviderSync` from `Payroll.js`
7. Keep existing `PayrollPreview.js` accounting export buttons unchanged
8. Add later label clarification for accounting export buttons

## Summary

The future frontend should treat Provider Sync as a separate payroll execution workflow.

Correct separation:
- `Settings` = connection, setup, mapping, capability
- `Payroll Preview` = current internal payroll preview + accounting export buttons
- `Payroll History` = saved payroll history
- `Provider Sync` = provider-run preparation, validation, payload preview, CSV fallback
