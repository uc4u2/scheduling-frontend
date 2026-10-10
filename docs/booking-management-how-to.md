---
title: Booking Management How-To
description: Manage bookings from the Manager Portal.
---

# Booking Management How-To

## Where to click

Manager Portal → Services & Bookings → Bookings

For the calendar and payment workflow, open:

Manager Portal → Services & Bookings → Booking Checkout

## Booking Checkout calendar

- The calendar opens with today selected.
- Select a date to show that day's bookings below the calendar.
- Completed and cancelled bookings remain visible with their actual booking and payment statuses.
- On desktop, select a calendar event or a daily booking card to open the same Collect Payment dialog. On mobile, selecting a date, event, or overflow link moves to that day's booking cards; select a card to open payment details.
- Department, employee, and calendar-view controls are under **Filters & calendar options**, which is collapsed by default. The active filter summary remains visible on larger screens and is hidden on narrow screens to prevent clipping.
- When one employee is selected, calendar rendering, Today, the selected-day list, and availability mutations use that employee's effective availability timezone. The All Employees view retains the viewer's display timezone and keeps mutations disabled. Backend-localized ISO timestamps remain the source data; the UI does not truncate UTC timestamps or infer payment state from booking state.

## Selected-day availability

Managers and team members with **Manage shifts** permission can manage the selected day's free availability from Booking Checkout after selecting one employee.

- **Edit Available Window** keeps existing free slots whose employee-local start falls inside the chosen range. It does not create, extend, or reopen availability.
- **Close Day** removes free availability for that employee-local day. Existing bookings are preserved; attendance, payroll, refunds, and shifts are unchanged.
- The result reports both removed free slots and booked slots that were preserved, including zero-result actions.
- **Refresh availability** reloads the selected employee's current free/booked fragments. Individual slot editing and deletion remain in Advanced Management.

These actions use the canonical bulk availability endpoints and require manager or Manage shifts permission. Payment-only permission does not grant availability access, and All Employees cannot be used as a mutation target.

## Step 1: Find a booking

1. Use the date range and status filters.
2. Click a booking row to open details.

## Step 2: Edit or reassign

1. Change the date/time if needed.
2. Reassign to another staff member.
3. Add a manager note.
4. Save changes.

## Step 3: Cancel or mark no-show

1. Open the booking.
2. Click **Cancel** or **Mark No Show**.
3. Confirm the action and notifications.
