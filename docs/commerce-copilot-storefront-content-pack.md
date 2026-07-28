---
title: Commerce Copilot Storefront Content Pack
description: Release B manager UI contract for improving storefront content.
---

# Commerce Copilot Storefront Content Pack

Updated: 2026-07-28
Status: Release B complete

## Purpose

Release B helps a manager turn an existing Product into a more polished storefront listing without changing factual commerce settings.

## Supported UI entry points

- Release A completion card: **Improve storefront content**
- Product list toolbar: **Improve content with AI**
- Product row action: **Improve content**
- Product editor action: **Generate storefront content**
- Copilot quick start: **Improve a Product listing**

## Supported content fields

- Description
- Category
- SKU
- Slug
- Meta title
- Meta description

## Currently unavailable fields

- Short storefront copy
- Image alt text

These are intentionally shown as unavailable or not applicable because the current Product/storefront contract does not persist and render them end-to-end.

## Manager review flow

The drawer shows:
- a compact Product preview
- current versus suggested values
- plain-language reasons for each suggestion
- field actions:
  - Use suggestion
  - Edit
  - Regenerate
  - Keep current

Primary actions:
- Use all suggestions
- Approve selected content
- Apply approved content
- Finish later

## Safety expectations

The UI must not imply that content suggestions are factual confirmations.

The workflow must not invent:
- material claims
- handmade claims
- country-of-origin claims
- healing or medical claims
- shipping promises
- warranty claims

## Active versus hidden Product behavior

Hidden Product:
- content remains hidden until the Product is published later

Visible Product:
- show a clear live-storefront warning before approval
- applying approved content updates the current live listing

## Integration with Release A

Release B does not replace the finish-setup and publish workflow.

The expected sequence is:
1. Create or repair the Product.
2. Fix technical readiness.
3. Improve storefront content.
4. Publish later through the existing approved activation flow.

## Release C interaction

Release C adds Smart Package Reuse to the physical-product setup flow before content polish.

Key behavior:
- Commerce Copilot checks existing active Package Profiles before proposing a new package
- the manager may choose **Use existing package** or **Create a new package**
- if a reused package is not already the workspace default, Copilot explains that making it the default can affect future shipping quotes for other Products

This package-reuse decision stays separate from the storefront content pack:
- package reuse does not change description or SEO content
- content approval still remains one separate harmless content action
