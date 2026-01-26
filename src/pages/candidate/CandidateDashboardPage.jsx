import React, { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  Divider,
  Paper,
  Stack,
  Typography,
  CircularProgress,
} from "@mui/material";
import { candidatePortal } from "../../utils/candidatePortal";
import SiteFrame from "../../components/website/SiteFrame";
import { publicSite } from "../../utils/api";

const statusChipColor = (status) => {
  const value = String(status || "").toLowerCase();
  if (value === "submitted" || value === "completed" || value === "closed") return "success";
  if (value === "pending" || value === "invited") return "warning";
  if (value === "rejected") return "error";
  return "default";
};

export default function CandidateDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);
  const [notice, setNotice] = useState("");

  const token = localStorage.getItem("candidate_portal_token");

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError("");
      try {
        const resp = await candidatePortal.getDashboard(token);
        if (mounted) setData(resp);
      } catch (e) {
        if (mounted) {
          setError(
            e?.response?.data?.error ||
              e?.displayMessage ||
              e?.message ||
              "Failed to load dashboard."
          );
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    run();
    return () => {
      mounted = false;
    };
  }, [token]);

  const handleLogout = () => {
    localStorage.removeItem("candidate_portal_token");
    localStorage.removeItem("candidate_portal_token_expires_at");
    localStorage.removeItem("candidate_portal_candidate");
    setData(null);
  };

  const handleResendLink = async () => {
    setNotice("");
    if (!data?.company?.slug || !data?.candidate?.email) {
      setNotice("Unable to resend link yet.");
      return;
    }
    try {
      await candidatePortal.requestMagicLink(data.company.slug, data.candidate.email);
      setNotice("Login link sent. Check your email.");
    } catch (e) {
      setNotice(
        e?.response?.data?.error ||
          e?.displayMessage ||
          e?.message ||
          "Failed to resend link."
      );
    }
  };

  const content = !token ? (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", py: { xs: 6, md: 8 } }}>
      <Container maxWidth="sm">
        <Paper variant="outlined" sx={{ p: 4, borderRadius: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 800 }}>
            Candidate portal
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 1 }}>
            Use the magic link we emailed you to access your dashboard.
          </Typography>
        </Paper>
      </Container>
    </Box>
  ) : (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", py: { xs: 6, md: 8 } }}>
      <Container maxWidth="md">
        <Stack spacing={3}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "center" }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h4" sx={{ fontWeight: 900 }}>
                Your applications
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                Track your status and manage document requests.
              </Typography>
            </Box>
            <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent="flex-end">
              {data?.company?.slug && (
                <Button variant="outlined" href={`/public/${data.company.slug}/jobs`}>
                  Return to jobs
                </Button>
              )}
              <Button variant="outlined" onClick={handleResendLink}>
                Resend link
              </Button>
              <Button variant="outlined" onClick={handleLogout}>
                Log out
              </Button>
            </Stack>
          </Stack>

          {notice && <Alert severity="info">{notice}</Alert>}
          {error && <Alert severity="error">{error}</Alert>}

          {loading ? (
            <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
              <Typography color="text.secondary">Loading dashboard...</Typography>
            </Paper>
          ) : (
            <>
              <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
                <Stack spacing={1}>
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>
                    Profile
                  </Typography>
                  <Typography>{data?.candidate?.name}</Typography>
                  <Typography color="text.secondary">{data?.candidate?.email}</Typography>
                  {data?.candidate?.phone && (
                    <Typography color="text.secondary">{data?.candidate?.phone}</Typography>
                  )}
                  {data?.candidate?.resume_filename && (
                    <Typography color="text.secondary">
                      Resume: {data.candidate.resume_filename} ({data.candidate.resume_scan_status || "pending"})
                    </Typography>
                  )}
                </Stack>
              </Paper>

              <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
                  Applications
                </Typography>
                <Stack spacing={2}>
                  {data?.applications?.length ? (
                    data.applications.map((app) => (
                      <Box key={app.application_id}>
                        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ sm: "center" }}>
                          <Box sx={{ flex: 1 }}>
                            <Typography sx={{ fontWeight: 700 }}>{app.job_title}</Typography>
                            <Typography color="text.secondary" variant="body2">
                              Applied {app.applied_at ? new Date(app.applied_at).toLocaleDateString() : ""}
                            </Typography>
                          </Box>
                          <Chip size="small" label={app.stage || "Applied"} color={statusChipColor(app.stage)} />
                          {app.company_slug && app.job_slug && (
                            <Button
                              variant="text"
                              href={`/public/${app.company_slug}/jobs/${app.job_slug}`}
                              target="_blank"
                              rel="noreferrer"
                            >
                              View job
                            </Button>
                          )}
                        </Stack>
                        <Divider sx={{ mt: 2 }} />
                      </Box>
                    ))
                  ) : (
                    <Stack spacing={1}>
                      <Typography color="text.secondary">No applications yet.</Typography>
                      {data?.company?.slug && (
                        <Button variant="outlined" href={`/public/${data.company.slug}/jobs`}>
                          Return to jobs
                        </Button>
                      )}
                    </Stack>
                  )}
                </Stack>
              </Paper>

              <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
                  Document requests
                </Typography>
                <Stack spacing={2}>
                  {data?.document_requests?.length ? (
                    data.document_requests.map((req) => (
                      <Box key={req.id}>
                        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ sm: "center" }}>
                          <Box sx={{ flex: 1 }}>
                            <Typography sx={{ fontWeight: 700 }}>
                              {req.subject || "Document request"}
                            </Typography>
                            {req.message && (
                              <Typography color="text.secondary" variant="body2">
                                {req.message}
                              </Typography>
                            )}
                          </Box>
                          <Chip size="small" label={req.status || "pending"} color={statusChipColor(req.status)} />
                          {req.upload_url && (
                            <Button
                              variant="outlined"
                              href={req.upload_url}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Upload
                            </Button>
                          )}
                        </Stack>
                        <Divider sx={{ mt: 2 }} />
                      </Box>
                    ))
                  ) : (
                    <Typography color="text.secondary">No document requests.</Typography>
                  )}
                </Stack>
              </Paper>
            </>
          )}
        </Stack>
      </Container>
    </Box>
  );

  const companySlug =
    data?.company?.slug ||
    (() => {
      try {
        return localStorage.getItem("site") || "";
      } catch {
        return "";
      }
    })();

  const [sitePayload, setSitePayload] = useState(null);
  const [siteLoading, setSiteLoading] = useState(false);
  useEffect(() => {
    let mounted = true;
    if (!companySlug) return () => {};
    setSiteLoading(true);
    publicSite
      .getWebsiteShell(companySlug)
      .then((payload) => {
        if (mounted) setSitePayload(payload || null);
      })
      .catch(() => {
        if (mounted) setSitePayload(null);
      })
      .finally(() => {
        if (mounted) setSiteLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [companySlug]);
  if (!companySlug) {
    return content;
  }

  if (siteLoading && !sitePayload) {
    return (
      <Box sx={{ py: 8, textAlign: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <SiteFrame
      slug={companySlug}
      initialSite={sitePayload || undefined}
      disableFetch={Boolean(sitePayload)}
      wrapChildrenInContainer={false}
    >
      {content}
    </SiteFrame>
  );
}
