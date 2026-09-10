# Next.js Builder Parity Matrix

Last updated: 2026-09-05

This matrix tracks how the existing Visual Site Builder behavior maps into the
Next.js semantic-module workflow. Code remains the source of truth if this file
drifts.

Status values:
- `VERIFIED LIVE`
- `IMPLEMENTED / VERIFIED AUTOMATED`
- `PARTIAL LIVE VERIFICATION`
- `CLASSIC ONLY`
- `NOT SUPPORTED`

Host limitation note:
- On Sunday, August 9, 2026, final browser verification on `http://localhost:3000`
  was blocked intermittently by host resource pressure. Both the CRA production
  build and `react-scripts start` were killed under low-memory conditions. This
  blocked some remaining live smoke verification, but did not reveal a new
  Builder parity architecture defect.

| Feature | Classic current behavior | Next.js required behavior | Existing implementation reused | Adapter required | New implementation required | Status | Tests |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Content Canvas | Legacy React visual canvas | Next.js draft iframe for the selected page/theme | Existing Canvas column and preview session infrastructure | Mode-aware canvas branch and draft page-path refresh | None | VERIFIED LIVE | live `localhost:3000` Builder |
| Page Style | Raw page-style block with wide visual control | Safe theme override contract only | Existing Page Style panel | Theme override sanitization, theme support filtering, and canonical `theme_overrides` draft persistence | Theme-aware override consumption | IMPLEMENTED / VERIFIED AUTOMATED | `websiteThemeOverrides.test.js`; live acceptance pending host stability |
| Pages | `WebsitePage` CRUD and selection | Same `WebsitePage` CRUD and selection | Existing page APIs and panel | Semantic normalization on load/save | None | VERIFIED LIVE | Existing page CRUD smoke + live Builder |
| Page Settings | Slug, title, menu title, order, publish, homepage, autosave | Same controls with explicit disabled states for unsupported layout controls | Existing Page Settings panel | Next.js unsupported-control messaging and page-to-preview path sync | None | IMPLEMENTED / VERIFIED AUTOMATED | Next.js live acceptance pending host stability |
| Website Checkpoints | Versioned tenant design history | V2 captures allowlisted design settings, pages/SEO/modules, forms, menus, redirects, and media references without integrations or secrets | Existing `WebsiteCheckpoint.snapshot_json` and publish flow | Atomic reconciliation, media protection, protected approved versions, automatic pre-mutation rollback | Structured Design history & restore UI | IMPLEMENTED / VERIFIED AUTOMATED | backend V2 13/13; related backend 53/53; frontend focused 71/71; production disposable-tenant smoke pending |
| Navigation & Menu | Canonical labels/order/system links | Same canonical data updates Next.js nav immediately | Existing Navigation & Menu panel | Preview refresh + render-model mapping | None | IMPLEMENTED / VERIFIED AUTOMATED | live acceptance pending host stability |
| Header & Footer | Canonical header/footer/settings editing | Same canonical settings with theme-owned layout | Existing Header & Footer panel | Next.js render-model mapping | None | IMPLEMENTED / VERIFIED AUTOMATED | live acceptance pending host stability |
| Sections | Raw legacy blocks | Semantic modules with customer-friendly labels | Existing Sections panel | Old-block normalization + semantic labels | Safe section operations | VERIFIED LIVE | `websiteSemanticModules.test.js`, live Builder |
| Add New Blocks / Add Section | Add raw template blocks | Add compatible semantic modules only | Existing Add Blocks interaction pattern | Theme/page/slot compatibility filtering | Next.js Add Section labels and warnings | VERIFIED LIVE | `websiteSemanticModules.test.js`, live Builder |
| SEO | First-class page SEO editing | Same SEO data feeds Next.js metadata | Existing SEO panel | Next.js metadata mapping | None | PARTIAL LIVE VERIFICATION | backend render-model verified; final live Builder smoke pending host stability |
| page add | Create `WebsitePage` | Same | Existing CRUD | none | none | IMPLEMENTED / VERIFIED AUTOMATED | existing CRUD smoke |
| page delete | Delete `WebsitePage` | Same | Existing CRUD | none | none | IMPLEMENTED / VERIFIED AUTOMATED | existing CRUD smoke |
| page duplicate | Clone `WebsitePage` | Same | Existing CRUD | semantic content preserved | none | PARTIAL LIVE VERIFICATION | live Builder smoke pending host stability |
| page show/hide | `show_in_menu` toggle | Same | Existing CRUD | none | none | VERIFIED LIVE | live Builder |
| publish/unpublish page | Existing per-page publish state | Same | Existing CRUD | render-model respects published state | none | PARTIAL LIVE VERIFICATION | render-model tests + live Builder smoke pending host stability |
| homepage | `is_homepage` toggle | Same | Existing CRUD | Next route resolution | none | PARTIAL LIVE VERIFICATION | render-model tests + live Builder smoke pending host stability |
| slug | Editable slug | Same | Existing Page Settings | none | none | VERIFIED LIVE | live Builder |
| menu title | Editable menu title | Same | Existing Page Settings | none | none | VERIFIED LIVE | live Builder |
| sort order | Page order reorder | Same | Existing page list/order controls | semantic page refresh | none | PARTIAL LIVE VERIFICATION | live Builder smoke pending host stability |
| image/media picker | Existing media selection flow | Same media selection for semantic module fields | `ImageField` and current asset APIs | semantic field bindings | none | VERIFIED LIVE | live Hero editor |
| CTA editor | Existing CTA fields in block inspectors | Same semantics for hero/cta/contact modules | Existing text field pattern | semantic field bindings | none | VERIFIED LIVE | live Hero editor |
| duplicate section | Duplicate raw block | Duplicate semantic module | Existing section concept | semantic module clone with new id | new Next.js handler | PARTIAL LIVE VERIFICATION | frontend parity tests + live Builder smoke pending host stability |
| delete section | Delete raw block | Delete semantic module | Existing section concept | semantic module deletion | none | VERIFIED LIVE | live Builder |
| reorder section/module | Arbitrary raw block reorder | Safe reorder within manifest-compatible slots | Existing move controls pattern | slot-aware module reorder | new Next.js handler | PARTIAL LIVE VERIFICATION | frontend parity tests + live Builder smoke pending host stability |
| forms | Existing WebsiteForm schema and submission | Same form system styled by theme | Existing form APIs | render-model mapping into `contactForm` module | none | PARTIAL LIVE VERIFICATION | render-model tests + live preview smoke pending host stability |
| branding | Existing site/header/footer settings | Same canonical settings | Existing branding panel | render-model mapping | none | IMPLEMENTED / VERIFIED AUTOMATED | live acceptance pending host stability |
| socials | Existing settings-driven social links | Same canonical settings | Existing branding/nav controls | render-model mapping | none | IMPLEMENTED / VERIFIED AUTOMATED | live acceptance pending host stability |
| global widgets | Existing settings-driven Google review and tenant chatbot widgets | Same settings and backend behavior with one shared cross-theme placement | Existing settings, render model, `POST /chat`, and Google review URL | Next public chrome and public-request-aware CTA mapping | Shared theme-aware Next widget presentation | IMPLEMENTED / VERIFIED AUTOMATED | renderer public-chrome/chatbot tests; production smoke pending |
| autosave | Existing page autosave toggle | Same setting retained | Existing Page Settings | none | none | VERIFIED LIVE | live Builder |
| manual save | Existing draft save flow | Same + preview refresh | Existing save flow | Next preview refresh | none | PARTIAL LIVE VERIFICATION | live Builder smoke pending host stability |
| draft | Existing draft editing | Same | Existing Builder draft flow | semantic save/normalize | none | VERIFIED LIVE | current Builder flow |
| publish | Existing website publish flow | Same content/settings publish | Existing publish flow | semantic content persistence | none | PARTIAL LIVE VERIFICATION | publish smoke pending host stability |
| checkpoint/restore | Draft restore and explicit Restore & Publish | Same for semantic modules, renderer metadata, forms, menus, redirects, and referenced media | Existing checkpoint storage and normal publish path | V1 compatibility, atomic V2 reconciliation, missing-media guard, rollback checkpoint | Approved/protected version workflow and structured inspection | IMPLEMENTED / VERIFIED AUTOMATED | backend V2 13/13; frontend history tests; production disposable-tenant smoke pending |
| canvas click editing | Click section opens editor | Click themed module/field opens semantic editor | Existing click-edit concept | iframe slot/module bridge | field-level focus improvements | VERIFIED LIVE | live `home.hero` slot click |
| desktop/tablet/mobile preview | Existing classic canvas + new theme preview controls | Same viewports preserved during edits | Existing preview controls | iframe refresh preservation | none | VERIFIED LIVE | live Builder |
