---
title: Website Builder How-To
description: Build, preview, and publish the public site.
---

# Website Builder How-To (Manager)

Use the Website Builder to edit pages and publish changes, including templates and domains.

## Where to click

Manager Portal → Website & Pages → Visual Site Builder

## Step 1: Open the builder

1. Go to Manager Portal → Website & Pages → Visual Site Builder.
2. Choose the page you want to edit from the left panel.

### Page list basics

- Pages include Home, Services, About, Reviews, and custom landing pages.
- Draft vs published status appears next to each page.
- You can duplicate or reorder pages from the list.

## Step 2: Edit content

1. Click a section to open the inspector.
2. Update text, images, and layout options.
3. Use the Theme Designer to adjust colors and fonts.

### Common section fields

- Heading / subheading
- Body copy
- Buttons (label + link)
- Images or gallery blocks
- Layout toggles (alignment, spacing)

## Step 3: Add sections or templates

1. Click **Add Section** in the left panel.
2. Choose a template (hero, gallery, FAQ, services).
3. Drag to reorder sections as needed.

### Templates

- Hero templates for headline + CTA
- Services grids with pricing
- Testimonials and reviews
- FAQ blocks

## Step 4: Preview and publish

1. Click **Preview** to see the live layout.
2. Click **Publish** to make changes live.

### Publishing rules

- Draft changes do not affect the live site until you publish.
- Preview shows the draft state.

## Simple article workflow

For an individual `/blog/...` article, the Builder intentionally uses a
smaller workflow than an ordinary website page:

1. Click **New article** and enter the title and short summary.
2. Edit the visible article sections in the Canvas/Inspector.
3. Click **Save draft** whenever you want to stop and return later.
4. Click **Preview** if you want to review the draft in a separate preview.
5. Click **Publish article** (or **Publish update**) to save the article and
   make that version live in one action.

Only three items block article publication:

- Title
- Summary
- Article text

The Builder presents these as numbered, clickable steps. If publication is
blocked, a visible warning names the missing requirement and provides a direct
action that opens the correct field. The disabled Publish button also exposes
the reason in a tooltip.

A cover image is optional. If an image is added, provide useful alternative
text for accessibility. The selected Modern theme is responsive by contract;
authors do not approve a separate mobile version and there is no manual
"mobile reviewed" publishing gate.

The visible article title and summary automatically become the page's search
and social title/description when the article is saved. This keeps ordinary
authors out of separate SEO forms. Canonical URLs, `noindex`, redirects, and
other advanced SEO controls remain administrator concerns.

While an article is selected, the generic page **Published** switch and the
site-wide floating **Publish** controls are hidden. They must not provide a
second route that bypasses **Publish article**. Article deletion, duplication,
and unpublishing remain under **More**.

The article's title/summary, body, and closing section use a protected fixed
layout. Authors edit their content, but do not move, duplicate, hide, or remove
those structural sections. This prevents an accidental click from deleting the
headline or producing duplicate article blocks.

## Step 5: Connect a domain (optional)

1. Manager Portal → Website & Pages → Domain Settings.
2. Follow the DNS instructions and wait for SSL to activate.

### Domain fields you will see

- Domain input (example.com)
- Generate DNS Instructions button
- TXT record for verification
- CNAME record for www
- SSL status (Pending / Active)

## Tips

- Use **Inline Site Editor** for quick text fixes without opening the full builder.
- Save drafts often before publishing.
