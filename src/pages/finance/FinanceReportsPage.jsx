import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Button,
  CircularProgress,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { useSnackbar } from "notistack";
import FinanceMetricCard from "./components/FinanceMetricCard";
import FinanceSettingsSnapshotCard from "./components/FinanceSettingsSnapshotCard";
import { exportAccountantCsv, getFinanceSummary, getFinanceTaxContext } from "./financeApi";
import { formatDate } from "../../utils/datetime";
import ThemedDateField from "../../components/ui/ThemedDateField";

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

export default function FinanceReportsPage() {
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  const tReports = useCallback(
    (key, fallback, options = {}) => t(`manager.finance.reports.${key}`, { defaultValue: fallback, ...options }),
    [t]
  );
  const [summary, setSummary] = useState(null);
  const [taxContext, setTaxContext] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [exportType, setExportType] = useState("summary");
  const [dateFrom, setDateFrom] = useState(firstDayOfMonth());
  const [dateTo, setDateTo] = useState(formatDate(new Date()));
  const [downloading, setDownloading] = useState(false);
  const currency = summary?.currency || "USD";

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const [data, financeTaxContext] = await Promise.all([
          getFinanceSummary({ date_from: dateFrom, date_to: dateTo }),
          getFinanceTaxContext(),
        ]);
        if (mounted) setSummary(data || {});
        if (mounted) setTaxContext(financeTaxContext?.tax_context || null);
      } catch (err) {
        if (mounted) setError(err?.response?.data?.error || err?.message || tReports("errors.loadFailed", "Unable to load finance reports."));
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [dateFrom, dateTo, tReports]);

  const downloadCsv = async () => {
    setDownloading(true);
    try {
      const res = await exportAccountantCsv({
        date_from: dateFrom,
        date_to: dateTo,
        export_type: exportType,
        format: "csv",
      });
      const blob = new Blob([res.data], { type: res.headers?.["content-type"] || "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `schedulaa-${exportType}-${dateFrom}-to-${dateTo}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      enqueueSnackbar(tReports("snackbar.csvDownloaded", "CSV export downloaded."), { variant: "success" });
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.error || err?.message || tReports("errors.exportFailed", "Unable to export CSV."), { variant: "error" });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Stack spacing={2.5}>
      <FinanceSettingsSnapshotCard
        taxContext={taxContext}
        title={tReports("taxContext.snapshotTitle", "Finance settings snapshot")}
        helper={tReports(
          "taxContext.snapshotHelper",
          "These are the company finance defaults behind report totals, estimate pricing behavior, and expense/purchase guidance."
        )}
      />

      {loading ? (
        <Stack alignItems="center" sx={{ py: 8 }}><CircularProgress /></Stack>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : (
        <Stack spacing={2}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} lg={4}><FinanceMetricCard label={tReports("cards.estimateTotal", "Estimate Total")} value={formatMoney(summary?.estimate_total, currency)} accent="primary" /></Grid>
            <Grid item xs={12} sm={6} lg={4}><FinanceMetricCard label={tReports("cards.grossInvoiceTotal", "Gross Invoice Total")} value={formatMoney(summary?.gross_invoice_total ?? summary?.invoice_total, currency)} accent="secondary" /></Grid>
            <Grid item xs={12} sm={6} lg={4}><FinanceMetricCard label={tReports("cards.refunds", "Refunds")} value={formatMoney(summary?.refund_total, currency)} accent="warning" /></Grid>
            <Grid item xs={12} sm={6} lg={4}><FinanceMetricCard label={tReports("cards.netInvoiceTotal", "Net Invoice Total")} value={formatMoney(summary?.net_invoice_total, currency)} accent="success" /></Grid>
            <Grid item xs={12} sm={6} lg={4}><FinanceMetricCard label={tReports("cards.expenseTotal", "Expense Total")} value={formatMoney(summary?.expense_total, currency)} accent="error" /></Grid>
            <Grid item xs={12} sm={6} lg={4}><FinanceMetricCard label={tReports("cards.grossTaxCollected", "Gross Tax Collected")} value={formatMoney(summary?.gross_tax_collected ?? summary?.tax_collected, currency)} accent="info" /></Grid>
            <Grid item xs={12} sm={6} lg={4}><FinanceMetricCard label={tReports("cards.taxRefunded", "Tax Refunded")} value={formatMoney(summary?.tax_refunded, currency)} accent="warning" /></Grid>
            <Grid item xs={12} sm={6} lg={4}><FinanceMetricCard label={tReports("cards.netTaxCollected", "Net Tax Collected")} value={formatMoney(summary?.net_tax_collected, currency)} accent="success" /></Grid>
            <Grid item xs={12} sm={6} lg={4}><FinanceMetricCard label={tReports("cards.taxPaidOnExpenses", "Tax Paid On Expenses")} value={formatMoney(summary?.tax_paid_on_expenses, currency)} accent="secondary" /></Grid>
            <Grid item xs={12} sm={6} lg={4}><FinanceMetricCard label={tReports("cards.estimatedNetTaxGross", "Estimated Net Tax Gross")} value={formatMoney(summary?.estimated_net_tax_gross ?? summary?.estimated_net_tax, currency)} accent="info" /></Grid>
            <Grid item xs={12} sm={6} lg={4}><FinanceMetricCard label={tReports("cards.estimatedNetTaxNet", "Estimated Net Tax Net")} value={formatMoney(summary?.estimated_net_tax_net, currency)} accent="warning" /></Grid>
            <Grid item xs={12} sm={6} lg={4}><FinanceMetricCard label={tReports("cards.refundedInvoices", "Refunded Invoices")} value={String(summary?.refunded_invoice_count ?? 0)} accent="primary" /></Grid>
            <Grid item xs={12} sm={6} lg={4}><FinanceMetricCard label={tReports("cards.partialRefunds", "Partial Refunds")} value={String(summary?.partial_refund_invoice_count ?? 0)} accent="secondary" /></Grid>
          </Grid>
        </Stack>
      )}

      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 1 }}>
        <Stack spacing={2}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
              <ThemedDateField fullWidth label={tReports("filters.from", "From")} value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </Grid>
            <Grid item xs={12} md={3}>
              <ThemedDateField fullWidth label={tReports("filters.to", "To")} value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>{tReports("filters.exportType", "Export type")}</InputLabel>
                <Select label={tReports("filters.exportType", "Export type")} value={exportType} onChange={(e) => setExportType(e.target.value)}>
                  <MenuItem value="expenses">{tReports("filters.expenses", "Expenses")}</MenuItem>
                  <MenuItem value="invoices">{tReports("filters.invoices", "Invoices")}</MenuItem>
                  <MenuItem value="summary">{tReports("filters.summary", "Summary")}</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <Button variant="contained" fullWidth sx={{ height: "100%" }} onClick={downloadCsv} disabled={downloading}>
                {downloading ? tReports("filters.preparingCsv", "Preparing CSV...") : tReports("filters.downloadCsv", "Download CSV")}
              </Button>
            </Grid>
          </Grid>
        </Stack>
      </Paper>
    </Stack>
  );
}
