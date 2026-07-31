import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import ClientUpdateCardPage from "./ClientUpdateCardPage";

const mockApiGet = jest.fn();
const mockApiPost = jest.fn();
const mockUseSearchParams = jest.fn();

jest.mock("react-router-dom", () => ({
  useParams: () => ({ token: "secure-token" }),
  useSearchParams: () => mockUseSearchParams(),
}), { virtual: true });

jest.mock("../../utils/api", () => ({
  __esModule: true,
  default: {
    get: (...args) => mockApiGet(...args),
    post: (...args) => mockApiPost(...args),
  },
}));

const basePayload = {
  request: {
    status: "pending",
    expires_at: "2026-08-03T12:00:00Z",
    consent: {
      required: true,
      policy_text: "Free cancellation up to 24 hours before your appointment.",
    },
  },
  company: { name: "Sale Co" },
  client: { masked_email: "j***@example.com" },
  card_on_file: { status_label: "Update required", card_status: "update_required" },
};

describe("ClientUpdateCardPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSearchParams.mockReturnValue([new URLSearchParams("site=sale")]);
    delete window.location;
    window.location = { assign: jest.fn() };
  });

  test("requires explicit consent before launching Stripe checkout", async () => {
    mockApiGet.mockResolvedValue({ data: basePayload });
    mockApiPost.mockResolvedValue({
      data: {
        id: "cs_update",
        url: "https://checkout.stripe.com/c/pay/cs_update",
      },
    });

    render(<ClientUpdateCardPage />);

    expect(await screen.findByText(/update saved card/i)).toBeInTheDocument();
    expect(await screen.findByText(/j\*\*\*@example.com/i)).toBeInTheDocument();
    const launchButton = await screen.findByRole("button", { name: /update card securely/i });
    expect(launchButton).toBeDisabled();

    fireEvent.click(screen.getByRole("checkbox", { name: /authorize saved-card update/i }));
    await waitFor(() => expect(launchButton).not.toBeDisabled());
    fireEvent.click(launchButton);

    await waitFor(() =>
      expect(mockApiPost).toHaveBeenCalledWith(
        "/public/sale/card-on-file/update-request/secure-token/checkout/session",
        { card_on_file_consent: { accepted: true } },
        { noAuth: true, noCompanyHeader: true },
      )
    );
    expect(window.location.assign).toHaveBeenCalledWith("https://checkout.stripe.com/c/pay/cs_update");
    expect(screen.queryByText(/secure-token/i)).not.toBeInTheDocument();
  });

  test("shows canceled notice but still allows retry", async () => {
    mockUseSearchParams.mockReturnValue([new URLSearchParams("site=sale&canceled=1")]);
    mockApiGet.mockResolvedValue({ data: basePayload });

    render(<ClientUpdateCardPage />);

    expect(await screen.findByText(/card update was not completed/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /update card securely/i })).toBeDisabled();
    fireEvent.click(screen.getByRole("checkbox", { name: /authorize saved-card update/i }));
    expect(screen.getByRole("button", { name: /update card securely/i })).not.toBeDisabled();
  });
});
