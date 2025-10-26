// src/hooks/useCompanyId.js
import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../utils/api";
import {
  getAuthedCompanyId,
  setCachedCompanyId,
  onCompanyIdChange,
} from "../utils/authedCompany";

/**
 * Simple hook for current company id.
 */
export default function useCompanyId(opts = {}) {
  const { companyId } = useCompanyIdEx(opts);
  return companyId;
}

/**
 * Extended: returns { companyId, setCompanyId, source }
 * Resolution order (first hit wins):
 *  1) props.initial
 *  2) URL ?company_id=123
 *  3) URL ?site=<slug> or ?slug=<slug>  → GET /api/public/<slug>/website (no company header)
 *  4) localStorage (getAuthedCompanyId)
 *  5) backend fallback (/auth/me → /manager/profile → /api/company/me)
 *  6) dev default (1) when on localhost
 */
export function useCompanyIdEx({
  initial,
  allowQuery = true,
  devDefault = 1,
  backendFallback = true,
} = {}) {
  const resolving = useRef(false);

  const firstGuess = useMemo(() => {
    // 1) explicit initial
    if (Number.isFinite(Number(initial)) && Number(initial) > 0) {
      return Number(initial);
    }

    // 2) ?company_id=
    if (allowQuery && typeof window !== "undefined") {
      try {
        const q = new URLSearchParams(window.location.search);
        const qCid = Number(q.get("company_id"));
        if (Number.isFinite(qCid) && qCid > 0) return qCid;
      } catch {}
    }

    // 3) slug via public JSON
    // handled in effect below (needs async)

    // 4) localStorage / JWT (helper)
    const fromCache = getAuthedCompanyId({ allowQuery, devDefault });
    if (fromCache) return fromCache;

    // Else unknown for now
    return null;
  }, [initial, allowQuery, devDefault]);

  const [companyId, setCompanyIdState] = useState(firstGuess);
  const [source, setSource] = useState(firstGuess != null ? "hint/local" : "unknown");

  // cross-tab sync
  useEffect(() => onCompanyIdChange((n) => {
    if (n && n !== companyId) {
      setCompanyIdState(n);
      setSource("storage");
    }
  }), [companyId]);

  // keep localStorage consistent
  useEffect(() => {
    if (companyId && Number(companyId) > 0) {
      setCachedCompanyId(companyId);
    }
  }, [companyId]);

  // 3) Resolve from slug if needed
  useEffect(() => {
    if (companyId) return;
    if (!allowQuery) return;

    let alive = true;
    (async () => {
      try {
        if (typeof window === "undefined") return;
        const q = new URLSearchParams(window.location.search);
        const slug = q.get("site") || q.get("slug");

        if (!slug) {
          // also try path /<slug>/*
          const [, pathSlug] = String(window.location.pathname).split("/");
          if (pathSlug && pathSlug !== "manage") {
            const { data } = await api.get(`/api/public/${encodeURIComponent(pathSlug)}/website`, { noCompanyHeader: true });
            const id = data?.company_id || data?.company?.id;
            const n = Number(id);
            if (alive && Number.isFinite(n) && n > 0) {
              setCachedCompanyId(n);
              setCompanyIdState(n);
              setSource(`public:${pathSlug}`);
              return;
            }
          }
          return;
        }

        const { data } = await api.get(`/api/public/${encodeURIComponent(slug)}/website`, { noCompanyHeader: true });
        const id = data?.company_id || data?.company?.id;
        const n = Number(id);
        if (alive && Number.isFinite(n) && n > 0) {
          setCachedCompanyId(n);
          setCompanyIdState(n);
          setSource(`public:${slug}`);
        }
      } catch {
        // ignore, backend fallback will kick in
      }
    })();

    return () => { alive = false; };
  }, [companyId, allowQuery]);

  // 5) backend fallback
  useEffect(() => {
    if (companyId || !backendFallback || resolving.current) return;
    resolving.current = true;
    let alive = true;

    (async () => {
      const tryPaths = ["/auth/me", "/manager/profile", "/api/company/me"];
      for (const path of tryPaths) {
        try {
          const { data } = await api.get(path);
          const id =
            data?.company_id ??
            data?.company?.id ??
            data?.profile?.company_id ??
            data?.id ??
            null;
          const n = Number(id);
          if (alive && Number.isFinite(n) && n > 0) {
            setCachedCompanyId(n);
            setCompanyIdState(n);
            setSource(`backend:${path}`);
            return;
          }
        } catch {
          // continue
        }
      }

      // 6) dev default on localhost
      try {
        if (
          typeof window !== "undefined" &&
          (/^localhost$|^127\.0\.0\.1$/.test(window.location.hostname) ||
            window.location.hostname.endsWith(".local"))
        ) {
          setCachedCompanyId(devDefault);
          setCompanyIdState(devDefault);
          setSource("dev-default");
        }
      } catch {}
    })().finally(() => { resolving.current = false; });

    return () => { alive = false; };
  }, [companyId, backendFallback, devDefault]);

  const setCompanyId = (next) => {
    const n = Number(next);
    if (!Number.isFinite(n) || n <= 0) return;
    setCachedCompanyId(n);
    setCompanyIdState(n);
    setSource("manual");
    try { localStorage.setItem("company_id", String(n)); } catch {}
  };

  return { companyId, setCompanyId, source };
}
