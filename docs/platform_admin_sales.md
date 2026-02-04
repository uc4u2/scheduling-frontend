# Platform Admin + Sales System — Source of Truth

Last updated: 2026-02-04

This document is the canonical reference for the Platform Admin Command Center, Sales Rep portal, and related backend/DB/frontend changes.

---

## 1) High-level architecture

Two separate admin surfaces:

1) **Platform Admin (internal ops)**
   - API prefix: `/platform-admin/*`
   - UI prefix: `/admin/*`
   - Auth: **platform admin JWT** (`token_type="platform_admin"`)

2) **Sales Rep Portal (external sales team)**
   - API prefix: `/sales/*`
   - UI prefix: `/sales/*`
   - Auth: **sales rep JWT** (`token_type="sales_rep"`)

Tenant manager auth and routes are unchanged (all platform routes are isolated).

---

## 2) Backend: blueprints, auth, and services

### 2.1 Blueprints

- `backend/app/blueprints/platform_admin.py`
  - Registered at `/platform-admin`
- `backend/app/blueprints/sales_rep.py`
  - Registered at `/sales`

### 2.2 Auth middleware

- `backend/app/middleware/platform_admin_auth.py`
  - `platform_admin_required()` checks JWT and role
  - Accepts roles: `platform_owner`, `platform_admin`, `platform_support`
  - Requires JWT claim `token_type="platform_admin"`

- `backend/app/middleware/sales_rep_auth.py`
  - `sales_rep_required()` checks JWT
  - Requires JWT claim `token_type="sales_rep"`

### 2.3 Shared services

- `backend/app/services/sales_rep_reset.py`
  - `reset_token_serializer()`
  - `issue_reset_token(rep)`
  - Used by **both** Sales Rep portal and Platform Admin reset flows
  - Prevents circular imports

---

## 3) Backend: API endpoints

### 3.1 Platform Admin API (`/platform-admin`)

Auth:
- `POST /platform-admin/auth/login`
- `GET  /platform-admin/auth/me`

Global:
- `GET /platform-admin/search?q=...`
- `GET /platform-admin/audit-logs`

Tenant controls:
- `GET  /platform-admin/tenants/<company_id>`
- `GET  /platform-admin/tenants/<company_id>/users`
- `POST /platform-admin/tenants/<company_id>/users/<user_id>/disable`
- `GET  /platform-admin/tenants/<company_id>/billing/subscription`
- `GET  /platform-admin/tenants/<company_id>/billing/events`
- `POST /platform-admin/tenants/<company_id>/website/republish`
- `POST /platform-admin/tenants/<company_id>/website/clear-cache`
- `GET  /platform-admin/tenants/<company_id>/notes`
- `POST /platform-admin/tenants/<company_id>/notes`

Sales (Admin):
- `GET  /platform-admin/sales/reps`
- `POST /platform-admin/sales/reps`
- `POST /platform-admin/sales/reps/<rep_id>/reset-password`
- `POST /platform-admin/sales/reps/<rep_id>/set-active`
- `GET  /platform-admin/sales/reps/<rep_id>/profile`
- `GET  /platform-admin/sales/deals`
- `GET  /platform-admin/sales/deals/<deal_id>`
- `POST /platform-admin/sales/deals`
- `POST /platform-admin/sales/deals/<deal_id>/invite-link`
- `GET  /platform-admin/sales/ledger`
- `GET  /platform-admin/sales/rules`
- `POST /platform-admin/sales/rules`

Sales Payouts (Admin):
- `POST /platform-admin/sales/payouts/generate`
- `GET  /platform-admin/sales/payouts`
- `GET  /platform-admin/sales/payouts/<batch_id>`
- `POST /platform-admin/sales/payouts/<batch_id>/approve`
- `POST /platform-admin/sales/payouts/<batch_id>/mark-paid`
- `POST /platform-admin/sales/payouts/<batch_id>/void`

Notes:
- Platform endpoints **must not** require `X-Company-Id`.
- All mutating actions write `PlatformAuditLog`.

### 3.2 Sales Rep API (`/sales`)

Auth:
- `POST /sales/auth/login`
- `GET  /sales/auth/me`
- `POST /sales/auth/forgot`
- `POST /sales/auth/reset`

Deals:
- `POST /sales/deals`
  - Validates `plan_key` in `{starter, pro, business}`
  - Supports prospect email + name
  - Anti-cheat:
    - If prospect company already acquired by **same rep** → allow, mark `meta.type="reactivation"`
    - If acquired by **different rep** → block with `already_acquired`
- `GET  /sales/deals`
  Returns flattened invite fields:
  - `invite_sent_count`, `invite_sent_at`, `deal_type`
- `POST /sales/deals/<id>/invite-link`
- `POST /sales/deals/<id>/send-invite-email`

Commission / Customers / Payouts:
- `GET /sales/ledger`
- `GET /sales/summary`
- `GET /sales/customers`
- `GET /sales/payouts`

---

## 4) Database models (new/updated)

Added in `backend/app/models.py`:

- `PlatformAdminUser`
- `PlatformAuditLog`
- `PlatformTenantNote`

- `SalesRep`
  - `email`, `password_hash`, `is_active`, `last_login_at`
  - reset fields: `reset_token_hash`, `reset_expires_at`

- `SalesDeal`
  - `token_hash`, `token_used_at`, `invite_expires_at`
  - `status`, `plan_key`
  - `meta` stores:
    - `prospect_email`, `prospect_name`
    - `invite_sent_at`, `invite_sent_count`
    - `type` (e.g. `"reactivation"`)

- `SalesCommissionRule`

- `SalesCommissionLedger`
  - Unique constraint: `(stripe_invoice_id, deal_id, type)` for idempotency
  - Status lifecycle:
    - `pending_hold` (close bonus after invoice #1)
    - `payable` (eligible for payout batch)
    - `paid` (included in paid batch)
    - `voided_expired` (churned before eligibility)
  - Payout fields:
    - `batch_id`, `paid_at`, `paid_method`, `paid_reference`
    - `earned_at`, `payable_at`

- `SalesPayoutBatch`
  - `sales_rep_id`, `period_start`, `period_end`, `currency`
  - `total_payable_cents`
  - `status` (`draft|approved|paid|void`)
  - `approved_at`, `paid_at`, `paid_method`, `reference`, `notes`

Company acquisition attribution (on CompanyProfile if missing):
- `acquired_by_sales_rep_id`
- `acquired_channel`
- `acquired_at`

---

## 5) Registration / Deal Token flow

1) Sales Rep or Platform Admin generates invite link:
   - Signed token (7 days)
   - `SalesDeal.token_hash = sha256(token)`
2) Prospect registers via:
   - `https://www.schedulaa.com/register?deal_token=...`
3) Registration:
   - Validates token hash
   - Links `SalesDeal.company_id`, `manager_user_id`
   - Sets deal `status="activated"`
   - Applies company acquisition attribution fields

Hashing is unified to **sha256(token)** everywhere.

---

## 6) Billing commissions (Stripe webhook)

Commission ledger entries are written in `backend/app/routes.py` in the billing webhook handler.

**Event source:** `invoice.paid` only (avoids double-create).  
**Commission base:** `amount_paid` (fallback to `amount_due` or `total` if missing).

### Eligibility timing (v1)

1) **Close bonus**
   - Created on **invoice #1** with status `pending_hold`.
   - Becomes `payable` only after **invoice #2** is paid.
   - If subscription cancels before invoice #2 → status `voided_expired`.

2) **Recurring commission**
   - Starts on **invoice #2** and onward.
   - Created as `payable` immediately after invoice is paid.

3) **Payout batches**
   - Include **only** ledger rows with `status == "payable"` and `batch_id IS NULL`.

### Idempotency

- Unique constraint on `(stripe_invoice_id, deal_id, type)`
- Duplicate webhooks become no-ops

---

## 7) Payout batches (manual but auditable)

- Generate batch for a rep/month
- Approve (optional)
- Mark Paid (manual method + reference)

Every action writes an **Audit Log**.

---

## 8) Frontend routes (wiring)

### Admin
- `/admin/sales/payouts` → `src/admin/pages/SalesPayoutsPage.js`
- `/admin/sales/payouts/:batchId` → `src/admin/pages/SalesPayoutDetailPage.js`
- `/admin/sales/commission-rules` → `src/admin/pages/SalesCommissionRulesPage.js`

### Sales Rep
- `/sales/payouts` → `src/sales/pages/SalesPayoutsPage.js`

---

## 9) Smoke tests (payout flow)

1) Generate batch for rep/month
2) Approve batch
3) Mark batch paid
4) Verify ledger entries now `status=paid` with `paid_at/method/reference`
5) Verify rep sees payout in `/sales/payouts`

---

## 10) Commission wording cleanup

- Commission base = **Stripe invoice paid amount** (`amount_paid`)
- `amount_due` or `total` only used as fallback if `amount_paid` is missing
- No commissions are based on plan list price
