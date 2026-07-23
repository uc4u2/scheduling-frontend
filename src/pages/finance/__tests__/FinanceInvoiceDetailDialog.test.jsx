import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import FinanceInvoiceDetailDialog from "../FinanceInvoiceDetailDialog";

const mockEnqueueSnackbar = jest.fn();
const mockGetFinanceInvoice = jest.fn();
const mockUpdateFinanceInvoice = jest.fn();
const mockSendFinanceInvoiceEmail = jest.fn();
const mockListManagerClient360Documents = jest.fn();
const mockListManagerClient360EmailTemplates = jest.fn();
const mockGetFinanceDocumentSettings = jest.fn();
const mockListBillingRecipients = jest.fn();

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (_key, options) => options?.defaultValue || _key,
  }),
}));

jest.mock("notistack", () => ({
  useSnackbar: () => ({ enqueueSnackbar: mockEnqueueSnackbar }),
}));

jest.mock("../financeApi", () => ({
  createBillingRecipient: jest.fn(),
  createSimilarFinanceInvoice: jest.fn(),
  createFinanceInvoicePaymentLink: jest.fn(),
  createManagerClient360EmailTemplate: jest.fn(),
  deleteManagerClient360Document: jest.fn(),
  deleteManagerClient360EmailTemplate: jest.fn(),
  downloadFinanceInvoicePdf: jest.fn(),
  getFinanceDocumentSettings: (...args) => mockGetFinanceDocumentSettings(...args),
  getFinanceInvoice: (...args) => mockGetFinanceInvoice(...args),
  getFinanceInvoicePrintHtml: jest.fn(),
  listManagerClient360EmailTemplates: (...args) => mockListManagerClient360EmailTemplates(...args),
  listManagerClient360Documents: (...args) => mockListManagerClient360Documents(...args),
  listBillingRecipients: (...args) => mockListBillingRecipients(...args),
  sendFinanceInvoiceEmail: (...args) => mockSendFinanceInvoiceEmail(...args),
  setManagerClient360EmailTemplateDefault: jest.fn(),
  setFinanceClientDefaultBillingRecipient: jest.fn(),
  updateFinanceDocumentSettings: jest.fn(),
  updateFinanceInvoice: (...args) => mockUpdateFinanceInvoice(...args),
  updateManagerClient360EmailTemplate: jest.fn(),
  uploadManagerClient360DocumentFromDevice: jest.fn(),
}));

jest.mock("../components/FinanceStatusChip", () => () => <div />);
jest.mock("../components/FinanceAuditTimeline", () => () => <div />);
jest.mock("../components/FinanceEmailTemplatePicker", () => () => <div />);
jest.mock("../components/FinanceEmailTemplateManagerDialog", () => () => null);
jest.mock("../FinanceInvoiceOfflinePaymentDialog", () => () => null);
jest.mock("../FinanceInvoiceRefundDialog", () => () => null);
jest.mock("../components/ClientDocumentAttachmentPanel", () => () => <div />);

const buildInvoice = () => ({
  id: 43,
  invoice_number: "INV-000014",
  status: "pending",
  payment_status: "pending",
  currency: "CAD",
  issue_date: "2026-07-16",
  due_date: "2026-07-18",
  total: 2,
  billing_recipient: { email: "vaje33.3@gmail.com" },
  billing_address_json: { email: "vaje33.3@gmail.com" },
  client: { id: 49, email: "vaje33.3@gmail.com", display_name: "UCsam" },
  custom_fields_json: {},
  company_name: "schedulaa",
  finance_document_settings: {},
  payment_summary: {
    remaining_balance: 2,
    online_payment_present: false,
    total_recorded_paid_amount: 0,
    online_paid_amount: 0,
    offline_paid_amount: 0,
    payment_origin: "unpaid",
    offline_payments: [],
  },
  refund_summary: {
    refunds: [],
    remaining_refundable_amount: 0,
  },
  payment_link_ready: true,
  hosted_invoice_url: "https://example.com/pay/43",
});

describe("FinanceInvoiceDetailDialog", () => {
  beforeEach(() => {
    mockEnqueueSnackbar.mockReset();
    mockGetFinanceInvoice.mockReset();
    mockUpdateFinanceInvoice.mockReset();
    mockSendFinanceInvoiceEmail.mockReset();
    mockListManagerClient360Documents.mockReset();
    mockListManagerClient360EmailTemplates.mockReset();
    mockGetFinanceDocumentSettings.mockReset();
    mockListBillingRecipients.mockReset();

    mockGetFinanceInvoice.mockResolvedValue({ invoice: buildInvoice() });
    mockUpdateFinanceInvoice.mockResolvedValue({ invoice: buildInvoice() });
    mockSendFinanceInvoiceEmail.mockResolvedValue({
      invoice: buildInvoice(),
      email_delivery: { delivery_status: "queued", queued: true, reused: false },
    });
    mockListManagerClient360Documents.mockResolvedValue({ documents: [] });
    mockListManagerClient360EmailTemplates.mockResolvedValue({ templates: [] });
    mockGetFinanceDocumentSettings.mockResolvedValue({});
    mockListBillingRecipients.mockResolvedValue({ items: [] });
  });

  test("Save & Send saves first, opens the existing dialog, and does not auto-send", async () => {
    render(<FinanceInvoiceDetailDialog open invoiceId={43} onClose={() => {}} onSaved={() => {}} />);

    await screen.findByText("Finance Invoice Detail");
    const saveAndSendButton = await screen.findByRole("button", { name: "Save & Send" });
    await waitFor(() => expect(saveAndSendButton).toBeEnabled());
    fireEvent.click(saveAndSendButton);

    await waitFor(() => expect(mockUpdateFinanceInvoice).toHaveBeenCalledTimes(1));
    expect(mockSendFinanceInvoiceEmail).not.toHaveBeenCalled();

    const attachPdf = await screen.findByLabelText("Attach invoice PDF");
    const includePayment = await screen.findByLabelText("Include online payment link");
    expect(attachPdf).toBeChecked();
    expect(includePayment).toBeChecked();
  });

  test("save failure does not open the send dialog", async () => {
    mockUpdateFinanceInvoice.mockRejectedValueOnce(new Error("Unable to save invoice."));

    render(<FinanceInvoiceDetailDialog open invoiceId={43} onClose={() => {}} onSaved={() => {}} />);

    await screen.findByText("Finance Invoice Detail");
    const saveAndSendButton = await screen.findByRole("button", { name: "Save & Send" });
    await waitFor(() => expect(saveAndSendButton).toBeEnabled());
    fireEvent.click(saveAndSendButton);

    await waitFor(() => expect(mockUpdateFinanceInvoice).toHaveBeenCalledTimes(1));
    expect(screen.queryByLabelText("Attach invoice PDF")).not.toBeInTheDocument();
    expect(mockSendFinanceInvoiceEmail).not.toHaveBeenCalled();
  });
});
