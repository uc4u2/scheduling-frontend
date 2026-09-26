import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import SubscriptionPaymentInvitePage from "./SubscriptionPaymentInvitePage";

const mockGet = jest.fn();
const mockPost = jest.fn();
const mockTrackGAEvent = jest.fn();
const mockTrackGAEventOnce = jest.fn();
let mockPath = "/billing/subscription-invite/token-1";
let mockToken = "token-1";
const mockTranslate = (key, values = {}) => ({
  "billing.publicInvite.brand": "Schedulaa billing",
  "billing.publicInvite.activatedTitle": "Subscription activated",
  "billing.publicInvite.activateTitle": "Activate business subscription",
  "billing.publicInvite.loading": "Loading payment invitation",
  "billing.publicInvite.invalid": "This payment invitation is invalid.",
  "billing.publicInvite.loadError": "Unable to load this payment invitation.",
  "billing.publicInvite.statusError": "We could not confirm the subscription status yet.",
  "billing.publicInvite.checkoutUnavailable": "Secure Checkout is not available yet. Please try again.",
  "billing.publicInvite.recoveryRequired": "This business already has a subscription that must be managed instead of recreated.",
  "billing.publicInvite.noLongerAvailable": "This payment invitation is no longer available.",
  "billing.publicInvite.checkoutError": "Unable to open secure Checkout. Please try again.",
  "billing.publicInvite.year": "year",
  "billing.publicInvite.month": "month",
  "billing.publicInvite.trialEligible": `This workspace is eligible for the existing ${values.days || ""}-day trial.`,
  "billing.publicInvite.trialActivated": "Subscription activated. The trial has started and the saved payment method will be used for future billing.",
  "billing.publicInvite.activeActivated": "Subscription activated. The payment method is saved securely with Stripe for renewal.",
  "billing.publicInvite.processing": "Stripe is confirming the subscription.",
  "billing.publicInvite.unavailable": `This invitation is ${values.state || ""}.`,
  "billing.publicInvite.openingCheckout": "Opening secure Checkout…",
  "billing.publicInvite.continue": "Continue to secure payment",
  "billing.publicInvite.securityNotice": "Payment does not create a Schedulaa login or grant workspace access.",
  "billing.publicInvite.completeNotice": "The business or its setup partner can now continue workspace setup.",
}[key] || key);

jest.mock("react-router-dom", () => ({
  useParams: () => ({ token: mockToken }),
  useLocation: () => ({ pathname: mockPath }),
}), { virtual: true });

jest.mock("../../utils/api", () => ({
  __esModule: true,
  default: {
    get: (...args) => mockGet(...args),
    post: (...args) => mockPost(...args),
  },
}));

jest.mock("../../utils/mobileCompliance", () => ({
  isMobileComplianceMode: () => false,
  MOBILE_PAYMENTS_MESSAGE: "web only",
}));

jest.mock("../../analytics/ga", () => ({
  trackGAEvent: (...args) => mockTrackGAEvent(...args),
  trackGAEventOnce: (...args) => mockTrackGAEventOnce(...args),
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: mockTranslate,
  }),
}));

const renderAt = (path, token) => {
  mockPath = path;
  mockToken = token;
  return render(<SubscriptionPaymentInvitePage />);
};

describe("SubscriptionPaymentInvitePage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGet.mockResolvedValue({
      data: {
        company_name: "ABC Plumbing",
        plan_name: "Starter",
        plan_key: "starter",
        billing_interval: "monthly",
        price: { display: "19.99 USD" },
        trial_days: 14,
        state: "pending",
      },
    });
    mockPost.mockResolvedValue({ data: {} });
  });

  it("previews safely without creating Checkout on GET", async () => {
    renderAt("/billing/subscription-invite/token-1", "token-1");
    expect(await screen.findByText("ABC Plumbing")).toBeInTheDocument();
    expect(screen.getByText((_, element) => (
      element?.tagName === "P" && element.textContent.includes("Starter · monthly")
    ))).toBeInTheDocument();
    expect(screen.getByText(/19\.99 USD\/month/i)).toBeInTheDocument();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    expect(screen.queryByText(/choose another plan/i)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /continue to secure payment/i })).toBeInTheDocument();
    expect(mockGet).toHaveBeenCalledWith("/public/billing/subscription-invites/token-1");
    expect(mockPost).not.toHaveBeenCalled();
  });

  it("creates Checkout only after the payer continues", async () => {
    renderAt("/billing/subscription-invite/token-2", "token-2");
    fireEvent.click(await screen.findByRole("button", { name: /continue to secure payment/i }));
    await waitFor(() => expect(mockPost).toHaveBeenCalledWith("/public/billing/subscription-invites/token-2/checkout", {}));
    expect(await screen.findByText(/secure Checkout is not available yet/i)).toBeInTheDocument();
  });

  it("shows authoritative trial activation wording on success", async () => {
    mockGet.mockImplementation((url) => {
      if (String(url).endsWith("/status")) return Promise.resolve({ data: { state: "trialing", activated: true } });
      return Promise.resolve({ data: { company_name: "ABC Plumbing", plan_name: "Starter", billing_interval: "monthly", price: {}, trial_days: 14, state: "processing" } });
    });
    renderAt("/billing/subscription-invite/token-3/success", "token-3");
    expect(await screen.findByText(/subscription activated\. the trial has started/i)).toBeInTheDocument();
    expect(screen.getByText(/does not create a Schedulaa login/i)).toBeInTheDocument();
    expect(mockTrackGAEventOnce).toHaveBeenCalledWith(
      "payment_invite_trial:token-3",
      "trial_activated",
      { checkout_type: "payment_invite" }
    );
    expect(mockTrackGAEventOnce).not.toHaveBeenCalledWith(
      expect.anything(),
      "subscription_activated",
      expect.anything()
    );
  });
});
