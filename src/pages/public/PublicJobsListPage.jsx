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
  CircularProgress,
} from "@mui/material";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import SiteFrame from "../../components/website/SiteFrame";
import { publicSite } from "../../utils/api";
import { publicJobs } from "../../utils/publicJobs";
import CandidateLoginDialog from "../../components/candidate/CandidateLoginDialog";
import { pageStyleToBackgroundSx, pageStyleToCssVars } from "../client/ServiceList";
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

export function PublicJobsListContent({ effectiveSlug, jobsBasePath, pageStyleOverride }) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const embeddedPageParam = (searchParams.get("page") || "").toLowerCase();
  const isEmbeddedJobsPage = embeddedPageParam === "jobs";
  const pageParamKey = isEmbeddedJobsPage ? "pg" : "page";
  const resolvedJobsBasePath = jobsBasePath || `/public/${effectiveSlug}/jobs`;

  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState([]);
  const [error, setError] = useState("");
  const cssVarStyle = useMemo(() => {
    const vars = pageStyleToCssVars(pageStyleOverride);
    return Object.keys(vars).length ? vars : undefined;
  }, [pageStyleOverride]);
  const backgroundSx = useMemo(
    () => pageStyleToBackgroundSx(pageStyleOverride),
    [pageStyleOverride]
  );

  const parseList = (value) =>
    value ? value.split(",").map((item) => item.trim()).filter(Boolean) : [];

  const initialQ = searchParams.get("q") || "";
  const initialCountry = searchParams.get("country") || "";
  const initialRegion = searchParams.get("region") || "";
  const initialCity = searchParams.get("city") || "";
  const initialArrangements = parseList(searchParams.get("work_arrangement"));
  const initialEmployment = parseList(searchParams.get("employment_type"));
  const initialCategories = parseList(searchParams.get("job_category"));
  const initialPosted = searchParams.get("posted_within_days") || "";
  const initialSort = searchParams.get("sort") || "newest";
  const initialPage = Number(searchParams.get("page") || 1);

  const [q, setQ] = useState(initialQ);
  const [page, setPage] = useState(initialPage);
  const [pageSize] = useState(25);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [clearNoticeOpen, setClearNoticeOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [filters, setFilters] = useState({
    country: initialCountry,
    region: initialRegion,
    city: initialCity,
    workArrangements: initialArrangements,
    employmentTypes: initialEmployment,
    jobCategories: initialCategories,
    postedWithinDays: initialPosted,
    sort: initialSort,
  });

  const countryIsUS = filters.country === "US";
  const countryIsCA = filters.country === "CA";
  const countryOptions = useMemo(
    () => [{ code: "", label: "All countries" }, ...COUNTRIES],
    []
  );
  const regionOptions = useMemo(() => {
    if (countryIsUS) return US_STATES;
    if (countryIsCA) return CA_PROVINCES;
    return [];
  }, [countryIsUS, countryIsCA]);

  const toggleInList = (list, value) =>
    list.includes(value) ? list.filter((item) => item !== value) : [...list, value];

  const filterSummary = useMemo(() => {
    const countryLabel =
      countryOptions.find((opt) => opt.code === filters.country)?.label || filters.country;
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
  }, [filters, regionOptions, countryOptions]);
  const resultsSummary = useMemo(() => {
    const base = total ? `${total} jobs` : "No roles found";
    return filterSummary ? `${base} • Filters: ${filterSummary}` : base;
  }, [total, filterSummary]);

  const filterChips = useMemo(() => {
    const chips = [];
    if (q.trim()) chips.push({ key: "q", label: `Search: ${q.trim()}` });
    if (filters.country) {
      const label =
        countryOptions.find((opt) => opt.code === filters.country)?.label || filters.country;
      chips.push({ key: "country", label: `Country: ${label}` });
    }
    if (filters.region) {
      const label = regionOptions.find((opt) => opt.code === filters.region)?.label || filters.region;
      chips.push({ key: "region", label: `Region: ${label}` });
    }
    if (filters.city) chips.push({ key: "city", label: `City: ${filters.city}` });
    if (filters.workArrangements.length) {
      WORK_ARRANGEMENTS.forEach((opt) => {
        if (filters.workArrangements.includes(opt.value)) {
          chips.push({ key: `work_${opt.value}`, label: opt.label, type: "work", value: opt.value });
        }
      });
    }
    if (filters.employmentTypes.length) {
      EMPLOYMENT_TYPES.forEach((opt) => {
        if (filters.employmentTypes.includes(opt.value)) {
          chips.push({ key: `employment_${opt.value}`, label: opt.label, type: "employment", value: opt.value });
        }
      });
    }
    if (filters.jobCategories.length) {
      filters.jobCategories.forEach((cat) => {
        chips.push({ key: `category_${cat}`, label: cat, type: "category", value: cat });
      });
    }
    if (filters.postedWithinDays) {
      chips.push({
        key: "posted",
        label: filters.postedWithinDays === "7" ? "Posted: last 7 days" : "Posted: last 30 days",
      });
    }
    return chips;
  }, [filters, q, regionOptions, countryOptions]);

  const handleRemoveChip = (chip) => {
    if (chip.key === "q") {
      setQ("");
      setPage(1);
      return;
    }
    if (chip.key === "country") {
      setFilters((prev) => ({
        ...prev,
        country: "",
        region: "",
      }));
      setPage(1);
      return;
    }
    if (chip.key === "region") {
      setFilters((prev) => ({ ...prev, region: "" }));
      setPage(1);
      return;
    }
    if (chip.key === "city") {
      setFilters((prev) => ({ ...prev, city: "" }));
      setPage(1);
      return;
    }
    if (chip.key === "posted") {
      setFilters((prev) => ({ ...prev, postedWithinDays: "" }));
      setPage(1);
      return;
    }
    if (chip.type === "work") {
      setFilters((prev) => ({
        ...prev,
        workArrangements: prev.workArrangements.filter((item) => item !== chip.value),
      }));
      setPage(1);
      return;
    }
    if (chip.type === "employment") {
      setFilters((prev) => ({
        ...prev,
        employmentTypes: prev.employmentTypes.filter((item) => item !== chip.value),
      }));
      setPage(1);
      return;
    }
    if (chip.type === "category") {
      setFilters((prev) => ({
        ...prev,
        jobCategories: prev.jobCategories.filter((item) => item !== chip.value),
      }));
      setPage(1);
    }
  };

  const handleClearFilters = () => {
    setFilters({
      country: "",
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
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (filters.country) params.set("country", filters.country);
    if (filters.region) params.set("region", filters.region);
    if (filters.city) params.set("city", filters.city);
    if (filters.workArrangements.length) {
      params.set("work_arrangement", filters.workArrangements.join(","));
    }
    if (filters.employmentTypes.length) {
      params.set("employment_type", filters.employmentTypes.join(","));
    }
    if (filters.jobCategories.length) {
      params.set("job_category", filters.jobCategories.join(","));
    }
    if (filters.postedWithinDays) {
      params.set("posted_within_days", filters.postedWithinDays);
    }
    if (filters.sort) params.set("sort", filters.sort);
    if (isEmbeddedJobsPage) {
      params.set("page", "jobs");
    }
    if (page > 1) params.set(pageParamKey, String(page));
    setSearchParams(params, { replace: true });
  }, [filters, page, q, setSearchParams, isEmbeddedJobsPage, pageParamKey]);

  useEffect(() => {
    const nextQ = searchParams.get("q") || "";
    const nextCountry = searchParams.get("country") || "";
    const nextRegion = searchParams.get("region") || "";
    const nextCity = searchParams.get("city") || "";
    const nextArrangements = parseList(searchParams.get("work_arrangement"));
    const nextEmployment = parseList(searchParams.get("employment_type"));
    const nextCategories = parseList(searchParams.get("job_category"));
    const nextPosted = searchParams.get("posted_within_days") || "";
    const nextSort = searchParams.get("sort") || "newest";
    const nextPage = Number(searchParams.get(pageParamKey) || 1);

    setQ(nextQ);
    setPage(Number.isFinite(nextPage) && nextPage > 0 ? nextPage : 1);
    setFilters((prev) => ({
      ...prev,
      country: nextCountry,
      region: nextRegion,
      city: nextCity,
      workArrangements: nextArrangements,
      employmentTypes: nextEmployment,
      jobCategories: nextCategories,
      postedWithinDays: nextPosted,
      sort: nextSort,
    }));
  }, [searchParams, pageParamKey]);

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await publicJobs.list(effectiveSlug, {
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
  }, [effectiveSlug, q, filters, page, pageSize]);

  return (
    <Box
      style={cssVarStyle}
      sx={{
        minHeight: "100vh",
        bgcolor: "background.default",
        py: { xs: 4, md: 6 },
        ...backgroundSx,
      }}
    >
      <Container maxWidth="lg">
          <Paper
            elevation={0}
            sx={{
              p: { xs: 3, md: 4 },
              borderRadius: "var(--page-card-radius, 12px)",
              border: "1px solid",
              borderColor: "divider",
              mb: 3,
              bgcolor: "var(--page-card-bg, background.paper)",
              boxShadow: "var(--page-card-shadow, none)",
              backdropFilter: "blur(var(--page-card-blur, 0px))",
            }}
          >
            <Stack spacing={1.25}>
              {isEmbeddedJobsPage && (
                <Button
                  variant="text"
                  size="small"
                  onClick={() => navigate(`/${effectiveSlug}`)}
                  sx={{ alignSelf: "flex-start" }}
                >
                  ← Back to website
                </Button>
              )}
              <Typography variant="overline" color="text.secondary">
                Careers
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800 }}>
              {isEmbeddedJobsPage ? `Careers at ${effectiveSlug}` : `${effectiveSlug} - Open positions`}
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
          <Grid item xs={12} md={3} sx={{ alignSelf: "flex-start" }}>
            <Paper
              variant="outlined"
              sx={{
                p: 2.5,
                borderRadius: 2,
                position: { md: "sticky" },
                top: { md: 24 },
              }}
            >
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
                  {countryOptions.map((opt) => (
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
                  {resultsSummary}
                </Typography>
              </Stack>
              {filterChips.length > 0 && (
                <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" alignItems="center">
                  {filterChips.map((chip) => (
                    <Chip
                      key={chip.key}
                      label={chip.label}
                      size="small"
                      onDelete={() => handleRemoveChip(chip)}
                    />
                  ))}
                  <Chip
                    label="Clear all"
                    size="small"
                    variant="outlined"
                    onClick={handleClearFilters}
                  />
                </Stack>
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
                    <JobCard
                      job={job}
                      onView={() => {
                        if (isEmbeddedJobsPage) {
                          navigate(`/${effectiveSlug}?page=jobs&job=${job.slug}`);
                          return;
                        }
                        navigate(`${resolvedJobsBasePath}/${job.slug}`);
                      }}
                    />
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
        companySlug={effectiveSlug}
      />
    </Box>
  );
}

export function JobsListEmbedded({ slug, pageStyle }) {
  const basePath = `/${slug}/jobs`;
  return (
    <PublicJobsListContent
      effectiveSlug={slug}
      jobsBasePath={basePath}
      pageStyleOverride={pageStyle}
    />
  );
}

export default function PublicJobsListPage() {
  const { companySlug, slug } = useParams();
  const effectiveSlug = companySlug || slug;
  const jobsBasePath = companySlug
    ? `/public/${effectiveSlug}/jobs`
    : `/${effectiveSlug}/jobs`;
  const [sitePayload, setSitePayload] = useState(null);
  const [siteLoading, setSiteLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    if (!effectiveSlug) return () => {};
    setSiteLoading(true);
    publicSite
      .getBySlug(effectiveSlug)
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
      <PublicJobsListContent
        effectiveSlug={effectiveSlug}
        jobsBasePath={jobsBasePath}
      />
    </SiteFrame>
  );
}
