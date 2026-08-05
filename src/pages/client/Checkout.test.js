import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { CheckoutFormCore } from "./Checkout";

const mockStartHostedCheckout = jest.fn();
const mockReleasePendingCheckout = jest.fn();
const mockLoadCart = jest.fn();
const mockSaveCart = jest.fn();
const mockApiGet = jest.fn();
const mockApiPost = jest.fn();
const mockNavigate = jest.fn();
const mockBuildHostedCheckoutPayload = jest.fn((args) => ({ __payloadArgs: args }));

jest.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => ({ search: "" }),
  useParams: () => ({ slug: "vandaorchidjewels" }),
}), { virtual: true });

jest.mock("../../utils/api", () => ({
  __esModule: true,
  API_BASE_URL: "https://api.example.test",
  api: {
    get: (...args) => mockApiGet(...args),
    post: (...args) => mockApiPost(...args),
  },
  default: {
    get: (...args) => mockApiGet(...args),
    post: (...args) => mockApiPost(...args),
  },
  publicSite: {
    getWebsiteShell: jest.fn(),
  },
}));

jest.mock("../../utils/hostedCheckout", () => ({
  buildHostedCheckoutPayload: (...args) => mockBuildHostedCheckoutPayload(...args),
  startHostedCheckout: (...args) => mockStartHostedCheckout(...args),
  releasePendingCheckout: (...args) => mockReleasePendingCheckout(...args),
}));

jest.mock("../../utils/cart", () => ({
  CartTypes: {
    SERVICE: "service",
    PRODUCT: "product",
    PACKAGE: "package",
  },
  loadCart: (...args) => mockLoadCart(...args),
  saveCart: (...args) => mockSaveCart(...args),
  clearCart: jest.fn(),
}));

jest.mock("../../utils/tenant", () => ({
  getTenantHostMode: () => "custom",
}));

jest.mock("../../utils/timezone", () => ({
  getUserTimezone: () => "America/Toronto",
  formatTimezoneLabel: (value) => value,
}));

jest.mock("../../components/TimezoneSelect", () => () => null);
jest.mock("../../components/billing/PublicBookingUnavailableDialog", () => () => null);
jest.mock("../../components/website/SiteFrame", () => ({ children }) => <>{children}</>);

describe("CheckoutFormCore", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.localStorage.clear();
    mockLoadCart.mockReturnValue([
      {
        id: "107-2026-07-30-10:00",
        type: "service",
        service_id: 107,
        service_name: "Studio rental",
        price: 320,
        allow_packages: false,
        artist_name: "Vanda Orchid",
        artist_id: 16,
        date: "2026-07-30",
        start_time: "10:00",
        end_time: "16:00",
        addon_ids: [],
        addons: [],
        tip_mode: "percent",
        tip_value: 0,
        tip_amount: 0,
        quantity: 1,
        hold_started_at: new Date().toISOString(),
      },
    ]);
    mockApiGet.mockResolvedValue({ data: [] });
    mockApiPost.mockResolvedValue({ data: {} });
    mockStartHostedCheckout.mockImplementation(() => new Promise(() => {}));
    mockReleasePendingCheckout.mockResolvedValue({});
    mockBuildHostedCheckoutPayload.mockImplementation((args) => ({ __payloadArgs: args }));
  });

  test("removing the final service while checkout is loading clears the flow and releases the hold", async () => {
    const onRequestAddService = jest.fn();

    render(
      <CheckoutFormCore
        companySlug="vandaorchidjewels"
        paymentsEnabled
        tipEnabled={false}
        cardOnFileEnabled={false}
        displayCurrency="CAD"
        policy={{ mode: "pay" }}
        holdMinutes={null}
        onRequestAddService={onRequestAddService}
      />
    );

    await screen.findByText(/studio rental/i);

    fireEvent.change(screen.getByLabelText(/your name/i), {
      target: { value: "Yousef Jalali" },
    });
    fireEvent.change(screen.getByLabelText(/your email/i), {
      target: { value: "yousef@example.com" },
    });

    fireEvent.click(screen.getByRole("button", { name: /pay & book/i }));

    await waitFor(() => expect(screen.getByRole("progressbar")).toBeInTheDocument());

    const deleteButtons = screen.getAllByRole("button");
    const removeButton = deleteButtons.find((button) => button.querySelector('svg[data-testid="DeleteIcon"]'));
    fireEvent.click(removeButton);

    await waitFor(() => expect(onRequestAddService).toHaveBeenCalledTimes(1));
    expect(mockReleasePendingCheckout).toHaveBeenCalledWith({ slug: "vandaorchidjewels" });
    expect(mockSaveCart).toHaveBeenCalledWith([]);
  });

  test("normalizes shipping country to backend domestic destinations", async () => {
    mockLoadCart.mockReturnValue([
      {
        id: "product-1",
        type: "product",
        product_id: 1,
        name: "Pendant",
        price: 85,
        quantity: 1,
      },
    ]);
    window.localStorage.setItem(
      "checkout_product_delivery_prefill",
      JSON.stringify({
        delivery_method: "shipping",
        shipping: {
          name: "Yousef Jalali",
          phone: "+12025550123",
          address1: "123 Main St",
          city: "New York",
          region: "NY",
          postal_code: "10001",
          country: "US",
        },
      })
    );
    mockApiGet.mockImplementation((url) => {
      if (String(url).includes("/public/vandaorchidjewels/delivery-methods")) {
        return Promise.resolve({
          data: {
            allowed_methods: ["pickup", "shipping"],
            allowed_destination_countries: ["CA"],
            address_verification_enabled: false,
          },
        });
      }
      return Promise.resolve({ data: [] });
    });
    mockApiPost.mockResolvedValue({
      data: {
        available: true,
        fallback_manual: false,
        rates: [{ rate_id: "rate_1", amount: 12.5, currency: "CAD", carrier: "Carrier", service: "Ground" }],
        default_rate_id: "rate_1",
      },
    });

    render(
      <CheckoutFormCore
        companySlug="vandaorchidjewels"
        paymentsEnabled
        tipEnabled={false}
        cardOnFileEnabled={false}
        displayCurrency="CAD"
        policy={{ mode: "pay" }}
        holdMinutes={null}
      />
    );

    fireEvent.change(await screen.findByLabelText(/your name/i), {
      target: { value: "Yousef Jalali" },
    });
    fireEvent.change(screen.getByLabelText(/your email/i), {
      target: { value: "yousef@example.com" },
    });
    await waitFor(() => {
      const comboValues = screen
        .getAllByRole("combobox")
        .map((node) => (node instanceof HTMLInputElement ? node.value : node.textContent || ""));
      expect(comboValues).toContain("Canada");
    });
  });

  test("product checkout passes selected rate id and quote token to hosted checkout payload", async () => {
    mockLoadCart.mockReturnValue([
      {
        id: "product-1",
        type: "product",
        product_id: 1,
        name: "Pendant",
        price: 85,
        quantity: 1,
      },
    ]);
    window.localStorage.setItem(
      "checkout_product_delivery_prefill",
      JSON.stringify({
        delivery_method: "shipping",
        shipping: {
          name: "Yousef Jalali",
          phone: "+12025550123",
          address1: "123 Main St",
          city: "Toronto",
          region: "ON",
          postal_code: "M5H 2N2",
          country: "CA",
        },
      })
    );
    mockApiGet.mockImplementation((url) => {
      if (String(url).includes("/public/vandaorchidjewels/delivery-methods")) {
        return Promise.resolve({
          data: {
            allowed_methods: ["pickup", "shipping"],
            allowed_destination_countries: ["CA"],
            address_verification_enabled: false,
          },
        });
      }
      return Promise.resolve({ data: [] });
    });
    mockApiPost.mockImplementation((url) => {
      if (String(url).includes("/shipping/rates")) {
        return Promise.resolve({
          data: {
            available: true,
            fallback_manual: false,
            rates: [{ rate_id: "rate_1", amount: 12.5, amount_cents: 1250, currency: "CAD", carrier: "Carrier", service: "Ground" }],
            default_rate_id: "rate_1",
            shipping_rate_quote_token: "quote-token-1",
            quote_expires_at: "2099-07-26T14:30:00Z",
          },
        });
      }
      return Promise.resolve({ data: {} });
    });
    mockStartHostedCheckout.mockResolvedValue({ sessionId: "cs_test" });

    render(
      <CheckoutFormCore
        companySlug="vandaorchidjewels"
        paymentsEnabled
        tipEnabled={false}
        cardOnFileEnabled={false}
        displayCurrency="CAD"
        policy={{ mode: "pay" }}
        holdMinutes={null}
      />
    );

    fireEvent.change(await screen.findByLabelText(/your name/i), {
      target: { value: "Yousef Jalali" },
    });
    fireEvent.change(screen.getByLabelText(/your email/i), {
      target: { value: "yousef@example.com" },
    });
    await waitFor(() => expect(mockApiPost).toHaveBeenCalledWith(
      expect.stringContaining("/shipping/rates"),
      expect.any(Object)
    ));
    await screen.findByText(/Shipping:\s*CA\$12\.50/i);

    const payButton = await screen.findByRole("button", { name: /pay/i });
    fireEvent.click(payButton);

    await waitFor(() => expect(mockStartHostedCheckout).toHaveBeenCalled());
    const [{ payload }] = mockStartHostedCheckout.mock.calls.slice(-1)[0];
    expect(payload.__payloadArgs.shippingRateQuoteToken).toBe("quote-token-1");
    expect(payload.__payloadArgs.selectedRateId).toBe("rate_1");
  });

  test("renders card-on-file consent copy without crashing when capture mode is enabled", async () => {
    render(
      <CheckoutFormCore
        companySlug="vandaorchidjewels"
        businessName="Vanda Orchid Jewels"
        paymentsEnabled={false}
        tipEnabled={false}
        cardOnFileEnabled
        displayCurrency="CAD"
        policy={{ mode: "capture", cancellation_policy: "24-hour cancellation policy." }}
        holdMinutes={3}
      />
    );

    expect(
      await screen.findByLabelText(/I agree that Vanda Orchid Jewels may securely save my card with Stripe/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/24-hour cancellation policy\./i)).toBeInTheDocument();
    expect(
      screen.getByText(/Saving a card does not guarantee that a future charge will be approved\./i),
    ).toBeInTheDocument();
  });

  test("product-only carts ignore booking capture mode and continue with pay now", async () => {
    mockLoadCart.mockReturnValue([
      {
        id: "product-1",
        type: "product",
        product_id: 1,
        name: "Pendant",
        price: 85,
        quantity: 1,
      },
    ]);

    render(
      <CheckoutFormCore
        companySlug="vandaorchidjewels"
        businessName="Vanda Orchid Jewels"
        paymentsEnabled={false}
        tipEnabled={false}
        cardOnFileEnabled
        productCheckout={{ enabled: true, mode: "pay", requires_payment_during_checkout: true }}
        displayCurrency="CAD"
        policy={{ booking_payment: { mode: "capture" }, mode: "capture" }}
        holdMinutes={3}
      />
    );

    expect(await screen.findByRole("button", { name: /pay now/i })).toBeInTheDocument();
    expect(screen.queryByLabelText(/may securely save my card with Stripe/i)).not.toBeInTheDocument();
  });

  test("product-only carts show the product-specific disabled message", async () => {
    mockLoadCart.mockReturnValue([
      {
        id: "product-1",
        type: "product",
        product_id: 1,
        name: "Pendant",
        price: 85,
        quantity: 1,
      },
    ]);
    mockApiGet.mockImplementation((url) => {
      if (String(url).includes("/delivery-methods")) {
        return Promise.resolve({
          data: {
            delivery_enabled: true,
            methods: [{ code: "pickup", label: "Pickup", enabled: true }],
            effective_method_codes: ["pickup"],
            allowed_methods: ["pickup"],
          },
        });
      }
      return Promise.resolve({ data: [] });
    });

    render(
      <CheckoutFormCore
        companySlug="vandaorchidjewels"
        businessName="Vanda Orchid Jewels"
        paymentsEnabled={false}
        tipEnabled={false}
        cardOnFileEnabled={false}
        productCheckout={{ enabled: false, mode: "pay", requires_payment_during_checkout: true }}
        displayCurrency="CAD"
        policy={{ booking_payment: { mode: "off" }, mode: "off" }}
        holdMinutes={3}
      />
    );

    fireEvent.change(await screen.findByLabelText(/your name/i), {
      target: { value: "Yousef Jalali" },
    });
    fireEvent.change(screen.getByLabelText(/your email/i), {
      target: { value: "yousef@example.com" },
    });
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /place order/i })).not.toBeDisabled()
    );
    fireEvent.click(screen.getByRole("button", { name: /place order/i }));

    expect(await screen.findByText(/not currently accepting online Product payments/i)).toBeInTheDocument();
  });

  test("shows cross-border customs notice and safe international unavailability message", async () => {
    mockLoadCart.mockReturnValue([
      {
        id: "product-1",
        type: "product",
        product_id: 1,
        name: "Pendant",
        price: 85,
        quantity: 1,
      },
    ]);
    window.localStorage.setItem(
      "checkout_product_delivery_prefill",
      JSON.stringify({
        delivery_method: "shipping",
        shipping: {
          name: "Yousef Jalali",
          phone: "+12025550123",
          address1: "123 Main St",
          city: "Buffalo",
          region: "NY",
          postal_code: "14201",
          country: "US",
        },
      })
    );
    mockApiGet.mockImplementation((url) => {
      if (String(url).includes("/public/vandaorchidjewels/delivery-methods")) {
        return Promise.resolve({
          data: {
            allowed_methods: ["pickup", "shipping"],
            allowed_destination_countries: ["CA", "US"],
            origin_country: "CA",
            address_verification_enabled: false,
          },
        });
      }
      return Promise.resolve({ data: [] });
    });
    mockApiPost.mockImplementation((url) => {
      if (String(url).includes("/shipping/rates")) {
        return Promise.resolve({
          data: {
            available: false,
            fallback_manual: false,
            message: "International shipping is currently unavailable for one or more items in your cart. Please use a domestic delivery address or contact the business.",
            rates: [],
          },
        });
      }
      return Promise.resolve({ data: {} });
    });

    render(
      <CheckoutFormCore
        companySlug="vandaorchidjewels"
        paymentsEnabled
        tipEnabled={false}
        cardOnFileEnabled={false}
        displayCurrency="CAD"
        policy={{ mode: "pay" }}
        holdMinutes={null}
      />
    );

    fireEvent.change(await screen.findByLabelText(/your name/i), {
      target: { value: "Yousef Jalali" },
    });
    fireEvent.change(screen.getByLabelText(/your email/i), {
      target: { value: "yousef@example.com" },
    });

    expect(await screen.findByText(/international shipping may be subject to import duties/i)).toBeInTheDocument();
    expect(await screen.findByText(/international shipping is currently unavailable for one or more items in your cart/i)).toBeInTheDocument();
  });

  test("requires import-charge acknowledgement before starting cross-border checkout", async () => {
    mockLoadCart.mockReturnValue([
      {
        id: "product-1",
        type: "product",
        product_id: 1,
        name: "Pendant",
        price: 85,
        quantity: 1,
        allow_international_shipping: true,
      },
    ]);
    window.localStorage.setItem(
      "checkout_product_delivery_prefill",
      JSON.stringify({
        delivery_method: "shipping",
        shipping: {
          name: "Yousef Jalali",
          phone: "+12025550123",
          address1: "123 Main St",
          city: "Buffalo",
          region: "NY",
          postal_code: "14201",
          country: "US",
        },
      })
    );
    mockApiGet.mockImplementation((url) => {
      if (String(url).includes("/public/vandaorchidjewels/delivery-methods")) {
        return Promise.resolve({
          data: {
            allowed_methods: ["pickup", "shipping"],
            allowed_destination_countries: ["CA", "US"],
            origin_country: "CA",
            address_verification_enabled: false,
            require_import_charges_acknowledgement: true,
            import_charges_notice_version: "2026-07-26-v1",
            import_charges_notice_snapshot: {
              version: "2026-07-26-v1",
              standard_notice:
                "The carrier or customs authority may collect import duties, taxes, brokerage charges, or other fees separately before or at delivery.",
            },
          },
        });
      }
      return Promise.resolve({ data: [] });
    });
    mockApiPost.mockImplementation((url) => {
      if (String(url).includes("/shipping/rates")) {
        return Promise.resolve({
          data: {
            available: true,
            fallback_manual: false,
            rates: [
              {
                rate_id: "rate_1",
                amount: 12.5,
                amount_cents: 1250,
                currency: "CAD",
                carrier: "Carrier",
                service: "Ground",
                quote_public_id: "quote-public-1",
                customs_snapshot_hash: "customs-hash-1",
              },
            ],
            default_rate_id: "rate_1",
            shipping_rate_quote_token: "quote-token-1",
            quote_public_id: "quote-public-1",
            quote_expires_at: "2099-07-26T14:30:00Z",
            duties_included: false,
            import_charges_notice_version: "2026-07-26-v1",
            import_charges_notice_snapshot: {
              version: "2026-07-26-v1",
              standard_notice:
                "The carrier or customs authority may collect import duties, taxes, brokerage charges, or other fees separately before or at delivery.",
            },
            require_import_charges_acknowledgement: true,
          },
        });
      }
      return Promise.resolve({ data: {} });
    });
    mockStartHostedCheckout.mockResolvedValue({ sessionId: "cs_test" });

    render(
      <CheckoutFormCore
        companySlug="vandaorchidjewels"
        paymentsEnabled
        tipEnabled={false}
        cardOnFileEnabled={false}
        displayCurrency="CAD"
        policy={{ mode: "pay" }}
        holdMinutes={null}
      />
    );

    fireEvent.change(await screen.findByLabelText(/your name/i), {
      target: { value: "Yousef Jalali" },
    });
    fireEvent.change(screen.getByLabelText(/your email/i), {
      target: { value: "yousef@example.com" },
    });

    expect(await screen.findByText(/import duties and taxes: not included/i)).toBeInTheDocument();
    fireEvent.click(await screen.findByRole("button", { name: /pay now/i }));
    expect(await screen.findByText(/please acknowledge that import charges may be collected separately/i)).toBeInTheDocument();
    expect(mockStartHostedCheckout).not.toHaveBeenCalled();

    fireEvent.click(screen.getByLabelText(/i understand that import duties, taxes, brokerage charges, or carrier fees may be collected separately/i));
    fireEvent.click(await screen.findByRole("button", { name: /pay now/i }));

    await waitFor(() => expect(mockStartHostedCheckout).toHaveBeenCalled());
    const [{ payload }] = mockStartHostedCheckout.mock.calls.slice(-1)[0];
    expect(payload.__payloadArgs.importChargesAcknowledged).toBe(true);
    expect(payload.__payloadArgs.importChargesAcknowledgementQuotePublicId).toBe("quote-public-1");
    expect(payload.__payloadArgs.importChargesAcknowledgementCustomsHash).toBe("customs-hash-1");
  });

  test("best-effort international verification waits for customer confirmation before requesting rates", async () => {
    mockLoadCart.mockReturnValue([
      {
        id: "product-1",
        type: "product",
        product_id: 1,
        name: "Pendant",
        price: 85,
        quantity: 1,
        allow_international_shipping: true,
      },
    ]);
    window.localStorage.setItem(
      "checkout_product_delivery_prefill",
      JSON.stringify({
        delivery_method: "shipping",
        shipping: {
          name: "Yousef Jalali",
          phone: "+447700900123",
          address1: "10 Downing Street",
          address2: "Suite 5",
          city: "London",
          region: "",
          postal_code: "SW1A 2AA",
          country: "GB",
        },
      })
    );
    mockApiGet.mockImplementation((url) => {
      if (String(url).includes("/public/vandaorchidjewels/delivery-methods")) {
        return Promise.resolve({
          data: {
            allowed_methods: ["pickup", "shipping"],
            allowed_destination_countries: ["CA", "GB"],
            allowed_destination_country_options: [
              { code: "CA", label: "Canada" },
              { code: "GB", label: "United Kingdom" },
            ],
            country_catalog: [
              { code: "CA", label: "Canada" },
              { code: "GB", label: "United Kingdom" },
            ],
            origin_country: "CA",
            address_verification_enabled: false,
            international_address_verification_mode: "best_effort",
          },
        });
      }
      return Promise.resolve({ data: [] });
    });
    mockApiPost.mockImplementation((url) => {
      if (String(url).includes("/shipping/verify-address")) {
        return Promise.resolve({
          data: {
            status: "customer_confirmation_required",
            verification_token: "verify-gb-1",
            accepted_address: {
              address1: "10 Downing Street",
              address2: "Suite 5",
              city: "London",
              region: "",
              postal_code: "SW1A 2AA",
              country: "GB",
            },
            verification_level: "format_validated_only",
            messages: [
              "We could not automatically verify this international address. Please check it carefully before continuing.",
            ],
          },
        });
      }
      if (String(url).includes("/shipping/accept-address")) {
        return Promise.resolve({
          data: {
            status: "customer_confirmed_unverified",
            verification_token: "verify-gb-2",
            accepted_address: {
              address1: "10 Downing Street",
              address2: "Suite 5",
              city: "London",
              region: "",
              postal_code: "SW1A 2AA",
              country: "GB",
            },
            verification_level: "customer_confirmed_unverified",
            messages: [],
          },
        });
      }
      if (String(url).includes("/shipping/rates")) {
        return Promise.resolve({
          data: {
            available: true,
            fallback_manual: false,
            rates: [{ rate_id: "rate_gb_1", amount: 24, amount_cents: 2400, currency: "CAD", carrier: "Carrier", service: "Worldwide" }],
            default_rate_id: "rate_gb_1",
            shipping_rate_quote_token: "quote-gb-1",
            quote_expires_at: "2099-07-27T14:30:00Z",
          },
        });
      }
      return Promise.resolve({ data: {} });
    });

    render(
      <CheckoutFormCore
        companySlug="vandaorchidjewels"
        paymentsEnabled
        tipEnabled={false}
        cardOnFileEnabled={false}
        displayCurrency="CAD"
        policy={{ mode: "pay" }}
        holdMinutes={null}
      />
    );

    fireEvent.change(await screen.findByLabelText(/your name/i), {
      target: { value: "Yousef Jalali" },
    });
    fireEvent.change(screen.getByLabelText(/your email/i), {
      target: { value: "yousef@example.com" },
    });

    fireEvent.click(await screen.findByRole("button", { name: /verify address & view shipping options/i }));
    expect(await screen.findByText(/please check it carefully before continuing/i)).toBeInTheDocument();
    expect(mockApiPost).not.toHaveBeenCalledWith(expect.stringContaining("/shipping/rates"), expect.any(Object));

    fireEvent.click(screen.getByLabelText(/i confirm that this international delivery address is complete and correct/i));
    fireEvent.click(screen.getByRole("button", { name: /confirm address & view shipping options/i }));

    await waitFor(() =>
      expect(mockApiPost).toHaveBeenCalledWith(
        expect.stringContaining("/shipping/rates"),
        expect.any(Object)
      )
    );
    expect(await screen.findByText(/Shipping:\s*CA\$24\.00/i)).toBeInTheDocument();
  });
});
