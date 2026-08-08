# Next.js Theme Local Release Test

Purpose

Use this for the local three-service verification of the first production-bound
Next.js theme bridge.

Services and default local ports

1. Manager frontend
   - `http://127.0.0.1:3002`
2. Backend API
   - `http://127.0.0.1:5001`
3. `tenant-web-next`
   - `http://127.0.0.1:3402`

Frontend environment variables used by the bridge

- `REACT_APP_API_URL`
  backend origin for catalog, status, preview-session, settings, and publish
  calls
- `REACT_APP_TENANT_WEB_NEXT_URL`
  origin used by the Website Style iframe preview for Next.js themes

Example local start

```bash
cd frontend
PORT=3002 \
BROWSER=none \
REACT_APP_API_URL=http://127.0.0.1:5001 \
REACT_APP_TENANT_WEB_NEXT_URL=http://127.0.0.1:3402 \
npm start
```

Builder verification flow

1. Open Operations Launcher
2. Confirm `Website Content Installed`
3. Open `Choose Website Style`
4. Open Visual Site Builder on the `Website Style` tab
5. Preview `Modern Gradient`
6. Navigate nested pages inside the iframe
7. Switch desktop / tablet / mobile widths
8. Click an editable slot and confirm the Builder selects the correct editor
9. Apply `Modern Gradient` to draft only
10. Confirm `WebsitePage` content remains unchanged
11. Restore `Classic`
12. Confirm published settings remain unchanged until publish
