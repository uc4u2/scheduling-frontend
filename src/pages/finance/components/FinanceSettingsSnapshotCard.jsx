import React from "react";
import { Alert, Chip, Paper, Stack, Typography } from "@mui/material";

export default function FinanceSettingsSnapshotCard({
  taxContext,
  title = "Finance settings snapshot",
  helper = "These defaults come from Company Profile / Checkout settings and are used across Business Finance.",
}) {
  if (!taxContext) return null;

  const chips = [
    {
      key: "jurisdiction",
      label: `Tax ${taxContext.tax_country_code || "—"} / ${taxContext.tax_region_code || "—"}`,
    },
    {
      key: "currency",
      label: `Currency ${taxContext.display_currency || "USD"}`,
    },
    {
      key: "prices-include-tax",
      label: `Prices include tax ${taxContext.prices_include_tax ? "ON" : "OFF"}`,
    },
  ];

  if (taxContext.default_tax_rate != null) {
    chips.push({
      key: "default-tax-rate",
      label: `Default tax ${Number(taxContext.default_tax_rate).toFixed(2)}%`,
    });
  }

  if (taxContext.charge_currency_mode) {
    chips.push({
      key: "charge-currency-mode",
      label: `Charge mode ${String(taxContext.charge_currency_mode).replaceAll("_", " ")}`,
    });
  }

  return (
    <Paper variant="outlined" sx={{ p: 2, borderRadius: 1.5 }}>
      <Stack spacing={1.25}>
        <Typography variant="subtitle1" fontWeight={800}>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {helper}
        </Typography>
        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
          {chips.map((chip) => (
            <Chip key={chip.key} size="small" variant="outlined" label={chip.label} />
          ))}
        </Stack>
        {taxContext.warning ? <Alert severity="warning">{taxContext.warning}</Alert> : null}
      </Stack>
    </Paper>
  );
}
