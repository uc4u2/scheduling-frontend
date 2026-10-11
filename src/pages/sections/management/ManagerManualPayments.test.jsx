import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import ManagerManualPayments from "./ManagerManualPayments";
import { api } from "../../../utils/api";

jest.mock("../../../utils/api", () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

describe("ManagerManualPayments refund retries", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    api.get.mockImplementation((url) => {
      if (url === "/booking/clients") return Promise.resolve({ data: [] });
      if (url === "/api/manager/manual-payments") {
        return Promise.resolve({
          data: {
            items: [
              {
                id: 91,
                status: "paid",
                amount: 100,
                currency: "CAD",
                client_name: "Casey Client",
                created_at: "2026-10-11T10:00:00",
              },
            ],
          },
        });
      }
      return Promise.resolve({ data: {} });
    });
  });

  it("keeps one operation key across a failed retry and requests the remaining balance", async () => {
    api.post
      .mockRejectedValueOnce({ response: { data: { error: "Temporary provider error" } } })
      .mockResolvedValueOnce({ data: { message: "Refund processed." } });

    render(<ManagerManualPayments />);
    const refundButton = await screen.findByRole("button", { name: "Refund" });
    fireEvent.click(refundButton);
    expect(
      screen.getByText(/Leave blank to refund the remaining refundable balance/i)
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Issue refund" }));
    await screen.findByText("Temporary provider error");
    fireEvent.click(screen.getByRole("button", { name: "Issue refund" }));

    await waitFor(() => expect(api.post).toHaveBeenCalledTimes(2));
    const [firstUrl, firstPayload] = api.post.mock.calls[0];
    const [secondUrl, secondPayload] = api.post.mock.calls[1];
    expect(firstUrl).toBe("/api/manager/manual-payments/91/refund");
    expect(secondUrl).toBe(firstUrl);
    expect(firstPayload.refund_remaining).toBe(true);
    expect(firstPayload.idempotency_key).toMatch(/^manual-refund:/);
    expect(secondPayload.idempotency_key).toBe(firstPayload.idempotency_key);
  });
});
