// src/hooks/useDataSource.js
import { useEffect, useMemo, useState, useCallback } from "react";
import { api } from "../utils/api";

/**
 * def = {
 *   url: "/public/services",
 *   params: { limit: 6 },
 *   pick: "items",           // optional path at response root
 *   map:  (x) => x,          // optional mapper for arrays
 *   noCompanyHeader: true    // optional; skip X-Company-Id for public endpoints
 * }
 */
export function useDataSource(def = {}, { ttlMs = 60000 } = {}) {
  const resolvedSlug = useMemo(() => {
    if (typeof window === "undefined") return "";
    try {
      const q = new URLSearchParams(window.location.search);
      const fromQuery = q.get("site") || q.get("slug");
      if (fromQuery) return fromQuery;
    } catch {}
    const parts = String(window.location.pathname || "").split("/").filter(Boolean);
    return parts[0] || "";
  }, []);

  const stable = useMemo(() => {
    const rawUrl = def.url || "";
    const url = rawUrl.includes("{{slug}}") && resolvedSlug
      ? rawUrl.replaceAll("{{slug}}", resolvedSlug)
      : rawUrl;
    return {
      url,
    params: def.params || {},
    pick: def.pick || "",
    map: def.map || null,
    noCompanyHeader: Boolean(def.noCompanyHeader),
    };
  }, [JSON.stringify(def), resolvedSlug]);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(!!stable.url);
  const [error, setError] = useState(null);

  const cacheKey = useMemo(
    () => `ds:${stable.url}:${JSON.stringify(stable.params)}:${stable.pick}`,
    [stable.url, JSON.stringify(stable.params), stable.pick]
  );

  const load = useCallback(async () => {
    if (!stable.url) {
      setData(null); setLoading(false); setError(null);
      return;
    }

    // serve from cache (ttl)
    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        const { ts, payload } = JSON.parse(cached);
        if (Date.now() - ts < ttlMs) {
          setData(payload); setLoading(false); setError(null);
          return;
        }
      }
    } catch { /* ignore cache errors */ }

    setLoading(true); setError(null);
    try {
      const res = await api.get(stable.url, {
        params: stable.params,
        noCompanyHeader: stable.noCompanyHeader,
      });
      const root = res?.data;
      const raw = stable.pick ? root?.[stable.pick] : root;
      const mapped = Array.isArray(raw) && typeof stable.map === "function"
        ? raw.map(stable.map)
        : raw;

      setData(mapped);
      setLoading(false);
      try {
        sessionStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), payload: mapped }));
      } catch { /* ignore quota */ }
    } catch (e) {
      setError(e);
      setData(null);
      setLoading(false);
    }
  }, [stable, cacheKey, ttlMs]);

  useEffect(() => { load(); }, [load]);

  return { data, loading, error, reload: load };
}

export default useDataSource;
