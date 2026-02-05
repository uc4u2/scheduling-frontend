import { useCallback, useEffect, useRef, useState } from "react";
import api from "../../utils/api";

const useBillingStatus = ({ forceSync = false } = {}) => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const isMountedRef = useRef(true);

  const run = useCallback(
    async (opts = {}) => {
      const shouldForceSync = Boolean(opts.forceSync ?? forceSync);
      if (isMountedRef.current) {
        setLoading(true);
        setError("");
      }
      try {
        if (shouldForceSync) {
          await api.post("/billing/sync-from-stripe");
        }
        const res = await api.get("/billing/status");
        if (isMountedRef.current) {
          setStatus(res?.data || null);
        }
        return res?.data || null;
      } catch (err) {
        if (isMountedRef.current) {
          setError(
            err?.response?.data?.error ||
              err?.message ||
              "Unable to load billing status."
          );
        }
        throw err;
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
        }
      }
    },
    [forceSync]
  );

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const token = typeof localStorage !== "undefined" ? localStorage.getItem("token") : null;
    const role = typeof localStorage !== "undefined" ? localStorage.getItem("role") : null;
    const path = typeof window !== "undefined" ? window.location.pathname : "";
    const isAdminRoute =
      path.startsWith("/manager") ||
      path.startsWith("/admin") ||
      path.startsWith("/settings") ||
      path.startsWith("/dashboard");
    if (!token || role !== "manager" || !isAdminRoute) {
      setLoading(false);
      return () => {
        // no-op
      };
    }
    run({ forceSync }).catch(() => null);
    return () => {
      // no-op
    };
  }, [run, forceSync]);

  return { status, loading, error, refetch: run };
};

export default useBillingStatus;
