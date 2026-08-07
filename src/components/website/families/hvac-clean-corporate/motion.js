import { usePrefersReducedMotion, useReveal } from "../hvac-shared/runtime";

export function useCorporateReveal(options = {}) {
  return useReveal({ offset: 14, delay: options.delay || 0 });
}

export { usePrefersReducedMotion };
