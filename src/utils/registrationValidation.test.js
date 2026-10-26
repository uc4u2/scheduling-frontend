import {
  firstRegistrationErrorField,
  passwordRequirements,
  validateRegistrationForm,
} from "./registrationValidation";

const validForm = {
  firstName: "Avery",
  lastName: "Taylor",
  email: "avery@example.com",
  phone: "+1 (416) 555-0123",
  password: "StrongPassword123!",
  confirmPassword: "StrongPassword123!",
  timezone: "America/Toronto",
  acceptedTerms: true,
};

describe("registration validation", () => {
  it("matches the server's twelve-character password policy", () => {
    expect(passwordRequirements("Pass123!").find((item) => item.key === "length")).toMatchObject({ pass: false });
    expect(validateRegistrationForm({ ...validForm, password: "Pass123!", confirmPassword: "Pass123!" }).password).toMatch(/requirements/i);
  });

  it("gives a human phone message instead of allowing an email address", () => {
    const errors = validateRegistrationForm({ ...validForm, phone: "owner@example.com" });
    expect(errors.phone).toBe("Enter a valid phone number, for example +1 416 555 0123.");
    expect(firstRegistrationErrorField(errors)).toBe("phone");
  });

  it("allows a complete valid owner registration", () => {
    expect(validateRegistrationForm(validForm)).toEqual({});
  });
});
