import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { ThemeProvider, createTheme } from "@mui/material/styles";

import AICommerceCopilotMonetizationPage from "./AICommerceCopilotMonetizationPage";

const mockGet = jest.fn();
const mockPost = jest.fn();

jest.mock("../../api/platformAdminApi", () => ({
  __esModule: true,
  default: {
    get: (...args) => mockGet(...args),
    post: (...args) => mockPost(...args),
  },
}));

const payload = {
  commerce_copilot_tenant_access_enabled: true,
  commerce_copilot_write_actions_enabled: true,
  paid_addon_enforcement_enabled: false,
  monetization_mode: "free_launch",
  configuration: {
    ready: false,
    price_configured: false,
    price_recurring: false,
    stripe_secret_configured: false,
    webhook_secret_configured: false,
    allowance_configured: true,
    monthly_action_allowance: 100,
    stripe_mode: "test",
    warnings: ["Trusted Stripe Price ID is not configured."],
  },
  runtime: {
    deployment_master_enabled: true,
    deployment_write_enabled: true,
    platform_tenant_access_enabled: true,
    platform_write_actions_enabled: true,
    openai_configured: true,
    model_name: "gpt-4.1-mini",
    provider_ready: true,
    readiness: "ready",
    blockers: [],
  },
  counts: {
    active_addon_tenants: 0,
    grace_tenants: 0,
    locked_tenants: 0,
  },
  last_toggle: {
    enabled_at: null,
    disabled_at: null,
  },
};

const renderPage = () =>
  render(
    <ThemeProvider theme={createTheme()}>
      <AICommerceCopilotMonetizationPage />
    </ThemeProvider>
  );

describe("AICommerceCopilotMonetizationPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGet.mockResolvedValue({ data: payload });
    mockPost.mockResolvedValue({ data: payload });
    window.confirm = jest.fn(() => true);
  });

  it("shows runtime controls and free launch copy", async () => {
    renderPage();
    expect(await screen.findByText(/AI Commerce Copilot Monetization/i)).toBeInTheDocument();
    await waitFor(() => expect(mockGet).toHaveBeenCalled());
    expect(screen.getByText(/Commerce Copilot runtime/i)).toBeInTheDocument();
    expect(screen.getByText(/OFF — Free launch/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Available to tenants/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Allow approved safe changes/i })).toBeInTheDocument();
    expect(screen.getByText(/Check Copilot readiness/i)).toBeInTheDocument();
  });
});
