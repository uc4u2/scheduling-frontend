import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Divider,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Drawer,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
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
import CloseIcon from "@mui/icons-material/Close";
import { alpha, useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import { useSnackbar } from "notistack";
import { getActiveCurrency, normalizeCurrency, subscribeToActiveCurrency } from "../../utils/currency";
import {
  adjustInventoryItem,
  commitFinanceInventoryItemImport,
  createInventoryCategory,
  createInventoryItem,
  deleteInventoryItem,
  downloadFinanceInventoryItemImportTemplate,
  listFinanceImportHistory,
  listInventoryCategories,
  listInventoryItems,
  listInventoryTransactions,
  previewFinanceInventoryItemImport,
  updateInventoryItem,
} from "./financeApi";
import FinanceImportDialog from "./FinanceImportDialog";
import FinanceMetricCard from "./components/FinanceMetricCard";
import FinancePagination from "./components/FinancePagination";

const blankItemForm = {
  name: "",
  category_id: "",
  sku: "",
  description: "",
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

const formatQuantity = (value) => {
  const parsed = Number(value || 0);
  if (!Number.isFinite(parsed)) return "0";
  return Number.isInteger(parsed)
    ? String(parsed)
    : parsed.toLocaleString(undefined, { maximumFractionDigits: 4 });
};

const formatDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

function downloadBlobFromResponse(response, fallbackName) {
  const blob = response?.data;
  if (!(blob instanceof Blob)) return;
  const header = response?.headers?.["content-disposition"] || "";
  const match = /filename=\"?([^\";]+)\"?/i.exec(header);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = match?.[1] || fallbackName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

const availabilityChipColor = (state) => {
  switch (state) {
    case "inactive":
      return "default";
    case "over_reserved":
    case "out_of_stock":
      return "error";
    case "low_available":
      return "warning";
    case "uncategorized":
      return "secondary";
    default:
      return "success";
  }
};

const availabilityChipLabel = (state, tInventory) => {
  switch (state) {
    case "inactive":
      return tInventory("availability.inactive", "Inactive");
    case "over_reserved":
      return tInventory("availability.overReserved", "Over-reserved");
    case "out_of_stock":
      return tInventory("availability.outOfStock", "Out of stock");
    case "low_available":
      return tInventory("availability.lowAvailable", "Low available");
    case "uncategorized":
      return tInventory("availability.uncategorized", "Uncategorized");
    case "partially_available":
      return tInventory("availability.partiallyAvailable", "Partially available");
    default:
      return tInventory("availability.available", "Available");
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
      <DialogTitle>{tInventory("categoryDialog.title", "Add Inventory Category")}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} sx={{ mt: 0.25 }}>
          <Tooltip title={tInventory("categoryDialog.tooltip", "Used to organize stock items, parts, supplies, equipment, and resale products.")}>
            <Stack direction="row" spacing={0.5} alignItems="center" sx={{ width: "fit-content" }}>
              <Typography variant="caption" color="text.secondary">{tInventory("categoryDialog.materialsCategories", "Inventory categories")}</Typography>
              <InfoOutlinedIcon sx={{ fontSize: 16, color: "text.secondary" }} />
            </Stack>
          </Tooltip>
          <TextField
            fullWidth
            label={tInventory("categoryDialog.categoryName", "Inventory category name")}
            value={form.name}
            onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))}
          />
          <Alert severity="info">
            {tInventory(
              "categoryDialog.defaultsGuide",
              "Default categories already cover materials, supplies, parts, products for sale, equipment, consumables, and other. Add custom categories only when you need a clearer internal grouping."
            )}
          </Alert>
          <FormControlLabel
            control={
              <Checkbox
                checked={form.is_active}
                onChange={(e) => setForm((current) => ({ ...current, is_active: e.target.checked }))}
              />
            }
            label={tInventory("categoryDialog.activeCategory", "Active inventory category")}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{tInventory("common.cancel", "Cancel")}</Button>
        <Button variant="contained" onClick={() => onSubmit({ ...form, parent_group: "materials" })}>{tInventory("categoryDialog.create", "Create inventory category")}</Button>
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
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{initialValues?.id ? tInventory("itemDialog.editTitle", "Edit item") : tInventory("itemDialog.addTitle", "Add item")}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2.5} sx={{ mt: 0.25 }}>
          <Box>
            <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1 }}>
              {tInventory("itemDialog.identitySection", "Item identity")}
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField fullWidth label={tInventory("itemDialog.itemName", "Item name")} value={form.name} onChange={(e) => handleChange("name", e.target.value)} />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>{tInventory("itemDialog.category", "Inventory Category")}</InputLabel>
                  <Select
                    label={tInventory("itemDialog.category", "Inventory Category")}
                    value={form.category_id}
                    onChange={(e) => handleChange("category_id", e.target.value)}
                  >
                    <MenuItem value="">{tInventory("itemDialog.noCategory", "Uncategorized")}</MenuItem>
                    {categories.map((category) => (
                      <MenuItem key={category.id} value={category.id}>{category.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Tooltip title={tInventory("categoryDialog.tooltip", "Used to organize stock items, parts, supplies, equipment, and resale products.")}>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
                    {tInventory("itemDialog.categoryHelper", "Used to organize stock items, parts, supplies, equipment, and resale products.")}
                  </Typography>
                </Tooltip>
                <Button size="small" sx={{ mt: 1 }} onClick={onOpenCategoryDialog}>{tInventory("itemDialog.addCategory", "Add Inventory Category")}</Button>
              </Grid>
              <Grid item xs={12} md={6}><TextField fullWidth label={tInventory("itemDialog.sku", "SKU")} value={form.sku} onChange={(e) => handleChange("sku", e.target.value)} /></Grid>
              <Grid item xs={12} md={6}><TextField fullWidth label={tInventory("itemDialog.description", "Description")} value={form.description} onChange={(e) => handleChange("description", e.target.value)} /></Grid>
            </Grid>
          </Box>

          <Box>
            <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1 }}>
              {tInventory("itemDialog.stockPricingSection", "Stock and pricing")}
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}><TextField fullWidth label={tInventory("itemDialog.unit", "Unit")} value={form.unit} onChange={(e) => handleChange("unit", e.target.value)} /></Grid>
              <Grid item xs={12} md={6}><TextField fullWidth label={tInventory("itemDialog.costPerUnit", "Cost per unit")} value={form.cost_per_unit} onChange={(e) => handleChange("cost_per_unit", e.target.value)} /></Grid>
              <Grid item xs={12} md={6}><TextField fullWidth label={tInventory("itemDialog.optionalSellPrice", "Optional sell price")} value={form.optional_sell_price} onChange={(e) => handleChange("optional_sell_price", e.target.value)} /></Grid>
              <Grid item xs={12} md={6}><TextField fullWidth label={tInventory("itemDialog.lowStockThreshold", "Low stock threshold")} value={form.low_stock_threshold} onChange={(e) => handleChange("low_stock_threshold", e.target.value)} helperText={tInventory("itemDialog.lowStockThresholdHelper", "The item appears in replenishment review when available stock falls to or below this level.")} /></Grid>
            </Grid>
          </Box>

          <Box>
            <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1 }}>
              {tInventory("itemDialog.supplierTaxSection", "Supplier and tax")}
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}><TextField fullWidth label={tInventory("itemDialog.vendorName", "Preferred vendor")} value={form.vendor_name} onChange={(e) => handleChange("vendor_name", e.target.value)} /></Grid>
              <Grid item xs={12} md={6}>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ height: "100%", justifyContent: "center" }}>
                  <FormControlLabel control={<Checkbox checked={form.taxable} onChange={(e) => handleChange("taxable", e.target.checked)} />} label={tInventory("itemDialog.taxable", "Taxable")} />
                  <FormControlLabel control={<Checkbox checked={form.is_active} onChange={(e) => handleChange("is_active", e.target.checked)} />} label={tInventory("itemDialog.activeItem", "Active item")} />
                </Stack>
              </Grid>
            </Grid>
          </Box>
        </Stack>
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
          <Alert severity="info">{tInventory("adjustDialog.auditInfo", "Stock changes are recorded as transactions for audit. Use adjustments for corrections, not normal job usage.")}</Alert>
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
                  <TableCell>{formatDateTime(row.created_at)}</TableCell>
                  <TableCell>{row.transaction_type || "-"}</TableCell>
                  <TableCell>{formatQuantity(row.quantity_delta)}</TableCell>
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

function InventoryGuideDrawer({ open, onClose, tInventory }) {
  const theme = useTheme();
  const sections = [
    {
      title: tInventory("guide.sections.workspace.title", "What this workspace does"),
      body: [
        tInventory("guide.sections.workspace.line1", "Use this page to manage stock items used on jobs, supplies, parts, equipment, and resale products."),
        tInventory("guide.sections.workspace.line2", "This page is operational. It is not a help board, purchasing system, or accounting replacement."),
      ],
    },
    {
      title: tInventory("guide.sections.meaning.title", "What the quantities mean"),
      body: [
        tInventory("guide.sections.meaning.onHand", "On hand: what is currently in stock based on official transactions."),
        tInventory("guide.sections.meaning.reserved", "Reserved: planned on active work orders, but not deducted yet."),
        tInventory("guide.sections.meaning.available", "Available: on hand minus reserved."),
        tInventory("guide.sections.meaning.pending", "Pending usage: field-reported usage waiting for manager review."),
      ],
    },
    {
      title: tInventory("guide.sections.flow.title", "How stock moves"),
      body: [
        tInventory("guide.sections.flow.step1", "Purchases and stock adjustments add on-hand stock."),
        tInventory("guide.sections.flow.step2", "Work orders reserve stock when materials are planned."),
        tInventory("guide.sections.flow.step3", "Field reports submit actual usage for review."),
        tInventory("guide.sections.flow.step4", "Manager review approval makes the deduction official."),
      ],
    },
    {
      title: tInventory("guide.sections.bestPractices.title", "Best practices"),
      body: [
        tInventory("guide.sections.bestPractices.line1", "Use inventory categories consistently."),
        tInventory("guide.sections.bestPractices.line2", "Set low-stock thresholds for items you routinely reorder."),
        tInventory("guide.sections.bestPractices.line3", "Use SKU for duplicate control when suppliers provide one."),
        tInventory("guide.sections.bestPractices.line4", "Keep old items inactive instead of deleting them if transactions already exist."),
      ],
    },
    {
      title: tInventory("guide.sections.categories.title", "Default category meanings"),
      body: [
        tInventory("guide.sections.categories.materials", "Materials: job-installed items."),
        tInventory("guide.sections.categories.supplies", "Supplies: operating supplies."),
        tInventory("guide.sections.categories.parts", "Parts: replacement or service parts."),
        tInventory("guide.sections.categories.products", "Products for Sale: resale inventory."),
        tInventory("guide.sections.categories.equipment", "Equipment: tools or assets that may not be consumed like normal materials."),
        tInventory("guide.sections.categories.consumables", "Consumables: low-cost usage items."),
        tInventory("guide.sections.categories.other", "Other: temporary catch-all."),
      ],
    },
  ];

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: "100%", sm: 520 },
          maxWidth: "100%",
          backgroundColor: theme.palette.background.paper,
        },
      }}
    >
      <Stack sx={{ height: "100%" }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ p: 2.5, borderBottom: `1px solid ${alpha(theme.palette.divider, 0.8)}` }}>
          <Box>
            <Typography variant="h6" fontWeight={900}>{tInventory("guide.title", "Inventory guide")}</Typography>
            <Typography variant="body2" color="text.secondary">
              {tInventory("guide.subtitle", "Use this guide when you need help understanding stock status, reservations, and manager approval flow.")}
            </Typography>
          </Box>
          <IconButton onClick={onClose} aria-label={tInventory("guide.close", "Close inventory guide")}>
            <CloseIcon />
          </IconButton>
        </Stack>
        <Stack spacing={2} sx={{ p: 2.5, overflowY: "auto" }}>
          {sections.map((section, index) => (
            <React.Fragment key={section.title}>
              {index ? <Divider /> : null}
              <Stack spacing={1}>
                <Typography variant="subtitle1" fontWeight={800}>{section.title}</Typography>
                {section.body.map((line) => (
                  <Typography key={line} variant="body2" color="text.secondary">
                    {line}
                  </Typography>
                ))}
              </Stack>
            </React.Fragment>
          ))}
        </Stack>
      </Stack>
    </Drawer>
  );
}

function ReplenishmentReadinessPanel({ tInventory, items, currency }) {
  const overReserved = items.filter((item) => item.over_reserved);
  const pendingUsage = items.filter((item) => Number(item.pending_usage_quantity || 0) > 0);
  const reorderCandidates = items
    .filter((item) => item.is_active !== false && (item.low_available_stock || item.over_reserved || Number(item.pending_usage_quantity || 0) > 0))
    .slice(0, 5);

  const listRow = (row, helper) => (
    <Stack key={row.id} direction="row" justifyContent="space-between" spacing={1.5} alignItems="flex-start" sx={{ py: 0.5 }}>
      <Box>
        <Typography variant="body2" fontWeight={700}>{row.name}</Typography>
        <Typography variant="caption" color="text.secondary">{helper}</Typography>
      </Box>
      <Stack spacing={0.25} alignItems="flex-end">
        <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "nowrap" }}>
          {formatMoney(row.inventory_value, currency)}
        </Typography>
        <Chip
          size="small"
          variant="outlined"
          color={availabilityChipColor(row.stock_status || row.stock_conflict_state)}
          label={availabilityChipLabel(row.stock_status || row.stock_conflict_state, tInventory)}
        />
      </Stack>
    </Stack>
  );

  return (
    <Paper variant="outlined" sx={{ p: 2.25, borderRadius: 1.5 }}>
      <Stack spacing={1.5}>
        <Box>
          <Typography variant="h6" fontWeight={800}>{tInventory("replenishment.title", "Inventory attention queue")}</Typography>
          <Typography variant="body2" color="text.secondary">
            {tInventory("replenishment.subtitle", "Use this short list to review stock issues before you reorder, adjust stock, or approve usage.")}
          </Typography>
        </Box>
        {!reorderCandidates.length ? (
          <Alert severity="success">
            {tInventory("replenishment.none", "Nothing needs inventory attention in the current view.")}
          </Alert>
        ) : null}
        <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 1.25 }}>
          <Stack spacing={1.25}>
            <Typography variant="subtitle2" fontWeight={800}>{tInventory("replenishment.topAttention", "Needs attention now")}</Typography>
            {reorderCandidates.length ? reorderCandidates.map((item) => listRow(item, tInventory("replenishment.topAttentionHelper", "Check stock, reservations, pending usage, and vendor timing."))) : null}
            {overReserved.length ? (
              <Typography variant="caption" color="error.main">
                {tInventory("replenishment.overReservedFootnote", "{{count}} item(s) are over-reserved and may need stock correction or job-plan review.", { count: overReserved.length })}
              </Typography>
            ) : null}
            {pendingUsage.length ? (
              <Typography variant="caption" color="text.secondary">
                {tInventory("replenishment.pendingFootnote", "{{count}} item(s) have field-reported usage waiting for manager review.", { count: pendingUsage.length })}
              </Typography>
            ) : null}
          </Stack>
        </Paper>
      </Stack>
    </Paper>
  );
}

export default function InventoryPage() {
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();
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
  const [stockStatus, setStockStatus] = useState("");
  const [vendorFilter, setVendorFilter] = useState("");
  const [taxableFilter, setTaxableFilter] = useState("");
  const [activeFilter, setActiveFilter] = useState("active");
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
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
          stock_status: stockStatus || undefined,
          vendor: vendorFilter || undefined,
          taxable: taxableFilter || undefined,
          low_stock: lowStockOnly || undefined,
          active: activeFilter === "all" ? undefined : activeFilter === "active",
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
  }, [categoryId, stockStatus, vendorFilter, taxableFilter, activeFilter, lowStockOnly, page, perPage]);

  useEffect(() => subscribeToActiveCurrency((next) => {
    setActiveCurrency(normalizeCurrency(next) || "USD");
  }), []);

  const metrics = useMemo(() => {
    const lowStockCount = items.filter((item) => item.low_available_stock).length;
    const overReservedCount = items.filter((item) => item.over_reserved).length;
    const inventoryValue = items.reduce((sum, item) => sum + Number(item.inventory_value || 0), 0);
    const reservedValue = items.reduce((sum, item) => sum + Number(item.reserved_quantity || 0), 0);
    const pendingUsageCount = items.filter((item) => Number(item.pending_usage_quantity || 0) > 0).length;
    return {
      lowStockCount,
      overReservedCount,
      inventoryValue,
      activeItems: Number(pagination?.total || items.length),
      reservedValue,
      pendingUsageCount,
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

  const handleDownloadImportTemplate = async () => {
    try {
      const response = await downloadFinanceInventoryItemImportTemplate();
      downloadBlobFromResponse(response, "schedulaa-finance-inventory-items-template.csv");
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.error || err?.message || tInventory("errors.downloadTemplateFailed", "Unable to download inventory import template."), { variant: "error" });
    }
  };

  return (
    <Stack spacing={2.5}>
      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 1.5 }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} justifyContent="space-between" alignItems={{ md: "flex-start" }}>
          <Stack spacing={1}>
            <Typography variant="h5" fontWeight={900}>{tInventory("page.title", "Materials & Supplies")}</Typography>
            <Typography variant="body2" color="text.secondary">
              {tInventory("page.subtitle", "Track stock items used on jobs, supplies, parts, equipment, and resale products. Use this workspace to manage inventory operations, not to read workflow documentation.")}
            </Typography>
          </Stack>
          <Button variant="outlined" onClick={() => setGuideOpen(true)}>
            {tInventory("page.guide", "Inventory guide")}
          </Button>
        </Stack>
      </Paper>

      <Alert severity="info">{tInventory("availabilityInfo", "Low available stock considers items reserved for active jobs. Stock is only deducted after manager approval of actual usage.")}</Alert>

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} lg={4}><FinanceMetricCard label={tInventory("metrics.activeItems", "Active items")} value={String(metrics.activeItems)} helper={tInventory("metrics.activeItemsHelper", "In the current filtered view.")} accent="primary" /></Grid>
        <Grid item xs={12} sm={6} lg={4}><FinanceMetricCard label={tInventory("metrics.lowStockItems", "Low available stock")} value={String(metrics.lowStockCount)} accent="warning" helper={tInventory("metrics.lowStockHelper", "At or below threshold.")} /></Grid>
        <Grid item xs={12} sm={6} lg={4}><FinanceMetricCard label={tInventory("metrics.overReservedItems", "Over-reserved items")} value={String(metrics.overReservedCount)} accent="error" helper={tInventory("metrics.overReservedHelper", "Reservations exceed on-hand stock.")} /></Grid>
        <Grid item xs={12} sm={6} lg={4}><FinanceMetricCard label={tInventory("metrics.reservedQuantity", "Reserved quantity")} value={String(metrics.reservedValue)} accent="info" helper={tInventory("metrics.reservedQuantityHelper", "Planned on active jobs.")} /></Grid>
        <Grid item xs={12} sm={6} lg={4}><FinanceMetricCard label={tInventory("metrics.pendingUsageReview", "Pending usage review")} value={String(metrics.pendingUsageCount)} accent="secondary" helper={tInventory("metrics.pendingUsageReviewHelper", "Waiting for manager review.")} /></Grid>
        <Grid item xs={12} sm={6} lg={4}><FinanceMetricCard label={tInventory("metrics.inventoryValueEstimate", "Inventory value estimate")} value={formatMoney(metrics.inventoryValue, activeCurrency)} accent="success" helper={tInventory("metrics.inventoryValueHelper", "On-hand stock x cost per unit.")} /></Grid>
      </Grid>

      <ReplenishmentReadinessPanel tInventory={tInventory} items={items} currency={activeCurrency} />

      <Paper variant="outlined" sx={{ p: 2, borderRadius: 1.5 }}>
        <Stack spacing={1.5}>
          <Typography variant="subtitle1" fontWeight={800}>{tInventory("toolbar.title", "Inventory filters and actions")}</Typography>
          <Stack direction={{ xs: "column", xl: "row" }} spacing={1.5} justifyContent="space-between">
            <Grid container spacing={1.5} sx={{ flex: 1 }}>
              <Grid item xs={12} sm={6} lg={3}>
                <TextField
                  fullWidth
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
              </Grid>
              <Grid item xs={12} sm={6} lg={3}>
                <FormControl size="small" fullWidth>
                  <InputLabel>{tInventory("toolbar.inventoryCategory", "Inventory Category")}</InputLabel>
                  <Select label={tInventory("toolbar.inventoryCategory", "Inventory Category")} value={categoryId} onChange={(e) => { setCategoryId(e.target.value); setPage(1); }}>
                    <MenuItem value="">{tInventory("toolbar.allInventoryCategories", "All inventory categories")}</MenuItem>
                    {categories.map((category) => (
                      <MenuItem key={category.id} value={category.id}>{category.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} lg={2}>
                <FormControl size="small" fullWidth>
                  <InputLabel>{tInventory("toolbar.stockStatus", "Stock status")}</InputLabel>
                  <Select label={tInventory("toolbar.stockStatus", "Stock status")} value={stockStatus} onChange={(e) => { setStockStatus(e.target.value); setPage(1); }}>
                    <MenuItem value="">{tInventory("toolbar.stockStatusAll", "All")}</MenuItem>
                    <MenuItem value="available">{tInventory("toolbar.stockStatusAvailable", "Available")}</MenuItem>
                    <MenuItem value="low_available">{tInventory("toolbar.stockStatusLow", "Low available")}</MenuItem>
                    <MenuItem value="over_reserved">{tInventory("toolbar.stockStatusOverReserved", "Over-reserved")}</MenuItem>
                    <MenuItem value="uncategorized">{tInventory("toolbar.stockStatusUncategorized", "Uncategorized")}</MenuItem>
                    <MenuItem value="inactive">{tInventory("toolbar.stockStatusInactive", "Inactive")}</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} lg={2}>
                <TextField fullWidth size="small" label={tInventory("toolbar.vendor", "Vendor")} value={vendorFilter} onChange={(e) => { setVendorFilter(e.target.value); setPage(1); }} onKeyDown={(e) => { if (e.key === "Enter") load(); }} />
              </Grid>
              <Grid item xs={12} sm={6} lg={2}>
                <FormControl size="small" fullWidth>
                  <InputLabel>{tInventory("toolbar.taxable", "Tax")}</InputLabel>
                  <Select label={tInventory("toolbar.taxable", "Tax")} value={taxableFilter} onChange={(e) => { setTaxableFilter(e.target.value); setPage(1); }}>
                    <MenuItem value="">{tInventory("toolbar.taxableAll", "All")}</MenuItem>
                    <MenuItem value="true">{tInventory("toolbar.taxableOnly", "Taxable")}</MenuItem>
                    <MenuItem value="false">{tInventory("toolbar.nonTaxableOnly", "Non-taxable")}</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} lg={2}>
                <FormControl size="small" fullWidth>
                  <InputLabel>{tInventory("toolbar.activity", "Activity")}</InputLabel>
                  <Select label={tInventory("toolbar.activity", "Activity")} value={activeFilter} onChange={(e) => { setActiveFilter(e.target.value); setPage(1); }}>
                    <MenuItem value="active">{tInventory("toolbar.activeOnly", "Active only")}</MenuItem>
                    <MenuItem value="inactive">{tInventory("toolbar.inactiveOnly", "Inactive only")}</MenuItem>
                    <MenuItem value="all">{tInventory("toolbar.activeAndInactive", "Active and inactive")}</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ sm: "center" }}>
              <FormControlLabel control={<Checkbox checked={lowStockOnly} onChange={(e) => { setLowStockOnly(e.target.checked); setPage(1); }} />} label={tInventory("toolbar.lowStockOnly", "Low stock only")} />
              <Button variant="outlined" onClick={load}>{tInventory("toolbar.refresh", "Refresh")}</Button>
              <Button variant="text" onClick={handleDownloadImportTemplate}>{tInventory("toolbar.downloadTemplate", "Download template")}</Button>
              <Button variant="outlined" onClick={() => setImportOpen(true)}>{tInventory("toolbar.importItems", "Import items")}</Button>
              <Button variant="outlined" onClick={() => setCategoryDialogOpen(true)}>{tInventory("toolbar.addCategory", "Add Inventory Category")}</Button>
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
          </Stack>
        </Stack>
      </Paper>

      {loading ? (
        <Stack alignItems="center" sx={{ py: 8 }}><CircularProgress /></Stack>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : items.length === 0 ? (
        <Paper
          variant="outlined"
          sx={{
            p: 4,
            borderRadius: 1.5,
            textAlign: "center",
            borderStyle: "dashed",
            borderColor: alpha(theme.palette.divider, 0.9),
            backgroundColor: alpha(theme.palette.action.hover, 0.35),
          }}
        >
          <Stack spacing={1.5} alignItems="center">
            <Typography variant="h6" fontWeight={700}>{tInventory("empty.title", "No stock items yet")}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 680 }}>
              {tInventory("empty.description", "Start by adding categories and items, then use Purchases or Adjust Stock to add quantity. Work Orders reserve items. Manager Review deducts approved usage.")}
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25}>
              <Button variant="contained" onClick={() => {
                setSelectedItem(null);
                setEditorCategoryId("");
                setEditorOpen(true);
              }}>
                {tInventory("empty.action", "Add item")}
              </Button>
              <Button variant="outlined" onClick={() => setCategoryDialogOpen(true)}>
                {tInventory("empty.categoryAction", "Add inventory category")}
              </Button>
              <Button variant="outlined" onClick={() => setImportOpen(true)}>
                {tInventory("empty.importAction", "Import items from CSV")}
              </Button>
            </Stack>
          </Stack>
        </Paper>
      ) : (
        <Paper variant="outlined" sx={{ overflowX: "auto", borderRadius: 1.5 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>{tInventory("table.headers.name", "Item")}</TableCell>
                <TableCell>{tInventory("table.headers.sku", "SKU")}</TableCell>
                <TableCell>{tInventory("table.headers.category", "Inventory category")}</TableCell>
                <TableCell>{tInventory("table.headers.unit", "Unit")}</TableCell>
                <TableCell align="right">{tInventory("table.headers.onHand", "On hand")}</TableCell>
                <TableCell align="right">{tInventory("table.headers.reserved", "Reserved")}</TableCell>
                <TableCell align="right">{tInventory("table.headers.available", "Available")}</TableCell>
                <TableCell align="right">{tInventory("table.headers.pendingUsage", "Pending usage")}</TableCell>
                <TableCell align="right">{tInventory("table.headers.lowStockLevel", "Low stock threshold")}</TableCell>
                <TableCell align="right">{tInventory("table.headers.cost", "Cost per unit")}</TableCell>
                <TableCell align="right">{tInventory("table.headers.inventoryValue", "Inventory value")}</TableCell>
                <TableCell align="right">{tInventory("table.headers.sellPrice", "Optional sell price")}</TableCell>
                <TableCell align="right">{tInventory("table.headers.margin", "Margin")}</TableCell>
                <TableCell>{tInventory("table.headers.vendor", "Preferred vendor")}</TableCell>
                <TableCell>{tInventory("table.headers.lastUpdated", "Last updated")}</TableCell>
                <TableCell>{tInventory("table.headers.status", "Status")}</TableCell>
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
                      <Typography variant="body2" color="text.secondary">{item.description || tInventory("table.noDescription", "No description")}</Typography>
                    </TableCell>
                    <TableCell>{item.sku || "-"}</TableCell>
                    <TableCell>{item.category_name || tInventory("table.uncategorized", "Uncategorized")}</TableCell>
                    <TableCell>{item.unit || tInventory("table.each", "each")}</TableCell>
                    <TableCell align="right">{formatQuantity(item.on_hand_quantity ?? item.current_quantity)}</TableCell>
                    <TableCell align="right">{formatQuantity(item.reserved_quantity ?? 0)}</TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">{formatQuantity(item.available_quantity ?? item.current_quantity)}</Typography>
                      {item.low_available_stock ? <Typography variant="body2" color="warning.main">{tInventory("table.lowAvailable", "Low available")}</Typography> : null}
                      {overReserved ? (
                        <Typography variant="body2" color="error.main">
                          {tInventory("table.overReserved", "Over-reserved by {{count}}", { count: formatQuantity(Math.abs(Number(item.available_quantity || 0))) })}
                        </Typography>
                      ) : null}
                    </TableCell>
                    <TableCell align="right">{formatQuantity(item.pending_usage_quantity ?? 0)}</TableCell>
                    <TableCell align="right">{item.low_stock_threshold != null ? formatQuantity(item.low_stock_threshold) : "-"}</TableCell>
                    <TableCell align="right">{formatMoney(item.cost_per_unit, activeCurrency)}</TableCell>
                    <TableCell align="right">{formatMoney(item.inventory_value, activeCurrency)}</TableCell>
                    <TableCell align="right">{item.optional_sell_price != null ? formatMoney(item.optional_sell_price, activeCurrency) : "-"}</TableCell>
                    <TableCell align="right">
                      {item.gross_margin_amount != null ? (
                        <Stack spacing={0.25} alignItems="flex-end">
                          <Typography variant="body2">{formatMoney(item.gross_margin_amount, activeCurrency)}</Typography>
                          <Typography variant="caption" color="text.secondary">{Number(item.gross_margin_percent || 0).toFixed(1)}%</Typography>
                        </Stack>
                      ) : "-"}
                    </TableCell>
                    <TableCell>{item.vendor_name || "-"}</TableCell>
                    <TableCell>{formatDateTime(item.updated_at)}</TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={0.75} sx={{ flexWrap: "wrap" }}>
                        <Chip
                          size="small"
                          color={availabilityChipColor(item.stock_status || item.stock_conflict_state)}
                          variant="outlined"
                          label={availabilityChipLabel(item.stock_status || item.stock_conflict_state, tInventory)}
                        />
                        <Chip
                          size="small"
                          variant="outlined"
                          label={item.taxable ? tInventory("table.taxable", "Taxable") : tInventory("table.nonTaxable", "Non-taxable")}
                        />
                      </Stack>
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={1} justifyContent="flex-end" flexWrap="wrap">
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

      <InventoryCategoryDialog
        open={categoryDialogOpen}
        onClose={() => setCategoryDialogOpen(false)}
        onSubmit={handleCreateCategory}
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

      <InventoryGuideDrawer
        open={guideOpen}
        onClose={() => setGuideOpen(false)}
        tInventory={tInventory}
      />

      <FinanceImportDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        title={tInventory("importDialog.title", "Import inventory items")}
        importType="inventory_items"
        entityLabel="inventory items"
        templateFileName="schedulaa-finance-inventory-items-template.csv"
        csvStructure={`item_name,inventory_category,sku,description,unit,cost_per_unit,optional_sell_price,low_stock_threshold,vendor_name,taxable,is_active,initial_quantity\nAll Purpose Cleaner,Supplies,CLN-001,General cleaning solution,each,8.50,14.99,10,ABC Supplies,true,true,25\nAir Filter 20x20x1,Parts,FLT-202001,Replacement air filter,each,4.25,9.99,20,North Parts,false,true,50`}
        description={tInventory("importDialog.description", "Import inventory item master data only. Preview the CSV first, then create only new stock items. Existing items are never overwritten in this phase.")}
        downloadTemplate={downloadFinanceInventoryItemImportTemplate}
        previewImport={previewFinanceInventoryItemImport}
        commitImport={commitFinanceInventoryItemImport}
        listHistory={listFinanceImportHistory}
        renderPreviewDetails={(row) => (
          <Typography variant="caption" color="text.secondary">
            {[
              row.normalized_payload?.sku || "No SKU",
              row.normalized_payload?.category_name
                ? row.category_status === "will_create_category"
                  ? `${row.normalized_payload.category_name} • Will create category`
                  : `${row.normalized_payload.category_name} • Existing category`
                : "Uncategorized",
              `${row.normalized_payload?.unit || "each"} • Opening qty ${Number(row.normalized_payload?.initial_quantity || 0).toLocaleString(undefined, { maximumFractionDigits: 4 })}`,
            ].join(" • ")}
          </Typography>
        )}
        renderIssueDetails={(row) =>
          !(row.errors || []).length && !row.duplicate_match ? (
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
              {row.category_status === "will_create_category"
                ? "A new custom category will be created during commit."
                : row.category_status === "uncategorized"
                  ? "This item will stay uncategorized."
                  : "Opening quantity will create a stock-in transaction if provided."}
            </Typography>
          ) : null
        }
        onImported={async () => {
          await load();
          setImportOpen(false);
        }}
      />

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
    </Stack>
  );
}
