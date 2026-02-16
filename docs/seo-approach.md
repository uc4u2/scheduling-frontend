# SEO Approach (Current Setup)

This doc records the current SEO workflow for the Next.js marketing site.

## Domain split (source of truth)
- Marketing/public content: `https://www.schedulaa.com`
- App/auth/dashboard flows: `https://app.schedulaa.com`
- Do not index app-auth pages from marketing SEO docs.

## Locale routing
- Public marketing URLs are locale-prefixed:
  - English: `/en/...`
  - Farsi: `/fa/...`
- Root and non-prefixed routes are rewritten/redirected to locale-aware paths.

## Current SEO surface (Next marketing repo)
- Repo: `schedulaa-marketing-techwind`
- Metadata source: `src/utils/generateMetaData.ts`
- App shell metadata: `src/app/layout.tsx`
- Locale config: `src/i18n/request.ts`, `src/components/shared/LocaleProvider.tsx`
- Route handling: `middleware.ts`, `next.config.ts`
- Public pages: `src/app/**/page.tsx`

## Public route rules
- Include only marketing/public URLs in sitemap and indexing checks.
- Exclude app/auth/dashboard URLs from marketing indexing:
  - `https://app.schedulaa.com/login`
  - `https://app.schedulaa.com/register`
  - `https://app.schedulaa.com/manager`
  - `https://app.schedulaa.com/employee`

## Add a new public page
1. Add a page in `schedulaa-marketing-techwind/src/app/.../page.tsx`.
2. Add page metadata (title/description/canonical/OG as needed).
3. Ensure locale behavior works for `/en/...` and `/fa/...`.
4. Run `npm run build` in `schedulaa-marketing-techwind`.

## Blog and compare content sources
- Blog routes:
  - list: `/en/blog`, `/fa/blog`
  - detail: `/en/blog/<slug>`, `/fa/blog/<slug>`
- Compare routes:
  - hub: `/en/compare`, `/fa/compare`
  - detail: `/en/compare/<vendor>`, `/fa/compare/<vendor>`

## Post-deploy checklist
- Confirm locale pages return 200:
  - `/en`, `/en/pricing`, `/en/blog`
  - `/fa`, `/fa/pricing`, `/fa/blog`
- Confirm `https://www.schedulaa.com/robots.txt` and `/sitemap.xml`.
- Resubmit sitemap in Search Console.
