# Support Sessions (Website Design Tickets)

This document is the source of truth for Support Sessions used to grant
time-limited, manager-approved access to website tools.

## Purpose
- Allow platform support/admins to edit a tenant’s website without tenant passwords.
- Access is gated by a Website Design ticket and explicit manager approval.
- Sessions are time-limited and auditable.

## Eligibility
- Ticket must be `type = "website_design"`.
- Support agent must have website coverage or be assigned to the ticket.

## Lifecycle
1) Admin requests access (pending)
2) Manager approves (approved)
3) Admin starts session (active)
4) Admin ends session or it expires (ended/expired)

## Endpoints
Platform Admin:
- POST `/platform-admin/tickets/<id>/support-session/request`
- POST `/platform-admin/tickets/<id>/support-session/start`
- POST `/platform-admin/tickets/<id>/support-session/end`

Manager:
- POST `/api/support/tickets/<id>/support-session/approve`

## Scopes
- `website_all`
- `website_builder`
- `domain_connect`

## Access Gate
Website/domain endpoints allow access if:
- manager JWT is valid, OR
- `X-Support-Session: <id>` is provided and the session is:
  - active
  - not expired
  - scope permits the action
  - company_id matches

## Audit
All session actions write PlatformAuditLog:
- `support_session.request`
- `support_session.approve`
- `support_session.start`
- `support_session.end`

