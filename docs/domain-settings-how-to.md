---
title: Domain Settings How-To
description: Connect and verify a custom domain from Website & Pages.
---

# Domain Settings How-To

## Where to click

Manager Portal → Website & Pages → Website Manager → Domain Settings

## Step 1: Enter your domain

1. Enter your domain without the protocol (example: yourdomain.com).
2. Schedulaa will connect `www` automatically.

## Step 2: Choose connection method

### Manual setup

1. Click **Generate DNS Instructions**.
2. Add the TXT and CNAME records to your registrar.
3. Return to Schedulaa and click **Verify DNS**.

### Connect automatically (GoDaddy)

1. Click **Connect automatically** when GoDaddy is detected.
2. Approve the GoDaddy prompt to add DNS records.
3. Return to Schedulaa and verify.

## Step 3: Wait for SSL

1. SSL provisioning starts after DNS verification.
2. Status changes from **Provisioning** to **Active**.

## Step 4: Refresh status

1. Click **Refresh** if the status has not updated.

Notes:
- For full DNS instructions and troubleshooting, see **Custom Domain Guide**.

