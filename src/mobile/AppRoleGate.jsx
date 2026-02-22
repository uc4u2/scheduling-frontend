import React, { useEffect, useState } from "react";
import { Box, CircularProgress, Typography } from "@mui/material";
import { Navigate, useLocation } from "react-router-dom";
import { getSessionUser } from "../utils/authRedirect";

export default function AppRoleGate() {
  const location = useLocation();
  const [redirectTo, setRedirectTo] = useState("");
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!token) {
        if (!alive) return;
        const next = encodeURIComponent(location.pathname + (location.search || ""));
        setRedirectTo(`/login?next=${next}`);
        setLoading(false);
        return;
      }

      const user = await getSessionUser();
      if (!alive) return;

      if (!user?.role) {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        setRedirectTo(`/login?next=${encodeURIComponent("/app")}`);
        setLoading(false);
        return;
      }

      const role = String(user.role).toLowerCase();
      if (role === "manager") {
        setRedirectTo("/app/manager/today");
      } else if (role === "employee" || role === "recruiter") {
        setRedirectTo("/app/employee/today");
      } else {
        setRedirectTo("/dashboard");
      }
      setLoading(false);
    })();

    return () => {
      alive = false;
    };
  }, [location.pathname, location.search, token]);

  if (loading) {
    return (
      <Box sx={{ minHeight: "60vh", display: "grid", placeItems: "center" }}>
        <Box sx={{ textAlign: "center" }}>
          <CircularProgress size={28} />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Opening app mode...
          </Typography>
        </Box>
      </Box>
    );
  }

  return redirectTo ? <Navigate to={redirectTo} replace /> : null;
}
