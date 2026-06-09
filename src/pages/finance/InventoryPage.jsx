import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Autocomplete,
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
  Skeleton,
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
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import ArchiveOutlinedIcon from "@mui/icons-material/ArchiveOutlined";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import { alpha, useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
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
  exportFinanceInventoryItems,
  listFinanceImportHistory,
  listInventoryCategories,
  listInventoryItems,
  listInventoryTransactions,
  listVendors,
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
  current_quantity: "",
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

const ADJUSTMENT_MODE_CONFIG = {
  use: {
    titleKey: "manualActions.useStock",
    titleFallback: "Use stock",
    helperKey: "adjustDialog.useHelper",
    helperFallback: "Record stock used outside a work order. This reduces on-hand quantity immediately.",
    quantityLabelKey: "adjustDialog.quantityUsed",
    quantityLabelFallback: "Quantity used",
    notePlaceholderKey: "adjustDialog.useNotePlaceholder",
    notePlaceholderFallback: "Example: used for walk-in client, damaged item, internal use",
    saveKey: "adjustDialog.saveUse",
    saveFallback: "Save stock use",
    successKey: "snackbar.stockUsed",
    successFallback: "Stock use recorded.",
    quantityDirection: "negative",
    defaultNote: "Manual use",
  },
  receive: {
    titleKey: "manualActions.receiveStock",
    titleFallback: "Receive stock",
    helperKey: "adjustDialog.receiveHelper",
    helperFallback: "Record new stock received. This increases on-hand quantity immediately.",
    quantityLabelKey: "adjustDialog.quantityReceived",
    quantityLabelFallback: "Quantity received",
    notePlaceholderKey: "adjustDialog.receiveNotePlaceholder",
    notePlaceholderFallback: "Example: supplier delivery, restock, returned to stock",
    saveKey: "adjustDialog.saveReceive",
    saveFallback: "Save stock receipt",
    successKey: "snackbar.stockReceived",
    successFallback: "Stock receipt recorded.",
    quantityDirection: "positive",
    defaultNote: "Stock received",
  },
  adjust: {
    titleKey: "adjustDialog.title",
    titleFallback: "Adjust stock",
    helperKey: "adjustDialog.adjustHelper",
    helperFallback: "Use this only to correct a count or fix an inventory mistake.",
    quantityLabelKey: "adjustDialog.quantityChange",
    quantityLabelFallback: "Quantity change",
    notePlaceholderKey: "adjustDialog.adjustNotePlaceholder",
    notePlaceholderFallback: "Example: count correction after physical inventory",
    saveKey: "adjustDialog.saveAdjustment",
    saveFallback: "Save adjustment",
    successKey: "snackbar.stockAdjusted",
    successFallback: "Stock adjusted.",
    quantityDirection: "signed",
    defaultNote: "Count correction",
  },
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

const inventoryMovementTypeLabel = (row, tInventory) => {
  const sourceType = String(row?.source_type || "").toLowerCase();
  const type = String(row?.transaction_type || "").toLowerCase();
  const note = String(row?.note || "").toLowerCase();
  if (sourceType === "import") return tInventory("movement.openingImport", "Opening stock import");
  if (type === "stock_in" && sourceType === "purchase") return tInventory("movement.purchase", "Purchase");
  if (type === "stock_in") return tInventory("movement.stockAdded", "Stock added");
  if (type === "adjustment" && note.startsWith("manual use")) return tInventory("movement.manualUse", "Manual use");
  if (type === "adjustment" && note.startsWith("stock received")) return tInventory("movement.stockReceived", "Stock received");
  if (type === "adjustment" && note.startsWith("count correction")) return tInventory("movement.countCorrection", "Count correction");
  if (type === "adjustment" && note.startsWith("initial quantity")) return tInventory("movement.openingStock", "Opening stock");
  if (type === "adjustment") return tInventory("movement.manualAdjustment", "Manual adjustment");
  if (type === "approved_usage") return tInventory("movement.approvedUsage", "Approved job usage");
  if (type === "reversal") return tInventory("movement.reversal", "Reversal");
  return tInventory("movement.stockMovement", "Stock movement");
};

const inventoryMovementReason = (item, tInventory) => {
  if (item?.over_reserved) {
    return {
      label: tInventory("replenishment.reasonOverReserved", "Over-reserved"),
      helper: tInventory("replenishment.actionReservations", "Check reservations before adjusting stock"),
      color: "error",
    };
  }
  if (Number(item?.pending_usage_quantity || 0) > 0) {
    return {
      label: tInventory("replenishment.reasonPending", "Usage review pending"),
      helper: tInventory("replenishment.actionReview", "Manager review pending"),
      color: "info",
    };
  }
  return {
    label: tInventory("replenishment.reasonLow", "Low available stock"),
    helper: tInventory("replenishment.actionReorder", "Review before reordering"),
    color: "warning",
  };
};

const inventoryNumeric = (...values) => {
  for (const value of values) {
    if (value === null || value === undefined || value === "") continue;
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
};

const inventoryVendorName = (item, tInventory) => {
  const vendor = String(item?.vendor_name || item?.preferred_vendor_name || "").trim();
  return vendor || tInventory("stockAttention.noPreferredVendor", "No preferred vendor");
};

const inventoryAttentionPayload = (item, tInventory) => {
  const onHand = inventoryNumeric(item?.on_hand_quantity, item?.current_quantity);
  const reserved = inventoryNumeric(item?.reserved_quantity);
  const pendingUsage = inventoryNumeric(item?.pending_usage_quantity);
  const thresholdRaw = item?.low_stock_threshold;
  const threshold = thresholdRaw === null || thresholdRaw === undefined || thresholdRaw === "" ? null : inventoryNumeric(thresholdRaw);
  const available =
    item?.available_quantity !== null && item?.available_quantity !== undefined && item?.available_quantity !== ""
      ? inventoryNumeric(item?.available_quantity)
      : onHand - reserved;
  const lowByThreshold = threshold !== null && available <= threshold;
  const lowStock = Boolean(item?.low_available_stock) || lowByThreshold;
  const overReserved = Boolean(item?.over_reserved) || available < 0;
  const pendingReview = pendingUsage > 0;
  const missingVendor = !String(item?.vendor_name || item?.preferred_vendor_name || "").trim();
  const reasons = [];
  if (lowStock) reasons.push(tInventory("stockAttention.reasonLowStock", "Low stock"));
  if (overReserved) reasons.push(tInventory("stockAttention.reasonOverReserved", "Over-reserved"));
  if (pendingReview) reasons.push(tInventory("stockAttention.reasonPendingReview", "Pending usage review"));
  if (missingVendor) reasons.push(tInventory("stockAttention.reasonMissingVendor", "No preferred vendor"));
  const vendorName = inventoryVendorName(item, tInventory);
  const availableRatio =
    threshold && threshold > 0
      ? available / threshold
      : Number.POSITIVE_INFINITY;
  return {
    item,
    onHand,
    reserved,
    pendingUsage,
    available,
    threshold,
    lowStock,
    overReserved,
    pendingReview,
    missingVendor,
    reasons,
    vendorName,
    availableRatio,
  };
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

function InventoryDetailStat({ label, value, align = "left" }) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ display: "block", textAlign: align }}
      >
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={700} sx={{ textAlign: align }}>
        {value}
      </Typography>
    </Box>
  );
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

function InventoryItemDialog({ open, onClose, onSubmit, categories, initialValues, suggestedCategoryId, onOpenCategoryDialog, currency = "USD" }) {
  const { t } = useTranslation();
  const tInventory = React.useCallback(
    (key, fallback, options = {}) => t(`manager.finance.materials.${key}`, { defaultValue: fallback, ...options }),
    [t]
  );
  const [form, setForm] = useState(blankItemForm);
  const isEditing = Boolean(initialValues?.id);

  useEffect(() => {
    if (!open) return;
    setForm({
      ...blankItemForm,
      ...initialValues,
      category_id: suggestedCategoryId ?? initialValues?.category_id ?? "",
      current_quantity: initialValues?.current_quantity ?? "",
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
  const initialQuantity = parseNumber(form.current_quantity, 0);
  const costPerUnit = parseNumber(form.cost_per_unit, 0);
  const previewUnit = String(form.unit || "").trim() || tInventory("table.each", "each");
  const startingInventoryValue = initialQuantity * costPerUnit;
  const initialQuantityInvalid = !isEditing && form.current_quantity !== "" && parseNumber(form.current_quantity, NaN) < 0;

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
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label={tInventory("itemDialog.sku", "SKU / Item code (optional)")}
                  helperText={tInventory("itemDialog.skuHelper", "Optional internal code to help identify similar items. Example: SAL-2KG or GLOVES-M.")}
                  value={form.sku}
                  onChange={(e) => handleChange("sku", e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={6}><TextField fullWidth label={tInventory("itemDialog.description", "Description")} value={form.description} onChange={(e) => handleChange("description", e.target.value)} /></Grid>
            </Grid>
          </Box>

          <Box>
            <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1 }}>
              {tInventory("itemDialog.stockPricingSection", "Stock and pricing")}
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label={tInventory("itemDialog.stockUnit", "Stock unit")}
                  value={form.unit}
                  onChange={(e) => handleChange("unit", e.target.value)}
                  helperText={tInventory("itemDialog.stockUnitHelper", "This is how stock is counted. Examples: each, box, bottle, roll, kg, litre.")}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label={tInventory("itemDialog.costPerStockUnit", "Cost per stock unit")}
                  value={form.cost_per_unit}
                  onChange={(e) => handleChange("cost_per_unit", e.target.value)}
                  helperText={tInventory("itemDialog.costPerStockUnitHelper", "Enter the cost of one stock unit. If stock unit is box, enter the cost of one box. If stock unit is each, enter the cost of one item.")}
                />
              </Grid>
              {!isEditing ? (
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="number"
                    inputProps={{ min: 0, step: "any" }}
                    label={tInventory("itemDialog.initialQuantity", "Initial quantity")}
                    value={form.current_quantity}
                    onChange={(e) => handleChange("current_quantity", e.target.value)}
                    error={initialQuantityInvalid}
                    helperText={
                      initialQuantityInvalid
                        ? tInventory("itemDialog.initialQuantityError", "Initial quantity must be 0 or greater.")
                        : tInventory("itemDialog.initialQuantityHelper", "Optional. Use this when you want the item to start with stock on hand.")
                    }
                  />
                </Grid>
              ) : null}
              <Grid item xs={12} md={6}><TextField fullWidth label={tInventory("itemDialog.optionalSellPrice", "Optional sell price")} value={form.optional_sell_price} onChange={(e) => handleChange("optional_sell_price", e.target.value)} /></Grid>
              <Grid item xs={12} md={6}><TextField fullWidth label={tInventory("itemDialog.lowStockThreshold", "Low stock threshold")} value={form.low_stock_threshold} onChange={(e) => handleChange("low_stock_threshold", e.target.value)} helperText={tInventory("itemDialog.lowStockThresholdHelper", "The item appears in replenishment review when available stock falls to or below this level.")} /></Grid>
            </Grid>
            {!isEditing ? (
              <Paper variant="outlined" sx={{ mt: 2, p: 1.5, borderRadius: 1.5 }}>
                <Stack spacing={0.75}>
                  <Typography variant="subtitle2" fontWeight={800}>
                    {tInventory("itemDialog.previewTitle", "Starting inventory preview")}
                  </Typography>
                  <Typography variant="body2">
                    {tInventory("itemDialog.previewStockUnit", "Stock unit")}: {previewUnit}
                  </Typography>
                  <Typography variant="body2">
                    {tInventory("itemDialog.previewInitialQuantity", "Initial quantity")}: {formatQuantity(initialQuantity)}
                  </Typography>
                  <Typography variant="body2">
                    {tInventory("itemDialog.previewCostPerStockUnit", "Cost per stock unit")}: {formatMoney(costPerUnit, currency)}
                  </Typography>
                  <Typography variant="body2" fontWeight={700}>
                    {tInventory("itemDialog.previewStartingInventoryValue", "Starting inventory value")}: {formatMoney(startingInventoryValue, currency)}
                  </Typography>
                </Stack>
              </Paper>
            ) : null}
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
            current_quantity: !isEditing && form.current_quantity !== "" ? parseNumber(form.current_quantity, 0) : undefined,
            cost_per_unit: parseNumber(form.cost_per_unit, 0),
            optional_sell_price: form.optional_sell_price === "" ? "" : parseNumber(form.optional_sell_price, 0),
            low_stock_threshold: form.low_stock_threshold === "" ? "" : parseNumber(form.low_stock_threshold, 0),
          })}
          disabled={initialQuantityInvalid}
        >
          {tInventory("common.save", "Save")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function InventoryAdjustmentDialog({ open, onClose, item, mode = "adjust", onSubmit }) {
  const { t } = useTranslation();
  const tInventory = React.useCallback(
    (key, fallback, options = {}) => t(`manager.finance.materials.${key}`, { defaultValue: fallback, ...options }),
    [t]
  );
  const [form, setForm] = useState(blankAdjustmentForm);
  const config = ADJUSTMENT_MODE_CONFIG[mode] || ADJUSTMENT_MODE_CONFIG.adjust;

  useEffect(() => {
    if (!open) return;
    setForm({
      ...blankAdjustmentForm,
      unit_cost: item?.cost_per_unit ?? "",
    });
  }, [open, item]);

  const rawQuantity = form.quantity_delta;
  const parsedQuantity = rawQuantity === "" ? NaN : Number(rawQuantity);
  const isPositiveNumber = Number.isFinite(parsedQuantity) && parsedQuantity > 0;
  const isNonZeroNumber = Number.isFinite(parsedQuantity) && parsedQuantity !== 0;
  const currentQuantity = Number(item?.current_quantity || 0);
  const exceedsOnHand = config.quantityDirection === "negative" && Number.isFinite(parsedQuantity) && parsedQuantity > currentQuantity;
  const isValidQuantity =
    config.quantityDirection === "signed"
      ? isNonZeroNumber
      : isPositiveNumber;

  const quantityErrorText = (() => {
    if (rawQuantity === "") return tInventory("adjustDialog.quantityRequired", "Enter a quantity.");
    if (!Number.isFinite(parsedQuantity)) return tInventory("adjustDialog.quantityNumberRequired", "Enter a valid number.");
    if (config.quantityDirection === "signed" && parsedQuantity === 0) {
      return tInventory("adjustDialog.quantityNonZero", "Quantity change cannot be zero.");
    }
    if (config.quantityDirection !== "signed" && parsedQuantity <= 0) {
      return tInventory("adjustDialog.quantityPositiveRequired", "Enter a quantity greater than zero.");
    }
    return "";
  })();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{tInventory(config.titleKey, config.titleFallback)}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} sx={{ mt: 0.25 }}>
          <Alert severity="info">{tInventory(config.helperKey, config.helperFallback)}</Alert>
          <Typography variant="body2" color="text.secondary">
            {tInventory("adjustDialog.currentQuantity", "Current quantity")}: {item?.current_quantity ?? 0}
          </Typography>
          {exceedsOnHand ? (
            <Alert severity="warning">
              {tInventory("adjustDialog.exceedsOnHandWarning", "This quantity is larger than current on-hand stock. Review the count before saving.")}
            </Alert>
          ) : null}
          <TextField
            fullWidth
            type="number"
            inputProps={config.quantityDirection === "signed" ? { step: "any" } : { min: 0, step: "any" }}
            label={tInventory(config.quantityLabelKey, config.quantityLabelFallback)}
            helperText={quantityErrorText || (config.quantityDirection === "signed"
              ? tInventory("adjustDialog.quantityHelp", "Use a positive number to add stock or a negative number to reduce stock.")
              : tInventory("adjustDialog.quantityPositiveHelper", "Enter a quantity greater than zero.")
            )}
            value={form.quantity_delta}
            onChange={(e) => setForm((current) => ({ ...current, quantity_delta: e.target.value }))}
            error={Boolean(quantityErrorText)}
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
            placeholder={tInventory(config.notePlaceholderKey, config.notePlaceholderFallback)}
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
              quantity_delta:
                config.quantityDirection === "negative"
                  ? -Math.abs(parseNumber(form.quantity_delta, 0))
                  : config.quantityDirection === "positive"
                    ? Math.abs(parseNumber(form.quantity_delta, 0))
                    : parseNumber(form.quantity_delta, 0),
              unit_cost: form.unit_cost === "" ? "" : parseNumber(form.unit_cost, 0),
              note: (form.note || "").trim() || config.defaultNote,
            })
          }
          disabled={!isValidQuantity}
        >
          {tInventory(config.saveKey, config.saveFallback)}
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
  const [historyFilter, setHistoryFilter] = useState("all");

  useEffect(() => {
    if (!open) return;
    setHistoryFilter("all");
  }, [open]);

  const filteredTransactions = useMemo(() => {
    if (historyFilter === "all") return transactions;
    if (historyFilter === "purchase") {
      return transactions.filter((row) => String(row?.source_type || "").toLowerCase() === "purchase");
    }
    if (historyFilter === "import") {
      return transactions.filter((row) => String(row?.source_type || "").toLowerCase() === "import");
    }
    if (historyFilter === "approved_usage") {
      return transactions.filter((row) => String(row?.transaction_type || "").toLowerCase() === "approved_usage");
    }
    if (historyFilter === "manual_use") {
      return transactions.filter(
        (row) =>
          String(row?.transaction_type || "").toLowerCase() === "adjustment" &&
          String(row?.note || "").toLowerCase().startsWith("manual use")
      );
    }
    if (historyFilter === "stock_received") {
      return transactions.filter(
        (row) =>
          (String(row?.transaction_type || "").toLowerCase() === "adjustment" &&
            String(row?.note || "").toLowerCase().startsWith("stock received")) ||
          (String(row?.transaction_type || "").toLowerCase() === "stock_in" &&
            String(row?.source_type || "").toLowerCase() !== "purchase" &&
            String(row?.source_type || "").toLowerCase() !== "import")
      );
    }
    if (historyFilter === "count_correction") {
      return transactions.filter(
        (row) =>
          String(row?.transaction_type || "").toLowerCase() === "adjustment" &&
          String(row?.note || "").toLowerCase().startsWith("count correction")
      );
    }
    if (historyFilter === "adjustment") {
      return transactions.filter((row) => String(row?.transaction_type || "").toLowerCase() === "adjustment");
    }
    if (historyFilter === "stock_in") {
      return transactions.filter(
        (row) =>
          String(row?.transaction_type || "").toLowerCase() === "stock_in" &&
          String(row?.source_type || "").toLowerCase() !== "purchase" &&
          String(row?.source_type || "").toLowerCase() !== "import"
      );
    }
    return transactions;
  }, [historyFilter, transactions]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{tInventory("historyDialog.title", "Stock history")}{item?.name ? ` • ${item.name}` : ""}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} justifyContent="space-between" alignItems={{ sm: "center" }}>
            <Box>
              <Typography variant="body2" fontWeight={700}>
                {tInventory("historyDialog.subtitle", "Review manual changes, job usage, and opening stock records.")}
              </Typography>
              {item?.unit ? (
                <Typography variant="caption" color="text.secondary">
                  {tInventory("historyDialog.unitContext", "Quantities are shown in {{unit}}.", { unit: item.unit })}
                </Typography>
              ) : null}
            </Box>
            <FormControl size="small" sx={{ minWidth: { xs: "100%", sm: 240 } }}>
              <InputLabel>{tInventory("historyDialog.filter", "Movement filter")}</InputLabel>
              <Select
                value={historyFilter}
                label={tInventory("historyDialog.filter", "Movement filter")}
                onChange={(e) => setHistoryFilter(e.target.value)}
              >
                <MenuItem value="all">{tInventory("historyDialog.filterAll", "All movement")}</MenuItem>
                <MenuItem value="manual_use">{tInventory("historyDialog.filterManualUse", "Manual use")}</MenuItem>
                <MenuItem value="stock_received">{tInventory("historyDialog.filterStockReceived", "Stock received")}</MenuItem>
                <MenuItem value="count_correction">{tInventory("historyDialog.filterCountCorrection", "Count correction")}</MenuItem>
                <MenuItem value="stock_in">{tInventory("historyDialog.filterStockAdded", "Stock added")}</MenuItem>
                <MenuItem value="adjustment">{tInventory("historyDialog.filterAdjustments", "All manual adjustments")}</MenuItem>
                <MenuItem value="approved_usage">{tInventory("historyDialog.filterApprovedUsage", "Approved usage")}</MenuItem>
                <MenuItem value="purchase">{tInventory("historyDialog.filterPurchase", "Purchases")}</MenuItem>
                <MenuItem value="import">{tInventory("historyDialog.filterImport", "Opening stock import")}</MenuItem>
              </Select>
            </FormControl>
          </Stack>
          {!filteredTransactions.length ? (
            <Typography variant="body2" color="text.secondary">{tInventory("historyDialog.empty", "No stock transactions yet.")}</Typography>
          ) : (
            <Stack spacing={1}>
              {filteredTransactions.map((row) => (
                <Paper key={row.id} variant="outlined" sx={{ p: 1.5, borderRadius: 1.5 }}>
                  <Stack spacing={0.75}>
                    <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={1}>
                      <Box>
                        <Typography variant="body2" fontWeight={700}>
                          {inventoryMovementTypeLabel(row, tInventory)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatDateTime(row.created_at)}
                        </Typography>
                      </Box>
                      <Stack direction="row" spacing={0.75} alignItems="center" useFlexGap flexWrap="wrap">
                        <Chip
                          size="small"
                          color={Number(row.quantity_delta || 0) < 0 ? "warning" : "success"}
                          label={formatQuantity(row.quantity_delta)}
                        />
                        <Chip
                          size="small"
                          variant="outlined"
                          label={row.source_type ? String(row.source_type).replace(/_/g, " ") : tInventory("historyDialog.manual", "manual")}
                        />
                      </Stack>
                    </Stack>
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                      <Typography variant="caption" color="text.secondary">
                        {tInventory("historyDialog.headers.unitCost", "Unit cost")}: {row.unit_cost != null ? formatMoney(row.unit_cost, currency) : "-"}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {tInventory("historyDialog.headers.note", "Note")}: {row.note || "-"}
                      </Typography>
                    </Stack>
                  </Stack>
                </Paper>
              ))}
            </Stack>
          )}
        </Stack>
      </DialogContent>
      <DialogActions><Button onClick={onClose}>{tInventory("common.close", "Close")}</Button></DialogActions>
    </Dialog>
  );
}

function InventoryItemDetailDrawer({
  open,
  onClose,
  item,
  transactions,
  loadingTransactions,
  currency,
  tInventory,
  onEdit,
  onUseStock,
  onReceiveStock,
  onAdjust,
  onViewHistory,
  onArchive,
}) {
  const recentTransactions = (transactions || []).slice(0, 10);
  const overReserved = Boolean(item?.over_reserved);
  const pendingUsage = Number(item?.pending_usage_quantity || 0) > 0;

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: "100%", sm: 560, lg: 620 },
          maxWidth: "100%",
        },
      }}
    >
      <Stack sx={{ height: "100%" }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ p: 2.5, borderBottom: (theme) => `1px solid ${alpha(theme.palette.divider, 0.9)}` }}>
          <Box>
            <Typography variant="h6" fontWeight={900}>
              {tInventory("detailDrawer.title", "Inventory item details")}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {item?.name || tInventory("detailDrawer.item", "Inventory item")}
            </Typography>
          </Box>
          <IconButton onClick={onClose} aria-label={tInventory("detailDrawer.close", "Close inventory item details")}>
            <CloseIcon />
          </IconButton>
        </Stack>

        <Stack spacing={2} sx={{ p: 2.5, overflowY: "auto", flex: 1 }}>
          {!item ? (
            <Typography variant="body2" color="text.secondary">
              {tInventory("detailDrawer.noItem", "Select an inventory item to review its availability and recent activity.")}
            </Typography>
          ) : (
            <>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 1.5 }}>
                <Stack spacing={1.5}>
                  <Typography variant="subtitle1" fontWeight={800}>{tInventory("detailDrawer.identity", "Identity")}</Typography>
                  <Stack spacing={0.5}>
                    <Typography variant="h6" fontWeight={800}>{item.name}</Typography>
                    <Typography variant="body2" color="text.secondary">{item.description || tInventory("detailDrawer.noDescription", "No description")}</Typography>
                  </Stack>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    <Chip size="small" label={item.sku || tInventory("detailDrawer.noSku", "No SKU / item code")} variant="outlined" />
                    <Chip size="small" label={item.category_name || tInventory("detailDrawer.uncategorized", "Uncategorized")} variant="outlined" />
                    <Chip size="small" label={item.unit || tInventory("detailDrawer.each", "each")} variant="outlined" />
                    <Chip size="small" label={item.is_active === false ? tInventory("availability.inactive", "Inactive") : tInventory("detailDrawer.active", "Active")} color={item.is_active === false ? "default" : "success"} variant="outlined" />
                    <Chip size="small" label={item.taxable ? tInventory("detailDrawer.taxable", "Taxable") : tInventory("detailDrawer.nonTaxable", "Non-taxable")} variant="outlined" />
                  </Stack>
                </Stack>
              </Paper>

              <Paper variant="outlined" sx={{ p: 2, borderRadius: 1.5 }}>
                <Stack spacing={1.75}>
                  <Typography variant="subtitle1" fontWeight={800}>{tInventory("detailDrawer.overview", "Inventory summary")}</Typography>
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1} useFlexGap>
                    <Button variant="contained" onClick={onUseStock}>
                      {tInventory("manualActions.useStock", "Use stock")}
                    </Button>
                    <Button variant="outlined" onClick={onReceiveStock}>
                      {tInventory("manualActions.receiveStock", "Receive stock")}
                    </Button>
                    <Button variant="outlined" onClick={onAdjust}>
                      {tInventory("detailDrawer.adjust", "Adjust stock")}
                    </Button>
                  </Stack>
                  <Grid container spacing={1.5}>
                    <Grid item xs={6}><Typography variant="caption" color="text.secondary">{tInventory("table.headers.onHand", "On hand")}</Typography><Typography variant="body1" fontWeight={700}>{formatQuantity(item.on_hand_quantity ?? item.current_quantity)}</Typography></Grid>
                    <Grid item xs={6}><Typography variant="caption" color="text.secondary">{tInventory("table.headers.reserved", "Reserved")}</Typography><Typography variant="body1" fontWeight={700}>{formatQuantity(item.reserved_quantity ?? 0)}</Typography></Grid>
                    <Grid item xs={6}><Typography variant="caption" color="text.secondary">{tInventory("table.headers.available", "Available")}</Typography><Typography variant="body1" fontWeight={700}>{formatQuantity(item.available_quantity ?? item.current_quantity)}</Typography></Grid>
                    <Grid item xs={6}><Typography variant="caption" color="text.secondary">{tInventory("table.headers.pendingUsage", "Pending usage review")}</Typography><Typography variant="body1" fontWeight={700}>{formatQuantity(item.pending_usage_quantity ?? 0)}</Typography></Grid>
                    <Grid item xs={6}><Typography variant="caption" color="text.secondary">{tInventory("detailDrawer.approvedUsage", "Approved usage")}</Typography><Typography variant="body1" fontWeight={700}>{formatQuantity(item.approved_used_quantity ?? 0)}</Typography></Grid>
                    <Grid item xs={6}><Typography variant="caption" color="text.secondary">{tInventory("table.headers.lowStockLevel", "Low stock threshold")}</Typography><Typography variant="body1" fontWeight={700}>{item.low_stock_threshold != null ? formatQuantity(item.low_stock_threshold) : "-"}</Typography></Grid>
                  </Grid>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    <Chip
                      size="small"
                      color={availabilityChipColor(item.stock_status || item.stock_conflict_state)}
                      variant="outlined"
                      label={availabilityChipLabel(item.stock_status || item.stock_conflict_state, tInventory)}
                    />
                    {Number(item.active_reservations_count || 0) > 0 ? (
                      <Chip size="small" variant="outlined" label={tInventory("detailDrawer.activeReservations", "{{count}} active reservation(s)", { count: item.active_reservations_count || 0 })} />
                    ) : null}
                  </Stack>
                  <Typography variant="caption" color="text.secondary">{tInventory("detailDrawer.reservedHelper", "Reserved means planned on active work orders.")}</Typography>
                  <Typography variant="caption" color="text.secondary">{tInventory("detailDrawer.pendingHelper", "Pending usage means field-reported usage waiting for manager review.")}</Typography>
                  <Typography variant="caption" color="text.secondary">{tInventory("detailDrawer.approvedHelper", "Approved usage means usage already approved and deducted.")}</Typography>
                  {overReserved ? (
                    <Alert severity="warning">
                      {tInventory("detailDrawer.overReservedWarning", "Reservations are larger than on-hand stock. Review job plans, incoming stock, or manual counts.")}
                    </Alert>
                  ) : null}
                  {pendingUsage ? (
                    <Alert severity="info">
                      {tInventory("detailDrawer.pendingUsageNotice", "Field-reported usage is waiting for manager review.")}
                    </Alert>
                  ) : null}
                  <Divider />
                  <Stack spacing={1}>
                    <Typography variant="subtitle2" fontWeight={800}>{tInventory("detailDrawer.pricingSupplier", "Pricing and supplier")}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {tInventory("detailDrawer.pricingSupplierHelper", "Use this to review carrying cost, sell price, and vendor details in one place.")}
                    </Typography>
                  </Stack>
                  <Grid container spacing={1.5}>
                    <Grid item xs={6}><Typography variant="caption" color="text.secondary">{tInventory("table.headers.cost", "Cost per stock unit")}</Typography><Typography variant="body1" fontWeight={700}>{formatMoney(item.cost_per_unit, currency)}</Typography></Grid>
                    <Grid item xs={6}><Typography variant="caption" color="text.secondary">{tInventory("table.headers.sellPrice", "Optional sell price")}</Typography><Typography variant="body1" fontWeight={700}>{item.optional_sell_price != null ? formatMoney(item.optional_sell_price, currency) : "-"}</Typography></Grid>
                    <Grid item xs={6}><Typography variant="caption" color="text.secondary">{tInventory("table.headers.inventoryValue", "Inventory value")}</Typography><Typography variant="body1" fontWeight={700}>{formatMoney(item.inventory_value, currency)}</Typography></Grid>
                    <Grid item xs={6}><Typography variant="caption" color="text.secondary">{tInventory("table.headers.margin", "Margin")}</Typography><Typography variant="body1" fontWeight={700}>{item.gross_margin_amount != null ? `${formatMoney(item.gross_margin_amount, currency)} • ${Number(item.gross_margin_percent || 0).toFixed(1)}%` : "-"}</Typography></Grid>
                    <Grid item xs={12}><Typography variant="caption" color="text.secondary">{tInventory("table.headers.vendor", "Preferred vendor")}</Typography><Typography variant="body1" fontWeight={700}>{item.vendor_name || "-"}</Typography></Grid>
                  </Grid>
                </Stack>
              </Paper>

              <Paper variant="outlined" sx={{ p: 2, borderRadius: 1.5 }}>
                <Stack spacing={1.5}>
                  <Typography variant="subtitle1" fontWeight={800}>{tInventory("detailDrawer.activity", "Recent activity")}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {tInventory("detailDrawer.lastUpdated", "Last updated")}: {formatDateTime(item.updated_at)}
                  </Typography>
                  {loadingTransactions ? (
                    <Stack spacing={1}>
                      <Skeleton variant="rounded" height={52} />
                      <Skeleton variant="rounded" height={52} />
                      <Skeleton variant="rounded" height={52} />
                    </Stack>
                  ) : recentTransactions.length ? (
                    <Stack spacing={1}>
                      {recentTransactions.map((row) => (
                        <Paper key={row.id} variant="outlined" sx={{ p: 1.25, borderRadius: 1.25 }}>
                          <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={1}>
                            <Box>
                              <Typography variant="body2" fontWeight={700}>{inventoryMovementTypeLabel(row, tInventory)}</Typography>
                              <Typography variant="caption" color="text.secondary">{formatDateTime(row.created_at)}</Typography>
                            </Box>
                            <Stack alignItems={{ xs: "flex-start", sm: "flex-end" }} spacing={0.25}>
                              <Typography variant="body2" fontWeight={700}>{formatQuantity(row.quantity_delta)}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {row.unit_cost != null ? `${formatMoney(row.unit_cost, currency)} / ${item.unit || tInventory("detailDrawer.each", "each")}` : tInventory("detailDrawer.noUnitCost", "No unit cost")}
                              </Typography>
                            </Stack>
                          </Stack>
                          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.75 }}>
                            {row.source_type ? String(row.source_type).replace(/_/g, " ") : tInventory("historyDialog.manual", "manual")}
                            {row.total_cost != null ? ` • ${formatMoney(row.total_cost, currency)}` : ""}
                          </Typography>
                          {row.note ? (
                            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                              {row.note}
                            </Typography>
                          ) : null}
                        </Paper>
                      ))}
                    </Stack>
                  ) : (
                    <Typography variant="body2" color="text.secondary">{tInventory("detailDrawer.noMovements", "No stock movements yet.")}</Typography>
                  )}
                </Stack>
              </Paper>
            </>
          )}
        </Stack>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ p: 2.5, borderTop: (theme) => `1px solid ${alpha(theme.palette.divider, 0.9)}`, flexWrap: "wrap" }}>
          <Button variant="contained" onClick={onEdit} disabled={!item}>{tInventory("detailDrawer.edit", "Edit item")}</Button>
          <Button variant="outlined" onClick={onUseStock} disabled={!item}>{tInventory("manualActions.useStock", "Use stock")}</Button>
          <Button variant="outlined" onClick={onReceiveStock} disabled={!item}>{tInventory("manualActions.receiveStock", "Receive stock")}</Button>
          <Button variant="outlined" onClick={onAdjust} disabled={!item}>{tInventory("detailDrawer.adjust", "Adjust stock")}</Button>
          <Button variant="outlined" onClick={onViewHistory} disabled={!item}>{tInventory("detailDrawer.history", "View full history")}</Button>
          <Button color="error" variant="outlined" onClick={onArchive} disabled={!item}>{tInventory("detailDrawer.archive", "Archive item")}</Button>
        </Stack>
      </Stack>
    </Drawer>
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
        tInventory("guide.sections.flow.step1", "Receive Stock, purchases, and stock adjustments add on-hand stock."),
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
        tInventory("guide.sections.bestPractices.line3", "Use SKU or an internal item code when you need to tell similar items apart."),
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
  const candidates = useMemo(
    () =>
      items
        .filter((item) => item.is_active !== false)
        .map((item) => inventoryAttentionPayload(item, tInventory))
        .filter((entry) => entry.lowStock || entry.overReserved || entry.pendingReview || entry.missingVendor),
    [items, tInventory]
  );

  const summary = useMemo(
    () => ({
      lowStock: candidates.filter((entry) => entry.lowStock).length,
      overReserved: candidates.filter((entry) => entry.overReserved).length,
      pendingReview: candidates.filter((entry) => entry.pendingReview).length,
      missingVendor: candidates.filter((entry) => entry.missingVendor).length,
      vendorsInvolved: new Set(candidates.map((entry) => entry.vendorName)).size,
    }),
    [candidates]
  );

  const vendorGroups = useMemo(() => {
    const grouped = new Map();
    for (const entry of candidates) {
      if (!grouped.has(entry.vendorName)) grouped.set(entry.vendorName, []);
      grouped.get(entry.vendorName).push(entry);
    }
    return Array.from(grouped.entries())
      .map(([vendorName, rows]) => ({
        vendorName,
        rows: rows.sort((a, b) => {
          if (a.overReserved !== b.overReserved) return a.overReserved ? -1 : 1;
          if (a.availableRatio !== b.availableRatio) return a.availableRatio - b.availableRatio;
          return String(a.item?.name || "").localeCompare(String(b.item?.name || ""));
        }),
      }))
      .sort((a, b) => {
        const aOverReserved = a.rows.some((row) => row.overReserved);
        const bOverReserved = b.rows.some((row) => row.overReserved);
        if (aOverReserved !== bOverReserved) return aOverReserved ? -1 : 1;
        const aLow = a.rows.some((row) => row.lowStock);
        const bLow = b.rows.some((row) => row.lowStock);
        if (aLow !== bLow) return aLow ? -1 : 1;
        return a.vendorName.localeCompare(b.vendorName);
      });
  }, [candidates]);

  return (
    <Paper variant="outlined" sx={{ p: 2.25, borderRadius: 1.5 }}>
      <Stack spacing={1.5}>
        <Box>
          <Typography variant="h6" fontWeight={800}>{tInventory("stockAttention.title", "Stock attention")}</Typography>
          <Typography variant="body2" color="text.secondary">
            {tInventory("stockAttention.subtitle", "Items that are low, reserved, or need manager review.")}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
          <Chip size="small" sx={{ minHeight: 28 }} variant="outlined" color="warning" label={tInventory("stockAttention.summaryLowStock", "Low stock: {{count}}", { count: summary.lowStock })} />
          <Chip size="small" sx={{ minHeight: 28 }} variant="outlined" color="error" label={tInventory("stockAttention.summaryOverReserved", "Over-reserved: {{count}}", { count: summary.overReserved })} />
          <Chip size="small" sx={{ minHeight: 28 }} variant="outlined" color="info" label={tInventory("stockAttention.summaryPendingReview", "Pending review: {{count}}", { count: summary.pendingReview })} />
          <Chip size="small" sx={{ minHeight: 28 }} variant="outlined" color="secondary" label={tInventory("stockAttention.summaryMissingVendor", "Missing vendor: {{count}}", { count: summary.missingVendor })} />
        </Stack>
        {!candidates.length ? (
          <Alert severity="success">
            <Stack spacing={0.25}>
              <Typography variant="body2" fontWeight={700}>
                {tInventory("stockAttention.emptyTitle", "No items need attention right now.")}
              </Typography>
              <Typography variant="body2">
                {tInventory("stockAttention.emptyDescription", "Items below threshold, over-reserved, pending review, or missing a preferred vendor will appear here.")}
              </Typography>
            </Stack>
          </Alert>
        ) : null}
        {candidates.length ? (
          <Stack spacing={1.5}>
            <Typography variant="caption" color="text.secondary">
              {tInventory("stockAttention.vendorsInvolved", "Vendors involved: {{count}}", { count: summary.vendorsInvolved })}
            </Typography>
            {vendorGroups.map((group) => (
              <Paper key={group.vendorName} variant="outlined" sx={{ p: 1.5, borderRadius: 1.25 }}>
                <Stack spacing={1.25}>
                  <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={1}>
                    <Box>
                      <Typography variant="subtitle2" fontWeight={800}>{group.vendorName}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {tInventory("stockAttention.vendorItemCount", "{{count}} item(s) need attention", { count: group.rows.length })}
                      </Typography>
                    </Box>
                  </Stack>
                  {group.rows.map((entry) => (
                    <Paper key={entry.item.id} variant="outlined" sx={{ p: 1.25, borderRadius: 1.25 }}>
                      <Stack spacing={0.75}>
                        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={1}>
                          <Box>
                            <Typography variant="body2" fontWeight={700}>{entry.item.name}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {[
                                entry.item.sku || null,
                                entry.item.category_name || tInventory("table.uncategorized", "Uncategorized"),
                                `${tInventory("table.headers.unit", "Stock unit")}: ${entry.item.unit || tInventory("table.each", "each")}`,
                              ].filter(Boolean).join(" • ")}
                            </Typography>
                          </Box>
                          <Typography variant="caption" color="text.secondary">
                            {entry.item.updated_at ? `${tInventory("table.headers.lastUpdated", "Last updated")}: ${formatDateTime(entry.item.updated_at)}` : ""}
                          </Typography>
                        </Stack>
                        <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
                          {entry.lowStock ? <Chip size="small" color="warning" variant="outlined" label={tInventory("stockAttention.reasonLowStock", "Low stock")} /> : null}
                          {entry.overReserved ? <Chip size="small" color="error" variant="outlined" label={tInventory("stockAttention.reasonOverReserved", "Over-reserved")} /> : null}
                          {entry.pendingReview ? <Chip size="small" color="info" variant="outlined" label={tInventory("stockAttention.reasonPendingReview", "Pending usage review")} /> : null}
                          {entry.missingVendor ? <Chip size="small" color="secondary" variant="outlined" label={tInventory("stockAttention.reasonMissingVendor", "No preferred vendor")} /> : null}
                        </Stack>
                        <Grid container spacing={1}>
                          <Grid item xs={6} sm={4} md={2.4}>
                            <Typography variant="caption" color="text.secondary">{tInventory("table.headers.onHand", "On hand")}</Typography>
                            <Typography variant="body2" fontWeight={700}>{formatQuantity(entry.onHand)}</Typography>
                          </Grid>
                          <Grid item xs={6} sm={4} md={2.4}>
                            <Typography variant="caption" color="text.secondary">{tInventory("table.headers.reserved", "Reserved")}</Typography>
                            <Typography variant="body2" fontWeight={700}>{formatQuantity(entry.reserved)}</Typography>
                          </Grid>
                          <Grid item xs={6} sm={4} md={2.4}>
                            <Typography variant="caption" color="text.secondary">{tInventory("table.headers.available", "Available")}</Typography>
                            <Typography variant="body2" fontWeight={700}>{formatQuantity(entry.available)}</Typography>
                          </Grid>
                          <Grid item xs={6} sm={4} md={2.4}>
                            <Typography variant="caption" color="text.secondary">{tInventory("table.headers.lowStockLevel", "Low stock threshold")}</Typography>
                            <Typography variant="body2" fontWeight={700}>{entry.threshold !== null ? formatQuantity(entry.threshold) : "-"}</Typography>
                          </Grid>
                          <Grid item xs={6} sm={4} md={2.4}>
                            <Typography variant="caption" color="text.secondary">{tInventory("table.headers.pendingUsage", "Pending usage")}</Typography>
                            <Typography variant="body2" fontWeight={700}>{formatQuantity(entry.pendingUsage)}</Typography>
                          </Grid>
                        </Grid>
                        <Typography variant="caption" color="text.secondary">
                          {tInventory("stockAttention.preferredVendor", "Preferred vendor")}: {entry.vendorName}
                        </Typography>
                      </Stack>
                    </Paper>
                  ))}
                </Stack>
              </Paper>
            ))}
          </Stack>
        ) : null}
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
  const [vendors, setVendors] = useState([]);
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
  const [adjustMode, setAdjustMode] = useState("adjust");
  const [historyOpen, setHistoryOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [editorCategoryId, setEditorCategoryId] = useState("");
  const isCompactList = useMediaQuery(theme.breakpoints.down("md"));

  const inventoryFilterParams = useMemo(
    () => ({
      q: search || undefined,
      category_id: categoryId || undefined,
      stock_status: stockStatus || undefined,
      vendor: vendorFilter || undefined,
      taxable: taxableFilter || undefined,
      low_stock: lowStockOnly || undefined,
      active: activeFilter === "all" ? undefined : activeFilter === "active",
    }),
    [activeFilter, categoryId, lowStockOnly, search, stockStatus, taxableFilter, vendorFilter]
  );

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [categoriesRes, itemsRes, vendorsRes] = await Promise.all([
        listInventoryCategories(),
        listInventoryItems({
          ...inventoryFilterParams,
          page,
          per_page: perPage,
        }),
        listVendors({ active: true, per_page: 100 }),
      ]);
      setCategories(Array.isArray(categoriesRes?.items) ? categoriesRes.items : Array.isArray(categoriesRes) ? categoriesRes : []);
      setItems(Array.isArray(itemsRes?.items) ? itemsRes.items : []);
      setPagination(itemsRes?.pagination || null);
      setVendors(Array.isArray(vendorsRes?.items) ? vendorsRes.items : []);
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

  const selectedVendorOption = useMemo(
    () => vendors.find((vendor) => String(vendor?.name || "").trim().toLowerCase() === String(vendorFilter || "").trim().toLowerCase()) || null,
    [vendors, vendorFilter]
  );

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

  const openDetailDrawer = async (item) => {
    setSelectedItem(item);
    setTransactions([]);
    setDetailOpen(true);
    setDetailLoading(true);
    try {
      const res = await listInventoryTransactions({ item_id: item.id, page: 1, per_page: 25 });
      setTransactions(Array.isArray(res?.items) ? res.items : []);
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.error || err?.message || tInventory("errors.loadHistoryFailed", "Unable to load stock history."), { variant: "error" });
    } finally {
      setDetailLoading(false);
    }
  };

  const handleSaveItem = async (payload) => {
    try {
      const editingId = selectedItem?.id;
      if (selectedItem?.id && editorOpen) {
        await updateInventoryItem(selectedItem.id, payload);
        enqueueSnackbar(tInventory("snackbar.itemUpdated", "Inventory item updated."), { variant: "success" });
      } else {
        await createInventoryItem(payload);
        enqueueSnackbar(tInventory("snackbar.itemAdded", "Inventory item added."), { variant: "success" });
      }
      setEditorOpen(false);
      await load();
      if (detailOpen && editingId) {
        const refreshed = await listInventoryItems({ page: 1, per_page: 250, q: payload?.name || selectedItem?.name || undefined });
        const refreshedItem = (Array.isArray(refreshed?.items) ? refreshed.items : []).find((row) => row.id === editingId);
        if (refreshedItem) {
          setSelectedItem(refreshedItem);
        }
      } else if (!detailOpen) {
        setSelectedItem(null);
      }
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.error || err?.message || tInventory("errors.saveItemFailed", "Unable to save inventory item."), { variant: "error" });
    }
  };

  const handleDelete = async (item) => {
    try {
      await deleteInventoryItem(item.id);
      enqueueSnackbar(tInventory("snackbar.itemArchived", "Item archived."), { variant: "success" });
      if (selectedItem?.id === item.id) {
        setDetailOpen(false);
        setHistoryOpen(false);
        setSelectedItem(null);
        setTransactions([]);
      }
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
      const successConfig = ADJUSTMENT_MODE_CONFIG[adjustMode] || ADJUSTMENT_MODE_CONFIG.adjust;
      enqueueSnackbar(tInventory(successConfig.successKey, successConfig.successFallback), { variant: "success" });
      setAdjustOpen(false);
      await load();
      if (detailOpen && selectedItem?.id) {
        const refreshed = await listInventoryItems({ page: 1, per_page: 250, q: selectedItem.name || undefined });
        const refreshedItem = (Array.isArray(refreshed?.items) ? refreshed.items : []).find((row) => row.id === selectedItem.id);
        if (refreshedItem) setSelectedItem(refreshedItem);
        const txRes = await listInventoryTransactions({ item_id: selectedItem.id, page: 1, per_page: 25 });
        setTransactions(Array.isArray(txRes?.items) ? txRes.items : []);
      }
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.error || err?.message || tInventory("errors.adjustStockFailed", "Unable to adjust stock."), { variant: "error" });
    }
  };

  const openAdjustmentDialog = (item, mode = "adjust") => {
    setSelectedItem(item);
    setAdjustMode(mode);
    setAdjustOpen(true);
  };

  const handleDownloadImportTemplate = async () => {
    try {
      const response = await downloadFinanceInventoryItemImportTemplate();
      downloadBlobFromResponse(response, "schedulaa-finance-inventory-items-template.csv");
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.error || err?.message || tInventory("errors.downloadTemplateFailed", "Unable to download inventory import template."), { variant: "error" });
    }
  };

  const handleExportInventory = async () => {
    setExporting(true);
    try {
      const response = await exportFinanceInventoryItems(inventoryFilterParams);
      downloadBlobFromResponse(response, `schedulaa-inventory-items-export-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}.csv`);
      enqueueSnackbar(tInventory("snackbar.exportDownloaded", "Inventory export downloaded."), { variant: "success" });
    } catch (err) {
      const message = err?.response?.data?.error || err?.message || tInventory("errors.exportFailed", "Unable to export inventory. Narrow your filters and try again.");
      enqueueSnackbar(message, { variant: "error" });
    } finally {
      setExporting(false);
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

      <Paper variant="outlined" sx={{ p: { xs: 1.5, sm: 2 }, borderRadius: 1.5 }}>
        <Stack spacing={1.25}>
          <Typography variant="subtitle1" fontWeight={800}>{tInventory("toolbar.title", "Inventory filters and actions")}</Typography>
          <Stack spacing={1.25}>
            <Grid container spacing={1.25}>
              <Grid item xs={12} sm={6} lg={2.5}>
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
              <Grid item xs={12} sm={6} md={4} lg={2.5}>
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
              <Grid item xs={12} sm={6} md={4} lg={1.75}>
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
              <Grid item xs={12} sm={6} md={4} lg={1.5}>
                <Autocomplete
                  fullWidth
                  size="small"
                  options={vendors}
                  value={selectedVendorOption}
                  onChange={(_event, value) => {
                    setVendorFilter(value?.name || "");
                    setPage(1);
                  }}
                  inputValue={vendorFilter}
                  onInputChange={(_event, value, reason) => {
                    if (reason === "reset") return;
                    setVendorFilter(value || "");
                    setPage(1);
                  }}
                  getOptionLabel={(option) => option?.name || ""}
                  isOptionEqualToValue={(option, value) => Number(option?.id) === Number(value?.id)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label={tInventory("toolbar.vendor", "Vendor")}
                      placeholder={tInventory("toolbar.vendorPlaceholder", "All vendors")}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") load();
                      }}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4} lg={1.5}>
                <FormControl size="small" fullWidth>
                  <InputLabel>{tInventory("toolbar.taxable", "Tax")}</InputLabel>
                  <Select label={tInventory("toolbar.taxable", "Tax")} value={taxableFilter} onChange={(e) => { setTaxableFilter(e.target.value); setPage(1); }}>
                    <MenuItem value="">{tInventory("toolbar.taxableAll", "All")}</MenuItem>
                    <MenuItem value="true">{tInventory("toolbar.taxableOnly", "Taxable")}</MenuItem>
                    <MenuItem value="false">{tInventory("toolbar.nonTaxableOnly", "Non-taxable")}</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={4} lg={1.5}>
                <FormControl size="small" fullWidth>
                  <InputLabel>{tInventory("toolbar.activity", "Activity")}</InputLabel>
                  <Select label={tInventory("toolbar.activity", "Activity")} value={activeFilter} onChange={(e) => { setActiveFilter(e.target.value); setPage(1); }}>
                    <MenuItem value="active">{tInventory("toolbar.activeOnly", "Active only")}</MenuItem>
                    <MenuItem value="inactive">{tInventory("toolbar.inactiveOnly", "Inactive only")}</MenuItem>
                    <MenuItem value="all">{tInventory("toolbar.activeAndInactive", "Active and inactive")}</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={8} lg={2.75}>
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={0.5}
                  justifyContent={{ xs: "flex-start", lg: "flex-end" }}
                  alignItems={{ sm: "center" }}
                  sx={{ height: "100%" }}
                >
                  <FormControlLabel control={<Checkbox checked={lowStockOnly} onChange={(e) => { setLowStockOnly(e.target.checked); setPage(1); }} />} label={tInventory("toolbar.lowStockOnly", "Low stock only")} />
                </Stack>
              </Grid>
            </Grid>
            <Stack
              direction={{ xs: "column", lg: "row" }}
              spacing={1}
              justifyContent="space-between"
              alignItems={{ lg: "center" }}
            >
              <Typography variant="caption" color="text.secondary" sx={{ display: { xs: "none", sm: "block" } }}>
                {tInventory("toolbar.helper", "Use filters to narrow the list. Press Enter in search fields to refresh results.")}
              </Typography>
              <Stack
                direction="row"
                spacing={1}
                useFlexGap
                sx={{
                  flexWrap: { xs: "nowrap", sm: "wrap" },
                  overflowX: { xs: "auto", sm: "visible" },
                  pb: { xs: 0.5, sm: 0 },
                  "& > *": { flexShrink: 0 },
                }}
              >
                <Button size="small" sx={{ minHeight: 36 }} variant="text" onClick={handleDownloadImportTemplate}>{tInventory("toolbar.downloadTemplate", "Download template")}</Button>
                <Button size="small" sx={{ minHeight: 36 }} variant="outlined" onClick={() => setImportOpen(true)}>{tInventory("toolbar.importItems", "Import items")}</Button>
                <Button size="small" sx={{ minHeight: 36 }} variant="outlined" onClick={handleExportInventory} disabled={exporting}>
                  {exporting ? tInventory("toolbar.exportingCsv", "Exporting CSV...") : tInventory("toolbar.exportCsv", "Export CSV")}
                </Button>
                <Button size="small" sx={{ minHeight: 36 }} variant="outlined" onClick={() => setCategoryDialogOpen(true)}>{tInventory("toolbar.addCategory", "Add Inventory Category")}</Button>
                <Button
                  size="small"
                  sx={{ minHeight: 36 }}
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
              {tInventory("empty.description", "Start by adding categories and items, then use Receive Stock, Use Stock, or Adjust Stock for manual inventory changes. Work Orders reserve items. Manager Review deducts approved usage.")}
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
          {isCompactList ? (
            <Stack spacing={1.25} sx={{ p: 1.25 }}>
              {items.map((item) => {
                const overReserved = Number(item.available_quantity || 0) < 0;
                return (
                  <Paper
                    key={item.id}
                    variant="outlined"
                    sx={{ p: 1.5, borderRadius: 1.5, cursor: "pointer" }}
                    onClick={() => openDetailDrawer(item)}
                  >
                    <Stack spacing={1.25}>
                      <Stack direction="row" justifyContent="space-between" spacing={1} alignItems="flex-start">
                        <Box sx={{ minWidth: 0 }}>
                          <Typography variant="body1" fontWeight={800}>
                            {item.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                            {item.description || tInventory("table.noDescription", "No description")}
                          </Typography>
                        </Box>
                        <Chip
                          size="small"
                          sx={{ minHeight: 28 }}
                          color={availabilityChipColor(item.stock_status || item.stock_conflict_state)}
                          variant="outlined"
                          label={availabilityChipLabel(item.stock_status || item.stock_conflict_state, tInventory)}
                        />
                      </Stack>
                      <Stack direction="row" spacing={0.75} useFlexGap sx={{ flexWrap: "wrap" }}>
                        <Chip size="small" sx={{ minHeight: 28 }} variant="outlined" label={item.sku || tInventory("table.noSku", "No SKU")} />
                        <Chip size="small" sx={{ minHeight: 28 }} variant="outlined" label={item.category_name || tInventory("table.uncategorized", "Uncategorized")} />
                        <Chip size="small" sx={{ minHeight: 28 }} variant="outlined" label={item.unit || tInventory("table.each", "each")} />
                        <Chip size="small" sx={{ minHeight: 28 }} variant="outlined" label={item.taxable ? tInventory("table.taxable", "Taxable") : tInventory("table.nonTaxable", "Non-taxable")} />
                      </Stack>
                      <Box
                        sx={{
                          display: "grid",
                          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                          gap: 1,
                        }}
                      >
                        <InventoryDetailStat label={tInventory("table.headers.onHand", "On hand")} value={formatQuantity(item.on_hand_quantity ?? item.current_quantity)} />
                        <InventoryDetailStat label={tInventory("table.headers.available", "Available")} value={formatQuantity(item.available_quantity ?? item.current_quantity)} />
                        <InventoryDetailStat label={tInventory("table.headers.reserved", "Reserved")} value={formatQuantity(item.reserved_quantity ?? 0)} />
                        <InventoryDetailStat label={tInventory("table.headers.pendingUsage", "Pending usage")} value={formatQuantity(item.pending_usage_quantity ?? 0)} />
                        <InventoryDetailStat label={tInventory("table.headers.lowStockLevel", "Low stock threshold")} value={item.low_stock_threshold != null ? formatQuantity(item.low_stock_threshold) : "-"} />
                        <InventoryDetailStat label={tInventory("table.headers.cost", "Cost per stock unit")} value={formatMoney(item.cost_per_unit, activeCurrency)} />
                        <InventoryDetailStat label={tInventory("table.headers.inventoryValue", "Inventory value")} value={formatMoney(item.inventory_value, activeCurrency)} />
                        <InventoryDetailStat label={tInventory("table.headers.vendor", "Preferred vendor")} value={item.vendor_name || "-"} />
                      </Box>
                      <Stack direction="row" spacing={0.75} useFlexGap sx={{ flexWrap: "wrap" }}>
                        {item.low_available_stock ? <Chip size="small" sx={{ minHeight: 28 }} color="warning" variant="outlined" label={tInventory("table.lowAvailable", "Low available")} /> : null}
                        {overReserved ? <Chip size="small" sx={{ minHeight: 28 }} color="error" variant="outlined" label={tInventory("table.overReserved", "Over-reserved")} /> : null}
                      </Stack>
                      <Stack direction="row" spacing={0.75} justifyContent="space-between" alignItems="center">
                        <Typography variant="caption" color="text.secondary">
                          {formatDateTime(item.updated_at)}
                        </Typography>
                        <Stack direction="row" spacing={0.25}>
                          <Tooltip title={tInventory("table.view", "View")}><IconButton size="small" onClick={(e) => { e.stopPropagation(); openDetailDrawer(item); }}><VisibilityOutlinedIcon fontSize="small" /></IconButton></Tooltip>
                          <Tooltip title={tInventory("manualActions.useStock", "Use stock")}><IconButton size="small" color="warning" onClick={(e) => { e.stopPropagation(); openAdjustmentDialog(item, "use"); }}><RemoveCircleOutlineIcon fontSize="small" /></IconButton></Tooltip>
                          <Tooltip title={tInventory("manualActions.receiveStock", "Receive stock")}><IconButton size="small" color="success" onClick={(e) => { e.stopPropagation(); openAdjustmentDialog(item, "receive"); }}><AddCircleOutlineIcon fontSize="small" /></IconButton></Tooltip>
                          <Tooltip title={tInventory("table.adjustStock", "Adjust stock")}><IconButton size="small" onClick={(e) => { e.stopPropagation(); openAdjustmentDialog(item, "adjust"); }}><SettingsOutlinedIcon fontSize="small" /></IconButton></Tooltip>
                          <Tooltip title={tInventory("table.archive", "Archive")}><IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); handleDelete(item); }}><ArchiveOutlinedIcon fontSize="small" /></IconButton></Tooltip>
                        </Stack>
                      </Stack>
                    </Stack>
                  </Paper>
                );
              })}
            </Stack>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>{tInventory("table.headers.name", "Item")}</TableCell>
                  <TableCell>{tInventory("table.headers.stock", "Stock")}</TableCell>
                  <TableCell>{tInventory("table.headers.pricing", "Pricing")}</TableCell>
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
                    <TableRow key={item.id} hover sx={{ cursor: "pointer" }} onClick={() => openDetailDrawer(item)}>
                      <TableCell sx={{ minWidth: 260 }}>
                        <Stack spacing={0.75}>
                          <Box>
                            <Typography variant="body2" fontWeight={800}>{item.name}</Typography>
                            <Typography variant="body2" color="text.secondary">{item.description || tInventory("table.noDescription", "No description")}</Typography>
                          </Box>
                          <Stack direction="row" spacing={0.75} useFlexGap sx={{ flexWrap: "wrap" }}>
                            <Chip size="small" variant="outlined" label={item.sku || tInventory("table.noSku", "No SKU")} />
                            <Chip size="small" variant="outlined" label={item.category_name || tInventory("table.uncategorized", "Uncategorized")} />
                            <Chip size="small" variant="outlined" label={item.unit || tInventory("table.each", "each")} />
                          </Stack>
                        </Stack>
                      </TableCell>
                      <TableCell sx={{ minWidth: 220 }}>
                        <Box
                          sx={{
                            display: "grid",
                            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                            gap: 1,
                          }}
                        >
                          <InventoryDetailStat label={tInventory("table.headers.onHand", "On hand")} value={formatQuantity(item.on_hand_quantity ?? item.current_quantity)} />
                          <InventoryDetailStat label={tInventory("table.headers.available", "Available")} value={formatQuantity(item.available_quantity ?? item.current_quantity)} />
                          <InventoryDetailStat label={tInventory("table.headers.reserved", "Reserved")} value={formatQuantity(item.reserved_quantity ?? 0)} />
                          <InventoryDetailStat label={tInventory("table.headers.pendingUsage", "Pending usage")} value={formatQuantity(item.pending_usage_quantity ?? 0)} />
                          <InventoryDetailStat label={tInventory("table.headers.lowStockLevel", "Low stock threshold")} value={item.low_stock_threshold != null ? formatQuantity(item.low_stock_threshold) : "-"} />
                        </Box>
                      </TableCell>
                      <TableCell sx={{ minWidth: 190 }}>
                        <Stack spacing={0.75} alignItems="flex-end">
                          <InventoryDetailStat align="right" label={tInventory("table.headers.cost", "Cost per stock unit")} value={formatMoney(item.cost_per_unit, activeCurrency)} />
                          <InventoryDetailStat align="right" label={tInventory("table.headers.inventoryValue", "Inventory value")} value={formatMoney(item.inventory_value, activeCurrency)} />
                          <InventoryDetailStat align="right" label={tInventory("table.headers.sellPrice", "Optional sell price")} value={item.optional_sell_price != null ? formatMoney(item.optional_sell_price, activeCurrency) : "-"} />
                          <InventoryDetailStat
                            align="right"
                            label={tInventory("table.headers.margin", "Margin")}
                            value={item.gross_margin_amount != null ? `${formatMoney(item.gross_margin_amount, activeCurrency)} • ${Number(item.gross_margin_percent || 0).toFixed(1)}%` : "-"}
                          />
                        </Stack>
                      </TableCell>
                      <TableCell sx={{ minWidth: 150 }}>{item.vendor_name || "-"}</TableCell>
                      <TableCell sx={{ minWidth: 150 }}>{formatDateTime(item.updated_at)}</TableCell>
                      <TableCell sx={{ minWidth: 170 }}>
                        <Stack direction="row" spacing={0.75} sx={{ flexWrap: "wrap" }} useFlexGap>
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
                          {item.low_available_stock ? <Chip size="small" color="warning" variant="outlined" label={tInventory("table.lowAvailable", "Low available")} /> : null}
                          {overReserved ? <Chip size="small" color="error" variant="outlined" label={tInventory("table.overReserved", "Over-reserved")} /> : null}
                        </Stack>
                      </TableCell>
                      <TableCell align="right" sx={{ minWidth: 190 }}>
                        <Stack direction="row" spacing={0.25} justifyContent="flex-end">
                          <Tooltip title={tInventory("table.view", "View")}><IconButton size="small" onClick={(e) => { e.stopPropagation(); openDetailDrawer(item); }}><VisibilityOutlinedIcon fontSize="small" /></IconButton></Tooltip>
                          <Tooltip title={tInventory("manualActions.useStock", "Use stock")}><IconButton size="small" color="warning" onClick={(e) => { e.stopPropagation(); openAdjustmentDialog(item, "use"); }}><RemoveCircleOutlineIcon fontSize="small" /></IconButton></Tooltip>
                          <Tooltip title={tInventory("manualActions.receiveStock", "Receive stock")}><IconButton size="small" color="success" onClick={(e) => { e.stopPropagation(); openAdjustmentDialog(item, "receive"); }}><AddCircleOutlineIcon fontSize="small" /></IconButton></Tooltip>
                          <Tooltip title={tInventory("table.adjustStock", "Adjust stock")}><IconButton size="small" onClick={(e) => { e.stopPropagation(); openAdjustmentDialog(item, "adjust"); }}><SettingsOutlinedIcon fontSize="small" /></IconButton></Tooltip>
                          <Tooltip title={tInventory("table.archive", "Archive")}><IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); handleDelete(item); }}><ArchiveOutlinedIcon fontSize="small" /></IconButton></Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
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
        currency={activeCurrency}
      />

      <InventoryAdjustmentDialog
        open={adjustOpen}
        onClose={() => setAdjustOpen(false)}
        item={selectedItem}
        mode={adjustMode}
        onSubmit={handleAdjust}
      />

      <InventoryTransactionsDialog
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        item={selectedItem}
        transactions={transactions}
        currency={activeCurrency}
      />

      <InventoryItemDetailDrawer
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        item={selectedItem}
        transactions={transactions}
        loadingTransactions={detailLoading}
        currency={activeCurrency}
        tInventory={tInventory}
        onEdit={() => setEditorOpen(true)}
        onUseStock={() => openAdjustmentDialog(selectedItem, "use")}
        onReceiveStock={() => openAdjustmentDialog(selectedItem, "receive")}
        onAdjust={() => openAdjustmentDialog(selectedItem, "adjust")}
        onViewHistory={() => setHistoryOpen(true)}
        onArchive={() => selectedItem && handleDelete(selectedItem)}
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
        entitySingular="item"
        entityPlural="items"
        modes={[
          {
            value: "create_new_only",
            label: tInventory("importDialog.modeCreateOnly", "Create new items only"),
            description: tInventory("importDialog.modeCreateOnlyHelp", "Existing inventory items stay unchanged."),
          },
          {
            value: "create_and_update_matches",
            label: tInventory("importDialog.modeCreateAndUpdate", "Create new items and update matching items"),
            description: tInventory("importDialog.modeCreateAndUpdateHelp", "Matching items are updated after preview. Stock quantities on existing items are not changed."),
          },
        ]}
        defaultMode="create_new_only"
        showChangePreview
        templateFileName="schedulaa-finance-inventory-items-template.csv"
        csvStructure={`item_name,inventory_category,sku,description,unit,cost_per_unit,optional_sell_price,low_stock_threshold,vendor_name,taxable,is_active,initial_quantity\nAll Purpose Cleaner,Supplies,CLN-001,General cleaning solution,each,8.50,14.99,10,ABC Supplies,true,true,25\nAir Filter 20x20x1,Parts,FLT-202001,Replacement air filter,each,4.25,9.99,20,North Parts,false,true,50`}
        description={tInventory("importDialog.description", "Import inventory item master data from a spreadsheet. Preview the file first, then create new items or update matching item details. Existing stock quantities stay unchanged.")}
        downloadTemplate={downloadFinanceInventoryItemImportTemplate}
        previewImport={previewFinanceInventoryItemImport}
        commitImport={commitFinanceInventoryItemImport}
        listHistory={listFinanceImportHistory}
        renderPreviewDetails={(row) => (
          <Typography variant="caption" color="text.secondary">
            {[
              row.normalized_payload?.sku || "No SKU",
              row.matched_item?.label ? `Match: ${row.matched_item.label}` : null,
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
          !(row.errors || []).length ? (
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
              {row.status === "no_change"
                ? "No item-master changes were found for this row."
                : row.status === "valid_update"
                  ? "Only item details will be updated. Existing stock quantities stay unchanged."
                : row.category_status === "will_create_category"
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
