import {
  clearProductOrderRefundRecovery,
  createProductOrderRefundIdempotencyKey,
  productOrderRefundRecoveryScope,
  readProductOrderRefundRecovery,
  saveProductOrderRefundRecovery,
} from "./productOrderRefundRecovery";

const tokenFor = (claims) => `header.${btoa(JSON.stringify(claims)).replace(/=/g, "")}.signature`;

describe("Product Order refund recovery", () => {
  beforeEach(() => window.sessionStorage.clear());

  test("preserves the exact operation payload across reload within its tenant/account/order scope", () => {
    const token = tokenFor({ sub: "manager-7", company_id: 12 });
    const scope = productOrderRefundRecoveryScope({ token, orderId: 45 });
    const payload = {
      provider: "stripe",
      idempotency_key: "product-order-refund:45:stable",
      amount_cents: 4000,
      currency: "CAD",
      reason: "requested_by_customer",
      note: "One returned item",
      refund_platform_fee: true,
      reverse_transfer: false,
      restock_items: [{ order_item_id: 3, product_id: 9, quantity: 1 }],
    };

    saveProductOrderRefundRecovery(scope, {
      idempotencyKey: payload.idempotency_key,
      payload,
      state: "provider_pending",
    });

    expect(readProductOrderRefundRecovery(scope)).toEqual(expect.objectContaining({
      idempotencyKey: payload.idempotency_key,
      payload,
      state: "provider_pending",
    }));
    expect(readProductOrderRefundRecovery({ ...scope, companyId: "13" })).toBeNull();
    expect(readProductOrderRefundRecovery({ ...scope, accountId: "manager-8" })).toBeNull();
    expect(readProductOrderRefundRecovery({ ...scope, orderId: "46" })).toBeNull();

    clearProductOrderRefundRecovery(scope);
    expect(readProductOrderRefundRecovery(scope)).toBeNull();
  });

  test("creates a new key only when explicitly requested", () => {
    const first = createProductOrderRefundIdempotencyKey(45);
    const second = createProductOrderRefundIdempotencyKey(45);
    expect(first).toMatch(/^product-order-refund:45:/);
    expect(second).toMatch(/^product-order-refund:45:/);
    expect(second).not.toBe(first);
  });
});
