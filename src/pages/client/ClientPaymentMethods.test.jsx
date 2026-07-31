import React from "react";
import { render, screen, waitFor } from "@testing-library/react";

import ClientPaymentMethods from "./ClientPaymentMethods";

const mockApiGet = jest.fn();

jest.mock("react-router-dom", () => ({
  useLocation: () => ({ search: "" }),
  useParams: () => ({ slug: "tenant" }),
}), { virtual: true });

jest.mock("../../utils/api", () => ({
  __esModule: true,
  default: {
    get: (...args) => mockApiGet(...args),
  },
}));

jest.mock("../../utils/clientTenant", () => ({
  persistTenantSlug: jest.fn(),
  resolveTenantSlug: () => "tenant",
}));

describe("ClientPaymentMethods", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.localStorage.clear();
  });

  test("loads authenticated card summaries without email enumeration params", async () => {
    window.localStorage.setItem("token", "jwt-token");
    mockApiGet.mockResolvedValue({ data: { payment_methods: [], card_on_file: { card_status: "no_card" } } });

    render(<ClientPaymentMethods />);

    await waitFor(() => expect(mockApiGet).toHaveBeenCalled());
    expect(mockApiGet).toHaveBeenCalledWith(
      "/public/tenant/me/payment-methods",
      { headers: { Authorization: "Bearer jwt-token" } },
    );
  });

  test("renders verified and expiring card statuses from the safe summary payload", async () => {
    window.localStorage.setItem("token", "jwt-token");
    mockApiGet.mockResolvedValue({
      data: {
        payment_methods: [
          {
            id: "pm_1",
            brand: "visa",
            last4: "4242",
            exp_month: 8,
            exp_year: 2026,
            expired: false,
            is_default: true,
            card_status: "expiring_soon",
            status_label: "Expiring soon",
          },
        ],
        card_on_file: {
          card_status: "expiring_soon",
          status_label: "Expiring soon",
        },
      },
    });

    render(<ClientPaymentMethods />);

    expect(await screen.findByText(/VISA •••• 4242 — Expiring soon/i)).toBeInTheDocument();
    expect(screen.getByText(/visa •••• 4242 expires soon/i)).toBeInTheDocument();
    expect(
      screen.getByText(/a verified saved card can still be declined by the card issuer during a future charge/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/ask the business to send you a secure update link/i),
    ).toBeInTheDocument();
  });

  test("shows provider unavailable when no safe card details can be returned", async () => {
    window.localStorage.setItem("token", "jwt-token");
    mockApiGet.mockResolvedValue({
      data: {
        payment_methods: [],
        card_on_file: {
          card_status: "provider_unavailable",
          status_label: "Provider unavailable",
        },
      },
    });

    render(<ClientPaymentMethods />);

    expect(
      await screen.findByText(/card details are temporarily unavailable\. try again later\./i),
    ).toBeInTheDocument();
  });
});
