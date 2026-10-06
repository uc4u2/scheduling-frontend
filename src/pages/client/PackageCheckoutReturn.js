import React, { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Box, Button, CircularProgress, Paper, Stack, Typography } from "@mui/material";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import HourglassTopRoundedIcon from "@mui/icons-material/HourglassTopRounded";
import { useLocation, useParams } from "react-router-dom";

import api from "../../utils/api";
import { buildTenantDashboardPath, resolveTenantSlug, tenantParams } from "../../utils/clientTenant";
import { requestTransactionalNavigation } from "../../utils/transactionalFrameBridge";
import PublicClientAuth from "./PublicClientAuth";

export const PACKAGE_RETURN_POLL_INTERVAL_MS = 2000;
export const PACKAGE_RETURN_MAX_ATTEMPTS = 15;

export function packageReturnPath(search = "", pathname = "/packages/return") {
  const query = new URLSearchParams(search || "");
  const sessionId = String(query.get("session_id") || "").trim();
  if (!sessionId || !sessionId.startsWith("cs_") || /CHECKOUT_SESSION_ID/i.test(sessionId)) return "";
  const cleanPath = String(pathname || "").trim().replace(/\/$/, "");
  if (!/^\/(?:[^/?#]+\/)?packages\/return$/.test(cleanPath)) return "";
  return `${cleanPath}?${query.toString()}`;
}

export function packagesDashboardPath(slug = "") {
  return `${buildTenantDashboardPath(slug)}#packages`;
}

export function completePackageReturn({ windowRef, tenantSlug = "", embedded = false }) {
  windowRef.dispatchEvent(new Event("booking:changed"));
  if (embedded && windowRef.parent && windowRef.parent !== windowRef) {
    return requestTransactionalNavigation(windowRef.parent, "/my-bookings#packages");
  }
  windowRef.location.assign(packagesDashboardPath(tenantSlug));
  return true;
}

export default function PackageCheckoutReturn() {
  const location = useLocation();
  const { slug: routeSlug } = useParams();
  const tenantSlug = resolveTenantSlug({ routeSlug, search: location.search });
  const sessionId = useMemo(
    () => String(new URLSearchParams(location.search || "").get("session_id") || "").trim(),
    [location.search],
  );
  const returnTo = useMemo(
    () => packageReturnPath(location.search, location.pathname),
    [location.pathname, location.search],
  );
  const [state, setState] = useState("checking");
  const [message, setMessage] = useState("Confirming your package purchase…");
  const attempts = useRef(0);
  const timer = useRef(null);
  const token = typeof localStorage !== "undefined" ? localStorage.getItem("token") : "";
  const role = typeof localStorage !== "undefined" ? localStorage.getItem("role") : "";
  const signedIn = Boolean(token && role === "client");

  useEffect(() => () => {
    if (timer.current) window.clearTimeout(timer.current);
  }, []);

  useEffect(() => {
    if (!signedIn || !returnTo) return undefined;
    let cancelled = false;

    const verify = async () => {
      attempts.current += 1;
      try {
        const response = await api.get("/me/packages/checkout/status", {
          params: { ...tenantParams(tenantSlug), session_id: sessionId },
        });
        if (cancelled) return;
        if (response?.data?.state === "fulfilled") {
          setState("fulfilled");
          setMessage("Your package is ready.");
          const embedded = new URLSearchParams(location.search || "").get("embed") === "1";
          completePackageReturn({ windowRef: window, tenantSlug, embedded });
          return;
        }
        if (attempts.current >= PACKAGE_RETURN_MAX_ATTEMPTS) {
          setState("pending");
          setMessage("Payment has not been confirmed yet.");
          return;
        }
        setState("checking");
        setMessage("Payment received. Waiting for package confirmation…");
        timer.current = window.setTimeout(verify, PACKAGE_RETURN_POLL_INTERVAL_MS);
      } catch (error) {
        if (cancelled) return;
        const status = error?.response?.status;
        if (status === 400 || status === 404) {
          setState("invalid");
          setMessage("We could not verify this package checkout.");
          return;
        }
        if (attempts.current >= PACKAGE_RETURN_MAX_ATTEMPTS) {
          setState("pending");
          setMessage("Payment has not been confirmed yet.");
          return;
        }
        setState("checking");
        setMessage("Confirmation is taking longer than expected. We’ll keep checking…");
        timer.current = window.setTimeout(verify, PACKAGE_RETURN_POLL_INTERVAL_MS);
      }
    };

    verify();
    return () => {
      cancelled = true;
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [location.search, returnTo, sessionId, signedIn, tenantSlug]);

  if (!returnTo) {
    return <Alert severity="warning">This package return link is incomplete.</Alert>;
  }

  if (!signedIn) {
    return <PublicClientAuth slug={tenantSlug} returnTo={returnTo} />;
  }

  const fulfilled = state === "fulfilled";
  return (
    <Box sx={{ width: "100%", maxWidth: 720, mx: "auto", px: 2, py: { xs: 4, md: 8 } }}>
      <Paper variant="outlined" sx={{ p: { xs: 3, md: 5 }, borderRadius: 3, textAlign: "center" }}>
        <Stack spacing={2.5} alignItems="center">
          {fulfilled ? (
            <CheckCircleOutlineRoundedIcon color="success" sx={{ fontSize: 52 }} />
          ) : (
            <HourglassTopRoundedIcon color="primary" sx={{ fontSize: 48 }} />
          )}
          <Typography component="h1" variant="h4" sx={{ fontWeight: 750 }}>
            {fulfilled ? "Package confirmed" : state === "invalid" ? "Unable to verify checkout" : "Confirming your package"}
          </Typography>
          <Typography color="text.secondary">{message}</Typography>
          {state === "checking" ? <CircularProgress size={28} aria-label="Checking package status" /> : null}
          {state === "pending" || state === "invalid" ? (
            <Button variant="contained" onClick={() => window.location.reload()}>Check again</Button>
          ) : null}
        </Stack>
      </Paper>
    </Box>
  );
}
