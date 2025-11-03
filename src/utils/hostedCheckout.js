import { api as apiClient } from "./api";
import { normalizeCurrency } from "./currency";
import { CartTypes, CartErrorCodes } from "./cart";

const CHECKOUT_SESSION_KEY = "checkout_stripe_session_id";
const PENDING_CHECKOUT_KEY = "checkout_pending_checkout_id";
const PRODUCT_ORDER_KEY = "checkout_product_order_id";

const normalizePolicyMode = (mode) => {
  const value = (mode || "pay").toLowerCase();
  return ["pay", "deposit", "capture"].includes(value) ? value : "pay";
};

const ensureArray = (value) => (Array.isArray(value) ? value : []);

const coerceNumber = (value) => {
  if (value == null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const parseProductId = (item) => {
  const direct = coerceNumber(item?.product_id);
  if (direct) return direct;
  const fromId = typeof item?.id === "string" ? item.id.replace(/^product-/, "") : null;
  return coerceNumber(fromId);
};

const collectAddonIds = (item) => {
  const ids = ensureArray(item?.addon_ids || (item?.addons || []).map((addon) => addon?.id));
  return ids
    .map((id) => coerceNumber(id))
    .filter((id) => id != null && id > 0);
};

const sanitizeMetadata = (metadata) => {
  if (!metadata || typeof metadata !== "object") return undefined;
  const entries = Object.entries(metadata)
    .filter(([key, value]) =>
      typeof key === "string" && key.trim() && (value == null || typeof value === "string" || typeof value === "number" || typeof value === "boolean")
    )
    .map(([key, value]) => [key.trim(), value]);
  if (!entries.length) return undefined;
  return Object.fromEntries(entries);
};

export const CHECKOUT_SESSION_STORAGE_KEY = CHECKOUT_SESSION_KEY;
export const PENDING_CHECKOUT_STORAGE_KEY = PENDING_CHECKOUT_KEY;
export const PRODUCT_ORDER_STORAGE_KEY = PRODUCT_ORDER_KEY;

export const buildHostedCheckoutPayload = ({
  cartItems,
  policyMode = "pay",
  currency,
  clientName,
  clientEmail,
  clientPhone,
  metadata,
}) => {
  const itemsPayload = [];

  ensureArray(cartItems).forEach((item) => {
    const itemType = (item?.type || CartTypes.SERVICE).toLowerCase();

    if (itemType === CartTypes.PRODUCT) {
      const productId = parseProductId(item);
      const quantity = Math.max(1, coerceNumber(item?.quantity) || 1);
      if (!productId || quantity <= 0) {
        throw new Error("Invalid product entry in cart.");
      }
      itemsPayload.push({
        type: "product",
        product_id: productId,
        quantity,
      });
      return;
    }

    const serviceId = coerceNumber(item?.service_id);
    const artistId = coerceNumber(item?.artist_id);
    const date = item?.date || item?.local_date;
    const startTime = item?.start_time || item?.local_time || item?.time;

    if (!serviceId || !artistId || !date || !startTime) {
      throw new Error("Service items must include service, provider, date, and start time.");
    }

    const entry = {
      type: "service",
      service_id: serviceId,
      artist_id: artistId,
      date,
      start_time: startTime,
    };

    const addonIds = collectAddonIds(item);
    if (addonIds.length) {
      entry.addon_ids = addonIds;
    }

    const linePrice = coerceNumber(item?.price ?? item?.line_price);
    if (linePrice != null && linePrice >= 0) {
      entry.line_price = Number(linePrice.toFixed(2));
    }

    const tipAmount = coerceNumber(item?.tip_amount ?? item?.tip);
    if (tipAmount != null && tipAmount > 0) {
      entry.tip_amount = Number(tipAmount.toFixed(2));
    } else {
      entry.tip_amount = 0;
    }

    const couponCode = item?.couponApplied && item?.coupon?.code ? String(item.coupon.code).trim() : null;
    if (couponCode) {
      entry.coupon_code = couponCode;
    }

    itemsPayload.push(entry);
  });

  const serviceCount = itemsPayload.filter((entry) => (entry.type || "service") === "service").length;
  const productCount = itemsPayload.filter((entry) => entry.type === "product").length;
  if (serviceCount && productCount) {
    const err = new Error("Services and retail products must be checked out separately. Please complete one checkout before starting another.");
    err.code = CartErrorCodes.MIXED_TYPES;
    throw err;
  }

  if (!itemsPayload.length) {
    throw new Error("Cart is empty.");
  }

  const normalizedCurrency = normalizeCurrency(currency);
  const payload = {
    items: itemsPayload,
    policy: { mode: normalizePolicyMode(policyMode) },
  };

  if (normalizedCurrency) {
    payload.currency = normalizedCurrency;
  }
  if (clientName) {
    payload.client_name = clientName;
  }
  if (clientEmail) {
    payload.client_email = clientEmail;
  }
  if (clientPhone) {
    payload.client_phone = clientPhone;
  }

  const cleanedMetadata = sanitizeMetadata(metadata);
  if (cleanedMetadata) {
    payload.metadata = cleanedMetadata;
  }

  return payload;
};

export const storeCheckoutContext = ({ sessionId, pendingCheckoutId, productOrderId }) => {
  try {
    if (sessionId) {
      sessionStorage.setItem(CHECKOUT_SESSION_KEY, sessionId);
    }
    if (pendingCheckoutId) {
      sessionStorage.setItem(PENDING_CHECKOUT_KEY, String(pendingCheckoutId));
    }
    if (productOrderId) {
      sessionStorage.setItem(PRODUCT_ORDER_KEY, String(productOrderId));
    }
  } catch {
    /* ignore storage errors */
  }
};

export const clearCheckoutContext = () => {
  try {
    sessionStorage.removeItem(CHECKOUT_SESSION_KEY);
    sessionStorage.removeItem(PENDING_CHECKOUT_KEY);
    sessionStorage.removeItem(PRODUCT_ORDER_KEY);
  } catch {
    /* ignore storage errors */
  }
};

const resolveTargetWindow = () => {
  try {
    const params = new URLSearchParams(window.location.search || "");
    const isEmbedded = params.get("embed") === "1" || window.self !== window.top;
    return isEmbedded ? window.top : window;
  } catch {
    return window;
  }
};

export const startHostedCheckout = async ({
  slug,
  payload,
  api = apiClient,
}) => {
  if (!slug) {
    throw new Error("Unable to determine company.");
  }
  if (!payload || typeof payload !== "object") {
    throw new Error("Checkout payload is invalid.");
  }

  const { data } = await api.post(`/public/${slug}/checkout/session`, payload, { noCompanyHeader: true });

  const sessionId =
    data?.id ||
    data?.stripe_session_id ||
    data?.session?.id ||
    data?.session_id ||
    null;
  const checkoutUrl = data?.url || data?.session?.url || data?.checkout_url;
  const pendingCheckoutId = data?.pending_checkout_id || data?.pending?.id;
  const productOrderId = data?.product_order_id || data?.order_id;

  if (!checkoutUrl || !sessionId) {
    throw new Error("Stripe Checkout URL unavailable. No charge was made.");
  }

  storeCheckoutContext({
    sessionId,
    pendingCheckoutId,
    productOrderId,
  });

  const target = resolveTargetWindow();
  target.location.assign(checkoutUrl);

  return {
    sessionId,
    pendingCheckoutId,
    productOrderId,
    url: checkoutUrl,
  };
};

export const getStoredPendingCheckoutId = () => {
  try {
    return sessionStorage.getItem(PENDING_CHECKOUT_KEY);
  } catch {
    return null;
  }
};

export const releasePendingCheckout = async ({ slug, reason = "user_cancelled", api = apiClient } = {}) => {
  let pendingCheckoutId = null;
  try {
    pendingCheckoutId = sessionStorage.getItem(PENDING_CHECKOUT_KEY);
  } catch {
    pendingCheckoutId = null;
  }
  if (!pendingCheckoutId) {
    return { released: false, status: "missing_id" };
  }
  if (!slug) {
    return { released: false, status: "missing_slug", pendingCheckoutId };
  }
  try {
    const payload = { pending_checkout_id: pendingCheckoutId, reason };
    const { data } = await api.post(`/public/${slug}/checkout/cancel`, payload, { noCompanyHeader: true });
    clearCheckoutContext();
    return { ...data, pendingCheckoutId };
  } catch (error) {
    return { released: false, status: "error", error, pendingCheckoutId };
  }
};

