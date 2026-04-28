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
import { formatCurrency } from "../../utils/formatters";
import FinanceMetricCard from "./components/FinanceMetricCard";
import FinanceEmptyState from "./components/FinanceEmptyState";
import { getFinanceOverview, getFinanceSummary } from "./financeApi";

const buildAttentionCards = (overview = {}, actions = []) => {
  const actionMap = new Map(actions.map((row) => [row.type, row]));
  return [
    {
      key: "quote",
      label: actionMap.get("quote")?.label || "New quotes",
      count: actionMap.get("quote")?.count ?? actionMap.get("quote_request")?.count ?? 0,
      helper: "Capture new requests before they go stale.",
      target: "finance-quotes",
      accent: "warning",
      actionLabel: "Open Quotes",
    },
    {
      key: "estimate",
      label: "Draft estimates",
      count: Number(overview?.estimate_counts?.draft ?? 0),
      helper: "Finish pricing before the job moves forward.",
      target: "finance-estimates",
      accent: "primary",
      actionLabel: "Open Estimates",
    },
    {
      key: "work-order",
      label: "Work orders need scheduling",
      count: Number(overview?.work_orders_needing_scheduling_count ?? 0),
      helper: "Draft jobs or jobs still missing team assignments.",
      target: "finance-work-orders",
      accent: "warning",
      actionLabel: "Open Work Orders",
    },
    {
      key: "field-report",
      label: "Field reports need review",
      count: Number(overview?.field_reports_pending_review_count ?? 0),
      helper: "Submitted work needs manager review before it becomes official.",
      target: "finance-field-reports",
      accent: "secondary",
      actionLabel: "Open Field Reports",
    },
    {
      key: "low-stock",
      label: "Low stock items",
      count: Number(overview?.low_stock_count ?? 0),
      helper: "Check materials before the next job starts.",
      target: "finance-inventory",
      accent: "error",
      actionLabel: "Open Materials",
    },
    {
      key: "missing-receipts",
      label: "Missing receipts",
      count: Number(overview?.missing_receipts_count ?? 0),
      helper: "Capture the missing proof before month-end handoff.",
      target: "finance-expenses",
      accent: "info",
      actionLabel: "Open Expenses",
    },
    {
      key: "month-end",
      label: "Month-end missing items",
      count: Number(overview?.month_end_missing_items_count ?? 0),
      helper: "Review gaps before exporting for the accountant.",
      target: "finance-month-end",
      accent: "warning",
      actionLabel: "Open Month-End",
    },
  ];
};

export default function FinanceOverviewPage({ onNavigate, onQuickAction }) {
  const [overview, setOverview] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const [overviewData, summaryData] = await Promise.all([getFinanceOverview(), getFinanceSummary()]);
        if (!mounted) return;
        setOverview(overviewData || {});
        setSummary(summaryData || {});
      } catch (err) {
        if (!mounted) return;
        setError(err?.response?.data?.error || err?.message || "Unable to load Business Finance overview.");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const actions = useMemo(() => Array.isArray(overview?.today_action_list) ? overview.today_action_list : [], [overview]);
  const attentionCards = useMemo(() => buildAttentionCards(overview || {}, actions), [overview, actions]);

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
      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 1.5 }}>
        <Stack spacing={2}>
          <Typography variant="h6" fontWeight={900}>
            Today needs your attention
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
              title="Nothing urgent is waiting right now"
              description="Quotes, jobs, receipts, and month-end follow-up are all in a good spot at the moment."
            />
          )}
        </Stack>
      </Paper>

      <Box>
        <Typography variant="h6" fontWeight={900} sx={{ mb: 1.5 }}>
          Money snapshot
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} lg={4}><FinanceMetricCard label="Estimate total" value={formatCurrency(summary?.estimate_total)} accent="primary" /></Grid>
          <Grid item xs={12} sm={6} lg={4}><FinanceMetricCard label="Invoice total" value={formatCurrency(summary?.invoice_total)} accent="secondary" /></Grid>
          <Grid item xs={12} sm={6} lg={4}><FinanceMetricCard label="Expense total" value={formatCurrency(summary?.expense_total)} accent="error" /></Grid>
          <Grid item xs={12} sm={6} lg={4}><FinanceMetricCard label="Tax collected" value={formatCurrency(summary?.tax_collected)} accent="info" /></Grid>
          <Grid item xs={12} sm={6} lg={4}><FinanceMetricCard label="Tax paid on expenses" value={formatCurrency(summary?.tax_paid_on_expenses)} accent="success" /></Grid>
          <Grid item xs={12} sm={6} lg={4}><FinanceMetricCard label="Estimated net tax" value={formatCurrency(summary?.estimated_net_tax)} accent="warning" /></Grid>
        </Grid>
        {summary?.payment_total_scope === "not_available_without_invoice_payment_link" ? (
          <Alert severity="info" sx={{ mt: 2 }}>
            Payment collection totals are not available yet for all invoice payment methods.
          </Alert>
        ) : null}
      </Box>

      <Box>
        <Typography variant="h6" fontWeight={900} sx={{ mb: 1.5 }}>
          Operations snapshot
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} lg={3}><FinanceMetricCard label="Active jobs" value={String(overview?.work_orders_active_count ?? 0)} helper="Scheduled or in progress." accent="primary" /></Grid>
          <Grid item xs={12} sm={6} lg={3}><FinanceMetricCard label="Planned labor this month" value={formatCurrency(overview?.planned_labor_cost_this_month || 0)} helper="Work order planning only." accent="secondary" /></Grid>
          <Grid item xs={12} sm={6} lg={3}><FinanceMetricCard label="Inventory value estimate" value={formatCurrency(overview?.inventory_value_estimate || summary?.inventory_value_estimate || 0)} helper="Current stock multiplied by cost per unit." accent="info" /></Grid>
          <Grid item xs={12} sm={6} lg={3}><FinanceMetricCard label="Approved material cost" value={formatCurrency(summary?.approved_material_cost || 0)} helper="Materials made official through manager review." accent="error" /></Grid>
        </Grid>
      </Box>

    </Stack>
  );
}
