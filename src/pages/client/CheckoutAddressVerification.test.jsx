import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { CheckoutFormCore } from "./Checkout";

const mockLoadCart = jest.fn();
const mockSaveCart = jest.fn();
const mockApiGet = jest.fn();
const mockApiPost = jest.fn();

jest.mock("react-router-dom", () => ({
  useNavigate: () => jest.fn(),
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
  buildHostedCheckoutPayload: jest.fn(() => ({ items: [{ id: "product-1" }] })),
  startHostedCheckout: jest.fn(),
  releasePendingCheckout: jest.fn(),
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

const renderCheckout = () =>
  {
    window.localStorage.setItem(
      "checkout_product_delivery_prefill",
      JSON.stringify({
        delivery_method: "shipping",
        shipping: {
          name: "Yousef Jalali",
          phone: "+14165550000",
          address1: "123 Main St",
          address2: "Suite 4",
          city: "Toronto",
          region: "ON",
          postal_code: "M5H 2N2",
          country: "CA",
          instructions: "Front desk",
        },
      })
    );
    return render(
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
  };

const fillShippingAddress = async ({ expectVerification = true } = {}) => {
  fireEvent.change(await screen.findByLabelText(/your name/i), {
    target: { value: "Yousef Jalali" },
  });
  fireEvent.change(screen.getByLabelText(/your email/i), {
    target: { value: "yousef@example.com" },
  });
  if (expectVerification) {
    await screen.findByRole("button", { name: /verify address & view shipping options/i });
  }
};

describe("Checkout address verification", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.localStorage.clear();
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
      if (String(url).includes("/public/vandaorchidjewels/delivery-methods")) {
        return Promise.resolve({
          data: {
            allowed_methods: ["pickup", "shipping"],
            allowed_destination_countries: ["CA"],
            address_verification_enabled: true,
          },
        });
      }
      return Promise.resolve({ data: [] });
    });
    mockApiPost.mockResolvedValue({ data: {} });
  });

  test("shows explicit verify button and does not verify during typing", async () => {
    renderCheckout();
    await fillShippingAddress();

    expect(
      await screen.findByRole("button", { name: /verify address & view shipping options/i })
    ).toBeInTheDocument();
    expect(mockApiPost).not.toHaveBeenCalledWith(
      "/public/vandaorchidjewels/shipping/verify-address",
      expect.anything()
    );
  });

  test("verified result immediately requests shipping rates", async () => {
    mockApiPost.mockImplementation((url) => {
      if (String(url).includes("/shipping/verify-address")) {
        return Promise.resolve({
          data: {
            status: "verified",
            verification_token: "verify-token",
            accepted_address: {
              address1: "123 Main St",
              address2: "",
              city: "Toronto",
              region: "ON",
              postal_code: "M5H 2N2",
              country: "CA",
            },
            messages: [],
          },
        });
      }
      if (String(url).includes("/shipping/rates")) {
        return Promise.resolve({
          data: {
            available: true,
            fallback_manual: false,
            rates: [{ rate_id: "rate_1", amount: 12.5, currency: "CAD", carrier: "Carrier", service: "Ground" }],
            default_rate_id: "rate_1",
          },
        });
      }
      return Promise.resolve({ data: {} });
    });

    renderCheckout();
    await fillShippingAddress();
    fireEvent.click(await screen.findByRole("button", { name: /verify address & view shipping options/i }));

    await waitFor(() =>
      expect(mockApiPost).toHaveBeenCalledWith(
        "/public/vandaorchidjewels/shipping/verify-address",
        expect.objectContaining({ shipping: expect.any(Object) })
      )
    );
    await waitFor(() =>
      expect(mockApiPost).toHaveBeenCalledWith(
        "/public/vandaorchidjewels/shipping/rates",
        expect.objectContaining({ shipping_address_verification_token: "verify-token" })
      )
    );
    expect(await screen.findByText(/carrier ground/i)).toBeInTheDocument();
  });

  test("corrected result shows choices and suggested acceptance triggers rates", async () => {
    mockApiPost.mockImplementation((url) => {
      if (String(url).includes("/shipping/verify-address")) {
        return Promise.resolve({
          data: {
            status: "corrected",
            verification_token: "verify-token",
            original_address: {
              address1: "123 Main St",
              city: "Toronto",
              region: "ON",
              postal_code: "M5H 2N2",
              country: "CA",
            },
            suggested_address: {
              address1: "500 Queen St",
              city: "Toronto",
              region: "ON",
              postal_code: "M5V 2B6",
              country: "CA",
            },
            differences: ["address1", "postal_code"],
            messages: ["We found a suggested version of your address."],
          },
        });
      }
      if (String(url).includes("/shipping/accept-address")) {
        return Promise.resolve({
          data: {
            status: "corrected",
            verification_token: "accepted-token",
            accepted_address: {
              address1: "500 Queen St",
              city: "Toronto",
              region: "ON",
              postal_code: "M5V 2B6",
              country: "CA",
            },
            messages: ["We found a suggested version of your address."],
          },
        });
      }
      if (String(url).includes("/shipping/rates")) {
        return Promise.resolve({
          data: {
            available: true,
            fallback_manual: false,
            rates: [{ rate_id: "rate_1", amount: 12.5, currency: "CAD", carrier: "Carrier", service: "Ground" }],
            default_rate_id: "rate_1",
          },
        });
      }
      return Promise.resolve({ data: {} });
    });

    renderCheckout();
    await fillShippingAddress();
    fireEvent.click(await screen.findByRole("button", { name: /verify address & view shipping options/i }));

    expect(await screen.findByRole("heading", { name: /suggested address/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /use suggested address/i }));

    await waitFor(() =>
      expect(mockApiPost).toHaveBeenCalledWith(
        "/public/vandaorchidjewels/shipping/accept-address",
        { verification_token: "verify-token", choice: "suggested" }
      )
    );
    await waitFor(() =>
      expect(mockApiPost).toHaveBeenCalledWith(
        "/public/vandaorchidjewels/shipping/rates",
        expect.objectContaining({ shipping_address_verification_token: "accepted-token" })
      )
    );
  });

  test("verification-disabled tenants retain the direct rates path", async () => {
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
            rates: [{ rate_id: "rate_1", amount: 12.5, currency: "CAD", carrier: "Carrier", service: "Ground" }],
            default_rate_id: "rate_1",
          },
        });
      }
      return Promise.resolve({ data: {} });
    });

    renderCheckout();
    await fillShippingAddress({ expectVerification: false });

    await waitFor(() =>
      expect(mockApiPost).toHaveBeenCalledWith(
        "/public/vandaorchidjewels/shipping/rates",
        expect.not.objectContaining({ shipping_address_verification_token: expect.anything() })
      )
    );
    expect(screen.queryByRole("button", { name: /verify address & view shipping options/i })).not.toBeInTheDocument();
  });
});
