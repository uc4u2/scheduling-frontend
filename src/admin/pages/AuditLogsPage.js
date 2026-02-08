import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Divider,
  Paper,
  Stack,
  TextField,
  Typography,
  TablePagination,
} from "@mui/material";
import platformAdminApi from "../../api/platformAdminApi";

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [query, setQuery] = useState("");
  const [createdFrom, setCreatedFrom] = useState("");
  const [createdTo, setCreatedTo] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const load = useCallback(async () => {
    const params = {
      q: query || undefined,
      created_from: createdFrom || undefined,
      created_to: createdTo || undefined,
    };
    const { data } = await platformAdminApi.get("/audit-logs", { params });
    setLogs(data?.logs || []);
    setPage(0);
  }, [createdFrom, createdTo, query]);

  const hasLogs = useMemo(() => logs && logs.length > 0, [logs]);
  const pagedLogs = useMemo(() => {
    if (!hasLogs) return [];
    const start = page * rowsPerPage;
    return logs.slice(start, start + rowsPerPage);
  }, [hasLogs, logs, page, rowsPerPage]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2 }}>Audit Logs</Typography>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <TextField
            fullWidth
            label="Search by action, email, or target"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <TextField
            label="Created from"
            type="date"
            value={createdFrom}
            onChange={(e) => setCreatedFrom(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 180 }}
          />
          <TextField
            label="Created to"
            type="date"
            value={createdTo}
            onChange={(e) => setCreatedTo(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 180 }}
          />
          <Button variant="contained" onClick={load}>Apply</Button>
        </Stack>
      </Paper>
      {pagedLogs.map((l) => (
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
      {hasLogs && (
        <TablePagination
          component="div"
          count={logs.length}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(event) => {
            setRowsPerPage(parseInt(event.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[10, 25, 50, 100]}
        />
      )}
    </Box>
  );
}
