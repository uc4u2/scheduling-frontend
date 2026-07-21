import React, { useMemo, useState, useEffect, useRef } from "react";
import api from "../../../utils/api";
import {
  Alert, Box, Button, Card, CardContent, CardHeader, Checkbox, Divider,
  Grid, LinearProgress, MenuItem, Chip, Stack,
  Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography,
  Tooltip, IconButton, Drawer, Accordion, AccordionSummary, AccordionDetails,
  Dialog, DialogTitle, DialogContent, DialogActions, TablePagination
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { HelpOutline } from "@mui/icons-material";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import MarketingCampaignsGuide from "./MarketingCampaignsGuide";
import Autocomplete from "@mui/material/Autocomplete";
import CircularProgress from "@mui/material/CircularProgress";
import ExportClientsCard from "./ExportClientsCard";
import UpgradeNoticeBanner from "../../../components/billing/UpgradeNoticeBanner";
import useBillingStatus from "../../../components/billing/useBillingStatus";
import ThemedDateField from "../../../components/ui/ThemedDateField";
import { useLocation } from "react-router-dom";
function useAuth() {
  const token = useMemo(() => localStorage.getItem("token") || "", []);
  const auth  = useMemo(() => ({ headers: { Authorization: `Bearer ${token}` } }), [token]);
  return { token, auth };
}

const PAGE_SIZE_OPTIONS = [10, 25, 50];
const COPY_FIELD_NAMES = ["subject", "heading", "intro", "subtext", "cta_text", "cta_url", "rebook_link", "anniv_link", "launch_link", "deep_link", "vip_link"];

const CAMPAIGN_TYPE_OPTIONS = [
  {
    key: "broadcast",
    title: "Broadcast",
    description: "Send a simple announcement or promotion to a broad client segment.",
    anchorId: "campaign-card-broadcast",
    presetParams: {
      subject: "Update from our team",
      heading: "A quick note from the studio",
      intro: "We're sharing an update with our clients.",
      subtext: "Thanks for being part of our community.",
      cta_text: "View details",
      cta_url: "?page=services-classic",
      limit: 500,
      segment: "all",
    },
  },
  {
    key: "winback",
    title: "Win-Back",
    description: "Target overdue clients with a limited-time rebooking offer.",
    anchorId: "campaign-card-winback",
    presetParams: {
      subject: "We'd love to welcome you back",
      heading: "A little welcome-back offer",
      intro: "It's been a little while since your last visit, so we saved something just for you.",
      subtext: "Use the offer below if you'd like to come back soon.",
      discount_percent: 15,
      valid_days: 7,
      coupon_prefix: "WINBACK",
      rebook_link: "/book",
      limit: 50,
    },
  },
  {
    key: "skipped_rebook",
    title: "Skipped Rebook Nudge",
    description: "Nudge recent clients who did not book their next visit.",
    anchorId: "campaign-card-skipped_rebook",
    presetParams: {
      subject: "Ready to book your next visit?",
      heading: "Let's get your next appointment booked",
      intro: "We noticed you may not have booked your next visit yet.",
      subtext: "If you'd like, you can book the next one in just a few clicks.",
      discount_percent: 0,
      coupon_prefix: "REBOOK",
      deep_link: "?page=services-classic",
      lookback_days: 3,
    },
  },
  {
    key: "vip",
    title: "VIP",
    description: "Reward your top-spending clients with a premium offer.",
    anchorId: "campaign-card-vip",
    presetParams: {
      subject: "A VIP offer just for you",
      heading: "You've unlocked a VIP offer",
      intro: "As one of our top clients, we wanted to share something special with you.",
      subtext: "Thanks for your continued support.",
      discount_percent: 20,
      coupon_prefix: "VIP",
      vip_link: "/vip",
      limit: 50,
    },
  },
  {
    key: "anniversary",
    title: "Anniversary Thank-You",
    description: "Celebrate client anniversaries with a thank-you note and offer.",
    anchorId: "campaign-card-anniversary",
    presetParams: {
      subject: "Thank you for being with us",
      heading: "Happy anniversary with us",
      intro: "We're grateful you've been part of our journey.",
      subtext: "Here is a small thank-you from our team.",
      coupon_prefix: "ANNIV",
      anniv_link: "/book",
      limit: 50,
    },
  },
  {
    key: "new_service",
    title: "New Service Launch",
    description: "Announce a new service to clients likely to be interested.",
    anchorId: "campaign-card-new_service",
    presetParams: {
      subject: "We launched something new",
      heading: "A new service is now available",
      intro: "We just launched something we think you'll love.",
      subtext: "Take a look and see if it's a fit for your next visit.",
      launch_link: "?page=services-classic",
      coupon_prefix: "NEW",
      limit: 200,
    },
  },
  {
    key: "no_show_recovery",
    title: "No-Show Recovery",
    description: "Recover missed appointments with a gentle rebooking message.",
    anchorId: "campaign-card-no_show_recovery",
    presetParams: {
      subject: "We saved a spot for your next visit",
      heading: "Let's get you booked again",
      intro: "We'd be happy to help you get back on the schedule.",
      subtext: "If you'd like to return, use the link below to rebook.",
      coupon_prefix: "RECOVER",
      rebook_link: "/",
      limit: 200,
    },
  },
  {
    key: "addon_upsell",
    title: "Add-on Upsell",
    description: "Promote a useful add-on to clients who booked a related service.",
    anchorId: "campaign-card-addon_upsell",
    presetParams: {
      subject: "A useful add-on for your next visit",
      heading: "Make your next visit even better",
      intro: "We thought you might be interested in adding this to your next booking.",
      subtext: "Here is a quick offer if you want to try it.",
      coupon_prefix: "ADDON",
      deep_link: "?page=services-classic",
      discount_percent: 10,
      limit: 200,
    },
  },
];

function buildCampaignSeed(row) {
  return {
    type: row.campaign_type,
    campaignId: row.id,
    campaignName: row.name,
    params: {
      ...(row.filters_json || {}),
      ...(row.content_json || {}),
    },
  };
}

function summarizeCampaignFilters(fieldDefs = [], params = {}) {
  return fieldDefs
    .map((fd) => {
      const raw = params[fd.name];
      if (raw === undefined || raw === null || String(raw).trim() === "") return null;
      if (COPY_FIELD_NAMES.includes(fd.name)) return null;
      const label = fd.label || fd.name;
      if (fd.select) {
        const selected = fd.select.find((opt) => String(opt.value) === String(raw));
        return `${label}: ${selected?.label || raw}`;
      }
      return `${label}: ${raw}`;
    })
    .filter(Boolean)
    .slice(0, 8);
}

function extractCampaignContent(params = {}) {
  return COPY_FIELD_NAMES.reduce((acc, key) => {
    if (params[key] !== undefined && params[key] !== null && String(params[key]).trim() !== "") {
      acc[key] = params[key];
    }
    return acc;
  }, {});
}

function formatCampaignStatusLabel(status) {
  const value = String(status || "").trim().toLowerCase();
  if (!value) return "Draft";
  const normalized = {
    draft: "Draft",
    queued: "Queued",
    queueing: "Queued",
    sending: "Sending",
    processing: "Sending",
    in_progress: "Sending",
    active: "Sending",
    deferred: "Temporarily deferred",
    completed: "Completed",
    paused: "Paused",
    failed: "Failed",
    cancelled: "Cancelled",
    canceled: "Cancelled",
    error: "Failed",
  };
  if (normalized[value]) return normalized[value];
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatCreditPurchaseStatusLabel(status) {
  const value = String(status || "").trim().toLowerCase();
  return {
    pending: "Payment processing",
    paid: "Payment processing",
    granted: "Credits added",
    failed: "Payment failed",
    refund_review: "Under review",
    dispute_review: "Under review",
  }[value] || "Payment processing";
}

function campaignActionDialogCopy(action, campaignName, selectedRecipients) {
  const safeName = campaignName || "this campaign";
  if (action === "pause") {
    return {
      title: "Pause campaign",
      body: `Pause ${safeName}?`,
      confirm: "Pause campaign",
    };
  }
  if (action === "resume") {
    return {
      title: "Resume campaign",
      body: `Resume sending ${safeName}?`,
      confirm: "Resume sending",
    };
  }
  return {
    title: "Cancel remaining emails",
    body: `Cancel all remaining unsent emails for ${safeName}? Emails already sent cannot be recalled.${selectedRecipients ? ` ${selectedRecipients} selected recipients were originally queued for this campaign.` : ""}`,
    confirm: "Cancel remaining",
  };
}

function inferManagedMarketingMode(managedDelivery = null) {
  if (!managedDelivery) return false;
  return String(managedDelivery?.delivery_mode || "").toLowerCase() === "platform_managed"
    || Boolean(managedDelivery?.managed_sending_enabled)
    || Boolean(managedDelivery?.managed_delivery_available);
}

function mergeManagedDeliverySummary(currentValue = null, nextValue = null) {
  if (!nextValue || typeof nextValue !== "object") return currentValue;
  if (!currentValue || typeof currentValue !== "object") return nextValue;
  return {
    ...currentValue,
    ...nextValue,
    credit_packs: Array.isArray(nextValue?.credit_packs) ? nextValue.credit_packs : (currentValue?.credit_packs || []),
    recent_credit_purchases: Array.isArray(nextValue?.recent_credit_purchases)
      ? nextValue.recent_credit_purchases
      : (currentValue?.recent_credit_purchases || []),
  };
}

function formatPriceAmount(unitAmount, currency) {
  if (unitAmount === null || unitAmount === undefined || !currency) return null;
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: String(currency).toUpperCase(),
    }).format(Number(unitAmount || 0) / 100);
  } catch {
    return null;
  }
}

const TENANT_MARKETING_REVIEW_STATE_KEY = "tenant_marketing_review_state_v1";

function formatCreditCount(value) {
  return new Intl.NumberFormat().format(Math.max(0, Number(value || 0)));
}

function readStoredReviewState() {
  try {
    const raw = window.sessionStorage.getItem(TENANT_MARKETING_REVIEW_STATE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeStoredReviewState(payload) {
  try {
    if (!payload) {
      window.sessionStorage.removeItem(TENANT_MARKETING_REVIEW_STATE_KEY);
      return;
    }
    window.sessionStorage.setItem(TENANT_MARKETING_REVIEW_STATE_KEY, JSON.stringify(payload));
  } catch {
    // best-effort only
  }
}

function summarizeAudiencePreview(previewMeta = null, rows = []) {
  const meta = previewMeta || {};
  const results = Array.isArray(rows) ? rows : [];
  const scanned = Number(meta.total_client_count ?? meta.scanned ?? meta.total_clients ?? results.length ?? 0) || 0;
  const eligible = Number(meta.eligible_recipient_count ?? meta.eligible ?? results.length ?? 0) || 0;
  const suppressed = Number(
    meta.suppressed_count
      ?? meta.excluded_suppressed
      ?? meta.excluded_unsubscribed
      ?? meta.suppressed
      ?? 0
  ) || 0;
  const missingOrInvalid = Number(
    meta.invalid_or_missing_count
      ?? meta.excluded_no_email
      ?? meta.excluded_invalid_email
      ?? meta.excluded_unmailable
      ?? 0
  ) || 0;
  const duplicates = Number(meta.duplicate_count ?? 0) || 0;
  return {
    totalClients: Math.max(scanned, eligible + suppressed + missingOrInvalid + duplicates),
    eligible,
    suppressed,
    missingOrInvalid,
    duplicates,
  };
}

function estimateManagedDurationText(count) {
  const total = Math.max(0, Number(count || 0));
  if (!total) return "";
  if (total <= 20) return "Sending will continue safely in the background and should finish within a few minutes.";
  if (total <= 100) return "Sending will continue safely in the background and may take approximately 5-15 minutes.";
  if (total <= 300) return "Sending will continue safely in the background and may take up to approximately 1 hour.";
  const perMinute = 20;
  const perHour = 300;
  const baselineMinutes = Math.max(Math.ceil(total / perMinute), Math.ceil(total / perHour) * 60);
  const lowHours = Math.max(1, Math.floor(baselineMinutes / 60));
  const highHours = Math.max(lowHours, Math.ceil((baselineMinutes * 1.2) / 60));
  return `Sending will continue safely in the background and may take approximately ${lowHours}-${highHours} hours.`;
}

async function sha256Hex(value) {
  const buffer = await window.crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(buffer)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function stableStringify(value) {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }
  if (value && typeof value === "object") {
    const entries = Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`);
    return `{${entries.join(",")}}`;
  }
  return JSON.stringify(value);
}

async function buildManagedAudienceSnapshotHash({ companyId, campaignType, rows }) {
  const seen = new Set();
  const normalizedRecipients = [...(rows || [])]
    .map((row) => ({
      client_id: Number(row.client_id),
      email_normalized: String(row.email || "").trim().toLowerCase(),
    }))
    .filter((row) => Number.isFinite(row.client_id) && row.client_id > 0 && row.email_normalized)
    .filter((row) => {
      const key = `${row.client_id}:${row.email_normalized}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((left, right) => {
      if (left.client_id !== right.client_id) return left.client_id - right.client_id;
      return left.email_normalized.localeCompare(right.email_normalized);
    });
  const snapshot = {
    resolver_version: "client_ids_v1",
    company_id: Number(companyId),
    campaign_type: String(campaignType || "").trim().toLowerCase(),
    audience_definition: {
      resolver: "client_ids",
      client_ids: normalizedRecipients.map((row) => row.client_id),
    },
    client_ids: normalizedRecipients.map((row) => row.client_id),
    resolved_recipients: normalizedRecipients,
  };
  return {
    audience_definition_json: snapshot.audience_definition,
    audience_snapshot_hash: await sha256Hex(stableStringify(snapshot)),
  };
}

function resolveCurrentUserCompanyName(userInfo) {
  return (
    userInfo?.company_name ||
    userInfo?.company?.name ||
    userInfo?.profile?.company_name ||
    userInfo?.profile?.name ||
    ""
  );
}

function classifyCampaignFields(fieldDefs = []) {
  const optionalNames = new Set([
    "coupon_code",
    "coupon_prefix",
    "expires",
    "discount_percent",
    "valid_days",
    "service_id",
    "base_service_id",
    "addon_name",
    "month",
    "vip_pct",
    "overdue_multiplier",
    "require_no_future",
    "require_fee",
    "require_email",
  ]);
  const audienceNames = new Set([
    "segment",
    "since_days",
    "lookback_days",
    "lookback_months",
    "limit",
  ]);
  return (fieldDefs || []).reduce((acc, field) => {
    if (COPY_FIELD_NAMES.includes(field.name)) {
      acc.message.push(field);
    } else if (audienceNames.has(field.name)) {
      acc.audience.push(field);
    } else if (optionalNames.has(field.name)) {
      acc.optional.push(field);
    } else {
      acc.audience.push(field);
    }
    return acc;
  }, { message: [], audience: [], optional: [] });
}

function mapMarketingErrorMessage(error, { managedMode = false } = {}) {
  const raw = error?.response?.data?.message || error?.response?.data?.error || error?.message || "Something went wrong.";
  const code = String(error?.response?.data?.error || "").trim();
  const friendly = {
    marketing_provider_required: "Connect and activate your SendGrid account before sending this campaign.",
    provider_not_active: "Your SendGrid connection is paused or inactive. Activate it before sending.",
    managed_sending_not_enabled: "Managed sending is currently paused for this company. You can still save drafts.",
    managed_delivery_disabled: "Managed sending is not available right now. You can still save drafts.",
    company_on_abuse_hold: "Managed sending is temporarily paused for review. You can still save drafts.",
    insufficient_quota: "Your credit balance changed. Please review the updated total.",
    preview_expired: "This campaign preview expired. Please review it again.",
    preview_not_found: "This campaign preview is no longer available. Please review it again.",
    preview_selection_empty: "Select at least one recipient before sending this campaign.",
    invalid_preview_recipient_ids: "Some selected recipients are no longer available in this preview. Please review the campaign again.",
    campaign_recipient_limit_exceeded: "This campaign exceeds the sending limit for your managed email account.",
    pilot_recipient_limit_exceeded: "This managed email account is not approved for a campaign of this size yet.",
    audience_snapshot_hash_mismatch: "Your audience preview changed. Review the campaign again before sending.",
    platform_managed_targets_not_allowed: "Managed delivery only sends to the reviewed recipients shown in this campaign.",
    marketing_send_failed: managedMode ? "The campaign could not be queued right now. Please try again in a moment." : "The campaign could not be queued right now. Please try again.",
  };
  return friendly[code] || raw;
}

function CampaignCard({
  sectionId,
  campaignType,
  title,
  subtitle,
  helpText,
  previewPath,
  sendPath,
  fieldDefs,
  columns,
  mapRowKey,
  providerReady = false,
  providerStatus = "missing",
  onCampaignSent,
  composerSeed = null,
  deliverySettings = null,
  managedMode = false,
  companyId = null,
  companyName = "",
  managerReplyTo = "",
  managedCredits = null,
  provider = null,
  creditPurchaseEnabled = false,
  onBuyCredits = null,
  onManagedSummaryRefresh = null,
  cardSx = null,
}) {
  const { t } = useTranslation();
  const { auth } = useAuth();
  const resolvedManagedMode = deliverySettings ? Boolean(deliverySettings?.managedMode) : Boolean(managedMode);
  const resolvedCompanyId = deliverySettings?.companyId ?? companyId;
  const deliveryLabel = resolvedManagedMode ? "Managed by Schedulaa" : "Your SendGrid connection";
  const canSendLive = resolvedManagedMode ? Boolean(deliverySettings?.managedDeliveryAvailable ?? providerReady) : providerReady;
  const availableCredits = Number(deliverySettings?.availableQuota ?? managedCredits?.available ?? 0);
  const reservedCredits = Number(deliverySettings?.reservedQuota ?? 0);
  const lowBalanceThreshold = Number(deliverySettings?.lowBalanceThreshold ?? 0);
  const reviewFromName = resolvedManagedMode
    ? (deliverySettings?.fromName || (companyName ? `${companyName} via Schedulaa` : "Schedulaa"))
    : (deliverySettings?.providerFromName || provider?.from_name || "Configured provider sender");
  const reviewReplyTo = resolvedManagedMode
    ? (deliverySettings?.replyToEmail || managerReplyTo || "Resolved by Schedulaa")
    : (deliverySettings?.providerReplyToEmail || provider?.reply_to_email || "Configured provider reply-to");
  const fieldGroups = useMemo(() => classifyCampaignFields(fieldDefs), [fieldDefs]);

  const initialParams = {};
  (fieldDefs || []).forEach((f) => { initialParams[f.name] = f.default; });
  if (initialParams.subject === undefined) initialParams.subject = "";
  if (initialParams.heading === undefined) initialParams.heading = "";
  if (initialParams.intro === undefined) initialParams.intro = "";
  if (initialParams.subtext === undefined) initialParams.subtext = "";

  const [params, setParams] = useState(initialParams);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [rows, setRows] = useState([]);
  const [selectionMode, setSelectionMode] = useState("all_eligible");
  const [includedRecipientIds, setIncludedRecipientIds] = useState({});
  const [excludedRecipientIds, setExcludedRecipientIds] = useState({});
  const [sending, setSending] = useState(false);
  const [info, setInfo] = useState("");
  const [sendSummary, setSendSummary] = useState(null);
  const [previewMeta, setPreviewMeta] = useState(null);
  const [draftBusy, setDraftBusy] = useState(false);
  const [draftId, setDraftId] = useState(null);
  const [reviewMode, setReviewMode] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [serviceOptions, setServiceOptions] = useState([]);
  const [svcLoading, setSvcLoading] = useState(false);
  const [serviceSelections, setServiceSelections] = useState({});
  const [previewPage, setPreviewPage] = useState(0);
  const [previewRowsPerPage, setPreviewRowsPerPage] = useState(50);
  const [previewSearch, setPreviewSearch] = useState("");
  const [previewSearchDraft, setPreviewSearchDraft] = useState("");
  const previewSearchTimer = useRef(null);

  const fetchServices = async (q = "") => {
    setSvcLoading(true);
    try {
      const url = `/booking/services${q ? `?q=${encodeURIComponent(q)}` : ""}`;
      const { data } = await api.get(url, auth);
      setServiceOptions(Array.isArray(data) ? data : []);
    } catch {
      // keep silent for tenant UI
    } finally {
      setSvcLoading(false);
    }
  };

  useEffect(() => {
    if ((fieldDefs || []).some((fd) => fd.type === "service")) fetchServices("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const nextSelections = {};
    (fieldDefs || [])
      .filter((fd) => fd.type === "service")
      .forEach((fd) => {
        const currentValue = params[fd.name];
        const match = serviceOptions.find((opt) => String(opt?.id) === String(currentValue));
        if (match) nextSelections[fd.name] = match;
      });
    if (Object.keys(nextSelections).length) {
      setServiceSelections((prev) => ({ ...prev, ...nextSelections }));
    }
  }, [fieldDefs, params, serviceOptions]);

  useEffect(() => {
    if (!composerSeed) return;
    const nextParams = composerSeed?.__reviewState?.params
      || composerSeed?.params
      || Object.fromEntries(
        Object.entries(composerSeed).filter(([key]) => !["campaignId", "campaignName", "type", "__reviewState"].includes(key))
      );
    setParams((prev) => ({ ...prev, ...nextParams }));
    setRows([]);
    setSelectionMode("all_eligible");
    setIncludedRecipientIds({});
    setExcludedRecipientIds({});
    setErr("");
    setInfo("");
    setSendSummary(null);
    setPreviewMeta(null);
    setDraftId(composerSeed?.campaignId || null);
    setReviewMode(false);
  }, [composerSeed]);

  useEffect(() => {
    const reviewState = composerSeed?.__reviewState;
    if (!reviewState) return;
    setParams(reviewState.params || initialParams);
    setRows(Array.isArray(reviewState.rows) ? reviewState.rows : []);
    setSelectionMode(reviewState.selectionMode || "all_eligible");
    setIncludedRecipientIds(reviewState.includedRecipientIds || {});
    setExcludedRecipientIds(reviewState.excludedRecipientIds || {});
    setPreviewMeta(reviewState.previewMeta || null);
    setDraftId(reviewState.draftId || composerSeed?.campaignId || null);
    setReviewMode(Boolean(reviewState.reviewMode));
    setPreviewPage(Number(reviewState.previewPage || 0));
    setPreviewRowsPerPage(Number(reviewState.previewRowsPerPage || 50));
    setPreviewSearch(String(reviewState.previewSearch || ""));
    setPreviewSearchDraft(String(reviewState.previewSearch || ""));
    setErr("");
    setInfo("");
    setSendSummary(null);
  }, [composerSeed]);

  const onChangeParam = (name, value) => {
    setParams((p) => ({ ...p, [name]: value }));
    setRows([]);
    setSelectionMode("all_eligible");
    setIncludedRecipientIds({});
    setExcludedRecipientIds({});
    setPreviewMeta(null);
    setReviewMode(false);
  };

  const rowKey = (row) => row?.preview_recipient_id ?? mapRowKey(row);

  const loadPreviewPage = async (previewId, options = {}) => {
    const nextPage = Number(options.page ?? previewPage);
    const nextPageSize = Number(options.pageSize ?? previewRowsPerPage);
    const nextSearch = String(options.search ?? previewSearch);
    const { data } = await api.get(
      `/api/manager/marketing/previews/${previewId}?page=${nextPage + 1}&page_size=${nextPageSize}&q=${encodeURIComponent(nextSearch)}&sort_key=name&sort_direction=asc`,
      auth,
    );
    setRows(Array.isArray(data?.rows) ? data.rows : []);
    setPreviewMeta(data || null);
    setPreviewPage(Math.max(0, Number(data?.pagination?.page || 1) - 1));
    setPreviewRowsPerPage(Number(data?.pagination?.page_size || nextPageSize));
  };

  const renderField = (fd) => (
    <Grid key={fd.name} item xs={12} md={fd.md || 4}>
      {fd.select ? (
        <TextField
          select
          label={fd.label}
          fullWidth
          value={params[fd.name] ?? ""}
          onChange={(e) => onChangeParam(fd.name, e.target.value)}
          helperText={fd.helperText || ""}
        >
          {fd.select.map((opt) => <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>)}
        </TextField>
      ) : fd.type === "service" ? (
        <Autocomplete
          options={serviceOptions}
          loading={svcLoading}
          getOptionLabel={(opt) => (opt?.name || "")}
          value={serviceSelections[fd.name] || null}
          onChange={(_, val) => {
            setServiceSelections((s) => ({ ...s, [fd.name]: val || null }));
            onChangeParam(fd.name, val ? val.id : "");
          }}
          onInputChange={(_, input) => {
            if (input && input.length >= 2) fetchServices(input);
          }}
          renderInput={(autoParams) => (
            <TextField
              {...autoParams}
              label={fd.label}
              helperText={fd.helperText || t("campaigns.fields.serviceSearchHelper")}
              InputProps={{
                ...autoParams.InputProps,
                endAdornment: (
                  <>
                    {svcLoading ? <CircularProgress size={18} /> : null}
                    {autoParams.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
        />
      ) : fd.type === "date" ? (
        <ThemedDateField
          label={fd.label}
          fullWidth
          value={params[fd.name] ?? ""}
          onChange={(e) => onChangeParam(fd.name, e.target.value)}
          helperText={fd.helperText || ""}
        />
      ) : (
        <TextField
          type={fd.type || "text"}
          label={fd.label}
          fullWidth
          value={params[fd.name] ?? ""}
          onChange={(e) => onChangeParam(fd.name, e.target.value)}
          helperText={fd.helperText || ""}
          multiline={!!fd.multiline}
          minRows={fd.multiline ? (fd.rows || 3) : undefined}
        />
      )}
    </Grid>
  );

  const preview = async () => {
    setErr("");
    setInfo("");
    setLoading(true);
    try {
      const { data } = await api.post("/api/manager/marketing/previews", {
        campaign_type: campaignType,
        params,
        page_size: previewRowsPerPage,
        sort_key: "name",
        sort_direction: "asc",
      }, auth);
      setRows(Array.isArray(data?.rows) ? data.rows : []);
      setPreviewMeta(data || null);
      setSelectionMode("all_eligible");
      setIncludedRecipientIds({});
      setExcludedRecipientIds({});
      setPreviewPage(0);
      setPreviewSearch("");
      setPreviewSearchDraft("");
      setReviewMode(true);
      setInfo(`Preview generated for ${Number(data?.eligible_recipient_count || 0)} recipients. No emails were sent.`);
    } catch (e) {
      setErr(mapMarketingErrorMessage(e, { managedMode: resolvedManagedMode }));
    } finally {
      setLoading(false);
    }
  };

  const saveDraft = async () => {
    setDraftBusy(true);
    setErr("");
    setInfo("");
    try {
      const payload = {
        campaign_type: campaignType,
        name: composerSeed?.campaignName || `${title} draft`,
        delivery_mode: resolvedManagedMode ? "platform_managed" : "bring_your_own",
        filters_json: params,
        content_json: extractCampaignContent(params),
        dry_run_last_result_json: previewMeta ? { preview_meta: previewMeta, preview_count: Number(previewMeta?.eligible_recipient_count || 0) } : {},
        send_batch_size: 10,
        audience_preview_id: previewMeta?.preview_id || null,
      };
      const response = draftId
        ? await api.patch(`/api/manager/marketing/campaigns/${draftId}/draft`, payload, auth)
        : await api.post("/api/manager/marketing/campaigns/drafts", payload, auth);
      const campaign = response?.data?.campaign;
      setDraftId(campaign?.id || draftId);
      setInfo(draftId ? "Draft updated." : "Draft saved.");
      if (onCampaignSent) onCampaignSent();
    } catch (e) {
      setErr(mapMarketingErrorMessage(e, { managedMode: resolvedManagedMode }));
    } finally {
      setDraftBusy(false);
    }
  };

  const filterSummary = useMemo(() => summarizeCampaignFilters(fieldDefs, params), [fieldDefs, params]);
  const audienceSummary = useMemo(() => summarizeAudiencePreview(previewMeta, rows), [previewMeta, rows]);
  const selectedCount = useMemo(() => {
    if (selectionMode === "all_eligible") {
      return Math.max(0, Number(previewMeta?.eligible_recipient_count || 0) - Object.keys(excludedRecipientIds).length);
    }
    return Object.keys(includedRecipientIds).length;
  }, [selectionMode, previewMeta, includedRecipientIds, excludedRecipientIds]);
  const requiredCredits = selectedCount;
  const missingCredits = Math.max(0, requiredCredits - availableCredits);
  const estimatedBalanceAfterSending = Math.max(0, availableCredits - requiredCredits);
  const insufficientCredits = resolvedManagedMode && requiredCredits > availableCredits;
  const lowCreditWarning = resolvedManagedMode && (
    insufficientCredits
    || (lowBalanceThreshold > 0 && availableCredits < lowBalanceThreshold)
  );
  const sendDisabled = sending || loading || selectedCount <= 0 || !canSendLive || insufficientCredits;

  const reviewStateSnapshot = useMemo(() => ({
    type: campaignType,
    campaignName: composerSeed?.campaignName || `${title} campaign`,
    campaignId: draftId || composerSeed?.campaignId || null,
    __reviewState: {
      params,
      rows,
      selectionMode,
      includedRecipientIds,
      excludedRecipientIds,
      previewMeta,
      reviewMode,
      draftId,
      previewPage,
      previewRowsPerPage,
      previewSearch,
    },
  }), [
    campaignType,
    composerSeed,
    draftId,
    excludedRecipientIds,
    includedRecipientIds,
    params,
    previewMeta,
    previewPage,
    previewRowsPerPage,
    previewSearch,
    reviewMode,
    rows,
    selectionMode,
    title,
  ]);

  const isRowSelected = (row) => {
    const key = rowKey(row);
    return selectionMode === "all_eligible" ? !excludedRecipientIds[key] : !!includedRecipientIds[key];
  };

  const toggleSelect = (key) => {
    if (selectionMode === "all_eligible") {
      setExcludedRecipientIds((prev) => {
        const next = { ...prev };
        if (next[key]) delete next[key];
        else next[key] = true;
        return next;
      });
      return;
    }
    setIncludedRecipientIds((prev) => {
      const next = { ...prev };
      if (next[key]) delete next[key];
      else next[key] = true;
      return next;
    });
  };

  const selectAll = (checked) => {
    const pageIds = rows.map((row) => rowKey(row));
    if (selectionMode === "all_eligible") {
      setExcludedRecipientIds((prev) => {
        const next = { ...prev };
        pageIds.forEach((id) => {
          if (checked) delete next[id];
          else next[id] = true;
        });
        return next;
      });
      return;
    }
    setIncludedRecipientIds((prev) => {
      const next = { ...prev };
      pageIds.forEach((id) => {
        if (checked) next[id] = true;
        else delete next[id];
      });
      return next;
    });
  };

  const send = async () => {
    setErr("");
    setInfo("");
    setSendSummary(null);
    setSending(true);
    try {
      const payload = {
        dry_run: false,
        delivery_mode: resolvedManagedMode ? "platform_managed" : "bring_your_own",
        audience_preview_id: previewMeta?.preview_id,
        selection_mode: selectionMode,
        included_recipient_ids: selectionMode === "selected_only" ? Object.keys(includedRecipientIds).map(Number) : [],
        excluded_recipient_ids: selectionMode === "all_eligible" ? Object.keys(excludedRecipientIds).map(Number) : [],
      };
      if (!payload.audience_preview_id) {
        setErr("Select at least one recipient before sending.");
        setSending(false);
        return;
      }
      Object.assign(payload, {
        campaign_name: composerSeed?.campaignName || `${title} campaign`,
        filters_json: params,
        content_json: extractCampaignContent(params),
        dry_run_last_result_json: previewMeta ? { preview_meta: previewMeta, preview_count: Number(previewMeta?.eligible_recipient_count || 0) } : {},
        send_batch_size: 10,
      });
      const { data } = await api.post(sendPath, payload, auth);
      setSendSummary({
        campaignId: data?.campaign_id,
        status: data?.status,
        queued: data?.counts?.queued ?? 0,
        sent: data?.counts?.sent ?? 0,
        failed: data?.counts?.failed ?? 0,
        provider: data?.provider?.name || "SendGrid",
      });
      setInfo("Campaign queued successfully. Sending continues in the background.");
      setConfirmOpen(false);
      writeStoredReviewState(null);
      if (onCampaignSent) onCampaignSent();
    } catch (e) {
      if (String(e?.response?.data?.error || "").trim() === "insufficient_quota" && typeof onManagedSummaryRefresh === "function") {
        onManagedSummaryRefresh();
      }
      setErr(mapMarketingErrorMessage(e, { managedMode: resolvedManagedMode }));
    } finally {
      setSending(false);
    }
  };

  useEffect(() => () => {
    if (previewSearchTimer.current) window.clearTimeout(previewSearchTimer.current);
  }, []);

  return (
    <Card id={sectionId} variant="outlined" sx={{ mb: 3, scrollMarginTop: 96, ...(cardSx || {}) }}>
      <CardHeader title={title} subheader={subtitle} />
      <CardContent>
        {helpText && <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{helpText}</Typography>}
        {!providerReady && !resolvedManagedMode && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {providerStatus === "draft" && "SendGrid is connected and testable, but live campaigns stay disabled until you click Activate."}
            {providerStatus === "paused" && "Your SendGrid connection is paused. Reactivate it before sending live campaigns."}
            {providerStatus === "error" && "Your SendGrid connection needs attention before live campaigns can be sent."}
            {providerStatus === "missing" && "Connect SendGrid to enable live marketing sends. Recipient preview still works, but shared Schedulaa mail is no longer used for marketing campaigns."}
          </Alert>
        )}
        {resolvedManagedMode && !canSendLive ? (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Managed sending is currently unavailable for this company. You can still save drafts and review recipients.
          </Alert>
        ) : null}

        <Grid container spacing={2} sx={{ mb: 1 }}>
          <Grid item xs={12}>
            <Typography variant="overline" color="text.secondary">Message</Typography>
          </Grid>
          {fieldGroups.message.map(renderField)}
        </Grid>

        <Grid container spacing={2} sx={{ mb: 1 }}>
          <Grid item xs={12}>
            <Typography variant="overline" color="text.secondary">Audience</Typography>
          </Grid>
          {fieldGroups.audience.map(renderField)}
          {filterSummary.length ? (
            <Grid item xs={12}>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
                Campaign filters summary
              </Typography>
              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                {filterSummary.map((item) => (
                  <Chip key={item} size="small" label={item} />
                ))}
              </Stack>
            </Grid>
          ) : null}
        </Grid>

        {fieldGroups.optional.length ? (
          <Accordion sx={{ mt: 2, mb: 2 }} variant="outlined">
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography fontWeight={600}>Optional settings</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                {fieldGroups.optional.map(renderField)}
              </Grid>
            </AccordionDetails>
          </Accordion>
        ) : null}

        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mt: 2, mb: 1 }}>
          <Button variant="outlined" onClick={saveDraft} disabled={draftBusy || loading || sending}>
            {draftBusy ? "Saving draft..." : "Save draft"}
          </Button>
          <Button variant="contained" onClick={preview} disabled={loading || sending}>
            {loading ? "Generating preview..." : "Review campaign"}
          </Button>
        </Stack>

        {(loading || sending || draftBusy) && <LinearProgress sx={{ my: 2 }} />}
        {err && <Alert severity="error" sx={{ my: 2 }}>{err}</Alert>}
        {info && <Alert severity="success" sx={{ my: 2 }}>{info}</Alert>}

        {reviewMode ? (
          <>
            <Grid container spacing={2} sx={{ my: 1 }}>
              <Grid item xs={12} md={3}><Card variant="outlined"><CardContent><Typography variant="overline">Total clients</Typography><Typography variant="h6">{audienceSummary.totalClients}</Typography></CardContent></Card></Grid>
              <Grid item xs={12} md={3}><Card variant="outlined"><CardContent><Typography variant="overline">Eligible recipients</Typography><Typography variant="h6">{audienceSummary.eligible}</Typography></CardContent></Card></Grid>
              <Grid item xs={12} md={3}><Card variant="outlined"><CardContent><Typography variant="overline">Unsubscribed / suppressed</Typography><Typography variant="h6">{audienceSummary.suppressed}</Typography></CardContent></Card></Grid>
              <Grid item xs={12} md={3}><Card variant="outlined"><CardContent><Typography variant="overline">Missing / invalid email</Typography><Typography variant="h6">{audienceSummary.missingOrInvalid}</Typography></CardContent></Card></Grid>
            </Grid>
            <Grid container spacing={2} sx={{ mb: 1 }}>
              <Grid item xs={12} md={4}><Card variant="outlined"><CardContent><Typography variant="overline">Duplicate recipients</Typography><Typography variant="h6">{audienceSummary.duplicates}</Typography></CardContent></Card></Grid>
              <Grid item xs={12} md={4}><Card variant="outlined"><CardContent><Typography variant="overline">Selected recipients</Typography><Typography variant="h6">{selectedCount}</Typography></CardContent></Card></Grid>
              <Grid item xs={12} md={4}><Card variant="outlined"><CardContent><Typography variant="overline">Required credits</Typography><Typography variant="h6">{requiredCredits}</Typography></CardContent></Card></Grid>
            </Grid>

            <Card variant="outlined" sx={{ my: 2 }}>
              <CardHeader title="Review campaign" subheader="Confirm recipients, credits, and sender details before queueing the campaign." />
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}><Typography variant="body2"><strong>Campaign name:</strong> {composerSeed?.campaignName || `${title} campaign`}</Typography></Grid>
                  <Grid item xs={12} md={4}><Typography variant="body2"><strong>Subject:</strong> {params.subject || "Use campaign default"}</Typography></Grid>
                  <Grid item xs={12} md={4}><Typography variant="body2"><strong>Selected recipients:</strong> {selectedCount}</Typography></Grid>
                  <Grid item xs={12} md={4}><Typography variant="body2"><strong>Credits needed for this campaign:</strong> {formatCreditCount(requiredCredits)}</Typography></Grid>
                  <Grid item xs={12} md={4}><Typography variant="body2"><strong>Available credits:</strong> {resolvedManagedMode ? formatCreditCount(availableCredits) : "Not applicable"}</Typography></Grid>
                  {resolvedManagedMode ? (
                    <Grid item xs={12} md={4}><Typography variant="body2"><strong>Credits reserved by active campaigns:</strong> {formatCreditCount(reservedCredits)}</Typography></Grid>
                  ) : null}
                  {resolvedManagedMode ? (
                    missingCredits > 0
                      ? <Grid item xs={12} md={4}><Typography variant="body2"><strong>Missing credits:</strong> {formatCreditCount(missingCredits)}</Typography></Grid>
                      : <Grid item xs={12} md={4}><Typography variant="body2"><strong>Estimated balance after sending:</strong> {formatCreditCount(estimatedBalanceAfterSending)} credits</Typography></Grid>
                  ) : null}
                  <Grid item xs={12} md={4}><Typography variant="body2"><strong>Delivery method:</strong> {deliveryLabel}</Typography></Grid>
                  <Grid item xs={12} md={6}><Typography variant="body2"><strong>From:</strong> {reviewFromName}</Typography></Grid>
                  <Grid item xs={12} md={6}><Typography variant="body2"><strong>Reply-To:</strong> {reviewReplyTo}</Typography></Grid>
                  {resolvedManagedMode ? (
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary">
                        This campaign contains {selectedCount} recipients. {estimateManagedDurationText(selectedCount)}
                      </Typography>
                    </Grid>
                  ) : null}
                </Grid>
                {insufficientCredits ? (
                  <Alert severity="warning" sx={{ mt: 2 }}>
                    You need {formatCreditCount(missingCredits)} more email credits to send this campaign.
                    {creditPurchaseEnabled && typeof onBuyCredits === "function" ? (
                      <Box sx={{ mt: 1.5 }}>
                        <Button size="small" variant="contained" onClick={() => onBuyCredits(reviewStateSnapshot)}>
                          Buy email credits
                        </Button>
                      </Box>
                    ) : null}
                  </Alert>
                ) : null}
                {resolvedManagedMode && selectedCount <= 0 ? (
                  <Alert severity="warning" sx={{ mt: 2 }}>
                    Select at least one recipient before sending this campaign.
                  </Alert>
                ) : null}
                {resolvedManagedMode && !insufficientCredits && selectedCount > 0 && estimatedBalanceAfterSending === 0 ? (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    This campaign will use all remaining credits.
                  </Alert>
                ) : null}
                {!insufficientCredits && lowCreditWarning ? (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    Your email credit balance is running low.
                  </Alert>
                ) : null}
              </CardContent>
            </Card>

            {sendSummary ? (
              <Alert severity="info" sx={{ my: 2 }}>
                Campaign #{sendSummary.campaignId} queued. Status: {formatCampaignStatusLabel(sendSummary.status)}.
              </Alert>
            ) : null}

            <Stack direction={{ xs: "column", md: "row" }} spacing={1} justifyContent="space-between" alignItems={{ xs: "stretch", md: "center" }} sx={{ mb: 1 }}>
              <Box>
                {selectionMode === "all_eligible" ? (
                  <>
                    <Typography variant="subtitle2">All {Number(previewMeta?.eligible_recipient_count || 0)} eligible clients selected</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {Object.keys(excludedRecipientIds).length} clients excluded
                      {" · "}
                      {selectedCount} clients will receive this campaign
                    </Typography>
                  </>
                ) : (
                  <>
                    <Typography variant="subtitle2">Select only specific clients</Typography>
                    <Typography variant="body2" color="text.secondary">{selectedCount} recipients selected</Typography>
                  </>
                )}
              </Box>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                <Button variant={selectionMode === "all_eligible" ? "contained" : "outlined"} onClick={() => { setSelectionMode("all_eligible"); setIncludedRecipientIds({}); }}>
                  Select all eligible
                </Button>
                <Button variant={selectionMode === "selected_only" ? "contained" : "outlined"} onClick={() => { setSelectionMode("selected_only"); setExcludedRecipientIds({}); }}>
                  Select only specific clients
                </Button>
              </Stack>
            </Stack>

            <Stack direction={{ xs: "column", md: "row" }} spacing={1} sx={{ mb: 2 }}>
              <TextField
                label="Search recipients"
                value={previewSearchDraft}
                onChange={(e) => {
                  const nextValue = e.target.value;
                  setPreviewSearchDraft(nextValue);
                  if (previewSearchTimer.current) window.clearTimeout(previewSearchTimer.current);
                  previewSearchTimer.current = window.setTimeout(async () => {
                    setPreviewSearch(nextValue);
                    if (previewMeta?.preview_id) {
                      try {
                        setLoading(true);
                        await loadPreviewPage(previewMeta.preview_id, { page: 0, search: nextValue });
                      } catch (e2) {
                        setErr(mapMarketingErrorMessage(e2, { managedMode: resolvedManagedMode }));
                      } finally {
                        setLoading(false);
                      }
                    }
                  }, 250);
                }}
                fullWidth
                helperText="Search the currently reviewed audience by client name or email."
              />
            </Stack>

            <Box sx={{ overflowX: "auto", pb: 10 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={rows.length > 0 && rows.every((r) => isRowSelected(r))}
                        indeterminate={rows.some((r) => isRowSelected(r)) && !rows.every((r) => isRowSelected(r))}
                        onChange={(e) => selectAll(e.target.checked)}
                      />
                    </TableCell>
                    {columns.map((col) => (
                      <TableCell key={col.key} align={col.align || "left"}>{col.label}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={rowKey(r)}>
                      <TableCell padding="checkbox">
                        <Checkbox checked={isRowSelected(r)} onChange={() => toggleSelect(rowKey(r))} />
                      </TableCell>
                      {columns.map((col) => {
                        let v = r[col.key];
                        if (col.key === "value" && typeof v === "number") v = v.toFixed(2);
                        if (col.key === "suggested_coupon" && !v) v = t("campaigns.placeholders.noCoupon");
                        if (v === undefined || v === null || v === "") v = t("campaigns.placeholders.empty");
                        return <TableCell key={col.key} align={col.align || "left"}>{String(v)}</TableCell>;
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <TablePagination
                component="div"
                count={Number(previewMeta?.pagination?.total_rows || 0)}
                page={previewPage}
                onPageChange={async (_, nextPage) => {
                  if (!previewMeta?.preview_id) return;
                  setLoading(true);
                  try {
                    await loadPreviewPage(previewMeta.preview_id, { page: nextPage });
                  } catch (e) {
                    setErr(mapMarketingErrorMessage(e, { managedMode: resolvedManagedMode }));
                  } finally {
                    setLoading(false);
                  }
                }}
                rowsPerPage={previewRowsPerPage}
                onRowsPerPageChange={async (event) => {
                  const nextValue = parseInt(event.target.value, 10);
                  setPreviewRowsPerPage(nextValue);
                  if (!previewMeta?.preview_id) return;
                  setLoading(true);
                  try {
                    await loadPreviewPage(previewMeta.preview_id, { page: 0, pageSize: nextValue });
                  } catch (e) {
                    setErr(mapMarketingErrorMessage(e, { managedMode: resolvedManagedMode }));
                  } finally {
                    setLoading(false);
                  }
                }}
                rowsPerPageOptions={[25, 50, 100]}
              />
            </Box>

            <Box
              sx={{
                position: "sticky",
                bottom: 0,
                mt: 2,
                p: 2,
                borderRadius: 2,
                border: "1px solid",
                borderColor: "divider",
                bgcolor: "background.paper",
                boxShadow: 3,
                zIndex: 2,
              }}
            >
              <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ xs: "stretch", md: "center" }} justifyContent="space-between">
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                  <Typography variant="body2"><strong>{selectedCount}</strong> recipients selected</Typography>
                  <Typography variant="body2"><strong>Credits needed:</strong> {formatCreditCount(requiredCredits)}</Typography>
                  {resolvedManagedMode ? <Typography variant="body2"><strong>Missing credits:</strong> {formatCreditCount(missingCredits)}</Typography> : null}
                </Stack>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                  <Button variant="outlined" onClick={() => setReviewMode(false)} disabled={sending}>Back to edit</Button>
                  <Button variant="contained" onClick={() => setConfirmOpen(true)} disabled={sendDisabled}>
                    {sending ? "Sending..." : "Send campaign"}
                  </Button>
                </Stack>
              </Stack>
            </Box>
          </>
        ) : (
          <Typography variant="body2" color="text.secondary">Review the campaign to generate the recipient preview.</Typography>
        )}

        <Dialog open={confirmOpen} onClose={() => !sending && setConfirmOpen(false)} fullWidth maxWidth="xs">
          <DialogTitle>Confirm send</DialogTitle>
          <DialogContent dividers>
            <Typography variant="body2">Send this campaign to {selectedCount} selected recipients?</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConfirmOpen(false)} disabled={sending}>Cancel</Button>
            <Button variant="contained" onClick={send} disabled={sendDisabled}>
              {sending ? "Sending..." : "Confirm and send"}
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
}

function CampaignRecipientsDrawer({ auth, campaign, open, onClose }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [recipients, setRecipients] = useState([]);

  useEffect(() => {
    if (!open || !campaign?.id) return;
    let alive = true;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const { data } = await api.get(`/api/manager/marketing/campaigns/${campaign.id}/recipients?limit=200`, auth);
        if (alive) setRecipients(Array.isArray(data?.recipients) ? data.recipients : []);
      } catch (e) {
        if (alive) setError(e?.response?.data?.message || e?.response?.data?.error || e?.message || "Failed to load recipients.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [auth, open, campaign?.id]);

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      ModalProps={{ keepMounted: true }}
      sx={{
        zIndex: (theme) => theme.zIndex.modal + 3000,
        '& .MuiDrawer-paper': { zIndex: "inherit", width: { xs: "100%", md: 760 }, p: 2 },
      }}
    >
      <Typography variant="h6" sx={{ mb: 1 }}>
        Campaign recipients
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {campaign ? `${campaign.name} · ${campaign.campaign_type}` : ""}
      </Typography>
      {loading ? <LinearProgress sx={{ mb: 2 }} /> : null}
      {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}
      <Box sx={{ overflowX: "auto" }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Email</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Sent</TableCell>
                  <TableCell>Delivered</TableCell>
                  <TableCell>Bounced</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
              {recipients.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.email || "-"}</TableCell>
                  <TableCell>{formatCampaignStatusLabel(row.status)}</TableCell>
                  <TableCell>{row.sent_at || "-"}</TableCell>
                  <TableCell>{row.delivered_at || "-"}</TableCell>
                  <TableCell>{row.bounced_at || "-"}</TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </Box>
    </Drawer>
  );
}

function RecentMarketingCampaigns({ auth, refreshKey = 0, onOpenCampaign, onCampaignsLoaded }) {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [pendingAction, setPendingAction] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [expanded, setExpanded] = useState(false);

  const loadCampaigns = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/api/manager/marketing/campaigns?page=${page + 1}&page_size=${rowsPerPage}`, auth);
      const nextCampaigns = Array.isArray(data?.campaigns) ? data.campaigns : [];
      setCampaigns(nextCampaigns);
      if (onCampaignsLoaded) onCampaignsLoaded(nextCampaigns);
      setTotal(Number(data?.total || 0));
    } catch {
      setCampaigns([]);
      if (onCampaignsLoaded) onCampaignsLoaded([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!expanded) return;
    loadCampaigns();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth, refreshKey, page, rowsPerPage, expanded]);

  useEffect(() => {
    if (!expanded) return undefined;
    if (!campaigns.some((row) => ["queued", "sending", "processing", "deferred", "paused"].includes(String(row?.status || "").toLowerCase()))) {
      return undefined;
    }
    const timer = window.setInterval(() => {
      loadCampaigns();
    }, 30000);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaigns]);

  const runAction = async (campaignId, action) => {
    setActionBusy(true);
    setError("");
    setInfo("");
    try {
      if (action === "process-batch") {
        const { data } = await api.post(`/api/manager/marketing/campaigns/${campaignId}/process-batch`, {}, auth);
        setInfo(data?.summary?.message || "Campaign batch processed.");
      } else {
        await api.post(`/api/manager/marketing/campaigns/${campaignId}/${action}`, {}, auth);
        setInfo(`Campaign ${action.replace("-", " ")} successful.`);
      }
      await loadCampaigns();
    } catch (e) {
      setError(e?.response?.data?.message || e?.response?.data?.error || e?.message || "Campaign action failed.");
    } finally {
      setActionBusy(false);
    }
  };

  const duplicateCampaign = async (campaignId) => {
    setActionBusy(true);
    setError("");
    setInfo("");
    try {
      const { data } = await api.post(`/api/manager/marketing/campaigns/${campaignId}/duplicate`, {}, auth);
      setInfo("Campaign duplicated into a new draft.");
      await loadCampaigns();
      if (onOpenCampaign && data?.campaign) onOpenCampaign(data.campaign);
    } catch (e) {
      setError(e?.response?.data?.message || e?.response?.data?.error || e?.message || "Failed to duplicate campaign.");
    } finally {
      setActionBusy(false);
    }
  };

  const confirmCampaignAction = async () => {
    if (!pendingAction?.campaignId || !pendingAction?.action) return;
    await runAction(pendingAction.campaignId, pendingAction.action);
    setPendingAction(null);
  };

  return (
    <Accordion
      variant="outlined"
      expanded={expanded}
      onChange={(_, nextExpanded) => setExpanded(nextExpanded)}
      sx={{ mb: 3 }}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Box>
          <Typography variant="h6">Recent marketing campaigns</Typography>
          <Typography variant="body2" color="text.secondary">
            Campaigns are sent gradually to protect deliverability.
          </Typography>
        </Box>
      </AccordionSummary>
      <AccordionDetails>
        {loading ? <LinearProgress sx={{ mb: 2 }} /> : null}
        {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}
        {info ? <Alert severity="info" sx={{ mb: 2 }}>{info}</Alert> : null}
        {!expanded ? null : !loading && campaigns.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No campaign history yet.
          </Typography>
        ) : (
          <Box sx={{ overflowX: "auto" }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Delivery</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Recipients</TableCell>
                  <TableCell align="right">Queued</TableCell>
                  <TableCell align="right">Sent</TableCell>
                  <TableCell align="right">Delivered</TableCell>
                  <TableCell align="right">Deferred</TableCell>
                  <TableCell align="right">Bounced</TableCell>
                  <TableCell align="right">Failed</TableCell>
                  <TableCell align="right">Unsubscribed</TableCell>
                  <TableCell align="right">Cancelled</TableCell>
                  <TableCell align="right">Remaining</TableCell>
                  <TableCell align="right">Credits reserved</TableCell>
                  <TableCell align="right">Credits consumed</TableCell>
                  <TableCell>Estimated completion</TableCell>
                  <TableCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {campaigns.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.name}</TableCell>
                    <TableCell>{row.campaign_type}</TableCell>
                    <TableCell>{row.delivery_mode === "platform_managed" ? "Managed" : "BYO"}</TableCell>
                    <TableCell>{formatCampaignStatusLabel(row.status)}</TableCell>
                    <TableCell align="right">{row?.progress?.selected_recipients ?? row?.counts?.total ?? 0}</TableCell>
                    <TableCell align="right">{row?.counts?.queued ?? 0}</TableCell>
                    <TableCell align="right">{row?.progress?.sent ?? row?.counts?.sent_total ?? row?.counts?.sent ?? 0}</TableCell>
                    <TableCell align="right">{row?.compliance_summary?.delivered ?? 0}</TableCell>
                    <TableCell align="right">{row?.progress?.deferred ?? 0}</TableCell>
                    <TableCell align="right">{row?.compliance_summary?.bounced ?? 0}</TableCell>
                    <TableCell align="right">{row?.counts?.failed ?? 0}</TableCell>
                    <TableCell align="right">{row?.compliance_summary?.unsubscribed ?? 0}</TableCell>
                    <TableCell align="right">{row?.counts?.cancelled ?? 0}</TableCell>
                    <TableCell align="right">{row?.progress?.remaining ?? 0}</TableCell>
                    <TableCell align="right">{row?.progress?.credits_reserved ?? 0}</TableCell>
                    <TableCell align="right">{row?.progress?.credits_consumed ?? 0}</TableCell>
                    <TableCell>{row?.progress?.estimated_duration || "—"}</TableCell>
                    <TableCell align="right">
                      <Box display="flex" gap={1} justifyContent="flex-end" flexWrap="wrap">
                        <Button size="small" onClick={() => setSelectedCampaign(row)}>
                          View recipients
                        </Button>
                        {row.status === "draft" ? (
                          <Button size="small" onClick={() => onOpenCampaign && onOpenCampaign(row)}>
                            Open draft
                          </Button>
                        ) : (
                          <Button size="small" onClick={() => duplicateCampaign(row.id)} disabled={actionBusy}>
                            Duplicate
                          </Button>
                        )}
                        <Button
                          size="small"
                          onClick={() => setPendingAction({ action: "pause", campaignId: row.id, campaignName: row.name, selectedRecipients: row?.progress?.selected_recipients ?? 0 })}
                          disabled={actionBusy || ["draft", "paused", "cancelled", "completed"].includes(row.status)}
                        >
                          Pause
                        </Button>
                        <Button
                          size="small"
                          onClick={() => setPendingAction({ action: "resume", campaignId: row.id, campaignName: row.name, selectedRecipients: row?.progress?.selected_recipients ?? 0 })}
                          disabled={actionBusy || row.status !== "paused"}
                        >
                          Resume
                        </Button>
                        <Button
                          size="small"
                          color="error"
                          onClick={() => setPendingAction({ action: "cancel", campaignId: row.id, campaignName: row.name, selectedRecipients: row?.progress?.selected_recipients ?? 0 })}
                          disabled={actionBusy || ["cancelled", "completed"].includes(row.status)}
                        >
                          Cancel
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}
        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={(_, nextPage) => setPage(nextPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(event) => {
            setRowsPerPage(parseInt(event.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={PAGE_SIZE_OPTIONS}
        />
      </AccordionDetails>
      <Dialog
        open={Boolean(pendingAction)}
        onClose={() => !actionBusy && setPendingAction(null)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>{campaignActionDialogCopy(pendingAction?.action, pendingAction?.campaignName, pendingAction?.selectedRecipients).title}</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2">
            {campaignActionDialogCopy(pendingAction?.action, pendingAction?.campaignName, pendingAction?.selectedRecipients).body}
          </Typography>
          {pendingAction?.action === "pause" ? (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
              Sending is continuing gradually to protect email delivery quality. Pausing will stop new unsent recipients from processing.
            </Typography>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPendingAction(null)} disabled={actionBusy}>Cancel</Button>
          <Button
            variant="contained"
            color={pendingAction?.action === "cancel" ? "error" : "primary"}
            onClick={confirmCampaignAction}
            disabled={actionBusy}
          >
            {actionBusy
              ? "Updating..."
              : campaignActionDialogCopy(pendingAction?.action, pendingAction?.campaignName, pendingAction?.selectedRecipients).confirm}
          </Button>
        </DialogActions>
      </Dialog>
      <CampaignRecipientsDrawer auth={auth} campaign={selectedCampaign} open={Boolean(selectedCampaign)} onClose={() => setSelectedCampaign(null)} />
    </Accordion>
  );
}

function DeliverabilityOverview({ auth, refreshKey = 0, onSummaryLoaded }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadSummary = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/api/manager/marketing/dashboard", auth);
      setSummary(data || null);
      if (onSummaryLoaded) onSummaryLoaded(data || null);
    } catch (e) {
      setSummary(null);
      if (onSummaryLoaded) onSummaryLoaded(null);
      setError(e?.response?.data?.message || e?.response?.data?.error || e?.message || "Failed to load deliverability summary.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  const rateCards = summary?.rate_cards || {};
  const providerHealth = summary?.provider_health || {};
  const managedDelivery = summary?.managed_delivery || {};
  const tracking = summary?.tracking || {};
  const reportingPeriod = summary?.reporting_period || {};
  const suppressionInsights = summary?.suppression_insights || {};
  const managedMode = managedDelivery?.delivery_mode === "platform_managed";
  const managedSafetyStatus = managedDelivery?.abuse_hold
    ? "Under review"
    : managedDelivery?.managed_sending_enabled && managedDelivery?.managed_delivery_available
      ? "Ready"
      : (managedDelivery?.status || "Unavailable");
  const cards = [
    { label: "Delivery rate", value: `${rateCards.delivery_rate ?? 0}%`, helper: `${rateCards.delivered ?? 0} delivered / ${rateCards.sent ?? 0} sent` },
    tracking.open_enabled
      ? { label: "Open rate", value: `${rateCards.open_rate ?? 0}%`, helper: `${rateCards.opened ?? 0} opens tracked` }
      : { label: "Open tracking", value: "Disabled", helper: "Open tracking is currently disabled." },
    tracking.click_enabled
      ? { label: "Click rate", value: `${rateCards.click_rate ?? 0}%`, helper: `${rateCards.clicked ?? 0} clicks tracked` }
      : { label: "Click tracking", value: "Disabled", helper: "Click tracking is currently disabled." },
    { label: "Bounce rate", value: `${rateCards.bounce_rate ?? 0}%`, helper: `${rateCards.bounced ?? 0} bounced` },
  ];

  return (
    <Card variant="outlined" sx={{ mb: 3 }}>
      <CardHeader
        title="Recent marketing activity"
        subheader={`${reportingPeriod.label || "All recorded campaigns to date"}. ${reportingPeriod.includes || "Totals include recent campaigns recorded for your company."}`}
      />
      <CardContent>
        {loading ? <LinearProgress sx={{ mb: 2 }} /> : null}
        {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          {cards.map((card) => (
            <Grid item xs={12} sm={6} md={3} key={card.label}>
              <Card variant="outlined" sx={{ height: "100%" }}>
                <CardContent>
                  <Typography variant="overline" color="text.secondary">{card.label}</Typography>
                  <Typography variant="h5" fontWeight={800} sx={{ mt: 0.5 }}>{card.value}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>{card.helper}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Card variant="outlined" sx={{ height: "100%" }}>
              <CardHeader
                title={managedMode ? "Managed delivery summary" : "Provider health summary"}
                subheader={managedMode ? "Current managed delivery status, available credits, and remaining company capacity." : "Current SendGrid connection status and remaining capacity."}
              />
              <CardContent>
                <Stack spacing={1}>
                  {managedMode ? (
                    <>
                      <Typography variant="body2"><strong>Managed delivery status:</strong> {managedDelivery?.managed_sending_enabled ? "Active" : "Paused"}</Typography>
                      <Typography variant="body2"><strong>Emails accepted today:</strong> {providerHealth.daily_used ?? 0}</Typography>
                      <Typography variant="body2"><strong>Remaining sending capacity today:</strong> {providerHealth.daily_remaining ?? 0}</Typography>
                      <Typography variant="body2"><strong>Available credits:</strong> {formatCreditCount(managedDelivery?.available_quota ?? 0)}</Typography>
                      <Typography variant="body2"><strong>Reserved credits:</strong> {formatCreditCount(managedDelivery?.reserved_quota ?? 0)}</Typography>
                      <Typography variant="body2"><strong>Safety status:</strong> {managedSafetyStatus}</Typography>
                    </>
                  ) : (
                    <>
                      <Typography variant="body2"><strong>Status:</strong> {providerHealth.status || "missing"}</Typography>
                      <Typography variant="body2"><strong>Connection:</strong> {providerHealth.name || "Not connected"}</Typography>
                      <Typography variant="body2"><strong>From email:</strong> {providerHealth.from_email || "—"}</Typography>
                      <Typography variant="body2"><strong>Used today:</strong> {providerHealth.daily_used ?? 0} / {providerHealth.daily_limit ?? 0}</Typography>
                      <Typography variant="body2"><strong>Remaining today:</strong> {providerHealth.daily_remaining ?? 0}</Typography>
                      <Typography variant="body2"><strong>Used this hour:</strong> {providerHealth.hourly_used ?? 0} / {providerHealth.hourly_limit ?? 0}</Typography>
                      <Typography variant="body2"><strong>Remaining this hour:</strong> {providerHealth.hourly_remaining ?? 0}</Typography>
                      <Typography variant="body2"><strong>Last test send:</strong> {providerHealth.last_test_send_at || "Never"}</Typography>
                      <Typography variant="body2"><strong>Last error:</strong> {providerHealth.last_error || "None"}</Typography>
                    </>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card variant="outlined" sx={{ height: "100%" }}>
              <CardHeader
                title="Suppression insights"
                subheader="Company-scoped blocks that protect compliance and deliverability."
              />
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="overline" color="text.secondary">Total suppressed</Typography>
                    <Typography variant="h5" fontWeight={800}>{suppressionInsights.total ?? 0}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="overline" color="text.secondary">Manual blocks</Typography>
                    <Typography variant="h5" fontWeight={800}>{suppressionInsights.manual ?? 0}</Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="overline" color="text.secondary">Unsubscribes</Typography>
                    <Typography variant="h6" fontWeight={700}>{suppressionInsights.unsubscribe ?? 0}</Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="overline" color="text.secondary">Bounces</Typography>
                    <Typography variant="h6" fontWeight={700}>{suppressionInsights.bounce ?? 0}</Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="overline" color="text.secondary">Complaints</Typography>
                    <Typography variant="h6" fontWeight={700}>{suppressionInsights.complaint ?? 0}</Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}

function CreateCampaignDialog({
  open,
  onClose,
  campaignDefinitions = [],
  campaignCardSharedProps = {},
  initialCampaignType = "broadcast",
  initialComposerSeed = null,
}) {
  const [step, setStep] = useState(0);
  const [campaignType, setCampaignType] = useState(initialCampaignType);

  const selectedType = useMemo(
    () => campaignDefinitions.find((item) => item.campaignType === campaignType) || campaignDefinitions[0] || null,
    [campaignDefinitions, campaignType]
  );

  useEffect(() => {
    if (!open) return;
    setCampaignType(initialCampaignType || campaignDefinitions[0]?.campaignType || "broadcast");
    setStep(initialComposerSeed ? 1 : 0);
  }, [open, initialCampaignType, initialComposerSeed, campaignDefinitions]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
      <DialogTitle>{step === 0 ? "Create campaign" : selectedType?.title || "Create campaign"}</DialogTitle>
      <DialogContent dividers sx={step === 1 ? { p: 2 } : undefined}>
        {step === 0 ? (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Choose the campaign type you want to launch. You will stay in this guided flow to edit the message, review recipients, and confirm sending.
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                label="Campaign type"
                value={campaignType}
                onChange={(e) => setCampaignType(e.target.value)}
              >
                {campaignDefinitions.map((option) => (
                  <MenuItem key={option.campaignType} value={option.campaignType}>
                    {option.title}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <Alert severity="info">
                {selectedType?.subtitle || selectedType?.helpText || "Choose the campaign that best matches the audience you want to reach."}
              </Alert>
            </Grid>
          </Grid>
        ) : selectedType ? (
          <CampaignCard
            {...selectedType}
            {...campaignCardSharedProps}
            composerSeed={initialComposerSeed?.type === selectedType.campaignType ? initialComposerSeed.params : selectedType.defaultComposerSeed}
            cardSx={{ mb: 0 }}
          />
        ) : null}
      </DialogContent>
      <DialogActions>
        {step === 1 ? <Button onClick={() => setStep(0)}>Back</Button> : null}
        <Button onClick={onClose}>Close</Button>
        {step === 0 ? (
          <Button variant="contained" onClick={() => setStep(1)} disabled={!selectedType}>
            Continue
          </Button>
        ) : null}
      </DialogActions>
    </Dialog>
  );
}

function MarketingSuppressionsCard({ auth, refreshKey = 0 }) {
  const [suppressions, setSuppressions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [form, setForm] = useState({ email: "", reason: "manual", notes: "" });

  const loadSuppressions = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/api/manager/marketing/suppressions?limit=50", auth);
      setSuppressions(Array.isArray(data?.suppressions) ? data.suppressions : []);
    } catch (e) {
      setError(e?.response?.data?.message || e?.response?.data?.error || e?.message || "Failed to load suppressions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSuppressions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  const addSuppression = async () => {
    setSaving(true);
    setError("");
    setInfo("");
    try {
      await api.post("/api/manager/marketing/suppressions", form, auth);
      setForm({ email: "", reason: "manual", notes: "" });
      setInfo("Suppression added.");
      await loadSuppressions();
    } catch (e) {
      setError(e?.response?.data?.message || e?.response?.data?.error || e?.message || "Failed to add suppression.");
    } finally {
      setSaving(false);
    }
  };

  const removeSuppression = async (id) => {
    setSaving(true);
    setError("");
    setInfo("");
    try {
      await api.delete(`/api/manager/marketing/suppressions/${id}`, auth);
      setInfo("Suppression removed.");
      await loadSuppressions();
    } catch (e) {
      setError(e?.response?.data?.message || e?.response?.data?.error || e?.message || "Failed to remove suppression.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card variant="outlined" sx={{ mb: 3 }}>
      <CardHeader
        title="Marketing suppressions"
        subheader="Suppressed emails are skipped automatically before live marketing sends."
      />
      <CardContent>
        {loading ? <LinearProgress sx={{ mb: 2 }} /> : null}
        {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}
        {info ? <Alert severity="success" sx={{ mb: 2 }}>{info}</Alert> : null}
        <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
          <Grid item xs={12} md={4}>
            <TextField label="Email" fullWidth value={form.email} onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))} />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField select label="Reason" fullWidth value={form.reason} onChange={(e) => setForm((prev) => ({ ...prev, reason: e.target.value }))}>
              <MenuItem value="manual">Manual block</MenuItem>
              <MenuItem value="unsubscribe">Unsubscribe</MenuItem>
              <MenuItem value="bounce">Bounce</MenuItem>
              <MenuItem value="complaint">Complaint</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField label="Notes (optional)" fullWidth value={form.notes} onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))} />
          </Grid>
          <Grid item xs={12} md={2}>
            <Button variant="contained" fullWidth onClick={addSuppression} disabled={saving || !form.email.trim()}>
              Add suppression
            </Button>
          </Grid>
        </Grid>
        <Box sx={{ overflowX: "auto" }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Email</TableCell>
                <TableCell>Reason</TableCell>
                <TableCell>Source</TableCell>
                <TableCell>Created</TableCell>
                <TableCell align="right" />
              </TableRow>
            </TableHead>
            <TableBody>
              {suppressions.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.email}</TableCell>
                  <TableCell>{row.reason}</TableCell>
                  <TableCell>{row.source}</TableCell>
                  <TableCell>{row.created_at || "-"}</TableCell>
                  <TableCell align="right">
                    <Button color="error" size="small" onClick={() => removeSuppression(row.id)} disabled={saving}>
                      Remove
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      </CardContent>
    </Card>
  );
}

function MarketingProviderCard({ auth, onProviderChange, managedMode = false, managedCredits = null, companyName = "", managerReplyTo = "", managedDelivery = null, onBuyCredits = null }) {
  const [provider, setProvider] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [form, setForm] = useState({
    provider: "sendgrid",
    name: "Primary SendGrid",
    from_email: "",
    from_name: "",
    reply_to_email: "",
    daily_limit: 500,
    hourly_limit: 100,
    sendgrid_api_key: "",
    test_to_email: "",
  });

  const loadProvider = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/api/manager/marketing/provider", auth);
      const row = data?.provider || null;
      setProvider(row);
      if (onProviderChange) onProviderChange(row, data?.managed_delivery || null);
      setForm((prev) => ({
        ...prev,
        provider: "sendgrid",
        name: row?.name || "Primary SendGrid",
        from_email: row?.from_email || "",
        from_name: row?.from_name || "",
        reply_to_email: row?.reply_to_email || "",
        daily_limit: row?.daily_limit || 500,
        hourly_limit: row?.hourly_limit || 100,
        sendgrid_api_key: "",
      }));
    } catch (e) {
      setError(e?.response?.data?.message || e?.response?.data?.error || e?.message || "Failed to load marketing provider.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProvider();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onChange = (name, value) => setForm((prev) => ({ ...prev, [name]: value }));

  const saveProvider = async () => {
    setSaving(true);
    setError("");
    setInfo("");
    try {
      const payload = {
        provider: "sendgrid",
        name: form.name,
        from_email: form.from_email,
        from_name: form.from_name,
        reply_to_email: form.reply_to_email,
        daily_limit: Number(form.daily_limit || 500),
        hourly_limit: Number(form.hourly_limit || 100),
      };
      if (form.sendgrid_api_key) payload.sendgrid_api_key = form.sendgrid_api_key;
      const { data } = provider?.id
        ? await api.patch(`/api/manager/marketing/provider/${provider.id}`, payload, auth)
        : await api.post("/api/manager/marketing/provider", payload, auth);
      if (onProviderChange) onProviderChange(data?.provider || null, data?.managed_delivery || null);
      setForm((prev) => ({ ...prev, sendgrid_api_key: "" }));
      setInfo("SendGrid provider saved.");
      await loadProvider();
    } catch (e) {
      setError(e?.response?.data?.message || e?.response?.data?.error || e?.message || "Failed to save marketing provider.");
    } finally {
      setSaving(false);
    }
  };

  const testProvider = async () => {
    if (!provider?.id) return;
    setSaving(true);
    setError("");
    setInfo("");
    try {
      const { data } = await api.post(`/api/manager/marketing/provider/${provider.id}/test`, {
        to_email: form.test_to_email || form.reply_to_email || form.from_email,
      }, auth);
      setInfo(`Test email sent to ${data?.result?.sent_to || form.test_to_email || form.from_email}.`);
      await loadProvider();
    } catch (e) {
      setError(e?.response?.data?.message || e?.response?.data?.error || e?.message || "Failed to send provider test email.");
    } finally {
      setSaving(false);
    }
  };

  const setProviderStatus = async (action) => {
    if (!provider?.id) return;
    setSaving(true);
    setError("");
    setInfo("");
    try {
      const { data } = await api.post(`/api/manager/marketing/provider/${provider.id}/${action}`, {}, auth);
      if (onProviderChange) onProviderChange(data?.provider || null, data?.managed_delivery || null);
      setInfo(action === "activate" ? "Provider activated." : "Provider paused.");
      await loadProvider();
    } catch (e) {
      setError(e?.response?.data?.message || e?.response?.data?.error || e?.message || `Failed to ${action} provider.`);
    } finally {
      setSaving(false);
    }
  };

  const statusLabel = provider?.status || "missing";
  const showDraftActivationHint = provider?.id && provider?.status === "draft";
  const showPausedHint = provider?.id && provider?.status === "paused";
  const showErrorHint = provider?.id && provider?.status === "error";
  const buyCreditsVisible = Boolean(managedDelivery?.credit_purchase_enabled) && Array.isArray(managedDelivery?.credit_packs) && managedDelivery.credit_packs.length > 0;
  const recentPurchases = Array.isArray(managedDelivery?.recent_credit_purchases) ? managedDelivery.recent_credit_purchases : [];

  const deliveryChoiceCards = (
    <Grid container spacing={2} sx={{ mb: 2 }}>
      <Grid item xs={12} md={6}>
        <Card
          variant="outlined"
          sx={{
            height: "100%",
            borderColor: managedMode ? "primary.main" : "divider",
            boxShadow: managedMode ? 2 : 0,
          }}
        >
          <CardContent>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
              <Typography variant="h6">Managed by Schedulaa</Typography>
              <Chip
                size="small"
                label={managedMode ? "Active" : "Available"}
                sx={managedMode ? { bgcolor: "primary.main", color: "primary.contrastText", fontWeight: 700 } : undefined}
              />
              <Chip size="small" variant="outlined" label="Recommended" />
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              No SendGrid setup required. Purchase email credits and let Schedulaa handle delivery in the background.
            </Typography>
            <Typography variant="body2"><strong>Available credits:</strong> {managedCredits?.available ?? 0}</Typography>
            <Typography variant="body2"><strong>Used credits:</strong> {managedCredits?.used ?? 0}</Typography>
            <Typography variant="body2" sx={{ mt: 1 }}><strong>From:</strong> {managedDelivery?.from_name || (companyName ? `${companyName} via Schedulaa` : "Schedulaa")}</Typography>
            <Typography variant="body2"><strong>Reply-To:</strong> {managedDelivery?.reply_to_email || managerReplyTo || "Resolved by Schedulaa"}</Typography>
            {buyCreditsVisible && typeof onBuyCredits === "function" ? (
              <Button size="small" variant="contained" sx={{ mt: 1.5 }} onClick={onBuyCredits}>
                Buy credits
              </Button>
            ) : null}
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={6}>
        <Card
          variant="outlined"
          sx={{
            height: "100%",
            borderColor: !managedMode ? "primary.main" : "divider",
            boxShadow: !managedMode ? 2 : 0,
          }}
        >
          <CardContent>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
              <Typography variant="h6">Use my own SendGrid</Typography>
              <Chip
                size="small"
                label={!managedMode ? "Active" : "Inactive"}
                sx={!managedMode ? { bgcolor: "primary.main", color: "primary.contrastText", fontWeight: 700 } : undefined}
              />
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              Connect and pay for your own SendGrid account. Schedulaa credits are not used in this delivery path.
            </Typography>
            <Typography variant="body2"><strong>What you manage:</strong> API key, sender, reply-to, test connection, and activation.</Typography>
            {!managedMode ? (
              <Typography variant="body2" sx={{ mt: 1 }}><strong>Status:</strong> {statusLabel}</Typography>
            ) : (
              <Typography variant="body2" sx={{ mt: 1 }} color="text.secondary">
                This path is not needed while your company uses Schedulaa-managed delivery.
              </Typography>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  if (managedMode) {
    return (
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardHeader
          title="Email delivery path"
          subheader="Your company is using Schedulaa-managed campaign delivery."
        />
        <CardContent>
          {deliveryChoiceCards}
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="overline">Available email credits</Typography>
                  <Typography variant="h5">{managedCredits?.available ?? "—"}</Typography>
                  {buyCreditsVisible && typeof onBuyCredits === "function" ? (
                    <Button size="small" sx={{ mt: 1 }} onClick={onBuyCredits}>
                      Buy credits
                    </Button>
                  ) : null}
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card variant="outlined"><CardContent><Typography variant="overline">Used email credits</Typography><Typography variant="h5">{managedCredits?.used ?? 0}</Typography></CardContent></Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card variant="outlined"><CardContent><Typography variant="overline">Reply-To</Typography><Typography variant="body1">{managedDelivery?.reply_to_email || managerReplyTo || "Resolved by Schedulaa"}</Typography></CardContent></Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card variant="outlined"><CardContent><Typography variant="overline">From</Typography><Typography variant="body1">{managedDelivery?.from_name || (companyName ? `${companyName} via Schedulaa` : "Schedulaa")}</Typography></CardContent></Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card variant="outlined"><CardContent><Typography variant="overline">Status</Typography><Typography variant="body1">{managedDelivery?.managed_delivery_available ? "Ready to send" : "Sending paused"}</Typography></CardContent></Card>
            </Grid>
            <Grid item xs={12}>
              <Alert severity="info">
                From Name will be sent as <strong>{managedDelivery?.from_name || (companyName ? `${companyName} via Schedulaa` : "Schedulaa")}</strong>. Schedulaa chooses the managed delivery path automatically for this company.
              </Alert>
            </Grid>
            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="overline">Recent credit purchases</Typography>
                  {recentPurchases.length ? (
                    <Stack spacing={1.25} sx={{ mt: 1 }}>
                      {recentPurchases.map((row) => (
                        <Box key={row.purchase_id} sx={{ display: "flex", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}>
                          <Box>
                            <Typography variant="body2" fontWeight={600}>{Number(row.credit_pack_size || 0).toLocaleString()} email credits</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {row.unit_amount != null && row.currency
                                ? `${formatPriceAmount(row.unit_amount, row.currency)}`
                                : "Stripe price configured"}
                              {" · "}
                              {row.granted_at || row.paid_at || row.created_at || "Pending"}
                            </Typography>
                          </Box>
                          <Typography variant="body2">{formatCreditPurchaseStatusLabel(row.status_key || row.status)}</Typography>
                        </Box>
                      ))}
                    </Stack>
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      No credit purchases yet.
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="outlined" sx={{ mb: 3 }}>
      <CardHeader
        title="Email delivery path"
        subheader="Your company is currently using its own SendGrid account for campaign delivery."
      />
      <CardContent>
        {deliveryChoiceCards}
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {info && <Alert severity="success" sx={{ mb: 2 }}>{info}</Alert>}
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
          SendGrid connection settings
        </Typography>
        {showDraftActivationHint && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Your SendGrid connection saved successfully. Test it first, then click <strong>Activate</strong> to enable live marketing sends.
          </Alert>
        )}
        {showPausedHint && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            This SendGrid connection is paused. Preview still works, but live campaigns will stay disabled until you click <strong>Activate</strong>.
          </Alert>
        )}
        {showErrorHint && (
          <Alert severity="error" sx={{ mb: 2 }}>
            This SendGrid connection is in an error state. Review the last provider error, update the connection, and test again before activating it.
          </Alert>
        )}
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={2}>
            <TextField label="Provider" fullWidth value="SendGrid" disabled />
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField label="Connection status" fullWidth value={statusLabel} disabled />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField label="Connection name" fullWidth value={form.name} onChange={(e) => onChange("name", e.target.value)} disabled={loading || saving} />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              label={provider?.credentials_configured ? "SendGrid API key (leave blank to keep current key)" : "SendGrid API key"}
              fullWidth
              type="password"
              value={form.sendgrid_api_key}
              onChange={(e) => onChange("sendgrid_api_key", e.target.value)}
              disabled={loading || saving}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField label="From email" fullWidth value={form.from_email} onChange={(e) => onChange("from_email", e.target.value)} disabled={loading || saving} />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField label="From name" fullWidth value={form.from_name} onChange={(e) => onChange("from_name", e.target.value)} disabled={loading || saving} />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField label="Reply-to email" fullWidth value={form.reply_to_email} onChange={(e) => onChange("reply_to_email", e.target.value)} disabled={loading || saving} />
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField label="Daily limit" type="number" fullWidth value={form.daily_limit} onChange={(e) => onChange("daily_limit", e.target.value)} disabled={loading || saving} />
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField label="Hourly limit" type="number" fullWidth value={form.hourly_limit} onChange={(e) => onChange("hourly_limit", e.target.value)} disabled={loading || saving} />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField label="Test email recipient" fullWidth value={form.test_to_email} onChange={(e) => onChange("test_to_email", e.target.value)} disabled={loading || saving || !provider?.id} />
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="body2" color="text.secondary">
              Last provider test: {provider?.last_test_send_at || "Never"}<br />
              Last provider error: {provider?.last_error || "None"}
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <Box display="flex" gap={1} flexWrap="wrap">
              <Button variant="contained" onClick={saveProvider} disabled={loading || saving}>
                Save
              </Button>
              <Button variant="outlined" onClick={testProvider} disabled={loading || saving || !provider?.id}>
                Test send
              </Button>
              <Button variant="outlined" onClick={() => setProviderStatus("pause")} disabled={loading || saving || !provider?.id || provider?.status === "paused"}>
                Pause
              </Button>
              <Button variant="outlined" onClick={() => setProviderStatus("activate")} disabled={loading || saving || !provider?.id || provider?.status === "active"}>
                Activate
              </Button>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}

export default function MarketingCampaignsTab() {
  const { t, i18n } = useTranslation();
  const { status: billingStatus } = useBillingStatus();
  const location = useLocation();
  const planKey = (billingStatus?.plan_key || "starter").toLowerCase();
  const isActive = ["active", "trialing"].includes(billingStatus?.status || "");
  const canAccess = (planKey === "pro" || planKey === "business") && isActive;
  const fieldLabel = (key) => {
    const labelKey = `campaigns.fields.${key}.label`;
    const value = t(labelKey);
    return value === labelKey ? key : value;
  };
  const fieldHelper = (key) => {
    const helperKey = `campaigns.fields.${key}.helper`;
    const value = t(helperKey);
    return value === helperKey ? undefined : value;
  };
  const columnLabel = (key) => {
    const columnKey = `campaigns.columns.${key}`;
    const value = t(columnKey);
    return value === columnKey ? key : value;
  };
  const segmentOptions = useMemo(() => ([
    { value: "all", label: t("campaigns.segments.all") },
    { value: "no_future", label: t("campaigns.segments.noFuture") },
  ]), [i18n.language]);
  const booleanOptions = useMemo(() => ([
    { value: "true", label: t("common.yes") },
    { value: "false", label: t("common.no") },
  ]), [i18n.language]);

  // Compute nice defaults here once
  const currentMonth = String(dayjs().month() + 1); // 1..12
  const defaultVipExpiry     = dayjs().add(14, "day").format("YYYY-MM-DD");
  const defaultAnnivExpiry   = dayjs().endOf("month").format("YYYY-MM-DD");
  const defaultWinbackExpiry = dayjs().add(7, "day").format("YYYY-MM-DD");

  const monthOptions = useMemo(() => (
    Array.from({ length: 12 }, (_, index) => ({
      value: String(index + 1),
      label: t(`common.monthShort.${index + 1}`),
    }))
  ), [i18n.language]);

  const [guideOpen, setGuideOpen] = useState(false);
  const { auth } = useAuth();
  const [provider, setProvider] = useState(null);
  const [managedDelivery, setManagedDelivery] = useState(null);
  const [dashboardSummary, setDashboardSummary] = useState(null);
  const [campaignRows, setCampaignRows] = useState([]);
  const [currentUserInfo, setCurrentUserInfo] = useState(null);
  const [campaignRefreshKey, setCampaignRefreshKey] = useState(0);
  const [composerOpen, setComposerOpen] = useState(false);
  const [composerCampaignType, setComposerCampaignType] = useState(CAMPAIGN_TYPE_OPTIONS[0].key);
  const [composerSeed, setComposerSeed] = useState(null);
  const [templateLibraryOpen, setTemplateLibraryOpen] = useState(false);
  const [buyCreditsOpen, setBuyCreditsOpen] = useState(false);
  const [creditPurchaseContext, setCreditPurchaseContext] = useState(null);
  const [checkoutBusyPackKey, setCheckoutBusyPackKey] = useState("");
  const [checkoutStatusMessage, setCheckoutStatusMessage] = useState("");
  const [checkoutStatusTone, setCheckoutStatusTone] = useState("info");
  const checkoutHandledSidRef = useRef("");
  const companyName = resolveCurrentUserCompanyName(currentUserInfo);
  const managerReplyTo = managedDelivery?.reply_to_email || currentUserInfo?.email || provider?.reply_to_email || "";
  const managedMode = useMemo(() => inferManagedMarketingMode(managedDelivery), [managedDelivery]);
  const managedCredits = useMemo(() => ({
    available: Number(managedDelivery?.available_quota ?? 0),
    used: Number(managedDelivery?.consumed_quota ?? 0),
  }), [managedDelivery]);
  const creditPacks = useMemo(() => Array.isArray(managedDelivery?.credit_packs) ? managedDelivery.credit_packs : [], [managedDelivery]);
  const creditPurchaseEnabled = Boolean(managedDelivery?.credit_purchase_enabled);
  const deliverySettings = useMemo(() => ({
    managedMode,
    managedDeliveryAvailable: Boolean(managedDelivery?.managed_delivery_available && managedDelivery?.managed_sending_enabled),
    availableQuota: Number(managedDelivery?.available_quota ?? 0),
    reservedQuota: Number(managedDelivery?.reserved_quota ?? 0),
    consumedQuota: Number(managedDelivery?.consumed_quota ?? 0),
    lowBalanceThreshold: Number(managedDelivery?.low_balance_threshold ?? 0),
    fromName: managedDelivery?.from_name || (companyName ? `${companyName} via Schedulaa` : "Schedulaa"),
    replyToEmail: managedDelivery?.reply_to_email || managerReplyTo,
    providerFromName: provider?.from_name || "",
    providerReplyToEmail: provider?.reply_to_email || "",
    companyId: currentUserInfo?.company_id || currentUserInfo?.company?.id || localStorage.getItem("company_id"),
    creditPurchaseEnabled,
    creditPacks,
  }), [managedMode, managedDelivery, companyName, managerReplyTo, provider, currentUserInfo, creditPurchaseEnabled, creditPacks]);

  const campaignDefinitions = useMemo(() => ([
    {
      sectionId: "campaign-card-broadcast",
      campaignType: "broadcast",
      title: t("campaigns.cards.broadcast.title"),
      subtitle: t("campaigns.cards.broadcast.subtitle"),
      helpText: t("campaigns.cards.broadcast.help"),
      previewPath: "/api/manager/campaigns/broadcast/preview",
      sendPath: "/api/manager/campaigns/broadcast/send",
      defaultComposerSeed: CAMPAIGN_TYPE_OPTIONS.find((item) => item.key === "broadcast")?.presetParams || null,
      fieldDefs: [
        { name: "subject", label: fieldLabel("subject"), default: t("campaigns.defaults.broadcast.subject"), helperText: fieldHelper("subject") },
        { name: "heading", label: fieldLabel("heading"), default: t("campaigns.defaults.broadcast.heading"), helperText: fieldHelper("heading") },
        { name: "intro", label: fieldLabel("intro"), default: t("campaigns.defaults.broadcast.intro"), multiline: true, rows: 3, helperText: fieldHelper("intro") },
        { name: "subtext", label: fieldLabel("subtext"), default: t("campaigns.defaults.broadcast.subtext"), multiline: true, rows: 2, helperText: fieldHelper("subtext") },
        { name: "cta_text", label: fieldLabel("ctaText"), default: t("campaigns.defaults.broadcast.ctaText"), helperText: fieldHelper("ctaText") },
        { name: "cta_url", label: fieldLabel("ctaUrl"), default: "?page=services-classic", helperText: fieldHelper("ctaUrl") },
        { name: "coupon_code", label: fieldLabel("couponOverride"), default: "", helperText: fieldHelper("couponOverride") },
        { name: "expires", label: fieldLabel("expiresOptional"), type: "date", default: "", helperText: fieldHelper("expiresOptional") },
        { name: "segment", label: fieldLabel("segment"), default: "all", select: segmentOptions, helperText: fieldHelper("segment") },
        { name: "since_days", label: fieldLabel("sinceDays"), type: "number", default: "", helperText: fieldHelper("sinceDays") },
        { name: "limit", label: fieldLabel("limit"), type: "number", default: 500, helperText: fieldHelper("limit") },
      ],
      columns: [
        { key: "client_id", label: columnLabel("clientId") },
        { key: "name", label: columnLabel("name") },
        { key: "email", label: columnLabel("email") },
        { key: "subject", label: columnLabel("subject") },
      ],
      mapRowKey: (r) => `broadcast_${r.client_id}`,
    },
    {
      sectionId: "campaign-card-winback",
      campaignType: "winback",
      title: t("campaigns.cards.winback.title"),
      subtitle: t("campaigns.cards.winback.subtitle"),
      helpText: t("campaigns.cards.winback.help"),
      previewPath: "/api/manager/campaigns/winback/preview",
      sendPath: "/api/manager/campaigns/winback/send",
      defaultComposerSeed: CAMPAIGN_TYPE_OPTIONS.find((item) => item.key === "winback")?.presetParams || null,
      fieldDefs: [
        { name: "overdue_multiplier", label: fieldLabel("overdueMultiplier"), type: "number", default: 1.5, helperText: fieldHelper("overdueMultiplier") },
        { name: "discount_percent", label: fieldLabel("discountPercent"), type: "number", default: 15, helperText: fieldHelper("discountPercent") },
        { name: "valid_days", label: fieldLabel("validDays"), type: "number", default: 7, helperText: fieldHelper("validDays") },
        { name: "expires", label: fieldLabel("expiresOverride"), type: "date", default: defaultWinbackExpiry, helperText: fieldHelper("expiresOverride") },
        { name: "limit", label: fieldLabel("limit"), type: "number", default: 50, helperText: fieldHelper("limit") },
        { name: "coupon_prefix", label: fieldLabel("couponPrefix"), default: "WINBACK", helperText: fieldHelper("couponPrefix") },
        { name: "coupon_code", label: fieldLabel("couponOverride"), default: "", helperText: fieldHelper("couponOverride") },
        { name: "rebook_link", label: fieldLabel("rebookLink"), default: "/book", helperText: fieldHelper("rebookLink") },
      ],
      columns: [
        { key: "client_id", label: columnLabel("clientId") },
        { key: "name", label: columnLabel("name") },
        { key: "email", label: columnLabel("email") },
        { key: "days_since_last", label: columnLabel("daysSince"), align: "right" },
        { key: "expected_gap_days", label: columnLabel("expectedGap"), align: "right" },
        { key: "overdue_ratio", label: columnLabel("overdueRatio"), align: "right" },
        { key: "suggested_coupon", label: columnLabel("coupon") },
        { key: "suggested_expiry", label: columnLabel("expiry") },
      ],
      mapRowKey: (r) => `winback_${r.client_id}`,
    },
    {
      sectionId: "campaign-card-skipped_rebook",
      campaignType: "skipped_rebook",
      title: t("campaigns.cards.skippedRebook.title"),
      subtitle: t("campaigns.cards.skippedRebook.subtitle"),
      helpText: t("campaigns.cards.skippedRebook.help"),
      previewPath: "/api/manager/campaigns/skipped_rebook/preview",
      sendPath: "/api/manager/campaigns/skipped_rebook/send",
      defaultComposerSeed: CAMPAIGN_TYPE_OPTIONS.find((item) => item.key === "skipped_rebook")?.presetParams || null,
      fieldDefs: [
        { name: "lookback_days", label: fieldLabel("lookbackDays"), type: "number", default: 3, helperText: fieldHelper("lookbackDays") },
        { name: "discount_percent", label: fieldLabel("discountPercent"), type: "number", default: 0, helperText: fieldHelper("discountPercentZero") },
        { name: "coupon_prefix", label: fieldLabel("couponPrefix"), default: "REBOOK", helperText: fieldHelper("couponPrefix") },
        { name: "coupon_code", label: fieldLabel("couponOverride"), default: "", helperText: fieldHelper("couponOverride") },
        { name: "expires", label: fieldLabel("expiresOptional"), type: "date", default: "", helperText: fieldHelper("expiresOptional") },
        { name: "deep_link", label: fieldLabel("deepLink"), default: "/rebook", helperText: fieldHelper("deepLink") },
      ],
      columns: [
        { key: "client_id", label: columnLabel("clientId") },
        { key: "name", label: columnLabel("name") },
        { key: "email", label: columnLabel("email") },
        { key: "last_service_date", label: columnLabel("lastService") },
        { key: "suggested_coupon", label: columnLabel("coupon") },
      ],
      mapRowKey: (r) => `skipped_${r.client_id}_${r.last_service_date}`,
    },
    {
      sectionId: "campaign-card-vip",
      campaignType: "vip",
      title: t("campaigns.cards.vip.title"),
      subtitle: t("campaigns.cards.vip.subtitle"),
      helpText: t("campaigns.cards.vip.help"),
      previewPath: "/api/manager/campaigns/vip/preview",
      sendPath: "/api/manager/campaigns/vip/send",
      defaultComposerSeed: CAMPAIGN_TYPE_OPTIONS.find((item) => item.key === "vip")?.presetParams || null,
      fieldDefs: [
        { name: "vip_pct", label: fieldLabel("vipPct"), type: "number", default: 10, helperText: fieldHelper("vipPct") },
        { name: "limit", label: fieldLabel("limit"), type: "number", default: 50, helperText: fieldHelper("limit") },
        { name: "discount_percent", label: fieldLabel("discountPercent"), type: "number", default: 20, helperText: fieldHelper("discountPercent") },
        { name: "coupon_prefix", label: fieldLabel("couponPrefix"), default: "VIP", helperText: fieldHelper("couponPrefix") },
        { name: "coupon_code", label: fieldLabel("couponOverride"), default: "", helperText: fieldHelper("couponOverride") },
        { name: "vip_link", label: fieldLabel("vipLink"), default: "/vip", helperText: fieldHelper("vipLink") },
        { name: "expires", label: fieldLabel("expiresOverride"), type: "date", default: defaultVipExpiry, helperText: fieldHelper("expiresOverride") },
      ],
      columns: [
        { key: "client_id", label: columnLabel("clientId") },
        { key: "name", label: columnLabel("name") },
        { key: "email", label: columnLabel("email") },
        { key: "ltv", label: columnLabel("ltv"), align: "right" },
        { key: "suggested_coupon", label: columnLabel("coupon") },
      ],
      mapRowKey: (r) => `vip_${r.client_id}`,
    },
    {
      sectionId: "campaign-card-anniversary",
      campaignType: "anniversary",
      title: t("campaigns.cards.anniversary.title"),
      subtitle: t("campaigns.cards.anniversary.subtitle"),
      helpText: t("campaigns.cards.anniversary.help"),
      previewPath: "/api/manager/campaigns/anniversary/preview",
      sendPath: "/api/manager/campaigns/anniversary/send",
      defaultComposerSeed: CAMPAIGN_TYPE_OPTIONS.find((item) => item.key === "anniversary")?.presetParams || null,
      fieldDefs: [
        { name: "month", label: fieldLabel("month"), default: String(currentMonth), select: monthOptions, helperText: fieldHelper("month") },
        { name: "limit", label: fieldLabel("limit"), type: "number", default: 50, helperText: fieldHelper("limit") },
        { name: "coupon_prefix", label: fieldLabel("couponPrefix"), default: "ANNIV", helperText: fieldHelper("couponPrefix") },
        { name: "coupon_code", label: fieldLabel("couponOverride"), default: "", helperText: fieldHelper("couponOverride") },
        { name: "anniv_link", label: fieldLabel("annivLink"), default: "/book", helperText: fieldHelper("annivLink") },
        { name: "expires", label: fieldLabel("expiresOverride"), type: "date", default: defaultAnnivExpiry, helperText: fieldHelper("expiresOverride") },
        { name: "require_email", label: fieldLabel("requireEmail"), select: booleanOptions, default: "true", helperText: fieldHelper("requireEmail") },
      ],
      columns: [
        { key: "client_id", label: columnLabel("clientId") },
        { key: "name", label: columnLabel("name") },
        { key: "email", label: columnLabel("email") },
        { key: "first_visit", label: columnLabel("firstVisit") },
        { key: "suggested_coupon", label: columnLabel("coupon") },
      ],
      mapRowKey: (r) => `anniv_${r.client_id}`,
    },
    {
      sectionId: "campaign-card-new_service",
      campaignType: "new_service",
      title: t("campaigns.cards.newService.title"),
      subtitle: t("campaigns.cards.newService.subtitle"),
      helpText: t("campaigns.cards.newService.help"),
      previewPath: "/api/manager/campaigns/new_service/preview",
      sendPath: "/api/manager/campaigns/new_service/send",
      defaultComposerSeed: CAMPAIGN_TYPE_OPTIONS.find((item) => item.key === "new_service")?.presetParams || null,
      fieldDefs: [
        { name: "service_id", label: fieldLabel("serviceId"), type: "service", default: "", helperText: fieldHelper("serviceId") },
        { name: "lookback_months", label: fieldLabel("lookbackMonths"), type: "number", default: 12, helperText: fieldHelper("lookbackMonths") },
        { name: "discount_percent", label: fieldLabel("discountPercent"), type: "number", default: 0, helperText: fieldHelper("discountPercentZero") },
        { name: "coupon_prefix", label: fieldLabel("couponPrefix"), default: "NEW", helperText: fieldHelper("couponPrefix") },
        { name: "coupon_code", label: fieldLabel("couponOverride"), default: "", helperText: fieldHelper("couponOverride") },
        { name: "launch_link", label: fieldLabel("launchLink"), default: "?page=services-classic", helperText: fieldHelper("launchLink") },
        { name: "expires", label: fieldLabel("expiresOptional"), type: "date", default: "", helperText: fieldHelper("expiresOptional") },
        { name: "limit", label: fieldLabel("limit"), type: "number", default: 200, helperText: fieldHelper("limit") },
      ],
      columns: [
        { key: "client_id", label: columnLabel("clientId") },
        { key: "name", label: columnLabel("name") },
        { key: "email", label: columnLabel("email") },
        { key: "suggested_coupon", label: columnLabel("coupon") },
      ],
      mapRowKey: (r) => `newsvc_${r.client_id}`,
    },
    {
      sectionId: "campaign-card-no_show_recovery",
      campaignType: "no_show_recovery",
      title: t("campaigns.cards.noShow.title"),
      subtitle: t("campaigns.cards.noShow.subtitle"),
      helpText: t("campaigns.cards.noShow.help"),
      previewPath: "/api/manager/campaigns/no_show_recovery/preview",
      sendPath: "/api/manager/campaigns/no_show_recovery/send",
      defaultComposerSeed: CAMPAIGN_TYPE_OPTIONS.find((item) => item.key === "no_show_recovery")?.presetParams || null,
      fieldDefs: [
        { name: "lookback_days", label: fieldLabel("lookbackDays"), type: "number", default: 30, helperText: fieldHelper("lookbackDays") },
        { name: "require_no_future", label: fieldLabel("requireNoFuture"), select: booleanOptions, default: "true", helperText: fieldHelper("requireNoFuture") },
        { name: "require_fee", label: fieldLabel("requireFee"), select: booleanOptions, default: "false", helperText: fieldHelper("requireFee") },
        { name: "discount_percent", label: fieldLabel("discountPercent"), type: "number", default: 0, helperText: fieldHelper("discountPercentZero") },
        { name: "coupon_prefix", label: fieldLabel("couponPrefix"), default: "RECOVER", helperText: fieldHelper("couponPrefix") },
        { name: "coupon_code", label: fieldLabel("couponOverride"), default: "", helperText: fieldHelper("couponOverride") },
        { name: "rebook_link", label: fieldLabel("landingLink"), default: "/", helperText: fieldHelper("landingLink") },
        { name: "expires", label: fieldLabel("expiresOptional"), type: "date", default: "", helperText: fieldHelper("expiresOptional") },
        { name: "limit", label: fieldLabel("limit"), type: "number", default: 200, helperText: fieldHelper("limit") },
      ],
      columns: [
        { key: "client_id", label: columnLabel("clientId") },
        { key: "name", label: columnLabel("name") },
        { key: "email", label: columnLabel("email") },
        { key: "suggested_coupon", label: columnLabel("coupon") },
      ],
      mapRowKey: (r) => `nsr_${r.client_id}`,
    },
    {
      sectionId: "campaign-card-addon_upsell",
      campaignType: "addon_upsell",
      title: t("campaigns.cards.addonUpsell.title"),
      subtitle: t("campaigns.cards.addonUpsell.subtitle"),
      helpText: t("campaigns.cards.addonUpsell.help"),
      previewPath: "/api/manager/campaigns/addon_upsell/preview",
      sendPath: "/api/manager/campaigns/addon_upsell/send",
      defaultComposerSeed: CAMPAIGN_TYPE_OPTIONS.find((item) => item.key === "addon_upsell")?.presetParams || null,
      fieldDefs: [
        { name: "base_service_id", label: fieldLabel("baseServiceId"), type: "service", default: "", helperText: fieldHelper("baseServiceId") },
        { name: "addon_name", label: fieldLabel("addonName"), default: "", helperText: fieldHelper("addonName") },
        { name: "lookback_days", label: fieldLabel("lookbackDays"), type: "number", default: 45, helperText: fieldHelper("lookbackDays") },
        { name: "discount_percent", label: fieldLabel("discountPercent"), type: "number", default: 10, helperText: fieldHelper("discountPercent") },
        { name: "coupon_prefix", label: fieldLabel("couponPrefix"), default: "ADDON", helperText: fieldHelper("couponPrefix") },
        { name: "coupon_code", label: fieldLabel("couponOverride"), default: "", helperText: fieldHelper("couponOverride") },
        { name: "deep_link", label: fieldLabel("deepLink"), default: "?page=services-classic", helperText: fieldHelper("deepLink") },
        { name: "expires", label: fieldLabel("expiresOptional"), type: "date", default: "", helperText: fieldHelper("expiresOptional") },
        { name: "limit", label: fieldLabel("limit"), type: "number", default: 200, helperText: fieldHelper("limit") },
      ],
      columns: [
        { key: "client_id", label: columnLabel("clientId") },
        { key: "name", label: columnLabel("name") },
        { key: "email", label: columnLabel("email") },
        { key: "suggested_coupon", label: columnLabel("coupon") },
      ],
      mapRowKey: (r) => `upsell_${r.client_id}`,
    },
  ]), [t, fieldLabel, fieldHelper, columnLabel, segmentOptions, defaultWinbackExpiry, defaultVipExpiry, currentMonth, monthOptions, defaultAnnivExpiry, booleanOptions]);

  const handleCampaignSent = () => setCampaignRefreshKey((v) => v + 1);
  const campaignCardSharedProps = useMemo(() => ({
    deliverySettings,
    provider,
    providerReady: managedMode ? Boolean(deliverySettings.managedDeliveryAvailable) : provider?.status === "active",
    providerStatus: provider?.status || "missing",
    onCampaignSent: handleCampaignSent,
    creditPurchaseEnabled,
    onBuyCredits: (context = null) => {
      setCreditPurchaseContext(context);
      setBuyCreditsOpen(true);
    },
    onManagedSummaryRefresh: () => setCampaignRefreshKey((v) => v + 1),
  }), [deliverySettings, provider, managedMode, creditPurchaseEnabled]);
  const handleProviderChange = (nextProvider, nextManagedDelivery = null) => {
    setProvider(nextProvider);
    if (nextManagedDelivery) {
      setManagedDelivery((currentValue) => mergeManagedDeliverySummary(currentValue, nextManagedDelivery));
    }
  };
  const handleSummaryLoaded = (data) => {
    setDashboardSummary(data || null);
    if (data?.managed_delivery) {
      setManagedDelivery((currentValue) => mergeManagedDeliverySummary(currentValue, data.managed_delivery));
    }
  };
  const openComposer = ({ type = CAMPAIGN_TYPE_OPTIONS[0].key, seed = null } = {}) => {
    setComposerCampaignType(type);
    setComposerSeed(seed);
    setComposerOpen(true);
  };
  const handleOpenSavedCampaign = (campaign) => {
    if (!campaign?.campaign_type) return;
    openComposer({ type: campaign.campaign_type, seed: buildCampaignSeed(campaign) });
  };

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data } = await api.get("/api/manager/marketing/provider", auth);
        if (alive) {
          setProvider(data?.provider || null);
          setManagedDelivery((currentValue) => mergeManagedDeliverySummary(currentValue, data?.managed_delivery || null));
        }
      } catch {
        if (alive) {
          setProvider(null);
        }
      }
    })();
    return () => { alive = false; };
  }, [auth, campaignRefreshKey]);

  useEffect(() => {
    const search = new URLSearchParams(location.search || "");
    const checkoutFlag = (search.get("credits_checkout") || "").trim().toLowerCase();
    if (checkoutFlag !== "success" && checkoutFlag !== "cancel") return;
    const stored = readStoredReviewState();
    if (!stored?.type || !stored?.__reviewState) return;
    setCreditPurchaseContext(stored);
    openComposer({ type: stored.type, seed: stored });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  const refreshCheckoutStatus = async (sid, { pollAttempt = 0 } = {}) => {
    try {
      const { data } = await api.get(`/billing/checkout-status?sid=${encodeURIComponent(sid)}`, auth);
      const status = String(data?.status || "").toLowerCase();
      if (status === "granted") {
        setCheckoutStatusTone("success");
        setCheckoutStatusMessage("Credits added successfully. You can now send your campaign.");
        setCampaignRefreshKey((v) => v + 1);
        return { done: true };
      }
      if (status === "refund_review" || status === "dispute_review" || status === "failed") {
        setCheckoutStatusTone("warning");
        setCheckoutStatusMessage("Payment was recorded, but the credit grant needs review before credits are added.");
        setCampaignRefreshKey((v) => v + 1);
        return { done: true };
      }
      setCheckoutStatusTone("info");
      setCheckoutStatusMessage("Payment received. Your credits are being added.");
      if (pollAttempt < 9) {
        window.setTimeout(() => {
          refreshCheckoutStatus(sid, { pollAttempt: pollAttempt + 1 });
        }, 2000);
      }
      return { done: false };
    } catch {
      setCheckoutStatusTone("info");
      setCheckoutStatusMessage("Payment processing is still in progress. Use Refresh status if your credits do not update yet.");
      return { done: false };
    }
  };

  useEffect(() => {
    const search = new URLSearchParams(location.search || "");
    const sid = (search.get("sid") || "").trim();
    const checkoutFlag = (search.get("credits_checkout") || "").trim().toLowerCase();
    if (!sid || checkoutFlag !== "success" || checkoutHandledSidRef.current === sid) return undefined;
    checkoutHandledSidRef.current = sid;
    refreshCheckoutStatus(sid, { pollAttempt: 0 });
    return undefined;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth, location.search]);

  const startCreditCheckout = async (pack) => {
    if (!pack?.pack_key || checkoutBusyPackKey) return;
    setCheckoutBusyPackKey(pack.pack_key);
    setCheckoutStatusMessage("");
    try {
      if (creditPurchaseContext) writeStoredReviewState(creditPurchaseContext);
      const { data } = await api.post("/api/manager/marketing/credits/checkout", {
        pack_key: pack.pack_key,
        idempotency_key: `tenant_marketing_credit_pack:${pack.pack_key}`,
      }, auth);
      const url = data?.url;
      if (!url) throw new Error("Checkout URL missing.");
      window.location.href = url;
    } catch (e) {
      setCheckoutStatusTone("error");
      setCheckoutStatusMessage(
        e?.response?.data?.message || e?.response?.data?.error || e?.message || "Unable to start secure checkout."
      );
    } finally {
      setCheckoutBusyPackKey("");
    }
  };

  const purchaseRequiredCredits = Math.max(0, Number(creditPurchaseContext?.__reviewState ? (
    creditPurchaseContext.__reviewState.selectionMode === "all_eligible"
      ? Math.max(
        0,
        Number(creditPurchaseContext.__reviewState.previewMeta?.eligible_recipient_count || 0)
        - Object.keys(creditPurchaseContext.__reviewState.excludedRecipientIds || {}).length,
      )
      : Object.keys(creditPurchaseContext.__reviewState.includedRecipientIds || {}).length
  ) : 0));
  const purchaseAvailableCredits = Number(managedDelivery?.available_quota ?? 0);
  const purchaseMissingCredits = Math.max(0, purchaseRequiredCredits - purchaseAvailableCredits);
  const checkoutSessionId = useMemo(() => {
    const search = new URLSearchParams(location.search || "");
    return (search.get("sid") || "").trim();
  }, [location.search]);
  const recommendedPackKey = useMemo(() => {
    if (!purchaseMissingCredits || !creditPacks.length) return "";
    const coveringPack = creditPacks
      .slice()
      .sort((a, b) => Number(a.credits || 0) - Number(b.credits || 0))
      .find((row) => Number(row.credits || 0) >= purchaseMissingCredits);
    return coveringPack?.pack_key || "";
  }, [creditPacks, purchaseMissingCredits]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data } = await api.get("/auth/me");
        if (alive) setCurrentUserInfo(data || null);
      } catch {
        if (alive) setCurrentUserInfo(null);
      }
    })();
    return () => { alive = false; };
  }, []);

  if (!canAccess) {
    return (
      <Box>
        <UpgradeNoticeBanner
          requiredPlan="pro"
          message="Email campaigns require the Pro plan or higher."
        />
        <Typography variant="body2" color="text.secondary">
          Upgrade to Pro to export clients and launch Broadcast, Win-Back, VIP, No-Show, and Anniversary campaigns.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header + Guide */}
      <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h4">{t("titles.marketingCampaigns")}</Typography>
        <Box display="flex" alignItems="center" gap={1}>
          <Button variant="contained" onClick={() => openComposer()}>
            Create campaign
          </Button>
          <Tooltip title={t("tooltips.marketingGuide")}>
            <IconButton onClick={() => setGuideOpen(true)}>
              <HelpOutline />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      <CreateCampaignDialog
        open={composerOpen}
        onClose={() => setComposerOpen(false)}
        campaignDefinitions={campaignDefinitions}
        campaignCardSharedProps={campaignCardSharedProps}
        initialCampaignType={composerCampaignType}
        initialComposerSeed={composerSeed}
      />

      {/* Guide Drawer (content imported to keep this file lean) */}
      <Drawer
        anchor="right"
        open={guideOpen}
        onClose={() => setGuideOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{ zIndex: (theme) => theme.zIndex.modal + 2000, '& .MuiDrawer-paper': { zIndex: 'inherit' } }}
      >
        <MarketingCampaignsGuide onClose={()=>setGuideOpen(false)} />
      </Drawer>
      <Alert severity="info" sx={{ mb: 2 }}>
        Every marketing email includes an unsubscribe link. Suppressed emails are skipped automatically, and campaigns are sent gradually to protect deliverability.
      </Alert>
      {checkoutStatusMessage ? (
        <Alert
          severity={checkoutStatusTone}
          sx={{ mb: 2 }}
          action={checkoutSessionId ? (
            <Button color="inherit" size="small" onClick={() => refreshCheckoutStatus(checkoutSessionId, { pollAttempt: 0 })}>
              Refresh status
            </Button>
          ) : null}
        >
          {checkoutStatusMessage}
        </Alert>
      ) : null}
      <DeliverabilityOverview auth={auth} refreshKey={campaignRefreshKey} onSummaryLoaded={handleSummaryLoaded} />
      {/* Export: company clients (scoped) */}
      <MarketingProviderCard auth={auth} onProviderChange={handleProviderChange} managedMode={managedMode} managedCredits={managedCredits} companyName={companyName} managerReplyTo={managerReplyTo} managedDelivery={managedDelivery} onBuyCredits={() => setBuyCreditsOpen(true)} />
      <RecentMarketingCampaigns auth={auth} refreshKey={campaignRefreshKey} onOpenCampaign={handleOpenSavedCampaign} onCampaignsLoaded={setCampaignRows} />
      <MarketingSuppressionsCard auth={auth} refreshKey={campaignRefreshKey} />
      <ExportClientsCard />
      <Accordion
        variant="outlined"
        expanded={templateLibraryOpen}
        onChange={(_, nextExpanded) => setTemplateLibraryOpen(nextExpanded)}
        sx={{ mb: 3 }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box>
            <Typography variant="h6">Campaign templates</Typography>
            <Typography variant="body2" color="text.secondary">
              Use Create campaign for the guided flow. Expand this only if you want direct access to a specific template.
            </Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          {campaignDefinitions.map((definition) => (
            <CampaignCard
              key={definition.campaignType}
              {...definition}
              {...campaignCardSharedProps}
            />
          ))}
        </AccordionDetails>
      </Accordion>

      <Dialog open={buyCreditsOpen} onClose={() => !checkoutBusyPackKey && setBuyCreditsOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Buy email credits</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <Typography variant="body2" color="text.secondary">
              Purchase prepaid credits for Schedulaa-managed campaign delivery. Credits are added only after Stripe confirms payment.
            </Typography>
            {purchaseMissingCredits > 0 ? (
              <Alert severity="warning">
                You need {formatCreditCount(purchaseMissingCredits)} more email credits to send this campaign.
              </Alert>
            ) : null}
            {creditPacks.length ? creditPacks.map((pack) => {
              const displayPrice = formatPriceAmount(pack.unit_amount, pack.currency);
              const packCredits = Number(pack.credits || 0);
              const estimatedAfterPurchase = purchaseAvailableCredits + packCredits;
              const estimatedAfterCampaign = Math.max(0, estimatedAfterPurchase - purchaseRequiredCredits);
              const isRecommended = Boolean(recommendedPackKey) && recommendedPackKey === pack.pack_key;
              return (
                <Card key={pack.pack_key} variant="outlined">
                  <CardContent>
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ xs: "flex-start", sm: "center" }} justifyContent="space-between">
                      <Box>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                          <Typography variant="h6">{pack.label || `${pack.credits} email credits`}</Typography>
                          {isRecommended ? <Chip size="small" color="primary" label="Recommended" /> : null}
                        </Stack>
                        <Typography variant="body2" color="text.secondary">
                          {displayPrice ? `${displayPrice}${pack.currency ? ` ${String(pack.currency).toUpperCase()}` : ""}` : "Price configured in Stripe"}
                        </Typography>
                        {purchaseRequiredCredits > 0 ? (
                          <Stack spacing={0.25} sx={{ mt: 1 }}>
                            {isRecommended ? <Typography variant="body2">Covers this campaign</Typography> : null}
                            <Typography variant="body2" color="text.secondary">
                              Estimated balance after purchase: {formatCreditCount(estimatedAfterPurchase)} credits
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Estimated balance after sending this campaign: {formatCreditCount(estimatedAfterCampaign)} credits
                            </Typography>
                          </Stack>
                        ) : null}
                      </Box>
                      <Button
                        variant="contained"
                        onClick={() => startCreditCheckout(pack)}
                        disabled={!creditPurchaseEnabled || checkoutBusyPackKey === pack.pack_key}
                      >
                        {checkoutBusyPackKey === pack.pack_key ? "Opening checkout..." : "Continue to secure checkout"}
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>
              );
            }) : <Alert severity="info">No credit packs are configured yet.</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBuyCreditsOpen(false)} disabled={Boolean(checkoutBusyPackKey)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}
