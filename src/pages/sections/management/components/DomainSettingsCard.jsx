
// src/pages/sections/management/components/DomainSettingsCard.jsx
import { useEffect, useMemo, useState } from "react";
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
  FormControlLabel,
  IconButton,
  Link,
  Paper,
  Stack,
  Switch,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import LaunchIcon from "@mui/icons-material/Launch";
import RefreshIcon from "@mui/icons-material/Refresh";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import BoltIcon from "@mui/icons-material/Bolt";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import { useSnackbar } from "notistack";
import { useSearchParams } from "react-router-dom";
import { Trans, useTranslation } from "react-i18next";

import DomainHelpDrawer from "./DomainHelpDrawer";
import useDomainSettings from "../../../../hooks/useDomainSettings";
import {
  isValidHostname,
  normalizeDomain,
  tenantBaseUrl,
} from "../../../../utils/tenant";

const DOCS_URL = "https://schedulaa.com/docs#integrations";
const SUPPORT_URL = "https://schedulaa.com/help/domains";
const CONNECT_REGISTRAR = "godaddy";
const MANUAL_TAB = "manual";
const CONNECT_TAB = "connect";

const buildStatusMeta = (t) => ({
  none: {
    label: t("management.domainSettings.status.none"),
    color: "default",
    icon: <ErrorOutlineIcon fontSize="small" />,
  },
  pending_dns: {
    label: t("management.domainSettings.status.pending"),
    color: "warning",
    icon: <InfoOutlinedIcon fontSize="small" />,
  },
  verified_dns: {
    label: t("management.domainSettings.status.verifiedDns"),
    color: "info",
    icon: <InfoOutlinedIcon fontSize="small" />,
  },
  provisioning_ssl: {
    label: t("management.domainSettings.status.provisioning"),
    color: "warning",
    icon: <ShieldOutlinedIcon fontSize="small" />,
  },
  ssl_active: {
    label: t("management.domainSettings.status.verified"),
    color: "success",
    icon: <CheckCircleIcon fontSize="small" />,
  },
  ssl_failed: {
    label: t("management.domainSettings.status.sslFailed"),
    color: "error",
    icon: <ErrorOutlineIcon fontSize="small" />,
  },
  verified: {
    label: t("management.domainSettings.status.verified"),
    color: "success",
    icon: <CheckCircleIcon fontSize="small" />,
  },
});

const buildSslMeta = (t) => ({
  pending: { label: t("management.domainSettings.ssl.pending"), color: "warning" },
  active: { label: t("management.domainSettings.ssl.active"), color: "success" },
  error: { label: t("management.domainSettings.ssl.error"), color: "error" },
});

const buildPurchaseLinks = (t) => [
  {
    key: "godaddy",
    label: t("management.domainSettings.purchaseLinks.godaddy"),
    href: (suggested) =>
      `https://www.godaddy.com/domainsearch/find?domainToCheck=${encodeURIComponent(
        suggested || ""
      )}`,
  },
  {
    key: "namecheap",
    label: t("management.domainSettings.purchaseLinks.namecheap"),
    href: (suggested) =>
      `https://www.namecheap.com/domains/registration/results/?domain=${encodeURIComponent(
        suggested || ""
      )}`,
  },
  {
    key: "cloudflare",
    label: t("management.domainSettings.purchaseLinks.cloudflare"),
    href: () => "https://www.cloudflare.com/products/registrar/",
  },
];

const buildHelpSections = (t) =>
  t("management.domainSettings.help.sections", { returnObjects: true }) || [];

const buildConnectStateCopy = (t) => ({
  pending: {
    title: t("management.domainSettings.connectState.pending.title"),
    description: t("management.domainSettings.connectState.pending.description"),
  },
  verifying: {
    title: t("management.domainSettings.connectState.verifying.title"),
    description: t("management.domainSettings.connectState.verifying.description"),
  },
  completed: {
    title: t("management.domainSettings.connectState.completed.title"),
    description: t("management.domainSettings.connectState.completed.description"),
  },
  failed: {
    title: t("management.domainSettings.connectState.failed.title"),
    description: t("management.domainSettings.connectState.failed.description"),
  },
});

const formatDateTime = (value, t) => {
  if (!value) return t("management.domainSettings.labels.never");
  try {
    const date = value instanceof Date ? value : new Date(value);
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  } catch {
    return String(value);
  }
};

const formatDuration = (seconds) => {
  if (!seconds || Number.isNaN(seconds)) return null;
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return remainder ? `${minutes}m ${remainder}s` : `${minutes}m`;
};

async function copyToClipboard(value) {
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch {
    // ignore and fall back to prompt
  }
  try {
    const textarea = document.createElement("textarea");
    textarea.value = value;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "absolute";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
    return true;
  } catch {
    return false;
  }
}
const DomainSettingsCard = ({
  companyId,
  companySlug,
  primaryHost,
  onDomainChange,
}) => {
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    status,
    domain,
    verifiedAt,
    instructions,
    verificationToken,
    lastChecked,
    loading,
    refreshing,
    processing,
    action,
    error,
    setError,
    requestDomain,
    verifyDomain,
    removeDomain,
    refresh,
    registrarHint,
    sslStatus,
    sslError,
    notifyEmailEnabled,
    cnameWarning,
    cnameTarget,
    updateNotifyPreference,
    nextRetrySeconds,
    domainConnectSession,
    connectAuthorizationUrl,
    startDomainConnect,
    fetchDomainConnectSession,
  } = useDomainSettings(companyId);

  const statusMetaMap = useMemo(() => buildStatusMeta(t), [t]);
  const sslMetaMap = useMemo(() => buildSslMeta(t), [t]);
  const purchaseLinks = useMemo(() => buildPurchaseLinks(t), [t]);
  const helpSections = useMemo(() => buildHelpSections(t), [t]);
  const connectStateCopy = useMemo(() => buildConnectStateCopy(t), [t]);

  const [domainInput, setDomainInput] = useState("");
  const [validationError, setValidationError] = useState("");
  const [localInstructions, setLocalInstructions] = useState(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(MANUAL_TAB);

  useEffect(() => {
    setDomainInput(domain || "");
  }, [domain]);

  useEffect(() => {
    if (!onDomainChange) return;
    onDomainChange({ status, domain, verifiedAt });
  }, [onDomainChange, status, domain, verifiedAt]);

  useEffect(() => {
    const sessionId = searchParams.get("domain_connect_session");
    if (!sessionId) return;
    fetchDomainConnectSession(sessionId)
      .then(() => {
        enqueueSnackbar(t("management.domainSettings.notifications.connectResumed"), {
          variant: "info",
        });
      })
      .catch((err) => {
        enqueueSnackbar(
          err?.displayMessage ||
            t("management.domainSettings.notifications.connectResumeFailed"),
          { variant: "error" }
        );
      })
      .finally(() => {
        const params = new URLSearchParams(searchParams);
        params.delete("domain_connect_session");
        setSearchParams(params, { replace: true });
      });
  }, [searchParams, setSearchParams, fetchDomainConnectSession, enqueueSnackbar, t]);

  useEffect(() => {
    if (registrarHint !== CONNECT_REGISTRAR && activeTab === CONNECT_TAB) {
      setActiveTab(MANUAL_TAB);
    }
  }, [registrarHint, activeTab]);

  const instructionsToShow = instructions || localInstructions;
  const effectiveToken = verificationToken || instructionsToShow?.TXT?.value || null;

  const baseUrl = useMemo(
    () => tenantBaseUrl({ customDomain: domain, slug: companySlug, primaryHost }),
    [domain, companySlug, primaryHost]
  );

  const statusMeta = statusMetaMap[status] || statusMetaMap.none;
  const sslMeta = sslStatus ? sslMetaMap[sslStatus] : null;
  const connectAvailable = registrarHint === CONNECT_REGISTRAR;
  const suggestedDomain = companySlug ? `${companySlug}.com` : "";
  const verifyDisabled =
    processing || !companyId || status === "none" || Boolean(nextRetrySeconds);
  const durationLabel = formatDuration(nextRetrySeconds);
  const verifyHint = durationLabel
    ? t("management.domainSettings.messages.verifyHint", { time: durationLabel })
    : null;

  const refreshStatus = async () => {
    try {
      await refresh();
      enqueueSnackbar(t("management.domainSettings.notifications.statusRefreshed"), {
        variant: "info",
      });
    } catch (err) {
      enqueueSnackbar(
        err?.displayMessage ||
          err?.message ||
          t("management.domainSettings.notifications.refreshFailed"),
        { variant: "error" }
      );
    }
  };

  const handleRequest = async () => {
    const normalized = normalizeDomain(domainInput);
    if (!normalized) {
      setValidationError(t("management.domainSettings.validation.enterDomain"));
      return;
    }
    if (!isValidHostname(normalized)) {
      setValidationError(t("management.domainSettings.validation.invalidDomain"));
      return;
    }
    setValidationError("");
    setError(null);
    try {
      const res = await requestDomain(normalized);
      if (res?.instructions) setLocalInstructions(res.instructions);
      enqueueSnackbar(
        t("management.domainSettings.notifications.dnsGenerated"),
        { variant: "success" }
      );
    } catch (err) {
      enqueueSnackbar(
        err?.displayMessage ||
          err?.message ||
          t("management.domainSettings.notifications.requestFailed"),
        { variant: "error" }
      );
    }
  };

  const handleVerify = async () => {
    setError(null);
    try {
      const res = await verifyDomain();
      const nextStatus = res?.status || (res?.verified ? "verified" : status);
      if (nextStatus === "verified") {
        enqueueSnackbar(
          t("management.domainSettings.notifications.verifySuccess"),
          { variant: "success" }
        );
      } else {
        enqueueSnackbar(
          t("management.domainSettings.notifications.verifyPending"),
          { variant: "info" }
        );
      }
    } catch (err) {
      enqueueSnackbar(
        err?.displayMessage ||
          err?.message ||
          t("management.domainSettings.notifications.verifyFailed"),
        { variant: "error" }
      );
    }
  };

  const handleRemove = async () => {
    if (!domain) {
      setDomainInput("");
      setError(null);
      return;
    }
    if (!window.confirm(t("management.domainSettings.confirmations.remove"))) return;
    setError(null);
    try {
      await removeDomain();
      setDomainInput("");
      enqueueSnackbar(t("management.domainSettings.notifications.domainRemoved"), {
        variant: "success",
      });
    } catch (err) {
      enqueueSnackbar(
        err?.displayMessage ||
          err?.message ||
          t("management.domainSettings.notifications.removeFailed"),
        { variant: "error" }
      );
    }
  };

  const handleNotifyToggle = async (event) => {
    const enabled = event.target.checked;
    try {
      await updateNotifyPreference(enabled);
      enqueueSnackbar(
        enabled
          ? t("management.domainSettings.notifications.notifyEnabled")
          : t("management.domainSettings.notifications.notifyDisabled"),
        { variant: "success" }
      );
    } catch (err) {
      enqueueSnackbar(
        err?.displayMessage ||
          err?.message ||
          t("management.domainSettings.notifications.notifyFailed"),
        { variant: "error" }
      );
    }
  };

  const handleCopy = async (value, labelKey) => {
    if (!value) return;
    const ok = await copyToClipboard(value);
    const label = t(labelKey);
    if (ok) {
      enqueueSnackbar(
        t("management.domainSettings.notifications.copySuccess", { label }),
        { variant: "success" }
      );
    } else {
      enqueueSnackbar(t("management.domainSettings.notifications.copyFailed"), {
        variant: "warning",
      });
    }
  };

  const handleRefresh = async () => {
    await refreshStatus();
  };

  const handleDomainConnectStart = async () => {
    const normalized = normalizeDomain(domainInput || domain);
    if (!normalized) {
      setActiveTab(MANUAL_TAB);
      setValidationError(t("management.domainSettings.validation.connectEnterDomain"));
      return;
    }
    if (!isValidHostname(normalized)) {
      setActiveTab(MANUAL_TAB);
      setValidationError(t("management.domainSettings.validation.invalidDomain"));
      return;
    }
    try {
      const result = await startDomainConnect(normalized, { registrar: CONNECT_REGISTRAR });
      const url =
        result?.authorization_url ||
        result?.redirect_url ||
        result?.url ||
        connectAuthorizationUrl;
      if (url) {
        window.location.href = url;
      } else {
        enqueueSnackbar(
          t("management.domainSettings.notifications.connectCreated"),
          { variant: "info" }
        );
      }
    } catch (err) {
      enqueueSnackbar(
        err?.displayMessage ||
          err?.message ||
          t("management.domainSettings.notifications.connectFailed"),
        { variant: "error" }
      );
    }
  };

  const helpGenerateDns = () => {
    setHelpOpen(false);
    setActiveTab(MANUAL_TAB);
    handleRequest();
  };

  const helpVerifyDns = () => {
    setHelpOpen(false);
    setActiveTab(MANUAL_TAB);
    handleVerify();
  };

  const helpDomainConnect = () => {
    setHelpOpen(false);
    setActiveTab(CONNECT_TAB);
    handleDomainConnectStart();
  };

  const helpRefreshStatus = () => {
    setHelpOpen(false);
    handleRefresh();
  };
  const instructionsContent = instructionsToShow
    ? (
        <Box sx={{ borderRadius: 1, border: (theme) => `1px solid ${theme.palette.divider}`, p: 2 }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              {t("management.domainSettings.instructions.title")}
            </Typography>
            <Tooltip title={t("management.domainSettings.instructions.tooltip")}>
              <HelpOutlineIcon fontSize="small" color="action" />
            </Tooltip>
          </Stack>
          <Stack spacing={1}>
            {instructionsToShow?.TXT && (
              <RecordRow
                label="TXT"
                host={instructionsToShow.TXT.host}
                value={instructionsToShow.TXT.value}
                onCopy={() =>
                  handleCopy(
                    `${instructionsToShow.TXT.host} => ${instructionsToShow.TXT.value}`,
                    "management.domainSettings.instructions.txtLabel"
                  )
                }
              />
            )}
            {instructionsToShow?.CNAME && (
              <RecordRow
                label="CNAME"
                host={instructionsToShow.CNAME.host}
                value={instructionsToShow.CNAME.value}
                onCopy={() =>
                  handleCopy(
                    `${instructionsToShow.CNAME.host} => ${instructionsToShow.CNAME.value}`,
                    "management.domainSettings.instructions.cnameLabel"
                  )
                }
              />
            )}
            {effectiveToken && (
              <Typography variant="caption" color="text.secondary">
                {t("management.domainSettings.instructions.token", { token: effectiveToken })}
              </Typography>
            )}
          </Stack>
        </Box>
      )
    : null;

  const sessionNode = (() => {
    if (!domainConnectSession) return null;
    const state = domainConnectSession.state || "pending";
    const copy = connectStateCopy[state] || connectStateCopy.pending;
    return (
      <Alert
        severity={state === "failed" ? "error" : "info"}
        icon={state === "failed" ? undefined : <BoltIcon fontSize="inherit" />}
        sx={{ mt: 2 }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
          {copy.title}
        </Typography>
        <Typography variant="body2" sx={{ mt: 0.5 }}>
          {copy.description}
        </Typography>
        {domainConnectSession.error && (
          <Typography variant="body2" color="error" sx={{ mt: 1 }}>
            {domainConnectSession.error}
          </Typography>
        )}
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
          {t("management.domainSettings.connectState.created", {
            time: formatDateTime(domainConnectSession.created_at, t),
          })}
        </Typography>
        {domainConnectSession.completed_at && (
          <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
            {t("management.domainSettings.connectState.updated", {
              time: formatDateTime(domainConnectSession.completed_at, t),
            })}
          </Typography>
        )}
      </Alert>
    );
  })();

  const quickVerify = !verifyDisabled ? helpVerifyDns : undefined;
  const quickConnect = connectAvailable ? helpDomainConnect : undefined;
  return (
    <>
      <Paper sx={{ p: 3, mb: 3 }} variant="outlined">
        <Stack spacing={3}>
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={1.5}
            alignItems={{ xs: "flex-start", md: "center" }}
          >
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {t("management.domainSettings.title")}
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5, flexWrap: "wrap" }}>
                <Chip
                  icon={statusMeta.icon}
                  label={statusMeta.label}
                  color={statusMeta.color === "default" ? undefined : statusMeta.color}
                  variant={statusMeta.color === "default" ? "outlined" : "filled"}
                  size="small"
                />
                {sslMeta && (
                  <Chip
                    icon={<ShieldOutlinedIcon fontSize="small" />}
                    label={sslMeta.label}
                    color={sslMeta.color}
                    size="small"
                    variant="outlined"
                  />
                )}
                {registrarHint && (
                  <Chip
                    size="small"
                    variant="outlined"
                    label={t("management.domainSettings.labels.registrar", { name: registrarHint })}
                  />
                )}
              </Stack>
              <Stack direction="row" spacing={1.5} sx={{ mt: 1, flexWrap: "wrap" }}>
                <Typography variant="body2" color="text.secondary">
                  {t("management.domainSettings.labels.lastChecked", {
                    time: formatDateTime(lastChecked, t),
                  })}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {status === "verified"
                    ? t("management.domainSettings.labels.verifiedAt", {
                        time: formatDateTime(verifiedAt, t),
                      })
                    : t("management.domainSettings.labels.verifiedPending")}
                </Typography>
              </Stack>
            </Box>

            <Tooltip title={t("management.domainSettings.tooltips.openHelp")}>
              <span>
                <Button
                  size="small"
                  variant="text"
                  onClick={() => setHelpOpen(true)}
                  startIcon={<HelpOutlineIcon fontSize="small" />}
                >
                  {t("management.domainSettings.buttons.help")}
                </Button>
              </span>
            </Tooltip>

            <Tooltip title={t("management.domainSettings.tooltips.refreshStatus")}>
              <span>
                <Button
                  size="small"
                  variant="text"
                  onClick={handleRefresh}
                  disabled={processing || refreshing || loading || !companyId}
                  startIcon={refreshing ? <CircularProgress size={16} /> : <RefreshIcon fontSize="small" />}
                >
                  {t("management.domainSettings.buttons.refresh")}
                </Button>
              </span>
            </Tooltip>
          </Stack>

          {!companyId && (
            <Alert severity="warning">{t("management.domainSettings.notifications.selectCompany")}</Alert>
          )}

          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              {t("management.domainSettings.sections.needDomain")}
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
              {purchaseLinks.map(({ key, label, href }) => (
                <Button
                  key={key}
                  variant="outlined"
                  endIcon={<LaunchIcon fontSize="small" />}
                  href={href(suggestedDomain)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {label}
                </Button>
              ))}
            </Stack>
          </Box>

          <Divider />

          <Stack spacing={2}>
            {connectAvailable ? (
              <Box>
                <Tabs
                  value={activeTab}
                  onChange={(_, value) => setActiveTab(value)}
                  aria-label="Domain setup tabs"
                  sx={{ mb: 2 }}
                >
                  <Tab value={MANUAL_TAB} label={t("management.domainSettings.tabs.manual")} />
                  <Tab
                    value={CONNECT_TAB}
                    label={t("management.domainSettings.tabs.connect", { registrar: "GoDaddy" })}
                  />
                </Tabs>
                {activeTab === MANUAL_TAB && (
                  <ManualPanel
                    domainInput={domainInput}
                    setDomainInput={setDomainInput}
                    setValidationError={setValidationError}
                    validationError={validationError}
                    processing={processing}
                    companyId={companyId}
                    handleRequest={handleRequest}
                    handleVerify={handleVerify}
                    handleRemove={handleRemove}
                    instructions={instructionsContent}
                    verifyDisabled={verifyDisabled}
                    verifyHint={verifyHint}
                    status={status}
                    baseUrl={baseUrl}
                    handleCopy={handleCopy}
                    notifyEmailEnabled={notifyEmailEnabled}
                    handleNotifyToggle={handleNotifyToggle}
                    notifyProcessing={processing && action === "notify_opt_in"}
                    sslStatus={sslStatus}
                    sslError={sslError}
                    cnameWarning={cnameWarning}
                    cnameTarget={cnameTarget}
                    cdnProvider={cdnProvider}
                    verifiedAt={verifiedAt}
                  />
                )}
                {activeTab === CONNECT_TAB && (
                  <ConnectPanel
                    domainInput={domainInput}
                    setDomainInput={setDomainInput}
                    setValidationError={setValidationError}
                    validationError={validationError}
                    processing={processing}
                    companyId={companyId}
                    registrarHint={registrarHint}
                    handleStart={handleDomainConnectStart}
                    sessionNode={sessionNode}
                    onSwitchManual={() => setActiveTab(MANUAL_TAB)}
                    refresh={handleRefresh}
                    connectAuthorizationUrl={connectAuthorizationUrl}
                    instructions={instructions}
                  />
                )}
              </Box>
            ) : (
              <ManualPanel
                domainInput={domainInput}
                setDomainInput={setDomainInput}
                setValidationError={setValidationError}
                validationError={validationError}
                processing={processing}
                companyId={companyId}
                handleRequest={handleRequest}
                handleVerify={handleVerify}
                handleRemove={handleRemove}
                instructions={instructionsContent}
                verifyDisabled={verifyDisabled}
                verifyHint={verifyHint}
                status={status}
                baseUrl={baseUrl}
                handleCopy={handleCopy}
                notifyEmailEnabled={notifyEmailEnabled}
                handleNotifyToggle={handleNotifyToggle}
                notifyProcessing={processing && action === "notify_opt_in"}
                sslStatus={sslStatus}
                sslError={sslError}
                cnameWarning={cnameWarning}
                cnameTarget={cnameTarget}
                cdnProvider={cdnProvider}
                verifiedAt={verifiedAt}
              />
            )}
          </Stack>

          <Divider />

          <DomainHelpAccordion sections={helpSections} />

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.5}
            alignItems={{ xs: "stretch", sm: "center" }}
          >
            <Button
              variant="text"
              component={Link}
              href={DOCS_URL}
              target="_blank"
              rel="noopener"
            >
              {t("management.domainSettings.buttons.docsLink")}
            </Button>
            <Button
              variant="contained"
              color="secondary"
              endIcon={<LaunchIcon fontSize="small" />}
              href={SUPPORT_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t("management.domainSettings.buttons.setupHelp")}
            </Button>
          </Stack>
        </Stack>
      </Paper>

      <DomainHelpDrawer
        open={helpOpen}
        onClose={() => setHelpOpen(false)}
        status={status}
        sslStatus={sslStatus}
        registrarHint={registrarHint}
        domain={domain || domainInput || ""}
        nextRetrySeconds={nextRetrySeconds}
        docsUrl={DOCS_URL}
        supportUrl={SUPPORT_URL}
        onGenerateDns={companyId ? helpGenerateDns : undefined}
        onVerifyDns={companyId && quickVerify ? quickVerify : undefined}
        onStartConnect={companyId && quickConnect ? quickConnect : undefined}
        onRefreshStatus={companyId ? helpRefreshStatus : undefined}
      />
    </>
  );
};
const ManualPanel = ({
  domainInput,
  setDomainInput,
  setValidationError,
  validationError,
  processing,
  companyId,
  handleRequest,
  handleVerify,
  handleRemove,
  instructions,
  verifyDisabled,
  verifyHint,
  status,
  baseUrl,
  handleCopy,
  notifyEmailEnabled,
  handleNotifyToggle,
  notifyProcessing,
  sslStatus,
  sslError,
  cnameWarning,
  cnameTarget,
  cdnProvider,
  verifiedAt,
}) => {
  const { t } = useTranslation();
  const isLive = ["verified", "ssl_active"].includes(status);
  const showSslSteps = cdnProvider === "cloudflare";
  const stepItems = [
    { key: "dns", label: t("management.domainSettings.steps.dnsVerified"), done: Boolean(verifiedAt) },
    {
      key: "ssl",
      label: t("management.domainSettings.steps.sslProvisioning"),
      done: Boolean(verifiedAt) && (sslStatus === "pending" || sslStatus === "active"),
    },
    { key: "active", label: t("management.domainSettings.steps.sslActive"), done: sslStatus === "active" },
  ];
  return (
    <Stack spacing={2}>
      <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ xs: "stretch", md: "center" }}>
        <TextField
          fullWidth
          label={t("management.domainSettings.manual.domainLabel")}
          placeholder="www.customer.com"
          value={domainInput}
          onChange={(event) => {
            if (validationError) setValidationError("");
            setDomainInput(event.target.value);
          }}
          helperText={validationError || t("management.domainSettings.manual.helper")}
          error={Boolean(validationError)}
          disabled={processing || !companyId}
        />
        <Stack direction="row" spacing={1} alignItems="center" sx={{ flexShrink: 0, flexWrap: "wrap" }}>
          <Button
            variant="contained"
            onClick={handleRequest}
            disabled={processing || !domainInput || !companyId}
          >
            {t("management.domainSettings.buttons.generateDns")}
          </Button>
          <Tooltip title={verifyHint || t("management.domainSettings.tooltips.verifyDns")}>
            <span>
              <Button
                variant="outlined"
                onClick={handleVerify}
                disabled={verifyDisabled}
              >
                {t("management.domainSettings.buttons.verifyDns")}
              </Button>
            </span>
          </Tooltip>
          <Button
            variant="text"
            color="error"
            onClick={handleRemove}
            disabled={processing || status === "none" || !companyId}
          >
            {t("management.domainSettings.buttons.remove")}
          </Button>
        </Stack>
      </Stack>

      {verifyHint && (
        <Alert severity="info" icon={<InfoOutlinedIcon fontSize="inherit" />}>
          {verifyHint}
        </Alert>
      )}

      {showSslSteps && (
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} flexWrap="wrap">
          {stepItems.map((step) => (
            <Chip
              key={step.key}
              label={step.label}
              color={step.done ? "success" : "default"}
              variant={step.done ? "filled" : "outlined"}
              size="small"
            />
          ))}
        </Stack>
      )}

      {instructions}

      {cnameWarning && (
        <Alert severity="warning">
          {cnameWarning} {cnameTarget ? `(${cnameTarget})` : ""}
        </Alert>
      )}

      {sslStatus === "pending" && (
        <Alert severity="info" icon={<ShieldOutlinedIcon fontSize="inherit" />}>
          {t("management.domainSettings.manual.sslPending")}
        </Alert>
      )}

      {sslStatus === "error" && sslError && (
        <Alert severity="error" icon={<ShieldOutlinedIcon fontSize="inherit" />}>
          {t("management.domainSettings.manual.sslError", { error: sslError })}
        </Alert>
      )}

      <Divider />

      <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ xs: "flex-start", md: "center" }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            {t("management.domainSettings.manual.liveUrlTitle")}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {isLive
              ? t("management.domainSettings.manual.liveUrlVerified")
              : t("management.domainSettings.manual.liveUrlPending")}
          </Typography>
          <TextField
            size="small"
            fullWidth
            sx={{ mt: 1 }}
            InputProps={{ readOnly: true }}
            value={baseUrl}
          />
        </Box>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            endIcon={<LaunchIcon />}
            href={baseUrl}
            target="_blank"
            rel="noopener noreferrer"
            disabled={!baseUrl}
          >
            {t("management.domainSettings.buttons.open")}
          </Button>
          <Button
            variant="text"
            startIcon={<ContentCopyIcon />}
            onClick={() => handleCopy(baseUrl, "management.domainSettings.manual.urlLabel")}
          >
            {t("management.domainSettings.buttons.copy")}
          </Button>
        </Stack>
      </Stack>

      <FormControlLabel
        control={
          <Switch
            checked={Boolean(notifyEmailEnabled)}
            onChange={handleNotifyToggle}
            disabled={notifyProcessing}
          />
        }
        label={t("management.domainSettings.manual.notifyToggle")}
      />
    </Stack>
  );
};
const ConnectPanel = ({
  domainInput,
  setDomainInput,
  setValidationError,
  validationError,
  processing,
  companyId,
  registrarHint,
  handleStart,
  sessionNode,
  onSwitchManual,
  refresh,
  connectAuthorizationUrl,
  instructions,
}) => {
  const { t } = useTranslation();
  return (
    <Stack spacing={2}>
      <Typography variant="body2" color="text.secondary">
        {t("management.domainSettings.connect.description")}
      </Typography>

      <TextField
        fullWidth
        label={t("management.domainSettings.manual.domainLabel")}
        placeholder="www.customer.com"
        value={domainInput}
        onChange={(event) => {
          setValidationError("");
          setDomainInput(event.target.value);
        }}
        helperText={
          validationError ||
          t("management.domainSettings.connect.registrarDetected", {
            registrar: registrarHint || t("management.domainSettings.labels.unknownRegistrar"),
          })
        }
        error={Boolean(validationError)}
        disabled={processing || !companyId}
      />

      <Stack direction="row" spacing={1} flexWrap="wrap">
        <Button
          variant="contained"
          onClick={handleStart}
          disabled={processing || !companyId}
        >
          {t("management.domainSettings.connect.start")}
        </Button>
        <Button variant="text" onClick={onSwitchManual}>
          {t("management.domainSettings.connect.switchManual")}
        </Button>
        <Button variant="outlined" onClick={refresh} startIcon={<RefreshIcon fontSize="small" />}>
          {t("management.domainSettings.buttons.refresh")}
        </Button>
      </Stack>

      {connectAuthorizationUrl && (
        <Alert severity="info">
          <Trans
            i18nKey="management.domainSettings.connect.popup"
            components={{
              Link: <Link href={connectAuthorizationUrl} target="_blank" rel="noopener noreferrer" />,
            }}
          />
        </Alert>
      )}

      {sessionNode}

      {instructions && (
        <Alert severity="success" sx={{ mt: 2 }}>
          {t("management.domainSettings.connect.recordsConfirmed")}
        </Alert>
      )}
    </Stack>
  );
};
const DomainHelpAccordion = ({ sections }) => {
  const { t } = useTranslation();
  return (
    <Box>
      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
        {t("management.domainSettings.help.title")}
      </Typography>
      {(sections || []).map(({ title, body }) => (
        <Accordion key={title} sx={{ boxShadow: "none" }} disableGutters>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle2">{title}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={0.75}>
              {(body || []).map((line) => (
                <Typography key={line} variant="body2" color="text.secondary">
                  {line}
                </Typography>
              ))}
            </Stack>
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
};
const RecordRow = ({ label, host, value, onCopy }) => {
  const { t } = useTranslation();
  return (
    <Stack
      direction={{ xs: "column", md: "row" }}
      spacing={1}
      alignItems={{ xs: "flex-start", md: "center" }}
      sx={{ border: (theme) => `1px solid ${theme.palette.divider}`, borderRadius: 1, p: 1.5 }}
    >
      <Box sx={{ minWidth: 72 }}>
        <Typography variant="overline" color="text.secondary">
          {label}
        </Typography>
      </Box>
      <Box sx={{ flex: 1 }}>
        <Typography variant="body2" sx={{ fontFamily: "monospace" }}>
          {host || " "}
        </Typography>
        <Typography variant="body2" sx={{ fontFamily: "monospace" }}>
          {value || " "}
        </Typography>
      </Box>
      <Tooltip title={t("management.domainSettings.tooltips.copyRecord")}>
        <span>
          <IconButton size="small" onClick={onCopy} disabled={!value}>
            <ContentCopyIcon fontSize="inherit" />
          </IconButton>
        </span>
      </Tooltip>
    </Stack>
  );
};

export default DomainSettingsCard;
