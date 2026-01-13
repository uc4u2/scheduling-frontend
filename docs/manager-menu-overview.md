---
title: Manager Menu Overview
description: Map of the Manager Portal sidebar (Advanced Management, Employee Management, Website & Pages, Payroll, Shifts, Leaves, Overview) and what each section controls.
---

# Sidebar Structure

The Manager Portal sidebar (`menuConfig` in `NewManagementDashboard.js`) groups every operations tool under high-level sections. Use this as a quick map when answering “Where do I change ___?”

## Advanced Management

- Launches the modal workspace documented in `advanced-management-settings.md`, `advanced-management-operations.md`, and `advanced-management-integrations.md`.
- Covers Services, Products, Add-ons, Resources, Shift templates, Booking management, Payments, Analytics, Stripe/Xero/QuickBooks, Domains, and the Visual Site Builder.

## Employee Management

### Company Profile (`CompanyProfile.js`)
- Manage legal + public info (name, address, slug, phone, website) and upload the logo.
- Select home country/province/state, currency display, tax behaviour (prices include/exclude tax), Stripe enablement, and card-on-file defaults.
- Maintain departments/locations that feed payroll classes, calendar filters, and QuickBooks/Xero mapping.
- Configure booking slug + viewer check to ensure public sites resolve correctly.

### Employee Profiles (`EmployeeProfileForm.js`)
- Add or edit employee records with name, email, role, compensation info, and portal access.
- Assign departments/locations, default services, wages/commission rates, and invite them to the portal (sends onboarding email + OTP login).
- Supports filtering active vs inactive, exporting to PDF, and comparing metrics inside the same frame.

## Website & Pages (`WebsiteSuite.js`)

- Tab launcher with four tools:
  1. **Website Manager** – manage published pages, hero messaging, and quick edits.
  2. **Inline Site Editor** – edit sections directly on the live layout with inspector controls.
  3. **Website Templates** – browse/import preset hero/service/landing templates.
  4. **Visual Site Builder** – full canvas editor with drag-and-drop, global styles, and publish flow.
- Includes fullscreen dialog controls and mirrors the help drawer referenced in the Website Builder guide.

## Advanced Payroll Group

- **Payroll (`Payroll.js`)** – run payroll drafts, approve time, generate summaries, sync to QuickBooks/Xero, and export CSV. (Payroll notifications use the built-in template today; email customization isn’t exposed yet.)
- **Saved Payrolls (`SavedPayrollsPortal.js`)** – archive of finalized runs; reopen to re-export or audit adjustments.
- **Tax (`TaxSetupCard.js`)** – configure tax countries, Stripe Tax registration, and inclusive/exclusive pricing rules.
- **ROE / T4 / W-2 (`ROE.js`, `T4.js`, `W2.js`)** – generate government forms for Canada (ROE/T4) and U.S. (W-2). Pull approved payroll data, let managers review, and export PDFs/CSV.
- **Payroll Raw (`PayrollRawPage.js`)** – raw dataset for power users; includes filters and downloads for reconciliation or custom analytics.
- **Payroll Audit** – audit log for payroll actions and finalized runs.
- **Invoices (`ManagerInvoicesPage.js`)** – billing/invoice history tied to payroll and subscriptions.

## Shifts & Availability Group

- **Available Shifts (`AvailableShiftsPanel.js`)** – view assigned shifts, approve swaps, and open a fullscreen calendar.
- **Available Slots (`AllEmployeeSlotsCalendar.js`)** – real-time booking grid across providers; supports timezone filters and slot editing.
- **Shift Management (`Team.js`)** – assign shifts, edit teams, enforce break templates, and manage coverage.
- **Time Tracking (`TimeEntriesPanel.js`)** – review clock-ins/outs, approve timesheets, and push anomalies to payroll.
- **Shift Monitoring** – live shift status and coverage view.
- **Fraud / Anomalies** – anomaly highlights for time tracking and attendance.

## Leaves, Swaps, and Audits

- **Leaves (`LeaveRequests.js`)** – approve/deny PTO and track accrual balances.
- **Swap Approvals (`ShiftSwapPanel.js`)** – manager decision center for peer-accepted shift swaps.
- **Attendance Calendar (`MonthlyAttendanceCalendar.js`)** – heatmap of presence/absence per day; download for HR.
- **Audit History (`AuditHistory.js`)** – chronological log of key actions (appointments, payments, integrations) for compliance.

## Overview Cluster

- The “Overview” section bundles shortcuts to Team Activity, Master Calendar, Candidate Funnel, Job Postings, Recruiter Performance, Candidate Search, Feedback & Notes, Recruiter Availability, Recent Bookings, Payroll Audit History, Monthly Attendance Calendar, and Candidate Profile.

## AI Copilot Surfaces

- **AI Website Assistant** – Inside the Visual Site Builder help drawer (`WebsiteBuilderHelpDrawer`). Managers describe their studio/service and the assistant drafts hero copy, sections, FAQs, and SEO text ready to paste into the builder. Only available to users with manager access to `/manager/website/editor`.
- **Onboarding Checklist** – Dashboard widget (“Getting started”) and dedicated page at `/manager/onboarding`. Generates a 2–3 week rollout plan (Day 0, Day 2, etc.), lets managers mark tasks complete, and can regenerate if the rollout changes.
- **Attendance Summaries** – Dashboard widget (“Attendance summary”) plus detail view at `/manager/attendance-summaries`. Weekly digests analyse ShiftLog data (missed breaks, late clock-ins, overtime) for compliance-ready narratives.
- **Payroll Explanations** – Appears inside the payslip modal (`PayslipModal`) under Payroll → history. When a payroll run finalizes, the assistant explains why net pay changed (e.g., CPP ceiling reached, overtime spike). This note is manager-facing; employee PDFs remain unchanged.

## Settings

- The Settings item routes to `SettingsPage` → the tabbed experience we documented earlier (Workspace, Profession, Embed, Reviews & Tips, Artist Visibility, Client Video, Stripe Hub, Checkout, Xero, QuickBooks, Integrations, etc.).

## Zapier

- The Zapier entry opens the integration page for Zapier API keys and event hooks.

## Billing & Subscription

- The Billing & Subscription entry opens Settings → Billing & Subscription for subscription status, seats, and billing portal access.
