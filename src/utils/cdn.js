// src/utils/cdn.js
import { website } from "./api";

/** Build a transform URL if the backend exposes a /media/transform route or serves variants */
export function buildCdnUrl(companyId, storedNameOrUrl, opts = {}) {
  const isAbsolute = /^https?:\/\//i.test(storedNameOrUrl || "");
  if (isAbsolute) return storedNameOrUrl;
  const base = website.mediaFileUrl(companyId, storedNameOrUrl);
  const params = new URLSearchParams();
  if (opts.w) params.set("w", String(opts.w));
  if (opts.h) params.set("h", String(opts.h));
  if (opts.fit) params.set("fit", String(opts.fit));
  const q = params.toString();
  return q ? `${base}?${q}` : base;
}
