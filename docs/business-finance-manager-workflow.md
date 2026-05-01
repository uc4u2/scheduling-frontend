# Business Finance Manager Workflow

This guide explains how a manager should use Business Finance in Schedulaa.

## What Business Finance Is For

Use Business Finance when the job is custom and the team needs:
- a quote request
- an estimate
- an invoice
- payment tracking
- a work order
- material planning
- expenses and receipts
- a month-end handoff for the accountant

Use Booking instead when:
- the service is already known
- the price is already known
- the regular appointment flow is the real source of truth

Simple rule:
- Booking = normal appointment flow
- Business Finance = custom-price job flow

## Owner Snapshot on Overview

Business Finance -> Overview now includes `Owner Snapshot`.

Use it when the owner or manager wants a quick answer to:
- how much revenue came in
- how much was refunded
- how much is still pending
- how much was paid online vs offline
- how much was spent
- whether month-end is clean enough for accountant handoff

Important:
- this is operational
- it is not a formal P&L
- it is not tax filing

## Quote Request -> Estimate -> Invoice

Manager flow:
- create or review a quote request
- link or create the client
- build the estimate
- send the estimate or share the public link
- client approves or rejects the estimate
- convert the accepted estimate to an invoice

Business Finance is for custom-price work. The estimate is the pricing proposal. The invoice is the bill after the scope is approved.

## Online Payment vs Offline Payment

There are two payment paths.

### Online payment
Use the Stripe-hosted payment link when the customer should pay online.

Manager flow:
- open the finance invoice detail
- create/copy/open payment link
- customer pays online
- local invoice becomes paid after reconciliation

### Offline payment
Use offline payment when the customer pays by:
- cash
- e-transfer
- cheque
- bank transfer
- external debit/card terminal
- other offline method

Manager flow:
- open the finance invoice detail
- click `Record offline payment`
- enter amount, method, date, and note

Important:
- recording an offline payment does not charge the customer through Stripe
- offline-paid invoices are not Stripe refund eligible

## Work Order After Approval or Payment

After estimate approval and invoice creation, the manager can create the work order.

The work order is the job execution record.

Manager uses it to:
- assign employee or crew
- set the date
- add instructions
- plan materials

## Planned Materials and Inventory Reservation

When the manager plans materials on the work order:
- stock is reserved operationally
- stock is not deducted yet

Manager sees:
- On hand
- Reserved
- Available
- Available after this job

If the job plans more than current availability:
- Schedulaa warns the manager
- it does not hard-block the plan

This is useful because the team may restock before the job date.

## Employee Field Report

The employee uses the work order to:
- review instructions
- see planned materials
- submit the field report
- report actual usage

Important:
- reported usage is not final yet
- reported usage does not deduct stock by itself

## Manager Review

Manager review is the approval step after the field report.

This is where the manager confirms:
- what happened on the job
- what materials were actually used
- what should count as approved usage

After manager approval:
- approved usage deducts stock
- approved material cost feeds profitability
- review closes the operational loop

## Expenses and Recurring Expenses

Use Expenses for overhead and general business costs such as:
- rent
- internet
- phone
- insurance
- fuel
- software
- accountant fees

Each expense can have:
- vendor
- category
- amount
- tax
- receipt
- review status

Recurring expenses help with repeat costs.

Manager flow:
- create a recurring expense template once
- preview due recurring drafts
- generate due recurring draft expenses
- review them before month-end

Important:
- recurring templates are not actual expenses
- generated recurring drafts stay out of totals until reviewed

## Receipt Inbox

Receipt Inbox is for capturing the receipt first and organizing the expense later.

Manager can:
- upload a receipt
- take a receipt photo on mobile web
- keep it unlinked for now
- link it to an existing expense later
- create a new expense from the receipt

Receipt statuses:
- Unlinked
- Linked
- Archived

This is useful when the manager has the receipt now but does not want to fill the whole expense form immediately.

## Month-End Accountant Package

Month-End helps the manager prepare a clean accountant handoff.

Manager can review:
- missing receipts
- unlinked receipts
- uncategorized expenses
- draft recurring expenses
- low available stock
- refund-aware totals

Then the manager can use:
- `Prepare accountant package`

The package gives the accountant:
- invoices
- payments
- refunds
- expenses
- tax summary
- profitability
- month-end summary
- receipt manifest

Important:
- this does not file taxes
- this does not replace the accountant
- it prepares cleaner records for accountant review
