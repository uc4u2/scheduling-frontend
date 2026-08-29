// src/embed.js
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";

const STORE_KEY = "schedulaa_embed";
const PRESENTATION_QUERY_KEYS = [
  "embed",
  "mode",
  "dialog",
  "site",
  "primary",
  "text",
  "return_to",
  "returnTo",
];

/** Read saved embed config from sessionStorage */
export function readEmbedStore() {
  try {
    const raw = sessionStorage.getItem(STORE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/** Save embed config to sessionStorage */
export function writeEmbedStore(cfg) {
  try {
    sessionStorage.setItem(STORE_KEY, JSON.stringify(cfg));
  } catch {}
}

/** Extract embed config from current URL */
export function readEmbedFromURL(searchParams) {
  const rawEmbed = searchParams.get("embed");
  const hasEmbedParam = rawEmbed !== null;
  const embed = hasEmbedParam ? rawEmbed === "1" : null;
  const primaryParam = searchParams.get("primary");
  const textParam = searchParams.get("text");
  return {
    isEmbed: embed,
    hasEmbedParam,
    primary: primaryParam ? primaryParam.replace("%23", "#") : null,
    text: textParam ? textParam.toLowerCase() : null,
  };
}

/** Hook: returns merged embed config (URL has priority; falls back to store) and keeps store fresh */
export function useEmbedConfig() {
  const [params] = useSearchParams();
  const urlCfg = readEmbedFromURL(params);
  const stored = readEmbedStore();
  const isEmbed = urlCfg.hasEmbedParam ? Boolean(urlCfg.isEmbed) : false;

  const primary = isEmbed
    ? urlCfg.primary ?? stored?.primary ?? "#1976d2"
    : "#1976d2";
  const text = isEmbed
    ? urlCfg.text ?? stored?.text ?? "light"
    : "light";

  if (isEmbed) {
    writeEmbedStore({ isEmbed, primary, text });
  } else if (stored) {
    try {
      sessionStorage.removeItem(STORE_KEY);
    } catch {}
  }

  return { isEmbed, primary, text };
}

/** Merge current embed params into a URLSearchParams */
function appendEmbedParams(existingSearch, embedCfg, currentSearch = "") {
  const out = new URLSearchParams(existingSearch || "");
  if (embedCfg.isEmbed) {
    const current = new URLSearchParams(currentSearch || "");
    PRESENTATION_QUERY_KEYS.forEach((key) => {
      if (!out.has(key) && current.has(key)) out.set(key, current.get(key));
    });
    out.set("embed", "1");
    if (embedCfg.primary) out.set("primary", embedCfg.primary);
    if (embedCfg.text) out.set("text", embedCfg.text);
  }
  return out.toString();
}

/** Hook: navigate() that automatically carries embed params */
export function useNavWithEmbed() {
  const navigate = useNavigate();
  const location = useLocation();
  const cfg = useEmbedConfig();

  return (to, opts) => {
    if (typeof to === "string") {
      const [path, q = ""] = to.split("?");
      const merged = appendEmbedParams(q, cfg, location.search);
      navigate(merged ? `${path}?${merged}` : path, opts);
    } else {
      const merged = appendEmbedParams(to.search, cfg, location.search);
      navigate({ ...to, search: merged }, opts);
    }
  };
}

/** Component: Link wrapper that preserves embed params */
export function LinkWithEmbed({ to, ...props }) {
  const location = useLocation();
  const cfg = useEmbedConfig();

  let href;
  if (typeof to === "string") {
    const [path, q = ""] = to.split("?");
    const merged = appendEmbedParams(q, cfg, location.search);
    href = merged ? `${path}?${merged}` : path;
  } else {
    const merged = appendEmbedParams(to.search, cfg, location.search);
    href = { ...to, search: merged };
  }
  // lazy import to avoid circular dep
  const { Link } = require("react-router-dom");
  return <Link to={href} {...props} />;
}
