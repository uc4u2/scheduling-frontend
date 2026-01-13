## Timezone Standards (Frontend + Backend)

### Shared components
- Use `components/TimezoneSelect` for all timezone inputs. It includes:
  - Detect my timezone (Intl.DateTimeFormat().resolvedOptions().timeZone)
  - Searchable list based on the curated top 60 (IANA) in `constants/timezones.js`
  - Free entry for any valid IANA string (no blocking on the top list)

### Forms covered (and future)
- Already using the shared selector: Login, Register, Add Team Member, Checkout dialogs.
- New/updated forms must use the same selector; avoid hard-coded arrays.

### Display rules
- Keep the existing contract: UI shows full ISO with offset, API payloads stay local strings.
- Invitation/booking pages should show dual display when possible (slot TZ + viewer TZ); Candidate Intake now does this with a picker.

### Backend rules
- Accept/validate any IANA timezone; do not restrict to the top list.
- Always return `timezone` alongside date/time fields. Fallback order: browser TZ (if provided) → stored user/company TZ → UTC.
- Inputs remain `{ date:"YYYY-MM-DD", start_time:"HH:MM", end_time? }` with a `timezone` string for context; server re-attaches zone.

### Defaults
- Default to browser-detected TZ when available, otherwise stored user/company TZ, otherwise UTC. Never auto-change existing stored TZ.

### Helpers
- Use `getUserTimezone()` and datetime helpers for ISO building/formatting; avoid hard-coded `"America/*"` strings and `toISOString().slice()`.

### Why this is safe
- Broadens selection without changing the time handling contract.
- Keeps IANA strings end-to-end; no moment-style offsets or custom abbreviations.
