import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  TextField,
  MenuItem,
  Grid,
  Button,
  Paper,
  Snackbar,
  Alert,
  CircularProgress,
  Stack,
  Avatar,
  Tooltip,
  FormControlLabel,
  Switch,
} from "@mui/material";
import axios from "axios";
import { API_BASE_URL } from "../../utils/api";
import { getAuthedCompanyId } from "../../utils/authedCompany";
import UploadIcon from "@mui/icons-material/Upload";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { useTranslation } from "react-i18next";
import { Link as RouterLink } from "react-router-dom";
import ManagementFrame from "../../components/ui/ManagementFrame";

const CANADA_PROVINCES = [
  "AB",
  "BC",
  "MB",
  "NB",
  "NL",
  "NS",
  "NT",
  "NU",
  "ON",
  "PE",
  "QC",
  "SK",
  "YT",
];

const US_STATES = [
  "AL",
  "AK",
  "AZ",
  "AR",
  "CA",
  "CO",
  "CT",
  "DE",
  "FL",
  "GA",
  "HI",
  "ID",
  "IL",
  "IN",
  "IA",
  "KS",
  "KY",
  "LA",
  "ME",
  "MD",
  "MA",
  "MI",
  "MN",
  "MS",
  "MO",
  "MT",
  "NE",
  "NV",
  "NH",
  "NJ",
  "NM",
  "NY",
  "NC",
  "ND",
  "OH",
  "OK",
  "OR",
  "PA",
  "RI",
  "SC",
  "SD",
  "TN",
  "TX",
  "UT",
  "VT",
  "VA",
  "WA",
  "WV",
  "WI",
  "WY",
];

const EmployeeProfileForm = ({ token }) => {
  const { t, i18n } = useTranslation();
  const language = i18n.language;

  const [recruiters, setRecruiters] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(false);
  const [messageKey, setMessageKey] = useState("");
  const [errorKey, setErrorKey] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [showImageHelp, setShowImageHelp] = useState(false);
  const companyId = employee?.company_id || getAuthedCompanyId() || "";

  const [departments, setDepartments] = useState([]);
  const [departmentFilter, setDepartmentFilter] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [perPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

const API_URL =
  (process.env.REACT_APP_API_URL && process.env.REACT_APP_API_URL.trim()) ||
  API_BASE_URL ||
  "https://scheduling-application.onrender.com";
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB
const FRONTEND_ORIGIN =
  (typeof window !== "undefined" && window.location.origin) ||
  (process.env.REACT_APP_FRONTEND_URL || "").replace(/\/$/, "") ||
  "http://localhost:3000";

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/departments`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setDepartments(res.data || []);
      } catch (err) {
        console.error("Failed to load departments", err);
      }
    };
    fetchDepartments();
  }, [API_URL, token]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, departmentFilter]);

  useEffect(() => {
    const fetchRecruiters = async () => {
      try {
        const res = await axios.get(`${API_URL}/manager/recruiters`, {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            q: searchQuery,
            department_id: departmentFilter,
            page,
            per_page: perPage,
          },
        });
        setRecruiters(res.data.recruiters || []);
        const total = res.data.total || 0;
        setTotalPages(Math.max(1, Math.ceil(total / perPage)));
        setErrorKey("");
      } catch (err) {
        console.error("Failed to load recruiters", err);
        setErrorKey("manager.employeeProfiles.messages.recruiterLoadFailed");
      }
    };
    fetchRecruiters();
  }, [API_URL, token, searchQuery, departmentFilter, page, perPage]);

  const handleSelect = async (id) => {
    setSelectedId(id);
    if (!id) return;
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/recruiters/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = res.data;
      const flatData = {
        ...data,
        address_street: data.address?.street || "",
        address_city: data.address?.city || "",
        address_state: data.address?.state || "",
        address_zip: data.address?.zip || "",
        company_id: data.company_id,
        allow_public_booking: data.allow_public_booking,
      };
      setEmployee(flatData);
      setErrorKey("");
    } catch (err) {
      console.error("Failed to fetch employee", err);
      setErrorKey("manager.employeeProfiles.messages.profileLoadFailed");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setEmployee((prev) => (prev ? { ...prev, [name]: value } : prev));
  };

  const handleImageUpload = async (file) => {
    if (!file || !employee) {
      setUploadError("Select an employee and choose an image to upload.");
      setErrorKey("manager.employeeProfiles.messages.updateFailed");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setUploadError("Image is too large. Max 5MB. Please choose a smaller JPG/PNG/WebP.");
      return;
    }
    setUploadingImage(true);
    try {
      const form = new FormData();
      form.append("file", file);
      if (companyId) form.append("company_id", companyId);
      // Use existing website media upload (supports auth + company scoping)
      const res = await axios.post(`${API_URL}/api/website/media/upload`, form, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
          ...(companyId ? { "X-Company-Id": companyId } : {}),
        },
      });
      const rawUrl =
        res.data?.items?.[0]?.url_public ||
        res.data?.items?.[0]?.file_url ||
        res.data?.items?.[0]?.url ||
        res.data?.url ||
        res.data?.url_public;

      let finalUrl = rawUrl;
      // If backend returned a relative path (e.g., /api/website/media/file/1/xyz.png),
      // prepend the API host so the public site doesn't try to fetch it from www.schedulaa.com.
      if (rawUrl && !/^https?:\/\//i.test(rawUrl)) {
        try {
          const apiOrigin = new URL(API_URL).origin;
          finalUrl = `${apiOrigin}${rawUrl.startsWith("/") ? "" : "/"}${rawUrl}`;
        } catch (e) {
          finalUrl = rawUrl;
        }
      }

      if (finalUrl) {
        setEmployee((prev) =>
          prev ? { ...prev, profile_image_url: finalUrl } : prev
        );
      }
      setErrorKey("");
      setUploadError("");
    } catch (err) {
      console.error("Image upload failed", err);
      const detail =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        (err?.response?.status === 413
          ? "Image is too large. Max 5MB. Please upload a smaller JPG/PNG/WebP."
          : "") ||
        "We couldn't upload that image. Please try again later or use a smaller file.";
      setUploadError(detail);
      setErrorKey("");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleImageRemove = () => {
    setEmployee((prev) => (prev ? { ...prev, profile_image_url: "" } : prev));
  };

  const handleSubmit = async () => {
    if (!employee || !selectedId) return;
    try {
      await axios.put(`${API_URL}/api/recruiters/${selectedId}`, employee, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessageKey("manager.employeeProfiles.messages.updateSuccess");
      setErrorKey("");
    } catch (err) {
      console.error("Update failed", err);
      setErrorKey("manager.employeeProfiles.messages.updateFailed");
    }
  };

  const countryOptions = useMemo(
    () => [
      { value: "Canada", label: t("manager.employeeProfiles.form.country.options.canada") },
      { value: "USA", label: t("manager.employeeProfiles.form.country.options.usa") },
    ],
    [language, t]
  );

  const provinceOptions = useMemo(() => {
    if (employee?.country === "Canada") {
      return CANADA_PROVINCES;
    }
    if (employee?.country === "USA") {
      return US_STATES;
    }
    return [];
  }, [employee?.country]);

  const isCanada = employee?.country === "Canada";
  const postalLabel = isCanada
    ? t("manager.employeeProfiles.form.fields.postalCodeCa")
    : t("manager.employeeProfiles.form.fields.postalCodeUs");
  const postalTitle = isCanada
    ? t("manager.employeeProfiles.form.hints.postalTitleCa")
    : t("manager.employeeProfiles.form.hints.postalTitleUs");
  const postalHelper = isCanada
    ? t("manager.employeeProfiles.form.hints.postalHelperCa")
    : t("manager.employeeProfiles.form.hints.postalHelperUs");

  const paginationLabel = t("manager.employeeProfiles.pagination.summary", {
    page,
    total: totalPages,
  });

  return (
    <ManagementFrame
      title={t("manager.employeeProfiles.title")}
      subtitle={t("manager.employeeProfiles.subtitle")}
    >
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 3,
          borderRadius: 3,
          border: (theme) => `1px solid ${theme.palette.divider}`,
          backgroundColor: (theme) =>
            theme.palette.mode === "dark"
              ? theme.palette.background.paper
              : theme.palette.grey[50],
        }}
      >
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          alignItems={{ xs: "flex-start", md: "center" }}
          justifyContent="space-between"
        >
          <Box>
            <Typography variant="subtitle1" fontWeight={600}>
              {t("manager.employeeProfiles.quickAddTitle", "Need to add someone new?")}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t(
                "manager.employeeProfiles.quickAddSubtitle",
                "Use the Add Team Member workflow for stronger validation, password rules, and onboarding controls."
              )}
            </Typography>
          </Box>
          <Button
            component={RouterLink}
            to="/manager/add-member"
            variant="contained"
            color="primary"
          >
            {t("manager.employeeProfiles.actions.launchAddMember", "Open Add Team Member")}
          </Button>
        </Stack>
      </Paper>

      <TextField
        select
        label={t("manager.employeeProfiles.filters.department")}
        value={departmentFilter}
        onChange={(event) => setDepartmentFilter(event.target.value)}
        fullWidth
        sx={{ mb: 2 }}
      >
        <MenuItem value="">
          <em>{t("manager.employeeProfiles.filters.allDepartments")}</em>
        </MenuItem>
        {departments.map((dept) => (
          <MenuItem key={dept.id} value={dept.id}>
            {dept.name}
          </MenuItem>
        ))}
      </TextField>

      <TextField
        select
        label={t("manager.employeeProfiles.filters.employee")}
        value={selectedId}
        onChange={(event) => handleSelect(event.target.value)}
        fullWidth
        sx={{ mb: 3 }}
      >
        <MenuItem value="">
          <em>{t("common.none")}</em>
        </MenuItem>
        {recruiters
          .filter((recruiter) =>
            departmentFilter
              ? recruiter.department_id === parseInt(departmentFilter, 10)
              : true
          )
          .map((recruiter) => (
            <MenuItem key={recruiter.id} value={recruiter.id}>
              {recruiter.first_name} {recruiter.last_name} ({recruiter.email})
            </MenuItem>
          ))}
      </TextField>

      <Box display="flex" justifyContent="space-between" my={2}>
        <Button disabled={page <= 1} onClick={() => setPage((prev) => prev - 1)}>
          {t("common.previous")}
        </Button>
        <Typography>{paginationLabel}</Typography>
        <Button
          disabled={page >= totalPages}
          onClick={() => setPage((prev) => prev + 1)}
        >
          {t("common.next")}
        </Button>
      </Box>

      {loading && <CircularProgress sx={{ mb: 2 }} />}

      {employee && (
        <Paper sx={{ p: 3, mt: 2, borderRadius: 3 }} variant="outlined">
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                label={t("manager.employeeProfiles.form.fields.firstName")}
                name="first_name"
                value={employee.first_name || ""}
                onChange={handleChange}
                fullWidth
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label={t("manager.employeeProfiles.form.fields.lastName")}
                name="last_name"
                value={employee.last_name || ""}
                onChange={handleChange}
                fullWidth
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label={t("manager.employeeProfiles.form.fields.email")}
                name="email"
                value={employee.email || ""}
                onChange={handleChange}
                fullWidth
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  borderRadius: 2,
                }}
              >
                <Avatar
                  src={employee.profile_image_url || ""}
                  alt={employee.first_name || "Employee"}
                  sx={{ width: 72, height: 72 }}
                />
                <Stack spacing={1} flex={1}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="subtitle1" fontWeight={600}>
                      Employee profile image
                    </Typography>
                    <Button
                      size="small"
                      variant="text"
                      onClick={() => setShowImageHelp((s) => !s)}
                    >
                      {showImageHelp ? "Hide info" : "Upload tips"}
                    </Button>
                  </Stack>
                  {showImageHelp && (
                    <Typography variant="caption" color="text.secondary">
                      Upload a clear headshot (JPG/PNG/WebP, up to 10MB). This appears on booking pages so clients can recognize the provider.
                    </Typography>
                  )}
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                    <Button
                      variant="outlined"
                      size="small"
                      component="label"
                      startIcon={<UploadIcon fontSize="small" />}
                      disabled={uploadingImage || !employee}
                    >
                      {uploadingImage ? t("common.uploading", "Uploading…") : t("common.upload", "Upload")}
                      <input
                        type="file"
                        accept="image/*"
                        hidden
                        onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
                      />
                    </Button>
                    <Tooltip title={employee.profile_image_url ? "Remove image" : "No image set"}>
                      <span>
                        <Button
                          variant="text"
                          size="small"
                          startIcon={<DeleteOutlineIcon fontSize="small" />}
                          disabled={!employee.profile_image_url}
                          onClick={handleImageRemove}
                        >
                          {t("common.remove", "Remove")}
                        </Button>
                      </span>
                    </Tooltip>
                  </Stack>
                  {uploadError && (
                    <Typography variant="caption" color="error">
                      {uploadError}
                    </Typography>
                  )}
                </Stack>
              </Paper>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label={t("manager.employeeProfiles.form.fields.phone")}
                name="phone"
                value={employee.phone || ""}
                onChange={handleChange}
                fullWidth
              />
            </Grid>


            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={Boolean(employee.allow_public_booking)}
                    onChange={(e) =>
                      setEmployee((prev) =>
                        prev ? { ...prev, allow_public_booking: e.target.checked } : prev
                      )
                    }
                  />
                }
                label="Allow public bookings (shareable link)"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                select
                label={t("manager.employeeProfiles.form.fields.department")}
                name="department_id"
                value={
                  departments.some((d) => d.id === employee.department_id)
                    ? employee.department_id
                    : ""
                }
                onChange={handleChange}
                fullWidth
              >
                <MenuItem value="">
                  <em>{t("common.none")}</em>
                </MenuItem>
                {departments.map((dept) => (
                  <MenuItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label={t("manager.employeeProfiles.form.fields.hourlyRate")}
                name="hourly_rate"
                type="number"
                value={employee.hourly_rate || 0}
                onChange={handleChange}
                fullWidth
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label={t("manager.employeeProfiles.form.fields.rrspContribution")}
                name="rrsp_percent"
                type="number"
                value={employee.rrsp_percent || ""}
                onChange={handleChange}
                fullWidth
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label={t("manager.employeeProfiles.form.fields.rrspMatch")}
                name="rrsp_employer_percent"
                type="number"
                value={employee.rrsp_employer_percent || ""}
                onChange={handleChange}
                fullWidth
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label={t("manager.employeeProfiles.form.fields.retirementContribution")}
                name="retirement_percent"
                type="number"
                value={employee.retirement_percent || ""}
                onChange={handleChange}
                fullWidth
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label={t("manager.employeeProfiles.form.fields.retirementMatch")}
                name="retirement_employer_percent"
                type="number"
                value={employee.retirement_employer_percent || ""}
                onChange={handleChange}
                fullWidth
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label={t("manager.employeeProfiles.form.fields.insuranceNumber")}
                name="insurance_number"
                value={employee.insurance_number || ""}
                onChange={handleChange}
                fullWidth
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label={t("manager.employeeProfiles.form.fields.sin")}
                name="sin"
                value={employee.sin || ""}
                onChange={handleChange}
                fullWidth
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label={t("manager.employeeProfiles.form.fields.hireDate")}
                name="hire_date"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={employee.hire_date || ""}
                onChange={handleChange}
                fullWidth
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label={t("manager.employeeProfiles.form.fields.addressStreet")}
                name="address_street"
                value={employee.address_street || ""}
                onChange={handleChange}
                fullWidth
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                label={t("manager.employeeProfiles.form.fields.country")}
                name="country"
                value={employee.country || ""}
                onChange={handleChange}
                fullWidth
                select
              >
                {countryOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                label={t("manager.employeeProfiles.form.fields.province")}
                name="province"
                value={employee.province || ""}
                onChange={handleChange}
                fullWidth
                select
              >
                {provinceOptions.map((code) => (
                  <MenuItem key={code} value={code}>
                    {code}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                label={t("manager.employeeProfiles.form.fields.city")}
                name="address_city"
                value={employee.address_city || ""}
                onChange={handleChange}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                label={postalLabel}
                name="address_zip"
                value={employee.address_zip || ""}
                onChange={(event) => {
                  const raw = event.target.value.toUpperCase();
                  let value = raw;
                  if (isCanada) {
                    value = raw
                      .replace(/[^A-Z0-9]/g, "")
                      .replace(/^(.{3})(.{0,3})$/, "$1 $2")
                      .trim();
                  }
                  setEmployee((prev) => (prev ? { ...prev, address_zip: value } : prev));
                }}
                fullWidth
                helperText={postalHelper}
                title={postalTitle}
              />
            </Grid>
          </Grid>

          <Paper variant="outlined" sx={{ p: 2, mt: 3, borderRadius: 2 }}>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Public booking link
            </Typography>
            {employee.allow_public_booking ? (
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems="center">
                <TextField
                  fullWidth
                  size="small"
                  value={`${FRONTEND_ORIGIN}/${employee.company_slug || employee.company?.slug || "<slug>"}/meet/${employee.id}`}
                  InputProps={{ readOnly: true }}
                />
                <Tooltip title="Copy link">
                  <span>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() =>
                        navigator.clipboard.writeText(
                          `${FRONTEND_ORIGIN}/${employee.company_slug || employee.company?.slug || ""}/meet/${employee.id}`
                        )
                      }
                    >
                      Copy
                    </Button>
                  </span>
                </Tooltip>
              </Stack>
            ) : (
              <Alert severity="warning" sx={{ mt: 1 }}>
                Enable "Allow public bookings" to expose a shareable link.
              </Alert>
            )}
          </Paper>

          <Box sx={{ mt: 3 }}>
            <Button variant="contained" onClick={handleSubmit}>
              {t("manager.employeeProfiles.actions.save")}
            </Button>
          </Box>
        </Paper>
      )}

      <Snackbar
        open={!!messageKey}
        autoHideDuration={3000}
        onClose={() => setMessageKey("")}
      >
        <Alert onClose={() => setMessageKey("")} severity="success">
          {messageKey ? t(messageKey) : ""}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!errorKey}
        autoHideDuration={3000}
        onClose={() => setErrorKey("")}
      >
        <Alert onClose={() => setErrorKey("")} severity="error">
          {errorKey ? t(errorKey) : ""}
        </Alert>
      </Snackbar>
    </ManagementFrame>
  );
};

export default EmployeeProfileForm;
