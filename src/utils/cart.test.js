import { CART_CHANGED_EVENT, clearCart, saveCart } from "./cart";

describe("cart change notifications", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
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
