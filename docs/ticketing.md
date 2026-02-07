# Ticketing (Phase 1) — Foundation

This document is the source of truth for the Phase 1 ticketing system. Tickets are the single record of support requests: **ticket = job + communication + audit**.

## Scope (Phase 1)
- No attachments
- No websockets (polling only)
- No SLA/automation
- No canned responses
- No billing/Stripe addons

## Data Model
**Ticket**
- id
- company_id
- created_by_user_id
- type: support | website_design (support used in Phase 1)
- subject
- sub_subject (nullable)
- status
- assigned_admin_id (nullable)
- last_activity_at
- created_at, updated_at, closed_at

**TicketMessage**
- id
- ticket_id
- sender_type: tenant | agent | system
- sender_user_id (nullable)
- sender_admin_id (nullable)
- body
- created_at

**TicketCoverage** (platform support subject access)
- id
- platform_admin_id
- subject
- created_at

Indexes:
- Ticket(company_id, status)
- Ticket(last_activity_at)
- TicketMessage(ticket_id, created_at)
- TicketCoverage(platform_admin_id, subject)

Status set (support tickets):
`new, triaged, in_progress, waiting_on_tenant, needs_engineering, solved, closed`

## Permissions
### Tenant (manager)
- Can only access tickets belonging to their own company_id.

### Platform admin
- platform_owner / platform_admin: full access to all tickets.
- platform_support: can access tickets only when:
  - subject is in TicketCoverage for that agent, OR
  - assigned_admin_id == that agent.

## Tenant API (manager)
- GET  /api/support/tickets
- POST /api/support/tickets
  - body: { subject, sub_subject?, description }
  - creates ticket + initial message, status=new
- GET  /api/support/tickets/<id>
- POST /api/support/tickets/<id>/messages
  - body: { body }
  - blocked if status=closed

## Platform Admin API
- GET  /platform-admin/tickets
  - filters: status, subject, company_id, assigned=me|unassigned|all
- GET  /platform-admin/tickets/<id>
- POST /platform-admin/tickets/<id>/messages
- PATCH /platform-admin/tickets/<id>/status
- PATCH /platform-admin/tickets/<id>/assign
- GET  /platform-admin/team/coverage/<admin_id>
- PUT  /platform-admin/team/coverage/<admin_id>

## Audit Logging
All platform mutations write PlatformAuditLog:
- ticket.create
- ticket.message.create
- ticket.status.update
- ticket.assign
- team.coverage.update

## Frontend Routing
Tenant (manager):
- /manager/tickets (ManagerTicketsView)

Platform Admin:
- /admin/tickets
- /admin/tickets/:id

## Smoke Tests (curl)
Tenant:
```
curl -sS -X POST "http://127.0.0.1:5000/api/support/tickets" \
  -H "Authorization: Bearer $MANAGER_TOKEN" \
  -H "Content-Type: application/json" \
  -H "X-Company-Id: 1" \
  -d '{"subject":"website","sub_subject":"contact","description":"Contact form not sending."}' | jq

curl -sS "http://127.0.0.1:5000/api/support/tickets" \
  -H "Authorization: Bearer $MANAGER_TOKEN" \
  -H "X-Company-Id: 1" | jq
```

Admin:
```
curl -sS "http://127.0.0.1:5000/platform-admin/tickets" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq

curl -sS -X PATCH "http://127.0.0.1:5000/platform-admin/tickets/1/status" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"in_progress"}' | jq
```
