// src/utils/html.js
// Central HTML normalizers to keep your content clean and predictable.

const NBSP_RE = /\u00A0|&nbsp;/gi;

/* ---------------------------- base helpers ---------------------------- */

// Keep only text-align from style attributes (e.g., style="text-align:center; color:red" -> style="text-align:center")
const keepOnlyTextAlignStyle = (html) =>
  String(html || "").replace(/\sstyle="([^"]*)"/gi, (_, css) => {
    const m = /(?:^|;)\s*text-align\s*:\s*(left|center|right|justify)\s*(?:;|$)/i.exec(css || "");
    return m ? ` style="text-align:${m[1].toLowerCase()}"` : "";
  });

// Collapse whitespace and kill &nbsp;
const collapseSpaces = (s) =>
  (s || "")
    .replace(NBSP_RE, " ")
    .replace(/\s+/g, " ")
    .trim();

/** Minimal entity decoder (enough for UI labels) */
export function decodeEntities(s = "") {
  return String(s)
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

/** Strip all attributes from tags (e.g., <p class="x" style="y"> -> <p>) */
export function stripAllAttributes(html = "") {
  return String(html).replace(/<([a-z0-9]+)(\s[^>]*)?>/gi, "<$1>");
}

/* ---------------------------- exports you had ---------------------------- */

// Strip all tags (for plain text fields)
export function stripHtml(input) {
  if (input == null) return "";
  const s = String(input);
  const noTags = s.replace(/<\/?[^>]+>/g, "");
  return collapseSpaces(noTags);
}

// Turn block HTML into clean, minimal markup
export function normalizeBlockHtml(input) {
  if (!input) return "";

  let html = String(input);

  // preserve only text-align from any style attributes
  html = keepOnlyTextAlignStyle(html);

  // normalize common <p>&nbsp;</p> junk
  html = html.replace(/<p>\s*<\/p>/gi, "");
  html = html.replace(/<p>\s*(<br\s*\/?>)*\s*<\/p>/gi, "");

  // convert &nbsp; and collapse
  html = html.replace(NBSP_RE, " ");

  // collapse spaces but keep tags (don’t destroy <br> / <p>)
  html = html
    .replace(/[ \t]+/g, " ")
    .replace(/\s*\n+\s*/g, "\n")
    .trim();

  // optional: remove empty paragraphs again after collapsing
  html = html.replace(/<p>\s*<\/p>/gi, "");

  return html;
}

// Keep inline HTML (bold/italic/links) but remove block wrappers; keep only text-align
export function normalizeInlineHtml(input) {
  if (!input) return "";

  let html = String(input);

  // preserve only text-align from any style attributes
  html = keepOnlyTextAlignStyle(html);

  // inline shouldn’t carry <p> blocks; convert <p>..</p> to inline with <br/>
  html = html
    .replace(/<p[^>]*>/gi, "")
    .replace(/<\/p>/gi, "<br/>");

  // kill triple+ <br/> runs
  html = html.replace(/(<br\s*\/?>\s*){3,}/gi, "<br/><br/>");

  // replace &nbsp; and collapse
  html = html.replace(NBSP_RE, " ");

  // collapse spaces between tags safely
  html = html
    .replace(/[ \t]+/g, " ")
    .replace(/\s*\n+\s*/g, "\n")
    .trim();

  // trim trailing <br/>
  html = html.replace(/(<br\s*\/?>\s*)+$/i, "");

  return html;
}

/* ---------------------------- new utilities ---------------------------- */

/** Strip tags *and* decode entities → great for button labels / aria-labels */
export function toPlain(input) {
  return collapseSpaces(decodeEntities(stripHtml(input)));
}

/** Consider content “empty” if, once cleaned, nothing visible remains */
export function isEmptyHtml(input) {
  const cleaned = normalizeBlockHtml(input || "");
  const plain = stripHtml(cleaned);
  return plain.length === 0;
}

/** Limit long sequences of <br/> to a maximum count (default 2) */
export function clampConsecutiveBr(html = "", maxBr = 2) {
  const pattern = new RegExp(`(?:<br\\s*\\/?>\\s*){${maxBr + 1},}`, "gi");
  const replacement = Array.from({ length: maxBr }, () => "<br/>").join("");
  return String(html).replace(pattern, replacement);
}

/** Named aliases for clarity at call sites */
export const sanitizeInlineForStorage = (html) =>
  normalizeInlineHtml(clampConsecutiveBr(html));

export const sanitizeBlockForStorage = (html) =>
  normalizeBlockHtml(clampConsecutiveBr(html));
