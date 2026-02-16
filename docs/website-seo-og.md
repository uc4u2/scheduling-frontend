# Website SEO & Social Previews (Public Guide)

This guide explains how Schedulaa handles SEO fields, Open Graph previews, and
favicons for public sites and custom domains.

Domain split note
- Marketing/public pages live on `https://www.schedulaa.com` (locale-prefixed paths such as `/en/...`, `/fa/...`).
- App/auth/dashboard pages live on `https://app.schedulaa.com`.
- SEO settings in this guide apply to public website pages, not app-auth screens.

What you can control
- Meta title/description: what search engines show.
- Open Graph title/description/image: what appears in WhatsApp, Facebook, and other
  social previews.
- Favicon: the small icon shown in browser tabs.

Where to edit
Manager Dashboard → Website & Pages → SEO & Metadata

Step-by-step setup
1) Open Manager Dashboard.
2) Go to Website & Pages.
3) Open the SEO & Metadata section.
4) Fill in Meta Title, Meta Description, and (optional) Meta Keywords.
5) Fill in Open Graph Title/Description and add an Open Graph Image URL.
6) (Optional) Upload a favicon, or keep the logo fallback.
7) Click Save to store a draft.
8) Click Publish in Website & Pages to make changes live.

Key behaviors
- Saving SEO fields stores a draft. Click Publish in Website & Pages to make it live.
- If Open Graph image is empty, the homepage hero image is used as a fallback.
- If favicon is empty, your header/logo is used as a fallback.
- Custom domains only become canonical after the domain is verified.

Tips for best previews
- Open Graph image: use a 1200×630 image (PNG or JPG), hosted on https.
- Favicon: use 32×32 or 48×48 PNG (or .ico), hosted on https.
- Keep titles under ~60 characters and descriptions under ~155 characters.

Sitemap & robots
- Your public sitemap lives at `/sitemap.xml` on your domain.
- Robots rules live at `/robots.txt` on your domain.
- If your custom domain is verified, those URLs use your custom domain.
- If your custom domain is not verified yet, they use your schedulaa.com slug URL.
- Search engines use these files to discover published pages.

Locale examples (marketing)
- `https://www.schedulaa.com/en`
- `https://www.schedulaa.com/fa`
- `https://www.schedulaa.com/en/pricing`
- `https://www.schedulaa.com/fa/blog`

Google Search Console verification
- In SEO & Metadata → Advanced settings, paste the Google verification token.
- Use the Meta verification token for the HTML tag method in Google Search Console.
- If you prefer DNS verification, paste the DNS TXT token and add it at your registrar.
- After verification, submit your sitemap URL in Google Search Console.

Testing your preview
- Use the “Test preview” buttons in SEO & Metadata.
- If a bot is not showing your updates, make sure you clicked Publish.

Notes about WhatsApp
WhatsApp does not run JavaScript, so Schedulaa serves server-side Open Graph tags
for bots to make sure previews are accurate.
