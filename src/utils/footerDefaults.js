export const DEFAULT_FOOTER_COLUMNS = [
  {
    title: "Company",
    links: [
      { label: "About", href: "?page=about" },
      { label: "Team", href: "?page=team" },
      { label: "Careers", href: "?page=careers" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Services",
    links: [
      { label: "Book online", href: "/services" },
      { label: "Reviews", href: "?page=reviews" },
      { label: "Pricing", href: "?page=pricing" },
      { label: "FAQ", href: "?page=faq" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Blog", href: "?page=blog" },
      { label: "Support", href: "?page=support" },
      { label: "Client portal", href: "/dashboard" },
    ],
  },
];

export const DEFAULT_FOOTER_LEGAL_LINKS = [
  { label: "Privacy Policy", href: "?page=privacy" },
  { label: "Terms of Service", href: "?page=terms" },
  { label: "Cookie Policy", href: "?page=cookies" },
];

export const DEFAULT_COPYRIGHT_TEXT = "© {{year}} {{company}}. All rights reserved.";

export function cloneFooterColumns(template = DEFAULT_FOOTER_COLUMNS) {
  return (template || []).map((col) => ({
    title: col.title,
    links: (col.links || []).map((link) => ({ ...link })),
  }));
}

export function cloneLegalLinks(template = DEFAULT_FOOTER_LEGAL_LINKS) {
  return (template || []).map((link) => ({ ...link }));
}

export function formatCopyrightText(text, { company, siteTitle, slug } = {}) {
  const template = (text && text.trim()) || DEFAULT_COPYRIGHT_TEXT;
  const replacements = {
    year: String(new Date().getFullYear()),
    company: company || slug || "Your company",
    sitetitle: siteTitle || company || slug || "Your company",
  };
  return template.replace(/\{\{(year|company|siteTitle)\}\}/gi, (_, key) => replacements[key.toLowerCase()] || "");
}

export function formatCompanyProfileAddress(profile = {}) {
  const direct = String(profile.address || "").trim();
  if (direct) return direct;

  const street = String(profile.address_street || "").trim();
  const city = String(profile.address_city || "").trim();
  const region = String(profile.address_state || profile.province_code || "").trim();
  const postalCode = String(profile.address_zip || "").trim();
  const regionPostal = [region, postalCode].filter(Boolean).join(" ");
  const locality = [city, regionPostal].filter(Boolean).join(", ");
  return [street, locality].filter(Boolean).join(", ");
}
