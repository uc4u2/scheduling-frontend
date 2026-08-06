## Industrial Blueprint

Schedulaa-owned design specification for high-trust service businesses:
- HVAC
- plumbing
- electrical
- contractors
- home services
- emergency service operations

This family is intentionally different from the classic Schedulaa template system. The goal is a technical, operational, agency-designed look built around urgency, reliability, field readiness, and trust proof.

### Design Intelligence Used

The spec is based on the Industrial / Technical / Trust-heavy guidance we discussed from UI/UX Pro Max patterns:
- technical service layout rather than lifestyle brochure layout
- condensed, high-contrast heading system
- dark blueprint surfaces with safety-accent CTA hierarchy
- diagonal section geometry and measured asymmetry
- trust signals close to primary CTA
- mechanical, low-noise motion instead of soft editorial motion
- industrial field photography treatment with strong overlays

This is a Schedulaa-owned specification. No third-party repo code or branded assets are used here.

### 1. Typography

- Heading font: `Barlow Condensed, Oswald, Inter, sans-serif`
- Body font: `Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif`
- Overline / label font: same heading stack, uppercase
- Heading scale:
  - hero display: `clamp(3rem, 7vw, 6rem)`
  - section title: `clamp(2rem, 4vw, 3.4rem)`
  - card title: `1.1rem` to `1.35rem`
- Weights:
  - display: `800-900`
  - section headings: `700-800`
  - body: `400-500`
  - metadata / labels: `700`
- Letter spacing:
  - display: `-0.03em`
  - technical labels: `0.12em` to `0.18em`
  - body: normal

### 2. Color System

- Background: `#08111f`
- Background raised: `#0f1d31`
- Surface primary: `rgba(13, 26, 45, 0.92)`
- Surface secondary: `rgba(7, 16, 30, 0.88)`
- Primary steel blue: `#225b8f`
- Secondary slate: `#89a9c6`
- Industrial accent / safety orange: `#ff8a1f`
- CTA orange: `#ff8a1f`
- CTA text: `#07111f`
- Border strong: `rgba(129, 169, 204, 0.34)`
- Border subtle: `rgba(129, 169, 204, 0.18)`
- Text primary: `#edf4fb`
- Text secondary: `rgba(237, 244, 251, 0.72)`
- Muted text: `rgba(171, 193, 215, 0.72)`
- Gradient dark shell: `linear-gradient(180deg, #07111f 0%, #0d1b2e 100%)`
- Gradient action: `linear-gradient(135deg, #ff8a1f 0%, #ffb14d 100%)`
- Gradient blueprint glow: `radial-gradient(circle at 20% 20%, rgba(40,116,181,0.28), transparent 46%)`

### 3. Layout Geometry

- Container widths:
  - shell max: `1440px`
  - content max: `1280px`
  - text rail max: `640px`
- Section spacing:
  - desktop: `104px - 132px`
  - tablet: `80px - 96px`
  - mobile: `64px - 72px`
- Grid:
  - desktop: `12-column`
  - tablet: `8-column`
  - mobile: single column with controlled stacking
- Shape rules:
  - avoid soft rounded cards as the dominant language
  - primary panels use `10px - 18px` radius only where needed
  - hero/media silhouettes use clipped corners or diagonal cuts
- Geometry direction:
  - asymmetry is intentional
  - diagonal cuts appear on hero panels, CTA bands, and section separators
  - repeated technical rails, numbered modules, and blueprint grid overlays support the family identity

### 4. Header Architecture

- Utility strip above main nav:
  - emergency/trust headline
  - service area or response window
  - phone/CTA if available
- Desktop nav:
  - strong brand block on left
  - nav centered/right
  - bright action CTA anchored on right
- Mobile nav:
  - compact top bar
  - high-contrast drawer with large tap targets
  - CTA repeated inside drawer
- Data ownership:
  - must consume existing logo, brand text, nav items, CTA links, and session tabs
  - no hardcoded business data

### 5. Hero Architecture

- Must not look like the current classic hero blocks
- Structure:
  - left operational content rail
  - right blueprint/media chamber
  - trust stats and response chips embedded in the hero shell
- Graphic treatment:
  - blueprint grid
  - technical lines
  - diagonal framing
  - panel labels / coordinates / step markers
- CTA strategy:
  - urgent primary CTA
  - secondary quote or service-area CTA
  - trust row close to CTA
- Mobile:
  - content first
  - image chamber stacks below
  - trust chips remain readable, not decorative clutter

### 6. Services Architecture

- Not a generic centered card grid
- Uses numbered service modules with:
  - left edge numbering
  - clipped card corners
  - technical metadata strip
  - diagonal highlight band on hover
- Layout can offset rows or use a two-track blueprint board
- Service section may include an operational aside:
  - response time
  - maintenance plans
  - licensed/insured proof

### 7. Social Proof Architecture

- Social proof is framed as trust and field reliability
- Reviews/testimonials sit in dark structured shells
- Include:
  - stars or score chips when available
  - author / job / area if available
  - one small trust metrics rail
- Avoid soft quote-carousel aesthetics

### 8. CTA Architecture

- CTA should feel operational and urgent
- Primary patterns:
  - emergency dispatch CTA
  - request quote CTA
  - schedule service CTA
- Visual form:
  - high-contrast action slab
  - diagonal side panel
  - strong button hierarchy
  - optional response-time bullets

### 9. Footer Architecture

- Structured technical footer
- Strong grid with:
  - summary block
  - nav/service columns
  - legal links
  - social icons
- Consumes existing tenant footer settings and legal content
- Visual tone is darker and denser than classic, but still readable

### 10. Decorative System

- Blueprint grids
- technical rulers
- numeric labels
- diagonal separators
- glow lines and subtle mesh highlights
- clipped image masks
- controlled CSS/SVG only
- no dependency on external illustration packs

### 11. Motion Profile: Mechanical

- Entrance:
  - short upward translate or lateral slide
  - opacity transitions only
  - staggered but tight timing
- Hover:
  - small elevation shift
  - border/line highlight
  - CTA brightness step
- Counters:
  - optional count-up only for visible stat chips
- Reduced motion:
  - no transforms beyond near-zero
  - no counter animation
  - no delayed staggering
- Mobile:
  - no heavy parallax
  - no large blur animation
  - no scroll-jank decorative motion

### 12. Image Treatment

- Prefer technician, jobsite, equipment, dispatch, and field-service photography
- Crops:
  - half-body or contextual action images
  - avoid generic smiling-office portraits
- Masks:
  - clipped corners
  - diagonal crop edge
- Overlays:
  - navy to transparent overlays for text contrast
  - blueprint line overlays only when subtle

### 13. Accessibility And Anti-Patterns

- Maintain strong contrast between text and dark surfaces
- Focus states must be bright and obvious
- Motion must respect `prefers-reduced-motion`
- Mobile typography must not drop below comfortable service-site readability
- Avoid:
  - pastel palettes
  - soft rounded wellness cards
  - delicate serif hero typography
  - decorative elements that compete with CTA
  - low-contrast translucent nav
  - video/parallax effects that impact mobile performance
