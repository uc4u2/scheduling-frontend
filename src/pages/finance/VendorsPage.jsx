import React, { useEffect, useState } from "react";
import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid,
  Paper,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { useSnackbar } from "notistack";
import { createVendor, deleteVendor, listVendors, updateVendor } from "./financeApi";
import FinanceEmptyState from "./components/FinanceEmptyState";
import FinanceMetricCard from "./components/FinanceMetricCard";
import FinancePagination from "./components/FinancePagination";

const blankVendor = {
  name: "",
  email: "",
  phone: "",
  address: "",
  notes: "",
  is_active: true,
};

function VendorDialog({ open, onClose, initialValues, onSubmit }) {
  const [form, setForm] = useState(blankVendor);

  useEffect(() => {
    if (!open) return;
    setForm({ ...blankVendor, ...initialValues, is_active: initialValues?.is_active !== false });
  }, [open, initialValues]);

  const setField = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{initialValues?.id ? "Edit vendor" : "Add vendor"}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} sx={{ mt: 0.25 }}>
          <TextField fullWidth label="Vendor name" value={form.name} onChange={(e) => setField("name", e.target.value)} />
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}><TextField fullWidth label="Email" value={form.email} onChange={(e) => setField("email", e.target.value)} /></Grid>
            <Grid item xs={12} md={6}><TextField fullWidth label="Phone" value={form.phone} onChange={(e) => setField("phone", e.target.value)} /></Grid>
          </Grid>
          <TextField fullWidth label="Address" multiline minRows={2} value={form.address} onChange={(e) => setField("address", e.target.value)} />
          <TextField fullWidth label="Notes" multiline minRows={3} value={form.notes} onChange={(e) => setField("notes", e.target.value)} />
          <FormControlLabel control={<Switch checked={form.is_active} onChange={(e) => setField("is_active", e.target.checked)} />} label="Active vendor" />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={() => onSubmit(form)}>Save</Button>
      </DialogActions>
    </Dialog>
  );
}

export default function VendorsPage() {
  const { enqueueSnackbar } = useSnackbar();
  const [vendors, setVendors] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await listVendors({ q: search || undefined, page, per_page: perPage });
      const rows = Array.isArray(res?.items) ? res.items : [];
      setVendors(rows);
      setPagination(res?.pagination || null);
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Unable to load vendors.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [page, perPage]);

  const handleSave = async (payload) => {
    try {
      if (selectedVendor?.id) {
        await updateVendor(selectedVendor.id, payload);
        enqueueSnackbar("Vendor updated.", { variant: "success" });
      } else {
        await createVendor(payload);
        enqueueSnackbar("Vendor added.", { variant: "success" });
      }
      setEditorOpen(false);
      setSelectedVendor(null);
      await load();
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.error || err?.message || "Unable to save vendor.", { variant: "error" });
    }
  };

  const handleArchive = async (vendor) => {
    try {
      await deleteVendor(vendor.id);
      enqueueSnackbar("Vendor archived.", { variant: "success" });
      await load();
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.error || err?.message || "Unable to archive vendor.", { variant: "error" });
    }
  };

  return (
    <Stack spacing={2.5}>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={4}><FinanceMetricCard label="Active vendors" value={String(vendors.filter((row) => row.is_active !== false).length)} accent="primary" /></Grid>
        <Grid item xs={12} sm={6} md={4}><FinanceMetricCard label="Inactive vendors" value={String(vendors.filter((row) => row.is_active === false).length)} accent="warning" /></Grid>
      </Grid>

      <Paper variant="outlined" sx={{ p: 2, borderRadius: 1 }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} justifyContent="space-between">
          <TextField
            size="small"
            label="Search vendors"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") load();
            }}
            sx={{ minWidth: { md: 300 } }}
          />
          <Button variant="contained" onClick={() => { setSelectedVendor(null); setEditorOpen(true); }}>Add vendor</Button>
        </Stack>
      </Paper>

      {loading ? (
        <Stack alignItems="center" sx={{ py: 8 }}><CircularProgress /></Stack>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : vendors.length === 0 ? (
        <FinanceEmptyState
          title="No vendors yet"
          description="Add your first vendor."
          actionLabel="Add vendor"
          onAction={() => { setSelectedVendor(null); setEditorOpen(true); }}
        />
      ) : (
        <Paper variant="outlined" sx={{ overflowX: "auto" }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Contact</TableCell>
                <TableCell>Address</TableCell>
                <TableCell>Notes</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {vendors.map((vendor) => (
                <TableRow key={vendor.id} hover>
                  <TableCell><Typography variant="body2" fontWeight={700}>{vendor.name}</Typography></TableCell>
                  <TableCell>
                    <Typography variant="body2">{vendor.email || "-"}</Typography>
                    <Typography variant="body2" color="text.secondary">{vendor.phone || ""}</Typography>
                  </TableCell>
                  <TableCell>{vendor.address || "-"}</TableCell>
                  <TableCell>{vendor.notes || "-"}</TableCell>
                  <TableCell>{vendor.is_active === false ? "Inactive" : "Active"}</TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <Button size="small" onClick={() => { setSelectedVendor(vendor); setEditorOpen(true); }}>Edit</Button>
                      <Button size="small" color="error" onClick={() => handleArchive(vendor)}>Archive</Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}

      <FinancePagination
        pagination={pagination}
        page={page}
        perPage={perPage}
        onPageChange={setPage}
        onPerPageChange={(next) => {
          setPerPage(next);
          setPage(1);
        }}
      />

      <VendorDialog
        open={editorOpen}
        onClose={() => { setEditorOpen(false); setSelectedVendor(null); }}
        initialValues={selectedVendor}
        onSubmit={handleSave}
      />
    </Stack>
  );
}
