# Tenant Website Build Source Of Truth

This document is the working source of truth for tenant-specific public website builds that are delivered through JSON templates in `backend/app/website_templates/`.

It is intentionally practical. Use it before creating or changing a tenant website template.

## Current tenant build

- Tenant/client reference: `ophoto.ch`
- Build type: photography / gallery-first public website
- Delivery method: importable JSON template
- Template key: `tenant-photography-ophoto-noir-v2`
- Backend template file:
  - `backend/app/website_templates/tenant-photography-ophoto-noir-v2.json`
- Frontend asset folder:
  - `frontend/public/website/tenant-photography-ophoto-editorial/`

## Implementation rules

1. Do not create new website renderer logic unless the template system cannot support the design.
2. Prefer reusing existing photography template sections and the existing photography asset pack.
3. Keep the nav lean. Category gallery pages can exist without all of them appearing in the top nav.
4. Use a dark editorial photography direction first; styling refinement can happen later.
5. Use local placeholder images from the tenant asset folder until client assets are provided.
6. Hero video can remain a documented placeholder source if a final free MP4 is not approved yet.

## Canonical template system source of truth

Primary backend source of truth:
- `backend/docs/website-builder.md`

Supporting frontend source of truth:
- `frontend/docs/website-nav-and-theme-refactor.md`

## Build brief for this tenant

The target site should feel close to the client reference:
- dark background
- elegant serif-heavy photography presentation
- large hero media
- simple navigation
- gallery-heavy inner pages
- minimal marketing language

This is not a generic service business site.

## Page map

Required pages in the template:
- `home`
- `about`
- `pricing`
- `contact`
- `gallery`
- `mariages`
- `maternite`
- `enfants`
- `publicite`
- `mode`
- `evenements`
- `traitement`

Top navigation should stay lean:
- Home
- À propos
- Galerie
- Prix
- Contact

Category pages should be reachable from:
- home category cards
- gallery page category cards
- direct route `?page=<slug>`

## Base template

Do not start from cabinet or orchid for structure.

Use this as the structural base:
- `backend/app/website_templates/photography-lumenstudio-pro-CONTACT-FIX.json`

Why:
- already supports photography-focused hero and gallery sections
- already supports dark page styling
- already supports contact, pricing, and image-led sections
- already imports cleanly through Website Templates

## Asset strategy

Current placeholder source:
- copied from `frontend/public/website/enterprise-photography-lumenstudio-v2/`
- isolated into:
  - `frontend/public/website/tenant-photography-ophoto-editorial/`

These are placeholders only.

When client media arrives:
- replace images in the tenant asset folder
- keep filenames stable if possible to avoid rewriting the template

## Hero media strategy

### Current build

Use local hero images immediately so the template is importable and previewable.

### Approved free-source pools for later hero video replacement

Use only free, legally reusable stock-video sources unless the client supplies media:
- Pexels Videos
  - `https://www.pexels.com/search/videos/photographer/`
  - `https://www.pexels.com/search/videos/fog%20forest/`
- Mixkit Free Stock Video
  - `https://mixkit.co/free-stock-video/`
- Pixabay Videos
  - `https://pixabay.com/videos/search/photographer/`

These are source pools, not final locked selections.

## Content direction

Use French-first copy.

Tone:
- artistic
- concise
- understated
- photography-first

Avoid:
- generic agency copy
- SaaS-style selling language
- heavy CTA density

## Gallery category intent

- `mariages`: wedding gallery
- `maternite`: maternity gallery
- `enfants`: children/family gallery
- `publicite`: commercial / advertising photography
- `mode`: fashion and makeup
- `evenements`: event photography
- `traitement`: retouching / photo treatment / editing work

## Navigation behavior

Prefer template-controlled navigation using:
- `header.nav_items`
- `nav_overrides.menu_source = "manual"`

This avoids overcrowding the top bar while still keeping all category pages in the site.

## Non-goals for this phase

- no custom renderer sections
- no new frontend routing
- no custom coded website interactions
- no custom domain work
- no bespoke gallery filtering UI

## Definition of done for phase 1

This tenant build phase is done when:
- the new JSON template exists
- the new asset folder exists
- the template imports through Website Templates
- the site has the required page set
- home, gallery, pricing, about, and contact pages are coherent
- category pages are wired
- placeholder hero media references are in place


## Current implementation update

- Gallery landing uses image-led category entry cards instead of plain icon rows.
- Individual category pages exist for: mariages, maternite, enfants, publicite, mode, evenements, traitement.
- Pricing page uses a modern dark premium card layout inside the existing `pricingTable` section via template styling only.
- No renderer changes were introduced for this tenant build.
