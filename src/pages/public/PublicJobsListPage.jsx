// src/pages/public/PublicJobsListPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
  Container,
  Divider,
  Grid,
  Paper,
  Skeleton,
  Stack,
  TextField,
  Typography,
  Alert,
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

const JobCard = ({ job, onView }) => {
  const pay = formatPay(job);
  const subtitle =
    job?.summary ||
    (job?.description
      ? `${String(job.description).slice(0, 140)}${job.description.length > 140 ? "..." : ""}`
      : "");

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2.5,
        borderRadius: 2,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        gap: 1.25,
      }}
    >
      <Stack direction="row" spacing={1} alignItems="flex-start" justifyContent="space-between">
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }} noWrap>
            {job?.title || "Untitled"}
          </Typography>
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mt: 0.75 }}>
            {job?.location && <Chip size="small" label={job.location} />}
            {job?.location_type && <Chip size="small" label={job.location_type} />}
            {job?.employment_type && <Chip size="small" label={job.employment_type} />}
            {job?.seniority && <Chip size="small" label={job.seniority} />}
            {pay && <Chip size="small" label={pay} />}
          </Stack>
        </Box>

        <Button onClick={onView} variant="contained" size="small" sx={{ whiteSpace: "nowrap" }}>
          View job
        </Button>
      </Stack>

      {subtitle && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {subtitle}
        </Typography>
      )}

      <Box sx={{ flex: 1 }} />

      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="caption" color="text.secondary">
          {job?.published_at ? `Published ${new Date(job.published_at).toLocaleDateString()}` : ""}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {job?.apply_deadline ? `Deadline ${new Date(job.apply_deadline).toLocaleDateString()}` : ""}
        </Typography>
      </Stack>
    </Paper>
  );
};

export default function PublicJobsListPage() {
  const { companySlug } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState([]);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await publicJobs.list(companySlug);
        const results = Array.isArray(data?.results) ? data.results : [];
        if (mounted) setJobs(results);
      } catch (e) {
        const msg = e?.response?.data?.error || e?.displayMessage || e?.message || "Failed to load jobs.";
        if (mounted) setError(msg);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    run();
    return () => {
      mounted = false;
    };
  }, [companySlug]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return jobs;
    return (jobs || []).filter((j) => {
      const hay = `${j?.title || ""} ${j?.slug || ""} ${j?.summary || ""} ${j?.description || ""}`.toLowerCase();
      return hay.includes(term);
    });
  }, [jobs, q]);

  return (
    <PublicPageShell slugOverride={companySlug} activeKey="jobs">
      <Box sx={{ minHeight: "100vh", bgcolor: "background.default", py: { xs: 4, md: 6 } }}>
        <Container maxWidth="lg">
          <Paper
            elevation={0}
            sx={{
              p: { xs: 3, md: 4 },
              borderRadius: 3,
              border: "1px solid",
              borderColor: "divider",
              mb: 3,
            }}
          >
            <Stack spacing={1.25}>
              <Typography variant="overline" color="text.secondary">
                Careers
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800 }}>
                {companySlug} - Open positions
              </Typography>
              <Typography color="text.secondary">
                Browse open roles and apply in minutes. No booking needed for applications.
              </Typography>

              <Divider sx={{ my: 1 }} />

              <TextField
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search roles by title, keyword, or slug..."
                fullWidth
                size="small"
              />
            </Stack>
          </Paper>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {loading ? (
            <Grid container spacing={2}>
              {Array.from({ length: 6 }).map((_, idx) => (
                <Grid item xs={12} md={6} key={idx}>
                  <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
                    <Skeleton variant="text" height={36} />
                    <Skeleton variant="text" />
                    <Skeleton variant="text" width="80%" />
                    <Skeleton variant="rectangular" height={36} sx={{ mt: 2, borderRadius: 1 }} />
                  </Paper>
                </Grid>
              ))}
            </Grid>
          ) : filtered.length === 0 ? (
            <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                No published jobs right now
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                Check back soon.
              </Typography>
            </Paper>
          ) : (
            <Grid container spacing={2}>
              {filtered.map((job) => (
                <Grid item xs={12} md={6} key={job.id || job.slug}>
                  <JobCard
                    job={job}
                    onView={() => navigate(`/public/${companySlug}/jobs/${job.slug}`)}
                  />
                </Grid>
              ))}
            </Grid>
          )}

          <Box sx={{ mt: 4, textAlign: "center" }}>
            <Typography variant="caption" color="text.secondary">
              Powered by Schedulaa Hiring
            </Typography>
          </Box>
        </Container>
      </Box>
    </PublicPageShell>
  );
}
