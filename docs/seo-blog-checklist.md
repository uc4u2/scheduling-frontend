# SEO & Blog Checklist (Schedulaa)

Use this as a quick, repeatable checklist when publishing new marketing pages or blog posts.

## Blog posts
- Add the post metadata + content in `schedulaa-marketing-techwind/src/legacy-content/blog/posts.js`.
- Ensure each post has: `slug`, `title`, `description`, `datePublished`, `dateModified`, `category`, `tags`, `sections`.
- If you want a custom layout, create/patch the route in:
  - `schedulaa-marketing-techwind/src/app/blog/[slug]/page.tsx`
- Verify both locale paths work:
  - `/en/blog/<slug>`
  - `/fa/blog/<slug>`

## Meta + schema
- Blog list metadata lives in `schedulaa-marketing-techwind/src/app/blog/page.tsx`.
- Blog detail metadata lives in `schedulaa-marketing-techwind/src/app/blog/[slug]/page.tsx`.
- Use accurate, verifiable claims only; avoid marketing promises not backed by product behavior.

## Sitemap + robots
- Routes are file-based in `schedulaa-marketing-techwind/src/app`.
- Rebuild crawl assets by running `npm run build` in `schedulaa-marketing-techwind/`.

## GA4 verification
- Set marketing env values in Next (for example `NEXT_PUBLIC_*` variables) and redeploy.
- Verify realtime events after deploy.

## Post-deploy checklist
- Fetch `https://www.schedulaa.com/robots.txt` and `https://www.schedulaa.com/sitemap.xml`.
- Use Search Console to resubmit the sitemap.
- Run Rich Results test on locale URLs (for example `/en/blog/<slug>`).
