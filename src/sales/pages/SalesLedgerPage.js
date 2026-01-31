import React, { useCallback, useEffect, useState } from "react";
import { Box, Paper, Typography } from "@mui/material";
import salesRepApi from "../../api/salesRepApi";

export default function SalesLedgerPage() {
  const [entries, setEntries] = useState([]);

  const load = useCallback(async () => {
    const { data } = await salesRepApi.get("/ledger");
    setEntries(data?.entries || []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2 }}>Ledger</Typography>
      {entries.map((e) => (
        <Paper key={e.id} sx={{ p: 2, mb: 1 }}>
          <Typography variant="subtitle1">
            {e.type} • {(e.amount_cents / 100).toFixed(2)} {e.currency?.toUpperCase()}
          </Typography>
          <Typography variant="body2">
            Deal {e.deal_id} • Invoice {e.stripe_invoice_id}
          </Typography>
        </Paper>
      ))}
    </Box>
  );
}
