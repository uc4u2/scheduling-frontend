# Support Sessions (Website Design Tickets)

This document is the source of truth for Support Sessions used to grant
manager-approved access to website tools.

## Purpose
- Allow platform support/admins to edit a tenant’s website without tenant passwords.
- Access is gated by a Website Design ticket and explicit manager approval.
- Sessions are time-limited and auditable.

## Eligibility
- Website design tickets: `ticket.type = "website_design"` (paid mode).
- Override sessions: allowed on non-paid tickets for admin/owner only.
- Support agent must have website coverage or be assigned to the ticket.

## Lifecycle
1) Admin requests access (pending)
2) Manager approves **with consent checkbox** (approved)
3) Admin starts session (active)
4) Admin ends session or it expires (ended/expired)

## Endpoints
Platform Admin:
- POST `/platform-admin/tickets/<id>/support-session/request`
- POST `/platform-admin/tickets/<id>/support-session/start`
- POST `/platform-admin/tickets/<id>/support-session/end`

Manager:
- GET `/api/support/sessions/<session_id>/approval-link`
- POST `/api/support/sessions/approve-by-token`
- POST `/api/support/tickets/<id>/support-session/approve` (legacy, requires consent)

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

Note: support session IDs are read from the current URL and are not persisted in storage.

## Consent
Consent is required before approval. Stored fields:
- `consent_version`
- `consented_at`
- `consented_ip`
- `consented_user_agent`

## Audit
All session actions write PlatformAuditLog:
- `support_session.request`
- `support_session.approve`
- `support_session.start`
- `support_session.end`
- `support_session.expired`

Audit logs are visible only to platform_admin/platform_owner.
