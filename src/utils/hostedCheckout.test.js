import {
  buildHostedCheckoutPayload,
  clearCheckoutRequestKey,
  getOrCreateCheckoutRequestKey,
} from "./hostedCheckout";

jest.mock("./api", () => ({
  __esModule: true,
  api: {},
}));

describe("buildHostedCheckoutPayload", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  test("keeps the same checkout operation across response loss and reload", () => {
    const first = getOrCreateCheckoutRequestKey({
      scope: "tenant-a",
      fingerprint: "basket-v1",
    });
    const recovered = getOrCreateCheckoutRequestKey({
      scope: "tenant-a",
      fingerprint: "basket-v1",
    });

    expect(recovered).toBe(first);
    expect(first).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });

  test("starts a new checkout only after an explicit terminal clear", () => {
    const first = getOrCreateCheckoutRequestKey({
      scope: "tenant-a",
      fingerprint: "basket-v1",
    });

    clearCheckoutRequestKey({ scope: "tenant-a" });

    const next = getOrCreateCheckoutRequestKey({
      scope: "tenant-a",
      fingerprint: "basket-v1",
    });
    expect(next).not.toBe(first);
  });

  test("scopes unresolved operations by tenant and basket fingerprint", () => {
    const tenantA = getOrCreateCheckoutRequestKey({
      scope: "tenant-a",
      fingerprint: "basket-v1",
    });
    const tenantB = getOrCreateCheckoutRequestKey({
      scope: "tenant-b",
      fingerprint: "basket-v1",
    });
    const changedBasket = getOrCreateCheckoutRequestKey({
      scope: "tenant-a",
      fingerprint: "basket-v2",
    });

    expect(tenantB).not.toBe(tenantA);
    expect(changedBasket).not.toBe(tenantA);
  });

  test("includes variant_id for product lines without trusting browser display fields", () => {
    const payload = buildHostedCheckoutPayload({
      cartItems: [
        {
          id: "product-48-variant-101",
          type: "product",
          product_id: 48,
          variant_id: 101,
          quantity: 2,
          display: {
            variant_label: "Black / Mini",
            variant_sku: "BAG-BLACK-MINI",
            unit_price: "79.00",
          },
        },
      ],
      policyMode: "pay",
      currency: "cad",
      clientName: "Jamie Buyer",
      clientEmail: "jamie@example.com",
    });

    expect(payload.items).toEqual([
      {
        type: "product",
        product_id: 48,
        variant_id: 101,
        quantity: 2,
      },
    ]);
  });

  test("includes allowlisted card-on-file consent fields for capture mode", () => {
    const payload = buildHostedCheckoutPayload({
      cartItems: [
        {
          type: "service",
          service_id: 7,
          artist_id: 16,
          date: "2026-07-30",
          start_time: "10:00",
          price: 120,
        },
      ],
      policyMode: "capture",
      currency: "cad",
      clientName: "Jamie Buyer",
      clientEmail: "jamie@example.com",
      cardOnFileConsent: {
        accepted: true,
        policy_version: "payments-policy:abc123",
        policy_text_hash: "hash-123",
        accepted_at: "forged-client-value",
      },
    });

    expect(payload.policy).toEqual({ mode: "capture" });
    expect(payload.card_on_file_consent).toEqual({
      accepted: true,
      policy_version: "payments-policy:abc123",
      policy_text_hash: "hash-123",
    });
    expect(payload.card_on_file_consent.accepted_at).toBeUndefined();
  });

  test("preserves canonical slot timestamps for service lines", () => {
    const payload = buildHostedCheckoutPayload({
      cartItems: [
        {
          type: "service",
          service_id: 7,
          artist_id: 16,
          date: "2026-07-30",
          start_time: "10:00",
          end_time: "11:30",
          start_utc: "2026-07-30T14:00:00Z",
          end_utc: "2026-07-30T15:30:00Z",
          availability_id: 987,
          timezone: "America/Toronto",
          price: 120,
        },
      ],
      policyMode: "pay",
      currency: "cad",
      clientName: "Jamie Buyer",
      clientEmail: "jamie@example.com",
    });

    expect(payload.items).toEqual([
      expect.objectContaining({
        type: "service",
        service_id: 7,
        artist_id: 16,
        date: "2026-07-30",
        start_time: "10:00",
        end_time: "11:30",
        start_utc: "2026-07-30T14:00:00Z",
        end_utc: "2026-07-30T15:30:00Z",
        availability_id: 987,
        timezone: "America/Toronto",
      }),
    ]);
  });

  test("does not include card-on-file consent for pay mode", () => {
    const payload = buildHostedCheckoutPayload({
      cartItems: [
        {
          type: "service",
          service_id: 7,
          artist_id: 16,
          date: "2026-07-30",
          start_time: "10:00",
          price: 120,
        },
      ],
      policyMode: "pay",
      currency: "CAD",
      clientName: "Jamie Buyer",
      clientEmail: "jamie@example.com",
      cardOnFileConsent: {
        accepted: true,
        policy_version: "payments-policy:abc123",
        policy_text_hash: "hash-123",
      },
    });

    expect(payload.policy).toEqual({ mode: "pay" });
    expect(payload.card_on_file_consent).toBeUndefined();
  });

  test("passes stable checkout and signed manual-shipping recovery fields", () => {
    const payload = buildHostedCheckoutPayload({
      cartItems: [
        { type: "product", product_id: 48, quantity: 1 },
      ],
      policyMode: "pay",
      currency: "CAD",
      checkoutRequestKey: "11111111-1111-4111-8111-111111111111",
      manualShippingEstimateToken: "signed-manual-estimate",
    });

    expect(payload.checkout_request_key).toBe("11111111-1111-4111-8111-111111111111");
    expect(payload.manual_shipping_estimate_token).toBe("signed-manual-estimate");
  });

  test("does not broaden product checkout recovery keys to service-only bookings", () => {
    const payload = buildHostedCheckoutPayload({
      cartItems: [{
        type: "service",
        service_id: 7,
        artist_id: 16,
        date: "2026-07-30",
        start_time: "10:00",
      }],
      policyMode: "pay",
      currency: "CAD",
      checkoutRequestKey: "11111111-1111-4111-8111-111111111111",
    });

    expect(payload.checkout_request_key).toBeUndefined();
  });
});
