---
title: Custom Domain Guide
description: Step-by-step guide to connect a custom domain with DNS records and SSL.
---

# Custom Domain Guide

Follow these steps to connect your marketing site or booking experience to your own domain.

## Quick summary

- Your site will live at `www.yourdomain.com`.
- You will add 2 DNS records (1 TXT, 1 CNAME).
- SSL is automatic, no certificates to manage.
- Your root domain (`yourdomain.com`) can optionally redirect to `www`.

## What "DNS instructions generated" means

When you see this message, Schedulaa has already produced the DNS records you need to finish setup.
You will also see the DNS Instructions box with both records ready to copy.

Schedulaa uses the `www` version of your domain as the live website. The root/apex domain
(`yourdomain.com`) can optionally redirect to `www`.

## Add these two DNS records only

1) Verification (TXT)
- Type: TXT
- Host / Name: exactly as shown in Schedulaa (usually `_schedulaa` or `_schedulaa.www`)
- Value: the verification token shown in Schedulaa
- Do NOT include `yourdomain.com` in the Host field

2) Website (CNAME)
- Type: CNAME
- Host / Name: `www`
- Points to: the CNAME target shown in Schedulaa (for example `custom-hostnames.schedulaa.com`)

Save your changes and wait 5-30 minutes for DNS to update, then return to Schedulaa and click **Verify DNS**.

## Advanced / troubleshooting

- Host vs full domain: If Schedulaa shows `_schedulaa.www.yourdomain.com`, most registrars want only `_schedulaa.www`.
- CNAME vs A record: Use a CNAME for `www`. Do NOT use A records or IPs.
- Registrar edge cases: Some providers auto-append the domain. Follow their guidance for host/name format.
- Command-line checks (optional):
  - `nslookup -type=txt _schedulaa.www.yourdomain.com`
  - `nslookup -type=cname www.yourdomain.com`

## How long does DNS take?

- Most changes appear within 5-15 minutes.
- Some registrars can take up to 1 hour.
- Schedulaa automatically checks every few minutes; you can also click **Refresh Status**.

## Security and SSL

- SSL is issued automatically after DNS verification.
- This can take 5-30 minutes.
- During this time, a temporary browser warning is normal.
- No action is required from you.

## Before you start

- Confirm you have manager permissions for this company.
- Schedulaa uses the `www` version of your domain as the live website.
- Have your DNS credentials ready so you can add the TXT and CNAME records without delay.

## Purchase or choose a domain

If you need a new domain, buy it now (GoDaddy, Namecheap, Cloudflare, or your preferred registrar).
Use a clear brand name, avoid trademarks, and prefer .com when available.

## Important for GoDaddy domains

When purchasing a domain from GoDaddy, do NOT select AIRO / Free Website or forced website creation.
If AIRO was selected, contact GoDaddy support and ask them to detach the domain from Websites + Marketing (AIRO).

## Generate DNS instructions

Enter the domain inside Schedulaa and click **Generate DNS Instructions**.
Schedulaa issues a TXT record for ownership and a CNAME to route traffic.
Leave the instructions open so you can copy the exact host/value pairs into your DNS portal.

## Add DNS records at your registrar

Add these two DNS records only:

1) Verification (TXT)
- Type: TXT
- Host / Name: exactly as shown in Schedulaa (usually `_schedulaa` or `_schedulaa.www`)
- Value: the verification token shown in Schedulaa
- Do NOT include `yourdomain.com` in the Host field

2) Website (CNAME)
- Type: CNAME
- Host / Name: `www`
- Points to: the CNAME target shown in Schedulaa (for example `custom-hostnames.schedulaa.com`)

Save changes and give DNS a few minutes to propagate before you verify.

Tip: DNS instructions generated means Schedulaa already created your verification records. Add them to your registrar, save, and click **Verify DNS** to finish.

## Root domain (optional)

Your site lives at `www.yourdomain.com`.
You may optionally redirect `yourdomain.com` to `www.yourdomain.com`.

Some DNS providers may temporarily show NXDOMAIN for the root domain. This is normal and does not affect your website.

## Verify and go live

Back in Schedulaa, click **Verify DNS**.
When verification succeeds, SSL provisioning starts automatically.
Once SSL is active, update marketing links and emails to the new domain.

## What to expect after verification

- SSL certificates may take 5-30 minutes to activate.
- During this time, the site may show a temporary security warning.
- This resolves automatically once SSL is active.
- No additional DNS changes are required.

## Post-launch checklist

- Visit the new domain in an incognito window to ensure redirects and branding look right.
- Update Stripe, email templates, and QR codes if needed.
- Enable the email notification toggle in Schedulaa for DNS or SSL updates.

## Registrar playbooks

### GoDaddy Domain Connect

- Start from Schedulaa using the **Connect automatically** button when we detect GoDaddy.
- Approve the GoDaddy prompt. This authorizes TXT and CNAME updates.
- Return to Schedulaa; we will verify DNS and start SSL automatically.

### GoDaddy manual fallback

If Domain Connect fails, open GoDaddy > My Products > DNS > Manage Zones.
Add TXT `_schedulaa` with the token from Schedulaa.
Add CNAME `www` pointing to the CNAME target shown in Schedulaa.

### Namecheap manual steps

Go to Domain List > Manage > Advanced DNS.
Add a TXT record with host `_schedulaa` and the verification token (TTL 1 minute or Automatic).
Add a CNAME record for `www` pointing to the CNAME target shown in Schedulaa.

### Cloudflare registrar or proxy

In Cloudflare, add the TXT and CNAME records under DNS > Records.
If you are using Cloudflare for SaaS, keep the CNAME proxied (orange cloud) for the SaaS target.
If you are not using Cloudflare for SaaS, switch the CNAME to DNS only until verification finishes.

## Common mistakes

- TXT not found: Use the exact host shown in Schedulaa (for example `_schedulaa` vs `_schedulaa.www`).
- `www` does not load: Point `www` to the CNAME target shown in Schedulaa.
- SSL pending: Wait up to 30 minutes after verification.
- Root domain does not load: Use `www.yourdomain.com` (normal).
- GoDaddy issues: If AIRO is attached, ask GoDaddy to detach Websites + Marketing (AIRO).

## Advanced options (later)

- Automatic setup (GoDaddy Domain Connect): click **Connect automatically** and skip manual DNS entries.
- Cloudflare proxy: turn orange cloud off during verification, then back on once SSL is active.
- Apex forwarding: after `www` is live, add a forward from `yourdomain.com` to `www.yourdomain.com`.

## Ownership and safety

You always keep full control of your domain at your registrar.
Schedulaa cannot transfer, bill, or renew domains on your behalf.
We only verify ownership so the booking site can run securely on your hostname.

## Need more help?

Schedulaa support can walk you through DNS changes or complete Domain Connect on your behalf.
Share screenshots of your DNS zone or the exact error message to speed up troubleshooting.

## In summary

- Use `www.yourdomain.com`.
- Add one TXT and one CNAME.
- SSL is automatic.
- Root domain redirect is optional.
- Schedulaa never owns your domain.
