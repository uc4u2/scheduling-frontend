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

## Mobile Compliance Mode (Play Store)

- In native runtime, payment/billing/Stripe actions are web-only.
- Stripe checkout, billing portal, Stripe Connect onboarding, and seat purchases are blocked in-app.
- Blocked screens show:
  - "Payments & subscriptions are managed on the web. Please open schedulaa.com on desktop."
  - A "Copy web URL" action instead of external Stripe redirects.

### Compliance files

- `src/utils/mobileCompliance.js`
- `src/components/mobile/MobileWebOnlyNotice.jsx`
- `src/components/billing/billingHelpers.js`
- `src/pages/sections/SettingsBillingSubscription.js`
- `src/pages/sections/SettingsStripeHub.js`
- `src/pages/sections/SettingsCheckoutPro.js`
- `src/pages/UpgradeBridgePage.jsx`
- `src/pages/billing/BillingSuccessPage.jsx`
- `src/pages/billing/BillingCancelPage.jsx`
- `src/pages/sections/management/StripeConnectReturn.js`
- `src/pages/sections/management/ManagerPaymentsView.js`
- `src/pages/sections/management/ManagerProductOrdersView.js`
- `src/components/billing/SeatsRequiredModal.jsx`
- `src/components/billing/UpgradeRequiredModal.jsx`
- `src/components/billing/UpgradeNoticeBanner.jsx`
- `src/components/billing/GlobalBillingBanner.jsx`
- `src/AddRecruiter.js`

### Extending later

- Add dedicated mobile-first screens for each tab route.
- Make drawer items fully role-aware with permission checks.
- Add native-only enhancements (push/deeplinks) without changing web routes.
