// src/pages/client/MarketingCouponBridge.jsx
import { useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

export default function MarketingCouponBridge({ to = "?page=services-classic" }) {
  const { slug } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const qs = new URLSearchParams(location.search);
    const code = (qs.get("coupon") || "").trim();
    if (code) sessionStorage.setItem("preselected_coupon", code);
    // Preserve the rest of the query for analytics if you want:
    const destination = to.startsWith("?")
      ? { pathname: `/${slug}`, search: to }
      : { pathname: `/${slug}${to.startsWith("/") ? to : `/${to}`}` };
    navigate(destination, { replace: true });
  }, [location, navigate, slug, to]);

  return null;
}
