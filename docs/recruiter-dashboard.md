---
title: Recruiter / Employee Dashboard
description: How schedulaa staff view shifts, manage availability, and monitor bookings from the Recruiter Dashboard.
---

# Recruiter Dashboard (Employee Portal)

The Recruiter Dashboard is the employee-facing hub reachable at `/recruiter` (Manager → Employee Management → Recruiter Dashboard). It is the same experience your frontline staff use to check shifts, submit availability, and review invites.

## Tabs

### 1. Calendar
- Interactive calendar backed by `InteractiveCalendar` + `MySetmoreCalendar`.
- Shows booked appointments, invites, and shared calendars.
- Managers can drill into individual bookings, edit, or cancel.
- Employees see their upcoming meetings, candidate status, and meeting links.

### 2. Availability
- Powered by `RecurringAvailabilityForm` and `my-availability` API.
- Create one-off or recurring availability slots (date, start, end, break rules, cooling time).
- Bulk delete or edit slots; pagination and month filters help focus on the right week.
- PTO / time-off requests sync to the same feed so conflicts are flagged.

### 3. Shifts (SecondEmployeeShiftView)
- Dedicated shift timeline with upcoming, in-progress, and completed shifts.
- Shows start/end, break windows, overtime warnings, and routing info for multi-location teams.
- Employees can confirm clock-ins and leave notes; managers see the audit trail.
- Shift swaps, coverage notes, and escalations surface here so staff never miss an update.

## Common Employee Actions

1. **View upcoming shifts**
   - Log in → Recruiter Dashboard → choose the **Shifts** tab.
   - Filter by date, location, or status; use the timeline to see today/this week.

2. **Check availability / request changes**
   - Go to the **Availability** tab.
   - Add single or recurring slots; adjust cooling time and one-time or daily messages.
   - Deleting a slot updates the shared scheduler immediately.

3. **Review bookings & invites**
   - The **Calendar** tab shows all assigned bookings with candidate info.
   - Clicking an event opens details (meeting link, notes, ability to cancel/resend invite).

4. **See invites/forms**
   - Recruiter Dashboard provides quick links to Invitations, Candidate Forms, and Upcoming Meetings via the navigation pills.

## Why this matters for the assistant
- When someone asks “Where do employees see their shifts?” → answer: **Recruiter Dashboard → Shifts tab**.
- When someone wants to know how to set staff schedules → mention **shift templates + Availability tab + Shifts tab**.
- When troubleshooting invites → direct them to the **Calendar tab** inside the same dashboard.
