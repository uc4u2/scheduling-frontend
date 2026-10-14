import {
  deriveGoogleVerificationState,
  formatGoogleDnsRecord,
  normalizeGoogleDnsVerification,
  normalizeGoogleSiteVerification,
  resolveSearchConsolePropertyUrl,
} from "./googleSearchConsole";

describe("Google Search Console verification contract", () => {
  test.each([
    ["abc123EXAMPLE", "abc123EXAMPLE"],
    ["  abc_123-EXAMPLE  ", "abc_123-EXAMPLE"],
    ['<meta name="google-site-verification" content="abc123EXAMPLE">', "abc123EXAMPLE"],
    ["<meta content='abc_123-EXAMPLE' name='google-site-verification' />", "abc_123-EXAMPLE"],
    ["", ""],
  ])("normalizes HTML input %s", (value, expected) => {
    expect(normalizeGoogleSiteVerification(value)).toBe(expected);
  });

  test.each([
    ["short"],
    ["abc token 123"],
    ['<meta name="description" content="abc123EXAMPLE">'],
    ['<meta name="google-site-verification" content="abc123EXAMPLE"><script>alert(1)</script>'],
    ['<meta name="google-site-verification" content="abc123EXAMPLE" onload="alert(1)">'],
  ])("rejects unsafe HTML input %s", (value) => {
    expect(() => normalizeGoogleSiteVerification(value)).toThrow();
  });

  test("normalizes complete DNS TXT values without duplicating the prefix", () => {
    expect(normalizeGoogleDnsVerification("google-site-verification=dnsToken_123")).toBe("dnsToken_123");
    expect(formatGoogleDnsRecord("google-site-verification=dnsToken_123")).toBe(
      "google-site-verification=dnsToken_123"
    );
  });

  test("uses only the authoritative public URL contract", () => {
    expect(resolveSearchConsolePropertyUrl({
      custom_domain_active: true,
      custom_domain_url: "https://www.example.ca",
      schedulaa_url: "https://schedulaa.com/example",
    })).toBe("https://www.example.ca/");
    expect(resolveSearchConsolePropertyUrl({
      custom_domain_active: false,
      primary_public_url: "https://schedulaa.com/example",
    })).toBe("https://schedulaa.com/example/");
    expect(resolveSearchConsolePropertyUrl({
      custom_domain_active: true,
      custom_domain_url: "https://www.new-example.ca",
      primary_public_url: "https://www.new-example.ca",
      schedulaa_url: "https://schedulaa.com/example",
    })).toBe("https://www.new-example.ca/");
    expect(resolveSearchConsolePropertyUrl(null)).toBe("");
  });

  test.each([
    [{}, "notConfigured"],
    [{ draftToken: "draftToken_123" }, "savedDraft"],
    [{ draftToken: "liveToken_123", publishedToken: "liveToken_123" }, "published"],
    [{ draftToken: "newToken_123", publishedToken: "oldToken_123" }, "replacementPending"],
    [{ publishedToken: "oldToken_123" }, "removalPending"],
  ])("derives state %s", (values, expected) => {
    expect(deriveGoogleVerificationState(values).key).toBe(expected);
  });
});
