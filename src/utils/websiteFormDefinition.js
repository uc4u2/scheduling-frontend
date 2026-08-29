export const WEBSITE_FORM_FIELD_TYPES = ["text", "email", "tel", "select", "textarea"];

const defaultFields = () => [
  { name: "name", label: "Full name", type: "text", required: true, options: {}, sort_order: 0 },
  { name: "email", label: "Email", type: "email", required: true, options: {}, sort_order: 1 },
  { name: "phone", label: "Phone", type: "tel", required: false, options: {}, sort_order: 2 },
  { name: "message", label: "Message", type: "textarea", required: true, options: {}, sort_order: 3 },
];

export const normalizeWebsiteFormFieldName = (value, fallback) => {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return normalized || fallback;
};

export function normalizeWebsiteFormDraft(form, formKey = "contact") {
  const fields = Array.isArray(form?.fields) && form.fields.length ? form.fields : defaultFields();
  return {
    id: form?.id || null,
    name: form?.name || "Contact",
    key: form?.key || formKey || "contact",
    success_msg: form?.success_msg || "Thanks! We'll get back to you shortly.",
    fields: fields.map((field, index) => ({
      id: field.id || `draft-field-${index}`,
      name: normalizeWebsiteFormFieldName(field.name, `field_${index + 1}`),
      label: field.label || `Field ${index + 1}`,
      type: WEBSITE_FORM_FIELD_TYPES.includes(field.type) ? field.type : "text",
      required: field.required !== false,
      options: field.options && typeof field.options === "object" ? { ...field.options } : {},
      sort_order: index,
    })),
  };
}
