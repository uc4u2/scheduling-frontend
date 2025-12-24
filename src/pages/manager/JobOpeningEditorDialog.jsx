// src/pages/manager/JobOpeningEditorDialog.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  MenuItem,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
  Alert,
} from "@mui/material";
import {
  CA_PROVINCES,
  COUNTRIES,
  EMPLOYMENT_TYPES,
  JOB_CATEGORIES,
  PAY_PERIODS,
  US_STATES,
  WORK_ARRANGEMENTS,
} from "../../constants/jobMetadata";

const TAB = {
  BASICS: 0,
  DESCRIPTION: 1,
  COMP: 2,
  APPLY: 3,
  SEO: 4,
};

const safe = (v) => (v == null ? "" : v);

export default function JobOpeningEditorDialog({ open, job, onClose, onSave, saving }) {
  const isEdit = Boolean(job?.id);
  const [tab, setTab] = useState(TAB.BASICS);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    title: "",
    slug: "",
    summary: "",
    description: "",
    responsibilities: "",
    requirements: "",
    benefits: "",
    role_details: "",
    key_requirements: "",
    ai_must_have_skills: "",
    ai_nice_to_have_skills: "",
    ai_notes: "",
    location: "",
    country: "CA",
    region: "",
    city: "",
    postal_code: "",
    work_arrangement: "",
    location_type: "",
    employment_type: "",
    job_category: "",
    seniority: "",
    pay_min: "",
    pay_max: "",
    pay_currency: "",
    pay_period: "",
    department: "",
    show_recruiter: false,
    apply_form_id: "",
    apply_deadline: "",
    seo_title: "",
    seo_description: "",
    og_image: "",
  });

  useEffect(() => {
    if (!open) return;
    setTab(TAB.BASICS);
    setError("");
    setForm({
      title: safe(job?.title),
      slug: safe(job?.slug),
      summary: safe(job?.summary),
      description: safe(job?.description),
      responsibilities: safe(job?.responsibilities),
      requirements: safe(job?.requirements),
      benefits: safe(job?.benefits),
      role_details: safe(job?.role_details),
      key_requirements: safe(job?.key_requirements),
      ai_must_have_skills: safe(job?.ai_must_have_skills),
      ai_nice_to_have_skills: safe(job?.ai_nice_to_have_skills),
      ai_notes: safe(job?.ai_notes),
      location: safe(job?.location),
      country: safe(job?.country) || "CA",
      region: safe(job?.region),
      city: safe(job?.city),
      postal_code: safe(job?.postal_code),
      work_arrangement: safe(job?.work_arrangement) || safe(job?.location_type),
      location_type: safe(job?.location_type),
      employment_type: safe(job?.employment_type),
      job_category: safe(job?.job_category),
      seniority: safe(job?.seniority),
      pay_min: job?.pay_min ?? "",
      pay_max: job?.pay_max ?? "",
      pay_currency: safe(job?.pay_currency),
      pay_period: safe(job?.pay_period),
      department: safe(job?.department),
      show_recruiter: Boolean(job?.show_recruiter),
      apply_form_id: job?.apply_form_id ?? "",
      apply_deadline: safe(job?.apply_deadline),
      seo_title: safe(job?.seo_title),
      seo_description: safe(job?.seo_description),
      og_image: safe(job?.og_image),
    });
  }, [open, job]);

  const titleOk = form.title.trim().length > 0;
  const descOk = form.description.trim().length > 0;
  const employmentOk = form.employment_type.trim().length > 0;
  const arrangementOk = form.work_arrangement.trim().length > 0;

  const countryIsCA = form.country === "CA";
  const countryIsUS = form.country === "US";
  const regionRequired = countryIsCA || countryIsUS;
  const regionOk = !regionRequired || form.region.trim().length > 0;
  const regionOptions = countryIsUS ? US_STATES : countryIsCA ? CA_PROVINCES : [];

  const payErr = useMemo(() => {
    if (form.pay_min === "" || form.pay_max === "") return null;
    const min = Number(form.pay_min);
    const max = Number(form.pay_max);
    if (!Number.isFinite(min) || !Number.isFinite(max)) return "Pay range must be numeric.";
    if (min > max) return "pay_min must be <= pay_max.";
    return null;
  }, [form.pay_min, form.pay_max]);

  const handleChange = (key) => (e) => {
    const val = e?.target?.value;
    setForm((prev) => ({ ...prev, [key]: val }));
  };

  const handleSave = async () => {
    setError("");
    if (!titleOk || !descOk || !employmentOk || !arrangementOk || !regionOk) {
      setError("Title, description, employment type, work arrangement, and region are required.");
      setTab(TAB.BASICS);
      return;
    }
    if (payErr) {
      setError(payErr);
      setTab(TAB.COMP);
      return;
    }

    const payload = {
      title: form.title.trim(),
      slug: form.slug.trim() || undefined,
      summary: form.summary || undefined,
      description: form.description.trim(),
      responsibilities: form.responsibilities || undefined,
      requirements: form.requirements || undefined,
      benefits: form.benefits || undefined,
      role_details: form.role_details || undefined,
      key_requirements: form.key_requirements || undefined,
      ai_must_have_skills: form.ai_must_have_skills || undefined,
      ai_nice_to_have_skills: form.ai_nice_to_have_skills || undefined,
      ai_notes: form.ai_notes || undefined,
      location: form.location || undefined,
      location_type: form.work_arrangement || form.location_type || undefined,
      country: form.country || undefined,
      region: form.region || undefined,
      city: form.city || undefined,
      postal_code: form.postal_code || undefined,
      work_arrangement: form.work_arrangement || undefined,
      employment_type: form.employment_type || undefined,
      job_category: form.job_category || undefined,
      seniority: form.seniority || undefined,
      pay_min: form.pay_min === "" ? undefined : Number(form.pay_min),
      pay_max: form.pay_max === "" ? undefined : Number(form.pay_max),
      pay_currency: form.pay_currency || undefined,
      pay_period: form.pay_period || undefined,
      department: form.department || undefined,
      show_recruiter: Boolean(form.show_recruiter),
      apply_form_id: form.apply_form_id === "" ? undefined : Number(form.apply_form_id),
      apply_deadline: form.apply_deadline || undefined,
      seo_title: form.seo_title || undefined,
      seo_description: form.seo_description || undefined,
      og_image: form.og_image || undefined,
    };

    await onSave(payload);
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ fontWeight: 900 }}>
        {isEdit ? "Edit Job Posting" : "Create Job Posting"}
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={2}>
          {error && <Alert severity="error">{error}</Alert>}

          <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto">
            <Tab label="Basics" />
            <Tab label="Description" />
            <Tab label="Compensation" />
            <Tab label="Apply Settings" />
            <Tab label="SEO and Sharing" />
          </Tabs>

          <Divider />

          {tab === TAB.BASICS && (
            <Stack spacing={2}>
              <TextField
                label="Job title"
                value={form.title}
                onChange={handleChange("title")}
                required
                fullWidth
              />
              <TextField
                label="Slug (optional)"
                value={form.slug}
                onChange={handleChange("slug")}
                helperText="If empty, we auto-generate from title. Max 160 chars."
                fullWidth
              />
              <TextField
                label="Summary (optional)"
                value={form.summary}
                onChange={handleChange("summary")}
                fullWidth
              />
              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <TextField
                  select
                  label="Country"
                  value={form.country}
                  onChange={handleChange("country")}
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
                  value={form.region}
                  onChange={handleChange("region")}
                  required={regionRequired}
                  disabled={!regionRequired}
                  fullWidth
                >
                  {regionOptions.map((opt) => (
                    <MenuItem key={opt.code} value={opt.code}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Stack>
              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <TextField
                  label="City"
                  value={form.city}
                  onChange={handleChange("city")}
                  fullWidth
                />
                <TextField
                  label={countryIsUS ? "ZIP code" : "Postal code"}
                  value={form.postal_code}
                  onChange={handleChange("postal_code")}
                  fullWidth
                />
              </Stack>
              <TextField
                label="Location display (optional)"
                value={form.location}
                onChange={handleChange("location")}
                helperText="Shown on public job cards; city/region are used for filtering."
                fullWidth
              />
              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <TextField
                  select
                  label="Work arrangement"
                  value={form.work_arrangement}
                  onChange={handleChange("work_arrangement")}
                  required
                  fullWidth
                >
                  {WORK_ARRANGEMENTS.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  select
                  label="Employment type"
                  value={form.employment_type}
                  onChange={handleChange("employment_type")}
                  required
                  fullWidth
                >
                  {EMPLOYMENT_TYPES.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Stack>
              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <TextField
                  select
                  label="Job category"
                  value={form.job_category}
                  onChange={handleChange("job_category")}
                  fullWidth
                >
                  {JOB_CATEGORIES.map((opt) => (
                    <MenuItem key={opt} value={opt}>
                      {opt}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  label="Seniority"
                  value={form.seniority}
                  onChange={handleChange("seniority")}
                  placeholder="junior / mid / senior"
                  fullWidth
                />
              </Stack>
              <TextField
                label="Department"
                value={form.department}
                onChange={handleChange("department")}
                fullWidth
              />
            </Stack>
          )}

          {tab === TAB.DESCRIPTION && (
            <Stack spacing={2}>
              <TextField
                label="Description"
                value={form.description}
                onChange={handleChange("description")}
                required
                multiline
                minRows={4}
                fullWidth
              />
              <TextField
                label="Responsibilities"
                value={form.responsibilities}
                onChange={handleChange("responsibilities")}
                multiline
                minRows={4}
                fullWidth
              />
              <TextField
                label="Requirements"
                value={form.requirements}
                onChange={handleChange("requirements")}
                multiline
                minRows={4}
                fullWidth
              />
              <TextField
                label="Role-specific details"
                value={form.role_details}
                onChange={handleChange("role_details")}
                multiline
                minRows={4}
                fullWidth
              />
              <TextField
                label="Key requirements"
                value={form.key_requirements}
                onChange={handleChange("key_requirements")}
                multiline
                minRows={4}
                fullWidth
              />
              <Divider />
              <Typography variant="subtitle2" color="text.secondary">
                AI rubric (optional)
              </Typography>
              <TextField
                label="AI must-have skills"
                value={form.ai_must_have_skills}
                onChange={handleChange("ai_must_have_skills")}
                multiline
                minRows={2}
                fullWidth
              />
              <TextField
                label="AI nice-to-have skills"
                value={form.ai_nice_to_have_skills}
                onChange={handleChange("ai_nice_to_have_skills")}
                multiline
                minRows={2}
                fullWidth
              />
              <TextField
                label="AI notes"
                value={form.ai_notes}
                onChange={handleChange("ai_notes")}
                multiline
                minRows={2}
                fullWidth
              />
              <TextField
                label="Benefits"
                value={form.benefits}
                onChange={handleChange("benefits")}
                multiline
                minRows={3}
                fullWidth
              />
            </Stack>
          )}

          {tab === TAB.COMP && (
            <Stack spacing={2}>
              {payErr && <Alert severity="warning">{payErr}</Alert>}
              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <TextField
                  label="Pay min"
                  value={form.pay_min}
                  onChange={handleChange("pay_min")}
                  fullWidth
                />
                <TextField
                  label="Pay max"
                  value={form.pay_max}
                  onChange={handleChange("pay_max")}
                  fullWidth
                />
                <TextField
                  label="Currency"
                  value={form.pay_currency}
                  onChange={handleChange("pay_currency")}
                  placeholder="CAD / USD"
                  fullWidth
                />
              </Stack>
              <TextField
                select
                label="Pay period"
                value={form.pay_period}
                onChange={handleChange("pay_period")}
                fullWidth
              >
                {PAY_PERIODS.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="Show recruiter publicly"
                select
                value={String(form.show_recruiter)}
                onChange={(e) => setForm((p) => ({ ...p, show_recruiter: e.target.value === "true" }))}
                fullWidth
              >
                <MenuItem value="false">No</MenuItem>
                <MenuItem value="true">Yes</MenuItem>
              </TextField>
            </Stack>
          )}

          {tab === TAB.APPLY && (
            <Stack spacing={2}>
              <Typography variant="body2" color="text.secondary">
                These settings control application behavior and metadata. Applicants will be redirected to /apply/&lt;token&gt;.
              </Typography>

              <TextField
                label="Apply form template id (optional)"
                value={form.apply_form_id}
                onChange={handleChange("apply_form_id")}
                helperText="If empty, backend will pick the latest active intake template."
                fullWidth
              />

              <TextField
                label="Apply deadline (ISO) (optional)"
                value={form.apply_deadline}
                onChange={handleChange("apply_deadline")}
                placeholder="2026-01-31T23:59:00"
                fullWidth
              />
            </Stack>
          )}

          {tab === TAB.SEO && (
            <Stack spacing={2}>
              <TextField
                label="SEO Title"
                value={form.seo_title}
                onChange={handleChange("seo_title")}
                fullWidth
              />
              <TextField
                label="SEO Description"
                value={form.seo_description}
                onChange={handleChange("seo_description")}
                multiline
                minRows={3}
                fullWidth
              />
              <TextField
                label="OG Image URL"
                value={form.og_image}
                onChange={handleChange("og_image")}
                fullWidth
              />
            </Stack>
          )}
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : isEdit ? "Save changes" : "Create"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
