import { usePrefersReducedMotion, useReveal } from "../hvac-shared/runtime";

export function useDispatchReveal(options = {}) {
  return useReveal({ offset: 12, delay: options.delay || 0 });
}

export { usePrefersReducedMotion };
