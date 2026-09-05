import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams, Link as RouterLink } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import api from "../../../utils/api";

const AGREEMENT_TEXT = [
  "You are approving temporary support access only to the capabilities listed above.",
  "This access remains active only for the support session and may be ended at any time.",
  "Only authorized Schedulaa platform staff can start and use the support session.",
];

const SupportConsentPage = () => {
  const [searchParams] = useSearchParams();
  const token = useMemo(() => searchParams.get("token") || "", [searchParams]);
  const [checked, setChecked] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [details, setDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(Boolean(token));

  useEffect(() => {
    let active = true;
    if (!token) {
      setDetailsLoading(false);
      return undefined;
    }
    api.get("/api/support/sessions/approval-details", {
      params: { token },
      noAuth: true,
      noCompanyHeader: true,
    }).then(({ data }) => {
      if (active) setDetails(data || null);
    }).catch((err) => {
      if (!active) return;
      const code = err?.response?.data?.error;
      setError(code === "token_expired" ? "This approval link has expired." : "This approval link is invalid.");
    }).finally(() => {
      if (active) setDetailsLoading(false);
    });
    return () => {
      active = false;
    };
  }, [token]);

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
        { token, consent: true, consent_version: "v2-scoped" },
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

          {detailsLoading && <CircularProgress size={24} />}
          {details && (
            <Alert severity="info">
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                {details.scope_label}
              </Typography>
              <Typography variant="body2">{details.scope_description}</Typography>
              <Box component="ul" sx={{ mb: 0, pl: 2.5 }}>
                {(details.capabilities || []).map((capability) => (
                  <li key={capability}>
                    {capability.replace(/_/g, " ")}
                  </li>
                ))}
              </Box>
            </Alert>
          )}

          <Stack spacing={1.5} sx={{ mt: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Agreement (Support Access Consent)
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              By approving support access, you authorize Schedulaa support staff to temporarily
              access only the capabilities listed above for the purpose of resolving your request.
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
              disabled={submitting || success || detailsLoading || !details}
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
