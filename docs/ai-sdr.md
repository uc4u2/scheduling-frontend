# AI SDR — Frontend Note

Last updated: 2026-03-16

This is the frontend-side note for the current AI SDR admin UI.

Backend source of truth:

- `backend/docs/AI_SDR_SOURCE_OF_TRUTH.md`

Broader sales/admin UI context:

- `frontend/docs/platform_admin_sales.md`

## 1. Scope

Frontend currently exposes AI SDR only inside the Platform Admin lead drawer.

It does not provide:

- a dedicated AI SDR dashboard
- tenant-facing AI SDR UI
- rep-facing AI SDR UI

## 2. Primary frontend files

- `frontend/src/components/platformAdmin/sales/LeadAiSdrPanel.jsx`
- `frontend/src/components/platformAdmin/sales/LeadDetailDrawer.jsx`
- `frontend/src/components/platformAdmin/sales/LeadActivityTimeline.jsx`
- `frontend/src/api/platformAdminSales.js`

## 3. Current admin drawer capabilities

The AI SDR panel inside the lead drawer can:

- show AI rep ownership state
- show whether AI SDR is enabled
- show current block reason when AI is blocked
- show AI call history from `AIOutboundCall`
- start one AI call for the current lead
- toggle lead AI exclusion
- apply deterministic AI result manually
- override callback / resend behavior when applying result

## 4. Frontend API helpers in use

From `frontend/src/api/platformAdminSales.js`:

- `getAiSdrLeadContext(leadId)`
- `listAiSdrLeadCalls(leadId)`
- `runAiSdrOnce(payload)`
- `startAiSdrLeadCall(leadId, payload)`
- `applyAiSdrResult(callId, payload)`

## 5. Timezone behavior

AI SDR timestamps in the admin drawer render in the viewer/browser timezone.

Current behavior:

- call history timestamps use `formatDateTimeInTz(...)`
- viewer timezone resolves from browser timezone with fallback to `getUserTimezone()`
- the timezone label is shown in the drawer for callback and call timestamps

Relevant files:

- `frontend/src/components/platformAdmin/sales/LeadAiSdrPanel.jsx`
- `frontend/src/components/platformAdmin/sales/LeadActivityTimeline.jsx`

Related standards:

- `docs/frontend-standards.md`
- `frontend/docs/timezone-standards.md`

## 6. Current UX boundaries

AI SDR remains admin-controlled.

The UI does not currently expose:

- live realtime session diagnostics
- realtime bridge controls
- AI campaign management
- autonomous dialer controls
