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
  Divider,
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
  Checkbox,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { Add, Edit, Delete, PhotoCamera, CloudUpload, DeleteOutline } from "@mui/icons-material";
import api from "../../../utils/api";

const emptyForm = {
  name: "",
  category: "",
  duration: 60,
  base_price: 0,
  description: "",
  booking_mode: "one_to_one",
  default_capacity: 1,
  allow_packages: false,
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

  const columns = useMemo(
    () => [
      { field: "name", headerName: t("manager.service.columns.name"), flex: 1 },
      { field: "category", headerName: t("manager.service.columns.category"), flex: 1 },
      { field: "duration", headerName: t("manager.service.columns.duration"), width: 100 },
      {
        field: "booking_mode",
        headerName: t("manager.service.columns.bookingMode", "Booking type"),
        width: 140,
        valueFormatter: (params) =>
          params.value === "group"
            ? t("manager.service.booking.group", "Group")
            : t("manager.service.booking.oneToOne", "1:1"),
      },
      {
        field: "default_capacity",
        headerName: t("manager.service.columns.capacity", "Capacity"),
        width: 110,
        valueFormatter: (params) =>
          params.row?.booking_mode === "group"
            ? Number(params.value || 1)
            : "-",
      },
      {
        field: "base_price",
        headerName: t("manager.service.columns.price"),
        width: 140,
        valueFormatter: (params) => `$${Number(params.value).toFixed(2)}`,
      },
      {
        field: "actions",
        headerName: t("manager.service.columns.actions"),
        width: 160,
        sortable: false,
        filterable: false,
        disableColumnMenu: true,
        renderCell: (params) => (
          <>
            <IconButton
              color="primary"
              onClick={() => openImages(params.row)}
            >
              <PhotoCamera />
            </IconButton>
            <IconButton onClick={() => show(params.row)}>
              <Edit />
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
      const { data } = await api.get(`/booking/services?active=true`, auth);
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

  const show = (row = null) => {
    setEditing(row);
    if (row) {
      setForm({
        ...emptyForm,
        ...row,
        booking_mode: row.booking_mode || "one_to_one",
        default_capacity: Number(row.default_capacity || 1),
        allow_packages: Boolean(row.allow_packages),
      });
    } else {
      setForm(emptyForm);
    }
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
      await api.delete(`/booking/services/${id}`, auth);
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
        await api.put(`/booking/services/${editing.id}`, form, auth);
        setSnk({ open: true, key: "manager.service.messages.updated" });
      } else {
        await api.post(`/booking/services`, form, auth);
        setSnk({ open: true, key: "manager.service.messages.added" });
      }
      handleCloseDialog();
      load();
    } catch (err) {
      console.error("ServiceManagement save error", err);
      setSnk({ open: true, key: "manager.service.messages.saveFailed" });
    }
  };

  const openImages = async (row) => {
    setImageModal(true);
    setImageTarget(null);
    try {
      const { data } = await api.get(`/booking/services/${row.id}`, auth);
      setImageTarget(data);
    } catch (err) {
      console.error("ServiceManagement openImages error", err);
      setSnk({ open: true, key: "manager.service.messages.loadError" });
    }
  };

  const closeImages = () => {
    setImageModal(false);
    setImageTarget(null);
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !imageTarget) return;

    const formData = new FormData();
    formData.append("file", file);

    setImageUploading(true);
    try {
      await api.post(
        `/booking/services/${imageTarget.id}/images`,
        formData,
        {
          ...auth,
          headers: {
            ...auth.headers,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      const { data } = await api.get(`/booking/services/${imageTarget.id}`, auth);
      setImageTarget(data);
      setSnk({ open: true, key: "manager.service.messages.updated" });
    } catch (err) {
      console.error("ServiceManagement upload image error", err);
      setSnk({ open: true, key: "manager.service.messages.saveFailed" });
    } finally {
      setImageUploading(false);
      if (event?.target) {
        event.target.value = "";
      }
    }
  };

  const removeImage = async (imageId) => {
    if (!imageTarget) return;
    try {
      await api.delete(`/booking/service-images/${imageId}`, auth);
      const { data } = await api.get(`/booking/services/${imageTarget.id}`, auth);
      setImageTarget(data);
      setSnk({ open: true, key: "manager.service.messages.updated" });
    } catch (err) {
      console.error("ServiceManagement remove image error", err);
      setSnk({ open: true, key: "manager.service.messages.deleteFailed" });
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

          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle1" fontWeight={600}>
            {t("manager.service.dialog.bookingSettings", "Booking settings")}
          </Typography>

          <FormControl component="fieldset" sx={{ mt: 1 }}>
            <FormLabel component="legend">
              {t("manager.service.dialog.bookingType", "Booking type")}
            </FormLabel>
            <RadioGroup
              row
              value={form.booking_mode}
              onChange={(event) =>
                setForm({
                  ...form,
                  booking_mode: event.target.value,
                  default_capacity:
                    event.target.value === "group"
                      ? Math.max(1, Number(form.default_capacity || 1))
                      : 1,
                })
              }
            >
              <FormControlLabel
                value="one_to_one"
                control={<Radio />}
                label={t("manager.service.booking.oneToOne", "One-to-one")}
              />
              <FormControlLabel
                value="group"
                control={<Radio />}
                label={t("manager.service.booking.group", "Group / Class")}
              />
            </RadioGroup>
          </FormControl>

          {form.booking_mode === "group" && (
            <TextField
              label={t("manager.service.dialog.defaultCapacity", "Default capacity")}
              type="number"
              fullWidth
              margin="dense"
              inputProps={{ min: 1 }}
              value={form.default_capacity}
              onChange={(event) =>
                setForm({
                  ...form,
                  default_capacity: Math.max(1, Number(event.target.value) || 1),
                })
              }
            />
          )}

          <FormControlLabel
            sx={{ mt: 1 }}
            control={
              <Checkbox
                checked={Boolean(form.allow_packages)}
                onChange={(event) =>
                  setForm({ ...form, allow_packages: event.target.checked })
                }
              />
            }
            label={t(
              "manager.service.dialog.allowPackages",
              "Allow package redemption"
            )}
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
        <DialogTitle>{t("manager.service.images.title", "Service images")}</DialogTitle>
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
                  component="label"
                  startIcon={<CloudUpload />}
                  disabled={imageUploading}
                >
                  {t("manager.service.images.upload", "Upload image")}
                  <input hidden type="file" accept="image/*" onChange={handleFileUpload} />
                </Button>
                {imageUploading && (
                  <Typography variant="body2">
                    {t("manager.service.images.uploading", "Uploading…")}
                  </Typography>
                )}
              </Stack>

              <Stack direction="row" spacing={2} flexWrap="wrap">
                {(imageTarget.images || []).map((img) => (
                  <Paper key={img.id} sx={{ p: 1, width: 160 }} variant="outlined">
                    <Box
                      sx={{
                        position: "relative",
                        pb: "100%",
                        borderRadius: 2,
                        overflow: "hidden",
                        mb: 1,
                      }}
                    >
                      <Box
                        component="img"
                        src={img.url_public || img.url}
                        alt={img.filename}
                        sx={{
                          position: "absolute",
                          inset: 0,
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
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
                    {t("manager.service.images.empty", "No images yet")}
                  </Typography>
                )}
              </Stack>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeImages}>{t("manager.service.images.close", "Close")}</Button>
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
