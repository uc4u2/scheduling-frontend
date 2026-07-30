import React from "react";
import { render, waitFor } from "@testing-library/react";

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
    mockApiGet.mockResolvedValue({ data: { payment_methods: [] } });

    render(<ClientPaymentMethods />);

    await waitFor(() => expect(mockApiGet).toHaveBeenCalled());
    expect(mockApiGet).toHaveBeenCalledWith(
      "/public/tenant/me/payment-methods",
      { headers: { Authorization: "Bearer jwt-token" } },
    );
  });
});
