import { isEmbeddedTransactionalLocation } from "./embeddedTransactionalRoutes";

describe("isEmbeddedTransactionalLocation", () => {
  test.each([
    "/services/112",
    "/services/112/employees/67",
    "/beauty-salon/services/112",
    "/beauty-salon/services/112/employees/67",
    "/products/73",
    "/beauty-salon/products/73",
    "/basket",
    "/beauty-salon/basket",
    "/checkout",
    "/beauty-salon/checkout/return",
    "/book/67/112",
    "/beauty-salon/book",
    "/booking-confirmation/123",
    "/client/book/beauty-salon/112/67",
    "/client/booking-confirmation/123",
  ])("uses the transactional runtime for %s", (pathname) => {
    expect(
      isEmbeddedTransactionalLocation({ pathname, search: "?embed=1&site=beauty-salon" })
    ).toBe(true);
  });

  test.each([
    ["/beauty-salon/basket", ""],
    ["/beauty-salon/basket", "?embed=0"],
    ["/beauty-salon/services", "?embed=1"],
    ["/login", "?embed=1&site=beauty-salon"],
    ["/beauty-salon/client/bookings", "?embed=1"],
    ["/manager/dashboard", "?embed=1"],
  ])("keeps %s on the full runtime", (pathname, search) => {
    expect(isEmbeddedTransactionalLocation({ pathname, search })).toBe(false);
  });
});

