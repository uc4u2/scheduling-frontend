import {
  BasketBrowseKinds,
  basketBrowseDescription,
  basketBrowseLabel,
  defaultBasketBrowseKind,
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

  it("defaults an empty service-only tenant basket to services", () => {
    expect(defaultBasketBrowseKind({ servicesReturnTo: "/services" })).toBe(BasketBrowseKinds.SERVICES);
    expect(basketBrowseLabel(BasketBrowseKinds.SERVICES)).toBe("Browse services");
    expect(basketBrowseDescription(BasketBrowseKinds.SERVICES)).toBe(
      "Review services and appointment details before checkout."
    );
  });

  it("keeps an empty product-capable tenant basket on products", () => {
    expect(defaultBasketBrowseKind({ productsReturnTo: "/products", servicesReturnTo: "/services" }))
      .toBe(BasketBrowseKinds.PRODUCTS);
    expect(basketBrowseDescription(BasketBrowseKinds.PRODUCTS)).toBe(
      "Review products before completing your purchase."
    );
  });
});
