# Schedulaa Mobile Workflow

## Mobile App Mode (React)

- Mobile app shell is mounted on `/app/*`.
- Mobile mode is active when either:
  - Native runtime is detected (`Capacitor` / `capacitor:` protocol), or
  - Viewport is mobile (`max-width: 900px`).
- In mobile mode, `/app/*` uses `MobileLayout`:
  - Bottom tabs: `Today`, `Calendar`, `Shifts`, `Bookings`, `More`
  - `More` opens a drawer with links to existing modules.
- On desktop screens, `/app/*` routes redirect to existing desktop pages.
- Non-`/app/*` routes are unchanged.

### Key files

- `src/utils/runtime.js`
- `src/components/mobile/MobileLayout.jsx`
- `src/components/mobile/MobileDrawer.jsx`
- `src/components/mobile/MobileTodayPage.jsx`
- `src/components/mobile/MobileMorePage.jsx`
- `src/App.js` (routing + chrome gate for mobile mode)

### Extending later

- Add dedicated mobile-first screens for each tab route.
- Make drawer items fully role-aware with permission checks.
- Add native-only enhancements (push/deeplinks) without changing web routes.

