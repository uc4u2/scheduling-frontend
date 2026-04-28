# Business Finance Manager Workflow

This guide explains how a manager should use Business Finance for custom-price jobs.

## When to Use Quote/Estimate vs Booking

Use Business Finance when:
- the client asks for a price first
- the scope is custom
- the manager needs to prepare an estimate before scheduling or payment

Use Booking instead when:
- the service is already known
- the price is already known
- the employee and time are already being selected as part of a normal appointment flow

Simple rule:
- Booking = known service/time flow
- Business Finance = custom pricing and job execution flow

## How Manager Handles a Quote Request

Start in:
- Manager Dashboard -> Business Finance -> Quotes

Create the Quote Request with:
- title
- request type
- source label
- contact name
- contact email
- contact phone
- service address
- preferred timeline
- description
- visible notes
- internal notes

Important distinction:
- Request Contact = the person who asked for the quote
- Linked Client = the official customer record used for estimates, invoices, and work orders

## Important Quote Fields

Use source labels honestly:
- Phone call
- WhatsApp note
- Instagram/DM
- Website form
- Manual entry

These are labels only.
They do not mean automation exists.

## Link or Create Client

Before creating the estimate:
- link the quote to the correct client
- or create the client from the quote contact

This keeps estimates, invoices, payment links, and work orders tied to the official customer record.

## Create Estimate

From the quote row:
- create estimate
- or open/view estimate if one already exists

## Important Estimate Fields

Check:
- client
- estimate title
- line items
- issue date
- expiry date
- visible notes
- terms
- tax totals
- discount totals

Before sharing, preview the client-facing estimate page.

## Send Estimate

Preferred actions:
- Send Estimate
- Create / Copy Link
- Open Link
- Print / Save PDF
- Copy Summary

Notes:
- Send Estimate email is implemented
- WhatsApp/SMS sending is still manual
- browser Print / Save PDF is the current PDF flow

## What Client Sees

The client opens the public estimate link and sees:
- company name
- estimate number
- title
- client-safe estimate details
- line items
- totals
- notes
- terms
- accept/reject actions

The client does not see manager-only or accounting-only internals.

## What Happens on Accept / Reject / No Response

### If the client accepts
The estimate becomes approved.
Then the manager can:
- convert to invoice
- create payment link if payment is needed
- create work order when the job is ready to execute

### If the client rejects
The estimate becomes rejected.
Then the manager can:
- revise and resend
- or leave it rejected/closed if the opportunity is not moving forward

### If the client does not respond
Do not treat silence as approval.
The manager should follow up manually.

## Can Manager Approve on Behalf of Client?

Yes, but only as an administrative fallback.

Use it only when the client clearly approved outside the portal, for example:
- phone approval
- email approval
- text approval
- WhatsApp approval
- in-person approval

Best practice:
- save proof in internal notes
- use the public acceptance link whenever possible

## Convert to Invoice

Use Convert to Invoice after the client approved the estimate and billing is needed.

This creates the local finance invoice record.

## Create / Copy / Open Payment Link

After converting to invoice, use:
- Create / Copy Payment Link
- Open Payment Link

This uses the hosted Stripe invoice/payment path from the finance invoice.

## Create Work Order

Use Create Work Order when the job is ready for operational execution.

Meaning:
- Estimate = proposed price
- Invoice = billing/payment
- Work Order = the job the team will do

## Assign Team

Inside the work order:
- assign employee/team member
- set work date/time
- allow field reporting where needed

## Employee Field Report

Employee uses My Work Orders and submits a field report.

The employee can report:
- completion
- work notes
- issues found
- extra work request
- materials used
- files/photos

The field report is not official by itself.

## Manager Review / Approval

Manager reviews the field report and creates or opens the review.

On approval, the system can:
- make material usage official
- deduct inventory
- add invoice line item if billing decision is `add_to_invoice`
- update approved material cost
- close the work order when appropriate

## Month-End / Reporting Review

Manager can then review:
- Reports
- Profitability
- Tax Summary
- Month-End

These tools help operational and accounting readiness.
They are not accountant-certified filings by themselves.

## Simple Checklist

Quote -> Client -> Estimate -> Send -> Client response -> Invoice/payment -> Work order -> Assignment -> Field report -> Review -> Reporting
