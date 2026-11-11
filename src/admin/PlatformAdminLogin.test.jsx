import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import PlatformAdminLogin from "./PlatformAdminLogin";
import platformAdminApi from "../api/platformAdminApi";

jest.mock("../api/platformAdminApi", () => ({
  __esModule: true,
  default: { post: jest.fn() },
}));

const mockNavigate = jest.fn();

jest.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}), { virtual: true });

describe("PlatformAdminLogin", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it("does not store an admin token until the emailed code is verified", async () => {
    platformAdminApi.post
      .mockResolvedValueOnce({ data: { mfa_required: true, challenge_id: "challenge-1" } })
      .mockResolvedValueOnce({ data: { token: "verified-token" } });

    render(<PlatformAdminLogin />);

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "admin@example.test" } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "Synthetic!Password1" } });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    await screen.findByLabelText(/email sign-in code/i);
    expect(localStorage.getItem("platformAdminToken")).toBeNull();
    expect(mockNavigate).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText(/email sign-in code/i), { target: { value: "123456" } });
    fireEvent.click(screen.getByRole("button", { name: "Verify code" }));

    await waitFor(() => expect(localStorage.getItem("platformAdminToken")).toBe("verified-token"));
    expect(mockNavigate).toHaveBeenCalledWith("/admin/search");
  });
});
