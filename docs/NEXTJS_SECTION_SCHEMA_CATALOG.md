# Next.js Section Schema Catalog

Last updated: August 11, 2026

## Purpose

This document is the source of truth for the editable Next.js website system.

It aligns four layers:

1. The current 10 production Next.js themes
2. The existing Classic Builder block/schema system
3. The canonical semantic module contract stored in `WebsitePage.content.modules`
4. The Next.js Builder left-panel editing model

This document does **not** change Classic behavior. Classic remains on its raw block system.

## Final Product Goal

For `renderer_engine = nextjs`:

- tenant picks one of the approved Next.js themes
- Website Content opens the Next.js iframe canvas
- user clicks content in the canvas
- the exact left editor opens
- user can add sections from a semantic catalog
- user can edit media, text, CTA, navigation, pages, SEO, and safe style controls
- user can switch themes without losing content or media

Theme switching changes only presentation. It must never rewrite tenant content.

## Current 10 Production Themes

1. `modern-gradient`
2. `eldora-dark`
3. `motion-editorial`
4. `finwise`
5. `iron-ember`
6. `clear-clinic`
7. `harbor-line`
8. `still-bloom`
9. `black-letter`
10. `circuit-north`

## Theme Pattern Inventory

These are visual patterns, not separate content models.

### Universal patterns found across the 10 themes

- Hero
- Services
- Reviews
- Feature Story / editorial story block
- Process / steps
- FAQ
- Contact Form
- Map
- CTA / Booking CTA
- Gallery or Portfolio rail
- Product listing / product detail page presentation
- Jobs listing / job detail page presentation

### Common but not universal patterns

- Pricing
- Trust / logo rail
- Hours / location composition
- Contact intro block
- Before / After
- Portfolio emphasis

### Theme-specific visual strengths worth borrowing

- `modern-gradient`: balanced generic marketing section language
- `eldora-dark`: strong dark trust rail and moody content cards
- `motion-editorial`: testimonial rail, split hours/location editorial rhythm
- `finwise`: split FAQ and clean contact composition
- `iron-ember`: strong pricing/service presentation
- `clear-clinic`: clinical trust hierarchy, polished contact/service balance
- `harbor-line`: cinematic gallery and editorial portfolio rhythm
- `still-bloom`: soft wellness spacing and calm image composition
- `black-letter`: typography-first hero and authoritative process rhythm
- `circuit-north`: grid-driven precision layout and structured proof rhythm

## Legacy Builder Audit

The Classic system is currently powered by:

- [BuilderBlockTemplates.js](/home/uc4u2/work/scheduler2/frontend/src/components/website/BuilderBlockTemplates.js:1)
- [schemas.js](/home/uc4u2/work/scheduler2/frontend/src/components/website/schemas.js:1)
- [RenderSections.js](/home/uc4u2/work/scheduler2/frontend/src/components/website/RenderSections.js:1)
- [VisualSiteBuilder.js](/home/uc4u2/work/scheduler2/frontend/src/pages/sections/management/VisualSiteBuilder.js:1)

### Legacy block inventory summary

Covered or mappable today:

- `hero`, `heroCarousel`, `heroSplit` -> `hero`
- `serviceGrid`, `serviceHoverSlider`, `serviceGridSmart` -> `services`
- `testimonials`, `testimonialCarousel`, `testimonialTiles`, `reviewEditorialGrid` -> `reviews`
- `faq` -> `faq`
- `gallery`, `galleryCarousel` -> `gallery`
- `mapEmbed` -> `map`
- `contact`, `contactForm` -> `contactForm`
- `richText`, `textFree` -> `richText`
- `featureZigzag`, `featureZigzagModern`, `featurePillars`, `featureStories` -> `featureStory`
- `pricingTable`, `pricingTableModern` -> `pricing`
- `team`, `teamGrid` -> `team`
- `stats`, `teamMetrics` -> `stats`
- `logoCloud`, `logoCarousel` -> `trustRail`
- `processSteps` -> `process`
- `bookingCtaBar` -> `bookingCta`
- `popupCta` -> global feature, not a page module
- `video` -> `video`
- `collectionShowcase` -> closest to `portfolio` / `gallery` / `productShowcase`

Classic-only or layout-specific:

- `pageStyle`
- `footer`
- some highly visual carousel-only variants

Deprecation candidates later:

- redundant testimonial/gallery/service layout blocks once semantic parity is complete

## Master Next.js Section Catalog

### Core universal modules

- `hero`
- `richText`
- `services`
- `reviews`
- `faq`
- `gallery`
- `portfolio`
- `map`
- `contactForm`
- `contactIntro`
- `contactDetails`
- `cta`
- `bookingCta`
- `team`
- `stats`
- `trustRail`
- `pricing`
- `process`
- `featureStory`
- `hoursLocation`
- `locations`
- `serviceAreas`
- `beforeAfter`
- `video`
- `proofBand`
- `reviewSummary`

### Dynamic business modules

- `services`
- `reviews`
- `products` via dynamic page ownership, plus optional `productShowcase` config
- `jobs` via dynamic page ownership

### Profession / advanced modules

- `programs`
- `schedule`
- `results`
- `classes`
- `memberships`
- `treatments`
- `providers`
- `visitProcess`
- `practiceAreas`
- `attorneys`
- `listings`
- `propertyGallery`
- `inquiry`
- `priceMenu`

These should not be forced into `services[]` if the data model is materially different.

## Canonical Schema Per Module

These are canonical editor shapes, not theme-specific structures.

### `hero`

- `eyebrow`
- `heading`
- `subheading`
- `image`
- `imageAlt`
- `secondaryImages[]`
- `primaryCta.label`
- `primaryCta.href`
- `secondaryCta.label`
- `secondaryCta.href`

### `richText`

- `heading`
- `intro`
- `body`
- `image`
- `imageAlt`
- `primaryCta`

### `services`

Operational source:
- canonical Service records

Marketing/editor fields:
- `heading`
- `intro`
- optional presentational `items[]` fallback for pure marketing pages
- future presentation settings:
  - category/filter
  - count
  - CTA label/link override

### `reviews`

Operational source:
- published Review records

Marketing/editor fields:
- `heading`
- `intro`
- `items[]` fallback only when canonical reviews are absent
  - `author`
  - `role`
  - `quote`
  - `rating`
  - `avatar`
  - `avatarAlt`

### `faq`

- `heading`
- `intro`
- `items[]`
  - `title` = question
  - `body` = answer

### `gallery`

- `heading`
- `intro`
- `items[]`
  - `image`
  - `imageAlt`
  - `caption`
  - `href`

### `portfolio`

- `heading`
- `intro`
- `items[]`
  - `image`
  - `imageAlt`
  - `title`
  - `body`
  - `href`

### `map`

- `heading`
- `intro`
- `query`
- `address`
- `embedUrl`
- `zoom`

### `contactForm`

- `heading`
- `intro`
- `formKey`

### `contactIntro`

- `heading`
- `intro`
- `body`
- `image`
- `imageAlt`

### `contactDetails`

- `heading`
- `intro`
- `items[]`
  - `title`
  - `body`
  - `href`
  - `label`

### `cta` / `bookingCta`

- `heading`
- `body`
- `backgroundImage`
- `primaryCta.label`
- `primaryCta.href`

### `team`

- `heading`
- `intro`
- `items[]`
  - `title` = name
  - `role`
  - `body` = bio
  - `image`
  - `imageAlt`
  - future `links[]`

### `stats`

- `heading`
- `intro`
- `items[]`
  - `title`
  - `value`
  - `body`

### `trustRail`

- `heading`
- `items[]`
  - `title`
  - `body`
  - `image`
  - `imageAlt`
  - `href`

### `pricing`

- `heading`
- `intro`
- `items[]`
  - `title`
  - `price`
  - `body`
  - `features[]`
  - `href`

### `process`

- `heading`
- `intro`
- `items[]`
  - `title`
  - `body`
  - optional `image`

### `featureStory`

- `eyebrow`
- `heading`
- `intro`
- `body`
- `image`
- `imageAlt`
- `secondaryImage`
- `secondaryImageAlt`
- `primaryCta`

### `hoursLocation`

- `heading`
- `intro`
- `items[]`
  - `title`
  - `body`
  - optional `location`

### `locations`

- `heading`
- `intro`
- `items[]`
  - `title`
  - `body`
  - `location`
  - `href`

### `serviceAreas`

- `heading`
- `intro`
- `items[]`
  - `title`
  - `body`

### `beforeAfter`

- `heading`
- `intro`
- `items[]`
  - `title`
  - `body`
  - `beforeImage`
  - `afterImage`
  - `beforeLabel`
  - `afterLabel`

### `video`

- `heading`
- `body`
- `videoUrl`
- `posterImage`

### `proofBand`

- `heading`
- `intro`
- `items[]`
  - `title`
  - `body`
  - `value`

### `reviewSummary`

- `heading`
- `intro`
- `items[]`
  - `title`
  - `body`
  - `value`

## Builder Left-Panel Contract

Every Next.js semantic module should support:

- text fields
- media fields through the existing Schedulaa media picker
- repeater add/remove
- safe reorder
- duplicate module
- hide/show module
- delete module
- field-level focus via `fieldPath`

Expected flow:

Next.js canvas  
-> click slot or field  
-> `schedulaa:website-slot-select`  
-> `moduleId` + `fieldPath`  
-> exact left-side editor control focuses

## Add Section Catalog

### ESSENTIAL

- Hero
- Text / About
- CTA
- Booking CTA

### BUSINESS

- Services
- Team
- Pricing
- Stats
- Process
- Feature Story

### TRUST

- Reviews
- FAQ
- Trust Logos
- Proof / Results
- Review Summary

### MEDIA

- Gallery
- Portfolio
- Video
- Before & After

### LOCATION / CONTACT

- Contact Intro
- Contact Details
- Contact Form
- Map
- Hours / Location
- Locations
- Service Areas

### PROFESSION

- Programs
- Schedule
- Results
- Classes
- Memberships
- Treatments
- Providers
- Visit Process
- Practice Areas
- Attorneys
- Listings
- Property Gallery
- Inquiry
- Price Menu

Add Section filtering should consider:

- page kind
- theme support
- profession capability

## Page Composition Rules

### Home

Required:
- `hero`
- one of `services` or another primary business module

Recommended:
- `reviews`
- `faq`
- `featureStory`
- `trustRail`
- `contactForm` or `bookingCta`

Optional:
- `gallery`
- `portfolio`
- `beforeAfter`
- `pricing`
- `stats`
- `process`

### About

Required:
- `richText` or `featureStory`

Recommended:
- `team`
- `reviews`
- `stats`

### Services

Required:
- `services`

Recommended:
- `pricing`
- `faq`
- `reviews`
- `process`

### Service Detail

Required:
- detail hero from canonical service
- one of `richText`, `featureStory`, or `process`

Recommended:
- `reviews`
- `faq`
- `beforeAfter`
- `team`

### Products

Required:
- dynamic products listing

Recommended:
- `featureStory`
- `reviews`
- `faq`

### Contact

Required:
- `contactForm`

Recommended:
- `contactIntro`
- `contactDetails`
- `map`
- `hoursLocation`
- `locations`

### Reviews

Required:
- `reviews`

Recommended:
- `reviewSummary`
- `stats`
- `trustRail`

### Portfolio / Projects

Required:
- `portfolio`

Recommended:
- `gallery`
- `reviews`
- `cta`

### Generic

Required:
- at least one of `richText`, `featureStory`, `gallery`, `faq`, `contactForm`

## Dynamic Business Module Ownership

These should not duplicate operational records inside `WebsitePage`.

### Services

Canonical source:
- Service records

Website module owns:
- heading
- intro
- filters/presentation
- CTA

### Products

Canonical source:
- Product records

Website module owns:
- heading
- intro
- filter/category/presentation
- CTA

### Reviews

Canonical source:
- published reviews

Website module owns:
- heading
- intro
- max items
- fallback testimonials if needed

### Jobs

Canonical source:
- Job openings

Website module owns:
- heading
- intro
- CTA / application framing

## 10-Theme Coverage Matrix

Legend:

- `NATIVE`: theme has a direct, intentional visual implementation
- `ADAPTED`: theme can render it through a close visual analogue
- `MISSING`: theme currently lacks a distinct renderer
- `N/A`: not appropriate for the current theme/page mix

| Module | modern | eldora | motion | finwise | iron | clinic | harbor | bloom | black | circuit |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| hero | NATIVE | NATIVE | NATIVE | NATIVE | NATIVE | NATIVE | NATIVE | NATIVE | NATIVE | NATIVE |
| richText | NATIVE | ADAPTED | ADAPTED | ADAPTED | ADAPTED | ADAPTED | ADAPTED | ADAPTED | ADAPTED | ADAPTED |
| services | NATIVE | NATIVE | NATIVE | NATIVE | NATIVE | NATIVE | NATIVE | NATIVE | NATIVE | NATIVE |
| reviews | NATIVE | NATIVE | NATIVE | NATIVE | NATIVE | NATIVE | NATIVE | NATIVE | NATIVE | NATIVE |
| faq | NATIVE | NATIVE | NATIVE | NATIVE | NATIVE | NATIVE | NATIVE | NATIVE | NATIVE | NATIVE |
| gallery | NATIVE | NATIVE | NATIVE | NATIVE | NATIVE | NATIVE | NATIVE | NATIVE | NATIVE | NATIVE |
| portfolio | NATIVE | NATIVE | NATIVE | NATIVE | NATIVE | NATIVE | NATIVE | NATIVE | NATIVE | NATIVE |
| map | NATIVE | NATIVE | NATIVE | NATIVE | NATIVE | NATIVE | NATIVE | NATIVE | NATIVE | NATIVE |
| contactForm | NATIVE | NATIVE | NATIVE | NATIVE | NATIVE | NATIVE | NATIVE | NATIVE | NATIVE | NATIVE |
| contactIntro | NATIVE | NATIVE | NATIVE | NATIVE | NATIVE | NATIVE | NATIVE | NATIVE | NATIVE | NATIVE |
| contactDetails | ADAPTED | ADAPTED | ADAPTED | ADAPTED | ADAPTED | ADAPTED | ADAPTED | ADAPTED | ADAPTED | ADAPTED |
| cta / bookingCta | NATIVE | NATIVE | NATIVE | NATIVE | NATIVE | NATIVE | NATIVE | NATIVE | NATIVE | NATIVE |
| team | ADAPTED | ADAPTED | MISSING | ADAPTED | ADAPTED | ADAPTED | ADAPTED | ADAPTED | ADAPTED | ADAPTED |
| stats | ADAPTED | ADAPTED | ADAPTED | ADAPTED | ADAPTED | ADAPTED | ADAPTED | ADAPTED | ADAPTED | ADAPTED |
| trustRail | ADAPTED | NATIVE | MISSING | NATIVE | MISSING | MISSING | MISSING | MISSING | MISSING | MISSING |
| pricing | MISSING | NATIVE | NATIVE | NATIVE | NATIVE | NATIVE | NATIVE | NATIVE | NATIVE | NATIVE |
| process | NATIVE | NATIVE | NATIVE | NATIVE | NATIVE | NATIVE | NATIVE | NATIVE | NATIVE | NATIVE |
| featureStory | NATIVE | NATIVE | NATIVE | NATIVE | NATIVE | NATIVE | NATIVE | NATIVE | NATIVE | NATIVE |
| hoursLocation | ADAPTED | ADAPTED | NATIVE | ADAPTED | ADAPTED | ADAPTED | ADAPTED | ADAPTED | ADAPTED | ADAPTED |
| serviceAreas | ADAPTED | ADAPTED | MISSING | ADAPTED | MISSING | MISSING | MISSING | MISSING | MISSING | MISSING |
| beforeAfter | ADAPTED | ADAPTED | ADAPTED | ADAPTED | ADAPTED | ADAPTED | NATIVE | ADAPTED | ADAPTED | NATIVE |
| video | MISSING | MISSING | MISSING | MISSING | MISSING | MISSING | MISSING | MISSING | MISSING | MISSING |

Interpretation:

- the universal/core module set is viable across all 10 themes
- some modules are still rendered through generic/adapted cards rather than strong theme-native patterns
- `video`, richer `team`, richer `trustRail`, and some location/service-area patterns still need theme-specific implementations

## Media Readiness Matrix

Current audited state:

| Surface | Builder field exists | WebsitePage preserves | Render model exposes | Themes consume | Missing-media behavior |
| --- | --- | --- | --- | --- | --- |
| Hero image | Yes | Now yes | Partially improved | Yes | Generally graceful |
| Services image | Yes | Yes | Yes | Yes | Mostly graceful |
| Gallery image | Yes | Yes | Yes | Yes | Graceful in most themes |
| Portfolio image | Yes | Yes | Yes | Yes | Graceful in most themes |
| Team image | Partial | Now yes | Not fully surfaced everywhere | Often adapted | Needs more theme-native treatment |
| Feature Story image | Yes | Yes | Partially improved | Yes | Graceful |
| Before/After image | Partial | Now yes | Not yet fully specialized | Adapted/native in some themes | Needs stronger dedicated rendering |
| Review avatar | Partial | Now yes | Not yet widely surfaced | Mostly ignored today | Needs theme support |
| CTA background image | Partial | Now yes | Not consistently consumed | Mostly ignored today | Needs theme support |
| Product image | Canonical | Yes | Yes | Yes | Graceful |
| Service detail image | Canonical | Yes | Yes | Yes | Graceful |

This is the main explanation for “themes look empty”:

- some media fields existed only as shallow `imageUrl`
- richer media was dropped in normalization
- some themes only render a subset of media-aware module types

## Theme Switching Safety Rules

Switching themes must never:

- delete modules
- rewrite module content
- replace edited images
- reinstall starter content
- restore source-theme fixture media

Theme switching changes only the renderer and theme overrides.

## Starter Media Strategy

Starter media belongs to profession starter content packs, not themes.

Rules:

- starter hero/gallery/team/media may be seeded by content pack
- tenant can replace it through the existing media picker
- theme switch must preserve edited tenant media
- a theme must never depend on lab/demo asset paths for required content

## Immediate Implementation Priorities

1. Complete `fieldPath` click coverage for media and text targets across all 10 themes
2. Finish richer theme-native renderers for:
   - `team`
   - `trustRail`
   - `hoursLocation`
   - `beforeAfter`
   - `video`
3. Wire starter media through canonical content-pack content, not theme code
4. Expand production Builder QA for:
   - add section
   - image replacement
   - reorder/hide/show
   - publish
   - theme switch after edits

## Non-Goals

- no new rendering architecture
- no Classic changes
- no Batch 3 themes during this phase
- no profession-lab runtime dependency
