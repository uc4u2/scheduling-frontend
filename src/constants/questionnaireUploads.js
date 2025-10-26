// Shared questionnaire upload configuration derived from environment variables.
const readEnv = (key) => {
  const meta = typeof import.meta !== "undefined" && import.meta.env ? import.meta.env : undefined;
  if (meta && Object.prototype.hasOwnProperty.call(meta, key)) {
    return meta[key];
  }
  if (meta && Object.prototype.hasOwnProperty.call(meta, `VITE_${key}`)) {
    return meta[`VITE_${key}`];
  }
  const proc = typeof process !== "undefined" && process.env ? process.env : undefined;
  if (proc && Object.prototype.hasOwnProperty.call(proc, key)) {
    return proc[key];
  }
  if (proc && Object.prototype.hasOwnProperty.call(proc, `REACT_APP_${key}`)) {
    return proc[`REACT_APP_${key}`];
  }
  if (proc && Object.prototype.hasOwnProperty.call(proc, `VITE_${key}`)) {
    return proc[`VITE_${key}`];
  }
  return undefined;
};

const parseNumber = (value, fallback) => {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const parseBoolean = (value, fallback) => {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }
  if (typeof value === "boolean") {
    return value;
  }
  const normalised = String(value).trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalised)) {
    return true;
  }
  if (["0", "false", "no", "off"].includes(normalised)) {
    return false;
  }
  return fallback;
};

const rawAllowedMime = readEnv("QUESTIONNAIRE_ALLOWED_MIME");

export const QUESTIONNAIRE_ALLOWED_MIME = rawAllowedMime
  ? rawAllowedMime
      .split(",")
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean)
  : ["application/pdf", "image/jpeg", "image/png", "image/heic"];

export const QUESTIONNAIRE_MAX_FILE_MB = parseNumber(
  readEnv("QUESTIONNAIRE_MAX_FILE_MB"),
  10
);

export const QUESTIONNAIRE_MAX_FILE_BYTES = QUESTIONNAIRE_MAX_FILE_MB * 1024 * 1024;

export const QUESTIONNAIRE_MAX_FILES_PER_SUBMISSION = parseNumber(
  readEnv("QUESTIONNAIRE_MAX_FILES_PER_SUBMISSION"),
  10
);

export const QUESTIONNAIRE_SCANNING_ENABLED = parseBoolean(
  readEnv("QUESTIONNAIRE_AV_SCAN_ENABLED"),
  true
);

export const QUESTIONNAIRE_LIMITS = {
  maxFileMb: QUESTIONNAIRE_MAX_FILE_MB,
  maxFileBytes: QUESTIONNAIRE_MAX_FILE_BYTES,
  maxFilesPerSubmission: QUESTIONNAIRE_MAX_FILES_PER_SUBMISSION,
  allowedMime: QUESTIONNAIRE_ALLOWED_MIME,
  scanningEnabled: QUESTIONNAIRE_SCANNING_ENABLED,
};

export default QUESTIONNAIRE_LIMITS;
