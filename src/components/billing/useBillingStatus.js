import { useCallback, useEffect, useState } from "react";
import api from "../../utils/api";

const useBillingStatus = ({ forceSync = false } = {}) => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const run = useCallback(
    async (opts = {}) => {
      const shouldForceSync = Boolean(opts.forceSync ?? forceSync);
      setLoading(true);
      setError("");
      try {
        if (shouldForceSync) {
          await api.post("/billing/sync-from-stripe");
        }
        const res = await api.get("/billing/status");
        setStatus(res?.data || null);
        return res?.data || null;
      } catch (err) {
        setError(
          err?.response?.data?.error || err?.message || "Unable to load billing status."
        );
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [forceSync]
  );

  useEffect(() => {
    let active = true;
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
        active = false;
      };
    }
    run({ forceSync }).catch(() => null);
    return () => {
      active = false;
    };
  }, [run, forceSync]);

  return { status, loading, error, refetch: run };
};

export default useBillingStatus;
