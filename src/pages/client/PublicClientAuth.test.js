import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import PublicClientAuth from "./PublicClientAuth";
import { api } from "../../utils/api";

jest.mock("../../utils/api", () => ({
  api: { post: jest.fn() },
}));

jest.mock("../../utils/tenant", () => ({
  getTenantHostMode: () => "platform",
}));

jest.mock("../../utils/timezone", () => ({
  formatTimezoneLabel: () => "Toronto (America/Toronto)",
  getUserTimezone: () => "America/Toronto",
}));

jest.mock("../../components/TimezoneSelect", () => () => null);
jest.mock("../../components/Meta", () => () => null);
jest.mock("../../config/origins", () => ({
  buildMarketingLegalUrl: (path) => `https://schedulaa.com${path}`,
}));

describe("PublicClientAuth", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("keeps autofilled login values clear of their field labels", () => {
    render(<PublicClientAuth slug="web-design" />);

    const email = screen.getByLabelText(/^Email/);
    const password = screen.getByLabelText(/^Password/);
    const emailLabel = screen.getByText(/^Email/, { selector: "label" });
    const passwordLabel = screen.getByText(/^Password/, { selector: "label" });

    expect(email).toHaveAttribute("autocomplete", "email");
    expect(password).toHaveAttribute("autocomplete", "current-password");
    expect(emailLabel).toHaveClass("MuiInputLabel-shrink");
    expect(passwordLabel).toHaveClass("MuiInputLabel-shrink");
  });

  it("presents a clear sign-in experience with accessible password visibility", () => {
    render(<PublicClientAuth slug="web-design" />);

    expect(screen.getByRole("heading", { name: "Welcome back" })).toBeInTheDocument();
    expect(screen.getByText("Your appointments, organized.")).toBeInTheDocument();

    const password = screen.getByLabelText(/^Password/);
    expect(password).toHaveAttribute("type", "password");
    fireEvent.click(screen.getByRole("button", { name: "Show password" }));
    expect(password).toHaveAttribute("type", "text");
    expect(screen.getByRole("button", { name: "Hide password" })).toBeInTheDocument();
  });

  it("submits the login form from its primary action without changing auth semantics", async () => {
    api.post.mockRejectedValueOnce({ response: { data: { error: "Invalid login" } } });
    render(<PublicClientAuth slug="web-design" />);

    fireEvent.change(screen.getByLabelText(/^Email/), { target: { value: "client@example.com" } });
    fireEvent.change(screen.getByLabelText(/^Password/), { target: { value: "secret" } });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => expect(api.post).toHaveBeenCalledWith(
      "/login",
      expect.objectContaining({
        email: "client@example.com",
        password: "secret",
        role: "client",
        company_slug: "web-design",
      }),
      { noAuth: true, noCompanyHeader: true }
    ));
    expect(await screen.findByRole("alert")).toHaveTextContent("Invalid login");
  });

  it("switches to the responsive account creation form", () => {
    render(<PublicClientAuth slug="web-design" />);

    fireEvent.click(screen.getByRole("tab", { name: "Create account" }));

    expect(screen.getByRole("heading", { name: "Create your account" })).toBeInTheDocument();
    expect(screen.getByLabelText(/^First name/)).toHaveAttribute("autocomplete", "given-name");
    expect(screen.getByLabelText(/^Last name/)).toHaveAttribute("autocomplete", "family-name");
    expect(screen.getByLabelText(/^Confirm password/)).toHaveAttribute("autocomplete", "new-password");
  });
});
