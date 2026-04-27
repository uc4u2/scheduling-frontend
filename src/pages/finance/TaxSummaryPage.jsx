import React, { useEffect, useState } from "react";
import {
  Alert,
  Button,
  CircularProgress,
  Grid,
  Paper,
  Stack,
} from "@mui/material";
import ThemedDateField from "../../components/ui/ThemedDateField";
import FinanceMetricCard from "./components/FinanceMetricCard";
import { getFinanceTaxSummary } from "./financeApi";
import { formatDate } from "../../utils/datetime";

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

export default function TaxSummaryPage() {
  const [dateFrom, setDateFrom] = useState(firstDayOfMonth());
  const [dateTo, setDateTo] = useState(formatDate(new Date()));
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getFinanceTaxSummary({ date_from: dateFrom, date_to: dateTo });
      setReport(res || {});
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Unable to load tax summary.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <Stack spacing={2.5}>
      <Paper variant="outlined" sx={{ p: 2, borderRadius: 1 }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
          <ThemedDateField fullWidth label="From" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          <ThemedDateField fullWidth label="To" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          <Button variant="contained" onClick={load}>Refresh</Button>
        </Stack>
      </Paper>

      {loading ? (
        <Stack alignItems="center" sx={{ py: 8 }}><CircularProgress /></Stack>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : (
        <>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} lg={4}><FinanceMetricCard label="Tax collected" value={formatMoney(report?.tax_collected)} accent="primary" /></Grid>
            <Grid item xs={12} sm={6} lg={4}><FinanceMetricCard label="Tax paid on expenses" value={formatMoney(report?.tax_paid_on_expenses)} accent="secondary" /></Grid>
            <Grid item xs={12} sm={6} lg={4}><FinanceMetricCard label="Estimated net tax" value={formatMoney(report?.estimated_net_tax)} accent="warning" /></Grid>
          </Grid>
          <Alert severity="info">Estimated tax summary for accountant review.</Alert>
        </>
      )}
    </Stack>
  );
}
