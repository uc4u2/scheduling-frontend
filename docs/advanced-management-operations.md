---
title: Advanced Management – Operations Tabs
description: Guide to the Manager Portal → Advanced Management workspace for services, products, add-ons, resources, bookings, payments, and analytics.
---

# Advanced Management Workspace

Use the **Advanced Management** sidebar inside the manager portal to configure the operational data model behind booking and payroll. The workspace is composed of dedicated tabs/cards—each backed by the React modules under `src/pages/sections/management/`.

## Services Catalog

- **Component:** `ServiceManagement.js`
- **What it does:** Create, edit, and archive services that appear on booking pages. Each service includes name, category, duration (minutes), base price, description, and optional gallery images.
- **Key actions:**
  - Fetch active services via `GET /booking/services?active=true`.
  - Inline edit with dialogs; switch between add/update modes.
  - Upload hero/gallery images per service (`POST /booking/services/:id/images`).
  - Delete or duplicate when offers change seasonally.
- **Best practices:** Keep descriptions concise for booking cards, and use categories to power segmentation + marketing filters.

## Add-on Builder

- **Component:** `AddonManagement.js`
- **Purpose:** Attach upsells and quick services to a base service (e.g., brow tint add-on, extended massage).
- **Fields:** name, description, base price, duration, and the parent service (autocomplete).
- **Flows:** CRUD against `/manager/addons`, upload add-on imagery, and filter by active base services.
- **Usage tips:** Link each add-on to the exact service SKU so eligibility is enforced during checkout.

## Product & Inventory

- **Component:** `ProductManagement.js`
- **Capabilities:**
  - Maintain retail SKUs (name, description, price, cost, track-stock toggle).
  - Manage quantity on hand and active/inactive flags.
  - Upload product photography to reuse on sites/checkout.
  - Endpoints: `/inventory/products` (GET, POST, PATCH, DELETE).
- **Why it matters:** Products flow into Manager Payments, product order exports, and the booking checkout when “sell a product” is enabled.

## Resource Scheduling

- **Component:** `ResourceManagement.js`
- **Function:** Track physical assets (rooms, chairs, devices) with capacity limits so the booking engine reserves space intelligently.
- **Fields:** name, description, capacity; APIs at `/booking/resources`.
- **Use case:** Pair a resource with services (e.g., 3 color chairs) to avoid double-booking limited inventory.

## Staff & Shift Templates

- **Components:** `EmployeeAvailabilityManagement.js`, `ShiftTemplateManager.js`, `ServiceAssignment.js`.
- **Highlights:**
  - Build reusable shift templates (name, start/end, day-of-week, role) and assign them to employees.
  - Edit employee availability blocks, PTO holds, and service proficiencies from one panel.
  - Templates feed the Workforce clocking UI and ensure policy-aware breaks.

## Booking Management

- **Component:** `BookingManagement.js`
- **Tools:**
  - Review current/future bookings with service, provider, and status chips.
  - Reassign to another employee, change dates/times, or cancel with notification.
  - Trigger “No Show” markers and manager notes; endpoints live under `/api/manager/bookings`.
- **Outcome:** Keeps schedules clean while preserving the audit trail and client comms.

## Manager Payments & Orders

- **Components:** `ManagerPaymentsView.js`, `ManagerProductOrdersView.js`.
- **Capabilities:**
  - Search/filter all charges, deposits, no-show fees, and tips; view captured vs pending balances.
  - Initiate charges or refunds when Stripe is connected (supports card-on-file, multi-currency, deposit releases).
  - Inspect product orders (online retail) and reconcile fulfillment.
- **Tip:** Payments view is the admin console for handling disputes, manual adjustments, or balance lookups before payroll.

## Client 360 & Segments

- **Components:** `Client360.js`, `ClientsSummaryTab.js`, `ClientsSegmentsTab.js`, `ClientsChurnRiskTab.js`.
- **What you get:** Unified client profiles with booking history, spend metrics, churn risk tags, and filtered segment exports (VIP, win-back, missed rebook, etc.).
- **Integration:** Marketing automations pull directly from these segments to send targeted campaigns.

## Analytics Dashboards

- **Components:** `AnalyticsDashboard.js`, `EnterpriseAnalytics.js`, `ProviderTop10.js`, `SegmentsPanel.js`.
- **Metrics:** Revenue trendlines, shift utilization, provider league tables, campaign performance, churn risk, and enterprise benchmarking for multi-location orgs.
- **Export:** Many cards include CSV export buttons and share links for executives.

## Website & Marketing Builders

- **Components:** `WebsiteBuilder.js`, `VisualSiteBuilder.js`, `InlineSiteEditor.js`, `AutoSiteBuilder.js`, `MarketingCampaignsTab.js`, `CouponManagement.js`.
- **Features:** Edit hosted sites, adjust layout via drag-and-drop, manage coupons, run campaigns, and preview booking widgets directly from Advanced Management.

## Putting It Together

1. Populate **Services, Add-ons, Products, and Resources** to define what can be booked or sold.
2. Configure **Shift templates and Staff availability** so Workforce + Payroll stay accurate.
3. Monitor **Bookings** and **Payments** for daily ops, then pivot to **Analytics** for strategic decisions.
4. Everything is centralized, so the assistant (and your managers) can answer “where do I edit ___?” by referencing these tabs.
