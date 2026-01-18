import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Box, Typography, Stack, Button, Alert } from "@mui/material";
import api from "../../utils/api";

const KioskSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = useMemo(() => searchParams.get("token") || "", [searchParams]);
  const [status, setStatus] = useState("pending");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setError("Missing payment token.");
      return;
    }
    let alive = true;
    let attempts = 0;
    const poll = async () => {
      try {
        const { data } = await api.get("/api/kiosk/status", {
          params: { token },
          noAuth: true,
          noCompanyHeader: true,
        });
        if (!alive) return;
        if (data?.paid) {
          setStatus("paid");
          return;
        }
      } catch (err) {
        if (!alive) return;
        setError(err?.response?.data?.error || "Unable to confirm payment yet.");
      }
      attempts += 1;
      if (attempts >= 15) {
        setStatus("timeout");
        return;
      }
    };

    poll();
    const interval = setInterval(poll, 2000);
    return () => {
      alive = false;
      clearInterval(interval);
    };
  }, [token]);

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", px: 3, py: 6 }}>
      <Box sx={{ maxWidth: 520, mx: "auto" }}>
        <Stack spacing={3} textAlign="center">
          {status === "paid" && (
            <>
              <Typography variant="h5" fontWeight={700}>
                Payment complete
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Thank you! You can close this screen.
              </Typography>
            </>
          )}
          {status === "pending" && (
            <>
              <Typography variant="h6" fontWeight={700}>
                Processing payment…
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Please wait while we confirm your payment.
              </Typography>
            </>
          )}
          {status === "timeout" && (
            <Alert severity="warning">
              Payment is still processing. It will appear in the manager dashboard shortly.
            </Alert>
          )}
          {status === "error" && (
            <Alert severity="error">{error}</Alert>
          )}

          <Button
            variant="outlined"
            onClick={() => navigate("/manager/dashboard?view=booking-checkout")}
          >
            Return to manager
          </Button>
        </Stack>
      </Box>
    </Box>
  );
};

export default KioskSuccessPage;
