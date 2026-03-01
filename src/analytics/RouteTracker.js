import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { trackEvent, trackPageview } from "./ga";
import { api } from "../utils/api";
import { getOrCreateTelemetrySessionId, isStaffSession } from "./staffTelemetry";

const RouteTracker = () => {
  const location = useLocation();
  const lastPathRef = useRef("");
  const lastPingRef = useRef(0);

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
    } catch {
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

    sendStaffTelemetryPing("route_change");
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
