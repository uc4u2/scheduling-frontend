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
          { name: "label", type: "string", label: "Label (display name)" },
          { name: "caption", type: "string", label: "Caption (optional)" },
          { name: "meta", type: "string", label: "Meta (price/stat)" },
          { name: "description", type: "text", label: "Description", minRows: 2 },
          { name: "features", type: "arrayOfStrings", label: "Feature bullets" },
          { name: "ctaText", type: "string", label: "CTA text" },
          { name: "ctaLink", type: "string", label: "CTA link" },
          { name: "highlight", type: "boolean", label: "Highlight card" },
        ]
      },
      {
        name: "tabs",
        type: "objectArray",
        label: "Tabs",
        fields: [
          { name: "label", type: "string", label: "Tab label" },
          { name: "href", type: "string", label: "Tab link" },
        ],
      },
      { name: "tabsAlign", type: "select", label: "Tabs alignment", options: ["left","center","right"], default: "center" },
      { name: "caption", type: "text", label: "Caption" },
      { name: "supportingText", type: "text", label: "Supporting text", minRows: 2 },
      { name: "supportingTextAlign", type: "select", label: "Supporting text alignment", options: ["left","center","right"], default: "left" },
      { name: "showLabels", type: "boolean", label: "Show names under logos", default: false },
      { name: "variant", type: "select", label: "Display style", options: ["grid", "badges", "cards"], default: "grid" },
      { name: "maxWidth", type: "string", label: "Max width", placeholder: "sm | md | lg | 1200px" },
    ],
  },

  logoCarousel: {
    fields: [
      { name: "title", type: "string", label: "Title" },
      { name: "caption", type: "string", label: "Caption" },
      {
        name: "logos",
        type: "objectArray",
        label: "Entries",
        fields: [
          { name: "label", type: "string", label: "Label" },
          { name: "src", type: "image", label: "Image (optional)" },
        ],
      },
      { name: "intervalMs", type: "number", label: "Interval (ms)", default: 4000 },
      { name: "showDots", type: "boolean", label: "Show dots", default: true },
      { name: "maxWidth", type: "string", label: "Max width", placeholder: "sm | md | lg | 1200px" },
    ],
  },

  featurePillars: {
    fields: [
      { name: "title", type: "string", label: "Title" },
      { name: "badge", type: "string", label: "Badge" },
      { name: "caption", type: "text", label: "Caption", minRows: 3 },
      {
        name: "pillars",
        type: "objectArray",
        label: "Pillars",
        fields: [
          { name: "icon", type: "string", label: "Badge letter" },
          { name: "label", type: "string", label: "Label" },
          { name: "heading", type: "string", label: "Heading" },
          { name: "summary", type: "text", label: "Summary", minRows: 3 },
          { name: "bullets", type: "arrayOfStrings", label: "Bullets" },
          {
            name: "metrics",
            type: "objectArray",
            label: "Metrics",
            fields: [
              { name: "label", type: "string", label: "Label" },
              { name: "value", type: "string", label: "Value" },
            ],
          },
        ],
      },
      { name: "layout", type: "select", label: "Layout", options: ["dense", "carousel"], default: "dense" },
      { name: "intervalMs", type: "number", label: "Carousel interval (ms)", default: 4000 },
    ],
  },

featureStories: {
  fields: [
    { name: "title", type: "string", label: "Title" },
    { name: "caption", type: "text", label: "Caption", minRows: 3 },
    { name: "badge", type: "string", label: "Badge" },
    { name: "legend", type: "arrayOfStrings", label: "Legend items" },
    { name: "legendAlign", type: "select", label: "Legend alignment", options: ["left","center","right"], default: "center" },
    {
      name: "stories",
      type: "objectArray",
      label: "Stories",
      fields: [
        { name: "icon", type: "string", label: "Icon / graphic" },
        { name: "title", type: "string", label: "Story title" },
        { name: "subtitle", type: "string", label: "Subtitle" },
        { name: "statLabel", type: "string", label: "Stat label" },
        { name: "statValue", type: "string", label: "Stat value" },
        { name: "description", type: "text", label: "Description", minRows: 3 },
        { name: "feature", type: "string", label: "Feature tag" },
        { name: "bullets", type: "arrayOfStrings", label: "Bullets" },
        { name: "ctaText", type: "string", label: "CTA text" },
        { name: "ctaLink", type: "string", label: "CTA link" },
        { name: "background", type: "string", label: "Background (CSS)" },
      ],
    },
    { name: "metrics", type: "arrayOfStrings", label: "Footer metrics" },
    {
      name: "card",
      type: "object",
      label: "Card styling",
      fields: [
        { name: "padding", type: "number", label: "Padding (px)" },
        { name: "radius", type: "number", label: "Corner radius (px)" },
        { name: "gap", type: "number", label: "Grid gap (px)" },
        { name: "maxWidth", type: "number", label: "Max width (px)" },
        { name: "sectionBackground", type: "string", label: "Section background" },
        { name: "surface", type: "string", label: "Card surface" },
        { name: "borderColor", type: "string", label: "Border color" },
        { name: "shadow", type: "string", label: "Shadow" },
        { name: "headingColor", type: "string", label: "Heading color" },
        { name: "bodyColor", type: "string", label: "Body color" },
        { name: "badgeColor", type: "string", label: "Badge color" },
        { name: "statColor", type: "string", label: "Stat color" },
        { name: "chipBg", type: "string", label: "Chip background" },
        { name: "chipColor", type: "string", label: "Chip text" },
        { name: "chipBorder", type: "string", label: "Chip border" },
      ],
    },
    { name: "titleAlign", type: "select", label: "Title alignment", options: ["left","center","right"], default: "left" },
    { name: "maxWidth", type: "string", label: "Max width", placeholder: "sm | md | lg | full" },
  ],
},
  testimonialTiles: {
    fields: [
      { name: "title", type: "string", label: "Title" },
      { name: "caption", type: "text", label: "Caption", minRows: 3 },
      {
        name: "testimonials",
        type: "objectArray",
        label: "Testimonials",
        fields: [
          { name: "brand", type: "string", label: "Brand" },
          { name: "badge", type: "string", label: "Badge" },
          { name: "quote", type: "text", label: "Quote", minRows: 3 },
          { name: "author", type: "string", label: "Author" },
          { name: "role", type: "string", label: "Role" },
          { name: "avatar", type: "image", label: "Avatar" },
        ],
      },
      { name: "style", type: "select", label: "Layout", options: ["grid", "slider"], default: "grid" },
      { name: "intervalMs", type: "number", label: "Slider interval (ms)", default: 4000 },
      { name: "showDots", type: "boolean", label: "Show dots", default: true },
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
