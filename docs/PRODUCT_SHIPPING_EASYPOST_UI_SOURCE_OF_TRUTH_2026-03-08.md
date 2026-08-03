# Product + Shipping + EasyPost UI Source Of Truth

Updated: 2026-08-03
Scope: manager product workspace, delivery setup, order actions, checkout/client behavior.

## Product Commerce PV1

As of Monday, August 3, 2026, the public Product experience has a presentation-only upgrade with no cart, checkout, order, or inventory redesign.

Added manager-side Product content fields:
- `details_text`
- `specifications_json`
- `materials_care_text`
- `packaging_text`

Added Delivery Setup customer-facing policy fields:
- `customer_shipping_returns_policy_text`
- `customer_shipping_returns_policy_url`

Public Product page additions:
- business-currency price formatting
- `New` badge from `created_at`
- image lightbox
- `Share product`
- conditional accordions:
  - `Product details`
  - `Specifications`
  - `Materials & care`
  - `Packaging`
  - `Shipping & returns`
- mobile sticky purchase bar with effective price + `Add to basket`

## Product Commerce PV2-A

As of Monday, August 3, 2026, the manager UI supports draft-only Product option and variant preparation with no public selling activation.

Manager-only additions:
- Product row `More actions` → `Configure options`
- Product editor:
  - `Configure size and colour`
  - `Edit options and variants` when a draft already exists
- `ProductVariantConfigurationDialog.jsx`

Draft workflow contract:
- warning shown inside the dialog:
  - customers still see the current parent Product
  - variant selling will be enabled in PV2-B
- at most 2 option groups
- at most 20 values per option
- at most 100 generated combinations
- generic option names supported, with `Colour` and `Size` as the main presets

Draft variant fields:
- active / inactive
- SKU
- stock quantity
- optional price override
- optional gallery image

PV2-A exclusions:
- no public Product selectors
- no cart changes
- no checkout changes
- no Product Order changes
- no variant inventory decrement
- no customer-facing variant payload

Still excluded in PV1:
- `ProductOption`
- `ProductOptionValue`
- `ProductVariant`
- Colour/Size selectors
- variant stock
- variant order snapshots

## Commerce Copilot Note

As of Monday, July 27, 2026, the manager UI includes Schedulaa Commerce Copilot entry points, safe-write approval flow, and free-launch or paid-add-on billing states.

As of Wednesday, July 29, 2026, the manager UI also includes:
- Release D shipping-test workflow entry points
- Release E international expansion review entry points
- Release T3 Product checkout preview entry points
- Release T4 Seller estimate inside the Product checkout preview
- searchable country selection in the Commerce Copilot drawer
- explicit selected-country destination enablement review
- international buyer-notice preview inside the review step
- post-creation Commerce Copilot readiness grouping
- exact `focus=` deep links for API key, origin, destinations, package profiles, and Product shipping/customs sections

Currency display contract:
- Product selling prices use the tenant business-selling currency from Checkout Pro.
- `Customs declared-value currency` is shown separately in Product shipping/customs fields and is never the storefront selling currency.
- carrier-rate currency is provider-supplied and must not be relabeled under another code.
- no automatic FX conversion is supported between Product price, customs paperwork, and provider parcel rates.
- auto-refresh of readiness after the manager returns to the Copilot tab

Entry points:
- `ProductManagement.js`
  - `Create with AI`
  - `Fix with AI`
  - `Preview customer checkout`
- `EasyPostShippingSettingsPanel.js`
  - `Configure shipping with AI`
- `DigitalProductsWorkspace.js`
  - `Create digital product with AI`
- `ManagerProductOrdersView.js`
  - `Explain this order`

Phase 3 UX rules:
- text-only
- no audio controls
- plain-language questions
- separate draft, approval, and execution panels
- explicit `Approve selected changes` and `Apply approved changes` buttons
- free launch shows `Included during free launch`
- paid mode may show add-on activation, grace warning, or allowance exhaustion states
- existing billing upgrade handling remains the gating UX when access is unavailable

## 1) Manager UI Ownership Map

### Product workspace (source-of-truth entry)
- File: `frontend/src/pages/sections/management/ProductManagement.js`
- Responsibilities:
  - Product CRUD modal
  - optional `Product information` accordion with:
    - `Product details`
    - repeatable `Specifications`
    - `Materials & care`
    - `Packaging`
  - Low-stock panel
  - Product stock history access
  - Delivery setup entrypoint (drawer/panel)
  - Product-level delivery override controls (exception-only)
  - Physical shipping fields:
    - weight in grams
    - optional dimensions in millimetres
    - `ships separately`
  - Cross-border customs fields:
    - `Allow international shipping`
    - customs description
    - country of origin
    - HS/tariff code
    - declared customs value + currency
    - optional manufacturer / ECCN
  - shipping readiness badge from backend serializer
  - customs readiness badge from backend serializer
  - Product checkout preview dialog launch from:
    - row action
    - Product editor
    - Commerce Copilot completion handoff
  - query-driven focus support for:
    - `core_details`
    - `shipping_details`
    - `customs`

### Delivery setup panel
- File: `frontend/src/pages/sections/management/EasyPostShippingSettingsPanel.js`
- Responsibilities:
  - Tab 1 `Delivery Methods`: checkout policy controls (`enabled`, `allow_pickup`, `allow_shipping`, `allow_local_delivery`, labels)
  - Tab 1 also owns customer-facing Product-page policy text:
    - `Customer Shipping & Returns information`
    - `Customer Shipping & Returns URL`
  - Tab 2 `EasyPost Automation`: API key, enable toggle, test connection, origin settings, destination policy, package profiles, shipping-readiness checklist, address-verification toggle/status, selected-country allowlist, international verification mode, cross-border customs defaults, and US export filing controls when origin is US
  - Delivery Methods UX contract:
    - `Offer delivery options at checkout` is the master switch
    - child methods remain saved when the master is OFF, but are visually inactive
    - customer-facing label fields appear only for selected methods
    - `Customer checkout preview` always reflects the effective server-owned state
    - manual parcel shipping shows a warning that no live carrier rate is calculated
  - Help drawer now uses a tabbed onboarding guide:
    - `Schedulaa setup`
    - `EasyPost website setup`
    - `Test and go live`
    - `Troubleshooting`
  - Help drawer includes:
    - neutral product/package examples
    - EasyPost account verification guidance
    - support-request copy helpers
    - Test-versus-Production API key guidance
    - Wallet versus own-carrier guidance
    - platform-managed webhook wording
    - dynamic checklist using current server-confirmed Schedulaa state only
  - International duties notice/policy controls:
    - `Domestic shipping only`
    - `Sell to international customers — buyer may pay import charges`
    - optional additional note
    - optional terms URL
    - `Require import-charge acknowledgement`
  - Auto-load settings on mount
  - Help drawer for this panel
  - query-driven focus support for:
    - `api_key`
    - `origin`
    - `destinations`
    - `package_profiles`

Current deliberate limitation:
- Delivery setup does not directly launch Product checkout preview in this release.

Seller estimate UX contract:
- stays inside the existing manager-only Product checkout preview dialog
- remains collapsed by default while Customer view stays primary
- shows Product cost and estimated contribution only to managers
- offers manager actions such as `Add Product cost` when inputs are incomplete
- never exposes Product cost in customer-facing preview sections
- Managers use Product Management or Commerce Copilot to open the preview.

### Product orders + order detail actions
- File: `frontend/src/pages/sections/management/ManagerProductOrdersView.js`
- Responsibilities:
  - Orders table + detail drawer/modal
  - Fulfillment actions/timeline
  - EasyPost order-level actions (rates, buy label, shipment summary)
  - Pinned customer-paid shipping block
  - Rate comparison badges/messages
  - Override dialog for protected label-purchase cases
  - Label open/print when `label_url` exists

## 2) Client/Public UI Ownership Map

### Checkout
- File: `frontend/src/pages/client/Checkout.js`
- Responsibilities:
  - Reads delivery policy from `GET /public/<slug>/delivery-methods`
  - Treats `delivery_enabled`, `methods`, and `effective_method_codes` as authoritative
  - Reads allowed destination countries from the same backend payload
  - Reads the server-owned country catalog / destination options from the same backend payload
  - Reads origin country from the same backend payload
  - Renders allowed delivery methods only
  - Shows no-method-safe messaging instead of falling back to all methods
  - Clears a stale selected delivery method when it becomes unavailable
  - Auto-selects the method only when exactly one effective method exists
  - Uses backend destination countries for checkout country choices instead of hardcoded CA/US
  - When shipping address verification is enabled, requires explicit `Verify address & view shipping options` before live rates are requested
  - For corrected addresses, renders a correction choice UI:
    - `Use suggested address`
    - `Use original address`
    - `Edit address`
  - For non-CA/US destinations, can render a separate customer-confirmation step when automatic verification is unavailable:
    - `I confirm that this international delivery address is complete and correct.`
  - Clears verification token/result and shipping rates when any shipping address field changes
  - Stores the opaque `shipping_rate_quote_token`
  - Stores the selected `rate_id` separately from display-only rate text
  - Clears quote token, selected rate, rate list, and displayed shipping total when address/cart/delivery state changes invalidate the quote
  - Sends the accepted verification token with:
    - live rate requests
    - hosted checkout
    - direct product checkout
  - Shows an international-shipping notice when the accepted shipping country differs from tenant origin country
  - For cross-border rates, labels each option with `Import charges not included`
  - Requires import-charge acknowledgement before hosted/direct order creation when configured
  - Keeps address confirmation and import-charge acknowledgement as separate facts
  - If allowed methods are intentionally empty, shows message and no method options
  - Blocking destination/policy/readiness failures show a safe shipping-unavailable message and no rates
  - Manual fallback is reserved for genuine provider/no-usable-rate failures when tenant shipping policy already allows it

### Client Orders (My Bookings)
- File: `frontend/src/pages/client/ClientBookings.js`
- Responsibilities:
  - Orders tab list/detail
  - Customer-safe shipment/tracking display from order + `latest_shipment`

### Storefront list/detail
- Files:
  - `frontend/src/pages/client/ProductList.js`
  - `frontend/src/pages/client/ProductDetails.js`
  - `frontend/src/pages/client/MyBasket.js`

Public Product detail PV1 contract:
- keep the current two-column desktop layout
- show short description near title
- render structured accordions only when content exists
- render shipping&returns accordion from safe delivery facts plus manager-entered customer policy text/url
- never render Package Profile internals, EasyPost credentials, shipment IDs, customs HS/ECCN, or private warehouse notes
- mobile sticky purchase bar reuses the current Add-to-Basket handler and sold-out state

## 3) UX Contract (What each area decides)

- `Products -> Delivery setup -> Delivery Methods tab`:
  - Decides checkout delivery options shown to customer globally.
  - Master/child rule:
    - effective workspace methods = `enabled && allow_*`
- `Products -> Delivery setup -> EasyPost Automation tab`:
  - Decides shipping automation capabilities (rates/label ops), not checkout option visibility by itself.
- Product modal `Override delivery methods`:
  - Exception layer for this product only.
  - OFF => uses workspace defaults from Delivery setup.
  - ON => uses per-product override flags, but only as a narrowing intersection with workspace-effective methods.

Package Profile contract:

- Package Profiles are workspace-level reusable package definitions.
- One active profile may be the workspace default.
- Products do not each own a separate Package Profile under the current architecture.
- Live parcel math uses:
  - Product shipping weight
  - plus the selected/default Package Profile tare weight and dimensions

## 4) Commerce Copilot Completion UX

After hidden Product creation, the drawer must show:
- `Product created`
- Product name
- hidden visibility as an informational state
- grouped readiness:
  - `Needs attention`
  - `Warnings`
  - `Completed setup`
  - `Information`

The primary button is server-driven:
- `Answer remaining Product questions`
- `Fix N setup items`
- `Publish Product`
- `View Product`

Blocking items must provide:
- `Fix now`
- `How to fix`

`Fix now` behavior:
- opens the exact Product or Delivery Setup location in a new tab
- preserves the Copilot session in the original tab
- after the manager returns, the drawer refreshes readiness once and shows `Setup status refreshed.`

The guided setup dialog is blocker-only and must not reimplement the full Delivery Setup forms.

## 5) Troubleshooting UI Symptoms

### A) Delivery setup opens but empty values shown initially
- Check that settings panel auto-load effect is present in `EasyPostShippingSettingsPanel.js`.
- Confirm package profiles and readiness checklist are returned by `/inventory/shipping-settings`.

### B) Browser says CORS blocked on shipping settings
- Confirm frontend calls `/inventory/shipping-settings` (not `/company/shipping-settings`).

### C) Checkout shows all 3 methods unexpectedly
- Check returned payload from `/public/<slug>/delivery-methods`.
- If API returns empty intentionally, checkout should show no options (and warning message), not re-enable all.

### E) Shipping rates do not appear after address entry
- Confirm whether address verification is enabled in Delivery setup.
- If enabled, checkout will not request rates while the user is typing.
- Customer must click `Verify address & view shipping options`.
- If the address is corrected, the customer must accept either:
  - suggested address, or
  - original address
- Editing the address clears the verification state and current rates.

### D) Manager cannot use rates/buy label actions
- Confirm order `delivery_method` and EasyPost settings/key status.
- Check ManagerProductOrdersView action warnings for stale rate / disabled / missing key paths.
- Historical orders created before Accurate Parcel V2 may require:
  - package profile selection, or
  - one-time actual parcel entry

## 6) Primary UI Validation Checklist

### Manager
1. Open Products workspace.
2. Open Delivery setup.
3. Confirm Delivery Methods and EasyPost Automation are separated.
4. Confirm destination policy shows the intended preset:
   - `Domestic only`, or
   - `Canada and United States`, or
   - `Selected countries`
5. Confirm package profile CRUD/default package render.
6. Save policy and refresh panel; values persist.
7. When `Canada and United States` is selected, confirm customs defaults and US export filing controls appear only when origin is `US`.
8. Open Product modal and verify override helper text matches global-vs-exception behavior.
9. Verify physical shipping fields plus customs readiness badge render.

### Checkout
1. With shipping-only policy, only shipping appears.
2. Checkout country list comes from backend allowed destinations and is rendered with a searchable selector.
3. With verification enabled, rates are not requested during typing.
4. Customer must use `Verify address & view shipping options` before rates appear.
5. A corrected address prompts:
   - suggested address
   - original address
   - edit address
6. With domestic-only tenant, foreign country is unavailable.
7. With `Selected countries`, checkout shows only tenant-enabled destinations.
8. When best-effort or disabled international verification is configured, customer confirmation of the address is required before live rates are requested.
9. Cross-border totals include `Import duties and taxes: Not included`.
10. If acknowledgement is required, checkout blocks payment until the checkbox is selected.
11. With all methods disabled, method selector is effectively unavailable and warning is shown.
12. With provider outage (simulated), retry messaging is shown and checkout does not crash.

### Product Orders
1. Open order detail.
2. In EasyPost-related actions, refresh rates works when eligible/configured.
3. Historical orders without parcel snapshots require explicit package selection or one-time parcel entry.
4. Customer-paid shipping card remains pinned after rerating.
5. Higher-cost / different-service / different-carrier choices require explicit override confirmation and reason.
6. Buy label updates shipment summary and label actions.
7. International labels may expose safe customs document links when the carrier returns separate customs forms.
7. Manual fulfillment/tracking remains usable.
8. Delivery setup shows five lifecycle email toggles:
   - Email customer when order ships
   - Email customer when order is delivered
   - Email customer about delivery problems
   - Email managers about delivery problems
   - Email customer when pickup is ready
9. Timeline entries such as `Customer shipped email queued` remain human-readable and do not expose raw notification keys.

## 6A) Current UI Non-Goals

Not in scope yet:

- SMS
- multi-parcel runtime UI
- duties collection / landed-cost calculation
- automatic currency conversion
- manager address changes after payment
- returns / return labels
- destination countries beyond the tenant-enabled selected-country allowlist

### Client My Bookings
1. Orders tab lists order status fields.
2. For shipped orders with shipment data, tracking details and link display correctly.

## 6) Related Integration Files

- Dashboard composition:
  - `frontend/src/pages/sections/management/SecondNewManagementDashboard.js`
  - `frontend/src/pages/sections/Settings.js`
- Routing container:
  - `frontend/src/App.js`

## 7) Deploy/Crawl Note

- File: `frontend/scripts/run-react-snap.js`
- Purpose: prevent deploy failure on known crawl-only transient errors (`Stripe.js`, `Execution context destroyed`, `net::ERR_FAILED`) while still failing on real build errors.

---

## 8) Future Troubleshooting Strategy

When a product shipping issue is reported, inspect in this order:
1. `ProductManagement.js` (global policy + override setup)
2. `EasyPostShippingSettingsPanel.js` (policy persisted? automation configured?)
3. `Checkout.js` (policy application to customer method selector)
4. `ManagerProductOrdersView.js` (order-level automation actions and shipment render)
5. `ClientBookings.js` (customer-facing tracking/status rendering)
