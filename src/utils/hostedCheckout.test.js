import { buildHostedCheckoutPayload } from "./hostedCheckout";

jest.mock("./api", () => ({
  __esModule: true,
  api: {},
}));

describe("buildHostedCheckoutPayload", () => {
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
});
