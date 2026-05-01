import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Button,
  CircularProgress,
  Grid,
  Paper,
  Stack,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import ThemedDateField from "../../components/ui/ThemedDateField";
import FinanceMetricCard from "./components/FinanceMetricCard";
import { getFinanceTaxSummary } from "./financeApi";
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

export default function TaxSummaryPage() {
  const { t } = useTranslation();
  const tTax = useCallback(
    (key, fallback, options = {}) => t(`manager.finance.taxSummary.${key}`, { defaultValue: fallback, ...options }),
    [t]
  );
  const [dateFrom, setDateFrom] = useState(firstDayOfMonth());
  const [dateTo, setDateTo] = useState(formatDate(new Date()));
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const currency = report?.currency || "USD";

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getFinanceTaxSummary({ date_from: dateFrom, date_to: dateTo });
      setReport(res || {});
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || tTax("errors.loadFailed", "Unable to load tax summary."));
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo, tTax]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <Stack spacing={2.5}>
      <Paper variant="outlined" sx={{ p: 2, borderRadius: 1 }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
          <ThemedDateField fullWidth label={tTax("filters.from", "From")} value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          <ThemedDateField fullWidth label={tTax("filters.to", "To")} value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          <Button variant="contained" onClick={load}>{tTax("filters.refresh", "Refresh")}</Button>
        </Stack>
      </Paper>

      {loading ? (
        <Stack alignItems="center" sx={{ py: 8 }}><CircularProgress /></Stack>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : (
        <>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} lg={4}><FinanceMetricCard label={tTax("cards.grossTaxCollected", "Gross tax collected")} value={formatMoney(report?.gross_tax_collected ?? report?.tax_collected, currency)} accent="primary" /></Grid>
            <Grid item xs={12} sm={6} lg={4}><FinanceMetricCard label={tTax("cards.taxRefunded", "Tax refunded")} value={formatMoney(report?.tax_refunded, currency)} accent="warning" /></Grid>
            <Grid item xs={12} sm={6} lg={4}><FinanceMetricCard label={tTax("cards.netTaxCollected", "Net tax collected")} value={formatMoney(report?.net_tax_collected, currency)} accent="success" /></Grid>
            <Grid item xs={12} sm={6} lg={4}><FinanceMetricCard label={tTax("cards.taxPaidOnExpenses", "Tax paid on expenses")} value={formatMoney(report?.tax_paid_on_expenses, currency)} accent="secondary" /></Grid>
            <Grid item xs={12} sm={6} lg={4}><FinanceMetricCard label={tTax("cards.estimatedNetTaxGross", "Estimated net tax gross")} value={formatMoney(report?.estimated_net_tax_gross ?? report?.estimated_net_tax, currency)} accent="info" /></Grid>
            <Grid item xs={12} sm={6} lg={4}><FinanceMetricCard label={tTax("cards.estimatedNetTaxNet", "Estimated net tax net")} value={formatMoney(report?.estimated_net_tax_net, currency)} accent="warning" /></Grid>
            <Grid item xs={12} sm={6} lg={4}><FinanceMetricCard label={tTax("cards.refundTotal", "Refund total")} value={formatMoney(report?.refund_total, currency)} accent="error" /></Grid>
            <Grid item xs={12} sm={6} lg={4}><FinanceMetricCard label={tTax("cards.refundedInvoices", "Refunded invoices")} value={String(report?.refunded_invoice_count ?? 0)} accent="primary" /></Grid>
            <Grid item xs={12} sm={6} lg={4}><FinanceMetricCard label={tTax("cards.partialRefunds", "Partial refunds")} value={String(report?.partial_refund_invoice_count ?? 0)} accent="secondary" /></Grid>
          </Grid>
        </>
      )}
    </Stack>
  );
}
