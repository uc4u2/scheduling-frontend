// src/embed.js
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";

const STORE_KEY = "schedulaa_embed";

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
  const embed = searchParams.get("embed") === "1";
  const primary = (searchParams.get("primary") || "").replace("%23", "#");
  const text = (searchParams.get("text") || "").toLowerCase();
  return {
    isEmbed: embed,
    primary: primary || null,
    text: text || null,
  };
}

/** Hook: returns merged embed config (URL has priority; falls back to store) and keeps store fresh */
export function useEmbedConfig() {
  const [params] = useSearchParams();
  const urlCfg = readEmbedFromURL(params);
  const stored = readEmbedStore();

  const merged = {
    isEmbed: urlCfg.isEmbed || stored?.isEmbed || false,
    primary: urlCfg.primary || stored?.primary || "#1976d2",
    text: urlCfg.text || stored?.text || "light",
  };

  // keep store in sync if URL provided anything
  if (urlCfg.isEmbed) writeEmbedStore(merged);

  return merged;
}

/** Merge current embed params into a URLSearchParams */
function appendEmbedParams(existingSearch, embedCfg) {
  const out = new URLSearchParams(existingSearch || "");
  if (embedCfg.isEmbed) {
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
      const merged = appendEmbedParams(q, cfg);
      navigate(merged ? `${path}?${merged}` : path, opts);
    } else {
      const merged = appendEmbedParams(to.search, cfg);
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
    const merged = appendEmbedParams(q, cfg);
    href = merged ? `${path}?${merged}` : path;
  } else {
    const merged = appendEmbedParams(to.search, cfg);
    href = { ...to, search: merged };
  }
  // lazy import to avoid circular dep
  const { Link } = require("react-router-dom");
  return <Link to={href} {...props} />;
}
