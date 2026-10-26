const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_CHARACTERS_PATTERN = /^[+0-9().\-\s]+$/;

export const passwordRequirements = (password = "") => [
  { key: "length", label: "12 or more characters", pass: password.length >= 12 },
  { key: "uppercase", label: "An uppercase letter", pass: /[A-Z]/.test(password) },
  { key: "lowercase", label: "A lowercase letter", pass: /[a-z]/.test(password) },
  { key: "number", label: "A number", pass: /\d/.test(password) },
  { key: "symbol", label: "A symbol", pass: /[^A-Za-z0-9]/.test(password) },
];

export const validateRegistrationForm = ({
  firstName,
  lastName,
  email,
  phone,
  password,
  confirmPassword,
  timezone,
  acceptedTerms,
}) => {
  const errors = {};
  const normalizedPhone = String(phone || "").trim();
  const phoneDigits = normalizedPhone.replace(/\D/g, "");

  if (!String(firstName || "").trim()) errors.first_name = "Enter your first name.";
  if (!String(lastName || "").trim()) errors.last_name = "Enter your last name.";
  if (!String(email || "").trim()) {
    errors.email = "Enter your email address.";
  } else if (!EMAIL_PATTERN.test(String(email).trim())) {
    errors.email = "Enter a valid email address.";
  }

  if (!normalizedPhone) {
    errors.phone = "Enter a phone number, for example +1 416 555 0123.";
  } else if (
    !PHONE_CHARACTERS_PATTERN.test(normalizedPhone) ||
    normalizedPhone.split("+").length - 1 > 1 ||
    (normalizedPhone.includes("+") && !normalizedPhone.startsWith("+")) ||
    phoneDigits.length < 7 ||
    phoneDigits.length > 15
  ) {
    errors.phone = "Enter a valid phone number, for example +1 416 555 0123.";
  }

  const unmetPasswordRequirements = passwordRequirements(password).filter((requirement) => !requirement.pass);
  if (!password) {
    errors.password = "Create a password to protect your workspace.";
  } else if (unmetPasswordRequirements.length) {
    errors.password = "Use all of the password requirements shown below.";
  }
  if (!confirmPassword) {
    errors.password_confirm = "Confirm your password.";
  } else if (password !== confirmPassword) {
    errors.password_confirm = "Passwords do not match.";
  }
  if (!String(timezone || "").trim()) errors.timezone = "Choose your timezone.";
  if (!acceptedTerms) errors.agreed_to_terms = "Accept the User Agreement to create your account.";

  return errors;
};

export const firstRegistrationErrorField = (errors = {}) =>
  [
    "first_name",
    "last_name",
    "email",
    "phone",
    "password",
    "password_confirm",
    "timezone",
    "agreed_to_terms",
  ].find((field) => errors[field]);
