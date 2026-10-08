export const FINANCE_INVOICE_EMAIL_TEMPLATE_CATEGORIES = new Set([
  "finance_invoice",
  "payment_reminder",
  "invoice_follow_up",
]);

export const isFinanceInvoiceEmailTemplate = (template) =>
  Boolean(
    template?.is_active &&
      FINANCE_INVOICE_EMAIL_TEMPLATE_CATEGORIES.has(
        String(template?.category || "").trim().toLowerCase()
      )
  );

export const isFinanceEstimateEmailTemplate = (template) =>
  Boolean(
    template?.is_active &&
      ["finance_estimate", "estimate_follow_up"].includes(
        String(template?.category || "").trim().toLowerCase()
      )
  );

export const createManualEmailDeliveryVersion = () =>
  globalThis.crypto?.randomUUID?.() ||
  `manual-email-${Date.now()}-${Math.random().toString(16).slice(2)}`;
