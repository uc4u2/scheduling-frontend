export const TRANSACTIONAL_MEASURE_MESSAGE = "schedulaa:transactional-measure";
export const TRANSACTIONAL_READY_MESSAGE = "schedulaa:transactional-ready";
export const TRANSACTIONAL_RESIZE_MESSAGE = "schedulaa:transactional-resize";
export const TRANSACTIONAL_NAVIGATE_MESSAGE = "schedulaa:transactional-navigate";

export function normalizeTransactionalReturnPath(value = "") {
  const raw = String(value || "").trim();
  if (!raw.startsWith("/") || raw.startsWith("//")) return "";
  try {
    const parsed = new URL(raw, "https://schedulaa.local");
    if (parsed.origin !== "https://schedulaa.local") return "";
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return "";
  }
}

export function normalizePackageCheckoutReturnPath(value = "", tenantSlug = "") {
  const safePath = normalizeTransactionalReturnPath(value);
  if (!safePath) return "";

  const parsed = new URL(safePath, "https://schedulaa.local");
  const sessionId = String(parsed.searchParams.get("session_id") || "").trim();
  if (
    !sessionId ||
    sessionId.length > 128 ||
    !sessionId.startsWith("cs_") ||
    /CHECKOUT_SESSION_ID/i.test(sessionId)
  ) {
    return "";
  }

  const slug = String(tenantSlug || "").trim();
  const cleanPath = parsed.pathname.length > 1
    ? parsed.pathname.replace(/\/+$/, "")
    : parsed.pathname;
  const rootReturn = cleanPath === "/packages/return";
  const tenantReturn = slug && cleanPath === `/${encodeURIComponent(slug)}/packages/return`;
  const dashboardReturn =
    cleanPath === "/dashboard" &&
    parsed.searchParams.get("package_return") === "1";
  if (!rootReturn && !tenantReturn && !dashboardReturn) return "";

  const requestedSite = String(parsed.searchParams.get("site") || "").trim();
  if (dashboardReturn && !requestedSite) return "";
  if (slug && requestedSite && requestedSite !== slug) return "";
  return `${parsed.pathname}${parsed.search}`;
}

export function parseClientOrderDestination(search = "", tenantSlug = "") {
  const params = new URLSearchParams(String(search || "").replace(/^\?/, ""));
  if (params.get("view") !== "orders") {
    return { requested: false, valid: false, orderId: null };
  }

  const rawOrderId = String(params.get("order_id") || "").trim();
  const resolvedTenant = String(tenantSlug || "").trim();
  const requestedTenant = String(params.get("site") || "").trim();
  const numericOrderId = Number(rawOrderId);
  const validOrderId = /^[1-9]\d*$/.test(rawOrderId) && Number.isSafeInteger(numericOrderId);
  const tenantMatches = !requestedTenant || !resolvedTenant || requestedTenant === resolvedTenant;
  return {
    requested: true,
    valid: Boolean(validOrderId && resolvedTenant && tenantMatches),
    orderId: validOrderId ? numericOrderId : null,
  };
}

export function normalizeClientOrderReturnPath(value = "", tenantSlug = "") {
  const safePath = normalizeTransactionalReturnPath(value);
  const slug = String(tenantSlug || "").trim();
  if (!safePath || !slug) return "";

  const parsed = new URL(safePath, "https://schedulaa.local");
  const destination = parseClientOrderDestination(parsed.search, slug);
  if (!destination.valid) return "";

  const encodedSlug = encodeURIComponent(slug);
  const cleanPath = parsed.pathname.length > 1
    ? parsed.pathname.replace(/\/+$/, "")
    : parsed.pathname;
  const allowedPaths = new Set([
    "/my-bookings",
    `/${encodedSlug}/my-bookings`,
    "/dashboard",
    `/${encodedSlug}/client/bookings`,
  ]);
  if (!allowedPaths.has(cleanPath)) return "";

  const query = new URLSearchParams();
  if (cleanPath === "/dashboard") query.set("site", slug);
  query.set("view", "orders");
  query.set("order_id", String(destination.orderId));
  ["embed", "mode", "dialog", "primary", "text"].forEach((key) => {
    if (parsed.searchParams.has(key)) query.set(key, parsed.searchParams.get(key));
  });
  return `${cleanPath}?${query.toString()}`;
}

export function buildClientOrderDashboardReturnPath(search = "", tenantSlug = "") {
  const slug = String(tenantSlug || "").trim();
  const destination = parseClientOrderDestination(search, slug);
  if (!destination.valid) return "";

  const source = new URLSearchParams(String(search || "").replace(/^\?/, ""));
  const query = new URLSearchParams({
    site: slug,
    view: "orders",
    order_id: String(destination.orderId),
  });
  ["embed", "mode", "dialog", "primary", "text"].forEach((key) => {
    if (source.has(key)) query.set(key, source.get(key));
  });
  return `/dashboard?${query.toString()}`;
}

export function requestTransactionalNavigation(targetWindow, value = "") {
  const href = normalizeTransactionalReturnPath(value);
  if (!href || !targetWindow?.postMessage) return false;
  targetWindow.postMessage({ type: TRANSACTIONAL_NAVIGATE_MESSAGE, href }, "*");
  return true;
}

function measureNode(node) {
  if (!node) return 0;
  return Math.ceil(Math.max(Number(node.scrollHeight) || 0, Number(node.getBoundingClientRect?.().height) || 0));
}

function measureDialog(dialog) {
  if (!dialog) return 0;
  const paper = dialog.querySelector?.(".MuiDialog-paper") || dialog;
  const content = paper.querySelector?.(".MuiDialogContent-root");
  if (!content) return measureNode(paper) + 64;

  const children = Array.from(paper.children || []);
  const chromeHeight = children
    .filter((child) => child !== content)
    .reduce((total, child) => total + measureNode(child), 0);

  // MUI constrains a dialog to the iframe viewport and makes DialogContent
  // scroll internally. Use the content's full scrollHeight plus the title and
  // action chrome so the parent iframe can grow to the real checkout height.
  return measureNode(content) + chromeHeight + 64;
}

export function measureTransactionalContent(node, dialogs = []) {
  const contentHeight = measureNode(node);
  const dialogHeight = Array.from(dialogs || []).reduce(
    (maximum, dialog) => Math.max(maximum, measureDialog(dialog)),
    0
  );
  return Math.ceil(Math.max(contentHeight, dialogHeight));
}

export function publishTransactionalMeasurement(targetWindow, node, dialogs = []) {
  const height = measureTransactionalContent(node, dialogs);
  if (!targetWindow?.postMessage || !height) return 0;
  targetWindow.postMessage({ type: TRANSACTIONAL_READY_MESSAGE }, "*");
  targetWindow.postMessage({ type: TRANSACTIONAL_RESIZE_MESSAGE, height: height + 2 }, "*");
  return height + 2;
}
