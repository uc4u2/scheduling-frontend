# Questionnaire Storage & Uploads

This backend exposes configurable storage for recruiter questionnaires (doctor forms, etc.) and a consistent upload contract for both recruiters and candidates.

## Environment Variables

Set the following keys (also mirrored in `.env.example`):

- `QUESTIONNAIRE_STORAGE_PROVIDER` – `local` (default) or `s3`.
- `QUESTIONNAIRE_S3_BUCKET` / `QUESTIONNAIRE_S3_PREFIX` – bucket + prefix for S3 uploads (prefix defaults to `questionnaires/`).
- `QUESTIONNAIRE_LOCAL_ROOT` – folder under the Flask app root when using local storage.
- `QUESTIONNAIRE_ALLOWED_MIME` – comma-separated list of MIME types accepted by the reserve endpoints.
- `QUESTIONNAIRE_MAX_FILE_MB` – maximum file size per upload; used in client validation and presign policies.
- `QUESTIONNAIRE_MAX_FILES_PER_SUBMISSION` – hard cap enforced per submission/field.
- `QUESTIONNAIRE_AV_SCAN_ENABLED` – gate to require AV before files are treated as safe.
- `QUESTIONNAIRE_AV_WEBHOOK_SECRET` – shared secret for the AV callback.

When running in production with AV scanning, make sure the scanner posts results to `/api/questionnaires/uploads/scan-result` (see below) and use TLS for all callbacks.

## Upload Flow

1. **Reserve** – call `POST /api/questionnaires/uploads` (recruiter-authenticated) or `POST /api/candidate-form-submissions/<token>/uploads` (public invite token).  Send:
   ```json
   {
     "submission_id": 123,
     "field_key": "doctor_license",
     "filename": "document.pdf",
     "content_type": "application/pdf",
     "size": 524288
   }
   ```
   The response includes:
   - `file` – database record (`file_id`, `field_key`, etc.).
   - `upload` – provider metadata:
     - For **S3**: `url`, `method`, `fields`, `headers`, `object_key`, `bucket`, `max_bytes`.
     - For **local**: `url` (`/api/questionnaires/uploads/local`), HTTP method (`POST`), and a signed `token`.
2. **Upload** –
   - **S3**: POST directly to the returned URL with the included form fields and file.
   - **Local**: POST `multipart/form-data` to `/api/questionnaires/uploads/local` with fields `token`, `file_id`, and `file`.
3. **Complete** –
   - **S3**: call `POST /api/questionnaires/uploads/<file_id>/complete` (or the public token variant) to validate object size/checksum and mark the upload ready for scanning.
   - **Local**: the `/local` endpoint stores bytes and finalises the record.
4. **Scanning** – when AV is enabled, files remain `scan_status=pending` until the external scanner reports back.  Block downloads until `scan_status == 'clean'`.

## Antivirus Workflow & Downloads

- The antivirus service should POST scan outcomes to `/api/questionnaires/uploads/scan-result` with header `X-AV-Secret: <QUESTIONNAIRE_AV_WEBHOOK_SECRET>` and body:
  ```json
  {
    "file_id": 123,
    "status": "clean",            // pending | scanning | clean | blocked
    "details": {"engine": "clamav", "signature": "OK"}
  }
  ```
- Recruiters can retrieve clean files via `GET /api/questionnaires/uploads/<file_id>/download` (JWT auth). Candidates use `GET /api/candidate-form-submissions/<token>/uploads/<file_id>/download`.
- Downloads are gated: `scan_status` must be `clean` unless antivirus scanning is disabled. Blocked files return `423 Locked`; pending scans return `409 Conflict`.

Adapt these steps for doctor questionnaires or any professional intake forms that require custom documents.

## Frontend QA Checklist

- Local storage: set `QUESTIONNAIRE_STORAGE_PROVIDER=local` then confirm recruiter and candidate uploads succeed, the attachments dialog shows immediate availability, and replace flows update the file list.
- S3 storage: configure presigns, reserve an upload from the recruiter dialog, ensure the browser posts to the presigned URL, and verify completion updates the scan status.
- Antivirus pending: enable scanning, simulate a webhook with `scan_status=pending` and check the UI shows a warning badge and blocks submission.
- Antivirus blocked: post a blocked result and confirm download buttons disable and error messaging appears in both recruiter and candidate views.
- Download helper: open each attachment surface (candidate profile, recruiter attachments dialog) and confirm downloads route through the shared helper without exposing raw S3 URLs.
- Limits: try exceeding max file size/count and confirm client and server validation messages line up.

