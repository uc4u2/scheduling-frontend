import React, { useEffect, useState } from "react";
import {
  Alert,
  Button,
  CircularProgress,
  Grid,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { useSnackbar } from "notistack";
import ThemedDateField from "../../components/ui/ThemedDateField";
import FinanceMetricCard from "./components/FinanceMetricCard";
import { exportFinanceMonthEndCsv, getFinanceMissingData, getFinanceMonthEnd } from "./financeApi";
import { formatDate } from "../../utils/datetime";

const firstDayOfMonth = () => {
  const now = new Date();
  return formatDate(new Date(now.getFullYear(), now.getMonth(), 1));
};

export default function MonthEndReviewPage() {
  const { enqueueSnackbar } = useSnackbar();
  const [dateFrom, setDateFrom] = useState(firstDayOfMonth());
  const [dateTo, setDateTo] = useState(formatDate(new Date()));
  const [review, setReview] = useState(null);
  const [missingData, setMissingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
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
      setError(err?.response?.data?.error || err?.message || "Unable to load month-end review.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

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
      enqueueSnackbar("Month-end export downloaded.", { variant: "success" });
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.error || err?.message || "Unable to export month-end CSV.", { variant: "error" });
    } finally {
      setExporting(false);
    }
  };

  const checklist = review?.checklist || review?.checklist_json || {};
  const summary = review?.summary || review?.summary_json || {};

  return (
    <Stack spacing={2.5}>
      <Paper variant="outlined" sx={{ p: 2, borderRadius: 1 }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
          <ThemedDateField fullWidth label="From" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          <ThemedDateField fullWidth label="To" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          <Button variant="contained" onClick={load}>Refresh</Button>
          <Button variant="outlined" onClick={handleExport} disabled={exporting}>{exporting ? "Preparing CSV..." : "Download CSV"}</Button>
        </Stack>
      </Paper>

      {loading ? (
        <Stack alignItems="center" sx={{ py: 8 }}><CircularProgress /></Stack>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : (
        <>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} lg={3}><FinanceMetricCard label="Missing items" value={String(missingData?.month_end_missing_items_count ?? 0)} accent="warning" /></Grid>
            <Grid item xs={12} sm={6} lg={3}><FinanceMetricCard label="Low stock" value={String(missingData?.low_stock_count ?? 0)} accent="error" /></Grid>
            <Grid item xs={12} sm={6} lg={3}><FinanceMetricCard label="Pending field reports" value={String(missingData?.field_reports_pending_review_count ?? 0)} accent="info" /></Grid>
            <Grid item xs={12} sm={6} lg={3}><FinanceMetricCard label="Pending work orders" value={String(missingData?.work_orders_pending_review_count ?? 0)} accent="secondary" /></Grid>
          </Grid>

          <Paper variant="outlined" sx={{ p: 2, borderRadius: 1 }}>
            <Typography variant="h6" fontWeight={800} sx={{ mb: 1.5 }}>Checklist</Typography>
            <Stack spacing={1}>
              <Typography variant="body2">Invoices reviewed: {checklist.invoices_reviewed ? "Ready" : "Needs attention"}</Typography>
              <Typography variant="body2">Payments recorded: {checklist.payments_recorded ? "Ready" : "Needs attention"}</Typography>
              <Typography variant="body2">Expenses categorized: {checklist.expenses_categorized ? "Ready" : "Needs attention"}</Typography>
              <Typography variant="body2">Receipts uploaded: {checklist.receipts_uploaded ? "Ready" : "Needs attention"}</Typography>
              <Typography variant="body2">Field reports approved: {checklist.field_reports_approved ? "Ready" : "Needs attention"}</Typography>
              <Typography variant="body2">Inventory usage reviewed: {checklist.inventory_usage_reviewed ? "Ready" : "Needs attention"}</Typography>
              <Typography variant="body2">Tax summary ready: {checklist.tax_summary_ready ? "Ready" : "Needs attention"}</Typography>
            </Stack>
          </Paper>

          <Paper variant="outlined" sx={{ p: 2, borderRadius: 1 }}>
            <Typography variant="h6" fontWeight={800} sx={{ mb: 1.5 }}>Summary snapshot</Typography>
            <Typography variant="body2" color="text.secondary">Missing receipts: {summary?.missing_data?.missing_receipts_count ?? 0}</Typography>
            <Typography variant="body2" color="text.secondary">Uncategorized expenses: {summary?.missing_data?.uncategorized_expenses_count ?? 0}</Typography>
            <Typography variant="body2" color="text.secondary">Estimated net tax: {summary?.tax_summary?.estimated_net_tax ?? 0}</Typography>
            <Typography variant="body2" color="text.secondary">Estimated margin: {summary?.profitability_summary?.estimated_margin ?? 0}</Typography>
          </Paper>
        </>
      )}
    </Stack>
  );
}
