// src/utils/sanitizeHtml.js
import DOMPurify from "dompurify";

let _hookInstalled = false;
function ensureStyleHook() {
  if (_hookInstalled) return;
  if (typeof DOMPurify.addHook === "function") {
    DOMPurify.addHook("uponSanitizeAttribute", (node, data) => {
      if (data.attrName !== "style") return;
      const m = /(?:^|;)\s*text-align\s*:\s*(left|center|right|justify)\s*(?:;|$)/i.exec(
        String(data.attrValue || "")
      );
      if (m) {
        data.attrValue = `text-align:${m[1].toLowerCase()}`;
      } else {
        data.keepAttr = false;
      }
    });
    _hookInstalled = true;
  }
}

/** Basic allowlist. Tune if you need iframes, etc. */
export const sanitizeHtml = (html = "") => {
  ensureStyleHook();
  return DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    ALLOWED_ATTR: ["href", "target", "rel", "class", "style"],
    ALLOWED_CSS_PROPERTIES: ["text-align"],
    FORBID_TAGS: ["script", "style"],
  });
};
