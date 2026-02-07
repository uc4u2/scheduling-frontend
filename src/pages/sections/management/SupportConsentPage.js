import React, { useMemo, useState } from "react";
import { useSearchParams, Link as RouterLink } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import api from "../../../utils/api";

const AGREEMENT_TEXT = [
  "You are approving temporary support access to edit your website and/or domain settings.",
  "This access is time-limited and may be ended at any time.",
  "Only Schedulaa support staff assigned to this ticket can use the access.",
];

const SupportConsentPage = () => {
  const [searchParams] = useSearchParams();
  const token = useMemo(() => searchParams.get("token") || "", [searchParams]);
  const [checked, setChecked] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleApprove = async () => {
    if (!checked) {
      setError("Please check the box to continue.");
      return;
    }
    if (!token) {
      setError("Invalid or missing token.");
      return;
    }
    try {
      setSubmitting(true);
      setError("");
      await api.post(
        "/api/support/sessions/approve-by-token",
        { token, consent: true, consent_version: "v1" },
        { noAuth: true, noCompanyHeader: true }
      );
      setSuccess(true);
    } catch (err) {
      const msg = err?.response?.data?.error || "Unable to approve.";
      if (msg === "token_expired") {
        setError("This approval link has expired.");
      } else if (msg === "invalid_token") {
        setError("This approval link is invalid.");
      } else if (msg === "consent_required") {
        setError("Please check the box to continue.");
      } else {
        setError("Unable to approve. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ display: "flex", justifyContent: "center", py: { xs: 6, md: 10 }, px: 2 }}>
      <Paper sx={{ maxWidth: 720, width: "100%", p: { xs: 3, md: 4 } }}>
        <Stack spacing={2}>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Support Access Approval
          </Typography>
          <Typography variant="body1" sx={{ color: "text.secondary" }}>
            Please review and approve the support access request.
          </Typography>

          <Stack spacing={1.5} sx={{ mt: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Agreement (Support Access Consent)
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              By approving support access, you authorize Schedulaa support staff to temporarily
              access your website and/or domain settings for the purpose of resolving your request.
            </Typography>
            {AGREEMENT_TEXT.map((line) => (
              <Typography key={line} variant="body2" sx={{ color: "text.secondary" }}>
                • {line}
              </Typography>
            ))}
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              View the standalone agreement{" "}
              <RouterLink to="/legal/support-access-consent">here</RouterLink>.
            </Typography>
          </Stack>

          <FormControlLabel
            control={<Checkbox checked={checked} onChange={(e) => setChecked(e.target.checked)} />}
            label="I agree and approve temporary support access."
          />

          {error && <Alert severity="error">{error}</Alert>}
          {success && (
            <Alert severity="success">
              Approved. You can close this page.
              <Box sx={{ mt: 1 }}>
                <Button component={RouterLink} to="/manager/tickets" size="small">
                  Open tickets
                </Button>
              </Box>
            </Alert>
          )}

          <Box sx={{ display: "flex", gap: 2 }}>
            <Button
              variant="contained"
              onClick={handleApprove}
              disabled={submitting || success}
            >
              {submitting ? "Approving..." : "Approve access"}
            </Button>
          </Box>
        </Stack>
      </Paper>
    </Box>
  );
};

export default SupportConsentPage;
