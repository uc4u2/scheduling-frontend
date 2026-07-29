import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ThemeProvider, createTheme } from "@mui/material/styles";

import EstimateEditorDialog from "../EstimateEditorDialog";

const mockPreviewFinanceTransaction = jest.fn();
const mockEnqueueSnackbar = jest.fn();

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (_key, options) => options?.defaultValue || _key,
  }),
}));

jest.mock("notistack", () => ({
  useSnackbar: () => ({ enqueueSnackbar: mockEnqueueSnackbar }),
}));

jest.mock("../financeApi", () => ({
  createEstimate: jest.fn(),
  createManagerClient: jest.fn(),
  previewFinanceTransaction: (...args) => mockPreviewFinanceTransaction(...args),
  updateEstimate: jest.fn(),
}));

jest.mock("../ClientLookupField", () => (props) => (
  <input
    aria-label={props.label}
    value={props.value || ""}
    onChange={(event) => props.onChange(event.target.value)}
  />
));
jest.mock("../ClientQuickCreateDialog", () => () => null);
jest.mock("../components/FinanceAuditTimeline", () => () => null);
jest.mock("../../../components/ui/ThemedDateField", () => (props) => (
  <input aria-label={props.label} value={props.value || ""} onChange={props.onChange} />
));
jest.mock("../../../utils/currency", () => ({
  getActiveCurrency: () => "CAD",
  getCurrencyOptions: () => [{ code: "CAD", label: "CAD - Canadian Dollar" }],
  normalizeCurrency: (value) => value || "CAD",
  subscribeToActiveCurrency: () => () => {},
}));

function renderDialog() {
  return render(
    <ThemeProvider theme={createTheme()}>
      <EstimateEditorDialog
        open
        onClose={() => {}}
        onSaved={() => {}}
        clients={[{ id: 7, name: "Client 7" }]}
        templates={[]}
        taxContext={{
          display_currency: "CAD",
          tax_country_code: "CA",
          tax_region_code: "QC",
          prices_include_tax: false,
          default_tax_rate: 14.975,
        }}
        initialDraft={{
          client_id: "7",
          title: "Preview estimate",
        }}
      />
    </ThemeProvider>
  );
}

describe("EstimateEditorDialog", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPreviewFinanceTransaction.mockResolvedValue({
      currency: "CAD",
      customer_view: {
        subtotal: "100.00",
        discount_total: "0.00",
        tax_total: "14.98",
        total: "114.98",
        amount_paid: "0.00",
        balance_due: "114.98",
      },
      tax: {
        label: "GST + QST",
        default_rate: "14.975",
        prices_include_tax: false,
        components: [
          { code: "GST", rate: "5" },
          { code: "QST", rate: "9.975" },
        ],
        jurisdiction: { country: "CA", region: "QC" },
        source: "sales_tax_jurisdiction_catalog",
      },
      payment_link_preview: {
        available: false,
        stripe_currency: "cad",
        amount_to_collect: "114.98",
        stripe_automatic_tax_applied: false,
        message: "Schedulaa has already calculated tax. Stripe would collect the stored Finance total.",
      },
      line_items: [{ description: "Line item", quantity: "1", unit_price: "100.00", taxable: true, gross: "100.00" }],
      source: { type: "draft", status: "draft" },
    });
  });

  test("previews unsaved estimate totals and marks the preview stale after edits", async () => {
    renderDialog();

    fireEvent.click(screen.getByRole("button", { name: "Preview taxes and total" }));
    await waitFor(() => expect(mockPreviewFinanceTransaction).toHaveBeenCalledTimes(1));
    expect(await screen.findByText("Preview customer total")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Estimate title"), { target: { value: "Updated title" } });

    expect(screen.getByText(/The Estimate changed after this preview/i)).toBeInTheDocument();
  });
});
