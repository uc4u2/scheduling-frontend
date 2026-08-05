title: Stripe Payments & Card on File
description: Configure checkout mode, card-on-file, tax, and branding in Checkout Pro.

# Stripe Payments & Card on File

Manager-facing help only.

For the canonical backend technical contract covering hosted setup-mode flow,
PendingCheckout, webhook-primary finalization, saved-card route security, and
later Manager off-session charges, refer to:

- `backend/docs/VERIFIED_CARD_BOOKING_SOURCE_OF_TRUTH.md`

This page controls how clients pay for appointments and whether Products can be
sold online.

Since **Wednesday, August 5, 2026**, Product online payments use a dedicated
company capability:

- `enable_product_payments`

This is separate from:

- `enable_stripe_payments` for appointment pay-now
- `allow_card_on_file` for appointment setup-mode / later capture

## Where to find it
- Manager Dashboard -> Settings -> Checkout Pro & Payments

## Appointment payment policy
Choose how clients pay when booking appointments:
- **No online payment**: Collect outside Stripe.
- **Save card on file**: Client saves a card so you can charge later or apply no-show fees.
- **Pay during booking Checkout**: Client pays immediately.

Card on File uses hosted Stripe Checkout in secure setup mode. The booking is
confirmed only after Schedulaa verifies the completed Stripe setup flow on the
server.

Clients must now actively accept the card-saving authorization checkbox before
the hosted Stripe flow starts. Schedulaa records the policy snapshot shown at
acceptance time and later marks the card verified only after Stripe setup
verification succeeds.

## Product payment settings

Products are configured separately from appointment policy.

- **Accept online Product payments**: Products are always paid during Checkout.
- Product checkout never uses card-on-file / setup mode.
- Turning Product payments on does not force appointments to switch away from
  card on file.
- Turning appointment pay-now on does not force Product payments on.

Compatible example:

- Appointments: Save card on file
- Products: Paid during Checkout

## Stripe publishable key
This is managed by Schedulaa when Stripe is connected. It is read-only.

## Booking hold (minutes)
How long a selected time is reserved while a client is checking out.

## Tax & Localization
- **Prices include tax**: On = tax already included in listed prices. Off = tax added on top.
- **Tax country**: Country used for tax rules.
- **Tax region code**: Optional region override if Stripe needs a specific code.
- **Display currency**: Currency shown to clients.
- **Charge currency mode**: How charges are sent to Stripe (platform-fixed or region-based).
- **Logo URL**: Optional logo used in checkout.

Quebec note:
- Legacy Quebec tax-country storage may still appear as `QC`.
- That commerce currency context still resolves to `CAD`.
- Offline and card-on-file amount-only flows do not rely on Stripe automatic tax to reinterpret the amount later.

## Tax setup (Stripe Tax)
Use the **Open Tax Help** button for the step-by-step Stripe Tax checklist:
- Enable automatic tax.
- Set origin address.
- Add registrations.

## Buttons
- **Save Stripe Settings**: saves the checkout configuration.
- **Open Tax Help**: opens the tax checklist.
- **Open Stripe Dashboard**: opens your Stripe account for setup and reconciliation.
- **Preview booking payment**: opens a read-only Manager preview of the current booking payment behavior for offline, card-on-file, or pay-now mode.

## Tips
- If you use card on file, make sure staff know how to charge from Payments.
- Product checkout does not reuse card-on-file mode. Product purchases always
  collect payment during Checkout.
- If prices include tax, Stripe backs tax out automatically at checkout.
- Saved-card charges remain amount-only. Automatic tax is not added later when a Manager enters a saved-card charge amount.
- Use **Review amount and tax handling** in the saved-card charge dialog to confirm the entered amount, currency, and manual-tax rule before charging.
- Guest/public users cannot list previously saved cards by entering an email address.
- A verified saved card means Stripe successfully saved a reusable card for later off-session use. It does not guarantee future funds or prevent future issuer declines.
- Client and Manager saved-card views now show `Verified`, `Expiring soon`, `Expired`, `Update required`, or `No card` based on live Stripe expiry details plus Schedulaa's local verified-card status.
- Managers cannot start a saved-card charge when the saved card is already expired or marked update required.
- Client 360 now includes a **Request card update** action that emails the client a secure, time-limited Stripe-hosted update-card link.
- No migration was required for this split because Schedulaa already stores the
  Stripe-payments and card-on-file capabilities independently.
- A later additive migration introduced `enable_product_payments` and backfilled
  it from `enable_stripe_payments` so existing Product-selling tenants did not
  lose online Product checkout unexpectedly.

Legacy note:
- Deposit-related backend branches may still exist internally, but Deposit is
  not currently Manager-configurable or advertised as a supported appointment
  payment mode.
