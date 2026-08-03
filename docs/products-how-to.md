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

## Draft Product options and variants (PV2-A)

Products now support a manager-only draft configuration workflow for future variants.

Manager entry points:
- Product row **More actions** → `Configure options`
- Product editor → `Configure size and colour`
- Product editor → `Edit options and variants` when a draft already exists

Current PV2-A rules:
- draft only
- customers still see the current parent Product
- no public Colour/Size selector exists yet
- no cart or checkout change exists yet
- no ProductOrder variant snapshot exists yet

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
- variant selling is not enabled until the next checkout phase

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

## Public Product page (PV1)

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

PV1 does not add:
- Size selector
- Colour selector
- variants
- variant pricing
- variant stock
