
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
import { getUserTimezone } from "../../../../utils/timezone";

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

const statusChipSx = (meta) => {
  if (meta?.color === "warning") {
    return {
      bgcolor: "#fff3cd",
      color: "#8a4b00",
      borderColor: "#f3c46b",
      "& .MuiChip-icon": {
        color: "#8a4b00",
      },
    };
  }
  return undefined;
};

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

const formatDateTime = (value, t, tz = getUserTimezone()) => {
  if (!value) return t("management.domainSettings.labels.never");
  try {
    const date = value instanceof Date ? value : new Date(value);
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: tz,
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

const normalizeRedirectTarget = (value) => {
  if (!value) return "";
  try {
    const url = new URL(value);
    const pathname = url.pathname === "/" ? "" : url.pathname;
    return `${url.protocol}//${url.host.toLowerCase()}${pathname}`;
  } catch {
    return String(value || "").trim();
  }
};

const buildRootRedirectMeta = ({ state, ok, expectedTarget, observedLocation, error }) => {
  const expected = normalizeRedirectTarget(expectedTarget);
  const observed = normalizeRedirectTarget(observedLocation);
  if (state === "detected") {
    return { state, severity: "success" };
  }
  if (state === "wrong_target") {
    return { state, severity: "warning" };
  }
  if (state === "could_not_check") {
    return { state, severity: "info" };
  }
  if (state === "missing") {
    return { state, severity: "info" };
  }
  if (ok || (observed && expected && observed === expected)) {
    return { state: "detected", severity: "success" };
  }
  if (observed) {
    return { state: "wrong_target", severity: "warning" };
  }
  if (error) {
    return { state: "could_not_check", severity: "info" };
  }
  return { state: "missing", severity: "info" };
};

const buildWorkerRouteMeta = ({ state, error }) => {
  if (state === "detected") {
    return { state, severity: "success" };
  }
  if (state === "missing") {
    return { state, severity: "warning" };
  }
  if (state === "could_not_check") {
    return { state, severity: "info" };
  }
  if (state === "manual_required") {
    return { state, severity: "info" };
  }
  if (error) {
    return { state: "could_not_check", severity: "info" };
  }
  return { state: "manual_required", severity: "info" };
};

const buildConnectionSummaryMeta = (summary, t) => {
  if (!summary) {
    return {
      label: t("management.domainSettings.summary.notStarted", { defaultValue: "Not started" }),
      severity: "info",
    };
  }
  switch (summary) {
    case "connected":
      return {
        label: t("management.domainSettings.summary.connected", { defaultValue: "Connected" }),
        severity: "success",
      };
    case "needs_attention":
      return {
        label: t("management.domainSettings.summary.needsAttention", { defaultValue: "Needs attention" }),
        severity: "warning",
      };
    default:
      return {
        label: t("management.domainSettings.summary.almostDone", { defaultValue: "Almost done" }),
        severity: "info",
      };
  }
};

const progressChipColor = (state) => {
  switch (state) {
    case "done":
      return "success";
    case "warning":
      return "warning";
    case "error":
      return "error";
    default:
      return "default";
  }
};

const progressChipSx = (state, advisory = false) => (theme) => {
  if (advisory) {
    return {
      bgcolor: theme.palette.grey[50],
      color: theme.palette.text.primary,
      borderColor: theme.palette.grey[300],
      fontWeight: 600,
    };
  }
  if (state === "done") {
    return {
      bgcolor: theme.palette.success.light,
      color: theme.palette.success.dark,
      fontWeight: 700,
      "& .MuiChip-label": { color: theme.palette.success.dark },
    };
  }
  if (state === "warning") {
    return {
      bgcolor: "#fff3cd",
      color: "#8a4b00",
      borderColor: "#f3c46b",
      fontWeight: 700,
      "& .MuiChip-label": { color: "#8a4b00" },
    };
  }
  if (state === "error") {
    return {
      bgcolor: theme.palette.error.light,
      color: theme.palette.error.dark,
      borderColor: theme.palette.error.main,
      fontWeight: 700,
      "& .MuiChip-label": { color: theme.palette.error.dark },
    };
  }
  return {
    bgcolor: theme.palette.grey[100],
    color: theme.palette.text.primary,
    borderColor: theme.palette.grey[300],
    fontWeight: 600,
    "& .MuiChip-label": { color: theme.palette.text.primary },
  };
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
    ownershipVerification,
    cdnProvider,
    sslStatus,
    sslError,
    dnsTxtOk,
    dnsCnameOk,
    notifyEmailEnabled,
    cnameWarning,
    cnameTarget,
    updateNotifyPreference,
    nextRetrySeconds,
    domainConnectSession,
    connectAuthorizationUrl,
    startDomainConnect,
    fetchDomainConnectSession,
    diagnoseDomain,
    retrySsl,
    rootRedirectOk,
    rootRedirectCheckedAt,
    rootRedirectStatusCode,
    rootRedirectExpectedTarget,
    rootRedirectObservedLocation,
    rootRedirectError,
    rootRedirectCheckedScheme,
    rootRedirectState,
    workerRouteState,
    workerRouteRequiredPattern,
    workerRouteWorkerName,
    workerRouteError,
    workerRouteCheckedAt,
    workerRouteDetectionMode,
    requestedDomain,
    canonicalDomain,
    cloudflareHostnameId,
    connectionSummary,
    guidance,
    domainDetails,
    dnsDetails,
    cloudflareDetails,
    bootstrapDetails,
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
  const [retrySeconds, setRetrySeconds] = useState(0);

  useEffect(() => {
    setDomainInput(domain || "");
  }, [domain]);

  useEffect(() => {
    if (!nextRetrySeconds || Number.isNaN(nextRetrySeconds)) {
      setRetrySeconds(0);
      return;
    }
    setRetrySeconds(Math.max(0, Math.floor(nextRetrySeconds)));
  }, [nextRetrySeconds]);

  useEffect(() => {
    if (retrySeconds <= 0) return undefined;
    const timer = window.setInterval(() => {
      setRetrySeconds((prev) => (prev > 1 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [retrySeconds]);

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
  const requestedDomainValue = requestedDomain || domainDetails?.requested || normalizeDomain(domainInput || domain);
  const canonicalDomainValue = canonicalDomain || domainDetails?.canonical || normalizeDomain(domain || "");
  const fallbackLiveHost = canonicalDomainValue || "www.example.com";
  const expectedRootRedirectTarget = rootRedirectExpectedTarget || (canonicalDomainValue ? `https://${canonicalDomainValue}` : "—");
  const workerRoutePattern = workerRouteRequiredPattern || (canonicalDomainValue ? `${canonicalDomainValue}/*` : "www.example.com/*");
  const workerName = workerRouteWorkerName || "schedulaa-edge-router";

  const statusMeta = statusMetaMap[status] || statusMetaMap.none;
  const sslMeta = sslStatus ? sslMetaMap[sslStatus] : null;
  const connectAvailable = registrarHint === CONNECT_REGISTRAR;
  const suggestedDomain = companySlug ? `${companySlug}.com` : "";
  const verifyDisabled =
    processing || !companyId || status === "none" || retrySeconds > 0;
  const durationLabel = formatDuration(retrySeconds);
  const verifyHint = durationLabel
    ? t("management.domainSettings.messages.verifyHint", { time: durationLabel })
    : null;
  const canRetrySsl =
    cdnProvider === "cloudflare" &&
    Boolean(domain) &&
    Boolean(verifiedAt) &&
    (sslStatus === "error" || status === "ssl_failed" || Boolean(sslError));
  const rootRedirectMeta = buildRootRedirectMeta({
    state: rootRedirectState,
    ok: rootRedirectOk,
    expectedTarget: rootRedirectExpectedTarget,
    observedLocation: rootRedirectObservedLocation,
    error: rootRedirectError,
  });
  const workerRouteMeta = buildWorkerRouteMeta({
    state: workerRouteState,
    error: workerRouteError,
  });
  const summaryMeta = buildConnectionSummaryMeta(connectionSummary, t);
  const rootRedirectLabelMap = {
    detected: t("management.domainSettings.rootRedirect.detected", {
      defaultValue: "Detected",
    }),
    missing: t("management.domainSettings.rootRedirect.missing", {
      defaultValue: "Not configured yet",
    }),
    wrong_target: t("management.domainSettings.rootRedirect.wrongTarget", {
      defaultValue: "Points somewhere else",
    }),
    could_not_check: t("management.domainSettings.rootRedirect.couldNotCheck", {
      defaultValue: "Could not check",
    }),
  };
  const bootstrapMeta = {
    state: bootstrapDetails?.ok ? "done" : (verifiedAt ? "warning" : "pending"),
    label: bootstrapDetails?.ok
      ? t("management.domainSettings.bootstrap.ok", { defaultValue: "Tenant routing is working" })
      : t("management.domainSettings.bootstrap.pending", { defaultValue: "Tenant routing not confirmed yet" }),
    detail: bootstrapDetails?.ok
      ? t("management.domainSettings.bootstrap.slugDetail", {
          defaultValue: "Resolved site: {{slug}}",
          slug: bootstrapDetails?.slug || companySlug || "—",
        })
      : t("management.domainSettings.bootstrap.pendingDetail", {
          defaultValue: "The live host will be confirmed after verification and propagation complete.",
        }),
  };
  const workerRouteLabelMap = {
    detected: t("management.domainSettings.workerRoute.detected", {
      defaultValue: "Detected",
    }),
    missing: t("management.domainSettings.workerRoute.missing", {
      defaultValue: "Not detected",
    }),
    could_not_check: t("management.domainSettings.workerRoute.couldNotCheck", {
      defaultValue: "Could not check",
    }),
    manual_required: t("management.domainSettings.workerRoute.manualRequired", {
      defaultValue: "Manual step required",
    }),
  };
  const progressSteps = [
    {
      key: "saved",
      title: t("management.domainSettings.progress.domainSaved", { defaultValue: "Domain saved" }),
      state: requestedDomainValue ? "done" : "pending",
      detail: requestedDomainValue
        ? t("management.domainSettings.progress.domainSavedDetail", {
            defaultValue: "Requested domain: {{domain}}",
            domain: requestedDomainValue,
          })
        : t("management.domainSettings.progress.domainSavedPending", {
            defaultValue: "Enter a domain to start setup.",
          }),
    },
    {
      key: "dns",
      title: t("management.domainSettings.progress.dnsDetected", { defaultValue: "DNS records detected" }),
      state: dnsTxtOk || dnsCnameOk ? "done" : requestedDomainValue ? "warning" : "pending",
      detail: t("management.domainSettings.progress.dnsDetectedDetail", {
        defaultValue: "TXT: {{txt}} · www CNAME: {{cname}}",
        txt: dnsTxtOk ? "detected" : "missing",
        cname: dnsCnameOk ? "detected" : "missing",
      }),
    },
    {
      key: "hostname",
      title: t("management.domainSettings.progress.cloudflareHostname", { defaultValue: "Cloudflare hostname" }),
      state:
        cloudflareDetails?.hostname_status === "active"
          ? "done"
          : cloudflareDetails?.hostname_status === "error"
            ? "error"
            : requestedDomainValue
              ? "pending"
              : "pending",
      detail: t("management.domainSettings.progress.cloudflareHostnameDetail", {
        defaultValue: "Status: {{status}}",
        status: cloudflareDetails?.hostname_status || "not started",
      }),
    },
    {
      key: "ssl",
      title: t("management.domainSettings.progress.sslCertificate", { defaultValue: "SSL certificate" }),
      state: sslStatus === "active" ? "done" : sslStatus === "error" ? "error" : requestedDomainValue ? "pending" : "pending",
      detail: sslStatus === "error"
        ? (sslError || t("management.domainSettings.progress.sslError", { defaultValue: "SSL needs attention." }))
        : t("management.domainSettings.progress.sslDetail", {
            defaultValue: "Status: {{status}}",
            status: sslStatus || "not started",
          }),
    },
    {
      key: "bootstrap",
      title: t("management.domainSettings.progress.websiteBootstrap", { defaultValue: "Website bootstrap" }),
      state: bootstrapMeta.state,
      detail: bootstrapMeta.detail,
    },
    {
      key: "worker_route",
      title: t("management.domainSettings.progress.workerRoute", { defaultValue: "Edge routing" }),
      state:
        workerRouteMeta.state === "detected"
          ? "done"
          : workerRouteMeta.state === "missing"
            ? "warning"
            : "pending",
      detail: t("management.domainSettings.progress.workerRouteDetail", {
        defaultValue: "Required route: {{pattern}} -> {{worker}}",
        pattern: workerRoutePattern,
        worker: workerName,
      }),
      advisory: true,
    },
    {
      key: "root",
      title: t("management.domainSettings.progress.rootRedirect", { defaultValue: "Root redirect" }),
      state: rootRedirectMeta.state === "detected" ? "done" : rootRedirectMeta.state === "wrong_target" ? "warning" : "pending",
      detail: t("management.domainSettings.progress.rootRedirectDetail", {
        defaultValue: "Recommended only. Expected target: {{target}}",
        target: rootRedirectExpectedTarget || (canonicalDomainValue ? `https://${canonicalDomainValue}` : "—"),
      }),
      advisory: true,
    },
  ];

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

  const handleDiagnose = async () => {
    setError(null);
    try {
      await diagnoseDomain();
      enqueueSnackbar(
        t("management.domainSettings.notifications.diagnosticsUpdated", {
          defaultValue: "Diagnostics updated.",
        }),
        { variant: "info" }
      );
    } catch (err) {
      enqueueSnackbar(
        err?.displayMessage ||
          err?.message ||
          t("management.domainSettings.notifications.diagnosticsFailed", {
            defaultValue: "Diagnostics failed.",
          }),
        { variant: "error" }
      );
    }
  };

  const handleRetrySsl = async () => {
    setError(null);
    try {
      await retrySsl();
      enqueueSnackbar(
        t("management.domainSettings.notifications.sslRetryQueued", {
          defaultValue: "SSL retry queued.",
        }),
        { variant: "info" }
      );
    } catch (err) {
      enqueueSnackbar(
        err?.displayMessage ||
          err?.message ||
          t("management.domainSettings.notifications.sslRetryFailed", {
            defaultValue: "SSL retry failed.",
          }),
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
      const isVerified =
        Boolean(res?.verified) ||
        ["verified", "verified_dns", "ssl_active", "provisioning_ssl"].includes(
          res?.status
        );
      if (isVerified) {
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

  const handleCopySupportSummary = async () => {
    const lines = [
      `Requested domain: ${requestedDomainValue || "—"}`,
      `Canonical domain: ${canonicalDomainValue || "—"}`,
      `Verified at: ${verifiedAt ? formatDateTime(verifiedAt, t) : "Not yet"}`,
      `Cloudflare hostname: ${cloudflareDetails?.hostname_status || "—"}`,
      `SSL status: ${sslStatus || "—"}`,
      `Bootstrap: ${bootstrapDetails?.ok ? "ok" : "not_ok"}`,
      `Bootstrap slug: ${bootstrapDetails?.slug || "—"}`,
      `Worker route: ${workerRouteState || "—"}`,
      `Worker route pattern: ${workerRoutePattern || "—"}`,
      `Worker name: ${workerName || "—"}`,
      `Root redirect: ${rootRedirectState || "—"}`,
      `Next step: ${guidance?.next_step || "—"}`,
      `Next step detail: ${guidance?.next_step_detail || "—"}`,
    ];
    const ok = await copyToClipboard(lines.join("\n"));
    enqueueSnackbar(
      ok
        ? t("management.domainSettings.notifications.copySuccess", {
            label: t("management.domainSettings.buttons.copySupportSummary", {
              defaultValue: "support summary",
            }),
          })
        : t("management.domainSettings.notifications.copyFailed"),
      { variant: ok ? "success" : "warning" }
    );
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
  const isVerifiedStatus = ["verified", "ssl_active"].includes(status);
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
                  sx={statusChipSx(statusMeta)}
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
                  {isVerifiedStatus
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

          <Alert severity={summaryMeta.severity}>
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={1.5}
              alignItems={{ xs: "flex-start", md: "center" }}
              justifyContent="space-between"
            >
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  {summaryMeta.label}
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  {guidance?.next_step || t("management.domainSettings.guidance.defaultStep", {
                    defaultValue: "Review the next setup step below.",
                  })}
                </Typography>
                {guidance?.next_step_detail && (
                  <Typography variant="body2" color="text.secondary">
                    {guidance.next_step_detail}
                  </Typography>
                )}
              </Box>
              <Button
                size="small"
                variant="outlined"
                startIcon={<ContentCopyIcon fontSize="small" />}
                onClick={handleCopySupportSummary}
              >
                {t("management.domainSettings.buttons.copySupportSummary", {
                  defaultValue: "Copy support summary",
                })}
              </Button>
            </Stack>
          </Alert>

          <Box sx={{ border: (theme) => `1px solid ${theme.palette.divider}`, borderRadius: 2, p: 2.25 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
              {t("management.domainSettings.cards.overviewTitle", {
                defaultValue: "Custom domain setup",
              })}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {t("management.domainSettings.cards.overviewSubtitle", {
                defaultValue: "Connect your own domain and publish your website on your brand.",
              })}
            </Typography>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <Box sx={{ flex: 1 }}>
                <TextField
                  fullWidth
                  label={t("management.domainSettings.manual.domainLabel")}
                  placeholder="example.com"
                  value={domainInput}
                  onChange={(event) => {
                    if (validationError) setValidationError("");
                    setDomainInput(event.target.value);
                  }}
                  helperText={
                    validationError ||
                    t("management.domainSettings.cards.liveHostHint", {
                      defaultValue: "Your live website will use {{host}}",
                      host: fallbackLiveHost,
                    })
                  }
                  error={Boolean(validationError)}
                  disabled={processing || !companyId}
                />
              </Box>
              <Stack spacing={0.75} sx={{ minWidth: { md: 280 } }}>
                <Typography variant="body2">
                  <strong>{t("management.domainSettings.cards.requestedDomain", { defaultValue: "Requested domain" })}:</strong>{" "}
                  {requestedDomainValue || "—"}
                </Typography>
                <Typography variant="body2">
                  <strong>{t("management.domainSettings.cards.liveHost", { defaultValue: "Live website host" })}:</strong>{" "}
                  {canonicalDomainValue || "—"}
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  <Button
                    variant="contained"
                    onClick={handleRequest}
                    disabled={processing || !domainInput || !companyId}
                  >
                    {t("management.domainSettings.buttons.generateDns")}
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={handleRefresh}
                    disabled={processing || refreshing || loading || !companyId}
                    startIcon={refreshing ? <CircularProgress size={16} /> : <RefreshIcon fontSize="small" />}
                  >
                    {t("management.domainSettings.buttons.refresh")}
                  </Button>
                </Stack>
              </Stack>
            </Stack>
          </Box>

          <Box sx={{ border: (theme) => `1px solid ${theme.palette.divider}`, borderRadius: 2, p: 2.25 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
              {t("management.domainSettings.cards.progressTitle", {
                defaultValue: "Setup progress",
              })}
            </Typography>
            <Stack spacing={1.25}>
              {progressSteps.map((step, index) => (
                <Box
                  key={step.key}
                  sx={{
                    pl: 2,
                    borderLeft: (theme) => `2px solid ${theme.palette.divider}`,
                    position: "relative",
                  }}
                >
                  <Box
                    sx={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      bgcolor: (theme) =>
                        progressChipColor(step.state) === "success"
                          ? theme.palette.success.main
                          : progressChipColor(step.state) === "warning"
                            ? theme.palette.warning.main
                            : progressChipColor(step.state) === "error"
                              ? theme.palette.error.main
                              : theme.palette.grey[400],
                      position: "absolute",
                      left: -6,
                      top: 8,
                    }}
                  />
                  <Stack direction={{ xs: "column", md: "row" }} spacing={1} alignItems={{ xs: "flex-start", md: "center" }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      {index + 1}. {step.title}
                    </Typography>
                    <Chip
                      size="small"
                      variant={step.advisory ? "outlined" : "filled"}
                      color={progressChipColor(step.state)}
                      sx={progressChipSx(step.state, false)}
                      label={
                        step.state === "done"
                          ? t("management.domainSettings.progress.done", { defaultValue: "Done" })
                          : step.state === "warning"
                            ? t("management.domainSettings.progress.needsAttention", { defaultValue: "Needs attention" })
                            : step.state === "error"
                              ? t("management.domainSettings.progress.error", { defaultValue: "Error" })
                              : t("management.domainSettings.progress.waiting", { defaultValue: "Waiting" })
                      }
                    />
                    {step.advisory && (
                      <Chip
                        size="small"
                        variant="outlined"
                        sx={progressChipSx("pending", true)}
                        label={t("management.domainSettings.progress.advisory", { defaultValue: "Advisory" })}
                      />
                    )}
                  </Stack>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, pb: 0.5 }}>
                    {step.detail}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Box>

          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              {t("management.domainSettings.sections.diagnostics", {
                defaultValue: "Domain diagnostics",
              })}
            </Typography>
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={1.5}
              alignItems={{ xs: "flex-start", md: "center" }}
              justifyContent="space-between"
            >
              <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: "wrap" }}>
                <Chip
                  size="small"
                  variant="outlined"
                  color={dnsTxtOk ? "success" : dnsTxtOk === false ? "warning" : "default"}
                  label={t("management.domainSettings.labels.dnsTxt", {
                    defaultValue: "TXT",
                  })}
                />
                <Chip
                  size="small"
                  variant="outlined"
                  color={dnsCnameOk ? "success" : dnsCnameOk === false ? "warning" : "default"}
                  label={t("management.domainSettings.labels.dnsCname", {
                    defaultValue: "CNAME",
                  })}
                />
                {sslStatus && (
                  <Chip
                    size="small"
                    variant="outlined"
                    color={sslMeta?.color || "default"}
                    label={t("management.domainSettings.labels.sslStatus", {
                      defaultValue: "SSL",
                    })}
                  />
                )}
                {sslError && (
                  <Chip
                    size="small"
                    variant="outlined"
                    color="error"
                    label={t("management.domainSettings.labels.sslError", {
                      defaultValue: "SSL error",
                    })}
                  />
                )}
                <Chip
                  size="small"
                  variant="outlined"
                  color={rootRedirectMeta.severity}
                  label={t("management.domainSettings.labels.rootRedirect", {
                    defaultValue: "Root redirect",
                  })}
                />
                <Chip
                  size="small"
                  variant="outlined"
                  color={workerRouteMeta.severity}
                  label={t("management.domainSettings.labels.workerRoute", {
                    defaultValue: "Edge routing",
                  })}
                />
              </Stack>
              <Stack direction="row" spacing={1}>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={handleDiagnose}
                  disabled={processing || !companyId}
                  startIcon={processing && action === "diagnose" ? <CircularProgress size={16} /> : <RefreshIcon fontSize="small" />}
                >
                  {t("management.domainSettings.buttons.testNow", {
                    defaultValue: "Test now",
                  })}
                </Button>
                {canRetrySsl && (
                  <Button
                    size="small"
                    variant="contained"
                    color="secondary"
                    onClick={handleRetrySsl}
                    disabled={processing || !companyId}
                    startIcon={processing && action === "ssl_retry" ? <CircularProgress size={16} /> : <BoltIcon fontSize="small" />}
                  >
                    {t("management.domainSettings.buttons.retrySsl", {
                      defaultValue: "Retry SSL",
                    })}
                  </Button>
                )}
              </Stack>
            </Stack>
            <Alert severity={rootRedirectMeta.severity} sx={{ mt: 1.5 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                {t("management.domainSettings.rootRedirect.title", {
                  defaultValue: "Root redirect",
                })}: {rootRedirectLabelMap[rootRedirectMeta.state]}
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.5 }}>
                {t("management.domainSettings.rootRedirect.advisory", {
                  defaultValue:
                    "Recommended only. Missing apex redirect does not block verification.",
                })}
              </Typography>
              {rootRedirectExpectedTarget && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {t("management.domainSettings.rootRedirect.expected", {
                    defaultValue: "Expected target: {{target}}",
                    target: rootRedirectExpectedTarget,
                  })}
                </Typography>
              )}
              {rootRedirectObservedLocation && (
                <Typography variant="body2" color="text.secondary">
                  {t("management.domainSettings.rootRedirect.observed", {
                    defaultValue: "Observed location: {{target}}",
                    target: rootRedirectObservedLocation,
                  })}
                </Typography>
              )}
              {rootRedirectStatusCode && (
                <Typography variant="body2" color="text.secondary">
                  {t("management.domainSettings.rootRedirect.statusCode", {
                    defaultValue: "Status code: {{code}}",
                    code: rootRedirectStatusCode,
                  })}
                </Typography>
              )}
              {(rootRedirectCheckedScheme || rootRedirectCheckedAt) && (
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                  {t("management.domainSettings.rootRedirect.checked", {
                    defaultValue: "Checked {{time}}{{scheme}}",
                    time: formatDateTime(rootRedirectCheckedAt, t),
                    scheme: rootRedirectCheckedScheme ? ` via ${rootRedirectCheckedScheme.toUpperCase()}` : "",
                  })}
                </Typography>
              )}
              {rootRedirectError && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {t("management.domainSettings.rootRedirect.error", {
                    defaultValue: "Check detail: {{error}}",
                    error: rootRedirectError,
                  })}
                </Typography>
              )}
            </Alert>
          </Box>

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
                    ownershipVerification={ownershipVerification}
                    cnameWarning={cnameWarning}
                    cnameTarget={cnameTarget}
                    cdnProvider={cdnProvider}
                    verifiedAt={verifiedAt}
                    rootRedirectMeta={rootRedirectMeta}
                    rootRedirectExpectedTarget={rootRedirectExpectedTarget}
                    rootRedirectObservedLocation={rootRedirectObservedLocation}
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
                ownershipVerification={ownershipVerification}
                cnameWarning={cnameWarning}
                cnameTarget={cnameTarget}
                cdnProvider={cdnProvider}
                verifiedAt={verifiedAt}
                rootRedirectMeta={rootRedirectMeta}
                rootRedirectExpectedTarget={rootRedirectExpectedTarget}
                rootRedirectObservedLocation={rootRedirectObservedLocation}
              />
            )}
          </Stack>

          <Box sx={{ border: (theme) => `1px solid ${theme.palette.divider}`, borderRadius: 2, p: 2.25 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
              {t("management.domainSettings.cards.dnsTitle", {
                defaultValue: "DNS records to add",
              })}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              {t("management.domainSettings.cards.dnsHint", {
                defaultValue: "GoDaddy usually wants only the host part, not the full domain name.",
              })}
            </Typography>
            {instructionsContent || (
              <Alert severity="info">
                {t("management.domainSettings.cards.dnsEmpty", {
                  defaultValue: "Generate DNS instructions to see the exact records to add.",
                })}
              </Alert>
            )}
          </Box>

          <Box sx={{ border: (theme) => `1px solid ${theme.palette.divider}`, borderRadius: 2, p: 2.25 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
              {t("management.domainSettings.cards.workerRouteTitle", {
                defaultValue: "Edge routing",
              })}
            </Typography>
            <Alert severity={workerRouteMeta.severity} sx={{ mb: 1.5 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                {t("management.domainSettings.workerRoute.title", {
                  defaultValue: "Worker route",
                })}: {workerRouteLabelMap[workerRouteMeta.state]}
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.5 }}>
                {t("management.domainSettings.workerRoute.advisory", {
                  defaultValue:
                    "This route is currently added manually in Cloudflare Workers Routes.",
                })}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {t("management.domainSettings.workerRoute.behaviorCheck", {
                  defaultValue:
                    "Schedulaa currently checks this by probing worker-owned routes on your live host.",
                })}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {t("management.domainSettings.workerRoute.required", {
                  defaultValue: "Required route: {{pattern}} -> {{worker}}",
                  pattern: workerRoutePattern,
                  worker: workerName,
                })}
              </Typography>
              {workerRouteError && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {t("management.domainSettings.workerRoute.error", {
                    defaultValue: "Check detail: {{error}}",
                    error: workerRouteError,
                  })}
                </Typography>
              )}
              {(workerRouteCheckedAt || workerRouteDetectionMode) && (
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                  {t("management.domainSettings.workerRoute.checked", {
                    defaultValue: "Checked {{time}}{{mode}}",
                    time: workerRouteCheckedAt ? formatDateTime(workerRouteCheckedAt, t) : "—",
                    mode: workerRouteDetectionMode ? ` via ${workerRouteDetectionMode}` : "",
                  })}
                </Typography>
              )}
            </Alert>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} flexWrap="wrap">
              <Button
                variant="outlined"
                startIcon={<ContentCopyIcon fontSize="small" />}
                onClick={() => handleCopy(workerRoutePattern, "management.domainSettings.labels.workerRoute")}
                disabled={!workerRoutePattern}
              >
                {t("management.domainSettings.buttons.copyRoutePattern", {
                  defaultValue: "Copy route pattern",
                })}
              </Button>
              <Button
                variant="outlined"
                startIcon={<ContentCopyIcon fontSize="small" />}
                onClick={() => handleCopy(workerName, "management.domainSettings.workerRoute.title")}
                disabled={!workerName}
              >
                {t("management.domainSettings.buttons.copyWorkerName", {
                  defaultValue: "Copy worker name",
                })}
              </Button>
              <Button
                variant="outlined"
                startIcon={processing && action === "diagnose" ? <CircularProgress size={16} /> : <RefreshIcon fontSize="small" />}
                onClick={handleDiagnose}
                disabled={processing || !companyId}
              >
                {t("management.domainSettings.buttons.recheckRoute", {
                  defaultValue: "Recheck route",
                })}
              </Button>
              <Button
                variant="text"
                endIcon={<LaunchIcon fontSize="small" />}
                href="https://dash.cloudflare.com/"
                target="_blank"
                rel="noopener noreferrer"
              >
                {t("management.domainSettings.buttons.openCloudflare", {
                  defaultValue: "Open Cloudflare",
                })}
              </Button>
              <Button
                variant="text"
                startIcon={<ContentCopyIcon fontSize="small" />}
                onClick={() =>
                  handleCopy(
                    `${workerRoutePattern} -> ${workerName}`,
                    "management.domainSettings.workerRoute.title"
                  )
                }
                disabled={!workerRoutePattern || !workerName}
              >
                {t("management.domainSettings.buttons.copyFullInstruction", {
                  defaultValue: "Copy full instruction",
                })}
              </Button>
            </Stack>
          </Box>

          <Box sx={{ border: (theme) => `1px solid ${theme.palette.divider}`, borderRadius: 2, p: 2.25 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
              {t("management.domainSettings.cards.liveTitle", {
                defaultValue: "Live website",
              })}
            </Typography>
            <Stack spacing={0.75}>
              <Typography variant="body2">
                <strong>{t("management.domainSettings.cards.liveHost", { defaultValue: "Live host" })}:</strong>{" "}
                {baseUrl || "—"}
              </Typography>
              <Typography variant="body2">
                <strong>{t("management.domainSettings.cards.requestedDomain", { defaultValue: "Requested domain" })}:</strong>{" "}
                {requestedDomainValue || "—"}
              </Typography>
              <Typography variant="body2">
                <strong>{t("management.domainSettings.cards.connectedAt", { defaultValue: "Connected at" })}:</strong>{" "}
                {verifiedAt ? formatDateTime(verifiedAt, t) : t("management.domainSettings.labels.verifiedPending")}
              </Typography>
              <Typography variant="body2">
                <strong>{t("management.domainSettings.cards.websiteStatus", { defaultValue: "Website status" })}:</strong>{" "}
                {bootstrapDetails?.ok
                  ? t("management.domainSettings.cards.websiteStatusLive", { defaultValue: "live" })
                  : t("management.domainSettings.cards.websiteStatusPending", { defaultValue: "pending" })}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t("management.domainSettings.cards.liveHint", {
                  defaultValue: "Your website already works on {{host}}",
                  host: fallbackLiveHost,
                })}
              </Typography>
            </Stack>
            <Stack direction="row" spacing={1} sx={{ mt: 1.5 }} flexWrap="wrap">
              <Button
                variant="outlined"
                endIcon={<LaunchIcon fontSize="small" />}
                href={baseUrl}
                target="_blank"
                rel="noopener noreferrer"
                disabled={!baseUrl}
              >
                {t("management.domainSettings.buttons.open")}
              </Button>
              <Button
                variant="text"
                startIcon={<ContentCopyIcon fontSize="small" />}
                onClick={() => handleCopy(baseUrl, "management.domainSettings.manual.urlLabel")}
                disabled={!baseUrl}
              >
                {t("management.domainSettings.buttons.copy")}
              </Button>
            </Stack>
          </Box>

          <Box sx={{ border: (theme) => `1px solid ${theme.palette.divider}`, borderRadius: 2, p: 2.25 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
              {t("management.domainSettings.cards.rootRedirectTitle", {
                defaultValue: "Recommended: Redirect root domain to www",
              })}
            </Typography>
            <Alert severity={rootRedirectMeta.severity} sx={{ mb: 1.5 }}>
              {t("management.domainSettings.cards.rootRedirectHint", {
                defaultValue: "Recommended only. Missing root redirect does not block launch.",
              })}
            </Alert>
            <Stack spacing={0.75}>
              <Typography variant="body2">
                <strong>{t("management.domainSettings.rootRedirect.title", { defaultValue: "State" })}:</strong>{" "}
                {rootRedirectLabelMap[rootRedirectMeta.state]}
              </Typography>
              <Typography variant="body2">
                <strong>{t("management.domainSettings.rootRedirect.expectedLabel", { defaultValue: "Expected target" })}:</strong>{" "}
                {expectedRootRedirectTarget}
              </Typography>
              <Typography variant="body2">
                <strong>{t("management.domainSettings.rootRedirect.observedLabel", { defaultValue: "Observed location" })}:</strong>{" "}
                {rootRedirectObservedLocation || "—"}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t("management.domainSettings.cards.rootRedirectGoDaddy", {
                  defaultValue: "GoDaddy forwarding: send the root domain to {{host}} with a permanent 301 and no masking.",
                  host: expectedRootRedirectTarget === "—" ? "https://www.example.com" : expectedRootRedirectTarget,
                })}
              </Typography>
            </Stack>
          </Box>

          <Divider />

          <Accordion disableGutters sx={{ boxShadow: "none", border: (theme) => `1px solid ${theme.palette.divider}`, borderRadius: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                {t("management.domainSettings.cards.advancedTitle", {
                  defaultValue: "Advanced diagnostics",
                })}
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Stack spacing={0.75}>
                <Typography variant="body2"><strong>Requested domain:</strong> {requestedDomainValue || "—"}</Typography>
                <Typography variant="body2"><strong>Canonical domain:</strong> {canonicalDomainValue || "—"}</Typography>
                <Typography variant="body2"><strong>Verified at:</strong> {verifiedAt ? formatDateTime(verifiedAt, t) : "—"}</Typography>
                <Typography variant="body2"><strong>Cloudflare hostname ID:</strong> {cloudflareHostnameId || "—"}</Typography>
                <Typography variant="body2"><strong>Bootstrap:</strong> {bootstrapDetails?.ok ? "ok" : "not_ok"}</Typography>
                <Typography variant="body2"><strong>Bootstrap slug:</strong> {bootstrapDetails?.slug || "—"}</Typography>
                <Typography variant="body2"><strong>Worker route state:</strong> {workerRouteState || "—"}</Typography>
                <Typography variant="body2"><strong>Worker route pattern:</strong> {workerRoutePattern || "—"}</Typography>
                <Typography variant="body2"><strong>Worker name:</strong> {workerName || "—"}</Typography>
                <Typography variant="body2"><strong>Worker route checked:</strong> {workerRouteCheckedAt ? formatDateTime(workerRouteCheckedAt, t) : "—"}</Typography>
                <Typography variant="body2"><strong>Root redirect state:</strong> {rootRedirectState || "—"}</Typography>
                <Typography variant="body2"><strong>Root redirect checked:</strong> {rootRedirectCheckedAt ? formatDateTime(rootRedirectCheckedAt, t) : "—"}</Typography>
                <Typography variant="body2"><strong>Next step:</strong> {guidance?.next_step || "—"}</Typography>
                {guidance?.next_step_detail && (
                  <Typography variant="body2"><strong>Next step detail:</strong> {guidance.next_step_detail}</Typography>
                )}
              </Stack>
            </AccordionDetails>
          </Accordion>

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
  ownershipVerification,
  cnameWarning,
  cnameTarget,
  cdnProvider,
  verifiedAt,
  rootRedirectMeta,
  rootRedirectExpectedTarget,
  rootRedirectObservedLocation,
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
          placeholder="customer.com"
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

      {rootRedirectMeta?.state !== "detected" && (
        <Alert severity={rootRedirectMeta?.severity || "info"}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            {t("management.domainSettings.rootRedirect.title", {
              defaultValue: "Root redirect",
            })}
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.5 }}>
            {t("management.domainSettings.rootRedirect.manualHint", {
              defaultValue:
                "Your root domain should redirect to the live website host, but this is only recommended and does not block launch.",
            })}
          </Typography>
          {rootRedirectExpectedTarget && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {t("management.domainSettings.rootRedirect.expected", {
                defaultValue: "Expected target: {{target}}",
                target: rootRedirectExpectedTarget,
              })}
            </Typography>
          )}
          {rootRedirectObservedLocation && (
            <Typography variant="body2" color="text.secondary">
              {t("management.domainSettings.rootRedirect.observed", {
                defaultValue: "Observed location: {{target}}",
                target: rootRedirectObservedLocation,
              })}
            </Typography>
          )}
        </Alert>
      )}

      {sslStatus === "pending" && (
        <Alert severity="info" icon={<ShieldOutlinedIcon fontSize="inherit" />}>
          {t("management.domainSettings.manual.sslPending")}
          <Box sx={{ mt: 0.5 }}>
            {t("management.domainSettings.manual.sslPendingHint")}
          </Box>
        </Alert>
      )}

      {sslStatus === "pending" && ownershipVerification?.name && ownershipVerification?.value && (
        <Alert severity="warning" icon={<InfoOutlinedIcon fontSize="inherit" />}>
          {t("management.domainSettings.manual.ownershipTitle")}
          <Box sx={{ mt: 0.5 }}>
            {t("management.domainSettings.manual.ownershipHint", {
              name: ownershipVerification.name,
              value: ownershipVerification.value,
            })}
          </Box>
        </Alert>
      )}

      {sslStatus === "error" && sslError && (
        <Alert severity="error" icon={<ShieldOutlinedIcon fontSize="inherit" />}>
          {t("management.domainSettings.manual.sslError", { error: sslError })}
          {sslError.toLowerCase().includes("too many requests") && (
            <Box sx={{ mt: 0.5 }}>
              {t("management.domainSettings.manual.sslRateLimitHint")}
            </Box>
          )}
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
