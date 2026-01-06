/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Checkbox,
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
import DescriptionIcon from "@mui/icons-material/Description";
import HistoryIcon from "@mui/icons-material/History";
import RefreshIcon from "@mui/icons-material/Refresh";
import VisibilityIcon from "@mui/icons-material/Visibility";
import api from "../../utils/api";
import { Viewer } from "@react-pdf-viewer/core";
import "@react-pdf-viewer/core/lib/styles/index.css";
import AuditHistory from "../../components/Stubs/AuditHistory";
import ManagementFrame from "../../components/ui/ManagementFrame";
import UpgradeNoticeBanner from "../../components/billing/UpgradeNoticeBanner";

/* ────── Constants ───────────────────────────────────────── */
const THIS_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 6 }, (_, i) => THIS_YEAR - i);
const CRA_BOXES = [
  ["box14", "Employment income"],
  ["box16", "CPP"],
  ["box18", "EI"],
  ["box22", "Tax"],
  ["box24", "EI ins. earnings"],
  ["box26", "CPP/QPP earnings"],
  ["box40", "Taxable benefits"],
  ["box44", "Union dues"],
  ["box46", "Charitable"],
];
const TABLE_BOXES = [
  "box14",
  "box16",
  "box18",
  "box22",
  "box24",
  "box26",
  "box40",
  "box44",
];

const T4 = ({ token, isManager = false }) => {
  /* ── State ────────────────────────────────────────────── */
  const [year, setYear] = useState(THIS_YEAR);
  const [recruiters, setRecruiters] = useState([]);
  const [includeArchived, setIncludeArchived] = useState(false);
  const [departments, setDepartments] = useState([]);            // 🚩 NEW
  const [selectedDepartment, setSelectedDepartment] = useState(""); // 🚩 NEW
  const [slips, setSlips] = useState([]);
  const [summary, setSummary] = useState(null);

  const [selectedEmployee, setSelectedEmployee] = useState("");

  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const [pdfUrl, setPdfUrl] = useState(null);
  const [xmlUrl, setXmlUrl] = useState(null);   // for downloads
  const [xmlText, setXmlText] = useState("");   // preview modal

  const [showAudit, setShowAudit] = useState({ open: false, id: null });
  const [editSlip, setEditSlip] = useState(null);
  const [validation, setValidation] = useState({});

  const auth = { headers: { Authorization: `Bearer ${token}` } };

  /* ── Helpers ──────────────────────────────────────────── */
  const validateBeforeIssue = (slip) =>
    CRA_BOXES.every(([c]) => slip.json_boxes?.[c]);

  /* ── Fetchers ─────────────────────────────────────────── */

  const fetchRecruiters = async () => {
    try {
      const res = await api.get(`/manager/recruiters`, {
        ...auth,
        params: includeArchived ? { include_archived: 1 } : {},
      });
      setRecruiters(res.data.recruiters || []);
    } catch {
      setErr("Failed to load recruiters.");
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await api.get(`/api/departments`, auth);
      setDepartments(res.data || []);
    } catch {
      setErr("Failed to load departments.");
    }
  };

  /* ── Filter recruiters by selected department */
  const filteredRecruiters = useMemo(() => {
    return selectedDepartment
      ? recruiters.filter((r) => String(r.department_id) === selectedDepartment)
      : recruiters;
  }, [recruiters, selectedDepartment]);

  const fetchSlipsAndSummary = async (opts = {}) => {
    const { ignoreEmployeeFilter = false } = opts;
    setLoading(true);
    try {
      const qs = new URLSearchParams({
        year,
        ...(selectedEmployee && !ignoreEmployeeFilter
          ? { employee_id: selectedEmployee }
          : {}),
      }).toString();
      const listReq = api.get(`/yearend/t4/list?${qs}`, auth);
      const sumReq = isManager
        ? api.get(`/yearend/t4/${year}/summary`, auth)
        : Promise.resolve({ data: null });

      const [{ data: list }, { data: sum }] = await Promise.all([
        listReq,
        sumReq,
      ]);

      setSlips(list);
      setSummary(sum);
    } catch {
      setErr("Failed loading T4 data.");
    } finally {
      setLoading(false);
    }
  };

  /* ── Initial + reactive fetches ───────────────────────── */
  useEffect(() => {
    fetchRecruiters();
    fetchDepartments();        // 🚩 NEW: fetch departments
  }, [includeArchived]);
  useEffect(() => {
    fetchSlipsAndSummary();
  }, [year, selectedEmployee]);

  /* ── Handlers ────────────────────────────────────────── */

  const handleDepartmentChange = (e) => {
    setSelectedDepartment(e.target.value);
    setSelectedEmployee("");    // Reset employee when department changes
  };

  const formatEmployeeName = (r) =>
    r.full_name ||
    r.name ||
    [r.first_name, r.last_name].filter(Boolean).join(" ").trim() ||
    r.email ||
    "-";

  /* Reset selectedEmployee if not in filtered recruiters */
  useEffect(() => {
    if (
      selectedEmployee &&
      !filteredRecruiters.some((r) => String(r.id) === selectedEmployee)
    ) {
      setSelectedEmployee("");
    }
  }, [filteredRecruiters, selectedEmployee]);

  /* ── CRUD / actions ───────────────────────────────────── */

  const generateAll = async () => {
    try {
      await api.post(`/yearend/t4/generate`, { year }, auth);
      setMsg("Batch generation started.");
      // clear employee filter so newly generated slips show
      setSelectedEmployee("");
      fetchSlipsAndSummary({ ignoreEmployeeFilter: true });
    } catch {
      setErr("Generation failed.");
    }
  };

  const exportXMLBatch = async () => {
    try {
      const { data } = await api.get(
        `/yearend/t4/${year}/export-xml`,
        { ...auth, responseType: "blob" }
      );
      setXmlUrl(URL.createObjectURL(new Blob([data])));
    } catch {
      setErr("XML export failed.");
    }
  };

  const downloadPDFZip = async () => {
    try {
      const { data } = await api.get(
        `/yearend/t4/${year}/download-batch`,
        { ...auth, responseType: "blob" }
      );
      const url = URL.createObjectURL(new Blob([data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `t4_batch_${year}.zip`;
      a.click();
    } catch {
      setErr("ZIP download failed.");
    }
  };

  const exportPDF = async (id) => {
    try {
      const { data } = await api.get(
        `/yearend/t4/${id}/export-pdf`,
        { ...auth, responseType: "blob" }
      );
      setPdfUrl(URL.createObjectURL(new Blob([data], { type: "application/pdf" })));
    } catch {
      setErr("PDF export failed.");
    }
  };

  const exportXmlSingle = async (id, preview = false) => {
    try {
      const { data } = await api.get(
        `/yearend/t4/slip/${id}/export-xml`,
        { ...auth, responseType: preview ? "text" : "blob" }
      );
      if (preview) setXmlText(typeof data === "string" ? data : data);
      else setXmlUrl(URL.createObjectURL(new Blob([data])));
    } catch {
      setErr("XML export failed.");
    }
  };

  const runValidation = async (id) => {
    try {
      const { data } = await api.get(`/yearend/t4/${id}/validate`, auth);
      setValidation((prev) => ({ ...prev, [id]: data }));
      return data;
    } catch {
      setErr("Validation failed.");
      return null;
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/yearend/t4/${id}/update-status`, { status }, auth);
      setMsg(`Slip ${id} ${status}.`);
      fetchSlipsAndSummary();
    } catch {
      setErr("Status update failed.");
    }
  };

  const handleIssue = async (row) => {
    try {
      const result = await runValidation(row.id);
      if (!result) return;
      if (!result.valid) {
        setErr("Cannot issue T4. Please fix CRA validation errors (SIN / province / BN / caps).");
        return;
      }
      await updateStatus(row.id, "issued");
    } catch {
      setErr("Could not issue slip.");
    }
  };

  const deleteSlip = async (row) => {
    if (row.status === "issued" || !isManager) return;
    if (!window.confirm("Are you sure you want to delete this T4?")) return;
    try {
      await api.delete(`/yearend/t4/${row.id}/delete`, auth);
      setMsg(`Slip ${row.id} deleted.`);
      fetchSlipsAndSummary();
    } catch {
      setErr("Delete failed.");
    }
  };

  /* ── Derived rows ─────────────────────────────────────── */
  const rows = useMemo(
    () =>
      slips.map((s) => ({
        ...s,
        employee:
          formatEmployeeName(
            recruiters.find((r) => r.id === s.employee_id) || {}
          ) ||
          s.employee_name ||
          "-",
        json_boxes: s.json_boxes || {}, // may be omitted in list payload
      })),
    [slips, recruiters]
  );

  /* ── Render ───────────────────────────────────────────── */
  return (
  <ManagementFrame title="T4 Slips" subtitle="Prepare and preview Canadian T4 slips for the selected tax year.">
    <UpgradeNoticeBanner
      requiredPlan="business"
      message="Compliance documents (T4) require the Business plan."
    />
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" gutterBottom>
        T4&nbsp;Slips&nbsp;(Canada)
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
          <Grid item xs={12} sm={3}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={includeArchived}
                  onChange={(e) => setIncludeArchived(e.target.checked)}
                />
              }
              label="Show archived employees"
            />
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
                  {formatEmployeeName(r)} ({r.email})
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs>
            <Stack direction="row" spacing={2} flexWrap="wrap">
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={generateAll}
              >
                Generate&nbsp;All
              </Button>

              {isManager && (
                <>
                  <Button
                    variant="outlined"
                    onClick={exportXMLBatch}
                    startIcon={<DescriptionIcon />}
                  >
                    Export&nbsp;CRA&nbsp;XML
                  </Button>
                  <Button variant="outlined" onClick={downloadPDFZip}>
                    Download&nbsp;PDF&nbsp;ZIP
                  </Button>
                </>
              )}
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      {/* Summary */}
      {summary && (
        <Paper
          sx={{
            mb: 3,
            p: 2,
            bgcolor: "grey.100",
            borderLeft: "4px solid",
            borderColor: "primary.main",
          }}
          elevation={0}
        >
          <Grid container spacing={2}>
            {[
              ["Slips", summary.slip_count],
              ["Gross", `$${summary.total_gross_pay.toFixed(2)}`],
              ["Tax", `$${summary.total_tax.toFixed(2)}`],
              ["CPP", `$${summary.total_cpp.toFixed(2)}`],
              ["EI", `$${summary.total_ei.toFixed(2)}`],
            ].map(([label, value]) => (
              <Grid item xs={6} sm={3} md="auto" key={label}>
                <Typography fontWeight="bold" variant="body2">
                  {label}
                </Typography>
                <Typography variant="body2">{value}</Typography>
              </Grid>
            ))}
            {summary?.certified_by && (
              <Grid item xs={12} md="auto">
                <Typography variant="body2" color="success.main" fontWeight="bold">
                  ✓ Certified {summary.certified_by} on{" "}
                  {new Date(summary.certified_at).toLocaleDateString()}
                </Typography>
              </Grid>
            )}
          </Grid>
        </Paper>
      )}

      {/* Table */}
      {loading ? (
        <Skeleton height={400} variant="rectangular" />
      ) : (
        <TableContainer
          component={Paper}
          variant="outlined"
          sx={{ width: "100%", overflowX: "auto" }}
        >
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell align="center" sx={{ minWidth: 60, whiteSpace: "nowrap" }}>
                  ID
                </TableCell>
                <TableCell sx={{ minWidth: 180, whiteSpace: "nowrap" }}>Employee</TableCell>
                {TABLE_BOXES.map((code) => (
                  <TableCell
                    key={code}
                    align="center"
                    sx={{ minWidth: 80, whiteSpace: "nowrap" }}
                  >
                    {code.toUpperCase()}
                  </TableCell>
                ))}
                <TableCell align="center" sx={{ minWidth: 90, whiteSpace: "nowrap" }}>
                  Status
                </TableCell>
                <TableCell align="center" sx={{ minWidth: 90, whiteSpace: "nowrap" }}>
                  Created
                </TableCell>
                <TableCell align="center" sx={{ minWidth: 260 }}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell align="center">{row.id}</TableCell>
                  <TableCell>{row.employee}</TableCell>
                  {TABLE_BOXES.map((code) => (
                    <TableCell key={code} align="center">
                      {row.json_boxes?.[code] ?? "-"}
                    </TableCell>
                  ))}
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
                    {validation[row.id] && (
                      <Typography variant="caption" display="block">
                        {validation[row.id].valid
                          ? "CRA check: OK"
                          : `CRA check: ${validation[row.id].errors?.length || 0} errors, ${
                              validation[row.id].warnings?.length || 0
                            } warnings`}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="center">
                    {new Date(row.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      {/* Audit */}
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

                      {/* Preview / Edit */}
                      <Button
                        size="small"
                        onClick={async () => {
                          const { data } = await api.get(
                            `/yearend/t4/${row.id}`,
                            auth
                          );
                          setEditSlip(data);
                        }}
                      >
                        View/Edit
                      </Button>

                      {/* PDF icon always visible */}
                      <Tooltip title="Preview/Download PDF">
                        <IconButton
                          size="small"
                          onClick={() => exportPDF(row.id)}
                        >
                          <DescriptionIcon />
                        </IconButton>
                      </Tooltip>

                      {/* XML icons only when issued */}
                      {row.status === "issued" && (
                        <>
                          <Tooltip title="Download XML">
                            <IconButton
                              size="small"
                              onClick={() => exportXmlSingle(row.id)}
                            >
                              <DescriptionIcon color="info" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Preview XML">
                            <IconButton
                              size="small"
                              onClick={() => exportXmlSingle(row.id, true)}
                            >
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}

                      {/* Issue button */}
                      {isManager && row.status === "approved" && (
                        <Button
                          size="small"
                          color="success"
                          onClick={() => handleIssue(row)}
                        >
                          Issue
                        </Button>
                      )}

                      {/* Manage */}
                      {isManager && (
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
                        <Button size="small" onClick={() => runValidation(row.id)}>
                          Validate
                        </Button>
                        {row.status !== "issued" && (
                          <Button
                            size="small"
                            color="error"
                            onClick={() => deleteSlip(row)}
                            >
                              Delete
                            </Button>
                          )}
                        </>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* PDF Preview */}
      <Dialog
        open={!!pdfUrl}
        onClose={() => setPdfUrl(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>T4 PDF Preview</DialogTitle>
        <DialogContent sx={{ height: "80vh" }}>
          {pdfUrl && <Viewer fileUrl={pdfUrl} />}
        </DialogContent>
        <DialogActions>
          <Button
            variant="contained"
            onClick={() => {
              const a = document.createElement("a");
              a.href = pdfUrl;
              a.download = "t4_form.pdf";
              a.click();
            }}
          >
            Download&nbsp;PDF
          </Button>
          <Button onClick={() => setPdfUrl(null)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* XML download */}
      <Dialog open={!!xmlUrl} onClose={() => setXmlUrl(null)}>
        <DialogTitle>Download CRA XML</DialogTitle>
        <DialogActions>
          <Button
            variant="contained"
            onClick={() => {
              const a = document.createElement("a");
              a.href = xmlUrl;
              a.download = `t4_${year}.xml`;
              a.click();
              setXmlUrl(null);
            }}
          >
            Download
          </Button>
          <Button onClick={() => setXmlUrl(null)}>Cancel</Button>
        </DialogActions>
      </Dialog>

      {/* XML Preview */}
      <Dialog
        open={!!xmlText}
        onClose={() => setXmlText("")}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>CRA XML Preview</DialogTitle>
        <DialogContent dividers>
          <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
            {xmlText}
          </pre>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setXmlText("")}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Audit modal */}
      <Dialog
        open={showAudit.open}
        onClose={() => setShowAudit({ open: false, id: null })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>T4 Audit History</DialogTitle>
          <DialogContent>
            {showAudit.id && (
              <AuditHistory
                recordType="t4"
                recordId={showAudit.id}
                token={token}
              />
            )}
          </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAudit({ open: false, id: null })}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* View / Edit modal */}
      <Dialog
        open={!!editSlip}
        onClose={() => setEditSlip(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>View / Edit T4 Boxes</DialogTitle>
        <DialogContent dividers>
          {editSlip && (
            <>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Edit CRA box values. Box 40 = taxable benefits, Box 44 = union dues.
              </Typography>
              <Grid container spacing={2}>
                {CRA_BOXES.map(([code, label]) => (
                  <Grid item xs={12} sm={6} key={code}>
                    <TextField
                      label={`${code.toUpperCase()} – ${label}`}
                      value={editSlip.json_boxes?.[code] ?? ""}
                      onChange={(e) =>
                        setEditSlip((s) => ({
                          ...s,
                          json_boxes: { ...s.json_boxes, [code]: e.target.value },
                        }))
                      }
                      fullWidth
                      disabled={!isManager || editSlip.status === "issued"}
                    />
                  </Grid>
                ))}
              </Grid>
            </>
          )}
        </DialogContent>
        <DialogActions>
          {isManager && editSlip?.status !== "issued" && (
            <Button
              onClick={async () => {
                try {
                  await api.put(
                    `/yearend/t4/${editSlip.id}/boxes`,
                    { json_boxes: editSlip.json_boxes },
                    auth
                  );
                  setMsg("Boxes saved.");
                  setEditSlip(null);
                  fetchSlipsAndSummary();
                } catch {
                  setErr("Save failed.");
                }
              }}
            >
              Save
            </Button>
          )}
          <Button onClick={() => setEditSlip(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  </ManagementFrame>
);
};

export default T4;
