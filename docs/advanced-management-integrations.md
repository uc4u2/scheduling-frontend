---
title: Advanced Management – Integrations & Site Builder
description: How to configure Stripe Hub, Checkout, Xero exports, domain connections, and the Visual Site Builder inside Advanced Management.
---

# Stripe Hub & Checkout

- **Components:** `SettingsStripeHub.js`, `SettingsCheckoutPro.js`
- **Location:** Manager Portal → Advanced Management → Settings → Stripe Hub / Checkout.

### Stripe Hub (gateway connection)

1. Click **Connect Stripe** to launch the OAuth flow; once authorized you’ll see the connected account name plus onboarding status (the card calls `stripeConnectLink` for pending steps).
2. Monitor payouts, account health, and whether card-on-file features are enabled. The UI exposes toggles for test vs live keys and surfaces alerts if onboarding is incomplete (`isStripeOnboardingIncomplete` helper).
3. Use **Open Stripe Dashboard** to jump directly into Stripe for reconciliation.

### Checkout Pro & Payments

The Checkout tab is broken into the same cards you see in-app:

1. **Stripe Payments & Card on File**
   - Pick a default checkout mode: Pay Now, Deposit, or Offline invoices.
   - Toggle **Card on File** so clients can securely store a payment method for later charges or no-show fees.
   - Set tipping defaults (percentage presets, allow/disallow tips).
   - Choose how service/product prices display (tax inclusive vs exclusive).

2. **Tax & Localization**
   - Configure currency display, decimal formats, and locale-specific copy.
   - Decide whether prices show per location or inherit the workspace currency.
   - Map booking pages to region-specific tax behaviour when operating in multiple countries.

3. **Tax setup (Stripe Tax)**
   - Enter your Stripe Tax registration info (jurisdictions, tax IDs).
   - Enable automatic tax calculation so Checkout surfaces the correct rate per client location.
   - Provide fallback percentages for regions not covered by Stripe Tax to prevent blocked checkouts.

4. **Saved cards & retry logic**
   - Define how long a saved card stays on file and whether managers can charge it from the Payments view.
   - Set retry rules for failed payments (immediate vs scheduled retries).

All of these settings are persisted via the Checkout Pro API and feed into:

- Booking checkout forms (client experience).
- Manager Payments & refunds (card-on-file workflow).
- Payroll/export math (tax-inclusive vs exclusive revenue).

# Xero Integration

- **Component:** `SettingsXero.js`
- **Purpose:** Sync payroll summaries and revenue to Xero ledgers.

Steps:

1. Visit **Advanced Management → Settings → Xero** and click **Connect Xero**. OAuth tokens are stored server-side and status chips show company/tenant details.
2. Map revenue/expense accounts and tracking categories using the dropdowns populated from `/api/xero`.
3. Set defaults (tracking category, contact, item codes) and lock older periods if needed.
4. Use the export drawer to preview journal entries before sending them to Xero; reconciliation history appears under Integration Activity.

# Domain & Website Builder

## Domain settings

- **Components:** `DomainSettingsCard.jsx`, `DomainHelpDrawer.jsx`, public help at `/help/domains`.
- The card walks through:
  1. Picking a slug for your schedulaa.com subdomain.
  2. Forwarding or pointing a custom domain (GoDaddy guide included: add a forwarding rule with masking or configure CNAME/A as needed).
  3. SSL status + troubleshooting (“Pending” state typically resolves within 5–15 minutes once DNS propagates).
- The **Domain Help** drawer mirrors the public guide with provider-specific instructions so managers don’t need to leave the dashboard.
- The Website Manager tab also surfaces a “Custom Domain Guide” quick link inside the help drawer—same step-by-step instructions for forwarding CNAME/A records, verifying SSL, and troubleshooting common DNS issues.

## Visual Site Builder

- **Components:** `VisualSiteBuilder.js`, `WebsiteBuilder.js`, `InlineSiteEditor.js`, `WebsiteBuilderHelpDrawer.js`.
- Provides drag-and-drop editing for hero sections, galleries, service grids, FAQs, and more. Key ideas:
  - Page list on the left, live preview center, inspector on the right.
  - Every section exposes text, media, layout, and advanced JSON props.
  - Global styles (backgrounds, typography, nav variants) configured via the **Page Style** and **Navigation** panels.
  - Help drawer offers inline guidance, tips, and troubleshooting—matching the marketing doc (“Website Builder Guide”) already ingested.
- Publishing flow: **Save Draft → Preview → Publish**. Assets reuse the same storage pipeline used by Services/Add-ons, so brand imagery stays consistent.

### Theme Designer, Menus, and Templates

- **Theme Designer Drawer:** Right-side drawer accessed via the palette icon. Controls brand colors (primary, accent, surfaces), typography, and component radiuses. Changing the palette updates nav, buttons, badges, hero backgrounds, etc.
- **Navigation Settings:** Within the builder inspector you can choose menu presets (underline, pill, ghost), toggle sticky headers, edit links, and switch between transparent vs solid nav bars per page.
- **Hero & Section Templates:** The left drawer lets managers add ready-made hero, service, testimonial, gallery, and FAQ templates. Each template can be dragged into place and then edited in the inspector.
- **Footer Controls:** Footer blocks live under the “Global Sections” tab—toggle contact info, social links, newsletter signups, and copyright text. Color syncs with the theme palette automatically.

### AI Website Assistant

- Located at the bottom of `WebsiteBuilderHelpDrawer` on the left edge of the Visual Site Builder.
- Managers describe their studio/service (tone, colors, offerings) and the assistant drafts hero copy, supporting sections, FAQ ideas, and SEO snippets.
- The result appears inline with copy/paste buttons. Current implementation does not automatically change themes—use the Theme Designer to apply the mentioned colors (e.g., pink/yellow/black).

### Dynamic Pages (Services, Products, Reviews, Client Portals)

- **Services & Products:** Dynamic list pages (`/:slug/services`, `/:slug/products`) pull data from the backend. Card layout, CTA labels, and featured service slots are configured via the builder’s “Dynamic Blocks” section.
- **My Basket & My Booking:** The public site automatically links to `/[:slug]/basket` and `/[:slug]/book`. Managers can toggle the visibility of those links (and rename them) inside the navigation settings.
- **Reviews:** The testimonials widget can point to live review data or a curated list. Managers can toggle the reviews page link and display settings under the Reviews/Tips tab in Settings.
- **Show/Hide Pages:** The page list allows adding static landing pages, toggling visibility, or setting redirect targets. Dynamic system pages (services, products, reviews, basket, booking) can be hidden from the nav while remaining addressable via deep links.

## Website & Pages Tabs (Manager Portal)

The “Website & Pages” entry in the manager sidebar exposes four focused tools:

1. **Website Manager (`WebsiteManager.js`)**
   - Shows a list of existing pages (Home, Services, About, etc.) with status chips (draft vs published).
   - Quick actions: rename, duplicate, delete, set as homepage, or open in the Visual Site Builder.
   - Each row links to metadata (SEO title/description, Open Graph image, canonical URL).
   - Use this tab for rapid text tweaks or to re-order pages without opening the full canvas.

2. **Inline Site Editor (`InlineSiteEditor.js`)**
   - Loads the live site with floating inspector controls on top of each section.
   - Ideal for copy edits, swapping media, and testing responsive behaviour without leaving the page.
   - Inspector exposes the same props as the Visual Site Builder but in a lightweight overlay (no drag-and-drop rearrangement).

3. **Website Templates (`WebsiteTemplates.js`)**
   - Gallery of pre-built hero, services, testimonials, and landing pages curated by the design team.
   - Clicking “Preview” shows a live mock; “Import” drops the template into the current site so you can edit it in the builder.
   - Filters (industry, layout, color palette) help managers find relevant designs quickly.

4. **Visual Site Builder (`VisualSiteBuilder.js`)**
   - Full drag-and-drop editor described above (pages list, inspector, theme designer, AI assistant).
   - Primary workspace for structural changes, section reordering, and launching new landing pages.

### Domain & Publishing Tips

- Use the **Domain Settings** card to connect a custom domain or use the schedulaa.site slug. SSL status updates in real time.
- Publishing workflow is consistent across tabs: save draft changes → preview → publish. Inline edits and template imports feed into the same draft state, so there’s one source of truth.
