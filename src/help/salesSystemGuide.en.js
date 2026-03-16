export const ADMIN_GUIDE_EN = `
Schedulaa Sales System — Admin Guide

Purpose
- Track sales attribution for every customer
- Automatically calculate commissions in the Ledger
- Record manual payouts via Payout Batches (auditable)

Admin responsibilities
- Create Sales Reps and send invite/reset email
- Review commissions in the Ledger
- Create and pay monthly payout batches
- Audit actions in Audit Logs

Create a Sales Rep
1) Admin → Sales Reps → Create Sales Rep
2) Enter full name + email (+ phone optional)
3) Create → system sends password setup email

Why no admin-set passwords?
- Enterprise standard: reps set their own password via secure link

Resend invite/reset
- Sales Reps list → Send password reset
- Rep profile → Send invite email

Sales Rep Profile
- View KPIs and recent deals/customers
- Resend invite/reset
- Generate payout batch (fast flow)
- Jump to payouts list

Commission Ledger (source of truth)
- Admin → Sales Ledger
- Auto-created on successful Stripe invoice payment
- Shows: type (close_bonus/recurring), amount, rep/deal/company, invoice id
- Ledger entries are earned commissions, not necessarily paid yet

Payout Batches (monthly)
- Admin → Sales Payouts
- Filters: Rep, Status, Month/Year, Active-only
- One batch per rep per month

Batch lifecycle
- draft → approved → paid → (void draft only)

Generate batch
- Input rep + year + month + currency
- Outcomes:
  - no_payable_entries: nothing payable for that period
  - batch_exists: already created for that rep+month

Approve batch
- Optional checkpoint (draft → approved)

Mark paid
- After manual payment, enter paid_method and/or reference
- Batch becomes paid, ledger entries become paid with audit trail

Audit Logs
- Records generate/approve/mark_paid/void actions

AI SDR V1 — Admin operating model

Purpose
- AI SDR V1 is an admin-controlled outbound helper inside the existing Sales CRM
- It is limited to qualification, follow-up, controlled link delivery, callback scheduling, and deterministic CRM updates
- It is not a full autonomous closer, not a scheduler loop, and not a mixed human/AI ownership system

How AI SDR ownership works
1) Admin → Sales Reps → create a rep or edit a rep and set it as an AI rep
2) Admin → Sales CRM → assign leads to that AI rep
3) AI only works on leads owned by active AI reps
4) Human-owned leads are intentionally excluded from AI SDR

Primary admin controls
- Run once: picks the oldest eligible AI-owned lead and starts one AI call
- Pause AI: pauses an AI rep without deactivating the account
- Exclude from AI: blocks one lead from AI SDR while keeping assignment intact
- Start AI call: manually starts a call for one AI-owned lead from the lead drawer
- Apply result: writes a deterministic CRM outcome after the AI call

Operational stop / resume rules
- Global stop: set AI_SDR_ENABLED=false
- Per-AI-rep stop: use Pause AI on the AI rep
- Per-lead stop: use Exclude from AI, set a future callback, or mark do-not-call
- Resume: resume the AI rep or include the lead again, then use Run once or Start AI call

Lead drawer AI SDR tab
- Shows whether the assigned rep is AI or human
- Shows whether the lead is AI-excluded
- Shows whether the assigned AI rep is paused
- Shows the current AI block reason when one exists
- Shows AI call history, link-send flags, and recording link when present
- Shows the deterministic result form

Deterministic AI result policy
- asked_not_to_call_again -> do_not_call
- asked_for_info_by_email -> interested + demo link when appropriate
- wants_account_or_registration -> interested + existing SalesDeal invite flow
- unavailable_but_open_later -> callback required
- no_answer / voicemail / busy / wrong_number / not_interested -> matching existing CRM outcomes
- Important: sending a demo link does not mark booked_demo

Safe operating sequence
1) Create or mark the AI rep
2) Keep the AI rep active and unpaused
3) Assign the right leads to that AI rep
4) Exclude any lead you do not want AI to touch
5) Use Run once for controlled execution
6) Review the lead drawer AI SDR tab and apply a deterministic result if needed

Troubleshooting
- If Run once returns no-op, check AI ownership, pause state, AI exclusion, callback timing, business hours, and do-not-call state
- If Start AI call is disabled, the lead is blocked by the current AI safety rules
- If you want AI to stop immediately, pause the AI rep or disable the subsystem with AI_SDR_ENABLED=false

Plans & Pricing — How It Really Works (Important)

This section explains how plans, pricing, Stripe, and commissions work together in Schedulaa.

Please read this carefully if you are an Admin or a Sales Rep.

1) What does the “Plan” selection mean in Deals?

When creating a deal, you will see plan options such as:

Starter

Pro

Business

👉 This plan selection is a tracking label, not a guaranteed Stripe price.

It is used for:

Sales tracking and reporting

Deal attribution to the correct Sales Rep

Estimated MRR calculations in dashboards

It does not lock or force the final Stripe price.

2) Where does the real price come from?

The actual amount charged to the customer always comes from Stripe.

That means:

Coupons

Discounts

Promotions

Proration

Billing interval changes

are all handled by Stripe, not by the Sales portal.

👉 The Sales UI shows estimated pricing, but Stripe is the source of truth for billing.

3) Why might estimated MRR differ from Stripe revenue?

You may notice cases where:

The Sales portal shows a higher or lower MRR

The customer paid a discounted amount in Stripe

The commission amount is different than the plan’s list price

This is expected.

Why?

Sales dashboards show an estimate based on plan type

Stripe invoices show the actual amount paid

When promotions or discounts are active, these two numbers can differ.

4) How are commissions calculated?
✅ Current commission model (recommended & active)

Commissions are calculated based on Stripe invoice payments, not on plan list price.

That means:

Commission is created only after a successful Stripe payment

The commission amount is based on what was actually paid

Discounts or coupons reduce the commission accordingly

This ensures:

Accuracy

No over-payment

Full alignment with real revenue

5) Commission types you may see
Close Bonus

A one-time commission

Usually triggered by the first successful payment

Recurring Commission

Monthly commission

Applied for a limited number of months (for example: up to 12 months)

Created only when Stripe payments succeed

Both appear in the Ledger and later in Payouts.

6) What happens if there is a discount or promotion?

If a customer uses a discount:

Stripe charges a reduced amount

The commission is calculated on that reduced amount

The Ledger reflects the real paid value

👉 This is intentional and correct behavior.

If your organization wants commissions to ignore discounts, this requires a different commission policy and additional configuration.

7) What Sales Reps should tell customers

Sales Reps should:

Select the correct plan that matches the customer’s needs

Inform customers that promotions and discounts are handled at checkout

Never promise a specific commission amount based on plan list price alone

8) What Sales Reps should expect in the portal

Deals page: Shows selected plan for tracking

Ledger: Shows earned commissions after payments succeed

Payouts: Shows what has been paid out by Admin

If a payment has not succeeded in Stripe:

No commission will appear yet

9) Important clarification (to avoid confusion)

The plan shown in the Sales portal is not a billing guarantee.
Stripe invoices determine the final charged amount and commission base.

This protects both:

The company (accurate accounting)

Sales reps (transparent, auditable commissions)

10) Summary (one-minute version)

Plan selection = tracking & reporting

Stripe = billing source of truth

Commission = based on actual Stripe payments

Discounts affect commission unless otherwise configured

Payouts are manual but always recorded and auditable

Troubleshooting
- no_payable_entries: no payable ledger items for that period
- batch_exists: batch already created, open payouts list
- rep didn’t receive invite: resend reset; verify email
`;

export const SALES_REP_GUIDE_EN = `
Schedulaa Sales System — Sales Rep Guide

Purpose
- Track your deals, ledger, and payouts
- Commissions are calculated automatically

Login & password
- Sales portal: /sales/login
- Username = your email
- First-time access via invite/reset link
- Forgot password available

Deals & Customers
- Track your deals and acquired customers

Ledger (earned commissions)
- Created when Stripe invoice is paid
- Types:
  - close_bonus (one-time)
  - recurring (monthly)
- Linked to Stripe invoice for audit

Payouts (what got paid)
- Monthly batches recorded by Admin
- Shows: period, total, status, paid date, reference

Status meanings
- draft/approved = not paid yet
- paid = paid and recorded

Troubleshooting
- Missing commission: appears only after payment succeeds
- Ledger exists but no payout: admin has not created batch yet
- Paid but not visible: admin must mark batch as paid

Plans & Pricing — How It Really Works (Important)

This section explains how plans, pricing, Stripe, and commissions work together in Schedulaa.

Please read this carefully if you are an Admin or a Sales Rep.

1) What does the “Plan” selection mean in Deals?

When creating a deal, you will see plan options such as:

Starter

Pro

Business

👉 This plan selection is a tracking label, not a guaranteed Stripe price.

It is used for:

Sales tracking and reporting

Deal attribution to the correct Sales Rep

Estimated MRR calculations in dashboards

It does not lock or force the final Stripe price.

2) Where does the real price come from?

The actual amount charged to the customer always comes from Stripe.

That means:

Coupons

Discounts

Promotions

Proration

Billing interval changes

are all handled by Stripe, not by the Sales portal.

👉 The Sales UI shows estimated pricing, but Stripe is the source of truth for billing.

3) Why might estimated MRR differ from Stripe revenue?

You may notice cases where:

The Sales portal shows a higher or lower MRR

The customer paid a discounted amount in Stripe

The commission amount is different than the plan’s list price

This is expected.

Why?

Sales dashboards show an estimate based on plan type

Stripe invoices show the actual amount paid

When promotions or discounts are active, these two numbers can differ.

4) How are commissions calculated?
✅ Current commission model (recommended & active)

Commissions are calculated based on Stripe invoice payments, not on plan list price.

That means:

Commission is created only after a successful Stripe payment

The commission amount is based on what was actually paid

Discounts or coupons reduce the commission accordingly

This ensures:

Accuracy

No over-payment

Full alignment with real revenue

5) Commission types you may see
Close Bonus

A one-time commission

Usually triggered by the first successful payment

Recurring Commission

Monthly commission

Applied for a limited number of months (for example: up to 12 months)

Created only when Stripe payments succeed

Both appear in the Ledger and later in Payouts.

6) What happens if there is a discount or promotion?

If a customer uses a discount:

Stripe charges a reduced amount

The commission is calculated on that reduced amount

The Ledger reflects the real paid value

👉 This is intentional and correct behavior.

If your organization wants commissions to ignore discounts, this requires a different commission policy and additional configuration.

7) What Sales Reps should tell customers

Sales Reps should:

Select the correct plan that matches the customer’s needs

Inform customers that promotions and discounts are handled at checkout

Never promise a specific commission amount based on plan list price alone

8) What Sales Reps should expect in the portal

Deals page: Shows selected plan for tracking

Ledger: Shows earned commissions after payments succeed

Payouts: Shows what has been paid out by Admin

If a payment has not succeeded in Stripe:

No commission will appear yet

9) Important clarification (to avoid confusion)

The plan shown in the Sales portal is not a billing guarantee.
Stripe invoices determine the final charged amount and commission base.

This protects both:

The company (accurate accounting)

Sales reps (transparent, auditable commissions)

10) Summary (one-minute version)

Plan selection = tracking & reporting

Stripe = billing source of truth

Commission = based on actual Stripe payments

Discounts affect commission unless otherwise configured

Payouts are manual but always recorded and auditable
`;
