import { Capacitor } from "@capacitor/core";

export const isNativeRuntime = () => {
  try {
    return (
      Capacitor?.isNativePlatform?.() === true ||
      (Capacitor?.getPlatform?.() && Capacitor.getPlatform() !== "web")
    );
  } catch {
    return false;
  }
};

export const isMobileViewport = () => {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  return window.matchMedia("(max-width: 900px)").matches;
};

export const isMobileAppMode = () => isNativeRuntime() || isMobileViewport();
