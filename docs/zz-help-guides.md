# Help Guides (Source: frontend/src)

This document mirrors the in-app help content from frontend/src so the chatbot can answer "how-to" questions with the same guidance shown in the UI.

## Website Builder Guide
A quick, practical walkthrough to customize your site - content, images, styles, and publishing.

Quick actions
- Go to Page Style
- Go to Navigation
- Open Assets

1) Pick a page (or template)
- Open the Website Builder and select the page you want to edit (Home, Services, etc.).
- Each page is made of 'sections' (Hero, Gallery, Service Grid, Rich Text, FAQ, etc.).
- Click a section card to select it; the editor shows its fields on the right.
- Select pages with checkboxes to bulk-update settings or duplicate them.

2) Edit text and layout
- Headings and body: click the field and type. Rich text fields support basic formatting.
- Per-section controls include alignment, max width, padding, and optional 'bleed' (edge-to-edge).
- Advanced users: each section has an 'Advanced: raw JSON props' area for exact control.
- Blog posts are managed inside the Blog section (title, date, images, and body).

3) Add or replace images (everywhere)
- Any image field supports upload from your device (Upload or drag and drop).
- Galleries and carousels: add multiple items with 'Add image', each slot has its own uploader.
- Service cards and logo clouds also include uploadable image fields.
- Hero sections also accept background video (optional).
- Uploaded files go to Assets and can be reused across pages.
Tip: Prefer JPG/WEBP. Hero ~1600-2400px wide; gallery ~1200px. Large files are auto-sized; variants are created for faster pages.

4) Global 'Page Style' controls
- Background: set a solid color or upload a full-page background image (covers the whole page).
- Text colors: choose Heading, Body, and Link colors for the entire page.
- Typography: optionally set a Heading font and a Body font (use available, loaded fonts).
- Cards/boxes: control background color and opacity, corner radius, blur (glass effect), and shadow.
- Hero text: dedicated controls to force hero heading/text colors and add optional text shadow.

5) Save, Preview, Publish
- Save Draft frequently - your changes are stored but not visible to the public.
- Preview shows the page as visitors would see it (without publishing).
- Publish pushes the current draft live to your website.
- Autosave can be toggled per page in Page Settings.

6) Navigation menu
- Open Navigation to add, remove, or reorder menu items.
- Link items to a page (slug) or an external URL.
- Legal and footer links use the same page slugs (privacy, terms, cookies).

7) Revisions and undo
- Use the History tab to view or restore previous versions of a page.
- If you make a mistake, roll back to an earlier revision.

8) Assets, folders and tags
- All uploaded images are in Assets. Reuse them anywhere - no need to upload twice.
- Organize with folders and tags (great for larger libraries).
- Click "Open Assets" (above) for management.

9) Image sizing and optimization
- Uploads are automatically resized (server creates multiple width variants).
- Large files are rejected based on site policy (size cap) to keep pages fast.
- Prefer WEBP/JPG. Add alt text for logos/key images (accessibility + SEO).
- Storage is pluggable: today files live on the server; moving to S3/CDN later requires only a backend config change - the editor flow stays the same.

10) Website Navigation and Menu
- Open the "Website Navigation and Menu" panel to style the top bar while you work.
- Pick a variant (pill, underline, ghost, etc.) and set hover/active/background colors.
- Adjust spacing, padding, and the brand/slug font + size - the preview mirrors the nav instantly.
- Try Quick Presets for fast inspiration; fine-tune any value and click Save to keep it.
Menu visibility/order still comes from Page Settings (toggle "Show in menu" + sort order).

11) Live preview and sticky controls
- While styling nav or page visuals, the floating preview stays pinned near your scroll position.
- Use the toolbar to reset, compare, or save without climbing back to the top of the inspector.
- Click anywhere on the canvas (e.g., the Hero) to activate Inspector controls for that section.

Tips
- If text is hard to read on a busy background, lower card opacity, add blur, or tweak hero overlay.
- Use consistent fonts across the page for a cohesive look.
- Service Grid: add images and concise descriptions; keep prices/meta short.
- Logo Cloud: use monochrome option for a cleaner, unified look.

Troubleshooting
- Image doesn't show: ensure it's uploaded (Assets) or the URL is correct. Prefer your uploaded copy over external links.
- Fonts not changing: make sure the font is actually loaded in your app (e.g., via Google Fonts or self-hosted CSS), then set it in Page Style.
- Looks different from live: you may be viewing a draft. Click Publish to push changes.
- External image blocked: CSP/CORS on the source may block hotlinking. Upload the file to Assets instead.

About uploads
Files are stored on the server today and automatically resized into variants. When you move to S3 or another CDN, the upload flow and UI stay the same - only the backend storage target changes.

## Custom Domain Guide (manager)
Follow these steps to connect your marketing site or booking experience to your own domain.

Quick summary
- Your site will live at www.yourdomain.com.
- You will add 2 DNS records (1 TXT, 1 CNAME).
- SSL is automatic - no certificates to manage.
- Your root domain (yourdomain.com) can optionally redirect to www.

What "DNS instructions generated" means
- When you see this message, Schedulaa has already produced the DNS records you need to finish setup.
- You will also see the DNS Instructions box appear below the button with both records ready to copy.
- Schedulaa uses the www version of your domain as the live website. The root/apex domain (yourdomain.com) can optionally redirect to www.
- Add these two DNS records only:
  1) Verification (TXT)
     - Type: TXT
     - Host/Name: exactly as shown in Schedulaa (usually _schedulaa or _schedulaa.www)
     - Value: the verification token shown in Schedulaa
     - Do NOT include yourdomain.com in the Host field
  2) Website (CNAME)
     - Type: CNAME
     - Host/Name: www
     - Points to: the CNAME target shown in Schedulaa (for example custom-hostnames.schedulaa.com)
- Save your changes and wait 5-30 minutes for DNS to update, then return to Schedulaa and click Verify DNS.

Advanced / Troubleshooting
- Host vs full domain: If Schedulaa shows _schedulaa.www.yourdomain.com, most registrars want only _schedulaa.www (they add .yourdomain.com automatically).
- CNAME vs A record: Use a CNAME for www. Do NOT use A records or IPs.
- Registrar edge cases: Some providers hide host fields or auto-append the domain. Follow their guidance for host/name format.
- Command-line checks (optional):
  - nslookup -type=txt _schedulaa.www.yourdomain.com
  - nslookup -type=cname www.yourdomain.com

How long does DNS take?
- Most changes appear within 5-15 minutes.
- Some registrars can take up to 1 hour.
- Schedulaa automatically checks every few minutes; you can also click Refresh Status.

Security and SSL
- SSL is issued automatically after DNS verification.
- This can take 5-30 minutes.
- During this time, a temporary browser warning is normal.
- No action is required from you.

Before you start
- Confirm you have manager permissions for this company.
- Schedulaa uses the www version of your domain as the live website.
- Have your DNS credentials ready so you can add the TXT and CNAME records without delay.

Purchase or choose a domain
- If you need a new domain, buy it now (GoDaddy, Namecheap, Cloudflare, or your preferred registrar).
- Use a clear brand name, avoid trademarks, and prefer .com when available.
- Keep both www and bare versions handy in case you want apex forwarding later.

Important for GoDaddy domains
- When purchasing a domain from GoDaddy, do NOT select AIRO / Free Website or forced website creation.
- If AIRO was selected, contact GoDaddy support and ask them to detach the domain from Websites + Marketing (AIRO).

Generate DNS instructions
- Enter the domain inside Schedulaa and click Generate DNS Instructions.
- Schedulaa issues a TXT record for ownership and a CNAME to route traffic.
- Leave the instructions open so you can copy the exact host/value pairs into your DNS portal.

Add DNS records at your registrar
- Add these two DNS records only:
  1) Verification (TXT)
     - Type: TXT
     - Host/Name: exactly as shown in Schedulaa (usually _schedulaa or _schedulaa.www)
     - Value: the verification token shown in Schedulaa
     - Do NOT include yourdomain.com in the Host field
  2) Website (CNAME)
     - Type: CNAME
     - Host/Name: www
     - Points to: the CNAME target shown in Schedulaa (for example custom-hostnames.schedulaa.com)
- Save changes and give DNS a few minutes to propagate before you verify.
Tip: DNS instructions generated means Schedulaa already created your verification records. Add them to your registrar, save, and click Verify DNS to finish.

DNS details (optional)
- If you want extra DNS help, open the Advanced / Troubleshooting section below.

Root domain (optional)
- Your site lives at www.yourdomain.com.
- You may optionally redirect yourdomain.com -> www.yourdomain.com.
- This is recommended but not required.
- Some DNS providers may temporarily show NXDOMAIN for the root domain. This is normal and does not affect your website.

Verify and go live
- Back in Schedulaa, click Verify DNS.
- When verification succeeds, SSL provisioning starts automatically (Caddy or Cloudflare depending on your plan).
- Once SSL is active, flip any marketing links and emails to the new domain.

What to expect after verification
- After DNS verification, SSL certificates may take 5-30 minutes to activate.
- During this time, the site may show a temporary security warning.
- This resolves automatically once SSL is active.
- No additional DNS changes are required.

Post-launch checklist
- Visit the new domain in an incognito window to ensure redirects and branding look right.
- Update Stripe, email templates, and QR codes - they already use tenantBaseUrl but double-check your saved copy.
- Enable the email notification toggle in Schedulaa so managers know when SSL or DNS changes occur.

GoDaddy Domain Connect (automatic)
- Start from Schedulaa using the Connect automatically button when we detect GoDaddy.
- Approve the GoDaddy prompt - this authorizes us to add the TXT and CNAME on your behalf.
- Return to Schedulaa; we will poll GoDaddy, verify DNS, and start SSL automatically.

GoDaddy manual fallback
- If Domain Connect fails, open GoDaddy > My Products > DNS > Manage Zones.
- Add TXT _schedulaa with the token from Schedulaa. Add CNAME www pointing to the CNAME target shown in Schedulaa.
- Save and retry verification after a few minutes. Disable proxy or CDN if records still do not resolve.

Namecheap manual steps
- Go to Domain List > Manage > Advanced DNS.
- Add a TXT record with host _schedulaa and the verification token, TTL 1 minute or Automatic.
- Add a CNAME record for www pointing to the CNAME target shown in Schedulaa, save, then verify inside Schedulaa.

Cloudflare registrar or proxy
- In Cloudflare, add the TXT and CNAME records under DNS > Records.
- If you are using Cloudflare for SaaS, keep the CNAME proxied (orange cloud) for the SaaS target.
- If you are not using Cloudflare for SaaS, switch the CNAME to DNS only until verification finishes.

Common mistakes
- TXT not found: Host spelling mismatch. Fix: Use the exact host shown in Schedulaa.
- www doesn't load: CNAME target is wrong. Fix: Point www to the CNAME target shown in Schedulaa.
- SSL pending: SSL is still issuing after verification. Fix: Wait up to 30 minutes.
- Root domain doesn't load: Root domain is optional. Fix: Use www.yourdomain.com (normal).
- GoDaddy issues: AIRO is attached to the domain. Fix: Ask GoDaddy to detach Websites + Marketing (AIRO).

Advanced options (later)
- Automatic setup (GoDaddy Domain Connect): When available, click Connect Automatically and skip manual DNS entries.
- Cloudflare proxy: Turn the orange cloud off during verification, then back on once SSL is active.
- Apex forwarding: After www is live, add a forward from yourdomain.com to www.yourdomain.com inside your registrar dashboard.

Ownership and safety
- You always keep full control of your domain at your registrar.
- Schedulaa cannot transfer, bill, or renew domains on your behalf.
- We simply verify ownership so the booking site can run securely on your hostname.

Need more help?
- Schedulaa support can walk you through DNS changes or complete Domain Connect on your behalf.
- Share screenshots of your DNS zone or the exact error message to speed up troubleshooting.

In summary
- Use www.yourdomain.com.
- Add one TXT and one CNAME.
- SSL is automatic.
- Root domain redirect is optional.
- Schedulaa never owns your domain.

## Tax setup guide (for managers)
Follow this once and tax will be calculated automatically on every payment.

1) In this app - Company Profile
- Set Country and Province/State.
- Prices include tax: (currently ON - prices shown include tax)
- Prices include tax: (currently OFF - tax will be added on top)

2) Connect Stripe (one-time)
- Use the Connect with Stripe button above and finish onboarding.
- When it says Ready to accept payments, you're all set.

3) In Stripe - turn on Automatic tax
- Click Open Stripe Dashboard below.
- Go to Tax -> Overview and switch Automatic tax to ON.
- In Business information: set your Origin address (where your business is based).
- In Products and prices: pick a default tax category (start with "General - Services"; you can refine per product later).
- Include tax in prices? Choose No to add tax on top (most US/CA teams), or Yes if your prices already include tax.

4) Registrations (where you collect tax)
- Go to Tax -> Registrations.
- Add your home region (e.g., Ontario or Texas).
- Add other provinces/states only where you are registered or when Stripe notifies you that a threshold is met.
- Enable Thresholds monitoring so Stripe alerts you as you grow.

Tip
- If your price is $40 and Prices include tax is OFF, customers will see $40 + tax at checkout. If it's ON, the $40 already contains tax and Stripe will back the tax out automatically.

FAQs
- Do I need US registration to sell to US customers? Only if you meet a state's threshold or choose to register there. Start with your home region; add others as needed.
- Does Stripe handle receipts? Yes. Receipts are issued in your business name.
- What about cross-border orders? Tax depends on the buyer's location and where you're registered. If you aren't registered in a region, Stripe won't collect there.

## Employee Access Guide
Use this to decide which access toggles to enable for each team member.

Quick summary
- Managers have full access to payroll, scheduling, settings, and the service catalog.
- Employees are limited by the toggles you enable below.
- HR onboarding access does not grant service, product, or add-on management.

Role basics
- Employee: core staff tools (schedule, bookings, time clock).
- Manager: full admin access across settings, payroll, and catalog.

Access toggles
- HR onboarding access: manage onboarding forms and candidate profiles.
- Limited HR onboarding: view HR tabs and read candidate profiles only.
- Supervisor access: shift, time tracking, leaves, swap approvals, master calendar.
- Collect payments (self only): allows booking checkout for the employee's own clients.
- Payroll access: payroll runs, tax forms, ROE, T4/W-2, invoices.

Availability and slots
- Employees can edit their own availability only when HR onboarding access is enabled and workspace settings allow it.
- Team availability views and assigning slots for other employees require manager access.

Common setups
- Front desk coordinator: Employee + HR onboarding (no payroll).
- Team lead: Employee + Supervisor access.
- Payroll admin: Employee + Payroll access.

## Add Team Member Help
Fill in this form to create a staff account. Permissions are set later in Employee Management.

Before you submit
- Use a work email the staff member can access.
- Pick Manager only if they need full admin access.
- Timezone matters for availability and appointment times.

Permissions after creation
- HR onboarding access lets someone manage onboarding forms and candidate profiles.
- Supervisor access gives shift and availability tools.
- Collect payments (self only) lets an employee process payments for their own bookings.
- Payroll access opens payroll and tax tools.

Availability and bookings
- Employees can edit their own availability only if HR onboarding access is enabled and workspace settings allow edits.
- Team availability and assigning slots to others require manager access.

## SEO and Metadata help
Simple explanations for each field and how previews work.

Drafts and publishing
- Saving SEO creates a draft. Your public site will not change until you click Publish in Website and Pages.
- If you are testing and still see old text, publish first and then refresh your preview.

Search result listing
- Meta title and description are what Google shows most often.
- Keep the title under about 60 characters and the description under about 155 characters.
- Use plain language that matches what people search for.

Meta keywords
- Keywords are optional. Use 4 to 6 short phrases that describe your services.
- Separate phrases with commas.

Social sharing (Open Graph)
- Open Graph controls how links look in WhatsApp, Facebook, Slack, and SMS previews.
- Set a clear title and a short description. These can be different from your meta title.
- Use a 1200x630 image (PNG or JPG). If empty, your homepage hero image is used.

Preview domain and canonical
- Previews use your custom domain only after it is verified.
- Until then, previews use your schedulaa.com slug URL.

Favicon
- Your favicon is the small icon shown in the browser tab.
- If you do not upload one, we use your header logo as a fallback.
- Best size is 32x32 or 48x48 PNG (max 64x64).

Test preview buttons
- Use the Test buttons to open the live Open Graph preview HTML.
- If bots are still showing old data, publish and try again later. Some platforms cache previews.

Sitemap and robots
- Your sitemap lives at /sitemap.xml and robots rules at /robots.txt.
- After your custom domain is verified, those files use your custom domain instead of schedulaa.com.
- You can open the links from the SEO and Metadata card to verify what search engines will see.

Google Search Console
- Open Google Search Console and add your domain or URL property.
- Choose the HTML tag method, then copy only the token value (not the full tag).
- Paste the token here, click Save, then click Verify in Google.
- If you prefer DNS, paste the DNS token and add it as a TXT record at your registrar.
- After verification, submit your sitemap to speed up indexing.

## Payroll Preview Help
What each field does, and how it affects gross, taxes, and net pay.

Earnings (taxable)
- Bonus / Commission / Tips: Taxable extras. If an employee earned $100 in tips this period, enter 100 here - tips are taxable.
- Shift Premium: Extra pay for night/evening/weekend work. Taxable like regular wages.
- Travel / Allowances: Taxable allowances (per diem, small bonuses, etc.). Use this if the amount should be included in gross pay and taxed (CPP/EI/FICA + income tax).
- Vacation Pay: Optional override. Otherwise vacation is auto-calculated from rate x hours x vacation %.

Reimbursements (non-taxable)
- Non-taxable Reimbursement: Repay an expense (e.g., equipment, mileage) without taxing it. Added to net pay only; NOT included in gross or taxes.

Deductions
- Union Dues: Employee-paid union dues for this pay. Reduces net pay. For Canadian employees it is also reported on T4 Box 44.
- Garnishment: Flat legal deduction for this pay (e.g., child support). Reduces net pay. We do not automate court-order logic or remittance - send payments externally.
- Other Deduction: Catch-all deduction if you need a custom one-off amount.

Taxes and Statutory (auto)
- Federal/State/Provincial tax: Calculated automatically from region and earnings (unless overridden).
- CPP / EI (Canada): Withheld unless the employee is marked CPP/EI exempt in their profile.
- FICA / Medicare (US): Calculated automatically for US employees.

Examples
- Simple case: Employee works 9-5 with no changes: you typically don't edit anything. Gross/taxes/net are auto-calculated from approved time.
- Tips: Employee received $100 tips: enter 100 under Tips. It will be taxed and flow to W-2/T4.
- Reimbursement: Employee bought a $50 headset: put 50 in Non-taxable Reimbursement so they're repaid without extra tax.

CPP/EI exemptions (Canada)
- When to check CPP exempt: Rare. For employees already collecting CPP or otherwise exempt. Usually set by an admin/accountant. If unsure, leave unchecked.
- When to check EI exempt: Rare. For EI-exempt categories (e.g., certain family members/owners). Usually set by an admin/accountant. If unsure, leave unchecked.

## Direct Deposit Help
How to Upload Payroll File to Your Bank
- Download your payroll CSV/NACHA file from this system, then log in to your bank's business portal.
- For most banks: Go to Payroll/Payments, select Upload Payroll File, choose your CSV/NACHA file and submit.
- Bank-specific help:
  - RBC: https://www.rbcroyalbank.com/business/online-banking/payroll.html
  - TD Canada Trust: https://www.td.com/ca/en/business-banking/small-business/payroll
  - Scotiabank: https://www.scotiabank.com/ca/en/small-business/payroll.html
  - Chase (US): https://www.chase.com/business/online-banking/payroll
  - Wells Fargo: https://www.wellsfargo.com/biz/payroll-services/
- For others, search "[Bank Name] upload payroll file".

## Zapier setup guide and examples
Zapier lets you connect Schedulaa to 6,000+ apps without custom builds.

There are two sides to the integration:
- Triggers: Schedulaa sends events to Zapier when something happens. Examples: new booking, client no-show, staff clocks in, shift published, payroll finalized.
- Actions: Zapier creates things inside Schedulaa using your API key. Examples: create booking, create employee, create/update shifts, attach signed documents.

Step 0 - Create a Schedulaa API key
- Go to the Zapier tab. In the Zapier API keys card, create or copy your key. Paste this into Zapier when you connect Schedulaa. Keys are only shown once - create a new one to rotate.

Step 1 - Create a Zap trigger in Zapier (Catch Hook)
- In Zapier, click Create Zap.
- Choose Webhooks by Zapier -> Catch Hook.
- Zapier will give you a hook URL. Copy it.

Step 2 - Tell Schedulaa which event to send to that hook
- In the Zapier tab (Event hooks), paste the Zapier hook URL and choose an event: booking.created, booking.no_show, timeclock.clock_in, shift.published, payroll.finalized, payroll.details, payroll.payment_requested.
- (Optional) Add a secret if you want Schedulaa to sign payloads using HMAC. Click Add hook. Trigger the event once to see JSON in your Catch Hook.

Step 3 - Add actions in Zapier (Zapier -> Schedulaa)
- In your Zap, add an Action step.
- Choose the Schedulaa app (or your private Schedulaa Zapier app). When asked to connect, paste the API key from Step 0. Pick an action (create booking/employee/shift, attach document) and map fields.

Finance automation (payroll payment_requested)
- When a manager clicks Send payroll to Zapier, Schedulaa emits payroll.payment_requested.
- Start your Zap with Webhooks -> Catch Hook and add the hook above.
- Zapier can sync QuickBooks/Xero (journals), start approvals (Slack/Email), export CSV/SFTP, or trigger payout rails (Stripe/Wise).
- Optionally POST back to update status:
  - POST /integrations/zapier/payroll/payment-status
  - Headers: Authorization: Bearer <zapier_api_key>
  - Status options: requested, sent_to_zapier, processing, paid, failed, rejected, canceled.

Zap templates (examples)
1) QuickBooks payroll journal - Trigger: Catch Hook -> QuickBooks Online -> Create Journal Entry. Map gross (wages), deductions (liabilities), net (cash). Optional: POST payment-status to mark processing/paid.
2) Xero manual journal - Trigger: Catch Hook -> Xero -> Manual Journal. Map debit/credit from gross/deductions/net. Optional callback.
3) Slack approval workflow - Trigger: Catch Hook -> Formatter -> Slack message with net pay/period/payslip link. Optional Approve/Reject -> POST payment-status.
4) CSV -> Drive/SFTP export - Trigger: Catch Hook -> Formatter to CSV -> Upload to Drive/SFTP. Optional POST payment-status when processed.

Security notes
- Treat Zapier API keys like passwords. Rotate/revoke keys if needed.
- For sensitive workflows, use the Secret (optional) on event hooks and verify HMAC signatures.
- Advanced: Subscribe to payroll.details to stream per-employee payroll rows (hours, gross, net, taxes) to Sheets/BI. Ledgers are posted via native QuickBooks/Xero; Zapier is your automation layer.

## Enterprise Retirement Help
Who this is for
- U.S. payroll (401(k)) uses Enterprise retirement automatically.
- Canadian payroll continues to use standard RRSP (enterprise 401(k) does not apply).

What Enterprise Retirement does
- Auto-calculates 401(k) contributions using plan defaults and employee elections
- Enforces annual IRS limits automatically
- Updates W-2 wage bases and Box 12 (code D)

What you need to set up
- Enable Enterprise mode in Company Profile
- Create a retirement plan in Manager -> Payroll -> Retirement Plans (/manager/payroll/retirement)
- Optionally collect employee elections

How contributions are calculated
- Employee election wins; otherwise plan default is used
- Cap enforced at the annual employee limit
- Employer match is tracked for reporting; it does not reduce net pay

Why contributions stop
- Annual limit reached - contributions pause until next year
- A cap warning appears on the payroll preview when this happens

W-2 reporting
- Box 1: reduced by employee 401(k) deferrals
- Box 3 and 5: Social Security/Medicare wages (not reduced by 401(k))
- Box 12 D: total employee 401(k) deferral for the year

## GoDaddy Domain Forwarding Guide (public help page)
Locate your Schedulaa slug
- Open Manager -> Website -> Public Site. Copy the Company slug shown there.
- Your live URL always follows https://www.schedulaa.com/{slug}.

Open GoDaddy domain forwarding
- In GoDaddy go to Domains -> Manage DNS -> Forwarding -> Add Domain Forwarding.
- No DNS A/CNAME changes are required.

Forward with masking
- Choose Permanent (301).
- Enter the Schedulaa URL with your slug.
- Set Forward WITH masking so visitors keep seeing your domain.

Save and test
- Save the forwarding rule, wait a few minutes, then load your domain.
- It should now display your Schedulaa site with your domain in the bar.

FAQ
- Why can't I point DNS records directly to Schedulaa? Schedulaa routes public sites strictly by slug and does not currently issue SSL certificates per external domain. Forwarding keeps traffic secure on Schedulaa's certificates while showing your domain.
- Do I need TXT, A, or CNAME records? No. Forwarding with masking is the supported approach today. DNS changes would fail because Schedulaa does not terminate SSL for custom hosts yet.
- Can I use registrars other than GoDaddy? Yes - choose the equivalent forwarding + masking option your registrar provides and point it to https://www.schedulaa.com/{slug}.
