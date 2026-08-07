# HVAC Clean Corporate V2

## Intent

Build one cohesive flagship HVAC website theme that feels contemporary, bright, editorial, and trustworthy. The page should read like a single agency-designed system, not a series of isolated builder blocks.

## Typography

- Heading font: `Manrope`
- Body font: `Inter`
- Hero display: `clamp(3rem, 6vw, 6rem)` at `0.92` line-height
- Section title: `clamp(2rem, 4vw, 3.4rem)` at `0.96` line-height
- Small eyebrow: `0.82rem` uppercase, `0.08em` tracking
- Body copy: `1rem` to `1.08rem`, `1.75` to `1.9` line-height
- Weight range:
  - hero/section titles: `800`
  - headings inside cards/panels: `700`
  - body: `400` to `500`
  - labels/eyebrows: `700`

## Spacing Scale

- Page shell max width: `1380px`
- Content max width: `1180px`
- Narrow reading width: `760px`
- Desktop vertical rhythm:
  - hero: `96px` to `120px`
  - major sections: `88px` to `104px`
  - dense sections: `64px` to `72px`
- Tablet rhythm: reduce by `18%`
- Mobile rhythm: reduce by `28%`
- Interior gaps:
  - large: `32px`
  - medium: `20px`
  - small: `12px`

## Color System

- Warm white: `#f7f4ee`
- Clean white: `#ffffff`
- Soft neutral: `#eef1f4`
- Mist surface: `#e8eff3`
- Deep navy: `#102b43`
- Slate navy: `#1a4568`
- Teal accent: `#157a83`
- Sky accent: `#79b5d6`
- Ink text: `#14273a`
- Soft text: `rgba(20,39,58,0.74)`
- Muted text: `rgba(20,39,58,0.56)`
- Line: `rgba(16,43,67,0.12)`
- Strong line: `rgba(16,43,67,0.2)`
- Highlight gradient:
  - `linear-gradient(135deg, #102b43 0%, #157a83 55%, #79b5d6 100%)`

## Grid And Geometry

- Main grid: 12-column shell
- Hero:
  - 7/5 split on desktop
  - content first on mobile
- Services mosaic:
  - mixed 6/3/3 and 4/4/4 patterns
- Project section:
  - 5/7 or 6/6 editorial split
- Process story:
  - sticky narrative rail + stacked steps on desktop
- Corners:
  - large surfaces: `28px`
  - media panels: `24px`
  - buttons: `999px`
  - no heavy rounded-card repetition

## Image Ratios

- Hero media: `4:5`
- Service mosaic lead: `5:4`
- Service mosaic support: `4:5`
- Project hero: `16:11`
- Reviews support image: `5:6`
- Gallery mix:
  - `4:5`
  - `3:2`
  - `1:1`

## Section Transitions

- Alternate between:
  - warm white
  - clean white
  - soft neutral
  - one deep navy review band
- Use quiet divider lines and occasional overlapping panels
- Avoid each section having its own visible boxed card

## Motion Rules

- Motion profile: restrained corporate
- Reveal:
  - fade + 16px translate
  - stagger max `120ms`
- Image motion:
  - light scale-in on reveal
  - no dramatic parallax
- Sticky process:
  - desktop only
- Sliders:
  - maximum two auto-moving experiences on home
- Reduced motion:
  - disable autoplay
  - remove transforms
  - keep only opacity transitions where safe

## Desktop / Tablet / Mobile Composition

- Desktop:
  - large asymmetrical hero
  - offset quote panel
  - mixed service mosaic
  - sticky process narrative
- Tablet:
  - hero remains split, but quote panel stacks under media
  - process becomes non-sticky two-column then single-column
- Mobile:
  - headline first
  - quote panel immediately after intro
  - stacked service cards with varied image heights
  - no horizontal overflow

## V1 Elements To Remove

- Visible generic MUI card-grid feel
- Repetitive equal-height service cards everywhere
- Oversized pill clutter
- Independent block backgrounds with no page rhythm
- Weak trust rail and weak showcase slider framing
- Thin visual distinction between page types
- Corporate V1 sections that feel like “styled widgets” instead of one site system

