import React from "react";
import { render, screen, waitFor } from "@testing-library/react";

import PlatformAdminShell from "./PlatformAdminShell";

const mockGet = jest.fn();
const mockNavigate = jest.fn();

jest.mock("react-router-dom", () => ({
  Outlet: () => <div>Search page</div>,
  useLocation: () => ({ pathname: "/admin/search" }),
  useNavigate: () => mockNavigate,
}), { virtual: true });

jest.mock("../api/platformAdminApi", () => ({
  __esModule: true,
  default: {
    get: (...args) => mockGet(...args),
  },
}));

jest.mock("../components/HelpDialog", () => () => null);

const renderShell = () => render(<PlatformAdminShell />);

describe("PlatformAdminShell transactional email health", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.setItem("platformAdminToken", "platform-token");
  });

  it("shows a safe actionable alert for a provider incident", async () => {
    mockGet.mockImplementation((path) => {
      if (path === "/auth/me") {
        return Promise.resolve({ data: { email: "operator@example.com", role: "platform_admin" } });
      }
      if (path === "/operations/transactional-email-health") {
        return Promise.resolve({
          data: {
            operational_alert: {
              code: "provider_quota_exhausted",
              severity: "critical",
              title: "Transactional email credits exhausted",
              message: "SendGrid rejected transactional email because credits are exhausted.",
              action: "Restore SendGrid credits, then verify delivery.",
              latest_at: "2026-09-05T17:00:00",
            },
          },
        });
      }
      return Promise.reject(new Error(`Unexpected path: ${path}`));
    });

    renderShell();

    expect(await screen.findByText("Transactional email credits exhausted")).toBeInTheDocument();
    expect(screen.getByText(/Restore SendGrid credits/)).toBeInTheDocument();
    await waitFor(() => expect(mockGet).toHaveBeenCalledWith("/operations/transactional-email-health"));
  });

  it("does not show an alert when transactional email is healthy", async () => {
    mockGet.mockImplementation((path) => Promise.resolve({
      data: path === "/auth/me"
        ? { email: "operator@example.com", role: "platform_admin" }
        : { operational_status: "healthy", operational_alert: null },
    }));

    renderShell();

    expect(await screen.findByText("Search page")).toBeInTheDocument();
    await waitFor(() => expect(mockGet).toHaveBeenCalledWith("/operations/transactional-email-health"));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
