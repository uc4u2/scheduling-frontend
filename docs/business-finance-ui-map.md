# Business Finance UI Map

This document shows where Business Finance features live in the manager UI, what the manager should do there, what they should not do there, and what data each page feeds.

## Business Finance -> Overview

What manager does here:
- review the `Owner Snapshot` for the selected date range
- check net revenue, refunds, paid online, paid offline, pending balance, expenses, estimated margin, and readiness score
- review attention items such as missing receipts, unlinked receipts, draft expenses, pending field reports, and low available stock

What not to do here:
- do not treat it as a formal P&L
- do not use it as tax filing output
- do not try to edit source records from this summary view

What this page feeds:
- owner visibility
- month-end readiness follow-up
- accountant handoff preparation

## Business Finance -> Quotes

What manager does here:
- review incoming quote requests
- create manual quote requests
- link or create clients
- convert quote requests into estimates

What not to do here:
- do not collect payment here
- do not treat a quote request as an invoice

What this page feeds:
- client linkage
- estimate creation
- early job pipeline

## Business Finance -> Estimates

What manager does here:
- build pricing proposals
- send or share the client-facing estimate
- review approval status
- convert approved estimates to invoices

What not to do here:
- do not treat an estimate as collected revenue
- do not use it as the execution record

What this page feeds:
- invoice creation
- commercial approval history
- client-facing scope and totals

## Business Finance -> Work Orders

What manager does here:
- create the job execution record
- assign staff
- schedule work
- manage field reports and review

What not to do here:
- do not treat work order status as payment status
- do not use planned materials as final usage

What this page feeds:
- operational execution
- staff assignments
- field reports
- manager review
- profitability inputs

## Business Finance -> Materials & Supplies

What manager does here:
- maintain inventory items
- check on hand, reserved, available, and pending usage
- review low available stock

What not to do here:
- do not treat reservations as deducted stock
- do not use this page as a purchase ledger for all overhead costs

What this page feeds:
- work order material planning
- reservation warnings
- approved material usage cost
- month-end low-stock visibility

## Business Finance -> Expenses

What manager does here:
- enter overhead expenses
- upload receipts
- manage recurring expense templates and drafts
- use Receipt Inbox to capture receipts before creating expenses

What not to do here:
- do not use recurring templates as actual expenses
- do not leave draft recurring expenses as accountant-ready items

What this page feeds:
- expense totals
- tax paid on expenses
- month-end missing receipts and uncategorized checks
- accountant package expense and receipt outputs

## Business Finance -> Reports

What manager does here:
- review gross invoice totals
- review refund-aware net totals
- review expense totals and margin context

What not to do here:
- do not treat reports as tax filing outputs
- do not change source records here

What this page feeds:
- owner visibility
- month-end review context
- accountant package summary context

## Business Finance -> Tax Summary

What manager does here:
- review gross tax collected
- review tax refunded
- review net tax collected
- review tax paid on expenses

What not to do here:
- do not file taxes from this page
- do not assume it replaces accountant review

What this page feeds:
- month-end review
- accountant package tax-summary.csv

## Business Finance -> Month-End

What manager does here:
- review missing receipts
- review unlinked receipts
- review draft recurring expenses
- review uncategorized expenses
- prepare accountant package

What not to do here:
- do not assume month-end means tax filing is complete
- do not ignore unresolved checklist items before handoff

What this page feeds:
- accountant handoff readiness
- month-end summary
- accountant package ZIP

## Advanced Management -> Payments & Refunds

What manager does here:
- see payment/refund activity across sources
- filter between Bookings and Business Finance
- open finance invoices from finance rows

What not to do here:
- do not use booking refund actions for finance invoices
- do not assume every row is from the same payment system

What this page feeds:
- manager payment visibility
- refund visibility
- invoice follow-up workflow
