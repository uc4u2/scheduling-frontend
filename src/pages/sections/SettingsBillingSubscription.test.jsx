import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ThemeProvider, createTheme } from "@mui/material/styles";

import SettingsBillingSubscription from "./SettingsBillingSubscription";

const mockRefetch = jest.fn();
const mockApiGet = jest.fn();
const mockApiPost = jest.fn();
const mockOpenBillingPortal = jest.fn(() => Promise.resolve());
const mockNavigate = jest.fn();

let mockBillingState;

jest.mock("../../components/billing/useBillingStatus", () => ({
  __esModule: true,
  default: () => mockBillingState,
}));

jest.mock("../../utils/api", () => ({
  __esModule: true,
  default: {
    get: (...args) => mockApiGet(...args),
    post: (...args) => mockApiPost(...args),
  },
}));

jest.mock("../../components/billing/billingHelpers", () => ({
  openBillingPortal: (...args) => mockOpenBillingPortal(...args),
}));

jest.mock("../../utils/mobileCompliance", () => ({
  isMobileComplianceMode: () => false,
  MOBILE_PAYMENTS_MESSAGE: "web only",
}));

jest.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}), { virtual: true });

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key) => ({
      "billing.title": "Billing & Subscription",
      "billing.subtitle": "Manage your plan and billing.",
      "billing.loading": "Loading",
      "billing.actions.manageBilling": "Manage billing",
      "billing.actions.viewPlans": "View plans",
      "billing.actions.addSeats": "Add seats",
      "billing.actions.syncFromStripe": "Sync from Stripe",
      "billing.actions.syncing": "Syncing",
      "billing.actions.startPlan": "Start plan",
      "billing.actions.viewLastInvoice": "View last invoice",
      "billing.actions.cancelSubscription": "Cancel subscription",
      "billing.labels.plan": "Plan",
      "billing.labels.status": "Status",
      "billing.labels.subscription": "Subscription",
      "billing.labels.trialEnds": "Trial ends",
      "billing.labels.nextBillingDate": "Next billing date",
      "billing.labels.nextBillingDateEmpty": "Next billing date: —",
      "billing.labels.seatsIncluded": "Seats included",
      "billing.labels.addonSeats": "Addon seats",
      "billing.labels.totalAllowed": "Total allowed",
      "billing.labels.activeStaff": "Active staff",
      "billing.values.na": "n/a",
      "billing.values.inactive": "inactive",
      "billing.values.none": "none",
      "billing.plans.starter": "Starter",
      "billing.plans.pro": "Pro",
      "billing.plans.business": "Business",
    }[key] || key),
  }),
}));

const baseFieldPhotos = {
  addon_active: false,
  read_only: false,
  storage_addon_qty: 0,
  storage_used_bytes: 0,
  storage_quota_bytes: 0,
  retention_days: 90,
  price_configured: true,
};

const baseAiCommerce = {
  monetization_mode: "free_launch",
  addon_active: false,
  access_allowed: true,
  successful_actions_used: 0,
  successful_actions_remaining: 100,
  monthly_action_allowance: 100,
};

const buildStatus = (overrides = {}) => ({
  plan_key: "business",
  status: "active",
  subscription_state: "active",
  active_staff_count: 2,
  seats_allowed: 10,
  seats_included: 10,
  seats_addon_qty: 0,
  next_billing_date: "2026-09-05T00:00:00Z",
  trial_end: null,
  field_photos: { ...baseFieldPhotos, ...(overrides.field_photos || {}) },
  ai_commerce_copilot: { ...baseAiCommerce, ...(overrides.ai_commerce_copilot || {}) },
  ...overrides,
});

const defaultFieldPhotosPreview = {
  recurring_amount_formatted: "29.00 USD",
  interval: "month",
  included_storage_label: "5 GB",
  retention_days: 90,
  storage_expansion_label: "+10 GB",
  storage_expansion_amount_formatted: "10.00 USD",
  storage_expansion_interval: "month",
};

const renderPage = () =>
  render(
    <ThemeProvider theme={createTheme()}>
      <SettingsBillingSubscription />
    </ThemeProvider>
  );

describe("SettingsBillingSubscription", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
    mockNavigate.mockReset();
    mockBillingState = {
      status: buildStatus(),
      loading: false,
      error: "",
      refetch: mockRefetch,
    };
    mockApiGet.mockImplementation((url) => {
      if (url === "/billing/field-photos/preview") {
        return Promise.resolve({ data: defaultFieldPhotosPreview });
      }
      if (String(url).startsWith("/billing/field-photos/storage/preview")) {
        return Promise.resolve({
          data: {
            recurring_amount_formatted: "10.00 USD",
            interval: "month",
            storage_expansion_label: "+10 GB",
            amount_due_today_formatted: "10.00 USD",
          },
        });
      }
      if (url === "/billing/ai-commerce-copilot/preview") {
        return Promise.resolve({ data: { amount_formatted: "19.00 USD", monthly_action_allowance: 100 } });
      }
      return Promise.resolve({ data: {} });
    });
    mockApiPost.mockResolvedValue({ data: buildStatus() });
  });

  it("renders Copilot and Field Photos in separate cards and removes the old free-launch alert", async () => {
    renderPage();

    expect((await screen.findAllByRole("heading", { name: /AI Commerce Copilot/i })).length).toBeGreaterThan(0);
    expect((await screen.findAllByRole("heading", { name: /Field Photos/i })).length).toBeGreaterThan(0);
    expect(screen.queryByText(/Included during free launch\. Usage is recorded, but no additional charge currently applies\./i)).not.toBeInTheDocument();
  });

  it("shows Copilot free-launch details through accessible help", async () => {
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: /about ai commerce copilot billing/i }));

    expect(await screen.findByText(/Included during the current free launch\./i)).toBeInTheDocument();
    expect(screen.getByText(/Usage is recorded\./i)).toBeInTheDocument();
    expect(screen.getByText(/No additional charge currently applies\./i)).toBeInTheDocument();
  });

  it("shows authoritative inactive Field Photos pricing and hides operational counters", async () => {
    renderPage();

    expect(await screen.findByText(/Starts at 29\.00 USD\/month/i)).toBeInTheDocument();
    expect(screen.getByText(/Includes 5 GB · 90-day retention/i)).toBeInTheDocument();
    expect(screen.getByText(/No charge is created until you review and confirm the billing preview\./i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /view pricing & activate/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /open field photos/i })).toBeInTheDocument();
    expect(screen.queryByText(/Storage expansions:/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Storage:/i)).not.toBeInTheDocument();
  });

  it("uses canonical client navigation from Billing to Field Photos", async () => {
    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: /open field photos/i }));

    expect(mockNavigate).toHaveBeenCalledWith("/manager/field-photos");
  });

  it("shows support guidance when inactive pricing is not configured and still exposes Open Field Photos", async () => {
    mockBillingState = {
      ...mockBillingState,
      status: buildStatus({
        field_photos: {
          addon_active: false,
          read_only: false,
          storage_quota_bytes: null,
          retention_days: null,
          price_configured: false,
        },
      }),
    };
    mockApiGet.mockImplementation((url) => {
      if (url === "/billing/field-photos/preview") {
        return Promise.resolve({ data: {} });
      }
      if (String(url).startsWith("/billing/field-photos/storage/preview")) {
        return Promise.resolve({ data: {} });
      }
      return Promise.resolve({ data: {} });
    });

    renderPage();

    expect(await screen.findByText(/Starts at Pricing unavailable/i)).toBeInTheDocument();
    expect(screen.getByText(/Includes Included storage unavailable · Retention information unavailable/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Field Photos billing is not configured yet\. Contact support to activate this add-on\./i).length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: /open field photos/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /view pricing & activate/i })).not.toBeInTheDocument();
  });

  it("does not show a duplicate Open Field Photos button when Field Photos is active", async () => {
    mockBillingState = {
      ...mockBillingState,
      status: buildStatus({
        field_photos: {
          addon_active: true,
          read_only: false,
          storage_addon_qty: 2,
          storage_used_bytes: 3 * 1024 * 1024 * 1024,
          storage_quota_bytes: 5 * 1024 * 1024 * 1024,
          retention_days: 90,
          price_configured: true,
        },
      }),
    };

    renderPage();

    expect(await screen.findByRole("button", { name: /manage field photos/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /open field photos/i })).not.toBeInTheDocument();
  });

  it("opens the existing Field Photos billing modal without activating before confirmation", async () => {
    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: /view pricing & activate/i }));

    expect(await screen.findByText(/Activate Field Photos/i)).toBeInTheDocument();
    expect(mockApiPost).not.toHaveBeenCalledWith("/billing/field-photos/activate", expect.anything());
  });

  it("activates Field Photos only after explicit confirmation and refreshes status", async () => {
    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: /view pricing & activate/i }));
    fireEvent.click(await screen.findByRole("button", { name: /confirm activation/i }));

    await waitFor(() => {
      expect(mockApiPost).toHaveBeenCalledWith("/billing/field-photos/activate", {});
    });
    expect(mockRefetch).toHaveBeenCalled();
  });

  it("shows active Field Photos usage and controls", async () => {
    mockBillingState = {
      ...mockBillingState,
      status: buildStatus({
        field_photos: {
          addon_active: true,
          read_only: false,
          storage_addon_qty: 2,
          storage_used_bytes: 3 * 1024 * 1024 * 1024,
          storage_quota_bytes: 5 * 1024 * 1024 * 1024,
          retention_days: 90,
          price_configured: true,
        },
      }),
    };

    renderPage();

    expect(await screen.findByText(/Storage expansions:/i)).toBeInTheDocument();
    expect(screen.getByText(/Storage:/i)).toBeInTheDocument();
    expect(screen.getByText(/Storage usage: 60%/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /manage storage/i })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /manage billing/i }).length).toBeGreaterThan(0);
  });

  it("shows trial ends only for future trialing subscriptions", async () => {
    jest.useFakeTimers().setSystemTime(new Date("2026-08-05T12:00:00Z"));
    mockBillingState = {
      ...mockBillingState,
      status: buildStatus({
        status: "trialing",
        trial_end: "2026-08-15T00:00:00Z",
      }),
    };

    renderPage();

    expect(await screen.findByText(/Trial ends:/i)).toBeInTheDocument();
  });

  it("hides stale trial lines for active paid subscriptions", async () => {
    jest.useFakeTimers().setSystemTime(new Date("2026-08-05T12:00:00Z"));
    mockBillingState = {
      ...mockBillingState,
      status: buildStatus({
        status: "active",
        trial_end: "2026-02-05T00:00:00Z",
      }),
    };

    renderPage();

    expect(screen.queryByText(/Trial ends:/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Trial ended:/i)).not.toBeInTheDocument();
  });

  it("shows trial ended for past non-active trial dates when still materially useful", async () => {
    jest.useFakeTimers().setSystemTime(new Date("2026-08-05T12:00:00Z"));
    mockBillingState = {
      ...mockBillingState,
      status: buildStatus({
        status: "incomplete",
        trial_end: "2026-02-05T00:00:00Z",
      }),
    };

    renderPage();

    expect(await screen.findByText(/Trial ended:/i)).toBeInTheDocument();
  });
});
