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
  TextField,
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

const payItemLabel = {
  regular_hours: "regular hours",
  overtime_1_5: "overtime 1.5x",
  paid_leave: "paid leave",
  holiday_hours: "holiday hours",
  vacation_pay: "vacation pay",
  tips: "tips",
  bonus: "bonus",
  attendance_bonus: "attendance bonus",
  performance_bonus: "performance bonus",
  commission: "commission",
  shift_premium: "shift premium",
  travel_allowance: "travel allowance",
  non_taxable_reimbursement: "non-taxable reimbursement",
  parental_top_up: "parental top-up",
  family_bonus: "family bonus",
};

const formatDateTime = (value) => {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString();
};

const formatNumber = (value) => {
  const numeric = Number(value || 0);
  return Number.isFinite(numeric) ? numeric : 0;
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
  const [mappingLoading, setMappingLoading] = useState(false);
  const [employeeMappings, setEmployeeMappings] = useState([]);
  const [payItemMappings, setPayItemMappings] = useState([]);
  const [runHistory, setRunHistory] = useState([]);
  const [employeeMappingDrafts, setEmployeeMappingDrafts] = useState({});
  const [payItemDraft, setPayItemDraft] = useState({
    local_key: "",
    provider_item_id: "",
    provider_item_name: "",
  });

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

  const loadMappingData = async () => {
    setMappingLoading(true);
    try {
      const [employeeRes, payItemRes, runsRes] = await Promise.all([
        payrollProviderSyncApi.listEmployeeMappings(provider),
        payrollProviderSyncApi.listPayItemMappings(provider),
        payrollProviderSyncApi.listRuns({ provider, limit: 10 }),
      ]);
      setEmployeeMappings(employeeRes?.items || []);
      setPayItemMappings(payItemRes?.items || []);
      setRunHistory(runsRes?.items || []);
    } catch (err) {
      showMessage(await buildRequestErrorMessage(err, "Failed to load provider mappings/history."), "error");
    } finally {
      setMappingLoading(false);
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
    loadMappingData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider]);

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
      await loadMappingData();
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
      await loadMappingData();
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
      await loadMappingData();
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
      await loadMappingData();
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
      await loadMappingData();
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
      await loadMappingData();
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

  const mappedEmployeeIds = useMemo(
    () =>
      new Set(
        employeeMappings
          .filter((item) => item.provider === provider && item.provider_employee_id)
          .map((item) => String(item.employee_id))
      ),
    [employeeMappings, provider]
  );

  const mappedPayItemKeys = useMemo(
    () =>
      new Set(
        payItemMappings
          .filter((item) => item.provider === provider && item.provider_item_id && item.is_active)
          .map((item) => item.local_key)
      ),
    [payItemMappings, provider]
  );

  const currentRunRows = runData?.employee_rows || [];
  const currentRunEmployeeIds = useMemo(
    () => currentRunRows.map((row) => String(row.employee_id)),
    [currentRunRows]
  );
  const unmappedRunEmployees = useMemo(
    () =>
      currentRunRows.filter((row) => !row.provider_employee_id && !mappedEmployeeIds.has(String(row.employee_id))),
    [currentRunRows, mappedEmployeeIds]
  );
  const currentRunKeys = useMemo(
    () =>
      Array.from(
        new Set(
          (currentRunRows || []).flatMap((row) =>
            (row.earning_lines || []).map((line) => line.earning_key).filter(Boolean)
          )
        )
      ).sort(),
    [currentRunRows]
  );
  const requiredPayItemKeys = validationData?.required_pay_item_keys_for_run || currentRunKeys;
  const missingPayItemKeys = validationData?.missing_pay_item_keys || [];
  const optionalMappedPayItemKeys = validationData?.optional_mapped_pay_item_keys || Array.from(mappedPayItemKeys).filter((key) => !requiredPayItemKeys.includes(key)).sort();
  const unmappedEmployeeIdsFromValidation = formatList(validationData?.missing_employee_map_ids).map((id) => String(id));
  const currentRunMappedEmployeeCount = currentRunEmployeeIds.filter((id) => mappedEmployeeIds.has(String(id))).length;
  const currentRunUnmappedEmployeeCount = currentRunEmployeeIds.length - currentRunMappedEmployeeCount;
  const currentRunMappedPayItemCount = requiredPayItemKeys.filter((key) => mappedPayItemKeys.has(key)).length;
  const adjustmentOnlyLineCount = validationData?.adjustment_only_line_count ?? 0;
  const invalidNegativeLineIds = formatList(validationData?.invalid_negative_line_ids);
  const unpaidLeaveVisibilityEmployeeIds = formatList(validationData?.unpaid_leave_visibility_employee_ids);
  const sourceHashChanged = useMemo(() => {
    if (!previewData?.source_hash) return false;
    const previous = (runHistory || []).find(
      (item) =>
        item.provider === provider &&
        item.start_date === startDate &&
        item.end_date === endDate &&
        item.source_hash !== previewData.source_hash
    );
    return Boolean(previous);
  }, [previewData, runHistory, provider, startDate, endDate]);
  const currentPeriodHistory = useMemo(
    () =>
      (runHistory || []).filter(
        (item) =>
          item.provider === provider &&
          item.start_date === startDate &&
          item.end_date === endDate
      ),
    [provider, runHistory, startDate, endDate]
  );
  const latestPreviousRun = currentPeriodHistory.find((item) => item.id !== runData?.id);

  const handleEmployeeMapChange = (employeeId, value) => {
    setEmployeeMappingDrafts((prev) => ({ ...prev, [employeeId]: value }));
  };

  const saveEmployeeMapping = async (row) => {
    const providerEmployeeId = (employeeMappingDrafts[row.employee_id] || "").trim();
    if (!providerEmployeeId) {
      showMessage("Provider employee ID is required.", "warning");
      return;
    }
    try {
      await payrollProviderSyncApi.linkEmployeeMapping(row.employee_id, {
        provider,
        provider_employee_id: providerEmployeeId,
        provider_display_name: row.employee_name_snapshot,
      });
      await loadMappingData();
      if (runData?.id) {
        const refreshed = await payrollProviderSyncApi.runDetail(runData.id);
        setRunData(refreshed?.run || runData);
        if (validationData) {
          const validated = await payrollProviderSyncApi.validateRun(runData.id);
          setValidationData(validated?.result || validationData);
        }
      }
      showMessage("Employee mapping saved.", "success");
    } catch (err) {
      showMessage(await buildRequestErrorMessage(err, "Failed to save employee mapping."), "error");
    }
  };

  const savePayItemMapping = async () => {
    const localKey = (payItemDraft.local_key || "").trim();
    if (!localKey || !payItemDraft.provider_item_id.trim()) {
      showMessage("Local key and provider item ID are required.", "warning");
      return;
    }
    const existing = payItemMappings.find((item) => item.local_key === localKey && item.provider_item_id);
    if (existing) {
      showMessage("That pay item key is already mapped. Existing mappings are not overwritten here.", "info");
      return;
    }
    try {
      await payrollProviderSyncApi.upsertPayItemMapping({
        provider,
        local_key: localKey,
        item_category: localKey === "non_taxable_reimbursement" ? "reimbursement" : "earning",
        provider_item_id: payItemDraft.provider_item_id.trim(),
        provider_item_name: payItemDraft.provider_item_name.trim() || localKey,
      });
      setPayItemDraft({ local_key: "", provider_item_id: "", provider_item_name: "" });
      await loadMappingData();
      if (runData?.id && validationData) {
        const validated = await payrollProviderSyncApi.validateRun(runData.id);
        setValidationData(validated?.result || validationData);
      }
      showMessage("Pay item mapping saved.", "success");
    } catch (err) {
      showMessage(await buildRequestErrorMessage(err, "Failed to save pay item mapping."), "error");
    }
  };

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
          Mapping readiness
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Required mappings are driven by the lines that exist in the current provider run. Optional mappings are available for future periods but are not blocking this run.
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={3}><Typography variant="body2"><strong>Mapped employees:</strong> {currentRunMappedEmployeeCount || setupStatus?.employee_mapping_count || 0}</Typography></Grid>
          <Grid item xs={12} md={3}><Typography variant="body2"><strong>Unmapped employees:</strong> {runData ? currentRunUnmappedEmployeeCount : "—"}</Typography></Grid>
          <Grid item xs={12} md={3}><Typography variant="body2"><strong>Mapped pay items:</strong> {currentRunMappedPayItemCount || setupStatus?.pay_item_mapping_count || 0}</Typography></Grid>
          <Grid item xs={12} md={3}><Typography variant="body2"><strong>Missing pay item mappings:</strong> {missingPayItemKeys.length}</Typography></Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2">Required for this run</Typography>
            {requiredPayItemKeys.length ? (
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {requiredPayItemKeys.map((key) => (
                  <Chip
                    key={key}
                    size="small"
                    color={missingPayItemKeys.includes(key) ? "warning" : "success"}
                    label={payItemLabel[key] || key}
                  />
                ))}
              </Stack>
            ) : (
              <Typography variant="body2" color="text.secondary">No run-specific pay items yet.</Typography>
            )}
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2">Optional mappings available</Typography>
            {optionalMappedPayItemKeys.length ? (
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {optionalMappedPayItemKeys.map((key) => (
                  <Chip key={key} size="small" variant="outlined" label={payItemLabel[key] || key} />
                ))}
              </Stack>
            ) : (
              <Typography variant="body2" color="text.secondary">No optional mapped keys detected.</Typography>
            )}
          </Grid>
        </Grid>
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
          {sourceHashChanged && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Source hash changed since an earlier run for this same period. Review the saved adjustments and approved time before exporting.
            </Alert>
          )}
          {isQuickBooksAccountingOnly && (
            <Alert severity="info" sx={{ mb: 2 }}>
              QuickBooks is connected for accounting only. Live payroll/time submit is not enabled. Use payload preview and Provider Sync CSV, then complete payroll inside QuickBooks.
            </Alert>
          )}
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
            <Grid item xs={12} md={4}><Typography variant="body2"><strong>Invalid/negative lines:</strong> {invalidNegativeLineIds.join(", ") || "None"}</Typography></Grid>
            <Grid item xs={12} md={4}><Typography variant="body2"><strong>Adjustment-only lines:</strong> {adjustmentOnlyLineCount}</Typography></Grid>
            <Grid item xs={12} md={4}><Typography variant="body2"><strong>Unpaid leave visibility rows:</strong> {unpaidLeaveVisibilityEmployeeIds.join(", ") || "None"}</Typography></Grid>
          </Grid>
        </Paper>
      )}

      {runData && (
        <Paper elevation={2} sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Employee mapping management
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Legacy external payroll employee IDs are bootstrap-only. Live Provider Sync uses PayrollProviderEmployeeMap only.
          </Typography>
          {!unmappedRunEmployees.length && !unmappedEmployeeIdsFromValidation.length ? (
            <Alert severity="success">All employees in this run have provider employee mappings.</Alert>
          ) : (
            <Stack spacing={2}>
              {unmappedRunEmployees.map((row) => (
                <Grid container spacing={2} key={row.id} alignItems="center">
                  <Grid item xs={12} md={3}>
                    <Typography variant="body2"><strong>{row.employee_name_snapshot || `Employee ${row.employee_id}`}</strong></Typography>
                    <Typography variant="caption" color="text.secondary">Employee ID {row.employee_id}</Typography>
                  </Grid>
                  <Grid item xs={12} md={5}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Provider employee ID"
                      value={employeeMappingDrafts[row.employee_id] ?? ""}
                      onChange={(event) => handleEmployeeMapChange(row.employee_id, event.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Button variant="outlined" onClick={() => saveEmployeeMapping(row)}>
                      Save employee mapping
                    </Button>
                  </Grid>
                </Grid>
              ))}
            </Stack>
          )}
        </Paper>
      )}

      <Paper elevation={2} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Pay item mapping management
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Required earning keys must map before payload preview and Provider Sync CSV can be used safely for this run.
        </Typography>
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel id="provider-sync-local-key-label">Local key</InputLabel>
              <Select
                labelId="provider-sync-local-key-label"
                label="Local key"
                value={payItemDraft.local_key}
                onChange={(event) =>
                  setPayItemDraft((prev) => ({ ...prev, local_key: event.target.value }))
                }
              >
                {Object.keys(payItemLabel).map((key) => (
                  <MenuItem key={key} value={key}>
                    {payItemLabel[key] || key}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              label="Provider item ID"
              value={payItemDraft.provider_item_id}
              onChange={(event) =>
                setPayItemDraft((prev) => ({ ...prev, provider_item_id: event.target.value }))
              }
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              label="Provider item name"
              value={payItemDraft.provider_item_name}
              onChange={(event) =>
                setPayItemDraft((prev) => ({ ...prev, provider_item_name: event.target.value }))
              }
            />
          </Grid>
          <Grid item xs={12}>
            <Button variant="outlined" onClick={savePayItemMapping}>
              Save pay item mapping
            </Button>
          </Grid>
        </Grid>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Local key</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Provider item id</TableCell>
              <TableCell>Provider item name</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {payItemMappings.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{payItemLabel[row.local_key] || row.local_key}</TableCell>
                <TableCell>{row.item_category}</TableCell>
                <TableCell>{row.provider_item_id || "—"}</TableCell>
                <TableCell>{row.provider_item_name || "—"}</TableCell>
                <TableCell>{row.is_active ? "active" : "inactive"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

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

      <Paper elevation={2} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Provider run history
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Provider Sync tracks draft, validated, payload-previewed, CSV-exported, failed, and unsupported runs only. It does not claim payroll was submitted, completed, or paid.
        </Typography>
        {mappingLoading ? (
          <CircularProgress size={20} />
        ) : !runHistory.length ? (
          <Typography variant="body2" color="text.secondary">No provider runs found yet.</Typography>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Period</TableCell>
                <TableCell>Provider</TableCell>
                <TableCell>Created by</TableCell>
                <TableCell>Created at</TableCell>
                <TableCell>Source hash</TableCell>
                <TableCell align="right">Employees</TableCell>
                <TableCell align="right">Lines</TableCell>
                <TableCell align="right">Hours</TableCell>
                <TableCell align="right">Adjustment total</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Payload previewed</TableCell>
                <TableCell>CSV exported</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {runHistory.map((item) => (
                <TableRow key={item.id} selected={item.id === runData?.id}>
                  <TableCell>{item.start_date} to {item.end_date}</TableCell>
                  <TableCell>{item.provider}</TableCell>
                  <TableCell>{item.triggered_by_name || item.triggered_by_email || item.triggered_by_id || "—"}</TableCell>
                  <TableCell>{formatDateTime(item.created_at)}</TableCell>
                  <TableCell sx={{ maxWidth: 220, overflowWrap: "anywhere" }}>{item.source_hash || "—"}</TableCell>
                  <TableCell align="right">{formatNumber(item.employee_count)}</TableCell>
                  <TableCell align="right">{formatNumber(item.time_entry_count)}</TableCell>
                  <TableCell align="right">{formatNumber(item.total_hours)}</TableCell>
                  <TableCell align="right">{formatNumber(item.request_payload_json?.adjustments?.adjustment_total)}</TableCell>
                  <TableCell>{item.status || "draft"}</TableCell>
                  <TableCell>{item.payload_previewed_at ? formatDateTime(item.payload_previewed_at) : "No"}</TableCell>
                  <TableCell>{item.csv_exported_at ? formatDateTime(item.csv_exported_at) : "No"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        {latestPreviousRun && previewData?.source_hash && latestPreviousRun.source_hash !== previewData.source_hash && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            The current preview source hash differs from the most recent earlier run for this same period. This usually means approved time or saved Payroll Preview adjustments changed.
          </Alert>
        )}
      </Paper>
    </Stack>
  );
}
