// src/components/website/BuilderPageUtils.js
export const emptyPage = () => ({
  id: null,
  title: "New Page",
  slug: "new-page",
  menu_title: "New Page",
  show_in_menu: true,
  sort_order: 0,
  published: true,
  is_homepage: false,
  seo_title: "",
  seo_description: "",
  seo_keywords: "",
  og_title: "",
  og_description: "",
  og_image_url: "",
  canonical_path: "",
  noindex: false,
  content: { sections: [], modules: [], meta: {} },
});

export function normalizePage(p = {}) {
  return {
    id: p.id,
    title: p.title || "",
    slug: p.slug || "",
    menu_title: p.menu_title || p.title || "",
    show_in_menu: Boolean(p.show_in_menu ?? true),
    sort_order:
      p.sort_order !== undefined
        ? Number(p.sort_order)
        : p.order !== undefined
        ? Number(p.order)
        : 0,
    published: Boolean(p.published ?? true),
    is_homepage: Boolean(p.is_homepage ?? false),
    seo_title: p.seo_title || "",
    seo_description: p.seo_description || "",
    seo_keywords: p.seo_keywords || "",
    og_title: p.og_title || "",
    og_description: p.og_description || "",
    og_image_url: p.og_image_url || "",
    canonical_path: p.canonical_path || "",
    noindex: Boolean(p.noindex ?? false),
    content:
      p.content && typeof p.content === "object"
        ? {
            ...p.content,
            sections: Array.isArray(p.content.sections) ? p.content.sections : [],
            modules: Array.isArray(p.content.modules) ? p.content.modules : [],
            meta: p.content.meta && typeof p.content.meta === "object" ? p.content.meta : {},
          }
        : { sections: [], modules: [], meta: {} },
  };
}

export function safeSections(page) {
  const arr =
    page?.content && Array.isArray(page.content.sections)
      ? page.content.sections
      : [];
  return arr;
}
