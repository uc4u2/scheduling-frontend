import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  Grid,
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
  Tooltip,
  Typography,
} from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { useTranslation } from "react-i18next";
import { useSnackbar } from "notistack";
import { getActiveCurrency, normalizeCurrency, subscribeToActiveCurrency } from "../../utils/currency";
import {
  adjustInventoryItem,
  createInventoryCategory,
  createInventoryItem,
  deleteInventoryItem,
  listInventoryCategories,
  listInventoryItems,
  listInventoryTransactions,
  updateInventoryItem,
} from "./financeApi";
import FinanceEmptyState from "./components/FinanceEmptyState";
import FinanceMetricCard from "./components/FinanceMetricCard";
import FinancePagination from "./components/FinancePagination";

const blankItemForm = {
  name: "",
  category_id: "",
  sku: "",
  unit: "each",
  cost_per_unit: "0",
  optional_sell_price: "",
  low_stock_threshold: "",
  taxable: false,
  is_active: true,
  vendor_name: "",
};

const blankAdjustmentForm = {
  quantity_delta: "",
  unit_cost: "",
  note: "",
};

const blankCategoryForm = {
  name: "",
  is_active: true,
};

const parseNumber = (value, fallback = 0) => {
  if (value === "" || value === null || value === undefined) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const formatMoney = (value, currency = "USD") =>
  new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currency || "USD",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

const availabilityChipColor = (state) => {
  switch (state) {
    case "out_of_stock":
      return "error";
    case "low_available":
      return "warning";
    case "partially_available":
      return "info";
    default:
      return "success";
  }
};

const availabilityChipLabel = (state, tInventory) => {
  switch (state) {
    case "out_of_stock":
      return tInventory("availability.outOfStock", "Out of stock");
    case "low_available":
      return tInventory("availability.lowAvailable", "Low available");
    case "partially_available":
      return tInventory("availability.partiallyAvailable", "Partially available");
    default:
      return tInventory("availability.fullyAvailable", "Fully available");
  }
};

function InventoryCategoryDialog({ open, onClose, onSubmit }) {
  const { t } = useTranslation();
  const tInventory = React.useCallback(
    (key, fallback, options = {}) => t(`manager.finance.materials.${key}`, { defaultValue: fallback, ...options }),
    [t]
  );
  const [form, setForm] = useState(blankCategoryForm);

  useEffect(() => {
    if (!open) return;
    setForm(blankCategoryForm);
  }, [open]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{tInventory("categoryDialog.title", "Add Materials Category")}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} sx={{ mt: 0.25 }}>
          <Tooltip title={tInventory("categoryDialog.tooltip", "Used to organize stock items, not expense reporting.")}>
            <Stack direction="row" spacing={0.5} alignItems="center" sx={{ width: "fit-content" }}>
              <Typography variant="caption" color="text.secondary">{tInventory("categoryDialog.materialsCategories", "Materials categories")}</Typography>
              <InfoOutlinedIcon sx={{ fontSize: 16, color: "text.secondary" }} />
            </Stack>
          </Tooltip>
          <TextField
            fullWidth
            label={tInventory("categoryDialog.categoryName", "Materials category name")}
            value={form.name}
            onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={form.is_active}
                onChange={(e) => setForm((current) => ({ ...current, is_active: e.target.checked }))}
              />
            }
            label={tInventory("categoryDialog.activeCategory", "Active materials category")}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{tInventory("common.cancel", "Cancel")}</Button>
        <Button variant="contained" onClick={() => onSubmit({ ...form, parent_group: "materials" })}>{tInventory("categoryDialog.create", "Create materials category")}</Button>
      </DialogActions>
    </Dialog>
  );
}

function InventoryItemDialog({ open, onClose, onSubmit, categories, initialValues, suggestedCategoryId, onOpenCategoryDialog }) {
  const { t } = useTranslation();
  const tInventory = React.useCallback(
    (key, fallback, options = {}) => t(`manager.finance.materials.${key}`, { defaultValue: fallback, ...options }),
    [t]
  );
  const [form, setForm] = useState(blankItemForm);

  useEffect(() => {
    if (!open) return;
    setForm({
      ...blankItemForm,
      ...initialValues,
      category_id: suggestedCategoryId ?? initialValues?.category_id ?? "",
      cost_per_unit: initialValues?.cost_per_unit ?? "0",
      optional_sell_price: initialValues?.optional_sell_price ?? "",
      low_stock_threshold: initialValues?.low_stock_threshold ?? "",
      taxable: Boolean(initialValues?.taxable),
      is_active: initialValues?.is_active !== false,
    });
  }, [open, initialValues, suggestedCategoryId]);

  useEffect(() => {
    if (!open || suggestedCategoryId == null || suggestedCategoryId === "") return;
    setForm((current) => ({ ...current, category_id: suggestedCategoryId }));
  }, [open, suggestedCategoryId]);

  const handleChange = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{initialValues?.id ? tInventory("itemDialog.editTitle", "Edit item") : tInventory("itemDialog.addTitle", "Add item")}</DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2} sx={{ mt: 0.25 }}>
          <Grid item xs={12} md={6}>
            <TextField fullWidth label={tInventory("itemDialog.itemName", "Item name")} value={form.name} onChange={(e) => handleChange("name", e.target.value)} />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>{tInventory("itemDialog.category", "Materials Category")}</InputLabel>
              <Select
                label={tInventory("itemDialog.category", "Materials Category")}
                value={form.category_id}
                onChange={(e) => handleChange("category_id", e.target.value)}
              >
                <MenuItem value="">{tInventory("itemDialog.noCategory", "No category")}</MenuItem>
                {categories.map((category) => (
                  <MenuItem key={category.id} value={category.id}>{category.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Tooltip title={tInventory("categoryDialog.tooltip", "Used to organize stock items, not expense reporting.")}>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
                {tInventory("categoryDialog.tooltip", "Used to organize stock items, not expense reporting.")}
              </Typography>
            </Tooltip>
            <Button size="small" sx={{ mt: 1 }} onClick={onOpenCategoryDialog}>{tInventory("itemDialog.addCategory", "Add Materials Category")}</Button>
          </Grid>
          <Grid item xs={12} md={6}><TextField fullWidth label={tInventory("itemDialog.sku", "SKU")} value={form.sku} onChange={(e) => handleChange("sku", e.target.value)} /></Grid>
          <Grid item xs={12} md={6}><TextField fullWidth label={tInventory("itemDialog.unit", "Unit")} value={form.unit} onChange={(e) => handleChange("unit", e.target.value)} /></Grid>
          <Grid item xs={12} md={6}><TextField fullWidth label={tInventory("itemDialog.costPerUnit", "Cost per unit")} value={form.cost_per_unit} onChange={(e) => handleChange("cost_per_unit", e.target.value)} /></Grid>
          <Grid item xs={12} md={6}><TextField fullWidth label={tInventory("itemDialog.optionalSellPrice", "Optional sell price")} value={form.optional_sell_price} onChange={(e) => handleChange("optional_sell_price", e.target.value)} /></Grid>
          <Grid item xs={12} md={6}><TextField fullWidth label={tInventory("itemDialog.lowStockThreshold", "Low stock threshold")} value={form.low_stock_threshold} onChange={(e) => handleChange("low_stock_threshold", e.target.value)} /></Grid>
          <Grid item xs={12} md={6}><TextField fullWidth label={tInventory("itemDialog.vendorName", "Preferred vendor name")} value={form.vendor_name} onChange={(e) => handleChange("vendor_name", e.target.value)} /></Grid>
          <Grid item xs={12} md={6}><FormControlLabel control={<Checkbox checked={form.taxable} onChange={(e) => handleChange("taxable", e.target.checked)} />} label={tInventory("itemDialog.taxable", "Taxable")} /></Grid>
          <Grid item xs={12} md={6}><FormControlLabel control={<Checkbox checked={form.is_active} onChange={(e) => handleChange("is_active", e.target.checked)} />} label={tInventory("itemDialog.activeItem", "Active item")} /></Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{tInventory("common.cancel", "Cancel")}</Button>
        <Button
          variant="contained"
          onClick={() => onSubmit({
            ...form,
            cost_per_unit: parseNumber(form.cost_per_unit, 0),
            optional_sell_price: form.optional_sell_price === "" ? "" : parseNumber(form.optional_sell_price, 0),
            low_stock_threshold: form.low_stock_threshold === "" ? "" : parseNumber(form.low_stock_threshold, 0),
          })}
        >
          {tInventory("common.save", "Save")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function InventoryAdjustmentDialog({ open, onClose, item, onSubmit }) {
  const { t } = useTranslation();
  const tInventory = React.useCallback(
    (key, fallback, options = {}) => t(`manager.finance.materials.${key}`, { defaultValue: fallback, ...options }),
    [t]
  );
  const [form, setForm] = useState(blankAdjustmentForm);

  useEffect(() => {
    if (!open) return;
    setForm({
      ...blankAdjustmentForm,
      unit_cost: item?.cost_per_unit ?? "",
    });
  }, [open, item]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{tInventory("adjustDialog.title", "Adjust stock")}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} sx={{ mt: 0.25 }}>
          <Alert severity="info">{tInventory("adjustDialog.auditInfo", "Stock changes are recorded as transactions for audit.")}</Alert>
          <Typography variant="body2" color="text.secondary">
            {tInventory("adjustDialog.currentQuantity", "Current quantity")}: {item?.current_quantity ?? 0}
          </Typography>
          <TextField
            fullWidth
            label={tInventory("adjustDialog.quantityChange", "Quantity change")}
            helperText={tInventory("adjustDialog.quantityHelp", "Use a positive number to add stock or a negative number to reduce stock.")}
            value={form.quantity_delta}
            onChange={(e) => setForm((current) => ({ ...current, quantity_delta: e.target.value }))}
          />
          <TextField
            fullWidth
            label={tInventory("adjustDialog.unitCost", "Unit cost")}
            value={form.unit_cost}
            onChange={(e) => setForm((current) => ({ ...current, unit_cost: e.target.value }))}
          />
          <TextField
            fullWidth
            multiline
            minRows={3}
            label={tInventory("adjustDialog.note", "Note")}
            value={form.note}
            onChange={(e) => setForm((current) => ({ ...current, note: e.target.value }))}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{tInventory("common.cancel", "Cancel")}</Button>
        <Button
          variant="contained"
          onClick={() =>
            onSubmit({
              quantity_delta: parseNumber(form.quantity_delta, 0),
              unit_cost: form.unit_cost === "" ? "" : parseNumber(form.unit_cost, 0),
              note: form.note,
            })
          }
        >
          {tInventory("adjustDialog.saveAdjustment", "Save adjustment")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function InventoryTransactionsDialog({ open, onClose, item, transactions, currency }) {
  const { t } = useTranslation();
  const tInventory = React.useCallback(
    (key, fallback, options = {}) => t(`manager.finance.materials.${key}`, { defaultValue: fallback, ...options }),
    [t]
  );
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{tInventory("historyDialog.title", "Stock history")}{item?.name ? ` • ${item.name}` : ""}</DialogTitle>
      <DialogContent dividers>
        {!transactions.length ? (
          <Typography variant="body2" color="text.secondary">{tInventory("historyDialog.empty", "No stock transactions yet.")}</Typography>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>{tInventory("historyDialog.headers.when", "When")}</TableCell>
                <TableCell>{tInventory("historyDialog.headers.type", "Type")}</TableCell>
                <TableCell>{tInventory("historyDialog.headers.quantity", "Quantity")}</TableCell>
                <TableCell>{tInventory("historyDialog.headers.unitCost", "Unit cost")}</TableCell>
                <TableCell>{tInventory("historyDialog.headers.source", "Source")}</TableCell>
                <TableCell>{tInventory("historyDialog.headers.note", "Note")}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {transactions.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.created_at || "-"}</TableCell>
                  <TableCell>{row.transaction_type || "-"}</TableCell>
                  <TableCell>{row.quantity_delta}</TableCell>
                  <TableCell>{row.unit_cost != null ? formatMoney(row.unit_cost, currency) : "-"}</TableCell>
                  <TableCell>{row.source_type || tInventory("historyDialog.manual", "manual")}</TableCell>
                  <TableCell>{row.note || "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DialogContent>
      <DialogActions><Button onClick={onClose}>{tInventory("common.close", "Close")}</Button></DialogActions>
    </Dialog>
  );
}

export default function InventoryPage() {
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  const tInventory = React.useCallback(
    (key, fallback, options = {}) => t(`manager.finance.materials.${key}`, { defaultValue: fallback, ...options }),
    [t]
  );
  const [activeCurrency, setActiveCurrency] = useState(() => normalizeCurrency(getActiveCurrency("USD")) || "USD");
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [editorCategoryId, setEditorCategoryId] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [categoriesRes, itemsRes] = await Promise.all([
        listInventoryCategories(),
        listInventoryItems({
          q: search || undefined,
          category_id: categoryId || undefined,
          low_stock: lowStockOnly || undefined,
          active: true,
          page,
          per_page: perPage,
        }),
      ]);
      setCategories(Array.isArray(categoriesRes?.items) ? categoriesRes.items : Array.isArray(categoriesRes) ? categoriesRes : []);
      setItems(Array.isArray(itemsRes?.items) ? itemsRes.items : []);
      setPagination(itemsRes?.pagination || null);
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || tInventory("errors.loadFailed", "Unable to load inventory."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // Search stays manual via Enter so the list does not refetch on every keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId, lowStockOnly, page, perPage]);

  useEffect(() => subscribeToActiveCurrency((next) => {
    setActiveCurrency(normalizeCurrency(next) || "USD");
  }), []);

  const metrics = useMemo(() => {
    const lowStockCount = items.filter((item) => item.low_available_stock).length;
    const inventoryValue = items.reduce((sum, item) => sum + Number(item.current_quantity || 0) * Number(item.cost_per_unit || 0), 0);
    const reservedValue = items.reduce((sum, item) => sum + Number(item.reserved_quantity || 0), 0);
    return {
      lowStockCount,
      inventoryValue,
      activeItems: Number(pagination?.total || items.length),
      reservedValue,
    };
  }, [items, pagination]);

  const loadTransactionsForItem = async (item) => {
    setSelectedItem(item);
    try {
      const res = await listInventoryTransactions({ item_id: item.id, page: 1, per_page: 100 });
      setTransactions(Array.isArray(res?.items) ? res.items : []);
      setHistoryOpen(true);
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.error || err?.message || tInventory("errors.loadHistoryFailed", "Unable to load stock history."), { variant: "error" });
    }
  };

  const handleSaveItem = async (payload) => {
    try {
      if (selectedItem?.id && editorOpen) {
        await updateInventoryItem(selectedItem.id, payload);
        enqueueSnackbar(tInventory("snackbar.itemUpdated", "Inventory item updated."), { variant: "success" });
      } else {
        await createInventoryItem(payload);
        enqueueSnackbar(tInventory("snackbar.itemAdded", "Inventory item added."), { variant: "success" });
      }
      setEditorOpen(false);
      setSelectedItem(null);
      await load();
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.error || err?.message || tInventory("errors.saveItemFailed", "Unable to save inventory item."), { variant: "error" });
    }
  };

  const handleDelete = async (item) => {
    try {
      await deleteInventoryItem(item.id);
      enqueueSnackbar(tInventory("snackbar.itemArchived", "Item archived."), { variant: "success" });
      await load();
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.error || err?.message || tInventory("errors.archiveItemFailed", "Unable to archive item."), { variant: "error" });
    }
  };

  const handleCreateCategory = async (payload) => {
    try {
      const res = await createInventoryCategory(payload);
      const createdCategory = res?.category || null;
      enqueueSnackbar(tInventory("snackbar.categoryAdded", "Category added."), { variant: "success" });
      setCategoryDialogOpen(false);
      await load();
      if (createdCategory?.id) {
        setEditorCategoryId(createdCategory.id);
      }
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.error || err?.message || tInventory("errors.addCategoryFailed", "Unable to add category."), { variant: "error" });
    }
  };

  const handleAdjust = async (payload) => {
    try {
      await adjustInventoryItem(selectedItem.id, payload);
      enqueueSnackbar(tInventory("snackbar.stockAdjusted", "Stock adjusted."), { variant: "success" });
      setAdjustOpen(false);
      await load();
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.error || err?.message || tInventory("errors.adjustStockFailed", "Unable to adjust stock."), { variant: "error" });
    }
  };

  return (
    <Stack spacing={2.5}>
      <Alert severity="info">{tInventory("availabilityInfo", "Low available stock considers items reserved for active jobs. Stock is only deducted after manager approval of actual usage.")}</Alert>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} lg={4}><FinanceMetricCard label={tInventory("metrics.activeItems", "Active items")} value={String(metrics.activeItems)} accent="primary" /></Grid>
        <Grid item xs={12} sm={6} lg={4}><FinanceMetricCard label={tInventory("metrics.lowStockItems", "Low available stock")} value={String(metrics.lowStockCount)} accent="warning" helper={tInventory("metrics.lowStockHelper", "Considers stock reserved for active jobs.")} /></Grid>
        <Grid item xs={12} sm={6} lg={4}><FinanceMetricCard label={tInventory("metrics.inventoryValueEstimate", "Inventory value estimate")} value={formatMoney(metrics.inventoryValue, activeCurrency)} accent="secondary" helper={tInventory("metrics.inventoryValueHelper", "Based on current quantity and cost per unit.")} /></Grid>
        <Grid item xs={12} sm={6} lg={4}><FinanceMetricCard label={tInventory("metrics.reservedQuantity", "Reserved quantity")} value={String(metrics.reservedValue)} accent="info" helper={tInventory("metrics.reservedQuantityHelper", "Planned on active jobs, but not deducted yet.")} /></Grid>
      </Grid>

      <Paper variant="outlined" sx={{ p: 2, borderRadius: 1 }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} justifyContent="space-between">
          <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
            <TextField
              size="small"
              label={tInventory("toolbar.searchItems", "Search items")}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") load();
              }}
            />
            <FormControl size="small" sx={{ minWidth: 220 }}>
              <InputLabel>{tInventory("toolbar.materialsCategory", "Materials Category")}</InputLabel>
              <Select label={tInventory("toolbar.materialsCategory", "Materials Category")} value={categoryId} onChange={(e) => { setCategoryId(e.target.value); setPage(1); }}>
                <MenuItem value="">{tInventory("toolbar.allMaterialsCategories", "All materials categories")}</MenuItem>
                {categories.map((category) => (
                  <MenuItem key={category.id} value={category.id}>{category.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControlLabel control={<Checkbox checked={lowStockOnly} onChange={(e) => { setLowStockOnly(e.target.checked); setPage(1); }} />} label={tInventory("toolbar.lowStockOnly", "Low stock only")} />
            <Button variant="outlined" onClick={load}>{tInventory("toolbar.refresh", "Refresh")}</Button>
            <Button variant="outlined" onClick={() => setCategoryDialogOpen(true)}>{tInventory("toolbar.addMaterialsCategory", "Add Materials Category")}</Button>
          </Stack>
          <Button
            variant="contained"
            onClick={() => {
              setSelectedItem(null);
              setEditorCategoryId("");
              setEditorOpen(true);
            }}
          >
            {tInventory("toolbar.addItem", "Add item")}
          </Button>
        </Stack>
      </Paper>

      {loading ? (
        <Stack alignItems="center" sx={{ py: 8 }}><CircularProgress /></Stack>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : items.length === 0 ? (
        <FinanceEmptyState
          title={tInventory("empty.title", "No stock items yet")}
          description={tInventory("empty.description", "Add your first stock item.")}
          actionLabel={tInventory("empty.action", "Add item")}
          onAction={() => {
            setSelectedItem(null);
            setEditorCategoryId("");
            setEditorOpen(true);
          }}
        />
      ) : (
        <Paper variant="outlined" sx={{ overflowX: "auto" }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>{tInventory("table.headers.name", "Name")}</TableCell>
                <TableCell>{tInventory("table.headers.category", "Category")}</TableCell>
                <TableCell>{tInventory("table.headers.sku", "SKU")}</TableCell>
                <TableCell>{tInventory("table.headers.unit", "Unit")}</TableCell>
                <TableCell>{tInventory("table.headers.onHand", "On hand")}</TableCell>
                <TableCell>{tInventory("table.headers.reserved", "Reserved")}</TableCell>
                <TableCell>{tInventory("table.headers.available", "Available")}</TableCell>
                <TableCell>{tInventory("table.headers.pendingUsage", "Pending usage")}</TableCell>
                <TableCell>{tInventory("table.headers.cost", "Cost")}</TableCell>
                <TableCell>{tInventory("table.headers.lowStockLevel", "Low stock level")}</TableCell>
                <TableCell>{tInventory("table.headers.vendor", "Vendor")}</TableCell>
                <TableCell align="right">{tInventory("table.headers.actions", "Actions")}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((item) => {
                const overReserved = Number(item.available_quantity || 0) < 0;
                return (
                  <TableRow key={item.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={700}>{item.name}</Typography>
                      <Stack direction="row" spacing={0.75} sx={{ mt: 0.5, flexWrap: "wrap" }}>
                        <Chip
                          size="small"
                          color={availabilityChipColor(item.stock_conflict_state)}
                          variant="outlined"
                          label={availabilityChipLabel(item.stock_conflict_state, tInventory)}
                        />
                      </Stack>
                      <Typography variant="body2" color="text.secondary">{item.is_active === false ? tInventory("table.inactive", "Inactive") : item.taxable ? tInventory("table.taxable", "Taxable") : tInventory("table.nonTaxable", "Non-taxable")}</Typography>
                      {overReserved ? (
                        <Typography variant="body2" color="error.main">
                          {tInventory("table.overReserved", "Over-reserved by {{count}}", { count: Math.abs(Number(item.available_quantity || 0)) })}
                        </Typography>
                      ) : null}
                    </TableCell>
                    <TableCell>{item.category_name || "-"}</TableCell>
                    <TableCell>{item.sku || "-"}</TableCell>
                    <TableCell>{item.unit || tInventory("table.each", "each")}</TableCell>
                    <TableCell>{item.on_hand_quantity ?? item.current_quantity}</TableCell>
                    <TableCell>{item.reserved_quantity ?? 0}</TableCell>
                    <TableCell>
                      <Typography variant="body2">{item.available_quantity ?? item.current_quantity}</Typography>
                      {item.low_available_stock ? <Typography variant="body2" color="warning.main">{tInventory("table.lowAvailable", "Low available")}</Typography> : null}
                    </TableCell>
                    <TableCell>{item.pending_usage_quantity ?? 0}</TableCell>
                    <TableCell>{formatMoney(item.cost_per_unit, activeCurrency)}</TableCell>
                    <TableCell>{item.low_stock_threshold ?? "-"}</TableCell>
                    <TableCell>{item.vendor_name || "-"}</TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <Button size="small" onClick={() => { setSelectedItem(item); setEditorOpen(true); }}>{tInventory("table.edit", "Edit")}</Button>
                        <Button size="small" onClick={() => { setSelectedItem(item); setAdjustOpen(true); }}>{tInventory("table.adjustStock", "Adjust stock")}</Button>
                        <Button size="small" onClick={() => loadTransactionsForItem(item)}>{tInventory("table.history", "History")}</Button>
                        <Button size="small" color="error" onClick={() => handleDelete(item)}>{tInventory("table.archive", "Archive")}</Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Paper>
      )}

      <FinancePagination
        pagination={pagination}
        page={page}
        perPage={perPage}
        onPageChange={setPage}
        onPerPageChange={(next) => {
          setPerPage(next);
          setPage(1);
        }}
      />

      <InventoryItemDialog
        open={editorOpen}
        onClose={() => { setEditorOpen(false); setSelectedItem(null); setEditorCategoryId(""); }}
        onSubmit={handleSaveItem}
        categories={categories.filter((category) => category.is_active !== false)}
        initialValues={selectedItem}
        suggestedCategoryId={editorCategoryId}
        onOpenCategoryDialog={() => setCategoryDialogOpen(true)}
      />

      <InventoryCategoryDialog
        open={categoryDialogOpen}
        onClose={() => setCategoryDialogOpen(false)}
        onSubmit={handleCreateCategory}
      />

      <InventoryAdjustmentDialog
        open={adjustOpen}
        onClose={() => setAdjustOpen(false)}
        item={selectedItem}
        onSubmit={handleAdjust}
      />

      <InventoryTransactionsDialog
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        item={selectedItem}
        transactions={transactions}
        currency={activeCurrency}
      />
    </Stack>
  );
}
