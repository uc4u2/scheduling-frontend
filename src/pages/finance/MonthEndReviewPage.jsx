import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Grid,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { useSnackbar } from "notistack";
import ThemedDateField from "../../components/ui/ThemedDateField";
import FinanceMetricCard from "./components/FinanceMetricCard";
import FinanceSettingsSnapshotCard from "./components/FinanceSettingsSnapshotCard";
import FinanceCurrencyGroups from "./components/FinanceCurrencyGroups";
import {
  downloadFinanceAccountantPackage,
  exportFinanceMonthEndCsv,
  listFinanceAccountantPackageHistory,
  getFinanceMissingData,
  getFinanceMonthEnd,
  getFinanceTaxContext,
  previewRecurringExpenses,
} from "./financeApi";
import { formatDate } from "../../utils/datetime";

const firstDayOfMonth = () => {
  const now = new Date();
  return formatDate(new Date(now.getFullYear(), now.getMonth(), 1));
};

export default function MonthEndReviewPage() {
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  const tMonthEnd = useCallback(
    (key, fallback, options = {}) => t(`manager.finance.monthEnd.${key}`, { defaultValue: fallback, ...options }),
    [t]
  );
  const [dateFrom, setDateFrom] = useState(firstDayOfMonth());
  const [dateTo, setDateTo] = useState(formatDate(new Date()));
  const [review, setReview] = useState(null);
  const [missingData, setMissingData] = useState(null);
  const [recurringPreview, setRecurringPreview] = useState(null);
  const [taxContext, setTaxContext] = useState(null);
  const [packageHistory, setPackageHistory] = useState([]);
  const [packageHistoryPagination, setPackageHistoryPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [preparingPackage, setPreparingPackage] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [reviewRes, missingRes, recurringRes, financeTaxContext, packageHistoryRes] = await Promise.all([
        getFinanceMonthEnd({ date_from: dateFrom, date_to: dateTo }),
        getFinanceMissingData({ date_from: dateFrom, date_to: dateTo }),
        previewRecurringExpenses({ through_date: dateTo }),
        getFinanceTaxContext(),
        listFinanceAccountantPackageHistory({ date_from: dateFrom, date_to: dateTo, page: 1, per_page: 5 }),
      ]);
      setReview(reviewRes?.month_end_review || reviewRes || null);
      setMissingData(missingRes || null);
      setRecurringPreview(recurringRes || null);
      setTaxContext(financeTaxContext?.tax_context || null);
      setPackageHistory(Array.isArray(packageHistoryRes?.items) ? packageHistoryRes.items : []);
      setPackageHistoryPagination(packageHistoryRes?.pagination || null);
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || tMonthEnd("errors.loadFailed", "Unable to load month-end review."));
    } finally {
      setLoading(false);
      setHistoryLoading(false);
    }
  }, [dateFrom, dateTo, tMonthEnd]);

  useEffect(() => {
    load();
  }, [load]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await exportFinanceMonthEndCsv({ date_from: dateFrom, date_to: dateTo });
      const blob = new Blob([res.data], { type: res.headers?.["content-type"] || "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `month-end-${dateFrom}-to-${dateTo}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      enqueueSnackbar(tMonthEnd("snackbar.exportDownloaded", "Month-end export downloaded."), { variant: "success" });
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.error || err?.message || tMonthEnd("errors.exportFailed", "Unable to export month-end CSV."), { variant: "error" });
    } finally {
      setExporting(false);
    }
  };

  const handlePrepareAccountantPackage = async () => {
    setPreparingPackage(true);
    try {
      const res = await downloadFinanceAccountantPackage({ date_from: dateFrom, date_to: dateTo });
      const blob = new Blob([res.data], { type: res.headers?.["content-type"] || "application/zip" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `schedulaa-accountant-package-${dateFrom}-to-${dateTo}.zip`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      enqueueSnackbar(
        tMonthEnd("snackbar.packageDownloaded", "Accountant package downloaded."),
        { variant: "success" }
      );
      await load();
    } catch (err) {
      enqueueSnackbar(
        err?.response?.data?.error
          || err?.message
          || tMonthEnd("errors.packageFailed", "Unable to prepare accountant package."),
        { variant: "error" }
      );
    } finally {
      setPreparingPackage(false);
    }
  };

  const checklist = review?.checklist || review?.checklist_json || {};
  const checklistReasons = review?.checklist_reasons || {};
  const summary = review?.summary || review?.summary_json || {};
  const refundSummary = summary?.refund_summary || {};
  const financeSummary = summary?.finance_summary || {};
  const dueDraftCount = Number(recurringPreview?.due_draft_count || 0);
  const dueTemplateCount = Number(recurringPreview?.due_templates_count || 0);
  const renderChecklistLine = (label, key) => (
    <Stack spacing={0.25}>
      <Typography variant="body2">{label}: {checklist[key] ? tMonthEnd("checklist.ready", "Ready") : tMonthEnd("checklist.needsAttention", "Needs attention")}</Typography>
      {checklistReasons[key] ? (
        <Typography variant="caption" color="text.secondary">{checklistReasons[key]}</Typography>
      ) : null}
    </Stack>
  );

  return (
    <Stack spacing={2.5}>
      <FinanceSettingsSnapshotCard
        taxContext={taxContext}
        title={tMonthEnd("taxContext.snapshotTitle", "Finance settings snapshot")}
        helper={tMonthEnd(
          "taxContext.snapshotHelper",
          "These defaults are the current company finance settings used for month-end guidance and tax-facing review."
        )}
      />

      <Paper variant="outlined" sx={{ p: 2, borderRadius: 1 }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
          <ThemedDateField fullWidth label={tMonthEnd("filters.from", "From")} value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          <ThemedDateField fullWidth label={tMonthEnd("filters.to", "To")} value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          <Button variant="contained" onClick={load}>{tMonthEnd("filters.refresh", "Refresh")}</Button>
          <Button variant="outlined" onClick={handleExport} disabled={exporting}>{exporting ? tMonthEnd("filters.preparingCsv", "Preparing CSV...") : tMonthEnd("filters.downloadCsv", "Download CSV")}</Button>
          <Button variant="outlined" onClick={handlePrepareAccountantPackage} disabled={preparingPackage}>
            {preparingPackage
              ? tMonthEnd("filters.preparingPackage", "Preparing package...")
              : tMonthEnd("filters.prepareAccountantPackage", "Prepare accountant package")}
          </Button>
        </Stack>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
          {tMonthEnd(
            "filters.packageHelper",
            "This package prepares records for accountant review. It does not file taxes."
          )}
        </Typography>
      </Paper>

      <Paper variant="outlined" sx={{ p: 2, borderRadius: 1 }}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={1.5}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", md: "center" }}
          sx={{ mb: 1 }}
        >
          <Box>
            <Typography variant="h6" fontWeight={800}>
              {tMonthEnd("history.title", "Recent accountant packages")}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {tMonthEnd(
                "history.helper",
                "This history shows package generation events. Re-download is not enabled yet."
              )}
            </Typography>
          </Box>
          <Button variant="outlined" size="small" onClick={load} disabled={loading || historyLoading}>
            {tMonthEnd("history.refresh", "Refresh")}
          </Button>
        </Stack>

        {historyLoading ? (
          <Stack direction="row" spacing={1} alignItems="center" sx={{ py: 1 }}>
            <CircularProgress size={18} />
            <Typography variant="body2" color="text.secondary">
              {tMonthEnd("history.loading", "Loading package history...")}
            </Typography>
          </Stack>
        ) : packageHistory.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            {tMonthEnd("history.empty", "No accountant packages have been generated for this period yet.")}
          </Typography>
        ) : (
          <Stack spacing={1.25}>
            {packageHistory.map((row) => (
              <Paper key={row.id} variant="outlined" sx={{ p: 1.5, borderRadius: 1 }}>
                <Stack spacing={0.35}>
                  <Typography variant="subtitle2" fontWeight={700}>
                    {tMonthEnd("history.period", "Period")}: {row.date_from || "—"} {tMonthEnd("history.to", "to")} {row.date_to || "—"}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {tMonthEnd("history.generatedAt", "Generated at")}: {row.generated_at || row.created_at || "—"}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {tMonthEnd("history.format", "Format")}: {(row.format || "zip").toUpperCase()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {tMonthEnd("history.filesIncluded", "Files included")}: {Array.isArray(row.files_included) ? row.files_included.length : 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {tMonthEnd("history.generatedBy", "Generated by")}: {row.generated_by?.name || row.generated_by?.email || "—"}
                  </Typography>
                </Stack>
              </Paper>
            ))}
            {packageHistoryPagination?.total > packageHistory.length ? (
              <Typography variant="caption" color="text.secondary">
                {tMonthEnd(
                  "history.paginationSummary",
                  "Showing {{shown}} of {{total}} package events for this filter.",
                  {
                    shown: packageHistory.length,
                    total: packageHistoryPagination?.total || packageHistory.length,
                  }
                )}
              </Typography>
            ) : null}
          </Stack>
        )}
      </Paper>

      {loading ? (
        <Stack alignItems="center" sx={{ py: 8 }}><CircularProgress /></Stack>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : (
        <>
          {(Number(missingData?.draft_expenses_count || 0) > 0 || dueTemplateCount > 0) ? (
            <Alert severity="warning">
              {Number(missingData?.draft_expenses_count || 0) > 0
                ? tMonthEnd(
                    "alerts.recurringDraftsNeedReview",
                    "Recurring draft expenses need review before accountant handoff."
                  )
                : tMonthEnd(
                    "alerts.recurringTemplatesDueSoon",
                    "Recurring expense templates are due soon. Generate draft expenses when you are ready to review them."
                  )}
            </Alert>
          ) : null}

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} lg={3}><FinanceMetricCard label={tMonthEnd("cards.missingItems", "Missing items")} value={String(missingData?.month_end_missing_items_count ?? 0)} accent="warning" /></Grid>
            <Grid item xs={12} sm={6} lg={3}><FinanceMetricCard label={tMonthEnd("cards.lowStock", "Low stock")} value={String(missingData?.low_stock_count ?? 0)} accent="error" /></Grid>
            <Grid item xs={12} sm={6} lg={3}><FinanceMetricCard label={tMonthEnd("cards.pendingFieldReports", "Pending field reports")} value={String(missingData?.field_reports_pending_review_count ?? 0)} accent="info" /></Grid>
            <Grid item xs={12} sm={6} lg={3}><FinanceMetricCard label={tMonthEnd("cards.pendingWorkOrders", "Pending work orders")} value={String(missingData?.work_orders_pending_review_count ?? 0)} accent="secondary" /></Grid>
            <Grid item xs={12} sm={6} lg={3}><FinanceMetricCard label={tMonthEnd("cards.draftExpenses", "Draft expenses to review")} value={String(missingData?.draft_expenses_count ?? 0)} accent="warning" /></Grid>
            <Grid item xs={12} sm={6} lg={3}><FinanceMetricCard label={tMonthEnd("cards.reviewedMissingReceipts", "Reviewed expenses missing receipts")} value={String(missingData?.missing_receipts_count ?? 0)} accent="error" /></Grid>
            <Grid item xs={12} sm={6} lg={3}><FinanceMetricCard label={tMonthEnd("cards.uncategorizedExpenses", "Uncategorized expenses")} value={String(missingData?.uncategorized_expenses_count ?? 0)} accent="warning" /></Grid>
            <Grid item xs={12} sm={6} lg={3}><FinanceMetricCard label={tMonthEnd("cards.dueRecurringTemplates", "Recurring templates due soon")} value={String(dueTemplateCount)} accent="info" /></Grid>
            <Grid item xs={12} sm={6} lg={3}><FinanceMetricCard label={tMonthEnd("cards.refundedInvoices", "Refunded invoices")} value={String(refundSummary?.refunded_invoice_count ?? 0)} accent="primary" /></Grid>
            <Grid item xs={12} sm={6} lg={3}><FinanceMetricCard label={tMonthEnd("cards.partialRefunds", "Partial refunds")} value={String(refundSummary?.partial_refund_invoice_count ?? 0)} accent="secondary" /></Grid>
          </Grid>

          <FinanceCurrencyGroups
            groups={financeSummary?.currency_groups || []}
            metrics={[
              { key: "issued_invoice_amount", label: tMonthEnd("cards.issuedInvoiceAmount", "Issued invoice amount"), accent: "secondary" },
              { key: "outstanding_receivable", label: tMonthEnd("cards.outstandingReceivable", "Outstanding receivable"), accent: "warning" },
              { key: "recorded_payments_received", label: tMonthEnd("cards.recordedPayments", "Recorded payments received"), accent: "success" },
              { key: "confirmed_refunds", label: tMonthEnd("cards.confirmedRefunds", "Confirmed refunds"), accent: "warning" },
              { key: "net_collected_amount", label: tMonthEnd("cards.netCollected", "Net collected amount"), accent: "success" },
              { key: "expense_total", label: tMonthEnd("cards.expenseTotal", "Expense total"), accent: "error" },
              { key: "invoiced_tax", label: tMonthEnd("cards.invoicedTax", "Invoiced tax"), accent: "info" },
            ]}
          />

          <Paper variant="outlined" sx={{ p: 2, borderRadius: 1 }}>
            <Typography variant="h6" fontWeight={800} sx={{ mb: 1.5 }}>{tMonthEnd("sections.checklist", "Checklist")}</Typography>
            <Stack spacing={1}>
              {renderChecklistLine(tMonthEnd("checklistLines.invoicesReviewed", "Invoices reviewed"), "invoices_reviewed")}
              {renderChecklistLine(tMonthEnd("checklistLines.paymentsRecorded", "Payments recorded"), "payments_recorded")}
              {renderChecklistLine(tMonthEnd("checklistLines.expensesCategorized", "Expenses categorized"), "expenses_categorized")}
              {renderChecklistLine(tMonthEnd("checklistLines.receiptsUploaded", "Receipts uploaded"), "receipts_uploaded")}
              {renderChecklistLine(tMonthEnd("checklistLines.fieldReportsApproved", "Field reports approved"), "field_reports_approved")}
              {renderChecklistLine(tMonthEnd("checklistLines.inventoryUsageReviewed", "Inventory usage reviewed"), "inventory_usage_reviewed")}
              {renderChecklistLine(tMonthEnd("checklistLines.taxSummaryReady", "Tax summary ready"), "tax_summary_ready")}
            </Stack>
          </Paper>

          <Paper variant="outlined" sx={{ p: 2, borderRadius: 1 }}>
            <Typography variant="h6" fontWeight={800} sx={{ mb: 1.5 }}>{tMonthEnd("sections.summarySnapshot", "Summary snapshot")}</Typography>
            <Typography variant="body2" color="text.secondary">{tMonthEnd("summary.draftExpenses", "Draft expenses needing review")}: {missingData?.draft_expenses_count ?? 0}</Typography>
            <Typography variant="body2" color="text.secondary">{tMonthEnd("summary.missingReceipts", "Missing receipts")}: {summary?.missing_data?.missing_receipts_count ?? 0}</Typography>
            <Typography variant="body2" color="text.secondary">{tMonthEnd("summary.uncategorizedExpenses", "Uncategorized expenses")}: {summary?.missing_data?.uncategorized_expenses_count ?? 0}</Typography>
            <Typography variant="body2" color="text.secondary">{tMonthEnd("summary.dueRecurringTemplates", "Recurring templates due soon")}: {dueTemplateCount}</Typography>
            {dueDraftCount > 0 ? (
              <Typography variant="body2" color="text.secondary">
                {tMonthEnd("summary.dueRecurringDrafts", "{{count}} recurring draft expense(s) are due and ready to generate.", { count: dueDraftCount })}
              </Typography>
            ) : null}
            {(financeSummary?.currency_groups || []).length > 1 ? (
              <Alert severity="info">Money totals are shown in the currency groups above and are not combined.</Alert>
            ) : null}
            <FinanceCurrencyGroups
              groups={summary?.profitability_summary?.currency_groups || []}
              showReconciliationWarning={false}
              metrics={[
                { key: "estimated_margin_gross", label: tMonthEnd("summary.estimatedMarginGross", "Estimated margin gross"), accent: "primary" },
                { key: "estimated_margin_net", label: tMonthEnd("summary.estimatedMarginNet", "Estimated margin net"), accent: "success" },
              ]}
              emptyMessage={tMonthEnd("summary.noProfitability", "No work-order profitability activity for this period.")}
            />
            {(financeSummary?.currency_groups || []).some((group) => Number(group?.confirmed_refunds || 0) > 0) ? (
              <Typography variant="body2" color="text.secondary">
                {tMonthEnd("summary.refundReviewNote", "Review confirmed refund activity before final accounting handoff. Refunds affect net collected cash; tax allocation remains an accountant review item.")}
              </Typography>
            ) : null}
          </Paper>
        </>
      )}
    </Stack>
  );
}
