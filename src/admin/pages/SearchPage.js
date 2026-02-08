import React, { useMemo, useState } from "react";
import {
  Box,
  Button,
  Stack,
  TextField,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TablePagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import platformAdminApi from "../../api/platformAdminApi";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [createdFrom, setCreatedFrom] = useState("");
  const [createdTo, setCreatedTo] = useState("");
  const [plan, setPlan] = useState("");
  const [status, setStatus] = useState("");
  const [hasDomain, setHasDomain] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const navigate = useNavigate();

  const search = async () => {
    const { data } = await platformAdminApi.get(`/search?q=${encodeURIComponent(query)}`);
    setResults(data?.tenants || []);
  };

  const fetchTenants = async () => {
    const params = {
      q: query || undefined,
      created_from: createdFrom || undefined,
      created_to: createdTo || undefined,
      plan: plan || undefined,
      status: status || undefined,
      has_domain: hasDomain || undefined,
    };
    const { data } = await platformAdminApi.get("/tenants", { params });
    setResults(data?.tenants || []);
    setPage(0);
  };

  const hasResults = useMemo(() => results && results.length > 0, [results]);
  const pagedResults = useMemo(() => {
    if (!hasResults) return [];
    const start = page * rowsPerPage;
    return results.slice(start, start + rowsPerPage);
  }, [hasResults, page, rowsPerPage, results]);

  const exportCsv = () => {
    if (!hasResults) return;
    const headers = [
      "Company",
      "Email",
      "Slug",
      "Domain",
      "Plan",
      "Status",
      "Created",
      "Staff",
      "Managers",
      "Bookings_30d",
      "Last_Booking",
    ];
    const rows = results.map((tenant) => [
      tenant.name || "",
      tenant.email || "",
      tenant.slug || "",
      tenant.custom_domain || "",
      tenant.plan || "starter",
      tenant.status || "inactive",
      tenant.created_at ? tenant.created_at.slice(0, 10) : "",
      tenant.staff_count ?? 0,
      tenant.manager_count ?? 0,
      tenant.bookings_last_30 ?? 0,
      tenant.last_booking_at ? tenant.last_booking_at.slice(0, 10) : "",
    ]);
    const escapeCell = (value) => {
      const str = String(value ?? "");
      if (/[",\n]/.test(str)) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };
    const csv = [headers, ...rows]
      .map((row) => row.map(escapeCell).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `tenants_export_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2 }}>Tenant Search</Typography>
      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        <TextField
          fullWidth
          label="Search by name, slug, or email"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Button variant="contained" onClick={search}>Search</Button>
        <Button variant="outlined" onClick={fetchTenants}>Search + Filters</Button>
      </Stack>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle1" sx={{ mb: 2 }}>Tenant Insights</Typography>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mb: 2 }}>
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
          <FormControl sx={{ minWidth: 160 }}>
            <InputLabel>Plan</InputLabel>
            <Select value={plan} label="Plan" onChange={(e) => setPlan(e.target.value)}>
              <MenuItem value="">Any</MenuItem>
              <MenuItem value="starter">Starter</MenuItem>
              <MenuItem value="pro">Pro</MenuItem>
              <MenuItem value="business">Business</MenuItem>
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: 160 }}>
            <InputLabel>Status</InputLabel>
            <Select value={status} label="Status" onChange={(e) => setStatus(e.target.value)}>
              <MenuItem value="">Any</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="trialing">Trialing</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
              <MenuItem value="canceled">Canceled</MenuItem>
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: 180 }}>
            <InputLabel>Custom domain</InputLabel>
            <Select value={hasDomain} label="Custom domain" onChange={(e) => setHasDomain(e.target.value)}>
              <MenuItem value="">Any</MenuItem>
              <MenuItem value="true">Connected</MenuItem>
              <MenuItem value="false">Not connected</MenuItem>
            </Select>
          </FormControl>
          <Button variant="contained" onClick={fetchTenants}>Apply filters</Button>
          <Button variant="outlined" onClick={exportCsv} disabled={!hasResults}>
            Export CSV
          </Button>
        </Stack>
        {!hasResults && (
          <Typography variant="body2" color="text.secondary">
            No tenants found yet. Try adjusting filters.
          </Typography>
        )}
        {hasResults && (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Company</TableCell>
                <TableCell>ID</TableCell>
                <TableCell>Slug</TableCell>
                <TableCell>Domain</TableCell>
                <TableCell>Plan</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created</TableCell>
                <TableCell align="right">Staff</TableCell>
                <TableCell align="right">Managers</TableCell>
                <TableCell align="right">Bookings (30d)</TableCell>
                <TableCell>Last booking</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {pagedResults.map((tenant) => (
                <TableRow key={tenant.id} hover>
                  <TableCell>
                    <Typography variant="subtitle2">{tenant.name}</Typography>
                    <Typography variant="caption" color="text.secondary">{tenant.email}</Typography>
                  </TableCell>
                  <TableCell>{tenant.id}</TableCell>
                  <TableCell>{tenant.slug}</TableCell>
                  <TableCell>{tenant.custom_domain || "—"}</TableCell>
                  <TableCell>{tenant.plan || "starter"}</TableCell>
                  <TableCell>{tenant.status || "inactive"}</TableCell>
                  <TableCell>{tenant.created_at ? tenant.created_at.slice(0, 10) : "—"}</TableCell>
                  <TableCell align="right">{tenant.staff_count ?? 0}</TableCell>
                  <TableCell align="right">{tenant.manager_count ?? 0}</TableCell>
                  <TableCell align="right">{tenant.bookings_last_30 ?? 0}</TableCell>
                  <TableCell>{tenant.last_booking_at ? tenant.last_booking_at.slice(0, 10) : "—"}</TableCell>
                  <TableCell>
                    <Button variant="outlined" size="small" onClick={() => navigate(`/admin/tenants/${tenant.id}`)}>
                      Open
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        {hasResults && (
          <TablePagination
            component="div"
            count={results.length}
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
    </Box>
  );
}
