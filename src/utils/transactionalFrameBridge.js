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
