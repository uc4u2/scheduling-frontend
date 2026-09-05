export const CHECKPOINT_INCLUDED_ITEMS = [
  "Website design settings",
  "Pages and SEO",
  "Forms and fields",
  "Menus and redirects",
  "References to tenant media",
];

export const CHECKPOINT_EXCLUDED_ITEMS = [
  "Media binary copies",
  "Form submissions",
  "Services and pricing",
  "Bookings, invoices and payments",
  "Products, Reviews and Jobs",
  "Private credentials or integrations",
];

export function validateApprovedCheckpointName(value) {
  const name = String(value || "").trim();
  return name.length >= 3 ? "" : "Enter a meaningful name for the approved design.";
}

export function formatCheckpointTimestamp(value, locale) {
  const raw = String(value || "").trim();
  if (!raw) return "—";
  const hasTimezone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(raw);
  const date = new Date(hasTimezone ? raw : `${raw}Z`);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString(locale);
}

export function checkpointKindLabel(kind) {
  const normalized = String(kind || "manual").trim().toLowerCase();
  if (normalized === "approved") return "Approved";
  if (normalized === "automatic") return "Automatic";
  if (normalized === "rollback") return "Rollback";
  return "Manual";
}

export function checkpointPublishBlocked(checkpoint) {
  return checkpoint?.publishable === false || Number(checkpoint?.missing_tenant_media_count || 0) > 0;
}

export function checkpointCounts(checkpoint) {
  return [
    ["Pages", checkpoint?.page_count],
    ["Forms", checkpoint?.form_count],
    ["Menus", checkpoint?.menu_count],
    ["Redirects", checkpoint?.redirect_count],
    ["Media references", checkpoint?.referenced_media_count],
  ].map(([label, value]) => ({ label, value: Number(value || 0) }));
}
