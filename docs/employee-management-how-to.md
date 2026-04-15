---
title: Employee Management How-To
description: Update company profile details, manage employee profiles, and add team members.
---

# Employee Management How-To

## Where to click

Manager Portal → Employee Management

## Company Profile (deep dive)

1. Open **Company Profile**.
2. Update **Company name**, **Email**, **Phone**, **Website**, and **Address**.
3. (Optional) Expand **Payroll Settings** to set:
   - Default pay frequency and pay date rule.
   - US EIN (W-2 exports) or Canada BN/Payroll Program (T4/ROE exports).
4. (Optional) Expand **Payments & Tax** to review Stripe status, tax settings, and display currency.
   - Click **Manage Stripe Settings** to open Checkout Pro & Payments.
5. (Optional) Update **Public Site** slug and open the public site preview links.
6. (Optional) Add or edit **Departments** (locations).
7. Click **Save**.

## Employee Profiles (deep dive)

1. Open **Employee Profiles**.
2. Filter by **Department** and toggle **Show archived employees** if needed.
3. Select an **Employee** from the dropdown.
4. Update profile fields:
   - Name, email, phone, public title/role.
   - Department and hourly rate.
   - Country, province/state, and address.
   - Payroll identifiers (SIN / insurance numbers) if required.
   - Canada: RRSP contribution or employer match (if applicable).
5. Click **Save**.
6. Use the **Open Add Team Member** button if you need to create a new profile.

## Add Team Member (deep dive)

1. Open **Add team member**.
2. Enter **First name**, **Last name**, and **Email**.
3. Choose **Role** (Employee or Manager).
4. Select a **Department** (optional) and confirm **Timezone**.
5. Add address details (optional).
6. Set a **Password** that meets the strength rules and confirm it.
7. Accept the terms and click **Add team member**.
8. If you hit a seat limit, you will be prompted to add seats before continuing.

## Employee Access Permissions Source Of Truth

Use these rules when deciding which toggles to enable in Employee Management.

| Access | Intended owner | Includes | Does not include |
| --- | --- | --- | --- |
| Manager role | Company admin / owner | Full admin access across settings, payroll, scheduling, leave, catalog, and reports | N/A |
| HR onboarding access | HR admin / HR coordinator | Employee/profile edits, onboarding forms, candidate profile edits, Leave Settings, leave balance adjustments, Leave Reports, and accrual preview/posting | Payroll runs, service/product/add-on management, and carryover apply |
| Limited HR onboarding access | HR assistant / recruiting viewer | HR tabs and read-only candidate profile visibility | Employee profile edits, candidate edits, Leave Settings, Leave Reports, balance adjustments, accrual posting, and carryover apply |
| Supervisor access | Team lead / shift supervisor | Shift and availability tools, time tracking, fraud/anomaly review, swap approvals, master calendar, and leave approve/reject/cancel | Leave Settings, Leave Reports, leave balance adjustments, accrual posting, and carryover apply |
| Collect payments (self only) | Employee who checks out their own clients | Booking checkout for that employee's own bookings | Payroll, leave settings, reports, company-wide checkout, or accounting access |
| Payroll access | Payroll admin / accountant | Payroll runs, saved payrolls, tax forms, ROE, T4/W-2, invoices, Leave Reports, leave balance corrections, accrual posting, and carryover apply | Leave Settings and leave approve/reject/cancel |

Recommended setups:

- Team lead: Employee + Supervisor access.
- HR coordinator: Employee + HR onboarding access.
- Payroll admin/accountant: Employee + Payroll access.
- HR/payroll hybrid: Employee + HR onboarding access + Payroll access.
- Front desk self-checkout: Employee + Collect payments (self only).
