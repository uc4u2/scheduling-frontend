import React, { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Chip,
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
import { useTranslation } from "react-i18next";
import { useSnackbar } from "notistack";
import ExpenseQuickAddDialog from "./ExpenseQuickAddDialog";
import ThemedDateField from "../../components/ui/ThemedDateField";
import {
  createExpenseCategory,
  deleteExpense,
  generateRecurringExpenseDrafts,
  listExpenseCategories,
  listExpenses,
  listManagerClients,
  previewRecurringExpenses,
} from "./financeApi";
import FinanceEmptyState from "./components/FinanceEmptyState";
import FinancePagination from "./components/FinancePagination";

const formatMoney = (value, currency = "USD") =>
  new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

const formatDateInput = (value) => {
  try {
    return new Date(value).toISOString().slice(0, 10);
  } catch (_err) {
    return "";
  }
};

export default function ExpensesPage({ createNonce }) {
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  const tExpenses = React.useCallback(
    (key, fallback, options = {}) => t(`manager.finance.expenses.${key}`, { defaultValue: fallback, ...options }),
    [t]
  );
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
  const [recurringThroughDate, setRecurringThroughDate] = useState(formatDateInput(new Date()));
  const [recurringPreview, setRecurringPreview] = useState(null);
  const [recurringLoading, setRecurringLoading] = useState(false);
  const [recurringGenerating, setRecurringGenerating] = useState(false);
  const [recurringDialogOpen, setRecurringDialogOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [expenses, cats, managerClients, recurring] = await Promise.all([
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
        previewRecurringExpenses({ through_date: recurringThroughDate }),
      ]);
      setItems(Array.isArray(expenses?.items) ? expenses.items : Array.isArray(expenses) ? expenses : []);
      setPagination(expenses?.pagination || null);
      setCategories(Array.isArray(cats?.items) ? cats.items : Array.isArray(cats) ? cats : []);
      setClients(managerClients);
      setRecurringPreview(recurring || null);
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || tExpenses("errors.loadFailed", "Unable to load expenses."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // Search and date filters stay manual via Enter/Refresh.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId, missingReceipt, page, perPage, recurringThroughDate]);

  useEffect(() => {
    if (createNonce) {
      setEditing(null);
      setDialogOpen(true);
    }
  }, [createNonce]);

  const saveCategory = async () => {
    if (!newCategory.name || !newCategory.slug) {
      enqueueSnackbar(tExpenses("snackbar.categoryNameSlugRequired", "Expense category name and slug are required."), { variant: "error" });
      return;
    }
    try {
      await createExpenseCategory(newCategory);
      enqueueSnackbar(tExpenses("snackbar.categoryCreated", "Expense category created."), { variant: "success" });
      setCategoryDialogOpen(false);
      setNewCategory({ name: "", slug: "", parent_group: "operations" });
      await load();
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.error || err?.message || tExpenses("errors.createCategoryFailed", "Unable to create expense category."), { variant: "error" });
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteExpense(deleteTarget.id);
      enqueueSnackbar(tExpenses("snackbar.expenseDeleted", "Expense deleted."), { variant: "success" });
      setDeleteTarget(null);
      await load();
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.error || err?.message || tExpenses("errors.deleteFailed", "Unable to delete expense."), { variant: "error" });
    }
  };

  const refreshRecurringPreview = async ({ openDialog = false } = {}) => {
    setRecurringLoading(true);
    try {
      const payload = await previewRecurringExpenses({ through_date: recurringThroughDate });
      setRecurringPreview(payload || null);
      if (openDialog) setRecurringDialogOpen(true);
    } catch (err) {
      enqueueSnackbar(
        err?.response?.data?.error || err?.message || tExpenses("errors.loadRecurringFailed", "Unable to preview recurring expenses."),
        { variant: "error" }
      );
    } finally {
      setRecurringLoading(false);
    }
  };

  const generateRecurringDrafts = async () => {
    setRecurringGenerating(true);
    try {
      const payload = await generateRecurringExpenseDrafts({
        through_date: recurringThroughDate,
        dry_run: false,
      });
      enqueueSnackbar(
        tExpenses("snackbar.recurringGenerated", "{{count}} recurring draft expense(s) generated.", {
          count: payload?.generated_count || 0,
        }),
        { variant: "success" }
      );
      setRecurringPreview(payload || null);
      setRecurringDialogOpen(true);
      await load();
    } catch (err) {
      enqueueSnackbar(
        err?.response?.data?.error || err?.message || tExpenses("errors.generateRecurringFailed", "Unable to generate recurring expenses."),
        { variant: "error" }
      );
    } finally {
      setRecurringGenerating(false);
    }
  };

  const nextDueRow = Array.isArray(recurringPreview?.next_due) ? recurringPreview.next_due[0] : null;

  return (
    <Stack spacing={2}>
      <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} justifyContent="space-between">
        <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
          <TextField
            size="small"
            label={tExpenses("toolbar.searchExpenses", "Search expenses")}
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
            <InputLabel>{tExpenses("toolbar.expenseCategory", "Expense Category")}</InputLabel>
            <Select label={tExpenses("toolbar.expenseCategory", "Expense Category")} value={categoryId} onChange={(e) => { setCategoryId(e.target.value); setPage(1); }}>
              <MenuItem value="">{tExpenses("toolbar.allExpenseCategories", "All expense categories")}</MenuItem>
              {categories.map((category) => (
                <MenuItem key={category.id} value={category.id}>{category.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>{tExpenses("toolbar.receiptStatus", "Receipt status")}</InputLabel>
            <Select label={tExpenses("toolbar.receiptStatus", "Receipt status")} value={missingReceipt} onChange={(e) => { setMissingReceipt(e.target.value); setPage(1); }}>
              <MenuItem value="">{tExpenses("toolbar.allExpenses", "All expenses")}</MenuItem>
              <MenuItem value="true">{tExpenses("toolbar.missingReceipts", "Missing receipts")}</MenuItem>
            </Select>
          </FormControl>
          <ThemedDateField size="small" label={tExpenses("toolbar.from", "From")} value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} />
          <ThemedDateField size="small" label={tExpenses("toolbar.to", "To")} value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} />
          <Button variant="outlined" onClick={load}>{tExpenses("toolbar.refresh", "Refresh")}</Button>
        </Stack>
        <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
          <Button variant="outlined" onClick={() => setCategoryDialogOpen(true)}>{tExpenses("toolbar.addExpenseCategory", "Add Expense Category")}</Button>
          <Button variant="contained" onClick={() => { setEditing(null); setDialogOpen(true); }}>{tExpenses("toolbar.addExpense", "Add Expense")}</Button>
        </Stack>
      </Stack>

      <Alert severity="info">{tExpenses("receiptInfo", "Upload receipts directly to each expense and keep links or notes only as a fallback.")}</Alert>
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack spacing={2}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} justifyContent="space-between" alignItems={{ xs: "stretch", md: "center" }}>
            <Stack spacing={0.5}>
              <Typography variant="subtitle1" fontWeight={700}>
                {tExpenses("recurringPanel.title", "Recurring expense templates")}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {tExpenses(
                  "recurringPanel.description",
                  "Preview due recurring expenses, then generate draft rows for review when you are ready."
                )}
              </Typography>
            </Stack>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} alignItems={{ xs: "stretch", sm: "center" }}>
              <ThemedDateField
                size="small"
                label={tExpenses("recurringPanel.throughDate", "Through date")}
                value={recurringThroughDate}
                onChange={(e) => setRecurringThroughDate(e.target.value)}
              />
              <Button variant="outlined" onClick={() => refreshRecurringPreview({ openDialog: true })} disabled={recurringLoading}>
                {recurringLoading ? tExpenses("recurringPanel.previewing", "Previewing...") : tExpenses("recurringPanel.preview", "Preview due")}
              </Button>
              <Button variant="contained" onClick={generateRecurringDrafts} disabled={recurringGenerating}>
                {recurringGenerating ? tExpenses("recurringPanel.generating", "Generating...") : tExpenses("recurringPanel.generate", "Generate due drafts")}
              </Button>
            </Stack>
          </Stack>
          <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
            <Chip
              color="default"
              variant="outlined"
              label={tExpenses("recurringPanel.templateCount", "{{count}} template(s)", {
                count: recurringPreview?.total_template_count || 0,
              })}
            />
            <Chip
              color={(recurringPreview?.due_draft_count || 0) > 0 ? "warning" : "default"}
              variant="outlined"
              label={tExpenses("recurringPanel.dueDraftCount", "{{count}} draft expense(s) due", {
                count: recurringPreview?.due_draft_count || 0,
              })}
            />
            {nextDueRow?.next_due_date ? (
              <Chip
                color="info"
                variant="outlined"
                label={tExpenses("recurringPanel.nextDue", "Next due: {{title}} on {{date}}", {
                  title: nextDueRow.template_title || tExpenses("recurringPanel.templateFallback", "Template"),
                  date: nextDueRow.next_due_date,
                })}
              />
            ) : null}
          </Stack>
        </Stack>
      </Paper>
      {error ? <Alert severity="error">{error}</Alert> : null}

      {loading ? (
        <Stack alignItems="center" sx={{ py: 8 }}><CircularProgress /></Stack>
      ) : items.length === 0 ? (
        <FinanceEmptyState
          title={tExpenses("empty.title", "No expenses yet")}
          description={tExpenses("empty.description", "Add business expenses here so your daily money-out tracking stays in one place.")}
          actionLabel={tExpenses("empty.action", "Add expense")}
          onAction={() => { setEditing(null); setDialogOpen(true); }}
        />
      ) : (
        <Paper variant="outlined" sx={{ overflowX: "auto" }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>{tExpenses("table.headers.date", "Date")}</TableCell>
                <TableCell>{tExpenses("table.headers.title", "Title")}</TableCell>
                <TableCell>{tExpenses("table.headers.vendor", "Vendor")}</TableCell>
                <TableCell>{tExpenses("table.headers.expenseCategory", "Expense Category")}</TableCell>
                <TableCell>{tExpenses("table.headers.amount", "Amount")}</TableCell>
                <TableCell>{tExpenses("table.headers.tax", "Tax")}</TableCell>
                <TableCell>{tExpenses("table.headers.total", "Total")}</TableCell>
                <TableCell>{tExpenses("table.headers.receipts", "Receipts")}</TableCell>
                <TableCell>{tExpenses("table.headers.client", "Client")}</TableCell>
                <TableCell align="right">{tExpenses("table.headers.actions", "Actions")}</TableCell>
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
                      <Stack direction="row" spacing={0.75} sx={{ mt: 0.75, flexWrap: "wrap" }}>
                        {item.is_recurring_template ? (
                          <Chip size="small" variant="outlined" label={tExpenses("table.template", "Template")} />
                        ) : null}
                        {item.review_status === "draft" ? (
                          <Chip size="small" color="warning" variant="outlined" label={tExpenses("table.draft", "Draft")} />
                        ) : null}
                        {item.review_status === "excluded" ? (
                          <Chip size="small" color="default" variant="outlined" label={tExpenses("table.excluded", "Excluded")} />
                        ) : null}
                        {item.source_recurring_expense_id ? (
                          <Chip size="small" color="info" variant="outlined" label={tExpenses("table.generatedRecurring", "Generated recurring")} />
                        ) : null}
                        {!item.is_recurring_template && receiptCount === 0 ? (
                          <Chip size="small" color="error" variant="outlined" label={tExpenses("table.needsReceipt", "Needs receipt")} />
                        ) : null}
                      </Stack>
                      {item.source_recurring_expense?.title ? (
                        <Typography variant="body2" color="text.secondary">
                          {tExpenses("table.generatedFrom", "From template: {{title}}", { title: item.source_recurring_expense.title })}
                        </Typography>
                      ) : null}
                      {item.note ? <Typography variant="body2" color="text.secondary">{item.note}</Typography> : null}
                    </TableCell>
                    <TableCell>{item.vendor_name || "-"}</TableCell>
                    <TableCell>
                      <Typography variant="body2">{item.category_name || tExpenses("table.uncategorized", "Uncategorized")}</Typography>
                      <Typography variant="body2" color="text.secondary">{item.category_parent_group || ""}</Typography>
                    </TableCell>
                    <TableCell>{formatMoney(item.amount, item.currency)}</TableCell>
                    <TableCell>{formatMoney(item.tax_amount, item.currency)}</TableCell>
                    <TableCell>{formatMoney(total, item.currency)}</TableCell>
                    <TableCell>{receiptCount ? tExpenses("table.savedReceiptCount", "{{count}} saved", { count: receiptCount }) : tExpenses("table.missingReceipt", "Missing receipt")}</TableCell>
                    <TableCell>
                      <Typography variant="body2">{item.client_name || "-"}</Typography>
                      <Typography variant="body2" color="text.secondary">{item.client_email || ""}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction={{ xs: "column", lg: "row" }} spacing={1} justifyContent="flex-end">
                        <Button size="small" onClick={() => { setEditing(item); setDialogOpen(true); }}>{tExpenses("table.edit", "Edit")}</Button>
                        <Button size="small" color="error" onClick={() => setDeleteTarget(item)}>{tExpenses("table.delete", "Delete")}</Button>
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
          enqueueSnackbar(editing ? tExpenses("snackbar.expenseUpdated", "Expense updated.") : tExpenses("snackbar.expenseAdded", "Expense added."), { variant: "success" });
          await load();
        }}
        expense={editing}
        categories={categories.filter((category) => category.is_active !== false)}
        clients={clients}
      />

      <Dialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)}>
        <DialogTitle>{tExpenses("deleteDialog.title", "Delete expense")}</DialogTitle>
        <DialogContent dividers>
          <Typography>{tExpenses("deleteDialog.description", "Delete this expense record? This action cannot be undone.")}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>{tExpenses("common.cancel", "Cancel")}</Button>
          <Button color="error" variant="contained" onClick={confirmDelete}>{tExpenses("common.delete", "Delete")}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={categoryDialogOpen} onClose={() => setCategoryDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{tExpenses("categoryDialog.title", "Add Expense Category")}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={1.5} sx={{ mt: 0.5 }}>
            <Tooltip title={tExpenses("categoryDialog.tooltip", "Used for expense reports and accountant exports.")}>
              <Stack direction="row" spacing={0.5} alignItems="center" sx={{ width: "fit-content" }}>
                <Typography variant="caption" color="text.secondary">{tExpenses("categoryDialog.categories", "Expense categories")}</Typography>
                <InfoOutlinedIcon sx={{ fontSize: 16, color: "text.secondary" }} />
              </Stack>
            </Tooltip>
            <Grid container spacing={2}>
              <Grid item xs={12}><TextField fullWidth label={tExpenses("categoryDialog.name", "Expense category name")} value={newCategory.name} onChange={(e) => setNewCategory((prev) => ({ ...prev, name: e.target.value }))} /></Grid>
              <Grid item xs={12}><TextField fullWidth label={tExpenses("categoryDialog.slug", "Slug")} value={newCategory.slug} onChange={(e) => setNewCategory((prev) => ({ ...prev, slug: e.target.value }))} helperText={tExpenses("categoryDialog.slugHelp", "Use lowercase words with dashes.")} /></Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>{tExpenses("categoryDialog.expenseGroup", "Expense group")}</InputLabel>
                <Select label={tExpenses("categoryDialog.expenseGroup", "Expense group")} value={newCategory.parent_group} onChange={(e) => setNewCategory((prev) => ({ ...prev, parent_group: e.target.value }))}>
                  <MenuItem value="utilities_telecom">{tExpenses("groups.utilitiesTelecom", "Utilities & Telecom")}</MenuItem>
                  <MenuItem value="travel_meals">{tExpenses("groups.travelMeals", "Travel & Meals")}</MenuItem>
                  <MenuItem value="office_admin">{tExpenses("groups.officeAdmin", "Office & Admin")}</MenuItem>
                  <MenuItem value="operations">{tExpenses("groups.operations", "Operations")}</MenuItem>
                  <MenuItem value="marketing">{tExpenses("groups.marketing", "Marketing")}</MenuItem>
                  <MenuItem value="facilities">{tExpenses("groups.facilities", "Facilities")}</MenuItem>
                  <MenuItem value="professional_services">{tExpenses("groups.professionalServices", "Professional Services")}</MenuItem>
                  <MenuItem value="misc">{tExpenses("groups.misc", "Misc")}</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            </Grid>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCategoryDialogOpen(false)}>{tExpenses("common.cancel", "Cancel")}</Button>
          <Button variant="contained" onClick={saveCategory}>{tExpenses("categoryDialog.create", "Create expense category")}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={recurringDialogOpen} onClose={() => setRecurringDialogOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>{tExpenses("recurringDialog.title", "Recurring expense preview")}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <Alert severity="info">
              {tExpenses(
                "recurringDialog.helper",
                "Generated recurring expenses are created as drafts and stay out of actual totals until you review them."
              )}
            </Alert>
            <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
              <Chip label={tExpenses("recurringDialog.templatesChecked", "{{count}} template(s) checked", { count: recurringPreview?.templates_checked || 0 })} variant="outlined" />
              <Chip label={tExpenses("recurringDialog.generatedCount", "{{count}} row(s) ready or generated", { count: recurringPreview?.generated_count || 0 })} variant="outlined" color="primary" />
              <Chip label={tExpenses("recurringDialog.skippedCount", "{{count}} skipped", { count: recurringPreview?.skipped?.length || 0 })} variant="outlined" />
            </Stack>

            {Array.isArray(recurringPreview?.generated) && recurringPreview.generated.length ? (
              <Paper variant="outlined" sx={{ overflowX: "auto" }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>{tExpenses("recurringDialog.headers.template", "Template")}</TableCell>
                      <TableCell>{tExpenses("recurringDialog.headers.period", "Period")}</TableCell>
                      <TableCell>{tExpenses("recurringDialog.headers.dueDate", "Due date")}</TableCell>
                      <TableCell>{tExpenses("recurringDialog.headers.amount", "Amount")}</TableCell>
                      <TableCell>{tExpenses("recurringDialog.headers.mode", "Mode")}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recurringPreview.generated.map((row, index) => (
                      <TableRow key={`${row.id || row.template_id || "generated"}-${row.recurring_period_key || row.period_key || index}`}>
                        <TableCell>{row.source_recurring_expense?.title || row.template_title || row.title || "-"}</TableCell>
                        <TableCell>{row.recurring_period_key || row.period_key || "-"}</TableCell>
                        <TableCell>{row.expense_date || row.due_date || "-"}</TableCell>
                        <TableCell>{formatMoney((Number(row.amount || 0) + Number(row.tax_amount || 0)), row.currency)}</TableCell>
                        <TableCell>{row.review_status || row.auto_create_mode || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Paper>
            ) : (
              <Typography variant="body2" color="text.secondary">
                {tExpenses("recurringDialog.noGenerated", "No recurring draft expenses are ready for this date range.")}
              </Typography>
            )}

            {Array.isArray(recurringPreview?.skipped) && recurringPreview.skipped.length ? (
              <Paper variant="outlined" sx={{ p: 1.5 }}>
                <Typography variant="subtitle2" gutterBottom>
                  {tExpenses("recurringDialog.skippedTitle", "Skipped templates")}
                </Typography>
                <Stack spacing={0.75}>
                  {recurringPreview.skipped.map((row, index) => (
                    <Typography key={`${row.template_id || "skipped"}-${row.period_key || index}`} variant="body2" color="text.secondary">
                      {(row.template_title || row.title || tExpenses("recurringDialog.templateFallback", "Template"))}: {row.reason || "-"}
                    </Typography>
                  ))}
                </Stack>
              </Paper>
            ) : null}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRecurringDialogOpen(false)}>{tExpenses("common.cancel", "Cancel")}</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
