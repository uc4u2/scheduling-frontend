// src/pages/sections/management/ManagerPaymentsView.js
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { DateTime } from "luxon";
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
  List,
  ListItem,
  ListItemText,
  Snackbar,
  Tooltip,
  FormLabel,
  Switch,
  InputAdornment,
  Select,
  MenuItem,
  TablePagination,
  Toolbar, // spacer matching AppBar height
} from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

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

const summarizeTxns = (rows = []) => {
  const captureStatuses = new Set(["captured", "succeeded", "paid"]);
  const pendingStatuses = new Set(["pending", "authorized"]);
  const balanceTypes = new Set([
    "balance",
    "service",
    "product",
    "deposit",
    "no_show",
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

    if (isRefund) {
      totals.refundedAny += amount;
      if (bucket === "tip") {
        totals.refundedTip += amount;
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
    case "card_on_file":
      return "primary";
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
  const [chargeOnboardingUrl, setChargeOnboardingUrl] = useState("");
  const [note, setNote] = useState("");
  const [charging, setCharging] = useState(false);
  const [chargeTxns, setChargeTxns] = useState([]);
  const [chargeSummary, setChargeSummary] = useState({
    capturedBalance: 0,
    capturedTip: 0,
    pendingBalance: 0,
    pendingTip: 0,
  });

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

  useEffect(() => {
    if (refundAuto) {
      setRefundMode("full");
      setIncludeTips(true);
      setServiceAmountInput("");
      setTipAmountInput("");
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
      Number(refundSummary.refundedAny || 0),
  );
  const serviceCaptured = Number(refundSummary.capturedBalance || 0);
  const tipCaptured = Number(refundSummary.capturedTip || 0);
  const refundedAny = Number(refundSummary.refundedAny || 0);
  const refundedAgainstService = Math.min(serviceCaptured, refundedAny);
  const serviceRemaining = Math.max(
    0,
    serviceCaptured - refundedAgainstService,
  );
  const tipRefundedEstimate = Math.max(0, refundedAny - refundedAgainstService);
  const tipRemaining = Math.max(0, tipCaptured - tipRefundedEstimate);
  const fullStripeRefundAmount =
    serviceRemaining + (includeTips && tipRemaining > 0 ? tipRemaining : 0);

  useEffect(() => {
    if (tipRemaining <= 0 && includeTips) {
      setIncludeTips(false);
      setTipAmountInput("");
    }
  }, [tipRemaining, includeTips]);

  // prevent double-submit in refund flow
  const [refunding, setRefunding] = useState(false);

  // No-show fee (for quick-fill)
  const [noShowFee, setNoShowFee] = useState(null);

  // Load bookings
  const loadBookings = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/api/manager/bookings");
      const raw = Array.isArray(data) ? data : data?.bookings || [];
      const normalized = raw.map((b) => {
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
    } finally {
      setLoading(false);
    }
  }, [displayCurrency]);
  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  // Load transactions for an appointment
  const loadPayments = async (appointmentId, tzHint) => {
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
      });
    } catch (e) {
      setPayments([]);
      setMsg(e?.response?.data?.error || "Failed to load payment history.");
      setRefundSummary({
        capturedBalance: 0,
        capturedTip: 0,
        refundedAny: 0,
        lastTip: 0,
      });
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
  const openRefund = async (booking) => {
    setChargeOpen(false);
    setChargeOpen(false);
    setRefundBooking(booking);
    setRefundAmount("");
    setRefundAuto(Boolean(connectChargesEnabled));
    setRefundReason("");
    setRefundPlatformFee(false);
    setRefundMode("full");
    setIncludeTips(true);
    setServiceAmountInput("");
    setTipAmountInput("");
    setRefundOpen(true);
    setRefundLoading(true);
    try {
      await loadPayments(booking.id, booking?._tz);
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

    if (refundAuto) {
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

      await loadPayments(refundBooking.id, refundBooking?._tz);
      await loadBookings();
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
    setChargeBooking(booking);
    setChargeOpen(true);
    setPaymentMethods([]);
    setSelectedPM("");
    setAmount("");
    setChargeExtra("");
    setChargeTip("");
    setChargeIntent("");
    setChargeOnboardingUrl("");
    setNote("");
    setChargeTxns([]);
    setChargeSummary({
      capturedBalance: 0,
      capturedTip: 0,
      pendingBalance: 0,
      pendingTip: 0,
    });

    const hasPresetAmount = Boolean(opts?.amount);
    if (opts?.intent) setChargeIntent(opts.intent);
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
      } else if (
        !hasPresetAmount &&
        String(booking?.status || "")
          .toLowerCase()
          .replace("-", "_") === "no_show" &&
        noShowFee > 0
      ) {
        setAmount(Number(noShowFee).toFixed(2));
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
        reason: note || "manager_charge",
        description: note || "manager_charge",
      });
      setSnackbar({
        open: true,
        message: chargeData?.message || "Charge captured.",
        severity: "success",
      });
      setChargeOpen(false);
      setChargeBooking(null);
      await loadBookings();
      if (viewAppt && viewAppt.id === chargeBooking.id)
        await loadPayments(chargeBooking.id, chargeBooking?._tz);
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
          e?.response?.data?.error || e?.displayMessage || "Charge failed.";
        setSnackbar({ open: true, message: errorMessage, severity: "error" });
      }
    } finally {
      setCharging(false);
    }
  };

  // Load company no-show fee
  useEffect(() => {
    api
      .get(`/admin/company-profile`)
      .then(({ data }) => setNoShowFee(Number(data.cancellation_fee || 0)))
      .catch(() => {});
  }, []);

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
    if (!apptId) return;
    const booking = bookings.find((x) => String(x.id) === String(apptId));
    if (booking) {
      openCharge(booking, {
        amount: presetAmt || "",
        note: presetNote || "",
        intent: presetIntent || "",
        extra: presetExtra || "",
        tip: presetTip || "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, bookings, location.search]);

  // Filters + paging
  const bookingsFiltered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    const filtered = bookings.filter((b) => {
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
        b?.service?.name,
        b?.id,
      ].map((x) => String(x || "").toLowerCase());
      return hay.some((h) => h.includes(ql));
    });
    return filtered.sort((a, b) => {
      const aMs = a._latestPaymentMs ?? a._startMs ?? 0;
      const bMs = b._latestPaymentMs ?? b._startMs ?? 0;
      return bMs - aMs;
    });
  }, [bookings, q, statusFilter]);

  const bookingsPage = useMemo(() => {
    const start = page * rowsPerPage;
    return bookingsFiltered.slice(start, start + rowsPerPage);
  }, [bookingsFiltered, page, rowsPerPage]);

  if (loading) {
    return (
      <Box p={3}>
        <CircularProgress />
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

        {/* Toolbar */}
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={1.5}
          alignItems={{ xs: "stretch", md: "center" }}
          justifyContent="space-between"
          sx={{ mb: 2 }}
        >
          <Typography variant="h5">Payments & Refunds</Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
            <TextField
              size="small"
              label="Search (name, email, service, #id)"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(0);
              }}
            />
            <Select
              size="small"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(0);
              }}
              displayEmpty
            >
              <MenuItem value="all">All statuses</MenuItem>
              <MenuItem value="paid">Paid</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="card_on_file">Card on file</MenuItem>
              <MenuItem value="unpaid">Unpaid</MenuItem>
              <MenuItem value="partially_refunded">Partially refunded</MenuItem>
              <MenuItem value="refunded">Refunded</MenuItem>
              <MenuItem value="no_show">No-show</MenuItem>
            </Select>
          </Stack>
        </Stack>

        {/* Quick counters */}
        <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: "wrap" }}>
          <Chip
            label={`Paid: ${bookings.filter((b) => b.payment_status === "paid").length}`}
            color="success"
            variant="outlined"
          />
          <Chip
            label={`Pending: ${bookings.filter((b) => b.payment_status === "pending").length}`}
            color="warning"
            variant="outlined"
          />
          <Chip
            label={`Card on file: ${bookings.filter((b) => b.payment_status === "card_on_file").length}`}
            color="primary"
            variant="outlined"
          />
          <Chip
            label={`Unpaid: ${bookings.filter((b) => b.payment_status === "unpaid").length}`}
            variant="outlined"
          />
          <Chip
            label={`Refunded: ${bookings.filter((b) => ["partially_refunded", "refunded"].includes(b.payment_status)).length}`}
            color="info"
            variant="outlined"
          />
        </Stack>

        {msg && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {msg}
          </Alert>
        )}

        {/* Bookings (paged) */}
        <List sx={{ border: 1, borderColor: "divider", borderRadius: 1 }}>
          {bookingsPage.map((b) => (
            <React.Fragment key={b.id}>
              <ListItem
                secondaryAction={
                  <Stack direction="row" spacing={1}>
                    {["paid", "partially_refunded"].includes(
                      b.payment_status,
                    ) && (
                      <Button
                        size="small"
                        color="error"
                        variant="outlined"
                        onClick={() => openRefund(b)}
                      >
                        Refund{" "}
                      </Button>
                    )}

                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => onViewPayments(b)}
                    >
                      View
                    </Button>
                    {b.payment_status === "card_on_file" && (
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
                }
              >
                <ListItemText
                  primary={
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography fontWeight={600}>#{b.id}</Typography>
                      <Chip
                        size="small"
                        label={formatPaymentStatusLabel(b.payment_status)}
                        color={paymentStatusChipColor(b.payment_status)}
                        variant={
                          b.payment_status === "paid" ? "filled" : "outlined"
                        }
                      />
                    </Stack>
                  }
                  secondary={
                    <>
                      <Typography variant="body2">
                        Client:{" "}
                        {b?.client?.full_name ||
                          b?.client_name ||
                          "                                                                                  "}{" "}
                        {b?.client?.email
                          ? `                                                                       ${b.client.email}`
                          : ""}
                      </Typography>
                      <Typography variant="body2">
                        Service:{" "}
                        {b?.service?.name ||
                          b?.service_name ||
                          "                                                                                  "}{" "}
                        When: {b._whenLabel}
                      </Typography>
                      {(() => {
                        const segments = [];
                        const totalCaptured =
                          (b._capturedBalanceTotal || 0) +
                          (b._capturedTipTotal || 0);
                        if (totalCaptured > 0) {
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
                        } else {
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
                        let whenLabel = b._whenLabel || "";
                        if (!whenLabel && b._startIso) {
                          whenLabel = DateTime.fromISO(b._startIso)
                            .setZone(
                              b._tz || b._srcTZ || b.timezone || resolveTZ(),
                            )
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
                        return summary ? (
                          <Typography variant="body2">
                            Payments: {summary}
                          </Typography>
                        ) : null;
                      })()}
                      {typeof b.amount !== "undefined" && (
                        <Typography variant="body2">
                          Amount:{" "}
                          {money(b.amount, b.currency || displayCurrency)}
                        </Typography>
                      )}
                    </>
                  }
                />
              </ListItem>
              <Divider component="li" />
            </React.Fragment>
          ))}
        </List>

        {/* Pagination */}
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
          <DialogTitle>
            Payment History {viewAppt ? `(Booking #${viewAppt.id})` : ""}
            {viewAppt && (
              <Typography variant="body2" color="text.secondary">
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
          </DialogTitle>
          <DialogContent dividers>
            {loadingPayments ? (
              <CircularProgress size={24} />
            ) : payments.length === 0 ? (
              <Alert severity="info">No transactions yet.</Alert>
            ) : (
              <List sx={{ border: 1, borderColor: "divider", borderRadius: 1 }}>
                {payments.map((p) => (
                  <React.Fragment
                    key={p.id || `${p.type}-${p.provider_ref || p.timestamp}`}
                  >
                    <ListItem>
                      <ListItemText
                        primary={
                          <Stack
                            direction="row"
                            spacing={1}
                            alignItems="center"
                          >
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
                        }
                        secondary={
                          <>
                            <Typography variant="body2">
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
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                Ref: {p.provider_ref}
                              </Typography>
                            )}
                          </>
                        }
                      />
                    </ListItem>
                    <Divider component="li" />
                  </React.Fragment>
                ))}
              </List>
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

        {/* Charge dialog */}
        <Dialog
          open={chargeOpen}
          onClose={() => setChargeOpen(false)}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle>
            Charge saved card{" "}
            {chargeBooking ? `(Booking #${chargeBooking.id})` : ""}
            {chargeBooking && (
              <Typography variant="body2" color="text.secondary">
                When:{" "}
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
          </DialogTitle>
          <DialogContent dividers>
            {pmLoading ? (
              <CircularProgress size={24} />
            ) : paymentMethods.length === 0 ? (
              <Alert severity="warning">
                No saved cards on file for this client.
              </Alert>
            ) : (
              <>
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

                {noShowFee > 0 && (
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => setAmount(noShowFee.toFixed(2))}
                    sx={{ mb: 2 }}
                  >
                    Quick-fill No-Show Fee ({money(noShowFee)})
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
              }
            >
              {charging ? <CircularProgress size={20} /> : "Charge"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Refund dialog */}
        <Dialog
          open={refundOpen}
          onClose={() => setRefundOpen(false)}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle>
            Issue refund {refundBooking ? `(Booking #${refundBooking.id})` : ""}
            {refundBooking && (
              <Typography variant="body2" color="text.secondary">
                When:{" "}
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
                    />
                  </RadioGroup>
                </Stack>

                {refundAuto ? (
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
