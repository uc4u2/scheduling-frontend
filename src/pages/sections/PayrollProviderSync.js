import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
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
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
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
  const rawMessage = await extractApiErrorMessage(err, fallback);
  const normalized = String(rawMessage || "").toLowerCase();
  const message = normalized.includes("duplicate_source_hash")
    ? "A provider run already exists for this same payroll-ready snapshot. Open the existing run from history instead of creating another duplicate run."
    : rawMessage;
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

const NON_BLOCKING_CAPABILITY_ERROR_CODES = new Set([
  "QUICKBOOKS_TIME_SCOPE_REQUIRED",
]);

const EMPLOYEE_MAPPING_ERROR_CODES = new Set([
  "MISSING_EMPLOYEE_MAPPING",
]);

const PAY_ITEM_MAPPING_ERROR_CODES = new Set([
  "MISSING_PAY_ITEM_MAP",
]);

const REGION_METADATA_ERROR_CODES = new Set([
  "MISSING_REGION_METADATA",
]);

const BLOCKING_PREVIEW_ERROR_CODES = new Set([
  "MISSING_EMPLOYEE_MAPPING",
  "MISSING_PAY_ITEM_MAP",
  "MISSING_REGION_METADATA",
  "MISSING_HOURLY_RATE",
  "INVALID_NEGATIVE_LINE",
  "MISSING_REQUIRED_PAYROLL_DATA",
  "MISSING_CLOCK_OUT",
]);

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

const shortenHash = (value, size = 12) => {
  const text = String(value || "").trim();
  if (!text) return "—";
  if (text.length <= size) return text;
  return `${text.slice(0, size)}...`;
};

const employeeLabelFromContext = (employeeId, runRows = [], recruiters = []) => {
  const normalized = String(employeeId);
  const runMatch = runRows.find((row) => String(row.employee_id) === normalized);
  if (runMatch?.employee_name_snapshot) return runMatch.employee_name_snapshot;
  const recruiterMatch = recruiters.find((row) => String(row.id) === normalized);
  if (recruiterMatch) return `${recruiterMatch.first_name} ${recruiterMatch.last_name}`.trim();
  return `Employee ${employeeId}`;
};

const managerFriendlyMessage = (item, { runRows = [], recruiters = [] } = {}) => {
  const code = typeof item === "string" ? item : item?.code || item?.message || "";
  const key = item?.key;
  const employeeId = item?.employee_id;

  if (code === "QUICKBOOKS_TIME_SCOPE_REQUIRED") {
    return "Live QuickBooks payroll/time submit is not enabled. CSV export is still available.";
  }
  if (code === "MISSING_PAY_ITEM_MAP" && key) {
    return `${payItemLabel[key] || key} needs a QuickBooks/provider pay item mapping.`;
  }
  if (code === "MISSING_EMPLOYEE_MAPPING" && employeeId) {
    return `${employeeLabelFromContext(employeeId, runRows, recruiters)} needs to be mapped to a QuickBooks/provider employee.`;
  }
  if (code === "MISSING_REGION_METADATA" && employeeId) {
    return `${employeeLabelFromContext(employeeId, runRows, recruiters)} is missing country/province information.`;
  }
  if (code === "MISSING_REGION_METADATA") {
    return "Employee country/province information is missing.";
  }
  if (typeof item === "string") return item;
  return item?.message || item?.code || JSON.stringify(item);
};

const issueCode = (item) => {
  if (typeof item === "string") return item;
  return item?.code || item?.error || item?.message || "";
};

const isNonBlockingCapabilityIssue = (item) =>
  NON_BLOCKING_CAPABILITY_ERROR_CODES.has(issueCode(item));

const isBlockingPreviewIssue = (item) =>
  BLOCKING_PREVIEW_ERROR_CODES.has(issueCode(item)) && !isNonBlockingCapabilityIssue(item);

const renderManagerMessages = (items = [], context = {}) => {
  const list = formatList(items);
  if (!list.length) return <Typography variant="body2" color="text.secondary">None</Typography>;
  return (
    <Box component="ul" sx={{ m: 0, pl: 3 }}>
      {list.map((item, index) => (
        <li key={`${index}-${typeof item === "string" ? item : item?.code || item?.message || "item"}`}>
          {managerFriendlyMessage(item, context)}
        </li>
      ))}
    </Box>
  );
};

const CORE_PAY_ITEM_KEYS = [
  "regular_hours",
  "overtime_1_5",
  "paid_leave",
  "holiday_hours",
];

const PAY_ITEM_SORT_ORDER = [
  ...CORE_PAY_ITEM_KEYS,
  "vacation_pay",
  "tips",
  "bonus",
  "attendance_bonus",
  "performance_bonus",
  "commission",
  "shift_premium",
  "travel_allowance",
  "non_taxable_reimbursement",
  "parental_top_up",
  "family_bonus",
];

const sortPayItemKeys = (keys = []) =>
  [...keys].sort((a, b) => {
    const aIndex = PAY_ITEM_SORT_ORDER.indexOf(a);
    const bIndex = PAY_ITEM_SORT_ORDER.indexOf(b);
    if (aIndex === -1 && bIndex === -1) return String(a).localeCompare(String(b));
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });

const comparePayItemKey = (left, right) => {
  const [first, second] = sortPayItemKeys([left, right]);
  if (first === second) return 0;
  return first === left ? -1 : 1;
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
  recruiters = [],
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
  const [runNotice, setRunNotice] = useState("");

  const [validationLoading, setValidationLoading] = useState(false);
  const [validationData, setValidationData] = useState(null);

  const [payloadLoading, setPayloadLoading] = useState(false);
  const [payloadPreview, setPayloadPreview] = useState(null);

  const [downloadLoading, setDownloadLoading] = useState(false);
  const [bootstrapPayItemsLoading, setBootstrapPayItemsLoading] = useState(false);
  const [bootstrapEmployeesLoading, setBootstrapEmployeesLoading] = useState(false);
  const [mappingLoading, setMappingLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [employeeMappings, setEmployeeMappings] = useState([]);
  const [payItemMappings, setPayItemMappings] = useState([]);
  const [runHistory, setRunHistory] = useState([]);
  const [runHistoryMeta, setRunHistoryMeta] = useState({ limit: 10, offset: 0, has_more: false });
  const [selectedRunId, setSelectedRunId] = useState(null);
  const [historyStatusFilter, setHistoryStatusFilter] = useState("");
  const [historyStartFilter, setHistoryStartFilter] = useState("");
  const [historyEndFilter, setHistoryEndFilter] = useState("");
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [employeeFilter, setEmployeeFilter] = useState("current_run_unmapped");
  const [employeePage, setEmployeePage] = useState(0);
  const [employeeMappingDrafts, setEmployeeMappingDrafts] = useState({});
  const [missingPayItemDrafts, setMissingPayItemDrafts] = useState({});
  const [payItemDraft, setPayItemDraft] = useState({
    local_key: "",
    provider_item_id: "",
    provider_item_name: "",
  });
  const [overrideScopeEnabled, setOverrideScopeEnabled] = useState(false);
  const [providerScopeMode, setProviderScopeMode] = useState("all_filtered");
  const [providerSelectedEmployeeIds, setProviderSelectedEmployeeIds] = useState([]);
  const runPanelRef = useRef(null);

  const scopedRecruiters = useMemo(
    () => (departmentFilter ? filteredRecruiters : recruiters),
    [departmentFilter, filteredRecruiters, recruiters]
  );
  const scopedRecruiterIds = useMemo(
    () => truthyIds(scopedRecruiters.map((row) => row.id)),
    [scopedRecruiters]
  );
  const defaultProviderEmployeeIds = useMemo(() => {
    if (selectedRecruiter) {
      return [String(selectedRecruiter)];
    }
    return scopedRecruiterIds;
  }, [scopedRecruiterIds, selectedRecruiter]);
  const defaultProviderScopeMode = useMemo(() => {
    if (defaultProviderEmployeeIds.length > 1) return "custom";
    if (defaultProviderEmployeeIds.length === 1) return "single";
    return "all_filtered";
  }, [defaultProviderEmployeeIds]);
  const availableEmployeeIds = useMemo(() => {
    if (!overrideScopeEnabled) {
      return defaultProviderEmployeeIds;
    }
    if (providerScopeMode === "single") {
      return providerSelectedEmployeeIds[0] ? [providerSelectedEmployeeIds[0]] : [];
    }
    if (providerScopeMode === "custom") {
      return providerSelectedEmployeeIds;
    }
    return scopedRecruiterIds;
  }, [defaultProviderEmployeeIds, overrideScopeEnabled, providerScopeMode, providerSelectedEmployeeIds, scopedRecruiterIds]);
  const selectedEmployeeNames = useMemo(() => {
    const byId = new Map(scopedRecruiters.map((row) => [String(row.id), `${row.first_name} ${row.last_name}`.trim()]));
    return availableEmployeeIds.map((id) => byId.get(String(id)) || `Employee ${id}`);
  }, [availableEmployeeIds, scopedRecruiters]);

  const missingDates = !startDate || !endDate;
  const noExplicitEmployees =
    overrideScopeEnabled &&
    (providerScopeMode === "single" || providerScopeMode === "custom") &&
    availableEmployeeIds.length === 0;
  const canPrepare = !missingDates;

  // Province/state is still owned inside PayrollFilters. For this first pass,
  // provider-sync uses region plus any province/state already present on payroll.
  const provinceOrState = payroll?.state || payroll?.province || null;

  const showMessage = (message, severity = "info") => {
    if (typeof setSnackbar === "function") {
      setSnackbar({ open: true, message, severity });
    }
  };

  const payItemHelperText = (key) => {
    if (key === "vacation_pay") {
      return "Choose or enter the QuickBooks payroll item used for vacation pay. Until QuickBooks item sync is enabled, this can be a temporary code for CSV testing.";
    }
    return "Enter the QuickBooks/payroll item code used for this earning. Until QuickBooks item sync is enabled, this can be a temporary code for CSV testing.";
  };

  const focusRunPanel = () => {
    window.requestAnimationFrame(() => {
      runPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const openEmployeeProfiles = () => {
    window.location.assign("/manager/dashboard?view=employee-profiles");
  };

  const loadMappingData = async () => {
    setMappingLoading(true);
    try {
      const [employeeRes, payItemRes] = await Promise.all([
        payrollProviderSyncApi.listEmployeeMappings(provider),
        payrollProviderSyncApi.listPayItemMappings(provider),
      ]);
      setEmployeeMappings(employeeRes?.items || []);
      setPayItemMappings(payItemRes?.items || []);
    } catch (err) {
      showMessage(await buildRequestErrorMessage(err, "Failed to load provider mappings/history."), "error");
    } finally {
      setMappingLoading(false);
    }
  };

  const loadRunHistory = async (overrides = {}) => {
    const params = {
      provider,
      limit: overrides.limit ?? runHistoryMeta.limit ?? 10,
      offset: overrides.offset ?? runHistoryMeta.offset ?? 0,
      ...(historyStatusFilter ? { status: historyStatusFilter } : {}),
      ...(historyStartFilter ? { start_date: historyStartFilter } : {}),
      ...(historyEndFilter ? { end_date: historyEndFilter } : {}),
      ...overrides,
    };
    setHistoryLoading(true);
    try {
      const runsRes = await payrollProviderSyncApi.listRuns(params);
      setRunHistory(runsRes?.items || []);
      setRunHistoryMeta(runsRes?.pagination || {
        limit: params.limit,
        offset: params.offset,
        has_more: false,
        count: (runsRes?.items || []).length,
      });
      if (selectedRunId && !(runsRes?.items || []).some((item) => item.id === selectedRunId)) {
        // Keep selected run loaded in detail view even when it is outside the current page.
      } else if (!selectedRunId && (runsRes?.items || []).length) {
        setSelectedRunId((runsRes.items[0] || {}).id || null);
      }
    } catch (err) {
      showMessage(await buildRequestErrorMessage(err, "Failed to load provider run history."), "error");
    } finally {
      setHistoryLoading(false);
    }
  };

  const loadSelectedRun = async (runId, { validate = true } = {}) => {
    if (!runId) {
      setSelectedRunId(null);
      setRunData(null);
      setValidationData(null);
      setPayloadPreview(null);
      setRunNotice("");
      return;
    }
    setSelectedRunId(runId);
    try {
      const detail = await payrollProviderSyncApi.runDetail(runId);
      const run = detail?.run || null;
      setRunData(run);
      setRunError("");
      setRunNotice("");
      if (validate && runId) {
        const validated = await payrollProviderSyncApi.validateRun(runId);
        setValidationData(validated?.result || null);
        setRunData(validated?.run || run);
      } else {
        setValidationData(null);
      }
      setPayloadPreview(null);
      focusRunPanel();
    } catch (err) {
      showMessage(await buildRequestErrorMessage(err, "Failed to load provider run detail."), "error");
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
    setRunData(null);
    setValidationData(null);
    setPayloadPreview(null);
    setSelectedRunId(null);
    loadSetupStatus();
    loadMappingData();
    loadRunHistory({ offset: 0 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider]);

  useEffect(() => {
    setEmployeePage(0);
  }, [employeeFilter, employeeSearch, selectedRunId]);

  useEffect(() => {
    setProviderScopeMode(defaultProviderScopeMode);
    setProviderSelectedEmployeeIds(defaultProviderEmployeeIds);
  }, [defaultProviderEmployeeIds, defaultProviderScopeMode]);

  useEffect(() => {
    if (selectedRunId && runData?.id !== selectedRunId) {
      loadSelectedRun(selectedRunId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRunId, runData?.id]);

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
    setRunNotice("");
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
    if (!canPrepare || !previewData) return;
    setCreateLoading(true);
    setRunError("");
    setRunNotice("");
    setValidationData(null);
    setPayloadPreview(null);
    try {
      const data = await payrollProviderSyncApi.createFromRaw(buildRunPayload());
      const createdRun = data?.run || data;
      setRunData(createdRun);
      setSelectedRunId(createdRun?.id || null);
      focusRunPanel();
      await loadMappingData();
      await loadRunHistory({ offset: 0 });
      if (createdRun?.id) {
        const validated = await payrollProviderSyncApi.validateRun(createdRun.id);
        setValidationData(validated?.result || null);
        setRunData(validated?.run || createdRun);
      }
      showMessage("Provider run created.", "success");
    } catch (err) {
      const status = err?.response?.status;
      const duplicateRunId = err?.response?.data?.existing_run_id;
      const duplicateError = err?.response?.data?.error;
      if (status === 409 && duplicateError === "duplicate_source_hash" && duplicateRunId) {
        setRunNotice("A provider run already exists for this same payroll-ready snapshot. We opened the existing run from history.");
        await loadSelectedRun(duplicateRunId);
        await loadRunHistory({ offset: 0 });
        showMessage("Existing provider run opened.", "info");
      } else {
        const message = await buildRequestErrorMessage(err, "Failed to create provider run.");
        setRunError(message);
      }
    } finally {
      setCreateLoading(false);
    }
  };

  const handleValidateRun = async () => {
    if (!runData?.id) return;
    setValidationLoading(true);
    setRunNotice("");
    try {
      const data = await payrollProviderSyncApi.validateRun(runData.id);
      setValidationData(data?.result || data);
      setRunData(data?.run || runData);
      await loadRunHistory();
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
      await loadRunHistory();
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
      await loadRunHistory();
    } catch (err) {
      const status = err?.response?.status;
      const apiError = err?.response?.data?.error;
      if (status === 400 && apiError === "validation_failed") {
        showMessage("CSV cannot be downloaded yet. Fix the items listed in 'Fix before export'.", "error");
      } else {
        showMessage(await buildRequestErrorMessage(err, "Failed to download provider CSV."), "error");
      }
    } finally {
      setDownloadLoading(false);
    }
  };

  const handleHistoryValidate = async (runId, fallbackRun) => {
    try {
      await loadSelectedRun(runId);
      const data = await payrollProviderSyncApi.validateRun(runId);
      setValidationData(data?.result || data);
      setRunData(data?.run || fallbackRun || null);
      focusRunPanel();
      await loadRunHistory();
    } catch (err) {
      showMessage(await buildRequestErrorMessage(err, "Run validation failed."), "error");
    }
  };

  const handleHistoryPreviewPayload = async (runId) => {
    try {
      await loadSelectedRun(runId);
      const data = await payrollProviderSyncApi.quickbooksPayloadPreview(runId);
      setPayloadPreview(data);
      focusRunPanel();
      await loadRunHistory();
    } catch (err) {
      showMessage(await buildRequestErrorMessage(err, "Failed to preview provider payload."), "error");
    }
  };

  const handleHistoryCsvDownload = async (runId, fallbackProvider) => {
    try {
      await loadSelectedRun(runId);
      const resp = await payrollProviderSyncApi.csvDownload(runId);
      const blob = new Blob([resp.data], { type: resp.headers["content-type"] || "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `provider_run_${runId}_${fallbackProvider || provider}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      await loadRunHistory();
      focusRunPanel();
    } catch (err) {
      showMessage(await buildRequestErrorMessage(err, "Failed to download provider CSV."), "error");
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

  const selectedHistoryRun = useMemo(
    () => (runHistory || []).find((item) => item.id === selectedRunId) || null,
    [runHistory, selectedRunId]
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
  const requiredPayItemKeys = sortPayItemKeys(validationData?.required_pay_item_keys_for_run || currentRunKeys);
  const missingPayItemKeys = validationData?.missing_pay_item_keys || [];
  const optionalMappedPayItemKeys = sortPayItemKeys(
    validationData?.optional_mapped_pay_item_keys || Array.from(mappedPayItemKeys).filter((key) => !requiredPayItemKeys.includes(key)).sort()
  );
  const corePayItemMappings = useMemo(
    () =>
      [...payItemMappings.filter((row) => CORE_PAY_ITEM_KEYS.includes(row.local_key))].sort(
        (a, b) => comparePayItemKey(a.local_key, b.local_key)
      ),
    [payItemMappings]
  );
  const optionalPayItemMappings = useMemo(
    () =>
      [...payItemMappings.filter((row) => !CORE_PAY_ITEM_KEYS.includes(row.local_key))].sort(
        (a, b) => comparePayItemKey(a.local_key, b.local_key)
      ),
    [payItemMappings]
  );
  const unmappedEmployeeIdsFromValidation = formatList(validationData?.missing_employee_map_ids).map((id) => String(id));
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
  const selectedRunAdjustmentTotal = formatNumber(runData?.request_payload_json?.adjustments?.adjustment_total);
  const selectedRunAdjustmentCount = formatNumber(runData?.request_payload_json?.adjustments?.adjustment_line_count);
  const previewBlockingErrors = formatList(previewData?.errors).filter(isBlockingPreviewIssue);
  const previewCapabilityWarnings = formatList(previewData?.errors).filter(isNonBlockingCapabilityIssue);
  const previewHasNoExportableData = Boolean(previewData) &&
    formatNumber(previewData?.line_count) === 0 &&
    formatNumber(previewData?.adjustment_line_count) === 0;
  const validationOnlyCapabilityLimitation =
    Boolean(validationData?.errors?.length) &&
    (validationData?.csv_download_allowed === true) &&
    (validationData?.csv_blocking_errors || []).length === 0;
  const csvDownloadAllowed = Boolean(runData?.id && validationData && (validationData?.csv_download_allowed ?? false));
  const csvBlockingErrors = validationData?.csv_blocking_errors || [];
  const fixBeforeExportIssues = csvBlockingErrors.length ? csvBlockingErrors : previewBlockingErrors;
  const hasFixBeforeExportIssues = fixBeforeExportIssues.length > 0;
  const currentRunContext = { runRows: currentRunRows, recruiters: scopedRecruiters };
  const previewIssueContext = { runRows: [], recruiters: scopedRecruiters };
  const missingEmployeeIssueRows = useMemo(() => {
    const rows = unmappedRunEmployees.map((row) => ({
      employee_id: row.employee_id,
      employee_name: row.employee_name_snapshot || `Employee ${row.employee_id}`,
      employee_email: row.employee_email_snapshot || "",
      provider_employee_id: "",
      source: "run_unmapped",
    }));
    unmappedEmployeeIdsFromValidation.forEach((employeeId) => {
      if (rows.some((row) => String(row.employee_id) === String(employeeId))) return;
      const recruiter = scopedRecruiters.find((row) => String(row.id) === String(employeeId));
      rows.push({
        employee_id: employeeId,
        employee_name: recruiter ? `${recruiter.first_name} ${recruiter.last_name}`.trim() : `Employee ${employeeId}`,
        employee_email: recruiter?.email || "",
        provider_employee_id: "",
        source: "validation_unmapped",
      });
    });
    return rows;
  }, [scopedRecruiters, unmappedEmployeeIdsFromValidation, unmappedRunEmployees]);
  const chipSx = {
    active: {
      bgcolor: "#173a7a",
      color: "#ffffff",
      border: "1px solid #173a7a",
      fontWeight: 700,
    },
    neutral: {
      bgcolor: "#eef3ff",
      color: "#173a7a",
      border: "1px solid #cad8ff",
      fontWeight: 700,
    },
    success: {
      bgcolor: "#1f6b43",
      color: "#ffffff",
      border: "1px solid #1f6b43",
      fontWeight: 700,
    },
    warning: {
      bgcolor: "#fff1cf",
      color: "#6f4600",
      border: "1px solid #f2cb6b",
      fontWeight: 700,
    },
    danger: {
      bgcolor: "#ffe1df",
      color: "#8a1c16",
      border: "1px solid #ef9a95",
      fontWeight: 700,
    },
  };

  const employeeMappingRows = useMemo(() => {
    const mappedRows = employeeMappings.filter((row) => row.provider === provider);
    const currentUnmappedIds = new Set(unmappedRunEmployees.map((row) => String(row.employee_id)));
    let rows = [];
    if (employeeFilter === "current_run_unmapped") {
      rows = unmappedRunEmployees.map((row) => ({
        employee_id: row.employee_id,
        employee_name: row.employee_name_snapshot || `Employee ${row.employee_id}`,
        employee_email: row.employee_email_snapshot || "",
        provider_employee_id: "",
        provider_environment: runData?.provider_environment,
        source: "run_unmapped",
      }));
    } else if (employeeFilter === "unmapped_all") {
      rows = mappedRows
        .filter(() => false);
      const mappedIds = new Set(mappedRows.filter((item) => item.provider_employee_id).map((item) => String(item.employee_id)));
      rows = (filteredRecruiters.length ? filteredRecruiters : []).filter((row) => !mappedIds.has(String(row.id))).map((row) => ({
        employee_id: row.id,
        employee_name: row.name || `${row.first_name || ""} ${row.last_name || ""}`.trim() || `Employee ${row.id}`,
        employee_email: row.email || "",
        provider_employee_id: "",
        source: currentUnmappedIds.has(String(row.id)) ? "run_unmapped" : "company_unmapped",
      }));
    } else if (employeeFilter === "mapped") {
      rows = mappedRows.filter((row) => row.provider_employee_id).map((row) => ({
        employee_id: row.employee_id,
        employee_name: row.employee_name || `Employee ${row.employee_id}`,
        employee_email: row.employee_email || "",
        provider_employee_id: row.provider_employee_id,
        provider_environment: row.provider_environment,
        source: "mapped",
      }));
    } else {
      rows = [
        ...mappedRows.map((row) => ({
          employee_id: row.employee_id,
          employee_name: row.employee_name || `Employee ${row.employee_id}`,
          employee_email: row.employee_email || "",
          provider_employee_id: row.provider_employee_id,
          provider_environment: row.provider_environment,
          source: row.provider_employee_id ? "mapped" : "company_unmapped",
        })),
        ...unmappedRunEmployees
          .filter((row) => !mappedRows.some((mapped) => String(mapped.employee_id) === String(row.employee_id)))
          .map((row) => ({
            employee_id: row.employee_id,
            employee_name: row.employee_name_snapshot || `Employee ${row.employee_id}`,
            employee_email: row.employee_email_snapshot || "",
            provider_employee_id: "",
            provider_environment: runData?.provider_environment,
            source: "run_unmapped",
          })),
      ];
    }
    const search = employeeSearch.trim().toLowerCase();
    if (search) {
      rows = rows.filter((row) =>
        [row.employee_name, row.employee_email, row.provider_employee_id, row.employee_id]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(search))
      );
    }
    const seen = new Set();
    return rows.filter((row) => {
      const key = `${row.employee_id}:${row.source}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [employeeMappings, employeeFilter, employeeSearch, filteredRecruiters, provider, runData?.provider_environment, unmappedRunEmployees]);
  const previewMissingEmployeeIssueRows = formatList(previewBlockingErrors)
    .filter((item) => EMPLOYEE_MAPPING_ERROR_CODES.has(issueCode(item)) && item?.employee_id)
    .map((item) => {
      const recruiter = scopedRecruiters.find((row) => String(row.id) === String(item.employee_id));
      return {
        employee_id: item.employee_id,
        employee_name: recruiter ? `${recruiter.first_name} ${recruiter.last_name}`.trim() : employeeLabelFromContext(item.employee_id, [], scopedRecruiters),
        employee_email: recruiter?.email || "",
      };
    });
  const previewMissingPayItemKeys = sortPayItemKeys(
    formatList(previewBlockingErrors)
      .filter((item) => PAY_ITEM_MAPPING_ERROR_CODES.has(issueCode(item)) && item?.key)
      .map((item) => item.key)
  );
  const previewMissingRegionRows = formatList(previewBlockingErrors)
    .filter((item) => REGION_METADATA_ERROR_CODES.has(issueCode(item)) && item?.employee_id)
    .map((item) => ({
      employee_id: item.employee_id,
      employee_name: employeeLabelFromContext(item.employee_id, [], scopedRecruiters),
    }));
  const createRunLabel = hasFixBeforeExportIssues ? "Create run to fix mappings" : "Create provider run";
  const csvBlockedReasonText = !runData?.id
    ? "Create or select a provider run first."
    : !validationData
      ? "Validate this run before exporting CSV."
      : csvBlockingErrors.length
        ? "Fix the items listed in 'Fix before export' before downloading CSV."
        : "";
  const employeePageSize = 10;
  const pagedEmployeeMappingRows = useMemo(
    () => employeeMappingRows.slice(employeePage * employeePageSize, (employeePage + 1) * employeePageSize),
    [employeeMappingRows, employeePage]
  );

  const handleEmployeeMapChange = (employeeId, value) => {
    setEmployeeMappingDrafts((prev) => ({ ...prev, [employeeId]: value }));
  };

  const saveEmployeeMapping = async (row) => {
    const providerEmployeeId = (employeeMappingDrafts[row.employee_id] || "").trim();
    if (!providerEmployeeId) {
      showMessage("QuickBooks employee ID or payroll employee code is required.", "warning");
      return;
    }
    try {
      await payrollProviderSyncApi.linkEmployeeMapping(row.employee_id, {
        provider,
        provider_employee_id: providerEmployeeId,
        provider_display_name: row.employee_name_snapshot || row.employee_name,
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
      await loadRunHistory();
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

  const saveMissingPayItemMapping = async (localKey) => {
    const draft = missingPayItemDrafts[localKey] || {};
    const providerItemId = String(draft.provider_item_id || "").trim();
    const providerItemName = String(draft.provider_item_name || "").trim();
    if (!providerItemId) {
      showMessage("QuickBooks/payroll item code is required.", "warning");
      return;
    }
    try {
      await payrollProviderSyncApi.upsertPayItemMapping({
        provider,
        local_key: localKey,
        item_category: localKey === "non_taxable_reimbursement" ? "reimbursement" : "earning",
        provider_item_id: providerItemId,
        provider_item_name: providerItemName || localKey,
      });
      setMissingPayItemDrafts((prev) => ({
        ...prev,
        [localKey]: { provider_item_id: "", provider_item_name: "" },
      }));
      await loadMappingData();
      if (runData?.id) {
        const validated = await payrollProviderSyncApi.validateRun(runData.id);
        setValidationData(validated?.result || validationData);
        setRunData(validated?.run || runData);
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
          <Chip label="QuickBooks official import format: not verified yet" sx={chipSx.warning} />
          <Chip label="Provider Sync = recommended payroll handoff workflow" sx={chipSx.success} />
        </Stack>
        <Alert severity="info" sx={{ mt: 2 }}>
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
              <Chip label="QuickBooks" sx={provider === "quickbooks" ? chipSx.active : chipSx.neutral} />
              <Chip label="CSV fallback" sx={provider === "csv_provider" ? chipSx.active : chipSx.neutral} />
              <Chip label="Xero coming later" sx={chipSx.neutral} />
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      <Accordion elevation={2} defaultExpanded={false} disableGutters>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">QuickBooks connection and setup</Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ p: 3 }}>
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

        {setupError && (
          <Alert severity={setupError.includes("not enabled") ? "info" : "warning"} sx={{ mb: 2 }}>
            {setupError}
          </Alert>
        )}
        {isQuickBooksAccountingOnly && (
          <Alert severity="info" sx={{ mb: 2 }}>
            QuickBooks accounting is connected. Live QuickBooks payroll/time submit is not enabled. CSV fallback is available.
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
        </AccordionDetails>
      </Accordion>


      <Paper elevation={2} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Step 1: Review payroll-ready data
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Provider Sync uses the current Payroll filters by default. Review the active period and employee scope before previewing payroll-ready data.
        </Typography>
        <Alert severity="info" sx={{ mb: 2 }}>
          Provider Sync CSV is the recommended handoff for accountants, payroll providers, and QuickBooks review workflows. Use this CSV for live QuickBooks/accountant testing. It is not yet a verified official QuickBooks Payroll import format.
        </Alert>
        <Alert severity={overrideScopeEnabled ? "warning" : "info"} sx={{ mb: 2 }}>
          {overrideScopeEnabled ? "Provider Sync override is active. This ignores the main Payroll employee filter." : "Using current Payroll filters."}
        </Alert>
        {missingDates && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Start date and end date are required before preparing provider-sync data.
          </Alert>
        )}
        {noExplicitEmployees && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            No Provider Sync employees are selected yet. Choose one employee or a custom employee list before preparing payroll-ready data.
          </Alert>
        )}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} md={3}><Typography variant="body2"><strong>Region:</strong> {region || "—"}</Typography></Grid>
          <Grid item xs={12} md={3}><Typography variant="body2"><strong>Province/state:</strong> {provinceOrState || "—"}</Typography></Grid>
          <Grid item xs={12} md={3}><Typography variant="body2"><strong>Start date:</strong> {startDate || "—"}</Typography></Grid>
          <Grid item xs={12} md={3}><Typography variant="body2"><strong>End date:</strong> {endDate || "—"}</Typography></Grid>
          <Grid item xs={12} md={6}><Typography variant="body2"><strong>Department filter:</strong> {departmentFilter || "All departments"}</Typography></Grid>
          <Grid item xs={12} md={3}><Typography variant="body2"><strong>Pay frequency:</strong> {payFrequency || "—"}</Typography></Grid>
          <Grid item xs={12} md={9}><Typography variant="body2"><strong>Selected employees:</strong> {selectedEmployeeNames.join(", ") || `${availableEmployeeIds.length || 0} employee(s)`}</Typography></Grid>
        </Grid>
        <Accordion elevation={0} disableGutters>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle2">Advanced: Override employee scope for Provider Sync</Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ px: 0 }}>
            <Stack spacing={2}>
              <Alert severity={overrideScopeEnabled ? "warning" : "info"}>
                {overrideScopeEnabled
                  ? "Provider Sync override is active. This tab will ignore the main Payroll employee filter until you turn the override off."
                  : "Override is off. Provider Sync is using the current Payroll filters."}
              </Alert>
              <Button
                variant={overrideScopeEnabled ? "contained" : "outlined"}
                onClick={() => setOverrideScopeEnabled((value) => !value)}
                sx={{ alignSelf: "flex-start" }}
              >
                {overrideScopeEnabled ? "Turn off Provider Sync override" : "Turn on Provider Sync override"}
              </Button>
              {overrideScopeEnabled && (
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth size="small">
                      <InputLabel id="provider-sync-scope-label">Provider Sync employee scope</InputLabel>
                      <Select
                        labelId="provider-sync-scope-label"
                        label="Provider Sync employee scope"
                        value={providerScopeMode}
                        onChange={(event) => {
                          const nextMode = event.target.value;
                          setProviderScopeMode(nextMode);
                          if (nextMode === "all_filtered") {
                            setProviderSelectedEmployeeIds([]);
                          } else if (nextMode === "single") {
                            setProviderSelectedEmployeeIds(defaultProviderEmployeeIds.slice(0, 1));
                          } else {
                            setProviderSelectedEmployeeIds(defaultProviderEmployeeIds);
                          }
                        }}
                      >
                        <MenuItem value="all_filtered">
                          {departmentFilter ? "All employees in selected department" : "All employees in Provider Sync"}
                        </MenuItem>
                        <MenuItem value="single">One employee only</MenuItem>
                        <MenuItem value="custom">Custom employee selection</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  {providerScopeMode === "single" && (
                    <Grid item xs={12} md={8}>
                      <FormControl fullWidth size="small">
                        <InputLabel id="provider-sync-single-employee-label">Employee</InputLabel>
                        <Select
                          labelId="provider-sync-single-employee-label"
                          label="Employee"
                          value={providerSelectedEmployeeIds[0] || ""}
                          onChange={(event) => setProviderSelectedEmployeeIds(event.target.value ? [String(event.target.value)] : [])}
                        >
                          {scopedRecruiters.map((row) => (
                            <MenuItem key={row.id} value={String(row.id)}>
                              {row.first_name} {row.last_name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                  )}
                  {providerScopeMode === "custom" && (
                    <Grid item xs={12} md={8}>
                      <FormControl fullWidth size="small">
                        <InputLabel id="provider-sync-custom-employees-label">Employees</InputLabel>
                        <Select
                          multiple
                          labelId="provider-sync-custom-employees-label"
                          label="Employees"
                          value={providerSelectedEmployeeIds}
                          onChange={(event) => setProviderSelectedEmployeeIds(truthyIds(event.target.value))}
                          renderValue={(selected) =>
                            truthyIds(selected)
                              .map((id) => {
                                const row = scopedRecruiters.find((item) => String(item.id) === String(id));
                                return row ? `${row.first_name} ${row.last_name}` : id;
                              })
                              .join(", ")
                          }
                        >
                          {scopedRecruiters.map((row) => (
                            <MenuItem key={row.id} value={String(row.id)}>
                              {row.first_name} {row.last_name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                  )}
                </Grid>
              )}
            </Stack>
          </AccordionDetails>
        </Accordion>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
          <Button variant="contained" onClick={handlePreview} disabled={!canPrepare || previewLoading}>
            {previewLoading ? <CircularProgress size={18} /> : "Preview payroll-ready data"}
          </Button>
          <Tooltip title={previewData ? "" : "Preview payroll-ready data first."}>
            <span>
              <Button variant="outlined" onClick={handleCreateRun} disabled={!canPrepare || createLoading || !previewData}>
                {createLoading ? <CircularProgress size={18} /> : createRunLabel}
              </Button>
            </span>
          </Tooltip>
        </Stack>

        {(previewError || previewData) && <Divider sx={{ my: 2 }} />}
        {previewError && <Alert severity="error" sx={{ mb: 2 }}>{previewError}</Alert>}
        {previewData && (
          <>
            {previewData.saved_adjustments_included ? (
              <Alert severity="info" sx={{ mb: 2 }}>
                Saved Payroll Preview adjustments will be included.
              </Alert>
            ) : (
              <Alert severity="info" sx={{ mb: 2 }}>
                No saved Payroll Preview adjustments found for this period. Provider Sync will use approved time and leave only.
              </Alert>
            )}
            {previewHasNoExportableData && (
              <Alert severity="info" sx={{ mb: 2 }}>
                No payroll-ready time, leave, or saved adjustments were found for this selection.
              </Alert>
            )}
            {previewCapabilityWarnings.length > 0 && (
              <Alert severity="info" sx={{ mb: 2 }}>
                {renderManagerMessages(previewCapabilityWarnings, previewIssueContext)}
              </Alert>
            )}
            <Grid container spacing={2}>
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
            </Grid>
          </>
        )}
      </Paper>

      {(previewData || validationData) && (
        <Paper elevation={2} sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Step 2: Fix before export</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Fix employee mappings, pay item mappings, and employee metadata before exporting Provider Sync CSV.
          </Typography>
          {sourceHashChanged && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Source hash changed since an earlier run for this same period. Review the saved adjustments and approved time before exporting.
            </Alert>
          )}
          {hasFixBeforeExportIssues ? (
            <Alert severity="warning" sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Fix before export</Typography>
              {renderManagerMessages(fixBeforeExportIssues, validationData ? currentRunContext : previewIssueContext)}
            </Alert>
          ) : (
            <Alert severity="success" sx={{ mb: 2 }}>
              No blocking setup issues were found for this selection.
            </Alert>
          )}
          {validationOnlyCapabilityLimitation && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Live QuickBooks payroll/time submit is not enabled. CSV export is still available.
            </Alert>
          )}
          {previewMissingEmployeeIssueRows.length > 0 && !validationData && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Missing employee mappings</Typography>
              <Alert severity="info" sx={{ mb: 2 }}>
                For CSV testing, you can enter a temporary code. For real QuickBooks sync, this should match the employee record in QuickBooks.
              </Alert>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mb: 2 }}>
                <Tooltip title="Available after QuickBooks production payroll/time access is enabled.">
                  <span>
                    <Button variant="outlined" disabled>Import employees from QuickBooks</Button>
                  </span>
                </Tooltip>
              </Stack>
              <Stack spacing={2}>
                {previewMissingEmployeeIssueRows.map((row) => (
                  <Grid container spacing={2} key={`preview-missing-employee-${row.employee_id}`} alignItems="center">
                    <Grid item xs={12} md={4}>
                      <Typography variant="body2"><strong>{row.employee_name}</strong></Typography>
                      <Typography variant="caption" color="text.secondary">{row.employee_email || `Employee ID ${row.employee_id}`}</Typography>
                    </Grid>
                    <Grid item xs={12} md={5}>
                      <TextField
                        fullWidth
                        size="small"
                        label="QuickBooks employee ID or payroll employee code"
                        helperText="For CSV testing, you can enter a temporary code. For real QuickBooks sync, this should match the employee record in QuickBooks."
                        value={employeeMappingDrafts[row.employee_id] ?? ""}
                        onChange={(event) => handleEmployeeMapChange(row.employee_id, event.target.value)}
                      />
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <Button variant="outlined" onClick={() => saveEmployeeMapping(row)}>Save employee mapping</Button>
                    </Grid>
                  </Grid>
                ))}
              </Stack>
            </Box>
          )}
          {validationData && missingEmployeeIssueRows.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Missing employee mappings</Typography>
              <Alert severity="info" sx={{ mb: 2 }}>
                For CSV testing, you can enter a temporary code. For real QuickBooks sync, this should match the employee record in QuickBooks.
              </Alert>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mb: 2 }}>
                <Tooltip title="Available after QuickBooks production payroll/time access is enabled.">
                  <span>
                    <Button variant="outlined" disabled>Import employees from QuickBooks</Button>
                  </span>
                </Tooltip>
              </Stack>
              <Stack spacing={2}>
                {missingEmployeeIssueRows.map((row) => (
                  <Grid container spacing={2} key={`missing-employee-${row.employee_id}`} alignItems="center">
                    <Grid item xs={12} md={4}>
                      <Typography variant="body2"><strong>{row.employee_name}</strong></Typography>
                      <Typography variant="caption" color="text.secondary">{row.employee_email || `Employee ID ${row.employee_id}`}</Typography>
                    </Grid>
                    <Grid item xs={12} md={5}>
                      <TextField
                        fullWidth
                        size="small"
                        label="QuickBooks employee ID or payroll employee code"
                        helperText="For CSV testing, you can enter a temporary code. For real QuickBooks sync, this should match the employee record in QuickBooks."
                        value={employeeMappingDrafts[row.employee_id] ?? ""}
                        onChange={(event) => handleEmployeeMapChange(row.employee_id, event.target.value)}
                      />
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <Button variant="outlined" onClick={() => saveEmployeeMapping(row)}>Save employee mapping</Button>
                    </Grid>
                  </Grid>
                ))}
              </Stack>
            </Box>
          )}
          {previewMissingPayItemKeys.length > 0 && !validationData && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Missing pay item mappings</Typography>
              <Alert severity="info" sx={{ mb: 2 }}>
                Today this mapping is manual. Later, once QuickBooks payroll/time API access is enabled, Schedulaa will be able to fetch QuickBooks employees and pay items for easier selection.
              </Alert>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mb: 2 }}>
                <Tooltip title="Available after QuickBooks production payroll/time access is enabled.">
                  <span>
                    <Button variant="outlined" disabled>Import pay items from QuickBooks</Button>
                  </span>
                </Tooltip>
              </Stack>
              <Stack spacing={2}>
                {previewMissingPayItemKeys.map((key) => (
                  <Grid container spacing={2} key={`preview-missing-pay-item-${key}`} alignItems="center">
                    <Grid item xs={12} md={3}>
                      <Typography variant="body2"><strong>{payItemLabel[key] || key}</strong></Typography>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        size="small"
                        label="QuickBooks/payroll item code"
                        helperText={payItemHelperText(key)}
                        value={missingPayItemDrafts[key]?.provider_item_id || ""}
                        onChange={(event) => setMissingPayItemDrafts((prev) => ({ ...prev, [key]: { ...(prev[key] || {}), provider_item_id: event.target.value } }))}
                      />
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Display name"
                        value={missingPayItemDrafts[key]?.provider_item_name || ""}
                        onChange={(event) => setMissingPayItemDrafts((prev) => ({ ...prev, [key]: { ...(prev[key] || {}), provider_item_name: event.target.value } }))}
                      />
                    </Grid>
                    <Grid item xs={12} md={2}>
                      <Button variant="outlined" onClick={() => saveMissingPayItemMapping(key)}>Save</Button>
                    </Grid>
                  </Grid>
                ))}
              </Stack>
            </Box>
          )}
          {validationData && missingPayItemKeys.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Missing pay item mappings</Typography>
              <Alert severity="info" sx={{ mb: 2 }}>
                Today this mapping is manual. Later, once QuickBooks payroll/time API access is enabled, Schedulaa will be able to fetch QuickBooks employees and pay items for easier selection.
              </Alert>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mb: 2 }}>
                <Tooltip title="Available after QuickBooks production payroll/time access is enabled.">
                  <span>
                    <Button variant="outlined" disabled>Import pay items from QuickBooks</Button>
                  </span>
                </Tooltip>
              </Stack>
              <Stack spacing={2}>
                {missingPayItemKeys.map((key) => (
                  <Grid container spacing={2} key={`missing-pay-item-${key}`} alignItems="center">
                    <Grid item xs={12} md={3}>
                      <Typography variant="body2"><strong>{payItemLabel[key] || key}</strong></Typography>
                      <Typography variant="caption" color="text.secondary">{managerFriendlyMessage({ code: "MISSING_PAY_ITEM_MAP", key })}</Typography>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        size="small"
                        label="QuickBooks/payroll item code"
                        helperText={payItemHelperText(key)}
                        value={missingPayItemDrafts[key]?.provider_item_id || ""}
                        onChange={(event) => setMissingPayItemDrafts((prev) => ({ ...prev, [key]: { ...(prev[key] || {}), provider_item_id: event.target.value } }))}
                      />
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Display name"
                        value={missingPayItemDrafts[key]?.provider_item_name || ""}
                        onChange={(event) => setMissingPayItemDrafts((prev) => ({ ...prev, [key]: { ...(prev[key] || {}), provider_item_name: event.target.value } }))}
                      />
                    </Grid>
                    <Grid item xs={12} md={2}>
                      <Button variant="outlined" onClick={() => saveMissingPayItemMapping(key)}>Save</Button>
                    </Grid>
                  </Grid>
                ))}
              </Stack>
            </Box>
          )}
          {(previewMissingRegionRows.length > 0 || formatList(csvBlockingErrors).some((item) => REGION_METADATA_ERROR_CODES.has(issueCode(item)))) && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Missing employee country/province metadata</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Open employee profiles and fill country/province before exporting CSV.
              </Typography>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                <Button variant="outlined" onClick={openEmployeeProfiles}>Open employee profiles</Button>
              </Stack>
            </Box>
          )}
          <Accordion elevation={0} disableGutters>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle2">Advanced mapping management</Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ px: 0 }}>
              <Stack spacing={3}>
                <Box>
                  <Typography variant="subtitle2" gutterBottom>Employee mapping management</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Legacy external payroll employee IDs are bootstrap-only. Live Provider Sync uses PayrollProviderEmployeeMap only.
                  </Typography>
                  <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid item xs={12} md={5}>
                      <TextField fullWidth size="small" label="Search employees or provider IDs" value={employeeSearch} onChange={(event) => setEmployeeSearch(event.target.value)} />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <FormControl fullWidth size="small">
                        <InputLabel id="provider-sync-employee-filter-label">Employee filter</InputLabel>
                        <Select labelId="provider-sync-employee-filter-label" label="Employee filter" value={employeeFilter} onChange={(event) => { setEmployeeFilter(event.target.value); setEmployeePage(0); }}>
                          <MenuItem value="current_run_unmapped">Current-run unmapped</MenuItem>
                          <MenuItem value="unmapped_all">All unmapped</MenuItem>
                          <MenuItem value="mapped">Mapped only</MenuItem>
                          <MenuItem value="all">All visible</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} md={3}><Typography variant="body2" color="text.secondary" sx={{ pt: 1 }}>Showing {pagedEmployeeMappingRows.length} of {employeeMappingRows.length}</Typography></Grid>
                  </Grid>
                  {!employeeMappingRows.length ? (
                    <Alert severity="success">{runData ? "No employees in the current view need mapping attention." : "No employee mappings to review in the current filter."}</Alert>
                  ) : (
                    <Stack spacing={2}>
                      {pagedEmployeeMappingRows.map((row) => (
                        <Grid container spacing={2} key={`${row.employee_id}-${row.source}`} alignItems="center">
                          <Grid item xs={12} md={3}>
                            <Typography variant="body2"><strong>{row.employee_name || row.employee_name_snapshot || `Employee ${row.employee_id}`}</strong></Typography>
                            <Typography variant="caption" color="text.secondary">Employee ID {row.employee_id}{row.employee_email ? ` • ${row.employee_email}` : ""}</Typography>
                          </Grid>
                          <Grid item xs={12} md={2}>
                            <Chip size="small" sx={row.provider_employee_id ? chipSx.success : chipSx.warning} label={row.provider_employee_id ? "Mapped" : row.source === "run_unmapped" ? "Current run unmapped" : "Needs mapping"} />
                          </Grid>
                          <Grid item xs={12} md={4}>
                            <TextField
                              fullWidth
                              size="small"
                              label="QuickBooks employee ID or payroll employee code"
                              helperText="For CSV testing, you can enter a temporary code. For real QuickBooks sync, this should match the employee record in QuickBooks."
                              value={employeeMappingDrafts[row.employee_id] ?? row.provider_employee_id ?? ""}
                              onChange={(event) => handleEmployeeMapChange(row.employee_id, event.target.value)}
                            />
                          </Grid>
                          <Grid item xs={12} md={3}>
                            <Button variant="outlined" onClick={() => saveEmployeeMapping(row)}>Save employee mapping</Button>
                          </Grid>
                        </Grid>
                      ))}
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <Button variant="outlined" disabled={employeePage === 0} onClick={() => setEmployeePage((page) => Math.max(0, page - 1))}>Previous</Button>
                        <Button variant="outlined" disabled={(employeePage + 1) * employeePageSize >= employeeMappingRows.length} onClick={() => setEmployeePage((page) => page + 1)}>Next</Button>
                      </Stack>
                    </Stack>
                  )}
                </Box>
                <Box>
                  <Typography variant="subtitle2" gutterBottom>Pay item mapping management</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Core payroll mappings appear first. Optional payroll adjustment mappings are available for future periods and only become required when those lines exist in a selected run.
                  </Typography>
                  <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid item xs={12} md={4}>
                      <FormControl fullWidth size="small">
                        <InputLabel id="provider-sync-local-key-label">Local key</InputLabel>
                        <Select labelId="provider-sync-local-key-label" label="Local key" value={payItemDraft.local_key} onChange={(event) => setPayItemDraft((prev) => ({ ...prev, local_key: event.target.value }))}>
                          {sortPayItemKeys(Object.keys(payItemLabel)).map((key) => (
                            <MenuItem key={key} value={key}>{payItemLabel[key] || key}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} md={4}><TextField fullWidth size="small" label="QuickBooks/payroll item code" value={payItemDraft.provider_item_id} onChange={(event) => setPayItemDraft((prev) => ({ ...prev, provider_item_id: event.target.value }))} /></Grid>
                    <Grid item xs={12} md={4}><TextField fullWidth size="small" label="Display name" value={payItemDraft.provider_item_name} onChange={(event) => setPayItemDraft((prev) => ({ ...prev, provider_item_name: event.target.value }))} /></Grid>
                    <Grid item xs={12}><Button variant="outlined" onClick={savePayItemMapping}>Save pay item mapping</Button></Grid>
                  </Grid>
                  <Typography variant="subtitle2" gutterBottom>Core payroll mappings</Typography>
                  <Table size="small" sx={{ mb: 2 }}>
                    <TableHead>
                      <TableRow>
                        <TableCell>Local key</TableCell>
                        <TableCell>Category</TableCell>
                        <TableCell>QuickBooks/payroll item code</TableCell>
                        <TableCell>Display name</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {corePayItemMappings.map((row) => (
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
                  <Accordion elevation={0} disableGutters>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography variant="subtitle2">Optional payroll adjustment mappings</Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={{ px: 0 }}>
                      {!optionalPayItemMappings.length ? (
                        <Typography variant="body2" color="text.secondary">No optional payroll adjustment mappings are available yet.</Typography>
                      ) : (
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Local key</TableCell>
                              <TableCell>Category</TableCell>
                              <TableCell>QuickBooks/payroll item code</TableCell>
                              <TableCell>Display name</TableCell>
                              <TableCell>Status</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {optionalPayItemMappings.map((row) => (
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
                      )}
                    </AccordionDetails>
                  </Accordion>
                </Box>
              </Stack>
            </AccordionDetails>
          </Accordion>
          <Accordion elevation={0} disableGutters>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle2">Technical details</Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ px: 0 }}>
              {previewData && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2">Preview errors</Typography>
                  {renderJsonList(previewData.errors)}
                </Box>
              )}
              {validationData && (
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2">Validation errors</Typography>
                    {renderJsonList(validationData.errors)}
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2">Validation warnings</Typography>
                    {renderJsonList(validationData.warnings)}
                  </Grid>
                </Grid>
              )}
            </AccordionDetails>
          </Accordion>
        </Paper>
      )}

      <Paper elevation={2} sx={{ p: 3 }} ref={runPanelRef}>
        <Typography variant="h6" gutterBottom>Step 3: Provider run</Typography>
        {!runData ? (
          <Alert severity="info">
            No provider run selected. Create a run or select one from history.
          </Alert>
        ) : (
          <>
            {runNotice && <Alert severity="info" sx={{ mb: 2 }}>{runNotice}</Alert>}
            {runError && <Alert severity="error" sx={{ mb: 2 }}>{runError}</Alert>}
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={12} md={2}><Typography variant="body2"><strong>Run ID:</strong> {runData.id}</Typography></Grid>
              <Grid item xs={12} md={3}><Typography variant="body2"><strong>Period:</strong> {runData.start_date} to {runData.end_date}</Typography></Grid>
              <Grid item xs={12} md={2}><Typography variant="body2"><strong>Status:</strong> {runData.status || "—"}</Typography></Grid>
              <Grid item xs={12} md={2}><Typography variant="body2"><strong>Employees:</strong> {runData.employee_count ?? 0}</Typography></Grid>
              <Grid item xs={12} md={2}><Typography variant="body2"><strong>Lines:</strong> {runData.time_entry_count ?? 0}</Typography></Grid>
              <Grid item xs={12} md={3}><Typography variant="body2"><strong>Total hours:</strong> {runData.total_hours ?? 0}</Typography></Grid>
              <Grid item xs={12} md={3}><Typography variant="body2"><strong>Adjustment lines:</strong> {selectedRunAdjustmentCount}</Typography></Grid>
              <Grid item xs={12} md={3}><Typography variant="body2"><strong>Adjustment total:</strong> {selectedRunAdjustmentTotal}</Typography></Grid>
              <Grid item xs={12} md={3}><Typography variant="body2"><strong>Validation status:</strong> {validationData?.status || "Not validated yet"}</Typography></Grid>
            </Grid>
            <Accordion elevation={0} disableGutters sx={{ mb: 2 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle2">Source hash details</Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 0 }}>
                <Typography variant="body2">
                  <strong>Source hash:</strong>{" "}
                  <Tooltip title={runData.source_hash || "—"}>
                    <Box component="span" sx={{ fontFamily: "monospace" }}>{shortenHash(runData.source_hash)}</Box>
                  </Tooltip>
                </Typography>
              </AccordionDetails>
            </Accordion>
            {hasFixBeforeExportIssues && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Fix before export</Typography>
                {renderManagerMessages(fixBeforeExportIssues, validationData ? currentRunContext : previewIssueContext)}
              </Alert>
            )}
            {validationOnlyCapabilityLimitation && (
              <Alert severity="info" sx={{ mb: 2 }}>
                Live QuickBooks payroll/time submit is not enabled. CSV export is still available.
              </Alert>
            )}
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
              <Button variant="contained" onClick={handleValidateRun} disabled={validationLoading}>
                {validationLoading ? <CircularProgress size={18} /> : "Validate run"}
              </Button>
              <Button variant="outlined" onClick={handlePreviewPayload} disabled={payloadLoading || provider !== "quickbooks" || !runData?.id}>
                {payloadLoading ? <CircularProgress size={18} /> : "Preview QuickBooks payload"}
              </Button>
              <Tooltip title={csvBlockedReasonText}>
                <span>
                  <Button variant="outlined" onClick={handleCsvDownload} disabled={downloadLoading || !csvDownloadAllowed}>
                    {downloadLoading ? <CircularProgress size={18} /> : "Download Provider Sync CSV"}
                  </Button>
                </span>
              </Tooltip>
            </Stack>
            {csvBlockedReasonText && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {csvBlockedReasonText}
              </Typography>
            )}
          </>
        )}
      </Paper>

      {runData && (
        <Paper elevation={2} sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Step 4: Export</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Preview provider inputs only. This does not submit official payroll and does not pay employees.
          </Typography>
          <Alert severity="info" sx={{ mb: 2 }}>
            Live QuickBooks payroll/time submit is not enabled. CSV export is available.
          </Alert>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mb: 2 }}>
            <Button variant="outlined" onClick={handlePreviewPayload} disabled={payloadLoading || provider !== "quickbooks"}>
              {payloadLoading ? <CircularProgress size={18} /> : "Preview QuickBooks payload"}
            </Button>
            <Tooltip title={csvBlockedReasonText}>
              <span>
                <Button variant="contained" onClick={handleCsvDownload} disabled={downloadLoading || !csvDownloadAllowed}>
                  {downloadLoading ? <CircularProgress size={18} /> : "Download Provider Sync CSV"}
                </Button>
              </span>
            </Tooltip>
          </Stack>
          {!payloadPreview ? (
            <Typography variant="body2" color="text.secondary">
              Preview QuickBooks payload after validation if you want to inspect the provider input line by line before exporting.
            </Typography>
          ) : (
            <>
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
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Manager view</Typography>
                {renderManagerMessages(payloadPreview.errors, currentRunContext)}
              </Box>
              <TableContainer sx={{ overflowX: "auto" }}>
                <Table size="small" sx={{ minWidth: 980 }}>
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
                            <Chip size="small" sx={chipSx.success} label="Valid" />
                          ) : (
                            <Stack spacing={0.5}>
                              <Chip size="small" sx={chipSx.warning} label="Needs attention" />
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
              </TableContainer>
            </>
          )}
        </Paper>
      )}

      <Accordion elevation={2} disableGutters>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">Advanced: Provider run history</Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ p: 3 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Provider Sync tracks draft, validated, payload-previewed, CSV-exported, failed, and unsupported runs only. It does not claim payroll was submitted, completed, or paid.
        </Typography>
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel id="provider-sync-history-status-label">Status filter</InputLabel>
              <Select
                labelId="provider-sync-history-status-label"
                label="Status filter"
                value={historyStatusFilter}
                onChange={(event) => setHistoryStatusFilter(event.target.value)}
              >
                <MenuItem value="">All statuses</MenuItem>
                <MenuItem value="draft">draft</MenuItem>
                <MenuItem value="validated">validated</MenuItem>
                <MenuItem value="unsupported">unsupported</MenuItem>
                <MenuItem value="failed">failed</MenuItem>
                <MenuItem value="submitted_to_time_tracking">time activity submitted</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="Start date"
              InputLabelProps={{ shrink: true }}
              value={historyStartFilter}
              onChange={(event) => setHistoryStartFilter(event.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="End date"
              InputLabelProps={{ shrink: true }}
              value={historyEndFilter}
              onChange={(event) => setHistoryEndFilter(event.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <Stack direction="row" spacing={1}>
              <Button variant="outlined" onClick={() => loadRunHistory({ offset: 0 })}>Apply</Button>
              <Button
                variant="text"
                onClick={() => {
                  setHistoryStatusFilter("");
                  setHistoryStartFilter("");
                  setHistoryEndFilter("");
                  loadRunHistory({ offset: 0, status: "", start_date: "", end_date: "" });
                }}
              >
                Reset
              </Button>
            </Stack>
          </Grid>
        </Grid>
        {selectedHistoryRun && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Selected run #{selectedHistoryRun.id}: {selectedHistoryRun.start_date} to {selectedHistoryRun.end_date} • status {selectedHistoryRun.status || "draft"} • payload previewed {selectedHistoryRun.payload_previewed_at ? "yes" : "no"} • CSV exported {selectedHistoryRun.csv_exported_at ? "yes" : "no"}.
          </Alert>
        )}
        {historyLoading ? (
          <CircularProgress size={20} />
        ) : !runHistory.length ? (
          <Typography variant="body2" color="text.secondary">No provider runs found yet.</Typography>
        ) : (
          <TableContainer sx={{ overflowX: "auto" }}>
          <Table size="small" sx={{ minWidth: 920 }}>
            <TableHead>
              <TableRow>
                <TableCell>Run ID</TableCell>
                <TableCell>Period</TableCell>
                <TableCell align="right">Employees</TableCell>
                <TableCell align="right">Lines</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>CSV exported</TableCell>
                <TableCell>Source hash</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {runHistory.map((item) => (
                <TableRow
                  key={item.id}
                  selected={item.id === selectedRunId}
                  hover
                  sx={{ cursor: "pointer" }}
                  onClick={() => loadSelectedRun(item.id)}
                >
                  <TableCell>{item.id}</TableCell>
                  <TableCell>{item.start_date} to {item.end_date}</TableCell>
                  <TableCell align="right">{formatNumber(item.employee_count)}</TableCell>
                  <TableCell align="right">{formatNumber(item.time_entry_count)}</TableCell>
                  <TableCell>{item.status || "draft"}</TableCell>
                  <TableCell>{item.csv_exported_at ? "Yes" : "No"}</TableCell>
                  <TableCell sx={{ minWidth: 120 }}>
                    <Tooltip title={item.source_hash || "—"}>
                      <Box component="span" sx={{ fontFamily: "monospace" }}>
                        {shortenHash(item.source_hash, 10)}
                      </Box>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <Stack spacing={0.75} sx={{ minWidth: 120 }}>
                      <Button
                        size="small"
                        variant={item.id === selectedRunId ? "contained" : "outlined"}
                        onClick={(event) => {
                          event.stopPropagation();
                          loadSelectedRun(item.id);
                        }}
                      >
                        {item.id === selectedRunId ? "Selected" : "View run"}
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleHistoryValidate(item.id, item);
                        }}
                      >
                        Validate
                      </Button>
                      {item.provider === "quickbooks" && (
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleHistoryPreviewPayload(item.id);
                          }}
                        >
                          Preview payload
                        </Button>
                      )}
                      {item.id === selectedRunId && (
                        <Button
                          size="small"
                          variant="outlined"
                          disabled={!csvDownloadAllowed}
                          onClick={(event) => {
                            event.stopPropagation();
                            handleHistoryCsvDownload(item.id, item.provider);
                          }}
                        >
                          Download CSV
                        </Button>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </TableContainer>
        )}
        <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ mt: 2 }}>
          <Button
            variant="outlined"
            disabled={historyLoading || !runHistoryMeta.offset}
            onClick={() => loadRunHistory({ offset: Math.max(0, (runHistoryMeta.offset || 0) - (runHistoryMeta.limit || 10)) })}
          >
            Previous
          </Button>
          <Button
            variant="outlined"
            disabled={historyLoading || !runHistoryMeta.has_more}
            onClick={() => loadRunHistory({ offset: (runHistoryMeta.offset || 0) + (runHistoryMeta.limit || 10) })}
          >
            Next
          </Button>
        </Stack>
        {latestPreviousRun && previewData?.source_hash && latestPreviousRun.source_hash !== previewData.source_hash && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            The current preview source hash differs from the most recent earlier run for this same period. This usually means approved time or saved Payroll Preview adjustments changed.
          </Alert>
        )}
        </AccordionDetails>
      </Accordion>
    </Stack>
  );
}
