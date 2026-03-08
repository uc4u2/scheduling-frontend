import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Box,
  Button,
  Checkbox,
  Divider,
  Drawer,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  TextField,
  Typography,
  IconButton,
  Snackbar,
  Paper,
  Stack,
  Chip,
  CircularProgress,
  Tooltip,
  Alert,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import {
  Add,
  HelpOutline,
  Edit,
  Delete,
  LocalShipping,
  PhotoCamera,
  CloudUpload,
  DeleteOutline,
  InfoOutlined,
  History,
} from "@mui/icons-material";
import api from "../../../utils/api";
import EasyPostShippingSettingsPanel from "./EasyPostShippingSettingsPanel";

const emptyForm = {
  sku: "",
  name: "",
  description: "",
  category: "",
  slug: "",
  meta_title: "",
  meta_description: "",
  price: "0",
  cost: "",
  qty_on_hand: 0,
  low_stock_threshold: "",
  track_stock: true,
  is_digital: false,
  delivery_methods_override_enabled: false,
  delivery_allow_pickup: false,
  delivery_allow_shipping: false,
  delivery_allow_local_delivery: false,
  digital_asset_id: "",
  is_active: true,
  adjustment_note: "",
};

const fieldLabelWithTooltip = (label, tooltip) => (
  <Stack direction="row" spacing={0.5} alignItems="center">
    <span>{label}</span>
    <Tooltip title={tooltip} arrow>
      <InfoOutlined sx={{ fontSize: 16, color: "text.secondary", cursor: "help" }} />
    </Tooltip>
  </Stack>
);

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
  const [helpOpen, setHelpOpen] = useState(false);
  const [lowStockSummary, setLowStockSummary] = useState({ count: 0, out_of_stock_count: 0, low_stock_count: 0 });
  const [lowStockItems, setLowStockItems] = useState([]);
  const [movementOpen, setMovementOpen] = useState(false);
  const [movementLoading, setMovementLoading] = useState(false);
  const [movementRows, setMovementRows] = useState([]);
  const [movementTarget, setMovementTarget] = useState(null);
  const [globalMovementOpen, setGlobalMovementOpen] = useState(false);
  const [deliverySetupOpen, setDeliverySetupOpen] = useState(false);
  const [globalDeliveryPolicy, setGlobalDeliveryPolicy] = useState({
    allow_pickup: false,
    allow_shipping: true,
    allow_local_delivery: false,
  });
  const [globalMovementLoading, setGlobalMovementLoading] = useState(false);
  const [globalMovementRows, setGlobalMovementRows] = useState([]);
  const [globalMovementPagination, setGlobalMovementPagination] = useState({ page: 1, per_page: 50, total: 0 });
  const [globalMovementFilters, setGlobalMovementFilters] = useState({
    product_id: "",
    reason: "",
    q: "",
    page: 1,
  });

  const auth = useMemo(() => ({ headers: { Authorization: `Bearer ${token}` } }), [token]);

  const notify = useCallback((message) => {
    setSnk({ open: true, message });
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/inventory/products`, auth);
      setProducts(Array.isArray(data) ? data : []);
      try {
        const { data: shippingSettings } = await api.get(`/inventory/shipping-settings`, auth);
        setGlobalDeliveryPolicy({
          allow_pickup: Boolean(shippingSettings?.allow_pickup),
          allow_shipping: shippingSettings?.allow_shipping !== false,
          allow_local_delivery: Boolean(shippingSettings?.allow_local_delivery),
        });
      } catch {
        setGlobalDeliveryPolicy({
          allow_pickup: false,
          allow_shipping: true,
          allow_local_delivery: false,
        });
      }
      try {
        const { data: lowStock } = await api.get(`/inventory/products/low-stock?limit=10`, auth);
        setLowStockSummary(lowStock?.summary || { count: 0, out_of_stock_count: 0, low_stock_count: 0 });
        setLowStockItems(Array.isArray(lowStock?.items) ? lowStock.items : []);
      } catch {
        setLowStockSummary({ count: 0, out_of_stock_count: 0, low_stock_count: 0 });
        setLowStockItems([]);
      }
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
        category: row.category || "",
        slug: row.slug || "",
        meta_title: row.meta_title || "",
        meta_description: row.meta_description || "",
        price: row.price != null ? String(row.price) : "0",
        cost: row.cost != null ? String(row.cost) : "",
        qty_on_hand: row.qty_on_hand ?? 0,
        low_stock_threshold: row.low_stock_threshold ?? "",
        track_stock: !!row.track_stock,
        is_digital: !!row.is_digital,
        delivery_methods_override_enabled: !!row.delivery_methods_override_enabled,
        delivery_allow_pickup: !!row.delivery_allow_pickup,
        delivery_allow_shipping: !!row.delivery_allow_shipping,
        delivery_allow_local_delivery: !!row.delivery_allow_local_delivery,
        digital_asset_id: row.digital_asset_id != null ? String(row.digital_asset_id) : "",
        is_active: !!row.is_active,
        adjustment_note: "",
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
        field === "track_stock" ||
        field === "is_active" ||
        field === "is_digital" ||
        field === "delivery_methods_override_enabled" ||
        field === "delivery_allow_pickup" ||
        field === "delivery_allow_shipping" ||
        field === "delivery_allow_local_delivery"
          ? event.target.checked
          : event.target.value;
      setForm((prev) => {
        if (field === "delivery_methods_override_enabled" && value) {
          const hasAnyMethod =
            Boolean(prev.delivery_allow_pickup) ||
            Boolean(prev.delivery_allow_shipping) ||
            Boolean(prev.delivery_allow_local_delivery);
          // Safe default for override mode: shipping enabled if nothing is selected yet.
          return {
            ...prev,
            [field]: value,
            delivery_allow_shipping: hasAnyMethod ? prev.delivery_allow_shipping : true,
          };
        }
        return { ...prev, [field]: value };
      });
    },
    []
  );

  const persist = useCallback(async () => {
    if (
      form.delivery_methods_override_enabled &&
      !form.delivery_allow_pickup &&
      !form.delivery_allow_shipping &&
      !form.delivery_allow_local_delivery
    ) {
      notify("Select at least one delivery method when product delivery override is enabled.");
      return;
    }

    const payload = {
      ...form,
      price: form.price === "" ? "0" : form.price,
      cost: form.cost === "" ? null : form.cost,
      qty_on_hand: Number(form.qty_on_hand || 0),
      low_stock_threshold: form.low_stock_threshold === "" ? null : Number(form.low_stock_threshold),
      digital_asset_id: form.digital_asset_id === "" ? null : Number(form.digital_asset_id),
    };
    if (editing && Number(form.qty_on_hand || 0) !== Number(editing.qty_on_hand || 0)) {
      payload.adjustment_note = String(form.adjustment_note || "").trim() || null;
      payload.adjustment_reason = "manual_adjustment";
    }

    try {
      if (editing) {
        await api.patch(`/inventory/products/${editing.id}`, payload, auth);
        notify(t("manager.product.messages.updated"));
      } else {
        const { data: saved } = await api.post(`/inventory/products`, payload, auth);
        const baseMessage = t("manager.product.messages.added");
        if (!form.sku && saved?.sku) {
          notify(`${baseMessage} (SKU: ${saved.sku})`);
        } else {
          notify(baseMessage);
        }
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
          (() => {
            const qty = Number(params.value ?? 0);
            const threshold = Number(params.row?.low_stock_threshold ?? 0);
            const isLow = Number.isFinite(threshold) && threshold > 0 && qty <= threshold;
            const color = qty <= 0 ? "default" : isLow ? "warning" : "success";
            return <Chip label={qty} color={color} size="small" />;
          })()
        ),
      },
      {
        field: "category",
        headerName: "Category",
        width: 140,
        valueGetter: (params) => params.row.category || "",
      },
      {
        field: "is_digital",
        headerName: "Type",
        width: 120,
        valueGetter: (params) => (params.row.is_digital ? "Digital" : "Physical"),
      },
      {
        field: "actions",
        headerName: t("manager.product.columns.actions"),
        width: 220,
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
            <IconButton onClick={() => {
              setMovementTarget(params.row);
              setMovementOpen(true);
            }}>
              <History />
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

  useEffect(() => {
    if (!movementOpen || !movementTarget?.id) return;
    let alive = true;
    setMovementLoading(true);
    api
      .get(`/inventory/products/${movementTarget.id}/movements?page=1&page_size=100`, auth)
      .then(({ data }) => {
        if (!alive) return;
        setMovementRows(Array.isArray(data?.items) ? data.items : []);
      })
      .catch(() => {
        if (!alive) return;
        setMovementRows([]);
      })
      .finally(() => {
        if (!alive) return;
        setMovementLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [movementOpen, movementTarget, auth]);

  useEffect(() => {
    if (!globalMovementOpen) return;
    let alive = true;
    setGlobalMovementLoading(true);
    const params = {
      page: globalMovementFilters.page || 1,
      page_size: globalMovementPagination.per_page || 50,
    };
    if (globalMovementFilters.product_id) params.product_id = globalMovementFilters.product_id;
    if (globalMovementFilters.reason) params.reason = globalMovementFilters.reason;
    if (String(globalMovementFilters.q || "").trim()) params.q = String(globalMovementFilters.q).trim();
    api
      .get(`/inventory/stock-movements`, { ...auth, params })
      .then(({ data }) => {
        if (!alive) return;
        setGlobalMovementRows(Array.isArray(data?.items) ? data.items : []);
        const pg = data?.pagination || {};
        setGlobalMovementPagination((prev) => ({
          page: Number(pg.page || params.page || 1),
          per_page: Number(pg.per_page || prev.per_page || 50),
          total: Number(pg.total || 0),
        }));
      })
      .catch(() => {
        if (!alive) return;
        setGlobalMovementRows([]);
        setGlobalMovementPagination((prev) => ({ ...prev, total: 0 }));
      })
      .finally(() => {
        if (!alive) return;
        setGlobalMovementLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [globalMovementOpen, globalMovementFilters, globalMovementPagination.per_page, auth]);

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

      <Stack direction="row" spacing={1.5} sx={{ mb: 2 }}>
        <Button startIcon={<Add />} variant="contained" onClick={() => handleOpen()}>
          {t("manager.product.buttonAdd")}
        </Button>
        <Tooltip title="Configure checkout delivery methods (manual policy) and EasyPost automation in one place." arrow>
          <Button
            startIcon={<LocalShipping />}
            variant="outlined"
            color="inherit"
            onClick={() => setDeliverySetupOpen(true)}
          >
            Delivery setup
          </Button>
        </Tooltip>
        <Button
          startIcon={<History />}
          variant="outlined"
          color="inherit"
          onClick={() => setGlobalMovementOpen(true)}
        >
          Stock history
        </Button>
        <Button
          startIcon={<HelpOutline />}
          variant="outlined"
          color="inherit"
          onClick={() => setHelpOpen(true)}
        >
          Help
        </Button>
      </Stack>

      <Paper sx={{ mb: 2, p: 1.5 }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ xs: "flex-start", sm: "center" }}>
          <Chip label={`Low-stock alerts: ${Number(lowStockSummary.count || 0)}`} color={Number(lowStockSummary.count || 0) > 0 ? "warning" : "default"} />
          <Chip label={`Out of stock: ${Number(lowStockSummary.out_of_stock_count || 0)}`} color="default" size="small" />
          <Chip label={`Low stock: ${Number(lowStockSummary.low_stock_count || 0)}`} color="warning" size="small" />
        </Stack>
        {lowStockItems.length > 0 && (
          <List dense sx={{ mt: 1 }}>
            {lowStockItems.slice(0, 5).map((item) => (
              <ListItem key={item.id} disableGutters>
                <ListItemText
                  primary={`${item.name} (${item.sku})`}
                  secondary={`Stock ${item.qty_on_hand} / threshold ${item.low_stock_threshold ?? "-"}`}
                />
              </ListItem>
            ))}
          </List>
        )}
      </Paper>

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
        <DialogContent dividers sx={{ backgroundColor: (theme) => theme.palette.background.paper }}>
          <Stack spacing={2.5} mt={0.5}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 700 }}>
              Core details
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label={fieldLabelWithTooltip(
                  t("manager.product.labels.sku"),
                  "Unique stock code. Leave blank to auto-generate."
                )}
                value={form.sku}
                onChange={handleChange("sku")}
                fullWidth
                helperText="Leave blank to auto-generate"
              />
              <TextField
                label={fieldLabelWithTooltip(t("manager.product.labels.name"), "Customer-facing product name.")}
                value={form.name}
                onChange={handleChange("name")}
                fullWidth
              />
            </Stack>
            <TextField
              label={fieldLabelWithTooltip(
                t("manager.product.labels.description"),
                "Short description shown on product cards and details."
              )}
              value={form.description}
              onChange={handleChange("description")}
              fullWidth
              multiline
              minRows={3}
            />
            <Divider />
            <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 700 }}>
              Catalog and SEO
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label={fieldLabelWithTooltip("Category", "Use categories to group and filter products.")}
                value={form.category}
                onChange={handleChange("category")}
                fullWidth
              />
              <TextField
                label={fieldLabelWithTooltip(
                  "Slug (optional)",
                  "Optional URL-safe identifier for this product."
                )}
                value={form.slug}
                onChange={handleChange("slug")}
                fullWidth
              />
            </Stack>
            <Divider />
            <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 700 }}>
              Pricing and inventory
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label={fieldLabelWithTooltip(
                  "Meta title (optional)",
                  "SEO page title for this product when indexed."
                )}
                value={form.meta_title}
                onChange={handleChange("meta_title")}
                fullWidth
              />
              <TextField
                label={fieldLabelWithTooltip(
                  "Meta description (optional)",
                  "SEO summary for search engines."
                )}
                value={form.meta_description}
                onChange={handleChange("meta_description")}
                fullWidth
              />
            </Stack>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label={fieldLabelWithTooltip(
                  t("manager.product.labels.price"),
                  "Selling price charged to customers."
                )}
                type="number"
                value={form.price}
                onChange={handleChange("price")}
                fullWidth
                inputProps={{ step: "0.01" }}
              />
              <TextField
                label={fieldLabelWithTooltip(
                  t("manager.product.labels.cost"),
                  "Internal cost for margin reporting."
                )}
                type="number"
                value={form.cost}
                onChange={handleChange("cost")}
                fullWidth
                inputProps={{ step: "0.01" }}
              />
            </Stack>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label={fieldLabelWithTooltip(
                  t("manager.product.labels.qty"),
                  "Current on-hand inventory quantity."
                )}
                type="number"
                value={form.qty_on_hand}
                onChange={handleChange("qty_on_hand")}
                fullWidth
              />
              <TextField
                label={fieldLabelWithTooltip(
                  "Low stock threshold",
                  "When stock is at or below this number, the list shows low-stock warning."
                )}
                type="number"
                value={form.low_stock_threshold}
                onChange={handleChange("low_stock_threshold")}
                fullWidth
              />
            </Stack>
            {editing && Number(form.qty_on_hand || 0) !== Number(editing.qty_on_hand || 0) && (
              <Alert severity="info">
                Stock will be adjusted from {Number(editing.qty_on_hand || 0)} to {Number(form.qty_on_hand || 0)}.
                Add a note for audit history.
              </Alert>
            )}
            {editing && Number(form.qty_on_hand || 0) !== Number(editing.qty_on_hand || 0) && (
              <TextField
                label="Stock adjustment note (optional)"
                value={form.adjustment_note}
                onChange={handleChange("adjustment_note")}
                fullWidth
                multiline
                minRows={2}
              />
            )}
            <TextField
              label={fieldLabelWithTooltip(
                "Digital asset ID (optional)",
                "Optional media asset reference for downloadable products."
              )}
              type="number"
              value={form.digital_asset_id}
              onChange={handleChange("digital_asset_id")}
              fullWidth
            />
            <Divider />
            <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 700 }}>
              Product behavior
            </Typography>
            <Stack spacing={0.5}>
              <FormControlLabel
                control={(
                  <Checkbox
                    id="track_stock"
                    checked={form.track_stock}
                    onChange={handleChange("track_stock")}
                  />
                )}
                label={fieldLabelWithTooltip(
                  t("manager.product.labels.track"),
                  "If enabled, sales decrement inventory and stock checks apply."
                )}
              />
              <FormControlLabel
                control={(
                  <Checkbox
                    id="is_digital"
                    checked={form.is_digital}
                    onChange={handleChange("is_digital")}
                  />
                )}
                label={fieldLabelWithTooltip(
                  "Digital product",
                  "Marks item as digital; physical shipping can be skipped."
                )}
              />
              <FormControlLabel
                control={(
                  <Checkbox
                    id="delivery_methods_override_enabled"
                    checked={form.delivery_methods_override_enabled}
                    onChange={handleChange("delivery_methods_override_enabled")}
                  />
                )}
                label={fieldLabelWithTooltip(
                  "Product delivery override (advanced)",
                  "If enabled, this product can narrow delivery methods relative to Products -> Delivery setup."
                )}
              />
              {!form.delivery_methods_override_enabled && (
                <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
                  Override is off. This product uses workspace defaults from Products -> Delivery setup.
                </Typography>
              )}
              {form.delivery_methods_override_enabled && (
                <>
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                    <Tooltip
                      title={globalDeliveryPolicy.allow_pickup ? "" : "Enable pickup in Products -> Delivery setup first."}
                      arrow
                    >
                      <span>
                        <FormControlLabel
                          control={(
                            <Checkbox
                              id="delivery_allow_pickup"
                              checked={form.delivery_allow_pickup}
                              onChange={handleChange("delivery_allow_pickup")}
                              disabled={!globalDeliveryPolicy.allow_pickup}
                            />
                          )}
                          label="Allow pickup"
                        />
                      </span>
                    </Tooltip>
                    <Tooltip
                      title={globalDeliveryPolicy.allow_shipping ? "" : "Enable shipping in Products -> Delivery setup first."}
                      arrow
                    >
                      <span>
                        <FormControlLabel
                          control={(
                            <Checkbox
                              id="delivery_allow_shipping"
                              checked={form.delivery_allow_shipping}
                              onChange={handleChange("delivery_allow_shipping")}
                              disabled={!globalDeliveryPolicy.allow_shipping}
                            />
                          )}
                          label="Allow shipping"
                        />
                      </span>
                    </Tooltip>
                    <Tooltip
                      title={globalDeliveryPolicy.allow_local_delivery ? "" : "Enable local delivery in Products -> Delivery setup first."}
                      arrow
                    >
                      <span>
                        <FormControlLabel
                          control={(
                            <Checkbox
                              id="delivery_allow_local_delivery"
                              checked={form.delivery_allow_local_delivery}
                              onChange={handleChange("delivery_allow_local_delivery")}
                              disabled={!globalDeliveryPolicy.allow_local_delivery}
                            />
                          )}
                          label="Allow local delivery"
                        />
                      </span>
                    </Tooltip>
                  </Stack>
                  <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
                    Override is on. This product uses custom allowed delivery methods, narrowed from Products -> Delivery setup.
                  </Typography>
                </>
              )}
              <FormControlLabel
                control={(
                  <Checkbox
                    id="is_active"
                    checked={form.is_active}
                    onChange={handleChange("is_active")}
                  />
                )}
                label={fieldLabelWithTooltip(
                  t("manager.product.labels.visible"),
                  "If disabled, the product is hidden from public catalog."
                )}
              />
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

      <Drawer
        anchor="right"
        open={helpOpen}
        onClose={() => setHelpOpen(false)}
        sx={{
          zIndex: (theme) => theme.zIndex.modal + 2000,
          "& .MuiDrawer-paper": { zIndex: "inherit" },
        }}
        PaperProps={{ sx: { width: { xs: "100%", sm: 460 }, p: 2.5 } }}
      >
        <Stack spacing={2}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Product Management Help
            </Typography>
            <Button size="small" onClick={() => setHelpOpen(false)}>Close</Button>
          </Stack>

          <Typography variant="body2" color="text.secondary">
            Use this page to create products, control visibility, and keep inventory accurate for checkout and fulfillment.
          </Typography>

          <Divider />

          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Field Guide</Typography>
          <Stack spacing={1.25}>
            <Typography variant="body2"><strong>SKU:</strong> Internal stock code. Keep it unique and stable for reporting.</Typography>
            <Typography variant="body2"><strong>Name:</strong> Customer-facing product name.</Typography>
            <Typography variant="body2"><strong>Description:</strong> Short plain-language summary shown on product pages.</Typography>
            <Typography variant="body2"><strong>Category:</strong> Used for grouping/filtering catalog items.</Typography>
            <Typography variant="body2"><strong>Slug:</strong> Optional URL-safe identifier for cleaner links.</Typography>
            <Typography variant="body2"><strong>Meta title / description:</strong> Optional SEO text for public product pages.</Typography>
            <Typography variant="body2"><strong>Price:</strong> Amount customer pays.</Typography>
            <Typography variant="body2"><strong>Cost:</strong> Internal cost for margin tracking.</Typography>
            <Typography variant="body2"><strong>Quantity on hand:</strong> Current inventory count.</Typography>
            <Typography variant="body2"><strong>Low stock threshold:</strong> Warning level used in manager list.</Typography>
            <Typography variant="body2"><strong>Digital asset ID:</strong> Optional link to a digital media/download record.</Typography>
            <Typography variant="body2"><strong>Track inventory:</strong> If on, sales decrement stock and stock checks apply.</Typography>
            <Typography variant="body2"><strong>Digital product:</strong> Marks item as digital; physical delivery may be skipped.</Typography>
            <Typography variant="body2"><strong>Visible on site:</strong> If off, hidden from public catalog.</Typography>
          </Stack>

          <Divider />

          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Example Setup</Typography>
          <Paper variant="outlined" sx={{ p: 1.5, backgroundColor: "background.default" }}>
            <Stack spacing={0.75}>
              <Typography variant="body2"><strong>Example:</strong> “Sterling Silver Ring”</Typography>
              <Typography variant="body2">SKU: <code>RING-STERLING-001</code></Typography>
              <Typography variant="body2">Category: <code>Jewelry</code></Typography>
              <Typography variant="body2">Price: <code>129.00</code> / Cost: <code>62.00</code></Typography>
              <Typography variant="body2">Quantity on hand: <code>18</code></Typography>
              <Typography variant="body2">Low stock threshold: <code>5</code></Typography>
              <Typography variant="body2">Track inventory: <code>On</code></Typography>
              <Typography variant="body2">Visible on site: <code>On</code></Typography>
            </Stack>
          </Paper>

          <Divider />

          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Manager Tips</Typography>
          <Stack spacing={1}>
            <Typography variant="body2">Use the Images action to upload product photos after saving.</Typography>
            <Typography variant="body2">Use <strong>Delivery setup</strong> to control checkout delivery methods and EasyPost automation policy.</Typography>
            <Typography variant="body2">For physical products, keep <strong>Track inventory</strong> enabled.</Typography>
            <Typography variant="body2">Set low-stock threshold early to avoid overselling.</Typography>
          </Stack>
        </Stack>
      </Drawer>

      <Drawer
        anchor="right"
        open={deliverySetupOpen}
        onClose={() => setDeliverySetupOpen(false)}
        sx={{
          zIndex: (theme) => theme.zIndex.modal + 2000,
          "& .MuiDrawer-paper": { zIndex: "inherit" },
        }}
        PaperProps={{ sx: { width: { xs: "100%", sm: 980 }, p: 2.5 } }}
      >
        <Stack spacing={2}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Delivery setup
            </Typography>
            <Button size="small" onClick={() => setDeliverySetupOpen(false)}>Close</Button>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            Source of truth for checkout delivery policy in Products. Use the Delivery Methods tab for legacy/manual checkout options and EasyPost Automation tab for shipping automation only.
          </Typography>
          <EasyPostShippingSettingsPanel token={token} compact />
        </Stack>
      </Drawer>

      <Drawer
        anchor="right"
        open={globalMovementOpen}
        onClose={() => setGlobalMovementOpen(false)}
        sx={{
          zIndex: (theme) => theme.zIndex.modal + 2000,
          "& .MuiDrawer-paper": { zIndex: "inherit" },
        }}
        PaperProps={{ sx: { width: { xs: "100%", sm: 560 }, p: 2 } }}
      >
        <Stack spacing={2}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Global stock movements
            </Typography>
            <Button size="small" onClick={() => setGlobalMovementOpen(false)}>Close</Button>
          </Stack>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            <TextField
              select
              size="small"
              label="Product"
              value={globalMovementFilters.product_id}
              SelectProps={{ native: true, displayEmpty: true }}
              InputLabelProps={{ shrink: true }}
              onChange={(e) => setGlobalMovementFilters((prev) => ({ ...prev, product_id: e.target.value, page: 1 }))}
              sx={{ minWidth: 180 }}
            >
              <option value="">All</option>
              {products.map((p) => (
                <option key={p.id} value={String(p.id)}>
                  {p.name} ({p.sku})
                </option>
              ))}
            </TextField>
            <TextField
              select
              size="small"
              label="Reason"
              value={globalMovementFilters.reason}
              SelectProps={{ native: true, displayEmpty: true }}
              InputLabelProps={{ shrink: true }}
              onChange={(e) => setGlobalMovementFilters((prev) => ({ ...prev, reason: e.target.value, page: 1 }))}
              sx={{ minWidth: 170 }}
            >
              <option value="">All</option>
              <option value="manual_adjustment">Manual adjustment</option>
              <option value="sale">Sale</option>
              <option value="refund_restock">Refund restock</option>
              <option value="order_capture">Order capture</option>
            </TextField>
            <TextField
              size="small"
              label="Search"
              value={globalMovementFilters.q}
              onChange={(e) => setGlobalMovementFilters((prev) => ({ ...prev, q: e.target.value, page: 1 }))}
              placeholder="SKU, name, note"
              fullWidth
            />
          </Stack>

          {globalMovementLoading ? (
            <Box py={4} textAlign="center"><CircularProgress /></Box>
          ) : globalMovementRows.length === 0 ? (
            <Typography variant="body2" color="text.secondary">No movement records for current filters.</Typography>
          ) : (
            <Stack spacing={1}>
              {globalMovementRows.map((row) => (
                <Paper key={row.id} variant="outlined" sx={{ p: 1.25 }}>
                  <Stack direction="row" justifyContent="space-between" spacing={2}>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {row.qty_change > 0 ? `+${row.qty_change}` : row.qty_change}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {row.created_at ? new Date(row.created_at).toLocaleString() : ""}
                    </Typography>
                  </Stack>
                  <Typography variant="body2">
                    {row.product_name} ({row.product_sku})
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Reason: {row.reason || "movement"}
                  </Typography>
                  {row.note && (
                    <Typography variant="caption" color="text.secondary" display="block">
                      {row.note}
                    </Typography>
                  )}
                </Paper>
              ))}
            </Stack>
          )}

          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ xs: "flex-start", sm: "center" }}>
              <Typography variant="caption" color="text.secondary">
                {globalMovementPagination.total} records
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Page {globalMovementFilters.page}
              </Typography>
              <TextField
                select
                size="small"
                label="Rows"
                value={globalMovementPagination.per_page}
                SelectProps={{ native: true }}
                onChange={(e) =>
                  setGlobalMovementPagination((prev) => ({
                    ...prev,
                    per_page: Number(e.target.value) || 50,
                  }))
                }
                sx={{ width: 96 }}
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </TextField>
            </Stack>
            <Stack direction="row" spacing={1}>
              <Button
                size="small"
                disabled={globalMovementFilters.page <= 1 || globalMovementLoading}
                onClick={() => setGlobalMovementFilters((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
              >
                Previous
              </Button>
              <Button
                size="small"
                disabled={(globalMovementFilters.page * globalMovementPagination.per_page) >= globalMovementPagination.total || globalMovementLoading}
                onClick={() => setGlobalMovementFilters((prev) => ({ ...prev, page: prev.page + 1 }))}
              >
                Next
              </Button>
            </Stack>
          </Stack>
        </Stack>
      </Drawer>

      <Dialog
        open={movementOpen}
        onClose={() => {
          setMovementOpen(false);
          setMovementRows([]);
          setMovementTarget(null);
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Stock history {movementTarget?.name ? `- ${movementTarget.name}` : ""}
        </DialogTitle>
        <DialogContent dividers>
          {movementLoading ? (
            <Box py={4} textAlign="center"><CircularProgress /></Box>
          ) : movementRows.length === 0 ? (
            <Typography variant="body2" color="text.secondary">No stock movements yet.</Typography>
          ) : (
            <Stack spacing={1}>
              {movementRows.map((row) => (
                <Paper key={row.id} variant="outlined" sx={{ p: 1.25 }}>
                  <Stack direction="row" justifyContent="space-between" spacing={2}>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {row.qty_change > 0 ? `+${row.qty_change}` : row.qty_change}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {row.created_at ? new Date(row.created_at).toLocaleString() : ""}
                    </Typography>
                  </Stack>
                  <Typography variant="body2">{row.reason || "movement"}</Typography>
                  {row.note && (
                    <Typography variant="caption" color="text.secondary">
                      {row.note}
                    </Typography>
                  )}
                </Paper>
              ))}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setMovementOpen(false);
            setMovementRows([]);
            setMovementTarget(null);
          }}>
            Close
          </Button>
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
