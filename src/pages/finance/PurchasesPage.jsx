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
  Typography,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import AddIcon from "@mui/icons-material/Add";
import { useSnackbar } from "notistack";
import ThemedDateField from "../../components/ui/ThemedDateField";
import { getActiveCurrency, normalizeCurrency } from "../../utils/currency";
import {
  createPurchase,
  listInventoryItems,
  listPurchases,
  listVendors,
  voidPurchase,
} from "./financeApi";
import FinanceEmptyState from "./components/FinanceEmptyState";
import FinanceMetricCard from "./components/FinanceMetricCard";

const blankLine = {
  inventory_item_id: "",
  description: "",
  quantity: "1",
  unit_cost: "0",
  tax_amount: "0",
};

const getBlankPurchase = () => ({
  vendor_id: "",
  vendor_name: "",
  purchase_date: "",
  currency: normalizeCurrency(getActiveCurrency("USD")) || "USD",
  receipt_files_text: "",
  note: "",
  create_expense: true,
  line_items: [{ ...blankLine }],
});

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

function PurchaseDialog({ open, onClose, vendors, inventoryItems, onSubmit }) {
  const [form, setForm] = useState(getBlankPurchase());

  useEffect(() => {
    if (!open) return;
    setForm(getBlankPurchase());
  }, [open]);

  const setField = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const setLine = (index, field, value) => {
    setForm((current) => ({
      ...current,
      line_items: current.line_items.map((line, lineIndex) =>
        lineIndex === index ? { ...line, [field]: value } : line
      ),
    }));
  };

  const addLine = () => setForm((current) => ({ ...current, line_items: [...current.line_items, { ...blankLine }] }));
  const removeLine = (index) =>
    setForm((current) => {
      const nextLines = current.line_items.filter((_, lineIndex) => lineIndex !== index);
      return {
        ...current,
        line_items: nextLines.length ? nextLines : [{ ...blankLine }],
      };
    });

  const computedTotal = useMemo(() => form.line_items.reduce((sum, line) => {
    return sum + parseNumber(line.quantity, 0) * parseNumber(line.unit_cost, 0) + parseNumber(line.tax_amount, 0);
  }, 0), [form.line_items]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>Create purchase</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} sx={{ mt: 0.25 }}>
          <Alert severity="info">Receipt files are metadata-only in this phase. Paste links or short notes instead of uploading binaries.</Alert>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Vendor</InputLabel>
                <Select label="Vendor" value={form.vendor_id} onChange={(e) => setField("vendor_id", e.target.value)}>
                  <MenuItem value="">No linked vendor</MenuItem>
                  {vendors.map((vendor) => <MenuItem key={vendor.id} value={vendor.id}>{vendor.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}><TextField fullWidth label="Vendor name fallback" value={form.vendor_name} onChange={(e) => setField("vendor_name", e.target.value)} /></Grid>
            <Grid item xs={12} md={4}><TextField fullWidth label="Currency" value={form.currency} onChange={(e) => setField("currency", e.target.value.toUpperCase())} /></Grid>
            <Grid item xs={12} md={4}><ThemedDateField fullWidth label="Purchase date" value={form.purchase_date} onChange={(e) => setField("purchase_date", e.target.value)} /></Grid>
            <Grid item xs={12} md={8}><TextField fullWidth label="Receipt links or notes" value={form.receipt_files_text} onChange={(e) => setField("receipt_files_text", e.target.value)} helperText="One line per link or short file note." /></Grid>
            <Grid item xs={12}><TextField fullWidth multiline minRows={3} label="Note" value={form.note} onChange={(e) => setField("note", e.target.value)} /></Grid>
            <Grid item xs={12}><FormControlLabel control={<Checkbox checked={form.create_expense} onChange={(e) => setField("create_expense", e.target.checked)} />} label="Create linked expense record" /></Grid>
          </Grid>

          <Paper variant="outlined" sx={{ p: 2, borderRadius: 1 }}>
            <Stack spacing={1.5}>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Typography variant="h6" fontWeight={800}>Line items</Typography>
                <Button startIcon={<AddIcon />} onClick={addLine}>Add line</Button>
              </Stack>
              {form.line_items.map((line, index) => (
                <Grid container spacing={2} key={`purchase-line-${index}`} alignItems="center">
                  <Grid item xs={12} md={3}>
                    <FormControl fullWidth>
                      <InputLabel>Stock item</InputLabel>
                      <Select label="Stock item" value={line.inventory_item_id} onChange={(e) => setLine(index, "inventory_item_id", e.target.value)}>
                        {inventoryItems.map((item) => <MenuItem key={item.id} value={item.id}>{item.name}</MenuItem>)}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={3}><TextField fullWidth label="Description" value={line.description} onChange={(e) => setLine(index, "description", e.target.value)} /></Grid>
                  <Grid item xs={12} sm={4} md={2}><TextField fullWidth label="Quantity" value={line.quantity} onChange={(e) => setLine(index, "quantity", e.target.value)} /></Grid>
                  <Grid item xs={12} sm={4} md={2}><TextField fullWidth label="Unit cost" value={line.unit_cost} onChange={(e) => setLine(index, "unit_cost", e.target.value)} /></Grid>
                  <Grid item xs={12} sm={4} md={1.5}><TextField fullWidth label="Tax" value={line.tax_amount} onChange={(e) => setLine(index, "tax_amount", e.target.value)} /></Grid>
                  <Grid item xs={12} md={0.5}>
                    <IconButton onClick={() => removeLine(index)} disabled={form.line_items.length === 1}>
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </Grid>
                </Grid>
              ))}
              <Typography variant="body2" color="text.secondary">Estimated total: {formatMoney(computedTotal, form.currency)}</Typography>
            </Stack>
          </Paper>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={() => onSubmit({
            vendor_id: form.vendor_id || null,
            vendor_name: form.vendor_name || null,
            purchase_date: form.purchase_date,
            currency: form.currency,
            receipt_files: form.receipt_files_text
              .split("\n")
              .map((line) => line.trim())
              .filter(Boolean),
            note: form.note,
            create_expense: form.create_expense,
            line_items: form.line_items.map((line) => ({
              inventory_item_id: line.inventory_item_id,
              description: line.description,
              quantity: parseNumber(line.quantity, 0),
              unit_cost: parseNumber(line.unit_cost, 0),
              tax_amount: parseNumber(line.tax_amount, 0),
            })),
          })}
        >
          Save purchase
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function PurchaseDetailDialog({ open, onClose, purchase }) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Purchase detail</DialogTitle>
      <DialogContent dividers>
        {purchase ? (
          <Stack spacing={2}>
            <Typography variant="body2" color="text.secondary">
              {purchase.vendor_name || purchase.vendor?.name || "No vendor"} • {purchase.purchase_date || "-"} • {purchase.currency || "USD"}
            </Typography>
            <Typography variant="body2">Subtotal: {formatMoney(purchase.subtotal, purchase.currency)}</Typography>
            <Typography variant="body2">Tax: {formatMoney(purchase.tax_total, purchase.currency)}</Typography>
            <Typography variant="body2">Total: {formatMoney(purchase.total, purchase.currency)}</Typography>
            <Typography variant="body2">Linked expense: {purchase.linked_expense_id || "Not created"}</Typography>
            <Typography variant="body2">Note: {purchase.note || "-"}</Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Item</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Quantity</TableCell>
                  <TableCell>Unit cost</TableCell>
                  <TableCell>Tax</TableCell>
                  <TableCell>Line total</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(purchase.line_items || []).map((line) => (
                  <TableRow key={line.id}>
                    <TableCell>{line.inventory_item_name || line.inventory_item_id}</TableCell>
                    <TableCell>{line.description || "-"}</TableCell>
                    <TableCell>{line.quantity}</TableCell>
                    <TableCell>{formatMoney(line.unit_cost, purchase.currency)}</TableCell>
                    <TableCell>{formatMoney(line.tax_amount, purchase.currency)}</TableCell>
                    <TableCell>{formatMoney(line.line_total, purchase.currency)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Stack>
        ) : null}
      </DialogContent>
      <DialogActions><Button onClick={onClose}>Close</Button></DialogActions>
    </Dialog>
  );
}

export default function PurchasesPage({ createNonce = 0 }) {
  const { enqueueSnackbar } = useSnackbar();
  const [vendors, setVendors] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [messages, setMessages] = useState([]);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [vendorsRes, itemsRes, purchasesRes] = await Promise.all([
        listVendors(),
        listInventoryItems({ active: true }),
        listPurchases(),
      ]);
      setVendors(Array.isArray(vendorsRes?.items) ? vendorsRes.items : []);
      setInventoryItems(Array.isArray(itemsRes?.items) ? itemsRes.items : []);
      setPurchases(Array.isArray(purchasesRes?.items) ? purchasesRes.items : []);
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Unable to load purchases.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (createNonce) {
      setEditorOpen(true);
    }
  }, [createNonce]);

  const totalSpend = purchases.reduce((sum, row) => sum + Number(row.total || 0), 0);

  const handleCreate = async (payload) => {
    try {
      const res = await createPurchase(payload);
      const warnings = Array.isArray(res?.warnings) ? res.warnings : [];
      setMessages(warnings);
      enqueueSnackbar("Purchase saved.", { variant: "success" });
      setEditorOpen(false);
      await load();
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.error || err?.message || "Unable to create purchase.", { variant: "error" });
    }
  };

  const handleVoid = async (purchase) => {
    try {
      const res = await voidPurchase(purchase.id);
      const warnings = Array.isArray(res?.warnings) ? res.warnings : [];
      setMessages(warnings);
      enqueueSnackbar("Purchase voided.", { variant: "success" });
      await load();
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.error || err?.message || "Unable to void purchase.", { variant: "error" });
    }
  };

  return (
    <Stack spacing={2.5}>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={4}><FinanceMetricCard label="Purchases" value={String(purchases.length)} accent="primary" /></Grid>
        <Grid item xs={12} sm={6} md={4}><FinanceMetricCard label="Total purchase spend" value={formatMoney(totalSpend)} accent="secondary" /></Grid>
      </Grid>

      {messages.map((message) => (
        <Alert key={message} severity={message === "linked_expense_not_reversed" ? "warning" : "info"}>
          {message === "linked_expense_not_reversed" ? "The linked expense was kept for audit. Reverse it manually if needed." : message}
        </Alert>
      ))}

      <Paper variant="outlined" sx={{ p: 2, borderRadius: 1 }}>
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={1.5}>
          <Typography variant="body2" color="text.secondary">
            Purchases increase stock and can create a linked expense record when needed.
          </Typography>
          <Button variant="contained" onClick={() => setEditorOpen(true)}>Create purchase</Button>
        </Stack>
      </Paper>

      {loading ? (
        <Stack alignItems="center" sx={{ py: 8 }}><CircularProgress /></Stack>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : purchases.length === 0 ? (
        <FinanceEmptyState
          title="No purchases yet"
          description="Create stock-in purchases here so materials, supplies, and expense records stay connected."
          actionLabel="Create purchase"
          onAction={() => setEditorOpen(true)}
        />
      ) : (
        <Paper variant="outlined" sx={{ overflowX: "auto" }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Vendor</TableCell>
                <TableCell>Total</TableCell>
                <TableCell>Currency</TableCell>
                <TableCell>Linked expense</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {purchases.map((purchase) => (
                <TableRow key={purchase.id} hover>
                  <TableCell>{purchase.purchase_date || "-"}</TableCell>
                  <TableCell>{purchase.vendor_name || purchase.vendor?.name || "-"}</TableCell>
                  <TableCell>{formatMoney(purchase.total, purchase.currency)}</TableCell>
                  <TableCell>{purchase.currency || "USD"}</TableCell>
                  <TableCell>{purchase.linked_expense_id || "-"}</TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <Button size="small" onClick={() => { setSelectedPurchase(purchase); setDetailOpen(true); }}>View</Button>
                      <Button size="small" color="warning" onClick={() => handleVoid(purchase)}>Void</Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}

      <PurchaseDialog
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        vendors={vendors.filter((row) => row.is_active !== false)}
        inventoryItems={inventoryItems}
        onSubmit={handleCreate}
      />
      <PurchaseDetailDialog open={detailOpen} onClose={() => setDetailOpen(false)} purchase={selectedPurchase} />
    </Stack>
  );
}
