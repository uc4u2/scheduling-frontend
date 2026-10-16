# Schedulaa React Application Agent Guide

This repository owns the React manager, employee, client, recruiter, sales, and platform-admin experience. Flask remains authoritative for authorization, tenant data, money, publication state, and provider operations.

Before editing:

1. Read the central [Schedulaa engineering handbook](https://github.com/uc4u2/scheduling-application/blob/main/docs/CURSOR_ENGINEERING_HANDBOOK.md).
2. Read `docs/frontend-standards.md` and the feature's source-of-truth/help document.
3. Inspect `git status --short --branch`; preserve unrelated work and use an isolated worktree for concurrent work.
4. Inspect the backend contract and every affected consumer before changing API shapes.

Use npm and preserve `package-lock.json`. UI visibility is not authorization. Never print or commit credentials, publish tenant drafts implicitly, or deploy without authorization. The handbook defines test commands, production services, release order, and stop conditions.
