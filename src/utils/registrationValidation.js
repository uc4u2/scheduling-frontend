export const PASSWORD_MIN_LENGTH = 12;

export const getPasswordRequirements = (password = "") => [
  { key: "length", label: `At least ${PASSWORD_MIN_LENGTH} characters`, pass: password.length >= PASSWORD_MIN_LENGTH },
  { key: "uppercase", label: "One uppercase letter", pass: /[A-Z]/.test(password) },
  { key: "lowercase", label: "One lowercase letter", pass: /[a-z]/.test(password) },
  { key: "number", label: "One number", pass: /\d/.test(password) },
  { key: "symbol", label: "One symbol", pass: /[^A-Za-z0-9]/.test(password) },
];

export const getPhoneValidationError = (phone = "") => {
  const value = String(phone || "").trim();
  if (!value) return "Phone is required.";
  if (!/^[+0-9().\-\s]+$/.test(value)) {
    return "Enter a valid phone number using numbers and optional +, spaces, parentheses, or hyphens.";
  }
  if ((value.match(/\+/g) || []).length > 1 || (value.includes("+") && !value.startsWith("+"))) {
    return "Enter a valid phone number with + only at the beginning.";
  }

  const digits = value.replace(/\D/g, "");
  if (digits.length < 7 || digits.length > 15) {
    return "Enter a valid phone number with 7 to 15 digits.";
  }
  return "";
};

export const normalizeRegistrationPhone = (phone = "") => {
  const value = String(phone || "").trim();
  const digits = value.replace(/\D/g, "");
  return value.startsWith("+") ? `+${digits}` : digits;
};

export const getRegistrationApiMessage = (data = {}) => {
  if (data?.error === "validation_error") return "Please correct the highlighted fields and try again.";
  if (data?.error === "account_exists") {
    return data?.message || "An account already exists for this email. Log in or use Forgot password.";
  }
  if (data?.error === "rate_limited") return "Too many attempts. Please wait a moment and try again.";
  return data?.message || "We could not create your account. Please review your details and try again.";
};
