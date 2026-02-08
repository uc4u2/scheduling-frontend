import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import platformAdminApi from "../../api/platformAdminApi";
import { formatDateTimeInTz } from "../../utils/datetime";
import { getUserTimezone } from "../../utils/timezone";

const STATUSES = [
  "new",
  "triaged",
  "in_progress",
  "waiting_on_tenant",
  "needs_engineering",
  "solved",
  "closed",
];

const formatDate = (value, tz) => formatDateTimeInTz(value, tz);

export default function AdminTicketsPage() {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filters, setFilters] = useState({
    status: "",
    subject: "",
    company_id: "",
    assigned: "all",
  });
  const timezone = useMemo(() => getUserTimezone(admin?.timezone), [admin?.timezone]);

  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    if (filters.status) params.set("status", filters.status);
    if (filters.subject) params.set("subject", filters.subject);
    if (filters.company_id) params.set("company_id", filters.company_id);
    if (filters.assigned && filters.assigned !== "all") params.set("assigned", filters.assigned);
    const qs = params.toString();
    return qs ? `?${qs}` : "";
  }, [filters]);

  const loadAdmin = async () => {
    try {
      const { data } = await platformAdminApi.get("/auth/me");
      setAdmin(data || null);
    } catch {
      setAdmin(null);
    }
  };

  const loadTickets = async () => {
    try {
      setLoading(true);
      const { data } = await platformAdminApi.get(`/tickets${queryParams}`);
      setTickets(data?.tickets || []);
      setPage(0);
      setError("");
    } catch {
      setError("Unable to load tickets.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdmin();
  }, []);

  useEffect(() => {
    loadTickets();
  }, [queryParams]);

  const pagedTickets = useMemo(() => {
    if (!tickets.length) return [];
    const start = page * rowsPerPage;
    return tickets.slice(start, start + rowsPerPage);
  }, [page, rowsPerPage, tickets]);

  return (
    <Box sx={{ p: 3 }}>
      <Stack spacing={2}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Tickets
        </Typography>

        <Paper sx={{ p: 2 }}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                label="Status"
                value={filters.status}
                onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
              >
                <MenuItem value="">All</MenuItem>
                {STATUSES.map((status) => (
                  <MenuItem key={status} value={status}>
                    {status.replace(/_/g, " ")}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Subject"
              value={filters.subject}
              onChange={(e) => setFilters((prev) => ({ ...prev, subject: e.target.value }))}
            />
            <TextField
              fullWidth
              label="Company ID"
              value={filters.company_id}
              onChange={(e) => setFilters((prev) => ({ ...prev, company_id: e.target.value }))}
            />
            <FormControl fullWidth>
              <InputLabel>Assigned</InputLabel>
              <Select
                label="Assigned"
                value={filters.assigned}
                onChange={(e) => setFilters((prev) => ({ ...prev, assigned: e.target.value }))}
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="me">Me</MenuItem>
                <MenuItem value="unassigned">Unassigned</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </Paper>

        <Paper sx={{ p: 2 }}>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
              <CircularProgress size={28} />
            </Box>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Company</TableCell>
                  <TableCell>Subject</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Assigned</TableCell>
                  <TableCell>Last Activity</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pagedTickets.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell>{ticket.id}</TableCell>
                    <TableCell>{ticket.company_id}</TableCell>
                    <TableCell>
                      {ticket.subject}
                      {ticket.sub_subject ? ` • ${ticket.sub_subject}` : ""}
                    </TableCell>
                    <TableCell>
                      <Chip size="small" label={ticket.status?.replace(/_/g, " ")} />
                    </TableCell>
                    <TableCell>{ticket.assigned_admin_id || "Unassigned"}</TableCell>
                    <TableCell>{formatDate(ticket.last_activity_at, timezone)}</TableCell>
                    <TableCell>
                      <Button size="small" onClick={() => navigate(`/admin/tickets/${ticket.id}`)}>
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {!tickets.length && (
                  <TableRow>
                    <TableCell colSpan={7}>
                      <Typography variant="body2" color="text.secondary">
                        {admin?.role === "platform_support"
                          ? "No coverage assigned or no tickets available."
                          : "No tickets found."}
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
          {error && (
            <Typography variant="body2" color="error" sx={{ mt: 1 }}>
              {error}
            </Typography>
          )}
          {!!tickets.length && (
            <TablePagination
              component="div"
              count={tickets.length}
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
        </Paper>
      </Stack>
    </Box>
  );
}
