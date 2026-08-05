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

function mockCheckoutSettings({ companyProfile, paymentsPolicy }) {
  mockApiGet.mockImplementation((url) => {
    if (url === "/admin/company-profile") {
      return Promise.resolve({ data: companyProfile });
    }
    if (url === "/admin/payments-policy") {
      return Promise.resolve({ data: paymentsPolicy });
    }
    return Promise.reject(new Error(`Unhandled GET ${url}`));
  });
}

function companyProfileDefaults(overrides = {}) {
  return {
    enable_stripe_payments: false,
    enable_product_payments: false,
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
    ...overrides,
  };
}

describe("SettingsCheckoutPro", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.localStorage.clear();
    mockApiPost.mockResolvedValue({ data: {} });
  });

  test("shows resolved localized business currency and keeps the selling-currency field read-only", async () => {
    mockCheckoutSettings({
      companyProfile: companyProfileDefaults({
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
      }),
      paymentsPolicy: { mode: "off" },
    });

    renderSettings();

    expect(await screen.findByText(/Current Product and Finance currency:/i)).toHaveTextContent("CAD");
    expect(screen.getByText(/Uses the standard currency for your business tax country/i)).toBeInTheDocument();

    const sellingCurrency = screen.getByLabelText(/Business selling currency/i);
    expect(sellingCurrency).toHaveAttribute("aria-disabled", "true");
  });

  test("legacy Quebec tax-country context resolves to CAD and keeps the Quebec option", async () => {
    window.localStorage.setItem("company_currency", "USD");
    mockCheckoutSettings({
      companyProfile: companyProfileDefaults({
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
      }),
      paymentsPolicy: { mode: "off" },
    });

    renderSettings();

    expect(await screen.findByText(/Current Product and Finance currency:/i)).toHaveTextContent("CAD");
    expect(screen.getByRole("combobox", { name: /settings\.checkout\.taxCountry\.label/i })).toHaveTextContent(/qc/i);
  });

  test("asks for confirmation before saving a changed fixed business currency", async () => {
    const confirmSpy = jest.spyOn(window, "confirm").mockReturnValue(true);
    mockCheckoutSettings({
      companyProfile: companyProfileDefaults(),
      paymentsPolicy: { mode: "off" },
    });
    mockApiPost.mockImplementation((url) => {
      if (url === "/admin/company-profile") {
        return Promise.resolve({
          data: {
            ...companyProfileDefaults({
              display_currency: "USD",
              currency_context: {
                charge_currency_mode: "PLATFORM_FIXED",
                business_selling_currency: "USD",
                currency_source: "display_currency",
              },
            }),
          },
        });
      }
      if (url === "/admin/payments-policy") {
        return Promise.resolve({ data: { saved: true, policy: { mode: "off" } } });
      }
      return Promise.resolve({ data: {} });
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
            enable_product_payments: true,
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
      if (url === "/admin/payments-policy") {
        return Promise.resolve({ data: { mode: "capture" } });
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
    const compatibilitySummary = screen.getAllByRole("alert").find((node) =>
      node.textContent?.includes("Appointments: Card on file · Products: Paid during Checkout")
    );
    expect(compatibilitySummary).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /preview booking payment/i }));

    expect(await screen.findByRole("heading", { name: /preview customer payment/i })).toBeInTheDocument();
    expect(await screen.findByText(/Appointment mode:/i)).toHaveTextContent("Card on file");
    expect(await screen.findByText(/Subtotal before tax/i)).toBeInTheDocument();
    expect(await screen.findByText(/Calculated by Stripe/i)).toBeInTheDocument();
    expect(await screen.findByText(/Preview only — no Booking/i)).toBeInTheDocument();
  });

  test("saves appointment card-on-file mode without turning product payments off", async () => {
    mockCheckoutSettings({
      companyProfile: {
        enable_stripe_payments: true,
        enable_product_payments: true,
        allow_card_on_file: true,
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
      paymentsPolicy: { mode: "capture" },
    });
    mockApiPost.mockImplementation((url) => {
      if (url === "/admin/company-profile") {
        return Promise.resolve({
          data: {
            enable_stripe_payments: true,
            enable_product_payments: true,
            allow_card_on_file: true,
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
      }
      if (url === "/admin/payments-policy") {
        return Promise.resolve({ data: { saved: true, policy: { mode: "capture" } } });
      }
      return Promise.resolve({ data: {} });
    });

    renderSettings();
    await waitFor(() =>
      expect(
        screen.getAllByRole("alert").some((node) =>
          node.textContent?.includes("Appointments: Card on file · Products: Paid during Checkout")
        )
      ).toBe(true)
    );

    fireEvent.click(screen.getByRole("button", { name: "settings.checkout.buttons.save" }));

    await waitFor(() =>
      expect(mockApiPost).toHaveBeenCalledWith(
        "/admin/company-profile",
        expect.objectContaining({
          enable_stripe_payments: false,
          enable_product_payments: true,
          allow_card_on_file: true,
        }),
        expect.any(Object)
      )
    );
    expect(mockApiPost).toHaveBeenCalledWith(
      "/admin/payments-policy",
      { appointment_payment_mode: "capture" },
      expect.any(Object)
    );
  });

  test("shows exactly three appointment payment choices and no deposit option", async () => {
    mockCheckoutSettings({
      companyProfile: companyProfileDefaults(),
      paymentsPolicy: { mode: "off" },
    });

    renderSettings();
    await screen.findByText(/Current Product and Finance currency:/i);

    expect(screen.queryByText("Deposit during Checkout")).not.toBeInTheDocument();
    expect(screen.getByText("Appointment payment policy")).toBeInTheDocument();

    const radioValues = screen.getAllByRole("radio").map((node) => node.getAttribute("value"));
    expect(radioValues).toEqual(["offline", "card_on_file", "pay_now"]);
  });

  test("legacy deposit policy loads as pay now without auto-saving", async () => {
    mockCheckoutSettings({
      companyProfile: companyProfileDefaults({
        enable_stripe_payments: true,
        enable_product_payments: false,
        allow_card_on_file: false,
      }),
      paymentsPolicy: { mode: "deposit" },
    });
    mockApiPost.mockImplementation((url, payload) => {
      if (url === "/admin/company-profile") {
        return Promise.resolve({
          data: companyProfileDefaults({
            enable_stripe_payments: payload.enable_stripe_payments,
            enable_product_payments: payload.enable_product_payments,
            allow_card_on_file: payload.allow_card_on_file,
          }),
        });
      }
      if (url === "/admin/payments-policy") {
        return Promise.resolve({ data: { saved: true, policy: { mode: "pay" } } });
      }
      return Promise.resolve({ data: {} });
    });

    renderSettings();
    await screen.findByText(/Current Product and Finance currency:/i);

    expect(screen.queryByText("Deposit during Checkout")).not.toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /settings\.checkout\.modes\.payNow\.title/i })).toBeChecked();
    expect(mockApiPost).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "settings.checkout.buttons.save" }));

    await waitFor(() =>
      expect(mockApiPost).toHaveBeenCalledWith(
        "/admin/payments-policy",
        { appointment_payment_mode: "pay" },
        expect.any(Object)
      )
    );
    expect(JSON.stringify(mockApiPost.mock.calls)).not.toContain("deposit");
  });

  test.each([
    ["A", "capture", true, "Card on file", "Paid during Checkout"],
    ["B", "capture", false, "Card on file", "Online Product payments are off"],
    ["C", "pay", true, "Pay during booking Checkout", "Paid during Checkout"],
    ["D", "pay", false, "Pay during booking Checkout", "Online Product payments are off"],
    ["E", "off", true, "No online payment", "Paid during Checkout"],
    ["F", "off", false, "No online payment", "Online Product payments are off"],
  ])(
    "supports configuration matrix %s",
    async (_label, policyMode, productEnabled, appointmentLabel, productLabel) => {
      const appointmentEnabled = policyMode === "pay";
      const allowCard = policyMode === "capture";
      mockCheckoutSettings({
        companyProfile: companyProfileDefaults({
          enable_stripe_payments: appointmentEnabled,
          enable_product_payments: productEnabled,
          allow_card_on_file: allowCard,
        }),
        paymentsPolicy: { mode: policyMode },
      });
      mockApiPost.mockImplementation((url, payload) => {
        if (url === "/admin/company-profile") {
          return Promise.resolve({
            data: companyProfileDefaults({
              enable_stripe_payments: payload.enable_stripe_payments,
              enable_product_payments: payload.enable_product_payments,
              allow_card_on_file: payload.allow_card_on_file,
            }),
          });
        }
        if (url === "/admin/payments-policy") {
          return Promise.resolve({ data: { saved: true, policy: { mode: payload.appointment_payment_mode } } });
        }
        return Promise.resolve({ data: {} });
      });

      renderSettings();
      await screen.findByText(/Current Product and Finance currency:/i);
      expect(
        screen.getAllByRole("alert").some((node) =>
          node.textContent?.includes(`Appointments: ${appointmentLabel} · Products: ${productLabel}`)
        )
      ).toBe(true);

      fireEvent.click(screen.getByRole("button", { name: "settings.checkout.buttons.save" }));

      await waitFor(() =>
        expect(mockApiPost).toHaveBeenCalledWith(
          "/admin/company-profile",
          expect.objectContaining({
            enable_stripe_payments: appointmentEnabled,
            enable_product_payments: productEnabled,
            allow_card_on_file: allowCard,
          }),
          expect.any(Object)
        )
      );
    }
  );

  test("pay now saves the supported appointment policy only", async () => {
    mockCheckoutSettings({
      companyProfile: companyProfileDefaults({
        enable_stripe_payments: true,
        enable_product_payments: false,
        allow_card_on_file: false,
      }),
      paymentsPolicy: { mode: "pay" },
    });
    mockApiPost.mockResolvedValue({ data: companyProfileDefaults({ enable_stripe_payments: true, enable_product_payments: false, allow_card_on_file: false }) });

    renderSettings();
    await screen.findByText(/Current Product and Finance currency:/i);
    fireEvent.click(screen.getByRole("button", { name: "settings.checkout.buttons.save" }));

    await waitFor(() =>
      expect(mockApiPost).toHaveBeenCalledWith(
        "/admin/company-profile",
        expect.objectContaining({
          enable_stripe_payments: true,
          enable_product_payments: false,
          allow_card_on_file: false,
        }),
        expect.any(Object)
      )
    );
    expect(mockApiPost).toHaveBeenCalledWith(
      "/admin/payments-policy",
      { appointment_payment_mode: "pay" },
      expect.any(Object)
    );
  });

  test("offline saves the supported appointment policy only", async () => {
    mockCheckoutSettings({
      companyProfile: companyProfileDefaults({
        enable_stripe_payments: false,
        enable_product_payments: true,
        allow_card_on_file: false,
      }),
      paymentsPolicy: { mode: "off" },
    });
    mockApiPost.mockResolvedValue({ data: companyProfileDefaults({ enable_stripe_payments: false, enable_product_payments: true, allow_card_on_file: false }) });

    renderSettings();
    await screen.findByText(/Current Product and Finance currency:/i);
    fireEvent.click(screen.getByRole("button", { name: "settings.checkout.buttons.save" }));

    await waitFor(() =>
      expect(mockApiPost).toHaveBeenCalledWith(
        "/admin/company-profile",
        expect.objectContaining({
          enable_stripe_payments: false,
          enable_product_payments: true,
          allow_card_on_file: false,
        }),
        expect.any(Object)
      )
    );
    expect(mockApiPost).toHaveBeenCalledWith(
      "/admin/payments-policy",
      { appointment_payment_mode: "off" },
      expect.any(Object)
    );
  });
});
