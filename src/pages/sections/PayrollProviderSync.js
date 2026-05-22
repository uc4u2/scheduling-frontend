import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  Grid,
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
  Typography,
} from "@mui/material";
import { payrollProviderSyncApi } from "../../utils/api";
import { extractApiErrorMessage } from "../../utils/apiError";

const PROVIDER_OPTIONS = [
  { value: "quickbooks", label: "QuickBooks" },
  { value: "csv_provider", label: "CSV fallback" },
  { value: "xero", label: "Xero (coming later)", disabled: true },
];

const formatList = (items = []) => (Array.isArray(items) ? items.filter(Boolean) : []);

const buildSetupErrorMessage = (status, fallback = "Failed to load provider setup status.") => {
  const errors = Array.isArray(status?.capabilities?.errors) ? status.capabilities.errors : [];
  if (errors.includes("QUICKBOOKS_CONNECTION_REQUIRED")) {
    return "QuickBooks is not connected. Connect QuickBooks in Settings first.";
  }
  if (errors.includes("QUICKBOOKS_TIME_SCOPE_REQUIRED")) {
    return "QuickBooks is connected for accounting, but payroll/time sync is not enabled.";
  }
  return (
    status?.message ||
    status?.error ||
    status?.error_code ||
    fallback
  );
};

const buildRequestErrorMessage = async (err, fallback) => {
  const status = err?.response?.status;
  const message = await extractApiErrorMessage(err, fallback);
  return status ? `${message} (HTTP ${status})` : message;
};

const renderJsonList = (items = []) => {
  const list = formatList(items);
  if (!list.length) return <Typography variant="body2" color="text.secondary">None</Typography>;
  return (
    <Box component="ul" sx={{ m: 0, pl: 3 }}>
      {list.map((item, index) => (
        <li key={`${index}-${typeof item === "string" ? item : item?.code || item?.message || "item"}`}>
          {typeof item === "string"
            ? item
            : item?.message || item?.code || JSON.stringify(item)}
        </li>
      ))}
    </Box>
  );
};

const truthyIds = (ids = []) =>
  Array.isArray(ids)
    ? ids.map((id) => String(id)).filter(Boolean)
    : [];

const adjustmentTypeLabels = {
  tips: "tips",
  bonus: "bonus",
  attendance_bonus: "attendance bonus",
  performance_bonus: "performance bonus",
  commission: "commission",
  shift_premium: "shift premium",
  travel_allowance: "travel allowance",
  non_taxable_reimbursement: "reimbursements",
  vacation_pay: "vacation pay",
  parental_top_up: "parental top-up",
  family_bonus: "family bonus",
};

export default function PayrollProviderSync({
  departmentFilter,
  selectedRecruiter,
  exportAllEmployees,
  exportEmployeeIds,
  region,
  startDate,
  endDate,
  payFrequency,
  payroll,
  filteredRecruiters = [],
  setSnackbar,
}) {
  const [provider, setProvider] = useState("quickbooks");
  const [statusLoading, setStatusLoading] = useState(false);
  const [setupStatus, setSetupStatus] = useState(null);
  const [setupError, setSetupError] = useState("");

  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [previewError, setPreviewError] = useState("");

  const [createLoading, setCreateLoading] = useState(false);
  const [runData, setRunData] = useState(null);
  const [runError, setRunError] = useState("");

  const [validationLoading, setValidationLoading] = useState(false);
  const [validationData, setValidationData] = useState(null);

  const [payloadLoading, setPayloadLoading] = useState(false);
  const [payloadPreview, setPayloadPreview] = useState(null);

  const [downloadLoading, setDownloadLoading] = useState(false);
  const [bootstrapPayItemsLoading, setBootstrapPayItemsLoading] = useState(false);
  const [bootstrapEmployeesLoading, setBootstrapEmployeesLoading] = useState(false);

  const availableEmployeeIds = useMemo(() => {
    if (exportAllEmployees) {
      if (departmentFilter) {
        return truthyIds(filteredRecruiters.map((row) => row.id));
      }
      return [];
    }
    if (Array.isArray(exportEmployeeIds) && exportEmployeeIds.length) {
      return truthyIds(exportEmployeeIds);
    }
    if (selectedRecruiter) {
      return [String(selectedRecruiter)];
    }
    return [];
  }, [departmentFilter, exportAllEmployees, exportEmployeeIds, filteredRecruiters, selectedRecruiter]);

  const missingDates = !startDate || !endDate;
  const noExplicitEmployees = !exportAllEmployees && availableEmployeeIds.length === 0;
  const canPrepare = !missingDates;

  // Province/state is still owned inside PayrollFilters. For this first pass,
  // provider-sync uses region plus any province/state already present on payroll.
  const provinceOrState = payroll?.state || payroll?.province || null;

  const showMessage = (message, severity = "info") => {
    if (typeof setSnackbar === "function") {
      setSnackbar({ open: true, message, severity });
    }
  };

  const loadSetupStatus = async () => {
    setStatusLoading(true);
    setSetupError("");
    try {
      const data = await payrollProviderSyncApi.setupStatus("quickbooks");
      setSetupStatus(data);
      const derivedMessage = buildSetupErrorMessage(data, "");
      setSetupError(derivedMessage);
    } catch (err) {
      const message = await buildRequestErrorMessage(err, "Failed to load provider setup status.");
      setSetupError(message);
    } finally {
      setStatusLoading(false);
    }
  };

  useEffect(() => {
    loadSetupStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const buildRunPayload = () => ({
    provider,
    region,
    start_date: startDate,
    end_date: endDate,
    pay_date: endDate || undefined,
    employee_ids: availableEmployeeIds,
    // Province/state is best-effort from the current payroll object until it is
    // lifted from PayrollFilters in a dedicated refactor.
    province_state: provinceOrState || undefined,
    pay_frequency: payFrequency || undefined,
  });

  const handlePreview = async () => {
    if (!canPrepare) return;
    setPreviewLoading(true);
    setPreviewError("");
    setPreviewData(null);
    try {
      const data = await payrollProviderSyncApi.rawPreview(buildRunPayload());
      setPreviewData(data?.preview || data);
    } catch (err) {
      const message = await buildRequestErrorMessage(err, "Failed to preview payroll-ready data.");
      setPreviewError(message);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleCreateRun = async () => {
    if (!canPrepare) return;
    setCreateLoading(true);
    setRunError("");
    setValidationData(null);
    setPayloadPreview(null);
    try {
      const data = await payrollProviderSyncApi.createFromRaw(buildRunPayload());
      setRunData(data?.run || data);
      showMessage("Provider run created.", "success");
    } catch (err) {
      const message = await buildRequestErrorMessage(err, "Failed to create provider run.");
      setRunError(message);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleValidateRun = async () => {
    if (!runData?.id) return;
    setValidationLoading(true);
    try {
      const data = await payrollProviderSyncApi.validateRun(runData.id);
      setValidationData(data?.result || data);
      setRunData(data?.run || runData);
      showMessage("Provider run validated.", "success");
    } catch (err) {
      showMessage(await buildRequestErrorMessage(err, "Run validation failed."), "error");
    } finally {
      setValidationLoading(false);
    }
  };

  const handlePreviewPayload = async () => {
    if (!runData?.id) return;
    setPayloadLoading(true);
    try {
      const data = await payrollProviderSyncApi.quickbooksPayloadPreview(runData.id);
      setPayloadPreview(data);
    } catch (err) {
      showMessage(await buildRequestErrorMessage(err, "Failed to preview provider payload."), "error");
    } finally {
      setPayloadLoading(false);
    }
  };

  const handleCsvDownload = async () => {
    if (!runData?.id) return;
    setDownloadLoading(true);
    try {
      const resp = await payrollProviderSyncApi.csvDownload(runData.id);
      const blob = new Blob([resp.data], { type: resp.headers["content-type"] || "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `provider_run_${runData.id}_${provider}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      showMessage(await buildRequestErrorMessage(err, "Failed to download provider CSV."), "error");
    } finally {
      setDownloadLoading(false);
    }
  };

  const handleBootstrapPayItems = async () => {
    setBootstrapPayItemsLoading(true);
    try {
      await payrollProviderSyncApi.bootstrapPayItemDefaults("quickbooks");
      await loadSetupStatus();
      showMessage("Pay item placeholders created.", "success");
    } catch (err) {
      showMessage(await buildRequestErrorMessage(err, "Failed to bootstrap pay item placeholders."), "error");
    } finally {
      setBootstrapPayItemsLoading(false);
    }
  };

  const handleBootstrapEmployees = async () => {
    setBootstrapEmployeesLoading(true);
    try {
      await payrollProviderSyncApi.bootstrapEmployeesFromLegacy("quickbooks");
      await loadSetupStatus();
      showMessage("Employee mappings bootstrapped from legacy IDs.", "success");
    } catch (err) {
      showMessage(await buildRequestErrorMessage(err, "Failed to bootstrap employee mappings."), "error");
    } finally {
      setBootstrapEmployeesLoading(false);
    }
  };

  const setupCapabilities = setupStatus?.capabilities || {};
  const statusReadiness = setupStatus?.readiness || "unknown";
  const isQuickBooksAccountingOnly =
    provider === "quickbooks" &&
    statusReadiness === "accounting_only";

  return (
    <Stack spacing={3} sx={{ mt: 2 }}>
      <Paper elevation={2} sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Payroll Provider Sync
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Provider Sync prepares payroll-ready inputs from approved time, payroll-ready leave, and saved Payroll Preview adjustments. Official payroll is completed in QuickBooks or your payroll provider.
        </Typography>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mt: 2 }}>
          <Chip color="warning" variant="outlined" label="QuickBooks official import format: not verified yet" />
          <Chip color="success" variant="outlined" label="Provider Sync = recommended payroll handoff workflow" />
        </Stack>
        <Alert severity="warning" sx={{ mt: 2 }}>
          QuickBooks official import format: not verified yet.
        </Alert>
      </Paper>

      <Paper elevation={2} sx={{ p: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel id="provider-sync-provider-label">Provider</InputLabel>
              <Select
                labelId="provider-sync-provider-label"
                label="Provider"
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
              >
                {PROVIDER_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value} disabled={Boolean(option.disabled)}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={8}>
            <Stack direction={{ xs: "column", md: "row" }} spacing={1} alignItems={{ xs: "stretch", md: "center" }}>
              <Chip label="QuickBooks" color={provider === "quickbooks" ? "primary" : "default"} />
              <Chip label="CSV fallback" color={provider === "csv_provider" ? "primary" : "default"} />
              <Chip label="Xero coming later" variant="outlined" />
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      <Paper elevation={2} sx={{ p: 3 }}>
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2} sx={{ mb: 2 }}>
          <Box>
            <Typography variant="h6">QuickBooks Setup Status</Typography>
            <Typography variant="body2" color="text.secondary">
              Settings remains for setup, connect, and mappings. Payroll page owns pay-period execution.
            </Typography>
          </Box>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            <Button variant="outlined" onClick={loadSetupStatus} disabled={statusLoading}>
              {statusLoading ? <CircularProgress size={18} /> : "Refresh status"}
            </Button>
            <Button variant="outlined" onClick={handleBootstrapPayItems} disabled={bootstrapPayItemsLoading}>
              {bootstrapPayItemsLoading ? <CircularProgress size={18} /> : "Bootstrap pay item placeholders"}
            </Button>
            <Button variant="outlined" onClick={handleBootstrapEmployees} disabled={bootstrapEmployeesLoading}>
              {bootstrapEmployeesLoading ? <CircularProgress size={18} /> : "Bootstrap employees from legacy IDs"}
            </Button>
          </Stack>
        </Stack>

        {setupError && <Alert severity="error" sx={{ mb: 2 }}>{setupError}</Alert>}
        {isQuickBooksAccountingOnly && (
          <Alert severity="info" sx={{ mb: 2 }}>
            QuickBooks connected for accounting only. Payroll/time sync requires additional QuickBooks capability. CSV fallback is available.
          </Alert>
        )}
        {provider === "csv_provider" && (
          <Alert severity="info" sx={{ mb: 2 }}>
            CSV fallback is available even when provider API submission is unsupported.
          </Alert>
        )}

        <Grid container spacing={2}>
          <Grid item xs={12} md={4}><Typography variant="body2"><strong>Connection status:</strong> {setupStatus?.connection_status || "unknown"}</Typography></Grid>
          <Grid item xs={12} md={4}><Typography variant="body2"><strong>Readiness:</strong> {statusReadiness}</Typography></Grid>
          <Grid item xs={12} md={4}><Typography variant="body2"><strong>Provider company ref:</strong> {setupStatus?.provider_company_ref || "—"}</Typography></Grid>
          <Grid item xs={12} md={4}><Typography variant="body2"><strong>Supports accounting:</strong> {setupCapabilities?.supports_accounting ? "Yes" : "No"}</Typography></Grid>
          <Grid item xs={12} md={4}><Typography variant="body2"><strong>Supports time activity submit:</strong> {setupCapabilities?.supports_time_activity_submit ? "Yes" : "No"}</Typography></Grid>
          <Grid item xs={12} md={4}><Typography variant="body2"><strong>Supports payroll run submit:</strong> {setupCapabilities?.supports_payroll_run_submit ? "Yes" : "No"}</Typography></Grid>
          <Grid item xs={12} md={4}><Typography variant="body2"><strong>Employee mappings:</strong> {setupStatus?.employee_mapping_count ?? 0}</Typography></Grid>
          <Grid item xs={12} md={4}><Typography variant="body2"><strong>Pay item mappings:</strong> {setupStatus?.pay_item_mapping_count ?? 0}</Typography></Grid>
          <Grid item xs={12} md={4}><Typography variant="body2"><strong>Missing scopes:</strong> {formatList(setupStatus?.missing_scopes).join(", ") || "None"}</Typography></Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />
        <Typography variant="subtitle2" gutterBottom>Missing required pay item keys</Typography>
        {renderJsonList(setupStatus?.missing_required_pay_item_keys)}
        <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>Setup steps</Typography>
        {renderJsonList(setupStatus?.setup_steps)}
      </Paper>

      <Paper elevation={2} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Prepare payroll-ready data
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Use the current Payroll page filters to prepare payroll-ready inputs, preview provider payload, download provider CSV, and complete payroll inside the provider.
        </Typography>
        <Alert severity="info" sx={{ mb: 2 }}>
          Provider Sync CSV is the recommended handoff for accountants, payroll providers, and QuickBooks review workflows. It is not yet a verified official QuickBooks Payroll import format.
        </Alert>
        {missingDates && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Start date and end date are required before preparing provider-sync data.
          </Alert>
        )}
        {noExplicitEmployees && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            No employee was selected while “all employees” is off. If you continue, the backend may run for available employees in the selected period or department if supported.
          </Alert>
        )}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} md={3}><Typography variant="body2"><strong>Region:</strong> {region || "—"}</Typography></Grid>
          <Grid item xs={12} md={3}><Typography variant="body2"><strong>Start date:</strong> {startDate || "—"}</Typography></Grid>
          <Grid item xs={12} md={3}><Typography variant="body2"><strong>End date:</strong> {endDate || "—"}</Typography></Grid>
          <Grid item xs={12} md={3}><Typography variant="body2"><strong>Pay frequency:</strong> {payFrequency || "—"}</Typography></Grid>
          <Grid item xs={12} md={6}><Typography variant="body2"><strong>Department filter:</strong> {departmentFilter || "All departments"}</Typography></Grid>
          <Grid item xs={12} md={6}><Typography variant="body2"><strong>Selected employees:</strong> {availableEmployeeIds.length ? availableEmployeeIds.join(", ") : exportAllEmployees ? "All available employees" : "Backend default scope"}</Typography></Grid>
        </Grid>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
          <Button variant="contained" onClick={handlePreview} disabled={!canPrepare || previewLoading}>
            {previewLoading ? <CircularProgress size={18} /> : "Preview payroll-ready data"}
          </Button>
          <Button variant="outlined" onClick={handleCreateRun} disabled={!canPrepare || createLoading}>
            {createLoading ? <CircularProgress size={18} /> : "Create provider run"}
          </Button>
        </Stack>

        {(previewError || previewData) && <Divider sx={{ my: 2 }} />}
        {previewError && <Alert severity="error" sx={{ mb: 2 }}>{previewError}</Alert>}
        {previewData && (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              {previewData.saved_adjustments_included ? (
                <Alert severity="info" sx={{ mb: 2 }}>
                  Saved Payroll Preview adjustments will be included.
                </Alert>
              ) : (
                <Alert severity="info" sx={{ mb: 2 }}>
                  No saved Payroll Preview adjustments found for this period. Provider Sync will use approved time and leave only.
                </Alert>
              )}
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>Operational base</Typography>
              <Stack spacing={0.75}>
                <Typography variant="body2"><strong>Employees:</strong> {previewData.employee_count ?? 0}</Typography>
                <Typography variant="body2"><strong>Lines:</strong> {previewData.line_count ?? 0}</Typography>
                <Typography variant="body2"><strong>Total hours:</strong> {previewData.total_hours ?? 0}</Typography>
                <Typography variant="body2"><strong>Regular hours:</strong> {previewData.regular_hours ?? 0}</Typography>
                <Typography variant="body2"><strong>Overtime hours:</strong> {previewData.overtime_hours ?? 0}</Typography>
                <Typography variant="body2"><strong>Paid leave hours:</strong> {previewData.paid_leave_hours ?? 0}</Typography>
                <Typography variant="body2"><strong>Holiday hours:</strong> {previewData.holiday_hours ?? 0}</Typography>
              </Stack>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>Saved adjustments</Typography>
              <Stack spacing={0.75}>
                <Typography variant="body2"><strong>Adjustment line count:</strong> {previewData.adjustment_line_count ?? 0}</Typography>
                <Typography variant="body2"><strong>Adjustment total:</strong> {previewData.adjustment_total ?? 0}</Typography>
                <Typography variant="body2"><strong>Adjustment types found:</strong> {(previewData.adjustment_types_found || []).map((key) => adjustmentTypeLabels[key] || key).join(", ") || "None"}</Typography>
                <Typography variant="body2"><strong>Gross preview total:</strong> {previewData.gross_preview_total ?? 0}</Typography>
              </Stack>
            </Grid>
            <Grid item xs={12} md={6}><Typography variant="body2"><strong>Existing run id:</strong> {previewData.existing_run_id || "—"}</Typography></Grid>
            <Grid item xs={12} md={6}><Typography variant="body2"><strong>Source hash:</strong> {previewData.source_hash || "—"}</Typography></Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2">Warnings</Typography>
              {renderJsonList(previewData.warnings)}
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2">Errors</Typography>
              {renderJsonList(previewData.errors)}
            </Grid>
          </Grid>
        )}
      </Paper>

      {runData && (
        <Paper elevation={2} sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Provider run</Typography>
          {runError && <Alert severity="error" sx={{ mb: 2 }}>{runError}</Alert>}
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} md={3}><Typography variant="body2"><strong>Run id:</strong> {runData.id}</Typography></Grid>
            <Grid item xs={12} md={3}><Typography variant="body2"><strong>Status:</strong> {runData.status || "—"}</Typography></Grid>
            <Grid item xs={12} md={3}><Typography variant="body2"><strong>Employee count:</strong> {runData.employee_count ?? 0}</Typography></Grid>
            <Grid item xs={12} md={3}><Typography variant="body2"><strong>Line count:</strong> {runData.time_entry_count ?? 0}</Typography></Grid>
            <Grid item xs={12} md={3}><Typography variant="body2"><strong>Total hours:</strong> {runData.total_hours ?? 0}</Typography></Grid>
            <Grid item xs={12} md={3}><Typography variant="body2"><strong>Adjustment lines:</strong> {runData.request_payload_json?.adjustments?.adjustment_line_count ?? 0}</Typography></Grid>
            <Grid item xs={12} md={3}><Typography variant="body2"><strong>Adjustment total:</strong> {runData.request_payload_json?.adjustments?.adjustment_total ?? 0}</Typography></Grid>
            <Grid item xs={12} md={3}><Typography variant="body2"><strong>Adjustment types:</strong> {(runData.request_payload_json?.adjustments?.adjustment_types_found || []).map((key) => adjustmentTypeLabels[key] || key).join(", ") || "None"}</Typography></Grid>
            <Grid item xs={12} md={9}><Typography variant="body2"><strong>Source hash:</strong> {runData.source_hash || "—"}</Typography></Grid>
          </Grid>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            <Button variant="contained" onClick={handleValidateRun} disabled={validationLoading}>
              {validationLoading ? <CircularProgress size={18} /> : "Validate run"}
            </Button>
            <Button variant="outlined" onClick={handlePreviewPayload} disabled={payloadLoading || provider !== "quickbooks"}>
              {payloadLoading ? <CircularProgress size={18} /> : "Preview QuickBooks payload"}
            </Button>
            <Button variant="outlined" onClick={handleCsvDownload} disabled={downloadLoading}>
              {downloadLoading ? <CircularProgress size={18} /> : "Download Provider Sync CSV (Recommended)"}
            </Button>
          </Stack>
        </Paper>
      )}

      {validationData && (
        <Paper elevation={2} sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Validation</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2">Errors</Typography>
              {renderJsonList(validationData.errors)}
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2">Warnings</Typography>
              {renderJsonList(validationData.warnings)}
            </Grid>
            <Grid item xs={12} md={4}><Typography variant="body2"><strong>Missing employee mapping ids:</strong> {formatList(validationData.missing_employee_map_ids).join(", ") || "None"}</Typography></Grid>
            <Grid item xs={12} md={4}><Typography variant="body2"><strong>Missing pay item keys:</strong> {formatList(validationData.missing_pay_item_keys).join(", ") || "None"}</Typography></Grid>
            <Grid item xs={12} md={4}><Typography variant="body2"><strong>Blocked employee ids:</strong> {formatList(validationData.blocked_employee_ids).join(", ") || "None"}</Typography></Grid>
          </Grid>
        </Paper>
      )}

      {payloadPreview && (
        <Paper elevation={2} sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Provider payload preview</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Preview provider inputs only. This does not submit official payroll and does not pay employees.
          </Typography>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} md={2}><Typography variant="body2"><strong>Total lines:</strong> {payloadPreview.summary?.total_lines ?? 0}</Typography></Grid>
            <Grid item xs={12} md={2}><Typography variant="body2"><strong>Valid lines:</strong> {payloadPreview.summary?.valid_lines ?? 0}</Typography></Grid>
            <Grid item xs={12} md={2}><Typography variant="body2"><strong>Invalid lines:</strong> {payloadPreview.summary?.invalid_lines ?? 0}</Typography></Grid>
            <Grid item xs={12} md={2}><Typography variant="body2"><strong>Employees:</strong> {payloadPreview.summary?.employees_count ?? 0}</Typography></Grid>
            <Grid item xs={12} md={2}><Typography variant="body2"><strong>Total hours:</strong> {payloadPreview.summary?.total_hours ?? 0}</Typography></Grid>
            <Grid item xs={12} md={2}><Typography variant="body2"><strong>Missing employee mappings:</strong> {formatList(payloadPreview.summary?.missing_employee_mappings).join(", ") || "None"}</Typography></Grid>
            <Grid item xs={12} md={12}><Typography variant="body2"><strong>Missing pay item mappings:</strong> {formatList(payloadPreview.summary?.missing_pay_item_mappings).join(", ") || "None"}</Typography></Grid>
          </Grid>
          {payloadPreview.errors?.length > 0 && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              {payloadPreview.errors.length} provider preview issue(s) were detected.
            </Alert>
          )}
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Employee</TableCell>
                <TableCell>Work date</TableCell>
                <TableCell>Earning key</TableCell>
                <TableCell align="right">Hours</TableCell>
                <TableCell align="right">Rate</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell>Provider employee id</TableCell>
                <TableCell>Provider item id</TableCell>
                <TableCell>Status / errors</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(payloadPreview.line_previews || []).map((line) => (
                <TableRow key={line.line_id}>
                  <TableCell>{line.employee_name_snapshot || "—"}</TableCell>
                  <TableCell>{line.work_date || "—"}</TableCell>
                  <TableCell>{line.earning_key || "—"}</TableCell>
                  <TableCell align="right">{line.hours ?? 0}</TableCell>
                  <TableCell align="right">{line.rate ?? 0}</TableCell>
                  <TableCell align="right">{line.amount_preview ?? 0}</TableCell>
                  <TableCell>{line.provider_employee_id || "—"}</TableCell>
                  <TableCell>{line.provider_item_id || "—"}</TableCell>
                  <TableCell>
                    {line.is_valid ? (
                      <Chip size="small" color="success" label="Valid" />
                    ) : (
                      <Stack spacing={0.5}>
                        <Chip size="small" color="warning" label="Needs attention" />
                        {line.errors?.map((error, index) => (
                          <Typography variant="caption" color="error" key={`${line.line_id}-${index}`}>
                            {error?.code || error?.message}
                          </Typography>
                        ))}
                      </Stack>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}
    </Stack>
  );
}
