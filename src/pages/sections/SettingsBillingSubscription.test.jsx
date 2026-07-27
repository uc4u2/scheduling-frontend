import React from "react";
import { render, screen, within } from "@testing-library/react";
import { ThemeProvider, createTheme } from "@mui/material/styles";

import SettingsBillingSubscription from "./SettingsBillingSubscription";

const mockRefetch = jest.fn();
const mockApiGet = jest.fn();
const mockApiPost = jest.fn();

jest.mock("../../components/billing/useBillingStatus", () => ({
  __esModule: true,
  default: () => ({
    status: {
      plan_key: "pro",
      status: "active",
      subscription_state: "active",
      active_staff_count: 2,
      seats_allowed: 5,
      seats_included: 5,
      seats_addon_qty: 0,
      field_photos: { addon_active: false, read_only: false, storage_addon_qty: 0, storage_used_bytes: 0, storage_quota_bytes: 0, retention_days: 90, price_configured: true },
      ai_commerce_copilot: {
        monetization_mode: "free_launch",
        addon_active: false,
        access_allowed: true,
        successful_actions_used: 8,
        successful_actions_remaining: 92,
        monthly_action_allowance: 100,
      },
    },
    loading: false,
    error: "",
    refetch: mockRefetch,
  }),
}));

jest.mock("../../utils/api", () => ({
  __esModule: true,
  default: {
    get: (...args) => mockApiGet(...args),
    post: (...args) => mockApiPost(...args),
  },
}));

jest.mock("../../components/billing/billingHelpers", () => ({
  openBillingPortal: jest.fn(() => Promise.resolve()),
}));

jest.mock("../../utils/mobileCompliance", () => ({
  isMobileComplianceMode: () => false,
  MOBILE_PAYMENTS_MESSAGE: "web only",
}));

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
      "billing.labels.plan": "Plan",
      "billing.labels.status": "Status",
      "billing.labels.subscription": "Subscription",
      "billing.labels.trialEnds": "Trial ends",
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

const renderPage = () =>
  render(
    <ThemeProvider theme={createTheme()}>
      <SettingsBillingSubscription />
    </ThemeProvider>
  );

describe("SettingsBillingSubscription", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows free launch AI Commerce Copilot state", async () => {
    renderPage();
    const heading = screen.getByRole("heading", { name: /AI Commerce Copilot/i });
    expect(heading).toBeInTheDocument();
    const card = heading.closest(".MuiCard-root");
    expect(card).not.toBeNull();
    expect(within(card).getAllByText(/Included during free launch/i).length).toBeGreaterThan(0);
    expect(within(card).queryByText(/AI Commerce Copilot add-on required/i)).not.toBeInTheDocument();
  });
});
