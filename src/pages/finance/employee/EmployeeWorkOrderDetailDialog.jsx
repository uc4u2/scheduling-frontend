import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
import { getMyWorkOrder, listMyWorkOrderFieldPhotos, uploadMyWorkOrderFieldPhoto } from "../financeApi";
import FinanceStatusChip from "../components/FinanceStatusChip";
import { API_BASE_URL } from "../../../utils/api";
import { getAuthedCompanyId } from "../../../utils/authedCompany";

export default function EmployeeWorkOrderDetailDialog({ open, workOrderId, onClose, onSubmitReport, onViewReports }) {
  const [workOrder, setWorkOrder] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [photoPreviewUrls, setPhotoPreviewUrls] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [photoError, setPhotoError] = useState("");
  const [photoFile, setPhotoFile] = useState(null);
  const [photoNote, setPhotoNote] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!open || !workOrderId) return;
      setLoading(true);
      setError("");
      try {
        const [res, photoRes] = await Promise.all([
          getMyWorkOrder(workOrderId),
          listMyWorkOrderFieldPhotos(workOrderId).catch(() => ({ items: [] })),
        ]);
        if (!mounted) return;
        setWorkOrder(res?.work_order || res);
        setPhotos(Array.isArray(photoRes?.items) ? photoRes.items : []);
      } catch (err) {
        if (!mounted) return;
        setError(err?.response?.data?.error || err?.message || "Unable to load work order.");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [open, workOrderId]);

  const loadSignedPreview = useCallback(async (photoId) => {
    const token = typeof localStorage !== "undefined" ? localStorage.getItem("token") || "" : "";
    const companyId = getAuthedCompanyId?.();
    const apiBase = String(API_BASE_URL || "").replace(/\/$/, "");
    const response = await fetch(`${apiBase}/employee/field-photos/${photoId}/download`, {
      method: "GET",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(companyId ? { "X-Company-Id": String(companyId) } : {}),
      },
    });
    if (!response.ok) {
      throw new Error("Photo is not available yet.");
    }
    const payload = await response.json();
    return payload?.url || "";
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadPreviewUrls = async () => {
      for (const row of photos) {
        if (!row?.id || !row?.is_download_ready || photoPreviewUrls[row.id]) continue;
        try {
          const url = await loadSignedPreview(row.id);
          if (!cancelled && url) {
            setPhotoPreviewUrls((prev) => (prev[row.id] ? prev : { ...prev, [row.id]: url }));
          }
        } catch (_err) {
          // leave preview empty until opened manually
        }
      }
    };
    if (photos.length) loadPreviewUrls();
    return () => {
      cancelled = true;
    };
  }, [loadSignedPreview, photoPreviewUrls, photos]);

  const handleOpenPhoto = async (row) => {
    try {
      const existing = photoPreviewUrls[row.id];
      const url = existing || await loadSignedPreview(row.id);
      if (url && !existing) {
        setPhotoPreviewUrls((prev) => ({ ...prev, [row.id]: url }));
      }
      if (url) window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      setPhotoError(err?.message || "Photo is not available yet.");
    }
  };

  const handleUploadPhoto = async () => {
    if (!workOrder?.id || !photoFile) return;
    setUploadingPhoto(true);
    setPhotoError("");
    try {
      const formData = new FormData();
      formData.append("file", photoFile);
      if (photoNote.trim()) formData.append("note", photoNote.trim());
      await uploadMyWorkOrderFieldPhoto(workOrder.id, formData);
      const photoRes = await listMyWorkOrderFieldPhotos(workOrder.id);
      setPhotos(Array.isArray(photoRes?.items) ? photoRes.items : []);
      setPhotoFile(null);
      setPhotoNote("");
    } catch (err) {
      setPhotoError(err?.response?.data?.error || err?.message || "Unable to upload work-order photo.");
    } finally {
      setUploadingPhoto(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>My Work Order</DialogTitle>
      <DialogContent dividers>
        {loading ? (
          <Stack alignItems="center" sx={{ py: 8 }}><CircularProgress /></Stack>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : workOrder ? (
          <Stack spacing={2}>
            <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} justifyContent="space-between">
              <Stack spacing={0.5}>
                <Typography variant="h6" fontWeight={800}>{workOrder.work_order_number} • {workOrder.title}</Typography>
                <Typography variant="body2" color="text.secondary">{workOrder.client_name || "Client not shown"}</Typography>
                <Typography variant="body2" color="text.secondary">{workOrder.location || "No location set"}</Typography>
              </Stack>
              <FinanceStatusChip status={workOrder.status} />
            </Stack>

            <Paper variant="outlined" sx={{ p: 2, borderRadius: 1 }}>
              <Typography variant="h6" fontWeight={800} sx={{ mb: 1.5 }}>Assigned date and time</Typography>
              {(workOrder.assignments || []).length ? (
                <Stack spacing={1}>
                  {workOrder.assignments.map((row) => (
                    <Typography key={row.assignment_id} variant="body2">
                      {row.work_date || "No date"}{row.start_time ? ` • ${row.start_time}` : ""}{row.end_time ? ` to ${row.end_time}` : ""}{row.timezone ? ` • ${row.timezone}` : workOrder.timezone ? ` • ${workOrder.timezone}` : ""}
                    </Typography>
                  ))}
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">No assignment rows are visible for this job.</Typography>
              )}
            </Paper>

            <Paper variant="outlined" sx={{ p: 2, borderRadius: 1 }}>
              <Typography variant="h6" fontWeight={800} sx={{ mb: 1.5 }}>Instructions</Typography>
              <Typography variant="body2" color="text.secondary">{workOrder.employee_visible_notes || "No employee instructions yet."}</Typography>
            </Paper>

            <Paper variant="outlined" sx={{ p: 2, borderRadius: 1 }}>
              <Typography variant="h6" fontWeight={800} sx={{ mb: 1.5 }}>Planned materials</Typography>
              {(workOrder.planned_materials || []).length ? (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Material</TableCell>
                      <TableCell>Planned quantity</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {workOrder.planned_materials.map((row, index) => (
                      <TableRow key={`planned-material-${index}`}>
                        <TableCell>{row.title}</TableCell>
                        <TableCell>{row.qty_planned}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <Typography variant="body2" color="text.secondary">No planned materials were shared for this job.</Typography>
              )}
            </Paper>

            <Paper variant="outlined" sx={{ p: 2, borderRadius: 1 }}>
              <Stack spacing={1.5}>
                <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} justifyContent="space-between" alignItems={{ md: "center" }}>
                  <Box>
                    <Typography variant="h6" fontWeight={800}>Job photos</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Upload proof-of-work photos directly to this assigned job. These photos also appear for the manager and in Client 360 when the work order is client-linked.
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {photos.length || workOrder.field_photo_count || 0} linked photo{Number(photos.length || workOrder.field_photo_count || 0) === 1 ? "" : "s"}
                  </Typography>
                </Stack>
                {photoError ? <Alert severity="error">{photoError}</Alert> : null}
                <Stack direction={{ xs: "column", md: "row" }} spacing={1.25} alignItems={{ md: "center" }}>
                  <Button component="label" variant="outlined">
                    {photoFile ? photoFile.name : "Choose photo"}
                    <input
                      hidden
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={(event) => setPhotoFile(event.target.files?.[0] || null)}
                    />
                  </Button>
                  <TextField
                    size="small"
                    label="Photo note"
                    value={photoNote}
                    onChange={(event) => setPhotoNote(event.target.value)}
                    sx={{ minWidth: { xs: "100%", md: 260 } }}
                  />
                  <Button variant="contained" disabled={!photoFile || uploadingPhoto} onClick={handleUploadPhoto}>
                    {uploadingPhoto ? "Uploading..." : "Upload photo"}
                  </Button>
                </Stack>
                {(photos || []).length ? (
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {photos.slice(0, 8).map((row) => (
                      <Stack
                        key={row.id}
                        spacing={0.75}
                        sx={{
                          width: 120,
                          p: 1,
                          border: "1px solid",
                          borderColor: "divider",
                          borderRadius: 1,
                        }}
                      >
                        <Box
                          role="button"
                          tabIndex={0}
                          onClick={() => handleOpenPhoto(row)}
                          onKeyDown={(event) => { if (event.key === "Enter") handleOpenPhoto(row); }}
                          sx={{
                            height: 88,
                            borderRadius: 1,
                            bgcolor: "action.hover",
                            overflow: "hidden",
                            display: "grid",
                            placeItems: "center",
                            cursor: "pointer",
                          }}
                        >
                          {photoPreviewUrls[row.id] ? (
                            <Box component="img" src={photoPreviewUrls[row.id]} alt={row.file_name || "Job photo"} sx={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          ) : (
                            <Typography variant="caption" color="text.secondary">{row.is_download_ready ? "Preview" : "Processing"}</Typography>
                          )}
                        </Box>
                        <Typography variant="caption" sx={{ fontWeight: 700 }}>
                          {row.note || row.file_name || "Job photo"}
                        </Typography>
                        <Button size="small" variant="text" onClick={() => handleOpenPhoto(row)} disabled={!row.is_download_ready}>
                          Open
                        </Button>
                      </Stack>
                    ))}
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary">No job photos uploaded yet.</Typography>
                )}
              </Stack>
            </Paper>

            <Alert severity="info">Submit a field report when work is done or when the manager needs an update from the field.</Alert>
          </Stack>
        ) : null}
      </DialogContent>
      <DialogActions>
        {workOrder?.status === "completed" ? (
          <Button variant="outlined" onClick={onViewReports}>My Field Reports</Button>
        ) : (
          <Button variant="contained" disabled={!workOrder} onClick={() => onSubmitReport?.(workOrder)}>Submit Field Report</Button>
        )}
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
