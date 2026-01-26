// src/pages/public/PublicJobDetailPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  Divider,
  Grid,
  Paper,
  Stack,
  TextField,
  Typography,
  Skeleton,
  CircularProgress,
  Checkbox,
  FormControlLabel,
  Link,
} from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import SiteFrame from "../../components/website/SiteFrame";
import { publicSite } from "../../utils/api";
import { publicJobs } from "../../utils/publicJobs";
import CandidateLoginDialog from "../../components/candidate/CandidateLoginDialog";
import { pageStyleToBackgroundSx, pageStyleToCssVars } from "../client/ServiceList";
import { getTenantHostMode } from "../../utils/tenant";

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

const formatLocation = (job) => {
  const city = job?.city || "";
  const region = job?.region || "";
  const country = job?.country || "";
  if (city || region) {
    const parts = [];
    if (city) parts.push(city);
    if (region) parts.push(region);
    if (country && country !== "CA") parts.push(country);
    return parts.join(", ");
  }
  return job?.location || "";
};

const Section = ({ title, children }) => {
  const content = typeof children === "string" ? children.trim() : children;
  if (!content) return null;
  return (
    <Box>
      <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
        {title}
      </Typography>
      <Typography color="text.secondary" sx={{ whiteSpace: "pre-wrap" }}>
        {content}
      </Typography>
    </Box>
  );
};

export function PublicJobDetailContent({
  effectiveSlug,
  jobSlug,
  jobsBasePath,
  pageStyleOverride,
}) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [job, setJob] = useState(null);
  const [error, setError] = useState("");

  const [applyName, setApplyName] = useState("");
  const [applyEmail, setApplyEmail] = useState("");
  const [applyPhone, setApplyPhone] = useState("");
  const [applyConsent, setApplyConsent] = useState(false);
  const [applyWebsite, setApplyWebsite] = useState("");
  const [challenge, setChallenge] = useState({ a: 3, b: 7 });
  const [challengeAnswer, setChallengeAnswer] = useState("");
  const [applying, setApplying] = useState(false);
  const [applyError, setApplyError] = useState("");
  const [loginOpen, setLoginOpen] = useState(false);

  const pay = useMemo(() => formatPay(job), [job]);
  const locationLabel = useMemo(() => formatLocation(job), [job]);

  const cssVarStyle = useMemo(() => {
    const vars = pageStyleToCssVars(pageStyleOverride);
    return Object.keys(vars).length ? vars : undefined;
  }, [pageStyleOverride]);
  const backgroundSx = useMemo(
    () => pageStyleToBackgroundSx(pageStyleOverride),
    [pageStyleOverride]
  );

  const refreshChallenge = () => {
    const a = Math.floor(Math.random() * 9) + 1;
    const b = Math.floor(Math.random() * 9) + 1;
    setChallenge({ a, b });
    setChallengeAnswer("");
  };

  useEffect(() => {
    refreshChallenge();
  }, []);

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await publicJobs.detail(effectiveSlug, jobSlug);
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
  }, [effectiveSlug, jobSlug]);

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
    if (!applyConsent) {
      setApplyError("You must accept the privacy policy to continue.");
      return;
    }
    if (challengeAnswer === "") {
      setApplyError("Please solve the quick math check.");
      return;
    }

    setApplying(true);
    try {
      const resp = await publicJobs.apply(effectiveSlug, jobSlug, {
        name,
        email,
        phone,
        source: "public_jobs",
        consent: true,
        consent_version: "2025-12-24",
        website: applyWebsite,
        challenge_a: challenge.a,
        challenge_b: challenge.b,
        challenge_answer: challengeAnswer,
      });

      const intakeUrl = resp?.intake_url;
      if (!intakeUrl) {
        setApplyError("Apply succeeded but no intake URL was returned.");
        return;
      }
      window.location.href = intakeUrl;
      refreshChallenge();
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
    <Box
      style={cssVarStyle}
      sx={{ minHeight: "100vh", bgcolor: "background.default", py: { xs: 4, md: 6 }, ...backgroundSx }}
    >
      <Container maxWidth="md">
        <Button variant="text" onClick={() => navigate(jobsBasePath)} sx={{ mb: 2 }}>
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
                  {effectiveSlug} / Careers
                </Typography>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ sm: "center" }}>
                  <Typography variant="h4" sx={{ fontWeight: 900, flex: 1 }}>
                    {job.title}
                  </Typography>
                  <Button variant="outlined" onClick={() => setLoginOpen(true)}>
                    Candidate login
                  </Button>
                </Stack>

                <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                  {locationLabel && <Chip size="small" label={locationLabel} />}
                  {(job.work_arrangement || job.location_type) && (
                    <Chip size="small" label={job.work_arrangement || job.location_type} />
                  )}
                  {job.employment_type && <Chip size="small" label={job.employment_type} />}
                  {job.job_category && <Chip size="small" label={job.job_category} />}
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
                <Typography variant="caption" color="text.secondary">
                  Already applied? Use candidate login to view your status.
                </Typography>
              </Stack>
            </Paper>

            <GridLike>
              <Paper variant="outlined" sx={{ p: { xs: 3, md: 4 }, borderRadius: 3 }}>
                <Stack spacing={3}>
                  <Section title="Description">{job.description}</Section>
                  <Section title="Responsibilities">{job.responsibilities}</Section>
                  <Section title="Requirements">{job.requirements}</Section>
                  <Section title="Role-specific details">{job.role_details}</Section>
                  <Section title="Key requirements">{job.key_requirements}</Section>
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
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={applyConsent}
                        onChange={(e) => setApplyConsent(e.target.checked)}
                      />
                    }
                    label={
                      <Typography variant="body2">
                        I agree to the{" "}
                        <Link href="/privacy" target="_blank" rel="noreferrer">
                          Privacy Policy
                        </Link>
                        .
                      </Typography>
                    }
                  />
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label={`Security check: ${challenge.a} + ${challenge.b} = ?`}
                        required
                        fullWidth
                        value={challengeAnswer}
                        onChange={(e) => setChallengeAnswer(e.target.value)}
                        helperText="Helps us prevent bots from applying."
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} sx={{ display: "none" }}>
                      <TextField
                        label="Leave blank"
                        value={applyWebsite}
                        onChange={(e) => setApplyWebsite(e.target.value)}
                        autoComplete="off"
                        fullWidth
                      />
                    </Grid>
                  </Grid>

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
      <CandidateLoginDialog
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
        companySlug={effectiveSlug}
      />
    </Box>
  );
}

export function JobsDetailEmbedded({ slug, jobSlug, pageStyle }) {
  const isCustomDomain = getTenantHostMode() === "custom";
  const jobsBasePath = isCustomDomain ? "/jobs" : `/${slug}?page=jobs`;
  return (
    <PublicJobDetailContent
      effectiveSlug={slug}
      jobSlug={jobSlug}
      jobsBasePath={jobsBasePath}
      pageStyleOverride={pageStyle}
    />
  );
}

export default function PublicJobDetailPage({ slugOverride }) {
  const { companySlug, slug, jobSlug } = useParams();
  const effectiveSlug = slugOverride || companySlug || slug;
  const isCustomDomain = getTenantHostMode() === "custom";
  const jobsBasePath = isCustomDomain
    ? "/jobs"
    : companySlug
    ? `/public/${effectiveSlug}/jobs`
    : `/${effectiveSlug}/jobs`;
  const [sitePayload, setSitePayload] = useState(null);
  const [siteLoading, setSiteLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    if (!effectiveSlug) return () => {};
    setSiteLoading(true);
    publicSite
      .getWebsiteShell(effectiveSlug)
      .then((data) => {
        if (mounted) setSitePayload(data || null);
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
  }, [effectiveSlug]);

  if (siteLoading && !sitePayload) {
    return (
      <Box sx={{ py: 8, textAlign: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <SiteFrame
      slug={effectiveSlug}
      activeKey="jobs"
      initialSite={sitePayload || undefined}
      disableFetch={Boolean(sitePayload)}
      wrapChildrenInContainer={false}
    >
      <PublicJobDetailContent
        effectiveSlug={effectiveSlug}
        jobSlug={jobSlug}
        jobsBasePath={jobsBasePath}
      />
    </SiteFrame>
  );
}

function GridLike({ children }) {
  return <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>{children}</Box>;
}
