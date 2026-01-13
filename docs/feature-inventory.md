---
title: Feature Inventory (Manager + Employee + Public)
description: Inventory of Schedulaa features with exact navigation paths for chatbot coverage.
---

# Feature Inventory

This inventory is compiled from `frontend/src/NewManagementDashboard.js`, `frontend/src/components/recruiter/RecruiterTabs.jsx`,
`frontend/src/App.js`, and the website builder flows. Use it as the source of truth for chatbot "where to click" answers.

## Manager Portal (Sidebar)

### Employee Management

| Feature | Where to click |
| --- | --- |
| Company Profile | Manager Portal → Employee Management → Company Profile |
| Employee Profiles | Manager Portal → Employee Management → Employee Profiles |
| Add Team Member | Manager Portal → Employee Management → Add team member |

### Shifts & Availability

| Feature | Where to click |
| --- | --- |
| Shift Management | Manager Portal → Shifts & Availability → Shift Management |
| Shift Monitoring | Manager Portal → Shifts & Availability → Shift Monitoring |
| Time Tracking | Manager Portal → Shifts & Availability → Time Tracking |
| Fraud / Anomalies | Manager Portal → Shifts & Availability → Fraud / Anomalies |
| Leaves | Manager Portal → Shifts & Availability → Leaves |
| Swap Approvals | Manager Portal → Shifts & Availability → Swap Approvals |

### Advanced Payroll

| Feature | Where to click |
| --- | --- |
| Payroll | Manager Portal → Advanced Payroll → Payroll |
| Saved Payrolls | Manager Portal → Advanced Payroll → Saved Payrolls |
| Tax | Manager Portal → Advanced Payroll → Tax |
| ROE | Manager Portal → Advanced Payroll → ROE |
| T4 | Manager Portal → Advanced Payroll → T4 |
| W-2 | Manager Portal → Advanced Payroll → W-2 |
| Payroll Raw | Manager Portal → Advanced Payroll → Payroll Raw |
| Payroll Audit | Manager Portal → Advanced Payroll → Payroll Audit |
| Invoices | Manager Portal → Advanced Payroll → Invoices |

### Overview Shortcuts

| Feature | Where to click |
| --- | --- |
| Team Activity Overview | Manager Portal → Overview → Team Activity |
| Master Calendar | Manager Portal → Overview → Master Calendar |
| Candidate Funnel | Manager Portal → Overview → Candidate Funnel |
| Job Postings | Manager Portal → Overview → Job Postings |
| Recruiter Performance | Manager Portal → Overview → Recruiter Performance |
| Candidate Search | Manager Portal → Overview → Candidate Search |
| Feedback Notes | Manager Portal → Overview → Feedback Notes |
| Recruiter Availability | Manager Portal → Overview → Recruiter Availability |
| Recent Bookings | Manager Portal → Overview → Recent Bookings |
| Payroll Audit History | Manager Portal → Overview → Payroll Audit History |
| Monthly Attendance Calendar | Manager Portal → Overview → Monthly Attendance Calendar |
| Candidate Profile | Manager Portal → Overview → Candidate Profile |

### Website & Pages

| Feature | Where to click |
| --- | --- |
| Website Manager | Manager Portal → Website & Pages → Website Manager |
| Inline Site Editor | Manager Portal → Website & Pages → Inline Site Editor |
| Website Templates | Manager Portal → Website & Pages → Website Templates |
| Visual Site Builder | Manager Portal → Website & Pages → Visual Site Builder |
| Domain Settings | Manager Portal → Website & Pages → Domain Settings |
| AI Website Assistant | Manager Portal → Website & Pages → Visual Site Builder → Help drawer → AI Website Assistant |

### Services & Bookings (Advanced Management)

| Feature | Where to click |
| --- | --- |
| Services Catalog | Manager Portal → Services & Bookings → Services |
| Add-ons | Manager Portal → Services & Bookings → Add-ons |
| Products & Inventory | Manager Portal → Services & Bookings → Products |
| Resources | Manager Portal → Services & Bookings → Resources |
| Shift Templates | Manager Portal → Services & Bookings → Shift Templates |
| Booking Management | Manager Portal → Services & Bookings → Bookings |
| Payments & Orders | Manager Portal → Services & Bookings → Payments |
| Analytics | Manager Portal → Services & Bookings → Analytics |

### Integrations, Billing, Settings

| Feature | Where to click |
| --- | --- |
| Zapier | Manager Portal → Zapier |
| Billing & Subscription | Manager Portal → Billing & Subscription |
| Settings | Manager Portal → Settings |

## Employee Portal (Recruiter Dashboard)

All tabs are in the Employee Portal top navigation. Some tabs open full pages.

| Tab / Feature | Where to click | Path |
| --- | --- | --- |
| Calendar | Employee Portal → Tabs → Calendar | `/employee?tab=calendar` |
| My Availability | Employee Portal → Tabs → My Availability | `/employee?tab=availability` |
| Invitations | Employee Portal → Tabs → Invitations | `/recruiter/invitations` |
| Candidate Forms | Employee Portal → Tabs → Candidate Forms | `/recruiter/invitations?section=forms` |
| Questionnaires | Employee Portal → Tabs → Questionnaires | `/recruiter/questionnaires` |
| Upcoming Meetings | Employee Portal → Tabs → Upcoming Meetings | `/recruiter/upcoming-meetings` |
| My Time | Employee Portal → Tabs → My Time | `/recruiter/my-time` |
| Candidate Search | Employee Portal → Tabs → Candidate Search | `/employee/candidate-search` |
| Public Booking Link | Employee Portal → Tabs → Public Booking Link | `/recruiter/public-link` |
| Job Postings | Employee Portal → Tabs → Job Postings | `/manager/job-openings` |

## Public Website & Booking

| Feature | Where to click |
| --- | --- |
| Public site URL | Manager Portal → Website & Pages → Website Manager → Public URL |
| Public Services | Public site → `/[:slug]/services` |
| Public Products | Public site → `/[:slug]/products` |
| Public Reviews | Public site → `/[:slug]/reviews` |
| Booking flow | Public site → `/[:slug]/book` |
| Basket / Checkout | Public site → `/[:slug]/basket` |

## Recruiting & Hiring

| Feature | Where to click |
| --- | --- |
| Job Postings | Manager Portal → Overview → Job Postings |
| Candidate Funnel | Manager Portal → Overview → Candidate Funnel |
| Candidate Search | Manager Portal → Overview → Candidate Search |
| Candidate Profile | Manager Portal → Overview → Candidate Profile |
| Invitations & Candidate Forms | Employee Portal → Tabs → Invitations / Candidate Forms |
| Questionnaires | Employee Portal → Tabs → Questionnaires |
| Upcoming Meetings | Employee Portal → Tabs → Upcoming Meetings |

## Payroll & Compliance

| Feature | Where to click |
| --- | --- |
| Payroll runs | Manager Portal → Advanced Payroll → Payroll |
| Saved payroll runs | Manager Portal → Advanced Payroll → Saved Payrolls |
| Government forms | Manager Portal → Advanced Payroll → ROE / T4 / W-2 |
| Payroll audit | Manager Portal → Advanced Payroll → Payroll Audit |
| Invoices | Manager Portal → Advanced Payroll → Invoices |
