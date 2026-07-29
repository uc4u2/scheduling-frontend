import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ThemeProvider, createTheme } from "@mui/material/styles";

import FinanceSalesTaxProfileCard from "./FinanceSalesTaxProfileCard";

const mockGetFinanceSalesTaxProfile = jest.fn();
const mockUpdateFinanceSalesTaxProfile = jest.fn();
const mockPreviewFinanceTransaction = jest.fn();
const mockEnqueueSnackbar = jest.fn();

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key, options = {}) => options.defaultValue || key,
    i18n: { language: "en" },
  }),
}));

jest.mock("notistack", () => ({
  useSnackbar: () => ({ enqueueSnackbar: mockEnqueueSnackbar }),
}));

jest.mock("../financeApi", () => ({
  getFinanceSalesTaxProfile: (...args) => mockGetFinanceSalesTaxProfile(...args),
  previewFinanceTransaction: (...args) => mockPreviewFinanceTransaction(...args),
  updateFinanceSalesTaxProfile: (...args) => mockUpdateFinanceSalesTaxProfile(...args),
}));

function renderCard() {
  return render(
    <ThemeProvider theme={createTheme()}>
      <FinanceSalesTaxProfileCard />
    </ThemeProvider>
  );
}

describe("FinanceSalesTaxProfileCard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetFinanceSalesTaxProfile.mockResolvedValue({
      company_source: {
        tax_country_code: "CA",
        tax_region_code: "QC",
        prices_include_tax: false,
        display_currency: "CAD",
      },
      tax_context: {
        tax_country_code: "CA",
        tax_region_code: "QC",
        display_currency: "CAD",
        default_tax_rate: 14.975,
        tax_label: "GST + QST",
        tax_components: [
          { code: "GST", rate: 5 },
          { code: "QST", rate: 9.975 },
        ],
        default_tax_rate_source: "sales_tax_jurisdiction_catalog",
      },
      catalog_suggestion: {
        id: 77,
        default_tax_rate: 14.975,
        tax_label: "GST + QST",
        tax_components: [
          { code: "GST", rate: 5 },
          { code: "QST", rate: 9.975 },
        ],
      },
      can_confirm_catalog_suggestion: true,
      has_company_override: false,
    });
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
        amount_to_collect: "114.98",
        stripe_currency: "cad",
        stripe_automatic_tax_applied: false,
        message: "Schedulaa has already calculated tax. Stripe would collect the stored Finance total.",
      },
      line_items: [{ description: "Sample taxable item", quantity: "1", unit_price: "100.00", taxable: true, gross: "100.00" }],
      source: { type: "draft", status: "draft" },
    });
  });

  test("requests the Quebec GST and QST finance context", async () => {
    renderCard();

    expect(screen.getByRole("progressbar")).toBeInTheDocument();
    await waitFor(() => expect(mockGetFinanceSalesTaxProfile).toHaveBeenCalledTimes(1));
  });
});
