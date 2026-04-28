import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
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
import { useSnackbar } from "notistack";
import ExpenseQuickAddDialog from "./ExpenseQuickAddDialog";
import ThemedDateField from "../../components/ui/ThemedDateField";
import {
  createExpenseCategory,
  deleteExpense,
  listExpenseCategories,
  listExpenses,
  listManagerClients,
} from "./financeApi";
import FinanceEmptyState from "./components/FinanceEmptyState";
import FinancePagination from "./components/FinancePagination";

const formatMoney = (value, currency = "USD") =>
  new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

export default function ExpensesPage({ createNonce }) {
  const { enqueueSnackbar } = useSnackbar();
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [clients, setClients] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [missingReceipt, setMissingReceipt] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: "", slug: "", parent_group: "operations" });

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [expenses, cats, managerClients] = await Promise.all([
        listExpenses({
          category_id: categoryId || undefined,
          q: search || undefined,
          missing_receipt: missingReceipt || undefined,
          start_date: dateFrom || undefined,
          end_date: dateTo || undefined,
          page,
          per_page: perPage,
        }),
        listExpenseCategories(),
        listManagerClients(),
      ]);
      setItems(Array.isArray(expenses?.items) ? expenses.items : Array.isArray(expenses) ? expenses : []);
      setPagination(expenses?.pagination || null);
      setCategories(Array.isArray(cats?.items) ? cats.items : Array.isArray(cats) ? cats : []);
      setClients(managerClients);
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Unable to load expenses.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [categoryId, missingReceipt, page, perPage]);

  useEffect(() => {
    if (createNonce) {
      setEditing(null);
      setDialogOpen(true);
    }
  }, [createNonce]);

  const saveCategory = async () => {
    if (!newCategory.name || !newCategory.slug) {
      enqueueSnackbar("Expense category name and slug are required.", { variant: "error" });
      return;
    }
    try {
      await createExpenseCategory(newCategory);
      enqueueSnackbar("Expense category created.", { variant: "success" });
      setCategoryDialogOpen(false);
      setNewCategory({ name: "", slug: "", parent_group: "operations" });
      await load();
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.error || err?.message || "Unable to create expense category.", { variant: "error" });
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteExpense(deleteTarget.id);
      enqueueSnackbar("Expense deleted.", { variant: "success" });
      setDeleteTarget(null);
      await load();
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.error || err?.message || "Unable to delete expense.", { variant: "error" });
    }
  };

  return (
    <Stack spacing={2}>
      <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} justifyContent="space-between">
        <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
          <TextField
            size="small"
            label="Search expenses"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") load();
            }}
          />
          <FormControl size="small" sx={{ minWidth: 190 }}>
            <InputLabel>Expense Category</InputLabel>
            <Select label="Expense Category" value={categoryId} onChange={(e) => { setCategoryId(e.target.value); setPage(1); }}>
              <MenuItem value="">All expense categories</MenuItem>
              {categories.map((category) => (
                <MenuItem key={category.id} value={category.id}>{category.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Receipt status</InputLabel>
            <Select label="Receipt status" value={missingReceipt} onChange={(e) => { setMissingReceipt(e.target.value); setPage(1); }}>
              <MenuItem value="">All expenses</MenuItem>
              <MenuItem value="true">Missing receipts</MenuItem>
            </Select>
          </FormControl>
          <ThemedDateField size="small" label="From" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} />
          <ThemedDateField size="small" label="To" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} />
          <Button variant="outlined" onClick={load}>Refresh</Button>
        </Stack>
        <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
          <Button variant="outlined" onClick={() => setCategoryDialogOpen(true)}>Add Expense Category</Button>
          <Button variant="contained" onClick={() => { setEditing(null); setDialogOpen(true); }}>Add Expense</Button>
        </Stack>
      </Stack>

      <Alert severity="info">Receipt file upload will be added later. For now, paste a receipt link or attach metadata in each expense.</Alert>
      {error ? <Alert severity="error">{error}</Alert> : null}

      {loading ? (
        <Stack alignItems="center" sx={{ py: 8 }}><CircularProgress /></Stack>
      ) : items.length === 0 ? (
        <FinanceEmptyState
          title="No expenses yet"
          description="Add business expenses here so your daily money-out tracking stays in one place."
          actionLabel="Add expense"
          onAction={() => { setEditing(null); setDialogOpen(true); }}
        />
      ) : (
        <Paper variant="outlined" sx={{ overflowX: "auto" }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Title</TableCell>
                <TableCell>Vendor</TableCell>
                <TableCell>Expense Category</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Tax</TableCell>
                <TableCell>Total</TableCell>
                <TableCell>Receipts</TableCell>
                <TableCell>Client</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((item) => {
                const receiptCount = Array.isArray(item.receipt_files) ? item.receipt_files.length : 0;
                const total = Number(item.amount || 0) + Number(item.tax_amount || 0);
                return (
                  <TableRow key={item.id} hover>
                    <TableCell>{item.expense_date || "-"}</TableCell>
                    <TableCell>
                      <Typography fontWeight={700}>{item.title}</Typography>
                      {item.note ? <Typography variant="body2" color="text.secondary">{item.note}</Typography> : null}
                    </TableCell>
                    <TableCell>{item.vendor_name || "-"}</TableCell>
                    <TableCell>
                      <Typography variant="body2">{item.category_name || "Uncategorized"}</Typography>
                      <Typography variant="body2" color="text.secondary">{item.category_parent_group || ""}</Typography>
                    </TableCell>
                    <TableCell>{formatMoney(item.amount, item.currency)}</TableCell>
                    <TableCell>{formatMoney(item.tax_amount, item.currency)}</TableCell>
                    <TableCell>{formatMoney(total, item.currency)}</TableCell>
                    <TableCell>{receiptCount ? `${receiptCount} saved` : "Missing receipt"}</TableCell>
                    <TableCell>
                      <Typography variant="body2">{item.client_name || "-"}</Typography>
                      <Typography variant="body2" color="text.secondary">{item.client_email || ""}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction={{ xs: "column", lg: "row" }} spacing={1} justifyContent="flex-end">
                        <Button size="small" onClick={() => { setEditing(item); setDialogOpen(true); }}>Edit</Button>
                        <Button size="small" color="error" onClick={() => setDeleteTarget(item)}>Delete</Button>
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

      <ExpenseQuickAddDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSaved={async () => {
          enqueueSnackbar(editing ? "Expense updated." : "Expense added.", { variant: "success" });
          await load();
        }}
        expense={editing}
        categories={categories.filter((category) => category.is_active !== false)}
        clients={clients}
      />

      <Dialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)}>
        <DialogTitle>Delete expense</DialogTitle>
        <DialogContent dividers>
          <Typography>Delete this expense record? This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={confirmDelete}>Delete</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={categoryDialogOpen} onClose={() => setCategoryDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Add Expense Category</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={1.5} sx={{ mt: 0.5 }}>
            <Tooltip title="Used for expense reports and accountant exports.">
              <Stack direction="row" spacing={0.5} alignItems="center" sx={{ width: "fit-content" }}>
                <Typography variant="caption" color="text.secondary">Expense categories</Typography>
                <InfoOutlinedIcon sx={{ fontSize: 16, color: "text.secondary" }} />
              </Stack>
            </Tooltip>
            <Grid container spacing={2}>
              <Grid item xs={12}><TextField fullWidth label="Expense category name" value={newCategory.name} onChange={(e) => setNewCategory((prev) => ({ ...prev, name: e.target.value }))} /></Grid>
              <Grid item xs={12}><TextField fullWidth label="Slug" value={newCategory.slug} onChange={(e) => setNewCategory((prev) => ({ ...prev, slug: e.target.value }))} helperText="Use lowercase words with dashes." /></Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Expense group</InputLabel>
                <Select label="Expense group" value={newCategory.parent_group} onChange={(e) => setNewCategory((prev) => ({ ...prev, parent_group: e.target.value }))}>
                  <MenuItem value="utilities_telecom">Utilities & Telecom</MenuItem>
                  <MenuItem value="travel_meals">Travel & Meals</MenuItem>
                  <MenuItem value="office_admin">Office & Admin</MenuItem>
                  <MenuItem value="operations">Operations</MenuItem>
                  <MenuItem value="marketing">Marketing</MenuItem>
                  <MenuItem value="facilities">Facilities</MenuItem>
                  <MenuItem value="professional_services">Professional Services</MenuItem>
                  <MenuItem value="misc">Misc</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            </Grid>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCategoryDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={saveCategory}>Create expense category</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
