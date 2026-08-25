# Legacy website system reverse-engineering

Audit date: 2026-08-15. Mode: read-only. This is a source map of the existing
Classic legacy-react system, not an implementation proposal.

## A. Git/source state

| Repository | committed local HEAD | branch / cached origin | uncommitted files |
| --- | --- | --- | --- |
| frontend | c227ff18df468dc1b24697961430b569955a6747 | main, ahead 6 | Builder/media/API/semantic WIP |
| backend | 56949c867c3cb63e61bb227014f2eef9c8e4824e | main, ahead 10 | routes/render-model/content-pack/starter WIP |
| tenant-web-next | 37315cdf2fe0dc2f8780ba417b74f514add5930c | feature/semantic-modules-v1, ahead 40 | Iron Ember/helpers/QA WIP |

Origins are uc4u2/scheduling-frontend, uc4u2/scheduling-application and
uc4u2/scheduling-tenant-web-next. No remote fetch was made; remote freshness is
UNKNOWN. No code, database, environment, deployment, or production data was
changed.

## B. Confirmed Classic architecture

Classic is JSON-driven React. WebsitePage.content.sections is an ordered array
of {id,type,props,sx}; CompanyWebsiteSetting holds published and draft global
settings. The Builder edits this payload. RenderSections splits pageStyle,
popup, and flow sections, then resolves a renderer by type
(frontend/src/components/website/RenderSections.js:7178-7314).

The Classic factory registry is NEW_BLOCKS
(BuilderBlockTemplates.js:1+), inspector schemas are SCHEMA_REGISTRY
(schemas.js:1-1285), and public JSX is RenderSections. A factory establishes
defaults; a schema establishes Inspector controls; the renderer establishes
visual output.

## C. Template lifecycle

1. Gallery calls GET /api/website/templates (frontend/src/utils/api.js:932-964;
   backend/app/routes.py:113747-113914).
2. Apply calls POST /api/website/templates/import (api.js:954-964).
3. _apply_template_to_company copies every template page to WebsitePage,
   updating an existing slug+locale or creating a page. Explicit replace deletes
   pages; duplicate slugs return 409 (routes.py:113446-113576).
4. Import saves normalized header/footer/navigation/theme metadata to settings
   draft. Explicit publish marks the setting live.
5. Classic public rendering reads content.sections. Services, products,
   reviews, jobs, availability, checkout and accounts are not template copies.

Runtime gallery eligibility comes from _tpl_dirs plus catalog deduplication
(routes.py:113179+,113747+), not merely JSON filenames. Historical New folder
and CONTACT-FIX copies are therefore not automatically distinct selectable
templates.

## D. Classic block inventory

All 92 JSON files beneath backend/app/website_templates, excluding .bak files,
were parsed read-only. Their complete discovered type vocabulary is:

availabilityGrid, banner, blogList, bookingCtaBar, collectionShowcase, contact,
contactCard, contactForm, cta, cultureValues, directoryCards, faq, featureList,
featurePillars, featureShowcaseSlider, featureZigzagModern, features, footer,
gallery, galleryCarousel, hero, heroCarousel, heroSplit, image-grid,
industrialBeforeAfter, industrialEmergencyBand, industrialFeatureSplit,
industrialGalleryWall, industrialImageStory, industrialMembershipPlans,
industrialProcessTimeline, industrialProjectShowcase, industrialServiceArea,
industrialServiceSelector, industrialStatsRail, industrialTrustMarquee,
logoBelt, logoCarousel, logoCloud, mapEmbed, pageStyle, popupCta, pricingTable,
processSteps, reviewEditorialGrid, rich-text, richText, schedulerEmbed,
serviceGrid, serviceGridSmart, serviceHoverSlider, stats, teamGrid,
teamMetrics, testimonials, videoGallery, videoStorySplit.

Factories: hero, pricingTableModern, text, gallery, photoGallery,
galleryCarousel, heroCarousel, heroSplit, videoStorySplit, collectionShowcase,
richText, featureZigzagModern, discoverStory, logoCloud, trustedBrandsRail,
featureShowcaseSlider, workshopsCommissions, cta, teamGrid, bookingCtaBar,
blogList, logoCarousel, contactFormEditorialSplit, testimonialCarousel,
featurePillars, testimonialTiles, reviewEditorialGrid, faq, faqModern, stats,
serviceGrid, serviceHoverSlider, contact, mapEmbed, contactForm, popupCta,
footer.

Schema registry adds serviceGridSmart, featureStories, featureZigzag,
teamMetrics, cultureValues, processSteps, video, videoGallery, testimonials,
textFree and pageStyle. Hero carousel persists slides, autoplay and interval
(BuilderBlockTemplates.js:197-220); gallery carousel persists images, autoplay
and interval (:185-195). Pricing repeaters have ribbon/name/price/features/CTA/
featured (schemas.js:1025-1047); testimonial repeaters have avatar/quote/author
(:1003-1017). See backend/reports/legacy_website_system_inventory.json.

## E. Canvas and Inspector contract

Builder state is editing, selectedBlock, and safeSections(editing). Canvas and
Sections-panel selection resolve the actual block index
(VisualSiteBuilder.js:7411-7466). blockType resolves to SCHEMA_REGISTRY
(:6246-6264). SchemaInspector receives block props and its onChange invokes
setBlockPropsAll (:9438-9448). Helpers clone the sections array and replace
props (:5584-5620). Autosave is debounced 800 ms and off by default; it
serializes the page and calls wb.updatePage (:5549-5581).

Classic Add Section uses ADD_BLOCK_ORDER plus NEW_BLOCKS defaults and inserts
the block into the same content.sections array
(VisualSiteBuilder.js:7470-7529). Reorder, duplicate, delete and hide/show
operate on that section array; duplicate creates an independent clone. The
nearby semantic module branch is Next.js behavior and not Classic behavior.

## F. Page, publish and checkpoint source

WebsitePage owns company, slug/path/locale/title/content, layout, menu/order,
published/home flags and page SEO fields (backend/app/models.py:13913-14020).
CompanyWebsiteSetting owns settings/settings_draft, theme, domain/live/build and
homepage metadata (models.py:13676-13802). Pages APIs are routes.py:111197-111471
and frontend calls are api.js:1621-1643. Draft/published settings and publish
helpers are routes.py:6577-6650. Checkpoints snapshot both pages and settings
(routes.py:6675-6745) into website_checkpoint.snapshot_json
(models.py:25000-25036), with APIs at routes.py:112964-113121.

## G. Media pipeline and R2 result

Frontend ImageField supports paste URL, preview/error, drag/drop, image input,
clear and Media Library selection; the selected media.url is stored in the
schema field (BuilderInspectorParts.js:210-329). MediaLibraryDialog lists via
wb.mediaList, uploads, and returns a selection (MediaLibraryDialog.js:1-95).
The UI says JPG/PNG/WebP, max 5MB (BuilderInspectorParts.js:230-236).

| route | confirmed behavior |
| --- | --- |
| GET /api/website/media | manager/support-company scoped pagination, stable URL and variants serialization (routes.py:114377-114402) |
| POST /api/website/media | multipart file or files, ownership check, calls _save_upload (:114405-114452) |
| POST /api/website/media/upload | compatibility alias (:114456-114467) |
| DELETE /api/website/media/:id | ownership then object/local best-effort delete and DB delete (:114470-11500) |
| GET /api/website/media/file/:company/:stored_name | public local response or signed object redirect (:114503-114558) |

_save_upload secure-filenames, creates WebsiteMedia and selects local/object
storage (routes.py:5042-5195). Local images are EXIF-transposed,
flattened/converted, capped at 2400 px, saved JPEG/PNG/WebP, and get
400/800/1200/1600/2400 variants plus optional WebP quality 82/method 6. Defaults
are app/__init__.py:65-80. There is no matching 5MB per-route enforcement;
Flask max content is at least 12MB. That is a confirmed UI/backend mismatch.

WebsiteMedia stores file_url, stored_name, type, alt, dimensions, size and
provider (models.py:14237+). Classic section fields store an external URL or a
stable media URL, sometimes within strings/objects arrays. Storage supports R2
through STORAGE_PROVIDER, S3_ENDPOINT, S3_REGION, S3_BUCKET, S3_ACCESS_KEY,
S3_SECRET_KEY and CDN_BASE_URL (backend/app/storage.py:1-214). Object keys are
company/company_id/website-media/timestamp_name; delivery is CDN or signed GET.

Do tenant-uploaded Classic images use Cloudflare R2 in production?
NOT PROVABLE FROM SOURCE. R2 is supported when deployment selects
STORAGE_PROVIDER=r2; deployment configuration was intentionally not read.

## H. Operational ownership and routing

Classic templates own marketing presentation, page copy, CTAs and Page Style.
Canonical DB/app owns Services/availability/providers/addons/packages,
Products/variants/SKU/inventory, Reviews, Jobs, basket/orders, shipping/taxes/
discounts and Stripe sessions. Product-variant behavior is in backend
services/product_variant_*. Shipping/checkout authority is routes.py:59221-63533
and Stripe return/onboarding is routes.py:3199-3375.

Marketing pages may link to Services, Products, Reviews and Jobs. Booking,
Basket, Checkout, auth, My Bookings, client dashboard, payments, review/tip,
cancellation/reschedule and support are app-owned and must remain outside a
marketing renderer. CompanyPublic.js and App.js are the client routing surfaces.

Navigation derives from WebsitePage menu fields and normalized nav settings
(models.py:13805-13831; routes.py:4076-4595,6577-6640). Header/footer normalizers
are routes.py:5596 and 5765. Page Style is a pageStyle block with backgrounds,
overlays, typography, cards and buttons (schemas.js:1223-1257), rendered as CSS
variables (RenderSections.js:7217-7310); bulk style endpoint is
POST /api/website/pages/apply-style (routes.py:114696+). Page SEO is WebsitePage
fields; site SEO is settings normalization (routes.py:5911+).

## I. Next.js comparison and Iron Ember media diagnosis

| capability | status |
| --- | --- |
| WebsitePage/settings/SEO/nav/checkpoints/publish | reused correctly in intent; retain adapter |
| Media Library/storage | partially reused; keep stable backend media URLs |
| Classic visual JSX/content.sections | do not reuse as Next visual composition |
| Services/products/reviews/jobs | reuse canonical records only |
| Basket/checkout/dashboard | app-owned handoffs; do not duplicate |
| Add Section/repeaters | adapter required to match Classic practical editability |
| header/footer/socials | reuse settings data; theme owns DOM |

Read-only local runtime: company 8, slug iron-ember-qa, has Home/About/Services/
Contact/Gallery. Home Hero contains absolute
http://127.0.0.1:5000/api/website/media/file/8/starter-iron-ember-hero.png;
WebsiteMedia rows 38/39 exist with local provider and non-zero bytes. At audit
time both HTTP requests returned curl status 000 because nothing listened on
port 5000. Current uncommitted tenant helper maps relative media URLs to backend
(theme-helpers.tsx:425-447). The exact observed failure is delivery: backend
origin unavailable, not missing page/module/media DB content. It is not fixed.

## J. Reuse rule

Reuse unchanged: WebsitePage, settings/draft/publish/checkpoints, WebsiteMedia
and storage endpoint, navigation/SEO/header/footer settings, operational
Services/Products/Reviews/Jobs, booking/commerce/dashboard routes.

Adapter only: semantic editor, render-model, media resolver.

Theme-local only: DOM, layout, typography, motion, rails/sliders, responsive
transformation and all source-native visual composition.

Do not rebuild media, services/products/checkout/checkpoints. Do not use Classic
JSON visual layouts as a Next.js visual source.

## Final answers

Classic JSON becomes live via gallery, import, WebsitePages/settings draft,
publish and Classic renderer. Add Section is factory default plus insertion plus
schema/render. Canvas selection is selected block to schema to Inspector to page
PUT. Repeaters/images/carousels are typed props arrays/URLs. Uploaded images use
WebsiteMedia and stable delivery URLs. Services/products/reviews/jobs are
canonical; booking/checkout/client paths are app-owned. Navigation/chrome/SEO/
publish/checkpoints are shared settings/page facilities. Next.js must reuse
shared data/media/settings/operations; only visible composition is theme-local.
The observed Iron Ember image failure is an inactive backend origin.

## K. Confirmed public component inventory

The current frontend source contains the following public/app-owned surfaces:

| Area | frontend source | ownership conclusion |
| --- | --- | --- |
| marketing host/page dispatch | src/pages/client/CompanyPublic.js, PublicPageShell.js, WebsiteViewer.js, src/App.js | Classic website shell and global route dispatch |
| services | src/pages/client/ServiceList.js, ServiceDetails.js, BookingFlowContainer.js, BookingConfirmation.js | Service records/availability/booking flow are app-owned; template only supplies marketing context/style |
| products | src/pages/client/ProductList.js, ProductDetails.js | Product records/images/variants/prices remain canonical data |
| basket | src/pages/client/MyBasket.js | cart is app-owned, not WebsitePage content |
| checkout | src/pages/client/Checkout.js, CheckoutPro.js, utils/hostedCheckout.js | backend/Stripe is payment authority; browser only submits choices |
| reviews | src/pages/client/PublicReviewList.js, ClientReviews.js | published records and review workflow are distinct from editorial template quotes |
| jobs | src/pages/public/PublicJobsListPage.jsx, PublicJobDetailPage.jsx, JobOpenings.js | JobOpening/application flow is app-owned |
| client area | src/pages/client/PublicMyBookings.js, ClientDashboardOverview.js | authenticated application routes, not marketing composition |

The inspection proves component boundaries and the relevant backend authority
locations. It does not silently equate every historical route alias in the
large backend routes module with the currently mounted App route: where aliases
disagree, frontend App routing is the runtime source and needs a separate
route-table extraction if exact production URL enumeration is required.
