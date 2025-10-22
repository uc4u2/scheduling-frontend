# Website Nav + Theme Refactor — Implementation Notes

This document summarizes the changes we made to align the public website (/:slug) with the Visual Site Builder templates and keep Services/Reviews/Login/My Bookings tabs consistent and “backend‑driven”. It also captures goals, current state, and next steps.

Last updated: current sprint

## Goals

- Use clean, canonical URLs for backend‑driven tabs:
  - Services → `/:slug/services`
  - Reviews  → `/:slug/reviews`
  - Login (logged out only) → `/login?site=:slug`
  - My Bookings (logged in only) → `/dashboard?site=:slug`
- Ensure dynamic pages (Services/Reviews/My Bookings) visually match the imported template (colors, fonts, spacing), even after publishing.
- Make tabs controllable from the builder (show/hide) without depending on brittle settings saves.
- Keep template imports consistent (Services/Reviews always available, auth tabs normalized).

## High‑level changes

- Frontend public shell (PublicPageShell) now provides:
  - Canonical tab routing (Services/Reviews go to backend routes).
  - Theme derivation for dynamic pages: if no explicit template theme overrides are present, derive palette/typography from the homepage hero/pageStyle.
  - Menu bar styled using the same ThemeRuntimeProvider CSS vars as cards/hero (blur, background, heading/link colors), centered like hero.
  - Tab order stabilization and de‑duplication:
    - Services/Reviews added first (if not hidden), followed by template menu pages, preventing duplicates.
  - My Bookings is not hard‑coded anymore. It will only appear if the template includes a `my-bookings` page (show_in_menu ON) or an explicit nav override is enabled.
  - Hide logic via Page Settings: setting `show_in_menu=false` for `services`, `reviews`, or `my-bookings` hides the tab on the public nav.

- Builder UX
  - Controls panel includes a hint explaining that Services/Reviews tabs are backend‑driven and inherit style from the homepage; creating builder pages is optional.
  - Quick actions to create Services/Reviews page stubs remain available for teams who want page content in the builder.

- Template imports (Manager → Website → Templates)
  - Post‑import step ensures `services` and `reviews` page stubs exist (show_in_menu ON).
  - Nav defaults normalize auth tab visibility and backend targets for Services/Reviews.
  - Site is published automatically so changes are visible.

- Publish wiring
  - Frontend `wb.publish` now calls `/admin/website/settings` (fallback `/api/website/settings`) with `is_live`, fixing a previous undefined call.

- Backend (optional helper)
  - A utility script `backend/tools/update_templates.py` is included to batch‑update JSON template files in `backend/app/website_templates` with Services/Reviews page stubs and nav defaults.

## Changed files (frontend)

- `src/pages/client/CompanyPublic.js`
  - Services/Reviews links route to backend endpoints.
  - De‑duplication and stable ordering of tabs.
  - Hide tabs via Page Settings (show_in_menu=false for `services`/`reviews`).

- `src/pages/client/PublicPageShell.js`
  - Theme derivation (palette/typography) from homepage hero/pageStyle when explicit overrides are missing.
  - Global hero background image applied to Services/Reviews body for consistent look.
  - AppBar styled with ThemeRuntimeProvider CSS vars; nav centered.
  - My Bookings tab only appears if provided by template (not hard‑coded), and only when logged in.

- `src/components/website/ThemeRuntimeProvider.js`
  - Base theme + CSS variables used by the Public shell.

- `src/pages/sections/management/VisualSiteBuilder.js`
  - Controls: builder hint explaining backend‑driven tabs and optional pages.
  - Quick actions available for creating Services/Reviews page stubs.

- `src/pages/sections/management/WebsiteTemplates.js`
  - After import: ensure Services/Reviews pages exist and nav defaults are set; publish.

- `src/utils/api.js`
  - `wb.publish` fixed to call settings endpoints directly.

## Changed files (backend utility)

- `backend/tools/update_templates.py`
  - Batch updates JSON templates to add Services/Reviews page stubs and nav defaults.

## Behavior summary

- Public nav order:
  - Services, Reviews (canonical) + template pages (e.g., Pricing, About, Contact, Policies…), centered.
- Login vs Logout vs My Bookings:
  - Login shown only when logged out.
  - Logout shown only when logged in.
  - My Bookings is not hard‑coded: appears only if the template provides a `my-bookings` page with `show_in_menu=true` (and user is logged in) or if nav overrides explicitly enable it.
- Hide any of Services/Reviews/My Bookings via Page Settings:
  - Visual Site Builder → Pages → edit page → Show in menu OFF → Publish.
- Theme match:
  - Dynamic Services/Reviews pages inherit template colors/fonts after publish; we derive palette/typography from homepage hero/pageStyle if needed.
  - Services/Reviews use the homepage hero background image as full‑page background for visual continuity.

## Step‑by‑step manager flow

1) Import a template (Manager → Website → Templates → Use this template).
2) In Visual Site Builder:
   - Use Controls hint to understand backend‑driven tabs.
   - Optionally use Quick Actions to create Services/Reviews builder pages for extra content (not required).
3) To hide Services/Reviews/My Bookings tabs:
   - Pages → edit `services` / `reviews` / `my-bookings` → set Show in menu OFF → Publish.
4) To customize navigation order for other pages:
   - Pages → adjust sort order and show_in_menu.
5) Publish changes (Publish is fixed and uses settings endpoint).

## Next steps (optional)

- Add Page Style toggles for Menu Blur and Menu Border so managers can control AppBar blur/border directly from builder.
- Extend theme derivation with more template keys (if your hero/pageStyle uses custom names for colors/fonts).
- Once backend settings save path is fully stable, let the Website Navigation panel toggle Services/Reviews/My Bookings visibility via `nav_overrides` only (without the Page Settings fallback).
- Use `backend/tools/update_templates.py` to batch‑normalize legacy templates on disk if needed.

## Where this file lives

- `docs/website-nav-and-theme-refactor.md`

To reference or import later, ask: “Open and follow docs/website-nav-and-theme-refactor.md”.

