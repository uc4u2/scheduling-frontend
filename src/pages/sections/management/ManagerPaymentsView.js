// src/pages/sections/management/ManagerPaymentsView.js
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DateTime } from "luxon";
import { jwtDecode } from "jwt-decode";
import { getUserTimezone } from "../../../utils/timezone";
import { isoFromParts } from "../../../utils/datetime";
import { api, isStripeOnboardingIncomplete } from "../../../utils/api";
import { formatCurrency } from "../../../utils/formatters";
import {
  setActiveCurrency,
  normalizeCurrency,
  resolveCurrencyForCountry,
  resolveActiveCurrencyFromCompany,
  getActiveCurrency,
} from "../../../utils/currency";
import { useLocation } from "react-router-dom";
import {
  Box,
  Typography,
  Alert,
  Button,
  CircularProgress,
  Backdrop,
  Paper,
  Stack,
  Divider,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  RadioGroup,
  FormControlLabel,
  Radio,
  Snackbar,
  Skeleton,
  Tooltip,
  IconButton,
  FormLabel,
  Switch,
  InputAdornment,
  Select,
  MenuItem,
  TablePagination,
  Toolbar, // spacer matching AppBar height
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import SearchIcon from "@mui/icons-material/Search";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import ReplayIcon from "@mui/icons-material/Replay";
import RefreshIcon from "@mui/icons-material/Refresh";
import { isMobileComplianceMode } from "../../../utils/mobileCompliance";
import MobileWebOnlyNotice from "../../../components/mobile/MobileWebOnlyNotice";
import FinanceInvoiceDetailDialog from "../../finance/FinanceInvoiceDetailDialog";

// Timezone helpers
const resolveTZ = () => getUserTimezone();

/**
 * Render a booking's local date/time in the manager's timezone.
 * We first build an ISO using the booking's source TZ, then shift to the viewer TZ.
 */
const fmtApptLocal = (
  dateStr,
  timeStr,
  sourceTz,
  pattern = "ccc, LLL d, yyyy - hh:mm a (z)",
) => {
  if (!dateStr || !timeStr) return "";
  const iso = isoFromParts(dateStr, timeStr, sourceTz || resolveTZ());
  const zone = sourceTz || resolveTZ();
  return DateTime.fromISO(iso).setZone(zone).toFormat(pattern);
};

const fmtISO = (isoLike, pattern = "yyyy-LL-dd hh:mm a (z)", zone) => {
  if (!isoLike) return "";
  const targetZone = zone || resolveTZ();
  return DateTime.fromISO(isoLike).setZone(targetZone).toFormat(pattern);
};

// Transaction helpers
const toLowerSafe = (value) =>
  value == null ? "" : String(value).toLowerCase();

const currentRecoveryAccountId = () => {
  if (typeof window === "undefined") return "current";
  const explicitId =
    window.localStorage.getItem("user_id") ||
    window.localStorage.getItem("userId");
  if (explicitId) return String(explicitId);
  try {
    const claims = jwtDecode(window.localStorage.getItem("token") || "");
    return String(claims?.sub || claims?.identity || claims?.email || "current");
  } catch (_error) {
    return "current";
  }
};

const noShowRefundRecoveryScope = (booking, feeTxn) => ({
  companyId: String(booking?.company_id || "current"),
  accountId: currentRecoveryAccountId(),
  bookingId: String(booking?.id || ""),
  transactionId: String(feeTxn?.id || ""),
});

const noShowRefundRecoveryKeys = (booking, feeTxn) => {
  const scope = noShowRefundRecoveryScope(booking, feeTxn);
  return [
    `schedulaa:noshow-refund:v2:${scope.companyId}:${scope.accountId}:${scope.bookingId}:${scope.transactionId}`,
    `schedulaa:noshow-refund:${scope.companyId}:${scope.bookingId}:${scope.transactionId}`,
  ];
};

const readNoShowRefundRecovery = (booking, feeTxn) => {
  if (typeof window === "undefined" || !feeTxn?.id) return null;
  const expectedScope = noShowRefundRecoveryScope(booking, feeTxn);
  for (const storageKey of noShowRefundRecoveryKeys(booking, feeTxn)) {
    try {
      const saved = JSON.parse(window.localStorage.getItem(storageKey) || "null");
      if (!saved?.idempotencyKey || !Number(saved?.amountCents)) continue;
      if (
        saved.scope &&
        Object.entries(expectedScope).some(
          ([field, value]) => String(saved.scope?.[field] || "") !== value,
        )
      ) {
        continue;
      }
      return { ...saved, storageKey, scope: expectedScope };
    } catch (_error) {
      // Ignore malformed browser state; the server remains authoritative.
    }
  }
  return null;
};

const clearNoShowRefundRecovery = (booking, feeTxn) => {
  if (typeof window === "undefined") return;
  noShowRefundRecoveryKeys(booking, feeTxn).forEach((key) =>
    window.localStorage.removeItem(key),
  );
};

const summarizeTxns = (rows = []) => {
  const captureStatuses = new Set(["captured", "succeeded", "paid"]);
  const pendingStatuses = new Set(["pending", "authorized"]);
  const balanceTypes = new Set([
    "balance",
    "service",
    "product",
    "deposit",
  ]);

  const totals = {
    capturedBalance: 0,
    pendingBalance: 0,
    capturedTip: 0,
    pendingTip: 0,
    softBalance: 0,
    softTip: 0,
    refundedAny: 0,
    refundedTip: 0,
    capturedNoShow: 0,
    pendingNoShow: 0,
    refundedNoShow: 0,
  };

  rows.forEach((row) => {
    const type = toLowerSafe(row?.type);
    const status = toLowerSafe(row?.status);
    const amount = Math.abs(Number(row?.amount || 0));
    if (!Number.isFinite(amount)) {
      return;
    }

    const bucket =
      toLowerSafe(row?.bucket) ||
      toLowerSafe(row?.metadata?.bucket) ||
      toLowerSafe(row?.refund_bucket);

    const isRefund = type === "refund";
    const isBalanceType = balanceTypes.has(type);
    const isTip = type === "tip";
    const isNoShow = type === "no_show";

    if (isBalanceType) {
      if (captureStatuses.has(status)) totals.capturedBalance += amount;
      if (pendingStatuses.has(status)) totals.pendingBalance += amount;
      if (captureStatuses.has(status) || pendingStatuses.has(status) || isRefund) {
        totals.softBalance += amount;
      }
    }

    if (isTip) {
      if (captureStatuses.has(status)) totals.capturedTip += amount;
      if (pendingStatuses.has(status)) totals.pendingTip += amount;
      if (captureStatuses.has(status) || pendingStatuses.has(status) || isRefund) {
        totals.softTip += amount;
      }
    }

    if (isNoShow) {
      if (captureStatuses.has(status) || status === "refunded") {
        totals.capturedNoShow += amount;
      }
      if (pendingStatuses.has(status)) totals.pendingNoShow += amount;
    }

    if (isRefund) {
      totals.refundedAny += amount;
      if (bucket === "tip") {
        totals.refundedTip += amount;
      }
      if (bucket === "no_show") {
        totals.refundedNoShow += amount;
      }
    }
  });

  return totals;
};

const normalizeBookingPayment = (booking = {}) => {
  const statuses = [];
  const pushStatus = (val) => {
    const normalized = toLowerSafe(val);
    if (normalized) statuses.push(normalized);
  };

  pushStatus(booking.payment_status);
  pushStatus(booking.product_order?.payment_status);
  pushStatus(booking.product_order?.status);
  if (Array.isArray(booking.payments)) {
    booking.payments.forEach((txn) => pushStatus(txn?.status));
  }

  const hasCardOnFile = Boolean(
    booking.card_on_file || statuses.includes("card_on_file"),
  );
  const paidish =
    Boolean(booking.paid) ||
    Boolean(booking.product_order?.paid) ||
    statuses.some((s) =>
      ["paid", "succeeded", "captured", "complete"].includes(s),
    );

  let status =
    statuses.find((s) =>
      [
        "partially_refunded",
        "refunded",
        "failed",
        "pending",
        "processing",
        "requires_payment_method",
      ].includes(s),
    ) ||
    statuses.find(Boolean) ||
    "";

  if (paidish) {
    if (!["partially_refunded", "refunded"].includes(status)) {
      status = "paid";
    }
  }

  if (!status) {
    status = hasCardOnFile
      ? "card_on_file"
      : statuses.includes("pending")
        ? "pending"
        : "unpaid";
  }

  return {
    status,
    paidish,
    hasCardOnFile,
    original: statuses.find(Boolean) || "",
  };
};

const formatPaymentStatusLabel = (status) =>
  (status || "unpaid")
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ") || "Unpaid";

const paymentStatusChipColor = (status) => {
  switch (status) {
    case "paid":
      return "success";
    case "partial_payment":
    case "card_on_file":
      return status === "card_on_file" ? "primary" : "warning";
    case "pending":
    case "processing":
      return "warning";
    case "partially_refunded":
    case "refunded":
      return "info";
    case "failed":
    case "requires_payment_method":
      return "error";
    default:
      return "default";
  }
};

export default function ManagerPaymentsView({ connect }) {
  const location = useLocation();
  const consumedDeepLinkRef = useRef("");
  const mobileComplianceMode = isMobileComplianceMode();

  const hasConnect = Boolean(connect && typeof connect === 'object');
  const connectStatus = hasConnect ? connect.status || {} : {};
  const connectLoading = hasConnect ? Boolean(connect.loading) : false;
  const connectNeedsOnboarding = hasConnect ? Boolean(connect.needsOnboarding) : false;
  const connectChargesEnabled = hasConnect ? Boolean(connectStatus?.charges_enabled) : true;
  const connectPayoutsEnabled = hasConnect ? Boolean(connectStatus?.payouts_enabled) : true;
  const connectStart = hasConnect ? connect.startOnboarding : undefined;
  const connectResume = hasConnect ? connect.refreshLink : undefined;
  const connectDashboard = hasConnect ? connect.openDashboard : undefined;
  const connectRefreshStatus = hasConnect ? connect.refresh : undefined;
  const connectAction = hasConnect ? connect.action || null : null;
  const connectWarning = hasConnect && (connectNeedsOnboarding || !connectChargesEnabled);

  const showConnectBanner = hasConnect;

  // Data
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters + paging
  const [q, setQ] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all"); // all | paid | pending | card_on_file | unpaid | partially_refunded | refunded | no_show
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  // Messages
  const [msg, setMsg] = useState("");
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });

  // Payment history modal (replaces Drawer)
  const [historyOpen, setHistoryOpen] = useState(false);
  const [viewAppt, setViewAppt] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [invoiceDetailOpen, setInvoiceDetailOpen] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);

  // Charge dialog
  const [chargeOpen, setChargeOpen] = useState(false);
  const [chargeBooking, setChargeBooking] = useState(null);
  const [pmLoading, setPmLoading] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedPM, setSelectedPM] = useState("");
  const [amount, setAmount] = useState("");
  const [chargeExtra, setChargeExtra] = useState("");
  const [chargeTip, setChargeTip] = useState("");
  const [chargeIntent, setChargeIntent] = useState("");
  const [noShowFeeContext, setNoShowFeeContext] = useState(null);
  const [noShowFeeContextError, setNoShowFeeContextError] = useState("");
  const [chargeOnboardingUrl, setChargeOnboardingUrl] = useState("");
  const [note, setNote] = useState("");
  const [charging, setCharging] = useState(false);
  const [chargeReviewOpen, setChargeReviewOpen] = useState(false);
  const [chargeTxns, setChargeTxns] = useState([]);
  const [chargeSummary, setChargeSummary] = useState({
    capturedBalance: 0,
    capturedTip: 0,
    pendingBalance: 0,
    pendingTip: 0,
    capturedNoShow: 0,
    pendingNoShow: 0,
  });
  const isNoShowFeeCharge = chargeIntent === "no_show_fee";
  const noShowFeeState = noShowFeeContext?.fee?.state || "not_requested";
  const noShowFeeBlocked =
    isNoShowFeeCharge &&
    (Boolean(noShowFeeContextError) ||
      !noShowFeeContext?.accepted_policy?.available ||
      noShowFeeContext?.currency_contract?.status !== "resolved" ||
      [
        "captured",
        "refunded",
        "partially_refunded",
        "legacy_fee_present",
      ].includes(noShowFeeState));

  // Refund dialog
  const [refundOpen, setRefundOpen] = useState(false);
  const [refundBooking, setRefundBooking] = useState(null);
  const [refundLoading, setRefundLoading] = useState(false);
  const [refundAmount, setRefundAmount] = useState(""); // manual/offline entry
  const [refundAuto, setRefundAuto] = useState(true); // Stripe (auto) vs manual
  const [refundReason, setRefundReason] = useState("");
  const [refundPlatformFee, setRefundPlatformFee] = useState(false);
  const [refundMode, setRefundMode] = useState("full");
  const [includeTips, setIncludeTips] = useState(true);
  const [serviceAmountInput, setServiceAmountInput] = useState("");
  const [tipAmountInput, setTipAmountInput] = useState("");
  const [refundBucket, setRefundBucket] = useState("service");
  const [noShowRefundAmount, setNoShowRefundAmount] = useState("");
  const [noShowRefundKey, setNoShowRefundKey] = useState("");

  useEffect(() => {
    if (refundAuto) {
      setRefundMode("full");
      setIncludeTips(true);
      setServiceAmountInput("");
      setTipAmountInput("");
      setNoShowRefundAmount("");
      setNoShowRefundKey("");
    } else {
      setRefundMode("custom");
      setIncludeTips(false);
    }
  }, [refundAuto]);

  // Refund summary
  const [refundSummary, setRefundSummary] = useState({
    capturedBalance: 0,
    capturedTip: 0,
    refundedAny: 0,
    lastTip: 0,
    capturedNoShow: 0,
    refundedNoShow: 0,
  });
  const [displayCurrency, setDisplayCurrency] = useState(() =>
    getActiveCurrency(),
  );
  const money = (value, currencyCode) =>
    formatCurrency(value, currencyCode || displayCurrency);
  const remainingTotal = Math.max(
    0,
    Number(refundSummary.capturedBalance || 0) +
      Number(refundSummary.capturedTip || 0) -
      Math.max(
        0,
        Number(refundSummary.refundedAny || 0) -
          Number(refundSummary.refundedNoShow || 0),
      ),
  );
  const serviceCaptured = Number(refundSummary.capturedBalance || 0);
  const tipCaptured = Number(refundSummary.capturedTip || 0);
  const refundedAny = Math.max(
    0,
    Number(refundSummary.refundedAny || 0) -
      Number(refundSummary.refundedNoShow || 0),
  );
  const refundedAgainstService = Math.min(serviceCaptured, refundedAny);
  const serviceRemaining = Math.max(
    0,
    serviceCaptured - refundedAgainstService,
  );
  const tipRefundedEstimate = Math.max(0, refundedAny - refundedAgainstService);
  const tipRemaining = Math.max(0, tipCaptured - tipRefundedEstimate);
  const fullStripeRefundAmount =
    serviceRemaining + (includeTips && tipRemaining > 0 ? tipRemaining : 0);
  const noShowRemaining = Math.max(
    0,
    Number(refundSummary.capturedNoShow || 0) -
      Number(refundSummary.refundedNoShow || 0),
  );

  useEffect(() => {
    if (tipRemaining <= 0 && includeTips) {
      setIncludeTips(false);
      setTipAmountInput("");
    }
  }, [tipRemaining, includeTips]);

  // prevent double-submit in refund flow
  const [refunding, setRefunding] = useState(false);

  const openFinanceInvoice = (invoiceId) => {
    if (!invoiceId) return;
    setSelectedInvoiceId(invoiceId);
    setInvoiceDetailOpen(true);
  };

  // Load bookings
  const loadBookings = useCallback(async ({ throwOnError = false } = {}) => {
    setLoading(true);
    try {
      const { data } = await api.get("/api/manager/payments-and-refunds");
      const raw = Array.isArray(data) ? data : data?.items || data?.bookings || [];
      const normalized = raw.map((b) => {
        if (b?.row_type === "finance_invoice") {
          const paymentStatus = String(b.payment_status || b.status || "pending").toLowerCase();
          const whenValue = b.when || b.issue_date || b.updated_at || b.created_at || null;
          const whenLabel = b.issue_date
            ? `Invoice date ${b.issue_date}`
            : whenValue
              ? fmtISO(whenValue, "yyyy-LL-dd hh:mm a")
              : "";
          const whenMs = whenValue ? DateTime.fromISO(whenValue).toMillis() : 0;
          return {
            ...b,
            payment_status: paymentStatus,
            paid: paymentStatus === "paid",
            payment_origin: b.payment_origin || "unpaid",
            offline_paid_amount: Number(b.offline_paid_amount || 0),
            online_paid_amount: Number(b.online_paid_amount || 0),
            total_recorded_paid_amount: Number(b.total_recorded_paid_amount || 0),
            remaining_balance: Number(b.remaining_balance || 0),
            payment_method_summary: b.payment_method_summary || "",
            _startMs: whenMs,
            _latestPaymentMs: whenMs,
            _whenLabel: whenLabel,
            _capturedBalanceTotal: Number(b.total_recorded_paid_amount || 0),
            _capturedTipTotal: 0,
            _refundedTotal: Number(b.refunded_amount || 0),
            _remainingRefundable: Number(b.remaining_refundable_amount || 0),
            _netCollectedAmount: b.net_collected_amount_complete === false
              ? null
              : Number(b.net_collected_amount || 0),
            _sourceTypeLabel: b.source_label || "Business Finance",
            client: b.client || {
              full_name: b.client_name || "Client",
              email: b.client_email || "",
            },
            service: b.service || null,
            amount: Number(b.amount || 0),
            currency: b.currency || displayCurrency,
          };
        }
        const paymentMeta = normalizeBookingPayment(b);
        const dateUtc = b?.date || null;
        const startUtc = b?.start_time || null;
        const endUtc = b?.end_time || null;
        const srcTZ =
          b?.appointment_timezone ||
          b?.appointmentTimezone ||
          b?.timezone ||
          b?.recruiterTimezone ||
          b?.recruiter?.timezone ||
          b?.companyTimezone ||
          "UTC";
        const localDate = b?.local_date || b?.localDate || dateUtc;
        const localStart =
          b?.local_start_time || b?.start_time_local || startUtc;
        const localEnd = b?.local_end_time || b?.end_time_local || endUtc;

        const startIso =
          localDate && localStart
            ? isoFromParts(localDate, localStart, srcTZ)
            : "";
        const endIso =
          localDate && localEnd ? isoFromParts(localDate, localEnd, srcTZ) : "";

        const startMillis = startIso
          ? DateTime.fromISO(startIso).toMillis()
          : 0;

        const txns = Array.isArray(b.payments) ? b.payments : [];
        const capturedSummary = summarizeTxns(txns);
        const refundSumRaw = txns
          .filter((p) => String(p.type || "") === "refund")
          .reduce((sum, p) => sum + Number(p.amount || 0), 0);
        const refundSum = Math.max(refundSumRaw, capturedSummary.refundedAny);

        let capturedBalanceDisplay =
          capturedSummary.capturedBalance || capturedSummary.softBalance;
        let capturedTipDisplay =
          capturedSummary.capturedTip || capturedSummary.softTip;
        let refundedDisplay = refundSum;
        let latestPaymentMs = startMillis;
        let latestPaymentLabel = "";

        if (txns.length) {
          const groups = new Map();
          txns.forEach((txn) => {
            const ref =
              txn.provider_ref ||
              txn.providerRef ||
              txn.stripe_payment_intent_id ||
              "__unassigned__";
            const tsIso =
              txn.timestamp || txn.created_at || txn.updated_at || null;
            const tsMs = tsIso ? DateTime.fromISO(tsIso).toMillis() : 0;
            if (!groups.has(ref)) {
              groups.set(ref, {
                capturedBalance: 0,
                capturedTip: 0,
                refunded: 0,
                latestMs: tsMs,
                latestIso: tsIso,
              });
            }
            const bucket = groups.get(ref);
            if (tsMs > bucket.latestMs) {
              bucket.latestMs = tsMs;
              bucket.latestIso = tsIso;
            }
            const amount = Math.abs(Number(txn.amount || 0));
            if (!Number.isFinite(amount)) {
              return;
            }
            const type = toLowerSafe(txn.type);
            const status = toLowerSafe(txn.status);
            const isBalanceType = [
              "balance",
              "service",
              "product",
              "deposit",
              "no_show",
            ].includes(type);
            const captureStatuses = ["captured", "succeeded", "paid"];
            const refundStatuses = ["succeeded", "captured", "paid", "refunded"];

            if (type === "refund") {
              if (refundStatuses.includes(status)) {
                bucket.refunded += amount;
              }
              return;
            }

            if (type === "tip") {
              if (captureStatuses.includes(status)) {
                bucket.capturedTip += amount;
              }
              return;
            }

            if (isBalanceType && captureStatuses.includes(status)) {
              bucket.capturedBalance += amount;
            }
          });
          const sortedGroups = Array.from(groups.values()).sort(
            (a, b) => b.latestMs - a.latestMs,
          );
          const primary = sortedGroups[0];
          if (primary) {
            capturedBalanceDisplay = primary.capturedBalance;
            capturedTipDisplay = primary.capturedTip;
            refundedDisplay = Math.max(refundSum, primary.refunded);
            if (primary.latestIso) {
              latestPaymentMs = primary.latestMs;
              latestPaymentLabel = fmtISO(primary.latestIso, undefined, srcTZ);
            }
          }
        }

        if (capturedBalanceDisplay === 0 && capturedSummary.softBalance > 0) {
          capturedBalanceDisplay = capturedSummary.softBalance;
        }
        if (capturedTipDisplay === 0 && capturedSummary.softTip > 0) {
          capturedTipDisplay = capturedSummary.softTip;
        }

        const productOrder = b.product_order || b.productOrder;
        if (productOrder) {
          const orderTotal = Number(
            productOrder.total_amount ??
              productOrder.total ??
              productOrder.grand_total ??
              0,
          );
          const orderTip = Number(
            productOrder.tip_total ?? productOrder.tip ?? 0,
          );
          const orderRefund = Number(
            productOrder.refunded_total ?? productOrder.refund_total ?? 0,
          );
          const orderTimestamp =
            productOrder.updated_at ||
            productOrder.paid_at ||
            productOrder.created_at ||
            null;
          if (orderTotal > 0) {
            capturedBalanceDisplay = Math.max(orderTotal - orderTip, 0);
            capturedTipDisplay = Math.max(orderTip, 0);
          }
          if (orderRefund > 0) {
            refundedDisplay = Math.max(refundedDisplay, orderRefund);
          }
          if (orderTimestamp) {
            const orderMs = DateTime.fromISO(orderTimestamp).toMillis();
            if (orderMs > latestPaymentMs) {
              latestPaymentMs = orderMs;
              latestPaymentLabel = fmtISO(orderTimestamp, undefined, srcTZ);
            }
          }
        }

        if (!latestPaymentLabel && latestPaymentMs) {
          const fallbackIso = DateTime.fromMillis(latestPaymentMs, {
            zone: srcTZ || resolveTZ(),
          }).toISO();
          latestPaymentLabel = fmtISO(fallbackIso, undefined, srcTZ);
        }

        return {
          ...b,
          row_type: b?.row_type || "booking",
          date: localDate,
          start_time: localStart,
          end_time: localEnd,
          local_date: localDate,
          local_start_time: localStart,
          local_end_time: localEnd,
          date_utc: dateUtc,
          start_time_utc: startUtc,
          end_time_utc: endUtc,
          appointment_timezone: srcTZ,
          payment_status: paymentMeta.status,
          card_on_file: paymentMeta.hasCardOnFile,
          paid: paymentMeta.paidish || Boolean(b.paid),
          _paymentStatusOriginal: paymentMeta.original,
          _paidish: paymentMeta.paidish,
          _hasCardOnFile: paymentMeta.hasCardOnFile,
          _tz: srcTZ,
          _srcTZ: srcTZ,
          _viewerTz: resolveTZ(),
          _startIso: startIso,
          _endIso: endIso,
          _startMs: startMillis,
          _latestPaymentMs: latestPaymentMs,
          _latestPaymentLabel: latestPaymentLabel,
          _capturedBalanceTotal: capturedBalanceDisplay,
          _capturedTipTotal: capturedTipDisplay,
          _refundedTotal: refundedDisplay,
          currency: b.currency || productOrder?.currency || displayCurrency,
          _whenLabel: fmtApptLocal(
            localDate,
            localStart,
            srcTZ,
            "yyyy-LL-dd hh:mm a (z)",
          ),
          _sourceTypeLabel: b?.source_label || "Booking",
        };
      });
      setBookings(normalized);

      const bookingCurrency = normalized
        .map((b) => normalizeCurrency(b?.currency || b?.stripe_currency))
        .find(Boolean);
      const companyCurrency = resolveActiveCurrencyFromCompany(data?.company);
      const inferredCurrency = resolveCurrencyForCountry(
        data?.company?.country_code || data?.company?.tax_country_code || "",
      );
      const effectiveCurrency =
        bookingCurrency ||
        companyCurrency ||
        inferredCurrency ||
        displayCurrency ||
        "USD";
      const normalizedCurrency = normalizeCurrency(effectiveCurrency) || "USD";
      if (normalizedCurrency !== displayCurrency) {
        setDisplayCurrency(normalizedCurrency);
        setActiveCurrency(normalizedCurrency);
      }

      setMsg("");
    } catch (e) {
      setMsg(e?.response?.data?.error || "Failed to load bookings.");
      setBookings([]);
      if (throwOnError) throw e;
    } finally {
      setLoading(false);
    }
  }, [displayCurrency]);
  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  // Load transactions for an appointment
  const loadPayments = async (
    appointmentId,
    tzHint,
    { throwOnError = false } = {},
  ) => {
    setLoadingPayments(true);
    try {
      const { data } = await api.get(`/api/payments/list/${appointmentId}`);
      const txns = Array.isArray(data) ? data : data?.transactions || [];
      const apiTz = data?.appointment_timezone;
      const tz = tzHint || apiTz || resolveTZ();
      const decorated = txns.map((p) => {
        const ts = p.timestamp || p.created_at || p.updated_at || null;
        const txnTz = p._tz || tz;
        const tsLabel = ts ? fmtISO(ts, undefined, txnTz) : "";
        return {
          ...p,
          _tz: txnTz,
          _tsLabel: tsLabel,
          timestamp: p.timestamp || ts,
        };
      });
      const recoveryBooking =
        bookings.find((booking) => booking?.id === appointmentId) ||
        (refundBooking?.id === appointmentId ? refundBooking : { id: appointmentId });
      decorated.forEach((row) => {
        if (toLowerSafe(row?.type) !== "no_show" || !row?.fee_summary) return;
        const saved = readNoShowRefundRecovery(recoveryBooking, row);
        const recovery = row.fee_summary.refund_recovery;
        if (
          saved?.idempotencyKey &&
          recovery?.idempotency_key === saved.idempotencyKey &&
          recovery?.state === "succeeded"
        ) {
          clearNoShowRefundRecovery(recoveryBooking, row);
          setSnackbar({
            open: true,
            message: "The no-show fee refund was confirmed and recovered.",
            severity: "success",
          });
        }
      });
      setPayments(decorated);
      setBookings((prev) =>
        prev.map((booking) => {
          if (!booking || booking.id !== appointmentId) return booking;
          const nextBooking = {
            ...booking,
            _tz: tz,
            _srcTZ: tz,
            timezone: tz,
            appointment_timezone: tz,
          };
          const baseDate =
            booking.local_date || booking.date || booking.date_utc || null;
          const baseStart =
            booking.local_start_time ||
            booking.start_time ||
            booking.start_time_utc ||
            null;
          const baseEnd =
            booking.local_end_time ||
            booking.end_time ||
            booking.end_time_utc ||
            null;
          if (baseDate && baseStart) {
            const iso = isoFromParts(baseDate, baseStart, tz);
            nextBooking.local_date = baseDate;
            nextBooking.local_start_time = baseStart;
            nextBooking.date = baseDate;
            nextBooking.start_time = baseStart;
            nextBooking._startIso = iso;
            nextBooking._whenLabel = fmtApptLocal(
              baseDate,
              baseStart,
              tz,
              "yyyy-LL-dd hh:mm a (z)",
            );
          }
          if (baseEnd) {
            nextBooking.local_end_time = baseEnd;
            nextBooking.end_time = baseEnd;
          }
          return nextBooking;
        }),
      );

      setViewAppt((prev) => {
        if (!prev || prev.id !== appointmentId) return prev;
        const next = {
          ...prev,
          _tz: tz,
          _srcTZ: tz,
          timezone: tz,
          appointment_timezone: tz,
        };
        const baseDate = prev.local_date || prev.date || prev.date_utc || null;
        const baseStart =
          prev.local_start_time ||
          prev.start_time ||
          prev.start_time_utc ||
          null;
        const baseEnd =
          prev.local_end_time || prev.end_time || prev.end_time_utc || null;
        if (baseDate && baseStart) {
          const iso = isoFromParts(baseDate, baseStart, tz);
          next.local_date = baseDate;
          next.local_start_time = baseStart;
          next.date = baseDate;
          next.start_time = baseStart;
          next._startIso = iso;
          next._whenLabel = fmtApptLocal(
            baseDate,
            baseStart,
            tz,
            "yyyy-LL-dd hh:mm a (z)",
          );
        }
        if (baseEnd) {
          next.local_end_time = baseEnd;
          next.end_time = baseEnd;
        }
        return next;
      });

      const paymentCurrency = decorated
        .map((p) => normalizeCurrency(p.currency))
        .find(Boolean);
      const normalizedCurrency =
        normalizeCurrency(paymentCurrency) || displayCurrency || "USD";
      if (normalizedCurrency !== displayCurrency) {
        setDisplayCurrency(normalizedCurrency);
        setActiveCurrency(normalizedCurrency);
      }

      // refund summary
      const totals = summarizeTxns(decorated);
      const capBal =
        totals.capturedBalance > 0
          ? totals.capturedBalance
          : totals.softBalance;
      const capTip =
        totals.capturedTip > 0 ? totals.capturedTip : totals.softTip;
      const refunded = totals.refundedAny;

      let lastTip = 0;
      let lastTipMs = -Infinity;
      decorated.forEach((p) => {
        const type = toLowerSafe(p?.type);
        if (type !== "tip") {
          return;
        }
        const amount = Math.abs(Number(p?.amount || 0));
        if (!Number.isFinite(amount)) {
          return;
        }
        const ts = p?.timestamp || p?.created_at || p?.updated_at || null;
        if (ts) {
          const ms = DateTime.fromISO(ts).toMillis();
          if (Number.isFinite(ms) && ms >= lastTipMs) {
            lastTipMs = ms;
            lastTip = amount;
          }
        } else {
          lastTip = amount;
        }
      });
      if (!lastTip && totals.softTip > 0) {
        lastTip = totals.softTip;
      }

      setRefundSummary({
        capturedBalance: capBal,
        capturedTip: capTip,
        refundedAny: refunded,
        lastTip,
        capturedNoShow: totals.capturedNoShow,
        refundedNoShow: totals.refundedNoShow,
      });
      return decorated;
    } catch (e) {
      setPayments([]);
      setMsg(e?.response?.data?.error || "Failed to load payment history.");
      setRefundSummary({
        capturedBalance: 0,
        capturedTip: 0,
        refundedAny: 0,
        lastTip: 0,
        capturedNoShow: 0,
        refundedNoShow: 0,
      });
      if (throwOnError) throw e;
      return [];
    } finally {
      setLoadingPayments(false);
    }
  };

  // View payments in modal (popup)
  const onViewPayments = (b) => {
    setViewAppt(b);
    setHistoryOpen(true);
    loadPayments(b.id, b?._tz);
  };

  // Open refund dialog
  const openRefund = async (booking, initialBucket = "service") => {
    setChargeOpen(false);
    setMsg("");
    setRefundBooking(booking);
    setRefundAmount("");
    setRefundAuto(Boolean(connectChargesEnabled));
    setRefundReason("");
    setRefundPlatformFee(false);
    setRefundMode("full");
    setIncludeTips(true);
    setServiceAmountInput("");
    setTipAmountInput("");
    setRefundBucket(initialBucket);
    setNoShowRefundAmount("");
    setNoShowRefundKey("");
    setRefundOpen(true);
    setRefundLoading(true);
    try {
      const rows = await loadPayments(booking.id, booking?._tz);
      const feeTxn = rows.find(
        (row) => toLowerSafe(row?.type) === "no_show" && row?.fee_summary,
      );
      const feeRemaining = Number(
        feeTxn?.fee_summary?.remaining_refundable_cents || 0,
      );
      const savedRecovery = readNoShowRefundRecovery(booking, feeTxn);
      const hasServicePayment = rows.some((row) =>
        ["balance", "service", "deposit"].includes(toLowerSafe(row?.type)),
      );
      if (
        savedRecovery ||
        (feeRemaining > 0 && (initialBucket === "no_show_fee" || !hasServicePayment))
      ) {
        setRefundBucket("no_show_fee");
        setNoShowRefundAmount(
          (Number(savedRecovery?.amountCents || feeRemaining) / 100).toFixed(2),
        );
      }
      if (savedRecovery?.idempotencyKey) {
        setNoShowRefundKey(savedRecovery.idempotencyKey);
      }
    } finally {
      setRefundLoading(false);
    }
  };

  const submitRefund = async () => {
    if (!refundBooking || refunding) return;
    const payload = {
      auto: refundAuto,
      currency: displayCurrency,
    };

    const trimmedReason = refundReason.trim();
    if (trimmedReason) {
      payload.reason = trimmedReason;
      payload.note = trimmedReason;
    }

    if (refundPlatformFee) {
      payload.refund_platform_fee = true;
    }

    const toCents = (value) => {
      if (value === null || value === undefined || value === "") return null;
      const numeric = Number(value);
      if (!Number.isFinite(numeric)) return null;
      return Math.round(numeric * 100);
    };

    let noShowRecoveryStorageKey = "";
    let noShowRecoveryFeeTxn = null;
    if (refundBucket === "no_show_fee") {
      if (!refundAuto) {
        setSnackbar({
          open: true,
          message: "No-show card fees must be refunded to their original Stripe payment.",
          severity: "error",
        });
        return;
      }
      const feeTxn = payments.find(
        (row) => toLowerSafe(row?.type) === "no_show" && row?.fee_summary,
      );
      noShowRecoveryFeeTxn = feeTxn;
      const savedRecovery = readNoShowRefundRecovery(refundBooking, feeTxn);
      const enteredCents = toCents(noShowRefundAmount);
      const cents = Number(savedRecovery?.amountCents || enteredCents || 0);
      const remainingCents = Number(
        feeTxn?.fee_summary?.remaining_refundable_cents || 0,
      );
      if (!feeTxn || !cents || cents <= 0) {
        setSnackbar({
          open: true,
          message: "Enter a valid no-show fee refund amount.",
          severity: "error",
        });
        return;
      }
      if (
        savedRecovery?.amountCents &&
        enteredCents &&
        Number(savedRecovery.amountCents) !== enteredCents
      ) {
        setSnackbar({
          open: true,
          message:
            "A no-show refund outcome is unresolved. Retry its exact amount before starting a different refund.",
          severity: "warning",
        });
        return;
      }
      if (!savedRecovery && cents > remainingCents) {
        setSnackbar({
          open: true,
          message: "Amount exceeds the remaining refundable no-show fee.",
          severity: "error",
        });
        return;
      }
      const recoveryScope = noShowRefundRecoveryScope(refundBooking, feeTxn);
      noShowRecoveryStorageKey = noShowRefundRecoveryKeys(refundBooking, feeTxn)[0];
      let operationKey =
        savedRecovery?.idempotencyKey || noShowRefundKey || "";
      if (!operationKey) {
        operationKey =
          typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : `noshow-refund-${Date.now()}-${Math.random().toString(16).slice(2)}`;
        setNoShowRefundKey(operationKey);
      }
      if (typeof window !== "undefined") {
        window.localStorage.setItem(
          noShowRecoveryStorageKey,
          JSON.stringify({
            idempotencyKey: operationKey,
            amountCents: cents,
            scope: recoveryScope,
          }),
        );
      }
      payload.refund_bucket = "no_show_fee";
      payload.no_show_refund_cents = cents;
      payload.idempotency_key = operationKey;
    } else if (refundAuto) {
      const serviceRemainingCents = Math.round(serviceRemaining * 100);
      const tipRemainingCents = Math.round(tipRemaining * 100);

      if (refundMode === "full") {
        const totalCents = Math.round(fullStripeRefundAmount * 100);
        if (totalCents <= 0) {
          setSnackbar({
            open: true,
            message: "Nothing left to refund.",
            severity: "error",
          });
          return;
        }
        payload.amount_cents = totalCents;
        payload.include_tips = includeTips && tipRemainingCents > 0;
      } else {
        const serviceCents = toCents(serviceAmountInput);
        const tipCents = includeTips ? toCents(tipAmountInput) : null;

        const hasService = !!(serviceCents && serviceCents > 0);
        const hasTip = includeTips && !!(tipCents && tipCents > 0);

        if (!hasService && !hasTip) {
          setSnackbar({
            open: true,
            message: "Enter a service or tip amount to refund.",
            severity: "error",
          });
          return;
        }

        if (hasService) {
          if (serviceCents > serviceRemainingCents) {
            setSnackbar({
              open: true,
              message: "Service amount exceeds remaining captured balance.",
              severity: "error",
            });
            return;
          }
          payload.service_refund_cents = serviceCents;
        }

        if (includeTips && tipRemainingCents > 0) {
          if (!hasTip) {
            setSnackbar({
              open: true,
              message: "Enter a tip amount or disable 'Include captured tips'.",
              severity: "error",
            });
            return;
          }
          if (tipCents > tipRemainingCents) {
            setSnackbar({
              open: true,
              message: "Tip amount exceeds remaining captured tips.",
              severity: "error",
            });
            return;
          }
          payload.tip_refund_cents = tipCents;
          payload.include_tips = true;
        } else {
          payload.include_tips = false;
        }

        if (hasService && hasTip) {
          payload.amount_cents = serviceCents + tipCents;
        } else if (hasService) {
          payload.amount_cents = serviceCents;
        } else if (hasTip) {
          payload.amount_cents = tipCents;
        }
      }
    } else {
      const cents = toCents(refundAmount);
      if (!cents || cents <= 0) {
        setSnackbar({
          open: true,
          message: "Enter a valid amount for manual refunds.",
          severity: "error",
        });
        return;
      }
      payload.amount_cents = cents;
    }

    setRefunding(true);
    try {
      const res = await api.post(
        `/api/payments/refund/${refundBooking.id}`,
        payload,
      );
      if (refundBucket === "no_show_fee" && res?.data?.success !== true) {
        setSnackbar({
          open: true,
          message:
            res?.data?.error ||
            "The no-show fee refund is still pending. Retry the same operation to check its outcome.",
          severity: "warning",
        });
        return;
      }
      const refundTxn = res?.data?.refund_transaction;
      const successMessage = res?.data?.message || "Refund processed.";
      setSnackbar({ open: true, message: successMessage, severity: "success" });

      if (refundTxn) {
        const tz = refundBooking?._tz || resolveTZ();
        const ts =
          refundTxn.timestamp ||
          refundTxn.created_at ||
          refundTxn.updated_at ||
          null;
        const decorated = {
          ...refundTxn,
          _tz: tz,
          _tsLabel: ts ? fmtISO(ts, undefined, tz) : "",
        };
        setPayments((prev) => [decorated, ...prev]);
      }
      if (noShowRecoveryStorageKey && typeof window !== "undefined") {
        clearNoShowRefundRecovery(refundBooking, noShowRecoveryFeeTxn);
        setNoShowRefundKey("");
      }
      try {
        await loadPayments(refundBooking.id, refundBooking?._tz, {
          throwOnError: true,
        });
        await loadBookings({ throwOnError: true });
      } catch (_refreshError) {
        setSnackbar({
          open: true,
          message: "Refund saved, but the dashboard could not refresh. Refresh to see the latest history.",
          severity: "warning",
        });
      }
      setRefundAmount("");
      setRefundReason("");
      setRefundPlatformFee(false);
      setRefundMode("full");
      setIncludeTips(true);
      setServiceAmountInput("");
      setTipAmountInput("");
    } catch (e) {
      if (isStripeOnboardingIncomplete(e)) {
        setSnackbar({
          open: true,
          message:
            "Stripe onboarding incomplete. Finish setup to issue refunds.",
          severity: "warning",
        });
        connectRefreshStatus?.();
      } else {
        const status = e?.response?.status;
        const emsg =
          e?.response?.data?.error ||
          e?.response?.data?.message ||
          "Refund failed.";
        if (status === 409 || status === 404) {
          setSnackbar({
            open: true,
            message: emsg || "Already fully refunded.",
            severity: "info",
          });
        } else {
          setSnackbar({ open: true, message: emsg, severity: "error" });
        }
      }
    } finally {
      setRefunding(false);
    }
  };

  // Open charge dialog (prefill pending balance, else pending tip, else no-show fee)
  const openCharge = async (booking, opts = {}) => {
    const requestedIntent = opts?.intent || "";
    setChargeBooking(booking);
    setChargeOpen(true);
    setPaymentMethods([]);
    setSelectedPM("");
    setAmount("");
    setChargeExtra("");
    setChargeTip("");
    setChargeIntent("");
    setNoShowFeeContext(null);
    setNoShowFeeContextError("");
    setChargeOnboardingUrl("");
    setChargeReviewOpen(false);
    setNote("");
    setChargeTxns([]);
    setChargeSummary({
      capturedBalance: 0,
      capturedTip: 0,
      pendingBalance: 0,
      pendingTip: 0,
    });

    const hasPresetAmount = Boolean(opts?.amount);
    if (requestedIntent) setChargeIntent(requestedIntent);
    if (opts?.amount) setAmount(opts.amount);
    if (opts?.note) setNote(opts.note);
    if (opts?.extra) setChargeExtra(opts.extra);
    if (opts?.tip) setChargeTip(opts.tip);
    setChargeOnboardingUrl("");

    if (!booking?.client?.id) {
      setMsg("Missing client for this appointment.");
      return;
    }

    setPmLoading(true);
    try {
      let feeContext = null;
      if (requestedIntent === "no_show_fee") {
        try {
          const contextResponse = await api.get(
            `/api/manager/bookings/${booking.id}/no-show-fee-context`,
          );
          feeContext = contextResponse.data || null;
          setNoShowFeeContext(feeContext);
          const resolvedCurrency = normalizeCurrency(
            feeContext?.currency_contract?.currency,
          );
          if (resolvedCurrency) {
            setDisplayCurrency(resolvedCurrency);
            setActiveCurrency(resolvedCurrency);
          }
          const existingAmount = Number(feeContext?.fee?.amount_cents || 0) / 100;
          const suggestedAmount =
            feeContext?.suggestion?.status === "configured_positive"
              ? Number(feeContext?.suggestion?.amount_cents || 0) / 100
              : 0;
          if (!hasPresetAmount && existingAmount > 0) {
            setAmount(existingAmount.toFixed(2));
          } else if (!hasPresetAmount && suggestedAmount > 0) {
            setAmount(suggestedAmount.toFixed(2));
          }
          if (!opts?.note) setNote("No-show fee");
        } catch (contextError) {
          setNoShowFeeContextError(
            contextError?.response?.data?.error ||
              "No-show fee authorization and currency could not be verified.",
          );
        }
      }

      // 1) saved cards
      const { data } = await api.get(
        `/api/manager/clients/${booking.client.id}/payment-methods`,
      );
      const list = Array.isArray(data) ? data : data?.payment_methods || [];
      setPaymentMethods(list);
      if (list.length > 0) setSelectedPM(list[0].id);

      // 2) transactions
      const txRes = await api.get(`/api/payments/list/${booking.id}`);
      const rawTx = Array.isArray(txRes.data)
        ? txRes.data
        : txRes.data?.transactions || [];
      const tz = booking?._tz || resolveTZ();
      const txns = rawTx.map((p) => {
        const ts = p.timestamp || p.created_at || p.updated_at || null;
        return { ...p, _tz: tz, _tsLabel: ts ? fmtISO(ts, undefined, tz) : "" };
      });
      setChargeTxns(txns);
      const s = summarizeTxns(txns);
      setChargeSummary(s);

      // Prefill priority: pending balance                                                                                          pending tip                                                                                          no-show fee
      if (!hasPresetAmount && s.pendingBalance > 0) {
        setAmount(s.pendingBalance.toFixed(2));
      } else if (!hasPresetAmount && s.pendingTip > 0) {
        setAmount(s.pendingTip.toFixed(2));
      }
    } catch (e) {
      setMsg(
        e?.response?.data?.error ||
          "Failed to load saved cards or transactions.",
      );
    } finally {
      setPmLoading(false);
    }
  };

  const doCharge = async () => {
    if (!chargeBooking) return;
    if (!selectedPM) return setMsg("Please select a saved card.");
    const amt = Number(amount);
    if (!amt || amt <= 0) return setMsg("Enter a valid amount.");
    const extraVal = Number(chargeExtra || 0);
    const tipVal = Number(chargeTip || 0);
    const amountCents = Math.round(amt * 100);
    const extraCents = Math.round(extraVal * 100);
    const tipCents = Math.round(tipVal * 100);

    if (isNoShowFeeCharge && noShowFeeBlocked) {
      return setMsg(
        noShowFeeContextError ||
          noShowFeeContext?.fee?.message ||
          "This no-show fee cannot be charged safely.",
      );
    }
    if (isNoShowFeeCharge && (extraCents !== 0 || tipCents !== 0)) {
      return setMsg("No-show fees cannot include extra charges or tips.");
    }

    if (hasConnect && !connectChargesEnabled) {
      setSnackbar({
        open: true,
        message:
          "Stripe Connect onboarding incomplete. Finish setup to charge saved cards.",
        severity: "warning",
      });
      return;
    }

    setCharging(true);
    try {
      const { data: chargeData } = await api.post(`/api/manager/charge`, {
        appointment_id: chargeBooking.id,
        client_id: chargeBooking.client?.id,
        payment_method_id: selectedPM,
        amount: amt,
        amount_override: chargeIntent === "collect" ? amt : undefined,
        amount_override_cents: chargeIntent === "collect" ? amountCents : undefined,
        amount_cents: amountCents,
        extra_amount: extraVal,
        tip_amount: tipVal,
        extra_amount_cents: extraCents,
        tip_amount_cents: tipCents,
        currency: (normalizeCurrency(displayCurrency) || "USD").toLowerCase(),
        payment_purpose: isNoShowFeeCharge ? "no_show_fee" : undefined,
        reason: note || "manager_charge",
        description: note || "manager_charge",
      });
      setSnackbar({
        open: true,
        message: [chargeData?.message || "Charge captured.", chargeData?.warning].filter(Boolean).join(" "),
        severity: "success",
      });
      setChargeOpen(false);
      setChargeBooking(null);
      try {
        await loadBookings({ throwOnError: true });
        if (viewAppt && viewAppt.id === chargeBooking.id)
          await loadPayments(chargeBooking.id, chargeBooking?._tz, {
            throwOnError: true,
          });
      } catch (_refreshError) {
        setSnackbar({
          open: true,
          message: "Charge captured, but the dashboard could not refresh. Refresh to see the latest fee history.",
          severity: "warning",
        });
      }
    } catch (e) {
      if (e?.response?.status === 412 && e?.response?.data?.onboarding_url) {
        setChargeOnboardingUrl(e.response.data.onboarding_url);
        setSnackbar({
          open: true,
          message:
            "Stripe onboarding incomplete. Finish setup to charge saved cards.",
          severity: "warning",
        });
      } else if (isStripeOnboardingIncomplete(e)) {
        setSnackbar({
          open: true,
          message:
            "Stripe onboarding incomplete. Finish setup to charge saved cards.",
          severity: "warning",
        });
        connectRefreshStatus?.();
      } else {
        const errorMessage =
          e?.response?.data?.message || e?.response?.data?.error || e?.displayMessage || "Charge failed.";
        setSnackbar({ open: true, message: errorMessage, severity: "error" });
      }
    } finally {
      setCharging(false);
    }
  };

  // Deep-link to open charge
  useEffect(() => {
    if (loading) return;
    const qs = new URLSearchParams(location.search);
    const apptId = qs.get("appointmentId");
    const presetAmt = qs.get("amount");
    const presetNote = qs.get("note");
    const presetIntent = qs.get("intent") || "";
    const presetExtra = qs.get("extra");
    const presetTip = qs.get("tip");
    const presetCurrency = qs.get("currency");
    if (!apptId) return;
    const deepLinkKey = qs.toString();
    if (consumedDeepLinkRef.current === deepLinkKey) return;
    const booking = bookings.find((x) => String(x.id) === String(apptId));
    if (booking) {
      consumedDeepLinkRef.current = deepLinkKey;
      if (presetCurrency) {
        const normalized = normalizeCurrency(presetCurrency);
        if (normalized && normalized !== displayCurrency) {
          setDisplayCurrency(normalized);
          setActiveCurrency(normalized);
        }
      }
      if (presetIntent === "refund") {
        openRefund(booking);
      } else {
        openCharge(booking, {
          amount: presetAmt || "",
          note: presetNote || "",
          intent: presetIntent || "",
          extra: presetExtra || "",
          tip: presetTip || "",
        });
      }
      if (typeof window !== "undefined" && window.history?.replaceState) {
        const cleaned = `${window.location.pathname}${window.location.hash || ""}`;
        window.history.replaceState({}, document.title, cleaned);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, bookings, location.search]);

  // Filters + paging
  const bookingsFiltered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    const filtered = bookings.filter((b) => {
      if (sourceFilter !== "all" && (b.row_type || "booking") !== sourceFilter) {
        return false;
      }
      if (statusFilter !== "all") {
        if (statusFilter === "no_show") {
          const s = String(b.status || "")
            .toLowerCase()
            .replace("-", "_");
          if (s !== "no_show") return false;
        } else if ((b.payment_status || "unpaid") !== statusFilter) {
          return false;
        }
      }
      if (!ql) return true;
      const hay = [
        b?.client?.full_name,
        b?.client?.email,
        b?.client_name,
        b?.client_email,
        b?.service?.name,
        b?.id,
        b?.invoice_number,
        b?.title,
        b?.description,
        b?.related_estimate_number,
        b?._sourceTypeLabel,
      ].map((x) => String(x || "").toLowerCase());
      return hay.some((h) => h.includes(ql));
    });
    return filtered.sort((a, b) => {
      const aMs = a._latestPaymentMs ?? a._startMs ?? 0;
      const bMs = b._latestPaymentMs ?? b._startMs ?? 0;
      return bMs - aMs;
    });
  }, [bookings, q, sourceFilter, statusFilter]);

  const bookingsPage = useMemo(() => {
    const start = page * rowsPerPage;
    return bookingsFiltered.slice(start, start + rowsPerPage);
  }, [bookingsFiltered, page, rowsPerPage]);

  const statusCounts = useMemo(
    () => ({
      all: bookings.length,
      paid: bookings.filter((b) => b.payment_status === "paid").length,
      partial_payment: bookings.filter((b) => b.payment_status === "partial_payment").length,
      pending: bookings.filter((b) => b.payment_status === "pending").length,
      card_on_file: bookings.filter((b) => b.payment_status === "card_on_file")
        .length,
      unpaid: bookings.filter((b) => b.payment_status === "unpaid").length,
      refunded: bookings.filter((b) =>
        ["partially_refunded", "refunded"].includes(b.payment_status),
      ).length,
      partially_refunded: bookings.filter(
        (b) => b.payment_status === "partially_refunded",
      ).length,
      no_show: bookings.filter((b) => b.payment_status === "no_show").length,
    }),
    [bookings],
  );

  const statusChips = useMemo(
    () => [
      { value: "all", label: "All", color: "default" },
      { value: "paid", label: "Paid", color: "success" },
      { value: "partial_payment", label: "Partially paid", color: "warning" },
      { value: "pending", label: "Pending", color: "warning" },
      { value: "card_on_file", label: "Card on file", color: "primary" },
      { value: "unpaid", label: "Unpaid", color: "default" },
      { value: "refunded", label: "Refunded", color: "info" },
      { value: "no_show", label: "No-show", color: "error" },
    ],
    [],
  );

  if (mobileComplianceMode) {
    return (
      <Box sx={{ p: 2 }}>
        <MobileWebOnlyNotice
          title="Payments manager is web-only in mobile app mode"
          webPath="/manager/payments"
        />
      </Box>
    );
  }

  return (
    <>
      {/* Spacer equal to fixed AppBar height */}
      <Toolbar />

      <Box p={3} maxWidth={1200} mx="auto">
        {showConnectBanner ? (
          connectLoading ? (
            <Alert severity="info" sx={{ mb: 2 }}>
              Checking Stripe Connect status...
            </Alert>
          ) : connectWarning ? (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Stripe onboarding incomplete - saved card charges and refunds are
              disabled until setup is complete.
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1}
                sx={{ mt: 1 }}
              >
                {connectStart ? (
                  <Button
                    variant="contained"
                    size="small"
                    onClick={connectStart}
                    disabled={connectAction === "start"}
                  >
                    {connectAction === "start" ? "Opening..." : "Finish setup"}
                  </Button>
                ) : null}
                {connectResume ? (
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={connectResume}
                    disabled={connectAction === "refresh"}
                  >
                    {connectAction === "refresh"
                      ? "Refreshing..."
                      : "Resume onboarding"}
                  </Button>
                ) : null}
                {connectDashboard ? (
                  <Button
                    variant="text"
                    size="small"
                    onClick={connectDashboard}
                    disabled={connectAction === "dashboard"}
                  >
                    {connectAction === "dashboard"
                      ? "Opening..."
                      : "Stripe dashboard"}
                  </Button>
                ) : null}
              </Stack>
            </Alert>
          ) : (
            <Alert severity="success" sx={{ mb: 2 }}>
              Stripe Connect ready - charges enabled
              {connectPayoutsEnabled
                ? " and payouts enabled."
                : "; payouts pending."}
            </Alert>
          )
        ) : null}

        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          alignItems={{ xs: "flex-start", md: "center" }}
          justifyContent="space-between"
          sx={{ mb: 2 }}
        >
          <Box>
            <Typography variant="h4" fontWeight={700}>
              Payments & Refunds
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Track booking payments, Business Finance invoices, card-on-file
              charges, and refund activity in one place.
            </Typography>
          </Box>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.5}
            alignItems={{ xs: "stretch", sm: "center" }}
          >
            <TextField
              size="small"
              placeholder="Search name, email, service, invoice, estimate, or #ID"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(0);
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
              sx={{ minWidth: { xs: "100%", sm: 280 } }}
            />
            <Select
              size="small"
              value={sourceFilter}
              onChange={(e) => {
                setSourceFilter(e.target.value);
                setPage(0);
              }}
              displayEmpty
              sx={{ minWidth: { xs: "100%", sm: 180 } }}
            >
              <MenuItem value="all">All sources</MenuItem>
              <MenuItem value="booking">Bookings</MenuItem>
              <MenuItem value="finance_invoice">Business Finance</MenuItem>
            </Select>
            <Select
              size="small"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(0);
              }}
              displayEmpty
              sx={{ minWidth: { xs: "100%", sm: 200 } }}
            >
              <MenuItem value="all">All statuses</MenuItem>
              <MenuItem value="paid">Paid</MenuItem>
              <MenuItem value="partial_payment">Partially paid</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="card_on_file">Card on file</MenuItem>
              <MenuItem value="unpaid">Unpaid</MenuItem>
              <MenuItem value="partially_refunded">Partially refunded</MenuItem>
              <MenuItem value="refunded">Refunded</MenuItem>
              <MenuItem value="no_show">No-show</MenuItem>
            </Select>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={loadBookings}
              sx={{ whiteSpace: "nowrap" }}
            >
              Refresh
            </Button>
          </Stack>
        </Stack>

        <Paper
          variant="outlined"
          sx={{
            p: 1.5,
            borderRadius: 1,
            mb: 2,
            backgroundColor: (t) => t.palette.background.paper,
          }}
        >
          <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
            {statusChips.map((chip) => {
              const count = statusCounts[chip.value] ?? 0;
              const active = statusFilter === chip.value;
              return (
                <Chip
                  key={chip.value}
                  label={`${chip.label}: ${count}`}
                  color={chip.color}
                  variant={active ? "filled" : "outlined"}
                  onClick={() => {
                    setStatusFilter(chip.value);
                    setPage(0);
                  }}
                  sx={(t) => ({
                    borderRadius: 1,
                    fontWeight: 600,
                    borderColor: active
                      ? alpha(
                          (chip.color === "default"
                            ? t.palette.primary.main
                            : t.palette[chip.color].main),
                          0.4,
                        )
                      : undefined,
                    boxShadow: active
                      ? `0 6px 16px ${alpha(
                          chip.color === "default"
                            ? t.palette.primary.main
                            : t.palette[chip.color].main,
                          0.2,
                        )}`
                      : "none",
                  })}
                />
              );
            })}
          </Stack>
        </Paper>

        {msg && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {msg}
          </Alert>
        )}

        {loading ? (
          <Stack spacing={1.5}>
            {Array.from({ length: 5 }).map((_, idx) => (
              <Paper
                key={`skeleton-${idx}`}
                variant="outlined"
                sx={{ p: 2, borderRadius: 1 }}
              >
                <Stack spacing={1}>
                  <Skeleton variant="text" width="40%" />
                  <Skeleton variant="text" width="70%" />
                  <Skeleton variant="text" width="60%" />
                  <Skeleton variant="rectangular" height={32} />
                </Stack>
              </Paper>
            ))}
          </Stack>
        ) : bookingsPage.length === 0 ? (
          <Paper
            variant="outlined"
            sx={{
              p: 3,
              borderRadius: 1,
              textAlign: "center",
              color: "text.secondary",
            }}
          >
            <InfoOutlinedIcon sx={{ mb: 1 }} color="disabled" />
            <Typography variant="subtitle1" fontWeight={600}>
              No payments found
            </Typography>
            <Typography variant="body2">
              Try adjusting your search or status filters.
            </Typography>
          </Paper>
        ) : (
          <Stack spacing={1.5}>
            {bookingsPage.map((b) => {
              const isFinanceInvoice = b.row_type === "finance_invoice";
              const totalCaptured =
                (b._capturedBalanceTotal || 0) + (b._capturedTipTotal || 0);
              const segments = [];
              if (!isFinanceInvoice && totalCaptured > 0) {
                const capturedLabel = `Captured ${money(
                  totalCaptured,
                  b.currency || displayCurrency,
                )}${
                  b._capturedTipTotal > 0
                    ? ` (Tip ${money(
                        b._capturedTipTotal,
                        b.currency || displayCurrency,
                      )})`
                    : ""
                }`;
                segments.push(capturedLabel);
              } else if (!isFinanceInvoice) {
                segments.push("No captures");
              }
              if (b._refundedTotal > 0) {
                segments.push(
                  `Refunded ${money(
                    b._refundedTotal,
                    b.currency || displayCurrency,
                  )}`,
                );
              }
              if (isFinanceInvoice) {
                if (b.payment_origin === "online") {
                  segments.push("Paid online");
                } else if (b.payment_origin === "offline") {
                  segments.push(
                    `Paid offline ${money(
                      b.offline_paid_amount,
                      b.currency || displayCurrency,
                    )}`,
                  );
                } else if (b.payment_origin === "mixed") {
                  segments.push(
                    `Mixed payment ${money(
                      b.total_recorded_paid_amount,
                      b.currency || displayCurrency,
                    )}`,
                  );
                } else if (b.payment_origin === "partially_paid_offline") {
                  segments.push(
                    `Offline paid ${money(
                      b.offline_paid_amount,
                      b.currency || displayCurrency,
                    )}`,
                  );
                }
                if (Number(b.remaining_balance || 0) > 0) {
                  segments.push(
                    `Remaining ${money(
                      b.remaining_balance,
                      b.currency || displayCurrency,
                    )}`,
                  );
                }
                if (b.payment_method_summary) {
                  segments.push(b.payment_method_summary);
                }
              }
              if (isFinanceInvoice && Number(b._remainingRefundable || 0) > 0) {
                segments.push(
                  `Remaining refundable ${money(
                    b._remainingRefundable,
                    b.currency || displayCurrency,
                  )}`,
                );
              }
              let whenLabel = b._whenLabel || "";
              if (!whenLabel && b._startIso) {
                whenLabel = DateTime.fromISO(b._startIso)
                  .setZone(b._tz || b._srcTZ || b.timezone || resolveTZ())
                  .toFormat("yyyy-LL-dd hh:mm a (z)");
              }
              if (!whenLabel && b?.date && b?.start_time) {
                whenLabel = fmtApptLocal(
                  b.date,
                  b.start_time,
                  b._srcTZ || b.timezone || b.recruiterTimezone,
                  "yyyy-LL-dd hh:mm a (z)",
                );
              }
              if (whenLabel) {
                segments.push(`When ${whenLabel}`);
              }
              const summary = segments.filter(Boolean).join(" | ");

              return (
                <Paper
                  key={b.id}
                  variant="outlined"
                  sx={(t) => ({
                    p: 2,
                    borderRadius: 1,
                    transition: "transform 120ms ease, box-shadow 120ms ease",
                    "&:hover": {
                      transform: "translateY(-1px)",
                      boxShadow: `0 10px 24px ${alpha(
                        t.palette.common.black,
                        0.08,
                      )}`,
                    },
                  })}
                >
                  <Stack
                    direction={{ xs: "column", md: "row" }}
                    spacing={2}
                    alignItems={{ md: "center" }}
                    justifyContent="space-between"
                  >
                    <Stack spacing={0.5}>
                      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                        <Typography variant="subtitle1" fontWeight={700}>
                          {isFinanceInvoice
                            ? b.title || `Finance Invoice ${b.invoice_number || `#${b.id}`}`
                            : `Booking #${b.id}`}
                        </Typography>
                        <Chip
                          size="small"
                          label={formatPaymentStatusLabel(b.payment_status)}
                          color={paymentStatusChipColor(b.payment_status)}
                          variant={
                            b.payment_status === "paid" ? "filled" : "outlined"
                          }
                          sx={(theme) =>
                            b.payment_status === "paid"
                              ? {
                                  backgroundColor: theme.palette.success.dark,
                                  color: theme.palette.success.contrastText,
                                  fontWeight: 700,
                                  borderColor: theme.palette.success.dark,
                                  "& .MuiChip-label": {
                                    color: theme.palette.success.contrastText,
                                  },
                                }
                              : undefined
                          }
                        />
                        {isFinanceInvoice ? (
                          <Chip
                            size="small"
                            variant="outlined"
                            label={b._sourceTypeLabel || "Business Finance"}
                          />
                        ) : null}
                      </Stack>
                      <Typography variant="body2" color="text.secondary">
                        {b?.client?.full_name || b?.client_name || "Client"}{" "}
                        {b?.client?.email ? `• ${b.client.email}` : ""}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {isFinanceInvoice
                          ? `Source: ${b._sourceTypeLabel || "Business Finance"}`
                          : `Service: ${b?.service?.name || b?.service_name || "—"}`}{" "}
                        {b._whenLabel ? `• ${b._whenLabel}` : ""}
                      </Typography>
                      {isFinanceInvoice && (b.invoice_number || b.related_estimate_number) ? (
                        <Typography variant="body2" color="text.secondary">
                          {b.invoice_number ? `Invoice ${b.invoice_number}` : ""}{" "}
                          {b.related_estimate_number ? `• Estimate ${b.related_estimate_number}` : ""}
                        </Typography>
                      ) : null}
                      {summary ? (
                        <Typography variant="body2" color="text.secondary">
                          {isFinanceInvoice ? `Payment state: ${summary}` : `Payments: ${summary}`}
                        </Typography>
                      ) : null}
                      {typeof b.amount !== "undefined" && (
                        <Typography variant="body2" color="text.secondary">
                          Amount:{" "}
                          {money(b.amount, b.currency || displayCurrency)}
                        </Typography>
                      )}
                    </Stack>
                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      spacing={1}
                      alignItems="center"
                      justifyContent="flex-end"
                      sx={{ width: { xs: "100%", md: "auto" } }}
                    >
                      {!isFinanceInvoice &&
                        ["paid", "partially_refunded"].includes(
                          b.payment_status,
                        ) && (
                        <Button
                          size="small"
                          color="error"
                          variant="outlined"
                          onClick={() => openRefund(b)}
                        >
                          Refund
                        </Button>
                        )}
                      {isFinanceInvoice ? (
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => openFinanceInvoice(b.invoice_id || b.id)}
                        >
                          View Invoice
                        </Button>
                      ) : (
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => onViewPayments(b)}
                        >
                          View
                        </Button>
                      )}
                      {!isFinanceInvoice && b.payment_status === "card_on_file" && (
                        <Button
                          size="small"
                          color="primary"
                          variant="contained"
                          onClick={() => openCharge(b)}
                        >
                          Charge saved card
                        </Button>
                      )}
                    </Stack>
                  </Stack>
                </Paper>
              );
            })}
          </Stack>
        )}

        <Paper
          variant="outlined"
          sx={{
            mt: 2,
            borderRadius: 1,
            position: "sticky",
            bottom: 16,
            zIndex: 1,
            bgcolor: "background.paper",
          }}
        >
          <TablePagination
            component="div"
            count={bookingsFiltered.length}
            page={page}
            onPageChange={(_, p) => setPage(p)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[10, 25, 50, 100]}
          />
        </Paper>

        {/* Payment History Modal (popup) */}
        <Dialog
          open={historyOpen}
          onClose={() => {
            setHistoryOpen(false);
            setViewAppt(null);
          }}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle sx={{ pb: 1 }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <ReceiptLongIcon color="primary" />
              <Box>
                <Typography variant="h6" fontWeight={700}>
                  Payment History
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {viewAppt ? `Booking #${viewAppt.id}` : "Booking details"}
                </Typography>
                {viewAppt && (
                  <Typography variant="caption" color="text.secondary">
                    {viewAppt._whenLabel ||
                      fmtApptLocal(
                        viewAppt?.date,
                        viewAppt?.start_time,
                        viewAppt?._srcTZ ||
                          viewAppt?.timezone ||
                          viewAppt?.recruiterTimezone,
                      )}
                  </Typography>
                )}
              </Box>
            </Stack>
          </DialogTitle>
          <DialogContent dividers>
            {loadingPayments ? (
              <Stack alignItems="center" py={2}>
                <CircularProgress size={28} />
              </Stack>
            ) : payments.length === 0 ? (
              <Alert severity="info">No transactions yet.</Alert>
            ) : (
              <Stack spacing={1.5}>
                {payments.map((p) => (
                  <Paper
                    key={p.id || `${p.type}-${p.provider_ref || p.timestamp}`}
                    variant="outlined"
                    sx={{ p: 1.5, borderRadius: 1 }}
                  >
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography fontWeight={600}>
                        {String(p.type || "").toUpperCase()}
                      </Typography>
                      <Chip
                        size="small"
                        label={p.status || "Unknown"}
                        color={
                          p.status === "captured"
                            ? "success"
                            : p.status === "refunded"
                              ? "default"
                              : "warning"
                        }
                        variant="outlined"
                      />
                    </Stack>
                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                      Amount: {money(p.amount, p.currency)} | Provider:{" "}
                      {p.provider || "N/A"}
                    </Typography>
                    {p.qb_export_status && (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: "block" }}
                      >
                        {(() => {
                          const docLabel = p.qb_doc_type
                            ? `${p.qb_doc_type.charAt(0).toUpperCase()}${p.qb_doc_type.slice(1)}`
                            : "Document";
                          if (p.qb_export_status === "success") {
                            return `QuickBooks: Synced ${docLabel}${
                              p.qb_doc_id ? ` #${p.qb_doc_id}` : ""
                            }`;
                          }
                          let statusLabel = `QuickBooks: ${p.qb_export_status}`;
                          if (p.qb_doc_id) {
                            statusLabel += ` (${docLabel} #${p.qb_doc_id})`;
                          }
                          if (p.qb_export_error) {
                            statusLabel += ` – ${p.qb_export_error}`;
                          }
                          return statusLabel;
                        })()}
                      </Typography>
                    )}
                    {(p.created_at || p.timestamp) && (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: "block" }}
                      >
                        On{" "}
                        {p._tsLabel ||
                          fmtISO(
                            p.timestamp || p.created_at,
                            undefined,
                            p._tz || resolveTZ(),
                          )}
                      </Typography>
                    )}
                    {p.provider_ref && (
                      <Typography variant="caption" color="text.secondary">
                        Ref: {p.provider_ref}
                      </Typography>
                    )}
                    {toLowerSafe(p.type) === "no_show" &&
                      (Number(p?.fee_summary?.remaining_refundable_cents || 0) > 0 ||
                        Boolean(readNoShowRefundRecovery(viewAppt, p))) &&
                      viewAppt && (
                        <Button
                          size="small"
                          sx={{ mt: 1, display: "block" }}
                          onClick={() => {
                            setHistoryOpen(false);
                            openRefund(viewAppt, "no_show_fee");
                          }}
                        >
                          Refund no-show fee
                        </Button>
                      )}
                  </Paper>
                ))}
              </Stack>
            )}
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => {
                setHistoryOpen(false);
                setViewAppt(null);
              }}
            >
              Close
            </Button>
          </DialogActions>
        </Dialog>

        <FinanceInvoiceDetailDialog
          open={invoiceDetailOpen}
          invoiceId={selectedInvoiceId}
          onClose={() => {
            setInvoiceDetailOpen(false);
            setSelectedInvoiceId(null);
          }}
          onSaved={() => {
            loadBookings();
          }}
          onOpenInvoice={(nextInvoiceId) => {
            setSelectedInvoiceId(nextInvoiceId);
            setInvoiceDetailOpen(true);
          }}
        />

        {/* Charge dialog */}
        <Dialog
          open={chargeOpen}
          onClose={() => setChargeOpen(false)}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle sx={{ pb: 1 }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <CreditCardIcon color="primary" />
              <Box>
                <Typography variant="h6" fontWeight={700}>
                  {isNoShowFeeCharge ? "Confirm no-show fee" : "Charge saved card"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {chargeBooking
                    ? `${
                        chargeBooking.client?.full_name ||
                        [
                          chargeBooking.client?.first_name,
                          chargeBooking.client?.last_name,
                        ]
                          .filter(Boolean)
                          .join(" ") ||
                        "Client"
                      } · Booking #${chargeBooking.id}`
                    : "Select a booking"}
                </Typography>
                {chargeBooking && (
                  <Typography variant="caption" color="text.secondary">
                    {chargeBooking._whenLabel ||
                      fmtApptLocal(
                        chargeBooking?.date,
                        chargeBooking?.start_time,
                        chargeBooking?._srcTZ ||
                          chargeBooking?.timezone ||
                          chargeBooking?.recruiterTimezone,
                      )}
                  </Typography>
                )}
              </Box>
            </Stack>
          </DialogTitle>
          <DialogContent dividers>
            {pmLoading ? (
              <CircularProgress size={24} />
            ) : paymentMethods.length === 0 ? (
              <Alert severity="warning">
                No saved cards on file for this client. This only affects new
                card-on-file charges. Refunding an existing Stripe payment does
                not require a saved card.
              </Alert>
            ) : (
              <>
                {isNoShowFeeCharge && (
                  <Stack spacing={1.25} sx={{ mb: 2 }}>
                    <Alert severity="warning">
                      This is a separate no-show fee. It does not pay the service balance,
                      change package entitlement, or mark the booking paid.
                    </Alert>
                    {noShowFeeContextError ? (
                      <Alert severity="error">{noShowFeeContextError}</Alert>
                    ) : null}
                    {noShowFeeContext?.accepted_policy?.available ? (
                      <Paper variant="outlined" sx={{ p: 1.5 }}>
                        <Typography variant="subtitle2">Accepted booking policy</Typography>
                        <Typography variant="body2" sx={{ mt: 0.5 }}>
                          {noShowFeeContext.accepted_policy.policy_text}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Accepted {noShowFeeContext.accepted_policy.accepted_at || "date unavailable"}
                        </Typography>
                      </Paper>
                    ) : (
                      <Alert severity="error">
                        No verified appointment-linked policy consent is available for this saved-card fee.
                      </Alert>
                    )}
                    {noShowFeeContext?.suggestion?.status === "configured_zero" ? (
                      <Alert severity="info">
                        The cancellation-fee setting is zero. Enter an explicit fee only if the accepted policy supports it.
                      </Alert>
                    ) : null}
                    {["currency_mismatch", "unavailable"].includes(
                      noShowFeeContext?.suggestion?.status,
                    ) && noShowFeeContext?.suggestion?.message ? (
                      <Alert severity="info">{noShowFeeContext.suggestion.message}</Alert>
                    ) : null}
                    {noShowFeeContext?.fee?.exists ? (
                      <Alert severity={noShowFeeBlocked ? "warning" : "info"}>
                        Existing fee state: {noShowFeeState.replaceAll("_", " ")}
                        {noShowFeeContext?.fee?.amount_cents
                          ? ` — ${money(
                              Number(noShowFeeContext.fee.amount_cents) / 100,
                              noShowFeeContext.fee.currency,
                            )}`
                          : ""}
                      </Alert>
                    ) : null}
                  </Stack>
                )}
                {chargeOnboardingUrl ? (
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    Stripe onboarding incomplete.{" "}
                    <Button
                      size="small"
                      onClick={() =>
                        window.open(chargeOnboardingUrl, "_blank", "noopener")
                      }
                    >
                      Finish Stripe setup
                    </Button>
                  </Alert>
                ) : null}
                {/* Prior payments summary for this booking */}
                {chargeTxns.length > 0 && (
                  <Box
                    sx={{
                      border: 1,
                      borderColor: "divider",
                      borderRadius: 1,
                      p: 2,
                      mb: 2,
                      backgroundColor: (t) => t.palette.action.hover,
                    }}
                  >
                    <Typography variant="subtitle2" gutterBottom>
                      Previous payments for this booking
                    </Typography>
                    <Typography variant="body2">
                      Balance captured: {money(chargeSummary.capturedBalance)}
                      Pending balance: {money(chargeSummary.pendingBalance)}
                      Tip captured: {money(chargeSummary.capturedTip)}
                      Pending tip: {money(chargeSummary.pendingTip)}
                      No-show fees captured: {money(chargeSummary.capturedNoShow)}
                    </Typography>
                  </Box>
                )}

                <FormLabel sx={{ mb: 1 }}>Select card</FormLabel>
                <RadioGroup
                  value={selectedPM}
                  onChange={(e) => setSelectedPM(e.target.value)}
                  sx={{ mb: 2 }}
                >
                  {paymentMethods.map((pm) => (
                    <FormControlLabel
                      key={pm.id}
                      value={pm.id}
                      control={<Radio />}
                      label={`${(pm.card?.brand || "card").toUpperCase()}  ${pm.card?.last4 || "????"}  exp ${pm.card?.exp_month || "??"}/${pm.card?.exp_year || "????"}`}
                    />
                  ))}
                </RadioGroup>

                {isNoShowFeeCharge &&
                  noShowFeeContext?.suggestion?.status === "configured_positive" && (
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() =>
                        setAmount(
                          (Number(noShowFeeContext.suggestion.amount_cents) / 100).toFixed(2),
                        )
                      }
                      sx={{ mb: 2 }}
                    >
                      Use cancellation-fee suggestion (
                      {money(
                        Number(noShowFeeContext.suggestion.amount_cents) / 100,
                        noShowFeeContext.suggestion.currency,
                      )}
                      )
                    </Button>
                  )}

                {chargeIntent === "collect" && (
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={2}
                    sx={{
                      border: 1,
                      borderColor: "divider",
                      borderRadius: 1,
                      p: 2,
                      mb: 2,
                    }}
                  >
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Extra
                      </Typography>
                      <Typography fontWeight={600}>
                        {money(Number(chargeExtra || 0))}
                      </Typography>
                    </Box>
                    <Divider
                      orientation="vertical"
                      flexItem
                      sx={{ display: { xs: "none", sm: "block" } }}
                    />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Tip
                      </Typography>
                      <Typography fontWeight={600}>
                        {money(Number(chargeTip || 0))}
                      </Typography>
                    </Box>
                  </Stack>
                )}

                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                  <FormLabel>{isNoShowFeeCharge ? "No-show fee amount" : "Charge amount"}</FormLabel>
                  <Tooltip
                    title={
                      <Box>
                        <Typography variant="subtitle2" gutterBottom>
                          Tax on saved-card charges
                        </Typography>
                        <Typography variant="body2">
                          Tax isn’t calculated automatically for saved-card charges.
                          If you charge tax, include it in the amount (e.g., $50 + 13% = $56.50).
                          For automatic tax, use Payment link / Invoice or Pay during checkout.
                        </Typography>
                      </Box>
                    }
                  >
                    <IconButton size="small">
                      <InfoOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                  <TextField
                    label={`Amount (${displayCurrency})`}
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    inputProps={{ min: 0, step: "0.01" }}
                    fullWidth
                  />
                  <TextField
                    label="Note / Reason (optional)"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    fullWidth
                  />
                </Stack>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                  Saved-card charges are amount-only. If tax applies, include it in the amount.
                </Typography>
                <Button
                  size="small"
                  variant="text"
                  sx={{ mt: 1, alignSelf: "flex-start", textTransform: "none", fontWeight: 600 }}
                  onClick={() => setChargeReviewOpen(true)}
                >
                  Review amount and tax handling
                </Button>
              </>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setChargeOpen(false)} disabled={charging}>
              Close
            </Button>
            <Button
              onClick={doCharge}
              variant="contained"
              disabled={
                charging ||
                pmLoading ||
                paymentMethods.length === 0 ||
                connectWarning
                || noShowFeeBlocked
              }
            >
              {charging ? (
                <CircularProgress size={20} />
              ) : isNoShowFeeCharge ? (
                "Charge no-show fee"
              ) : (
                "Charge"
              )}
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={chargeReviewOpen}
          onClose={() => setChargeReviewOpen(false)}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle>Review amount and tax handling</DialogTitle>
          <DialogContent dividers>
            <Stack spacing={1.5}>
              <Alert severity="info">
                Preview only — opening this review does not create a charge, save a card, or contact Stripe.
              </Alert>
              <Stack direction="row" justifyContent="space-between" spacing={2}>
                <Typography variant="body2">Entered charge amount</Typography>
                <Typography variant="body2" fontWeight={700}>
                  {money(Number(amount || 0), displayCurrency)}
                </Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between" spacing={2}>
                <Typography variant="body2">Currency</Typography>
                <Typography variant="body2">{displayCurrency}</Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between" spacing={2}>
                <Typography variant="body2">Stripe Automatic Tax</Typography>
                <Typography variant="body2">Not applied</Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary">
                Saved-card charges are amount-only. If tax applies, include it in the amount entered before charging the card.
              </Typography>
              {chargeBooking ? (
                <Typography variant="body2" color="text.secondary">
                  Current Service amount reference: {money(Number(chargeBooking.amount || 0), displayCurrency)}
                </Typography>
              ) : null}
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setChargeReviewOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>

        {/* Refund dialog */}
        <Dialog
          open={refundOpen}
          onClose={() => setRefundOpen(false)}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle sx={{ pb: 1 }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <ReplayIcon color="primary" />
              <Box>
                <Typography variant="h6" fontWeight={700}>
                  Issue refund
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {refundBooking
                    ? `Booking #${refundBooking.id}`
                    : "Select a booking"}
                </Typography>
                {refundBooking && (
                  <Typography variant="caption" color="text.secondary">
                    {refundBooking._whenLabel ||
                      fmtApptLocal(
                        refundBooking?.date,
                        refundBooking?.start_time,
                        refundBooking?._srcTZ ||
                          refundBooking?.timezone ||
                          refundBooking?.recruiterTimezone,
                      )}
                  </Typography>
                )}
              </Box>
            </Stack>
          </DialogTitle>
          <DialogContent dividers>
            {refundLoading ? (
              <CircularProgress size={24} />
            ) : (
              <>
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  sx={{ mb: 2 }}
                >
                  <Typography variant="subtitle2">Collected totals</Typography>
                  <Tooltip title="Totals are computed from captured transactions. Refund history is displayed below.">
                    <InfoOutlinedIcon fontSize="small" />
                  </Tooltip>
                </Stack>

                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={2}
                  sx={{
                    border: 1,
                    borderColor: "divider",
                    borderRadius: 1,
                    p: 2,
                    mb: 2,
                  }}
                >
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Service/Balance
                    </Typography>
                    <Typography fontWeight={700}>
                      {money(refundSummary.capturedBalance)}
                    </Typography>
                  </Box>
                  <Divider
                    orientation="vertical"
                    flexItem
                    sx={{ display: { xs: "none", sm: "block" } }}
                  />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Tips
                    </Typography>
                    <Typography fontWeight={700}>
                      {money(refundSummary.capturedTip)}
                    </Typography>
                  </Box>
                  {refundSummary.capturedNoShow > 0 && (
                    <>
                      <Divider
                        orientation="vertical"
                        flexItem
                        sx={{ display: { xs: "none", sm: "block" } }}
                      />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          No-show fee
                        </Typography>
                        <Typography fontWeight={700}>
                          {money(noShowRemaining)} refundable
                        </Typography>
                      </Box>
                    </>
                  )}
                  <Divider
                    orientation="vertical"
                    flexItem
                    sx={{ display: { xs: "none", sm: "block" } }}
                  />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Refunded (any)
                    </Typography>
                    <Typography fontWeight={700}>
                      {money(refundSummary.refundedAny)}
                    </Typography>
                  </Box>
                  <Divider
                    orientation="vertical"
                    flexItem
                    sx={{ display: { xs: "none", sm: "block" } }}
                  />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Remaining (est.)
                    </Typography>
                    <Typography fontWeight={700}>
                      {money(remainingTotal)}
                    </Typography>
                  </Box>
                </Stack>

                {refundSummary.capturedNoShow > 0 && (
                  <Stack sx={{ mb: 2 }}>
                    <FormLabel>Refund obligation</FormLabel>
                    <RadioGroup
                      value={refundBucket}
                      onChange={(event) => {
                        const nextBucket = event.target.value;
                        setRefundBucket(nextBucket);
                        if (nextBucket === "no_show_fee") {
                          setRefundAuto(true);
                          setNoShowRefundAmount(
                            noShowRemaining > 0 ? noShowRemaining.toFixed(2) : "",
                          );
                        }
                      }}
                    >
                      <FormControlLabel
                        value="service"
                        control={<Radio />}
                        label="Service and tips"
                      />
                      <FormControlLabel
                        value="no_show_fee"
                        control={<Radio />}
                        label={`Separate no-show fee (${money(noShowRemaining)} remaining)`}
                        disabled={noShowRemaining <= 0}
                      />
                    </RadioGroup>
                  </Stack>
                )}

                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={1}
                  sx={{ mb: 2 }}
                >
                  <FormLabel>Provider</FormLabel>
                  <RadioGroup
                    row
                    value={refundAuto ? "auto" : "manual"}
                    onChange={(e) => setRefundAuto(e.target.value === "auto")}
                  >
                    <FormControlLabel
                      value="auto"
                      control={<Radio />}
                      label="Stripe (auto)"
                    />
                    <FormControlLabel
                      value="manual"
                      control={<Radio />}
                      label="Manual / offline"
                      disabled={refundBucket === "no_show_fee"}
                    />
                  </RadioGroup>
                </Stack>

                {refundBucket === "no_show_fee" ? (
                  <Stack spacing={1.5} sx={{ mb: 2 }}>
                    <Alert severity="info">
                      This refunds only the separate no-show fee to its original card.
                      Service, tip, package, and booking payment status are unchanged.
                    </Alert>
                    <TextField
                      label={`No-show fee refund (${displayCurrency})`}
                      type="number"
                      value={noShowRefundAmount}
                      onChange={(event) => setNoShowRefundAmount(event.target.value)}
                      inputProps={{ min: 0, max: noShowRemaining, step: "0.01" }}
                      helperText={`Up to ${money(noShowRemaining)} available.`}
                      fullWidth
                    />
                  </Stack>
                ) : refundAuto ? (
                  <>
                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      spacing={1}
                      flexWrap="wrap"
                      sx={{ mb: 2 }}
                    >
                      <Button
                        variant={
                          refundMode === "full" ? "contained" : "outlined"
                        }
                        onClick={() => {
                          setRefundMode("full");
                          setIncludeTips(tipRemaining > 0);
                          setServiceAmountInput("");
                          setTipAmountInput("");
                        }}
                      >
                        Full Stripe balance
                      </Button>
                      <Button
                        variant={
                          refundMode === "custom" && !includeTips
                            ? "contained"
                            : "outlined"
                        }
                        onClick={() => {
                          setRefundMode("custom");
                          setIncludeTips(false);
                          setServiceAmountInput(
                            serviceRemaining > 0
                              ? serviceRemaining.toFixed(2)
                              : "",
                          );
                          setTipAmountInput("");
                        }}
                      >
                        Service only
                      </Button>
                      {tipRemaining > 0 && (
                        <Button
                          variant={
                            refundMode === "custom" && includeTips
                              ? "contained"
                              : "outlined"
                          }
                          onClick={() => {
                            setRefundMode("custom");
                            setIncludeTips(true);
                            setServiceAmountInput("");
                            setTipAmountInput(tipRemaining.toFixed(2));
                          }}
                        >
                          Tips only
                        </Button>
                      )}
                    </Stack>

                    <FormLabel>Stripe refund scope</FormLabel>
                    <RadioGroup
                      value={refundMode}
                      onChange={(e) => {
                        const mode = e.target.value;
                        setRefundMode(mode);
                        if (mode === "full") {
                          setServiceAmountInput("");
                          setTipAmountInput("");
                        }
                      }}
                    >
                      <FormControlLabel
                        value="full"
                        control={<Radio />}
                        label={`Full remaining balance (${money(serviceRemaining + (includeTips && tipRemaining > 0 ? tipRemaining : 0))})`}
                      />
                      <FormControlLabel
                        value="custom"
                        control={<Radio />}
                        label="Custom amounts"
                      />
                    </RadioGroup>

                    <FormControlLabel
                      control={
                        <Switch
                          checked={includeTips && tipRemaining > 0}
                          onChange={(e) => {
                            setIncludeTips(e.target.checked);
                            if (!e.target.checked) {
                              setTipAmountInput("");
                            }
                          }}
                          disabled={tipRemaining <= 0}
                        />
                      }
                      label={
                        tipRemaining > 0
                          ? `Include captured tips (${money(tipRemaining)} available)`
                          : "No captured tips to refund"
                      }
                      sx={{ mb: refundMode === "custom" ? 1 : 2 }}
                    />

                    {refundMode === "custom" && (
                      <Stack spacing={2} sx={{ mb: 2 }}>
                        <TextField
                          label="Service amount"
                          type="number"
                          value={serviceAmountInput}
                          onChange={(e) =>
                            setServiceAmountInput(e.target.value)
                          }
                          placeholder="0.00"
                          inputProps={{ min: 0, step: "0.01" }}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                {displayCurrency}
                              </InputAdornment>
                            ),
                          }}
                          helperText={`Up to ${money(serviceRemaining)} available.`}
                          fullWidth
                        />
                        {includeTips && tipRemaining > 0 && (
                          <TextField
                            label="Tip amount"
                            type="number"
                            value={tipAmountInput}
                            onChange={(e) => setTipAmountInput(e.target.value)}
                            placeholder="0.00"
                            inputProps={{ min: 0, step: "0.01" }}
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  {displayCurrency}
                                </InputAdornment>
                              ),
                            }}
                            helperText="Set the tip portion to refund. Leave blank to keep the tip captured."
                            fullWidth
                          />
                        )}
                      </Stack>
                    )}

                    {refundMode === "full" && (
                      <Alert severity="info" sx={{ mb: 2 }}>
                        {includeTips && tipRemaining > 0
                          ? `We'll refund ${money(serviceRemaining + tipRemaining)} (service ${money(serviceRemaining)} + tips ${money(tipRemaining)}).`
                          : `We'll refund ${money(serviceRemaining)} and leave the ${money(tipRemaining)} tip captured.`}
                      </Alert>
                    )}
                  </>
                ) : (
                  <TextField
                    label={`Manual refund amount (${displayCurrency})`}
                    type="number"
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                    placeholder="0.00"
                    inputProps={{ min: 0, step: "0.01" }}
                    fullWidth
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          {displayCurrency}
                        </InputAdornment>
                      ),
                    }}
                    helperText="Required for manual refunds."
                    sx={{ mb: 2 }}
                  />
                )}

                <FormControlLabel
                  control={
                    <Switch
                      checked={refundPlatformFee}
                      onChange={(e) => setRefundPlatformFee(e.target.checked)}
                    />
                  }
                  label="Refund platform fee"
                  sx={{ mb: 2 }}
                />

                {refundMode === "custom" && includeTips && tipRemaining > 0 && (
                  <Button
                    size="small"
                    variant="outlined"
                    sx={{ mb: 2 }}
                    onClick={() => {
                      const quickTip =
                        Number(refundSummary.lastTip || 0) > 0
                          ? Number(refundSummary.lastTip || 0)
                          : tipRemaining;
                      setTipAmountInput(
                        quickTip > 0 ? quickTip.toFixed(2) : "",
                      );
                    }}
                  >
                    Quick-fill:{" "}
                    {refundSummary.lastTip > 0
                      ? `Last tip (${money(refundSummary.lastTip)})`
                      : `All tips (${money(tipRemaining)})`}
                  </Button>
                )}

                <TextField
                  label="Reason / Note (optional)"
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  fullWidth
                  multiline
                  minRows={2}
                  sx={{ mt: 1 }}
                />
                <Alert severity="info" sx={{ mt: 2 }}>
                  Stripe refunds return the captured amounts to the guest.
                  Processing fees are handled by Stripe and are not reimbursed
                  to your company.
                </Alert>
              </>
            )}
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setRefundOpen(false)}
              disabled={refunding || refundLoading}
            >
              Close
            </Button>
            <Button
              variant="contained"
              onClick={submitRefund}
              disabled={refunding || refundLoading}
            >
              {refunding ? <CircularProgress size={20} /> : "Issue refund"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          message={snackbar.message}
        />
      </Box>
      <Backdrop
        open={refunding}
        sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.modal + 1 }}
      >
        <Stack alignItems="center" spacing={2}>
          <CircularProgress color="inherit" />
          <Typography variant="subtitle1">Processing refund...</Typography>
        </Stack>
      </Backdrop>
    </>
  );
}
