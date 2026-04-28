import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Checkbox,
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
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useSnackbar } from "notistack";
import {
  adjustInventoryItem,
  createInventoryItem,
  deleteInventoryItem,
  listInventoryCategories,
  listInventoryItems,
  listInventoryTransactions,
  updateInventoryItem,
} from "./financeApi";
import FinanceEmptyState from "./components/FinanceEmptyState";
import FinanceMetricCard from "./components/FinanceMetricCard";

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

const parseNumber = (value, fallback = 0) => {
  if (value === "" || value === null || value === undefined) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const formatMoney = (value) =>
  new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

function InventoryItemDialog({ open, onClose, onSubmit, categories, initialValues }) {
  const [form, setForm] = useState(blankItemForm);

  useEffect(() => {
    if (!open) return;
    setForm({
      ...blankItemForm,
      ...initialValues,
      category_id: initialValues?.category_id ?? "",
      cost_per_unit: initialValues?.cost_per_unit ?? "0",
      optional_sell_price: initialValues?.optional_sell_price ?? "",
      low_stock_threshold: initialValues?.low_stock_threshold ?? "",
      taxable: Boolean(initialValues?.taxable),
      is_active: initialValues?.is_active !== false,
    });
  }, [open, initialValues]);

  const handleChange = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{initialValues?.id ? "Edit item" : "Add item"}</DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2} sx={{ mt: 0.25 }}>
          <Grid item xs={12} md={6}>
            <TextField fullWidth label="Item name" value={form.name} onChange={(e) => handleChange("name", e.target.value)} />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                label="Category"
                value={form.category_id}
                onChange={(e) => handleChange("category_id", e.target.value)}
              >
                <MenuItem value="">No category</MenuItem>
                {categories.map((category) => (
                  <MenuItem key={category.id} value={category.id}>{category.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}><TextField fullWidth label="SKU" value={form.sku} onChange={(e) => handleChange("sku", e.target.value)} /></Grid>
          <Grid item xs={12} md={6}><TextField fullWidth label="Unit" value={form.unit} onChange={(e) => handleChange("unit", e.target.value)} /></Grid>
          <Grid item xs={12} md={6}><TextField fullWidth label="Cost per unit" value={form.cost_per_unit} onChange={(e) => handleChange("cost_per_unit", e.target.value)} /></Grid>
          <Grid item xs={12} md={6}><TextField fullWidth label="Optional sell price" value={form.optional_sell_price} onChange={(e) => handleChange("optional_sell_price", e.target.value)} /></Grid>
          <Grid item xs={12} md={6}><TextField fullWidth label="Low stock threshold" value={form.low_stock_threshold} onChange={(e) => handleChange("low_stock_threshold", e.target.value)} /></Grid>
          <Grid item xs={12} md={6}><TextField fullWidth label="Preferred vendor name" value={form.vendor_name} onChange={(e) => handleChange("vendor_name", e.target.value)} /></Grid>
          <Grid item xs={12} md={6}><FormControlLabel control={<Checkbox checked={form.taxable} onChange={(e) => handleChange("taxable", e.target.checked)} />} label="Taxable" /></Grid>
          <Grid item xs={12} md={6}><FormControlLabel control={<Checkbox checked={form.is_active} onChange={(e) => handleChange("is_active", e.target.checked)} />} label="Active item" /></Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={() => onSubmit({
            ...form,
            cost_per_unit: parseNumber(form.cost_per_unit, 0),
            optional_sell_price: form.optional_sell_price === "" ? "" : parseNumber(form.optional_sell_price, 0),
            low_stock_threshold: form.low_stock_threshold === "" ? "" : parseNumber(form.low_stock_threshold, 0),
          })}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function InventoryAdjustmentDialog({ open, onClose, item, onSubmit }) {
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
      <DialogTitle>Adjust stock</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} sx={{ mt: 0.25 }}>
          <Alert severity="info">Stock changes are recorded as transactions for audit.</Alert>
          <Typography variant="body2" color="text.secondary">
            Current quantity: {item?.current_quantity ?? 0}
          </Typography>
          <TextField
            fullWidth
            label="Quantity change"
            helperText="Use a positive number to add stock or a negative number to reduce stock."
            value={form.quantity_delta}
            onChange={(e) => setForm((current) => ({ ...current, quantity_delta: e.target.value }))}
          />
          <TextField
            fullWidth
            label="Unit cost"
            value={form.unit_cost}
            onChange={(e) => setForm((current) => ({ ...current, unit_cost: e.target.value }))}
          />
          <TextField
            fullWidth
            multiline
            minRows={3}
            label="Note"
            value={form.note}
            onChange={(e) => setForm((current) => ({ ...current, note: e.target.value }))}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
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
          Save adjustment
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function InventoryTransactionsDialog({ open, onClose, item, transactions }) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Stock history{item?.name ? ` • ${item.name}` : ""}</DialogTitle>
      <DialogContent dividers>
        {!transactions.length ? (
          <Typography variant="body2" color="text.secondary">No stock transactions yet.</Typography>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>When</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Quantity</TableCell>
                <TableCell>Unit cost</TableCell>
                <TableCell>Source</TableCell>
                <TableCell>Note</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {transactions.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.created_at || "-"}</TableCell>
                  <TableCell>{row.transaction_type || "-"}</TableCell>
                  <TableCell>{row.quantity_delta}</TableCell>
                  <TableCell>{row.unit_cost != null ? formatMoney(row.unit_cost) : "-"}</TableCell>
                  <TableCell>{row.source_type || "manual"}</TableCell>
                  <TableCell>{row.note || "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DialogContent>
      <DialogActions><Button onClick={onClose}>Close</Button></DialogActions>
    </Dialog>
  );
}

export default function InventoryPage() {
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

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
        }),
      ]);
      setCategories(Array.isArray(categoriesRes?.items) ? categoriesRes.items : []);
      setItems(Array.isArray(itemsRes?.items) ? itemsRes.items : []);
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Unable to load inventory.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [categoryId, lowStockOnly]);

  const metrics = useMemo(() => {
    const lowStockCount = items.filter((item) => item.low_stock_threshold != null && Number(item.current_quantity || 0) <= Number(item.low_stock_threshold || 0)).length;
    const inventoryValue = items.reduce((sum, item) => sum + Number(item.current_quantity || 0) * Number(item.cost_per_unit || 0), 0);
    return { lowStockCount, inventoryValue, activeItems: items.length };
  }, [items]);

  const loadTransactionsForItem = async (item) => {
    setSelectedItem(item);
    try {
      const res = await listInventoryTransactions({ item_id: item.id });
      setTransactions(Array.isArray(res?.items) ? res.items : []);
      setHistoryOpen(true);
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.error || err?.message || "Unable to load stock history.", { variant: "error" });
    }
  };

  const handleSaveItem = async (payload) => {
    try {
      if (selectedItem?.id && editorOpen) {
        await updateInventoryItem(selectedItem.id, payload);
        enqueueSnackbar("Inventory item updated.", { variant: "success" });
      } else {
        await createInventoryItem(payload);
        enqueueSnackbar("Inventory item added.", { variant: "success" });
      }
      setEditorOpen(false);
      setSelectedItem(null);
      await load();
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.error || err?.message || "Unable to save inventory item.", { variant: "error" });
    }
  };

  const handleDelete = async (item) => {
    try {
      await deleteInventoryItem(item.id);
      enqueueSnackbar("Item archived.", { variant: "success" });
      await load();
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.error || err?.message || "Unable to archive item.", { variant: "error" });
    }
  };

  const handleAdjust = async (payload) => {
    try {
      await adjustInventoryItem(selectedItem.id, payload);
      enqueueSnackbar("Stock adjusted.", { variant: "success" });
      setAdjustOpen(false);
      await load();
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.error || err?.message || "Unable to adjust stock.", { variant: "error" });
    }
  };

  return (
    <Stack spacing={2.5}>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} lg={4}><FinanceMetricCard label="Active items" value={String(metrics.activeItems)} accent="primary" /></Grid>
        <Grid item xs={12} sm={6} lg={4}><FinanceMetricCard label="Low stock items" value={String(metrics.lowStockCount)} accent="warning" helper="Review reorder levels and manager approvals." /></Grid>
        <Grid item xs={12} sm={6} lg={4}><FinanceMetricCard label="Inventory value estimate" value={formatMoney(metrics.inventoryValue)} accent="secondary" helper="Based on current quantity and cost per unit." /></Grid>
      </Grid>

      <Paper variant="outlined" sx={{ p: 2, borderRadius: 1 }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} justifyContent="space-between">
          <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
            <TextField
              size="small"
              label="Search items"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") load();
              }}
            />
            <FormControl size="small" sx={{ minWidth: 220 }}>
              <InputLabel>Category</InputLabel>
              <Select label="Category" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                <MenuItem value="">All categories</MenuItem>
                {categories.map((category) => (
                  <MenuItem key={category.id} value={category.id}>{category.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControlLabel control={<Checkbox checked={lowStockOnly} onChange={(e) => setLowStockOnly(e.target.checked)} />} label="Low stock only" />
            <Button variant="outlined" onClick={load}>Refresh</Button>
          </Stack>
          <Button
            variant="contained"
            onClick={() => {
              setSelectedItem(null);
              setEditorOpen(true);
            }}
          >
            Add item
          </Button>
        </Stack>
      </Paper>

      {loading ? (
        <Stack alignItems="center" sx={{ py: 8 }}><CircularProgress /></Stack>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : items.length === 0 ? (
        <FinanceEmptyState
          title="No stock items yet"
          description="Add your first stock item."
          actionLabel="Add item"
          onAction={() => {
            setSelectedItem(null);
            setEditorOpen(true);
          }}
        />
      ) : (
        <Paper variant="outlined" sx={{ overflowX: "auto" }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>SKU</TableCell>
                <TableCell>Unit</TableCell>
                <TableCell>Quantity</TableCell>
                <TableCell>Cost</TableCell>
                <TableCell>Low stock level</TableCell>
                <TableCell>Vendor</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((item) => {
                const isLow = item.low_stock_threshold != null && Number(item.current_quantity || 0) <= Number(item.low_stock_threshold || 0);
                return (
                  <TableRow key={item.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={700}>{item.name}</Typography>
                      <Typography variant="body2" color="text.secondary">{item.is_active === false ? "Inactive" : item.taxable ? "Taxable" : "Non-taxable"}</Typography>
                    </TableCell>
                    <TableCell>{item.category_name || "-"}</TableCell>
                    <TableCell>{item.sku || "-"}</TableCell>
                    <TableCell>{item.unit || "each"}</TableCell>
                    <TableCell>{item.current_quantity}{isLow ? <Typography component="span" color="warning.main"> • Low</Typography> : null}</TableCell>
                    <TableCell>{formatMoney(item.cost_per_unit)}</TableCell>
                    <TableCell>{item.low_stock_threshold ?? "-"}</TableCell>
                    <TableCell>{item.vendor_name || "-"}</TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <Button size="small" onClick={() => { setSelectedItem(item); setEditorOpen(true); }}>Edit</Button>
                        <Button size="small" onClick={() => { setSelectedItem(item); setAdjustOpen(true); }}>Adjust stock</Button>
                        <Button size="small" onClick={() => loadTransactionsForItem(item)}>History</Button>
                        <Button size="small" color="error" onClick={() => handleDelete(item)}>Archive</Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Paper>
      )}

      <InventoryItemDialog
        open={editorOpen}
        onClose={() => { setEditorOpen(false); setSelectedItem(null); }}
        onSubmit={handleSaveItem}
        categories={categories.filter((category) => category.is_active !== false)}
        initialValues={selectedItem}
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
      />
    </Stack>
  );
}
