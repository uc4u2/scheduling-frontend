export const GOOGLE_TOKEN_MAX_LENGTH = 255;

const TOKEN_PATTERN = /^[A-Za-z0-9_-]{6,255}$/;
const DNS_PREFIX_PATTERN = /^google-site-verification\s*=\s*/i;

const validateToken = (value, label) => {
  const token = String(value ?? "").trim();
  if (!token) return "";
  if (token.length > GOOGLE_TOKEN_MAX_LENGTH || !TOKEN_PATTERN.test(token)) {
    throw new Error(`${label} must contain only letters, numbers, hyphens, or underscores.`);
  }
  return token;
};

export const normalizeGoogleSiteVerification = (value) => {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  if (!raw.startsWith("<")) {
    return validateToken(raw, "Google HTML verification token");
  }
  if (typeof document === "undefined") {
    throw new Error("Paste the raw Google verification token in this environment.");
  }

  const template = document.createElement("template");
  template.innerHTML = raw;
  const meaningfulNodes = Array.from(template.content.childNodes).filter(
    (node) => node.nodeType !== Node.TEXT_NODE || node.textContent.trim()
  );
  if (meaningfulNodes.length !== 1 || meaningfulNodes[0].nodeType !== Node.ELEMENT_NODE) {
    throw new Error("Paste only the Google site verification token or its single meta tag.");
  }
  const meta = meaningfulNodes[0];
  if (meta.tagName !== "META") {
    throw new Error("Paste only the Google site verification token or its single meta tag.");
  }
  const attributes = Array.from(meta.attributes);
  if (
    attributes.length !== 2
    || attributes.some(({ name }) => !["name", "content"].includes(name.toLowerCase()))
  ) {
    throw new Error("Google HTML verification tag has unsupported attributes.");
  }
  if ((meta.getAttribute("name") || "").trim().toLowerCase() !== "google-site-verification") {
    throw new Error("The meta tag is not a Google site verification tag.");
  }
  return validateToken(meta.getAttribute("content"), "Google HTML verification token");
};

export const normalizeGoogleDnsVerification = (value) => {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  const token = raw.replace(DNS_PREFIX_PATTERN, "");
  if (token === raw && raw.includes("=")) {
    throw new Error("Use the Google token or the complete google-site-verification=TOKEN value.");
  }
  return validateToken(token, "Google DNS verification token");
};

export const formatGoogleDnsRecord = (value) => {
  const token = normalizeGoogleDnsVerification(value);
  return token ? `google-site-verification=${token}` : "";
};

export const resolveSearchConsolePropertyUrl = (contract) => {
  if (!contract || typeof contract !== "object") return "";
  const candidate = contract.custom_domain_active
    ? (contract.custom_domain_url || contract.canonical_url || contract.primary_public_url)
    : (contract.primary_public_url || contract.canonical_url || contract.schedulaa_url);
  if (!candidate) return "";
  try {
    const url = new URL(candidate);
    if (url.protocol !== "https:" || !url.hostname || url.username || url.password) return "";
    url.search = "";
    url.hash = "";
    url.pathname = `${url.pathname.replace(/\/+$/, "")}/`;
    return url.toString();
  } catch {
    return "";
  }
};

export const getRootDomain = (propertyUrl) => {
  try {
    return new URL(propertyUrl).hostname.replace(/^www\./i, "");
  } catch {
    return "";
  }
};

export const deriveGoogleVerificationState = ({ draftToken, publishedToken, isLive = true }) => {
  const draft = String(draftToken || "").trim();
  const published = String(publishedToken || "").trim();
  if (!draft && !published) return { key: "notConfigured", draft, published };
  if (!isLive && draft) return { key: "savedDraft", draft, published, siteUnpublished: true };
  if (draft && draft === published) return { key: "published", draft, published };
  if (draft && published && draft !== published) {
    return { key: "replacementPending", draft, published };
  }
  if (!draft && published) return { key: "removalPending", draft, published };
  return { key: "savedDraft", draft, published };
};
