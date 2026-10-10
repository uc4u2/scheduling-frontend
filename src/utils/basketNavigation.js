import { CartTypes } from "./cart";

export const BasketBrowseKinds = {
  SERVICES: "services",
  PRODUCTS: "products",
};

export function defaultBasketBrowseKind({ productsReturnTo = "", servicesReturnTo = "" } = {}) {
  return !productsReturnTo && servicesReturnTo
    ? BasketBrowseKinds.SERVICES
    : BasketBrowseKinds.PRODUCTS;
}

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

export function basketBrowseDescription(kind) {
  return kind === BasketBrowseKinds.SERVICES
    ? "Review services and appointment details before checkout."
    : "Review products before completing your purchase.";
}
