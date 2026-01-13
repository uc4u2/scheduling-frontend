---
title: Enterprise Feature Guide
description: Full feature overview with step-by-step navigation for the Schedulaa chatbot.
---

# Enterprise Feature Guide

This guide is the single source of truth for the chatbot. It covers every major feature and exactly
where to click in the product.

## Manager Portal (Sidebar map)

### Employee Management

- Company Profile: Manager Portal → Employee Management → Company Profile
- Employee Profiles: Manager Portal → Employee Management → Employee Profiles
- Add team member: Manager Portal → Employee Management → Add team member

### Shifts & Availability

- Shift Management: Manager Portal → Shifts & Availability → Shift Management
- Shift Monitoring: Manager Portal → Shifts & Availability → Shift Monitoring
- Time Tracking: Manager Portal → Shifts & Availability → Time Tracking
- Fraud / Anomalies: Manager Portal → Shifts & Availability → Fraud / Anomalies
- Leaves: Manager Portal → Shifts & Availability → Leaves
- Swap Approvals: Manager Portal → Shifts & Availability → Swap Approvals

### Advanced Payroll

- Payroll: Manager Portal → Advanced Payroll → Payroll
- Saved Payrolls: Manager Portal → Advanced Payroll → Saved Payrolls
- Tax: Manager Portal → Advanced Payroll → Tax
- ROE / T4 / W-2: Manager Portal → Advanced Payroll → ROE / T4 / W-2
- Payroll Raw: Manager Portal → Advanced Payroll → Payroll Raw
- Payroll Audit: Manager Portal → Advanced Payroll → Payroll Audit
- Invoices: Manager Portal → Advanced Payroll → Invoices

### Overview shortcuts

- Team Activity, Master Calendar, Candidate Funnel, Job Postings, Recruiter Performance,
  Candidate Search, Feedback Notes, Recruiter Availability, Recent Bookings,
  Payroll Audit History, Monthly Attendance Calendar, Candidate Profile

Where to click: Manager Portal → Overview → (choose a shortcut)

### Website & Pages

- Website Manager, Inline Site Editor, Website Templates, Visual Site Builder, Domain Settings
Where to click: Manager Portal → Website & Pages

### Services & Bookings (Advanced Management)

- Services, Add-ons, Products, Resources, Shift Templates, Bookings, Payments, Analytics
Where to click: Manager Portal → Services & Bookings

### Integrations, Billing, Settings

- Zapier: Manager Portal → Zapier
- Billing & Subscription: Manager Portal → Billing & Subscription
- Settings: Manager Portal → Settings

## Payroll (How-To)

Where to click: Manager Portal → Advanced Payroll → Payroll

1) Prepare time
- Go to Shifts & Availability → Time Tracking
- Fix missing punches, then approve time entries

2) Open payroll
- Select the pay period
- Click Preview

3) Review and adjust
- Check overtime, tips, deductions
- Apply manager overrides if needed

4) Finalize
- Click Finalize and confirm totals

5) Export or sync
- QuickBooks/Xero: Send to accounting
- Zapier: Send payroll to Zapier
- Or download CSV

## Time Tracking (How-To)

Where to click: Manager Portal → Shifts & Availability → Time Tracking

1) Choose the date range or pay period
2) Fix missing or incorrect punches
3) Approve entries
4) Review anomalies in Fraud / Anomalies

## Recruiting (How-To)

1) Create a job posting
- Manager Portal → Overview → Job Postings
- New job posting → publish

2) Review candidates
- Manager Portal → Overview → Candidate Funnel
- Move candidates between stages

3) Search candidates
- Manager Portal → Overview → Candidate Search

4) Invitations and forms
- Employee Portal → Invitations / Candidate Forms

5) Interviews
- Employee Portal → Upcoming Meetings

## Website Builder (How-To)

Where to click: Manager Portal → Website & Pages → Visual Site Builder

1) Pick a page from the left panel
2) Edit content in the inspector
3) Add sections or templates
4) Preview and publish

Quick edits:
- Website & Pages → Inline Site Editor

## Custom Domain (How-To)

Where to click: Manager Portal → Website & Pages → Domain Settings

You will add two DNS records:

1) TXT verification
- Host: `_schedulaa` or `_schedulaa.www` (exactly as shown in Schedulaa)
- Value: the token shown in Schedulaa

2) CNAME for the website
- Host: `www`
- Points to: the CNAME target shown in Schedulaa

Wait 5–30 minutes, then click Verify DNS. SSL is automatic after verification.

## Zapier Integration (How-To)

Where to click: Manager Portal → Zapier

1) Create a Zapier API key in the Zapier tab
2) Add Event hooks with your Zapier Catch Hook URL
3) Choose events such as:
   booking.created, booking.no_show, timeclock.clock_in,
   shift.published, payroll.finalized, payroll.details, payroll.payment_requested
4) In Zapier, add actions (create booking/employee/shift, attach document)

Finance automation:
- When you click Send payroll to Zapier, Schedulaa emits payroll.payment_requested.
- Zapier can trigger approvals, exports, or payouts.

## Billing & Subscription (How-To)

Where to click: Manager Portal → Billing & Subscription

- View subscription status and seats
- Open the billing portal to update payment methods

## Employee Portal (Tabs)

All tabs are in the Employee Portal navigation:

- Calendar: /employee?tab=calendar
- My Availability: /employee?tab=availability
- Invitations: /recruiter/invitations
- Candidate Forms: /recruiter/invitations?section=forms
- Questionnaires: /recruiter/questionnaires
- Upcoming Meetings: /recruiter/upcoming-meetings
- My Time: /recruiter/my-time
- Candidate Search: /employee/candidate-search
- Public Booking Link: /recruiter/public-link
- Job Postings: /manager/job-openings

## Public Site URLs

Replace `{slug}` with the company slug:

- https://www.schedulaa.com/{slug}
- https://www.schedulaa.com/{slug}/services
- https://www.schedulaa.com/{slug}/products
- https://www.schedulaa.com/{slug}/reviews
- https://www.schedulaa.com/{slug}/book
- https://www.schedulaa.com/{slug}/basket
