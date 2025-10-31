// src/pages/sections/management/ServiceManagement.js

import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  IconButton,
  Snackbar,
  Paper,
  Stack,
  CircularProgress,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { Add, Edit, Delete, PhotoCamera, CloudUpload, DeleteOutline } from "@mui/icons-material";
import axios from "axios";

const API = process.env.REACT_APP_API_URL || "";

const emptyForm = {
  name: "",
  category: "",
  duration: 60,
  base_price: 0,
  description: "",
};

const ServiceManagement = ({ token }) => {
  const { t, i18n } = useTranslation();

  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [snk, setSnk] = useState({ open: false, key: "" });
  const [imageModal, setImageModal] = useState(false);
  const [imageTarget, setImageTarget] = useState(null);
  const [imageUploading, setImageUploading] = useState(false);

  const auth = { headers: { Authorization: `Bearer ${token}` } };
  const resolveImageUrl = (img) => {
    if (!img) return "";
    if (img.url_public) return img.url_public;
    const base = API || (typeof window !== "undefined" ? window.location.origin : "");
    return `${base}/public/service-images/${img.id}`;
  };

  const columns = useMemo(
    () => [
      { field: "name", headerName: t("manager.service.columns.name"), flex: 1 },
      { field: "category", headerName: t("manager.service.columns.category"), flex: 1 },
      { field: "duration", headerName: t("manager.service.columns.duration"), width: 100 },
      {
        field: "base_price",
        headerName: t("manager.service.columns.price"),
        width: 140,
        valueFormatter: (params) => `$${Number(params.value).toFixed(2)}`,
      },
      {
        field: "actions",
        headerName: t("manager.service.columns.actions"),
        width: 200,
        sortable: false,
        filterable: false,
        disableColumnMenu: true,
        renderCell: (params) => (
          <>
            <IconButton onClick={() => show(params.row)}>
              <Edit />
            </IconButton>
            <IconButton onClick={() => openImages(params.row)}>
              <PhotoCamera />
            </IconButton>
            <IconButton color="error" onClick={() => handleDelete(params.row.id)}>
              <Delete />
            </IconButton>
          </>
        ),
      },
    ],
    [i18n.language, t]
  );

  const localeText = useMemo(
    () => ({
      noRowsLabel: t("manager.service.table.noRows"),
      footerRowPerPage: t("common.rowsPerPage"),
    }),
    [i18n.language, t]
  );

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API}/booking/services?active=true`, auth);
      setServices(data);
    } catch (err) {
      console.error("ServiceManagement load error", err);
      setSnk({ open: true, key: "manager.service.messages.loadError" });
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchServiceDetail = async (id) => {
    const { data } = await axios.get(`${API}/booking/services/${id}`, auth);
    return data;
  };

  const openImages = async (row) => {
    try {
      const detail = await fetchServiceDetail(row.id);
      setImageTarget(detail);
      setImageModal(true);
    } catch (err) {
      console.error("ServiceManagement image load error", err);
      setSnk({ open: true, key: "manager.service.messages.loadError" });
    }
  };

  const closeImages = () => {
    setImageModal(false);
    setImageTarget(null);
    setImageUploading(false);
  };

  const refreshImages = async (id) => {
    const detail = await fetchServiceDetail(id);
    setImageTarget(detail);
    await load();
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !imageTarget) return;

    const formData = new FormData();
    formData.append("file", file);

    setImageUploading(true);
    try {
      await axios.post(`${API}/booking/services/${imageTarget.id}/images`, formData, {
        headers: {
          ...auth.headers,
          "Content-Type": "multipart/form-data",
        },
      });
      await refreshImages(imageTarget.id);
    } catch (err) {
      console.error("ServiceManagement image upload error", err);
      setSnk({ open: true, key: "manager.service.messages.saveFailed" });
    } finally {
      setImageUploading(false);
    }
  };

  const removeImage = async (imageId) => {
    if (!imageTarget) return;
    try {
      await axios.delete(`${API}/booking/service-images/${imageId}`, auth);
      await refreshImages(imageTarget.id);
    } catch (err) {
      console.error("ServiceManagement image delete error", err);
      setSnk({ open: true, key: "manager.service.messages.deleteFailed" });
    }
  };

  const show = (row = null) => {
    setEditing(row);
    setForm(row ? { ...row } : emptyForm);
    setOpen(true);
  };

  const handleCloseDialog = () => {
    setOpen(false);
    setEditing(null);
    setForm(emptyForm);
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t("manager.service.confirmDelete"))) return;
    try {
      await axios.delete(`${API}/booking/services/${id}`, auth);
      await load();
      setSnk({ open: true, key: "manager.service.messages.deleted" });
    } catch (err) {
      console.error("ServiceManagement delete error", err);
      setSnk({ open: true, key: "manager.service.messages.deleteFailed" });
    }
  };

  const save = async () => {
    try {
      if (editing) {
        await axios.put(`${API}/booking/services/${editing.id}`, form, auth);
        setSnk({ open: true, key: "manager.service.messages.updated" });
      } else {
        await axios.post(`${API}/booking/services`, form, auth);
        setSnk({ open: true, key: "manager.service.messages.added" });
      }
      handleCloseDialog();
      load();
    } catch (err) {
      console.error("ServiceManagement save error", err);
      setSnk({ open: true, key: "manager.service.messages.saveFailed" });
    }
  };

  return (
    <Box p={3}>
      <Typography variant="h4" mb={2}>
        {t("manager.service.title")}
      </Typography>

      <Button startIcon={<Add />} variant="contained" sx={{ mb: 2 }} onClick={() => show()}>
        {t("manager.service.buttonAdd")}
      </Button>

      <Paper>
        <DataGrid
          rows={services}
          loading={loading}
          autoHeight
          disableSelectionOnClick
          pageSizeOptions={[10, 25, 50]}
          paginationModel={{ pageSize: 10, page: 0 }}
          columns={columns}
          localeText={localeText}
          getRowId={(row) => row.id}
        />
      </Paper>

      <Dialog open={open} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editing ? t("manager.service.dialog.editTitle") : t("manager.service.dialog.addTitle")}
        </DialogTitle>
        <DialogContent>
          <TextField
            label={t("manager.service.dialog.name")}
            fullWidth
            margin="dense"
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
          />
          <TextField
            label={t("manager.service.dialog.category")}
            fullWidth
            margin="dense"
            value={form.category}
            onChange={(event) => setForm({ ...form, category: event.target.value })}
          />
          <TextField
            label={t("manager.service.dialog.duration")}
            type="number"
            fullWidth
            margin="dense"
            value={form.duration}
            onChange={(event) =>
              setForm({ ...form, duration: Number(event.target.value) || 0 })
            }
          />
          <TextField
            label={t("manager.service.dialog.basePrice")}
            type="number"
            fullWidth
            margin="dense"
            value={form.base_price}
            onChange={(event) =>
              setForm({ ...form, base_price: Number(event.target.value) || 0 })
            }
          />
          <TextField
            label={t("manager.service.dialog.description")}
            multiline
            rows={3}
            fullWidth
            margin="dense"
            value={form.description}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>{t("manager.service.dialog.cancel")}</Button>
          <Button onClick={save} variant="contained">
            {editing ? t("manager.service.dialog.update") : t("manager.service.dialog.create")}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={imageModal} onClose={closeImages} maxWidth="md" fullWidth>
        <DialogTitle>{t("manager.service.imagesTitle", { defaultValue: "Service Images" })}</DialogTitle>
        <DialogContent dividers>
          {!imageTarget ? (
            <Box py={4} textAlign="center">
              <CircularProgress />
            </Box>
          ) : (
            <Stack spacing={2}>
              <Typography variant="subtitle1" fontWeight={700}>
                {imageTarget.name}
              </Typography>
              <Stack direction="row" spacing={2} alignItems="center">
                <Button
                  variant="outlined"
                  startIcon={<CloudUpload />}
                  component="label"
                  disabled={imageUploading}
                >
                  {t("manager.service.imagesUpload", { defaultValue: "Upload Image" })}
                  <input hidden type="file" accept="image/*" onChange={handleFileUpload} />
                </Button>
                {imageUploading && <Typography variant="body2">{t("common.uploading", { defaultValue: "Uploading…" })}</Typography>}
              </Stack>
              <Stack direction="row" spacing={2} flexWrap="wrap">
                {(imageTarget.images || []).map((img) => (
                  <Paper key={img.id} sx={{ p: 1, width: 160 }} variant="outlined">
                    <Box sx={{ position: "relative", pb: "100%", borderRadius: 2, overflow: "hidden", mb: 1 }}>
                      <Box
                        component="img"
                        src={resolveImageUrl(img)}
                        alt={img.filename || ""}
                        sx={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    </Box>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="caption" noWrap flex={1}>
                        {img.filename}
                      </Typography>
                      <IconButton size="small" onClick={() => removeImage(img.id)}>
                        <DeleteOutline fontSize="small" />
                      </IconButton>
                    </Stack>
                  </Paper>
                ))}
                {(imageTarget.images || []).length === 0 && (
                  <Typography variant="body2" color="text.secondary">
                    {t("manager.service.imagesEmpty", { defaultValue: "No images uploaded yet." })}
                  </Typography>
                )}
              </Stack>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeImages}>{t("common.close", { defaultValue: "Close" })}</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snk.open}
        autoHideDuration={3000}
        message={snk.key ? t(snk.key) : ""}
        onClose={() => setSnk((prev) => ({ ...prev, open: false }))}
      />
    </Box>
  );
};

export default ServiceManagement;
