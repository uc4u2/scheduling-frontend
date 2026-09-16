import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import DomainSettingsCard from "./DomainSettingsCard";
import useDomainSettings from "../../../../hooks/useDomainSettings";

jest.mock("../../../../hooks/useDomainSettings", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("notistack", () => ({
  useSnackbar: () => ({ enqueueSnackbar: jest.fn() }),
}));

jest.mock("react-router-dom", () => ({
  useSearchParams: () => [new URLSearchParams(), jest.fn()],
}), { virtual: true });

const interpolate = (value, options) =>
  String(value).replace(/{{(\w+)}}/g, (_match, key) => options[key] ?? "");

jest.mock("react-i18next", () => ({
  Trans: () => null,
  useTranslation: () => ({
    t: (key, options = {}) => {
      if (options.returnObjects) return [];
      return interpolate(options.defaultValue || key, options);
    },
  }),
}));

const baseState = {
  status: "verified",
  domain: "www.bridgeofcarecommunity.ca",
  verifiedAt: "2026-09-16T05:10:00Z",
  instructions: null,
  verificationToken: null,
  lastChecked: "2026-09-16T05:42:00Z",
  loading: false,
  refreshing: false,
  processing: false,
  action: null,
  error: null,
  setError: jest.fn(),
  requestDomain: jest.fn(),
  verifyDomain: jest.fn(),
  removeDomain: jest.fn(),
  refresh: jest.fn(),
  registrarHint: "cloudflare",
  ownershipVerification: null,
  cdnProvider: "cloudflare",
  sslStatus: "active",
  sslError: null,
  dnsTxtOk: true,
  dnsCnameOk: true,
  notifyEmailEnabled: false,
  cnameWarning: null,
  cnameTarget: "custom-hostnames.schedulaa.com",
  updateNotifyPreference: jest.fn(),
  nextRetrySeconds: 0,
  domainConnectSession: null,
  connectAuthorizationUrl: null,
  startDomainConnect: jest.fn(),
  fetchDomainConnectSession: jest.fn(),
  diagnoseDomain: jest.fn(),
  retrySsl: jest.fn(),
  rootRedirectOk: true,
  rootRedirectCheckedAt: "2026-09-16T05:42:00Z",
  rootRedirectStatusCode: 301,
  rootRedirectExpectedTarget: "https://www.bridgeofcarecommunity.ca",
  rootRedirectObservedLocation: "https://www.bridgeofcarecommunity.ca/",
  rootRedirectError: null,
  rootRedirectCheckedScheme: "https",
  rootRedirectState: "detected",
  rootRedirectDetails: { state: "detected" },
  workerRouteState: "detected",
  workerRouteRequiredPattern: "www.bridgeofcarecommunity.ca/*",
  workerRouteWorkerName: "schedulaa-edge-router",
  workerRouteError: null,
  workerRouteCheckedAt: "2026-09-16T05:42:00Z",
  workerRouteDetectionMode: "behavior",
  requestedDomain: "bridgeofcarecommunity.ca",
  canonicalDomain: "www.bridgeofcarecommunity.ca",
  cloudflareHostnameId: "bridge-hostname-id",
  connectionSummary: "connected",
  guidance: { next_step: "Connected", next_step_detail: "Domain is fully connected." },
  domainDetails: {
    requested: "bridgeofcarecommunity.ca",
    canonical: "www.bridgeofcarecommunity.ca",
    verified_at: "2026-09-16T05:10:00Z",
  },
  dnsDetails: { txt_ok: true, cname_ok: true },
  cloudflareDetails: { hostname_status: "active", ssl_status: "active" },
  bootstrapDetails: { ok: true, slug: "dr-behnaz" },
  workerRouteDetails: {
    state: "detected",
    required_pattern: "www.bridgeofcarecommunity.ca/*",
    worker_name: "schedulaa-edge-router",
  },
  publicUrlContract: {
    primary_public_url: "https://www.bridgeofcarecommunity.ca",
  },
};

const renderCard = (workerRoute = {}, stateOverrides = {}) => {
  const state = {
    ...baseState,
    ...stateOverrides,
    workerRouteState: workerRoute.state || baseState.workerRouteState,
    workerRouteError: workerRoute.error || null,
    workerRouteDetails: {
      ...baseState.workerRouteDetails,
      ...workerRoute,
    },
  };
  useDomainSettings.mockReturnValue(state);
  render(
    <DomainSettingsCard
      companyId={36}
      companySlug="dr-behnaz"
      primaryHost="app.schedulaa.com"
      publicUrlContract={state.publicUrlContract}
    />
  );
};

describe("DomainSettingsCard edge-routing diagnostics", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("shows detected Bridge routing without prescribing the stale legacy worker", () => {
    renderCard();

    expect(
      screen.getAllByText("Edge routing detected for www.bridgeofcarecommunity.ca/*.")
        .length
    ).toBeGreaterThan(0);
    expect(screen.getByText(/Worker route.*Detected/)).toBeInTheDocument();
    expect(screen.queryByText(/Required route/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/schedulaa-edge-router/i)).not.toBeInTheDocument();
  });

  test("keeps a detected legacy-domain diagnostic in the successful state", () => {
    renderCard({
      state: "detected",
      required_pattern: "www.ystanbeauty.ca/*",
      worker_name: "schedulaa-edge-router",
    });

    expect(
      screen.getAllByText("Edge routing detected for www.ystanbeauty.ca/*.").length
    ).toBeGreaterThan(0);
    expect(screen.getByText(/Worker route.*Detected/)).toBeInTheDocument();
  });

  test("gives a neutral Cloudflare review instruction when routing is missing", () => {
    renderCard(
      { state: "missing" },
      {
        guidance: {
          next_step: "Add Cloudflare Worker route",
          next_step_detail:
            "Add www.bridgeofcarecommunity.ca/* -> schedulaa-edge-router in Cloudflare Workers Routes.",
        },
      }
    );

    expect(
      screen.getAllByText(
        "Edge routing was not detected for www.bridgeofcarecommunity.ca/*. Review the Cloudflare Worker route."
    ).length
    ).toBeGreaterThan(0);
    expect(screen.queryByText(/schedulaa-edge-router/i)).not.toBeInTheDocument();
  });

  test("keeps could-not-check advisory wording non-destructive", () => {
    renderCard({ state: "could_not_check" });

    expect(
      screen.getAllByText(
        "Edge routing could not be verified for www.bridgeofcarecommunity.ca/*."
      ).length
    ).toBeGreaterThan(0);
  });

  test("keeps manual-required state advisory and neutral", () => {
    renderCard({ state: "manual_required" });

    expect(
      screen.getAllByText(
        "Edge routing requires manual review for www.bridgeofcarecommunity.ca/*."
      ).length
    ).toBeGreaterThan(0);
  });

  test("leaves root redirect, DNS, SSL, and bootstrap progress intact", () => {
    renderCard();

    expect(screen.getAllByText(/DNS records detected/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/SSL certificate/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Website bootstrap/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Root redirect/).length).toBeGreaterThan(0);
    expect(
      screen.getByText(
        "Recommended only. Expected target: https://www.bridgeofcarecommunity.ca"
      )
    ).toBeInTheDocument();
  });

  test("support summary omits the non-authoritative worker name", async () => {
    const writeText = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    renderCard();

    fireEvent.click(screen.getByRole("button", { name: "Copy support summary" }));

    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
    const summary = writeText.mock.calls[0][0];
    expect(summary).toContain("Worker route: detected");
    expect(summary).toContain(
      "Worker route pattern: www.bridgeofcarecommunity.ca/*"
    );
    expect(summary).not.toContain("Worker name:");
    expect(summary).not.toContain("schedulaa-edge-router");
  });
});
