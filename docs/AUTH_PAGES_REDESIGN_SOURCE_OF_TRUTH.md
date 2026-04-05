# Auth Pages Redesign Source Of Truth

## Purpose

This document is the source of truth for the frontend auth-page redesign that upgraded:

- `Login`
- `Register`
- `ForgotPassword`

The redesign goal was to make the auth experience feel more premium and enterprise-grade without changing backend contracts, tenant-aware behavior, or the existing timezone contract.

## Scope

Implemented frontend files:

- `frontend/src/components/auth/AuthCardShell.jsx`
- `frontend/src/Login.js`
- `frontend/src/Register.js`
- `frontend/src/ForgotPassword.js`
- `frontend/src/PasswordField.js`
- `frontend/src/components/RoleSelect.js`
- `frontend/public/images/auth/lumen-auth-reference.jpeg`

Out of scope:

- backend auth behavior
- tenant-context propagation logic
- validation rules
- redirect contracts
- broader frontend redesign outside auth pages

## Visual Direction

The auth pages now use a shared premium shell with:

- centered auth layout
- split desktop composition
- compact mobile fallback
- stronger hierarchy and spacing
- warmer Schedulaa sunset-orange accenting
- preserved readability and accessibility

The visual direction is intentionally more polished than the legacy auth pages, but still operational and product-focused rather than decorative.

## Shared Shell

Shared shell:

- `frontend/src/components/auth/AuthCardShell.jsx`

This file owns:

- background treatment
- card shell structure
- desktop hero panel
- mobile hero fallback
- shared auth field styling via `authInputSx`
- shared auth CTA styling via `authButtonSx`

## Login Page

File:

- `frontend/src/Login.js`

Key redesign outcomes:

- moved onto shared auth shell
- improved layout hierarchy and spacing
- retained existing tenant-aware behavior
- retained existing timezone contract
- login role default changed to `Business Owner`

Role field:

- role options are no longer shown as heavy two-line menu items
- the open menu now shows one-line role labels only
- descriptions are available via tooltip
- role selection uses a dedicated shared component:
  - `frontend/src/components/RoleSelect.js`

## Register Page

File:

- `frontend/src/Register.js`

Key redesign outcomes:

- moved onto shared auth shell
- stronger visual sectioning
- preserved owner/client registration logic
- preserved timezone contract
- role field aligned to the same `RoleSelect` pattern as login

## Forgot Password Page

File:

- `frontend/src/ForgotPassword.js`

Key redesign outcomes:

- moved from a plain container into the shared auth shell
- now matches login/register visually
- preserved tenant-aware reset request behavior
- added submit state handling for cleaner UX

## Password Field

File:

- `frontend/src/PasswordField.js`

What changed:

- visibility icon styling was aligned to the new shell
- `InputLabelProps` forwarding was added so password labels can be positioned consistently with the rest of the auth inputs

## Role Select Pattern

File:

- `frontend/src/components/RoleSelect.js`

Why it exists:

- `Role` looked worse than `Timezone` when implemented directly as `TextField select`
- `TimezoneSelect` already used a cleaner `Autocomplete -> renderInput(TextField)` structure
- `RoleSelect` now follows that same pattern as closely as practical

Behavior:

- closed field uses the same shared input styling contract via `textFieldSx`
- open menu shows only labels
- descriptions are tooltip-only
- selected value stays clean and compact

## Timezone Contract

The redesign intentionally preserved the existing timezone contract.

Still in use:

- `getUserTimezone()`
- `formatTimezoneLabel(...)`
- `TimezoneSelect`
- detected timezone + optional manual override behavior

This redesign must not be used as a reason to simplify or replace the timezone UX with browser-only ad hoc behavior.

## Design Decisions Kept

- keep auth logic unchanged
- keep tenant-aware behavior unchanged
- keep validation unchanged
- keep backend API contracts unchanged
- keep shared input system centralized through `AuthCardShell`
- use shared component structure where possible instead of stacking per-field overrides

## Design Decisions Rejected

Rejected during implementation:

- copying the reference image palette literally
- leaving heavy tenant-specific wording in auth UI
- keeping role options as visually heavy two-line menu items
- trying to force the role field with repeated one-off outlined-select hacks

## Review Checklist

When editing auth pages later, verify:

- login still works for client/employee/owner
- register still works for client/owner
- forgot-password still sends tenant context when available
- password labels clear the pill border cleanly
- role field visually matches the same input family as other auth inputs
- timezone contract remains intact
- desktop and mobile both remain usable

## Files Most Likely To Need Future Auth-Design Edits

- `frontend/src/components/auth/AuthCardShell.jsx`
- `frontend/src/Login.js`
- `frontend/src/Register.js`
- `frontend/src/ForgotPassword.js`
- `frontend/src/PasswordField.js`
- `frontend/src/components/RoleSelect.js`
