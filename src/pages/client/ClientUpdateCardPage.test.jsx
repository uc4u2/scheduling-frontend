import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import ClientUpdateCardPage from "./ClientUpdateCardPage";

const mockApiGet = jest.fn();
const mockApiPost = jest.fn();

jest.mock("react-router-dom", () => ({
  useParams: () => ({ token: "secure-token" }),
  useSearchParams: () => [new URLSearchParams("site=sale")],
}), { virtual: true });

jest.mock("../../utils/api", () => ({
  __esModule: true,
  default: {
    get: (...args) => mockApiGet(...args),
    post: (...args) => mockApiPost(...args),
  },
}));

describe("ClientUpdateCardPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete window.location;
    window.location = { assign: jest.fn() };
  });

  test("loads the secure update request and launches Stripe checkout", async () => {
    mockApiGet.mockResolvedValue({
      data: {
        request: {
          status: "pending",
          expires_at: "2026-08-03T12:00:00Z",
        },
        company: { name: "Sale Co", slug: "sale" },
        client: { email: "jamie@example.com" },
        card_on_file: { status_label: "Update required", card_status: "update_required" },
      },
    });
    mockApiPost.mockResolvedValue({
      data: {
        id: "cs_update",
        url: "https://checkout.stripe.com/c/pay/cs_update",
      },
    });

    render(<ClientUpdateCardPage />);

    expect(await screen.findByText(/update saved card/i)).toBeInTheDocument();
    const launchButton = await screen.findByRole("button", { name: /update card securely/i });
    fireEvent.click(launchButton);

    await waitFor(() =>
      expect(mockApiPost).toHaveBeenCalledWith(
        "/public/sale/card-on-file/update-request/secure-token/checkout/session",
        {},
        { noAuth: true, noCompanyHeader: true },
      )
    );
    expect(window.location.assign).toHaveBeenCalledWith("https://checkout.stripe.com/c/pay/cs_update");
  });
});
