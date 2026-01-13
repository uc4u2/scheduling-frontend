import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Box, CircularProgress, Typography, Alert, Button } from "@mui/material";
import { api } from "../../utils/api";
import { getTenantHostMode } from "../../utils/tenant";

const getParams = (search) => {
  const qs = new URLSearchParams(search || "");
  const appt = qs.get("appt") || qs.get("appointment_id") || "";
  const token = qs.get("token") || qs.get("t") || "";
  return { appt: appt.trim(), token: token.trim() };
};

const createGateway = (mode) => {
  const destinationSegment = mode === "cancel" ? "appointment-cancel" : "appointment-reschedule";
  const friendlyLabel = mode === "cancel" ? "cancel" : "reschedule";

  const Gateway = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [{ status, message, slug }, setState] = useState({ status: "loading", message: "", slug: "" });

    useEffect(() => {
      const { appt, token } = getParams(location.search);
      if (!appt || !token) {
        setState({ status: "error", message: "Missing appointment details in the link.", slug: "" });
        return;
      }

      let active = true;
      setState({ status: "loading", message: "", slug: "" });

      (async () => {
        try {
          const { data } = await api.get("/public/postservice/verify", {
            params: { appointment_id: appt, token, action: friendlyLabel },
            noCompanyHeader: true,
          });

          const nextSlug = data?.slug || "";
          const ok = data?.ok;
          if (nextSlug && ok) {
            const isCustomDomain = getTenantHostMode() === "custom";
            const basePath = isCustomDomain ? "" : `/${nextSlug}`;
            const target = `${basePath}/${destinationSegment}/${encodeURIComponent(appt)}?token=${encodeURIComponent(token)}`;
            navigate(target, { replace: true });
            return;
          }

          const detail =
            data?.error ||
            (ok === false
              ? "This booking link is no longer valid."
              : "Unable to load booking details.");
          if (active) {
            setState({ status: "error", message: detail, slug: nextSlug });
          }
        } catch (err) {
          const msg =
            err?.displayMessage ||
            err?.response?.data?.error ||
            err?.message ||
            "Unable to load booking details.";
          if (active) {
            setState({ status: "error", message: msg, slug: "" });
          }
        }
      })();

      return () => {
        active = false;
      };
    }, [destinationSegment, friendlyLabel, location.search, navigate]);

    if (status === "loading") {
      return (
        <Box p={3} textAlign="center">
          <CircularProgress />
          <Typography sx={{ mt: 2 }}>Checking your booking link...</Typography>
        </Box>
      );
    }

    return (
      <Box p={3} maxWidth="520px" mx="auto">
        <Alert severity="error" sx={{ mb: 2 }}>{message}</Alert>
        <Typography sx={{ mb: 2 }}>
          Please double-check the link or contact the business so they can send a fresh {friendlyLabel} link.
        </Typography>
        <Box display="flex" gap={2}>
          <Button variant="contained" onClick={() => navigate("/")}>
            Go to homepage
          </Button>
          {slug ? (
            <Button
              variant="outlined"
              onClick={() => navigate(getTenantHostMode() === "custom" ? "/" : `/${slug}`)}
            >
              Visit site
            </Button>
          ) : null}
        </Box>
      </Box>
    );
  };

  return Gateway;
};

export const ClientRescheduleGateway = createGateway("reschedule");
export const ClientCancelGateway = createGateway("cancel");

export default ClientRescheduleGateway;
