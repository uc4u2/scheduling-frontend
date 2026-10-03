import { CartTypes } from "./cart";

export const BasketBrowseKinds = {
  SERVICES: "services",
  PRODUCTS: "products",
};

export function inferBasketBrowseKind(items, fallback = BasketBrowseKinds.PRODUCTS) {
  const entries = Array.isArray(items) ? items : [];
  if (!entries.length) return fallback;
  return entries.every((item) => item?.type === CartTypes.PRODUCT)
    ? BasketBrowseKinds.PRODUCTS
    : BasketBrowseKinds.SERVICES;
}

export function basketBrowseLabel(kind) {
  return kind === BasketBrowseKinds.SERVICES ? "Browse services" : "Browse products";
}
