import { usePrefersReducedMotion, useReveal } from "../hvac-shared/runtime";

export function useComfortReveal(options = {}) {
  return useReveal({ offset: 10, delay: options.delay || 0 });
}

export { usePrefersReducedMotion };
