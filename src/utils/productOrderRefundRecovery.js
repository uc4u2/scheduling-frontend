import { decodeJwt, getAuthedCompanyId } from "./authedCompany";

const RECOVERY_VERSION = 1;
const RECOVERY_PREFIX = "schedulaa:product-order-refund:v1";

const clean = (value) => String(value ?? "").trim();

export function productOrderRefundRecoveryScope({ token, companyId, orderId }) {
  const claims = decodeJwt(token || "");
  const resolvedCompanyId = clean(
    companyId
      ?? claims?.company_id
      ?? claims?.companyId
      ?? claims?.company?.id
      ?? claims?.cid
      ?? getAuthedCompanyId({ allowQuery: false, devDefault: null }),
  );
  const accountId = clean(
    claims?.sub
      ?? claims?.identity
      ?? claims?.user_id
      ?? claims?.email,
  );
  const resolvedOrderId = clean(orderId);
  if (!resolvedCompanyId || !accountId || !resolvedOrderId) return null;
  return {
    companyId: resolvedCompanyId,
    accountId,
    orderId: resolvedOrderId,
  };
}

export function productOrderRefundRecoveryStorageKey(scope) {
  if (!scope?.companyId || !scope?.accountId || !scope?.orderId) return null;
  return `${RECOVERY_PREFIX}:${scope.companyId}:${scope.accountId}:${scope.orderId}`;
}

export function createProductOrderRefundIdempotencyKey(orderId) {
  const random = window.crypto?.randomUUID?.()
    || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `product-order-refund:${orderId}:${random}`;
}

export function saveProductOrderRefundRecovery(scope, record) {
  const storageKey = productOrderRefundRecoveryStorageKey(scope);
  if (!storageKey || !record?.idempotencyKey || !record?.payload) return null;
  const stored = {
    version: RECOVERY_VERSION,
    scope,
    idempotencyKey: record.idempotencyKey,
    payload: record.payload,
    state: clean(record.state) || "outcome_unknown",
    message: clean(record.message) || null,
    savedAt: new Date().toISOString(),
  };
  // Tab-scoped persistence survives reload/response loss without retaining
  // refund notes beyond the manager's current browser session.
  window.sessionStorage.setItem(storageKey, JSON.stringify(stored));
  return stored;
}

export function readProductOrderRefundRecovery(scope) {
  const storageKey = productOrderRefundRecoveryStorageKey(scope);
  if (!storageKey) return null;
  try {
    const stored = JSON.parse(window.sessionStorage.getItem(storageKey) || "null");
    if (
      stored?.version !== RECOVERY_VERSION
      || !stored?.idempotencyKey
      || !stored?.payload
      || Object.entries(scope).some(
        ([field, value]) => clean(stored?.scope?.[field]) !== clean(value),
      )
    ) {
      return null;
    }
    return stored;
  } catch {
    return null;
  }
}

export function clearProductOrderRefundRecovery(scope) {
  const storageKey = productOrderRefundRecoveryStorageKey(scope);
  if (storageKey) window.sessionStorage.removeItem(storageKey);
}

