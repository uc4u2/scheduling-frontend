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
} from "@mui/material";
import axios from "axios";
import { useTranslation } from "react-i18next";
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

  const [departments, setDepartments] = useState([]);
  const [departmentFilter, setDepartmentFilter] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [perPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

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
                value={employee.department_id || ""}
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
                  } else if (employee?.country === "USA") {
                    value = raw.replace(/[^0-9-]/g, "");
                    if (value.length > 5 && !value.includes("-")) {
                      value = `${value.slice(0, 5)}-${value.slice(5, 9)}`;
                    }
                  }
                  setEmployee((prev) => (prev ? { ...prev, address_zip: value } : prev));
                }}
                fullWidth
                inputProps={{
                  maxLength: isCanada ? 7 : 10,
                  pattern: isCanada ? "[A-Z][0-9][A-Z] [0-9][A-Z][0-9]" : "\\d{5}(-\\d{4})?",
                  title: postalTitle,
                }}
                helperText={postalHelper}
              />
            </Grid>
          </Grid>

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
