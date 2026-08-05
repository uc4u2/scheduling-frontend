import React from "react";
import { render, screen } from "@testing-library/react";
import { ThemeProvider, createTheme } from "@mui/material/styles";

import SettingsStripeHub from "./SettingsStripeHub";

const mockApiGet = jest.fn();

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key, options) => {
      if (options?.returnObjects && key === "settings.stripeHub.help.items") {
        return ["Help item"];
      }
      return key;
    },
    i18n: { language: "en" },
  }),
}));

jest.mock("react-router-dom", () => ({
  useNavigate: () => jest.fn(),
  Link: ({ children, ...props }) => <a {...props}>{children}</a>,
}), { virtual: true });

jest.mock("../../utils/mobileCompliance", () => ({
  isMobileComplianceMode: () => false,
}));

jest.mock("../../components/mobile/MobileWebOnlyNotice", () => () => null);
jest.mock("./TaxHelpGuide", () => () => null);
jest.mock("../../components/ui/SectionCard", () => ({ children, title }) => (
  <section>
    <h2>{title}</h2>
    {children}
  </section>
));

jest.mock("../../hooks/useStripeConnectStatus", () => ({
  __esModule: true,
  default: () => ({
    status: {
      connected: true,
      charges_enabled: true,
      payouts_enabled: true,
      requirements_due: [],
    },
    loading: false,
    refresh: jest.fn(),
  }),
}));

jest.mock("../../utils/api", () => ({
  __esModule: true,
  default: {
    get: (...args) => mockApiGet(...args),
    post: jest.fn(),
  },
  stripeConnect: {
    dashboardLogin: jest.fn(),
    startOnboarding: jest.fn(),
    refreshOnboardingLink: jest.fn(),
    reset: jest.fn(),
  },
}));

function renderHub() {
  return render(
    <ThemeProvider theme={createTheme()}>
      <SettingsStripeHub />
    </ThemeProvider>
  );
}

describe("SettingsStripeHub", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.localStorage.clear();
    window.localStorage.setItem("token", "test-token");
    mockApiGet.mockImplementation((url) => {
      if (url === "/admin/company-profile") {
        return Promise.resolve({
          data: {
            enable_stripe_payments: true,
            enable_product_payments: false,
            allow_card_on_file: false,
            stripe_publishable_key: "pk_test_1234567890",
            prices_include_tax: false,
            charge_currency_mode: "PLATFORM_FIXED",
          },
        });
      }
      if (url === "/billing/status") {
        return Promise.resolve({ data: { seats_allowed: 1, active_staff_count: 1 } });
      }
      return Promise.resolve({ data: {} });
    });
  });

  test("shows appointment and product payment readiness separately", async () => {
    renderHub();

    expect(
      await screen.findByText(/Appointment Checkout: settings.payments.allowed/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/Product payments: settings.payments.notSet/i)).toBeInTheDocument();
    expect(
      screen.getByText(/settings\.payments\.cardsOnFile: settings\.payments\.notSet/i)
    ).toBeInTheDocument();
  });
});
