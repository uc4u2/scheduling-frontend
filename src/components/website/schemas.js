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
      { name: "backgroundVideo",    type: "string", label: "Background video URL (mp4/webm)" },
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
      { name: "overlayGradient",  type: "string", label: "Overlay gradient (CSS)", placeholder: "linear-gradient(180deg, rgba(0,0,0,.15), rgba(0,0,0,.6))" }
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
      { name: "title",     type: "string",     label: "Section title" },
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
      { name: "title",       type: "string",     label: "Section title" },
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
          { name: "alt", type: "text",   label: "Alt text" }
        ]
      },
      { name: "showLabels", type: "boolean",    label: "Show labels under logos" },
      { name: "monochrome", type: "boolean",    label: "Monochrome (grayscale) logos" },

      { name: "titleAlign", type: "select",     label: "Title alignment", options: ["left","center","right"], default: "left" },
      { name: "maxWidth",   type: "select",     label: "Max width", labelKey: "manager.visualBuilder.schemas.shared.maxWidth", options: ["xs","sm","md","lg","xl","full"] },
      { name: "gutterX",    type: "number",     label: "Inner gutter (px)", labelKey: "manager.visualBuilder.schemas.shared.innerGutter", min: 0, max: 120, step: 2 },
      { name: "bleedLeft",  type: "boolean",    label: "Bleed left" },
      { name: "bleedRight", type: "boolean",    label: "Bleed right" }
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
      { name: "linkColor",    type: "color",  label: "Link color", labelKey: "manager.visualBuilder.schemas.pageStyle.fields.linkColor" },
      { name: "headingFont",  type: "string", label: "Heading font family (optional)", labelKey: "manager.visualBuilder.schemas.pageStyle.fields.headingFont" },
      { name: "bodyFont",     type: "string", label: "Body font family (optional)", labelKey: "manager.visualBuilder.schemas.pageStyle.fields.bodyFont" },

      // --- Hero heading effect ---
      { name: "heroHeadingShadow", type: "string", label: "Hero heading text-shadow (CSS)", labelKey: "manager.visualBuilder.schemas.pageStyle.fields.heroHeadingShadow", placeholder: "0 2px 24px rgba(0,0,0,.25)" },

      // --- Card / “box” look (affects MUI Paper / Section cards etc.) ---
      { name: "cardBg",     type: "string", label: "Card background (CSS color or rgba())", labelKey: "manager.visualBuilder.schemas.pageStyle.fields.cardBg" },
      { name: "cardRadius", type: "number", label: "Card radius (px)", labelKey: "manager.visualBuilder.schemas.pageStyle.fields.cardRadius", min: 0, max: 32, step: 1, default: 12 },
      { name: "cardBlur",   type: "number", label: "Card blur (px)", labelKey: "manager.visualBuilder.schemas.pageStyle.fields.cardBlur", min: 0, max: 20, step: 1, default: 0 },
      { name: "cardShadow", type: "string", label: "Card shadow (CSS)", labelKey: "manager.visualBuilder.schemas.pageStyle.fields.cardShadow", placeholder: "0 8px 30px rgba(0,0,0,.08)" },

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
