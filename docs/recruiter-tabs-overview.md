---
title: Employee Dashboard Tabs
description: Quick reference for every tab inside the Recruiter / Employee portal.
---

# Recruiter Dashboard Tabs (Employee Portal)

All of these links live under the Employee Portal navigation. The tabs are rendered by `RecruiterTabs.jsx` and use both `/employee` and `/recruiter` routes.

| Tab | Path | What it does |
| --- | --- | --- |
| Calendar | `/employee?tab=calendar` | Interactive calendar of bookings, invites, and shared calendars. Employees see candidate info, meeting links, can cancel/resend invites. |
| Availability | `/employee?tab=availability` | Manage availability slots, recurring templates, PTO messages. Powered by `RecurringAvailabilityForm` and `/my-availability`. |
| My Time | `/recruiter/my-time` | Live clock in/out, weekly summary, time history, break status. (Documented separately). |
| Upcoming Meetings | `/recruiter/upcoming-meetings` | Feed of upcoming candidate interviews/client appointments with join links, statuses, and quick actions. |
| Invitations | `/recruiter/invitations` | Manage candidate invites, forms, and statuses (includes nested sections like forms, no-show recovery). |
| Candidate Forms | `/recruiter/invitations?section=forms` | Builder + submissions for candidate forms tied to invitations. |
| Questionnaire Builder | `/recruiter/questionnaires` | Create, publish, and maintain onboarding/intake questionnaires (doctor onboarding, etc.). |
| Candidate Search | `/employee/candidate-search` (also `/recruiter/candidate-search`) | Search candidate profiles and open detail views. |
| Public Booking Link | `/recruiter/public-link` | Shareable booking link for clients. |
| Job Postings | `/manager/job-openings` | Create and manage job postings (manager access required). |

## Employee use cases
- **View shifts / current day** → Calendar tab or My Time.
- **Clock in/out & break compliance** → My Time page.
- **See upcoming interviews** → Upcoming Meetings tab.
- **Build questionnaires / intake forms** → Questionnaire Builder & Candidate Forms.
- **Adjust availability** → Availability tab.

When users ask “Where do employees see ____?” point them to the right tab here.
