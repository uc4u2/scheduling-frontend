import React, { useEffect, useState } from "react";
import { Box, Paper, Typography } from "@mui/material";
import platformAdminApi from "../../api/platformAdminApi";

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    (async () => {
      const { data } = await platformAdminApi.get("/audit-logs");
      setLogs(data?.logs || []);
    })();
  }, []);

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2 }}>Audit Logs</Typography>
      {logs.map((l) => (
        <Paper key={l.id} sx={{ p: 2, mb: 1 }}>
          <Typography variant="subtitle1">{l.action}</Typography>
          <Typography variant="body2">
            Target: {l.target_type} #{l.target_id} • {l.created_at}
          </Typography>
        </Paper>
      ))}
    </Box>
  );
}
