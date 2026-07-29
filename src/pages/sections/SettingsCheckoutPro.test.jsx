import React from "react";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { ThemeProvider, createTheme } from "@mui/material/styles";

import SettingsCheckoutPro from "./SettingsCheckoutPro";

const mockApiGet = jest.fn();
const mockApiPost = jest.fn();

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: { language: "en" },
  }),
}));

jest.mock("../../utils/api", () => ({
  __esModule: true,
  default: {
    get: (...args) => mockApiGet(...args),
    post: (...args) => mockApiPost(...args),
  },
  isStripeOnboardingIncomplete: () => false,
  stripeConnect: {
    dashboardLogin: jest.fn(),
    refreshOnboardingLink: jest.fn(),
  },
}));

jest.mock("../../utils/mobileCompliance", () => ({
  isMobileComplianceMode: () => false,
}));

jest.mock("../../components/mobile/MobileWebOnlyNotice", () => () => null);
jest.mock("./TaxSetupCard", () => () => <div>Tax setup card</div>);
jest.mock("./TaxHelpGuide", () => () => <div>Tax help guide</div>);

function renderSettings() {
  return render(
    <ThemeProvider theme={createTheme()}>
      <SettingsCheckoutPro />
    </ThemeProvider>
  );
}

describe("SettingsCheckoutPro", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.localStorage.clear();
    mockApiPost.mockResolvedValue({ data: {} });
  });

  test("shows resolved localized business currency and keeps the selling-currency field read-only", async () => {
    mockApiGet.mockResolvedValue({
      data: {
        enable_stripe_payments: false,
        allow_card_on_file: false,
        stripe_publishable_key: "pk_test_123",
        booking_hold_minutes: 3,
        prices_include_tax: false,
        charge_currency_mode: "LOCALIZED",
        tax_country_code: "CA",
        tax_region_code: "ON",
        display_currency: "USD",
        country_code: "CA",
        currency_context: {
          charge_currency_mode: "LOCALIZED",
          business_selling_currency: "CAD",
          currency_source: "tax_country",
        },
      },
    });

    renderSettings();

    expect(await screen.findByText(/Current Product and Finance currency:/i)).toHaveTextContent("CAD");
    expect(screen.getByText(/Uses the standard currency for your business tax country/i)).toBeInTheDocument();

    const sellingCurrency = screen.getByLabelText(/Business selling currency/i);
    expect(sellingCurrency).toHaveAttribute("aria-disabled", "true");
  });

  test("legacy Quebec tax-country context resolves to CAD and keeps the Quebec option", async () => {
    window.localStorage.setItem("company_currency", "USD");
    mockApiGet.mockResolvedValue({
      data: {
        enable_stripe_payments: false,
        allow_card_on_file: false,
        stripe_publishable_key: "pk_test_123",
        booking_hold_minutes: 3,
        prices_include_tax: false,
        charge_currency_mode: "LOCALIZED",
        tax_country_code: "QC",
        tax_region_code: "",
        display_currency: "CAD",
        country_code: "CA",
        currency_context: {
          charge_currency_mode: "LOCALIZED",
          business_selling_currency: "CAD",
          currency_source: "tax_country",
        },
      },
    });

    renderSettings();

    expect(await screen.findByText(/Current Product and Finance currency:/i)).toHaveTextContent("CAD");
    expect(document.querySelector('input[value="QC"]')).not.toBeNull();
  });

  test("asks for confirmation before saving a changed fixed business currency", async () => {
    const confirmSpy = jest.spyOn(window, "confirm").mockReturnValue(true);
    mockApiGet.mockResolvedValue({
      data: {
        enable_stripe_payments: false,
        allow_card_on_file: false,
        stripe_publishable_key: "pk_test_123",
        booking_hold_minutes: 3,
        prices_include_tax: false,
        charge_currency_mode: "PLATFORM_FIXED",
        tax_country_code: "CA",
        tax_region_code: "ON",
        display_currency: "CAD",
        country_code: "CA",
        currency_context: {
          charge_currency_mode: "PLATFORM_FIXED",
          business_selling_currency: "CAD",
          currency_source: "display_currency",
        },
      },
    });
    mockApiPost.mockResolvedValue({
      data: {
        enable_stripe_payments: false,
        allow_card_on_file: false,
        stripe_publishable_key: "pk_test_123",
        booking_hold_minutes: 3,
        prices_include_tax: false,
        charge_currency_mode: "PLATFORM_FIXED",
        tax_country_code: "CA",
        tax_region_code: "ON",
        display_currency: "USD",
        country_code: "CA",
        currency_context: {
          charge_currency_mode: "PLATFORM_FIXED",
          business_selling_currency: "USD",
          currency_source: "display_currency",
        },
      },
    });

    renderSettings();

    await screen.findByText(/Current Product and Finance currency:/i);

    fireEvent.mouseDown(screen.getByLabelText(/Business selling currency/i));
    const listbox = await screen.findByRole("listbox");
    fireEvent.click(within(listbox).getByText("USD - US Dollar"));

    fireEvent.click(screen.getByRole("button", { name: "settings.checkout.buttons.save" }));

    await waitFor(() => expect(confirmSpy).toHaveBeenCalledTimes(1));
    expect(confirmSpy.mock.calls[0][0]).toMatch(/does not convert existing numeric prices/i);
    await waitFor(() =>
      expect(mockApiPost).toHaveBeenCalledWith(
        "/admin/company-profile",
        expect.objectContaining({
          charge_currency_mode: "PLATFORM_FIXED",
          display_currency: "USD",
        }),
        expect.any(Object)
      )
    );

    confirmSpy.mockRestore();
  });
});
