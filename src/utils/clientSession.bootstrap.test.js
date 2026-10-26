import { createHash } from "crypto";
import { TextEncoder } from "util";

const flush = async () => { for (let i = 0; i < 12; i += 1) await Promise.resolve(); };
const token = (id) => `${btoa('{}')}.${btoa(JSON.stringify({ role: "client", sub: String(id) }))}.sig`;

describe("PKCE client bootstrap document", () => {
  let originalParent;
  let originalReferrer;
  let originalCrypto;
  let originalEncoder;
  let parent;
  let bridge;
  beforeEach(() => {
    jest.resetModules();
    jest.useFakeTimers();
    localStorage.clear();
    sessionStorage.clear();
    window.history.replaceState({}, "", "/login?site=beauty-salon&client=1&embed=1&bootstrap=1");
    originalParent = Object.getOwnPropertyDescriptor(window, "parent");
    originalReferrer = Object.getOwnPropertyDescriptor(document, "referrer");
    originalCrypto = Object.getOwnPropertyDescriptor(window, "crypto");
    originalEncoder = global.TextEncoder;
    global.TextEncoder = TextEncoder;
    parent = { postMessage: jest.fn() };
    Object.defineProperty(window, "parent", { configurable: true, value: parent });
    Object.defineProperty(document, "referrer", { configurable: true, value: "https://www.lumiereprivatesalon.com/checkout" });
    Object.defineProperty(window, "crypto", { configurable: true, value: {
      getRandomValues: (bytes) => bytes.fill(7),
      subtle: { digest: async (_, bytes) => Uint8Array.from(createHash("sha256").update(bytes).digest()).buffer },
    } });
    bridge = require("./clientSession");
  });
  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    Object.defineProperty(window, "parent", originalParent);
    Object.defineProperty(document, "referrer", originalReferrer || { configurable: true, value: "" });
    if (originalCrypto) Object.defineProperty(window, "crypto", originalCrypto);
    else delete window.crypto;
    global.TextEncoder = originalEncoder;
    window.history.replaceState({}, "", "/");
  });
  const send = (data, source, origin = "https://www.lumiereprivatesalon.com") =>
    window.dispatchEvent(new MessageEvent("message", { source, origin, data }));

  it("redeems exactly once with the matching verifier, then verifies membership before publishing", async () => {
    let resolveMe;
    const api = {
      post: jest.fn().mockResolvedValue({ data: { access_token: token(9) } }),
      get: jest.fn().mockReturnValue(new Promise(resolve => { resolveMe = resolve; })),
    };
    const dispose = bridge.installClientSessionBridge(api);
    await flush();
    const request = parent.postMessage.mock.calls[0][0];
    expect(request.type).toBe(bridge.CLIENT_SESSION_HANDOFF_REQUEST_TYPE);
    const data = { type: bridge.CLIENT_SESSION_HANDOFF_TYPE, tenantSlug: "beauty-salon", code: "c".repeat(43) };
    send(data, parent, "https://evil.example");
    send({ ...data, tenantSlug: "other-salon" }, parent);
    send({ ...data, code: "bad" }, parent);
    expect(api.post).not.toHaveBeenCalled();
    send(data, parent);
    send(data, parent);
    await flush();
    expect(api.post).toHaveBeenCalledTimes(1);
    const body = api.post.mock.calls[0][1];
    expect(createHash("sha256").update(body.code_verifier).digest("base64url")).toBe(request.codeChallenge);
    expect(localStorage.getItem("token")).toBeNull();
    resolveMe({ data: { email: "client@example.test" } });
    await flush();
    expect(localStorage.getItem("token")).toBe(token(9));
    expect(parent.postMessage).toHaveBeenCalledWith(expect.objectContaining({ signedIn: true, reason: "authenticated" }), "https://www.lumiereprivatesalon.com");
    const messages = JSON.stringify(parent.postMessage.mock.calls);
    expect(messages).not.toContain(body.code_verifier);
    expect(messages).not.toContain(token(9));
    expect(messages).not.toContain("client@example.test");
    dispose();
  });

  it("persists only the tenant presentation hint across a full-page navigation", () => {
    bridge.publishClientSessionState(true, { tenantSlug: "beauty-salon", reason: "verified-client-session" });
    expect(localStorage.getItem("schedulaa:client-session:beauty-salon")).toBe("1");
    expect(localStorage.getItem("token")).toBeNull();
    bridge.publishClientSessionState(false, { tenantSlug: "beauty-salon", reason: "logout" });
    expect(localStorage.getItem("schedulaa:client-session:beauty-salon")).toBeNull();
  });
});
