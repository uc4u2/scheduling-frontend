import { useMemo, useState } from "react";
import { Alert, Box, Button, CircularProgress, Container, Link, Paper, Stack, Typography } from "@mui/material";
import { useParams } from "react-router-dom";

const BACKEND_UNSUBSCRIBE_BASE = "https://scheduling-application.onrender.com/public/email-sdr/unsubscribe";

export default function EmailSdrUnsubscribeRedirectPage() {
  const { token } = useParams();
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const trimmed = useMemo(() => String(token || "").trim(), [token]);
  const destination = trimmed
    ? `${BACKEND_UNSUBSCRIBE_BASE}/${encodeURIComponent(trimmed)}`
    : BACKEND_UNSUBSCRIBE_BASE;

  const handleConfirm = async () => {
    if (!trimmed || status === "submitting") return;
    setStatus("submitting");
    try {
      const response = await fetch(destination, { method: "POST", mode: "cors" });
      if (!response.ok) {
        throw new Error("unsubscribe_request_failed");
      }
      setStatus("confirmed");
      setMessage("If this address is in our Email SDR system, future outreach will stop.");
    } catch (error) {
      setStatus("error");
      setMessage("We could not process the unsubscribe request right now. Please try again.");
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", background: "#FFF7F1", py: { xs: 6, md: 10 } }}>
      <Container maxWidth="sm">
        <Paper elevation={0} sx={{ border: "1px solid #F4C7AF", borderRadius: 4, overflow: "hidden" }}>
          <Box sx={{ height: 8, bgcolor: "#F26A2E" }} />
          <Stack spacing={3} sx={{ p: { xs: 3, md: 4 } }}>
            <Box>
              <Typography sx={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#F26A2E", mb: 2 }}>
                Schedulaa
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 800, fontSize: { xs: 30, md: 40 }, lineHeight: 1.05, mb: 1.5 }}>
                {status === "confirmed" ? "Request received" : "Confirm unsubscribe"}
              </Typography>
              <Typography sx={{ color: "#4B5563", fontSize: 16, lineHeight: 1.7 }}>
                {status === "confirmed"
                  ? message || "If this address is in our Email SDR system, future outreach will stop."
                  : "Click confirm only if you want to stop future Schedulaa Email SDR outreach to this address."}
              </Typography>
            </Box>

            {status === "error" ? <Alert severity="error">{message}</Alert> : null}

            {status !== "confirmed" ? (
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                <Button
                  variant="contained"
                  onClick={handleConfirm}
                  disabled={!trimmed || status === "submitting"}
                  sx={{
                    bgcolor: "#F26A2E",
                    "&:hover": { bgcolor: "#D95A1E" },
                    borderRadius: 999,
                    px: 3,
                    py: 1.4,
                    fontWeight: 700,
                    boxShadow: "none",
                  }}
                >
                  {status === "submitting" ? <CircularProgress size={20} sx={{ color: "#fff" }} /> : "Confirm unsubscribe"}
                </Button>
                <Button variant="text" href="https://www.schedulaa.com" sx={{ color: "#D95A1E", fontWeight: 700 }}>
                  Keep exploring Schedulaa
                </Button>
              </Stack>
            ) : null}

            <Box sx={{ pt: 3, borderTop: "1px solid #F4C7AF" }}>
              <Typography sx={{ color: "#6B7280", fontSize: 13, lineHeight: 1.7, mb: 1.25 }}>
                Stay connected:
              </Typography>
              <Typography sx={{ color: "#6B7280", fontSize: 13, lineHeight: 1.8 }}>
                <Link href="https://www.schedulaa.com" underline="none" sx={{ color: "#D95A1E", fontWeight: 700 }}>
                  Website
                </Link>
                {" • "}
                <Link href="https://www.instagram.com/schedulaa.app/" underline="none" sx={{ color: "#D95A1E", fontWeight: 700 }}>
                  Instagram
                </Link>
                {" • "}
                <Link href="https://www.facebook.com/people/Schedulaa/61574468475666/" underline="none" sx={{ color: "#D95A1E", fontWeight: 700 }}>
                  Facebook
                </Link>
                {" • "}
                <Link href="https://www.linkedin.com/company/schedulaa/" underline="none" sx={{ color: "#D95A1E", fontWeight: 700 }}>
                  LinkedIn
                </Link>
              </Typography>
            </Box>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}
