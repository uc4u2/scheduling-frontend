import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import PreviewOutlinedIcon from "@mui/icons-material/PreviewOutlined";
import CheckCircleOutlineOutlinedIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import { useSnackbar } from "notistack";
import { formatDateTimeInTz } from "../../utils/datetime";
import { getUserTimezone } from "../../utils/timezone";

const statusTone = {
  valid_new: "success",
  valid_update: "info",
  no_change: "default",
  duplicate: "warning",
  duplicate_conflict: "warning",
  invalid: "error",
  skipped: "default",
};

const defaultStatusLabel = {
  valid_new: "New item",
  valid_update: "Will update",
  no_change: "No changes",
  duplicate: "Existing record",
  duplicate_conflict: "Needs review",
  invalid: "Invalid",
  skipped: "Skipped",
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

export default function FinanceImportDialog({
  open,
  onClose,
  title,
  importType,
  templateFileName,
  csvStructure,
  downloadTemplate,
  previewImport,
  commitImport,
  listHistory,
  onImported,
  description,
  renderPreviewDetails,
  renderIssueDetails,
  entityLabel,
  modes,
  defaultMode,
  modeHelpText,
  showChangePreview = false,
  statusLabels,
  entitySingular,
  entityPlural,
}) {
  const { enqueueSnackbar } = useSnackbar();
  const viewerTimezone = useMemo(() => getUserTimezone(), []);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState(defaultMode || modes?.[0]?.value || "");
  const displayLabel = entityLabel || importType;
  const singularLabel = entitySingular || displayLabel.replace(/s$/, "") || "record";
  const pluralLabel = entityPlural || displayLabel || "records";
  const mergedStatusLabels = useMemo(
    () => ({
      ...defaultStatusLabel,
      valid_new: `New ${singularLabel}`,
      duplicate: `Existing ${singularLabel}`,
      invalid: "Invalid row",
      ...statusLabels,
    }),
    [singularLabel, statusLabels]
  );
  const selectedMode = useMemo(
    () => (modes || []).find((item) => item.value === mode) || null,
    [mode, modes]
  );
  const hasChanges = Boolean(showChangePreview && preview?.rows?.some((row) => (row.changes || []).length || (row.warnings || []).length));

  useEffect(() => {
    if (!open) return;
    setError("");
    setPreview(null);
    setFile(null);
    setMode(defaultMode || modes?.[0]?.value || "");
    setLoadingHistory(true);
    listHistory(importType)
      .then((payload) => setHistory(Array.isArray(payload?.items) ? payload.items : []))
      .catch((err) => setError(err?.response?.data?.error || err?.message || "Unable to load recent imports."))
      .finally(() => setLoadingHistory(false));
  }, [defaultMode, importType, listHistory, modes, open]);

  const handleDownloadTemplate = async () => {
    try {
      const response = await downloadTemplate();
      downloadBlobResponse(response, templateFileName);
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.error || err?.message || "Unable to download template.", { variant: "error" });
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
      const payload = await previewImport(file, mode ? { mode } : undefined);
      setPreview(payload);
    } catch (err) {
      setPreview(null);
      setError(err?.response?.data?.error || err?.message || "Unable to preview import.");
    } finally {
      setPreviewing(false);
    }
  };

  const handleCommit = async () => {
    if (!file) return;
    setCommitting(true);
    setError("");
    try {
      const payload = await commitImport(file, mode ? { mode } : undefined);
      const createdCount = Number(payload?.create_count ?? payload?.imported_count ?? 0);
      const updatedCount = Number(payload?.update_count || 0);
      const successMessage = updatedCount > 0
        ? `${createdCount} created, ${updatedCount} updated.`
        : `${createdCount} ${displayLabel} imported.`;
      enqueueSnackbar(successMessage, { variant: "success" });
      setPreview(payload);
      const historyPayload = await listHistory(importType);
      setHistory(Array.isArray(historyPayload?.items) ? historyPayload.items : []);
      await onImported?.(payload);
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Unable to complete import.");
    } finally {
      setCommitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={committing ? undefined : onClose} maxWidth="lg" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2.5}>
          <Typography variant="body2" color="text.secondary">
            {description || `Import official Business Finance ${displayLabel}. Preview the CSV first before completing the import.`}
          </Typography>

          {error ? <Alert severity="error">{error}</Alert> : null}

          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
            <Stack spacing={1.5}>
              {modes?.length ? (
                <FormControl size="small" sx={{ maxWidth: 420 }}>
                  <InputLabel>Import mode</InputLabel>
                  <Select label="Import mode" value={mode} onChange={(e) => setMode(e.target.value)}>
                    {modes.map((option) => (
                      <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>
                    {modeHelpText?.[mode] || selectedMode?.description || ""}
                  </FormHelperText>
                </FormControl>
              ) : null}
              <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} justifyContent="space-between">
                <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
                  <Button variant="outlined" startIcon={<DownloadOutlinedIcon />} onClick={handleDownloadTemplate}>
                    Download template
                  </Button>
                  <Button variant="contained" component="label" startIcon={<UploadFileOutlinedIcon />}>
                    {file ? "Replace CSV" : "Upload CSV"}
                    <input hidden type="file" accept=".csv,text/csv" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                  </Button>
                </Stack>
                <TextField label="Selected file" value={file?.name || ""} InputProps={{ readOnly: true }} sx={{ minWidth: { md: 320 } }} />
              </Stack>
              <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
                <Button variant="outlined" startIcon={<PreviewOutlinedIcon />} onClick={handlePreview} disabled={!file || previewing || committing}>
                  {previewing ? "Previewing..." : "Preview import"}
                </Button>
                <Button variant="contained" startIcon={<CheckCircleOutlineOutlinedIcon />} onClick={handleCommit} disabled={!file || !preview || previewing || committing}>
                  {committing ? "Completing..." : "Complete import"}
                </Button>
              </Stack>
            </Stack>
          </Paper>

          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
            <Stack spacing={1}>
              <Typography variant="subtitle1" fontWeight={800}>Accepted CSV structure</Typography>
              <Typography variant="body2" color="text.secondary">
                {modes?.length
                  ? "Use the template to match the expected columns. Existing records stay unchanged unless you choose the update matching mode and approve the preview."
                  : "Use the template to match the expected columns. Existing records stay unchanged in this import flow."}
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
                  <Chip color="success" label={`New ${pluralLabel} ${preview.create_count ?? preview.valid_count ?? 0}`} />
                  {Number(preview.update_count || 0) > 0 ? <Chip color="info" label={`Items to update ${preview.update_count || 0}`} /> : null}
                  {Number(preview.no_change_count || 0) > 0 ? <Chip label={`No changes ${preview.no_change_count || 0}`} /> : null}
                  <Chip color="warning" label={`${modes?.length ? "Needs review" : `Existing ${pluralLabel}`} ${preview.duplicate_conflict_count ?? preview.duplicate_count ?? 0}`} />
                  <Chip color="error" label={`Invalid ${preview.invalid_count || 0}`} />
                  <Chip label={`Skipped ${preview.skipped_count || 0}`} />
                  {Number(preview.warning_count || 0) > 0 ? <Chip color="secondary" label={`Warnings ${preview.warning_count || 0}`} /> : null}
                </Stack>
              </Stack>
            </Paper>
          ) : null}

          {preview?.rows?.length ? (
            <Paper variant="outlined" sx={{ overflowX: "auto" }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Row</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Preview</TableCell>
                    <TableCell>Issues</TableCell>
                    {hasChanges ? <TableCell>Review changes</TableCell> : null}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {preview.rows.map((row) => (
                    <TableRow key={`${row.row_number}-${row.status}`}>
                      <TableCell>{row.row_number}</TableCell>
                      <TableCell><Chip size="small" color={statusTone[row.status] || "default"} label={mergedStatusLabels[row.status] || row.status} /></TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={700}>
                          {row.normalized_payload?.name || `${row.normalized_payload?.first_name || ""} ${row.normalized_payload?.last_name || ""}`.trim() || "Row"}
                        </Typography>
                        {renderPreviewDetails ? (
                          renderPreviewDetails(row)
                        ) : (
                          <Typography variant="caption" color="text.secondary">
                            {row.normalized_payload?.email || row.normalized_payload?.phone || row.normalized_payload?.address || "No secondary fields"}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {(row.errors || []).length ? (
                          <Stack spacing={0.5}>
                            {row.errors.map((item) => <Typography key={item} variant="caption" color="error.main">{item}</Typography>)}
                          </Stack>
                        ) : row.duplicate_match && row.status === "duplicate" ? (
                          <Typography variant="caption" color="text.secondary">
                            {row.duplicate_match?.label || "Existing match found"}
                          </Typography>
                        ) : row.duplicate_match && row.status === "valid_update" ? (
                          <Typography variant="caption" color="text.secondary">
                            {row.duplicate_match?.label || "Matching inventory item found"}
                          </Typography>
                        ) : (
                          <Typography variant="caption" color="text.secondary">Ready to import</Typography>
                        )}
                        {renderIssueDetails ? renderIssueDetails(row) : null}
                      </TableCell>
                      {hasChanges ? (
                        <TableCell>
                          {(row.changes || []).length ? (
                            <Stack spacing={0.5}>
                              {row.changes.map((change) => (
                                <Typography key={`${row.row_number}-${change.field}`} variant="caption" color="text.secondary">
                                  {`${change.label}: ${String(change.current_value ?? "-")} -> ${String(change.new_value ?? "-")}`}
                                </Typography>
                              ))}
                            </Stack>
                          ) : row.status === "no_change" ? (
                            <Typography variant="caption" color="text.secondary">No changes found</Typography>
                          ) : (
                            <Typography variant="caption" color="text.secondary">No item-master changes</Typography>
                          )}
                          {(row.warnings || []).length ? (
                            <Stack spacing={0.5} sx={{ mt: 0.75 }}>
                              {row.warnings.map((warning) => (
                                <Typography key={`${row.row_number}-${warning}`} variant="caption" color="warning.main">
                                  {warning}
                                </Typography>
                              ))}
                            </Stack>
                          ) : null}
                        </TableCell>
                      ) : null}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>
          ) : null}

          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
            <Stack spacing={1}>
              <Typography variant="subtitle1" fontWeight={800}>Recent imports</Typography>
              {loadingHistory ? (
                <Typography variant="body2" color="text.secondary">Loading recent imports...</Typography>
              ) : history.length ? (
                <Stack spacing={1}>
                  {history.map((item) => (
                    <Paper key={item.id} variant="outlined" sx={{ p: 1.25, borderRadius: 1.5 }}>
                      <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={1}>
                        <div>
                          <Typography variant="body2" fontWeight={700}>{item.filename || `Import #${item.id}`}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {item.created_at ? formatDateTimeInTz(item.created_at, viewerTimezone) : "-"}
                          </Typography>
                        </div>
                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                          <Chip size="small" label={`Rows ${item.row_count || 0}`} />
                          <Chip size="small" color="success" label={`Imported ${item.imported_count || 0}`} />
                          {Number(item.summary?.update_count || 0) > 0 ? <Chip size="small" color="info" label={`Updated ${item.summary?.update_count || 0}`} /> : null}
                          {item.mode ? <Chip size="small" label={item.mode === "create_and_update_matches" ? "Create and update matches" : "Create new only"} /> : null}
                          <Chip size="small" color="warning" label={`Duplicates ${item.duplicate_count || 0}`} />
                          <Chip size="small" color="error" label={`Invalid ${item.invalid_count || 0}`} />
                        </Stack>
                      </Stack>
                    </Paper>
                  ))}
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">No recent imports yet.</Typography>
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
