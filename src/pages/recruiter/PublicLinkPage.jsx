import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { Box, Button, CircularProgress, Stack, TextField, Typography, Alert } from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { api } from "../../utils/api";
import ManagementFrame from "../../components/ui/ManagementFrame";
import RecruiterTabs from "../../components/recruiter/RecruiterTabs";
import useRecruiterTabsAccess from "../../components/recruiter/useRecruiterTabsAccess";

export default function RecruiterPublicLinkPage({ token }) {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [slug, setSlug] = useState("");
  const [rid, setRid] = useState("");
  const [publicToken, setPublicToken] = useState("");
  const [allowed, setAllowed] = useState(false);
  const { allowHrAccess, isLoading } = useRecruiterTabsAccess();

  useEffect(() => {
    const fetchMe = async () => {
      try {
        setLoading(true);
        setErr("");
        // First try auth/me (works for logged-in recruiter)
        const { data: me } = await api.get("/auth/me", { noCompanyHeader: true });

        const recruiterId =
          me?.id ||
          me?.recruiter_id ||
          me?.profile?.id ||
          me?.profile?.recruiter_id ||
          null;

        let companySlug =
          me?.company?.slug ||
          me?.profile?.company?.slug ||
          me?.company_slug ||
          "";

        // If slug missing, try company/me
        if (!companySlug) {
          try {
            const { data: cmp } = await api.get("/api/company/me", { noCompanyHeader: true });
            companySlug = cmp?.slug || companySlug;
          } catch {}
        }

        if (!recruiterId || !companySlug) {
          throw new Error("Missing recruiter or company slug");
        }

        const allow = Boolean(me?.allow_public_booking);
        let pubToken = me?.public_meet_token || "";

        // If token missing, fetch detail profile
        if (!pubToken && recruiterId) {
          try {
            const { data: rec } = await api.get(`/api/recruiters/${recruiterId}`);
            pubToken = rec?.public_meet_token || "";
          } catch {
            /* ignore */
          }
        }

        setSlug(companySlug);
        setRid(recruiterId);
        setAllowed(allow);
        setPublicToken(pubToken);
      } catch (e) {
        setErr("Failed to load your profile.");
      } finally {
        setLoading(false);
      }
    };
    fetchMe();
  }, []);

  const origin =
    (typeof window !== "undefined" && window.location.origin) ||
    (process.env.REACT_APP_FRONTEND_URL || "").replace(/\/$/, "") ||
    "http://localhost:3000";
  const link = slug && (publicToken || rid) ? `${origin}/${slug}/meet/${publicToken || rid}` : "";

  const regenerate = async () => {
    if (!rid) return;
    try {
      setErr("");
      setLoading(true);
      const { data } = await api.post(`/api/recruiters/${rid}/public-link/rotate`);
      setPublicToken(data?.public_meet_token || "");
    } catch {
      setErr("Failed to generate a new link.");
    } finally {
      setLoading(false);
    }
  };

  if (!isLoading && !allowHrAccess) {
    return <Navigate to="/employee?tab=calendar" replace />;
  }

  return (
    <ManagementFrame
      title="Public Booking Link"
      subtitle="Copy your shareable meeting link."
      fullWidth
      sx={{ minHeight: "100vh", px: { xs: 1, md: 2 } }}
      contentSx={{ p: { xs: 1.5, md: 2.5 } }}
    >
      <RecruiterTabs localTab="public-link" allowHrAccess={allowHrAccess} isLoading={isLoading} />
      {loading ? (
        <Box sx={{ py: 4, textAlign: "center" }}>
          <CircularProgress />
        </Box>
      ) : err ? (
        <Alert severity="error">{err}</Alert>
      ) : !allowed ? (
        <Alert severity="warning">
          Your manager has disabled public bookings for your profile.
        </Alert>
      ) : (
        <Stack spacing={2} sx={{ maxWidth: 640 }}>
          <Typography variant="body1">
            Share this link on LinkedIn, email signatures, or anywhere else to let clients book a meeting with you directly.
          </Typography>
          <TextField fullWidth size="small" value={link || "Unavailable"} InputProps={{ readOnly: true }} />
          <Button
            variant="contained"
            startIcon={<ContentCopyIcon />}
            disabled={!link}
            onClick={() => link && navigator.clipboard.writeText(link)}
          >
            Copy link
          </Button>
          <Button variant="outlined" onClick={regenerate} disabled={!rid || loading}>
            Generate new link
          </Button>
        </Stack>
      )}
    </ManagementFrame>
  );
}
