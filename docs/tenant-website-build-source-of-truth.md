---
title: Tenant Website Build Source of Truth
description: End-to-end playbook for creating, customizing, seeding, and publishing subscriber websites.
---

# Tenant Website Build Source of Truth

This document is the operational source of truth for building a Schedulaa tenant website from start to finish.

Use this when:
- creating a new profession template
- cloning and adapting an existing template
- seeding services and products for a live tenant
- attaching service/product images
- configuring public pages, reviews, popups, and CTA flows
- publishing the site and validating the result

This is not a low-level renderer reference. It is the working playbook.

Related technical docs:
- `frontend/docs/website-builder-how-to.md`
- `frontend/docs/website-templates-how-to.md`
- `frontend/docs/website-nav-and-theme-refactor.md`
- `backend/docs/website-builder.md`

## 1. System model

There are 4 layers.

1. Template JSON
- Source:
  - `backend/app/website_templates/*.json`
- Defines:
  - pages
  - sections
  - header/footer defaults
  - nav behavior
  - default copy and media references

2. Frontend website runtime
- Main files:
  - `frontend/src/components/website/RenderSections.js`
  - `frontend/src/components/website/SiteFrame.js`
  - `frontend/src/components/website/ThemeRuntimeProvider.js`
- Responsible for:
  - section rendering
  - public header/footer
  - page theme behavior
  - popups
  - special blocks

3. Visual Site Builder
- Main file:
  - `frontend/src/pages/sections/management/VisualSiteBuilder.js`
- Responsible for:
  - editing section content
  - adding/removing/reordering blocks
  - previewing pages
  - publishing

4. Live tenant data
- Services, products, images, website pages, and settings are stored in the live DB.
- Template changes do not retroactively rewrite already-imported tenant content.

That last point matters. If a tenant already imported a template, editing the template JSON later does not automatically fix that tenant’s saved page content.

## 2. Golden rule

Start with template JSON and existing supported frontend blocks.

Do not add backend logic unless there is no safe frontend/template-only path.

Preferred order:
1. Reuse an existing template
2. Reuse existing supported section blocks
3. Reuse existing live create/upload endpoints
4. Only then consider backend logic changes

## 3. Standard build flow

### Step 1: Gather tenant inputs

Minimum client questionnaire:
- business/public brand name
- real address
- phone
- email
- service area
- hours
- top 6 to 12 services
- top 6 to 12 products/packages if applicable
- review links
- hero images
- gallery/project images
- YouTube/video links if needed
- CTA priority:
  - book
  - request quote
  - contact
  - reviews

Recommended extra questions:
- target customer type
- budget floor if relevant
- premium/luxury vs accessible positioning
- main conversion goal
- financing offered or not
- languages
- custom domain

### Step 2: Choose the base template

Usually one of these approaches:
- clone the closest existing profession template
- adapt a premium template with similar sales flow

Examples:
- medspa -> quote/consult-heavy service business
- cabinetmaker -> project/quote-first premium home services

### Step 3: Create the template JSON

Create a new file in:
- `backend/app/website_templates/`

Typical fields to update:
- `key`
- `name`
- `description`
- `theme_key`
- `header`
- `footer`
- `pages`

Keep the page count controlled.

Recommended public page count:
- `6` to `10` visible pages

Hidden reserve pages are allowed if needed.

### Step 4: Build the page structure

Typical page set:
- `home`
- `services-classic`
- `products` if applicable
- `gallery`
- `projects`
- `process`
- `reviews`
- `quote-request`
- `contact`
- optional:
  - `about`
  - `faq`
  - `privacy-policy`
  - `terms-of-service`

Important:
- use `services-classic`, not `services`, when the runtime expects the classic services page
- products page slug should usually be:
  - `products`

### Step 5: Use supported blocks only

Preferred blocks we already support well:
- `heroCarousel`
- `videoStorySplit`
- `collectionShowcase`
- `serviceGrid`
- `serviceGridSmart`
- `featureZigzag`
- `featureZigzagModern`
- `gallery`
- `galleryCarousel`
- `videoGallery`
- `serviceHoverSlider`
- `stats`
- `reviewEditorialGrid`
- `bookingCtaBar`
- `mapEmbed`
- `faq`
- `contactForm`
- `popupCta`

Avoid inventing new backend concepts when a frontend block already solves the problem.

## 4. Service and product data flow

Template pages do not create live services or products.

The public services/products pages read from the live DB.

That means a new tenant website often needs 2 separate pieces of work:

1. template + page content
2. live service/product seeding

### Live create endpoints

Services:
- `POST /booking/services`

Products:
- `POST /inventory/products`

Images:
- `POST /booking/services/<service_id>/images`
- `POST /inventory/products/<product_id>/images`

### Standard seeding flow

1. Create the service records
2. Create the product records
3. Upload and attach images
4. Verify public services page
5. Verify public products page

### Important caution

Never assume the website template JSON alone is enough for `services-classic` or `products`.

If the live tenant has no services/products, the page shell can be perfect while the actual catalog is empty.

## 5. Media flow

### Template media

Template images usually come from:
- `frontend/public/website/<template-family>/...`
- or existing stable public asset paths already used by the repo

When using local client files:
1. copy them into a stable frontend public folder
2. reference them from the template JSON
3. commit both the asset and the JSON update

### Live service/product images

Service and product images should be uploaded through the live endpoints above.

Do not assume a website hero image automatically becomes a service/product image.

### Preferred matching

Services:
- kitchen consultation -> kitchen-focused image
- closet planning -> closet-focused image
- vanity planning -> bathroom image
- built-ins -> wall unit / shelves / office image

Products:
- map to deliverable/package visuals
- not generic logos or unrelated hero art

## 6. Navigation rules

The nav has 2 modes conceptually:
- page-driven
- manual/curated

Public runtime must respect `menu_source`.

Important behavior:
- if menu source is `manual`, `header.nav_items` wins
- otherwise pages should drive the menu

Do not mix these rules or stale manual nav items will override the intended live page menu.

For special tabs:
- disable jobs tab if tenant does not need it:
  - `show_jobs_tab: false`
- products tab should only be enabled when a real products page exists:
  - `show_products_tab: true`
  - `products_page_slug: "products"`
  - `products_tab_target: "page"`

## 7. CTA rules

There are several CTA-capable blocks. Keep them explicit.

### `bookingCtaBar`

This block may contain either field shape:
- `title`, `ctaText`, `ctaLink`
- or older `text`, `buttonText`, `buttonLink`

The renderer must support both. Otherwise stale saved data falls back to generic copy like:
- `Ready to book?`
- `See availability`

### `popupCta`

This block is:
- a normal editable builder block
- rendered inline in builder
- rendered as a popup overlay on the live/public page

Rules:
- off by default unless intentionally seeded otherwise
- should not block builder editing
- CTA-only mode is the safe default
- link to an existing page such as:
  - `?page=quote-request`
  - `?page=services-classic`
  - `?page=contact`

## 8. Reviews and proof blocks

Preferred review block:
- `reviewEditorialGrid`

Use it when the site needs:
- a premium testimonial/editorial layout
- multiple reviews with images
- a dedicated reviews page

Recommended pattern:
- homepage review block:
  - shorter, high-impact proof
- reviews page:
  - separate content
  - more entries
  - different names and copy from homepage

Do not duplicate the same review content across pages unless there is a reason.

## 9. Maps

Preferred map block:
- `mapEmbed`

For richer contact sections, use the split layout with:
- title
- eyebrow
- body
- CTA
- detail blocks
- map on the right

Important renderer option:
- `matchHeight`

Rules:
- `matchHeight: true`
  - map stretches to text height
- `matchHeight: false`
  - keeps a wider, manual-style map ratio

If auto-added maps look too square, the fix is usually:
- set `matchHeight: false`
- and raise `height`

## 10. Common profession patterns

### Medspa / beauty
- service-first
- reviews
- booking CTA
- gallery
- before/after feel

### Cabinetmaker / millwork
- quote-first
- kitchens / closets / built-ins
- project showcases
- process page
- gallery page
- products as packages

### Automotive / detailing
- packages
- gallery/video
- booking CTA
- stronger offers/promo popups

## 11. Builder and preview rules

The builder preview is not identical to the published page in every case, but it should be close.

Rules learned from past fixes:
- popup blocks must preview inline in builder, not as blocking top-layer modals
- menu clicks inside the canvas preview should open the page in the builder canvas, not navigate away
- builder preview and public nav must follow the same `menu_source` contract

When adding a new block type:
1. add its starter content in:
  - `frontend/src/components/website/BuilderBlockTemplates.js`
2. add schema fields in:
  - `frontend/src/components/website/schemas.js`
  - `frontend/src/components/website/schemas/index.js`
3. add rendering in:
  - `frontend/src/components/website/RenderSections.js`
4. add preview tile support in:
  - `frontend/src/pages/sections/management/VisualSiteBuilder.js`
5. add a thumbnail in:
  - `frontend/public/website-builder/section-thumbs/`

## 12. Standard validation checklist

### Template validation
- JSON parses
- `git diff --check` passes
- page slugs are unique
- nav links point to real pages
- no empty CTA links

### Frontend validation
- targeted eslint on changed files
- check builder preview
- check public page behavior
- verify no broken image paths

### Live validation
- services page loads
- products page loads
- category filters work
- service/product images display
- popup CTA opens/closes correctly
- map layout looks correct
- reviews page differs from homepage when intended

## 13. Common failure modes

### 1. Template updated but live page still wrong
Cause:
- tenant already imported template
- saved page content is stale

Fix:
- update the saved page content in builder
- or do a targeted live data repair

### 2. Services page empty but template looks fine
Cause:
- no live services in DB

Fix:
- seed live services

### 3. Products page empty but template looks fine
Cause:
- no live products in DB

Fix:
- seed live products

### 4. `See availability` fallback appears
Cause:
- `bookingCtaBar` data shape mismatch

Fix:
- ensure renderer supports both:
  - `ctaText` / `ctaLink`
  - `buttonText` / `buttonLink`

### 5. Manual nav hides published pages
Cause:
- stale `header.nav_items`
- menu source mismatch

Fix:
- respect `menu_source`

### 6. Popup blocks make builder unusable
Cause:
- builder renders the popup like production

Fix:
- render inline in builder
- render overlay only on public site

### 7. All services view differs from category view
Cause:
- bootstrap payload and filtered endpoint return different data freshness or shape

Fix:
- inspect bootstrap vs direct endpoint payload
- confirm image arrays are present in both

## 14. Tenant launch checklist

Before calling a tenant website ready:

1. template imported
2. homepage reviewed
3. services page populated
4. products page populated if applicable
5. gallery/projects page reviewed
6. reviews page reviewed
7. process page reviewed
8. quote/contact path tested
9. popup behavior tested if enabled
10. nav reviewed on desktop and mobile
11. custom domain reviewed if applicable
12. publish confirmed

## 15. Recommended workflow for future tenant builds

Use this order every time:

1. gather tenant inputs
2. choose closest base template
3. clone template JSON
4. build the public page structure
5. wire nav correctly
6. seed homepage hero/media
7. add review/proof sections
8. add map/contact/quote flow
9. seed live services
10. seed live products if needed
11. upload live images
12. validate in builder
13. validate on public page
14. publish
15. document any tenant-specific special rules

## 16. If a new template is requested later

The standard request should include:
- profession
- real address
- preferred page list
- quote/book/contact priority
- whether products page is needed
- whether reviews page is needed
- whether popup CTA is needed
- images/video source
- service/product list

Then the implementation should follow this playbook instead of starting from zero.
