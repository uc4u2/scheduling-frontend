# Business Finance Manager Workflow

This guide explains how a manager uses Business Finance for custom-price jobs from first request through payment, refund handling, and reporting review.

## When to Use Business Finance Instead of Booking

Use Business Finance when:
- the client asks for a price first
- the scope is custom
- the manager needs to prepare an estimate before scheduling or payment
- the team will likely execute the work later through a work order

Use Booking instead when:
- the service is already known
- the price is already known
- the normal appointment flow is the real source of truth

Simple rule:
- Booking = known service and appointment flow
- Business Finance = custom pricing, invoice, and job workflow

## How Manager Creates and Sends an Estimate

Start in Business Finance and create a quote request.

Enter:
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

Then:
- link the correct client record or create one from the quote contact
- create the estimate
- add line items
- review notes, terms, expiry, tax, and totals
- preview the client-facing view
- send the estimate or copy the public link

Important:
- the public estimate page is the client approval step
- the estimate is not an invoice yet

## How Accepted Estimate Becomes Invoice

After the client accepts the estimate, the manager can convert it to an invoice.

That conversion:
- creates the local finance invoice
- copies the approved totals into the invoice
- keeps the invoice tied to the correct client and estimate context

At this stage the manager can also decide whether to:
- collect payment now
- create the work order now
- do both in the right order for the job

## How Payment Link Works

Inside the invoice detail, the manager can use:
- Create Payment Link
- Copy Payment Link
- Open Payment Link

This uses the hosted Stripe invoice/payment flow.

Important truths:
- the hosted payment link should match the local invoice total
- if Stripe has a stale or mismatched hosted invoice, the hotfix behavior replaces it
- current Print / Save PDF is a browser print path, not a server-generated PDF file

## How Payment Status Changes After Client Pays

When the client pays the hosted invoice:
- Stripe marks the hosted invoice paid
- the Stripe webhook reconciles the local finance invoice
- the local finance invoice becomes `paid`

Manager-visible payment state includes:
- payment status
- whether Stripe payment was captured
- whether the invoice is refund-eligible

## How Manager Sees Payment in Payments & Refunds

Advanced Management -> Payments & Refunds now includes Business Finance rows.

Finance rows show:
- Business Finance label
- invoice number
- client
- payment status
- amount

Manager can:
- search by invoice number, client, or related estimate
- use the source filter to switch between Bookings and Business Finance
- click `View Invoice` to open the finance invoice detail

Important:
- finance rows do not use the booking refund dialog
- finance rows do not show a global Refund button in the list

## How Manager Issues Finance Refund From Finance Invoice Detail

Refunds start inside Finance Invoice Detail.

When a finance invoice is eligible, the dialog shows:
- paid amount
- refunded amount
- remaining refundable amount
- refund history
- `Issue refund`

Manager refund flow:
- open the finance invoice detail
- review payment and refund summary
- click `Issue refund`
- choose full remaining refund or custom amount
- enter reason/note
- confirm understanding that refunding payment does not change estimate, work order, tax, or line-item totals
- submit the refund

After refund:
- invoice status updates
- refund history updates
- remaining refundable updates
- invoice totals do not change

## Difference Between Booking Refund and Finance Invoice Refund

Booking refund:
- belongs to appointment payment flow
- can include booking-specific logic such as service buckets, tips, no-show, or platform-fee options
- uses booking refund endpoints and booking refund UI

Finance invoice refund:
- belongs to Business Finance invoice flow
- starts from Finance Invoice Detail
- uses finance invoice refund endpoint
- does not use booking refund dialog
- does not use booking-specific tip, no-show, or platform-fee refund options

These are intentionally separate UI flows even though both are part of the larger payment/refund system.

## How Reports Show Gross, Refund, and Net

Business Finance reports now preserve original invoice totals and also show refund-aware net values.

Manager should read them as:
- Gross invoice total = original invoiced amount in the date scope
- Refunds = refund activity in the date scope
- Net invoice total = gross invoice total minus refunds
- Gross tax collected = original tax billed in the date scope
- Tax refunded = refunded tax estimate based on refund proportion
- Net tax collected = gross tax collected minus refunded tax

Invoice report rows now also show:
- refunded amount
- remaining refundable amount
- net collected amount
- refund count

## What Month-End Refund Review Means

Month-End now surfaces refund activity so the manager and accountant can see:
- refund total
- refunded invoices
- partial refunds
- tax refunded

This is an accounting handoff and review aid.

It does not mean:
- refunds block month-end automatically
- Schedulaa replaces accountant review

Simple rule:
- Month-End should now be read as gross plus refund-aware net context, not gross-only history

## Operational Flow Summary

Quote Request -> Client -> Estimate -> Client response -> Invoice -> Payment link -> Paid webhook reconciliation -> Work order -> Field report -> Manager review -> Refund if needed -> Refund-aware reporting/month-end
