---
title: Commerce Copilot Storefront Content Pack
description: Release B manager UI contract for improving storefront content.
---

# Commerce Copilot Storefront Content Pack

Updated: 2026-08-05
Status: Release B complete with content-review capability-state clarification

## Post-creation completion note

As of Wednesday, July 29, 2026, the Commerce Copilot completion card after hidden Product creation is separate from the storefront content workflow.

The completion card now:
- groups setup blockers separately from completed and informational items
- uses a server-driven primary action
- opens exact Product or Delivery Setup deep links in a new tab
- refreshes readiness once when the manager returns to the Copilot tab

This behavior belongs to the Product-creation and readiness loop, not to Release B content suggestion logic.

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

## Capability states

The content-review drawer now separates fields into three capability groups:

- **Actionable suggestions**
  - a supported field has a real proposed value
  - the manager may choose **Use suggested value** or **Keep current value**
  - **Edit** changes only the Copilot proposal, not the Product
  - **Regenerate** calls AI again, but still does not update the Product
- **Needs attention**
  - the field is supported, but no new suggestion is available
  - no fake suggested value is shown
  - the manager may **Regenerate** or **Edit manually**
- **Not managed by Commerce Copilot**
  - the field is unsupported or not applicable in this workflow
  - it is shown in a compact collapsible section, not as a normal suggestion card

## Currently unavailable fields

- Short storefront copy
- Image alt text

These are intentionally shown under **Not managed by Commerce Copilot** because the current Product/storefront contract does not persist and render them end-to-end.

Image alt text remains out of scope here because alt text belongs to individual Product images, not to one Product-level text field.

## Manager review flow

The drawer shows:
- a compact Product preview
- review counts:
  - suggestions available
  - needs attention
  - not managed here
  - selected for application
- current versus suggested values for actionable fields only
- plain-language reasons for each field state
- one review decision control for actionable fields:
  - Use suggested value
  - Keep current value
- secondary field actions:
  - Edit
  - Regenerate

Primary actions:
- Use all suggestions
- Approve selected content
- Apply approved content
- Finish later

`Use all suggestions` selects only actionable suggestions. It excludes:
- unsupported fields
- not-applicable fields
- fields with no suggestion
- failed regenerations

Choosing **Use suggested value** marks a field as selected for application only. It does not save the Product.
`Edit` also changes only the Copilot proposal and then marks that edited proposal as selected for application.

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
- show one clear live-storefront warning in the review summary
- applying approved content updates the current live listing

## Approval and application

The content workflow remains a two-step safe write:

1. **Approve selected content**
   - creates the approval record
   - does not update the Product yet
2. **Apply approved content**
   - executes the approved write
   - refreshes authoritative Product values afterward

Status chips may show:
- Selected
- Keeping current
- Edited
- Regenerated
- Approved
- Applied
- Failed

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
