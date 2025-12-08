// src/pages/sections/SettingsXero.js
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
import { xeroIntegration } from "../../utils/api";
import api from "../../utils/api";
import { getUserTimezone } from "../../utils/timezone";
import { formatDateTimeInTz } from "../../utils/datetime";
import { useTranslation } from "react-i18next";

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

const SettingsXero = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const viewerTimezone = getUserTimezone();
  const [status, setStatus] = useState(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [accounts, setAccounts] = useState([]);
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
  const [trackingCategories, setTrackingCategories] = useState([]);
  const [defaults, setDefaults] = useState({
    tracking_category_id: "",
    tracking_category_name: "",
    tracking_option_id: "",
    tracking_option_name: "",
    lock_exports_before: "",
    allow_backdated_exports: false,
  });
  const [savingDefaults, setSavingDefaults] = useState(false);
  const [trackingRows, setTrackingRows] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [savingTrackingKey, setSavingTrackingKey] = useState("");

  const showMessage = (message, severity = "info") =>
    setSnackbar({ open: true, message, severity });

  const permissions = status?.permissions || {};
  const canManageIntegrations = permissions.can_manage_integrations !== false;

  const refreshStatus = useCallback(async () => {
    setStatusLoading(true);
    try {
      const data = await xeroIntegration.status();
      setStatus(data);
    } catch (error) {
      setStatus(null);
      console.error("xero-status", error);
    } finally {
      setStatusLoading(false);
    }
  }, []);

  const loadAccounts = useCallback(async () => {
    if (!status?.connected) return;
    try {
      const data = await xeroIntegration.accounts();
      setAccounts(Array.isArray(data?.accounts) ? data.accounts : []);
      setTrackingCategories(Array.isArray(data?.tracking_categories) ? data.tracking_categories : []);
    } catch (error) {
      console.error("xero-accounts", error);
      showMessage(
        error?.displayMessage || error?.response?.data?.error || "Failed to load Xero accounts",
        "error"
      );
    }
  }, [status?.connected]);

  const loadMappings = useCallback(async () => {
    if (!status?.connected) return;
    try {
      const rows = await xeroIntegration.listAccountMap();
      const keyed = {};
      rows.forEach((row) => {
        keyed[row.kind] = row;
      });
      setAccountMap(keyed);
    } catch (error) {
      console.error("xero-account-map", error);
    }
  }, [status?.connected]);

  const refreshValidation = useCallback(async () => {
    if (!status?.connected) {
      setValidation(null);
      return;
    }
    try {
      const data = await xeroIntegration.validate();
      setValidation(data);
    } catch (error) {
      console.error("xero-validate", error);
    }
  }, [status?.connected]);

  const loadTrackingMap = useCallback(async () => {
    if (!status?.connected) return;
    try {
      const rows = await xeroIntegration.listTrackingMap();
      setTrackingRows(Array.isArray(rows) ? rows : []);
    } catch (error) {
      console.error("xero-tracking-map", error);
    }
  }, [status?.connected]);

  const loadDepartments = useCallback(async () => {
    try {
      const res = await api.get("/api/departments");
      setDepartments(Array.isArray(res?.data) ? res.data : []);
    } catch (error) {
      console.error("xero-departments", error);
    }
  }, []);

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  useEffect(() => {
    xeroIntegration
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
    if (status?.defaults) {
      setDefaults((prev) => ({
        ...prev,
        tracking_category_id: status.defaults.tracking_category_id || "",
        tracking_category_name: status.defaults.tracking_category_name || "",
        tracking_option_id: status.defaults.tracking_option_id || "",
        tracking_option_name: status.defaults.tracking_option_name || "",
        lock_exports_before: status.defaults.lock_exports_before || "",
        allow_backdated_exports: Boolean(status.defaults.allow_backdated_exports),
      }));
    }
  }, [status?.defaults]);

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
    try {
      const data = await xeroIntegration.connect();
      if (data?.url) {
        window.location.href = data.url;
      } else {
        showMessage("Unable to start Xero connection", "error");
      }
    } catch (error) {
      showMessage(
        error?.displayMessage || error?.response?.data?.error || "Failed to start Xero connection",
        "error"
      );
    }
  };

  const handleDisconnect = async () => {
    try {
      await xeroIntegration.disconnect();
      showMessage("Xero disconnected", "success");
      await refreshStatus();
    } catch (error) {
      showMessage(
        error?.displayMessage || error?.response?.data?.error || "Failed to disconnect",
        "error"
      );
    }
  };

  const handleMappingChange = async (kind, nextCode) => {
    if (!status?.connected || !canManageIntegrations) return;
    setSavingKind(kind);
    try {
      if (!nextCode) {
        const existing = accountMap[kind];
        if (existing?.id) {
          await xeroIntegration.deleteAccountMap(existing.id);
        }
      } else {
        const selected = accounts.find((acc) => acc.code === nextCode);
        await xeroIntegration.upsertAccountMap({
          kind,
          xero_account_code: nextCode,
          xero_account_name: selected?.name || "",
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

  const helpChecklist = useMemo(
    () => [
      t(
        "settings.xero.help.items.mappingRequired",
        "Map every payroll and revenue category so Xero accepts balanced manual journals."
      ),
      t(
        "settings.xero.help.items.netPay",
        "Include liabilities like FICA/Medicare and net pay to mirror the debit/credit structure Schedulaa sends."
      ),
      t(
        "settings.xero.help.items.recommended",
        "Choose accounts directly from your Xero chart (or create new ones, refresh, and map them here)."
      ),
      t(
        "settings.xero.help.items.after",
        "When both badges turn green you can finalize payroll and push payroll or revenue journals with one click."
      ),
    ],
    [t]
  );

  const guideSections = useMemo(
    () => [
      {
        title: "1. Why mapping is required",
        body: [
          "Xero accepts a manual journal only when every line—wages, deductions, FICA/Medicare, net pay, revenue, tax, tips—points to a real account in your Chart of Accounts.",
          "Schedulaa builds those debit/credit lines for you. When all required kinds are mapped, the status chips turn green and Sync to Xero can run.",
        ],
      },
      {
        title: "2. How mapping works",
        body: [
          "Under Payroll mapping and Revenue mapping, pick the account code straight from your Xero chart.",
          "Need a new account? Create it in Xero, then click Refresh (or reconnect) so it appears in the dropdowns.",
          "You can update mapping at any time—future exports automatically use the new accounts.",
        ],
      },
      {
        title: "3. Recommended accounts",
        body: [
          "Expenses: Wages & Salaries, Holiday/Vacation Pay, Tips Paid, Sales Commissions.",
          "Liabilities: Income tax payable, CPP/QPP payable, EI payable, FICA payable (US), Medicare payable (US), Tips payable.",
          "Net pay: A payroll clearing / net pay liability account linked to your payroll bank account.",
          "Revenue: Service Income, Product Sales, Sales Tax Payable, Tips Payable.",
        ],
      },
      {
        title: "4. Exporting payroll",
        body: [
          "Finalize payroll, load the run, and click Sync to Xero.",
          "Schedulaa sends a balanced journal (wages + employer portions + deductions + net pay + tips payable). No manual edits required.",
        ],
      },
      {
        title: "5. Exporting revenue / sales",
        body: [
          "Use the revenue export card to push summarized service/product revenue, sales tax, and tips payable for a date range.",
          "Each export stores the Xero ManualJournalID inside Schedulaa for a full audit trail.",
        ],
      },
      {
        title: "6. Recommended presets",
        body: [
          "The preset dropdown gives industry-specific hints (e.g., Beauty & Wellness).",
          "Selecting a preset doesn’t change any Xero data—it just updates the helper text so you know which kinds usually map to which account types.",
        ],
      },
      {
        title: "7. Default Xero references (tracking + lock date)",
        body: [
          "Default tracking category/option: used when a payroll or revenue export has no department-specific mapping.",
          "Lock exports before / Allow backdated exports: protect closed periods. Set a lock date and toggle whether backdated exports are allowed.",
        ],
      },
      {
        title: "8. Departments ↔ Tracking",
        body: [
          "Use the table to map each Schedulaa department (team/branch/studio) to a Xero tracking option.",
          "If a department is mapped, that tracking option is attached to the journal line. If not, Schedulaa falls back to the defaults from section 7.",
        ],
      },
      {
        title: "9. Common questions",
        body: [
          "Do I need every account pre-created? No—map to existing accounts or add new ones in Xero first.",
          "Can I change mappings later? Yes, future exports immediately use the updated accounts.",
          "Not seeing a new account? Click Refresh (or reconnect) after adding it in Xero.",
        ],
      },
      {
        title: "10. Adding accounts in Xero",
        body: [
          "Accounting → Chart of accounts → Add Account.",
          "Example: Account Type = Liability, Code = 213, Name = FICA payable, Tax = Tax Exempt.",
          "Repeat for Medicare payable, Net pay/Payroll clearing, and any other expense/liability/revenue accounts.",
        ],
      },
      {
        title: "11. Tracking categories in Xero",
        body: [
          "Accounting → Accounting settings → Tracking categories → Add Tracking Category (e.g., Departments).",
          "Add options (e.g., Downtown Studio, York Mills).",
          "Return to Schedulaa, click Refresh, then set your default tracking and department mappings.",
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
      const res = await xeroIntegration.preview({ payroll_id: previewState.payrollId });
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

  const currentPreset = useMemo(
    () => presets.find((preset) => preset.id === selectedPresetId),
    [presets, selectedPresetId]
  );
  const presetHints = currentPreset?.kinds || {};
  const selectedTrackingCategory = useMemo(
    () => trackingCategories.find((cat) => cat.id === defaults.tracking_category_id),
    [trackingCategories, defaults.tracking_category_id]
  );
  const trackingIndex = useMemo(() => {
    const map = {};
    trackingRows.forEach((row) => {
      map[`${row.local_type}:${row.local_id}`] = row;
    });
    return map;
  }, [trackingRows]);

  const renderMappingSection = (title, kinds, missingList = []) => (
    <SectionCard
      key={title}
      title={title}
      description={status?.connected ? undefined : t("settings.xero.connectToMap", "Connect to Xero to configure mappings.")}
    >
      <Stack spacing={2}>
        {missingList.length > 0 && (
          <Alert severity="warning">
            {t("settings.xero.missingMappings", "Missing: {{list}}", {
              list: missingList.map((k) => KIND_LABELS[k] || k).join(", "),
            })}
          </Alert>
        )}
        {kinds.map((kind) => {
          const current = accountMap[kind]?.xero_account_code || "";
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
                  disabled={!status?.connected || !canManageIntegrations || savingKind === kind}
                >
                  <InputLabel>Account</InputLabel>
                  <Select
                    label="Account"
                    value={current}
                    onChange={(e) => handleMappingChange(kind, e.target.value)}
                    MenuProps={{ PaperProps: { style: { maxHeight: 320 } } }}
                  >
                    <MenuItem value="">
                      <em>{t("settings.xero.unmapped", "Not mapped")}</em>
                    </MenuItem>
                    {accounts.map((acc) => (
                      <MenuItem key={acc.code} value={acc.code}>
                        {acc.code} — {acc.name || "Unnamed"}
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

  const renderDepartmentTracking = () => {
    if (!status?.connected) return null;
    return (
      <SectionCard
        title={t("settings.xero.departmentTracking.title", "Departments ↔ Tracking")}
        description={t(
          "settings.xero.departmentTracking.subtitle",
          "Map each department to a Xero tracking category option for cost-center reporting."
        )}
      >
        {departments.length === 0 ? (
          <Alert severity="info">{t("settings.xero.departmentTracking.empty", "No departments yet.")}</Alert>
        ) : trackingCategories.length === 0 ? (
          <Alert severity="info">
            {t("settings.xero.departmentTracking.noCategories", "No tracking categories available in Xero. Add them in Xero first, then refresh.")}
          </Alert>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>{t("settings.xero.departmentTracking.name", "Name")}</TableCell>
                <TableCell>{t("settings.xero.departmentTracking.category", "Tracking category")}</TableCell>
                <TableCell>{t("settings.xero.departmentTracking.option", "Tracking option")}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {departments.map((dept) => {
                const key = `department:${dept.id}`;
                const current = trackingIndex[key] || {};
                const categoryId = current.tracking_category_id || "";
                const optionId = current.tracking_option_id || "";
                const categoryOptions =
                  trackingCategories.find((cat) => cat.id === categoryId)?.options || [];
                const saving = savingTrackingKey === key;
                return (
                  <TableRow key={key}>
                    <TableCell>{dept.name}</TableCell>
                    <TableCell>
                      <FormControl
                        fullWidth
                        size="small"
                        disabled={!canManageIntegrations || trackingCategories.length === 0 || saving}
                      >
                        <InputLabel>{t("settings.xero.departmentTracking.category", "Tracking category")}</InputLabel>
                        <Select
                          label={t("settings.xero.departmentTracking.category", "Tracking category")}
                          value={categoryId}
                          onChange={(e) => {
                            const nextCategoryId = e.target.value;
                            if (!nextCategoryId) {
                              handleTrackingUpdate("department", dept.id, {
                                tracking_category_id: "",
                                tracking_option_id: "",
                              });
                              return;
                            }
                            const firstOptionId =
                              (trackingCategories.find((cat) => cat.id === nextCategoryId)?.options ||
                                [])[0]?.id || "";
                            handleTrackingUpdate("department", dept.id, {
                              tracking_category_id: nextCategoryId,
                              tracking_option_id: firstOptionId,
                            });
                          }}
                        >
                          <MenuItem value="">
                            <em>{t("settings.common.notMapped", "Not mapped")}</em>
                          </MenuItem>
                          {trackingCategories.map((cat) => (
                            <MenuItem key={cat.id} value={cat.id}>
                              {cat.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </TableCell>
                    <TableCell>
                      <FormControl
                        fullWidth
                        size="small"
                        disabled={!canManageIntegrations || !categoryId || saving}
                      >
                        <InputLabel>{t("settings.xero.departmentTracking.option", "Tracking option")}</InputLabel>
                        <Select
                          label={t("settings.xero.departmentTracking.option", "Tracking option")}
                          value={optionId}
                          onChange={(e) =>
                            handleTrackingUpdate("department", dept.id, {
                              tracking_category_id: categoryId,
                              tracking_option_id: e.target.value,
                            })
                          }
                        >
                          <MenuItem value="">
                            <em>{t("settings.common.notMapped", "Not mapped")}</em>
                          </MenuItem>
                          {categoryOptions.map((opt) => (
                            <MenuItem key={opt.id} value={opt.id}>
                              {opt.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      {saving && <CircularProgress size={18} sx={{ ml: 1 }} />}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </SectionCard>
    );
  };

  const handleSaveDefaults = async () => {
    if (!status?.connected || !canManageIntegrations) return;
    setSavingDefaults(true);
    try {
      await xeroIntegration.saveSettings({
        default_tracking_category_id: defaults.tracking_category_id || null,
        default_tracking_category_name: defaults.tracking_category_name || "",
        default_tracking_option_id: defaults.tracking_option_id || null,
        default_tracking_option_name: defaults.tracking_option_name || "",
        lock_exports_before: defaults.lock_exports_before || null,
        allow_backdated_exports: defaults.allow_backdated_exports,
      });
      showMessage("Defaults saved", "success");
      refreshStatus();
    } catch (error) {
      showMessage(
        error?.displayMessage || error?.response?.data?.error || "Failed to save defaults",
        "error"
      );
    } finally {
      setSavingDefaults(false);
    }
  };

  const handleTrackingUpdate = async (localType, localId, payload) => {
    if (!status?.connected || !canManageIntegrations) return;
    const key = `${localType}:${localId}`;
    setSavingTrackingKey(key);
    try {
      await xeroIntegration.upsertTrackingMap({
        local_type: localType,
        local_id: localId,
        tracking_category_id: payload.tracking_category_id || null,
        tracking_option_id: payload.tracking_option_id || null,
      });
      await loadTrackingMap();
      showMessage("Mapping saved", "success");
    } catch (error) {
      showMessage(
        error?.displayMessage || error?.response?.data?.error || "Failed to save mapping",
        "error"
      );
    } finally {
      setSavingTrackingKey("");
    }
  };

  const statusChip = status?.connected ? (
    <Chip
      icon={<CheckCircleOutlineIcon />}
      label={t("settings.xero.connected", "Connected")}
      color="success"
      size="small"
    />
  ) : (
    <Chip
      icon={<CloudOffIcon />}
      label={t("settings.xero.disconnected", "Not connected")}
      color="default"
      size="small"
    />
  );

  const payrollOk = validation?.payroll?.ok;
  const revenueOk = validation?.revenue?.ok;

  return (
    <Stack spacing={3}>
      <SectionCard
        title={t("settings.xero.connectionTitle", "Xero connection")}
        actions={
          status?.connected ? (
            <Stack direction="row" spacing={1}>
              <Button
                size="small"
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={refreshStatus}
                disabled={!canManageIntegrations}
              >
                {t("settings.common.refresh", "Refresh")}
              </Button>
              <Button
                size="small"
                color="error"
                variant="outlined"
                onClick={handleDisconnect}
                disabled={!canManageIntegrations}
              >
                {t("settings.xero.disconnect", "Disconnect")}
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
              {t("settings.xero.connect", "Connect Xero")}
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
              {status?.org_name && (
                <Typography variant="body2" color="text.secondary">
                  {status.org_name}
                </Typography>
              )}
            </Stack>
            {status?.last_synced_at && (
              <Typography variant="body2" color="text.secondary">
                {t("settings.xero.lastSync", "Last synced: {{value}}", {
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
                  "settings.xero.connectHint",
                  "Connect your Xero organisation to enable payroll and revenue exports."
                )}
              </Alert>
            )}
            {status?.connected && !canManageIntegrations && (
              <Alert severity="info">
                {t(
                  "settings.xero.permission.readOnly",
                  "You can view Xero mappings but need finance permission to make changes."
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
            Recommended workflows with Xero + Zapier
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
            <Typography variant="body2" color="text.secondary" paragraph>
              Use Xero for official accounting, and Zapier for automation and analytics.
            </Typography>
            <Stack component="ul" spacing={0.5} sx={{ pl: 2 }}>
              <Typography component="li" variant="body2">
                Post balanced payroll and revenue journals from Schedulaa into Xero using the mappings below.
              </Typography>
              <Typography component="li" variant="body2">
                Use the Zapier <code>payroll.details</code> event to send detailed per-employee payroll rows (hours, gross, net, taxes, deductions) to Google Sheets, Excel, or BI tools.
              </Typography>
              <Typography component="li" variant="body2">
                Send timeclock, break compliance, and PTO events to Slack/HR systems for monitoring and audits.
              </Typography>
              <Typography component="li" variant="body2">
                Combine Xero journals with Zapier exports for complete reconciliation and management reporting.
              </Typography>
            </Stack>
          </Paper>
        </AccordionDetails>
      </Accordion>

      {status?.connected && (
        <>
          <SectionCard
            title={t("settings.xero.presets.title", "Recommended presets")}
            description={t("settings.xero.presets.subtitle", "Pick an industry preset to see suggested mapping hints.")}
          >
            <FormControl fullWidth size="small" sx={{ maxWidth: 360 }}>
              <InputLabel>{t("settings.xero.presets.label", "Preset")}</InputLabel>
              <Select
                label={t("settings.xero.presets.label", "Preset")}
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
            title={t("settings.xero.defaults.title", "Default Xero references")}
            description={t(
              "settings.xero.defaults.subtitle",
              "Set fallback tracking and export guardrails used when a transaction has no specific tracking."
            )}
            actions={
              <Button
                size="small"
                variant="contained"
                onClick={handleSaveDefaults}
                disabled={savingDefaults || !canManageIntegrations}
              >
                {savingDefaults
                  ? t("settings.common.saving", "Saving...")
                  : t("settings.common.save", "Save")}
              </Button>
            }
          >
            {trackingCategories.length === 0 ? (
              <Alert severity="info">
                {t(
                  "settings.xero.defaults.noTracking",
                  "No tracking categories available yet. Create them in Xero to enable default tracking."
                )}
              </Alert>
            ) : (
              <>
                <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth size="small" disabled={!canManageIntegrations}>
                    <InputLabel>{t("settings.xero.defaults.category", "Tracking category")}</InputLabel>
                    <Select
                      label={t("settings.xero.defaults.category", "Tracking category")}
                      value={defaults.tracking_category_id || ""}
                      onChange={(e) => {
                        const nextId = e.target.value;
                        const nextCat =
                          trackingCategories.find((cat) => cat.id === nextId) || {};
                        setDefaults((prev) => ({
                          ...prev,
                          tracking_category_id: nextId,
                          tracking_category_name: nextCat.name || "",
                          tracking_option_id: "",
                          tracking_option_name: "",
                        }));
                      }}
                    >
                      <MenuItem value="">
                        <em>{t("settings.common.notMapped", "Not mapped")}</em>
                      </MenuItem>
                      {trackingCategories.map((cat) => (
                        <MenuItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl
                    fullWidth
                    size="small"
                    disabled={!canManageIntegrations || !defaults.tracking_category_id}
                  >
                    <InputLabel>{t("settings.xero.defaults.option", "Tracking option")}</InputLabel>
                    <Select
                      label={t("settings.xero.defaults.option", "Tracking option")}
                      value={defaults.tracking_option_id || ""}
                      onChange={(e) => {
                        const nextId = e.target.value;
                        const nextOpt =
                          (selectedTrackingCategory?.options || []).find((opt) => opt.id === nextId) || {};
                        setDefaults((prev) => ({
                          ...prev,
                          tracking_option_id: nextId,
                          tracking_option_name: nextOpt.name || "",
                        }));
                      }}
                    >
                      <MenuItem value="">
                        <em>{t("settings.common.notMapped", "Not mapped")}</em>
                      </MenuItem>
                      {(selectedTrackingCategory?.options || []).map((opt) => (
                        <MenuItem key={opt.id} value={opt.id}>
                          {opt.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    type="date"
                    label={t("settings.xero.defaults.lockDate", "Lock exports before")}
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
                  <FormControl fullWidth size="small" disabled={!canManageIntegrations}>
                    <InputLabel>
                      {t("settings.xero.defaults.allowBackdated", "Allow backdated exports")}
                    </InputLabel>
                    <Select
                      label={t("settings.xero.defaults.allowBackdated", "Allow backdated exports")}
                      value={defaults.allow_backdated_exports ? "yes" : "no"}
                      onChange={(e) =>
                        setDefaults((prev) => ({
                          ...prev,
                          allow_backdated_exports: e.target.value === "yes",
                        }))
                      }
                    >
                      <MenuItem value="no">{t("settings.common.no", "No")}</MenuItem>
                      <MenuItem value="yes">{t("settings.common.yes", "Yes")}</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                </Grid>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  Journals stay balanced (debits = credits). Use lock dates to protect closed periods, and review Integration Activity as your audit log (who exported what, when, and to which Xero ID).
                </Typography>
              </>
            )}
          </SectionCard>

          {renderDepartmentTracking()}
        </>
      )}

      <Accordion disableGutters>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            {t("settings.xero.help.title", "Need a hand with Xero mapping?")}
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <SectionCard
            title=""
            description={t(
              "settings.xero.help.subtitle",
              "Quick reminders so finance teams can sync payroll and revenue without guesswork."
            )}
            actions={
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                <Button
                  variant="contained"
                  startIcon={<HelpOutlineIcon />}
                  onClick={() => setGuideOpen(true)}
                >
                  {t("settings.xero.help.openGuide", "View setup guide")}
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<LaunchIcon />}
                  onClick={() => navigate("/manager/payroll")}
                >
                  {t("settings.xero.help.openPayroll", "Go to payroll preview")}
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
                  "settings.xero.help.footer",
                  "Integration complete = payroll badge green + revenue badge green + Sync to Xero button active."
                )}
              </Typography>
            </Stack>
          </SectionCard>
        </AccordionDetails>
      </Accordion>

      {status?.connected && (
        <Stack spacing={3}>
          <SectionCard
            title={t("settings.xero.validationTitle", "Mapping status")}
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
                    ? t("settings.xero.payrollReady", "Payroll mappings complete")
                    : t("settings.xero.payrollMissing", "Payroll mappings missing")
                }
              />
              <Chip
                icon={revenueOk ? <CheckCircleOutlineIcon /> : <WarningAmberIcon />}
                color={revenueOk ? "success" : "warning"}
                label={
                  revenueOk
                    ? t("settings.xero.revenueReady", "Revenue mappings complete")
                    : t("settings.xero.revenueMissing", "Revenue mappings missing")
                }
              />
              <Box flexGrow={1} />
              <Button
                size="small"
                variant="outlined"
                startIcon={<CloudUploadIcon />}
                onClick={openPreviewDialog}
              >
                {t("settings.xero.previewPayroll", "Preview payroll journal")}
              </Button>
            </Stack>
          </SectionCard>

          {renderMappingSection(
            t("settings.xero.payrollMapping", "Payroll account mapping"),
            PAYROLL_KINDS,
            missingPayrollKinds
          )}

          {renderMappingSection(
            t("settings.xero.revenueMapping", "Revenue account mapping"),
            REVENUE_KINDS,
            missingRevenueKinds
          )}
        </Stack>
      )}

      <Dialog open={previewState.open} onClose={closePreviewDialog} maxWidth="md" fullWidth>
        <DialogTitle>{t("settings.xero.previewDialogTitle", "Preview payroll journal")}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ my: 1 }}>
            <TextField
              label={t("settings.xero.previewPayrollId", "Payroll ID")}
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
                t("settings.xero.previewButton", "Load preview")
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
                {t("settings.xero.guide.title", "Xero setup guide")}
              </Typography>
              <Button size="small" onClick={() => setGuideOpen(false)}>
                {t("settings.common.close", "Close")}
              </Button>
            </Stack>
            <Typography variant="body2" color="text.secondary">
              {t(
                "settings.xero.guide.intro",
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
                {t("settings.xero.guide.openPayroll", "Open payroll")}
              </Button>
              <Button
                variant="outlined"
                startIcon={<LaunchIcon />}
                onClick={() => navigate("/manager/analytics?view=revenue")}
              >
                {t("settings.xero.guide.openRevenue", "Open revenue export")}
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Drawer>
    </Stack>
  );
};

export default SettingsXero;
