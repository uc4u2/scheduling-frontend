import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { trackEvent, trackPageview } from "./ga";

const RouteTracker = () => {
  const location = useLocation();
  const lastPathRef = useRef("");

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
  }, [location]);

  return null;
};

export default RouteTracker;

