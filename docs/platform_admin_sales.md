# Platform Admin + Sales System — Source of Truth

Last updated: 2026-01-31

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
- `GET  /platform-admin/sales/reps/<rep_id>/profile`
- `GET  /platform-admin/sales/deals`
- `GET  /platform-admin/sales/deals/<deal_id>`
- `POST /platform-admin/sales/deals`
- `POST /platform-admin/sales/deals/<deal_id>/invite-link`
- `GET  /platform-admin/sales/ledger`
- `GET  /platform-admin/sales/rules`
- `POST /platform-admin/sales/rules`

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

Commission / Customers:
- `GET /sales/ledger`
- `GET /sales/summary`
- `GET /sales/customers`

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

Company acquisition attribution (on CompanyProfile if missing):
- `acquired_by_sales_rep_id`
- `acquired_channel`
- `acquired_at`

---

## 5) Migrations (recent)

- `20260201_platform_admin`  
  Platform Admin tables + sales tables + attribution fields

- `0f65be3594c6`  
  Merge heads after platform admin migration

- `20260201_sales_rep_auth`  
  Sales rep auth fields (`password_hash`, `last_login_at`)

- `20260201_sales_rep_reset`  
  Reset token fields (`reset_token_hash`, `reset_expires_at`)

---

## 6) Registration / Deal Token flow

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

## 7) Billing commissions (Stripe webhook)

Commission ledger entries are written inside `backend/app/routes.py` in billing webhook handler:

- Triggered on `invoice.payment_succeeded` and `invoice.paid`
- If company has `acquired_by_sales_rep_id` and an activated deal:
  - Creates **close bonus** once
  - Creates **recurring** commission up to `months_cap`
  - Uses rule from `SalesCommissionRule` (default: 50% close / 15% recurring, 12 months)
- Idempotent:
  - Unique constraint + check by `stripe_invoice_id`

NOTE: Commission base is derived from Stripe invoice totals currently; align with plan price if required by policy.

---

## 8) Frontend (routes + files)

### 8.1 Platform Admin UI

Routes:
- `/admin/login`
- `/admin/*` (PlatformAdminShell)

Files:
- `frontend/src/admin/PlatformAdminLogin.js`
- `frontend/src/admin/PlatformAdminShell.js`
- `frontend/src/admin/pages/SearchPage.js`
- `frontend/src/admin/pages/Tenant360Page.js`
- `frontend/src/admin/pages/SalesRepsPage.js`
- `frontend/src/admin/pages/SalesRepProfilePage.js`
- `frontend/src/admin/pages/SalesDealsPage.js`
- `frontend/src/admin/pages/SalesLedgerPage.js`
- `frontend/src/admin/pages/AuditLogsPage.js`

API client:
- `frontend/src/api/platformAdminApi.js`
  - Token: `localStorage.platformAdminToken`
  - No `X-Company-Id`

### 8.2 Sales Rep Portal UI

Routes:
- `/sales/login`
- `/sales/forgot`
- `/sales/reset`
- `/sales/*` (SalesShell)

Files:
- `frontend/src/sales/SalesShell.js`
- `frontend/src/sales/pages/SalesLoginPage.js`
- `frontend/src/sales/pages/SalesForgotPasswordPage.js`
- `frontend/src/sales/pages/SalesResetPasswordPage.js`
- `frontend/src/sales/pages/SalesDealsPage.js`
- `frontend/src/sales/pages/SalesCustomersPage.js`
- `frontend/src/sales/pages/SalesLedgerPage.js`
- `frontend/src/sales/pages/SalesSummaryPage.js`

API client:
- `frontend/src/api/salesRepApi.js`
  - Token: `localStorage.salesRepToken`

---

## 9) Invite Email / Reset Email

### Invite email (Sales Rep):
- Endpoint: `POST /sales/deals/<id>/send-invite-email`
- Uses deal’s prospect email/name
- Stores in deal meta:
  - `invite_sent_at`
  - `invite_sent_count`

### Sales rep reset:
- Rep can request reset: `POST /sales/auth/forgot`
- Admin can force reset:
  - `POST /platform-admin/sales/reps/<id>/reset-password`
- Tokens signed using `sales_rep_reset` service module

Base URL for links:
```
FRONTEND_URL or FRONTEND_BASE_URL, fallback https://www.schedulaa.com
```

---

## 10) Quick smoke test

### Platform Admin
1) Login `/admin/login`
2) Search tenant → Tenant360
3) Create Sales Rep
4) Create Sales Deal (plan_key)
5) Generate invite link
6) Verify audit logs

### Sales Rep
1) Login `/sales/login`
2) Create deal
3) Send invite email
4) Register with deal_token
5) Sales summary shows activated + MRR

---

## 11) Files changed (core)

Backend (selected):
- `backend/app/blueprints/platform_admin.py`
- `backend/app/blueprints/sales_rep.py`
- `backend/app/middleware/platform_admin_auth.py`
- `backend/app/middleware/sales_rep_auth.py`
- `backend/app/services/sales_rep_reset.py`
- `backend/app/models.py`
- `backend/app/routes.py` (billing webhook commission ledger)

Frontend (selected):
- `frontend/src/App.js`
- `frontend/src/api/platformAdminApi.js`
- `frontend/src/api/salesRepApi.js`
- `frontend/src/admin/*`
- `frontend/src/sales/*`

---

If you want a one-pager for Sales Reps (external documentation), I can add a separate `docs/sales_rep_quickstart.md` with screenshots and sample workflows.
