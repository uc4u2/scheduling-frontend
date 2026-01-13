# SEO Approach (Current Setup)

This doc records the current SEO workflow for the CRA marketing site and public pages.

## Goals
- Keep everything on one domain: https://www.schedulaa.com
- Keep the CRA app working as-is
- Improve crawlability for public marketing pages, compare pages, and blog posts

## What changed (key files)
- `frontend/package.json` - react-snap scripts + config
- `frontend/scripts/generate-react-snap.js` - builds react-snap include list from `seoRoutes.js`
- `frontend/scripts/run-react-snap.js` - runs react-snap using a local 127.0.0.1 server
- `frontend/scripts/verify-react-snap.js` - checks that snapshots exist in `build/`
- `frontend/config/seoRoutes.js` - single source of truth for public routes
- `frontend/scripts/generate-site-assets.js` - generates `public/robots.txt` and `public/sitemap.xml`
- `frontend/src/landing/pages/compare/CompareHubPage.js` - added narrative block on compare hub
- `frontend/src/landing/pages/compare/ComparisonPage.js` - supports `contextBlock` and `bridgeSection`
- `frontend/src/locales/en/common.json` - compare narrative content blocks
- `frontend/docs/seo-blog-checklist.md` - short checklist for blog posts

## How pre-rendering works
1. `prebuild` runs:
   - `generate:seo` -> updates sitemap + robots
   - `generate:react-snap` -> refreshes react-snap include list
2. `build` runs CRA build
3. `postbuild` runs `run-react-snap.js` to snapshot public routes

React-snap only targets public routes defined in `seoRoutes.js`, and skips auth paths.

## Scripts (package.json)
```
prebuild: npm run generate:seo && npm run generate:react-snap
postbuild: node scripts/run-react-snap.js
generate:seo: node scripts/generate-site-assets.js
generate:react-snap: node scripts/generate-react-snap.js
verify:react-snap: node scripts/verify-react-snap.js
```

## Add a new public page
1. Add the route to `frontend/config/seoRoutes.js`
2. Add Meta + JSON-LD in the page component if needed
3. Run `npm run build`
4. Run `npm run verify:react-snap`

## Add a new blog post
1. Add entry to `frontend/src/landing/pages/blog/posts.js`
2. Add `/blog/<slug>` to `frontend/config/seoRoutes.js`
3. Run `npm run build`
4. Run `npm run verify:react-snap`

## Compare page narrative blocks
The compare pages can include narrative SEO blocks defined in:
- `frontend/src/locales/en/common.json`

Fields used by `ComparisonPage.js`:
- `contextBlock` (title + paragraphs)
- `bridgeSection` (optional, used for Paychex)

## Rules
- Only pre-render public pages.
- Do not add `/login`, `/register`, `/manager`, `/client`, `/admin` to `seoRoutes.js`.
- Always run `verify:react-snap` after build.

## Post-deploy checklist
- Confirm `https://www.schedulaa.com/robots.txt` and `/sitemap.xml`
- Resubmit sitemap in Search Console
- Inspect a few key URLs in Search Console
