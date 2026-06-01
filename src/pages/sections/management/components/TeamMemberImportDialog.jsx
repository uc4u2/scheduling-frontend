import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined";
import PreviewOutlinedIcon from "@mui/icons-material/PreviewOutlined";
import CheckCircleOutlineOutlinedIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import { useSnackbar } from "notistack";
import { formatDateTimeInTz } from "../../../../utils/datetime";
import { getUserTimezone } from "../../../../utils/timezone";

const STATUS_TONE = {
  valid_new: "success",
  duplicate: "warning",
  invalid: "error",
  warning: "secondary",
};

const STATUS_LABEL = {
  valid_new: "New team member",
  duplicate: "Existing team member",
  invalid: "Invalid row",
  warning: "Needs review",
};

function readFilenameFromResponse(response, fallback) {
  const header = response?.headers?.["content-disposition"] || "";
  const match = /filename=\"?([^\";]+)\"?/i.exec(header);
  return match?.[1] || fallback;
}

function downloadBlobResponse(response, fallbackName) {
  const blob = response?.data;
  if (!(blob instanceof Blob)) return;
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = readFilenameFromResponse(response, fallbackName);
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export default function TeamMemberImportDialog({
  open,
  onClose,
  onImported,
  downloadTemplate,
  previewImport,
  commitImport,
  listHistory,
}) {
  const { enqueueSnackbar } = useSnackbar();
  const viewerTimezone = useMemo(() => getUserTimezone(), []);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState("");
  const [previewing, setPreviewing] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [authorityConfirmed, setAuthorityConfirmed] = useState(false);

  useEffect(() => {
    if (!open) return;
    setFile(null);
    setPreview(null);
    setError("");
    setAuthorityConfirmed(false);
    listHistory()
      .then((payload) => setHistory(Array.isArray(payload?.items) ? payload.items : []))
      .catch((err) => setError(err?.response?.data?.error || err?.message || "Unable to load recent imports."));
  }, [listHistory, open]);

  const handleTemplateDownload = async () => {
    try {
      const response = await downloadTemplate();
      downloadBlobResponse(response, "schedulaa-team-members-template.csv");
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.error || err?.message || "Unable to download the template.", { variant: "error" });
    }
  };

  const handlePreview = async () => {
    if (!file) {
      setError("Choose a CSV file first.");
      return;
    }
    setPreviewing(true);
    setError("");
    try {
      const payload = await previewImport(file);
      setPreview(payload);
    } catch (err) {
      setPreview(null);
      setError(err?.response?.data?.error || err?.message || "Unable to preview the team member import.");
    } finally {
      setPreviewing(false);
    }
  };

  const handleCommit = async () => {
    if (!file) return;
    setCommitting(true);
    setError("");
    try {
      const payload = await commitImport(file, { confirmAuthority: authorityConfirmed });
      setPreview(payload);
      enqueueSnackbar(
        `${Number(payload?.created_count || 0)} team member${Number(payload?.created_count || 0) === 1 ? "" : "s"} created.`,
        { variant: "success" }
      );
      const historyPayload = await listHistory();
      setHistory(Array.isArray(historyPayload?.items) ? historyPayload.items : []);
      await onImported?.(payload);
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Unable to complete the team member import.");
    } finally {
      setCommitting(false);
    }
  };

  const previewRows = preview?.rows || [];
  const csvStructure = [
    "first_name,last_name,work_email,role,department,primary_payroll_location,timezone,street_address,country,state,city,zip_code,phone,start_date,status",
    "Ava,Johnson,ava.johnson@example.com,Employee,Operations,Main Work Location,America/Toronto,100 King St W,Canada,ON,Toronto,M5X 1A9,+14165550101,2026-06-15,active",
    "Noah,Smith,noah.smith@example.com,Manager,Field Team,Main Work Location,America/Chicago,200 Main St,United States,TX,Austin,73301,+15125550102,2026-06-15,active",
  ].join("\n");

  return (
    <Dialog open={open} onClose={committing ? undefined : onClose} maxWidth="lg" fullWidth>
      <DialogTitle>Import team members</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2.5}>
          <Typography variant="body2" color="text.secondary">
            Upload a CSV to create team member accounts in bulk. Passwords are not imported. Team members will set their own password through a secure setup invitation.
          </Typography>

          <Alert severity="info" variant="outlined">
            Existing team members stay unchanged. Preview the file before creating accounts.
          </Alert>

          {error ? <Alert severity="error">{error}</Alert> : null}

          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
            <Stack spacing={1.5}>
              <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} justifyContent="space-between">
                <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
                  <Button variant="outlined" startIcon={<DownloadOutlinedIcon />} onClick={handleTemplateDownload}>
                    Download template
                  </Button>
                  <Button variant="contained" component="label" startIcon={<UploadFileOutlinedIcon />}>
                    {file ? "Replace CSV" : "Upload employee list"}
                    <input hidden type="file" accept=".csv,text/csv" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                  </Button>
                </Stack>
                <TextField label="Selected file" value={file?.name || ""} InputProps={{ readOnly: true }} sx={{ minWidth: { md: 320 } }} />
              </Stack>
              <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
                <Button variant="outlined" startIcon={<PreviewOutlinedIcon />} onClick={handlePreview} disabled={!file || previewing || committing}>
                  {previewing ? "Previewing..." : "Preview import"}
                </Button>
                <Button
                  variant="contained"
                  startIcon={<CheckCircleOutlineOutlinedIcon />}
                  onClick={handleCommit}
                  disabled={!file || !preview || !authorityConfirmed || previewing || committing}
                >
                  {committing ? "Completing..." : "Complete import"}
                </Button>
              </Stack>
              <FormControlLabel
                control={<Checkbox checked={authorityConfirmed} onChange={(e) => setAuthorityConfirmed(e.target.checked)} />}
                label="I confirm I am authorized to create accounts and send setup invitations for these team members."
              />
            </Stack>
          </Paper>

          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
            <Stack spacing={1}>
              <Typography variant="subtitle1" fontWeight={800}>Accepted CSV structure</Typography>
              <Typography variant="body2" color="text.secondary">
                Use the template to match the expected columns. Password columns are not accepted.
              </Typography>
              <Typography component="pre" variant="caption" sx={{ m: 0, p: 1.5, borderRadius: 1.5, bgcolor: "grey.50", whiteSpace: "pre-wrap", fontFamily: "monospace" }}>
                {csvStructure}
              </Typography>
            </Stack>
          </Paper>

          {preview ? (
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
              <Stack spacing={1.5}>
                <Typography variant="subtitle1" fontWeight={800}>Preview summary</Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  <Chip label={`Rows ${preview.row_count || 0}`} />
                  <Chip color="success" label={`New team members ${preview.valid_count || 0}`} />
                  <Chip color="warning" label={`Existing team members ${preview.duplicate_count || 0}`} />
                  <Chip color="error" label={`Invalid rows ${preview.invalid_count || 0}`} />
                  <Chip color="secondary" label={`Warnings ${preview.warning_count || 0}`} />
                  <Chip label={`Skipped ${preview.skipped_count || 0}`} />
                  <Chip label={`Setup invitations ready ${preview.invite_ready_count || 0}`} />
                </Stack>
                {preview?.seat_limit?.message ? (
                  <Alert severity={preview.seat_limit.exceeds_limit ? "warning" : "success"} variant="outlined">
                    {preview.seat_limit.message}
                  </Alert>
                ) : null}
              </Stack>
            </Paper>
          ) : null}

          {previewRows.length ? (
            <Paper variant="outlined" sx={{ overflowX: "auto" }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Row</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Work email</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Department</TableCell>
                    <TableCell>Payroll location</TableCell>
                    <TableCell>Timezone</TableCell>
                    <TableCell>Issues and warnings</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {previewRows.map((row) => (
                    <TableRow key={row.row_number} hover>
                      <TableCell>{row.row_number}</TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          color={STATUS_TONE[row.status] || "default"}
                          label={STATUS_LABEL[row.status] || row.status}
                        />
                      </TableCell>
                      <TableCell>{row.name || "-"}</TableCell>
                      <TableCell>{row.work_email || "-"}</TableCell>
                      <TableCell>{row.role || "-"}</TableCell>
                      <TableCell>{row.department || "Unassigned"}</TableCell>
                      <TableCell>{row.primary_payroll_location || "-"}</TableCell>
                      <TableCell>{row.timezone || "-"}</TableCell>
                      <TableCell>
                        <Stack spacing={0.75}>
                          {(row.issues || []).map((issue, index) => (
                            <Typography key={`issue-${row.row_number}-${index}`} variant="caption" color="text.secondary">
                              {issue}
                            </Typography>
                          ))}
                          {(row.warnings || []).map((warning, index) => (
                            <Typography key={`warning-${row.row_number}-${index}`} variant="caption" color="warning.main">
                              {warning}
                            </Typography>
                          ))}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>
          ) : null}

          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
            <Stack spacing={1}>
              <Typography variant="subtitle1" fontWeight={800}>Recent imports</Typography>
              {history.length ? history.map((item) => (
                <Box key={item.id} sx={{ borderRadius: 1.5, border: "1px solid", borderColor: "divider", p: 1.5 }}>
                  <Typography variant="body2" fontWeight={700}>{item.filename || "Team member import"}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Created {item.created_at ? formatDateTimeInTz(item.created_at, viewerTimezone) : "-"} • New team members {item.created_count || 0} • Invites sent {item.invite_sent_count || 0}
                  </Typography>
                </Box>
              )) : (
                <Typography variant="body2" color="text.secondary">No recent team member imports yet.</Typography>
              )}
            </Stack>
          </Paper>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={committing}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
