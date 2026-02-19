import React, { useEffect, useMemo, useState } from "react";
import { Alert, Box, Button, CircularProgress, Stack, Typography } from "@mui/material";
import { useLocation } from "react-router-dom";
import api from "../utils/api";
import { getSessionUser } from "../utils/authRedirect";

const VALID_PLANS = new Set(["starter", "pro", "business"]);

const fallbackByRole = (role) => {
  if (role === "manager") return "/manager/dashboard";
  if (role === "employee") return "/employee/my-time";
  if (role === "client") return "/dashboard";
  return "/manager/dashboard";
};

const UpgradeBridgePage = () => {
  const location = useLocation();
  const [state, setState] = useState({ loading: true, error: "" });

  const query = useMemo(() => new URLSearchParams(location.search || ""), [location.search]);
  const plan = String(query.get("plan") || "").toLowerCase();
  const interval = String(query.get("interval") || "").toLowerCase();
  const returnTo = String(query.get("returnTo") || "").trim();

  useEffect(() => {
    let active = true;

    const run = async () => {
      const token = localStorage.getItem("token");
      const loginParams = new URLSearchParams();
      loginParams.set("tab", "billing");
      if (plan) loginParams.set("plan", plan);
      if (interval) loginParams.set("interval", interval);
      if (returnTo) loginParams.set("returnTo", returnTo);

      if (!token) {
        window.location.replace(`/login?${loginParams.toString()}`);
        return;
      }

      const user = await getSessionUser();
      if (!active) return;

      if (!user) {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        window.location.replace(`/login?${loginParams.toString()}`);
        return;
      }

      if (user.role !== "manager") {
        window.location.replace(fallbackByRole(user.role));
        return;
      }

      if (!VALID_PLANS.has(plan)) {
        if (!active) return;
        setState({
          loading: false,
          error: "Invalid or missing plan. Please select a plan from the pricing page.",
        });
        return;
      }

      try {
        const res = await api.post("/billing/checkout", { plan_key: plan });
        const url = res?.data?.url;
        if (!url) throw new Error("Checkout URL missing.");
        window.location.href = url;
      } catch (error) {
        if (!active) return;
        setState({
          loading: false,
          error:
            error?.displayMessage ||
            error?.response?.data?.error ||
            error?.message ||
            "Unable to start checkout.",
        });
      }
    };

    run();
    return () => {
      active = false;
    };
  }, [interval, plan, returnTo]);

  if (state.loading) {
    return (
      <Box sx={{ minHeight: "60vh", display: "grid", placeItems: "center", px: 2 }}>
        <Stack spacing={1.5} alignItems="center">
          <CircularProgress size={24} />
          <Typography variant="body2" color="text.secondary">
            Redirecting to secure checkout...
          </Typography>
        </Stack>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "60vh", display: "grid", placeItems: "center", px: 2 }}>
      <Stack spacing={2} sx={{ width: "100%", maxWidth: 560 }}>
        <Alert severity="error">{state.error}</Alert>
        <Button
          variant="contained"
          onClick={() => {
            window.location.href = "/manager/settings?tab=billing";
          }}
        >
          Open Billing Settings
        </Button>
      </Stack>
    </Box>
  );
};

export default UpgradeBridgePage;
