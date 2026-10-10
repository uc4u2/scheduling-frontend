import {
  CART_BRIDGE_VERSION,
  CART_CHANGED_EVENT,
  CART_HYDRATE_MESSAGE,
  CART_READY_MESSAGE,
  CART_STATE_MESSAGE,
  clearCart,
  saveCart,
  setCartTenantContext,
  startCartBridge,
  validateBridgedCartItems,
} from "./cart";

describe("cart change notifications", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    setCartTenantContext("");
  });

  it("bridges a complete tenant-scoped cart instead of only a badge count", () => {
    const previousParent = Object.getOwnPropertyDescriptor(window, "parent");
    const previousReferrer = Object.getOwnPropertyDescriptor(document, "referrer");
    const parent = { postMessage: jest.fn() };
    Object.defineProperty(window, "parent", { configurable: true, value: parent });
    Object.defineProperty(document, "referrer", {
      configurable: true,
      value: "https://lumiere.example/services",
    });

    saveCart([{ id: "service-41", type: "service", quantity: 1 }], "lumiere");

    expect(parent.postMessage).toHaveBeenCalledWith({
      type: CART_STATE_MESSAGE,
      version: CART_BRIDGE_VERSION,
      tenantSlug: "lumiere",
      items: [{ id: "service-41", type: "service", quantity: 1 }],
      count: 1,
    }, "https://lumiere.example");

    if (previousParent) Object.defineProperty(window, "parent", previousParent);
    if (previousReferrer) Object.defineProperty(document, "referrer", previousReferrer);
  });

  it("hydrates only from the actual parent origin and matching tenant", () => {
    const previousParent = Object.getOwnPropertyDescriptor(window, "parent");
    const previousReferrer = Object.getOwnPropertyDescriptor(document, "referrer");
    const parent = { postMessage: jest.fn() };
    Object.defineProperty(window, "parent", { configurable: true, value: parent });
    Object.defineProperty(document, "referrer", {
      configurable: true,
      value: "https://lumiere.example/basket",
    });
    const onHydrate = jest.fn();
    const stop = startCartBridge({ tenantSlug: "lumiere", onHydrate });

    expect(parent.postMessage).toHaveBeenCalledWith({
      type: CART_READY_MESSAGE,
      version: CART_BRIDGE_VERSION,
      tenantSlug: "lumiere",
    }, "https://lumiere.example");

    window.dispatchEvent(new MessageEvent("message", {
      source: parent,
      origin: "https://evil.example",
      data: {
        type: CART_HYDRATE_MESSAGE,
        version: CART_BRIDGE_VERSION,
        tenantSlug: "lumiere",
        hasSnapshot: true,
        items: [{ id: "service-evil", type: "service", quantity: 1 }],
      },
    }));
    window.dispatchEvent(new MessageEvent("message", {
      source: parent,
      origin: "https://lumiere.example",
      data: {
        type: CART_HYDRATE_MESSAGE,
        version: CART_BRIDGE_VERSION,
        tenantSlug: "other-tenant",
        hasSnapshot: true,
        items: [{ id: "service-other", type: "service", quantity: 1 }],
      },
    }));
    expect(onHydrate).not.toHaveBeenCalled();

    window.dispatchEvent(new MessageEvent("message", {
      source: parent,
      origin: "https://lumiere.example",
      data: {
        type: CART_HYDRATE_MESSAGE,
        version: CART_BRIDGE_VERSION,
        tenantSlug: "lumiere",
        hasSnapshot: true,
        items: [{ id: "service-41", type: "service", quantity: 1 }],
      },
    }));
    expect(onHydrate).toHaveBeenCalledWith(
      [{ id: "service-41", type: "service", quantity: 1 }],
      true
    );

    stop();
    if (previousParent) Object.defineProperty(window, "parent", previousParent);
    if (previousReferrer) Object.defineProperty(document, "referrer", previousReferrer);
  });

  it("rejects oversized, mixed-shape, and unsupported bridged payloads", () => {
    expect(validateBridgedCartItems([{ id: "x", type: "unknown" }])).toBeNull();
    expect(validateBridgedCartItems(new Array(65).fill({ id: "x", type: "service" }))).toBeNull();
    expect(validateBridgedCartItems([{ id: "x", type: "package", quantity: 1 }])).toEqual([
      { id: "x", type: "package", quantity: 1 },
    ]);
  });

  it("announces the total quantity after saving", () => {
    const listener = jest.fn();
    window.addEventListener(CART_CHANGED_EVENT, listener);

    saveCart([
      { id: "service-1", type: "service", quantity: 1 },
      { id: "service-2", type: "service", quantity: 2 },
    ]);

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener.mock.calls[0][0].detail).toEqual({ count: 3 });
    window.removeEventListener(CART_CHANGED_EVENT, listener);
  });

  it("announces an empty basket after clearing", () => {
    const listener = jest.fn();
    window.addEventListener(CART_CHANGED_EVENT, listener);
    window.sessionStorage.setItem("booking_cart", JSON.stringify([{ id: "product-1", quantity: 1 }]));

    clearCart();

    expect(listener.mock.calls[0][0].detail).toEqual({ count: 0 });
    expect(window.sessionStorage.getItem("booking_cart")).toBeNull();
    window.removeEventListener(CART_CHANGED_EVENT, listener);
  });
});
