---
title: Advanced Management Settings
description: Reference for configuring Manager Portal → Advanced Management tabs, including the Client Video (Jitsi) policy.
---

# Advanced Management Overview

Managers access these controls from the Manager Portal → **Advanced Management** sidebar. Tabs include:

- **Workspace**: General company profile, policy settings, and time-tracking options.
- **Profession**: Service-specific defaults (colorists, coaches, etc.).
- **Embed**: Booking widget embed codes for Wix, WordPress, Squarespace.
- **Reviews & Tips**: Automations for review requests and tip prompts.
- **Artist Visibility**: Controls who shows up on the booking site.
- **Client Video (Jitsi)**: Configure the auto-generated video links described below.
- **Stripe Hub / Checkout**: Payment gateway, deposit rules, card-on-file.
- **Xero / QuickBooks**: Accounting exports + ledger sync.
- **Integration Activity**: Webhook and API status feed.

## Client Video (Jitsi) Tab

Located under Advanced Management → **Settings** → *Client Video (Jitsi)*.

### Purpose

- Automatically attaches a Jitsi meeting link to every client booking.
- Generates deterministic room names per appointment and stores them on the booking record.
- Includes the link in confirmation + reminder emails when policy allows.

### Fields

1. **Enable Jitsi link for client bookings** – master toggle. When on, bookings receive a `meeting_link` and `meeting_provider: "Jitsi"`.
2. **Jitsi domain** – base URL (default `https://meet.jit.si`). Set this to your self-hosted Jitsi domain if applicable.
3. **Room prefix** – prepends a short string (default `appt`) before the generated room slug so links remain human readable.
4. **Stable per appointment** – when enabled, the room name stays consistent for a given appointment ID. Disable to create unique links for every join event.
5. **Include video link in client emails** – when enabled, confirmation, reschedule, and reminder emails surface a “Join via Jitsi” button.

Changes are saved via the **Save** button; responses appear as “Settings saved.” toast alerts. API endpoints live at `/admin/client-video-policy` (GET/POST) and require manager JWTs.

### How it behaves

- Booking/reschedule flows call `_attach_jitsi_to_booking()` to persist `meeting_link`.
- Reminder jobs (`_reminder_window_send`) inject the Jitsi URL when the policy is on.
- Candidate/appointment CRUD endpoints guard the feature behind `enable_jitsi_for_clients` so admins can disable without data loss.

## Related Tabs

- **Stripe Hub / Checkout**: Configure publishable/secret keys, tax preferences, saved-card behavior, and pay-now/deposit modes.
- **Xero / QuickBooks**: Map ledger accounts, enable automatic export jobs, and review sync status via Integration Activity.
- **Integration Activity**: Monitors Zapier, webhooks, and Jitsi/Stripe/Xero API calls so managers can debug failures quickly.

## QuickBooks Tab (Accounting Sync)

- **Component:** `SettingsQuickBooks.js`
- **Goal:** Connect your QuickBooks Online company, map ledger accounts/classes/items, and export payroll + revenue batches directly from Advanced Management.

### 1. Connect the integration

1. Open **Advanced Management → Settings → QuickBooks**.
2. Click **Connect QuickBooks** to launch the Intuit consent dialog (requires manager access).
3. After authorization, the status band shows the linked company, last export time, and whether exports are locked before a certain date.

### 2. Map accounts & presets

- The integration pulls your chart of accounts, classes, locations, items, and customers via `/api/quickbooks`.
- Use the “Payroll account mapping” table to assign each bucket (wages expense, taxes payable, tips, net pay, etc.) to the correct QuickBooks account. Save each row inline.
- Optional presets let you save whole mapping sets (e.g., “US Payroll” vs “Canada Payroll”) and reapply them later.

### 3. Set defaults & locks

- Defaults card lets you select a fallback **class, location, item, and customer** for export lines that don’t have explicit tracking values.
- Configure a **lock exports before** date to block historical syncs; flip on “Allow backdated exports” when you need to re-run an older period. The UI surfaces warnings if the lock date has passed or is about to block upcoming payroll.

### 4. Tracking categories

- The tracking table maps internal departments/locations to QuickBooks classes/locations. Each row includes dropdowns plus toggle chips for default/inactive states so you can control how multi-location data lands in QuickBooks.

### 5. Preview & export

- Pick a payroll run from the exports table, click **Preview**, and Schedulaa assembles the full journal entry (wages, deductions, revenue, taxes).
- Validation highlights missing accounts or expired tokens; fix issues, then hit **Export to QuickBooks** to push the journal.
- Every export uses the viewer’s timezone (`formatDateTimeInTz`) and logs to Integration Activity for audit trails.

### 6. Troubleshooting

- Status panel shows token freshness, integration permissions (`can_manage_integrations`, `can_export_accounting`), and last sync results.
- Use **Refresh status** after reconnecting, and **Open QuickBooks** to double-check that journals posted correctly.
