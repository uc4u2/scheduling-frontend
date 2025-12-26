// src/AnalyticsDashboard.js
import React, { useState, useEffect, useCallback } from "react";
import {
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Alert,
  Button,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  FormControlLabel,
  Checkbox,
  Box,
  Stack,
} from "@mui/material";
import api from "./utils/api";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { CSVLink } from "react-csv";
import dayjs from "dayjs";
import { xeroIntegration, quickbooksIntegration } from "./utils/api";

const AnalyticsDashboard = ({ token }) => {
  const [analytics, setAnalytics] = useState(null);
  const [funnelData, setFunnelData] = useState([]);
  const [error, setError] = useState("");
  const [revStart, setRevStart] = useState(dayjs().startOf("month").format("YYYY-MM-DD"));
  const [revEnd, setRevEnd] = useState(dayjs().endOf("month").format("YYYY-MM-DD"));
  const [revLoading, setRevLoading] = useState(false);
  const [revStatus, setRevStatus] = useState({ message: "", severity: "info" });
  const [xeroStatus, setXeroStatus] = useState(null);
  const [quickbooksStatus, setQuickbooksStatus] = useState(null);
  const [qbRevLoading, setQbRevLoading] = useState(false);
  const [qbRevStatus, setQbRevStatus] = useState({ message: "", severity: "info" });
  const [qbRevDryRun, setQbRevDryRun] = useState(false);
  const [qbRevPreview, setQbRevPreview] = useState(null);
  const [qbDocType, setQbDocType] = useState("salesreceipt");
  const [qbInvoiceStart, setQbInvoiceStart] = useState(dayjs().startOf("month").format("YYYY-MM-DD"));
  const [qbInvoiceEnd, setQbInvoiceEnd] = useState(dayjs().endOf("month").format("YYYY-MM-DD"));
  const [qbInvoiceLoading, setQbInvoiceLoading] = useState(false);
  const [qbInvoiceStatus, setQbInvoiceStatus] = useState({ message: "", severity: "info" });
  const [qbInvoiceResults, setQbInvoiceResults] = useState([]);
  const [qbInvoiceDryRun, setQbInvoiceDryRun] = useState(false);
  const [qbInvoiceLastDryRun, setQbInvoiceLastDryRun] = useState(false);
  const qbCanExport = quickbooksStatus?.permissions?.can_export_accounting !== false;

  const fetchAnalytics = useCallback(async () => {
    try {
      const response = await api.get("/analytics");
      setAnalytics(response.data);
    } catch (err) {
      setError("Failed to fetch analytics");
    }
  }, []);

  const fetchFunnel = useCallback(async () => {
    try {
      const res = await api.get("/manager/funnel");
      const transformed = Object.entries(res.data.funnel).map(([stage, count]) => ({
        stage,
        candidates: count,
      }));
      setFunnelData(transformed);
    } catch (err) {
      setError("Failed to fetch funnel data");
    }
  }, []);

  useEffect(() => {
    if (token) {
      fetchAnalytics();
      fetchFunnel();
      xeroIntegration
        .status()
        .then((data) => setXeroStatus(data))
        .catch(() => setXeroStatus(null));
      quickbooksIntegration
        .status()
        .then((data) => setQuickbooksStatus(data))
        .catch(() => setQuickbooksStatus(null));
    }
  }, [token, fetchAnalytics, fetchFunnel]);

  const handleExportRevenue = async () => {
    if (!revStart || !revEnd) return;
    setRevLoading(true);
    setRevStatus({ message: "", severity: "info" });
    try {
      await xeroIntegration.exportRevenue({ start_date: revStart, end_date: revEnd });
      setRevStatus({ message: "Revenue summary sent to Xero", severity: "success" });
    } catch (err) {
      setRevStatus({
        message:
          err?.displayMessage || err?.response?.data?.error || "Failed to export revenue",
        severity: "error",
      });
    } finally {
      setRevLoading(false);
    }
  };

  const handleExportRevenueQuickBooks = async () => {
    if (!revStart || !revEnd) return;
    setQbRevLoading(true);
    setQbRevStatus({ message: "", severity: "info" });
    setQbRevPreview(null);
    try {
      const res = await quickbooksIntegration.exportRevenue({
        start_date: revStart,
        end_date: revEnd,
        dry_run: qbRevDryRun,
      });
      if (res?.dry_run) {
        setQbRevPreview(res.summary || null);
        setQbRevStatus({
          message: "Preview only: totals calculated, but nothing was posted to QuickBooks.",
          severity: "info",
        });
      } else {
        setQbRevStatus({ message: "Revenue summary sent to QuickBooks", severity: "success" });
      }
    } catch (err) {
      setQbRevStatus({
        message:
          err?.displayMessage || err?.response?.data?.error || "Failed to export revenue",
        severity: "error",
      });
      setQbRevPreview(null);
    } finally {
      setQbRevLoading(false);
    }
  };

  const handleExportInvoices = async () => {
    if (!qbInvoiceStart || !qbInvoiceEnd) return;
    setQbInvoiceLoading(true);
    setQbInvoiceStatus({ message: "", severity: "info" });
    try {
      const res = await quickbooksIntegration.exportInvoices({
        doc_type: qbDocType,
        start_date: qbInvoiceStart,
        end_date: qbInvoiceEnd,
        dry_run: qbInvoiceDryRun,
      });
      const dryRun = Boolean(res?.dry_run);
      setQbInvoiceLastDryRun(dryRun);
      const rows = res?.results || [];
      setQbInvoiceResults(rows);
      if (dryRun) {
        const eligible = rows.length;
        setQbInvoiceStatus({
          message:
            eligible > 0
              ? `Preview only: ${eligible} ${qbDocType === "invoice" ? "invoices" : "sales receipts"} ready to sync.`
              : "Preview finished — nothing eligible for this range.",
          severity: eligible > 0 ? "info" : "warning",
        });
      } else {
        const exportedCount = rows.filter((row) => !row.skipped).length;
        setQbInvoiceStatus({
          message:
            exportedCount > 0
              ? `Exported ${exportedCount} ${qbDocType === "invoice" ? "invoices" : "sales receipts"}`
              : "No transactions to export",
          severity: exportedCount > 0 ? "success" : "info",
        });
      }
    } catch (err) {
      setQbInvoiceStatus({
        message:
          err?.displayMessage ||
          err?.response?.data?.error ||
          "Failed to export QuickBooks documents",
        severity: "error",
      });
      setQbInvoiceResults([]);
      setQbInvoiceLastDryRun(false);
    } finally {
      setQbInvoiceLoading(false);
    }
  };

  const csvHeaders = [
    { label: "Stage", key: "stage" },
    { label: "Candidates", key: "candidates" },
  ];

  return (
    <Container sx={{ mt: 5 }}>
      <Typography variant="h4" gutterBottom>
        Analytics Dashboard
      </Typography>
      {error && <Alert severity="error">{error}</Alert>}

      {analytics && (
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6">Total Bookings</Typography>
                <Typography variant="h4">{analytics.total_bookings}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6">Upcoming Bookings</Typography>
                <Typography variant="h4">{analytics.upcoming_bookings}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Candidate Funnel Chart */}
      {funnelData.length > 0 && (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Candidate Funnel Visualization
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={funnelData} layout="vertical" margin={{ top: 20, right: 20, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" allowDecimals={false} />
                <YAxis type="category" dataKey="stage" />
                <Tooltip />
                <Legend />
                <Bar dataKey="candidates" fill="#1976d2" name="Candidates" />
              </BarChart>
            </ResponsiveContainer>
            <Button variant="outlined" sx={{ mt: 2 }}>
              <CSVLink data={funnelData} headers={csvHeaders} filename="funnel-report.csv" style={{ textDecoration: 'none', color: 'inherit' }}>
                Export Funnel CSV
              </CSVLink>
            </Button>
          </CardContent>
        </Card>
      )}

      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Export Revenue to Xero
          </Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                type="date"
                label="Start date"
                value={revStart}
                onChange={(e) => setRevStart(e.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                type="date"
                label="End date"
                value={revEnd}
                onChange={(e) => setRevEnd(e.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Button
                variant="contained"
                disabled={!xeroStatus?.connected || revLoading}
                onClick={handleExportRevenue}
              >
                {revLoading ? "Exporting…" : "Send to Xero"}
              </Button>
            </Grid>
          </Grid>
          {!xeroStatus?.connected && (
            <Alert severity="info" sx={{ mt: 2 }}>
              Connect Xero from Settings → Xero to enable revenue exports.
            </Alert>
          )}
          {revStatus.message && (
            <Alert severity={revStatus.severity} sx={{ mt: 2 }}>
              {revStatus.message}
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Export Revenue to QuickBooks
          </Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                type="date"
                label="Start date"
                value={revStart}
                onChange={(e) => setRevStart(e.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                type="date"
                label="End date"
                value={revEnd}
                onChange={(e) => setRevEnd(e.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Button
                variant="contained"
                disabled={!quickbooksStatus?.connected || qbRevLoading || !qbCanExport}
                onClick={handleExportRevenueQuickBooks}
              >
                {qbRevLoading ? "Exporting…" : "Send to QuickBooks"}
              </Button>
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={qbRevDryRun}
                    onChange={(e) => setQbRevDryRun(e.target.checked)}
                  />
                }
                label="Preview only (dry run — do not post to QuickBooks)"
              />
            </Grid>
          </Grid>
          {!quickbooksStatus?.connected && (
            <Alert severity="info" sx={{ mt: 2 }}>
              Connect QuickBooks from Settings → QuickBooks to enable revenue exports.
            </Alert>
          )}
          {quickbooksStatus?.connected && !qbCanExport && (
            <Alert severity="info" sx={{ mt: 2 }}>
              You need export permission to send data to QuickBooks. Ask your finance admin to grant access.
            </Alert>
          )}
          {qbRevStatus.message && (
            <Alert severity={qbRevStatus.severity} sx={{ mt: 2 }}>
              {qbRevStatus.message}
            </Alert>
          )}
          {qbRevPreview && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2">Dry-run totals</Typography>
              <Grid container spacing={2} sx={{ mt: 0.5 }}>
                {Object.entries(qbRevPreview).map(([label, value]) => (
                  <Grid item xs={12} sm={6} md={3} key={label}>
                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: 1,
                        bgcolor: "grey.50",
                        border: (theme) => `1px solid ${theme.palette.divider}`,
                      }}
                    >
                      <Typography variant="caption" color="text.secondary">
                        {label.replace(/_/g, " ")}
                      </Typography>
                      <Typography variant="body1">
                        ${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
        </CardContent>
      </Card>

      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Export Invoices / Sales Receipts to QuickBooks
          </Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel id="qb-doc-select">Document type</InputLabel>
                <Select
                  labelId="qb-doc-select"
                  value={qbDocType}
                  label="Document type"
                  onChange={(e) => setQbDocType(e.target.value)}
                >
                  <MenuItem value="salesreceipt">Sales receipt</MenuItem>
                  <MenuItem value="invoice">Invoice</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                type="date"
                label="Start date"
                value={qbInvoiceStart}
                onChange={(e) => setQbInvoiceStart(e.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                type="date"
                label="End date"
                value={qbInvoiceEnd}
                onChange={(e) => setQbInvoiceEnd(e.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <Button
                variant="contained"
                disabled={!quickbooksStatus?.connected || qbInvoiceLoading || !qbCanExport}
                onClick={handleExportInvoices}
              >
                {qbInvoiceLoading ? "Exporting…" : "Send to QuickBooks"}
              </Button>
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={qbInvoiceDryRun}
                    onChange={(e) => setQbInvoiceDryRun(e.target.checked)}
                  />
                }
                label="Preview only (dry run — do not post to QuickBooks)"
              />
            </Grid>
          </Grid>
          {!quickbooksStatus?.connected && (
            <Alert severity="info" sx={{ mt: 2 }}>
              Connect QuickBooks from Settings → QuickBooks to export documents.
            </Alert>
          )}
          {quickbooksStatus?.connected && !qbCanExport && (
            <Alert severity="info" sx={{ mt: 2 }}>
              You need export permission to send documents to QuickBooks. Ask your finance admin to grant access.
            </Alert>
          )}
          {qbInvoiceStatus.message && (
            <Alert severity={qbInvoiceStatus.severity} sx={{ mt: 2 }}>
              {qbInvoiceStatus.message}
            </Alert>
          )}
          {qbInvoiceResults.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2">
                {qbInvoiceLastDryRun ? "Dry-run preview" : "Most recent export"}
              </Typography>
              <Stack spacing={1} sx={{ mt: 1 }}>
                {qbInvoiceResults.map((row) => (
                  <Box
                    key={`${row.transaction_id}-${row.doc_id || "skip"}`}
                    sx={{
                      p: 1.25,
                      borderRadius: 1,
                      bgcolor: "grey.50",
                      border: (theme) => `1px solid ${theme.palette.divider}`,
                    }}
                  >
                    <Typography variant="body2">
                      #{row.transaction_id} →{" "}
                      {qbInvoiceLastDryRun
                        ? row.preview
                          ? "would create new document"
                          : "already synced"
                        : row.skipped
                          ? "already synced"
                          : row.doc_id
                            ? `QBO ID ${row.doc_id}`
                            : "synced"}
                    </Typography>
                    {qbInvoiceLastDryRun && row.preview && (
                      <Box
                        component="pre"
                        sx={{
                          mt: 1,
                          p: 1,
                          borderRadius: 1,
                          bgcolor: "background.paper",
                          maxHeight: 220,
                          overflow: "auto",
                        }}
                      >
                        {JSON.stringify(row.preview, null, 2)}
                      </Box>
                    )}
                  </Box>
                ))}
              </Stack>
            </Box>
          )}
        </CardContent>
      </Card>
    </Container>
  );
};

export default AnalyticsDashboard;
