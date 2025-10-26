// src/components/website/schemas/index.js
export const SCHEMA_REGISTRY = {
  hero: {
    fields: [
      { name: "heading", type: "string", label: "Heading" },
      { name: "subheading", type: "text", label: "Subheading", minRows: 2 },
      { name: "ctaText", type: "string", label: "Button text" },
      { name: "ctaLink", type: "string", label: "Button link" },
      { name: "backgroundUrl", type: "image", label: "Background image" },
      { name: "overlay", type: "number", label: "Overlay (0–0.8)", min: 0, max: 0.8, default: 0.35 },
    ],
    note: "Tip: keep overlay between 0.2 and 0.5 for readability.",
  },

  // Added a small enhancement so this block is nicely mapped in the simple inspector
  logoCloud: {
    fields: [
      { name: "title", type: "string", label: "Title" },
      {
        name: "logos", type: "objectArray", label: "Logos", fields: [
          { name: "src", type: "image", label: "Image" },
          { name: "alt", type: "string", label: "Alt text" },
        ]
      },
      { name: "caption", type: "text", label: "Caption" },
      { name: "showLabels", type: "boolean", label: "Show names under logos", default: false },
   { name: "maxWidth", type: "string", label: "Max width", placeholder: "sm | md | lg | 1200px" },
      // NEW: optional width control to match suggested schema
      { name: "maxWidth", type: "string", label: "Max width", placeholder: "sm | md | lg | 1200px" },
    ],
  },

  heroSplit: {
    fields: [
      { name: "heading", type: "string", label: "Heading" },
      { name: "subheading", type: "text", label: "Subheading" },
      { name: "ctaText", type: "string", label: "Button text" },
      { name: "ctaLink", type: "string", label: "Button link" },
      { name: "image", type: "image", label: "Right image" },
    ],
  },

  stats: {
    fields: [
      { name: "title", type: "string", label: "Title" },
      {
        name: "items", type: "objectArray", label: "Stats", fields: [
          { name: "value", type: "string", label: "Value (e.g., 99.95%)" },
          { name: "label", type: "string", label: "Label" },
        ]
      },
    ],
  },

  serviceGrid: {
    fields: [
      { name: "title", type: "string", label: "Title" },
      {
        name: "items", type: "objectArray", label: "Services", fields: [
          { name: "name", type: "string", label: "Name" },
          { name: "description", type: "text", label: "Description" },
          { name: "price", type: "string", label: "Price (text)" },
          { name: "meta", type: "string", label: "Meta (tag)" },
          { name: "image", type: "image", label: "Image (optional)" },
        ]
      },
      { name: "ctaText", type: "string", label: "CTA text" },
      { name: "ctaLink", type: "string", label: "CTA link" },
    ],
    note: "Hint: keep names short (≤ 28 chars) for tidy cards.",
  },

  video: {
    fields: [
      { name: "title", type: "string", label: "Title" },
      { name: "url", type: "string", label: "YouTube embed URL" },
    ],
  },

  galleryCarousel: {
    fields: [
      { name: "title", type: "string", label: "Title" },
      { name: "autoplay", type: "boolean", label: "Autoplay" },
      { name: "intervalMs", type: "number", label: "Interval (ms)", min: 1500, max: 10000, default: 4000 },
      { name: "images", type: "arrayOfStrings", label: "Image URLs" },
    ],
  },

  cta: {
    fields: [
      { name: "title", type: "string", label: "Title" },
      { name: "subtitle", type: "text", label: "Subtitle" },
      { name: "buttonText", type: "string", label: "Button text" },
      { name: "buttonLink", type: "string", label: "Button link" },
    ],
  },

  bookingCtaBar: {
    fields: [
      { name: "text", type: "string", label: "Text" },
      { name: "buttonText", type: "string", label: "Button text" },
      { name: "buttonLink", type: "string", label: "Button link" },
    ],
  },

  pricingTable: {
    fields: [
      { name: "title", type: "string", label: "Title" },
      {
        name: "plans", type: "objectArray", label: "Plans", fields: [
          { name: "name", type: "string", label: "Name" },
          { name: "price", type: "string", label: "Price" },
          { name: "features", type: "arrayOfStrings", label: "Features" },
          { name: "ctaText", type: "string", label: "CTA text" },
          { name: "ctaLink", type: "string", label: "CTA link" },
          { name: "featured", type: "boolean", label: "Featured" },
          { name: "ribbon", type: "string", label: "Ribbon" },
        ]
      },
    ],
  },

  faq: {
    fields: [
      { name: "title", type: "string", label: "Title" },
      {
        name: "items", type: "objectArray", label: "Questions", fields: [
          { name: "question", type: "string", label: "Question" },
          { name: "answer", type: "text", label: "Answer" },
        ]
      },
    ],
  },

  richText: {
    fields: [
      { name: "title", type: "string", label: "Title" },
      { name: "body", type: "text", label: "Body (HTML allowed; sanitized on render)", minRows: 6 },
    ],
  },

  contact: {
    fields: [
      { name: "email", type: "string", label: "Email" },
      { name: "phone", type: "string", label: "Phone" },
      { name: "address", type: "string", label: "Address" },
      { name: "mapEmbedUrl", type: "string", label: "Map Embed URL" },
      { name: "title", type: "string", label: "Title (optional)" },
    ],
  },

  footer: {
    fields: [
      { name: "text", type: "string", label: "Text" },
      { name: "links", type: "objectArray", label: "Links", fields: [
        { name: "label", type: "string", label: "Label" },
        { name: "href", type: "string", label: "Href" },
      ]},
      { name: "social", type: "objectArray", label: "Social", fields: [
        { name: "label", type: "string", label: "Label" },
        { name: "href", type: "string", label: "Href" },
      ]},
    ],
  },

  // Example data-bound block (will render via SmartServiceGrid below)
  smartServiceGrid: {
    fields: [
      { name: "title", type: "string", label: "Title" },
      { name: "category", type: "string", label: "Category filter (optional)" },
      { name: "limit", type: "number", label: "Limit", min: 1, max: 24, default: 6 },
      { name: "ctaText", type: "string", label: "CTA text" },
      { name: "ctaLink", type: "string", label: "CTA link" },
    ],
    note: "This block auto-loads services from your company via API.",
  },
};
