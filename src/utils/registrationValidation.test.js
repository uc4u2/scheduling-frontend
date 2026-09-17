import {
  getPasswordRequirements,
  getPhoneValidationError,
  getRegistrationApiMessage,
  normalizeRegistrationPhone,
} from "./registrationValidation";

describe("registration validation", () => {
  it("accepts common phone formatting and normalizes it before submission", () => {
    expect(getPhoneValidationError("+1 (416) 444-8839")).toBe("");
    expect(normalizeRegistrationPhone("+1 (416) 444-8839")).toBe("+14164448839");
  });

  it("rejects email addresses and invalid phone lengths", () => {
    expect(getPhoneValidationError("person@example.com")).toMatch(/valid phone number/i);
    expect(getPhoneValidationError("123")).toMatch(/7 to 15 digits/i);
  });

  it("enforces the advertised 12-character password contract", () => {
    expect(getPasswordRequirements("Pass123!").find((item) => item.key === "length")?.pass).toBe(false);
    expect(getPasswordRequirements("StrongPass123!").every((item) => item.pass)).toBe(true);
  });

  it("translates API error codes into human-readable summaries", () => {
    expect(getRegistrationApiMessage({ error: "validation_error" })).toBe(
      "Please correct the highlighted fields and try again."
    );
    expect(getRegistrationApiMessage({ error: "account_exists", message: "Please log in." })).toBe(
      "Please log in."
    );
  });
});
