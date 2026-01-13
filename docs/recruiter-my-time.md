---
title: My Time & Clock
description: In-app employee workspace for clocking in/out, monitoring break compliance, and surfacing roster anomalies.
---

# My Time & Clock (Employee View)

Path: `/recruiter/my-time` (Recruiter Tabs → “My Time”). Renders `SecondEmployeeShiftView` inside the recruiter/employee portal.

## What employees see

- **Weekly summary cards** (Hours worked, OT, breaks, shifts tracked) sourced from `/employee/time-summary`.
- **Time history filters** (From/To + status) backed by `/employee/time-history` so staff can audit past shifts.
- **Per-shift detail** – clock-in/out timestamps, total hours, break minutes, missed break flags, status chips (“assigned”, “pending”, “approved”).
- **Live shift panel & roster** – shows today’s shift window, live clock vs “Not clocked in yet”, break overdue alerts, and roster badges (clocked-in, on break, late).
- **Anomaly flags** – IP/device hints on each punch, flagged chips when a punch comes from an unusual IP/device or violates policy (missing breaks, wrong location).
- **Shift timeline slider** – renders start → break markers → end with overtime risk visuals.

## Actions available

1. **Clock in/out** – the primary action button hits `/employee/shifts/:id/clock-in` and `/clock-out` endpoints.
2. **Review break status** – live break bar shows minutes remaining, auto-deductions, and missed break alerts.
3. **Audit past shifts** – use filters to review previous days, confirm auto-enforced breaks, and export CSV/PDF for payroll.
4. **Spot anomalies** – managers/staff see warning chips for unusual IP/device, late punches, or force clock-outs.
5. **Trigger shift actions** – force clock-out, apply break templates, or confirm corrections when policy enforcement kicks in.

## When to mention in chatbot answers
- “Where do employees see their shifts?” → **Recruiter Dashboard → My Time tab** for live roster + history.
- “How do I know if I missed a break?” → My Time view (break bar + anomaly chip).
- “How do we capture device/IP info?” → same view highlights IP/device hints for each punch.
