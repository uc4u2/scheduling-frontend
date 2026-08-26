# Local Delivery UI Policy

Last updated: August 26, 2026

## Current policy

`local_delivery` remains supported in the backend and checkout codepaths, but it is intentionally hidden from manager-facing configuration UI.

This includes:

- Products -> Delivery setup
- Product delivery override controls
- Manager order shipping-settings controls that write delivery policy

## Why it is hidden

The current delivery-policy model uses country-level destination rules. That is acceptable for:

- `pickup`
- `shipping`

It is not specific enough for `local_delivery`.

Examples:

- A business with origin country `CA` should not automatically imply local delivery anywhere in Canada.
- A business in Ontario should not imply local delivery in British Columbia or Quebec.
- A business allowing `CA + US` for shipping should not automatically imply local delivery in the United States.

Showing `local_delivery` beside country-based shipping controls creates misleading manager expectations and customer-facing checkout behavior.

## Implementation boundary

The backend source of truth is unchanged:

- delivery method code: `local_delivery`
- checkout and order models still understand it
- existing APIs still tolerate it

The current product decision is only to remove it from manager UI and force manager save flows to keep it off.

That keeps the rest of the system stable while avoiding new tenant misconfiguration.

## Future plan

`local_delivery` should return only when it has its own eligibility model, separate from shipping countries.

Supported future approaches may include:

- postal-code or postal-prefix zones
- city / province allowlists
- radius from business origin
- address validation against configured delivery zones

When that exists, checkout should:

1. collect the customer address
2. validate the address against local-delivery zones
3. show `local_delivery` only when the address is eligible

Until then, manager UI should guide businesses toward:

- `pickup`
- `shipping`

and keep `local_delivery` hidden.
