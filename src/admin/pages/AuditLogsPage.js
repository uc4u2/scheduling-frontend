import React, { useCallback, useEffect, useState } from "react";
import { Box, Divider, Paper, Stack, Typography } from "@mui/material";
import platformAdminApi from "../../api/platformAdminApi";

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);

  const load = useCallback(async () => {
    const { data } = await platformAdminApi.get("/audit-logs");
    setLogs(data?.logs || []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2 }}>Audit Logs</Typography>
      {logs.map((l) => (
        <Paper key={l.id} sx={{ p: 2, mb: 1 }}>
          <Stack spacing={0.5}>
            <Typography variant="subtitle1">{l.action}</Typography>
            <Typography variant="body2">
              Target: {l.target_type} #{l.target_id} • {l.created_at}
            </Typography>
            {l.ticket_subject ? (
              <Typography variant="body2">
                Ticket: {l.ticket_subject}
              </Typography>
            ) : null}
            {l.company_name ? (
              <Typography variant="body2">
                Company: {l.company_name}
              </Typography>
            ) : null}
            {l.admin_email ? (
              <Typography variant="body2">
                Actor: {l.admin_email}
              </Typography>
            ) : null}
            {l.support_agent_email ? (
              <Typography variant="body2">
                Support agent: {l.support_agent_email}
              </Typography>
            ) : null}
            {l.manager_email ? (
              <Typography variant="body2">
                Manager: {l.manager_email}
              </Typography>
            ) : null}
            {(l.support_session_scope || l.support_session_mode) ? (
              <Typography variant="body2">
                Support session: {l.support_session_scope || "—"}{l.support_session_mode ? ` • ${l.support_session_mode}` : ""}
              </Typography>
            ) : null}
            {l.payload && Object.keys(l.payload).length ? (
              <>
                <Divider sx={{ my: 0.5 }} />
                <Typography variant="caption" color="text.secondary">
                  {JSON.stringify(l.payload)}
                </Typography>
              </>
            ) : null}
          </Stack>
        </Paper>
      ))}
    </Box>
  );
}
