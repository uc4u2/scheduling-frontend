const CART_KEY = "booking_cart";
const HOLD_MINUTES_KEY = "booking_hold_minutes";
const DEFAULT_HOLD_MINUTES = 3;

export const CartTypes = {
  SERVICE: "service",
  PRODUCT: "product",
};

export const CartErrorCodes = {
  MIXED_TYPES: "MIXED_CART_UNSUPPORTED",
};

const clampHoldMinutes = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return DEFAULT_HOLD_MINUTES;
  return Math.max(1, Math.min(120, Math.round(num)));
};

export const setCachedHoldMinutes = (minutes) => {
  const clamped = clampHoldMinutes(minutes);
  try {
    sessionStorage.setItem(HOLD_MINUTES_KEY, String(clamped));
  } catch {
    try {
      localStorage.setItem(HOLD_MINUTES_KEY, String(clamped));
    } catch {}
  }
};

export const getCachedHoldMinutes = () => {
  const sources = [
    () => {
      try {
        return sessionStorage.getItem(HOLD_MINUTES_KEY);
      } catch {
        return null;
      }
    },
    () => {
      try {
        return localStorage.getItem(HOLD_MINUTES_KEY);
      } catch {
        return null;
      }
    },
  ];
  for (const getter of sources) {
    const raw = getter();
    if (raw != null && raw !== "") {
      return clampHoldMinutes(raw);
    }
  }
  return DEFAULT_HOLD_MINUTES;
};

const itemType = (item) => (item?.type || CartTypes.SERVICE);

const ensureCompatibleCart = (targetType, items) => {
  const hasService = items.some((it) => itemType(it) === CartTypes.SERVICE);
  const hasProduct = items.some((it) => itemType(it) === CartTypes.PRODUCT);

  const mixingServicesAndProducts =
    (targetType === CartTypes.PRODUCT && hasService) ||
    (targetType === CartTypes.SERVICE && hasProduct);

  if (!mixingServicesAndProducts) return;

  const err = new Error(
    "Services and retail products must be checked out separately. Please complete one checkout before starting another."
  );
  err.code = CartErrorCodes.MIXED_TYPES;
  err.existingType = hasService ? CartTypes.SERVICE : CartTypes.PRODUCT;
  err.attemptedType = targetType;
  throw err;
};

const isHoldExpired = (item) => {
  if (!item?.hold_expires_at) return false;
  const expiry = Date.parse(item.hold_expires_at);
  if (!Number.isFinite(expiry)) return false;
  return expiry <= Date.now();
};

const pruneExpired = (items = []) => items.filter((item) => !isHoldExpired(item));

const withHoldMetadata = (line) => {
  const minutes = getCachedHoldMinutes();
  const now = Date.now();
  const startIso = new Date(now).toISOString();
  const expiresIso = new Date(now + minutes * 60000).toISOString();
  return {
    ...line,
    hold_started_at: startIso,
    hold_expires_at: expiresIso,
  };
};

const persistCart = (items, { skipSession = false } = {}) => {
  const payload = JSON.stringify(items);
  let sessionOk = skipSession;
  if (!skipSession) {
    try {
      sessionStorage.setItem(CART_KEY, payload);
      sessionOk = true;
    } catch (err) {
      console.warn("cart: failed to persist to sessionStorage", err);
    }
  }
  try {
    localStorage.setItem(CART_KEY, payload);
  } catch (err) {
    console.warn("cart: failed to persist to localStorage", err);
  }
  if (!sessionOk && !skipSession) {
    try {
      sessionStorage.setItem(CART_KEY, payload);
    } catch (err) {
      console.warn("cart: second attempt to hydrate sessionStorage failed", err);
    }
  }
};

const readCartSource = (getRaw) => {
  try {
    const raw = getRaw();
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn("cart: failed to parse", err);
    return null;
  }
};

export function loadCart() {
  const fromSession = readCartSource(() => sessionStorage.getItem(CART_KEY));
  if (Array.isArray(fromSession) && fromSession.length) {
    const cleaned = pruneExpired(fromSession);
    if (cleaned.length !== fromSession.length) {
      persistCart(cleaned);
    } else {
      persistCart(cleaned, { skipSession: true });
    }
    return cleaned;
  }

  const fromLocal = readCartSource(() => localStorage.getItem(CART_KEY));
  if (Array.isArray(fromLocal) && fromLocal.length) {
    const cleaned = pruneExpired(fromLocal);
    persistCart(cleaned);
    return cleaned;
  }

  return [];
}

export function saveCart(items) {
  const cleaned = pruneExpired(items || []);
  persistCart(cleaned);
  return cleaned;
}

export function clearCart() {
  try {
    sessionStorage.removeItem(CART_KEY);
  } catch (err) {
    console.warn("cart: failed to clear", err);
  }
  try {
    localStorage.removeItem(CART_KEY);
  } catch (err) {
    console.warn("cart: failed to clear localStorage", err);
  }
}

export function addProductToCart(product, quantity = 1) {
  if (!product) return loadCart();
  const qty = Math.max(1, Number(quantity) || 1);
  const current = loadCart();
  ensureCompatibleCart(CartTypes.PRODUCT, current);

  const id = `product-${product.id}`;
  const existing = current.find((item) => item.id === id);
  const base = {
    id,
    type: CartTypes.PRODUCT,
    product_id: product.id,
    sku: product.sku,
    name: product.name,
    description: product.description,
    price: Number(product.price || 0),
    quantity: qty,
    image: product.images && product.images.length ? product.images[0].url : null,
  };
  let next;
  if (existing) {
    next = current.map((item) =>
      item.id === id ? { ...item, quantity: (item.quantity || 1) + qty } : item
    );
  } else {
    next = [...current, base];
  }
  return saveCart(next);
}

export function updateCartItem(id, updater) {
  const items = loadCart();
  const next = items.map((item) => (item.id === id ? { ...item, ...updater(item) } : item));
  return saveCart(next);
}

export function removeCartItem(id) {
  const next = loadCart().filter((item) => item.id !== id);
  return saveCart(next);
}

export function upsertServiceLine(line) {
  if (!line || !line.id) return loadCart();
  const items = loadCart();
  ensureCompatibleCart(CartTypes.SERVICE, items);
  const payload = withHoldMetadata({
    ...line,
    type: CartTypes.SERVICE,
    quantity: line.quantity != null ? line.quantity : 1,
    date: line.date || line.local_date,
    start_time: line.start_time || line.local_time || line.time,
    local_date: line.local_date || line.date,
    local_time: line.local_time || line.start_time || line.time,
  });
  const next = [
    ...items.filter((item) => item.id !== line.id),
    payload,
  ];
  return saveCart(next);
}

export function getItemHoldRemainingMs(item) {
  if (!item?.hold_expires_at) return null;
  const expiry = Date.parse(item.hold_expires_at);
  if (!Number.isFinite(expiry)) return null;
  const remaining = expiry - Date.now();
  return remaining > 0 ? remaining : null;
}
