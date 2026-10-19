import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import PublicClientAuth, { resolveClientAuthCompletionPath } from "./PublicClientAuth";
import { api } from "../../utils/api";
import { CLIENT_SESSION_STATE_EVENT } from "../../utils/clientSession";

jest.mock("../../utils/api", () => ({
  api: { post: jest.fn(), get: jest.fn() },
}));

const unsignedJwt = (payload) => {
  const encode = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");
  return `${encode({ alg: "none", typ: "JWT" })}.${encode(payload)}.sig`;
};

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
    localStorage.clear();
    window.history.replaceState({}, "", "/login");
  });

  it("keeps autofilled values separate from accessible field labels", () => {
    render(<PublicClientAuth slug="web-design" />);

    const email = screen.getByLabelText(/^Email/);
    const password = screen.getByLabelText(/^Password/);
    const emailLabel = screen.getByText(/^Email/, { selector: "label" });
    const passwordLabel = screen.getByText(/^Password/, { selector: "label" });

    expect(email).toHaveAttribute("autocomplete", "email");
    expect(password).toHaveAttribute("autocomplete", "current-password");
    expect(emailLabel).toHaveAttribute("for", email.id);
    expect(passwordLabel).toHaveAttribute("for", password.id);
    expect(emailLabel).not.toHaveClass("MuiInputLabel-root");
    expect(passwordLabel).not.toHaveClass("MuiInputLabel-root");
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

  it("announces an existing same-tenant session and opens My Bookings instead of another login form", async () => {
    const assign = jest.fn();
    const originalLocation = window.location;
    const sessionListener = jest.fn();
    localStorage.setItem("token", unsignedJwt({ role: "client", identity: "client:9" }));
    localStorage.setItem("role", "client");
    localStorage.setItem("site", "web-design");
    api.get.mockResolvedValue({
      data: { id: 9, email: "ada@example.com", full_name: "Ada Client" },
    });
    window.addEventListener(CLIENT_SESSION_STATE_EVENT, sessionListener);
    delete window.location;
    window.location = {
      ...originalLocation,
      pathname: "/login",
      search: "?site=web-design",
      assign,
    };

    try {
      render(<PublicClientAuth slug="web-design" />);

      await waitFor(() => expect(assign).toHaveBeenCalledWith("/dashboard?site=web-design"));
      expect(sessionListener).toHaveBeenCalledWith(expect.objectContaining({
        detail: expect.objectContaining({
          signedIn: true,
          reason: "existing-client-session",
          tenantSlug: "web-design",
        }),
      }));
    } finally {
      window.removeEventListener(CLIENT_SESSION_STATE_EVENT, sessionListener);
      window.location = originalLocation;
    }
  });

  it("does not present a client session from another tenant as signed in", async () => {
    const assign = jest.fn();
    const originalLocation = window.location;
    const token = unsignedJwt({ role: "client", identity: "client:9" });
    localStorage.setItem("token", token);
    localStorage.setItem("role", "client");
    localStorage.setItem("site", "other-tenant");
    api.get.mockRejectedValue({ response: { status: 404, data: { error: "Client not found" } } });
    delete window.location;
    window.location = {
      ...originalLocation,
      pathname: "/login",
      search: "?site=web-design",
      assign,
    };

    try {
      render(<PublicClientAuth slug="web-design" />);

      await waitFor(() => expect(api.get).toHaveBeenCalledWith("/me", expect.objectContaining({
        params: { slug: "web-design" },
        noCompanyHeader: true,
      })));
      expect(assign).not.toHaveBeenCalled();
      expect(localStorage.getItem("token")).toBe(token);
      expect(screen.getByRole("heading", { name: "Welcome back" })).toBeInTheDocument();
    } finally {
      window.location = originalLocation;
    }
  });

  it("keeps manager, missing-role, expired, and logged-out sessions on the client login form", async () => {
    const assign = jest.fn();
    const originalLocation = window.location;
    delete window.location;
    window.location = { ...originalLocation, pathname: "/login", search: "?site=web-design", assign };

    const expectLoginForm = async () => {
      expect(await screen.findByRole("heading", { name: "Welcome back" })).toBeInTheDocument();
      expect(assign).not.toHaveBeenCalled();
    };

    try {
      localStorage.setItem("token", unsignedJwt({ role: "manager", sub: "manager@example.com" }));
      localStorage.setItem("role", "manager");
      const manager = render(<PublicClientAuth slug="web-design" />);
      await expectLoginForm();
      expect(api.get).not.toHaveBeenCalled();
      manager.unmount();

      localStorage.clear();
      localStorage.setItem("token", unsignedJwt({ sub: "person@example.com" }));
      const missingRole = render(<PublicClientAuth slug="web-design" />);
      await expectLoginForm();
      expect(api.get).not.toHaveBeenCalled();
      missingRole.unmount();

      const expiredToken = unsignedJwt({ role: "client", identity: "client:3" });
      localStorage.setItem("token", expiredToken);
      localStorage.setItem("role", "client");
      api.get.mockRejectedValue({ response: { status: 401, data: { code: "TOKEN_EXPIRED" } } });
      const expired = render(<PublicClientAuth slug="web-design" />);
      await waitFor(() => expect(localStorage.getItem("token")).toBeNull());
      await expectLoginForm();
      expired.unmount();

      localStorage.clear();
      api.get.mockClear();
      render(<PublicClientAuth slug="web-design" />);
      await expectLoginForm();
      expect(api.get).not.toHaveBeenCalled();
    } finally {
      window.location = originalLocation;
    }
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

  it("returns only to a validated internal package path after authentication", () => {
    expect(resolveClientAuthCompletionPath({
      returnTo: "/packages/return?session_id=cs_test_1&site=web-design&embed=1",
      embedded: true,
      slug: "web-design",
    })).toBe("/packages/return?session_id=cs_test_1&site=web-design&embed=1");
    expect(resolveClientAuthCompletionPath({
      returnTo: "https://evil.example/packages/return?session_id=cs_test_1",
      embedded: true,
      slug: "web-design",
    })).toContain("/dashboard?");
  });

  it("returns to a validated tenant order destination after authentication", () => {
    expect(resolveClientAuthCompletionPath({
      returnTo: "/web-design/my-bookings?view=orders&order_id=81",
      embedded: true,
      slug: "web-design",
    })).toBe("/web-design/my-bookings?view=orders&order_id=81");
    expect(resolveClientAuthCompletionPath({
      returnTo: "/other/my-bookings?view=orders&order_id=81",
      embedded: true,
      slug: "web-design",
    })).not.toBe("/other/my-bookings?view=orders&order_id=81");
  });

  it("resumes the same package checkout from a validated login continuation", async () => {
    const continuation = "/web-design/packages/return?session_id=cs_resume_1&site=web-design";
    const assign = jest.fn();
    const originalLocation = window.location;
    delete window.location;
    window.location = {
      ...originalLocation,
      search: `?site=web-design&return_to=${encodeURIComponent(continuation)}`,
      assign,
    };
    api.post.mockResolvedValueOnce({ data: { access_token: "fresh-token" } });

    render(<PublicClientAuth slug="web-design" />);
    fireEvent.change(screen.getByLabelText(/^Email/), { target: { value: "client@example.com" } });
    fireEvent.change(screen.getByLabelText(/^Password/), { target: { value: "secret" } });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => expect(assign).toHaveBeenCalledWith(continuation));
    expect(localStorage.getItem("token")).toBe("fresh-token");
    expect(localStorage.getItem("role")).toBe("client");
  });

  it("resumes the same tenant order from a validated login continuation", async () => {
    const continuation = "/web-design/my-bookings?view=orders&order_id=87";
    const assign = jest.fn();
    const originalLocation = window.location;
    delete window.location;
    window.location = {
      ...originalLocation,
      search: `?site=web-design&return_to=${encodeURIComponent(continuation)}`,
      assign,
    };
    api.post.mockResolvedValueOnce({ data: { access_token: "fresh-order-token" } });

    render(<PublicClientAuth slug="web-design" />);
    fireEvent.change(screen.getByLabelText(/^Email/), { target: { value: "client@example.com" } });
    fireEvent.change(screen.getByLabelText(/^Password/), { target: { value: "secret" } });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => expect(assign).toHaveBeenCalledWith(continuation));
  });
});
