import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Button,
  CircularProgress,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import FinanceCurrencyGroups from "./components/FinanceCurrencyGroups";
import FinanceSettingsSnapshotCard from "./components/FinanceSettingsSnapshotCard";
import ThemedDateField from "../../components/ui/ThemedDateField";
import { getFinanceProfitabilityReport, getFinanceTaxContext } from "./financeApi";
import { formatDate } from "../../utils/datetime";

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
          <Alert severity="info">
            Revenue and costs are shown in their original currencies. No exchange-rate conversion is applied.
          </Alert>
          <FinanceCurrencyGroups
            groups={report?.currency_groups || []}
            showReconciliationWarning={false}
            metrics={[
              { key: "estimate_total", label: tProfit("cards.estimateTotal", "Estimate total"), accent: "primary" },
              { key: "invoice_total", label: tProfit("cards.invoiceTotal", "Invoice total"), accent: "secondary" },
              { key: "gross_revenue", label: tProfit("cards.grossRevenue", "Gross revenue"), accent: "secondary" },
              { key: "refund_total", label: tProfit("cards.refunds", "Refunds"), accent: "warning" },
              { key: "net_revenue", label: tProfit("cards.netRevenue", "Net revenue"), accent: "success" },
              { key: "planned_labor_cost", label: tProfit("cards.plannedLaborCost", "Planned labor cost"), accent: "warning" },
              { key: "approved_material_cost", label: tProfit("cards.approvedMaterialCost", "Approved material cost"), accent: "error" },
              { key: "linked_expense_total", label: tProfit("cards.linkedExpenses", "Linked expenses"), accent: "info" },
              { key: "estimated_margin_gross", label: tProfit("cards.estimatedMarginGross", "Estimated margin gross"), accent: "primary" },
              { key: "estimated_margin_net", label: tProfit("cards.estimatedMarginNet", "Estimated margin net"), accent: "success" },
            ]}
          />
          <Typography variant="body2" color="text.secondary">
            {tProfit("footnote", "Calculated per work order using linked invoice totals when available, estimate fallback when not invoiced yet, and separate gross versus net margin when refund activity exists. Currency groups are never added together.")}
          </Typography>
        </>
      )}
    </Stack>
  );
}
