# Website SEO & Social Previews (Public Guide)

This guide explains how Schedulaa handles SEO fields, Open Graph previews, and
favicons for public sites and custom domains.

What you can control
- Meta title/description: what search engines show.
- Open Graph title/description/image: what appears in WhatsApp, Facebook, and other
  social previews.
- Favicon: the small icon shown in browser tabs.

Where to edit
Manager Dashboard → Website & Pages → SEO & Metadata

Key behaviors
- Saving SEO fields stores a draft. Click Publish in Website & Pages to make it live.
- If Open Graph image is empty, the homepage hero image is used as a fallback.
- If favicon is empty, your header/logo is used as a fallback.
- Custom domains only become canonical after the domain is verified.

Tips for best previews
- Open Graph image: use a 1200×630 image (PNG or JPG), hosted on https.
- Favicon: use 32×32 or 48×48 PNG (or .ico), hosted on https.
- Keep titles under ~60 characters and descriptions under ~155 characters.

Testing your preview
- Use the “Test preview” buttons in SEO & Metadata.
- If a bot is not showing your updates, make sure you clicked Publish.

Notes about WhatsApp
WhatsApp does not run JavaScript, so Schedulaa serves server-side Open Graph tags
for bots to make sure previews are accurate.
