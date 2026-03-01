import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { trackEvent, trackPageview } from "./ga";
import { api } from "../utils/api";
import { getOrCreateTelemetrySessionId, isStaffSession } from "./staffTelemetry";

const TELEMETRY_OK_KEY = "staff_telemetry_ping_ok_count";
const TELEMETRY_FAIL_KEY = "staff_telemetry_ping_fail_count";

const RouteTracker = () => {
  const location = useLocation();
  const lastPathRef = useRef("");
  const lastPingRef = useRef(0);
  const routePingTimerRef = useRef(null);

  const reportPingHealth = (ok) => {
    if (typeof window === "undefined") return;
    const okCount = Number(sessionStorage.getItem(TELEMETRY_OK_KEY) || 0);
    const failCount = Number(sessionStorage.getItem(TELEMETRY_FAIL_KEY) || 0);
    const nextOk = ok ? okCount + 1 : okCount;
    const nextFail = ok ? failCount : failCount + 1;
    sessionStorage.setItem(TELEMETRY_OK_KEY, String(nextOk));
    sessionStorage.setItem(TELEMETRY_FAIL_KEY, String(nextFail));
    window.dispatchEvent(
      new CustomEvent("telemetry:ping-status", {
        detail: { okCount: nextOk, failCount: nextFail, ok },
      })
    );
  };

  const sendStaffTelemetryPing = async (source) => {
    if (typeof document === "undefined") return;
    if (!isStaffSession()) return;
    if (source === "heartbeat" && document.visibilityState !== "visible") return;

    const sessionId = getOrCreateTelemetrySessionId();
    if (!sessionId) return;
    const page = `${location.pathname}${location.search || ""}`;
    try {
      await api.post("/telemetry/ping", {
        source,
        page,
        session_id: sessionId,
      });
      lastPingRef.current = Date.now();
      reportPingHealth(true);
    } catch {
      reportPingHealth(false);
      // Intentionally silent: telemetry must never block UX.
    }
  };

  useEffect(() => {
    const path = `${location.pathname}${location.search || ""}`;
    if (lastPathRef.current === path) return;
    lastPathRef.current = path;

    trackPageview({ path, title: document.title });

    if (location.pathname === "/register") {
      trackEvent({ action: "signup_start", label: path });
    } else if (location.pathname === "/demo") {
      trackEvent({ action: "demo_request", label: path });
    }

    if (routePingTimerRef.current) {
      window.clearTimeout(routePingTimerRef.current);
    }
    routePingTimerRef.current = window.setTimeout(() => {
      sendStaffTelemetryPing("route_change");
      routePingTimerRef.current = null;
    }, 450);

    return () => {
      if (routePingTimerRef.current) {
        window.clearTimeout(routePingTimerRef.current);
        routePingTimerRef.current = null;
      }
    };
  }, [location]);

  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") return undefined;

    const everyMs = 3 * 60 * 1000;
    const tick = () => {
      if (!isStaffSession()) return;
      if (document.visibilityState !== "visible") return;
      const now = Date.now();
      if (now - lastPingRef.current < everyMs - 1000) return;
      sendStaffTelemetryPing("heartbeat");
    };

    const intervalId = window.setInterval(tick, 30 * 1000);
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        tick();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, [location.pathname, location.search]);

  return null;
};

export default RouteTracker;
