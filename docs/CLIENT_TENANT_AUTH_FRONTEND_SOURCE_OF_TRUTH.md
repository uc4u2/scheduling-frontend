# Client Tenant Auth Frontend Source Of Truth

## Purpose

This document is the frontend source of truth for the shipped tenant-scoped client auth/profile flows.

It covers:

- the critical auth entry points
- the client portal entry surfaces
- the tenant-context propagation rules
- the Wave 1 and Wave 2 files that were updated

## Frontend Goals Completed

- client login is tenant-aware on critical entry paths
- client register is tenant-aware on critical entry paths
- forgot-password is tenant-aware on critical entry paths
- My Bookings and client portal entry are tenant-aware
- checkout-related client auth dialogs align with tenant context
- older client dashboard pages no longer depend on global-client assumptions on critical paths
- shared timezone behavior used by auth UI was preserved

## Tenant Context Rule

Client-facing auth and portal requests should carry tenant context whenever available.

Priority order:

1. explicit route slug
2. `site` query param
3. tenant-host/custom-domain resolved slug
4. persisted local `site`

Frontend helper introduced for this:

- `frontend/src/utils/clientTenant.js`

Important helpers:

- `resolveTenantSlug(...)`
- `persistTenantSlug(...)`
- `tenantParams(...)`
- `buildTenantLoginPath(...)`
- `buildTenantDashboardPath(...)`

## Timezone Contract

The tenant-auth rollout did not introduce a new timezone UX.

The existing shared contract remains the standard:

- `getUserTimezone()`
- `formatTimezoneLabel(...)`
- `TimezoneSelect`
- detected timezone with optional manual override where those auth UIs already used it

The main auth timezone files remained aligned:

- `frontend/src/Login.js`
- `frontend/src/Register.js`
- `frontend/src/pages/client/PublicClientAuth.js`
- `frontend/src/pages/client/CompanyPublic.js`
- `frontend/src/pages/client/Checkout.js`

## Wave 1 Files Updated

Critical auth and portal entry surfaces:

- `frontend/src/App.js`
- `frontend/src/Login.js`
- `frontend/src/Register.js`
- `frontend/src/ForgotPassword.js`
- `frontend/src/pages/client/PublicClientAuth.js`
- `frontend/src/pages/client/CompanyPublic.js`
- `frontend/src/pages/client/Checkout.js`
- `frontend/src/pages/client/PublicMyBookings.js`
- `frontend/src/pages/client/ClientBookings.js`
- `frontend/src/utils/authRedirect.js`

Wave 1 outcome:

- critical auth requests now send tenant context
- client login/register success persist tenant context
- My Bookings session gating is tenant-aware
- client bookings page passes tenant context to booking APIs

## Wave 2 Files Updated

Broader client-facing surfaces updated in the final follow-up:

- `frontend/src/pages/ClientDashboard.js`
- `frontend/src/pages/client/ClientAppointments.js`
- `frontend/src/pages/client/ClientBookingHistory.js`
- `frontend/src/pages/client/ClientBookings.js`
- `frontend/src/pages/client/ClientDashboardOverview.js`
- `frontend/src/pages/client/ClientPackages.js`
- `frontend/src/pages/client/ClientPaymentMethods.js`
- `frontend/src/pages/client/ClientProfileSettings.js`
- `frontend/src/pages/client/ClientReviews.js`
- `frontend/src/pages/client/ClientSupport.js`
- `frontend/src/pages/client/WebsiteViewer.js`
- `frontend/src/utils/clientTenant.js`

Wave 2 outcome:

- older client dashboard pages now pass tenant context where needed
- authenticated booking cancellation in the client dashboard uses authenticated client APIs
- client reviews submit through tenant-aware authenticated review routes
- website-viewer special pages preserve tenant-aware login and My Bookings redirects
- client quick-action links preserve tenant context

## Client-Facing Files Reviewed But Not Changed

These were audited and left unchanged because they were already sufficiently slug/token scoped for the current backend:

- `frontend/src/pages/client/ServiceDetails.js`
- `frontend/src/pages/client/EmployeeBooking.js`
- `frontend/src/pages/client/MyBasket.js`
- `frontend/src/pages/client/ProductList.js`
- `frontend/src/pages/client/ProductDetails.js`
- `frontend/src/pages/client/BookingConfirmation.js`
- `frontend/src/pages/client/ClientCancelBooking.js`
- `frontend/src/pages/client/ClientRescheduleBooking.js`
- `frontend/src/pages/client/PublicAppointmentPayPage.jsx`
- `frontend/src/pages/client/PublicReview.js`
- `frontend/src/pages/client/PublicReviewList.js`
- `frontend/src/pages/client/PublicTip.js`

## Current Frontend Rules

### Auth entry points

Critical client auth requests must send tenant context when available:

- `/login`
- `/register`
- `/forgot-password`

### Portal

Authenticated client portal pages should not assume:

- token alone is enough
- client identity is global by email
- generic `/dashboard` without tenant context is always correct

### Booking and order views

Client-facing portal API calls should pass tenant context where the backend expects tenant-scoped resolution.

### Public token-link pages

Public token-link pages remain token/slug driven and do not need forced authenticated client session assumptions.

## Validation Checklist

Use this checklist when verifying frontend behavior after tenant-auth changes:

1. tenant login from public My Bookings
2. tenant register from public My Bookings
3. tenant forgot-password from public paths
4. checkout auth dialogs
5. client portal bookings list/detail/cancel
6. client dashboard overview/history/packages/payment methods/profile/reviews/support
7. website-viewer login and My Bookings special pages
8. cross-tenant browser-state mismatch forces tenant-correct entry instead of silent reuse

## Related Backend Source Of Truth

Backend implementation details are documented in:

- `backend/docs/CLIENT_TENANT_AUTH_SOURCE_OF_TRUTH.md`
