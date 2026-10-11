import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Button,
  CircularProgress,
  Paper,
  Stack,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import ThemedDateField from "../../components/ui/ThemedDateField";
import FinanceCurrencyGroups from "./components/FinanceCurrencyGroups";
import FinanceSettingsSnapshotCard from "./components/FinanceSettingsSnapshotCard";
import { getFinanceTaxContext, getFinanceTaxSummary } from "./financeApi";
import { formatDate } from "../../utils/datetime";

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
  const [taxContext, setTaxContext] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [res, financeTaxContext] = await Promise.all([
        getFinanceTaxSummary({ date_from: dateFrom, date_to: dateTo }),
        getFinanceTaxContext(),
      ]);
      setReport(res || {});
      setTaxContext(financeTaxContext?.tax_context || null);
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
      <FinanceSettingsSnapshotCard
        taxContext={taxContext}
        title={tTax("taxContext.snapshotTitle", "Finance settings snapshot")}
        helper={tTax(
          "taxContext.snapshotHelper",
          "These are the current company tax defaults behind Business Finance tax calculations and month-end tax review."
        )}
      />

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
        <Stack spacing={2}>
          <Alert severity="info">
            This report shows invoiced tax by original document currency. Collected tax is not shown because partial-payment and refund tax allocation is not persisted yet.
          </Alert>
          <FinanceCurrencyGroups
            groups={report?.currency_groups || []}
            showReconciliationWarning={false}
            metrics={[
              { key: "invoiced_tax", label: tTax("cards.invoicedTax", "Invoiced tax"), accent: "primary" },
              { key: "tax_paid_on_expenses", label: tTax("cards.taxPaidOnExpenses", "Tax paid on expenses"), accent: "secondary" },
              { key: "estimated_tax_position", label: tTax("cards.estimatedTaxPosition", "Estimated tax position"), accent: "info", helper: "Invoiced tax less tax recorded on expenses; accountant review is still required." },
            ]}
          />
        </Stack>
      )}
    </Stack>
  );
}
