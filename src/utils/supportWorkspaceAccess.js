export const SUPPORT_COMMERCE_PANELS = Object.freeze([
  "services",
  "products",
  "easypost-shipping",
]);

export const SUPPORT_PANEL_CAPABILITIES = Object.freeze({
  services: "services_manage",
  products: "products_manage",
  "easypost-shipping": "shipping_manage",
});

export const isSupportCommercePanel = (panel) =>
  SUPPORT_COMMERCE_PANELS.includes(String(panel || ""));

export const supportCapabilitiesAllowPanel = (capabilities, panel) => {
  const requiredCapability = SUPPORT_PANEL_CAPABILITIES[String(panel || "")];
  return Boolean(
    requiredCapability &&
    Array.isArray(capabilities) &&
    capabilities.includes(requiredCapability)
  );
};

export const getSupportCommercePanels = (capabilities) =>
  SUPPORT_COMMERCE_PANELS.filter((panel) =>
    supportCapabilitiesAllowPanel(capabilities, panel)
  );

export const getSupportWorkspaceContext = (pathname, search = "") => {
  const params = new URLSearchParams(search || "");
  const supportSessionId = params.get("support_session");
  const companyId = params.get("company_id");
  const panel = params.get("panel");
  const valid = Boolean(
    pathname === "/manager/advanced-management" &&
    supportSessionId &&
    companyId &&
    isSupportCommercePanel(panel)
  );

  return {
    valid,
    supportSessionId,
    companyId,
    panel,
    initialView: valid ? "advanced-management" : "website-pages",
  };
};
