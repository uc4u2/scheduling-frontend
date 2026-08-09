# Next.js Builder Parity Matrix

Last updated: 2026-08-09

This matrix tracks how the existing Visual Site Builder behavior maps into the
Next.js semantic-module workflow. Code remains the source of truth if this file
drifts.

Status values:
- `VERIFIED LIVE`
- `VERIFIED AUTOMATED`
- `PARTIAL`
- `CLASSIC ONLY`
- `NOT SUPPORTED`

| Feature | Classic current behavior | Next.js required behavior | Existing implementation reused | Adapter required | New implementation required | Status | Tests |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Content Canvas | Legacy React visual canvas | Next.js draft iframe for the selected page/theme | Existing Canvas column and preview session infrastructure | Mode-aware canvas branch and draft page-path refresh | None | VERIFIED LIVE | live `localhost:3000` Builder |
| Page Style | Raw page-style block with wide visual control | Safe theme override contract only | Existing Page Style panel | Theme override sanitization and theme support filtering | Theme-aware override consumption | PARTIAL | `websiteThemeOverrides.test.js`, live Builder |
| Pages | `WebsitePage` CRUD and selection | Same `WebsitePage` CRUD and selection | Existing page APIs and panel | Semantic normalization on load/save | None | VERIFIED LIVE | Existing page CRUD smoke + live Builder |
| Page Settings | Slug, title, menu title, order, publish, homepage, autosave | Same controls with explicit disabled states for unsupported layout controls | Existing Page Settings panel | Next.js unsupported-control messaging | None | PARTIAL | live Builder acceptance |
| Website Checkpoints | Snapshot/restore pages + settings | Same checkpoint system must include semantic modules and renderer metadata | Existing checkpoint API | Semantic module persistence through checkpoint payloads | Validation coverage | PARTIAL | backend checkpoint coverage + live restore |
| Navigation & Menu | Canonical labels/order/system links | Same canonical data updates Next.js nav immediately | Existing Navigation & Menu panel | Preview refresh + render-model mapping | None | PARTIAL | live Builder acceptance |
| Header & Footer | Canonical header/footer/settings editing | Same canonical settings with theme-owned layout | Existing Header & Footer panel | Next.js render-model mapping | None | PARTIAL | live Builder acceptance |
| Sections | Raw legacy blocks | Semantic modules with customer-friendly labels | Existing Sections panel | Old-block normalization + semantic labels | Safe section operations | VERIFIED LIVE | `websiteSemanticModules.test.js`, live Builder |
| Add New Blocks / Add Section | Add raw template blocks | Add compatible semantic modules only | Existing Add Blocks interaction pattern | Theme/page/slot compatibility filtering | Next.js Add Section labels and warnings | VERIFIED LIVE | `websiteSemanticModules.test.js`, live Builder |
| SEO | First-class page SEO editing | Same SEO data feeds Next.js metadata | Existing SEO panel | Next.js metadata mapping | None | PARTIAL | backend render-model + live verification |
| page add | Create `WebsitePage` | Same | Existing CRUD | none | none | VERIFIED AUTOMATED | existing CRUD smoke |
| page delete | Delete `WebsitePage` | Same | Existing CRUD | none | none | VERIFIED AUTOMATED | existing CRUD smoke |
| page duplicate | Clone `WebsitePage` | Same | Existing CRUD | semantic content preserved | none | PARTIAL | live Builder |
| page show/hide | `show_in_menu` toggle | Same | Existing CRUD | none | none | VERIFIED LIVE | live Builder |
| publish/unpublish page | Existing per-page publish state | Same | Existing CRUD | render-model respects published state | none | PARTIAL | render-model tests + live Builder |
| homepage | `is_homepage` toggle | Same | Existing CRUD | Next route resolution | none | PARTIAL | render-model tests + live Builder |
| slug | Editable slug | Same | Existing Page Settings | none | none | VERIFIED LIVE | live Builder |
| menu title | Editable menu title | Same | Existing Page Settings | none | none | VERIFIED LIVE | live Builder |
| sort order | Page order reorder | Same | Existing page list/order controls | semantic page refresh | none | PARTIAL | live Builder |
| image/media picker | Existing media selection flow | Same media selection for semantic module fields | `ImageField` and current asset APIs | semantic field bindings | none | VERIFIED LIVE | live Hero editor |
| CTA editor | Existing CTA fields in block inspectors | Same semantics for hero/cta/contact modules | Existing text field pattern | semantic field bindings | none | VERIFIED LIVE | live Hero editor |
| duplicate section | Duplicate raw block | Duplicate semantic module | Existing section concept | semantic module clone with new id | new Next.js handler | PARTIAL | frontend parity tests + live Builder |
| delete section | Delete raw block | Delete semantic module | Existing section concept | semantic module deletion | none | VERIFIED LIVE | live Builder |
| reorder section/module | Arbitrary raw block reorder | Safe reorder within manifest-compatible slots | Existing move controls pattern | slot-aware module reorder | new Next.js handler | PARTIAL | frontend parity tests + live Builder |
| forms | Existing WebsiteForm schema and submission | Same form system styled by theme | Existing form APIs | render-model mapping into `contactForm` module | none | PARTIAL | render-model tests + live preview |
| branding | Existing site/header/footer settings | Same canonical settings | Existing branding panel | render-model mapping | none | PARTIAL | live Builder |
| socials | Existing settings-driven social links | Same canonical settings | Existing branding/nav controls | render-model mapping | none | PARTIAL | live Builder |
| global widgets | Existing settings-driven widgets | Same settings, theme-managed placement | Existing settings/data | globalFeatures normalization | theme renderers later | VERIFIED AUTOMATED | backend normalization |
| autosave | Existing page autosave toggle | Same setting retained | Existing Page Settings | none | none | VERIFIED LIVE | live Builder |
| manual save | Existing draft save flow | Same + preview refresh | Existing save flow | Next preview refresh | none | PARTIAL | live Builder |
| draft | Existing draft editing | Same | Existing Builder draft flow | semantic save/normalize | none | VERIFIED LIVE | current Builder flow |
| publish | Existing website publish flow | Same content/settings publish | Existing publish flow | semantic content persistence | none | PARTIAL | publish smoke |
| checkpoint/restore | Existing rollback system | Same for modules/theme metadata | Existing checkpoint flow | semantic content coverage | validation/tests | PARTIAL | backend tests + live restore |
| canvas click editing | Click section opens editor | Click themed module/field opens semantic editor | Existing click-edit concept | iframe slot/module bridge | field-level focus improvements | VERIFIED LIVE | live `home.hero` slot click |
| desktop/tablet/mobile preview | Existing classic canvas + new theme preview controls | Same viewports preserved during edits | Existing preview controls | iframe refresh preservation | none | VERIFIED LIVE | live Builder |
