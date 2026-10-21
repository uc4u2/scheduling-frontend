# Checkout login and public navbar investigation

Reviewed frontend `d48e20c6bffed11467f9a2c0f9efad3e41d34adf`, renderer
`a8a6c07ff56b95789ff23574f6576dbeb48cae0b`, and the backend handoff service on
main. Production deployment revisions were not verified from this environment.

## Confirmed defects

1. `publishClientSessionState` dispatched an event and optionally notified a
   parent, but never persisted the tenant presentation flag. A top-level
   custom-domain checkout has no parent renderer to save it. The Next
   `ClientSystemNavigation` reads that flag after returning to services, so
   it can show Login despite a verified custom-domain client credential.
2. Bootstrap used the ordinary `/login` runtime. `PublicClientAuth` can navigate
   an existing client to `/dashboard`, destroying the receiver document and
   its in-memory PKCE verifier while the parent is creating a handoff code.
   Retrying the same code cannot recover a verifier lost with its document.
3. Both `bootstrapRequest` and the generic `installClientSessionBridge`
   listener handled the same handoff message. The generic listener sent no
   `code_verifier`; backend validation rejects that request before consuming
   the code. Its rejected request could publish signed-out alongside the
   valid bootstrap request. This is not evidence that it consumes the code.
4. The renderer redirected `/login` based only on the saved presentation
   flag. This contradicted the current frontend auth contract and could send
   an unverified frame to My Bookings and back to Login.
5. Existing handoff tests mocked successful verifier-less redemption, masking
   the frontend/backend contract mismatch. No bootstrap-specific regression
   existed in that test file.

The supplied logs show creation (201) but no redemption in that log excerpt.
They do NOT prove a lost postMessage, a deployment race, or which document was
destroyed. Those remain live-browser questions.

## Proposed corrections

- Persist only the tenant-scoped boolean navbar hint when publishing verified
  session state; never persist a code or expose credentials to the renderer.
- Route the exact embedded bootstrap URL to a minimal receiver with no login
  UI, existing-session redirect, or dashboard routing.
- Let only the listener owning the verifier redeem a code. Remove unused
  verifier-less issuance/storage helpers and replace obsolete tests.
- Do not tear down the sender on an unrelated existing-session report; require
  authenticated completion. Ignore a late code response after teardown.
- Companion renderer patch removes the saved-hint redirect; verified iframe
  messages still drive redirects and preserve package/order continuation.

## Validation and remaining release gates

- 82 focused frontend tests passed (session lifecycle, bootstrap, API
  interceptors, application selection, PublicClientAuth, Checkout).
- Both new bootstrap regression tests failed against the original
  `clientSession.js`, and passed against the patch.
- Nine renderer tests passed using an isolated React 18/Jest harness with
  only import aliases and `vi` adapted. This is not the renderer's native
  React 19/Vitest build; run its native tests/typecheck/lint/build before merge.
- Run the production frontend build and lint on the final commit in CI.
- No customer login, booking, charge, migration, or deployment was performed.

### Required browser acceptance for Codex

Use isolated worktrees and an approved test client. Record deployed SHAs and
frame URLs/origins. Do not log codes, verifier values, JWTs, passwords or PII.

1. Fresh browser: login from custom-domain checkout, then Add another service.
   Confirm navbar My Bookings, open it, and confirm no second login.
2. Capture the sequence: create 201, exactly one redeem 200 with locally owned
   verifier, tenant `/me` 200, then authenticated completion.
3. Repeat with an existing app-origin session (including a different test
   client), slow network, and immediate Add another service / navbar clicks.
   The sender remains asynchronous: navigation can still destroy an in-flight
   sender. If reproduced, add an awaited completion/retry mechanism at the
   navigation owner; do not treat this draft as a complete fix for that race.
4. Repeat the opposite direction: navbar login then checkout. The current
   handoff is custom-origin to app-origin only; verify the actual route origins
   and implement a bounded reverse flow if checkout still uses another store.
5. Logout from My Bookings, return to checkout, and confirm the old credential
   is rejected. Test a handoff issued before logout but redeemed afterwards:
   the reviewed backend record does not capture session_version and redemption
   mints the current version. Address any post-logout session resurrection
   before releasing a broader logout guarantee.
6. Test expired sessions, storage-blocking browser settings, wrong tenant,
   wrong origin/source, and package/order continuation. A header hint must not
   authorize data or force a redirect.

Do not deploy repeated speculative fixes. Keep these changes in draft until
the real multi-origin journey and the identified lifecycle gaps are resolved.
