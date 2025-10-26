# Scheduling Application Frontend

## Questionnaire Upload Configuration

Set the corresponding environment variables in your `.env` (React) or `.env.local` (Vite) so the UI mirrors backend limits:

- `REACT_APP_QUESTIONNAIRE_STORAGE_PROVIDER` / `VITE_QUESTIONNAIRE_STORAGE_PROVIDER` - `local` (default) or `s3`; surface provider-specific messaging in the UI.
- `REACT_APP_QUESTIONNAIRE_ALLOWED_MIME` / `VITE_QUESTIONNAIRE_ALLOWED_MIME` - comma-separated MIME allow list used to populate file pickers.
- `REACT_APP_QUESTIONNAIRE_MAX_FILE_MB` / `VITE_QUESTIONNAIRE_MAX_FILE_MB` - maximum upload size shown in validation prompts.
- `REACT_APP_QUESTIONNAIRE_MAX_FILES_PER_SUBMISSION` / `VITE_QUESTIONNAIRE_MAX_FILES_PER_SUBMISSION` - cap enforced per submission, displayed in recruiter dialogs.
- `REACT_APP_QUESTIONNAIRE_AV_SCAN_ENABLED` / `VITE_QUESTIONNAIRE_AV_SCAN_ENABLED` - set to `true` to require antivirus clearance before downloads.

When S3 is enabled ensure the backend is configured with matching bucket and presign keys; for local uploads the frontend routes files through `/api/questionnaires/uploads/local` with the reserved token.

## Environment profiles

This repo ships with two React env files:

- `.env.local` – points the UI at `http://localhost:5000` and uses the test Stripe key. Use it while running `npm start`.
- `.env.render` – targets the Render deployment (`https://schedulaa.com` / `https://api.schedulaa.com`). Use it right before `npm run build` for production.

Switching between them is just a copy:

```bash
# Local dev
cp .env.local .env
npm start

# Render build
cp .env.render .env
npm run build
```

Because the environment selection happens outside the source code, you no longer need to edit JS files to bounce between localhost and Render.
