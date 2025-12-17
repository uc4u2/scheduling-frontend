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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Checkbox,
  List,
  ListItem,
  ListItemText,
  Divider,
  Link,
  Chip,
  IconButton,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import { api } from "../../utils/api";
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
  const [documents, setDocuments] = useState([]);
  const [docLoading, setDocLoading] = useState(false);
  const [docError, setDocError] = useState("");
  const [docUploading, setDocUploading] = useState(false);
  const [docUploadError, setDocUploadError] = useState("");
  const [docUploadSuccess, setDocUploadSuccess] = useState(false);
  const [onboardingSending, setOnboardingSending] = useState(false);
  const [onboardingSendError, setOnboardingSendError] = useState("");
  const [onboardingSendSuccess, setOnboardingSendSuccess] = useState(false);
  const [payrollExpanded, setPayrollExpanded] = useState(true);
  const [retirementPlan, setRetirementPlan] = useState(null);
  const [retirementElection, setRetirementElection] = useState({
    contrib_percent: "",
    contrib_flat: "",
    contrib_type: "traditional",
    effective_start_date: "",
  });
  const isUS = (employee?.country || "").toUpperCase().startsWith("US");
  const isCA = (employee?.country || "").toUpperCase().startsWith("CA");
  const MAX_DOC_BYTES = 2 * 1024 * 1024;
  const allowedDocExtensions = [".pdf", ".doc", ".docx", ".csv", ".xls", ".xlsx", ".png", ".jpg", ".jpeg"];
  const companyId = employee?.company_id || getAuthedCompanyId() || "";

  const [departments, setDepartments] = useState([]);
  const [departmentFilter, setDepartmentFilter] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [perPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB
const FRONTEND_ORIGIN =
  (typeof window !== "undefined" && window.location.origin) ||
  (process.env.REACT_APP_FRONTEND_URL || "").replace(/\/$/, "") ||
  "http://localhost:3000";

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await api.get("/api/departments");
        setDepartments(res.data || []);
      } catch (err) {
        console.error("Failed to load departments", err);
      }
    };
    fetchDepartments();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, departmentFilter]);

  useEffect(() => {
    const fetchRecruiters = async () => {
      try {
      const res = await api.get("/manager/recruiters", {
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
  }, [searchQuery, departmentFilter, page, perPage]);

  const handleSelect = async (id) => {
    setSelectedId(id);
    if (!id) return;
    setLoading(true);
    try {
      const res = await api.get(`/api/recruiters/${id}`);
      const data = res.data;
      const flatData = {
        ...data,
        address_street: data.address?.street || "",
        address_city: data.address?.city || "",
        address_state: data.address?.state || "",
        address_zip: data.address?.zip || "",
        company_id: data.company_id,
        allow_public_booking: data.allow_public_booking,
        public_bio: data.public_bio || "",
        role: data.role || "",
        public_meet_token: data.public_meet_token || "",
        cpp_exempt: Boolean(data.cpp_exempt),
        ei_exempt: Boolean(data.ei_exempt),
        union_member: Boolean(data.union_member),
        default_garnishment: data.default_garnishment ?? 0,
        default_union_dues: data.default_union_dues ?? 0,
        default_medical_insurance: data.default_medical_insurance ?? 0,
        default_dental_insurance: data.default_dental_insurance ?? 0,
        default_life_insurance: data.default_life_insurance ?? 0,
        default_retirement_amount: data.default_retirement_amount ?? 0,
        default_deduction: data.default_deduction ?? 0,
        default_parental_insurance: data.default_parental_insurance ?? 0,
        default_pay_frequency: data.default_pay_frequency || "",
        default_pay_cycle: data.default_pay_cycle || "",
      };
      setEmployee(flatData);
      setErrorKey("");
      // Load retirement plan/election (enterprise)
      loadRetirementPlan(flatData.country);
      loadRetirementElection(id, flatData.country);
      await fetchDocuments(id);
    } catch (err) {
      console.error("Failed to fetch employee", err);
      setErrorKey("manager.employeeProfiles.messages.profileLoadFailed");
    } finally {
      setLoading(false);
    }
  };

  const loadRetirementPlan = async (country) => {
    const c = (country || "").toLowerCase().startsWith("us")
      ? "us"
      : (country || "").toLowerCase().startsWith("ca")
      ? "ca"
      : "";
    if (!c) {
      setRetirementPlan(null);
      return;
    }
    try {
      const res = await api.get(`/automation/retirement/plan`, {
        params: { country: c },
      });
      setRetirementPlan(res.data && Object.keys(res.data).length ? res.data : null);
    } catch (err) {
      console.error("Failed to load retirement plan", err?.response?.data || err.message);
      setRetirementPlan(null);
    }
  };

  const loadRetirementElection = async (empId, country) => {
    const isUS = (country || "").toLowerCase() === "usa" || (country || "").toLowerCase() === "us";
    if (!empId || !isUS) {
      setRetirementElection({
        contrib_percent: "",
        contrib_flat: "",
        contrib_type: "traditional",
        effective_start_date: "",
      });
      return;
    }
    try {
      const res = await api.get(`/automation/retirement/elections`, {
        params: { employee_id: empId },
      });
      const data = res.data || {};
      setRetirementElection({
        contrib_percent: data.contrib_percent ?? "",
        contrib_flat: data.contrib_flat ?? "",
        contrib_type: data.contrib_type || "traditional",
        effective_start_date: data.effective_start_date || "",
      });
    } catch (err) {
      console.error("Failed to load retirement election", err?.response?.data || err.message);
      setRetirementElection({
        contrib_percent: "",
        contrib_flat: "",
        contrib_type: "traditional",
        effective_start_date: "",
      });
    }
  };

  const fetchDocuments = async (empId) => {
    if (!empId) return;
    setDocLoading(true);
    try {
      const res = await api.get(`/manager/employees/${empId}/documents`);
      setDocuments(res.data?.documents || []);
      setDocError("");
    } catch (err) {
      console.error("Failed to load documents", err);
      setDocError("Unable to load documents for this employee.");
    } finally {
      setDocLoading(false);
    }
  };

  const handleDocumentUpload = async (file) => {
    if (!file || !employee || !selectedId) {
      setDocUploadError("Select an employee and choose a file to upload.");
      return;
    }
    if (documents.length >= 7) {
      setDocUploadError("You have reached the 7 document limit for this employee.");
      return;
    }
    const ext = `.${(file.name || "").split(".").pop().toLowerCase()}`;
    if (!allowedDocExtensions.includes(ext)) {
      setDocUploadError("File type not allowed. Use PDF, DOC/DOCX, CSV/XLS/XLSX, or PNG/JPG.");
      return;
    }
    if (file.size > MAX_DOC_BYTES) {
      setDocUploadError("File is too large. Max 2MB.");
      return;
    }
    setDocUploading(true);
    setDocUploadError("");
    setDocUploadSuccess(false);
    try {
      // Reuse website media upload for storage
      const form = new FormData();
      form.append("file", file);
      if (companyId) form.append("company_id", companyId);
      const uploadRes = await api.post("/api/website/media/upload", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const rawUrl =
        uploadRes.data?.items?.[0]?.url_public ||
        uploadRes.data?.items?.[0]?.file_url ||
        uploadRes.data?.items?.[0]?.url ||
        uploadRes.data?.url ||
        uploadRes.data?.url_public;
      if (!rawUrl) {
        throw new Error("Missing upload URL");
      }
      const apiOrigin = (process.env.REACT_APP_API_URL || "").replace(/\/$/, "");
      const finalUrl = /^https?:\/\//i.test(rawUrl)
        ? rawUrl
        : apiOrigin
        ? `${apiOrigin}${rawUrl.startsWith("/") ? "" : "/"}${rawUrl}`
        : rawUrl;

      await api.post(`/manager/employees/${selectedId}/documents`, {
        name: file.name,
        file_url: finalUrl,
        provider: "manual_upload",
      });
      setDocUploadSuccess(true);
      await fetchDocuments(selectedId);
    } catch (err) {
      console.error("Failed to upload document", err);
      setDocUploadError("Upload failed. Please try again.");
    } finally {
      setDocUploading(false);
    }
  };

  const handleSendOnboardingViaZapier = async () => {
    if (!employee || !selectedId) return;
    setOnboardingSendError("");
    setOnboardingSendSuccess(false);
    setOnboardingSending(true);
    try {
      await api.post(`/manager/employees/${selectedId}/onboarding/zapier`, {
        context: { source: "employee_profile" },
      });
      setOnboardingSendSuccess(true);
    } catch (err) {
      console.error("Failed to send onboarding via Zapier", err);
      setOnboardingSendError(err?.response?.data?.error || "Failed to send onboarding event to Zapier.");
    } finally {
      setOnboardingSending(false);
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
      const res = await api.post(`/api/website/media/upload`, form, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      const rawUrl =
        res.data?.items?.[0]?.url_public ||
        res.data?.items?.[0]?.file_url ||
        res.data?.items?.[0]?.url ||
        res.data?.url ||
        res.data?.url_public;

      // Ensure relative paths use the API host (Render), not the static site host.
      let finalUrl = rawUrl;
      if (rawUrl && !/^https?:\/\//i.test(rawUrl)) {
        const apiOrigin = (process.env.REACT_APP_API_URL || "").replace(/\/$/, "");
        finalUrl = apiOrigin ? `${apiOrigin}${rawUrl.startsWith("/") ? "" : "/"}${rawUrl}` : rawUrl;
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
      // Ensure flags are sent explicitly; preserve current state if the API omits them
      const payload = {
        ...employee,
        cpp_exempt: Boolean(employee.cpp_exempt),
        ei_exempt: Boolean(employee.ei_exempt),
        union_member: Boolean(employee.union_member),
      };
      const recurringKeys = [
        "default_garnishment",
        "default_union_dues",
        "default_medical_insurance",
        "default_dental_insurance",
        "default_life_insurance",
        "default_retirement_amount",
        "default_deduction",
        "default_parental_insurance",
        "default_pay_frequency",
        "default_pay_cycle",
      ];
      recurringKeys.forEach((key) => {
        if (key.startsWith("default_") && key !== "default_pay_frequency" && key !== "default_pay_cycle") {
          payload[key] = employee[key] === "" || employee[key] === null ? 0 : Number(employee[key] || 0);
        } else {
          payload[key] = employee[key] || "";
        }
      });

      const res = await api.put(`/api/recruiters/${selectedId}`, payload);
      if (res?.data) {
        // update local state with saved values to reflect toggles immediately
        const data = res.data;
        const flatData = {
          // merge API response but preserve toggles if the API omits them
          ...employee,
          ...data,
          address_street: data.address?.street || "",
          address_city: data.address?.city || "",
          address_state: data.address?.state || "",
          address_zip: data.address?.zip || "",
          cpp_exempt: data.cpp_exempt !== undefined ? Boolean(data.cpp_exempt) : Boolean(employee.cpp_exempt),
          ei_exempt: data.ei_exempt !== undefined ? Boolean(data.ei_exempt) : Boolean(employee.ei_exempt),
          union_member: data.union_member !== undefined ? Boolean(data.union_member) : Boolean(employee.union_member),
          default_garnishment:
            data.default_garnishment !== undefined ? data.default_garnishment : employee.default_garnishment,
          default_union_dues:
            data.default_union_dues !== undefined ? data.default_union_dues : employee.default_union_dues,
          default_medical_insurance:
            data.default_medical_insurance !== undefined
              ? data.default_medical_insurance
              : employee.default_medical_insurance,
          default_dental_insurance:
            data.default_dental_insurance !== undefined
              ? data.default_dental_insurance
              : employee.default_dental_insurance,
          default_life_insurance:
            data.default_life_insurance !== undefined ? data.default_life_insurance : employee.default_life_insurance,
          default_retirement_amount:
            data.default_retirement_amount !== undefined
              ? data.default_retirement_amount
              : employee.default_retirement_amount,
          default_deduction:
            data.default_deduction !== undefined ? data.default_deduction : employee.default_deduction,
          default_parental_insurance:
            data.default_parental_insurance !== undefined
              ? data.default_parental_insurance
              : employee.default_parental_insurance,
          default_pay_frequency: data.default_pay_frequency ?? employee.default_pay_frequency,
          default_pay_cycle: data.default_pay_cycle ?? employee.default_pay_cycle,
        };
        setEmployee(flatData);
      }
      // Save retirement election (US only) if plan exists
      if (employee.country === "USA" && retirementPlan?.id) {
        try {
          await api.post("/automation/retirement/elections", {
            employee_id: selectedId,
            plan_id: retirementPlan.id,
            contrib_percent:
              retirementElection.contrib_percent === "" ? null : Number(retirementElection.contrib_percent),
            contrib_flat: retirementElection.contrib_flat === "" ? null : Number(retirementElection.contrib_flat),
            contrib_type: retirementElection.contrib_type || "traditional",
            effective_start_date: retirementElection.effective_start_date || null,
          });
        } catch (err) {
          console.error("Failed to save retirement election", err?.response?.data || err.message);
        }
      }
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

  const recurringDefaultFields = [
    { name: "default_garnishment", label: "Default Garnishment ($)" },
    { name: "default_union_dues", label: "Default Union Dues ($)" },
    { name: "default_medical_insurance", label: "Default Medical Insurance ($)" },
    { name: "default_dental_insurance", label: "Default Dental Insurance ($)" },
    { name: "default_life_insurance", label: "Default Life Insurance ($)" },
    { name: "default_retirement_amount", label: "Default Retirement Contribution ($)" },
    { name: "default_deduction", label: "Default Other Deduction ($)" },
    ...(employee?.country === "Canada"
      ? [{ name: "default_parental_insurance", label: "Default Parental Insurance ($)" }]
      : []),
  ];

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
                label="Public title / role"
                name="role"
                value={employee.role || ""}
                onChange={handleChange}
                fullWidth
                helperText="Shown on public pages like services and the meeting link."
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
              <TextField
                label={t("manager.employeeProfiles.form.fields.phone")}
                name="phone"
                value={employee.phone || ""}
                onChange={handleChange}
                fullWidth
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

          <Grid container spacing={2} sx={{ mt: 1 }}>
            {isCA && (
              <>
                <Grid item xs={12} md={6}>
                  <TextField
                    label={t("manager.employeeProfiles.form.fields.rrspContribution")}
                    name="rrsp_percent"
                    type="number"
                    inputProps={{ min: 0, max: 100 }}
                    value={
                      employee.rrsp_percent !== undefined && employee.rrsp_percent !== null
                        ? Math.max(0, employee.rrsp_percent)
                        : ""
                    }
                    onChange={handleChange}
                    fullWidth
                    error={
                      employee.rrsp_percent !== undefined &&
                      employee.rrsp_percent !== null &&
                      employee.rrsp_percent !== "" &&
                      (Number(employee.rrsp_percent) < 0 || Number(employee.rrsp_percent) > 100)
                    }
                    helperText=""
                    InputProps={{
                      endAdornment: (
                        <Tooltip title="Percent of pay contributed to RRSP. 0–100%. Leave blank if no RRSP contribution.">
                          <IconButton size="small">
                            <InfoOutlinedIcon fontSize="inherit" />
                          </IconButton>
                        </Tooltip>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label={t("manager.employeeProfiles.form.fields.rrspMatch")}
                    name="rrsp_employer_percent"
                    type="number"
                    inputProps={{ min: 0, max: 100 }}
                    value={
                      employee.rrsp_employer_percent !== undefined && employee.rrsp_employer_percent !== null
                        ? Math.max(0, employee.rrsp_employer_percent)
                        : ""
                    }
                    onChange={handleChange}
                    fullWidth
                    error={
                      employee.rrsp_employer_percent !== undefined &&
                      employee.rrsp_employer_percent !== null &&
                      employee.rrsp_employer_percent !== "" &&
                      (Number(employee.rrsp_employer_percent) < 0 || Number(employee.rrsp_employer_percent) > 100)
                    }
                    helperText=""
                    InputProps={{
                      endAdornment: (
                        <Tooltip title="Optional employer RRSP match for reporting. Paid by the company; does not reduce employee net pay. 0–100%. Leave blank if no match.">
                          <IconButton size="small">
                            <InfoOutlinedIcon fontSize="inherit" />
                          </IconButton>
                        </Tooltip>
                      ),
                    }}
                  />
                </Grid>
              </>
            )}
          </Grid>

          <Paper variant="outlined" sx={{ p: 2, mt: 3, borderRadius: 2 }}>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Public booking link
            </Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
              This toggle controls the employee’s personal “Book with me” link (public meeting page).
              It does <strong>not</strong> control whether services on your services page can be booked.
            </Alert>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="flex-start" sx={{ mb: 2 }}>
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
              <Box flex={1} />
            </Stack>

            <Paper
              variant="outlined"
              sx={{
                p: 2,
                display: "flex",
                alignItems: "center",
                gap: 2,
                borderRadius: 2,
                mb: 2,
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
                    Public profile image
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
                    Upload a clear headshot (JPG/PNG/WebP, up to 5MB). This appears on booking pages so clients can recognize the provider.
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

            <TextField
              label="Public bio / introduction"
              name="public_bio"
              value={employee.public_bio || ""}
              onChange={handleChange}
              fullWidth
              multiline
              minRows={3}
              sx={{ mb: 2 }}
              placeholder="Short intro that appears on the meeting page and services."
            />
            {employee.allow_public_booking ? (
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems="center">
                <TextField
                  fullWidth
                  size="small"
                  value={`${FRONTEND_ORIGIN}/${employee.company_slug || employee.company?.slug || "<slug>"}/meet/${employee.public_meet_token || employee.id}`}
                  InputProps={{ readOnly: true }}
                />
                <Tooltip title="Copy link">
                  <span>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() =>
                        navigator.clipboard.writeText(
                          `${FRONTEND_ORIGIN}/${employee.company_slug || employee.company?.slug || ""}/meet/${employee.public_meet_token || employee.id}`
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

          <Paper variant="outlined" sx={{ p: 2, mt: 3, borderRadius: 2 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
              <Stack spacing={0.5}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Chip size="small" label="Onboarding" color="primary" variant="outlined" />
                  <Typography variant="subtitle1" fontWeight={700}>
                    Documents (Zapier / e-sign)
                  </Typography>
                  <Tooltip title="How to wire this with Zapier and e-sign tools">
                    <IconButton size="small" onClick={() => setShowImageHelp((s) => !s)}>
                      <HelpOutlineIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  Signed contracts and onboarding files pushed via Zapier attach_document appear here.
                </Typography>
              </Stack>
              <Stack direction="row" spacing={1}>
                <Tooltip title="Triggers onboarding.started for this employee (Zapier can send contracts and start onboarding workflows)">
                  <span>
                    <Button
                      variant="contained"
                      size="small"
                      disabled={onboardingSending || !employee}
                      onClick={handleSendOnboardingViaZapier}
                    >
                      {onboardingSending ? "Sending…" : "Send via Zapier"}
                    </Button>
                  </span>
                </Tooltip>
                <Button
                  variant="outlined"
                  size="small"
                  component="label"
                  disabled={docUploading || !employee}
                >
                  {docUploading ? "Uploading…" : "Upload signed doc"}
                  <input
                    type="file"
                    hidden
                    accept="application/pdf,.doc,.docx,.csv,.xls,.xlsx,.png,.jpg,.jpeg"
                    onChange={(e) => e.target.files?.[0] && handleDocumentUpload(e.target.files[0])}
                  />
                </Button>
                <Button variant="outlined" size="small" onClick={() => fetchDocuments(selectedId)} disabled={docLoading}>
                  {docLoading ? "Refreshing..." : "Refresh"}
                </Button>
              </Stack>
            </Stack>
            <Divider sx={{ mb: 2 }} />
            {onboardingSendError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {onboardingSendError}
              </Alert>
            )}
            {onboardingSendSuccess && (
              <Alert severity="success" sx={{ mb: 2 }}>
                Onboarding event sent. Your Zapier hook should receive <b>onboarding.started</b> for this employee.
              </Alert>
            )}
            {showImageHelp && (
              <Paper
                variant="outlined"
                sx={{ p: 2, mb: 2, borderRadius: 2, backgroundColor: (t) => t.palette.grey[showImageHelp ? 100 : 50] }}
              >
                <Stack spacing={1}>
                  <Typography variant="subtitle2" fontWeight={600}>
                    Quick guide: send contracts via Zapier + e-sign (DocuSign/SignWell/Zoho Sign)
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    This section stores signed PDFs on the employee profile after your e-sign tool finishes. Employees don’t upload these themselves.
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Step 0 — Create (or copy) your Schedulaa Zapier API key
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    In Schedulaa → Zapier tab → Zapier API keys, create/copy the key. You’ll use it only for Zapier actions/callbacks (Zapier → Schedulaa).
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Step 1 — Create a Zapier trigger (Schedulaa → Zapier)
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    In Zapier, create a Zap with Webhooks by Zapier → Catch Hook. Copy the Hook URL.
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Step 2 — Register the hook in Schedulaa
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    In Schedulaa → Zapier tab → Event hooks, paste the Hook URL and select event type <b>onboarding.started</b>. Save.
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Step 3 — Trigger it for the right employee
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    On this Employee Profile, click <b>Send via Zapier</b>. Schedulaa sends <b>onboarding.started</b> for this employee (name/email/employee_id) to your Zapier hook.
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Step 4 — Send the contract from Zapier
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Add your e-sign app action (DocuSign/SignWell/Zoho Sign) and send the template using the employee name/email from the webhook payload.
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Step 5 — When signed, attach the PDF back to this employee
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Create a second Zap: Trigger = your e-sign app “Document completed” → Action = Schedulaa <b>attach_document</b>. Use your Zapier API key from Step 0, and send: employee_id, file_url, name, signed_at.
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Tip: The employee_id is shown on this page and in the onboarding.started payload, so the signed PDF attaches to the correct profile.
                  </Typography>
                </Stack>
              </Paper>
            )}
            {docError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {docError}
              </Alert>
            )}
            {docUploadError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {docUploadError}
              </Alert>
            )}
            {docUploadSuccess && (
              <Alert severity="success" sx={{ mb: 2 }}>
                Document uploaded.
              </Alert>
            )}
            {docLoading ? (
              <Stack alignItems="center" sx={{ py: 2 }}>
                <CircularProgress size={24} />
              </Stack>
            ) : documents.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No documents yet. Use the Zapier action attach_document after your e-sign tool finishes to store signed PDFs on this employee.
              </Typography>
            ) : (
                <List dense>
                  {documents.map((doc, idx) => (
                    <React.Fragment key={doc.id || idx}>
                      <ListItem alignItems="flex-start" sx={{ py: 1, gap: 1 }}>
                        <ListItemText
                          primary={
                            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                {doc.name}
                              </Typography>
                              {doc.provider ? <Chip size="small" label={doc.provider} variant="outlined" /> : null}
                              {doc.signed_at ? (
                                <Chip
                                  size="small"
                                  color="success"
                                  label={`Signed ${new Date(doc.signed_at).toLocaleDateString()}`}
                                  variant="outlined"
                                />
                              ) : null}
                            </Stack>
                          }
                          secondary={
                            <Stack spacing={0.5}>
                              <Link href={doc.file_url} target="_blank" rel="noopener noreferrer" sx={{ wordBreak: "break-all" }}>
                                Open document
                              </Link>
                              <Typography variant="caption" color="text.secondary">
                                Added {doc.created_at ? new Date(doc.created_at).toLocaleString() : "—"}
                              </Typography>
                            </Stack>
                          }
                        />
                        {doc.id ? (
                          <Button
                            size="small"
                            color="error"
                            variant="text"
                            onClick={async () => {
                              try {
                                await api.delete(`/manager/employees/${selectedId}/documents/${doc.id}`);
                                await fetchDocuments(selectedId);
                              } catch (err) {
                                console.error("Failed to delete document", err);
                                setDocError("Delete failed. Please try again.");
                              }
                            }}
                          >
                            Delete
                          </Button>
                        ) : null}
                      </ListItem>
                      <Divider component="li" />
                    </React.Fragment>
                  ))}
                </List>
              )}
          </Paper>

          <Accordion
            expanded={payrollExpanded}
            onChange={(_, expanded) => setPayrollExpanded(expanded)}
            sx={{ mt: 3, borderRadius: 2 }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Stack spacing={0.25}>
                <Typography variant="subtitle1" fontWeight={700}>
                  Payroll &amp; compliance
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Exemptions plus recurring payroll defaults for new pay periods.
                </Typography>
              </Stack>
            </AccordionSummary>
            <AccordionDetails>
              <Paper variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 2 }}>
                <Typography fontWeight={700} gutterBottom>
                  TL;DR (When should I use this?)
                </Typography>
                <Typography variant="body2" gutterBottom>
                  US (401k): Leave blank unless this employee should differ from the company default. Canada (RRSP): Fill only if the employee participates in RRSP.
                </Typography>
                <Typography fontWeight={700} gutterBottom>
                  Employee Retirement Settings – Manager Guide
                </Typography>
                <Typography variant="body2" gutterBottom>
                  Managed by you (not employees). Fields shown depend on the employee’s country.
                </Typography>

                <Typography variant="subtitle1" fontWeight={700} sx={{ mt: 1 }}>
                  🇺🇸 United States — 401(k)
                </Typography>
                <Paper variant="outlined" sx={{ p: 1.5, mb: 1 }}>
                  <Typography variant="subtitle2" fontWeight={700}>Do I need to fill this?</Typography>
                  <Typography variant="body2">❌ No, not usually. Leave blank to use the company default.</Typography>
                </Paper>
                <Typography variant="body2" gutterBottom>
                  This is the employee’s 401(k) election. Optional; use only if this employee should differ from the company default.
                  Company defaults live in Payroll → Retirement Plans. Blank here means the company default applies.
                </Typography>
                <Typography variant="body2" gutterBottom>
                  Fill this only if the employee requests a different rate/date or should not follow the default.
                </Typography>
                <Typography variant="subtitle2" fontWeight={700}>
                  Field explanations (US)
                </Typography>
                <Typography variant="body2" gutterBottom>
                  401(k) Contribution (%) — percent withheld from gross. Example: company default 5%, enter 6% → only this employee uses 6%. Blank → company default.
                </Typography>
                <Typography variant="body2" gutterBottom>
                  Employer 401(k) Match (%) — reporting only; does not reduce net pay. Blank → no match tracked.
                </Typography>
                <Typography variant="body2" gutterBottom>
                  Caps apply automatically at the IRS limit; preview shows a warning when capped; contributions resume next year.
                  W-2 is handled automatically (Box 1 reduced; Box 3/5 unchanged; Box 12 code D = total deferral).
                </Typography>
                <Typography variant="body2" gutterBottom>
                  Want to change the default for everyone? Go to Payroll → Retirement Plans.
                </Typography>

                <Typography variant="subtitle1" fontWeight={700} sx={{ mt: 2 }}>
                  🇨🇦 Canada — RRSP
                </Typography>
                <Paper variant="outlined" sx={{ p: 1.5, mb: 1 }}>
                  <Typography variant="subtitle2" fontWeight={700}>Do I need to fill this?</Typography>
                  <Typography variant="body2">✅ Only if the employee contributes to RRSP. Blank means no RRSP contribution.</Typography>
                </Paper>
                <Typography variant="body2" gutterBottom>
                  This sets the employee’s RRSP contribution. No company-wide RRSP default exists.
                  Blank means no RRSP contribution (no fallback).
                </Typography>
                <Typography variant="subtitle2" fontWeight={700}>
                  Field explanations (Canada)
                </Typography>
                <Typography variant="body2" gutterBottom>
                  RRSP Contribution (%) — percent of pay to RRSP. Blank → no contribution.
                </Typography>
                <Typography variant="body2" gutterBottom>
                  Employer RRSP Match (%) — optional; for payroll/reporting if offered.
                </Typography>
                <Typography variant="body2" gutterBottom>
                  RRSP room is per-employee (CRA). Schedulaa does not enforce a company-wide RRSP cap. Enterprise retirement plans apply to U.S. 401(k) only.
                </Typography>

                <Typography variant="subtitle2" fontWeight={700} sx={{ mt: 2 }}>
                  Quick comparison
                </Typography>
                <Typography variant="body2">
                  🇺🇸 USA — Defaults live in Payroll → Retirement Plans; this section is an optional override (often left blank).
                  <br />
                  🇨🇦 Canada — No company default; set RRSP here only if the employee participates.
                </Typography>
              </Paper>

              <Grid container spacing={1} sx={{ mb: 2 }}>
                <Grid item xs={12} md={4}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={Boolean(employee.cpp_exempt)}
                        onChange={(e) =>
                          setEmployee((prev) => (prev ? { ...prev, cpp_exempt: e.target.checked } : prev))
                        }
                      />
                    }
                    label="CPP exempt (Canada)"
                  />
                  <Tooltip title="Employee does not contribute to CPP for this job (e.g., already collecting CPP). CPP will not be withheld or reported.">
                    <Typography variant="caption" color="text.secondary" sx={{ ml: 4 }}>
                      Hover for details
                    </Typography>
                  </Tooltip>
                </Grid>
                <Grid item xs={12} md={4}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={Boolean(employee.ei_exempt)}
                        onChange={(e) =>
                          setEmployee((prev) => (prev ? { ...prev, ei_exempt: e.target.checked } : prev))
                        }
                      />
                    }
                    label="EI exempt (Canada)"
                  />
                  <Tooltip title="Employee is exempt from EI. EI will not be withheld or reported for this employee.">
                    <Typography variant="caption" color="text.secondary" sx={{ ml: 4 }}>
                      Hover for details
                    </Typography>
                  </Tooltip>
                </Grid>
                <Grid item xs={12} md={4}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={Boolean(employee.union_member)}
                        onChange={(e) =>
                          setEmployee((prev) => (prev ? { ...prev, union_member: e.target.checked } : prev))
                        }
                      />
                    }
                    label="Union member"
                  />
                  <Tooltip title="For reporting and pre-filling union dues. Does not change pay by itself.">
                    <Typography variant="caption" color="text.secondary" sx={{ ml: 4 }}>
                      Hover for details
                    </Typography>
                  </Tooltip>
                </Grid>
              </Grid>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                Recurring payroll defaults (per pay period)
              </Typography>
              <Grid container spacing={2}>
                {recurringDefaultFields.map((field) => (
                  <Grid item xs={12} md={4} key={field.name}>
                    <TextField
                      type="number"
                      inputProps={{ step: "0.01", min: "0" }}
                      label={field.label}
                      name={field.name}
                      value={employee[field.name] ?? ""}
                      onChange={(e) =>
                        setEmployee((prev) =>
                          prev ? { ...prev, [field.name]: e.target.value === "" ? "" : Number(e.target.value) } : prev
                        )
                      }
                      fullWidth
                    />
                  </Grid>
                ))}
              </Grid>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                These values auto-fill payroll preview each period. Managers can override per period before finalizing.
              </Typography>

              {isUS && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                    Employee 401(k) Settings
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    401(k) election for this employee. Blank uses the company default (Payroll → Retirement Plans). Fill only if this employee should differ from the default.
                  </Typography>
                  {!retirementPlan && (
                    <Alert severity="warning" sx={{ mb: 2 }}>
                      No retirement plan configured for US. Configure at Settings → Retirement Plans.
                    </Alert>
                  )}
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={3}>
                      <TextField
                        label="Contribution %"
                        type="number"
                        value={retirementElection.contrib_percent}
                        onChange={(e) =>
                          setRetirementElection((prev) => ({
                            ...prev,
                            contrib_percent: e.target.value,
                          }))
                        }
                        fullWidth
                      />
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <TextField
                        label="Contribution flat ($)"
                        type="number"
                        value={retirementElection.contrib_flat}
                        onChange={(e) =>
                          setRetirementElection((prev) => ({
                            ...prev,
                            contrib_flat: e.target.value,
                          }))
                        }
                        fullWidth
                      />
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <FormControl fullWidth>
                        <InputLabel>Type</InputLabel>
                        <Select
                          label="Type"
                          value={retirementElection.contrib_type || "traditional"}
                          onChange={(e) =>
                            setRetirementElection((prev) => ({
                              ...prev,
                              contrib_type: e.target.value,
                            }))
                          }
                        >
                          <MenuItem value="traditional">Traditional</MenuItem>
                          <MenuItem value="roth">Roth</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <TextField
                        label="Effective start date"
                        type="date"
                        value={retirementElection.effective_start_date || ""}
                        onChange={(e) =>
                          setRetirementElection((prev) => ({
                            ...prev,
                            effective_start_date: e.target.value,
                          }))
                        }
                        InputLabelProps={{ shrink: true }}
                        helperText="Election applies starting this date."
                        fullWidth
                      />
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <TextField
                        label="Employer match %"
                        type="number"
                        inputProps={{ min: 0, max: 100 }}
                        value={
                          employee.retirement_employer_percent !== undefined && employee.retirement_employer_percent !== null
                            ? Math.max(0, employee.retirement_employer_percent)
                            : ""
                        }
                        onChange={handleChange}
                        fullWidth
                        InputProps={{
                          endAdornment: (
                            <Tooltip title="Employer 401(k) match percent (reporting only; does not affect net pay). Leave blank if none.">
                              <IconButton size="small">
                                <InfoOutlinedIcon fontSize="inherit" />
                              </IconButton>
                            </Tooltip>
                          ),
                        }}
                      />
                    </Grid>
                  </Grid>
                </>
              )}
            </AccordionDetails>
          </Accordion>

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
