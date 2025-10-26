import { useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";

/**
 * Captures `?coupon=` (and optional ?utm_source=) and stores it in localStorage
 * under a slug-scoped key: coupon:<slug> = { code, utm, at }
 */
export default function useCouponCapture() {
  const { slug } = useParams();
  const [sp] = useSearchParams();

  useEffect(() => {
    const coupon = sp.get("coupon");
    const utm = sp.get("utm_source");
    if (!slug || !coupon) return;

    const key = `coupon:${slug}`;
    const payload = { code: coupon, utm: utm || null, at: Date.now() };
    try {
      localStorage.setItem(key, JSON.stringify(payload));
    } catch {}
  }, [sp, slug]);
}
