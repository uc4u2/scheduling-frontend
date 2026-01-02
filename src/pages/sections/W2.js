/* eslint-disable react-hooks/exhaustive-deps */
/* W2.js — fixed async-useEffect bug + minor clean-ups */

import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  MenuItem,
  Paper,
  Skeleton,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  Box,
} from "@mui/material";
import ManagementFrame from "../../components/ui/ManagementFrame";
import HistoryIcon from "@mui/icons-material/History";
import DescriptionIcon from "@mui/icons-material/Description";
import RefreshIcon from "@mui/icons-material/Refresh";
import api from "../../utils/api";
import { Viewer } from "@react-pdf-viewer/core";
import "@react-pdf-viewer/core/lib/styles/index.css";
import AuditHistory from "../../components/Stubs/AuditHistory";
import UpgradeNoticeBanner from "../../components/billing/UpgradeNoticeBanner";

/* ─────────── Constants ─────────── */
const THIS_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 6 }, (_, i) => THIS_YEAR - i);

/* ────────────────────────────────────────────────────────── */
/*                  SUB-COMPONENTS / HELPERS                 */
/* ────────────────────────────────────────────────────────── */

// Multi-state / locality rows 15-20
function StateLocalityList({ value = [], onChange }) {
  const handleAdd = () =>
    onChange([
      ...value,
      {
        state_code: "",
        box15: "",
        box16: "",
        box17: "",
        box18: "",
        box19: "",
        box20: "",
      },
    ]);

  const handleRemove = (idx) => onChange(value.filter((_, i) => i !== idx));

  const handleChange = (idx, field, fieldValue) =>
    onChange(
      value.map((row, i) => (i === idx ? { ...row, [field]: fieldValue } : row))
    );

  return (
    <Stack spacing={1}>
      {value.map((row, idx) => (
        <Grid container spacing={1} alignItems="center" key={idx}>
          {[
            ["State", "state_code"],
            ["Box 15", "box15", "number"],
            ["Box 16", "box16", "number"],
            ["Box 17", "box17"],
            ["Box 18", "box18", "number"],
            ["Box 19", "box19", "number"],
            ["Box 20 – Locality", "box20"],
          ].map(([label, field, type = "text"], i) => (
            <Grid item xs={2} key={field}>
              <TextField
                size="small"
                fullWidth
                label={label}
                type={type}
                value={row[field]}
                onChange={(e) => handleChange(idx, field, e.target.value)}
              />
            </Grid>
          ))}
          <Grid item>
            <Button
              color="error"
              size="small"
              onClick={() => handleRemove(idx)}
            >
              Delete
            </Button>
          </Grid>
        </Grid>
      ))}
      <Button onClick={handleAdd} variant="outlined" size="small">
        + Add State/Locality
      </Button>
    </Stack>
  );
}

// Create / Edit W-2 modal
const W2FormDialog = ({ open, form, setForm, onClose, onSave, isNew }) => {
  if (!form) return null;
  const jb = form.json_boxes || {};

  const handleBox13 = (key) => (e) =>
    setForm({
      ...form,
      json_boxes: { ...jb, [key]: e.target.checked ? "Yes" : "" },
    });

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isNew ? "Create W-2 Form" : "Edit W-2 Form"}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} mt={2}>
          <TextField label="Year" value={form.year || ""} disabled fullWidth />
          <TextField
            label="Employee ID"
            value={form.employee_id || ""}
            disabled
            fullWidth
          />
          <TextField
            label="Control Number"
            value={jb.control_number || ""}
            fullWidth
            onChange={(e) =>
              setForm({
                ...form,
                json_boxes: { ...jb, control_number: e.target.value },
              })
            }
          />
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 14, 16, 17].map((num) => (
            <TextField
              key={num}
              fullWidth
              type={num >= 9 && num <= 11 ? "text" : "number"}
              label={`Box ${num}`}
              value={jb[`box${num}`] ?? ""}
              onChange={(e) =>
                setForm({
                  ...form,
                  json_boxes: {
                    ...jb,
                    [`box${num}`]:
                      num >= 9 && num <= 11
                        ? e.target.value
                        : parseFloat(e.target.value) || "",
                  },
                })
              }
            />
          ))}
          <Stack direction="row" spacing={3} alignItems="center">
            {[
              ["box13_statutory_employee", "Statutory Employee"],
              ["box13_retirement_plan", "Retirement Plan"],
              ["box13_sick_pay", "Third-party Sick Pay"],
            ].map(([key, label]) => (
              <label key={key}>
                <input
                  type="checkbox"
                  checked={jb[key] === "Yes"}
                  onChange={handleBox13(key)}
                />{" "}
                {label}
              </label>
            ))}
          </Stack>
          <StateLocalityList
            value={form.state_localities || []}
            onChange={(arr) => setForm({ ...form, state_localities: arr })}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={onSave}>
          {isNew ? "Create" : "Save Changes"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

/* ────────────────────────────────────────────────────────── */
/*                        MAIN COMPONENT                      */
/* ────────────────────────────────────────────────────────── */
const W2 = ({ token }) => {
  /* Global data */
  const [year, setYear] = useState(THIS_YEAR);
  const [recruiters, setRecruiters] = useState([]);
  const [departments, setDepartments] = useState([]); // 🚩 NEW
  const [selectedDepartment, setSelectedDepartment] = useState(""); // 🚩 NEW
  const [forms, setForms] = useState([]);

  /* Filters */
  const [selectedEmployee, setSelectedEmployee] = useState("");

  /* UI state */
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [pdfUrl, setPdfUrl] = useState(null);
  const [txtUrl, setTxtUrl] = useState(null);
  const [showAudit, setShowAudit] = useState({ open: false, id: null });

  /* Edit / Create dialogs */
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editForm, setEditForm] = useState(null);

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createForm, setCreateForm] = useState(null);

  /* Summary / pre-fill */
  const [w2Summary, setW2Summary] = useState(null);

  const auth = { headers: { Authorization: `Bearer ${token}` } };

  /* ───────── Fetchers ───────── */
  const fetchRecruiters = async () => {
    try {
      const res = await api.get(`/manager/recruiters`, auth);
      setRecruiters(res.data.recruiters || []);
    } catch {
      setErr("Failed to load recruiters.");
    }
  };

  /* 🚩 NEW: fetch departments */
  const fetchDepartments = async () => {
    try {
      const res = await api.get(`/api/departments`, auth);
      setDepartments(res.data || []);
    } catch {
      setErr("Failed to load departments.");
    }
  };

  const fetchForms = async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({
        year,
        ...(selectedEmployee ? { employee_id: selectedEmployee } : {}),
      }).toString();
      const { data } = await api.get(`/yearend/w2/list?${qs}`, auth);
      setForms(data || []);
    } catch {
      setErr("Failed to fetch W-2 forms.");
    } finally {
      setLoading(false);
    }
  };

  const fetchW2Summary = async () => {
    if (!selectedEmployee) {
      setW2Summary(null);
      return;
    }
    try {
      const { data } = await api.get(
        `/yearend/w2/summary/${selectedEmployee}?year=${year}`,
        auth
      );
      setW2Summary(data);
      setCreateForm({
        employee_id: data.employee.id,
        year,
        json_boxes: { ...data.box_summary },
        state_localities: [],
      });
    } catch {
      setW2Summary(null);
    }
  };

  /* ───────── Effects ───────── */
  useEffect(() => {
    fetchRecruiters();
    fetchDepartments(); // 🚩 NEW
  }, []);

  useEffect(() => {
    fetchForms();
  }, [year, selectedEmployee]);

  useEffect(() => {
    fetchW2Summary();
  }, [year, selectedEmployee]);

  /* ───────── Derived data ───────── */

  /* 🚩 NEW: filtered recruiters by selected department */
  const filteredRecruiters = useMemo(() => {
    return selectedDepartment
      ? recruiters.filter((r) => String(r.department_id) === selectedDepartment)
      : recruiters;
  }, [recruiters, selectedDepartment]);

  /* 🚩 NEW: reset selected employee if not in filtered recruiters */
  useEffect(() => {
    if (
      selectedEmployee &&
      !filteredRecruiters.some((r) => String(r.id) === selectedEmployee)
    ) {
      setSelectedEmployee("");
    }
  }, [filteredRecruiters, selectedEmployee]);

  /* ───────── Handlers ───────── */

  const handleDepartmentChange = (e) => {
    setSelectedDepartment(e.target.value);
    setSelectedEmployee(""); // reset employee on department change
  };

  /* ───────── Actions ───────── */
  const updateStatus = async (id, status) => {
    try {
      await api.put(`/yearend/w2/${id}/update`, { status }, auth);

      setMsg(`Form ${id} ${status}.`);
      fetchForms();
    } catch {
      setErr("Status update failed.");
    }
  };

  const issueForm = (row) => updateStatus(row.id, "issued");

  const exportPDF = async (id) => {
    try {
      const { data } = await api.get(
        `/yearend/w2/${id}/export-pdf`,
        { ...auth, responseType: "blob" }
      );
      setPdfUrl(
        URL.createObjectURL(new Blob([data], { type: "application/pdf" }))
      );
    } catch {
      setErr("PDF export failed.");
    }
  };

  const exportBatchTxt = async () => {
    try {
      const { data } = await api.post(
        `/yearend/w2/generate-efw2`,
        { year },
        auth
      );
      const response = await api.get(
        data.download_url,
        { ...auth, responseType: "blob" }
      );
      setTxtUrl(URL.createObjectURL(new Blob([response.data])));
      setMsg("EFW2 file generated successfully.");
    } catch {
      setErr("EFW2 export failed.");
    }
  };

  const downloadPDFZip = async () => {
    try {
      const { data } = await api.get(
        `/yearend/w2/${year}/download-batch`,
        { ...auth, responseType: "blob" }
      );
      const url = URL.createObjectURL(new Blob([data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `w2_batch_${year}.zip`;
      a.click();
    } catch {
      setErr("ZIP download failed.");
    }
  };

  const deleteForm = async (row) => {
    if (row.status === "issued") {
      setErr("Issued W-2 forms cannot be deleted.");
      return;
    }
    if (!window.confirm(`Delete W-2 Form ID ${row.id}?`)) return;
    try {
      await api.delete(`/yearend/w2/${row.id}/delete`, auth);
      setMsg(`Form ${row.id} deleted.`);
      fetchForms();
    } catch {
      setErr("Delete failed.");
    }
  };

  /* ───────── Derived rows ───────── */
  const rows = useMemo(
    () =>
      forms.map((f) => ({
        ...f,
        employee:
          recruiters.find((r) => r.id === f.employee_id)
            ? `${recruiters.find((r) => r.id === f.employee_id).first_name} ${recruiters.find((r) => r.id === f.employee_id).last_name}`
            : f.employee_name || "-",
        json_boxes: f.json_boxes || {},
      })),
    [forms, recruiters]
  );

  /* ───────── Sub-components ───────── */
  const PDFModal = ({ url, onClose }) => (
    <Dialog open={!!url} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>W-2 PDF Preview</DialogTitle>
      <DialogContent sx={{ height: "80vh" }}>
        {url && <Viewer fileUrl={url} />}
      </DialogContent>
      <DialogActions>
        <Button
          variant="contained"
          onClick={() => {
            const a = document.createElement("a");
            a.href = url;
            a.download = "w2_form.pdf";
            a.click();
          }}
        >
          Download PDF
        </Button>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );

  /* ───────── Render ───────── */
  return (
    <ManagementFrame title="W-2 Forms" subtitle="Prepare and preview U.S. W‑2 forms for the selected tax year.">
    <UpgradeNoticeBanner
      requiredPlan="business"
      message="Compliance documents (W‑2) require the Business plan."
    />
    <Box
      sx={{ p: 2 }}
    >
      <Typography variant="h4" gutterBottom>
        W-2 Forms (USA)
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Schedulaa assigns payroll to a tax year using the pay period end date. Cross‑year periods with an end date in January appear in that new year’s W‑2.
      </Typography>

      {/* Toasts */}
      {err && (
        <Snackbar open autoHideDuration={8000} onClose={() => setErr("")}>
          <Alert severity="error">{err}</Alert>
        </Snackbar>
      )}
      {msg && (
        <Snackbar open autoHideDuration={6000} onClose={() => setMsg("")}>
          <Alert severity="success">{msg}</Alert>
        </Snackbar>
      )}

      {/* Header controls */}
      <Paper variant="outlined" sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              select
              label="Tax Year"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
            >
              {YEARS.map((y) => (
                <MenuItem key={y} value={y}>
                  {y}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* 🚩 NEW: Department Dropdown */}
          <Grid item xs={12} sm={3}>
            <TextField
              select
              fullWidth
              label="Department"
              value={selectedDepartment}
              onChange={handleDepartmentChange}
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
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <TextField
              select
              fullWidth
              label="Employee"
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
            >
              <MenuItem value="">
                <em>All employees</em>
              </MenuItem>
              {filteredRecruiters.map((r) => (
                <MenuItem key={r.id} value={String(r.id)}>
                  {r.first_name} {r.last_name} ({r.email})
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs>
            <Stack direction="row" spacing={2} flexWrap="wrap">
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={fetchForms}
              >
                Refresh
              </Button>
              <Button variant="outlined" onClick={exportBatchTxt}>
                Export EFW2 Batch
              </Button>
              <Button variant="outlined" onClick={downloadPDFZip}>
                Download PDF ZIP
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      {/* W-2 Summary / Prefill */}
      {w2Summary && (
        <Paper sx={{ mb: 3, p: 2, bgcolor: "#f6fbff" }} variant="outlined">
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={3}
            alignItems="center"
          >
            <Stack spacing={0.5}>
              <Typography variant="subtitle2">Employee:</Typography>
              <Typography>
                {w2Summary.employee.name} (
                {w2Summary.employee.ssn || "No SSN"})
              </Typography>
              <Typography variant="body2">
                Address: {w2Summary.employee.address || "-"}
              </Typography>
            </Stack>
            <Stack spacing={0.5}>
              <Typography variant="subtitle2">Company:</Typography>
              <Typography>
                {w2Summary.company.name} (
                {w2Summary.company.employer_ein || "No EIN"})
              </Typography>
              <Typography variant="body2">
                Address: {w2Summary.company.address || "-"}
              </Typography>
            </Stack>
            <Stack>
              <Typography variant="subtitle2">Pre-Filled:</Typography>
              <Typography variant="body2">
                Box 1: {w2Summary.box_summary.box1} | Box 2:{" "}
                {w2Summary.box_summary.box2} | Box 3:{" "}
                {w2Summary.box_summary.box3} | Box 5:{" "}
                {w2Summary.box_summary.box5}
              </Typography>
            </Stack>
            <Button
              variant="contained"
              color="success"
              onClick={() => setShowCreateDialog(true)}
            >
              Create New W-2
            </Button>
          </Stack>
        </Paper>
      )}

      {/* Table */}
      {loading ? (
        <Skeleton height={400} variant="rectangular" />
      ) : (
        <TableContainer component={Paper} variant="outlined" sx={{ mb: 8 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                {[
                  ["ID", 60],
                  ["Employee", 220],
                  ["Box 1 Wages", 110],
                  ["Box 2 Fed Tax", 110],
                  ["Box 3 SS Wages", 110],
                  ["Box 5 Med Wages", 110],
                  ["State/Localities", 180],
                  ["Status", 90],
                  ["Actions", 430],
                ].map(([label, w]) => (
                  <TableCell key={label} align="center" sx={{ width: w }}>
                    {label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    No W-2 forms found.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell align="center">{row.id}</TableCell>
                    <TableCell>{row.employee}</TableCell>
                    <TableCell align="center">
                      {row.json_boxes?.box1 ?? "-"}
                    </TableCell>
                    <TableCell align="center">
                      {row.json_boxes?.box2 ?? "-"}
                    </TableCell>
                    <TableCell align="center">
                      {row.json_boxes?.box3 ?? "-"}
                    </TableCell>
                    <TableCell align="center">
                      {row.json_boxes?.box5 ?? "-"}
                    </TableCell>
                    <TableCell align="center">
                      {(row.state_localities || []).map((sl, i) => (
                        <span key={i}>
                          {sl.state_code}-{sl.box20 || "No loc"}: {sl.box15} /
                          {sl.box16}
                          <br />
                        </span>
                      ))}
                    </TableCell>
                    <TableCell align="center">
                      <strong
                        style={{
                          color:
                            row.status === "issued"
                              ? "green"
                              : row.status === "approved"
                              ? "orange"
                              : row.status === "rejected"
                              ? "red"
                              : "gray",
                        }}
                      >
                        {row.status}
                      </strong>
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
                              setShowAudit({ open: true, id: row.id })
                            }
                          >
                            <HistoryIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Preview/Download PDF">
                          <IconButton
                            size="small"
                            onClick={() => exportPDF(row.id)}
                          >
                            <DescriptionIcon />
                          </IconButton>
                        </Tooltip>

                        {row.status === "approved" && (
                          <Button
                            size="small"
                            color="success"
                            onClick={() => issueForm(row)}
                          >
                            Issue
                          </Button>
                        )}

                        <Button
                          size="small"
                          color="primary"
                          onClick={() => {
                            setEditForm(row);
                            setShowEditDialog(true);
                          }}
                        >
                          Edit
                        </Button>

                        <>
                          <Button
                            size="small"
                            onClick={() => updateStatus(row.id, "approved")}
                          >
                            Approve
                          </Button>
                          <Button
                            size="small"
                            color="warning"
                            onClick={() => updateStatus(row.id, "rejected")}
                          >
                            Reject
                          </Button>
                          {row.status !== "issued" && (
                            <Button
                              size="small"
                              color="error"
                              onClick={() => deleteForm(row)}
                            >
                              Delete
                            </Button>
                          )}
                        </>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* PDF preview */}
      <PDFModal url={pdfUrl} onClose={() => setPdfUrl(null)} />

      {/* EFW2 download */}
      <Dialog open={!!txtUrl} onClose={() => setTxtUrl(null)}>
        <DialogTitle>Download EFW2 Text</DialogTitle>
        <DialogActions>
          <Button
            variant="contained"
            onClick={() => {
              const a = document.createElement("a");
              a.href = txtUrl;
              a.download = `w2_${year}.txt`;
              a.click();
              setTxtUrl(null);
            }}
          >
            Download
          </Button>
          <Button onClick={() => setTxtUrl(null)}>Cancel</Button>
        </DialogActions>
      </Dialog>

      {/* Audit history */}
      <Dialog
        open={showAudit.open}
        onClose={() => setShowAudit({ open: false, id: null })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>W-2 Audit History</DialogTitle>
        <DialogContent>
          {showAudit.id && (
            <AuditHistory recordType="w2" recordId={showAudit.id} />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAudit({ open: false, id: null })}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit / Create dialogs */}
      <W2FormDialog
        open={showEditDialog}
        form={editForm}
        setForm={setEditForm}
        onClose={() => setShowEditDialog(false)}
        onSave={async () => {
          try {
            await api.put(
              `/yearend/w2/${editForm.id}/update`,
              editForm,
              auth
            );
            setMsg("Form updated successfully.");
            setShowEditDialog(false);
            fetchForms();
          } catch {
            setErr("Update failed.");
          }
        }}
        isNew={false}
      />

      <W2FormDialog
        open={showCreateDialog}
        form={createForm}
        setForm={setCreateForm}
        onClose={() => setShowCreateDialog(false)}
        onSave={async () => {
          try {
            await api.post(`/yearend/w2/create`, createForm, auth);
            setMsg("Form created successfully.");
            setShowCreateDialog(false);
            fetchForms();
          } catch {
            setErr("Create failed.");
          }
        }}
        isNew={true}
      />
    </Box>
    </ManagementFrame>
  );
};

export default W2;

