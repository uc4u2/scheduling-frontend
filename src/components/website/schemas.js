/**
 * Schema registry for the visual inspector.
 *
 * Conventions:
 * - Short stylable text (headings, eyebrows, captions, titles):  type: "richinline"
 * - Paragraphs / long content:                                   type: "richtext"
 * - Enumerated choices (alignment, sizes, positions):             type: "select" + options: [...]
 * - Numeric sliders:                                              type: "number" + min/max/(optional step)
 * - Image picker (uses Asset dialog):                             type: "image"
 * - Freeform multi-line / JSON blobs:                             type: "text" + minRows
 *
 * Notes (enterprise):
 * - For any string[] that represents images, use either:
 *     { type: "imageArray", ... }  // explicit
 *   or
 *     { type: "arrayOfStrings", render: "imageArray", ... }  // hint for UI renderer
 *   The inspector will render an upload-enabled list using the backend /api/website/media.
 */

export const SCHEMA_REGISTRY = {
  /* -------------------------- HERO -------------------------- */
  hero: {
    title: "Hero",
    fields: [
      { name: "eyebrow",     type: "richinline", label: "Eyebrow (small label)" },
      { name: "heading",     type: "richinline", label: "Heading" },
      { name: "subheading",  type: "richtext",   label: "Subheading", minRows: 4 },

      { name: "ctaText",           type: "richinline", label: "Primary button text" },
      { name: "ctaLink",           type: "string",     label: "Primary button link (URL)" },
      { name: "secondaryCtaText",  type: "richinline", label: "Secondary button text" },
      { name: "secondaryCtaLink",  type: "string",     label: "Secondary button link (URL)" },

      // Alignment & sizing
      { name: "align",            type: "select", label: "Content alignment", labelKey: "manager.visualBuilder.schemas.shared.contentAlignment", options: ["left","center","right"], default: "center" },
      { name: "titleAlign",       type: "select", label: "Title alignment",   options: ["left","center","right"], default: "center" },
      { name: "contentMaxWidth",  type: "select", label: "Inner content max width", labelKey: "manager.visualBuilder.schemas.shared.innerContentMaxWidth", options: ["xs","sm","md","lg","xl","full"], default: "lg" },
      { name: "heroHeight",       type: "number", label: "Height (vh, 0 = auto)", min: 0, max: 100, step: 5 },
      { name: "safeTop",          type: "boolean",label: "Respect safe area top inset", default: true },

      // Gutters / bleeds
      { name: "gutterX",     type: "number",  label: "Inner gutter (px)", labelKey: "manager.visualBuilder.schemas.shared.innerGutter", min: 0, max: 120, step: 2 },
      { name: "bleedLeft",   type: "boolean", label: "Bleed left" },
      { name: "bleedRight",  type: "boolean", label: "Bleed right" },

      // Backgrounds
      { name: "backgroundUrl",      type: "image",  label: "Background image", labelKey: "manager.visualBuilder.schemas.pageStyle.fields.backgroundImage" },
      { name: "backgroundVideo",    type: "video",  label: "Background video (mp4/webm)" },
      { name: "backgroundPosition", type: "select", label: "Background position", options: ["center","top","bottom","left","right"], default: "center" },

      // Overlay (slider as requested)
      {
        name: "overlay",
        label: "Overlay opacity",
        type: "slider",
        min: 0,
        max: 0.8,
        step: 0.01,
        default: 0.35,
        help: "0 = no tint (bright), 0.35 = default, higher = darker"
      },
{
  name: "overlayColor",
  label: "Overlay color", labelKey: "manager.visualBuilder.schemas.pageStyle.fields.overlayColor",
  type: "color",
  help: "Use white to lighten, black to darken"
},
{
  name: "brightness",
  label: "Image brightness",
  type: "slider",
  min: 0.6,
  max: 1.4,
  step: 0.01,
  help: "1 = original; >1 brighter, <1 darker"
},
      { name: "overlayGradient",  type: "string", label: "Overlay gradient (CSS)", placeholder: "linear-gradient(180deg, rgba(0,0,0,.15), rgba(0,0,0,.6))", ui: "gradient" }
    ]
  },

  /* ----------------------- HERO SPLIT ----------------------- */
  heroSplit: {
    title: "Hero (Split)",
    fields: [
      { name: "heading",     type: "richinline", label: "Heading" },
      { name: "subheading",  type: "richtext",   label: "Subheading" },
      { name: "ctaText",     type: "richinline", label: "Button text", labelKey: "manager.visualBuilder.schemas.bookingCtaBar.fields.buttonText" },
      { name: "ctaLink",     type: "string",     label: "Button link (URL)", labelKey: "manager.visualBuilder.schemas.bookingCtaBar.fields.buttonLink" },
      { name: "image",       type: "image",      label: "Right image" },

      { name: "align",       type: "select", label: "Content alignment", labelKey: "manager.visualBuilder.schemas.shared.contentAlignment", options: ["left","center","right"], default: "left" },
      { name: "titleAlign",  type: "select", label: "Title alignment",   options: ["left","center","right"], default: "left" },
      { name: "maxWidth",    type: "select", label: "Max width",         options: ["xs","sm","md","lg","xl","full"] },
      { name: "gutterX",     type: "number", label: "Inner gutter (px)", labelKey: "manager.visualBuilder.schemas.shared.innerGutter", min: 0, max: 120, step: 2 },
      { name: "bleedLeft",   type: "boolean", label: "Bleed left" },
      { name: "bleedRight",  type: "boolean", label: "Bleed right" }
    ]
  },

  /* ---------------------- SERVICE GRID ---------------------- */
  serviceGrid: {
    title: "Service Grid",
    fields: [
      { name: "title",     type: "richinline", label: "Section title" },
      { name: "subtitle",  type: "richtext",   label: "Subtitle" },
      {
        name: "items",
        type: "objectArray",
        label: "Items",
        fields: [
          { name: "name",        type: "text",   label: "Name", labelKey: "manager.visualBuilder.schemas.pricingTable.fields.name" },
          { name: "description", type: "text",   label: "Description" },
          { name: "image",       type: "image",  label: "Image" },
          { name: "price",       type: "text",   label: "Price" },
          { name: "meta",        type: "text",   label: "Meta" }
        ]
      },

      { name: "ctaText",   type: "richinline", label: "CTA text", labelKey: "manager.visualBuilder.schemas.pricingTable.fields.ctaText" },
      { name: "ctaLink",   type: "string",     label: "CTA link (URL)", labelKey: "manager.visualBuilder.schemas.pricingTable.fields.ctaLink" },

      { name: "titleAlign",type: "select",     label: "Title alignment", options: ["left","center","right"], default: "left" },
      { name: "maxWidth",  type: "select",     label: "Max width",       options: ["xs","sm","md","lg","xl","full"] },
      { name: "gutterX",   type: "number",     label: "Inner gutter (px)", labelKey: "manager.visualBuilder.schemas.shared.innerGutter", min: 0, max: 120, step: 2 },
      { name: "bleedLeft", type: "boolean",    label: "Bleed left" },
      { name: "bleedRight",type: "boolean",    label: "Bleed right" }
    ]
  },

  serviceGridSmart: {
    title: "Service Grid (Smart / Data-bound)",
    fields: [
      { name: "title",       type: "richinline", label: "Section title" },
      { name: "subtitle",    type: "richtext",   label: "Subtitle" },
      { name: "dataSource",  type: "text",       label: "Data source (JSON: { url, pick })", minRows: 4 },

      { name: "ctaText",     type: "richinline", label: "CTA text", labelKey: "manager.visualBuilder.schemas.pricingTable.fields.ctaText" },
      { name: "ctaLink",     type: "string",     label: "CTA link (URL)", labelKey: "manager.visualBuilder.schemas.pricingTable.fields.ctaLink" },

      { name: "titleAlign",  type: "select", label: "Title alignment", options: ["left","center","right"], default: "left" },
      { name: "maxWidth",    type: "select", label: "Max width",       options: ["xs","sm","md","lg","xl","full"] },
      { name: "gutterX",     type: "number", label: "Inner gutter (px)", labelKey: "manager.visualBuilder.schemas.shared.innerGutter", min: 0, max: 120, step: 2 },
      { name: "bleedLeft",   type: "boolean", label: "Bleed left" },
      { name: "bleedRight",  type: "boolean", label: "Bleed right" }
    ]
  },

  /* ------------------- COLLECTION SHOWCASE ------------------ */
  collectionShowcase: {
    title: "Collection Showcase",
    fields: [
      { name: "title", type: "richinline", label: "Heading" },
      { name: "subtitle", type: "richtext", label: "Subheading", minRows: 2 },
      {
        name: "items",
        type: "objectArray",
        label: "Carousel items",
        fields: [
          { name: "title", type: "richinline", label: "Title" },
          { name: "linkText", type: "richinline", label: "Link label" },
          { name: "link", type: "string", label: "Link URL" },
          { name: "image", type: "image", label: "Image" },
          { name: "imageAlt", type: "string", label: "Image alt text" },
        ],
      },
      {
        name: "perks",
        type: "objectArray",
        label: "Perks row",
        fields: [
          { name: "icon", type: "richinline", label: "Icon label" },
          { name: "title", type: "richinline", label: "Title" },
          { name: "subtitle", type: "text", label: "Subtitle" },
        ],
      },
      { name: "copyTitle", type: "richinline", label: "Copy heading" },
      { name: "copyBody", type: "richtext", label: "Copy body (HTML allowed)", minRows: 4 },
      { name: "ctaTitle", type: "richinline", label: "CTA heading" },
      { name: "ctaSubtitle", type: "richtext", label: "CTA subtitle", minRows: 2 },
      { name: "ctaButtonText", type: "richinline", label: "CTA button text" },
      { name: "ctaButtonLink", type: "string", label: "CTA button link" },
      {
        name: "perView",
        type: "object",
        label: "Cards per view",
        fields: [
          { name: "desktop", type: "number", label: "Desktop" },
          { name: "tablet", type: "number", label: "Tablet" },
          { name: "mobile", type: "number", label: "Mobile" },
        ],
      },
      { name: "showArrows", type: "boolean", label: "Show arrows", default: true },
      { name: "showDots", type: "boolean", label: "Show dots", default: false },
      { name: "autoplay", type: "boolean", label: "Autoplay", default: true },
      { name: "intervalMs", type: "number", label: "Autoplay interval (ms)", min: 1500, max: 12000, step: 100 },
      { name: "maxWidth", type: "select", label: "Max width", options: ["xs","sm","md","lg","xl","full"] },
      { name: "gutterX", type: "number", label: "Inner gutter (px)", labelKey: "manager.visualBuilder.schemas.shared.innerGutter", min: 0, max: 120, step: 2 },
      { name: "bleedLeft", type: "boolean", label: "Bleed left" },
      { name: "bleedRight", type: "boolean", label: "Bleed right" },
    ],
  },

  /* -------------------------- TEAM GRID --------------------- */
  teamGrid: {
    title: "Team",
    fields: [
      { name: "title",       type: "richinline", label: "Title" },
      { name: "subtitle",    type: "richtext",   label: "Subtitle", minRows: 3 },
      {
        name: "items",
        type: "objectArray",
        label: "Team members",
        fields: [
          { name: "name",  type: "richinline", label: "Name" },
          { name: "role",  type: "richinline", label: "Role" },
          { name: "image", type: "image",      label: "Photo" },
          { name: "email", type: "string",     label: "Email" },
          { name: "linkedin", type: "string",  label: "LinkedIn URL" },
          { name: "website", type: "string",   label: "Website URL" },
        ],
      },
      { name: "columnsXs",   type: "number", label: "Columns (xs)", min: 1, max: 6, step: 1, default: 1 },
      { name: "columnsSm",   type: "number", label: "Columns (sm)", min: 1, max: 6, step: 1, default: 2 },
      { name: "columnsMd",   type: "number", label: "Columns (md)", min: 1, max: 6, step: 1, default: 3 },
      { name: "gap",         type: "number", label: "Tile gap (px)", min: 0, max: 64, step: 1, default: 18 },
      { name: "titleAlign",  type: "select", label: "Title alignment", options: ["left","center","right"], default: "center" },
      { name: "maxWidth",    type: "select", label: "Max width", options: ["xs","sm","md","lg","xl","full"] },
      { name: "gutterX",     type: "number", label: "Inner gutter (px)", min: 0, max: 120, step: 2 },
      { name: "bleedLeft",   type: "boolean", label: "Bleed left" },
      { name: "bleedRight",  type: "boolean", label: "Bleed right" },
    ],
  },

  /* ----------------------- LOGO CLOUD ----------------------- */
  logoCloud: {
    title: "Logo Cloud",
    fields: [
      { name: "title",      type: "richinline", label: "Title", labelKey: "manager.visualBuilder.schemas.testimonials.fields.title" },
      { name: "caption",    type: "richinline", label: "Caption" },
      {
        name: "logos",
        type: "objectArray",
        label: "Logos",
        fields: [
          { name: "src", type: "image",  label: "Logo image" },
          { name: "alt", type: "text",   label: "Alt text" },
          { name: "label", type: "text", label: "Label (display name)" },
          { name: "caption", type: "text", label: "Caption (optional)" },
          { name: "meta", type: "text", label: "Meta (price/stat)" },
          { name: "description", type: "text", label: "Description", minRows: 2 },
          { name: "features", type: "arrayOfStrings", label: "Feature bullets" },
          { name: "ctaText", type: "text", label: "CTA text" },
          { name: "ctaLink", type: "string", label: "CTA link (URL)" },
          { name: "highlight", type: "boolean", label: "Highlight card" }
        ]
      },
      {
        name: "tabs",
        type: "objectArray",
        label: "Tabs",
        fields: [
          { name: "label", type: "text", label: "Tab label" },
          { name: "href", type: "string", label: "Tab link (URL)" }
        ]
      },
      { name: "tabsAlign", type: "select", label: "Tabs alignment", options: ["left","center","right"], default: "center" },
      { name: "supportingText", type: "richinline", label: "Supporting text" },
      { name: "supportingTextAlign", type: "select", label: "Supporting text alignment", options: ["left","center","right"], default: "left" },
      { name: "showLabels", type: "boolean",    label: "Show labels under logos" },
      { name: "monochrome", type: "boolean",    label: "Monochrome (grayscale) logos" },
      { name: "variant", type: "select", label: "Display style", options: ["grid","badges","cards"], default: "grid" },

      { name: "titleAlign", type: "select",     label: "Title alignment", options: ["left","center","right"], default: "left" },
      { name: "maxWidth",   type: "select",     label: "Max width", labelKey: "manager.visualBuilder.schemas.shared.maxWidth", options: ["xs","sm","md","lg","xl","full"] },
      { name: "gutterX",    type: "number",     label: "Inner gutter (px)", labelKey: "manager.visualBuilder.schemas.shared.innerGutter", min: 0, max: 120, step: 2 },
      { name: "bleedLeft",  type: "boolean",    label: "Bleed left" },
      { name: "bleedRight", type: "boolean",    label: "Bleed right" }
    ]
  },

  /* ----------------------- LOGO CAROUSEL -------------------- */
  logoCarousel: {
    title: "Logo Carousel",
    fields: [
      { name: "title",      type: "richinline", label: "Title", labelKey: "manager.visualBuilder.schemas.testimonials.fields.title" },
      { name: "caption",    type: "richinline", label: "Caption" },
      {
        name: "logos",
        type: "objectArray",
        label: "Brand items",
        fields: [
          { name: "label", type: "text",   label: "Label" },
          { name: "src",   type: "image",  label: "Logo image (optional)" }
        ]
      },
      { name: "showDots",   type: "boolean",    label: "Show dots / controls", default: true },
      { name: "intervalMs", type: "number",     label: "Slide interval (ms)", min: 1500, max: 12000, default: 4000 },
      { name: "titleAlign", type: "select",     label: "Title alignment", options: ["left","center","right"], default: "center" },
      { name: "maxWidth",   type: "select",     label: "Max width", labelKey: "manager.visualBuilder.schemas.shared.maxWidth", options: ["xs","sm","md","lg","xl","full"] },
      { name: "gutterX",    type: "number",     label: "Inner gutter (px)", labelKey: "manager.visualBuilder.schemas.shared.innerGutter", min: 0, max: 120, step: 2 },
      { name: "bleedLeft",  type: "boolean",    label: "Bleed left" },
      { name: "bleedRight", type: "boolean",    label: "Bleed right" }
    ]
  },

  testimonialCarousel: {
    title: "Testimonial Carousel",
    fields: [
      { name: "title",       type: "richinline", label: "Title" },
      { name: "autoplay",    type: "boolean",    label: "Autoplay" },
      { name: "intervalMs",  type: "number",     label: "Interval (ms)", min: 2000, max: 20000, step: 250 },
      { name: "showDots",    type: "boolean",    label: "Show dots" },
      { name: "showArrows",  type: "boolean",    label: "Show arrows" },
      {
        name: "perView",
        type: "object",
        label: "Cards per view",
        fields: [
          { name: "desktop", type: "number", label: "Desktop cards", min: 1, max: 5 },
          { name: "tablet",  type: "number", label: "Tablet cards", min: 1, max: 4 },
          { name: "mobile",  type: "number", label: "Mobile cards", min: 1, max: 3 },
        ],
      },
      { name: "maxWidth",    type: "select",     label: "Max width", options: ["xs","sm","md","lg","xl","full"] },
      {
        name: "reviews",
        type: "objectArray",
        label: "Reviews",
        fields: [
          { name: "name",   type: "richinline", label: "Name" },
          { name: "rating", type: "number",     label: "Rating (1-5)", min: 1, max: 5, step: 1 },
          { name: "source", type: "string",     label: "Source" },
          { name: "ago",    type: "string",     label: "When (\"2 months ago\")" },
          { name: "text",   type: "text",       label: "Review text", minRows: 3 },
        ],
      },
    ],
  },

  /* -------------------- FEATURE PILLARS --------------------- */
  featurePillars: {
    title: "Feature Pillars",
    fields: [
      { name: "title",       type: "richinline", label: "Title" },
      { name: "badge",       type: "richinline", label: "Badge / eyebrow" },
      { name: "caption",     type: "richtext",   label: "Caption", minRows: 3 },
      {
        name: "pillars",
        type: "objectArray",
        label: "Pillars",
        fields: [
          { name: "icon",    type: "richinline",    label: "Badge letter (optional)" },
          { name: "label",   type: "richinline",    label: "Label / category" },
          { name: "heading", type: "richinline",    label: "Heading" },
          { name: "summary", type: "richtext",      label: "Summary", minRows: 3 },
          {
            name: "bullets",
            type: "arrayOfStrings",
            label: "Bullet points"
          },
          {
            name: "metrics",
            type: "objectArray",
            label: "Metrics",
            fields: [
              { name: "label", type: "richinline", label: "Label" },
              { name: "value", type: "richinline", label: "Value" }
            ]
          }
        ]
      },

      { name: "layout",     type: "select",   label: "Layout", options: ["dense", "carousel"], default: "dense" },
      { name: "intervalMs", type: "number",   label: "Carousel interval (ms)", min: 1500, max: 12000, default: 4000 },

      { name: "titleAlign", type: "select",   label: "Title alignment", options: ["left","center","right"], default: "center" },
      { name: "maxWidth",   type: "select",   label: "Max width", labelKey: "manager.visualBuilder.schemas.shared.maxWidth", options: ["xs","sm","md","lg","xl","full"] },
      { name: "gutterX",    type: "number",   label: "Inner gutter (px)", labelKey: "manager.visualBuilder.schemas.shared.innerGutter", min: 0, max: 120, step: 2 },
      { name: "bleedLeft",  type: "boolean",  label: "Bleed left" },
      { name: "bleedRight", type: "boolean",  label: "Bleed right" }
    ]
  },

  /* -------------------- TESTIMONIAL TILES ------------------- */
  featureStories: {
    title: "Feature Stories",
    fields: [
      { name: "title",        type: "richinline", label: "Title" },
      { name: "caption",      type: "richtext",   label: "Caption", minRows: 3 },
      { name: "badge",        type: "richinline", label: "Badge / eyebrow" },
      {
        name: "legend",
        type: "arrayOfStrings",
        label: "Legend items (chips)",
      },
      { name: "legendAlign",  type: "select",     label: "Legend alignment", options: ["left","center","right"], default: "center" },
      {
        name: "stories",
        type: "objectArray",
        label: "Stories",
        fields: [
          { name: "icon",       type: "string",     label: "Icon (emoji, letter, or image URL)" },
          { name: "title",      type: "richinline", label: "Story title" },
          { name: "subtitle",   type: "string",     label: "Subtitle / secondary line" },
          { name: "statLabel",  type: "richinline", label: "Stat label" },
          { name: "statValue",  type: "richinline", label: "Stat value" },
          { name: "feature",    type: "richinline", label: "Feature tag" },
          { name: "description",type: "richtext",   label: "Description", minRows: 3 },
          { name: "bullets",     type: "arrayOfStrings", label: "Bullets" },
          { name: "ctaText",    type: "richinline", label: "CTA text" },
          { name: "ctaLink",    type: "string",     label: "CTA link (URL)" },
          { name: "background", type: "string",     label: "Card background (CSS gradient/color)" },
        ]
      },
      {
        name: "metrics",
        type: "arrayOfStrings",
        label: "Footer metrics (chips)",
      },
{
  name: "card",
  type: "object",
  label: "Card styling",
  fields: [
    { name: "padding",      type: "number", label: "Padding (px)", min: 12, max: 48, step: 2 },
    { name: "radius",       type: "number", label: "Corner radius (px)", min: 0, max: 48, step: 2 },
    { name: "gap",          type: "number", label: "Grid gap (px)", min: 16, max: 64, step: 2 },
    { name: "maxWidth",     type: "number", label: "Max width (px)", min: 720, max: 1440, step: 10 },
    { name: "sectionBackground", type: "string", label: "Section background (CSS gradient/color)" },
    { name: "surface",      type: "string", label: "Card surface (CSS color)" },
    { name: "borderColor",  type: "string", label: "Border color" },
    { name: "shadow",       type: "string", label: "Shadow", ui: "shadow", shadowType: "box" },
    { name: "headingColor", type: "color",  label: "Heading color" },
    { name: "bodyColor",    type: "color",  label: "Body text color" },
    { name: "badgeColor",   type: "color",  label: "Badge color" },
    { name: "statColor",    type: "color",  label: "Stat color" },
    { name: "chipBg",       type: "color",  label: "Chip background" },
    { name: "chipColor",    type: "color",  label: "Chip text" },
    { name: "chipBorder",   type: "color",  label: "Chip border" },
    { name: "iconBg",       type: "color",  label: "Icon background" },
    { name: "iconColor",    type: "color",  label: "Icon color" },
    { name: "ctaColor",     type: "color",  label: "CTA color" },
    { name: "legendBg",     type: "color",  label: "Legend chip background" },
    { name: "legendColor",  type: "color",  label: "Legend chip text" },
    { name: "metricBg",     type: "color",  label: "Metric chip background" },
    { name: "metricColor",  type: "color",  label: "Metric chip text" }
  ]
},

      { name: "style",      type: "select",   label: "Layout", options: ["grid", "slider"], default: "grid" },
      { name: "showDots",   type: "boolean",  label: "Show dots (slider)", default: true },
      { name: "intervalMs", type: "number",   label: "Slider interval (ms)", min: 1500, max: 12000, default: 4000 },

      { name: "titleAlign", type: "select",   label: "Title alignment", options: ["left","center","right"], default: "left" },
      { name: "maxWidth",   type: "select",   label: "Max width", labelKey: "manager.visualBuilder.schemas.shared.maxWidth", options: ["xs","sm","md","lg","xl","full"] },
      { name: "gutterX",    type: "number",   label: "Inner gutter (px)", labelKey: "manager.visualBuilder.schemas.shared.innerGutter", min: 0, max: 120, step: 2 },
      { name: "bleedLeft",  type: "boolean",  label: "Bleed left" },
      { name: "bleedRight", type: "boolean",  label: "Bleed right" }
    ]
  },

  featureZigzag: {
    title: "Feature Zigzag",
    fields: [
      { name: "eyebrow",        type: "richinline", label: "Eyebrow label" },
      { name: "title",          type: "richinline", label: "Heading" },
      { name: "supportingText", type: "richtext",   label: "Supporting text", minRows: 4 },
      { name: "titleAlign",     type: "select",     label: "Heading alignment", options: ["left","center","right"], default: "left" },
      { name: "maxWidth",       type: "select",     label: "Max width", labelKey: "manager.visualBuilder.schemas.shared.maxWidth", options: ["xs","sm","md","lg","xl","full"] },
      { name: "gutterX",        type: "number",     label: "Inner gutter (px)", labelKey: "manager.visualBuilder.schemas.shared.innerGutter", min: 0, max: 120, step: 2 },
      { name: "bleedLeft",      type: "boolean",    label: "Bleed left" },
      { name: "bleedRight",     type: "boolean",    label: "Bleed right" },
      {
        name: "items",
        type: "objectArray",
        label: "Rows",
        minItems: 1,
        fields: [
          { name: "eyebrow", type: "richinline", label: "Eyebrow" },
          { name: "title",   type: "richinline", label: "Row title" },
          { name: "body",    type: "richtext",   label: "Body copy", minRows: 4 },
          { name: "ctaText", type: "richinline", label: "CTA text" },
          { name: "ctaLink", type: "string",     label: "CTA link (URL)" },
          { name: "imageUrl",type: "image",      label: "Image" },
          { name: "imageAlt",type: "text",       label: "Image alt text" },
          {
            name: "align",
            type: "select",
            label: "Text column side",
            options: ["left","right"],
            default: "left",
            help: "Left = text first (image right); Right = text second (image left)"
          }
        ]
      }
    ]
  },

  featureZigzagModern: {
    title: "Feature Zigzag (Modern)",
    fields: [
      { name: "eyebrow",        type: "richinline", label: "Eyebrow label" },
      { name: "title",          type: "richinline", label: "Heading" },
      { name: "supportingText", type: "richtext",   label: "Supporting text", minRows: 4 },
      { name: "titleAlign",     type: "select",     label: "Heading alignment", options: ["left","center","right"], default: "left" },
      { name: "maxWidth",       type: "select",     label: "Max width", labelKey: "manager.visualBuilder.schemas.shared.maxWidth", options: ["xs","sm","md","lg","xl","full"] },
      {
        name: "items",
        type: "objectArray",
        label: "Rows",
        minItems: 1,
        fields: [
          { name: "eyebrow", type: "richinline", label: "Eyebrow" },
          { name: "title",   type: "richinline", label: "Row title" },
          { name: "body",    type: "richtext",   label: "Body copy", minRows: 4 },
          { name: "ctaText", type: "richinline", label: "CTA text" },
          { name: "ctaLink", type: "string",     label: "CTA link (URL)" },
          { name: "imageUrl",type: "image",      label: "Image" },
          { name: "imageAlt",type: "text",       label: "Image alt text" },
          {
            name: "align",
            type: "select",
            label: "Text column side",
            options: ["left","right"],
            default: "left",
            help: "Left = text first (image right); Right = text second (image left)"
          }
        ]
      }
    ]
  },

  /* -------------------------- STATS ------------------------- */
  stats: {
    title: "Stats",
    fields: [
      { name: "title",       type: "richinline", label: "Title", labelKey: "manager.visualBuilder.schemas.testimonials.fields.title" },
      {
        name: "items",
        type: "objectArray",
        label: "Items",
        fields: [
          { name: "value", type: "text", label: "Value" },
          { name: "label", type: "text", label: "Label" }
        ]
      },
      // Use inline to avoid <p> wrappers for a one-liner
      { name: "disclaimer",  type: "richinline", label: "Disclaimer (small print)" },

      { name: "titleAlign",  type: "select", label: "Title alignment", options: ["left","center","right"], default: "left" },
      { name: "maxWidth",    type: "select", label: "Max width", labelKey: "manager.visualBuilder.schemas.shared.maxWidth", options: ["xs","sm","md","lg","xl","full"] },
      { name: "gutterX",     type: "number", label: "Inner gutter (px)", labelKey: "manager.visualBuilder.schemas.shared.innerGutter", min: 0, max: 120, step: 2 },
      { name: "bleedLeft",   type: "boolean", label: "Bleed left" },
      { name: "bleedRight",  type: "boolean", label: "Bleed right" }
    ]
  },

  /* ---------------------- TEAM METRICS ---------------------- */
  teamMetrics: {
    title: "Team Metrics",
    fields: [
      { name: "title",     type: "richinline", label: "Title" },
      { name: "subtitle",  type: "richtext",   label: "Subtitle", minRows: 3 },
      {
        name: "items",
        type: "objectArray",
        label: "Metrics",
        fields: [
          { name: "value",   type: "richinline", label: "Value (e.g., 12+ yrs)" },
          { name: "label",   type: "richinline", label: "Label" },
          { name: "caption", type: "richtext",   label: "Caption (optional)", minRows: 2 },
        ],
      },
      { name: "titleAlign",  type: "select", label: "Title alignment", options: ["left","center","right"], default: "center" },
      { name: "maxWidth",    type: "select", label: "Max width", options: ["xs","sm","md","lg","xl","full"] },
      { name: "gutterX",     type: "number", label: "Inner gutter (px)", min: 0, max: 120, step: 2 },
      { name: "bleedLeft",   type: "boolean", label: "Bleed left" },
      { name: "bleedRight",  type: "boolean", label: "Bleed right" },
    ]
  },

  /* --------------------- CULTURE VALUES --------------------- */
  cultureValues: {
    title: "Culture & Values",
    fields: [
      { name: "title",     type: "richinline", label: "Title" },
      { name: "subtitle",  type: "richtext",   label: "Subtitle", minRows: 3 },
      {
        name: "items",
        type: "objectArray",
        label: "Values",
        fields: [
          { name: "icon",   type: "richinline", label: "Icon (emoji or short text)" },
          { name: "title",  type: "richinline", label: "Value" },
          { name: "text",   type: "richtext",   label: "Description", minRows: 2 },
        ],
      },
      { name: "columnsXs",  type: "number", label: "Columns (xs)", min: 1, max: 6, step: 1, default: 1 },
      { name: "columnsSm",  type: "number", label: "Columns (sm)", min: 1, max: 6, step: 1, default: 2 },
      { name: "columnsMd",  type: "number", label: "Columns (md)", min: 1, max: 6, step: 1, default: 3 },
      { name: "gap",        type: "number", label: "Tile gap (px)", min: 0, max: 64, step: 1, default: 18 },
      { name: "titleAlign", type: "select", label: "Title alignment", options: ["left","center","right"], default: "center" },
      { name: "maxWidth",   type: "select", label: "Max width", options: ["xs","sm","md","lg","xl","full"] },
      { name: "gutterX",    type: "number", label: "Inner gutter (px)", min: 0, max: 120, step: 2 },
      { name: "bleedLeft",  type: "boolean", label: "Bleed left" },
      { name: "bleedRight", type: "boolean", label: "Bleed right" }
    ]
  },

  /* ------------------- PROCESS & STANDARDS ------------------ */
  processSteps: {
    title: "Process & Standards",
    fields: [
      { name: "title",     type: "richinline", label: "Title" },
      { name: "subtitle",  type: "richtext",   label: "Subtitle", minRows: 3 },
      {
        name: "steps",
        type: "objectArray",
        label: "Steps",
        fields: [
          { name: "title",       type: "richinline", label: "Step title" },
          { name: "description", type: "richtext",   label: "Description", minRows: 2 },
          { name: "meta",        type: "richinline", label: "Meta (optional)" },
        ],
      },
      { name: "columnsXs",  type: "number", label: "Columns (xs)", min: 1, max: 6, step: 1, default: 1 },
      { name: "columnsSm",  type: "number", label: "Columns (sm)", min: 1, max: 6, step: 1, default: 2 },
      { name: "columnsMd",  type: "number", label: "Columns (md)", min: 1, max: 6, step: 1, default: 3 },
      { name: "gap",        type: "number", label: "Tile gap (px)", min: 0, max: 64, step: 1, default: 18 },
      { name: "titleAlign", type: "select", label: "Title alignment", options: ["left","center","right"], default: "center" },
      { name: "maxWidth",   type: "select", label: "Max width", options: ["xs","sm","md","lg","xl","full"] },
      { name: "gutterX",    type: "number", label: "Inner gutter (px)", min: 0, max: 120, step: 2 },
      { name: "bleedLeft",  type: "boolean", label: "Bleed left" },
      { name: "bleedRight", type: "boolean", label: "Bleed right" }
    ]
  },

  /* ---------------------- HERO CAROUSEL --------------------- */
  heroCarousel: {
    title: "Hero (Carousel)",
    fields: [
      { name: "autoplay",       type: "boolean",    label: "Autoplay" },
      { name: "intervalMs",     type: "number",     label: "Interval (ms)", min: 2000, max: 20000, step: 500 },
      { name: "align",          type: "select",     label: "Text alignment", options: ["left","center","right"], default: "center" },
      { name: "contentMaxWidth",type: "select",     label: "Content max width", options: ["xs","sm","md","lg","xl","full"], default: "lg" },
      { name: "heroHeight",     type: "number",     label: "Hero height (vh)", min: 36, max: 100, step: 2 },
      { name: "safeTop",        type: "boolean",    label: "Respect safe area top" },
      { name: "overlay",        type: "number",     label: "Overlay opacity (0–1)", min: 0, max: 1, step: 0.05 },
      { name: "overlayColor",   type: "color",      label: "Overlay color" },
      { name: "overlayGradient",type: "text",       label: "Overlay gradient CSS", ui: "gradient" },
      { name: "brightness",     type: "number",     label: "Background brightness", min: 0.2, max: 1.8, step: 0.05 },
      { name: "slides",         type: "objectArray", label: "Slides",
        fields: [
          { name: "image",              type: "image",   label: "Background image" },
          { name: "backgroundVideo",    type: "video",   label: "Background video (mp4/webm)" },
          { name: "backgroundPosition", type: "text",    label: "Background position", placeholder: "center" },
          { name: "eyebrow",            type: "richinline", label: "Eyebrow" },
          { name: "heading",            type: "richinline", label: "Heading" },
          { name: "subheading",         type: "richtext",   label: "Subheading" },
          { name: "ctaText",            type: "richinline", label: "Primary CTA" },
          { name: "ctaLink",            type: "string",     label: "Primary CTA link" },
          { name: "secondaryCtaText",   type: "richinline", label: "Secondary CTA" },
          { name: "secondaryCtaLink",   type: "string",     label: "Secondary CTA link" }
        ]
      }
    ]
  },

  /* -------------------------- VIDEO ------------------------- */
  video: {
    title: "Video",
    fields: [
      { name: "title",       type: "richinline", label: "Title", labelKey: "manager.visualBuilder.schemas.testimonials.fields.title" },
      { name: "description", type: "richtext",   label: "Description" },
      { name: "url",         type: "string",     label: "Embed URL (YouTube, etc.)" },
      { name: "poster",      type: "image",      label: "Poster image" },

      { name: "titleAlign",  type: "select", label: "Title alignment", options: ["left","center","right"], default: "left" },
      { name: "maxWidth",    type: "select", label: "Max width", labelKey: "manager.visualBuilder.schemas.shared.maxWidth", options: ["xs","sm","md","lg","xl","full"] },
      { name: "gutterX",     type: "number", label: "Inner gutter (px)", labelKey: "manager.visualBuilder.schemas.shared.innerGutter", min: 0, max: 120, step: 2 },
      { name: "bleedLeft",   type: "boolean", label: "Bleed left" },
      { name: "bleedRight",  type: "boolean", label: "Bleed right" }
    ]
  },

  /* --------------------------- GALLERY ---------------------- */
  gallery: {
    title: "Gallery",
    fields: [
      { name: "title",       type: "richinline", label: "Title", labelKey: "manager.visualBuilder.schemas.testimonials.fields.title" },
      { name: "images",      type: "imageArray", label: "Images" },
      { name: "columnsXs",   type: "number",     label: "Columns (xs)", min: 1, max: 6, step: 1, default: 2 },
      { name: "columnsSm",   type: "number",     label: "Columns (sm)", min: 1, max: 6, step: 1, default: 2 },
      { name: "columnsMd",   type: "number",     label: "Columns (md)", min: 1, max: 6, step: 1, default: 3 },
      { name: "gap",         type: "number",     label: "Tile gap (px)", min: 0, max: 64, step: 1, default: 18 },
      { name: "tileAspectRatio", type: "string", label: "Tile aspect ratio", placeholder: "4/5" },
      { name: "tileBorderRadius", type: "number", label: "Tile border radius (px)", min: 0, max: 64, step: 1, default: 0 },
      { name: "tileBorder", type: "string", label: "Tile border (CSS)", placeholder: "1px solid rgba(255,255,255,0.35)" },
      { name: "tileHoverLift", type: "boolean", label: "Hover lift", default: true },
      { name: "lightboxEnabled", type: "boolean", label: "Lightbox enabled", default: true },
      { name: "lightboxLoop", type: "boolean", label: "Lightbox loop", default: true },
      { name: "lightboxShowArrows", type: "boolean", label: "Lightbox arrows", default: true },
      { name: "lightboxCloseOnBackdrop", type: "boolean", label: "Close on backdrop", default: true },
      { name: "titleAlign",  type: "select",     label: "Title alignment", options: ["left","center","right"], default: "center" },
      { name: "maxWidth",    type: "select",     label: "Max width", labelKey: "manager.visualBuilder.schemas.shared.maxWidth", options: ["xs","sm","md","lg","xl","full"] },
      { name: "gutterX",     type: "number",     label: "Inner gutter (px)", labelKey: "manager.visualBuilder.schemas.shared.innerGutter", min: 0, max: 120, step: 2 },
      { name: "bleedLeft",   type: "boolean",    label: "Bleed left" },
      { name: "bleedRight",  type: "boolean",    label: "Bleed right" }
    ]
  },

  /* ------------------------ VIDEO GALLERY ------------------- */
  videoGallery: {
    title: "Video Gallery",
    fields: [
      { name: "title",       type: "richinline", label: "Title", labelKey: "manager.visualBuilder.schemas.testimonials.fields.title" },
      {
        name: "videos",
        type: "objectArray",
        label: "Videos",
        fields: [
          { name: "video",   type: "video", label: "Video (mp4/webm)" },
          { name: "poster",  type: "image", label: "Poster image (optional)" },
          { name: "caption", type: "richinline", label: "Caption (optional)" }
        ]
      },
      { name: "columnsXs",   type: "number",     label: "Columns (xs)", min: 1, max: 6, step: 1, default: 2 },
      { name: "columnsSm",   type: "number",     label: "Columns (sm)", min: 1, max: 6, step: 1, default: 2 },
      { name: "columnsMd",   type: "number",     label: "Columns (md)", min: 1, max: 6, step: 1, default: 3 },
      { name: "gap",         type: "number",     label: "Tile gap (px)", min: 0, max: 64, step: 1, default: 18 },
      { name: "tileAspectRatio", type: "string", label: "Tile aspect ratio", placeholder: "16/9" },
      { name: "tileBorderRadius", type: "number", label: "Tile border radius (px)", min: 0, max: 64, step: 1, default: 0 },
      { name: "tileBorder", type: "string", label: "Tile border (CSS)", placeholder: "1px solid rgba(255,255,255,0.35)" },
      { name: "tileHoverLift", type: "boolean", label: "Hover lift", default: true },
      { name: "lightboxEnabled", type: "boolean", label: "Lightbox enabled", default: true },
      { name: "lightboxLoop", type: "boolean", label: "Lightbox loop", default: true },
      { name: "lightboxShowArrows", type: "boolean", label: "Lightbox arrows", default: true },
      { name: "lightboxCloseOnBackdrop", type: "boolean", label: "Close on backdrop", default: true },
      { name: "ctaText",    type: "richinline", label: "CTA text (optional)" },
      { name: "ctaLink",    type: "string",     label: "CTA link (URL)" },
      { name: "titleAlign",  type: "select",     label: "Title alignment", options: ["left","center","right"], default: "center" },
      { name: "maxWidth",    type: "select",     label: "Max width", labelKey: "manager.visualBuilder.schemas.shared.maxWidth", options: ["xs","sm","md","lg","xl","full"] },
      { name: "gutterX",     type: "number",     label: "Inner gutter (px)", labelKey: "manager.visualBuilder.schemas.shared.innerGutter", min: 0, max: 120, step: 2 },
      { name: "bleedLeft",   type: "boolean",    label: "Bleed left" },
      { name: "bleedRight",  type: "boolean",    label: "Bleed right" }
    ]
  },

  /* -------------------------- BLOG LIST ---------------------- */
  blogList: {
    title: "Blog",
    fields: [
      { name: "title",       type: "richinline", label: "Title" },
      { name: "subtitle",    type: "richtext",   label: "Subtitle", minRows: 3 },
      {
        name: "posts",
        type: "objectArray",
        label: "Posts",
        fields: [
          { name: "slug",         type: "string",     label: "Slug (URL id)" },
          { name: "title",        type: "richinline", label: "Title" },
          { name: "date",         type: "string",     label: "Date (YYYY-MM-DD)" },
          { name: "excerpt",      type: "richtext",   label: "Excerpt", minRows: 2 },
          { name: "body",         type: "richtext",   label: "Body", minRows: 6 },
          { name: "coverImage",   type: "image",      label: "Cover image" },
          { name: "galleryImages",type: "imageArray", label: "Gallery images" },
          { name: "seo_title",    type: "string",     label: "SEO title" },
          { name: "seo_description", type: "text",    label: "SEO description", minRows: 2 },
          { name: "seo_keywords", type: "string",     label: "SEO keywords (comma separated)" },
          { name: "og_image_url", type: "image",      label: "OG image" },
          { name: "canonical_path", type: "string",   label: "Canonical path (optional)" },
        ],
      },
      { name: "columnsXs",   type: "number", label: "Columns (xs)", min: 1, max: 6, step: 1, default: 1 },
      { name: "columnsSm",   type: "number", label: "Columns (sm)", min: 1, max: 6, step: 1, default: 2 },
      { name: "columnsMd",   type: "number", label: "Columns (md)", min: 1, max: 6, step: 1, default: 3 },
      { name: "gap",         type: "number", label: "Card gap (px)", min: 0, max: 64, step: 1, default: 18 },
      { name: "titleAlign",  type: "select", label: "Title alignment", options: ["left","center","right"], default: "center" },
      { name: "maxWidth",    type: "select", label: "Max width", options: ["xs","sm","md","lg","xl","full"] },
      { name: "gutterX",     type: "number", label: "Inner gutter (px)", min: 0, max: 120, step: 2 },
      { name: "bleedLeft",   type: "boolean", label: "Bleed left" },
      { name: "bleedRight",  type: "boolean", label: "Bleed right" },
    ],
  },

  /* --------------------------- MAP ---------------------- */
  mapEmbed: {
    title: "Map",
    fields: [
      { name: "title",       type: "richinline", label: "Title (optional)" },
      { name: "provider",    type: "select",     label: "Provider", options: ["google"], default: "google" },
      { name: "query",       type: "string",     label: "Address / query" },
      { name: "embedUrl",    type: "string",     label: "Embed URL (optional)" },
      { name: "height",      type: "number",     label: "Height (px)", min: 180, max: 900, step: 10, default: 320 },
      { name: "borderRadius",type: "number",     label: "Border radius (px)", min: 0, max: 64, step: 1, default: 16 },
      { name: "titleAlign",  type: "select",     label: "Title alignment", options: ["left","center","right"], default: "left" },
      { name: "maxWidth",    type: "select",     label: "Max width", labelKey: "manager.visualBuilder.schemas.shared.maxWidth", options: ["xs","sm","md","lg","xl","full"] },
      { name: "gutterX",     type: "number",     label: "Inner gutter (px)", labelKey: "manager.visualBuilder.schemas.shared.innerGutter", min: 0, max: 120, step: 2 },
      { name: "bleedLeft",   type: "boolean",    label: "Bleed left" },
      { name: "bleedRight",  type: "boolean",    label: "Bleed right" }
    ]
  },

  /* -------------------- GALLERY / CAROUSEL ------------------ */
  galleryCarousel: {
    title: "Gallery (Carousel)",
    fields: [
      { name: "title",    type: "richinline",    label: "Title", labelKey: "manager.visualBuilder.schemas.testimonials.fields.title" },
      { name: "caption",  type: "richinline",    label: "Caption (optional)" },
      { name: "images",   type: "arrayOfStrings", render: "imageArray", label: "Images" },
      { name: "autoplay", type: "boolean",       label: "Autoplay" },

      { name: "titleAlign", type: "select", label: "Title alignment", options: ["left","center","right"], default: "left" },
      { name: "maxWidth",   type: "select", label: "Max width", labelKey: "manager.visualBuilder.schemas.shared.maxWidth", options: ["xs","sm","md","lg","xl","full"] },
      { name: "gutterX",    type: "number", label: "Inner gutter (px)", labelKey: "manager.visualBuilder.schemas.shared.innerGutter", min: 0, max: 120, step: 2 },
      { name: "bleedLeft",  type: "boolean", label: "Bleed left" },
      { name: "bleedRight", type: "boolean", label: "Bleed right" }
    ]
  },

  /* ---------------------- TESTIMONIALS ---------------------- */
  testimonials: {
    title: "Testimonials", titleKey: "manager.visualBuilder.schemas.testimonials.title",
    fields: [
      { name: "title",       type: "richinline", label: "Title", labelKey: "manager.visualBuilder.schemas.testimonials.fields.title" },
      {
        name: "items",
        type: "objectArray",
        label: "Testimonials", labelKey: "manager.visualBuilder.schemas.testimonials.items",
        fields: [
          { name: "avatar", type: "image",  label: "Avatar (optional)", labelKey: "manager.visualBuilder.schemas.testimonials.fields.avatar" },
          { name: "quote",  type: "text",   label: "Quote", labelKey: "manager.visualBuilder.schemas.testimonials.fields.quote", minRows: 2 },
          { name: "author", type: "string", label: "Author", labelKey: "manager.visualBuilder.schemas.testimonials.fields.author" }
        ]
      },
      { name: "titleAlign",  type: "select", label: "Title alignment", options: ["left","center","right"], default: "left" },
      { name: "maxWidth",    type: "select", label: "Max width", labelKey: "manager.visualBuilder.schemas.shared.maxWidth", options: ["xs","sm","md","lg","xl","full"] }
    ]
  },

  /* ---------------------- PRICING TABLE --------------------- */
  pricingTable: {
    title: "Pricing Table",
    fields: [
      { name: "title",     type: "richinline", label: "Title", labelKey: "manager.visualBuilder.schemas.pricingTable.fields.title" },
      { name: "intro",     type: "richtext",   label: "Intro (optional)" },
      { name: "notes",     type: "richinline", label: "Notes (alias of intro; legacy)", description: "Prefer Intro above." },

      // Plans as structured rows (no more freeform JSON)
      {
        name: "plans",
        type: "objectArray",
        label: "Plans", labelKey: "manager.visualBuilder.schemas.pricingTable.plans",
        fields: [
          { name: "ribbon",   type: "string",         label: "Ribbon (optional)", labelKey: "manager.visualBuilder.schemas.pricingTable.fields.ribbon" },
          { name: "name",     type: "string",         label: "Name", labelKey: "manager.visualBuilder.schemas.pricingTable.fields.name" },
          { name: "price",    type: "string",         label: "Price (e.g. $450)", labelKey: "manager.visualBuilder.schemas.pricingTable.fields.price" },
          { name: "features", type: "arrayOfStrings", label: "Features", labelKey: "manager.visualBuilder.schemas.pricingTable.fields.features" },
          { name: "ctaText",  type: "string",         label: "CTA text", labelKey: "manager.visualBuilder.schemas.pricingTable.fields.ctaText" },
          { name: "ctaLink",  type: "string",         label: "CTA link (URL)", labelKey: "manager.visualBuilder.schemas.pricingTable.fields.ctaLink" },
          { name: "featured", type: "boolean",        label: "Highlight this plan", labelKey: "manager.visualBuilder.schemas.pricingTable.fields.featured" }
        ]
      },

      { name: "titleAlign",type: "select",     label: "Title alignment", options: ["left","center","right"], default: "left" },
      { name: "maxWidth",  type: "select",     label: "Max width", labelKey: "manager.visualBuilder.schemas.shared.maxWidth", options: ["xs","sm","md","lg","xl","full"] },
      { name: "gutterX",   type: "number",     label: "Inner gutter (px)", labelKey: "manager.visualBuilder.schemas.shared.innerGutter", min: 0, max: 120, step: 2 },
      { name: "bleedLeft", type: "boolean",    label: "Bleed left" },
      { name: "bleedRight",type: "boolean",    label: "Bleed right" }
    ]
  },

  /* --------------------------- FAQ -------------------------- */
  faq: {
    title: "FAQ",
    fields: [
      { name: "title",     type: "richinline", label: "Title", labelKey: "manager.visualBuilder.schemas.testimonials.fields.title" },
      {
        name: "items",
        type: "objectArray",
        label: "Questions",
        fields: [
          { name: "question", type: "string",   label: "Question" },
          { name: "answer",   type: "richtext", label: "Answer" }
        ]
      },

      { name: "titleAlign",type: "select",     label: "Title alignment", options: ["left","center","right"], default: "left" },
      { name: "maxWidth",  type: "select",     label: "Max width", labelKey: "manager.visualBuilder.schemas.shared.maxWidth", options: ["xs","sm","md","lg","xl","full"] },
      { name: "gutterX",   type: "number",     label: "Inner gutter (px)", labelKey: "manager.visualBuilder.schemas.shared.innerGutter", min: 0, max: 120, step: 2 },
      { name: "bleedLeft", type: "boolean",    label: "Bleed left" },
      { name: "bleedRight",type: "boolean",    label: "Bleed right" }
    ]
  },

  /* ------------------------ CTA (Card) ---------------------- */
  cta: {
    title: "Call to Action",
    fields: [
      { name: "title",      type: "richinline", label: "Title", labelKey: "manager.visualBuilder.schemas.testimonials.fields.title" },
      { name: "subtitle",   type: "richinline", label: "Subtitle" },
      { name: "buttonText", type: "richinline", label: "Button text", labelKey: "manager.visualBuilder.schemas.bookingCtaBar.fields.buttonText" },
      { name: "buttonLink", type: "string",     label: "Button link (URL)", labelKey: "manager.visualBuilder.schemas.bookingCtaBar.fields.buttonLink" },

      { name: "titleAlign", type: "select",     label: "Title alignment", options: ["left","center","right"], default: "center" },
      { name: "maxWidth",   type: "select",     label: "Max width", labelKey: "manager.visualBuilder.schemas.shared.maxWidth", options: ["xs","sm","md","lg","xl","full"] }
    ]
  },

  /* ------------------------ RICH TEXT ----------------------- */
  richText: {
    title: "Rich Text",
    fields: [
      { name: "title",     type: "richinline", label: "Title", labelKey: "manager.visualBuilder.schemas.testimonials.fields.title" },
      { name: "body",      type: "richtext",   label: "Body (rich text; sanitized on render)", minRows: 6 },

      { name: "align",     type: "select",     label: "Content alignment", labelKey: "manager.visualBuilder.schemas.shared.contentAlignment", options: ["left","center","right"], default: "left" },
      { name: "titleAlign",type: "select",     label: "Title alignment",   options: ["left","center","right"], default: "left" },
      { name: "maxWidth",  type: "select",     label: "Max width",         options: ["xs","sm","md","lg","xl","full"] },
      { name: "gutterX",   type: "number",     label: "Inner gutter (px)", labelKey: "manager.visualBuilder.schemas.shared.innerGutter", min: 0, max: 120, step: 2 },
      { name: "bleedLeft", type: "boolean",    label: "Bleed left" },
      { name: "bleedRight",type: "boolean",    label: "Bleed right" }
    ]
  },

  /* ------------------------- FREE TEXT ---------------------- */
  textFree: {
    title: "Free Text (Draggable)",
    fields: [
      { name: "text",        type: "string",  label: "Text", labelKey: "manager.visualBuilder.schemas.bookingCtaBar.fields.text" },
      { name: "x",           type: "number",  label: "X (px)", min: -2000, max: 2000, step: 1 },
      { name: "y",           type: "number",  label: "Y (px)", min: -2000, max: 2000, step: 1 },
      { name: "width",       type: "number",  label: "Width (px)", min: 80, max: 2000, step: 10 },
      { name: "align",       type: "select",  label: "Text alignment", options: ["left","center","right"], default: "left" },
      { name: "fontSize",    type: "number",  label: "Font size (px)", min: 8, max: 200, step: 1, default: 24 },
      { name: "fontWeight",  type: "number",  label: "Font weight", min: 100, max: 1000, step: 50, default: 700 },
      { name: "color",       type: "string",  label: "Text color (CSS)" },
      { name: "background",  type: "string",  label: "Background (CSS)" },
      { name: "padding",     type: "number",  label: "Padding (px)", min: 0, max: 120, step: 1, default: 8 },
      { name: "borderRadius",type: "number",  label: "Border radius (px)", min: 0, max: 64, step: 1, default: 8 },
      { name: "editable",    type: "boolean", label: "Editable", default: true }
    ]
  },

  /* ------------------------- CONTACT ------------------------ */
  contact: {
    title: "Contact",
    fields: [
      { name: "title",       type: "richinline", label: "Title", labelKey: "manager.visualBuilder.schemas.pricingTable.fields.title" },
      { name: "intro",       type: "richtext",   label: "Intro (optional)", minRows: 4 },
      { name: "email",       type: "richinline", label: "Email" },
      { name: "phone",       type: "richinline", label: "Phone" },
      { name: "address",     type: "richinline", label: "Address" },
      { name: "mapEmbedUrl", type: "string",     label: "Google Maps Embed URL" },

      { name: "titleAlign",  type: "select",     label: "Title alignment", options: ["left","center","right"], default: "left" },
      { name: "maxWidth",    type: "select",     label: "Max width", labelKey: "manager.visualBuilder.schemas.shared.maxWidth", options: ["xs","sm","md","lg","xl","full"] },
      { name: "gutterX",     type: "number",     label: "Inner gutter (px)", labelKey: "manager.visualBuilder.schemas.shared.innerGutter", min: 0, max: 120, step: 2 },
      { name: "bleedLeft",   type: "boolean",    label: "Bleed left" },
      { name: "bleedRight",  type: "boolean",    label: "Bleed right" }
    ]
  },



    contactForm: {
    title: "Contact Form",
    fields: [
      { name: "title",          type: "richinline", label: "Title", labelKey: "manager.visualBuilder.schemas.testimonials.fields.title", default: "Contact Us" },
      { name: "intro",          type: "richtext",   label: "Intro (optional)", minRows: 4 },
      { name: "formKey",        type: "string",     label: "Form key", default: "contact",
        help: "Sent to POST /api/public/:slug/form/:formKey" },
      { name: "successMessage", type: "string",     label: "Success message", default: "Thanks! We’ll get back to you shortly." },
      {
        name: "fields",
        type: "objectArray",
        label: "Fields",
        fields: [
          { name: "name",     type: "select", label: "Field", options: ["name","email","phone","subject","message"], default: "name" },
          { name: "label",    type: "string", label: "Label (optional)" },
          { name: "required", type: "boolean", label: "Required" }
        ],
        default: [
          { name: "name",    label: "Full name", required: true },
          { name: "email",   label: "Email",     required: true },
          { name: "phone",   label: "Phone" },
          { name: "subject", label: "Subject" },
          { name: "message", label: "Message",   required: true }
        ]
      },
      { name: "titleAlign",  type: "select", label: "Title alignment", options: ["left","center","right"], default: "left" },
      { name: "maxWidth",    type: "select", label: "Max width", labelKey: "manager.visualBuilder.schemas.shared.maxWidth", options: ["xs","sm","md","lg","xl","full"], default: "lg" },
      { name: "gutterX",     type: "number", label: "Inner gutter (px)", labelKey: "manager.visualBuilder.schemas.shared.innerGutter", min: 0, max: 120, step: 2 },
      { name: "bleedLeft",   type: "boolean",label: "Bleed left" },
      { name: "bleedRight",  type: "boolean",label: "Bleed right" }
    ]
  },

  /* -------------------- PAGE STYLE (BACKGROUND) -------------------- */
  pageStyle: {
    title: "Page Style (Background)",
    note: "Tip: keep this as the first section. It sets a page-wide background color or image with an optional overlay.",
    noteKey: "manager.visualBuilder.schemas.pageStyle.note",
    fields: [
      // --- Background (page) ---
      { name: "backgroundColor",     type: "color",  label: "Background color", labelKey: "manager.visualBuilder.schemas.pageStyle.fields.backgroundColor" },
      { name: "backgroundImage",     type: "image",  label: "Background image", labelKey: "manager.visualBuilder.schemas.pageStyle.fields.backgroundImage" },
      { name: "backgroundRepeat",    type: "select", label: "Repeat", labelKey: "manager.visualBuilder.schemas.pageStyle.fields.backgroundRepeat",   options: ["no-repeat","repeat","repeat-x","repeat-y"], default: "no-repeat" },
      { name: "backgroundSize",      type: "select", label: "Size", labelKey: "manager.visualBuilder.schemas.pageStyle.fields.backgroundSize",     options: ["cover","contain","auto"], default: "cover" },
      { name: "backgroundPosition",  type: "select", label: "Position", labelKey: "manager.visualBuilder.schemas.pageStyle.fields.backgroundPosition", options: ["center","top","bottom","left","right","top center","bottom center"], default: "center" },
      { name: "backgroundAttachment",type: "select", label: "Attachment", labelKey: "manager.visualBuilder.schemas.pageStyle.fields.backgroundAttachment", options: ["scroll","fixed"], default: "fixed" },

      // --- Overlay ---
      { name: "overlayColor",   type: "color",  label: "Overlay color", labelKey: "manager.visualBuilder.schemas.pageStyle.fields.overlayColor" },
      { name: "overlayOpacity", type: "number", label: "Overlay opacity (0–1)", min: 0, max: 1, step: 0.05, default: 0 },

      // --- Text & fonts ---
      { name: "headingColor", type: "color",  label: "Heading color", labelKey: "manager.visualBuilder.schemas.pageStyle.fields.headingColor" },
      { name: "bodyColor",    type: "color",  label: "Body text color", labelKey: "manager.visualBuilder.schemas.pageStyle.fields.bodyColor" },
      { name: "linkColor",    type: "color",  label: "Link color (also social icons)", labelKey: "manager.visualBuilder.schemas.pageStyle.fields.linkColor" },
      { name: "headingFont",  type: "string", label: "Heading font family (optional)", labelKey: "manager.visualBuilder.schemas.pageStyle.fields.headingFont" },
      { name: "bodyFont",     type: "string", label: "Body font family (optional)", labelKey: "manager.visualBuilder.schemas.pageStyle.fields.bodyFont" },

      // --- Hero heading effect ---
      { name: "heroHeadingShadow", type: "string", label: "Hero heading text-shadow (CSS)", labelKey: "manager.visualBuilder.schemas.pageStyle.fields.heroHeadingShadow", placeholder: "0 2px 24px rgba(0,0,0,.25)", ui: "shadow", shadowType: "text" },

      // --- Card / “box” look (affects MUI Paper / Section cards etc.) ---
      { name: "cardBg",     type: "string", label: "Card background (CSS color or rgba())", labelKey: "manager.visualBuilder.schemas.pageStyle.fields.cardBg" },
      { name: "cardRadius", type: "number", label: "Card radius (px)", labelKey: "manager.visualBuilder.schemas.pageStyle.fields.cardRadius", min: 0, max: 32, step: 1, default: 12 },
      { name: "cardBlur",   type: "number", label: "Card blur (px)", labelKey: "manager.visualBuilder.schemas.pageStyle.fields.cardBlur", min: 0, max: 20, step: 1, default: 0 },
      { name: "cardShadow", type: "string", label: "Card shadow (CSS)", labelKey: "manager.visualBuilder.schemas.pageStyle.fields.cardShadow", placeholder: "0 8px 30px rgba(0,0,0,.08)", ui: "shadow", shadowType: "box" },

      // --- Buttons ---
      { name: "btnBg",     type: "string", label: "Button background (CSS)", labelKey: "manager.visualBuilder.schemas.pageStyle.fields.btnBg" },
      { name: "btnColor",  type: "string", label: "Button text color (CSS)", labelKey: "manager.visualBuilder.schemas.pageStyle.fields.btnColor" },
      { name: "btnRadius", type: "number", label: "Button radius (px)", labelKey: "manager.visualBuilder.schemas.pageStyle.fields.btnRadius", min: 0, max: 40, step: 1, default: 10 }
    ]
  },

  /* --------------------- BOOKING CTA BAR -------------------- */
  bookingCtaBar: {
    title: "Booking CTA Bar", titleKey: "manager.visualBuilder.schemas.bookingCtaBar.title",
    fields: [
      { name: "text",       type: "richinline", label: "Text", labelKey: "manager.visualBuilder.schemas.bookingCtaBar.fields.text" },
      { name: "buttonText", type: "richinline", label: "Button text", labelKey: "manager.visualBuilder.schemas.bookingCtaBar.fields.buttonText" },
      { name: "buttonLink", type: "string",     label: "Button link (URL)", labelKey: "manager.visualBuilder.schemas.bookingCtaBar.fields.buttonLink" },

      { name: "titleAlign", type: "select", label: "Content alignment", labelKey: "manager.visualBuilder.schemas.shared.contentAlignment", options: ["left","center","right"], default: "left" },
      { name: "maxWidth",   type: "select", label: "Max width", labelKey: "manager.visualBuilder.schemas.shared.maxWidth", options: ["xs","sm","md","lg","xl","full"] },
      { name: "gutterX",    type: "number", label: "Inner gutter (px)", labelKey: "manager.visualBuilder.schemas.shared.innerGutter", min: 0, max: 120, step: 2 }
    ]
  },

  /* -------------------------- FOOTER ------------------------ */
  footer: {
    title: "Footer",
    fields: [
      { name: "text",     type: "richtext",   label: "Copyright / Footer text", minRows: 3 },

      { name: "align",    type: "select",     label: "Content alignment", labelKey: "manager.visualBuilder.schemas.shared.contentAlignment", options: ["left","center","right"], default: "center" },
      { name: "maxWidth", type: "select",     label: "Max width", labelKey: "manager.visualBuilder.schemas.shared.maxWidth", options: ["xs","sm","md","lg","xl","full"] },
      { name: "gutterX",  type: "number",     label: "Inner gutter (px)", labelKey: "manager.visualBuilder.schemas.shared.innerGutter", min: 0, max: 120, step: 2 }
    ]
  }
};
