---
title: Products How-To
description: Manage products and inventory.
---

# Products How-To

## Where to click

Manager Portal → Services & Bookings → Products

## Create or improve with AI

Commerce Copilot can now help in two distinct ways:

1. Create a Product with AI.
2. Improve storefront content for an existing Product.
3. Reuse an existing Package Profile when the shipping box already matches.

Manager entry points:
- Product list toolbar: **Improve content with AI**
- Product row action: **Improve content**
- Product editor action: **Generate storefront content**
- Copilot completion card after hidden Product creation: **Improve storefront content**
- Product row action: **Preview customer checkout**
- Product editor action: **Preview customer checkout**
- Copilot completion card: **Explain customer checkout**

## Step 1: Create a product

1. Click **Add Product**.
2. Fill the fields:
   - Name

## Currency clarification

- Product selling price uses your business selling currency from **Checkout Pro & Payments**.
- Product online checkout availability uses the dedicated `enable_product_payments`
  capability from **Checkout Pro & Payments**.
- Appointment pay-now and card-on-file settings do not enable Product
  checkout by themselves.
- Legacy Quebec checkout storage still resolves to `CAD`.
- `Customs declared-value currency` is separate and only affects international customs paperwork.
   - Price
   - Cost (optional)
   - SKU (optional)
3. Upload product images if available.
4. Click **Save**.

## Product information (PV1)

The Product editor now includes a lightweight **Product information** section for optional structured storefront content.

Available fields:
- `Product details`
- `Specifications`
- `Materials & care`
- `Packaging`

Rules:
- all fields are optional
- plain text only
- the short `Description` still appears near the Product title on the public Product page
- `Product details` appears lower on the public page and does not replace the short description
- `Specifications` uses label/value rows and is meant for customer-facing marketing/spec data
- no Size/Colour variant support exists in PV1

## Draft and active Product options and variants

Products now support both:

- manager-only draft configuration
- server-authoritative active Variant selling for supported physical Products

Manager entry points:
- Product row **More actions** → `Configure options`
- Product editor → expand **Product options and variants**

Current activation rules:
- runtime flag `PRODUCT_VARIANT_SELLING_ENABLED` must be on
- the Product must be active and physical
- linked Materials & Supplies inventory must be removed first
- the Variant configuration must pass server readiness

Manager workflow:
1. Open **Configure options** from the Product row, or expand **Product options and variants** inside the Product editor.
2. Step 1: add valid option names and values.
3. Step 2: review generated combinations and set SKU, stock, optional price, and optional image overrides.
4. Step 3: review readiness, save the draft, and activate when the checklist is clear.

Editor rules:
- `Product options and variants` is now a first-class collapsible Product section, not a footer action
- the section sits after Product price / SKU / inventory and before Product weight and dimensions
- the collapsed header shows compact authoritative summary text such as `None configured`, `Draft · Colour and Size · 6 combinations`, or `Active · 5 available · 1 sold out`
- draft or active Variant Products expand the section by default
- no phantom option/value rows are counted as configuration
- counts use only valid nonblank values
- unsaved edits show `Unsaved changes`
- server activation readiness is authoritative only after Save
- when edits are unsaved, the dialog shows `Save your changes to refresh the activation check.`
- linked Materials & Supplies inventory is shown once inside the activation checklist, not repeated across the dialog

Add Product behavior:
- the inline section is available before the Product exists
- local Option / Value drafting can begin immediately
- the panel explains: `Variant configuration will be saved after the Product is created.`
- Product gallery upload stays unavailable until the Product has been created
- the panel explains: `Save the Product before uploading Variant images.`

Save sequence:
1. Save the main Product form.
2. When a local Variant draft exists, save Variant configuration using the new Product ID.
3. Reload authoritative readiness and Variant summary.
4. If Product creation succeeds but Variant save fails, keep the editor open and show that Product save succeeded while Variant configuration still needs attention.

Image workflow:
- each value may use an existing Product gallery image or upload a new Product image directly from the dialog
- uploading from the dialog creates a normal `ProductImage` owned by the Product, refreshes the gallery, and auto-assigns the uploaded image to the current value
- removing a value image clears only the Variant configuration reference; it does not delete the gallery image
- Variant image overrides are optional and sit above value-image inheritance

Image inheritance:
1. Variant-specific image override
2. selected Colour / Color value image
3. first selected Option Value image
4. parent Product gallery fallback

Visual choices:
- Colour / Color style options may show a warning when a value has no image
- this is a recommendation for clearer customer presentation, not a hard activation blocker
- text-first options such as Size can still use the parent Product gallery image

When Variant selling is active:
- customers must choose a valid available option combination before adding to basket
- the selected Variant price, SKU, image, and stock become authoritative
- cart identity becomes `product_id + variant_id`
- Orders store immutable Variant snapshots

When the runtime flag is off:
- managers can still edit drafts
- activation is unavailable
- already-active Variant Products show as temporarily unavailable to customers
- Schedulaa does not silently fall back to selling the parent Product

Current limits:
- up to 2 option groups
- up to 20 values per option
- up to 100 generated combinations

Each draft variant can store:
- active / inactive state
- SKU
- stock quantity
- optional price override
- optional gallery image

Current boundaries:
- digital Products cannot use Product options in this release
- linked Materials & Supplies inventory blocks non-zero variant stock until the inventory link is removed
- shipping and customs still come from the parent Product
- no per-Variant cost, weight, dimensions, Package Profile, or customs fields exist

### Customer storefront behavior

Active Variant Products now show safe customer selectors on the public Product page.

Payment-policy boundary:
- Product purchases always pay during Checkout when online Product payments are on.
- Product purchases never use setup mode or card-on-file.
- Older frontend clients fall back conservatively:
  1. `product_checkout.enabled` when present
  2. `enable_product_payments` when present
  3. `enable_stripe_payments` only for older backend compatibility

Selector rules:
- one or two option groups
- generic option names supported
- impossible combinations are disabled
- inactive combinations are unavailable
- sold-out combinations stay visible but unavailable
- a single sole legitimate value may auto-select
- multiple legitimate values are not auto-selected

Add to basket rules:
- no add is allowed until a complete valid Variant is selected
- the selected Variant updates the displayed price, SKU, image, and availability
- the sticky mobile Add to basket bar uses the same selection and add handler

Product list behavior:
- active Variant Products show `Choose options`
- different active Variant prices show `From CAD X`
- equal active Variant prices show the exact price
- simple Products keep the existing quick-add flow

### Orders and refunds

Variant purchases now store immutable order snapshots for:
- Variant label
- Variant SKU
- selected option summary
- Variant image

Refund/restock contract:
- tracked Variant stock restores only to the exact purchased Variant
- parent Product stock does not change for Variant lines
- duplicate manual refund replays do not restore stock twice
- simple Product refunds keep the existing parent-Product behavior

## Product checkout preview and Seller Estimate

Managers can now preview a Product checkout line without creating an Order or reserving stock.

Entry points:
- Product row action: **Preview customer checkout**
- Product editor action: **Preview customer checkout**

Preview rules:
- Simple Products keep the current quantity + delivery workflow
- active Variant Products require a complete Variant selection before preview
- draft Variants may be previewed by managers only and are clearly marked as draft-only
- the server returns the authoritative Product line, including Variant label, Variant SKU, selected options, price source, image source, delivery, tax state, and total inputs

Preview labels:
- `Draft Variant preview — customers cannot purchase this Variant yet.`
- `Active selling preview`
- `Variant selling is temporarily disabled by runtime configuration.` when the environment kill switch is off

Preview image order:
1. Variant image override
2. selected Colour / Color value image
3. first selected Option Value image
4. Product gallery fallback

Preview side-effect guarantee:
- no Product Order
- no payment session
- no stock decrement
- no stock reservation
- no email

Seller Estimate rules:
- revenue uses the authoritative Product or Variant selling price from preview
- Product cost uses the parent Product cost
- no Variant-specific cost exists
- shipping cost is included only when preview has a known shipping amount
- duties, import taxes, packaging, labour, overhead, and payment-processing fees are not invented

Estimate states:
- `Known estimate`
- `Partial estimate`
- `Estimate unavailable`

## Product payment policy

Product checkout now uses a Product-specific payment capability instead of
reusing the appointment payment mode.

Rules:
- Products are always paid during Checkout
- Products never use card-on-file / setup mode
- appointment card-on-file policy does not block Product selling
- a business may keep both appointment card-on-file and Product online payments
  enabled at the same time

Manager settings:
- **Appointment payment policy** controls appointment booking only
- **Accept online Product payments** controls Product sales only

Customer checkout behavior:
- Product-only carts read `product_checkout` from the public payments policy
- legacy fallback treats older policy responses conservatively:
  - Product checkout enabled only when `enable_stripe_payments = true`
  - effective Product mode = `pay`
  - card-on-file unsupported for Products

Current mixed-cart boundary:
- appointments and Products must still be completed separately
- Products are never silently downgraded to card-on-file capture

Partial estimate examples:
- Product cost missing
- shipping rate not selected
- pickup with no carrier shipping cost
- payment-processing fees not included
- international duties/import taxes not included

### Specifications format

Each specification row contains:
- `Label`
- `Value`

Example:
- `Material` → `Sterling silver`
- `Made in` → `Canada`

Blank rows are ignored when saving.

### Selling currency

Products do not have their own separate selling-currency field.

Current rule:
- the numeric Product price is interpreted through the tenant business-selling currency from **Settings → Checkout Pro & Payments**
- the same business currency is used for Products, Services, checkout defaults, and Finance defaults
- changing the business currency changes the current catalog currency context, but does **not** convert existing numeric Product amounts

Example:
- if a Product price is `50.00`
- and the business currency is `CAD`
- customers see `CAD 50.00`
- if the business currency is later changed to `USD`, the same numeric Product amount becomes `USD 50.00`

Use **Manage currency settings** from the Product editor when you need to change the tenant business currency.

## Step 2: Track inventory

1. Toggle **Track stock**.
2. Set **Quantity on hand**.
3. Save changes.

## Step 3: Archive or reactivate

1. Open the product row.
2. Toggle **Active**.
3. Save changes.

## Step 4: Improve storefront content with AI

Use this when the Product is technically valid but the storefront copy is incomplete.

Commerce Copilot can currently suggest:
- Description
- Category
- SKU
- Slug
- Meta title
- Meta description

Commerce Copilot cannot currently update:
- Price
- Inventory
- Weight
- Dimensions
- Shipping settings
- Product visibility

Review flow:
1. Open **Improve content with AI**.
2. Review **Current** versus **Suggested** content.
3. Use all suggestions, select specific fields, or edit suggestions.
4. Approve the selected storefront content.
5. Apply the approved content.

If the Product is already visible, Copilot warns that approved content changes will update the live storefront.

## Package Profiles and package reuse

Package Profiles are reusable shipping boxes or mailers managed in **Delivery setup**.

Important current behavior:

- Package Profiles are workspace-level reusable package definitions, not Product-specific package attachments
- one active Package Profile may be the workspace default
- Products usually reuse the workspace default package unless you deliberately switch to another supported package in a shipping workflow
- parcel shipping weight is calculated from:
  - Product weight
  - plus Package Profile empty-package tare weight

Commerce Copilot now checks existing active Package Profiles before proposing a new one when you confirm package dimensions and empty-package weight.

Use an existing package when:
- the saved package has the same dimensions
- the empty-package weight matches, or is close enough that you want to review it

Create a new package when:
- the box or mailer is materially different
- the empty-package weight is different enough that you do not want to reuse the saved profile

If Copilot recommends a non-default saved package, changing it to the workspace default may affect future shipping quotes for other Products.

## Delivery Methods and checkout choices

Delivery Setup now separates:

- whether customers can choose delivery at checkout
- which delivery methods are available
- how parcel shipping is fulfilled

Manager-facing rules:

- `Offer delivery options at checkout` is the master switch
- `Pickup`, `Ship the order`, and `Local delivery` are child method choices
- `How parcel shipping is handled` changes only parcel-rate and label automation:
  - `Manual fulfillment`
  - `EasyPost rates and labels`

EasyPost does not decide whether methods appear at checkout. It only automates parcel shipping after `Ship the order` is already available.

## Customer Shipping & Returns information

Delivery Setup now includes a compact customer-facing section:
- `Customer Shipping & Returns information`
- `Customer Shipping & Returns URL`

This content appears on public Product pages inside the **Shipping & returns** accordion.

Use it for:
- shipping timelines you are comfortable publishing
- return/exchange guidance
- links to customer-facing policy pages

Do not put these there:
- API keys
- carrier credentials
- Package Profile dimensions
- internal warehouse notes
- private fulfillment instructions

## Preview customer checkout

Managers can now open a read-only Product checkout preview before publishing or sharing a Product.

What it shows:
- Product subtotal in the tenant business selling currency
- current delivery-method availability
- Pickup / Local Delivery / Manual Shipping / EasyPost behavior under the current setup
- Stripe tax status for checkout
- international buyer notice when import charges are not included
- a manager-only Seller estimate with Product cost and estimated label cost only when those values are safely known

What it does not do:
- create a Product Order
- reserve inventory
- create a Stripe Checkout Session
- buy a label
- estimate duties or convert currencies

Important:
- EasyPost test rates are preview-only and may change at real checkout
- provider-rate currency must match checkout currency or the rate is shown as unavailable
- Delivery Setup does not open this preview yet in the current release
- Seller estimate excludes Stripe fees, packaging, duties, returns, labour, overhead, and advertising
- customers never see the stored Product cost

## International expansion review

Commerce Copilot can now review a physical Product for selected foreign destinations before you enable those destinations.

The review shows:
- common Product-level blockers once
- destination-specific blockers separately
- `Configuration ready`, `Needs setup`, `Not enabled`, `Blocked`, or `Not applicable`

`Configuration ready` means the Product and Schedulaa settings pass the current supported checks. It does not guarantee carrier rates, legal eligibility, or Customs acceptance.

From the review you can:
- open the Product
- open Delivery Setup
- help finish only unresolved international facts
- test shipping to a selected country
- prepare selected destination changes for approval

### Customs declared-value currency

`Customs declared-value currency` is separate from the Product selling price currency.

Use it only for:
- customs declarations
- shipment paperwork

It does not change:
- storefront price
- checkout charge currency
- Finance defaults

## Public Product page

The public Product detail page now supports:
- business-currency price formatting
- `New` badge for recently created active Products
- image lightbox
- `Share product`
- structured accordions that appear only when content exists:
  - `Product details`
  - `Specifications`
  - `Materials & care`
  - `Packaging`
  - `Shipping & returns`
- mobile sticky purchase bar with price and `Add to basket`

For active Variant Products, the public page additionally supports:
- safe option selectors
- authoritative selected Variant price and SKU
- Variant image switching
- unavailable/sold-out combination states

Still excluded from this phase:
- per-Variant shipping
- per-Variant customs
- per-Variant cost
- AI Variant write actions

## LIVE_DEFERRED QA checklist

The following checks are post-deployment QA, not local blockers:

1. Set `PRODUCT_VARIANT_SELLING_ENABLED=false`.
2. Deploy backend.
3. Run backend migrations.
4. Deploy frontend.
5. Verify existing simple Product purchase flow.
6. Create one controlled physical Product with Size and Colour Variants.
7. Use a low test price such as `CAD 1.00`.
8. Enable `PRODUCT_VARIANT_SELLING_ENABLED=true`.
9. Activate only the controlled Product.
10. Complete one real card purchase for a selected Variant.
11. Verify Stripe Connect routing.
12. Verify Variant Order snapshots.
13. Verify exact Variant stock decrement.
14. Process a partial refund.
15. Verify exact Variant stock restoration.
16. Observe webhook replay/idempotency behavior.

## Commerce Copilot Variant review

Commerce Copilot can now review Product Variants in a read-only way for managers.

Quick actions:
- `Review Product variants`
- `Explain activation requirements`
- `Preview selected Variant`
- `Configure Product options and variants`

What Copilot can do:
- summarize whether the Product has Product options / Variants
- explain whether Variant selling is active, draft-only, or blocked
- explain server-owned activation blockers and warnings
- inspect one selected Variant
- preview authoritative checkout totals for a selected Variant
- explain the authoritative Seller Estimate for a selected Variant
- open:
  - Variant configuration
  - Product checkout preview
  - Product editor

What Copilot cannot do:
- activate Variant selling
- pause Variant selling
- create or edit options, values, or variants
- change Variant SKU, Price, stock, or image assignments
- refund or modify Product Orders

Variant matching behavior:
- Copilot may understand phrases such as `Black / Mini` or `Mini Black`
- if more than one configured Variant matches, Copilot asks you to choose
- Copilot never silently selects the first matching Variant

Preview / estimate rules:
- checkout preview and Seller Estimate remain server-authoritative
- Copilot does not invent taxes, shipping, margin, duties, or Stripe fees
- Product cost appears only inside the manager Seller Estimate view
17. Test pause after adding the Variant to cart.
18. Test runtime kill switch after cart creation.
19. Verify Client and Manager order emails.
20. Disable or archive the controlled Product after QA.
