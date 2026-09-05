import fs from "fs";
import path from "path";

const appSource = fs.readFileSync(path.resolve(__dirname, "../App.js"), "utf8");

describe("platform login tenant isolation", () => {
  test("does not mount the tenant shell when /login has no explicit site", () => {
    expect(appSource).toContain(
      'if (!slug) {\n    return <Login setToken={setToken} allowStoredSite={false} />;\n  }'
    );
  });

  test("keeps explicitly tenant-scoped login compatible", () => {
    expect(appSource).toContain(
      '<TenantTransactionalShell slugOverride={slug} activeKey="__login" pagePath="">'
    );
    expect(appSource).toContain(
      '<Login setToken={setToken} slugOverride={slug} allowStoredSite={false} />'
    );
  });
});
