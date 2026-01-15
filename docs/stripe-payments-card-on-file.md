title: Stripe Payments & Card on File
description: Configure checkout mode, card-on-file, tax, and branding in Checkout Pro.

# Stripe Payments & Card on File

This page controls how clients pay at checkout and how tax is applied.

## Where to find it
- Manager Dashboard -> Settings -> Checkout Pro & Payments

## Checkout mode
Choose how clients pay:
- **Offline booking**: No online payment. Collect outside Stripe.
- **Card on file**: Client saves a card so you can charge later or apply no-show fees.
- **Pay during checkout**: Client pays immediately.

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

## Tax setup (Stripe Tax)
Use the **Open Tax Help** button for the step-by-step Stripe Tax checklist:
- Enable automatic tax.
- Set origin address.
- Add registrations.

## Buttons
- **Save Stripe Settings**: saves the checkout configuration.
- **Open Tax Help**: opens the tax checklist.
- **Open Stripe Dashboard**: opens your Stripe account for setup and reconciliation.

## Tips
- If you use card on file, make sure staff know how to charge from Payments.
- If prices include tax, Stripe backs tax out automatically at checkout.
