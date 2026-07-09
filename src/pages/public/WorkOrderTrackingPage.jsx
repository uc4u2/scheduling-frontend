import React, { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import OpenInNewOutlinedIcon from "@mui/icons-material/OpenInNewOutlined";
import { useParams } from "react-router-dom";
import { getPublicWorkOrderTracking } from "../finance/financeApi";

const statusLabel = (status) => {
  switch (String(status || "").toLowerCase()) {
    case "on_my_way":
      return "On the way";
    case "arrived":
      return "Arrived";
    default:
      return "Not started";
  }
};

export default function WorkOrderTrackingPage() {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tracking, setTracking] = useState(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!token) return;
      setLoading(true);
      setError("");
      try {
        const res = await getPublicWorkOrderTracking(token);
        if (!mounted) return;
        setTracking(res?.tracking || null);
      } catch (err) {
        if (!mounted) return;
        setError(err?.response?.data?.error || err?.message || "Unable to load tracking.");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [token]);

  const mapEmbedUrl = tracking?.location?.lat != null && tracking?.location?.lng != null
    ? `https://www.google.com/maps?q=${tracking.location.lat},${tracking.location.lng}&z=14&output=embed`
    : "";

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f7f4ef", py: { xs: 4, md: 6 } }}>
      <Container maxWidth="md">
        <Paper elevation={0} sx={{ p: { xs: 3, md: 4 }, borderRadius: 3, border: "1px solid", borderColor: "divider" }}>
          {loading ? (
            <Stack alignItems="center" sx={{ py: 8 }} spacing={1.5}>
              <CircularProgress size={26} />
              <Typography color="text.secondary">Loading trip status...</Typography>
            </Stack>
          ) : error ? (
            <Alert severity="error">{error}</Alert>
          ) : !tracking ? (
            <Alert severity="warning">Tracking is not available for this trip.</Alert>
          ) : (
            <Stack spacing={3}>
              <Box>
                <Typography variant="overline" color="text.secondary">
                  {tracking.company_name || "Schedulaa"}
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800 }}>
                  {statusLabel(tracking.status)}
                </Typography>
                <Typography color="text.secondary" sx={{ mt: 1 }}>
                  {[tracking.employee_name, tracking.work_order_number, tracking.work_order_title].filter(Boolean).join(" • ")}
                </Typography>
              </Box>

              <Alert severity={tracking.status === "arrived" ? "success" : "info"}>
                {tracking.status === "arrived"
                  ? `${tracking.employee_name || "Your technician"} has arrived.`
                  : `${tracking.employee_name || "Your technician"} is on the way.`}
              </Alert>

              <Stack spacing={0.75}>
                <Typography variant="body2" color="text.secondary">
                  Destination: {tracking.destination || "Not provided"}
                </Typography>
                {tracking.updated_at ? (
                  <Typography variant="body2" color="text.secondary">
                    Last updated: {new Date(tracking.updated_at).toLocaleString()}
                  </Typography>
                ) : null}
              </Stack>

              {mapEmbedUrl ? (
                <Box sx={{ borderRadius: 2, overflow: "hidden", border: "1px solid", borderColor: "divider" }}>
                  <Box
                    component="iframe"
                    title="Trip tracking map"
                    src={mapEmbedUrl}
                    sx={{ width: "100%", height: { xs: 300, md: 420 }, border: 0 }}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </Box>
              ) : (
                <Alert severity="info">Live location has not been shared yet.</Alert>
              )}

              {tracking.location?.map_url ? (
                <Button
                  variant="outlined"
                  component="a"
                  href={tracking.location.map_url}
                  target="_blank"
                  rel="noreferrer"
                  startIcon={<OpenInNewOutlinedIcon />}
                  sx={{ alignSelf: "flex-start" }}
                >
                  Open in Google Maps
                </Button>
              ) : null}
            </Stack>
          )}
        </Paper>
      </Container>
    </Box>
  );
}
