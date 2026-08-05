---
title: Billing and Subscription
description: Manage subscription status, seats, and billing portal access.
---

# Billing and Subscription

Billing controls live in Settings, and the sidebar has a shortcut entry.

## Where to click

Manager Portal → Billing & Subscription  
This opens: Manager Portal → Settings → Billing & Subscription

## What you can do

- View subscription status and renewal dates.
- Open the billing portal to update payment methods.
- Review seat counts and included staff limits.
- Review AI Commerce Copilot free-launch or paid-add-on status.
- Activate the AI Commerce Copilot add-on when paid enforcement is enabled and the tenant is eligible.

## Step-by-step

1) Open **Billing & Subscription** from the manager sidebar.
2) Review the **Plan**, **Status**, **Subscription**, and **Trial end** fields.
3) Use **Manage Billing** to update the payment method, billing email, or invoice details.
4) Use **View Plans** to compare plans or upgrade.
5) Use **Add Seats** to increase staff seats.
6) If you changed billing in Stripe, click **Sync from Stripe** to refresh.

## After checkout (automatic confirmation)

When you complete Stripe checkout, Schedulaa confirms your subscription in three steps:

1) **Confirm checkout** – We verify Stripe marked the checkout as complete.  
2) **Sync billing** – We pull the latest subscription data from Stripe.  
3) **Activate access** – Once the plan is **active** or **trialing**, you’re redirected to the dashboard.

If Stripe says the payment needs attention (past due/unpaid/incomplete), you’ll see a **Manage Billing** button so you can fix it immediately.

## Troubleshooting

- **I paid but I still see inactive**  
  Open Billing & Subscription and click **Sync from Stripe**. If it’s still inactive, click **Manage Billing** and check Stripe for payment issues.

- **Why does AI Commerce Copilot say “Included during free launch”?**
  The platform is still in Free Launch Mode. No separate Copilot add-on purchase is required in that mode.

- **How is AI Commerce Copilot shown in Billing?**
  It appears in its own add-on card with a compact free-launch status and usage summary. The detailed free-launch explanation is shown through the card’s help affordance instead of a full-width billing alert.

- **How is Field Photos shown before activation?**
  Field Photos appears in a separate add-on card. Before activation, the card shows the authoritative recurring starting price, included storage, retention, and a `View pricing & activate` action. No charge is created until the manager opens the confirmation modal and explicitly confirms the billing preview.

- **What happens after Field Photos is active?**
  The card switches to an operational view with storage used, total storage, storage expansion count, retention, and management actions. Pricing and expansion details remain available through the card help and confirmation modal.

- **How should trial dates render?**
  Show `Trial ends <date>` only when the subscription is actually `trialing` and the trial date is still in the future. Hide stale trial lines for active paid subscriptions. Use `Trial ended <date>` only when the historical date is still materially useful.

- **Why does AI Commerce Copilot ask me to activate an add-on?**
  The platform admin has enabled Paid Add-on Mode. Pro and Business tenants must activate the recurring Copilot add-on before creating new Copilot sessions or applying approved changes.

- **Why did the dashboard say “Confirming billing…”?**  
  This is normal immediately after checkout. It disappears once your subscription is active or trialing.

## Common questions

- **Why does it say inactive?**  
  No active subscription is attached yet. Choose a plan or click Manage Billing.

- **What counts as a seat?**  
  Active staff members. Archived staff do not count.

- **Can I downgrade?**  
  Yes. Use View Plans and choose a lower tier.
