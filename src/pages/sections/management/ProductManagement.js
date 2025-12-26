import React, { useCallback, useEffect, useMemo, useState } from "react";
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
  Chip,
  CircularProgress,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import {
  Add,
  Edit,
  Delete,
  PhotoCamera,
  CloudUpload,
  DeleteOutline,
} from "@mui/icons-material";
import api from "../../../utils/api";

const emptyForm = {
  sku: "",
  name: "",
  description: "",
  price: "0",
  cost: "",
  qty_on_hand: 0,
  track_stock: true,
  is_active: true,
};

const ProductManagement = ({ token }) => {
  const { t, i18n } = useTranslation();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [snk, setSnk] = useState({ open: false, message: "" });

  const [imageModal, setImageModal] = useState(false);
  const [imageTarget, setImageTarget] = useState(null);
  const [imageUploading, setImageUploading] = useState(false);

  const auth = useMemo(() => ({ headers: { Authorization: `Bearer ${token}` } }), [token]);

  const notify = useCallback((message) => {
    setSnk({ open: true, message });
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/inventory/products`, auth);
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load products", err);
      const fallback = t("manager.product.messages.loadError");
      const serverMessage = err?.response?.data?.error || err?.message || fallback;
      notify(serverMessage);
    } finally {
      setLoading(false);
    }
  }, [auth, notify, t]);

  useEffect(() => {
    load();
  }, [load]);

  const handleOpen = useCallback((row = null) => {
    setEditing(row);
    if (row) {
      setForm({
        sku: row.sku || "",
        name: row.name || "",
        description: row.description || "",
        price: row.price != null ? String(row.price) : "0",
        cost: row.cost != null ? String(row.cost) : "",
        qty_on_hand: row.qty_on_hand ?? 0,
        track_stock: !!row.track_stock,
        is_active: !!row.is_active,
      });
    } else {
      setForm(emptyForm);
    }
    setOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
    setEditing(null);
    setForm(emptyForm);
  }, []);

  const handleChange = useCallback(
    (field) => (event) => {
      const value =
        field === "track_stock" || field === "is_active"
          ? event.target.checked
          : event.target.value;
      setForm((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const persist = useCallback(async () => {
    const payload = {
      ...form,
      price: form.price === "" ? "0" : form.price,
      cost: form.cost === "" ? null : form.cost,
      qty_on_hand: Number(form.qty_on_hand || 0),
    };

    try {
      if (editing) {
        await api.patch(`/inventory/products/${editing.id}`, payload, auth);
        notify(t("manager.product.messages.updated"));
      } else {
        await api.post(`/inventory/products`, payload, auth);
        notify(t("manager.product.messages.added"));
      }
      handleClose();
      load();
    } catch (err) {
      console.error("Failed to save product", err);
      notify(t("manager.product.messages.saveFailed"));
    }
  }, [auth, editing, form, handleClose, load, notify, t]);

  const handleDelete = useCallback(
    async (id) => {
      try {
        await api.delete(`/inventory/products/${id}`, auth);
        load();
        notify(t("manager.product.messages.deleted"));
      } catch (err) {
        console.error("Failed to delete product", err);
        notify(t("manager.product.messages.deleteFailed"));
      }
    },
    [auth, load, notify, t]
  );

  const openImages = useCallback(
    async (row) => {
      setImageTarget(null);
      setImageModal(true);
      try {
        const { data } = await api.get(`/inventory/products/${row.id}`, auth);
        setImageTarget(data);
      } catch (err) {
        console.error("Failed to load product images", err);
        notify(t("manager.product.messages.loadError"));
      }
    },
    [auth, notify, t]
  );

  const closeImages = useCallback(() => {
    setImageModal(false);
    setImageTarget(null);
  }, []);

  const handleFileUpload = useCallback(
    async (event) => {
      const file = event.target.files?.[0];
      if (!file || !imageTarget) return;

      const formData = new FormData();
      formData.append("file", file);

      setImageUploading(true);
      try {
        await api.post(`/inventory/products/${imageTarget.id}/images`, formData, {
          ...auth,
          headers: {
            ...auth.headers,
            "Content-Type": "multipart/form-data",
          },
        });
        notify(t("manager.product.messages.uploadSuccess"));
        const { data } = await api.get(`/inventory/products/${imageTarget.id}`, auth);
        setImageTarget(data);
      } catch (err) {
        console.error("Image upload failed", err);
        notify(t("manager.product.messages.uploadFailed"));
      } finally {
        setImageUploading(false);
      }
    },
    [auth, imageTarget, notify, t]
  );

  const removeImage = useCallback(
    async (imageId) => {
      if (!imageTarget) return;
      try {
        await api.delete(`/inventory/products/${imageTarget.id}/images/${imageId}`, auth);
        const { data } = await api.get(`/inventory/products/${imageTarget.id}`, auth);
        setImageTarget(data);
      } catch (err) {
        console.error("Failed to remove image", err);
        notify(t("manager.product.messages.removeFailed"));
      }
    },
    [auth, imageTarget, notify, t]
  );

  const columns = useMemo(
    () => [
      { field: "sku", headerName: t("manager.product.columns.sku"), width: 120 },
      { field: "name", headerName: t("manager.product.columns.name"), flex: 1 },
      {
        field: "price",
        headerName: t("manager.product.columns.price"),
        width: 140,
        valueFormatter: (params) => `$${Number(params.value ?? 0).toFixed(2)}`,
      },
      {
        field: "qty_on_hand",
        headerName: t("manager.product.columns.stock"),
        width: 120,
        valueGetter: (params) => params.row.qty_on_hand ?? 0,
        renderCell: (params) => (
          <Chip
            label={params.value ?? 0}
            color={params.value > 0 ? "success" : "default"}
            size="small"
          />
        ),
      },
      {
        field: "actions",
        headerName: t("manager.product.columns.actions"),
        width: 180,
        sortable: false,
        filterable: false,
        disableColumnMenu: true,
        renderCell: (params) => (
          <Stack direction="row" spacing={1}>
            <IconButton onClick={() => handleOpen(params.row)}>
              <Edit />
            </IconButton>
            <IconButton
              color={params.row.is_active ? "primary" : "default"}
              onClick={() => openImages(params.row)}
            >
              <PhotoCamera />
            </IconButton>
            <IconButton color="error" onClick={() => handleDelete(params.row.id)}>
              <Delete />
            </IconButton>
          </Stack>
        ),
      },
    ],
    [handleDelete, handleOpen, openImages, t, i18n.language]
  );

  const localeText = useMemo(
    () => ({
      noRowsLabel: t("manager.product.table.noRows"),
      footerRowPerPage: t("common.rowsPerPage"),
    }),
    [i18n.language, t]
  );

  return (
    <Box p={3}>
      <Typography variant="h4" mb={2}>
        {t("manager.product.title")}
      </Typography>

      <Button startIcon={<Add />} variant="contained" sx={{ mb: 2 }} onClick={() => handleOpen()}>
        {t("manager.product.buttonAdd")}
      </Button>

      <Paper>
        <DataGrid
          rows={products}
          getRowId={(row) => row.id}
          loading={loading}
          autoHeight
          disableSelectionOnClick
          pageSizeOptions={[10, 25, 50]}
          paginationModel={{ pageSize: 10, page: 0 }}
          columns={columns}
          localeText={localeText}
        />
      </Paper>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editing ? t("manager.product.dialog.editTitle") : t("manager.product.dialog.addTitle")}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label={t("manager.product.labels.sku")}
                value={form.sku}
                onChange={handleChange("sku")}
                fullWidth
              />
              <TextField
                label={t("manager.product.labels.name")}
                value={form.name}
                onChange={handleChange("name")}
                fullWidth
              />
            </Stack>
            <TextField
              label={t("manager.product.labels.description")}
              value={form.description}
              onChange={handleChange("description")}
              fullWidth
              multiline
              minRows={3}
            />
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label={t("manager.product.labels.price")}
                type="number"
                value={form.price}
                onChange={handleChange("price")}
                fullWidth
                inputProps={{ step: "0.01" }}
              />
              <TextField
                label={t("manager.product.labels.cost")}
                type="number"
                value={form.cost}
                onChange={handleChange("cost")}
                fullWidth
                inputProps={{ step: "0.01" }}
              />
            </Stack>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label={t("manager.product.labels.qty")}
                type="number"
                value={form.qty_on_hand}
                onChange={handleChange("qty_on_hand")}
                fullWidth
              />
              <Stack spacing={1}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <input
                    id="track_stock"
                    type="checkbox"
                    checked={form.track_stock}
                    onChange={handleChange("track_stock")}
                  />
                  <label htmlFor="track_stock">{t("manager.product.labels.track")}</label>
                </Stack>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <input
                    id="is_active"
                    type="checkbox"
                    checked={form.is_active}
                    onChange={handleChange("is_active")}
                  />
                  <label htmlFor="is_active">{t("manager.product.labels.visible")}</label>
                </Stack>
              </Stack>
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>{t("manager.product.dialog.cancel")}</Button>
          <Button variant="contained" onClick={persist}>
            {editing ? t("manager.product.dialog.save") : t("manager.product.dialog.create")}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={imageModal} onClose={closeImages} maxWidth="md" fullWidth>
        <DialogTitle>{t("manager.product.images.title")}</DialogTitle>
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
                  {t("manager.product.images.upload")}
                  <input hidden type="file" accept="image/*" onChange={handleFileUpload} />
                </Button>
                {imageUploading && (
                  <Typography variant="body2">{t("manager.product.images.uploading")}</Typography>
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
                        src={
                          img.url_public ||
                          img.url ||
                          `${process.env.REACT_APP_API_BASE || "http://localhost:5000"}/public/product-images/${img.id}`
                        }
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
                    {t("manager.product.images.empty")}
                  </Typography>
                )}
              </Stack>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeImages}>{t("manager.product.images.close")}</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snk.open}
        autoHideDuration={4000}
        onClose={() => setSnk((prev) => ({ ...prev, open: false }))}
        message={snk.message}
      />
    </Box>
  );
};

export default ProductManagement;
