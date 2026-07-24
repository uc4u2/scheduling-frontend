import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import FinanceInvoicesPage from "../FinanceInvoicesPage";

const mockEnqueueSnackbar = jest.fn();
const mockSendFinanceInvoiceEmail = jest.fn();
const mockListFinanceInvoices = jest.fn();
const mockListManagerClient360Documents = jest.fn();
const mockListManagerClient360EmailTemplates = jest.fn();
const mockGetFinanceInvoiceDeliveryCapabilities = jest.fn();
let mockLocationSearch = "?invoiceId=43&action=send-email";

const deferred = () => {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (_key, options) => options?.defaultValue || _key,
  }),
}));

jest.mock("react-router-dom", () => ({
  useLocation: () => ({
    search: mockLocationSearch,
  }),
}), { virtual: true });

jest.mock("notistack", () => ({
  useSnackbar: () => ({ enqueueSnackbar: mockEnqueueSnackbar }),
}));

jest.mock("../financeApi", () => ({
  createFinanceInvoicePaymentLink: jest.fn(),
  createManagerClient360EmailTemplate: jest.fn(),
  deleteManagerClient360Document: jest.fn(),
  deleteManagerClient360EmailTemplate: jest.fn(),
  createSimilarFinanceInvoice: jest.fn(),
  downloadFinanceInvoicePdf: jest.fn(),
  getFinanceInvoiceDeliveryCapabilities: (...args) => mockGetFinanceInvoiceDeliveryCapabilities(...args),
  getFinanceInvoicePrintHtml: jest.fn(),
  listManagerClient360Documents: (...args) => mockListManagerClient360Documents(...args),
  listManagerClient360EmailTemplates: (...args) => mockListManagerClient360EmailTemplates(...args),
  listFinanceInvoices: (...args) => mockListFinanceInvoices(...args),
  sendFinanceInvoiceEmail: (...args) => mockSendFinanceInvoiceEmail(...args),
  setManagerClient360EmailTemplateDefault: jest.fn(),
  uploadManagerClient360DocumentFromDevice: jest.fn(),
  updateManagerClient360EmailTemplate: jest.fn(),
}));

jest.mock("../components/FinanceStatusChip", () => () => <div />);
jest.mock("../components/FinanceEmptyState", () => () => <div />);
jest.mock("../components/FinancePagination", () => () => <div />);
jest.mock("../components/FinanceAuditTimeline", () => () => <div />);
jest.mock("../components/FinanceEmailTemplatePicker", () => () => <div data-testid="template-picker" />);
jest.mock("../components/FinanceEmailTemplateManagerDialog", () => () => null);
jest.mock("../FinanceInvoiceDetailDialog", () => () => null);
jest.mock("../../../components/tutorials/TutorialHelpCard", () => () => null);
jest.mock("../../../components/ui/ThemedDateField", () => (props) => <input aria-label={props.label} value={props.value || ""} readOnly />);
jest.mock("../components/ClientDocumentAttachmentPanel", () => (props) => (
  <button type="button" onClick={() => props.onSelectedIdsChange(["doc-9"])}>
    select-doc
  </button>
));

describe("FinanceInvoicesPage", () => {
  beforeEach(() => {
    mockEnqueueSnackbar.mockReset();
    mockSendFinanceInvoiceEmail.mockReset();
    mockListFinanceInvoices.mockReset();
    mockListManagerClient360Documents.mockReset();
    mockListManagerClient360EmailTemplates.mockReset();
    mockGetFinanceInvoiceDeliveryCapabilities.mockReset();
    mockListFinanceInvoices.mockResolvedValue({
      items: [
        {
          id: 43,
          invoice_id: 43,
          invoice_number: "INV-000014",
          payment_status: "pending",
          status: "pending",
          remaining_balance: 2,
          total: 2,
          currency: "CAD",
          client_name: "UCsam",
          client_email: "vaje33.3@gmail.com",
          billing_recipient: { email: "vaje33.3@gmail.com" },
          payment_link_exists: true,
          hosted_invoice_url: "https://example.com/pay/43",
          client: { id: 49, email: "vaje33.3@gmail.com" },
        },
        {
          id: 44,
          invoice_id: 44,
          invoice_number: "INV-000015",
          payment_status: "pending",
          status: "pending",
          remaining_balance: 4,
          total: 4,
          currency: "CAD",
          client_name: "Second Client",
          client_email: "second@example.com",
          billing_recipient: { email: "second@example.com" },
          payment_link_exists: true,
          hosted_invoice_url: "https://example.com/pay/44",
          client: { id: 50, email: "second@example.com" },
        },
      ],
      pagination: null,
    });
    mockListManagerClient360Documents.mockResolvedValue({ documents: [] });
    mockListManagerClient360EmailTemplates.mockResolvedValue({ templates: [] });
    mockGetFinanceInvoiceDeliveryCapabilities.mockResolvedValue({
      review_cta: {
        eligible: true,
        help_text: "Adds a secondary Google review button to this invoice email. It does not send a separate review email.",
      },
    });
    mockSendFinanceInvoiceEmail.mockResolvedValue({
      invoice: { id: 43 },
      email_delivery: { delivery_status: "queued", queued: true, reused: false },
      delivery_options: { attach_invoice_pdf: true, include_payment_link: true },
    });
    mockLocationSearch = "?invoiceId=43&action=send-email";
  });

  test("defaults to PDF on, payment link on, and sends delivery options with queued wording", async () => {
    render(<FinanceInvoicesPage />);

    await screen.findByText("Send invoice");
    const attachPdf = await screen.findByLabelText("Attach invoice PDF");
    const includePayment = await screen.findByLabelText("Include online payment link");
    expect(attachPdf).toBeChecked();
    expect(includePayment).toBeChecked();

    userEvent.click(screen.getByRole("button", { name: "select-doc" }));
    userEvent.click(screen.getByRole("button", { name: "Send" }));

    await waitFor(() => expect(mockSendFinanceInvoiceEmail).toHaveBeenCalledTimes(1));
    expect(mockSendFinanceInvoiceEmail).toHaveBeenCalledWith(
      43,
      expect.objectContaining({
        attach_invoice_pdf: true,
        include_payment_link: true,
        client_document_ids: ["doc-9"],
      })
    );
    expect(mockEnqueueSnackbar).toHaveBeenCalledWith("Invoice email queued.", { variant: "success" });
  });

  test("disables payment link for paid invoice while keeping PDF enabled", async () => {
    mockListFinanceInvoices.mockResolvedValueOnce({
      items: [
        {
          id: 44,
          invoice_id: 44,
          invoice_number: "INV-000015",
          payment_status: "paid",
          status: "paid",
          remaining_balance: 0,
          total: 2,
          currency: "CAD",
          client_name: "Paid Client",
          client_email: "paid@example.com",
          billing_recipient: { email: "paid@example.com" },
          payment_link_exists: true,
          hosted_invoice_url: "https://example.com/pay/44",
          client: { id: 50, email: "paid@example.com" },
        },
      ],
      pagination: null,
    });
    mockLocationSearch = "?invoiceId=44&action=send-email";

    render(<FinanceInvoicesPage />);

    const attachPdf = await screen.findByLabelText("Attach invoice PDF");
    const includePayment = await screen.findByLabelText("Include online payment link");
    expect(attachPdf).toBeChecked();
    expect(includePayment).not.toBeChecked();
    expect(includePayment).toBeDisabled();
    expect(await screen.findByText(/already paid/i)).toBeInTheDocument();
  });

  test("review checkbox defaults off, loads capability, and sends include_review_cta without exposing raw URL", async () => {
    render(<FinanceInvoicesPage />);

    await screen.findByText("Send invoice");
    await waitFor(() => expect(mockGetFinanceInvoiceDeliveryCapabilities).toHaveBeenCalledWith(43));

    const reviewCheckbox = await screen.findByLabelText("Include Google review request");
    expect(reviewCheckbox).not.toBeChecked();
    expect(reviewCheckbox).toBeEnabled();

    await userEvent.click(reviewCheckbox);
    await userEvent.click(screen.getByRole("button", { name: "Send" }));

    await waitFor(() => expect(mockSendFinanceInvoiceEmail).toHaveBeenCalledTimes(1));
    expect(mockSendFinanceInvoiceEmail).toHaveBeenCalledWith(
      43,
      expect.objectContaining({
        include_review_cta: true,
      })
    );
    expect(mockSendFinanceInvoiceEmail.mock.calls[0][1].review_url).toBeUndefined();
  });

  test("review checkbox stays disabled with backend blocked reason", async () => {
    mockGetFinanceInvoiceDeliveryCapabilities.mockResolvedValueOnce({
      review_cta: {
        eligible: false,
        blocked_reason: "invoice_not_paid_or_completed",
        help_text: "Available after the invoice is paid or the linked work is completed.",
      },
    });

    render(<FinanceInvoicesPage />);

    await screen.findByText("Send invoice");
    const reviewCheckbox = await screen.findByLabelText("Include Google review request");
    expect(reviewCheckbox).toBeDisabled();
    expect(await screen.findByText(/Available after the invoice is paid or the linked work is completed/i)).toBeInTheDocument();
  });

  test("stale capability response cannot re-enable checkbox for a newly opened invoice", async () => {
    const first = deferred();
    const second = deferred();
    mockGetFinanceInvoiceDeliveryCapabilities
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);

    const { rerender } = render(<FinanceInvoicesPage />);

    await screen.findByText("Send invoice");
    await waitFor(() => expect(mockGetFinanceInvoiceDeliveryCapabilities).toHaveBeenCalledWith(43));

    mockLocationSearch = "?invoiceId=44&action=send-email";
    rerender(<FinanceInvoicesPage />);

    await waitFor(() => expect(mockGetFinanceInvoiceDeliveryCapabilities).toHaveBeenCalledWith(44));

    second.resolve({
      review_cta: {
        eligible: false,
        help_text: "Available after the invoice is paid or the linked work is completed.",
      },
    });
    await screen.findByText(/Available after the invoice is paid or the linked work is completed/i);
    const reviewCheckbox = await screen.findByLabelText("Include Google review request");
    expect(reviewCheckbox).toBeDisabled();

    first.resolve({
      review_cta: {
        eligible: true,
        help_text: "Adds a secondary Google review button to this invoice email. It does not send a separate review email.",
      },
    });

    await waitFor(() => expect(reviewCheckbox).toBeDisabled());
    expect(screen.queryByText(/secondary Google review button/i)).not.toBeInTheDocument();
  });
});
