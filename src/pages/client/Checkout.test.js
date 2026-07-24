import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { CheckoutFormCore } from "./Checkout";

const mockStartHostedCheckout = jest.fn();
const mockReleasePendingCheckout = jest.fn();
const mockLoadCart = jest.fn();
const mockSaveCart = jest.fn();
const mockApiGet = jest.fn();
const mockNavigate = jest.fn();

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
    post: jest.fn(),
  },
  default: {
    get: (...args) => mockApiGet(...args),
    post: jest.fn(),
  },
  publicSite: {
    getWebsiteShell: jest.fn(),
  },
}));

jest.mock("../../utils/hostedCheckout", () => ({
  buildHostedCheckoutPayload: jest.fn(() => ({ items: [{ id: "svc-1" }] })),
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
    mockStartHostedCheckout.mockImplementation(() => new Promise(() => {}));
    mockReleasePendingCheckout.mockResolvedValue({});
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
});
