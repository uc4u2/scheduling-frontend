// src/pages/sections/SettingsQuickBooks.js
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Drawer,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import RefreshIcon from "@mui/icons-material/Refresh";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import CloudOffIcon from "@mui/icons-material/CloudOff";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import LaunchIcon from "@mui/icons-material/Launch";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import SectionCard from "../../components/ui/SectionCard";
import IntegrationsOverviewCard from "../../components/integrations/IntegrationsOverviewCard";
import { quickbooksIntegration } from "../../utils/api";
import api from "../../utils/api";
import { getUserTimezone } from "../../utils/timezone";
import { formatDateTimeInTz } from "../../utils/datetime";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";

const PAYROLL_KINDS = [
  "wages_expense",
  "vacation_expense",
  "tips_expense",
  "commission_expense",
  "withheld_income_tax",
  "withheld_cpp",
  "withheld_ei",
  "withheld_fica",
  "withheld_medicare",
  "net_payable",
];

const REVENUE_KINDS = [
  "service_revenue",
  "product_revenue",
  "tax_collected",
  "tips_payable",
];

const KIND_LABELS = {
  wages_expense: "Wages expense",
  vacation_expense: "Vacation expense",
  tips_expense: "Tips expense",
  commission_expense: "Commission expense",
  withheld_income_tax: "Income tax payable",
  withheld_cpp: "CPP/QPP payable",
  withheld_ei: "EI payable",
  withheld_fica: "FICA payable",
  withheld_medicare: "Medicare payable",
  net_payable: "Net pay (cash/bank)",
  service_revenue: "Service revenue",
  product_revenue: "Product revenue",
  tax_collected: "Sales tax collected",
  tips_payable: "Tips payable",
};

const SettingsQuickBooks = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const viewerTimezone = getUserTimezone();
  const [status, setStatus] = useState(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [accounts, setAccounts] = useState([]);
  const [classes, setClasses] = useState([]);
  const [locations, setLocations] = useState([]);
  const [items, setItems] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [accountMap, setAccountMap] = useState({});
  const [savingKind, setSavingKind] = useState(null);
  const [validation, setValidation] = useState(null);
  const [previewState, setPreviewState] = useState({
    open: false,
    payrollId: "",
    lines: [],
    loading: false,
    error: "",
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });
  const [guideOpen, setGuideOpen] = useState(false);
  const [presets, setPresets] = useState([]);
  const [selectedPresetId, setSelectedPresetId] = useState("");
  const [defaults, setDefaults] = useState({
    default_class_id: "",
    default_class_name: "",
    default_location_id: "",
    default_location_name: "",
    default_item_id: "",
    default_item_name: "",
    default_customer_id: "",
    default_customer_name: "",
    lock_exports_before: "",
    allow_backdated_exports: false,
  });
  const [savingDefaults, setSavingDefaults] = useState(false);
  const [trackingRows, setTrackingRows] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [savingTrackingKey, setSavingTrackingKey] = useState("");
  const permissions = status?.permissions || {};
  const canManageIntegrations = permissions.can_manage_integrations !== false;
  const canExportAccounting = permissions.can_export_accounting !== false;

  const showMessage = (message, severity = "info") =>
    setSnackbar({ open: true, message, severity });

  useEffect(() => {
    if (status?.defaults) {
      setDefaults((prev) => ({
        ...prev,
        default_class_id: status.defaults.class_id || "",
        default_class_name: status.defaults.class_name || "",
        default_location_id: status.defaults.location_id || "",
        default_location_name: status.defaults.location_name || "",
        default_item_id: status.defaults.item_id || "",
        default_item_name: status.defaults.item_name || "",
        default_customer_id: status.defaults.customer_id || "",
        default_customer_name: status.defaults.customer_name || "",
        lock_exports_before: status.defaults.lock_exports_before || "",
        allow_backdated_exports: status.defaults.allow_backdated_exports || false,
      }));
    }
  }, [status?.defaults]);

  const lockDateWarning = useMemo(() => {
    const lockDateValue = status?.defaults?.lock_exports_before;
    const allowBackdated = Boolean(status?.defaults?.allow_backdated_exports);
    if (!lockDateValue || allowBackdated) {
      return null;
    }
    const parsed = dayjs(lockDateValue);
    if (!parsed.isValid()) {
      return null;
    }
    const today = dayjs().startOf("day");
    const diff = parsed.startOf("day").diff(today, "day");
    const formatted = parsed.format("MMM D, YYYY");
    if (diff < 0) {
      return {
        severity: "error",
        message: t(
          "settings.quickbooks.defaults.lockExpired",
          "Exports dated before {{date}} are currently blocked. Update the lock date or enable backdated exports to continue.",
          { date: formatted }
        ),
      };
    }
    if (diff <= 7) {
      return {
        severity: "warning",
        message: t(
          "settings.quickbooks.defaults.lockUpcoming",
          "Heads up: exports dated before {{date}} will be blocked soon. Adjust the lock date if you still need to sync that period.",
          { date: formatted }
        ),
      };
    }
    return null;
  }, [status?.defaults?.lock_exports_before, status?.defaults?.allow_backdated_exports, t]);

  const refreshStatus = useCallback(async () => {
    setStatusLoading(true);
    try {
      const data = await quickbooksIntegration.status();
      setStatus(data);
    } catch (error) {
      setStatus(null);
      console.error("quickbooks-status", error);
    } finally {
      setStatusLoading(false);
    }
  }, []);

  const loadAccounts = useCallback(async () => {
    if (!status?.connected) return;
    try {
      const data = await quickbooksIntegration.accounts();
      setAccounts(Array.isArray(data?.accounts) ? data.accounts : []);
      setClasses(Array.isArray(data?.classes) ? data.classes : []);
      setLocations(Array.isArray(data?.locations) ? data.locations : []);
      setItems(Array.isArray(data?.items) ? data.items : []);
      setCustomers(Array.isArray(data?.customers) ? data.customers : []);
    } catch (error) {
      console.error("quickbooks-accounts", error);
      showMessage(
        error?.displayMessage || error?.response?.data?.error || "Failed to load QuickBooks accounts",
        "error"
      );
    }
  }, [status?.connected]);

  const loadMappings = useCallback(async () => {
    if (!status?.connected) return;
    try {
      const rows = await quickbooksIntegration.listAccountMap();
      const keyed = {};
      rows.forEach((row) => {
        keyed[row.kind] = row;
      });
      setAccountMap(keyed);
    } catch (error) {
      console.error("quickbooks-account-map", error);
    }
  }, [status?.connected]);

  const loadTrackingMap = useCallback(async () => {
    if (!status?.connected) return;
    try {
      const rows = await quickbooksIntegration.listTrackingMap();
      setTrackingRows(Array.isArray(rows) ? rows : []);
    } catch (error) {
      console.error("quickbooks-tracking-map", error);
    }
  }, [status?.connected]);

  const loadDepartments = useCallback(async () => {
    try {
      const res = await api.get("/api/departments");
      setDepartments(Array.isArray(res?.data) ? res.data : []);
    } catch (error) {
      console.error("quickbooks-departments", error);
    }
  }, []);

  const refreshValidation = useCallback(async () => {
    if (!status?.connected) {
      setValidation(null);
      return;
    }
    try {
      const data = await quickbooksIntegration.validate();
      setValidation(data);
    } catch (error) {
      console.error("quickbooks-validate", error);
    }
  }, [status?.connected]);

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  useEffect(() => {
    quickbooksIntegration
      .presets()
      .then((data) => setPresets(Array.isArray(data) ? data : []))
      .catch(() => setPresets([]));
  }, []);

  useEffect(() => {
    if (!selectedPresetId && presets.length > 0) {
      setSelectedPresetId(presets[0].id);
    }
  }, [presets, selectedPresetId]);

  useEffect(() => {
    if (status?.connected) {
      loadAccounts();
      loadMappings();
      refreshValidation();
      loadTrackingMap();
      loadDepartments();
    }
  }, [status?.connected, loadAccounts, loadMappings, refreshValidation, loadTrackingMap, loadDepartments]);

  const handleConnect = async () => {
    if (!canManageIntegrations) {
      showMessage(
        t("settings.quickbooks.permission.manage", "You do not have permission to manage QuickBooks."),
        "error"
      );
      return;
    }
    try {
      const data = await quickbooksIntegration.connect();
      if (data?.url) {
        window.location.href = data.url;
      } else {
        showMessage("Unable to start QuickBooks connection", "error");
      }
    } catch (error) {
      showMessage(
        error?.displayMessage || error?.response?.data?.error || "Failed to start QuickBooks connection",
        "error"
      );
    }
  };

  const handleDisconnect = async () => {
    if (!canManageIntegrations) {
      showMessage(
        t("settings.quickbooks.permission.manage", "You do not have permission to manage QuickBooks."),
        "error"
      );
      return;
    }
    try {
      await quickbooksIntegration.disconnect();
      showMessage("QuickBooks disconnected", "success");
      await refreshStatus();
    } catch (error) {
      showMessage(
        error?.displayMessage || error?.response?.data?.error || "Failed to disconnect",
        "error"
      );
    }
  };

  const handleMappingChange = async (kind, nextCode) => {
    if (!status?.connected) return;
    if (!canManageIntegrations) {
      showMessage(
        t("settings.quickbooks.permission.manage", "You do not have permission to manage QuickBooks."),
        "error"
      );
      return;
    }
    setSavingKind(kind);
    try {
      if (!nextCode) {
        const existing = accountMap[kind];
        if (existing?.id) {
          await quickbooksIntegration.deleteAccountMap(existing.id);
        }
      } else {
        const selected = accounts.find((acc) => String(acc.id) === String(nextCode));
        await quickbooksIntegration.upsertAccountMap({
          kind,
          qb_account_id: nextCode,
          qb_account_name: selected?.name || "",
          qb_account_type: selected?.type || "",
          qb_account_subtype: selected?.subType || "",
        });
      }
      await Promise.all([loadMappings(), refreshValidation()]);
      showMessage("Mapping saved", "success");
    } catch (error) {
      showMessage(
        error?.displayMessage || error?.response?.data?.error || "Failed to save mapping",
        "error"
      );
    } finally {
      setSavingKind(null);
    }
  };

  const missingPayrollKinds = useMemo(() => validation?.payroll?.missing || [], [validation]);
  const missingRevenueKinds = useMemo(() => validation?.revenue?.missing || [], [validation]);
  const currentPreset = useMemo(
    () => presets.find((preset) => preset.id === selectedPresetId),
    [presets, selectedPresetId]
  );
  const presetHints = currentPreset?.kinds || {};

  const handleDefaultSelect = (idField, nameField, list) => (event) => {
    if (!canManageIntegrations) {
      showMessage(
        t("settings.quickbooks.permission.manage", "You do not have permission to manage QuickBooks."),
        "error"
      );
      return;
    }
    const value = event.target.value;
    const found = list.find((opt) => String(opt.id) === String(value));
    setDefaults((prev) => ({
      ...prev,
      [idField]: value,
      [nameField]: found?.name || "",
    }));
  };

  const handleSaveDefaults = async () => {
    if (!status?.connected) return;
    if (!canManageIntegrations) {
      showMessage(
        t("settings.quickbooks.permission.manage", "You do not have permission to manage QuickBooks."),
        "error"
      );
      return;
    }
    setSavingDefaults(true);
    try {
      await quickbooksIntegration.saveSettings(defaults);
      showMessage("Default QuickBooks references saved", "success");
      await refreshStatus();
    } catch (error) {
      showMessage(
        error?.displayMessage || error?.response?.data?.error || "Failed to save defaults",
        "error"
      );
    } finally {
      setSavingDefaults(false);
    }
  };

  const trackingIndex = useMemo(() => {
    const map = {};
    trackingRows.forEach((row) => {
      map[`${row.local_type}:${row.local_id}`] = row;
    });
    return map;
  }, [trackingRows]);

  const lookupById = (list, value) =>
    list.find((opt) => String(opt.id) === String(value)) || null;

  const handleTrackingUpdate = async (localType, localId, updates) => {
    if (!status?.connected) return;
    if (!canManageIntegrations) {
      showMessage(
        t("settings.quickbooks.permission.manage", "You do not have permission to manage QuickBooks."),
        "error"
      );
      return;
    }
    const key = `${localType}:${localId}`;
    const existing = trackingIndex[key];
    const classMeta = updates.qb_class_id
      ? lookupById(classes, updates.qb_class_id)
      : null;
    const locationMeta = updates.qb_location_id
      ? lookupById(locations, updates.qb_location_id)
      : null;
    const nextClassId = classMeta ? classMeta.id : "";
    const nextClassName = classMeta ? classMeta.name : "";
    const nextLocationId = locationMeta ? locationMeta.id : "";
    const nextLocationName = locationMeta ? locationMeta.name : "";

    setSavingTrackingKey(key);
    try {
      if (!nextClassId && !nextLocationId) {
        if (existing?.id) {
          await quickbooksIntegration.deleteTrackingMap(existing.id);
          showMessage("Mapping removed", "success");
          await loadTrackingMap();
        }
        return;
      }
      await quickbooksIntegration.upsertTrackingMap({
        local_type: localType,
        local_id: localId,
        qb_class_id: nextClassId || null,
        qb_class_name: nextClassName || null,
        qb_location_id: nextLocationId || null,
        qb_location_name: nextLocationName || null,
      });
      showMessage("Mapping saved", "success");
      await loadTrackingMap();
    } catch (error) {
      showMessage(
        error?.displayMessage || error?.response?.data?.error || "Failed to save mapping",
        "error"
      );
    } finally {
      setSavingTrackingKey("");
    }
  };

  const renderDefaultSelect = (label, idField, nameField, options) => (
    <Grid item xs={12} md={6}>
      <FormControl fullWidth size="small">
        <InputLabel>{label}</InputLabel>
        <Select
          label={label}
          value={defaults[idField] || ""}
          disabled={!canManageIntegrations}
          onChange={handleDefaultSelect(idField, nameField, options)}
        >
          <MenuItem value="">
            <em>{t("settings.quickbooks.unmapped", "Not set")}</em>
          </MenuItem>
          {options.map((opt) => (
            <MenuItem key={opt.id} value={opt.id}>
              {opt.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Grid>
  );

  const renderTrackingSection = (title, rows, localType) => (
    <SectionCard
      title={title}
      description={t(
        "settings.quickbooks.trackingDescription",
        "Use your Company Profile departments (treat them as teams, studios, or branches) to map into QuickBooks Classes or Locations for cost-center reporting."
      )}
    >
      {rows.length === 0 ? (
        <Alert severity="info">{t("settings.quickbooks.noRows", "No records available yet.")}</Alert>
      ) : (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>{t("settings.quickbooks.nameColumn", "Name")}</TableCell>
              <TableCell>{t("settings.quickbooks.classColumn", "Class")}</TableCell>
              <TableCell>{t("settings.quickbooks.locationColumn", "Location")}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => {
              const key = `${localType}:${row.id}`;
              const current = trackingIndex[key] || {};
              const saving = savingTrackingKey === key;
              return (
                <TableRow key={key}>
                  <TableCell>{row.name || row.title}</TableCell>
                  <TableCell>
                    <FormControl fullWidth size="small">
                      <Select
                    value={current.qb_class_id || ""}
                    disabled={!canManageIntegrations || saving}
                    onChange={(e) =>
                          handleTrackingUpdate(localType, row.id, {
                            qb_class_id: e.target.value,
                            qb_location_id: current.qb_location_id || "",
                          })
                        }
                      >
                        <MenuItem value="">
                          <em>{t("settings.quickbooks.unmapped", "Not mapped")}</em>
                        </MenuItem>
                        {classes.map((opt) => (
                          <MenuItem key={opt.id} value={opt.id}>
                            {opt.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </TableCell>
                  <TableCell>
                    <FormControl fullWidth size="small">
                      <Select
                    value={current.qb_location_id || ""}
                    disabled={!canManageIntegrations || saving}
                    onChange={(e) =>
                          handleTrackingUpdate(localType, row.id, {
                            qb_class_id: current.qb_class_id || "",
                            qb_location_id: e.target.value,
                          })
                        }
                      >
                        <MenuItem value="">
                          <em>{t("settings.quickbooks.unmapped", "Not mapped")}</em>
                        </MenuItem>
                        {locations.map((opt) => (
                          <MenuItem key={opt.id} value={opt.id}>
                            {opt.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    {saving && <CircularProgress size={16} sx={{ ml: 1 }} />}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </SectionCard>
  );

  const helpChecklist = useMemo(
    () => [
      t(
        "settings.quickbooks.help.items.mappingRequired",
        "Map every payroll and revenue category so QuickBooks accepts journals."
      ),
      t(
        "settings.quickbooks.help.items.costCenters",
        "Use Departments ↔ Class/Location mapping to tag cost centers automatically."
      ),
      t(
        "settings.quickbooks.help.items.defaults",
        "Set default Class, Location, Item, and Customer to cover edge cases."
      ),
      t(
        "settings.quickbooks.help.items.audit",
        "Use Integration Activity to confirm every export (journal ID + who triggered it)."
      ),
    ],
    [t]
  );

  const guideSections = useMemo(
    () => [
      {
        title: "1. Why mapping is required",
        body: [
          "QuickBooks accepts journals only when every category—wages, deductions, revenue, tax, and tips—is linked to a real account.",
          "Schedulaa uses these mappings to debit wages/vacation/tips/commissions and credit tax, CPP/EI, FICA/Medicare, tips payable, and net pay (plus optional Class/Location tags).",
          "When everything is mapped, both chips turn green and Sync to QuickBooks becomes available.",
        ],
      },
      {
        title: "2. How mapping works",
        body: [
          "Open Payroll account mapping and Revenue account mapping, then choose accounts directly from your QuickBooks Chart of Accounts.",
          "If you need new accounts, create them in QuickBooks and click Refresh (or reconnect) so they appear in the dropdown.",
          "You only map once; all future payroll and revenue exports use these accounts automatically.",
        ],
      },
      {
        title: "3. Recommended accounts",
        body: [
          "Payroll expenses (Expense accounts): Wages & Salaries, Holiday/Vacation Pay, Tips Paid, Sales Commissions.",
          "Payroll liabilities (Other Current Liabilities → Payroll Tax Payable): Income tax payable, CPP/QPP payable, EI payable, FICA payable (U.S.), Medicare payable (U.S.), Tips payable.",
          "Net pay (Bank account): Payroll Checking / Operating Checking / Cash on Hand.",
          "Revenue (Income/Liability accounts): Service Income, Product Sales, Sales Tax Payable, Tips Payable.",
        ],
      },
      {
        title: "4. Default QuickBooks references (optional)",
        body: [
          "Use the Defaults card to set fallback Class, Location, Item, and Customer for revenue and invoice workflows.",
          "Default Class/Location require those features enabled in QuickBooks and are only used when a transaction lacks its own tags.",
          "Default Item/Customer are applied when exporting invoices/sales receipts that don’t specify their own item/customer.",
        ],
      },
      {
        title: "5. Cost-center mapping (Departments ↔ Class/Location)",
        body: [
          "Treat each Department as a team/branch/studio cost center.",
          "Create Classes/Locations in QuickBooks, then map Departments to them here so every export carries the ClassRef + DepartmentRef.",
          "Ideal for studio/branch profitability, departmental P&L, and regional reporting.",
        ],
      },
      {
        title: "6. Exporting payroll",
        body: [
          "Go to Payroll → Preview, load the employee + dates, and Finalize & Save.",
          "When the finalized run is loaded, click Sync to QuickBooks.",
          "Schedulaa posts a balanced Journal Entry (wages + deductions + net pay + tips payable + optional Class/Location).",
        ],
      },
      {
        title: "7. Exporting revenue / invoices / sales receipts",
        body: [
          "Summarized revenue journal: in Analytics export service revenue, product revenue, sales tax collected, tips payable for a date range.",
          "Invoices/Sales Receipts: set default item/customer, pick doc type + date range, and Schedulaa creates QuickBooks docs per transaction.",
          "Each export stores the QuickBooks ID within Schedulaa for future reference.",
        ],
      },
      {
        title: "8. Locking periods and backdated exports",
        body: [
          "Use “Lock exports before” to block journals prior to a closed period.",
          "Turn off “Allow backdated exports” when you want stricter accounting controls.",
        ],
      },
      {
        title: "9. Integration Activity (audit log)",
        body: [
          "Workspace Settings → Integration activity lists each export with timestamp, provider, type, status, external ID, triggered-by, and message.",
          "Filter by provider (QuickBooks), type (Payroll/Revenue/Sales documents), status, and date range.",
        ],
      },
      {
        title: "10. Common questions",
        body: [
          "Do I need every account pre-created? No—map to existing accounts or create new ones in QuickBooks first.",
          "Can I change mappings later? Yes, future exports use the latest selections.",
          "Do payroll exports require customers? No; only invoices/sales receipts use CustomerRef.",
          "Why is the customer dropdown empty? QuickBooks Simple Start and some sandboxes don’t expose customers; Essentials/Plus/Advanced do.",
          "Are Classes/Locations required? No—they’re optional cost center tools.",
        ],
      },
      {
        title: "11. Quick setup checklist",
        body: [
          "✔ Map payroll expenses and liabilities (including FICA/Medicare if U.S.).",
          "✔ Map net pay → bank, plus service/product revenue, tax, tips payable.",
          "✔ (Optional) Configure default Class/Location/Item/Customer.",
          "✔ (Optional) Map Departments → Class/Location.",
          "✔ Finalize payroll → Sync, then confirm success in Integration Activity.",
        ],
      },
    ],
    []
  );

  const openPreviewDialog = () =>
    setPreviewState({ open: true, payrollId: "", lines: [], loading: false, error: "" });

  const closePreviewDialog = () =>
    setPreviewState((prev) => ({ ...prev, open: false }));

  const runPreview = async () => {
    if (!previewState.payrollId) return;
    setPreviewState((prev) => ({ ...prev, loading: true, error: "", lines: [] }));
    try {
      const res = await quickbooksIntegration.preview({ payroll_id: previewState.payrollId });
      setPreviewState((prev) => ({
        ...prev,
        loading: false,
        lines: res?.journal_lines || [],
        error: "",
      }));
    } catch (error) {
      setPreviewState((prev) => ({
        ...prev,
        loading: false,
        error:
          error?.displayMessage || error?.response?.data?.error || "Failed to load preview",
      }));
    }
  };

  const renderMappingSection = (title, kinds, missingList = []) => (
    <SectionCard
      key={title}
      title={title}
      description={status?.connected ? undefined : t("settings.quickbooks.connectToMap", "Connect to QuickBooks to configure mappings.")}
    >
      <Stack spacing={2}>
        {missingList.length > 0 && (
          <Alert severity="warning">
            {t("settings.quickbooks.missingMappings", "Missing: {{list}}", {
              list: missingList.map((k) => KIND_LABELS[k] || k).join(", "),
            })}
          </Alert>
        )}
        {kinds.map((kind) => {
          const current = accountMap[kind]?.qb_account_id || "";
          const hint = presetHints[kind]?.hint;
          return (
            <Grid container spacing={2} alignItems="center" key={kind}>
              <Grid item xs={12} md={4}>
                <Typography fontWeight={600}>{KIND_LABELS[kind] || kind}</Typography>
                {hint && (
                  <Typography variant="caption" color="text.secondary">
                    {hint}
                  </Typography>
                )}
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl
                  fullWidth
                  size="small"
                  disabled={!status?.connected || savingKind === kind || !canManageIntegrations}
                >
                  <InputLabel>Account</InputLabel>
                  <Select
                    label="Account"
                    value={current}
                    onChange={(e) => handleMappingChange(kind, e.target.value)}
                    disabled={!status?.connected || savingKind === kind || !canManageIntegrations}
                    MenuProps={{ PaperProps: { style: { maxHeight: 320 } } }}
                  >
                    <MenuItem value="">
                      <em>{t("settings.quickbooks.unmapped", "Not mapped")}</em>
                    </MenuItem>
                    {accounts.map((acc) => (
                      <MenuItem key={acc.id} value={acc.id}>
                        {acc.id} — {acc.name || "Unnamed"}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={2}>
                {savingKind === kind && <CircularProgress size={20} />}
              </Grid>
            </Grid>
          );
        })}
      </Stack>
    </SectionCard>
  );

  const statusChip = status?.connected ? (
    <Chip
      icon={<CheckCircleOutlineIcon />}
      label={t("settings.quickbooks.connected", "Connected")}
      color="success"
      size="small"
    />
  ) : (
    <Chip
      icon={<CloudOffIcon />}
      label={t("settings.quickbooks.disconnected", "Not connected")}
      color="default"
      size="small"
    />
  );

  const payrollOk = validation?.payroll?.ok;
  const revenueOk = validation?.revenue?.ok;

  return (
    <Stack spacing={3}>
      <SectionCard
        title={t("settings.quickbooks.connectionTitle", "QuickBooks connection")}
        actions={
          status?.connected ? (
            <Stack direction="row" spacing={1}>
              <Button size="small" variant="outlined" startIcon={<RefreshIcon />} onClick={refreshStatus}>
                {t("settings.common.refresh", "Refresh")}
              </Button>
              <Button
                size="small"
                color="error"
                variant="outlined"
                onClick={handleDisconnect}
                disabled={!canManageIntegrations}
              >
                {t("settings.quickbooks.disconnect", "Disconnect")}
              </Button>
            </Stack>
          ) : (
            <Button
              size="small"
              variant="contained"
              startIcon={<OpenInNewIcon />}
              onClick={handleConnect}
              disabled={!canManageIntegrations}
            >
              {t("settings.quickbooks.connect", "Connect QuickBooks")}
            </Button>
          )
        }
      >
        {statusLoading ? (
          <CircularProgress size={24} />
        ) : (
          <Stack spacing={1}>
            <Stack direction="row" spacing={1} alignItems="center">
              {statusChip}
              {status?.company_name && (
                <Typography variant="body2" color="text.secondary">
                  {status.company_name}
                </Typography>
              )}
            </Stack>
            {status?.last_synced_at && (
              <Typography variant="body2" color="text.secondary">
                {t("settings.quickbooks.lastSync", "Last synced: {{value}}", {
                  value: formatDateTimeInTz(status.last_synced_at, viewerTimezone),
                })}
              </Typography>
            )}
            {status?.last_error && (
              <Alert severity="warning">{status.last_error}</Alert>
            )}
            {!status?.connected && (
              <Alert severity="info">
                {t(
                  "settings.quickbooks.connectHint",
                  "Connect your QuickBooks organisation to enable payroll and revenue exports."
                )}
              </Alert>
            )}
            {status?.connected && !canManageIntegrations && (
              <Alert severity="info">
                {t(
                  "settings.quickbooks.permission.readOnly",
                  "You can view QuickBooks mappings but need finance permission to make changes."
                )}
              </Alert>
            )}
          </Stack>
        )}
      </SectionCard>

      <Accordion disableGutters>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Schedulaa integrations overview
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <IntegrationsOverviewCard />
        </AccordionDetails>
      </Accordion>

      <Accordion disableGutters>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Recommended workflows with QuickBooks + Zapier
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
            <Typography variant="body2" color="text.secondary" paragraph>
              Use QuickBooks for official accounting, and Zapier for real-time analytics and operational automation.
            </Typography>
            <Stack component="ul" spacing={0.5} sx={{ pl: 2 }}>
              <Typography component="li" variant="body2">
                Post balanced payroll and revenue journals from Schedulaa into QuickBooks using the mappings below.
              </Typography>
              <Typography component="li" variant="body2">
                Use the Zapier <code>payroll.details</code> event to send detailed per-employee payroll rows (hours, gross, net, taxes, deductions) to Google Sheets, Excel, or BI tools.
              </Typography>
              <Typography component="li" variant="body2">
                Send timeclock and break compliance events to Slack or HR systems for monitoring and audits.
              </Typography>
              <Typography component="li" variant="body2">
                Combine QuickBooks journals with Zapier exports to give accountants both accurate books and flexible reporting.
              </Typography>
            </Stack>
          </Paper>
        </AccordionDetails>
      </Accordion>

      <Accordion disableGutters>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            {t("settings.quickbooks.help.title", "Need a hand with QuickBooks mapping?")}
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <SectionCard
            title=""
            description={t(
              "settings.quickbooks.help.subtitle",
              "Quick reminders so finance teams can sync payroll and revenue without guesswork."
            )}
            actions={
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                <Button
                  variant="contained"
                  startIcon={<HelpOutlineIcon />}
                  onClick={() => setGuideOpen(true)}
                >
                  {t("settings.quickbooks.help.openGuide", "View setup guide")}
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<LaunchIcon />}
                  onClick={() => navigate("/manager/payroll")}
                >
                  {t("settings.quickbooks.help.openPayroll", "Go to payroll preview")}
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<LaunchIcon />}
                  onClick={() => navigate("/docs?topic=quickbooks-onboarding")}
                >
                  {t("settings.quickbooks.help.openDocs", "QuickBooks onboarding guide")}
                </Button>
              </Stack>
            }
          >
            <Stack spacing={1}>
              {helpChecklist.map((item, index) => (
                <Typography key={index} variant="body2">
                  • {item}
                </Typography>
              ))}
              <Typography variant="caption" color="text.secondary">
                {t(
                  "settings.quickbooks.help.footer",
                  "Integration complete = payroll badge green + revenue badge green + Sync to QuickBooks button active."
                )}
              </Typography>
            </Stack>
          </SectionCard>
        </AccordionDetails>
      </Accordion>

      {status?.connected && (
        <>
          <SectionCard
            title={t("settings.quickbooks.presets.title", "Recommended presets")}
            description={t(
              "settings.quickbooks.presets.subtitle",
              "Pick an industry preset to see suggested mapping hints."
            )}
          >
            <FormControl fullWidth size="small" sx={{ maxWidth: 360 }}>
              <InputLabel>{t("settings.quickbooks.presets.label", "Preset")}</InputLabel>
              <Select
                label={t("settings.quickbooks.presets.label", "Preset")}
                value={selectedPresetId || ""}
                onChange={(e) => setSelectedPresetId(e.target.value)}
              >
                {presets.map((preset) => (
                  <MenuItem key={preset.id} value={preset.id}>
                    {preset.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {currentPreset?.description && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {currentPreset.description}
              </Typography>
            )}
          </SectionCard>

          <SectionCard
            title={t("settings.quickbooks.defaults.title", "Default QuickBooks references")}
            description={t(
              "settings.quickbooks.defaults.subtitle",
              "Preselect the fallback Class, Location, Item, and Customer used for exports."
            )}
            actions={
              <Button
                size="small"
                variant="contained"
                onClick={handleSaveDefaults}
                disabled={savingDefaults}
              >
                {savingDefaults
                  ? t("settings.common.saving", "Saving...")
                  : t("settings.common.save", "Save")}
              </Button>
            }
          >
            {lockDateWarning && (
              <Alert severity={lockDateWarning.severity} sx={{ mb: 2 }}>
                {lockDateWarning.message}
              </Alert>
            )}
            <Grid container spacing={2}>
              {renderDefaultSelect(
                t("settings.quickbooks.defaults.class", "Default Class"),
                "default_class_id",
                "default_class_name",
                classes
              )}
              {renderDefaultSelect(
                t("settings.quickbooks.defaults.location", "Default Location"),
                "default_location_id",
                "default_location_name",
                locations
              )}
              {renderDefaultSelect(
                t("settings.quickbooks.defaults.item", "Default Item"),
                "default_item_id",
                "default_item_name",
                items
              )}
              {renderDefaultSelect(
                t("settings.quickbooks.defaults.customer", "Default Customer"),
                "default_customer_id",
                "default_customer_name",
                customers
              )}
              <Grid item xs={12} md={6}>
                <TextField
                  type="date"
                  label={t("settings.quickbooks.defaults.lockDate", "Lock exports before")}
                  InputLabelProps={{ shrink: true }}
                  value={defaults.lock_exports_before || ""}
                  onChange={(e) =>
                    setDefaults((prev) => ({
                      ...prev,
                      lock_exports_before: e.target.value,
                    }))
                  }
                  fullWidth
                  size="small"
                  disabled={!canManageIntegrations}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>
                    {t("settings.quickbooks.defaults.allowBackdated", "Allow backdated exports")}
                  </InputLabel>
                  <Select
                    label={t("settings.quickbooks.defaults.allowBackdated", "Allow backdated exports")}
                    value={defaults.allow_backdated_exports ? "yes" : "no"}
                    onChange={(e) =>
                      setDefaults((prev) => ({
                        ...prev,
                        allow_backdated_exports: e.target.value === "yes",
                      }))
                    }
                    disabled={!canManageIntegrations}
                  >
                    <MenuItem value="no">{t("settings.common.no", "No")}</MenuItem>
                    <MenuItem value="yes">{t("settings.common.yes", "Yes")}</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Schedulaa posts balanced journal entries (debits = credits). Use "Lock exports before" to protect closed periods, and rely on Integration Activity as your audit log (who exported what, when, and to which external ID).
            </Typography>
          </SectionCard>

          {renderTrackingSection(
            t("settings.quickbooks.departmentMapping", "Departments (teams or locations) ↔ Class/Location"),
            departments,
            "department"
          )}
        </>
      )}

      {status?.connected && (
        <Stack spacing={3}>
          <SectionCard
            title={t("settings.quickbooks.validationTitle", "Mapping status")}
            actions={
              <Button size="small" startIcon={<RefreshIcon />} onClick={refreshValidation}>
                {t("settings.common.refresh", "Refresh")}
              </Button>
            }
          >
            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <Chip
                icon={payrollOk ? <CheckCircleOutlineIcon /> : <WarningAmberIcon />}
                color={payrollOk ? "success" : "warning"}
                label={
                  payrollOk
                    ? t("settings.quickbooks.payrollReady", "Payroll mappings complete")
                    : t("settings.quickbooks.payrollMissing", "Payroll mappings missing")
                }
              />
              <Chip
                icon={revenueOk ? <CheckCircleOutlineIcon /> : <WarningAmberIcon />}
                color={revenueOk ? "success" : "warning"}
                label={
                  revenueOk
                    ? t("settings.quickbooks.revenueReady", "Revenue mappings complete")
                    : t("settings.quickbooks.revenueMissing", "Revenue mappings missing")
                }
              />
              <Box flexGrow={1} />
              <Button
                size="small"
                variant="outlined"
                startIcon={<CloudUploadIcon />}
                onClick={openPreviewDialog}
                disabled={!canExportAccounting}
              >
                {t("settings.quickbooks.previewPayroll", "Preview payroll journal")}
              </Button>
            </Stack>
          </SectionCard>

          {renderMappingSection(
            t("settings.quickbooks.payrollMapping", "Payroll account mapping"),
            PAYROLL_KINDS,
            missingPayrollKinds
          )}

          {renderMappingSection(
            t("settings.quickbooks.revenueMapping", "Revenue account mapping"),
            REVENUE_KINDS,
            missingRevenueKinds
          )}
        </Stack>
      )}

      <Dialog open={previewState.open} onClose={closePreviewDialog} maxWidth="md" fullWidth>
        <DialogTitle>{t("settings.quickbooks.previewDialogTitle", "Preview payroll journal")}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ my: 1 }}>
            <TextField
              label={t("settings.quickbooks.previewPayrollId", "Payroll ID")}
              value={previewState.payrollId}
              onChange={(e) =>
                setPreviewState((prev) => ({ ...prev, payrollId: e.target.value }))
              }
              fullWidth
              type="number"
            />
            <Button
              variant="contained"
              onClick={runPreview}
              disabled={!previewState.payrollId || previewState.loading}
            >
              {previewState.loading ? (
                <CircularProgress size={20} />
              ) : (
                t("settings.quickbooks.previewButton", "Load preview")
              )}
            </Button>
            {previewState.error && <Alert severity="error">{previewState.error}</Alert>}
            {previewState.lines.length > 0 && (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Account</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell align="right">Debit</TableCell>
                    <TableCell align="right">Credit</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {previewState.lines.map((line, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{line.AccountCode}</TableCell>
                      <TableCell>{line.Description || "—"}</TableCell>
                      <TableCell align="right">
                        {line.Debit != null ? Number(line.Debit).toFixed(2) : "—"}
                      </TableCell>
                      <TableCell align="right">
                        {line.Credit != null ? Number(line.Credit).toFixed(2) : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closePreviewDialog}>{t("settings.common.close", "Close")}</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
      >
        <Alert
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      <Drawer anchor="right" open={guideOpen} onClose={() => setGuideOpen(false)}>
        <Box sx={{ width: 520, maxWidth: "100%", p: 3 }}>
          <Stack spacing={2}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="h6">
                {t("settings.quickbooks.guide.title", "QuickBooks setup guide")}
              </Typography>
              <Button size="small" onClick={() => setGuideOpen(false)}>
                {t("settings.common.close", "Close")}
              </Button>
            </Stack>
            <Typography variant="body2" color="text.secondary">
              {t(
                "settings.quickbooks.guide.intro",
                "Map accounts once, validate the chips, then sync payroll and revenue exports with a single click."
              )}
            </Typography>
            <Divider />
            <Stack spacing={2}>
              {guideSections.map((section) => (
                <Box key={section.title}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {section.title}
                  </Typography>
                  <Stack component="ul" spacing={0.5} sx={{ pl: 2, mt: 1 }}>
                    {section.body.map((line, idx) => (
                      <Typography key={idx} component="li" variant="body2">
                        {line}
                      </Typography>
                    ))}
                  </Stack>
                </Box>
              ))}
            </Stack>
            <Divider />
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
              <Button
                variant="contained"
                startIcon={<OpenInNewIcon />}
                onClick={() => navigate("/manager/payroll")}
              >
                {t("settings.quickbooks.guide.openPayroll", "Open payroll")}
              </Button>
              <Button
                variant="outlined"
                startIcon={<LaunchIcon />}
                onClick={() => navigate("/manager/analytics?view=revenue")}
              >
                {t("settings.quickbooks.guide.openRevenue", "Open revenue export")}
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Drawer>
    </Stack>
  );
};

export default SettingsQuickBooks;
