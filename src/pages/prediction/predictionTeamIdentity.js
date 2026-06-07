const TEAM_IDENTITIES = {
  Algeria: { iso2: "DZ", code: "ALG", accentColors: ["#006233", "#D21034"] },
  Argentina: { iso2: "AR", code: "ARG", accentColors: ["#6CB4EE", "#F6B40E"] },
  Australia: { iso2: "AU", code: "AUS", accentColors: ["#012169", "#FFCD00"] },
  Austria: { iso2: "AT", code: "AUT", accentColors: ["#ED2939", "#FFFFFF"] },
  Belgium: { iso2: "BE", code: "BEL", accentColors: ["#000000", "#FFD90C"] },
  "Bosnia and Herzegovina": { iso2: "BA", code: "BIH", accentColors: ["#002395", "#FECB00"] },
  Brazil: { iso2: "BR", code: "BRA", accentColors: ["#009739", "#FEDD00"] },
  Canada: { iso2: "CA", code: "CAN", accentColors: ["#D80621", "#FFFFFF"] },
  "Cape Verde": { iso2: "CV", code: "CPV", accentColors: ["#003893", "#CF2027"] },
  Colombia: { iso2: "CO", code: "COL", accentColors: ["#FCD116", "#003893"] },
  Croatia: { iso2: "HR", code: "CRO", accentColors: ["#F00000", "#171796"] },
  "Curaçao": { iso2: "CW", code: "CUW", accentColors: ["#002B7F", "#F9E814"] },
  "Czech Republic": { iso2: "CZ", code: "CZE", accentColors: ["#11457E", "#D7141A"] },
  "DR Congo": { iso2: "CD", code: "COD", accentColors: ["#00A3E0", "#EF3340"] },
  Ecuador: { iso2: "EC", code: "ECU", accentColors: ["#FCD116", "#034EA2"] },
  Egypt: { iso2: "EG", code: "EGY", accentColors: ["#CE1126", "#000000"] },
  England: { iso2: "GB", code: "ENG", flagClass: "fi-gb-eng", accentColors: ["#CE1126", "#FFFFFF"] },
  France: { iso2: "FR", code: "FRA", accentColors: ["#0055A4", "#EF4135"] },
  Germany: { iso2: "DE", code: "GER", accentColors: ["#000000", "#DD0000"] },
  Ghana: { iso2: "GH", code: "GHA", accentColors: ["#CE1126", "#FCD116"] },
  Haiti: { iso2: "HT", code: "HAI", accentColors: ["#00209F", "#D21034"] },
  Iran: { iso2: "IR", code: "IRN", accentColors: ["#239F40", "#DA0000"] },
  Iraq: { iso2: "IQ", code: "IRQ", accentColors: ["#CE1126", "#000000"] },
  "Ivory Coast": { iso2: "CI", code: "CIV", accentColors: ["#F77F00", "#009E60"] },
  Japan: { iso2: "JP", code: "JPN", accentColors: ["#BC002D", "#FFFFFF"] },
  Jordan: { iso2: "JO", code: "JOR", accentColors: ["#007A3D", "#CE1126"] },
  Mexico: { iso2: "MX", code: "MEX", accentColors: ["#006847", "#CE1126"] },
  Morocco: { iso2: "MA", code: "MAR", accentColors: ["#C1272D", "#006233"] },
  Netherlands: { iso2: "NL", code: "NED", accentColors: ["#AE1C28", "#21468B"] },
  "New Zealand": { iso2: "NZ", code: "NZL", accentColors: ["#00247D", "#CC142B"] },
  Norway: { iso2: "NO", code: "NOR", accentColors: ["#BA0C2F", "#00205B"] },
  Panama: { iso2: "PA", code: "PAN", accentColors: ["#005293", "#D21034"] },
  Paraguay: { iso2: "PY", code: "PAR", accentColors: ["#D52B1E", "#0038A8"] },
  Portugal: { iso2: "PT", code: "POR", accentColors: ["#046A38", "#DA291C"] },
  Qatar: { iso2: "QA", code: "QAT", accentColors: ["#8A1538", "#FFFFFF"] },
  "Saudi Arabia": { iso2: "SA", code: "KSA", accentColors: ["#006C35", "#FFFFFF"] },
  Scotland: { iso2: "GB", code: "SCO", flagClass: "fi-gb-sct", accentColors: ["#0065BD", "#FFFFFF"] },
  Senegal: { iso2: "SN", code: "SEN", accentColors: ["#00853F", "#FDEF42"] },
  "South Africa": { iso2: "ZA", code: "RSA", accentColors: ["#007A4D", "#DE3831"] },
  "South Korea": { iso2: "KR", code: "KOR", accentColors: ["#C60C30", "#003478"] },
  Spain: { iso2: "ES", code: "ESP", accentColors: ["#AA151B", "#F1BF00"] },
  Sweden: { iso2: "SE", code: "SWE", accentColors: ["#006AA7", "#FECC00"] },
  Switzerland: { iso2: "CH", code: "SUI", accentColors: ["#D52B1E", "#FFFFFF"] },
  Tunisia: { iso2: "TN", code: "TUN", accentColors: ["#E70013", "#FFFFFF"] },
  Turkey: { iso2: "TR", code: "TUR", accentColors: ["#E30A17", "#FFFFFF"] },
  "United States": { iso2: "US", code: "USA", accentColors: ["#3C3B6E", "#B22234"] },
  Uruguay: { iso2: "UY", code: "URU", accentColors: ["#0038A8", "#FCD116"] },
  Uzbekistan: { iso2: "UZ", code: "UZB", accentColors: ["#0099B5", "#1EB53A"] },
};

export const getAllPredictionTeamOptions = () =>
  Object.keys(TEAM_IDENTITIES)
    .sort((a, b) => a.localeCompare(b))
    .map((teamName) => ({
      teamName,
      ...getTeamIdentity(teamName),
    }));

const PLACEHOLDER_PATTERNS = [
  /^winner /i,
  /^runner-up /i,
  /^runner up /i,
  /^loser /i,
  /^3rd /i,
  /^tbd$/i,
  /^to be determined$/i,
];

const iso2ToEmojiFlag = (iso2) =>
  typeof iso2 === "string" && iso2.length === 2
    ? iso2
        .toUpperCase()
        .split("")
        .map((char) => String.fromCodePoint(127397 + char.charCodeAt(0)))
        .join("")
    : "";

export const isPlaceholderTeam = (teamName) => {
  const value = String(teamName || "").trim();
  if (!value) return true;
  return PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(value));
};

export const getPlaceholderLabel = (teamName) => {
  const value = String(teamName || "").trim();
  return value || "TBD";
};

export const getTeamIdentity = (teamName, shortCode) => {
  const normalized = String(teamName || "").trim();
  if (!normalized) {
    return {
      type: "placeholder",
      teamName: "TBD",
      shortCode: "TBD",
      flag: "",
      iso2: "",
      accentColors: [],
      placeholderLabel: "TBD",
    };
  }

  if (isPlaceholderTeam(normalized)) {
    return {
      type: "placeholder",
      teamName: normalized,
      shortCode: String(shortCode || "").trim() || "TBD",
      flag: "",
      iso2: "",
      accentColors: [],
      placeholderLabel: getPlaceholderLabel(normalized),
    };
  }

  const identity = TEAM_IDENTITIES[normalized];
  const resolvedCode = String(shortCode || identity?.code || normalized.slice(0, 3)).toUpperCase();
  const iso2 = identity?.iso2 || "";
  const flagClass = identity?.flagClass || (iso2 ? `fi-${iso2.toLowerCase()}` : "");

  return {
    type: "team",
    teamName: normalized,
    shortCode: resolvedCode,
    flag: iso2ToEmojiFlag(iso2),
    iso2,
    flagClass,
    accentColors: identity?.accentColors || [],
    placeholderLabel: "",
  };
};

export default TEAM_IDENTITIES;
