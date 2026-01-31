import React, { useEffect, useState } from "react";
import { Box, Paper, Typography } from "@mui/material";
import platformAdminApi from "../../api/platformAdminApi";

export default function SalesLedgerPage() {
  const [entries, setEntries] = useState([]);

  useEffect(() => {
    (async () => {
      const { data } = await platformAdminApi.get("/sales/ledger");
      setEntries(data?.entries || []);
    })();
  }, []);

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2 }}>Sales Ledger</Typography>
      {entries.map((e) => (
        <Paper key={e.id} sx={{ p: 2, mb: 1 }}>
          <Typography variant="subtitle1">{e.type} • {e.amount_cents} {e.currency}</Typography>
          <Typography variant="body2">
            Deal {e.deal_id} • Rep {e.sales_rep_id} • Invoice {e.stripe_invoice_id}
          </Typography>
        </Paper>
      ))}
    </Box>
  );
}
