import {
  SUPPORT_COMMERCE_PANELS,
  getSupportCommercePanels,
  getSupportWorkspaceContext,
  isSupportCommercePanel,
  supportCapabilitiesAllowPanel,
} from "./supportWorkspaceAccess";

describe("support commerce workspace access", () => {
  test("allows only the approved support commerce panels", () => {
    expect(SUPPORT_COMMERCE_PANELS).toEqual([
      "services",
      "products",
      "digital-products",
      "easypost-shipping",
    ]);
    expect(isSupportCommercePanel("services")).toBe(true);
    expect(isSupportCommercePanel("digital-products")).toBe(true);
    expect(isSupportCommercePanel("payments")).toBe(false);
    expect(isSupportCommercePanel("product-orders")).toBe(false);
  });

  test("maps approved capabilities to the exact visible panels", () => {
    const capabilities = ["website_builder", "services_manage", "products_manage"];
    expect(getSupportCommercePanels(capabilities)).toEqual(["services", "products"]);
    expect(supportCapabilitiesAllowPanel(capabilities, "services")).toBe(true);
    expect(supportCapabilitiesAllowPanel(capabilities, "easypost-shipping")).toBe(false);
    expect(supportCapabilitiesAllowPanel(capabilities, "payments")).toBe(false);
    expect(supportCapabilitiesAllowPanel(capabilities, "digital-products")).toBe(false);
    expect(getSupportCommercePanels([...capabilities, "digital_products_manage"])).toEqual([
      "services",
      "products",
      "digital-products",
    ]);
  });

  test("requires the exact support route and both session identifiers", () => {
    expect(
      getSupportWorkspaceContext(
        "/manager/advanced-management",
        "?panel=products&support_session=9&company_id=36"
      )
    ).toMatchObject({ valid: true, initialView: "advanced-management", panel: "products" });

    expect(
      getSupportWorkspaceContext(
        "/manager/payments",
        "?panel=products&support_session=9&company_id=36"
      ).valid
    ).toBe(false);
    expect(
      getSupportWorkspaceContext(
        "/manager/advanced-management",
        "?panel=payments&support_session=9&company_id=36"
      ).valid
    ).toBe(false);
  });
});
