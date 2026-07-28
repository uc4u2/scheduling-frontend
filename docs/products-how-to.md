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

## Step 1: Create a product

1. Click **Add Product**.
2. Fill the fields:
   - Name
   - Price
   - Cost (optional)
   - SKU (optional)
3. Upload product images if available.
4. Click **Save**.

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

Commerce Copilot now checks existing active Package Profiles before proposing a new one when you confirm package dimensions and empty-package weight.

Use an existing package when:
- the saved package has the same dimensions
- the empty-package weight matches, or is close enough that you want to review it

Create a new package when:
- the box or mailer is materially different
- the empty-package weight is different enough that you do not want to reuse the saved profile

Important current behavior:
- Package Profiles are workspace-level defaults, not Product-specific package attachments
- if Copilot recommends a non-default saved package, changing it to the workspace default may affect future shipping quotes for other Products
