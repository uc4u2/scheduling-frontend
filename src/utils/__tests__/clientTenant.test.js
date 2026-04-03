import {
  buildTenantDashboardPath,
  buildTenantLoginPath,
  getStoredTenantSlug,
  persistTenantSlug,
  resolveTenantSlug,
  tenantParams,
} from "../clientTenant";

describe("clientTenant helpers", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  test("resolves slug from query before local storage", () => {
    window.localStorage.setItem("site", "stored-tenant");

    expect(resolveTenantSlug({ search: "?site=query-tenant" })).toBe("query-tenant");
  });

  test("persists and reads tenant slug", () => {
    persistTenantSlug("sale");
    expect(getStoredTenantSlug()).toBe("sale");
  });

  test("builds tenant-aware client redirect paths", () => {
    expect(buildTenantLoginPath("sale")).toBe("/login?site=sale");
    expect(buildTenantDashboardPath("sale", { page: "my-bookings" })).toBe(
      "/dashboard?site=sale&page=my-bookings"
    );
  });

  test("builds request params only when slug is present", () => {
    expect(tenantParams("sale")).toEqual({ slug: "sale" });
    expect(tenantParams("")).toEqual({});
  });
});
