import React from "react";
import { act, render, screen } from "@testing-library/react";

import api from "../../utils/api";
import { CLIENT_SESSION_STATE_EVENT } from "../../utils/clientSession";
import PackageCheckoutReturn, {
  completePackageReturn,
  PACKAGE_RETURN_MAX_ATTEMPTS,
  PACKAGE_RETURN_POLL_INTERVAL_MS,
  isPackageCheckoutReturnDashboard,
  packageReturnPath,
  packagesDashboardPath,
} from "./PackageCheckoutReturn";

jest.mock("../../utils/api", () => ({
  __esModule: true,
  default: { get: jest.fn() },
}));

jest.mock("react-router-dom", () => ({
  useLocation: () => ({ search: "?session_id=cs_test_1&site=studio", pathname: "/studio/packages/return" }),
  useParams: () => ({ slug: "studio" }),
}), { virtual: true });

describe("package checkout return helpers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    delete window.location;
    window.location = { assign: jest.fn(), reload: jest.fn(), search: "" };
  });

  const renderReturn = () => render(<PackageCheckoutReturn />);

  it("keeps the Stripe session and rejects incomplete or unresolved return links", () => {
    expect(packageReturnPath("?session_id=cs_test_1&site=studio&embed=1"))
      .toBe("/packages/return?session_id=cs_test_1&site=studio&embed=1");
    expect(packageReturnPath("?session_id=cs_test_1&site=studio&embed=1", "/studio/packages/return"))
      .toBe("/studio/packages/return?session_id=cs_test_1&site=studio&embed=1");
    expect(packageReturnPath("?session_id=cs_test_1&site=studio&package_return=1", "/dashboard"))
      .toBe("/dashboard?session_id=cs_test_1&site=studio&package_return=1");
    expect(isPackageCheckoutReturnDashboard("?package_return=1", "/dashboard")).toBe(true);
    expect(isPackageCheckoutReturnDashboard("?package_return=1", "/manage/dashboard")).toBe(false);
    expect(packageReturnPath("?site=studio")).toBe("");
    expect(packageReturnPath("?session_id={CHECKOUT_SESSION_ID}")).toBe("");
    expect(packageReturnPath("?session_id=cs_test_1", "/checkout/return")).toBe("");
  });

  it("opens the actual dashboard Packages tab for direct React", () => {
    expect(packagesDashboardPath("studio")).toBe("/dashboard?site=studio#packages");
    const assign = jest.fn();
    const dispatchEvent = jest.fn();
    const windowRef = { location: { assign }, dispatchEvent };

    expect(completePackageReturn({ windowRef, tenantSlug: "studio", embedded: false })).toBe(true);
    expect(assign).toHaveBeenCalledWith("/dashboard?site=studio#packages");
    expect(dispatchEvent).toHaveBeenCalledTimes(1);
  });

  it("asks the trusted Next wrapper to open My Bookings with the Packages fragment", () => {
    const postMessage = jest.fn();
    const parent = { postMessage };
    const windowRef = { parent, dispatchEvent: jest.fn() };

    expect(completePackageReturn({ windowRef, tenantSlug: "studio", embedded: true })).toBe(true);
    expect(postMessage).toHaveBeenCalledWith(
      { type: "schedulaa:transactional-navigate", href: "/my-bookings#packages" },
      "*",
    );
  });

  it("keeps a logged-out return inside tenant-aware client authentication", () => {
    renderReturn();
    expect(screen.getByRole("heading", { name: "Welcome back" })).toBeInTheDocument();
  });

  it("returns an expired direct session to tenant-aware login", () => {
    localStorage.setItem("token", "client-token");
    localStorage.setItem("role", "client");
    api.get.mockReturnValue(new Promise(() => {}));
    renderReturn();

    window.dispatchEvent(new CustomEvent(CLIENT_SESSION_STATE_EVENT, {
      detail: { signedIn: false, reason: "authentication-rejected" },
    }));

    expect(window.location.assign).toHaveBeenCalledWith("/login?site=studio&client=1");
  });

  it("uses bounded polling and never calls a timeout a failed payment", async () => {
    jest.useFakeTimers();
    localStorage.setItem("token", "client-token");
    localStorage.setItem("role", "client");
    api.get.mockResolvedValue({ data: { state: "pending" } });
    renderReturn();
    await act(async () => {
      await Promise.resolve();
    });
    expect(api.get).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Waiting for payment and package confirmation…")).toBeInTheDocument();
    expect(screen.queryByText(/payment received/i)).not.toBeInTheDocument();
    for (let attempt = 1; attempt < PACKAGE_RETURN_MAX_ATTEMPTS; attempt += 1) {
      await act(async () => {
        jest.advanceTimersByTime(PACKAGE_RETURN_POLL_INTERVAL_MS);
        await Promise.resolve();
      });
    }

    expect(api.get).toHaveBeenCalledTimes(PACKAGE_RETURN_MAX_ATTEMPTS);
    expect(screen.getByText("Payment has not been confirmed yet.")).toBeInTheDocument();
    expect(screen.queryByText(/payment failed/i)).not.toBeInTheDocument();
    jest.useRealTimers();
  });

  it("treats repeated network errors as unconfirmed rather than failed", async () => {
    jest.useFakeTimers();
    localStorage.setItem("token", "client-token");
    localStorage.setItem("role", "client");
    api.get.mockRejectedValue(new Error("network unavailable"));
    renderReturn();
    await act(async () => {
      await Promise.resolve();
    });
    for (let attempt = 1; attempt < PACKAGE_RETURN_MAX_ATTEMPTS; attempt += 1) {
      await act(async () => {
        jest.advanceTimersByTime(PACKAGE_RETURN_POLL_INTERVAL_MS);
        await Promise.resolve();
      });
    }

    expect(api.get).toHaveBeenCalledTimes(PACKAGE_RETURN_MAX_ATTEMPTS);
    expect(screen.getByText("Payment has not been confirmed yet.")).toBeInTheDocument();
    expect(screen.queryByText(/payment failed/i)).not.toBeInTheDocument();
    jest.useRealTimers();
  });

  it("does not mislabel an invalid or cross-tenant session as payment failure", async () => {
    localStorage.setItem("token", "client-token");
    localStorage.setItem("role", "client");
    api.get.mockRejectedValue({ response: { status: 404 } });
    renderReturn();

    expect(await screen.findByText("We could not verify this package checkout.")).toBeInTheDocument();
    expect(screen.queryByText(/payment failed/i)).not.toBeInTheDocument();
  });
});
