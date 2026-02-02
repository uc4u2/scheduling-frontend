import React, { useCallback, useEffect, useState } from "react";
import { Box, Paper, Stack, Typography, Tooltip } from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import salesRepApi from "../../api/salesRepApi";

export default function SalesSummaryPage() {
  const [summary, setSummary] = useState(null);

  const load = useCallback(async () => {
    const { data } = await salesRepApi.get("/summary");
    setSummary(data || null);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (!summary) return null;

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2 }}>Summary</Typography>
      <Stack direction="row" spacing={2}>
        <Paper sx={{ p: 2, minWidth: 160 }}>
          <Typography variant="subtitle2">Invited</Typography>
          <Typography variant="h6">{summary.invited}</Typography>
        </Paper>
        <Paper sx={{ p: 2, minWidth: 160 }}>
          <Typography variant="subtitle2">Activated</Typography>
          <Typography variant="h6">{summary.activated}</Typography>
        </Paper>
        <Paper sx={{ p: 2, minWidth: 160 }}>
          <Typography variant="subtitle2">Paying</Typography>
          <Typography variant="h6">{summary.paying}</Typography>
        </Paper>
        <Paper sx={{ p: 2, minWidth: 200 }}>
          <Stack direction="row" spacing={0.5} alignItems="center">
            <Typography variant="subtitle2">Estimated MRR</Typography>
            <Tooltip title="Estimated based on selected plan. Actual revenue is determined by Stripe invoices and may differ due to discounts, coupons, or proration.">
              <InfoOutlinedIcon fontSize="small" sx={{ color: "text.secondary" }} />
            </Tooltip>
          </Stack>
          <Typography variant="h6">${(summary.mrr_cents / 100).toFixed(2)}</Typography>
        </Paper>
        <Paper sx={{ p: 2, minWidth: 200 }}>
          <Typography variant="subtitle2">Total commission</Typography>
          <Typography variant="h6">${(summary.total_commission_cents / 100).toFixed(2)}</Typography>
        </Paper>
      </Stack>
    </Box>
  );
}
