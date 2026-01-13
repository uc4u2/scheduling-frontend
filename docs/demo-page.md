---
title: Demo Page
description: Public /demo landing page that shares the staging credentials, bypass OTP code, and quick-start checklist for evaluating the manager dashboard.
---

# Purpose

- Route: `/demo`
- Audience: Prospects who want to try the manager dashboard without booking a sales call.
- Highlights the shared staging login (email, password, OTP), explains that OTP is bypassed for the demo inbox, and links directly to `/login`.
- Embeds the manager-demo.mp4 video via `REACT_APP_DEMO_VIDEO` (default URL lives on Cloudflare R2).

# Credentials Section (“Demo credentials” card)

- Pulls values from env:
  - `REACT_APP_DEMO_EMAIL` (default `testschedulaa@gmail.com`)
  - `REACT_APP_DEMO_PASSWORD` (default `Test!12345`)
  - `REACT_APP_DEMO_OTP` (default `0000`, matches the backend bypass)
- Each row has a copy-to-clipboard button so visitors can grab the value and paste it into the login form.
- A chip at the top shows `Test drive · ${REACT_APP_DEMO_ENV}` (defaults to `Staging`).

# Quick Actions

Three suggested flows rendered via `QUICK_ACTIONS`:

1. **Review live scheduling** – create a shift, approve a swap.
2. **Verify payroll handoff** – run a payroll preview, inspect W‑2/T4 export.
3. **Trigger automations** – send a win-back campaign, update a landing page, confirm analytics refresh.

These help guide prospects to high-value areas once they log into `/manager/dashboard`.

# Video Panel

- `DEMO_VIDEO_SRC` points to the R2 CDN URL or whatever is provided via env.
- The preview card uses `PlayCircleOutlineIcon`; clicking the button opens the video in a new tab so the prospect can watch the walkthrough.

# CTA Buttons

- “Go to login” → `/login`
- “Talk to our rollout team” → `/contact`

# OTP Bypass Reminder

- Copy mentions: “OTP checks are bypassed for the demo inbox so you can jump straight into the product.” This refers to the backend logic guarded by `AUTH_BYPASS_OTP_EMAILS`.

# Schema / Meta

- `Meta` + `JsonLd` provide page title/description and a `WebPage` schema so the demo page shows up cleanly in search results.
