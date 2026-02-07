# Support Access Playbook (Frontend Guide)

This doc explains how **support sessions** let platform admins/support edit
tenant pages without tenant passwords. It is the frontend companion to
`backend/docs/support_access_playbook.md`.

---

## 1) When support mode is active

Support mode is active when URL includes:
```
?support_session=<id>&company_id=<id>
```

Example:
```
/manager/website?support_session=123&company_id=1
```

---

## 2) API rule (CORS-safe)

Always use the shared API client (`src/utils/api.js`).
It automatically adds:
- `Authorization` (manager JWT if logged in)
- `X-Company-Id`
- `X-Support-Session` (for whitelisted endpoints)

If a support-mode request fails:
1. Check the endpoint in DevTools
2. Add its prefix to the support-session allowlist in `api.js`

Example allowlist entry:
```
url.startsWith("/api/chatbot/settings")
```

---

## 3) Consent flow UI

Consent link opens:
```
/manager/support-consent?token=...
```

The consent page:
✅ shows agreement  
✅ requires checkbox  
✅ calls `/api/support/sessions/approve-by-token`

---

## 4) Enabling support mode for a new tab

To allow support access for a manager tab (e.g., Payroll):

### Step A — Link
Open the tab with:
```
/manager/payroll?support_session=<id>&company_id=<id>
```

### Step B — API allowlist
Add the API prefix to support-session allowlist in `src/utils/api.js`.

### Step C — Backend
Ensure the matching backend endpoint uses:
```
@jwt_required(optional=True)
_require_manager_or_support_session("payroll")
```

---

## 5) Recommended scope mapping

| Feature | Scope |
|---------|-------|
| Website Builder | website_builder |
| Domain / DNS | domain_connect |
| All Website Manager features | website_all |

---

## 6) QA Checklist

✅ Support session link works  
✅ Consent page requires checkbox  
✅ APIs succeed with support_session header  
✅ Manager JWT still works normally  

---

Last updated: 2026-02-07

