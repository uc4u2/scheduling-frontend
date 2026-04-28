import React, { useEffect, useState } from "react";
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
import { useSnackbar } from "notistack";
import FinanceMetricCard from "./components/FinanceMetricCard";
import { exportAccountantCsv, getFinanceSummary } from "./financeApi";
import { formatDate } from "../../utils/datetime";
import ThemedDateField from "../../components/ui/ThemedDateField";

const formatMoney = (value) =>
  new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

const firstDayOfMonth = () => {
  const now = new Date();
  return formatDate(new Date(now.getFullYear(), now.getMonth(), 1));
};

export default function FinanceReportsPage() {
  const { enqueueSnackbar } = useSnackbar();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [exportType, setExportType] = useState("summary");
  const [dateFrom, setDateFrom] = useState(firstDayOfMonth());
  const [dateTo, setDateTo] = useState(formatDate(new Date()));
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await getFinanceSummary();
        if (mounted) setSummary(data || {});
      } catch (err) {
        if (mounted) setError(err?.response?.data?.error || err?.message || "Unable to load finance reports.");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

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
      enqueueSnackbar("CSV export downloaded.", { variant: "success" });
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.error || err?.message || "Unable to export CSV.", { variant: "error" });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Stack spacing={2.5}>
      {loading ? (
        <Stack alignItems="center" sx={{ py: 8 }}><CircularProgress /></Stack>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : (
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} lg={4}><FinanceMetricCard label="Estimate Total" value={formatMoney(summary?.estimate_total)} accent="primary" /></Grid>
          <Grid item xs={12} sm={6} lg={4}><FinanceMetricCard label="Invoice Total" value={formatMoney(summary?.invoice_total)} accent="secondary" /></Grid>
          <Grid item xs={12} sm={6} lg={4}><FinanceMetricCard label="Expense Total" value={formatMoney(summary?.expense_total)} accent="error" /></Grid>
          <Grid item xs={12} sm={6} lg={4}><FinanceMetricCard label="Tax Collected" value={formatMoney(summary?.tax_collected)} accent="info" /></Grid>
          <Grid item xs={12} sm={6} lg={4}><FinanceMetricCard label="Tax Paid On Expenses" value={formatMoney(summary?.tax_paid_on_expenses)} accent="success" /></Grid>
          <Grid item xs={12} sm={6} lg={4}><FinanceMetricCard label="Estimated Net Tax" value={formatMoney(summary?.estimated_net_tax)} accent="warning" /></Grid>
        </Grid>
      )}

      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 1 }}>
        <Stack spacing={2}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
              <ThemedDateField fullWidth label="From" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </Grid>
            <Grid item xs={12} md={3}>
              <ThemedDateField fullWidth label="To" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Export type</InputLabel>
                <Select label="Export type" value={exportType} onChange={(e) => setExportType(e.target.value)}>
                  <MenuItem value="expenses">Expenses</MenuItem>
                  <MenuItem value="invoices">Invoices</MenuItem>
                  <MenuItem value="summary">Summary</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <Button variant="contained" fullWidth sx={{ height: "100%" }} onClick={downloadCsv} disabled={downloading}>
                {downloading ? "Preparing CSV..." : "Download CSV"}
              </Button>
            </Grid>
          </Grid>
        </Stack>
      </Paper>
    </Stack>
  );
}
