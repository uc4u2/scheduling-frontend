import {
  getDefaultInvoiceDeliveryOptions,
  isInvoicePaymentLinkActionable,
} from "../invoiceDeliveryOptions";

const t = (_key, fallback) => fallback;

describe("invoiceDeliveryOptions", () => {
  test("defaults to PDF on and payment link on for actionable unpaid invoice", () => {
    const options = getDefaultInvoiceDeliveryOptions({
      status: "pending",
      remainingBalance: 120,
      recipientEmail: "client@example.com",
      invoiceId: 43,
      t,
    });
    expect(options.attachInvoicePdf).toBe(true);
    expect(options.includePaymentLink).toBe(true);
    expect(options.paymentLinkDisabledReason).toBe("");
    expect(isInvoicePaymentLinkActionable({ status: "pending", remainingBalance: 120 })).toBe(true);
  });

  test("disables payment link for paid, void, refunded, and zero-balance invoices", () => {
    expect(
      getDefaultInvoiceDeliveryOptions({
        status: "paid",
        remainingBalance: 0,
        recipientEmail: "client@example.com",
        invoiceId: 43,
        t,
      }).includePaymentLink
    ).toBe(false);
    expect(
      getDefaultInvoiceDeliveryOptions({
        status: "void",
        remainingBalance: 100,
        recipientEmail: "client@example.com",
        invoiceId: 43,
        t,
      }).paymentLinkDisabledReason
    ).toMatch(/void/i);
    expect(
      getDefaultInvoiceDeliveryOptions({
        status: "refunded",
        remainingBalance: 100,
        recipientEmail: "client@example.com",
        invoiceId: 43,
        t,
      }).paymentLinkDisabledReason
    ).toMatch(/refunded/i);
    expect(
      getDefaultInvoiceDeliveryOptions({
        status: "pending",
        remainingBalance: 0,
        recipientEmail: "client@example.com",
        invoiceId: 43,
        t,
      }).paymentLinkDisabledReason
    ).toMatch(/already paid/i);
  });
});
