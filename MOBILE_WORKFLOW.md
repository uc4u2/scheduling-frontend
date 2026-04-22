# Schedulaa Mobile Workflow

## Mobile App Mode (React)

- Native runtime should start on the same current route tree as the web app:
  - Manager: `/manager/dashboard`
  - Employee / recruiter: `/employee/my-time`
  - Client: `/dashboard`
- `/app/*` is now a legacy compatibility path only.
- The legacy `/app/*` paths must redirect into current maintained routes instead of rendering a separate mobile shell.
- Mobile mode still means:
  - Native runtime is detected (`Capacitor` / `capacitor:` protocol), or
  - Viewport is mobile (`max-width: 900px`).
- Non-`/app/*` routes remain the source of truth for current dashboards and website flows.

### Key files

- `src/utils/runtime.js`
- `src/App.js` (routing + chrome gate for mobile mode)
- `src/ManagerDashboard.js`
- `src/NewManagementDashboard.js`
- `src/RecruiterDashboard.js`

### Legacy `/app/*` redirect map

- `/app`, `/app/today`
  - Manager -> `/manager/dashboard`
  - Employee / recruiter -> `/employee/my-time`
- `/app/calendar`
  - Manager -> `/manager/dashboard?view=master-calendar`
  - Employee / recruiter -> `/employee/my-calendar`
- `/app/shifts`
  - Manager -> `/manager/dashboard?view=team`
  - Employee / recruiter -> `/employee/my-time`
- `/app/bookings`
  - Manager -> `/manager/dashboard?view=booking-checkout`
  - Employee / recruiter -> `/employee/upcoming-meetings`
- `/app/more`
  - Manager -> `/manager/dashboard?view=settings`
  - Employee / recruiter -> `/employee`

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

- If a dedicated native shell is reintroduced, it should wrap current dashboard views instead of creating a separate route tree.
- Keep Android/iOS startup aligned with the same maintained route tree used by web.
- Add native-only enhancements (push/deeplinks) without forking core dashboard navigation.
