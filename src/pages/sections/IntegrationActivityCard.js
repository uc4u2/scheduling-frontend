import React, { useEffect, useState, useCallback } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
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
import { integrationActivity } from "../../utils/api";
import { useTranslation } from "react-i18next";
import { getUserTimezone } from "../../utils/timezone";
import { formatDateTimeInTz } from "../../utils/datetime";

const providerOptions = [
  { value: "quickbooks", label: "QuickBooks" },
  { value: "xero", label: "Xero" },
];

const objectTypeOptions = [
  { value: "payroll", label: "Payroll" },
  { value: "revenue", label: "Revenue" },
  { value: "sales_documents", label: "Sales documents" },
];

const statusOptions = [
  { value: "success", label: "Success" },
  { value: "error", label: "Error" },
  { value: "pending", label: "Pending" },
];

const IntegrationActivityCard = () => {
  const { t } = useTranslation();
  const viewerTimezone = getUserTimezone();
  const [filters, setFilters] = useState({
    provider: "",
    object_type: "",
    status: "",
    start_date: "",
    end_date: "",
  });
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");

  const fetchActivity = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await integrationActivity.list({ ...filters, limit: 50 });
      setRows(res?.results || []);
    } catch (err) {
      setError(err?.displayMessage || err?.response?.data?.error || "Failed to load activity");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  const handleFilterChange = (field) => (event) => {
    setFilters((prev) => ({ ...prev, [field]: event.target.value }));
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {t("settings.integrationActivity.title", "Integration activity")}
        </Typography>
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>{t("settings.integrationActivity.provider", "Provider")}</InputLabel>
              <Select
                label={t("settings.integrationActivity.provider", "Provider")}
                value={filters.provider}
                onChange={handleFilterChange("provider")}
              >
                <MenuItem value="">
                  <em>{t("settings.integrationActivity.all", "All")}</em>
                </MenuItem>
                {providerOptions.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>{t("settings.integrationActivity.objectType", "Type")}</InputLabel>
              <Select
                label={t("settings.integrationActivity.objectType", "Type")}
                value={filters.object_type}
                onChange={handleFilterChange("object_type")}
              >
                <MenuItem value="">
                  <em>{t("settings.integrationActivity.all", "All")}</em>
                </MenuItem>
                {objectTypeOptions.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>{t("settings.integrationActivity.status", "Status")}</InputLabel>
              <Select
                label={t("settings.integrationActivity.status", "Status")}
                value={filters.status}
                onChange={handleFilterChange("status")}
              >
                <MenuItem value="">
                  <em>{t("settings.integrationActivity.all", "All")}</em>
                </MenuItem>
                {statusOptions.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
              <TextField
                type="date"
                label={t("settings.integrationActivity.start", "Start date")}
                InputLabelProps={{ shrink: true }}
                value={filters.start_date}
                onChange={handleFilterChange("start_date")}
                size="small"
                fullWidth
              />
              <TextField
                type="date"
                label={t("settings.integrationActivity.end", "End date")}
                InputLabelProps={{ shrink: true }}
                value={filters.end_date}
                onChange={handleFilterChange("end_date")}
                size="small"
                fullWidth
              />
            </Stack>
          </Grid>
        </Grid>
        <Box sx={{ mb: 2 }}>
          <Button variant="contained" onClick={fetchActivity} disabled={loading}>
            {t("settings.integrationActivity.refresh", "Refresh")}
          </Button>
        </Box>
        {loading ? (
          <CircularProgress size={32} />
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : rows.length === 0 ? (
          <Alert severity="info">{t("settings.integrationActivity.empty", "No activity yet.")}</Alert>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>{t("settings.integrationActivity.date", "Date")}</TableCell>
                <TableCell>{t("settings.integrationActivity.provider", "Provider")}</TableCell>
                <TableCell>{t("settings.integrationActivity.type", "Type")}</TableCell>
                <TableCell>{t("settings.integrationActivity.status", "Status")}</TableCell>
                <TableCell>{t("settings.integrationActivity.externalId", "External ID")}</TableCell>
                <TableCell>{t("settings.integrationActivity.triggeredBy", "Triggered by")}</TableCell>
                <TableCell>{t("settings.integrationActivity.message", "Message")}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{formatDateTimeInTz(row.created_at, viewerTimezone)}</TableCell>
                  <TableCell>{row.provider}</TableCell>
                  <TableCell>{row.object_type}</TableCell>
                  <TableCell>
                    <Chip
                      label={row.status}
                      color={row.status === "success" ? "success" : row.status === "error" ? "error" : "default"}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{row.external_id || "—"}</TableCell>
                  <TableCell>{row.triggered_by?.name || "—"}</TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {row.error_message || "—"}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default IntegrationActivityCard;
