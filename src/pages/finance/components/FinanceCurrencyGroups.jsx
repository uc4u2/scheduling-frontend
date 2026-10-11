import React from "react";
import { Alert, Grid, Stack, Typography } from "@mui/material";
import FinanceMetricCard from "./FinanceMetricCard";

const formatMoney = (value, currency) =>
  new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currency || "USD",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

export default function FinanceCurrencyGroups({
  groups = [],
  metrics = [],
  emptyMessage = "No finance activity for this period.",
  showReconciliationWarning = true,
}) {
  if (!groups.length) return <Alert severity="info">{emptyMessage}</Alert>;

  return (
    <Stack spacing={2.5}>
      {groups.map((group) => (
        <Stack key={group.currency} spacing={1.25}>
          <Typography variant="subtitle2" fontWeight={800}>
            {group.currency}
          </Typography>
          <Grid container spacing={2}>
            {metrics.map((metric) => {
              const value = group?.[metric.key];
              const unavailable = value === null || value === undefined;
              return (
                <Grid item xs={12} sm={6} lg={metric.lg || 4} key={metric.key}>
                  <FinanceMetricCard
                    label={metric.label}
                    value={unavailable ? "Not available" : formatMoney(value, group.currency)}
                    helper={metric.helper}
                    accent={metric.accent}
                  />
                </Grid>
              );
            })}
          </Grid>
          {showReconciliationWarning && group.net_collected_amount_complete === false ? (
            <Alert severity="warning">
              Some legacy paid invoices do not contain enough payment linkage or payment-date evidence for a complete net-collected total. They are shown separately for reconciliation and are not silently counted as cash.
            </Alert>
          ) : null}
        </Stack>
      ))}
    </Stack>
  );
}
