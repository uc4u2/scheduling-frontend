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

Commission policy (plain English)
- Current system calculates commission based on Stripe paid invoice totals
- Discounts/prorations affect commission amounts
- If you want plan list-price commissions, admin must change policy
`;
