import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Grid,
  Link,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { formatCurrency } from "../../utils/formatters";
import FinanceMetricCard from "./components/FinanceMetricCard";
import FinanceEmptyState from "./components/FinanceEmptyState";
import { getFinanceOverview, getFinanceSummary } from "./financeApi";

export default function FinanceOverviewPage({ onNavigate, onQuickAction }) {
  const theme = useTheme();
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
      <Box>
        <Typography variant="h6" fontWeight={800} sx={{ mb: 1.5 }}>
          Today needs your review
        </Typography>
        {actions.length ? (
          <Grid container spacing={2}>
            {actions.map((action, index) => (
              <Grid item xs={12} md={6} lg={3} key={`${action.type || 'action'}-${index}`}>
                <FinanceMetricCard
                  label={action.label || "Action"}
                  value={String(action.count ?? 0)}
                  helper="Open the related tab to handle it."
                  accent="warning"
                  action={
                    action.type === "work_order" ? (
                      <Link component="button" type="button" underline="hover" onClick={() => onNavigate?.("finance-work-orders")}>
                        Open Work Orders
                      </Link>
                    ) : null
                  }
                />
              </Grid>
            ))}
          </Grid>
        ) : (
          <FinanceEmptyState
            title="No finance tasks need attention right now"
            description="Quotes, estimates, invoices, and expenses are all up to date for the moment."
          />
        )}
      </Box>

      <Box>
        <Typography variant="h6" fontWeight={800} sx={{ mb: 1.5 }}>
          Money snapshot
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} lg={4}>
            <FinanceMetricCard label="Estimate total" value={formatCurrency(summary?.estimate_total)} accent="primary" />
          </Grid>
          <Grid item xs={12} sm={6} lg={4}>
            <FinanceMetricCard label="Invoice total" value={formatCurrency(summary?.invoice_total)} accent="secondary" />
          </Grid>
          <Grid item xs={12} sm={6} lg={4}>
            <FinanceMetricCard label="Expense total" value={formatCurrency(summary?.expense_total)} accent="error" />
          </Grid>
          <Grid item xs={12} sm={6} lg={4}>
            <FinanceMetricCard label="Tax collected" value={formatCurrency(summary?.tax_collected)} accent="info" />
          </Grid>
          <Grid item xs={12} sm={6} lg={4}>
            <FinanceMetricCard label="Tax paid on expenses" value={formatCurrency(summary?.tax_paid_on_expenses)} accent="success" />
          </Grid>
          <Grid item xs={12} sm={6} lg={4}>
            <FinanceMetricCard label="Estimated net tax" value={formatCurrency(summary?.estimated_net_tax)} accent="warning" />
          </Grid>
          <Grid item xs={12} sm={6} lg={4}>
            <FinanceMetricCard
              label="Active jobs"
              value={String(overview?.work_orders_active_count ?? 0)}
              helper="Scheduled or in progress."
              accent="primary"
            />
          </Grid>
          <Grid item xs={12} sm={6} lg={4}>
            <FinanceMetricCard
              label="Work orders need scheduling"
              value={String(overview?.work_orders_needing_scheduling_count ?? 0)}
              helper="Draft jobs or jobs with no team assigned yet."
              accent="warning"
              action={
                <Button size="small" onClick={() => onNavigate?.("finance-work-orders")}>
                  Open Work Orders
                </Button>
              }
            />
          </Grid>
          <Grid item xs={12} sm={6} lg={4}>
            <FinanceMetricCard
              label="Planned labor this month"
              value={formatCurrency(overview?.planned_labor_cost_this_month || 0)}
              helper="Work order planning only."
              accent="secondary"
            />
          </Grid>
        </Grid>
        {summary?.payment_total_scope === "not_available_without_invoice_payment_link" ? (
          <Alert severity="info" sx={{ mt: 2 }}>
            Payment collection totals are not available yet for all invoice payment methods.
          </Alert>
        ) : null}
      </Box>

      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 1 }}>
        <Stack spacing={2}>
          <Typography variant="h6" fontWeight={800}>
            Quick actions
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} flexWrap="wrap">
            <Button variant="contained" onClick={() => onQuickAction?.("quote")}>New Quote</Button>
            <Button variant="contained" onClick={() => onQuickAction?.("estimate")}>New Estimate</Button>
            <Button variant="contained" onClick={() => onQuickAction?.("work-order")}>New Work Order</Button>
            <Button variant="contained" onClick={() => onQuickAction?.("expense")}>Add Expense</Button>
            <Button variant="outlined" onClick={() => onNavigate?.("finance-reports")}>Export CSV</Button>
          </Stack>
        </Stack>
      </Paper>

      <Alert severity="warning" sx={{ borderRadius: 1, backgroundColor: theme.palette.background.paper }}>
        Materials & Supplies, inventory deduction, and employee field reports are coming in later phases.
      </Alert>
    </Stack>
  );
}
