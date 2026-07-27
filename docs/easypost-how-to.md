# EasyPost Help Guide

Updated: July 27, 2026

## Purpose

This guide explains EasyPost features in the three manager areas:

1. `Settings` -> shipping settings
2. `Advanced Management` -> EasyPost panel
3. `Product Orders` -> order-level shipping automation

Manual shipping remains fully supported as fallback.

## 1) Settings: EasyPost Connection

Use this section to enable and validate account-level EasyPost integration.

### Main fields

- `Enable EasyPost automation`: turns EasyPost features on/off for the company.
- `EasyPost API key`: your EasyPost key (stored securely).
- `Test connection`: checks the API key against EasyPost.
- `Origin country/address`: required for live rates.
- `Destination policy`: supports:
  - `Domestic only`
  - `Canada and United States`
  - `Selected countries`
- `Package Profiles`: required for Accurate Parcel V2 live shipping.
- `Verify customer shipping addresses before showing live rates`: enables the CA/US verification flow.
- `International address verification`: controls non-CA/US handling:
  - `Best effort`
  - `Required`
  - `Disabled`
- Server-authoritative rate quotes: automatic in Phase 3; the browser does not author the shipping amount.
 - Cross-border customs defaults and, for US-origin tenants, export-filing configuration: required before CA/US cross-border rates can run.

### Expected behavior

- If disabled, checkout and fulfillment continue with manual shipping.
- If enabled but invalid key, automated rates/label purchase will not run.
- Connection state should show success/failure after test.
- A default active package profile is required before live EasyPost rates can run.
- Blocking readiness or destination-policy failures do not claim manual-shipping fallback to the customer.
- When address verification is enabled, shipping customers must verify the delivery address before live rates are shown.

### Safe setup order

1. Save API key.
2. Run `Test connection`.
3. Confirm origin address is complete.
4. Add a default package profile with dimensions and tare weight.
5. Keep address verification enabled unless there is a deliberate operational reason to disable it.
6. Confirm shipping readiness shows `Ready` before using order automation.
7. If enabling international shipping beyond domestic-only, complete the customs defaults and product customs data before using international shipping.
8. If using `Selected countries`, choose only the countries you actually intend to serve; checkout only exposes the tenant-enabled allowlist.

## 2) Advanced Management: EasyPost Overview

Use this area as the operational control surface and quick access point.

### What managers should do here

- Verify EasyPost is enabled and connected.
- Review readiness before handling shipping orders.
- Verify the default package profile exists.
- Confirm destination policy matches the intended market.
- Access product-order shipping automation workflows.

### Important note

If no product orders exist yet, order-level EasyPost actions in Product Orders will not be visible because they appear per order.

## 3) Product Orders: EasyPost Automation on an Order

Use this section when fulfilling a specific shipping order.

### Supported flow (shipping orders)

1. Open order detail.
2. If the order was created before Accurate Parcel V2 and has no parcel snapshot, choose:
   - default package profile, or
   - one-time actual package dimensions + weight
3. Run `Refresh rates`.
4. Select a shipping rate.
5. Click `Buy label`.
6. Review purchased shipment summary.
7. Open/print label from `label_url`.

### Customer checkout flow with address verification enabled

1. Customer selects shipping and enters the delivery address.
2. Customer clicks `Verify address & view shipping options`.
3. If the address is verified, live rates are requested immediately.
4. If EasyPost returns a corrected address, the customer chooses:
   - `Use suggested address`
   - `Use original address`
   - `Edit address`
5. Only after accepted verification does checkout proceed to live shipping rates.
6. Checkout stores a short-lived quote token plus the selected rate id.
7. If the customer edits the cart, delivery method, or address, the quote is cleared and fresh rates are required.

### Customer checkout flow for CA/US cross-border shipping

1. Customer verifies the shipping address as usual.
2. Checkout shows the standard international notice that duties, taxes, brokerage, or other fees may be collected separately.
3. Schedulaa requests server-authoritative international rates only if:
   - destination policy allows the country
   - parcel readiness is complete
   - customs readiness is complete
4. If customs readiness is incomplete, the customer sees a safe message that international shipping is unavailable for one or more items.
5. Each cross-border rate is labeled `Import charges not included`.
6. If the tenant requires acknowledgement, the customer must check the import-charge acknowledgement box before hosted checkout or direct buy can continue.

### Customer checkout flow for worldwide selected destinations

1. Customer sees only tenant-enabled destination countries in the searchable checkout country selector.
2. For non-CA/US countries, Schedulaa still performs basic server validation.
3. If provider verification succeeds, the standard verified/corrected workflow continues.
4. If provider verification is unavailable and the tenant uses `Best effort`, checkout requires:
   - explicit customer confirmation of the address, and
   - a separate import-charge acknowledgement when cross-border duties notice applies
5. If the tenant uses `Required`, checkout blocks international rates until provider verification succeeds.
6. If the tenant uses `Disabled`, checkout skips provider verification and still requires explicit customer confirmation before rates.
7. If no carrier services are available to an enabled destination, the customer sees a safe `No shipping services are currently available to this destination.` message and may choose another enabled country.

### International duties policy

Current supported policy:

- `buyer_pays_on_import`

Meaning:

- Schedulaa charges products, shipping, and current checkout tax only
- import duties, import taxes, brokerage, and carrier customs fees are not included
- the carrier or destination authority may collect those amounts separately

Manager controls:

- `Domestic shipping only`
- `Sell to international customers — buyer may pay import charges`
- optional additional note
- optional terms URL
- required acknowledgement toggle

### Lifecycle email settings

Delivery Setup now also includes tenant toggles for:

- `Email customer when order ships`
- `Email customer when order is delivered`
- `Email customer about delivery problems`
- `Email managers about delivery problems`
- `Email customer when pickup is ready`

Important behavior:

- buying a label alone does not send a shipped email
- manual fulfillment updates and EasyPost webhook updates are automatically deduplicated
- pickup-ready emails are only for pickup orders
- SMS is not supported

### What is saved after successful label buy

- Shipment record in `product_order_shipment`
- Carrier, service, tracking code, tracking URL, label URL
- ProductOrder tracking fields auto-populated
- Timeline events for shipping updates
- Comparison/audit facts showing how the purchased label compares to the customer-paid shipping rate
- For international labels, safe customs document metadata when the carrier returns separate customs forms

### Fallback behavior

- Manual tracking + fulfillment actions remain available.
- If rate is stale/unavailable, refresh rates and retry.
- If EasyPost is disabled or not configured, continue manual workflow.
- If the destination or shipping data is blocked by policy/readiness, fix the setup or parcel data first; do not expect automatic fallback.
- Cross-border rerates and label purchase use the immutable order origin, accepted destination, parcel snapshot, and customs snapshot. Product edits after payment do not change the international shipment payload.

## Delivery Method Rules

- `shipping`: EasyPost automation eligible.
- `pickup`: not eligible (manual pickup flow only).
- Address verification is now available for EasyPost live shipping and is tenant-controlled in Delivery setup.
- CA/US cross-border customs workflow is now enabled for shipping when tenant and product customs readiness are complete.
- Worldwide selected destinations reuse the same immutable origin, destination, parcel, customs, duties, and server-authoritative quote contracts.
- SMS and multi-parcel runtime are still not enabled in this phase.
- Duties / landed-cost calculation, automatic currency conversion, address changes after payment, returns, return labels, shipment insurance, and tenant origins outside Canada or the United States are not enabled in this phase.
- Duties are not collected by Schedulaa in this phase, and no landed-cost total is calculated.
- `local_delivery`: keep manual flow unless explicitly enabled by future policy.

## Troubleshooting

## A) Browser shows CORS error on EasyPost settings

Most common cause is wrong API path, not origin policy. Current valid paths:

- `GET/POST/PATCH /inventory/shipping-settings`
- `POST /inventory/shipping-settings/test-connection`

## B) No rates returned

Check:

1. EasyPost enabled
2. Valid API key and successful test connection
3. Order delivery method is `shipping`
4. Shipping address is complete and valid
5. If address verification is enabled, customer has completed verification/acceptance
6. Default package profile exists
7. Products in the order have shipping weight
8. For CA/US cross-border shipping, products also have customs description, country of origin, HS code, and declared customs value/currency
9. For US-origin cross-border shipping, export filing settings are configured explicitly

## B2) Customer keeps seeing “verify address” instead of rates

- Expected when the customer edited the shipping address after verification.
- Any address change clears:
  - verification token
  - selected shipping rate
  - current live rate list
- Customer must verify again before shipping rates can be shown.

## C) Buy label fails with stale rate

Refresh rates and select a fresh rate before retrying purchase.

## C2) Buy label asks for override confirmation

Expected when the current label choice is:

- same service but more expensive
- different service
- different carrier
- a legacy order without authoritative quote integrity

For higher-cost labels, the manager must confirm the business absorbs the difference.
Schedulaa does not charge the customer again and does not mutate the paid Stripe total.

## C3) Historical order cannot refresh rates

If the order predates the new parcel snapshot foundation, the manager must enter package data once before rates can be refreshed.

## D) No EasyPost controls in Product Orders

Controls appear in order detail, and only for eligible delivery method/orders.

## Security and Operations Notes

- Keep API keys in environment/configured secure storage only.
- Do not share EasyPost keys in screenshots or chat.
- Webhook secrets must match environment mode.
- Manual shipping fallback should always remain usable during provider outages.
- Generic fallback parcel dimensions are no longer used for new live shipping requests.
# EasyPost / Shipping Setup How-To

Updated: 2026-07-27

## Commerce Copilot Phase 1

Managers may now open Commerce Copilot from Delivery Setup and Product screens to:
- review shipping readiness
- prepare an international setup draft
- explain what is missing

Phase 1 does not apply shipping changes automatically.

The Copilot may:
- ask for missing package or customs facts
- explain destination policy or address-verification choices in plain language
- preview future actions

The Copilot may not:
- save shipping-setting mutations through AI
- buy labels
- change paid orders
- enable unsupported DDP or landed-cost features
