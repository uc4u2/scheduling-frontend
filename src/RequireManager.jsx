import React from "react";
import { Navigate, useLocation } from "react-router-dom";

export default function RequireManager({ children }) {
  const loc = useLocation();
  const token = localStorage.getItem("token");
  const companyId = localStorage.getItem("company_id"); // set on manager login flow

  // Treat “has company_id AND token” as a manager session.
  // (Don’t invent new IDs. This matches your existing login tool behavior.)
  if (!token || !companyId) {
    return <Navigate to="/login" replace state={{ from: loc }} />;
  }
  return children;
}
