const CART_KEY = "booking_cart";
const CART_TENANT_KEY = "schedulaa:booking-cart-tenant";
export const CART_CHANGED_EVENT = "schedulaa:basket-changed";
export const CART_BRIDGE_VERSION = 1;
export const CART_READY_MESSAGE = "schedulaa:cart-ready";
export const CART_STATE_MESSAGE = "schedulaa:cart-state";
export const CART_HYDRATE_MESSAGE = "schedulaa:cart-hydrate";

const MAX_CART_ITEMS = 64;
const MAX_CART_PAYLOAD_BYTES = 128 * 1024;
let activeCartTenant = "";

export const CartTypes = {
  SERVICE: "service",
  PRODUCT: "product",
  PACKAGE: "package",
};

export const CartErrorCodes = {
  MIXED_TYPES: "MIXED_CART_UNSUPPORTED",
};

const itemType = (item) => (item?.type || CartTypes.SERVICE);

const normalizeTenantSlug = (value) => {
  const slug = String(value || "").trim().toLowerCase();
  return /^[a-z0-9][a-z0-9-]{0,127}$/.test(slug) ? slug : "";
};

export const validateBridgedCartItems = (value) => {
  if (!Array.isArray(value) || value.length > MAX_CART_ITEMS) return null;
  try {
    const serialized = JSON.stringify(value);
    if (serialized.length > MAX_CART_PAYLOAD_BYTES) return null;
    const parsed = JSON.parse(serialized);
    const valid = parsed.every((item) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) return false;
      const id = String(item.id || "");
      const type = itemType(item);
      const quantity = item.quantity == null ? 1 : Number(item.quantity);
      return (
        id.length > 0 &&
        id.length <= 256 &&
        Object.values(CartTypes).includes(type) &&
        Number.isFinite(quantity) &&
        quantity > 0 &&
        quantity <= 999
      );
    });
    return valid ? parsed : null;
  } catch {
    return null;
  }
};

function parentOrigin() {
  if (typeof window === "undefined" || window.parent === window) return "";
  try {
    return new URL(document.referrer).origin;
  } catch {
    return "";
  }
}

export function setCartTenantContext(tenantSlug) {
  const nextTenant = normalizeTenantSlug(tenantSlug);
  if (nextTenant && typeof sessionStorage !== "undefined") {
    try {
      const previousTenant = normalizeTenantSlug(sessionStorage.getItem(CART_TENANT_KEY));
      if (previousTenant && previousTenant !== nextTenant) {
        sessionStorage.removeItem(CART_KEY);
      }
      sessionStorage.setItem(CART_TENANT_KEY, nextTenant);
    } catch {
      // In-memory tenant context still protects bridge messages.
    }
  }
  activeCartTenant = nextTenant;
  return activeCartTenant;
}

export function isEmbeddedCartFrame() {
  return Boolean(parentOrigin());
}

function postCartMessage(message) {
  const targetOrigin = parentOrigin();
  if (!targetOrigin) return false;
  try {
    window.parent.postMessage(message, targetOrigin);
    return true;
  } catch {
    return false;
  }
}

export function startCartBridge({ tenantSlug, onHydrate } = {}) {
  const normalizedSlug = setCartTenantContext(tenantSlug);
  const expectedOrigin = parentOrigin();
  if (!normalizedSlug || !expectedOrigin) {
    if (typeof onHydrate === "function") onHydrate(loadCart(), false);
    return () => {};
  }

  const onMessage = (event) => {
    if (event.source !== window.parent || event.origin !== expectedOrigin) return;
    const data = event.data;
    if (
      data?.type !== CART_HYDRATE_MESSAGE ||
      data.version !== CART_BRIDGE_VERSION ||
      normalizeTenantSlug(data.tenantSlug) !== normalizedSlug ||
      typeof data.hasSnapshot !== "boolean"
    ) {
      return;
    }

    if (!data.hasSnapshot) {
      const current = loadCart();
      if (typeof onHydrate === "function") onHydrate(current, false);
      announceCartChange(current);
      return;
    }

    const items = validateBridgedCartItems(data.items);
    if (!items) return;
    try {
      if (items.length) sessionStorage.setItem(CART_KEY, JSON.stringify(items));
      else sessionStorage.removeItem(CART_KEY);
      sessionStorage.setItem(CART_TENANT_KEY, normalizedSlug);
    } catch (err) {
      console.warn("cart: failed to hydrate", err);
      return;
    }
    if (typeof onHydrate === "function") onHydrate(items, true);
    announceCartChange(items);
  };

  window.addEventListener("message", onMessage);
  postCartMessage({
    type: CART_READY_MESSAGE,
    version: CART_BRIDGE_VERSION,
    tenantSlug: normalizedSlug,
  });
  return () => window.removeEventListener("message", onMessage);
}

const ensureCompatibleCart = (targetType, items) => {
  const hasService = items.some((it) => itemType(it) === CartTypes.SERVICE);
  const hasProduct = items.some((it) => itemType(it) === CartTypes.PRODUCT);
  const hasPackage = items.some((it) => itemType(it) === CartTypes.PACKAGE);

  const treatingAsService = targetType === CartTypes.SERVICE || targetType === CartTypes.PACKAGE;

  const mixingServicesAndProducts =
    (targetType === CartTypes.PRODUCT && (hasService || hasPackage)) ||
    (treatingAsService && hasProduct) ||
    (targetType === CartTypes.SERVICE && hasPackage) ||
    (targetType === CartTypes.PACKAGE && hasService);

  if (!mixingServicesAndProducts) return;

  const err = new Error("Services and retail products must be checked out separately. Please complete one checkout before starting another.");
  err.code = CartErrorCodes.MIXED_TYPES;
  err.existingType = hasProduct ? CartTypes.PRODUCT : hasPackage ? CartTypes.PACKAGE : CartTypes.SERVICE;
  err.attemptedType = targetType;
  throw err;
};

export function loadCart() {
  try {
    const raw = sessionStorage.getItem(CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn("cart: failed to parse", err);
    return [];
  }
}

export function saveCart(items, tenantSlug) {
  if (tenantSlug) setCartTenantContext(tenantSlug);
  try {
    sessionStorage.setItem(CART_KEY, JSON.stringify(items));
    announceCartChange(items);
  } catch (err) {
    console.warn("cart: failed to persist", err);
  }
}

export function clearCart() {
  try {
    sessionStorage.removeItem(CART_KEY);
    announceCartChange([]);
  } catch (err) {
    console.warn("cart: failed to clear", err);
  }
}

function announceCartChange(items) {
  const count = (Array.isArray(items) ? items : []).reduce(
    (total, item) => total + Math.max(1, Number(item?.quantity) || 1),
    0
  );
  const detail = { count };

  try {
    window.dispatchEvent(new CustomEvent(CART_CHANGED_EVENT, { detail }));
  } catch {
    // The cart remains usable in older or constrained browser contexts.
  }

  const bridgedItems = validateBridgedCartItems(Array.isArray(items) ? items : []);
  if (activeCartTenant && bridgedItems) {
    postCartMessage({
      type: CART_STATE_MESSAGE,
      version: CART_BRIDGE_VERSION,
      tenantSlug: activeCartTenant,
      items: bridgedItems,
      count,
    });
  }
}

export function addProductToCart(product, quantity = 1, variant = null, tenantSlug = "") {
  if (tenantSlug) setCartTenantContext(tenantSlug);
  if (!product) return loadCart();
  const qty = Math.max(1, Number(quantity) || 1);
  const current = loadCart();
  ensureCompatibleCart(CartTypes.PRODUCT, current);

  const variantId = variant?.id != null ? Number(variant.id) : null;
  const id = variantId ? `product-${product.id}-variant-${variantId}` : `product-${product.id}`;
  const existing = current.find((item) => item.id === id);
  const base = {
    id,
    type: CartTypes.PRODUCT,
    product_id: product.id,
    variant_id: variantId,
    sku: product.sku,
    name: product.name,
    description: product.description,
    price: Number((variant?.effective_price ?? product.price) || 0),
    quantity: qty,
    image:
      variant?.image?.url_public ||
      variant?.image?.url ||
      (product.images && product.images.length ? product.images[0].url : null),
    is_digital: Boolean(product.is_digital),
    display: variantId
      ? {
          variant_label: variant?.label || "",
          variant_options: Array.isArray(variant?.selection)
            ? variant.selection.map((row) => ({
                option_name: row.option_name,
                value: row.value,
              }))
            : [],
          variant_sku: variant?.sku || null,
          unit_price: variant?.effective_price || null,
          image: variant?.image?.url_public || variant?.image?.url || null,
        }
      : undefined,
    delivery_methods_override_enabled: Boolean(product.delivery_methods_override_enabled),
    delivery_allow_pickup:
      product.delivery_allow_pickup == null ? null : Boolean(product.delivery_allow_pickup),
    delivery_allow_shipping:
      product.delivery_allow_shipping == null ? null : Boolean(product.delivery_allow_shipping),
    delivery_allow_local_delivery:
      product.delivery_allow_local_delivery == null
        ? null
        : Boolean(product.delivery_allow_local_delivery),
  };
  let next;
  if (existing) {
    next = current.map((item) =>
      item.id === id ? { ...item, quantity: (item.quantity || 1) + qty } : item
    );
  } else {
    next = [...current, base];
  }
  saveCart(next);
  return next;
}

export function updateCartItem(id, updater) {
  const items = loadCart();
  const next = items.map((item) => (item.id === id ? { ...item, ...updater(item) } : item));
  saveCart(next);
  return next;
}

export function removeCartItem(id) {
  const next = loadCart().filter((item) => item.id !== id);
  saveCart(next);
  return next;
}

export function upsertServiceLine(line, tenantSlug = "") {
  if (tenantSlug) setCartTenantContext(tenantSlug);
  if (!line || !line.id) return loadCart();
  const items = loadCart();
  ensureCompatibleCart(CartTypes.SERVICE, items);
  const payload = {
    ...line,
    type: CartTypes.SERVICE,
    quantity: line.quantity != null ? line.quantity : 1,
  };
  const next = [
    ...items.filter((item) => item.id !== line.id),
    payload,
  ];
  saveCart(next);
  return next;
}

export function addPackageToCart(pkg, tenantSlug = "") {
  if (tenantSlug) setCartTenantContext(tenantSlug);
  if (!pkg || !pkg.id) return loadCart();
  const items = loadCart();
  ensureCompatibleCart(CartTypes.PACKAGE, items);
  const id = `package-${pkg.id}`;
  const payload = {
    id,
    type: CartTypes.PACKAGE,
    package_template_id: pkg.id,
    package_name: pkg.name,
    service_id: pkg.service_id ?? pkg.service?.id ?? null,
    service_name: pkg.service?.name ?? null,
    session_qty: pkg.session_qty,
    price: Number(pkg.price || 0),
    expires_in: pkg.expires_in ?? null,
    quantity: 1,
  };
  const existing = items.find((item) => item.id === id);
  const next = existing
    ? items.map((item) =>
        item.id === id ? { ...item, quantity: Math.max(1, Number(item.quantity || 1) + 1) } : item
      )
    : [...items, payload];
  saveCart(next);
  return next;
}
