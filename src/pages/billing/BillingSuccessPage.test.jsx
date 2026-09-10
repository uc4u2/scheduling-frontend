import React from "react";
import { render, screen, waitFor } from "@testing-library/react";

import BillingSuccessPage from "./BillingSuccessPage";

const mockApiGet = jest.fn();
const mockApiPost = jest.fn();
const mockNavigate = jest.fn();

jest.mock("../../utils/api", () => ({
  __esModule: true,
  default: {
    get: (...args) => mockApiGet(...args),
    post: (...args) => mockApiPost(...args),
  },
}));

jest.mock("../../utils/mobileCompliance", () => ({
  isMobileComplianceMode: () => false,
}));

jest.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
  useSearchParams: () => [new URLSearchParams("sid=%7BCHECKOUT_SESSION_ID%7D")],
}), { virtual: true });

describe("BillingSuccessPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockApiPost.mockResolvedValue({ data: { ok: true } });
    mockApiGet.mockResolvedValue({
      data: { status: "active", plan_key: "starter" },
    });
  });

  it("recovers an unresolved Stripe placeholder without requesting it as a session id", async () => {
    render(<BillingSuccessPage />);

    expect(screen.getByText("Activating subscription…")).toBeInTheDocument();
    await waitFor(() => {
      expect(mockApiPost).toHaveBeenCalledWith("/billing/sync-from-stripe");
    });
    expect(mockApiGet).not.toHaveBeenCalledWith(
      expect.stringContaining("/billing/checkout-status")
    );
  });
});
