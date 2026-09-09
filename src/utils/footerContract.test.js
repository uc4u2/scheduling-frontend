import { formatCompanyProfileAddress, formatCopyrightText } from "./footerDefaults";
import { defaultFooterConfig, normalizeFooterConfig } from "./headerFooter";

describe("shared footer presentation contract", () => {
  it("keeps legacy footer data visible by default", () => {
    expect(normalizeFooterConfig({ columns: [] })).toEqual(
      expect.objectContaining({
        show_contact_card: true,
        show_public_email: true,
        show_phone: true,
        show_address: true,
      })
    );
  });

  it("normalizes explicit visibility and Contact Card fields without contact values", () => {
    const normalized = normalizeFooterConfig({
      show_contact_card: false,
      show_public_email: false,
      show_phone: false,
      show_address: false,
      contact_eyebrow: "Reach out",
      contact_introduction: "We are here to listen.",
      contact_cta_label: "Contact our team",
      contact_cta_href: "/contact",
    });

    expect(normalized).toEqual(
      expect.objectContaining({
        show_contact_card: false,
        show_public_email: false,
        show_phone: false,
        show_address: false,
        contact_eyebrow: "Reach out",
        contact_introduction: "We are here to listen.",
        contact_cta_label: "Contact our team",
        contact_cta_href: "/contact",
      })
    );
    expect(normalized).not.toHaveProperty("email");
    expect(normalized).not.toHaveProperty("phone");
    expect(normalized).not.toHaveProperty("address");
  });

  it("resolves year, company, and siteTitle without changing company semantics", () => {
    const result = formatCopyrightText("© {{year}} {{company}} · {{siteTitle}}", {
      company: "Dr. Behnaz",
      siteTitle: "Bridge of Care Community Services",
    });

    expect(result).toBe(`© ${new Date().getFullYear()} Dr. Behnaz · Bridge of Care Community Services`);
  });

  it("ships empty social configuration and safe visibility defaults", () => {
    expect(defaultFooterConfig()).toEqual(
      expect.objectContaining({
        social_links: [],
        show_contact_card: true,
        show_public_email: true,
        show_phone: true,
        show_address: true,
      })
    );
  });

  it("uses the Company Profile one-line address or its structured field fallback", () => {
    expect(formatCompanyProfileAddress({ address: "100 Community Way" })).toBe("100 Community Way");
    expect(formatCompanyProfileAddress({
      address_street: "100 Community Way",
      address_city: "Toronto",
      address_state: "ON",
      address_zip: "M1M 1M1",
    })).toBe("100 Community Way, Toronto, ON M1M 1M1");
  });
});
