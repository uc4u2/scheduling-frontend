import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { ThemeProvider, createTheme } from "@mui/material/styles";

import FinanceSalesTaxProfileCard from "./FinanceSalesTaxProfileCard";

const mockGetFinanceSalesTaxProfile = jest.fn();
const mockUpdateFinanceSalesTaxProfile = jest.fn();

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key, options = {}) => options.defaultValue || key,
    i18n: { language: "en" },
  }),
}));

jest.mock("../financeApi", () => ({
  getFinanceSalesTaxProfile: (...args) => mockGetFinanceSalesTaxProfile(...args),
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
  });

  test("requests the Quebec GST and QST finance context", async () => {
    renderCard();

    expect(screen.getByRole("progressbar")).toBeInTheDocument();
    await waitFor(() => expect(mockGetFinanceSalesTaxProfile).toHaveBeenCalledTimes(1));
  });
});
