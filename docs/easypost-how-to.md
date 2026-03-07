# EasyPost Help Guide

Updated: March 7, 2026

## Purpose

This guide explains EasyPost features in the three manager areas:

1. `Settings` -> shipping settings
2. `Advanced Management` -> EasyPost panel
3. `Product Orders` -> order-level shipping automation

Manual shipping remains fully supported as fallback.

## 1) Settings: EasyPost Connection

Use this section to enable and validate account-level EasyPost integration.

### Main fields

- `Enable EasyPost automation`: turns EasyPost features on/off for the company.
- `EasyPost API key`: your EasyPost key (stored securely).
- `Test connection`: checks the API key against EasyPost.

### Expected behavior

- If disabled, checkout and fulfillment continue with manual shipping.
- If enabled but invalid key, automated rates/label purchase will not run.
- Connection state should show success/failure after test.

### Safe setup order

1. Save API key.
2. Run `Test connection`.
3. Confirm status is healthy before using order automation.

## 2) Advanced Management: EasyPost Overview

Use this area as the operational control surface and quick access point.

### What managers should do here

- Verify EasyPost is enabled and connected.
- Review readiness before handling shipping orders.
- Access product-order shipping automation workflows.

### Important note

If no product orders exist yet, order-level EasyPost actions in Product Orders will not be visible because they appear per order.

## 3) Product Orders: EasyPost Automation on an Order

Use this section when fulfilling a specific shipping order.

### Supported flow (shipping orders)

1. Open order detail.
2. Run `Refresh rates`.
3. Select a shipping rate.
4. Click `Buy label`.
5. Review purchased shipment summary.
6. Open/print label from `label_url`.

### What is saved after successful label buy

- Shipment record in `product_order_shipment`
- Carrier, service, tracking code, tracking URL, label URL
- ProductOrder tracking fields auto-populated
- Timeline events for shipping updates

### Fallback behavior

- Manual tracking + fulfillment actions remain available.
- If rate is stale/unavailable, refresh rates and retry.
- If EasyPost is disabled or not configured, continue manual workflow.

## Delivery Method Rules

- `shipping`: EasyPost automation eligible.
- `pickup`: not eligible (manual pickup flow only).
- `local_delivery`: keep manual flow unless explicitly enabled by future policy.

## Troubleshooting

## A) Browser shows CORS error on EasyPost settings

Most common cause is wrong API path, not origin policy. Current valid paths:

- `GET/POST/PATCH /inventory/shipping-settings`
- `POST /inventory/shipping-settings/test-connection`

## B) No rates returned

Check:

1. EasyPost enabled
2. Valid API key and successful test connection
3. Order delivery method is `shipping`
4. Shipping address is complete and valid

## C) Buy label fails with stale rate

Refresh rates and select a fresh rate before retrying purchase.

## D) No EasyPost controls in Product Orders

Controls appear in order detail, and only for eligible delivery method/orders.

## Security and Operations Notes

- Keep API keys in environment/configured secure storage only.
- Do not share EasyPost keys in screenshots or chat.
- Webhook secrets must match environment mode.
- Manual shipping fallback should always remain usable during provider outages.
