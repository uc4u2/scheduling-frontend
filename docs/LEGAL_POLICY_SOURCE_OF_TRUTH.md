# Legal Policy Source of Truth

Last updated: March 2, 2026

This document defines the canonical source for Schedulaa legal policy copy in this frontend codebase.

## Canonical Policy Files (Authoritative)

The following files are the only source of truth for public legal policy content:

- `src/landing/pages/legal/PrivacyPage.js`
- `src/landing/pages/legal/TermsPage.js`
- `src/landing/pages/legal/AcceptableUsePage.js`
- `src/landing/pages/legal/DataProcessingAddendumPage.js`

These pages are the policy versions linked from registration/footer/legal routes and must be updated together when legal copy changes.

## Non-Canonical / Legacy / Vendor Content

The following are not authoritative legal policy sources for Schedulaa production policy text:

- `src/PrivacyPolicy.js` (legacy page; do not treat as policy source of truth)
- `src/vendor-*/*` policy-like components and app pages (template/vendor content)
- `schedulaa-marketing-*` backup/vendor policy-like files in sibling repositories
- FAQ/help snippets that mention privacy/terms wording

If policy text in non-canonical files diverges, canonical files above take precedence.

## Update Rule

When policy language changes:

1. Update the 4 canonical files listed above.
2. Validate routes still point to these pages.
3. Optionally sync or remove stale duplicate text in non-canonical files.
4. Include legal-change note in commit message.

## Current Coverage

The canonical pages currently include:

- Fraud/security telemetry processing disclosures
- Masked-vs-full IP handling and restricted access language
- Risk-state and billing anti-abuse enforcement wording
- DPA security-log and subprocessor security processing clarifications
- AUP payment-abuse prohibition and review hold/suspension language
