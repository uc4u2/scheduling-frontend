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

  test("opens booking payment preview from Checkout Pro with current mode and service pricing", async () => {
    mockApiGet.mockImplementation((url) => {
      if (url === "/admin/company-profile") {
        return Promise.resolve({
          data: {
            slug: "tenant-preview",
            enable_stripe_payments: true,
            allow_card_on_file: true,
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
      }
      if (url === "/booking/services?active=true") {
        return Promise.resolve({
          data: [{ id: 7, name: "Consultation", base_price: 100 }],
        });
      }
      if (url === "/public/tenant-preview/service/7/addons") {
        return Promise.resolve({
          data: [{ id: 9, name: "Add-on", base_price: 20 }],
        });
      }
      return Promise.reject(new Error(`Unhandled GET ${url}`));
    });
    mockApiPost.mockImplementation((url) => {
      if (url === "/api/manager/booking-payment-preview") {
        return Promise.resolve({
          data: {
            domain: "booking",
            preview_only: true,
            source: { type: "draft", id: null },
            payment_mode: "pay_now",
            currency: "CAD",
            customer_view: {
              service_subtotal: "120.00",
              addons_total: "20.00",
              discount_total: "0.00",
              subtotal_before_tax: "120.00",
              tax_amount: null,
              tax_amount_status: "calculated_at_checkout",
              amount_due_now: null,
              amount_due_now_status: "provider_calculated",
              amount_due_later: null,
              total_expected: null,
            },
            payment: {
              card_collected: true,
              card_saved: false,
              online_charge_created: true,
              collection_timing: "during_checkout",
              stripe_automatic_tax: true,
            },
            tax: {
              handling_mode: "stripe_checkout_automatic_tax",
              prices_include_tax: false,
              exact_amount_available: false,
              message: "Stripe Automatic Tax is enabled for this checkout flow.",
            },
            settings_source: {
              payment_mode: "Checkout Pro & Payments",
              currency: "Company currency settings",
              tax: "Checkout Pro / Stripe checkout",
            },
            warnings: [],
            line_items: [
              { code: "service", label: "Consultation", amount: "100.00" },
              { code: "addon:9", label: "Add-on", amount: "20.00" },
            ],
            side_effects: {
              booking_created: false,
              slot_reserved: false,
              card_saved: false,
              payment_created: false,
              stripe_object_created: false,
              email_sent: false,
            },
          },
        });
      }
      return Promise.resolve({ data: {} });
    });

    renderSettings();
    await screen.findByText(/Current Product and Finance currency:/i);

    fireEvent.click(screen.getByRole("button", { name: /preview booking payment/i }));

    expect(await screen.findByRole("heading", { name: /preview customer payment/i })).toBeInTheDocument();
    expect(await screen.findByText(/Current mode:/i)).toHaveTextContent("Pay during checkout");
    expect(await screen.findByText(/Subtotal before tax/i)).toBeInTheDocument();
    expect(await screen.findByText(/Calculated by Stripe/i)).toBeInTheDocument();
    expect(await screen.findByText(/Preview only — no Booking/i)).toBeInTheDocument();
  });
});
