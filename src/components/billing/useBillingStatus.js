import { useEffect, useState } from "react";
import api from "../../utils/api";

const useBillingStatus = () => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
    const run = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await api.get("/billing/status");
        if (!active) return;
        setStatus(res?.data || null);
      } catch (err) {
        if (!active) return;
        setError(err?.response?.data?.error || err?.message || "Unable to load billing status.");
      } finally {
        if (active) setLoading(false);
      }
    };
    run();
    return () => {
      active = false;
    };
  }, []);

  return { status, loading, error };
};

export default useBillingStatus;
