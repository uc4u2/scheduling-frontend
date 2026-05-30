export const COMPANY_COUNTRY_OPTIONS = [
  { code: "US", label: "United States" },
  { code: "CA", label: "Canada" },
  { code: "OTHER", label: "Other" },
];

export const PAYROLL_PROVIDER_OPTIONS = [
  { value: "", label: "None" },
  { value: "QuickBooks", label: "QuickBooks" },
  { value: "Gusto", label: "Gusto" },
  { value: "ADP", label: "ADP" },
  { value: "Paychex", label: "Paychex" },
  { value: "Wagepoint", label: "Wagepoint" },
  { value: "Wave", label: "Wave" },
  { value: "Other", label: "Other" },
];

export const CANADA_PROVINCES = ["AB", "BC", "MB", "NB", "NL", "NS", "NT", "NU", "ON", "PE", "QC", "SK", "YT"];
export const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","DC","FL","GA","HI","ID","IL","IN",
  "IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE",
  "NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN",
  "TX","UT","VT","VA","WA","WV","WI","WY",
];

const US_STATE_TIMEZONES = {
  AK: "America/Anchorage",
  AL: "America/Chicago",
  AR: "America/Chicago",
  AZ: "America/Phoenix",
  CA: "America/Los_Angeles",
  CO: "America/Denver",
  CT: "America/New_York",
  DC: "America/New_York",
  DE: "America/New_York",
  FL: "America/New_York",
  GA: "America/New_York",
  HI: "Pacific/Honolulu",
  IA: "America/Chicago",
  ID: "America/Denver",
  IL: "America/Chicago",
  IN: "America/Indiana/Indianapolis",
  KS: "America/Chicago",
  KY: "America/New_York",
  LA: "America/Chicago",
  MA: "America/New_York",
  MD: "America/New_York",
  ME: "America/New_York",
  MI: "America/Detroit",
  MN: "America/Chicago",
  MO: "America/Chicago",
  MS: "America/Chicago",
  MT: "America/Denver",
  NC: "America/New_York",
  ND: "America/Chicago",
  NE: "America/Chicago",
  NH: "America/New_York",
  NJ: "America/New_York",
  NM: "America/Denver",
  NV: "America/Los_Angeles",
  NY: "America/New_York",
  OH: "America/New_York",
  OK: "America/Chicago",
  OR: "America/Los_Angeles",
  PA: "America/New_York",
  RI: "America/New_York",
  SC: "America/New_York",
  SD: "America/Chicago",
  TN: "America/Chicago",
  TX: "America/Chicago",
  UT: "America/Denver",
  VA: "America/New_York",
  VT: "America/New_York",
  WA: "America/Los_Angeles",
  WI: "America/Chicago",
  WV: "America/New_York",
  WY: "America/Denver",
};

const CA_PROVINCE_TIMEZONES = {
  AB: "America/Edmonton",
  BC: "America/Vancouver",
  MB: "America/Winnipeg",
  NB: "America/Moncton",
  NL: "America/St_Johns",
  NS: "America/Halifax",
  NT: "America/Yellowknife",
  NU: "America/Iqaluit",
  ON: "America/Toronto",
  PE: "America/Halifax",
  QC: "America/Toronto",
  SK: "America/Regina",
  YT: "America/Whitehorse",
};

export const normalizeDisplayCountry = (value) => {
  const code = String(value || "").trim().toUpperCase();
  if (code === "QC") return "CA";
  if (code === "US" || code === "CA" || code === "OTHER") return code;
  if (code === "USA") return "US";
  if (code === "CANADA") return "CA";
  return code || "US";
};

export const countryDisplayLabel = (country) => {
  const code = normalizeDisplayCountry(country);
  if (code === "US") return "United States";
  if (code === "CA") return "Canada";
  return "Other";
};

export const getRegionOptions = (country) => {
  const code = normalizeDisplayCountry(country);
  if (code === "US") return US_STATES;
  if (code === "CA") return CANADA_PROVINCES;
  return [];
};

export const getRegionLabel = (country) => {
  const code = normalizeDisplayCountry(country);
  if (code === "US") return "State";
  if (code === "CA") return "Province";
  return "State / Province";
};

export const getPostalLabel = (country) => {
  const code = normalizeDisplayCountry(country);
  if (code === "US") return "ZIP Code";
  if (code === "CA") return "Postal Code";
  return "Postal / ZIP";
};

export const getPostalHelper = (country) => {
  const code = normalizeDisplayCountry(country);
  if (code === "US") return "Use 12345 or 12345-6789.";
  if (code === "CA") return "Use A1A 1A1.";
  return "Use the postal or ZIP format used in this country.";
};

export const postalLooksCanadian = (value) => /^[A-Z]\d[A-Z][ -]?\d[A-Z]\d$/i.test(String(value || "").trim());
export const postalLooksUS = (value) => /^\d{5}(-\d{4})?$/.test(String(value || "").trim());

export const formatPostalInput = (country, raw) => {
  let value = String(raw || "").toUpperCase();
  const code = normalizeDisplayCountry(country);
  if (code === "CA") {
    return value.replace(/[^A-Z0-9]/g, "").replace(/^(.{3})(.{0,3})$/, "$1 $2").trim();
  }
  if (code === "US") {
    value = value.replace(/[^\d-]/g, "");
    if (value.length > 5 && !value.includes("-")) value = `${value.slice(0, 5)}-${value.slice(5)}`;
    return value;
  }
  return value;
};

export const suggestTimezoneForRegion = (country, region) => {
  const code = normalizeDisplayCountry(country);
  const normalizedRegion = String(region || "").trim().toUpperCase();
  if (code === "US") return US_STATE_TIMEZONES[normalizedRegion] || "";
  if (code === "CA") return CA_PROVINCE_TIMEZONES[normalizedRegion] || "";
  return "";
};

const US_STATE_NAMES = {
  AL: "alabama", AK: "alaska", AZ: "arizona", AR: "arkansas", CA: "california", CO: "colorado", CT: "connecticut", DE: "delaware", DC: "district of columbia", FL: "florida", GA: "georgia", HI: "hawaii", ID: "idaho", IL: "illinois", IN: "indiana", IA: "iowa", KS: "kansas", KY: "kentucky", LA: "louisiana", ME: "maine", MD: "maryland", MA: "massachusetts", MI: "michigan", MN: "minnesota", MS: "mississippi", MO: "missouri", MT: "montana", NE: "nebraska", NV: "nevada", NH: "new hampshire", NJ: "new jersey", NM: "new mexico", NY: "new york", NC: "north carolina", ND: "north dakota", OH: "ohio", OK: "oklahoma", OR: "oregon", PA: "pennsylvania", RI: "rhode island", SC: "south carolina", SD: "south dakota", TN: "tennessee", TX: "texas", UT: "utah", VT: "vermont", VA: "virginia", WA: "washington", WV: "west virginia", WI: "wisconsin", WY: "wyoming"
};
const CA_PROVINCE_NAMES = { AB: "alberta", BC: "british columbia", MB: "manitoba", NB: "new brunswick", NL: "newfoundland and labrador", NS: "nova scotia", NT: "northwest territories", NU: "nunavut", ON: "ontario", PE: "prince edward island", QC: "quebec", SK: "saskatchewan", YT: "yukon" };

export const getAddressWarnings = ({ country, region, postalCode, city, timezone }) => {
  const code = normalizeDisplayCountry(country);
  const warnings = [];
  const normalizedRegion = String(region || "").trim().toUpperCase();
  const normalizedCity = String(city || "").trim().toLowerCase();
  if (code === "US") {
    if (postalCode && postalLooksCanadian(postalCode)) warnings.push("This looks like a Canadian postal code.");
    if (normalizedRegion && !US_STATES.includes(normalizedRegion)) warnings.push("Select a valid U.S. state for a United States address.");
    if (normalizedCity && US_STATE_NAMES[normalizedRegion] && normalizedCity === US_STATE_NAMES[normalizedRegion]) warnings.push("City appears to match the selected state name. Please confirm it.");
  } else if (code === "CA") {
    if (postalCode && postalLooksUS(postalCode)) warnings.push("This looks like a U.S. ZIP code.");
    if (normalizedRegion && !CANADA_PROVINCES.includes(normalizedRegion)) warnings.push("Select a valid Canadian province for a Canada address.");
    if (normalizedCity && CA_PROVINCE_NAMES[normalizedRegion] && normalizedCity === CA_PROVINCE_NAMES[normalizedRegion]) warnings.push("City appears to match the selected province name. Please confirm it.");
  }
  const suggestedTz = suggestTimezoneForRegion(code, normalizedRegion);
  if (suggestedTz && timezone && String(timezone).trim() && String(timezone).trim() !== suggestedTz) {
    warnings.push("This timezone may not match the selected payroll location. Please confirm before using this location for payroll.");
  }
  return warnings;
};
