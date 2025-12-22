// src/pages/public/PublicJobDetailPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  Divider,
  Paper,
  Stack,
  TextField,
  Typography,
  Skeleton,
} from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import PublicPageShell from "../client/PublicPageShell";
import { publicJobs } from "../../utils/publicJobs";

const formatPay = (job) => {
  const cur = job?.pay_currency || "";
  const min = job?.pay_min;
  const max = job?.pay_max;
  if (min == null && max == null) return null;
  const fmt = (v) => (v == null ? "" : `${cur ? `${cur} ` : ""}${Number(v).toLocaleString()}`);
  if (min != null && max != null) return `${fmt(min)} - ${fmt(max)}`;
  if (min != null) return `From ${fmt(min)}`;
  return `Up to ${fmt(max)}`;
};

const Section = ({ title, children }) => {
  if (!children) return null;
  return (
    <Box>
      <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
        {title}
      </Typography>
      <Typography color="text.secondary" sx={{ whiteSpace: "pre-wrap" }}>
        {children}
      </Typography>
    </Box>
  );
};

export default function PublicJobDetailPage() {
  const { companySlug, jobSlug } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [job, setJob] = useState(null);
  const [error, setError] = useState("");

  const [applyName, setApplyName] = useState("");
  const [applyEmail, setApplyEmail] = useState("");
  const [applyPhone, setApplyPhone] = useState("");
  const [applying, setApplying] = useState(false);
  const [applyError, setApplyError] = useState("");

  const pay = useMemo(() => formatPay(job), [job]);

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await publicJobs.detail(companySlug, jobSlug);
        if (mounted) setJob(data || null);
      } catch (e) {
        const msg = e?.response?.data?.error || e?.displayMessage || e?.message || "Failed to load job.";
        if (mounted) setError(msg);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    run();
    return () => {
      mounted = false;
    };
  }, [companySlug, jobSlug]);

  const handleApply = async () => {
    setApplyError("");
    const name = applyName.trim();
    const email = applyEmail.trim();
    const phone = applyPhone.trim();

    if (!email) {
      setApplyError("Email is required.");
      return;
    }
    if (!name) {
      setApplyError("Name is required.");
      return;
    }

    setApplying(true);
    try {
      const resp = await publicJobs.apply(companySlug, jobSlug, {
        name,
        email,
        phone,
        source: "public_jobs",
      });

      const intakeUrl = resp?.intake_url;
      if (!intakeUrl) {
        setApplyError("Apply succeeded but no intake URL was returned.");
        return;
      }
      window.location.href = intakeUrl;
    } catch (e) {
      const msg =
        e?.response?.data?.error ||
        e?.response?.data?.message ||
        e?.displayMessage ||
        e?.message ||
        "Apply failed.";
      setApplyError(msg);
    } finally {
      setApplying(false);
    }
  };

  return (
    <PublicPageShell slugOverride={companySlug} activeKey="jobs">
      <Box sx={{ minHeight: "100vh", bgcolor: "background.default", py: { xs: 4, md: 6 } }}>
        <Container maxWidth="md">
          <Button variant="text" onClick={() => navigate(`/public/${companySlug}/jobs`)} sx={{ mb: 2 }}>
            {"<- Back to jobs"}
          </Button>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {loading ? (
            <Paper variant="outlined" sx={{ p: { xs: 3, md: 4 }, borderRadius: 3 }}>
              <Skeleton variant="text" height={44} />
              <Skeleton variant="text" width="70%" />
              <Skeleton variant="rectangular" height={140} sx={{ mt: 2, borderRadius: 2 }} />
            </Paper>
          ) : !job ? (
            <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Job not found
              </Typography>
            </Paper>
          ) : (
            <>
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 3, md: 4 },
                  borderRadius: 3,
                  border: "1px solid",
                  borderColor: "divider",
                  mb: 2,
                }}
              >
                <Stack spacing={1.25}>
                  <Typography variant="overline" color="text.secondary">
                    {companySlug} / Careers
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 900 }}>
                    {job.title}
                  </Typography>

                  <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                    {job.location && <Chip size="small" label={job.location} />}
                    {job.location_type && <Chip size="small" label={job.location_type} />}
                    {job.employment_type && <Chip size="small" label={job.employment_type} />}
                    {job.seniority && <Chip size="small" label={job.seniority} />}
                    {pay && <Chip size="small" label={pay} />}
                  </Stack>

                  <Typography color="text.secondary">
                    {job.summary || "Apply below and you will be redirected to the secure application form."}
                  </Typography>

                  {(job.apply_deadline || job.published_at) && (
                    <Typography variant="caption" color="text.secondary">
                      {job.published_at ? `Published ${new Date(job.published_at).toLocaleDateString()}` : ""}
                      {job.published_at && job.apply_deadline ? " | " : ""}
                      {job.apply_deadline ? `Apply by ${new Date(job.apply_deadline).toLocaleDateString()}` : ""}
                    </Typography>
                  )}
                </Stack>
              </Paper>

              <GridLike>
                <Paper variant="outlined" sx={{ p: { xs: 3, md: 4 }, borderRadius: 3 }}>
                  <Stack spacing={3}>
                    <Section title="Description">{job.description}</Section>
                    <Section title="Responsibilities">{job.responsibilities}</Section>
                    <Section title="Requirements">{job.requirements}</Section>
                    <Section title="Benefits">{job.benefits}</Section>

                    {job.recruiter?.name && (
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
                          Recruiter
                        </Typography>
                        <Typography color="text.secondary">
                          {job.recruiter.name}
                          {job.recruiter.email ? ` | ${job.recruiter.email}` : ""}
                        </Typography>
                      </Box>
                    )}
                  </Stack>
                </Paper>

                <Paper
                  variant="outlined"
                  sx={{
                    p: { xs: 3, md: 4 },
                    borderRadius: 3,
                    mt: 2,
                  }}
                >
                  <Stack spacing={2}>
                    <Typography variant="h6" sx={{ fontWeight: 900 }}>
                      Apply now
                    </Typography>
                    <Typography color="text.secondary">
                      This starts a secure application and will redirect you to the form.
                    </Typography>

                    {applyError && <Alert severity="error">{applyError}</Alert>}

                    <TextField
                      label="Full name"
                      value={applyName}
                      onChange={(e) => setApplyName(e.target.value)}
                      fullWidth
                    />
                    <TextField
                      label="Email"
                      type="email"
                      value={applyEmail}
                      onChange={(e) => setApplyEmail(e.target.value)}
                      fullWidth
                    />
                    <TextField
                      label="Phone (optional)"
                      value={applyPhone}
                      onChange={(e) => setApplyPhone(e.target.value)}
                      fullWidth
                    />

                    <Divider />

                    <Button variant="contained" size="large" disabled={applying} onClick={handleApply}>
                      {applying ? "Starting application..." : "Continue to application"}
                    </Button>

                    <Typography variant="caption" color="text.secondary">
                      Powered by Schedulaa Hiring
                    </Typography>
                  </Stack>
                </Paper>
              </GridLike>
            </>
          )}
        </Container>
      </Box>
    </PublicPageShell>
  );
}

function GridLike({ children }) {
  return <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>{children}</Box>;
}
