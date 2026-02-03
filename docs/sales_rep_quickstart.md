# Sales Rep Quickstart (Schedulaa)

This is the one‑pager for Sales Reps and Admins to understand the Sales system end‑to‑end. It reflects the current backend + frontend implementation.

---

## 1) Who this guide is for

- **Sales Reps:** manage deals, invitations, ledger, and payouts.
- **Platform Admins:** create reps, approve payouts, and audit activity.

---

## 2) URLs (portals)

- **Sales Rep Portal:** `/sales/*`
  - Login: `/sales/login`
  - Deals: `/sales/deals`
  - Ledger: `/sales/ledger`
  - Payouts: `/sales/payouts`
  - Customers: `/sales/customers`

- **Platform Admin Portal:** `/admin/*`
  - Sales Reps: `/admin/sales/reps`
  - Sales Deals: `/admin/sales/deals`
  - Sales Ledger: `/admin/sales/ledger`
  - Sales Payouts: `/admin/sales/payouts`
  - Commission Rules: `/admin/sales/commission-rules`

---

## 3) Admin: Create a Sales Rep (Invite Flow)

1. Go to **Admin → Sales Reps**
2. Click **Create Sales Rep**
3. Fill **Full name + Email** (phone optional)
4. Submit

What happens:
- Rep is created
- **Invite / reset email** is sent automatically
- Rep sets their password via secure email link

If they didn’t receive the email:
- Click **Send password reset** on the rep row or rep profile

---

## 4) Sales Rep: Create a Deal

1. Go to **Sales → Deals**
2. Select **Plan** (Starter / Pro / Business)
3. Add **Prospect name + email**
4. Click **Create Deal**

Notes:
- Plan is for **tracking only** (see Pricing section below)
- You can **Generate invite link** or **Send invite email**

---

## 5) Deals → Invite → Registration

- Invite link is sent to the customer
- Customer registers using the invite link
- Company is created with sales attribution
- Deal is marked **activated**

---

## 6) Ledger (Commission Records)

**Ledger = earned commissions** (created automatically after Stripe payment succeeds)

Types:
- **close_bonus**: one‑time
- **recurring**: monthly for X months

If payment fails → no commission entry.

---

## 7) Payouts (Manual but Audited)

**Admin → Sales Payouts**

- Generate batch for a rep/month
- Approve (optional)
- Mark Paid (manual method + reference)

Every action writes an **Audit Log**.

**Sales Rep → Payouts** shows what has been paid.

---

## 8) Customers (Sales Rep view)

**Sales → Customers** shows:
- Company name / slug / email
- Subscription status
- Plan
- Last paid date
- Quick actions: copy slug, copy public link, open

---

## 9) Plans & Pricing — How It Really Works (Important)

This section explains how plans, pricing, Stripe, and commissions work together in Schedulaa.

**1) What does the “Plan” selection mean in Deals?**

When creating a deal, you will see plan options such as:

- Starter
- Pro
- Business

👉 This plan selection is a **tracking label**, not a guaranteed Stripe price.

It is used for:
- Sales tracking and reporting
- Deal attribution to the correct Sales Rep
- Estimated MRR calculations in dashboards

It does **not** lock or force the final Stripe price.

**2) Where does the real price come from?**

The actual amount charged to the customer always comes from **Stripe**.

That means:
- Coupons
- Discounts
- Promotions
- Proration
- Billing interval changes

are all handled by Stripe, not by the Sales portal.

👉 The Sales UI shows estimated pricing, but **Stripe is the source of truth** for billing.

**3) Why might estimated MRR differ from Stripe revenue?**

You may notice cases where:
- The Sales portal shows a higher or lower MRR
- The customer paid a discounted amount in Stripe
- The commission amount is different than the plan’s list price

This is expected.

Why?
- Sales dashboards show an estimate based on plan type
- Stripe invoices show the actual amount paid

When promotions or discounts are active, these two numbers can differ.

**4) How are commissions calculated?**

✅ Current commission model (recommended & active)

Commissions are calculated **based on Stripe invoice payments**, not on plan list price.

That means:
- Commission is created only after a successful Stripe payment
- The commission amount is based on what was actually paid
- Discounts or coupons reduce the commission accordingly

This ensures:
- Accuracy
- No over‑payment
- Full alignment with real revenue

**5) Commission types you may see**

- **Close Bonus**: one‑time commission (first successful payment)
- **Recurring Commission**: monthly commission for a limited number of months

Both appear in the Ledger and later in Payouts.

**6) What happens if there is a discount or promotion?**

If a customer uses a discount:
- Stripe charges a reduced amount
- The commission is calculated on that reduced amount
- The Ledger reflects the real paid value

👉 This is intentional and correct behavior.

**7) What Sales Reps should tell customers**

- Select the correct plan for tracking
- Explain that promotions/discounts apply at checkout
- Never promise a commission amount based on list price alone

**8) What Sales Reps should expect in the portal**

- Deals page: shows selected plan (tracking)
- Ledger: commissions after payments succeed
- Payouts: what Admin has marked paid

If a payment has not succeeded in Stripe:
- No commission will appear yet

**9) Important clarification**

The plan shown in the Sales portal is **not a billing guarantee**.
Stripe invoices determine the final charged amount and commission base.

**10) One‑minute summary**

- Plan selection = tracking & reporting
- Stripe = billing source of truth
- Commission = based on actual Stripe payments
- Discounts affect commission unless otherwise configured
- Payouts are manual but always recorded and auditable

---

## 10) Troubleshooting

- **Invite email not received** → Admin: click “Send password reset”
- **No commission showing** → Stripe payment hasn’t succeeded yet
- **Payout missing** → Admin hasn’t generated/marked the batch
- **Login blocked** → Admin may have deactivated the rep

---

## 11) Admin Audit Logs

Every critical action (rep activation, payouts, etc.) is written to PlatformAuditLog.

---

## 12) Support

If anything looks off, contact the platform admin team.
