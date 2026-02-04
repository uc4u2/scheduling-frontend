import React, { useCallback, useEffect, useState } from "react";
import { Box, Button, Chip, Paper, Stack, Typography } from "@mui/material";
import platformAdminApi from "../../api/platformAdminApi";

export default function SalesLedgerPage() {
  const [entries, setEntries] = useState([]);

  const load = useCallback(async () => {
    const { data } = await platformAdminApi.get("/sales/ledger");
    setEntries(data?.entries || []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <Box>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h5">Sales Ledger</Typography>
        <Button size="small" variant="text" onClick={() => window.dispatchEvent(new Event("admin:help"))}>
          Help
        </Button>
      </Stack>
      {entries.map((e) => (
        <Paper key={e.id} sx={{ p: 2, mb: 1 }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
            <Typography variant="subtitle1">{e.type} • {e.amount_cents} {e.currency}</Typography>
            {e.type === "adjustment" && <Chip size="small" label="Adjustment" color="warning" />}
            {e.status === "held_dispute" && <Chip size="small" label="Held dispute" color="warning" variant="outlined" />}
          </Stack>
          <Typography variant="body2">
            Deal {e.deal_id} • Rep {e.sales_rep_id} • Invoice {e.stripe_invoice_id}
          </Typography>
        </Paper>
      ))}
    </Box>
  );
}
