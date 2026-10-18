import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import SettingsAiAssistants from "../SettingsAiAssistants";

const mockStatus = jest.fn();
const mockActivity = jest.fn();

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (_key, fallback) => fallback || _key,
  }),
}));

jest.mock("../../../utils/api", () => ({
  tenantAssistant: {
    status: (...args) => mockStatus(...args),
    activity: (...args) => mockActivity(...args),
    disconnect: jest.fn(),
    protocolTest: jest.fn(),
  },
}));

describe("SettingsAiAssistants", () => {
  beforeEach(() => {
    mockStatus.mockReset();
    mockActivity.mockReset();
  });

  test("stays closed when the server says the feature is off", async () => {
    mockStatus.mockResolvedValue({ enabled: false });
    render(<SettingsAiAssistants />);
    expect(await screen.findByText(/not available for this account/i)).toBeTruthy();
    expect(screen.queryByText(/Connector URL/i)).toBeNull();
  });

  test("stays closed when an older backend has no route", async () => {
    mockStatus.mockRejectedValue({ response: { status: 404 } });
    render(<SettingsAiAssistants />);
    expect(await screen.findByText(/not available for this account/i)).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Disconnect/i })).toBeNull();
  });

  test("shows the one business and does not treat a local check as provider verification", async () => {
    mockStatus.mockResolvedValue({
      enabled: true,
      eligible: true,
      account: { id: 1, display_name: "Ada Owner" },
      business: { id: 4, name: "Salon", timezone: "America/Toronto" },
      permissions: { is_manager: true, is_owner: true, can_manage_integrations: true },
      scopes_offered: [{ scope: "customers.read", description: "Find customers and view their name" }],
      access_profiles: [
        { key: "read_only", name: "Read-only access", summary: "Read customer names.", requires_reauthorization: false },
        { key: "manager", name: "Manager access", summary: "Request supported manager actions.", requires_reauthorization: true },
      ],
      providers: [
        {
          key: "grok_custom_mcp",
          name: "Grok.com Custom MCP",
          support: "partially_verified",
          summary: "Documented connector.",
        },
      ],
      connections: [
        {
          id: "tcn_123",
          state: "authorized",
          verified: false,
          provider_verified: false,
          reported_client_name: "Example assistant",
          reported_client_name_verified: false,
          account_display_name: "Ada Owner",
          business_name: "Salon",
          owned_by_self: true,
          scopes: ["assistant.whoami", "customers.read"],
          last_successful_assistant_request_at: null,
          local_protocol_checked_at: "2026-10-17T00:00:00Z",
        },
      ],
      mcp_url: "https://example.test/mcp/tenant",
    });
    mockActivity.mockResolvedValue({ items: [] });
    render(<SettingsAiAssistants />);
    expect(await screen.findByText(/Business to connect/i)).toBeTruthy();
    expect(screen.getAllByText(/Salon/).length).toBeGreaterThan(0);
    expect(screen.getByText(/not yet verified/i)).toBeTruthy();
    expect(screen.getByText(/not provider verification/i)).toBeTruthy();
    expect(screen.getByText("Manager access")).toBeTruthy();
    expect(screen.getByText(/New authorization required/i)).toBeTruthy();
    expect(screen.getByText(/Effective permissions/i)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Manage access" }));
    expect(await screen.findByText(/Schedulaa cannot add scopes to its existing tokens/i)).toBeTruthy();
    await waitFor(() => expect(mockActivity).toHaveBeenCalled());
  });

  test("hides connect details for an employee", async () => {
    mockStatus.mockResolvedValue({
      enabled: true,
      eligible: false,
      eligibility_reason: "not_manager",
      permissions: { is_manager: false, is_owner: false, can_manage_integrations: true },
      connections: [],
      mcp_url: null,
    });
    render(<SettingsAiAssistants />);
    expect(await screen.findByText(/Nothing has been connected/i)).toBeTruthy();
    expect(screen.queryByText(/Connector URL/i)).toBeNull();
  });

  test("keeps connector details closed when OAuth issuer configuration is missing", async () => {
    mockStatus.mockResolvedValue({
      enabled: true,
      eligible: true,
      configuration_error: "issuer_unconfigured",
      account: { id: 1, display_name: "Ada Owner" },
      business: { id: 4, name: "Salon", timezone: "America/Toronto" },
      permissions: { is_manager: true, is_owner: true, can_manage_integrations: true },
      connections: [],
      mcp_url: null,
    });
    render(<SettingsAiAssistants />);
    expect(await screen.findByText(/not configured on this Schedulaa deployment/i)).toBeTruthy();
    expect(screen.queryByText(/Connector URL/i)).toBeNull();
    expect(mockActivity).not.toHaveBeenCalled();
  });

  test("links to human approval when an assistant action is waiting", async () => {
    mockStatus.mockResolvedValue({
      enabled: true,
      eligible: true,
      account: { id: 1, display_name: "Ada Owner" },
      business: { id: 4, name: "Salon", timezone: "America/Toronto" },
      permissions: { is_manager: true, is_owner: true, can_manage_integrations: true },
      scopes_offered: [],
      providers: [],
      connections: [],
      pending_approval_count: 1,
      mcp_url: "https://example.test/mcp/tenant",
    });
    mockActivity.mockResolvedValue({ items: [] });
    render(<SettingsAiAssistants />);
    const link = await screen.findByRole("link", { name: /waiting for you/i });
    expect(link.getAttribute("href")).toBe("/manager/ai-assistant-approvals");
  });
});
