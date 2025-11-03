const CART_KEY = "booking_cart";

export const CartTypes = {
  SERVICE: "service",
  PRODUCT: "product",
};

export const CartErrorCodes = {
  MIXED_TYPES: "MIXED_CART_UNSUPPORTED",
};

const itemType = (item) => (item?.type || CartTypes.SERVICE);

const ensureCompatibleCart = (targetType, items) => {
  const hasService = items.some((it) => itemType(it) === CartTypes.SERVICE);
  const hasProduct = items.some((it) => itemType(it) === CartTypes.PRODUCT);

  const mixingServicesAndProducts =
    (targetType === CartTypes.PRODUCT && hasService) ||
    (targetType === CartTypes.SERVICE && hasProduct);

  if (!mixingServicesAndProducts) return;

  const err = new Error("Services and retail products must be checked out separately. Please complete one checkout before starting another.");
  err.code = CartErrorCodes.MIXED_TYPES;
  err.existingType = hasService ? CartTypes.SERVICE : CartTypes.PRODUCT;
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

export function saveCart(items) {
  try {
    sessionStorage.setItem(CART_KEY, JSON.stringify(items));
  } catch (err) {
    console.warn("cart: failed to persist", err);
  }
}

export function clearCart() {
  try {
    sessionStorage.removeItem(CART_KEY);
  } catch (err) {
    console.warn("cart: failed to clear", err);
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

export function upsertServiceLine(line) {
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
