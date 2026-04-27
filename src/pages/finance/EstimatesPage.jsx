import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
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
  TextField,
  Typography,
} from "@mui/material";
import { useSnackbar } from "notistack";
import { formatDateTimeInTz } from "../../utils/datetime";
import { getUserTimezone } from "../../utils/timezone";
import EstimateEditorDialog from "./EstimateEditorDialog";
import {
  convertEstimateToInvoice,
  createEstimateTemplate,
  duplicateEstimate,
  listEstimateTemplates,
  listEstimates,
  listManagerClients,
  sendEstimate,
} from "./financeApi";
import FinanceStatusChip from "./components/FinanceStatusChip";
import FinanceEmptyState from "./components/FinanceEmptyState";

const formatMoney = (value, currency = "USD") =>
  new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

export default function EstimatesPage({ createNonce }) {
  const { enqueueSnackbar } = useSnackbar();
  const timezone = useMemo(() => getUserTimezone(), []);
  const [items, setItems] = useState([]);
  const [clients, setClients] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [templateName, setTemplateName] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [estimates, managerClients, templateList] = await Promise.all([
        listEstimates({ status: status || undefined, q: search || undefined, limit: 100 }),
        listManagerClients(),
        listEstimateTemplates(),
      ]);
      setItems(Array.isArray(estimates?.items) ? estimates.items : Array.isArray(estimates) ? estimates : []);
      setClients(managerClients);
      setTemplates(Array.isArray(templateList?.items) ? templateList.items : Array.isArray(templateList) ? templateList : []);
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Unable to load estimates.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [status]);

  useEffect(() => {
    if (createNonce) {
      setEditing(null);
      setDialogOpen(true);
    }
  }, [createNonce]);

  const saveAsTemplate = async () => {
    if (!editing || !templateName) {
      enqueueSnackbar("Open an estimate and enter a template name first.", { variant: "warning" });
      return;
    }
    try {
      await createEstimateTemplate({
        name: templateName,
        default_notes: editing.notes || "",
        default_terms: editing.terms || "",
        line_items_json: Array.isArray(editing.line_items) ? editing.line_items : [],
      });
      enqueueSnackbar("Estimate template saved.", { variant: "success" });
      setTemplateName("");
      await load();
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.error || err?.message || "Unable to save template.", { variant: "error" });
    }
  };

  const handleSend = async (item) => {
    try {
      await sendEstimate(item.id);
      enqueueSnackbar("Estimate marked as sent.", { variant: "success" });
      await load();
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.error || err?.message || "Unable to mark estimate as sent.", { variant: "error" });
    }
  };

  const handleDuplicate = async (item) => {
    try {
      const res = await duplicateEstimate(item.id);
      enqueueSnackbar(`Estimate duplicated${res?.estimate_number ? `: ${res.estimate_number}` : ""}.`, { variant: "success" });
      await load();
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.error || err?.message || "Unable to duplicate estimate.", { variant: "error" });
    }
  };

  const handleConvert = async (item) => {
    try {
      const res = await convertEstimateToInvoice(item.id);
      const invoiceNumber = res?.invoice?.invoice_number || res?.invoice_number || res?.invoice?.number;
      enqueueSnackbar(
        invoiceNumber ? `Estimate converted to invoice ${invoiceNumber}.` : "Estimate converted to invoice.",
        { variant: "success" }
      );
      await load();
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.error || err?.message || "Unable to convert estimate to invoice.", { variant: "error" });
    }
  };

  return (
    <Stack spacing={2}>
      <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} justifyContent="space-between">
        <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
          <TextField
            size="small"
            label="Search estimates"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") load();
            }}
          />
          <FormControl size="small" sx={{ minWidth: 190 }}>
            <InputLabel>Status</InputLabel>
            <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value)}>
              <MenuItem value="">All statuses</MenuItem>
              <MenuItem value="draft">Draft</MenuItem>
              <MenuItem value="sent">Sent</MenuItem>
              <MenuItem value="viewed">Viewed</MenuItem>
              <MenuItem value="approved">Approved</MenuItem>
              <MenuItem value="rejected">Rejected</MenuItem>
              <MenuItem value="converted_to_invoice">Converted to Invoice</MenuItem>
            </Select>
          </FormControl>
          <Button variant="outlined" onClick={load}>Refresh</Button>
        </Stack>
        <Button variant="contained" onClick={() => { setEditing(null); setDialogOpen(true); }}>New Estimate</Button>
      </Stack>

      <Paper variant="outlined" sx={{ p: 2, borderRadius: 1 }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} alignItems={{ md: "center" }}>
          <Typography fontWeight={700}>Optional template shortcut</Typography>
          <TextField size="small" label="Template name" value={templateName} onChange={(e) => setTemplateName(e.target.value)} sx={{ minWidth: 220 }} />
          <Button variant="outlined" onClick={saveAsTemplate}>Save current estimate as template</Button>
        </Stack>
      </Paper>

      {error ? <Alert severity="error">{error}</Alert> : null}

      {loading ? (
        <Stack alignItems="center" sx={{ py: 8 }}><CircularProgress /></Stack>
      ) : items.length === 0 ? (
        <FinanceEmptyState
          title="No estimates yet"
          description="Create a simple estimate, send it, and convert it to an invoice when the work is approved."
          actionLabel="Create estimate"
          onAction={() => { setEditing(null); setDialogOpen(true); }}
        />
      ) : (
        <Paper variant="outlined" sx={{ overflowX: "auto" }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Estimate #</TableCell>
                <TableCell>Title</TableCell>
                <TableCell>Client</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Total</TableCell>
                <TableCell>Issue date</TableCell>
                <TableCell>Sent</TableCell>
                <TableCell>Lines</TableCell>
                <TableCell>Invoice</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id} hover>
                  <TableCell>{item.estimate_number}</TableCell>
                  <TableCell>{item.title}</TableCell>
                  <TableCell>
                    <Typography variant="body2">{item.client_name || "-"}</Typography>
                    <Typography variant="body2" color="text.secondary">{item.client_email || ""}</Typography>
                  </TableCell>
                  <TableCell><FinanceStatusChip status={item.status} /></TableCell>
                  <TableCell>{formatMoney(item.total, item.currency)}</TableCell>
                  <TableCell>{item.issue_date || "-"}</TableCell>
                  <TableCell>{item.sent_at ? formatDateTimeInTz(item.sent_at, timezone) : "-"}</TableCell>
                  <TableCell>{item.line_count ?? 0}</TableCell>
                  <TableCell>{item.converted_invoice_number || "-"}</TableCell>
                  <TableCell align="right">
                    <Stack direction={{ xs: "column", lg: "row" }} spacing={1} justifyContent="flex-end">
                      <Button size="small" onClick={() => { setEditing(item); setDialogOpen(true); }}>Edit</Button>
                      <Button size="small" onClick={() => handleDuplicate(item)}>Duplicate</Button>
                      <Button size="small" onClick={() => handleSend(item)} disabled={item.status === "converted_to_invoice"}>Mark Sent</Button>
                      <Button size="small" variant="contained" onClick={() => handleConvert(item)} disabled={item.status === "converted_to_invoice"}>
                        Convert to Invoice
                      </Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}

      <EstimateEditorDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSaved={async () => {
          enqueueSnackbar(editing ? "Estimate updated." : "Estimate created.", { variant: "success" });
          await load();
        }}
        estimate={editing}
        clients={clients}
        templates={templates}
      />
    </Stack>
  );
}
