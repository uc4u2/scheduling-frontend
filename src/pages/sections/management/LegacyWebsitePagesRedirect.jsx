import React from "react";
import { Navigate, useLocation } from "react-router-dom";

export default function LegacyWebsitePagesRedirect() {
  const location = useLocation();
  const search = location?.search || "";
  return <Navigate to={`/manager/dashboard?view=website-pages${search ? `&${search.slice(1)}` : ""}`} replace />;
}
