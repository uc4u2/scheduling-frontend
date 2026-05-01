import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
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
import { exportFinanceMonthEndCsv, getFinanceMissingData, getFinanceMonthEnd } from "./financeApi";
import { formatDate } from "../../utils/datetime";

const formatMoney = (value, currency = "USD") =>
  new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

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
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [reviewRes, missingRes] = await Promise.all([
        getFinanceMonthEnd({ date_from: dateFrom, date_to: dateTo }),
        getFinanceMissingData({ date_from: dateFrom, date_to: dateTo }),
      ]);
      setReview(reviewRes?.month_end_review || reviewRes || null);
      setMissingData(missingRes || null);
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || tMonthEnd("errors.loadFailed", "Unable to load month-end review."));
    } finally {
      setLoading(false);
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

  const checklist = review?.checklist || review?.checklist_json || {};
  const checklistReasons = review?.checklist_reasons || {};
  const summary = review?.summary || review?.summary_json || {};
  const refundSummary = summary?.refund_summary || {};
  const financeSummary = summary?.finance_summary || {};
  const taxSummary = summary?.tax_summary || {};
  const currency = refundSummary?.currency || financeSummary?.currency || taxSummary?.currency || "USD";
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
      <Paper variant="outlined" sx={{ p: 2, borderRadius: 1 }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
          <ThemedDateField fullWidth label={tMonthEnd("filters.from", "From")} value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          <ThemedDateField fullWidth label={tMonthEnd("filters.to", "To")} value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          <Button variant="contained" onClick={load}>{tMonthEnd("filters.refresh", "Refresh")}</Button>
          <Button variant="outlined" onClick={handleExport} disabled={exporting}>{exporting ? tMonthEnd("filters.preparingCsv", "Preparing CSV...") : tMonthEnd("filters.downloadCsv", "Download CSV")}</Button>
        </Stack>
      </Paper>

      {loading ? (
        <Stack alignItems="center" sx={{ py: 8 }}><CircularProgress /></Stack>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : (
        <>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} lg={3}><FinanceMetricCard label={tMonthEnd("cards.missingItems", "Missing items")} value={String(missingData?.month_end_missing_items_count ?? 0)} accent="warning" /></Grid>
            <Grid item xs={12} sm={6} lg={3}><FinanceMetricCard label={tMonthEnd("cards.lowStock", "Low stock")} value={String(missingData?.low_stock_count ?? 0)} accent="error" /></Grid>
            <Grid item xs={12} sm={6} lg={3}><FinanceMetricCard label={tMonthEnd("cards.pendingFieldReports", "Pending field reports")} value={String(missingData?.field_reports_pending_review_count ?? 0)} accent="info" /></Grid>
            <Grid item xs={12} sm={6} lg={3}><FinanceMetricCard label={tMonthEnd("cards.pendingWorkOrders", "Pending work orders")} value={String(missingData?.work_orders_pending_review_count ?? 0)} accent="secondary" /></Grid>
            <Grid item xs={12} sm={6} lg={3}><FinanceMetricCard label={tMonthEnd("cards.refundTotal", "Refund total")} value={formatMoney(refundSummary?.refund_total, currency)} accent="warning" /></Grid>
            <Grid item xs={12} sm={6} lg={3}><FinanceMetricCard label={tMonthEnd("cards.refundedInvoices", "Refunded invoices")} value={String(refundSummary?.refunded_invoice_count ?? 0)} accent="primary" /></Grid>
            <Grid item xs={12} sm={6} lg={3}><FinanceMetricCard label={tMonthEnd("cards.partialRefunds", "Partial refunds")} value={String(refundSummary?.partial_refund_invoice_count ?? 0)} accent="secondary" /></Grid>
            <Grid item xs={12} sm={6} lg={3}><FinanceMetricCard label={tMonthEnd("cards.taxRefunded", "Tax refunded")} value={formatMoney(refundSummary?.tax_refunded, currency)} accent="error" /></Grid>
          </Grid>

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
            <Typography variant="body2" color="text.secondary">{tMonthEnd("summary.missingReceipts", "Missing receipts")}: {summary?.missing_data?.missing_receipts_count ?? 0}</Typography>
            <Typography variant="body2" color="text.secondary">{tMonthEnd("summary.uncategorizedExpenses", "Uncategorized expenses")}: {summary?.missing_data?.uncategorized_expenses_count ?? 0}</Typography>
            <Typography variant="body2" color="text.secondary">{tMonthEnd("summary.grossInvoiceTotal", "Gross invoice total")}: {formatMoney(financeSummary?.gross_invoice_total ?? financeSummary?.invoice_total, currency)}</Typography>
            <Typography variant="body2" color="text.secondary">{tMonthEnd("summary.refundTotal", "Refund total")}: {formatMoney(refundSummary?.refund_total, currency)}</Typography>
            <Typography variant="body2" color="text.secondary">{tMonthEnd("summary.netInvoiceTotal", "Net invoice total")}: {formatMoney(refundSummary?.net_invoice_total ?? financeSummary?.net_invoice_total, currency)}</Typography>
            <Typography variant="body2" color="text.secondary">{tMonthEnd("summary.estimatedNetTaxGross", "Estimated net tax gross")}: {formatMoney(taxSummary?.estimated_net_tax_gross ?? taxSummary?.estimated_net_tax, currency)}</Typography>
            <Typography variant="body2" color="text.secondary">{tMonthEnd("summary.estimatedNetTaxNet", "Estimated net tax net")}: {formatMoney(taxSummary?.estimated_net_tax_net, currency)}</Typography>
            <Typography variant="body2" color="text.secondary">{tMonthEnd("summary.estimatedMarginGross", "Estimated margin gross")}: {formatMoney(summary?.profitability_summary?.estimated_margin_gross ?? summary?.profitability_summary?.estimated_margin, currency)}</Typography>
            <Typography variant="body2" color="text.secondary">{tMonthEnd("summary.estimatedMarginNet", "Estimated margin net")}: {formatMoney(summary?.profitability_summary?.estimated_margin_net, currency)}</Typography>
            {(Number(refundSummary?.refund_total || 0) > 0) ? (
              <Typography variant="body2" color="text.secondary">
                {tMonthEnd("summary.refundReviewNote", "Review refund activity before final accounting handoff. Refunds do not block month-end, but they do affect net cash and net tax.")}
              </Typography>
            ) : null}
          </Paper>
        </>
      )}
    </Stack>
  );
}
