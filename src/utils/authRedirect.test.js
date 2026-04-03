jest.mock("./api", () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
  },
}));

import { getAuthRedirectTarget } from "./authRedirect";

describe("getAuthRedirectTarget", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  test("uses tenant-aware dashboard for client when site is known", () => {
    window.localStorage.setItem("site", "sale");

    expect(getAuthRedirectTarget({ user: { role: "client" }, searchParams: "" })).toBe(
      "/dashboard?site=sale"
    );
  });

  test("prefers query-string site for client redirect", () => {
    window.localStorage.setItem("site", "sale");

    expect(
      getAuthRedirectTarget({
        user: { role: "client" },
        searchParams: new URLSearchParams("site=tenant-b"),
      })
    ).toBe("/dashboard?site=tenant-b");
  });
});
