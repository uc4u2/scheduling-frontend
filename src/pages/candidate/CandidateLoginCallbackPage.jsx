import React, { useEffect, useState } from "react";
import { Alert, Box, CircularProgress, Container, Paper, Typography } from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import { candidatePortal } from "../../utils/candidatePortal";

export default function CandidateLoginCallbackPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      try {
        const data = await candidatePortal.exchangeToken(token);
        if (!mounted) return;
        localStorage.setItem("candidate_portal_token", data?.token || token);
        if (data?.expires_at) {
          localStorage.setItem("candidate_portal_token_expires_at", data.expires_at);
        }
        if (data?.candidate) {
          localStorage.setItem("candidate_portal_candidate", JSON.stringify(data.candidate));
        }
        navigate("/candidate/dashboard", { replace: true });
      } catch (e) {
        if (!mounted) return;
        setError(
          e?.response?.data?.error ||
            e?.displayMessage ||
            e?.message ||
            "Login link is invalid or expired."
        );
      }
    };
    run();
    return () => {
      mounted = false;
    };
  }, [navigate, token]);

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", py: { xs: 6, md: 8 } }}>
      <Container maxWidth="sm">
        <Paper variant="outlined" sx={{ p: 4, borderRadius: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 800 }}>
            Signing you in
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 1 }}>
            Please wait while we verify your link.
          </Typography>

          {error ? (
            <Alert severity="error" sx={{ mt: 3 }}>
              {error}
            </Alert>
          ) : (
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mt: 3 }}>
              <CircularProgress size={22} />
              <Typography color="text.secondary">Verifying magic link...</Typography>
            </Box>
          )}
        </Paper>
      </Container>
    </Box>
  );
}
