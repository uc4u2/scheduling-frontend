// src/utils/safeHtml.js
import DOMPurify from "dompurify";

// Add a one-time hook (for DOMPurify v2) to keep only text-align within style attributes
let _hookInstalled = false;
function ensureStyleHook() {
  if (_hookInstalled) return;
  if (typeof DOMPurify.addHook === "function") {
    DOMPurify.addHook("uponSanitizeAttribute", (node, data) => {
      if (data.attrName !== "style") return;
      // Allow inline styles on iframes (needed for sizing embeds)
      const tag = String(node?.tagName || "").toLowerCase();
      if (tag === 'iframe') {
        return; // keep style as-is; other sanitizers still apply to tags/attrs
      }
      const m = /(?:^|;)\s*text-align\s*:\s*(left|center|right|justify)\s*(?:;|$)/i.exec(
        String(data.attrValue || "")
      );
      if (m) {
        data.attrValue = `text-align:${m[1].toLowerCase()}`;
      } else {
        data.keepAttr = false; // drop style entirely if no text-align
      }
    });
    _hookInstalled = true;
  }
}

export const safeHtml = (html = "") => {
  ensureStyleHook();
  return DOMPurify.sanitize(String(html), {
    ADD_TAGS: ["iframe"],
    ADD_ATTR: ["src", "width", "height", "allow", "allowfullscreen", "frameborder", "style"],
    ALLOWED_TAGS: ["a", "p", "span", "div", "ul", "ol", "li", "strong", "em", "br", "h1", "h2", "h3", "h4", "h5", "h6"],
    ALLOWED_ATTR: ["href", "target", "rel", "class", "style"],
    FORBID_TAGS: ["script", "style"],
    USE_PROFILES: { html: true },
  });
};
