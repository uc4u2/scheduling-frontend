import {
  buildClientLoginTarget,
  CLIENT_SESSION_REQUEST_TYPE,
  CLIENT_SESSION_STATE_EVENT,
  installClientSessionBridge,
  invalidateActiveClientSession,
  markActiveClientSessionRequest,
  persistVerifiedClientSession,
  publishClientSessionState,
  verifyClientSessionForTenant,
} from "./clientSession";

const unsignedJwt = (payload) => {
  const encode = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");
  return `${encode({ alg: "none", typ: "JWT" })}.${encode(payload)}.sig`;
};

describe("client session lifecycle", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("publishes presentation state without granting authorization", () => {
    const received = [];
    const listener = (event) => received.push(event.detail);
    window.addEventListener(CLIENT_SESSION_STATE_EVENT, listener);

    expect(publishClientSessionState(true, { reason: "authenticated" })).toBe(true);
    expect(received).toEqual([
      expect.objectContaining({
        type: "schedulaa:client-session",
        signedIn: true,
        reason: "authenticated",
      }),
    ]);

    window.removeEventListener(CLIENT_SESSION_STATE_EVENT, listener);
  });

  it("keeps direct and embedded login navigation tenant scoped", () => {
    expect(buildClientLoginTarget("beauty-salon", ""))
      .toBe("/login?site=beauty-salon&client=1");
    expect(buildClientLoginTarget("beauty-salon", "?site=beauty-salon&embed=1&primary=%23c90"))
      .toBe("/login?primary=%23c90&site=beauty-salon&client=1&embed=1&dialog=1");
    expect(buildClientLoginTarget(
      "beauty-salon",
      "?session_id=cs_test_1&site=beauty-salon&embed=1",
      "/beauty-salon/packages/return?session_id=cs_test_1&site=beauty-salon&embed=1",
    )).toBe(
      "/login?return_to=%2Fbeauty-salon%2Fpackages%2Freturn%3Fsession_id%3Dcs_test_1%26site%3Dbeauty-salon%26embed%3D1&site=beauty-salon&client=1&embed=1&dialog=1",
    );
    expect(buildClientLoginTarget(
      "beauty-salon",
      "?site=beauty-salon",
      "/other/packages/return?session_id=cs_wrong_tenant",
    )).toBe("/login?site=beauty-salon&client=1");
    expect(buildClientLoginTarget(
      "beauty-salon",
      "?site=beauty-salon&view=orders&order_id=73&embed=1",
    )).toBe(
      "/login?return_to=%2Fdashboard%3Fsite%3Dbeauty-salon%26view%3Dorders%26order_id%3D73%26embed%3D1&site=beauty-salon&client=1&embed=1&dialog=1",
    );
    expect(buildClientLoginTarget(
      "beauty-salon",
      "?site=beauty-salon",
      "/beauty-salon/my-bookings?view=orders&order_id=73",
    )).toBe(
      "/login?return_to=%2Fbeauty-salon%2Fmy-bookings%3Fview%3Dorders%26order_id%3D73&site=beauty-salon&client=1",
    );
    expect(buildClientLoginTarget(
      "beauty-salon",
      "?site=beauty-salon",
      "/other/my-bookings?view=orders&order_id=73",
    )).toBe("/login?site=beauty-salon&client=1");
  });

  it("invalidates only a rejection for the active client token", () => {
    localStorage.setItem("role", "client");
    localStorage.setItem("token", "active-token");
    const config = markActiveClientSessionRequest({ headers: {} });
    const error = {
      config,
      response: {
        status: 401,
        data: { error: "authentication_rejected", code: "TOKEN_EXPIRED" },
      },
    };

    expect(invalidateActiveClientSession(error, { reason: "authentication-rejected" })).toBe(true);
    expect(localStorage.getItem("token")).toBeNull();
    expect(localStorage.getItem("role")).toBeNull();
  });

  it("does not let a stale response clear a newly authenticated client", () => {
    localStorage.setItem("role", "client");
    localStorage.setItem("token", "old-token");
    const config = markActiveClientSessionRequest({ headers: {} });
    localStorage.setItem("token", "new-token");

    expect(invalidateActiveClientSession({
      config,
      response: {
        status: 401,
        data: { error: "authentication_rejected", code: "TOKEN_EXPIRED" },
      },
    })).toBe(false);
    expect(localStorage.getItem("token")).toBe("new-token");
  });

  it("ignores failed login, unrelated authorization errors, and non-client sessions", () => {
    localStorage.setItem("role", "client");
    localStorage.setItem("token", "active-token");
    const loginConfig = markActiveClientSessionRequest({ noAuth: true, headers: {} });
    expect(invalidateActiveClientSession({ config: loginConfig, response: { status: 401 } })).toBe(false);

    const clientConfig = markActiveClientSessionRequest({ headers: {} });
    expect(invalidateActiveClientSession({ config: clientConfig, response: { status: 401, data: {} } })).toBe(false);
    expect(invalidateActiveClientSession({ config: clientConfig, response: { status: 403, data: {} } })).toBe(false);

    localStorage.setItem("role", "manager");
    const managerConfig = markActiveClientSessionRequest({ headers: {} });
    expect(invalidateActiveClientSession({ config: managerConfig, response: { status: 401 } })).toBe(false);
    expect(localStorage.getItem("token")).toBe("active-token");
  });

  it("invalidates an active client session rejected as disabled", () => {
    localStorage.setItem("role", "client");
    localStorage.setItem("token", "active-token");
    const config = markActiveClientSessionRequest({ headers: {} });
    const error = {
      config,
      response: {
        status: 403,
        data: { error: "account_access_denied", code: "USER_DISABLED" },
      },
    };

    expect(invalidateActiveClientSession(error, { reason: "account-disabled" })).toBe(true);
    expect(localStorage.getItem("token")).toBeNull();
  });

  it("does not invalidate a client for a stale tenant-scoped rejection", () => {
    localStorage.setItem("role", "client");
    localStorage.setItem("token", "active-token");
    localStorage.setItem("company_id", "41");
    const config = markActiveClientSessionRequest({ headers: {} });
    localStorage.setItem("company_id", "99");

    expect(invalidateActiveClientSession({
      config,
      response: {
        status: 403,
        data: { error: "account_access_denied", code: "TENANT_DISABLED" },
      },
    })).toBe(false);
    expect(localStorage.getItem("token")).toBe("active-token");
    expect(localStorage.getItem("company_id")).toBe("99");
  });

  it("still invalidates a globally rejected active credential after a tenant switch", () => {
    localStorage.setItem("role", "client");
    localStorage.setItem("token", "active-token");
    localStorage.setItem("company_id", "41");
    const config = markActiveClientSessionRequest({ headers: {} });
    localStorage.setItem("company_id", "99");

    expect(invalidateActiveClientSession({
      config,
      response: {
        status: 401,
        data: { error: "authentication_rejected", code: "TOKEN_EXPIRED" },
      },
    })).toBe(true);
    expect(localStorage.getItem("token")).toBeNull();
  });

  it("publishes a tenant-scoped session to the parent origin without credentials", () => {
    const previousParent = Object.getOwnPropertyDescriptor(window, "parent");
    const previousReferrer = Object.getOwnPropertyDescriptor(document, "referrer");
    const parent = { postMessage: jest.fn() };
    Object.defineProperty(window, "parent", { configurable: true, value: parent });
    Object.defineProperty(document, "referrer", {
      configurable: true,
      value: "https://www.lumiereprivatesalon.com/basket",
    });
    const received = [];
    const listener = (event) => received.push(event.detail);
    window.addEventListener(CLIENT_SESSION_STATE_EVENT, listener);

    expect(publishClientSessionState(true, {
      reason: "authenticated",
      tenantSlug: "beauty-salon",
      token: "must-not-leak",
      access_token: "must-not-leak",
      email: "ada@example.com",
    })).toBe(true);

    const payload = {
      reason: "authenticated",
      tenantSlug: "beauty-salon",
      type: "schedulaa:client-session",
      signedIn: true,
    };
    expect(received).toEqual([payload]);
    expect(parent.postMessage).toHaveBeenCalledWith(
      payload,
      "https://www.lumiereprivatesalon.com",
    );
    expect(parent.postMessage).not.toHaveBeenCalledWith(expect.anything(), "*");

    window.removeEventListener(CLIENT_SESSION_STATE_EVENT, listener);
    if (previousParent) Object.defineProperty(window, "parent", previousParent);
    if (previousReferrer) Object.defineProperty(document, "referrer", previousReferrer);
  });

  it("verifies only a client credential for the requested tenant", async () => {
    const apiClient = { get: jest.fn() };
    localStorage.setItem("role", "manager");
    localStorage.setItem("token", unsignedJwt({ role: "manager", sub: "manager@example.com" }));

    await expect(verifyClientSessionForTenant("beauty-salon", { apiClient })).resolves.toEqual(
      expect.objectContaining({ signedIn: false, reason: "non-client-token" }),
    );
    expect(apiClient.get).not.toHaveBeenCalled();
    expect(localStorage.getItem("token")).toBeTruthy();

    localStorage.setItem("role", "client");
    localStorage.setItem("token", unsignedJwt({ role: "client", identity: "client:9" }));
    apiClient.get.mockResolvedValueOnce({
      data: { id: 9, email: "ada@example.com", full_name: "Ada Client" },
    });

    await expect(verifyClientSessionForTenant("beauty-salon", { apiClient })).resolves.toEqual(
      expect.objectContaining({
        signedIn: true,
        tenantSlug: "beauty-salon",
        profile: expect.objectContaining({ email: "ada@example.com", name: "Ada Client" }),
      }),
    );
    expect(apiClient.get).toHaveBeenCalledWith("/me", {
      params: { slug: "beauty-salon" },
      headers: { Authorization: expect.stringMatching(/^Bearer /) },
      noCompanyHeader: true,
    });
  });

  it("keeps a valid client token when the current tenant has no membership", async () => {
    const token = unsignedJwt({ role: "client", identity: "client:9" });
    localStorage.setItem("role", "client");
    localStorage.setItem("token", token);
    const apiClient = {
      get: jest.fn().mockRejectedValue({ response: { status: 404, data: { error: "Client not found" } } }),
    };

    await expect(verifyClientSessionForTenant("beauty-salon", { apiClient })).resolves.toEqual(
      expect.objectContaining({ signedIn: false, reason: "wrong-tenant" }),
    );
    expect(localStorage.getItem("token")).toBe(token);
  });

  it("clears an expired client credential and leaves other roles untouched", async () => {
    const expired = unsignedJwt({ role: "client", identity: "client:9" });
    localStorage.setItem("role", "client");
    localStorage.setItem("token", expired);
    localStorage.setItem("clientToken", expired);
    const apiClient = {
      get: jest.fn().mockRejectedValue({
        response: { status: 401, data: { error: "authentication_rejected", code: "TOKEN_EXPIRED" } },
      }),
    };

    await expect(verifyClientSessionForTenant("beauty-salon", { apiClient })).resolves.toEqual(
      expect.objectContaining({ signedIn: false, reason: "expired", cleared: true }),
    );
    expect(localStorage.getItem("token")).toBeNull();
    expect(localStorage.getItem("role")).toBeNull();

    const managerToken = unsignedJwt({ role: "employee", sub: "employee@example.com" });
    localStorage.setItem("role", "employee");
    localStorage.setItem("token", managerToken);
    apiClient.get.mockClear();
    await verifyClientSessionForTenant("beauty-salon", { apiClient });
    expect(apiClient.get).not.toHaveBeenCalled();
    expect(localStorage.getItem("token")).toBe(managerToken);
  });

  it("answers a parent session request without returning credentials", async () => {
    const previousParent = Object.getOwnPropertyDescriptor(window, "parent");
    const previousReferrer = Object.getOwnPropertyDescriptor(document, "referrer");
    const parent = { postMessage: jest.fn() };
    Object.defineProperty(window, "parent", { configurable: true, value: parent });
    Object.defineProperty(document, "referrer", {
      configurable: true,
      value: "https://www.lumiereprivatesalon.com/login",
    });
    localStorage.setItem("role", "client");
    localStorage.setItem("token", unsignedJwt({ role: "client", identity: "client:9" }));
    const apiClient = {
      get: jest.fn().mockResolvedValue({ data: { email: "ada@example.com", full_name: "Ada Client" } }),
    };
    installClientSessionBridge(apiClient);

    window.dispatchEvent(new MessageEvent("message", {
      source: parent,
      origin: "https://evil.example",
      data: { type: CLIENT_SESSION_REQUEST_TYPE, tenantSlug: "beauty-salon" },
    }));
    window.dispatchEvent(new MessageEvent("message", {
      source: window,
      origin: "https://www.lumiereprivatesalon.com",
      data: { type: CLIENT_SESSION_REQUEST_TYPE, tenantSlug: "beauty-salon" },
    }));
    window.dispatchEvent(new MessageEvent("message", {
      source: parent,
      origin: "https://www.lumiereprivatesalon.com",
      data: { type: CLIENT_SESSION_REQUEST_TYPE, tenantSlug: "beauty-salon" },
    }));

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(parent.postMessage).toHaveBeenCalledTimes(1);
    expect(parent.postMessage).toHaveBeenCalledWith({
      type: "schedulaa:client-session",
      signedIn: true,
      tenantSlug: "beauty-salon",
      reason: "verified-client-session",
    }, "https://www.lumiereprivatesalon.com");
    expect(JSON.stringify(parent.postMessage.mock.calls)).not.toContain("ada@example.com");
    expect(persistVerifiedClientSession("fresh-token", "beauty-salon")).toBe("beauty-salon");
    expect(localStorage.getItem("role")).toBe("client");
    expect(localStorage.getItem("site")).toBe("beauty-salon");
    expect(localStorage.getItem("clientToken")).toBe("fresh-token");

    if (previousParent) Object.defineProperty(window, "parent", previousParent);
    if (previousReferrer) Object.defineProperty(document, "referrer", previousReferrer);
  });
});
