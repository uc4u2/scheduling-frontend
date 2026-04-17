# Manager / Employee Dashboard UI Theme Source of Truth

Last updated: 2026-04-16

This note documents the current UI direction for the manager and employee dashboards after the enterprise-style visual polish pass.

## Purpose

The dashboard UI should feel calmer, more premium, and more enterprise-grade without becoming visually noisy.

Primary goals:
- Consistent radius across manager and employee dashboards.
- Theme-aware colors across page headers, cards, filters, forms, calendars, dialogs, drawers, and chips.
- No legacy pure-white form islands inside themed pages.
- No overly rounded pill shapes except where intentionally small status chips need a pill treatment.
- Reusable themed date/time picker behavior instead of native browser pickers.

## Theme Files

Primary theme entry points:
- `src/theme.js`
- `src/themeV2.js`

Shared UI wrappers/components:
- `src/components/ui/ManagementFrame.js`
- `src/components/ui/SectionCard.js`
- `src/components/ui/ElevatedCard.js`
- `src/components/ui/ThemedDateField.jsx`

Calendar theme CSS:
- `src/pages/sections/manager-calendar.css`
- `src/components/calendar-enterprise.css`

## Radius Standard

Default dashboard radius target:
- Main cards/containers: `6px` effective radius.
- Inputs/selects/buttons: `6px` effective radius unless a component has a strong reason to differ.
- Small status chips/badges: max `6px` unless a compact pill is intentionally required.
- Calendar event pills: `6px` max.
- Popups/dialogs/drawers: should look structured, not bubble-like.

Implementation rule:
- Prefer `theme.shape.borderRadius` and small MUI multipliers.
- Avoid new hardcoded radius values above `6px` in manager/employee dashboard surfaces.
- If old code uses `borderRadius: 2`, `3`, `20px`, `999px`, or similar, convert it to a smaller theme-aware value unless it is intentionally a circular avatar/icon.

Allowed exceptions:
- Circular avatars.
- Round icon buttons where the shape is semantically circular.
- Intentional profile/image masks.

## Color / Theme Standard

The dashboard theme is selected from the existing theme picker. Main themes such as Cool Blue and Sunset should feel cohesive across the whole page.

Rules:
- Use `theme.palette` tokens and alpha helpers instead of raw legacy white backgrounds.
- The page shell, page headers, cards, filter bars, and form interiors should use subtle theme-tinted surfaces.
- Avoid isolated pure-white blocks inside themed screens unless contrast requires it.
- Form controls should inherit themed background/border styling from the central MUI theme.
- Disabled states should remain readable and should not look like broken contrast.
- Status colors must stay functional: green for healthy/available, amber/orange for attention, red for risk/destructive, blue/neutral for information.

Current direction:
- Page headers use a soft theme-aware gradient.
- Section containers use a subtle tinted surface and border.
- Inputs/selects use a light themed fill with theme-aware borders.
- Dialogs/popovers should be opaque enough that underlying page content does not visually bleed through.

## Date / Time Picker Standard

Use the shared picker wrapper for dashboard date/time fields:
- `ThemedDateField`
- `ThemedMonthField`
- `ThemedTimeField`

Do not add new native browser fields in dashboard pages:
- Avoid `TextField type="date"`.
- Avoid `TextField type="time"`.
- Avoid `TextField type="month"`.

Why:
- Native browser pickers ignore much of the app theme.
- They create inconsistent calendar/time dropdowns across manager and employee dashboards.

When replacing legacy fields:
- Preserve the same `name`, `value`, `onChange`, `required`, `fullWidth`, and label behavior.
- The shared wrappers emit normal `event.target.name` and `event.target.value` shapes for compatibility.

Known fixed areas include:
- Shift Management date/time fields.
- Employee availability date/time fields.
- ROE Last Day picker.
- Advanced management campaign/slot-related date pickers.
- Payroll/time tracking/reporting filter date ranges where already migrated.

## Calendar / Event Badge Standard

FullCalendar and calendar-style badges must not use large pill radii by default.

Rules:
- Calendar events: `6px` radius.
- Availability chips like `Available`: `6px` radius.
- Leave/booking/meeting calendar event labels should be compact and readable.
- Keep event colors theme-aware but status-readable.

Main files:
- `src/MySetmoreCalendar.js`
- `src/pages/client/EmployeeAvailabilityCalendar.js`
- `src/pages/sections/AllEmployeeSlotsCalendar.js`
- `src/pages/sections/manager-calendar.css`
- `src/components/calendar-enterprise.css`

## Dialog / Drawer / Popover Standard

Dialogs, drawers, and popups should be readable above the page.

Rules:
- Dialog paper should use a solid or near-solid themed surface.
- Backdrop can be dimmed, but the dialog itself should not be transparent enough to show underlying text.
- Popover menus/date pickers should use the same theme surface as cards/forms.
- Keep z-index behavior standard through MUI unless there is a verified layering bug.

## Navigation Standard

Manager sidebar behavior:
- Opening a child route should keep the parent group open.
- The active highlight should stay on the actual selected child route, not jump back to the parent.
- Switching between child routes in the same group should not visibly close and reopen the group.

Employee top tabs:
- Keep tab radius and color aligned with the dashboard theme.
- Avoid oversized pill tabs.

## Training Module UI Direction

Training pages should follow this same dashboard system.

Manager Training:
- Library, Collections, Quizzes, Training Sets, Assignments, Progress should use the shared theme radius and tinted surfaces.
- Asset cards should include visual thumbnails/previews when available.
- Archived assets should move out of the default Library view and remain restorable from archived filters/views.
- Hosted video remains visible as future-gated but disabled.

Employee My Training:
- Use visual item cards with thumbnails where possible.
- Keep item status simple: Not started, In progress, Completed.
- Do not add LMS-heavy visual noise.
- Keep video behavior honest: opening an external video can mark started, but full watch verification is not claimed.

## Implementation Rules For Future UI Work

When adding or editing manager/employee dashboard UI:
- Start from `ManagementFrame`, `SectionCard`, and MUI theme tokens where possible.
- Prefer `sx` with `theme` values over hardcoded colors.
- Keep radius at or below the dashboard standard unless there is a clear exception.
- Use `ThemedDateField` / `ThemedTimeField` for all date/time UI.
- Check popovers/dialogs for opacity and contrast.
- Check status chips for readable text contrast.
- Run `npm run build` after broad UI changes.

## Intentional Non-Goals

This polish system does not change:
- Payroll formulas.
- Scheduling behavior.
- Leave workflows.
- Training assignment/progress logic.
- Booking logic.
- Backend APIs.

This is a frontend visual consistency layer only.
