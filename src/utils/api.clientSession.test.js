import axios from "axios/dist/node/axios.cjs";
import { CLIENT_SESSION_STATE_EVENT } from "./clientSession";
import { installClientSessionInterceptors } from "./clientSessionInterceptors";

const api = axios.create();
installClientSessionInterceptors(api);

const rejectedResponseAdapter = (status, data) => (config) => {
  const error = new Error(`Request failed with status ${status}`);
  error.config = config;
  error.response = { status, data, config };
  return Promise.reject(error);
};

const deferredRejectedResponseAdapter = () => {
  let rejectRequest;
  let capturedConfig;
  const adapter = (config) => {
    capturedConfig = config;
    return new Promise((_resolve, reject) => {
      rejectRequest = (status, data) => {
        const error = new Error(`Request failed with status ${status}`);
        error.config = config;
        error.response = { status, data, config };
        reject(error);
      };
    });
  };
  return {
    adapter,
    async waitUntilStarted() {
      while (!rejectRequest) await Promise.resolve();
      return capturedConfig;
    },
    reject(status, data) {
      rejectRequest(status, data);
    },
  };
};

const setClientSession = (token = "client-token") => {
  localStorage.setItem("role", "client");
  localStorage.setItem("token", token);
  localStorage.setItem("clientToken", token);
  localStorage.setItem("company_id", "41");
};

const setSession = ({ role, token, companyId = "41" }) => {
  localStorage.setItem("role", role);
  localStorage.setItem("token", token);
  localStorage.setItem("company_id", companyId);
};

describe("api client-session interceptors", () => {
  beforeEach(() => {
    localStorage.clear();
    window.history.replaceState({}, "", "/login");
  });

  it("logs out a verified rejection of the active client token", async () => {
    setClientSession();
    const events = [];
    const listener = (event) => events.push(event.detail);
    window.addEventListener(CLIENT_SESSION_STATE_EVENT, listener);

    await expect(api.get("/_test/client", {
      adapter: rejectedResponseAdapter(401, {
        error: "authentication_rejected",
        code: "TOKEN_EXPIRED",
      }),
    })).rejects.toMatchObject({ clientSessionInvalidated: true });

    expect(localStorage.getItem("token")).toBeNull();
    expect(events).toEqual([
      expect.objectContaining({
        signedIn: false,
        reason: "authentication-rejected",
        code: "TOKEN_EXPIRED",
      }),
    ]);
    window.removeEventListener(CLIENT_SESSION_STATE_EVENT, listener);
  });

  it("does not let wrong-password or unrelated authorization failures clear a session", async () => {
    setClientSession();

    await expect(api.post("/login", {}, {
      noAuth: true,
      noCompanyHeader: true,
      adapter: rejectedResponseAdapter(401, { error: "Invalid credentials" }),
    })).rejects.toBeTruthy();
    await expect(api.get("/_test/forbidden", {
      adapter: rejectedResponseAdapter(403, { error: "Forbidden" }),
    })).rejects.toBeTruthy();
    await expect(api.get("/_test/unrelated-unauthorized", {
      adapter: rejectedResponseAdapter(401, { error: "permission_required" }),
    })).rejects.toBeTruthy();

    expect(localStorage.getItem("token")).toBe("client-token");
    expect(localStorage.getItem("role")).toBe("client");
  });

  it("does not let delayed expiry or disabled responses clear a newer session", async () => {
    setClientSession("token-a");
    const expired = deferredRejectedResponseAdapter();
    const disabled = deferredRejectedResponseAdapter();
    const expiredRequest = api.get("/_test/slow-expiry", { adapter: expired.adapter }).catch((error) => error);
    const disabledRequest = api.get("/_test/slow-disabled", { adapter: disabled.adapter }).catch((error) => error);
    await Promise.all([expired.waitUntilStarted(), disabled.waitUntilStarted()]);

    setClientSession("token-b");
    expired.reject(401, { error: "authentication_rejected", code: "TOKEN_EXPIRED" });
    disabled.reject(403, { error: "account_access_denied", code: "USER_DISABLED" });
    await Promise.all([expiredRequest, disabledRequest]);

    expect(localStorage.getItem("token")).toBe("token-b");
    expect(localStorage.getItem("role")).toBe("client");
    expect(localStorage.getItem("company_id")).toBe("41");
  });

  it("does not let a delayed client response clear a newly active manager session", async () => {
    setClientSession("client-token");
    const delayed = deferredRejectedResponseAdapter();
    const request = api.get("/_test/slow-client", { adapter: delayed.adapter }).catch((error) => error);
    await delayed.waitUntilStarted();

    localStorage.setItem("role", "manager");
    localStorage.setItem("token", "manager-token");
    localStorage.setItem("company_id", "99");
    delayed.reject(403, { error: "account_access_denied", code: "TENANT_DISABLED" });
    await request;

    expect(localStorage.getItem("token")).toBe("manager-token");
    expect(localStorage.getItem("role")).toBe("manager");
    expect(localStorage.getItem("company_id")).toBe("99");
  });

  it("publishes only one logout for duplicate failures from the same session", async () => {
    setClientSession();
    const events = [];
    const listener = (event) => events.push(event.detail);
    window.addEventListener(CLIENT_SESSION_STATE_EVENT, listener);
    const first = deferredRejectedResponseAdapter();
    const second = deferredRejectedResponseAdapter();
    const firstRequest = api.get("/_test/first", { adapter: first.adapter }).catch((error) => error);
    const secondRequest = api.get("/_test/second", { adapter: second.adapter }).catch((error) => error);
    await Promise.all([first.waitUntilStarted(), second.waitUntilStarted()]);

    first.reject(401, { error: "authentication_rejected", code: "TOKEN_EXPIRED" });
    await firstRequest;
    second.reject(401, { error: "authentication_rejected", code: "TOKEN_EXPIRED" });
    await secondRequest;

    expect(events.filter((event) => event.signedIn === false)).toHaveLength(1);
    window.removeEventListener(CLIENT_SESSION_STATE_EVENT, listener);
  });

  it("routes a current disabled client through the tenant-aware session event", async () => {
    setClientSession();
    const clientEvents = [];
    const genericEvents = [];
    const clientListener = (event) => clientEvents.push(event.detail);
    const genericListener = (event) => genericEvents.push(event.detail);
    window.addEventListener(CLIENT_SESSION_STATE_EVENT, clientListener);
    window.addEventListener("schedulaa:account-disabled", genericListener);

    await expect(api.get("/_test/disabled-client", {
      adapter: rejectedResponseAdapter(403, {
        error: "account_access_denied",
        code: "USER_DISABLED",
        message: "This user account is disabled.",
      }),
    })).rejects.toMatchObject({ clientSessionInvalidated: true, accountDisabled: true });

    expect(clientEvents).toEqual([
      expect.objectContaining({ signedIn: false, reason: "account-disabled" }),
    ]);
    expect(genericEvents).toHaveLength(0);
    window.removeEventListener(CLIENT_SESSION_STATE_EVENT, clientListener);
    window.removeEventListener("schedulaa:account-disabled", genericListener);
  });

  it.each(["manager", "employee"])(
    "preserves the existing %s disabled-account behavior",
    async (role) => {
      localStorage.setItem("role", role);
      localStorage.setItem("token", `${role}-token`);
      localStorage.setItem("company_id", "41");
      const events = [];
      const listener = (event) => events.push(event.detail);
      window.addEventListener("schedulaa:account-disabled", listener);

      await expect(api.get("/_test/disabled-manager", {
        adapter: rejectedResponseAdapter(403, {
          error: "account_access_denied",
          code: "TENANT_DISABLED",
        }),
      })).rejects.toMatchObject({ accountDisabled: true });

      expect(localStorage.getItem("token")).toBeNull();
      expect(localStorage.getItem("role")).toBeNull();
      expect(events).toEqual([
        expect.objectContaining({ code: "TENANT_DISABLED" }),
      ]);
      window.removeEventListener("schedulaa:account-disabled", listener);
    },
  );

  it.each([
    ["manager", "manager-a", "client", "client-b"],
    ["employee", "employee-a", "client", "client-b"],
    ["client", "client-a", "manager", "manager-b"],
    ["manager", "manager-a", "manager", "manager-b"],
    ["employee", "employee-a", "employee", "employee-b"],
    ["client", "client-a", "client", "client-b"],
  ])(
    "ignores a stale disabled response after %s to %s account/session changes",
    async (requestRole, requestToken, activeRole, activeToken) => {
      setSession({ role: requestRole, token: requestToken, companyId: "41" });
      const delayed = deferredRejectedResponseAdapter();
      const events = [];
      const accountListener = (event) => events.push(event.detail);
      const clientListener = (event) => events.push(event.detail);
      window.addEventListener("schedulaa:account-disabled", accountListener);
      window.addEventListener(CLIENT_SESSION_STATE_EVENT, clientListener);
      const request = api.get("/_test/role-change", {
        adapter: delayed.adapter,
      }).catch((error) => error);
      await delayed.waitUntilStarted();

      setSession({ role: activeRole, token: activeToken, companyId: "41" });
      delayed.reject(403, {
        error: "account_access_denied",
        code: "USER_DISABLED",
      });
      await request;

      expect(localStorage.getItem("token")).toBe(activeToken);
      expect(localStorage.getItem("role")).toBe(activeRole);
      expect(localStorage.getItem("company_id")).toBe("41");
      expect(events).toEqual([]);
      expect(window.location.pathname).toBe("/login");
      window.removeEventListener("schedulaa:account-disabled", accountListener);
      window.removeEventListener(CLIENT_SESSION_STATE_EVENT, clientListener);
    },
  );

  it("ignores a stale disabled response after the active company changes", async () => {
    setSession({ role: "manager", token: "manager-token", companyId: "41" });
    const delayed = deferredRejectedResponseAdapter();
    const events = [];
    const listener = (event) => events.push(event.detail);
    window.addEventListener("schedulaa:account-disabled", listener);
    const request = api.get("/_test/company-change", {
      adapter: delayed.adapter,
    }).catch((error) => error);
    await delayed.waitUntilStarted();

    setSession({ role: "manager", token: "manager-token", companyId: "99" });
    delayed.reject(403, {
      error: "account_access_denied",
      code: "TENANT_DISABLED",
    });
    await request;

    expect(localStorage.getItem("token")).toBe("manager-token");
    expect(localStorage.getItem("role")).toBe("manager");
    expect(localStorage.getItem("company_id")).toBe("99");
    expect(events).toEqual([]);
    window.removeEventListener("schedulaa:account-disabled", listener);
  });

  it("keeps an active client session when an old tenant rejects the same token", async () => {
    setClientSession("shared-client-token");
    const delayed = deferredRejectedResponseAdapter();
    const events = [];
    const clientListener = (event) => events.push(event.detail);
    const disabledListener = (event) => events.push(event.detail);
    window.addEventListener(CLIENT_SESSION_STATE_EVENT, clientListener);
    window.addEventListener("schedulaa:account-disabled", disabledListener);
    const request = api.get("/_test/client-tenant-change", {
      adapter: delayed.adapter,
    }).catch((error) => error);
    await delayed.waitUntilStarted();

    localStorage.setItem("company_id", "99");
    delayed.reject(403, {
      error: "account_access_denied",
      code: "TENANT_DISABLED",
    });
    await request;

    expect(localStorage.getItem("token")).toBe("shared-client-token");
    expect(localStorage.getItem("role")).toBe("client");
    expect(localStorage.getItem("company_id")).toBe("99");
    expect(events).toEqual([]);
    expect(window.location.pathname).toBe("/login");
    window.removeEventListener(CLIENT_SESSION_STATE_EVENT, clientListener);
    window.removeEventListener("schedulaa:account-disabled", disabledListener);
  });

  it("still clears a globally expired active credential after a tenant switch", async () => {
    setClientSession("shared-client-token");
    const delayed = deferredRejectedResponseAdapter();
    const request = api.get("/_test/client-token-expiry", {
      adapter: delayed.adapter,
    }).catch((error) => error);
    await delayed.waitUntilStarted();

    localStorage.setItem("company_id", "99");
    delayed.reject(401, {
      error: "authentication_rejected",
      code: "TOKEN_EXPIRED",
    });
    const error = await request;

    expect(error).toMatchObject({ clientSessionInvalidated: true });
    expect(localStorage.getItem("token")).toBeNull();
    expect(localStorage.getItem("role")).toBeNull();
  });
});
