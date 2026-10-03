import {
  BasketBrowseKinds,
  basketBrowseLabel,
  inferBasketBrowseKind,
} from "./basketNavigation";

describe("basket navigation", () => {
  it("routes service and package baskets back to services", () => {
    expect(inferBasketBrowseKind([{ type: "service" }])).toBe(BasketBrowseKinds.SERVICES);
    expect(inferBasketBrowseKind([{ type: "package" }])).toBe(BasketBrowseKinds.SERVICES);
    expect(basketBrowseLabel(BasketBrowseKinds.SERVICES)).toBe("Browse services");
  });

  it("keeps product baskets routed to products", () => {
    expect(inferBasketBrowseKind([{ type: "product" }])).toBe(BasketBrowseKinds.PRODUCTS);
    expect(basketBrowseLabel(BasketBrowseKinds.PRODUCTS)).toBe("Browse products");
  });

  it("preserves the previous context after the final item is removed", () => {
    expect(inferBasketBrowseKind([], BasketBrowseKinds.SERVICES)).toBe(BasketBrowseKinds.SERVICES);
    expect(inferBasketBrowseKind([], BasketBrowseKinds.PRODUCTS)).toBe(BasketBrowseKinds.PRODUCTS);
  });
});
