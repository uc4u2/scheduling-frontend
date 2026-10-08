import {
  isFinanceEstimateEmailTemplate,
  isFinanceInvoiceEmailTemplate,
} from "./financeEmailTemplatePolicy";

describe("finance email template policy", () => {
  test("does not allow a document-reminder default to populate an invoice", () => {
    expect(
      isFinanceInvoiceEmailTemplate({
        is_active: true,
        is_default: true,
        category: "document_reminder",
      })
    ).toBe(false);
    expect(
      isFinanceInvoiceEmailTemplate({
        is_active: true,
        is_default: true,
        category: "payment_reminder",
      })
    ).toBe(true);
  });

  test("keeps estimate and invoice custom defaults purpose-specific", () => {
    const estimate = { is_active: true, category: "estimate_follow_up" };
    const invoice = { is_active: true, category: "invoice_follow_up" };
    expect(isFinanceEstimateEmailTemplate(estimate)).toBe(true);
    expect(isFinanceEstimateEmailTemplate(invoice)).toBe(false);
    expect(isFinanceInvoiceEmailTemplate(invoice)).toBe(true);
    expect(isFinanceInvoiceEmailTemplate(estimate)).toBe(false);
  });
});
