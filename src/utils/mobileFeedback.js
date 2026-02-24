export const hapticImpact = async (style = "light") => {
  try {
    const haptics = window?.Capacitor?.Plugins?.Haptics;
    if (haptics?.impact) {
      await haptics.impact({ style });
      return;
    }
  } catch {
    // noop
  }
  if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
    navigator.vibrate(style === "heavy" ? 25 : 12);
  }
};

export const hapticSuccess = async () => hapticImpact("medium");
