# SEO & Blog Checklist (Schedulaa)

Use this as a quick, repeatable checklist when publishing new marketing pages or blog posts.

## Blog posts
- Add the post metadata + content in `frontend/src/landing/pages/blog/posts.js`.
- Ensure each post has: `slug`, `title`, `description`, `datePublished`, `dateModified`, `category`, `tags`, `sections`.
- If you want a custom layout, create a dedicated page component and keep the listing entry in `posts.js`.
- Add the new `/blog/<slug>` path to `frontend/config/seoRoutes.js`.

## Meta + schema
- Blog list page JSON-LD is emitted in `frontend/src/landing/pages/BlogPage.js`.
- Individual BlogPosting JSON-LD is emitted in `frontend/src/landing/pages/blog/BlogPostPage.jsx`.
- Use accurate, verifiable claims only; avoid marketing promises not backed by product behavior.

## Sitemap + robots
- Routes are centralized in `frontend/config/seoRoutes.js`.
- Rebuild crawl assets by running `npm run generate:seo` or `npm run build` in `frontend/`.

## GA4 verification
- Set `REACT_APP_GA_MEASUREMENT_ID` (or `window.__ENV__.GA_MEASUREMENT_ID`) and redeploy.
- Verify realtime events after deploy.

## Post-deploy checklist
- Fetch `https://www.schedulaa.com/robots.txt` and `https://www.schedulaa.com/sitemap.xml`.
- Use Search Console to resubmit the sitemap.
- Run Rich Results test on `/blog/<slug>` if needed.
