/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid,
  IconButton,
  MenuItem,
  Paper,
  Snackbar,
  Stack,
  TextField,
  Tooltip,
  Typography,
  Alert,
  Skeleton,
} from "@mui/material";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import HistoryIcon from "@mui/icons-material/History";
import DescriptionIcon from "@mui/icons-material/Description";
import api from "../../utils/api";
import { Viewer } from "@react-pdf-viewer/core";
import "@react-pdf-viewer/core/lib/styles/index.css";
import AuditHistory from "../../components/Stubs/AuditHistory";
import ManagementFrame from "../../components/ui/ManagementFrame";
import UpgradeNoticeBanner from "../../components/billing/UpgradeNoticeBanner";

/* ───────────────────────────────────────────────────────────── */
/*                             DATA                             */
/* ───────────────────────────────────────────────────────────── */

const US_STATES = ["CA", "TX", "FL", "WA", "IL", "NY", "GA", "PA", "OH", "NC"];
const CANADA_PROVINCES = [
  "ON",
  "QC",
  "BC",
  "AB",
  "MB",
  "NB",
  "NL",
  "NS",
  "PE",
  "SK",
];

/* 🚩 NEW: helper – pick Canada vs USA from recruiter object */
const recruiterCountry = (rec) =>
  rec?.country?.toLowerCase().includes("us") ? "USA" : "Canada";

const ROE = ({ token }) => {
  /* ────────── Global state ────────── */
  const [country, setCountry] = useState("Canada");
  const [regionList, setRegionList] = useState(CANADA_PROVINCES);

  /* Recruiters, Departments & ROE lists */
  const [recruiters, setRecruiters] = useState([]);
  const [departments, setDepartments] = useState([]);           // 🚩 NEW
  const [roeData, setRoeData] = useState([]);

  /* Filters / search */
  const [selectedDepartment, setSelectedDepartment] = useState(""); // 🚩 NEW
  const [selectedRecruiter, setSelectedRecruiter] = useState("");

  /* Loading / UI flags */
  const [isLoadingRoeList, setIsLoadingRoeList] = useState(true);
  const [loading, setLoading] = useState(false); // employee summary spinner

  /* Form for new-ROE */
  const [form, setForm] = useState({
    recruiter_id: "",
    last_day: "",
    hours: "",
    pay: "",
    reason: "",
    sin: "",
    employment_type: "Full-time",
    province: "ON",
    ei_deductions: true,
    cpp_qpp_deductions: true,
    income_tax_deductions: true,
  });

  /* Misc UI state */
  const [employeeInfo, setEmployeeInfo] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pdfUrl, setPdfUrl] = useState(null);
  const [xmlUrl, setXmlUrl] = useState(null);
  const [showAudit, setShowAudit] = useState({ open: false, roeId: null });

  /* ────────── Helpers ────────── */

  const fetchRecruiters = async () => {
    try {
      const res = await api.get(`/manager/recruiters`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRecruiters(res.data.recruiters || []);
    } catch {
      setError("Failed to load recruiters.");
    }
  };

  /* 🚩 NEW: fetch departments */
  const fetchDepartments = async () => {
    try {
      const res = await api.get(`/api/departments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDepartments(res.data || []);
    } catch {
      setError("Failed to load departments.");
    }
  };

  const fetchRoeList = async () => {
    setIsLoadingRoeList(true);
    try {
      const res = await api.get(`/roe/list`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRoeData(res.data || []);
    } catch {
      setError("Failed to fetch ROEs.");
    } finally {
      setIsLoadingRoeList(false);
    }
  };

  const fetchEmployeeSummary = async (recruiterId) => {
    setLoading(true);
    setEmployeeInfo(null);
    try {
      const res = await api.get(`/roe/summary/${recruiterId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEmployeeInfo(res.data);
      if (res.data) {
        setForm((f) => ({
          ...f,
          recruiter_id: recruiterId,
          hours: res.data.paystub?.hours_worked || "",
          pay: res.data.paystub?.gross_pay || "",
          sin: res.data.employee?.sin || "",
          province: res.data.employee?.province || f.province,
          employment_type: res.data.roe?.employment_type || "Full-time",
        }));
      }
    } catch {
      setError("Could not load employee summary/info.");
    } finally {
      setLoading(false);
    }
  };

  /* ────────── Effects ────────── */

  /* 🚩 CHANGED: keep valid province when country toggles */
  useEffect(() => {
    if (country === "USA") {
      setRegionList(US_STATES);
      setForm((f) => ({
        ...f,
        province: US_STATES.includes(f.province) ? f.province : US_STATES[0],
      }));
    } else {
      setRegionList(CANADA_PROVINCES);
      setForm((f) => ({
        ...f,
        province: CANADA_PROVINCES.includes(f.province)
          ? f.province
          : CANADA_PROVINCES[0],
      }));
    }
  }, [country]);

  /* 🚩 CHANGED: fetch recruiters, departments, ROEs on mount */
  useEffect(() => {
    fetchRecruiters();
    fetchDepartments();   // 🚩 NEW
    fetchRoeList();
  }, []);

  /* ────────── Derived data ────────── */

  /* 🚩 NEW: filtered recruiters by selected department */
  const filteredRecruiters = useMemo(() => {
    return selectedDepartment
      ? recruiters.filter(
          (r) => String(r.department_id) === selectedDepartment
        )
      : recruiters;
  }, [recruiters, selectedDepartment]);

  /* 🚩 CHANGED: filter ROEs by filtered recruiters */
  const visibleROEs = useMemo(() => {
    if (!filteredRecruiters.length) return [];
    const recruiterIds = filteredRecruiters.map((r) => String(r.id));
    return roeData.filter((r) => {
      const rawId =
        r.recruiter_id ??
        r.recruiterId ??
        (typeof r.recruiter === "object" ? r.recruiter?.id : r.recruiter) ??
        null;
      return rawId !== null && recruiterIds.includes(String(rawId));
    });
  }, [roeData, filteredRecruiters]);

  /* ────────── Handlers ────────── */

  /* 🚩 NEW: reset recruiter & employee info on department change */
  const handleDepartmentChange = (e) => {
    const deptId = e.target.value;
    setSelectedDepartment(deptId);
    setSelectedRecruiter("");
    setEmployeeInfo(null);
  };

  /* 🚩 CHANGED: auto-set country & province when employee picked */
  const handleSelectChange = (e) => {
    const recruiterId = String(e.target.value);
    setSelectedRecruiter(recruiterId);
    setForm((f) => ({ ...f, recruiter_id: recruiterId }));

    const rec = recruiters.find((r) => String(r.id) === recruiterId);
    if (rec) {
      const recCountry = recruiterCountry(rec); // "USA" or "Canada"
      const recProv =
        rec.province ||
        (recCountry === "USA" ? US_STATES[0] : CANADA_PROVINCES[0]);

      /* province first so it's present before list changes */
      setForm((f) => ({ ...f, province: recProv }));

      /* defer country change so regionList updates after province set */
      setTimeout(() => setCountry(recCountry), 0);
    }

    recruiterId ? fetchEmployeeSummary(recruiterId) : setEmployeeInfo(null);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post(
        `/roe/create`,
        { ...form, country },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setMessage("ROE successfully created.");
      setError("");
      await fetchRoeList();
      setSelectedRecruiter(form.recruiter_id);
    } catch {
      setError("Failed to create ROE.");
      setMessage("");
    } finally {
      setLoading(false);
    }
  };

  const handleCountryChange = (e) => setCountry(e.target.value);

  const handleExport = async (id) => {
    try {
      const res = await api.get(`/roe/${id}/export-pdf`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(
        new Blob([res.data], { type: "application/pdf" })
      );
      setPdfUrl(url);
    } catch {
      setError("Failed to export PDF.");
    }
  };

  const handleExportXML = async (id) => {
    try {
      const res = await api.get(`/roe/${id}/export-xml`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(
        new Blob([res.data], { type: "application/xml" })
      );
      setXmlUrl(url);
    } catch {
      setError("Failed to export XML.");
    }
  };

  const handleDownloadXML = () => {
    if (!xmlUrl) return;
    const a = document.createElement("a");
    a.href = xmlUrl;
    a.download = "roe.xml";
    a.click();
    setXmlUrl(null);
  };

  const updateRoeStatus = async (roeId, status) => {
    try {
      await api.put(
        `/roe/${roeId}/update-status`,
        {
          status,
          comment: status === "rejected" ? "Rejected by manager" : "",
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchRoeList();
      setMessage(`ROE ${roeId} marked as ${status}.`);
      setError("");
    } catch {
      setError("Failed to update ROE status.");
      setMessage("");
    }
  };

  const deleteRoe = async (roeId) => {
    try {
      await api.delete(`/roe/${roeId}/delete`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchRoeList();
      setMessage(`ROE ${roeId} deleted.`);
    } catch {
      setError("Failed to delete ROE.");
    }
  };

  /* ────────── UI sub-components ────────── */

  const PDFModal = ({ fileUrl, onClose }) => (
    <Dialog open={!!fileUrl} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>ROE PDF Preview</DialogTitle>
      <DialogContent sx={{ height: "80vh" }}>
        <Viewer fileUrl={fileUrl} />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );

  /* ────────── RENDER ────────── */

  return (
  <ManagementFrame title="Record of Employment" subtitle="Generate and manage Records of Employment for departing employees.">
    <UpgradeNoticeBanner
      requiredPlan="business"
      message="Compliance documents (ROE) require the Business plan."
    />
    <Box
      maxWidth="lg"
      disableGutters
      sx={{ p: 2 }}
    >
      <Typography variant="h4" gutterBottom>
        Record&nbsp;of&nbsp;Employment&nbsp;(ROE)
      </Typography>

      {error && (
        <Snackbar open autoHideDuration={8000} onClose={() => setError("")}>
          <Alert severity="error" sx={{ width: "100%" }} onClose={() => setError("")}>
            {error}
          </Alert>
        </Snackbar>
      )}
      {message && (
        <Snackbar open autoHideDuration={6000} onClose={() => setMessage("")}>
          <Alert
            severity="success"
            sx={{ width: "100%" }}
            onClose={() => setMessage("")}
          >
            {message}
          </Alert>
        </Snackbar>
      )}

      {/* ────────── Employee selection ────────── */}
      <Paper variant="outlined" sx={{ p: 3, mb: 5 }}>
        <Typography variant="h6" gutterBottom>
          Select&nbsp;Employee
        </Typography>

        {/* 🚩 NEW: Department selector */}
        <TextField
          select
          label="Department"
          value={selectedDepartment}
          onChange={handleDepartmentChange}
          fullWidth
          sx={{ mb: 2 }}
        >
          <MenuItem value="">
            <em>All Departments</em>
          </MenuItem>
          {departments.map((d) => (
            <MenuItem key={d.id} value={String(d.id)}>
              {d.name}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          label="Employee"
          value={selectedRecruiter}
          onChange={handleSelectChange}
          fullWidth
          required
          sx={{ mb: 3 }}
        >
          <MenuItem value="">
            <em>None</em>
          </MenuItem>
          {filteredRecruiters.map((r) => (
            <MenuItem key={r.id} value={r.id}>
              {r.name || `${r.first_name || ""} ${r.last_name || ""}`.trim() || r.email || `#${r.id}`}
            </MenuItem>
          ))}
        </TextField>

        {loading && <CircularProgress />}

        {employeeInfo && (
          <Box mt={3}>
            <Typography variant="h6" gutterBottom>
              Employee&nbsp;Info
            </Typography>
            <Grid container spacing={1}>
              {[
                ["Name", employeeInfo.employee?.name],
                ["Email", employeeInfo.employee?.email],
                ["Role", employeeInfo.employee?.role],
                ["SIN", employeeInfo.employee?.sin],
                ["Status", employeeInfo.employee?.status],
                ["Province/State", employeeInfo.employee?.province],
                ["Last Day", employeeInfo.roe?.last_day],
                ["Latest Hours Worked", employeeInfo.paystub?.hours_worked],
                ["Latest EI", `$${employeeInfo.paystub?.ei}`],
                ["Latest CPP", `$${employeeInfo.paystub?.cpp}`],
                ["Latest Net Pay", `$${employeeInfo.paystub?.net_pay}`],
                ["Latest Gross Pay", `$${employeeInfo.paystub?.gross_pay}`],
                ["Hiring Date", employeeInfo.employee?.hire_date],
              ].map(([label, value]) => (
                <Grid key={label} item xs={12} sm={6} md={4}>
                  <Typography variant="body2" fontWeight="bold">
                    {label}:
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {value ?? "-"}
                  </Typography>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
      </Paper>

      {/* ────────── New ROE form ────────── */}
      <Paper variant="outlined" sx={{ p: 3, mb: 5 }}>
        <Typography variant="h6" gutterBottom>
          New&nbsp;ROE
        </Typography>

        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4} md={3}>
              <TextField
                select
                label="Country"
                value={country}
                onChange={handleCountryChange}
                fullWidth
              >
                <MenuItem value="Canada">Canada</MenuItem>
                <MenuItem value="USA">USA</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} sm={4} md={3}>
              <TextField
                select
                label={country === "USA" ? "State" : "Province"}
                name="province"
                value={form.province}
                onChange={handleChange}
                fullWidth
              >
                {regionList.map((r) => (
                  <MenuItem key={r} value={r}>
                    {r}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} sm={4} md={3}>
              <TextField
                select
                label="Employment Type"
                name="employment_type"
                value={form.employment_type}
                onChange={handleChange}
                fullWidth
              >
                <MenuItem value="Full-time">Full-time</MenuItem>
                <MenuItem value="Part-time">Part-time</MenuItem>
                <MenuItem value="Contract">Contract</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <TextField
                label="Last Day"
                type="date"
                name="last_day"
                value={form.last_day}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
                fullWidth
                required
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <TextField
                label="Total Hours"
                type="number"
                name="hours"
                value={form.hours}
                onChange={handleChange}
                fullWidth
                required
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <TextField
                label="Total Pay"
                type="number"
                name="pay"
                value={form.pay}
                onChange={handleChange}
                fullWidth
                required
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label="Reason"
                name="reason"
                value={form.reason}
                onChange={handleChange}
                fullWidth
                required
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label="SIN"
                name="sin"
                value={form.sin}
                onChange={handleChange}
                fullWidth
              />
            </Grid>

            <Grid item xs={12}>
              <Stack direction="row" spacing={2}>
                <FormControlLabel
                  control={
                    <Checkbox
                      name="ei_deductions"
                      checked={form.ei_deductions}
                      onChange={handleChange}
                    />
                  }
                  label="EI"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      name="cpp_qpp_deductions"
                      checked={form.cpp_qpp_deductions}
                      onChange={handleChange}
                    />
                  }
                  label="CPP/QPP"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      name="income_tax_deductions"
                      checked={form.income_tax_deductions}
                      onChange={handleChange}
                    />
                  }
                  label="Income Tax"
                />
              </Stack>
            </Grid>

            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : "Create ROE"}
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      {/* ────────── ROE Table ────────── */}
      <Typography variant="h6" gutterBottom>
        Existing&nbsp;ROEs
      </Typography>

      {isLoadingRoeList ? (
        <Skeleton variant="rectangular" width="100%" height={400} />
      ) : (
        <TableContainer component={Paper} variant="outlined" sx={{ mb: 8 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                {[
                  ["ID", 70],
                  ["Employee", 220],
                  ["Last Day", 120],
                  ["Hours", 90],
                  ["Pay", 100],
                  ["Status", 100],
                  ["Issued", 120],
                  ["Actions", 280],
                ].map(([label, width]) => (
                  <TableCell
                    key={label}
                    align="center"
                    sx={{ width, fontWeight: "bold" }}
                  >
                    {label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>

            <TableBody>
              {visibleROEs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    {filteredRecruiters.length
                      ? "No ROE found for this employee."
                      : "Select an employee to view their ROEs."}
                  </TableCell>
                </TableRow>
              ) : (
                visibleROEs.map((row) => {
                  const recruiterName =
                    recruiters.find(
                      (r) => String(r.id) === String(row.recruiter_id)
                    )?.name ||
                    recruiters.find(
                      (r) => String(r.id) === String(row.recruiterId)
                    )?.name ||
                    (typeof row.recruiter === "object"
                      ? row.recruiter?.name
                      : row.recruiter_id) ||
                    "-";

                  return (
                    <TableRow key={row.id} hover>
                      <TableCell align="center">{row.id}</TableCell>
                      <TableCell
                        align="left"
                        sx={{
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {recruiterName}
                      </TableCell>
                      <TableCell align="center">{row.last_day}</TableCell>
                      <TableCell align="center">{row.hours}</TableCell>
                      <TableCell align="center">{row.pay}</TableCell>
                      <TableCell align="center">
                        <strong
                          style={{
                            color:
                              row.status === "approved"
                                ? "green"
                                : row.status === "rejected"
                                ? "red"
                                : "orange",
                          }}
                        >
                          {row.status}
                        </strong>
                      </TableCell>
                      <TableCell align="center">
                        {row.issued_at
                          ? new Date(row.issued_at).toLocaleDateString()
                          : "-"}
                      </TableCell>
                      <TableCell align="center">
                        <Stack
                          direction="row"
                          spacing={1}
                          justifyContent="center"
                          flexWrap="wrap"
                        >
                          <Tooltip title="Audit Trail">
                            <IconButton
                              size="small"
                              onClick={() =>
                                setShowAudit({ open: true, roeId: row.id })
                              }
                            >
                              <HistoryIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>

                          {row.status === "approved" && (
                            <>
                              <Tooltip title="PDF">
                                <IconButton
                                  size="small"
                                  onClick={() => handleExport(row.id)}
                                >
                                  <DescriptionIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="XML">
                                <IconButton
                                  size="small"
                                  onClick={() => handleExportXML(row.id)}
                                >
                                  <DescriptionIcon color="info" />
                                </IconButton>
                              </Tooltip>
                            </>
                          )}

                          <Button
                            size="small"
                            onClick={() => updateRoeStatus(row.id, "approved")}
                          >
                            Approve
                          </Button>
                          <Button
                            size="small"
                            color="warning"
                            onClick={() => updateRoeStatus(row.id, "rejected")}
                          >
                            Reject
                          </Button>
                          <Button
                            size="small"
                            color="error"
                            onClick={() => deleteRoe(row.id)}
                          >
                            Delete
                          </Button>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* ────────── Modals ────────── */}
      <PDFModal fileUrl={pdfUrl} onClose={() => setPdfUrl(null)} />

      <Dialog open={!!xmlUrl} onClose={() => setXmlUrl(null)}>
        <DialogTitle>Download ROE XML</DialogTitle>
        <DialogActions>
          <Button onClick={handleDownloadXML} variant="contained">
            Download
          </Button>
          <Button onClick={() => setXmlUrl(null)}>Cancel</Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={showAudit.open}
        onClose={() => setShowAudit({ open: false, roeId: null })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>ROE Audit History</DialogTitle>
        <DialogContent>
          {showAudit.roeId && (
            <AuditHistory recordType="roe" recordId={showAudit.roeId} />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAudit({ open: false, roeId: null })}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  </ManagementFrame>
);
};

export default ROE;
