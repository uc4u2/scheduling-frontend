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
  Checkbox,
  FormControlLabel,
  Pagination,
  MenuItem,
  Snackbar,
} from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import PublicPageShell from "../client/PublicPageShell";
import { publicJobs } from "../../utils/publicJobs";
import CandidateLoginDialog from "../../components/candidate/CandidateLoginDialog";
import {
  CA_PROVINCES,
  COUNTRIES,
  EMPLOYMENT_TYPES,
  JOB_CATEGORIES,
  US_STATES,
  WORK_ARRANGEMENTS,
} from "../../constants/jobMetadata";

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

const JobCard = ({ job, onView }) => {
  const pay = formatPay(job);
  const locationLabel = formatLocation(job);
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
            {locationLabel && <Chip size="small" label={locationLabel} />}
            {(job?.work_arrangement || job?.location_type) && (
              <Chip size="small" label={job?.work_arrangement || job?.location_type} />
            )}
            {job?.employment_type && <Chip size="small" label={job.employment_type} />}
            {job?.job_category && <Chip size="small" label={job.job_category} />}
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
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [clearNoticeOpen, setClearNoticeOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [filters, setFilters] = useState({
    country: "CA",
    region: "",
    city: "",
    workArrangements: [],
    employmentTypes: [],
    jobCategories: [],
    postedWithinDays: "",
    sort: "newest",
  });

  const countryIsUS = filters.country === "US";
  const countryIsCA = filters.country === "CA";
  const regionOptions = useMemo(() => {
    if (countryIsUS) return US_STATES;
    if (countryIsCA) return CA_PROVINCES;
    return [];
  }, [countryIsUS, countryIsCA]);

  const toggleInList = (list, value) =>
    list.includes(value) ? list.filter((item) => item !== value) : [...list, value];

  const filterSummary = useMemo(() => {
    const countryLabel =
      COUNTRIES.find((opt) => opt.code === filters.country)?.label || filters.country;
    const regionLabel =
      regionOptions.find((opt) => opt.code === filters.region)?.label || filters.region;
    const arrangementLabels = WORK_ARRANGEMENTS.filter((opt) =>
      filters.workArrangements.includes(opt.value)
    ).map((opt) => opt.label);
    const employmentLabels = EMPLOYMENT_TYPES.filter((opt) =>
      filters.employmentTypes.includes(opt.value)
    ).map((opt) => opt.label);
    const categoryLabels = filters.jobCategories;
    const postedLabel =
      filters.postedWithinDays === "7"
        ? "Posted: last 7 days"
        : filters.postedWithinDays === "30"
        ? "Posted: last 30 days"
        : "";

    return [
      `Country: ${countryLabel || "Any"}`,
      regionLabel ? `Region: ${regionLabel}` : "",
      filters.city ? `City: ${filters.city}` : "",
      arrangementLabels.length ? `Arrangement: ${arrangementLabels.join(", ")}` : "",
      employmentLabels.length ? `Employment: ${employmentLabels.join(", ")}` : "",
      categoryLabels.length ? `Category: ${categoryLabels.join(", ")}` : "",
      postedLabel,
    ]
      .filter(Boolean)
      .join(" · ");
  }, [filters, regionOptions]);

  const handleClearFilters = () => {
    setFilters({
      country: "CA",
      region: "",
      city: "",
      workArrangements: [],
      employmentTypes: [],
      jobCategories: [],
      postedWithinDays: "",
      sort: "newest",
    });
    setQ("");
    setPage(1);
    setClearNoticeOpen(true);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await publicJobs.list(companySlug, {
          q: q.trim() || undefined,
          country: filters.country || undefined,
          region: filters.region || undefined,
          city: filters.city || undefined,
          work_arrangement: filters.workArrangements.length
            ? filters.workArrangements.join(",")
            : undefined,
          employment_type: filters.employmentTypes.length
            ? filters.employmentTypes.join(",")
            : undefined,
          job_category: filters.jobCategories.length
            ? filters.jobCategories.join(",")
            : undefined,
          posted_within_days: filters.postedWithinDays || undefined,
          sort: filters.sort || "newest",
          page,
          page_size: pageSize,
        });
        const results = Array.isArray(data?.results) ? data.results : [];
        if (mounted) setJobs(results);
        if (mounted) {
          setTotal(Number(data?.total || 0));
          setTotalPages(Number(data?.total_pages || 0));
        }
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
  }, [companySlug, q, filters, page, pageSize]);

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

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ sm: "center" }}>
              <TextField
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setPage(1);
                }}
                placeholder="Search roles by title, keyword, or slug..."
                fullWidth
                size="small"
              />
              <Button variant="outlined" onClick={() => setLoginOpen(true)} sx={{ whiteSpace: "nowrap" }}>
                Candidate login
              </Button>
            </Stack>

            <Typography variant="caption" color="text.secondary">
              Already applied? Use candidate login to view your status.
            </Typography>
          </Stack>
        </Paper>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

        <Grid container spacing={2}>
          <Grid item xs={12} md={3}>
            <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
              <Stack spacing={2}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  Filters
                </Typography>

                <TextField
                  select
                  label="Country"
                  value={filters.country}
                  onChange={(e) => {
                    setFilters((prev) => ({
                      ...prev,
                      country: e.target.value,
                      region: "",
                    }));
                    setPage(1);
                  }}
                  size="small"
                  fullWidth
                >
                  {COUNTRIES.map((opt) => (
                    <MenuItem key={opt.code} value={opt.code}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  select
                  label={countryIsUS ? "State" : "Province/Territory"}
                  value={filters.region}
                  onChange={(e) => {
                    setFilters((prev) => ({ ...prev, region: e.target.value }));
                    setPage(1);
                  }}
                  size="small"
                  fullWidth
                  disabled={!regionOptions.length}
                >
                  {regionOptions.map((opt) => (
                    <MenuItem key={opt.code} value={opt.code}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  label="City"
                  value={filters.city}
                  onChange={(e) => {
                    setFilters((prev) => ({ ...prev, city: e.target.value }));
                    setPage(1);
                  }}
                  size="small"
                  fullWidth
                />

                <Divider />

                <Stack spacing={1}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Work arrangement
                  </Typography>
                  {WORK_ARRANGEMENTS.map((opt) => (
                    <FormControlLabel
                      key={opt.value}
                      control={
                        <Checkbox
                          size="small"
                          checked={filters.workArrangements.includes(opt.value)}
                          onChange={() => {
                            setFilters((prev) => ({
                              ...prev,
                              workArrangements: toggleInList(prev.workArrangements, opt.value),
                            }));
                            setPage(1);
                          }}
                        />
                      }
                      label={opt.label}
                    />
                  ))}
                </Stack>

                <Stack spacing={1}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Employment type
                  </Typography>
                  {EMPLOYMENT_TYPES.map((opt) => (
                    <FormControlLabel
                      key={opt.value}
                      control={
                        <Checkbox
                          size="small"
                          checked={filters.employmentTypes.includes(opt.value)}
                          onChange={() => {
                            setFilters((prev) => ({
                              ...prev,
                              employmentTypes: toggleInList(prev.employmentTypes, opt.value),
                            }));
                            setPage(1);
                          }}
                        />
                      }
                      label={opt.label}
                    />
                  ))}
                </Stack>

                <Stack spacing={1}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Category
                  </Typography>
                  {JOB_CATEGORIES.map((opt) => (
                    <FormControlLabel
                      key={opt}
                      control={
                        <Checkbox
                          size="small"
                          checked={filters.jobCategories.includes(opt)}
                          onChange={() => {
                            setFilters((prev) => ({
                              ...prev,
                              jobCategories: toggleInList(prev.jobCategories, opt),
                            }));
                            setPage(1);
                          }}
                        />
                      }
                      label={opt}
                    />
                  ))}
                </Stack>

                <Divider />

                <TextField
                  select
                  label="Posted within"
                  value={filters.postedWithinDays}
                  onChange={(e) => {
                    setFilters((prev) => ({ ...prev, postedWithinDays: e.target.value }));
                    setPage(1);
                  }}
                  size="small"
                  fullWidth
                >
                  <MenuItem value="">Any time</MenuItem>
                  <MenuItem value="7">Last 7 days</MenuItem>
                  <MenuItem value="30">Last 30 days</MenuItem>
                </TextField>

                <TextField
                  select
                  label="Sort"
                  value={filters.sort}
                  onChange={(e) => {
                    setFilters((prev) => ({ ...prev, sort: e.target.value }));
                    setPage(1);
                  }}
                  size="small"
                  fullWidth
                >
                  <MenuItem value="newest">Newest</MenuItem>
                </TextField>

                <Button variant="outlined" onClick={handleClearFilters}>
                  Clear filters
                </Button>
              </Stack>
            </Paper>
          </Grid>

          <Grid item xs={12} md={9}>
            <Stack spacing={2}>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1}
                justifyContent="space-between"
                alignItems={{ sm: "center" }}
              >
                <Typography variant="caption" color="text.secondary">
                  {total ? `${total} roles found` : "No roles found"}
                </Typography>
                {filterSummary && (
                  <Typography variant="caption" color="text.secondary">
                    {filterSummary}
                  </Typography>
                )}
              </Stack>

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
              ) : jobs.length === 0 ? (
                <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    No published jobs right now
                  </Typography>
                  <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                    Try adjusting filters or check back soon.
                  </Typography>
                  <Button variant="outlined" sx={{ mt: 2 }} onClick={handleClearFilters}>
                    Clear filters
                  </Button>
                </Paper>
              ) : (
                <Grid container spacing={2}>
                  {jobs.map((job) => (
                    <Grid item xs={12} md={6} key={job.id || job.slug}>
                      <JobCard job={job} onView={() => navigate(`/public/${companySlug}/jobs/${job.slug}`)} />
                    </Grid>
                  ))}
                </Grid>
              )}

              {totalPages > 1 && (
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={(_, value) => setPage(value)}
                  size="small"
                  shape="rounded"
                />
              )}
            </Stack>
          </Grid>
        </Grid>

        <Box sx={{ mt: 4, textAlign: "center" }}>
          <Typography variant="caption" color="text.secondary">
            Powered by Schedulaa Hiring
          </Typography>
        </Box>
        </Container>
      </Box>
      <Snackbar
        open={clearNoticeOpen}
        autoHideDuration={2500}
        onClose={() => setClearNoticeOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="info" onClose={() => setClearNoticeOpen(false)}>
          Filters cleared.
        </Alert>
      </Snackbar>
      <CandidateLoginDialog
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
        companySlug={companySlug}
      />
    </PublicPageShell>
  );
}
