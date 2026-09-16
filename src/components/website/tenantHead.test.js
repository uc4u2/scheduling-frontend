import { resolveTenantFavicon, setTenantFavicon } from "./tenantHead";

describe("tenant favicon browser compatibility", () => {
  afterEach(() => {
    document.head.querySelectorAll("link[rel='icon'], link[rel='shortcut icon']").forEach((node) => node.remove());
  });

  test("uses only the backend-resolved tenant favicon", () => {
    expect(resolveTenantFavicon({
      favicon_url: "https://media.example.com/favicon.png",
      header: { logo_url: "https://media.example.com/rectangular-header.png" },
    })).toBe("https://media.example.com/favicon.png");

    expect(resolveTenantFavicon({
      header: { logo_url: "https://media.example.com/rectangular-header.png" },
      company: { logo_url: "https://app.schedulaa.com/favicon.ico" },
    })).toBe("");
  });

  test("removes platform icon links when no tenant favicon resolves", () => {
    document.head.innerHTML = '<link rel="icon" href="/favicon.ico"><link rel="shortcut icon" href="/favicon.ico">';
    setTenantFavicon("");
    expect(document.head.querySelector("link[rel='icon']")).toBeNull();
    expect(document.head.querySelector("link[rel='shortcut icon']")).toBeNull();
  });
});
