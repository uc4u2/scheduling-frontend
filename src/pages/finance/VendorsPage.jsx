import React, { useCallback, useEffect, useState } from "react";
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
import { useTranslation } from "react-i18next";
import { useSnackbar } from "notistack";
import {
  commitFinanceVendorImport,
  createVendor,
  deleteVendor,
  downloadFinanceVendorImportTemplate,
  listFinanceImportHistory,
  listVendors,
  previewFinanceVendorImport,
  updateVendor,
} from "./financeApi";
import FinanceImportDialog from "./FinanceImportDialog";
import FinanceEmptyState from "./components/FinanceEmptyState";
import FinanceMetricCard from "./components/FinanceMetricCard";
import FinancePagination from "./components/FinancePagination";

function downloadBlobFromResponse(response, fallbackName) {
  const blob = response?.data;
  if (!(blob instanceof Blob)) return;
  const header = response?.headers?.["content-disposition"] || "";
  const match = /filename=\"?([^\";]+)\"?/i.exec(header);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = match?.[1] || fallbackName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

const blankVendor = {
  name: "",
  email: "",
  phone: "",
  address: "",
  notes: "",
  is_active: true,
};

function VendorDialog({ open, onClose, initialValues, onSubmit }) {
  const { t } = useTranslation();
  const tVendors = useCallback(
    (key, fallback, options = {}) => t(`manager.finance.vendors.${key}`, { defaultValue: fallback, ...options }),
    [t]
  );
  const [form, setForm] = useState(blankVendor);

  useEffect(() => {
    if (!open) return;
    setForm({ ...blankVendor, ...initialValues, is_active: initialValues?.is_active !== false });
  }, [open, initialValues]);

  const setField = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{initialValues?.id ? tVendors("dialog.editTitle", "Edit vendor") : tVendors("dialog.addTitle", "Add vendor")}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} sx={{ mt: 0.25 }}>
          <TextField fullWidth label={tVendors("fields.vendorName", "Vendor name")} value={form.name} onChange={(e) => setField("name", e.target.value)} />
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}><TextField fullWidth label={tVendors("fields.email", "Email")} value={form.email} onChange={(e) => setField("email", e.target.value)} /></Grid>
            <Grid item xs={12} md={6}><TextField fullWidth label={tVendors("fields.phone", "Phone")} value={form.phone} onChange={(e) => setField("phone", e.target.value)} /></Grid>
          </Grid>
          <TextField fullWidth label={tVendors("fields.address", "Address")} multiline minRows={2} value={form.address} onChange={(e) => setField("address", e.target.value)} />
          <TextField fullWidth label={tVendors("fields.notes", "Notes")} multiline minRows={3} value={form.notes} onChange={(e) => setField("notes", e.target.value)} />
          <FormControlLabel control={<Switch checked={form.is_active} onChange={(e) => setField("is_active", e.target.checked)} />} label={tVendors("fields.activeVendor", "Active vendor")} />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{tVendors("common.cancel", "Cancel")}</Button>
        <Button variant="contained" onClick={() => onSubmit(form)}>{tVendors("common.save", "Save")}</Button>
      </DialogActions>
    </Dialog>
  );
}

export default function VendorsPage() {
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  const tVendors = useCallback(
    (key, fallback, options = {}) => t(`manager.finance.vendors.${key}`, { defaultValue: fallback, ...options }),
    [t]
  );
  const [vendors, setVendors] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [importOpen, setImportOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await listVendors({ q: search || undefined, page, per_page: perPage });
      const rows = Array.isArray(res?.items) ? res.items : [];
      setVendors(rows);
      setPagination(res?.pagination || null);
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || tVendors("errors.loadFailed", "Unable to load vendors."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // Search stays manual via Enter.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, perPage]);

  const handleDownloadTemplate = async () => {
    try {
      const response = await downloadFinanceVendorImportTemplate();
      downloadBlobFromResponse(response, "schedulaa-finance-vendors-template.csv");
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.error || err?.message || tVendors("errors.templateFailed", "Unable to download template."), { variant: "error" });
    }
  };

  const handleSave = async (payload) => {
    try {
      if (selectedVendor?.id) {
        await updateVendor(selectedVendor.id, payload);
        enqueueSnackbar(tVendors("snackbar.updated", "Vendor updated."), { variant: "success" });
      } else {
        await createVendor(payload);
        enqueueSnackbar(tVendors("snackbar.added", "Vendor added."), { variant: "success" });
      }
      setEditorOpen(false);
      setSelectedVendor(null);
      await load();
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.error || err?.message || tVendors("errors.saveFailed", "Unable to save vendor."), { variant: "error" });
    }
  };

  const handleArchive = async (vendor) => {
    try {
      await deleteVendor(vendor.id);
      enqueueSnackbar(tVendors("snackbar.archived", "Vendor archived."), { variant: "success" });
      await load();
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.error || err?.message || tVendors("errors.archiveFailed", "Unable to archive vendor."), { variant: "error" });
    }
  };

  return (
    <Stack spacing={2.5}>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={4}><FinanceMetricCard label={tVendors("metrics.activeVendors", "Active vendors")} value={String(vendors.filter((row) => row.is_active !== false).length)} accent="primary" /></Grid>
        <Grid item xs={12} sm={6} md={4}><FinanceMetricCard label={tVendors("metrics.inactiveVendors", "Inactive vendors")} value={String(vendors.filter((row) => row.is_active === false).length)} accent="warning" /></Grid>
      </Grid>

      <Paper variant="outlined" sx={{ p: 2, borderRadius: 1 }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} justifyContent="space-between">
          <TextField
            size="small"
            label={tVendors("toolbar.searchVendors", "Search vendors")}
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
          <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
            <Button variant="text" onClick={handleDownloadTemplate}>Download template</Button>
            <Button variant="outlined" onClick={() => setImportOpen(true)}>Import vendors</Button>
            <Button variant="contained" onClick={() => { setSelectedVendor(null); setEditorOpen(true); }}>{tVendors("toolbar.addVendor", "Add vendor")}</Button>
          </Stack>
        </Stack>
      </Paper>

      {loading ? (
        <Stack alignItems="center" sx={{ py: 8 }}><CircularProgress /></Stack>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : vendors.length === 0 ? (
        <FinanceEmptyState
          title={tVendors("empty.title", "No vendors yet")}
          description={tVendors("empty.description", "Add your first vendor.")}
          actionLabel={tVendors("empty.action", "Add vendor")}
          onAction={() => { setSelectedVendor(null); setEditorOpen(true); }}
        />
      ) : (
        <Paper variant="outlined" sx={{ overflowX: "auto" }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>{tVendors("table.headers.name", "Name")}</TableCell>
                <TableCell>{tVendors("table.headers.contact", "Contact")}</TableCell>
                <TableCell>{tVendors("table.headers.address", "Address")}</TableCell>
                <TableCell>{tVendors("table.headers.notes", "Notes")}</TableCell>
                <TableCell>{tVendors("table.headers.status", "Status")}</TableCell>
                <TableCell align="right">{tVendors("table.headers.actions", "Actions")}</TableCell>
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
                  <TableCell>{vendor.is_active === false ? tVendors("table.inactive", "Inactive") : tVendors("table.active", "Active")}</TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <Button size="small" onClick={() => { setSelectedVendor(vendor); setEditorOpen(true); }}>{tVendors("table.edit", "Edit")}</Button>
                      <Button size="small" color="error" onClick={() => handleArchive(vendor)}>{tVendors("table.archive", "Archive")}</Button>
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

      <FinanceImportDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        title="Import vendors"
        importType="vendors"
        entityLabel="vendors"
        entitySingular="vendor"
        entityPlural="vendors"
        templateFileName="schedulaa-finance-vendors-template.csv"
        csvStructure={`vendor_name,email,phone,address,notes,is_active\nABC Supplies,orders@abcsupplies.com,+14165550125,123 Main St Toronto,Cleaning supplies,true\nNorth Paint Co,hello@northpaint.ca,+14165550126,55 Queen St Toronto,Paint vendor,true`}
        downloadTemplate={downloadFinanceVendorImportTemplate}
        previewImport={previewFinanceVendorImport}
        commitImport={commitFinanceVendorImport}
        listHistory={listFinanceImportHistory}
        onImported={async () => {
          await load();
          setImportOpen(false);
        }}
      />
    </Stack>
  );
}
