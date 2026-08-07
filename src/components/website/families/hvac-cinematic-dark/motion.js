import { useParallax, usePrefersReducedMotion, useReveal } from "../hvac-shared/runtime";

export function useCinematicReveal(options = {}) {
  return useReveal({ offset: 22, delay: options.delay || 0 });
}

export function useCinematicParallax(multiplier = 0.06) {
  return useParallax(multiplier);
}

export { usePrefersReducedMotion };
