export const isNativeRuntime = () => {
  if (typeof window === "undefined") return false;
  const cap = window.Capacitor;
  const byCapacitor =
    typeof cap?.isNativePlatform === "function"
      ? cap.isNativePlatform()
      : Boolean(cap?.isNativePlatform);
  return byCapacitor || window.location.protocol === "capacitor:";
};

export const isMobileViewport = () => {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  return window.matchMedia("(max-width: 900px)").matches;
};

export const isMobileAppMode = () => isNativeRuntime() || isMobileViewport();

