# Website Design Add-on (Phase 2)

This document is the source of truth for the Website Design add-on flow.

## Overview
- One-time Stripe payment for a Website Design service.
- After successful payment, a **website_design** ticket is created automatically.
- Ticket is the delivery channel (chat + audit).

## Manager Checkout Endpoint
**POST** `/api/manager/website-design/checkout`

Auth:
- Manager JWT required
- `_require_manager_for_company()`

Behavior:
- Creates Stripe Checkout Session (mode=payment)
- Line item: `WEBSITE_DESIGN_PRICE_ID`
- Success URL: `${FRONTEND_URL}/manager/tickets?wd=success`
- Cancel URL: `${FRONTEND_URL}/pricing?wd=cancel`
- Session metadata:
  - company_id
  - manager_user_id
  - addon=website_design
  - source=pricing_addon

Response:
```
{ "checkout_url": "https://checkout.stripe.com/..." }
```

## Webhook (authoritative)
Handled in `/billing/webhook` for `checkout.session.completed`.

If:
- `session.metadata.addon == "website_design"`
- `session.payment_status == "paid"`

Then:
- Create a ticket (idempotent):
  - `external_source = "stripe_checkout_session"`
  - `external_id = session.id`
- Ticket fields:
  - type: `website_design`
  - subject: `website`
  - sub_subject: `website_design`
  - status: `new`
- Create a system message with requirements checklist
- Audit log: `ticket.website_design.created`

Idempotency:
- Unique index on `(external_source, external_id)`

## Ticket Visibility
- Manager sees the ticket in `/manager/tickets`
- Admin sees the ticket in `/admin/tickets`

## Environment / Config
- `WEBSITE_DESIGN_PRICE_ID` must be set
- `FRONTEND_URL` used for redirects

## Smoke Tests
1) Checkout endpoint returns URL
2) Webhook creates exactly one ticket (repeat event -> no duplicate)
3) Manager `/api/support/tickets` shows `website_design` ticket
4) Ticket includes initial system message
