// src/components/website/NavStyleHydrator.jsx
import React, { useMemo } from "react";
import { normalizeNavStyle, navStyleToCssVars } from "../../utils/navStyle";

/**
 * Injects CSS custom properties for navigation styling into a scoped selector.
 * This lets headers pick up nav button tokens without re-fetching pages.
 */
export default function NavStyleHydrator({ website, scopeSelector = ".site-nav" }) {
  const tokens = useMemo(() => {
    const raw =
      website?.nav_style ||
      website?.settings?.nav_style ||
      website?.website?.nav_style ||
      website?.website_setting?.settings?.nav_style ||
      {};
    return normalizeNavStyle(raw);
  }, [website]);

  const cssText = useMemo(() => {
    const vars = {
      "--nav-btn-gap": `${tokens.item_spacing}px`,
      ...navStyleToCssVars(tokens),
    };
    const serialized = Object.entries(vars)
      .filter(([, value]) => value !== undefined && value !== null && value !== "")
      .map(([key, value]) => `${key}:${value}`)
      .join(";");
    return `${scopeSelector}{${serialized}}`;
  }, [scopeSelector, tokens]);

  if (!cssText) return null;
  return <style dangerouslySetInnerHTML={{ __html: cssText }} />;
}
