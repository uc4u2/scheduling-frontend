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
import FinanceMetricCard from "./components/FinanceMetricCard";
import FinanceSettingsSnapshotCard from "./components/FinanceSettingsSnapshotCard";
import ThemedDateField from "../../components/ui/ThemedDateField";
import { getFinanceProfitabilityReport, getFinanceTaxContext } from "./financeApi";
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

export default function ProfitabilityReportsPage() {
  const { t } = useTranslation();
  const tProfit = useCallback(
    (key, fallback, options = {}) => t(`manager.finance.profitability.${key}`, { defaultValue: fallback, ...options }),
    [t]
  );
  const [dateFrom, setDateFrom] = useState(firstDayOfMonth());
  const [dateTo, setDateTo] = useState(formatDate(new Date()));
  const [report, setReport] = useState(null);
  const [taxContext, setTaxContext] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const currency = report?.currency || taxContext?.display_currency || "USD";

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [res, financeTaxContext] = await Promise.all([
        getFinanceProfitabilityReport({ date_from: dateFrom, date_to: dateTo }),
        getFinanceTaxContext(),
      ]);
      setReport(res || {});
      setTaxContext(financeTaxContext?.tax_context || null);
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || tProfit("errors.loadFailed", "Unable to load profitability."));
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo, tProfit]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <Stack spacing={2.5}>
      <FinanceSettingsSnapshotCard
        taxContext={taxContext}
        title={tProfit("taxContext.snapshotTitle", "Finance settings snapshot")}
        helper={tProfit(
          "taxContext.snapshotHelper",
          "These are the current company finance defaults behind Business Finance pricing, tax behavior, and profitability context."
        )}
      />

      <Paper variant="outlined" sx={{ p: 2, borderRadius: 1 }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} alignItems={{ md: "center" }}>
          <ThemedDateField fullWidth label={tProfit("filters.from", "From")} value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          <ThemedDateField fullWidth label={tProfit("filters.to", "To")} value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          <Button variant="contained" onClick={load}>{tProfit("filters.refresh", "Refresh")}</Button>
        </Stack>
      </Paper>

      {loading ? (
        <Stack alignItems="center" sx={{ py: 8 }}><CircularProgress /></Stack>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : (
        <>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} lg={4}><FinanceMetricCard label={tProfit("cards.estimateTotal", "Estimate total")} value={formatMoney(report?.estimate_total, currency)} accent="primary" /></Grid>
            <Grid item xs={12} sm={6} lg={4}><FinanceMetricCard label={tProfit("cards.invoiceTotal", "Invoice total")} value={formatMoney(report?.invoice_total, currency)} accent="secondary" /></Grid>
            <Grid item xs={12} sm={6} lg={4}><FinanceMetricCard label={tProfit("cards.grossRevenue", "Gross revenue")} value={formatMoney(report?.gross_revenue ?? report?.invoice_total, currency)} accent="secondary" /></Grid>
            <Grid item xs={12} sm={6} lg={4}><FinanceMetricCard label={tProfit("cards.refunds", "Refunds")} value={formatMoney(report?.refund_total, currency)} accent="warning" /></Grid>
            <Grid item xs={12} sm={6} lg={4}><FinanceMetricCard label={tProfit("cards.netRevenue", "Net revenue")} value={formatMoney(report?.net_revenue, currency)} accent="success" /></Grid>
            <Grid item xs={12} sm={6} lg={4}><FinanceMetricCard label={tProfit("cards.plannedLaborCost", "Planned labor cost")} value={formatMoney(report?.planned_labor_cost, currency)} accent="warning" /></Grid>
            <Grid item xs={12} sm={6} lg={4}><FinanceMetricCard label={tProfit("cards.approvedMaterialCost", "Approved material cost")} value={formatMoney(report?.approved_material_cost, currency)} accent="error" /></Grid>
            <Grid item xs={12} sm={6} lg={4}><FinanceMetricCard label={tProfit("cards.linkedExpenses", "Linked expenses")} value={formatMoney(report?.linked_expense_total, currency)} accent="info" /></Grid>
            <Grid item xs={12} sm={6} lg={4}><FinanceMetricCard label={tProfit("cards.estimatedMarginGross", "Estimated margin gross")} value={formatMoney(report?.estimated_margin_gross ?? report?.estimated_margin, currency)} accent="primary" /></Grid>
            <Grid item xs={12} sm={6} lg={4}><FinanceMetricCard label={tProfit("cards.estimatedMarginNet", "Estimated margin net")} value={formatMoney(report?.estimated_margin_net, currency)} accent="success" /></Grid>
          </Grid>
          <Typography variant="body2" color="text.secondary">
            {tProfit("footnote", "Calculated per work order using linked invoice totals when available, estimate fallback when not invoiced yet, and separate gross versus net margin when refund activity exists.")}
          </Typography>
        </>
      )}
    </Stack>
  );
}
