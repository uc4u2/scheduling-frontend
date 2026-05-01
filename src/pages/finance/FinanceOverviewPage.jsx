import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Grid,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { formatCurrency } from "../../utils/formatters";
import FinanceMetricCard from "./components/FinanceMetricCard";
import FinanceEmptyState from "./components/FinanceEmptyState";
import FinanceSettingsSnapshotCard from "./components/FinanceSettingsSnapshotCard";
import { getFinanceOverview, getFinanceSummary, getFinanceTaxContext } from "./financeApi";

const buildAttentionCards = (overview = {}, actions = [], tFinance) => {
  const actionMap = new Map(actions.map((row) => [row.type, row]));
  return [
    {
      key: "quote",
      label: tFinance("attention.quote.label", "New quotes"),
      count: actionMap.get("quote")?.count ?? actionMap.get("quote_request")?.count ?? 0,
      helper: tFinance("attention.quote.helper", "Capture new requests before they go stale."),
      target: "finance-quotes",
      accent: "warning",
      actionLabel: tFinance("attention.quote.action", "Open Quotes"),
    },
    {
      key: "estimate",
      label: tFinance("attention.estimate.label", "Draft estimates"),
      count: Number(overview?.estimate_counts?.draft ?? 0),
      helper: tFinance("attention.estimate.helper", "Finish pricing before the job moves forward."),
      target: "finance-estimates",
      accent: "primary",
      actionLabel: tFinance("attention.estimate.action", "Open Estimates"),
    },
    {
      key: "work-order",
      label: tFinance("attention.workOrder.label", "Work orders need scheduling"),
      count: Number(overview?.work_orders_needing_scheduling_count ?? 0),
      helper: tFinance("attention.workOrder.helper", "Draft jobs or jobs still missing team assignments."),
      target: "finance-work-orders",
      accent: "warning",
      actionLabel: tFinance("attention.workOrder.action", "Open Work Orders"),
    },
    {
      key: "field-report",
      label: tFinance("attention.fieldReport.label", "Field reports need review"),
      count: Number(overview?.field_reports_pending_review_count ?? 0),
      helper: tFinance("attention.fieldReport.helper", "Submitted work needs manager review before it becomes official."),
      target: "finance-field-reports",
      accent: "secondary",
      actionLabel: tFinance("attention.fieldReport.action", "Open Field Reports"),
    },
    {
      key: "low-stock",
      label: tFinance("attention.lowStock.label", "Low stock items"),
      count: Number(overview?.low_stock_count ?? 0),
      helper: tFinance("attention.lowStock.helper", "Check materials before the next job starts."),
      target: "finance-inventory",
      accent: "error",
      actionLabel: tFinance("attention.lowStock.action", "Open Materials"),
    },
    {
      key: "missing-receipts",
      label: tFinance("attention.missingReceipts.label", "Missing receipts"),
      count: Number(overview?.expenses_missing_receipt_count ?? overview?.missing_receipts_count ?? 0),
      helper: tFinance("attention.missingReceipts.helper", "Capture the missing proof before month-end handoff."),
      target: "finance-expenses",
      accent: "info",
      actionLabel: tFinance("attention.missingReceipts.action", "Open Expenses"),
    },
    {
      key: "month-end",
      label: tFinance("attention.monthEnd.label", "Month-end missing items"),
      count: Number(overview?.month_end_missing_items_count ?? 0),
      helper: tFinance("attention.monthEnd.helper", "Review gaps before exporting for the accountant."),
      target: "finance-month-end",
      accent: "warning",
      actionLabel: tFinance("attention.monthEnd.action", "Open Month-End"),
    },
  ];
};

export default function FinanceOverviewPage({ onNavigate, onQuickAction }) {
  const { t } = useTranslation();
  const tFinance = React.useCallback(
    (key, fallback, options = {}) => t(`manager.finance.overview.${key}`, { defaultValue: fallback, ...options }),
    [t]
  );
  const [overview, setOverview] = useState(null);
  const [summary, setSummary] = useState(null);
  const [taxContext, setTaxContext] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const [overviewData, summaryData, financeTaxContext] = await Promise.all([
          getFinanceOverview(),
          getFinanceSummary(),
          getFinanceTaxContext(),
        ]);
        if (!mounted) return;
        setOverview(overviewData || {});
        setSummary(summaryData || {});
        setTaxContext(financeTaxContext?.tax_context || null);
      } catch (err) {
        if (!mounted) return;
        setError(
          err?.response?.data?.error ||
            err?.message ||
            tFinance("errors.loadFailed", "Unable to load Business Finance overview.")
        );
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [tFinance]);

  const actions = useMemo(() => Array.isArray(overview?.today_action_list) ? overview.today_action_list : [], [overview]);
  const attentionCards = useMemo(
    () => buildAttentionCards(overview || {}, actions, tFinance),
    [overview, actions, tFinance]
  );
  const currency = summary?.currency || "USD";

  if (loading) {
    return (
      <Stack alignItems="center" justifyContent="center" sx={{ py: 8 }}>
        <CircularProgress />
      </Stack>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Stack spacing={3}>
      <FinanceSettingsSnapshotCard
        taxContext={taxContext}
        title={tFinance("taxContext.snapshotTitle", "Finance settings snapshot")}
        helper={tFinance(
          "taxContext.snapshotHelper",
          "These are the current company defaults for Business Finance estimates, expenses, purchases, reports, and month-end review."
        )}
      />

      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 1.5 }}>
        <Stack spacing={2}>
          <Typography variant="h6" fontWeight={900}>
            {tFinance("sections.attention", "Today needs your attention")}
          </Typography>

          {attentionCards.some((card) => Number(card.count) > 0) ? (
            <Grid container spacing={2}>
              {attentionCards.map((card) => (
                <Grid item xs={12} sm={6} lg={4} key={card.key}>
                  <FinanceMetricCard
                    label={card.label}
                    value={String(card.count ?? 0)}
                    helper={card.helper}
                    accent={card.accent}
                    action={<Button size="small" onClick={() => onNavigate?.(card.target)}>{card.actionLabel}</Button>}
                  />
                </Grid>
              ))}
            </Grid>
          ) : (
            <FinanceEmptyState
              title={tFinance("empty.title", "Nothing urgent is waiting right now")}
              description={tFinance(
                "empty.description",
                "Quotes, jobs, receipts, and month-end follow-up are all in a good spot at the moment."
              )}
            />
          )}
        </Stack>
      </Paper>

      <Box>
        <Typography variant="h6" fontWeight={900} sx={{ mb: 1.5 }}>
          {tFinance("sections.money", "Money snapshot")}
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} lg={4}><FinanceMetricCard label={tFinance("money.estimateTotal", "Estimate total")} value={formatCurrency(summary?.estimate_total, currency)} accent="primary" /></Grid>
          <Grid item xs={12} sm={6} lg={4}><FinanceMetricCard label={tFinance("money.grossInvoiceTotal", "Gross invoice total")} value={formatCurrency(summary?.gross_invoice_total ?? summary?.invoice_total, currency)} accent="secondary" /></Grid>
          <Grid item xs={12} sm={6} lg={4}><FinanceMetricCard label={tFinance("money.refunds", "Refunds")} value={formatCurrency(summary?.refund_total, currency)} accent="warning" /></Grid>
          <Grid item xs={12} sm={6} lg={4}><FinanceMetricCard label={tFinance("money.netInvoiceTotal", "Net invoice total")} value={formatCurrency(summary?.net_invoice_total, currency)} accent="success" /></Grid>
          <Grid item xs={12} sm={6} lg={4}><FinanceMetricCard label={tFinance("money.expenseTotal", "Expense total")} value={formatCurrency(summary?.expense_total, currency)} accent="error" /></Grid>
          <Grid item xs={12} sm={6} lg={4}><FinanceMetricCard label={tFinance("money.grossTaxCollected", "Gross tax collected")} value={formatCurrency(summary?.gross_tax_collected ?? summary?.tax_collected, currency)} accent="info" /></Grid>
          <Grid item xs={12} sm={6} lg={4}><FinanceMetricCard label={tFinance("money.taxRefunded", "Tax refunded")} value={formatCurrency(summary?.tax_refunded, currency)} accent="warning" /></Grid>
          <Grid item xs={12} sm={6} lg={4}><FinanceMetricCard label={tFinance("money.netTaxCollected", "Net tax collected")} value={formatCurrency(summary?.net_tax_collected, currency)} accent="success" /></Grid>
          <Grid item xs={12} sm={6} lg={4}><FinanceMetricCard label={tFinance("money.taxPaidOnExpenses", "Tax paid on expenses")} value={formatCurrency(summary?.tax_paid_on_expenses, currency)} accent="success" /></Grid>
          <Grid item xs={12} sm={6} lg={4}><FinanceMetricCard label={tFinance("money.estimatedNetTaxNet", "Estimated net tax net")} value={formatCurrency(summary?.estimated_net_tax_net ?? summary?.estimated_net_tax, currency)} accent="warning" /></Grid>
        </Grid>
        {summary?.payment_total_scope === "not_available_without_invoice_payment_link" ? (
          <Alert severity="info" sx={{ mt: 2 }}>
            {tFinance(
              "money.paymentScopeInfo",
              "Payment collection totals are not available yet for all invoice payment methods."
            )}
          </Alert>
        ) : null}
      </Box>

      <Box>
        <Typography variant="h6" fontWeight={900} sx={{ mb: 1.5 }}>
          {tFinance("sections.operations", "Operations snapshot")}
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} lg={3}><FinanceMetricCard label={tFinance("operations.activeJobs.label", "Active jobs")} value={String(overview?.work_orders_active_count ?? 0)} helper={tFinance("operations.activeJobs.helper", "Scheduled or in progress.")} accent="primary" /></Grid>
          <Grid item xs={12} sm={6} lg={3}><FinanceMetricCard label={tFinance("operations.plannedLabor.label", "Planned labor this month")} value={formatCurrency(overview?.planned_labor_cost_this_month || 0)} helper={tFinance("operations.plannedLabor.helper", "Work order planning only.")} accent="secondary" /></Grid>
          <Grid item xs={12} sm={6} lg={3}><FinanceMetricCard label={tFinance("operations.inventoryValue.label", "Inventory value estimate")} value={formatCurrency(overview?.inventory_value_estimate || summary?.inventory_value_estimate || 0)} helper={tFinance("operations.inventoryValue.helper", "Current stock multiplied by cost per unit.")} accent="info" /></Grid>
          <Grid item xs={12} sm={6} lg={3}><FinanceMetricCard label={tFinance("operations.approvedMaterialCost.label", "Approved material cost")} value={formatCurrency(summary?.approved_material_cost || 0)} helper={tFinance("operations.approvedMaterialCost.helper", "Materials made official through manager review.")} accent="error" /></Grid>
        </Grid>
      </Box>

    </Stack>
  );
}
