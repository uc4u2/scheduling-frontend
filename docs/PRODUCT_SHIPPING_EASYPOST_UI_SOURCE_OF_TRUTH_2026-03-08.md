# Product + Shipping + EasyPost UI Source Of Truth

Updated: 2026-03-08
Scope: manager product workspace, delivery setup, order actions, checkout/client behavior.

## 1) Manager UI Ownership Map

### Product workspace (source-of-truth entry)
- File: `frontend/src/pages/sections/management/ProductManagement.js`
- Responsibilities:
  - Product CRUD modal
  - Low-stock panel
  - Product stock history access
  - Delivery setup entrypoint (drawer/panel)
  - Product-level delivery override controls (exception-only)

### Delivery setup panel
- File: `frontend/src/pages/sections/management/EasyPostShippingSettingsPanel.js`
- Responsibilities:
  - Tab 1 `Delivery Methods`: checkout policy controls (`allow_pickup`, `allow_shipping`, `allow_local_delivery`, labels)
  - Tab 2 `EasyPost Automation`: API key, enable toggle, test connection, origin settings
  - Auto-load settings on mount
  - Help drawer for this panel

### Product orders + order detail actions
- File: `frontend/src/pages/sections/management/ManagerProductOrdersView.js`
- Responsibilities:
  - Orders table + detail drawer/modal
  - Fulfillment actions/timeline
  - EasyPost order-level actions (rates, buy label, shipment summary)
  - Label open/print when `label_url` exists

## 2) Client/Public UI Ownership Map

### Checkout
- File: `frontend/src/pages/client/Checkout.js`
- Responsibilities:
  - Reads delivery policy from `GET /public/<slug>/delivery-methods`
  - Renders allowed delivery methods only
  - If allowed methods are intentionally empty, shows message and no method options
  - If policy API fails (real failure), fallback-safe behavior can still apply

### Client Orders (My Bookings)
- File: `frontend/src/pages/client/ClientBookings.js`
- Responsibilities:
  - Orders tab list/detail
  - Customer-safe shipment/tracking display from order + `latest_shipment`

### Storefront list/detail
- Files:
  - `frontend/src/pages/client/ProductList.js`
  - `frontend/src/pages/client/ProductDetails.js`
  - `frontend/src/pages/client/MyBasket.js`

## 3) UX Contract (What each area decides)

- `Products -> Delivery setup -> Delivery Methods tab`:
  - Decides checkout delivery options shown to customer globally.
- `Products -> Delivery setup -> EasyPost Automation tab`:
  - Decides shipping automation capabilities (rates/label ops), not checkout option visibility by itself.
- Product modal `Override delivery methods`:
  - Exception layer for this product only.
  - OFF => uses workspace defaults from Delivery setup.
  - ON => uses per-product override flags.

## 4) Troubleshooting UI Symptoms

### A) Delivery setup opens but empty values shown initially
- Check that settings panel auto-load effect is present in `EasyPostShippingSettingsPanel.js`.

### B) Browser says CORS blocked on shipping settings
- Confirm frontend calls `/inventory/shipping-settings` (not `/company/shipping-settings`).

### C) Checkout shows all 3 methods unexpectedly
- Check returned payload from `/public/<slug>/delivery-methods`.
- If API returns empty intentionally, checkout should show no options (and warning message), not re-enable all.

### D) Manager cannot use rates/buy label actions
- Confirm order `delivery_method` and EasyPost settings/key status.
- Check ManagerProductOrdersView action warnings for stale rate / disabled / missing key paths.

## 5) Primary UI Validation Checklist

### Manager
1. Open Products workspace.
2. Open Delivery setup.
3. Confirm Delivery Methods and EasyPost Automation are separated.
4. Save policy and refresh panel; values persist.
5. Open Product modal and verify override helper text matches global-vs-exception behavior.

### Checkout
1. With shipping-only policy, only shipping appears.
2. With all methods disabled, method selector is effectively unavailable and warning is shown.
3. With API failure (simulated), fallback remains safe and does not crash checkout.

### Product Orders
1. Open order detail.
2. In EasyPost-related actions, refresh rates works when eligible/configured.
3. Buy label updates shipment summary and label actions.
4. Manual fulfillment/tracking remains usable.

### Client My Bookings
1. Orders tab lists order status fields.
2. For shipped orders with shipment data, tracking details and link display correctly.

## 6) Related Integration Files

- Dashboard composition:
  - `frontend/src/pages/sections/management/SecondNewManagementDashboard.js`
  - `frontend/src/pages/sections/Settings.js`
- Routing container:
  - `frontend/src/App.js`

## 7) Deploy/Crawl Note

- File: `frontend/scripts/run-react-snap.js`
- Purpose: prevent deploy failure on known crawl-only transient errors (`Stripe.js`, `Execution context destroyed`, `net::ERR_FAILED`) while still failing on real build errors.

---

## 8) Future Troubleshooting Strategy

When a product shipping issue is reported, inspect in this order:
1. `ProductManagement.js` (global policy + override setup)
2. `EasyPostShippingSettingsPanel.js` (policy persisted? automation configured?)
3. `Checkout.js` (policy application to customer method selector)
4. `ManagerProductOrdersView.js` (order-level automation actions and shipment render)
5. `ClientBookings.js` (customer-facing tracking/status rendering)
