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
import FinanceMetricCard from "./components/FinanceMetricCard";
import ThemedDateField from "../../components/ui/ThemedDateField";
import { getFinanceProfitabilityReport } from "./financeApi";
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

export default function ProfitabilityReportsPage() {
  const [dateFrom, setDateFrom] = useState(firstDayOfMonth());
  const [dateTo, setDateTo] = useState(formatDate(new Date()));
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getFinanceProfitabilityReport({ date_from: dateFrom, date_to: dateTo });
      setReport(res || {});
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Unable to load profitability.");
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
        <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} alignItems={{ md: "center" }}>
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
            <Grid item xs={12} sm={6} lg={4}><FinanceMetricCard label="Estimate total" value={formatMoney(report?.estimate_total)} accent="primary" /></Grid>
            <Grid item xs={12} sm={6} lg={4}><FinanceMetricCard label="Invoice total" value={formatMoney(report?.invoice_total)} accent="secondary" /></Grid>
            <Grid item xs={12} sm={6} lg={4}><FinanceMetricCard label="Planned labor cost" value={formatMoney(report?.planned_labor_cost)} accent="warning" /></Grid>
            <Grid item xs={12} sm={6} lg={4}><FinanceMetricCard label="Approved material cost" value={formatMoney(report?.approved_material_cost)} accent="error" /></Grid>
            <Grid item xs={12} sm={6} lg={4}><FinanceMetricCard label="Linked expenses" value={formatMoney(report?.linked_expense_total)} accent="info" /></Grid>
            <Grid item xs={12} sm={6} lg={4}><FinanceMetricCard label="Estimated margin" value={formatMoney(report?.estimated_margin)} accent="success" /></Grid>
          </Grid>
        </>
      )}
    </Stack>
  );
}
