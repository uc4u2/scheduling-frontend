import {
  buildClientLoginTarget,
  CLIENT_SESSION_STATE_EVENT,
  invalidateActiveClientSession,
  markActiveClientSessionRequest,
  publishClientSessionState,
} from "./clientSession";

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
});
