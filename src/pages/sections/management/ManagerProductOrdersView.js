// src/pages/sections/management/ManagerProductOrdersView.js
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DateTime } from "luxon";
import { api, isStripeOnboardingIncomplete } from "../../../utils/api";
import { Box,
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Button,
  Alert,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormLabel,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Stack,
  Tab,
  Tabs,
  TextField,
  Toolbar,
  Tooltip,
  Typography,
  List,
  ListItem,
  ListItemText,
  Switch,
  FormControlLabel,
  Checkbox } from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import StorefrontIcon from "@mui/icons-material/Storefront";
import NoteAddIcon from "@mui/icons-material/NoteAdd";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import LocalMallIcon from "@mui/icons-material/LocalMall";
import CloseIcon from "@mui/icons-material/Close";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { DataGrid } from "@mui/x-data-grid";
import { formatCurrencyWithCode, formatCurrencyFromCents } from "../../../utils/formatters";
import { setActiveCurrency, normalizeCurrency, resolveCurrencyForCountry, resolveActiveCurrencyFromCompany, getActiveCurrency } from "../../../utils/currency";
import { getUserTimezone } from "../../../utils/timezone";
import { isMobileComplianceMode } from "../../../utils/mobileCompliance";
import MobileWebOnlyNotice from "../../../components/mobile/MobileWebOnlyNotice";
const fulfillmentOptions = [
  { value: "all", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "ready", label: "Ready" },
  { value: "packed", label: "Packed" },
  { value: "ready_for_pickup", label: "Ready for pickup" },
  { value: "blocked", label: "Blocked" },
  { value: "backorder", label: "Backorder" },
  { value: "in_transit", label: "In transit" },
  { value: "delivered", label: "Delivered" },
  { value: "partial", label: "Partially fulfilled" },
  { value: "fulfilled", label: "Fulfilled" },
  { value: "cancelled", label: "Cancelled" },
  { value: "refused", label: "Refused" },
];
const paymentStatusOptions = [
  { value: "all", label: "All payments" },
  { value: "pending", label: "Pending" },
  { value: "paid", label: "Paid" },
  { value: "card_on_file", label: "Card on file" },
  { value: "partially_refunded", label: "Partially refunded" },
  { value: "refunded", label: "Refunded" },
  { value: "failed", label: "Failed" },
];
const deliveryOptions = [
  { value: "all", label: "All delivery methods" },
  { value: "pickup", label: "Pickup" },
  { value: "shipping", label: "Shipping" },
  { value: "local_delivery", label: "Local delivery" },
];
const defaultFilters = {
  search: "",
  fulfillment: "all",
  payment: "all",
  delivery: "all",
};
const statusColor = (status) => {
  if (!status) return "default";
  const normalized = status.toLowerCase();
  switch (normalized) {
    case "fulfilled":
    case "delivered":
    case "paid":
    case "captured":
      return "success";
    case "ready":
    case "packed":
    case "ready_for_pickup":
    case "in_transit":
    case "partial":
    case "partially_refunded":
      return "info";
    case "pending":
    case "card_on_file":
      return "warning";
    case "blocked":
      return "warning";
    case "backorder":
      return "info";
    case "failed":
    case "cancelled":
    case "refused":
    case "refunded":
      return "error";
    default:
      return "default";
  }
};
const titleCase = (value) => {
  if (!value) return "";
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const recommendedFulfillmentAction = (order = {}) => {
  const delivery = String(order?.delivery_method || "pickup").toLowerCase();
  const status = String(order?.fulfillment_status || "pending").toLowerCase();
  if (delivery === "pickup") {
    if (["ready_for_pickup", "packed"].includes(status)) return "deliver";
    if (["fulfilled", "delivered"].includes(status)) return "reset_to_pending";
    return "pack";
  }
  if (status === "pending") return "pack";
  if (status === "packed") return "ship";
  if (status === "in_transit") return "deliver";
  if (["fulfilled", "delivered"].includes(status)) return "reset_to_pending";
  return "pack";
};

const fulfillmentActionOptions = (order = {}) => {
  const delivery = String(order?.delivery_method || "pickup").toLowerCase();
  if (delivery === "pickup") {
    return [
      { value: "pack", label: "Mark ready for pickup" },
      { value: "deliver", label: "Mark picked up" },
      { value: "reset_to_pending", label: "Reset to pending" },
    ];
  }
  return [
    { value: "pack", label: "Mark packed" },
    { value: "ship", label: "Mark shipped" },
    { value: "deliver", label: "Mark delivered" },
    { value: "reset_to_pending", label: "Reset to pending" },
  ];
};

const toLowerSafe = (value) => (value == null ? "" : String(value).toLowerCase());

const normalizeOrderPaymentStatus = (order = {}) => {
  const statuses = [];
  const pushStatus = (val) => {
    const normalized = toLowerSafe(val);
    if (normalized) statuses.push(normalized);
  };

  pushStatus(order?.payment_status);
  pushStatus(order?.status);
  if (Array.isArray(order?.payments)) {
    order.payments.forEach((txn) => {
      pushStatus(txn?.status);
    });
  }

  const hasCardOnFile = Boolean(order?.card_on_file || statuses.includes("card_on_file"));
  const paidish =
    Boolean(order?.paid) ||
    statuses.some((s) => ["paid", "succeeded", "captured", "complete"].includes(s));

  let status =
    statuses.find((s) =>
      [
        "partially_refunded",
        "refunded",
        "failed",
        "pending",
        "processing",
        "requires_payment_method",
        "card_on_file",
      ].includes(s)
    ) || statuses.find(Boolean) || "";

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
      : "pending";
  }

  return {
    status,
    paidish,
    hasCardOnFile,
    original: statuses.find(Boolean) || "",
  };
};

const deriveOrderTotal = (order = {}) => {
  if (order?.total_amount != null) return Number(order.total_amount);
  if (order?.total != null) return Number(order.total);
  if (order?.stripe_total_cents != null) return Number(order.stripe_total_cents) / 100;
  if (order?.stripe_total != null) return Number(order.stripe_total);
  return null;
};

const normalizeProductOrderRecord = (order = {}) => {
  const paymentMeta = normalizeOrderPaymentStatus(order);
  const totalAmount = deriveOrderTotal(order);
  const subtotalCents =
    order?.stripe_subtotal_cents ??
    (order?.stripe_subtotal != null ? Math.round(Number(order.stripe_subtotal) * 100) : null);
  const taxCents =
    order?.stripe_tax_cents ??
    (order?.stripe_tax != null ? Math.round(Number(order.stripe_tax) * 100) : null);

  return {
    ...order,
    payment_status: paymentMeta.status,
    paid: paymentMeta.paidish || Boolean(order?.paid),
    card_on_file: paymentMeta.hasCardOnFile || Boolean(order?.card_on_file),
    _paymentStatusOriginal: paymentMeta.original,
    _paidish: paymentMeta.paidish,
    _hasCardOnFile: paymentMeta.hasCardOnFile,
    total_amount: totalAmount,
    stripe_subtotal_cents: subtotalCents,
    stripe_tax_cents: taxCents,
  };
};

const formatPaymentStatusLabel = (status) =>
  (status || "pending")
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ") || "Pending";
const parseSimpleCsv = (text) => {
  if (!text) return [];
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((header) => header.trim().toLowerCase());
  return lines.slice(1).map((line) => {
    const values = line.split(",");
    const entry = {};
    headers.forEach((header, index) => {
      entry[header] = (values[index] ?? "").trim();
    });
    return entry;
  });
};

const downloadCsv = (filename, contents) => {
  const blob = new Blob([contents], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

function ShippingSummary({ order }) {
  const shipping = order?.shipping;
  const deliveryMethod = String(order?.delivery_method || "pickup").toLowerCase();
  const countryLabel = (code) => {
    const token = String(code || "").trim().toUpperCase();
    if (token === "CA") return "Canada (CA)";
    if (token === "US") return "United States (US)";
    return code;
  };
  if (!shipping && !order?.pickup_instructions) {
    return (
      <Typography variant="body2" color="text.secondary">
        {deliveryMethod === "pickup"
          ? "Pickup order. No additional pickup instructions provided."
          : "No additional delivery instructions provided."}
      </Typography>
    );
  }
  return (
    <Stack spacing={1}>
      {shipping ? (
        <Stack spacing={0.5}>
          {shipping.name && <Typography><strong>Recipient:</strong> {shipping.name}</Typography>}
          {shipping.phone && <Typography><strong>Contact:</strong> {shipping.phone}</Typography>}
          {shipping.address1 && <Typography>{shipping.address1}</Typography>}
          {shipping.address2 && <Typography>{shipping.address2}</Typography>}
          {shipping.city && (
            <Typography>
              {[shipping.city, shipping.region].filter(Boolean).join(", ")}
            </Typography>
          )}
          {shipping.postal_code && <Typography>{shipping.postal_code}</Typography>}
          {shipping.country && <Typography>{countryLabel(shipping.country)}</Typography>}
          {shipping.instructions && (
            <Typography variant="body2" color="text.secondary">
              Instructions: {shipping.instructions}
            </Typography>
          )}
        </Stack>
      ) : null}
      {order?.pickup_instructions ? (
        <Typography variant="body2" color="text.secondary">
          Pickup instructions: {order.pickup_instructions}
        </Typography>
      ) : null}
    </Stack>
  );
}
const timelineIcon = (eventType) => {
  if (!eventType) return <NoteAddIcon fontSize="small" />;
  const type = eventType.toLowerCase();
  if (type.startsWith("payment")) return <MonetizationOnIcon fontSize="small" color="success" />;
  if (type.startsWith("fulfillment")) return <LocalShippingIcon fontSize="small" color="info" />;
  if (type.startsWith("order")) return <StorefrontIcon fontSize="small" color="primary" />;
  if (type.startsWith("refund")) return <MonetizationOnIcon fontSize="small" color="error" />;
  return <NoteAddIcon fontSize="small" color="action" />;
};
const ManagerProductOrdersView = ({ token: tokenProp, connect }) => {
  if (isMobileComplianceMode()) {
    return (
      <Box sx={{ p: 2 }}>
        <MobileWebOnlyNotice
          title="Product order payments are web-only in mobile app mode"
          webPath="/manager/dashboard?view=product-orders"
        />
      </Box>
    );
  }

  const token = tokenProp || (typeof window !== "undefined" ? localStorage.getItem("token") : "");
  const headers = useMemo(() => {
    if (!token) return {};
    return { Authorization: `Bearer ${token}` };
  }, [token]);
  const connectStatus = connect?.status || {};
  const connectLoading = Boolean(connect?.loading);
  const connectNeedsOnboarding = Boolean(connect?.needsOnboarding);
  const connectChargesEnabled = Boolean(connectStatus?.charges_enabled);
  const connectPayoutsEnabled = Boolean(connectStatus?.payouts_enabled);
  const connectStart = connect?.startOnboarding;
  const connectResume = connect?.refreshLink;
  const connectDashboard = connect?.openDashboard;
  const connectRefreshStatus = connect?.refresh;
  const connectAction = connect?.action || null;
  const connectWarning = connectNeedsOnboarding || !connectChargesEnabled;
  const showConnectBanner = Boolean(connect);

  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({ page: 0, pageSize: 25, total: 0 });
  const [filters, setFilters] = useState(defaultFilters);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "info" });
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [orderDetail, setOrderDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailTab, setDetailTab] = useState(0);
  const [fulfillmentForm, setFulfillmentForm] = useState({
    status: "",
    tracking_company: "",
    tracking_number: "",
    tracking_url: "",
    shipping_instructions: "",
    fulfillment_notes: "",
    note: "",
  });
  const [eventForm, setEventForm] = useState({ type: "note", note: "" });
  const [displayCurrency, setDisplayCurrency] = useState(() => getActiveCurrency());
  const [refundForm, setRefundForm] = useState({
    amount: "",
    currency: (normalizeCurrency(displayCurrency) || "USD").toUpperCase(),
    provider: "manual",
    provider_ref: "",
    note: "",
    reason: "",
    auto: false,
    restockAll: false,
    items: {},
    refundPlatformFee: false,
    reverseTransfer: false,
  });
  const [refundSectionOpen, setRefundSectionOpen] = useState(false);
  const [showRefundAdvanced, setShowRefundAdvanced] = useState(false);
  const [shippingSettings, setShippingSettings] = useState(null);
  const [shippingSettingsLoading, setShippingSettingsLoading] = useState(false);
  const [shippingSettingsSaving, setShippingSettingsSaving] = useState(false);

  const viewerTimezone = useMemo(() => getUserTimezone(), []);
  const formatTimestamp = useCallback((value, sourceTz, pattern = "MMM d, yyyy h:mm a") => {
    if (!value) return "";
    const normalized = typeof value === "string" ? value.replace(" ", "T").trim() : value;
    const attempts = [];

    if (typeof normalized === "string") {
      const sourceZone = (sourceTz && String(sourceTz).trim()) || null;
      if (sourceZone) {
        attempts.push(() => DateTime.fromISO(normalized, { zone: sourceZone }));
      }
      attempts.push(() => DateTime.fromISO(normalized, { zone: "UTC" }));
      attempts.push(() => DateTime.fromISO(normalized));
      attempts.push(() => DateTime.fromJSDate(new Date(normalized)));
    } else if (normalized instanceof Date) {
      attempts.push(() => DateTime.fromJSDate(normalized));
    } else {
      attempts.push(() => DateTime.fromJSDate(new Date(value)));
    }

    let dt = null;
    for (const factory of attempts) {
      try {
        const next = factory();
        if (next && next.isValid) {
          dt = next;
          break;
        }
      } catch {
        // ignore and try next candidate
      }
    }

    if (!dt || !dt.isValid) return "";
    const zone = viewerTimezone || "UTC";
    try {
      return dt.setZone(zone).toFormat(pattern);
    } catch {
      try {
        return dt.setZone("UTC").toFormat(pattern);
      } catch {
        return dt.toFormat(pattern);
      }
    }
  }, [viewerTimezone]);
  const formatCsvTimestamp = useCallback(() => {
    return DateTime.now().setZone(viewerTimezone || "UTC").toFormat("yyyyLLdd-HHmmss");
  }, [viewerTimezone]);
  const [fulfillmentSaving, setFulfillmentSaving] = useState(false);
  const [eventSaving, setEventSaving] = useState(false);
  const [refundSaving, setRefundSaving] = useState(false);
  const [inventoryResolutionSaving, setInventoryResolutionSaving] = useState("");
  const [showInventoryFailureDetails, setShowInventoryFailureDetails] = useState(false);
  const [importing, setImporting] = useState(false);
  const importInputRef = useRef(null);
  const showMessage = useCallback((message, severity = "info") => {
    setSnackbar({ open: true, message, severity });
  }, []);
  const closeSnackbar = useCallback(() => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  }, []);
  const detailCurrency = useMemo(() => {
    const code = normalizeCurrency(orderDetail?.stripe_currency || orderDetail?.currency) || displayCurrency || "USD";
    return code.toUpperCase();
  }, [orderDetail, displayCurrency]);
  const stripeEligible = useMemo(() => {
    if (!orderDetail) return false;
    if (orderDetail.payment_intent_id) return true;
    if (Array.isArray(orderDetail.payments)) {
      return orderDetail.payments.some((txn) => {
        const provider = (txn?.provider || "").toLowerCase();
        const status = (txn?.status || "").toLowerCase();
        return provider === "stripe" && ["captured", "paid", "succeeded"].includes(status);
      });
    }
    return false;
  }, [orderDetail]);
  const outstandingAmount = useMemo(() => {
    if (!orderDetail) return 0;
    if (typeof orderDetail.outstanding_amount === "number") {
      return Number(orderDetail.outstanding_amount) || 0;
    }
    const total = Number(orderDetail.total_cents || 0);
    const refunded = Number(orderDetail.refunded_cents || 0);
    return Math.max((total - refunded) / 100, 0);
  }, [orderDetail]);
  const outstandingDisplay = useMemo(
    () => formatCurrencyWithCode(outstandingAmount, detailCurrency),
    [outstandingAmount, detailCurrency]
  );
  const inventoryActionRequired = useMemo(
    () => Boolean(orderDetail?.inventory_action_required),
    [orderDetail]
  );
  const itemsTotal = useMemo(() => {
    if (!orderDetail?.items) return 0;
    return orderDetail.items.reduce((sum, item) => sum + Number(item.total_price || 0), 0);
  }, [orderDetail]);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page + 1,
        per_page: pagination.pageSize,
      };
      if (filters.fulfillment !== "all") params.status = filters.fulfillment;
      if (filters.payment !== "all") params.payment_status = filters.payment;
      if (filters.delivery !== "all") params.delivery_method = filters.delivery;
      if (filters.search) params.search = filters.search.trim();
      const { data } = await api.get("/inventory/product-orders", { headers, params });
      setOrders((data?.orders || []).map((order) => normalizeProductOrderRecord(order)));

      const currencyFromOrders = (data?.orders || [])
        .map((order) => normalizeCurrency(order?.stripe_currency || order?.currency))
        .find(Boolean);
      const companyCurrency = resolveActiveCurrencyFromCompany(data?.company);
      const inferredCurrency = resolveCurrencyForCountry(
        data?.company?.country_code || data?.company?.tax_country_code || ""
      );
      const effectiveListCurrency =
        currencyFromOrders || companyCurrency || inferredCurrency || displayCurrency || "USD";
      const normalizedListCurrency = normalizeCurrency(effectiveListCurrency) || "USD";
      if (normalizedListCurrency !== displayCurrency) {
        setDisplayCurrency(normalizedListCurrency);
        setActiveCurrency(normalizedListCurrency);
      }

      const total = data?.pagination?.total ?? (data?.orders?.length || 0);
      setPagination((prev) => ({ ...prev, total }));
    } catch (error) {
      const message = error?.response?.data?.error || error?.message || "Unable to load product orders";
      showMessage(message, "error");
    } finally {
      setLoading(false);
    }
  }, [headers, filters, pagination.page, pagination.pageSize, showMessage, displayCurrency]);
  useEffect(() => {
    loadOrders();
  }, [loadOrders]);
  const loadShippingSettings = useCallback(async () => {
    setShippingSettingsLoading(true);
    try {
      const { data } = await api.get("/inventory/shipping-settings", { headers });
      setShippingSettings({
        mode: data?.mode || "manual",
        enabled: Boolean(data?.enabled),
        allow_pickup: data?.allow_pickup !== false,
        allow_shipping: data?.allow_shipping !== false,
        allow_local_delivery: Boolean(data?.allow_local_delivery),
        origin_name: data?.origin_name || "",
        origin_phone: data?.origin_phone || "",
        origin_address1: data?.origin_address1 || "",
        origin_address2: data?.origin_address2 || "",
        origin_city: data?.origin_city || "",
        origin_region: data?.origin_region || "",
        origin_postal_code: data?.origin_postal_code || "",
        origin_country: data?.origin_country || "",
        shipping_label_pickup: data?.shipping_label_pickup || "",
        shipping_label_shipping: data?.shipping_label_shipping || "",
        shipping_label_local_delivery: data?.shipping_label_local_delivery || "",
      });
    } catch (error) {
      const message = error?.response?.data?.error || error?.message || "Unable to load shipping settings";
      showMessage(message, "error");
    } finally {
      setShippingSettingsLoading(false);
    }
  }, [headers, showMessage]);
  useEffect(() => {
    loadShippingSettings();
  }, [loadShippingSettings]);
  const fetchOrderDetail = useCallback(async (orderId) => {
    if (!orderId) return;
    setDetailLoading(true);
    try {
      const { data } = await api.get(`/inventory/product-orders/${orderId}`, { headers });
      setOrderDetail(data ? normalizeProductOrderRecord(data) : null);
      setDetailTab(0);
      setFulfillmentForm({
        status: recommendedFulfillmentAction(data || {}),
        tracking_company: data?.tracking_company || "",
        tracking_number: data?.tracking_number || "",
        tracking_url: data?.tracking_url || "",
        shipping_instructions: data?.shipping_instructions || "",
        fulfillment_notes: data?.fulfillment_notes || "",
        note: "",
      });
      setEventForm({ type: "note", note: "" });
      const stripeEligible = Boolean(
        data?.payment_intent_id ||
        (Array.isArray(data?.payments) &&
          data.payments.some((txn) => {
            const provider = (txn?.provider || "").toLowerCase();
            const status = (txn?.status || "").toLowerCase();
            return provider === "stripe" && ["captured", "paid", "succeeded"].includes(status);
          }))
      );
      const itemMap = {};
      (data?.items || []).forEach((item) => {
        const maxQuantity = Number(item?.quantity || 0);
        itemMap[item.id] = {
          id: item.id,
          productId: item.product_id,
          name: item.name,
          maxQuantity,
          quantity: maxQuantity,
          selected: false,
          trackStock: Boolean(item?.product_track_stock),
          currentOnHand: item?.product_qty_on_hand,
        };
      });
      const detailCurrencyCode = normalizeCurrency(
        data?.stripe_currency ||
        data?.currency ||
        (data?.payments || []).find((txn) => txn?.currency)?.currency ||
        displayCurrency
      ) || "USD";
      const companyCurrency = resolveActiveCurrencyFromCompany(data?.company);
      const inferredCurrency = resolveCurrencyForCountry(
        data?.company?.country_code || data?.company?.tax_country_code || ""
      );
      const effectiveDetailCurrency = detailCurrencyCode || companyCurrency || inferredCurrency || displayCurrency || "USD";
      const normalizedDetailCurrency = normalizeCurrency(effectiveDetailCurrency) || "USD";
      if (normalizedDetailCurrency !== displayCurrency) {
        setDisplayCurrency(normalizedDetailCurrency);
        setActiveCurrency(normalizedDetailCurrency);
      }
      setRefundForm({
        amount: "",
        currency: (normalizedDetailCurrency || "USD").toUpperCase(),
        provider: stripeEligible ? "stripe" : "manual",
        provider_ref: "",
        note: "",
        reason: "",
        auto: stripeEligible,
        restockAll: false,
        items: itemMap,
        refundPlatformFee: false,
        reverseTransfer: false,
      });
      setRefundSectionOpen(false);
      setShowRefundAdvanced(false);
      setShowInventoryFailureDetails(false);
    } catch (error) {
      const message = error?.response?.data?.error || error?.message || "Unable to load order details";
      showMessage(message, "error");
      setOrderDetail(null);
    } finally {
      setDetailLoading(false);
    }
  }, [headers, showMessage, displayCurrency]);
  useEffect(() => {
    if (detailOpen && selectedOrderId) {
      fetchOrderDetail(selectedOrderId);
    }
  }, [detailOpen, selectedOrderId, fetchOrderDetail]);
  const openOrderDetail = useCallback((orderId) => {
    setSelectedOrderId(orderId);
    setDetailOpen(true);
  }, []);
  const closeDetail = useCallback(() => {
    setDetailOpen(false);
    setSelectedOrderId(null);
    setOrderDetail(null);
    setRefundSectionOpen(false);
    setShowRefundAdvanced(false);
    setShowInventoryFailureDetails(false);
  }, []);
  const handlePaginationChange = useCallback((model) => {
    setPagination((prev) => ({ ...prev, page: model.page, pageSize: model.pageSize }));
  }, []);
  const handleFilterChange = useCallback((field) => (event) => {
    const value = event.target.value;
    setFilters((prev) => ({ ...prev, [field]: value }));
    setPagination((prev) => ({ ...prev, page: 0 }));
  }, []);
  const rows = useMemo(() => {
    return (orders || [])
      .filter(Boolean)
      .map((order) => {
        const currency = (normalizeCurrency(order?.stripe_currency || order?.currency) || detailCurrency || displayCurrency || "USD").toUpperCase();
        return {
          ...order,
          id: order?.id,
          total_display: formatCurrencyWithCode(order?.total_amount, currency),
          refund_display: formatCurrencyFromCents(order?.refunded_cents, currency),
        };
      });
  }, [orders, detailCurrency, displayCurrency]);
  const columns = useMemo(() => [
    {
      field: "id",
      headerName: "Order",
      width: 110,
      renderCell: (params) => (
        <Button size="small" onClick={() => openOrderDetail(params.row.id)} startIcon={<LocalMallIcon fontSize="small" />}>
          #{params.row.id}
        </Button>
      ),
    },
    {
      field: "created_at",
      headerName: "Created",
      width: 190,
      valueFormatter: (params) => formatTimestamp(params.value, params?.row?.company?.timezone),
    },
    {
      field: "client",
      headerName: "Customer",
      flex: 1,
      minWidth: 220,
      renderCell: (params) => (
        <Stack spacing={0.25}>
          <Typography variant="body2" fontWeight={600}>
            {params.row.client_name || "Guest"}
          </Typography>
          {params.row.client_email && (
            <Typography variant="caption" color="text.secondary">
              {params.row.client_email}
            </Typography>
          )}
          {params.row.inventory_action_required && (
            <Chip size="small" color="warning" variant="outlined" label="Needs attention" sx={{ width: "fit-content" }} />
          )}
        </Stack>
      ),
      sortable: false,
      filterable: false,
    },
    {
      field: "delivery_method",
      headerName: "Delivery",
      width: 140,
      renderCell: (params) => (
        <Chip label={params.row?.delivery_method_label || titleCase(params.value)} color="default" size="small" />
      ),
    },
    {
      field: "fulfillment_status",
      headerName: "Fulfillment",
      width: 160,
      renderCell: (params) => (
        <Chip label={params.row?.fulfillment_status_label || titleCase(params.value)} color={statusColor(params.value)} size="small" />
      ),
    },
    {
      field: "payment_status",
      headerName: "Payment",
      width: 150,
      renderCell: (params) => (
        <Chip label={params.row?.payment_status_label || formatPaymentStatusLabel(params.value)} color={statusColor(params.value)} size="small" />
      ),
    },
    {
      field: "total_amount",
      headerName: "Total",
      width: 140,
      valueFormatter: (params) => {
        const rowCurrency = params && params.row ? params.row.currency : null;
        const currency = (normalizeCurrency(rowCurrency) || detailCurrency || displayCurrency || "USD").toUpperCase();
        if (params?.value == null) return "";
        return formatCurrencyWithCode(params.value, currency);
      },
    },
    {
      field: "refunded_cents",
      headerName: "Refunded",
      width: 140,
      valueFormatter: (params) => {
        const rowCurrency = params && params.row ? params.row.currency : null;
        const currency = (normalizeCurrency(rowCurrency) || detailCurrency || displayCurrency || "USD").toUpperCase();
        if (params?.value == null) return "";
        return formatCurrencyFromCents(params.value, currency);
      },
    },
    {
      field: "actions",
      headerName: "Actions",
      sortable: false,
      filterable: false,
      width: 130,
      renderCell: (params) => (
        <Button variant="outlined" size="small" onClick={() => openOrderDetail(params.row.id)}>
          View
        </Button>
      ),
    },
  ], [openOrderDetail, detailCurrency, displayCurrency, formatTimestamp]);
  const handleRefresh = useCallback(() => {
    loadOrders();
    if (detailOpen && selectedOrderId) {
      fetchOrderDetail(selectedOrderId);
    }
  }, [loadOrders, detailOpen, selectedOrderId, fetchOrderDetail]);
  const handleFulfillmentSubmit = useCallback(async () => {
    if (!orderDetail) return;
    const selectedAction = fulfillmentForm.status;
    if (!selectedAction) {
      showMessage("Select a fulfillment action", "warning");
      return;
    }
    if (
      selectedAction === "ship" &&
      ["shipping", "local_delivery"].includes(String(orderDetail?.delivery_method || "").toLowerCase()) &&
      !(fulfillmentForm.tracking_number || "").trim()
    ) {
      showMessage("Tracking number is required before marking as shipped.", "warning");
      return;
    }
    setFulfillmentSaving(true);
    try {
      const payload = {
        action: selectedAction,
        tracking_company: fulfillmentForm.tracking_company,
        tracking_number: fulfillmentForm.tracking_number,
        tracking_url: fulfillmentForm.tracking_url,
        shipping_instructions: fulfillmentForm.shipping_instructions,
        fulfillment_notes: fulfillmentForm.fulfillment_notes,
        note: fulfillmentForm.note,
      };
      const response = await api.patch(`/inventory/product-orders/${orderDetail.id}/fulfillment`, payload, { headers });
      showMessage("Fulfillment updated", "success");
      const updatedOrder = response?.data?.order || null;
      if (updatedOrder) {
        const normalizedUpdatedOrder = normalizeProductOrderRecord(updatedOrder);
        setOrderDetail(normalizedUpdatedOrder);
        setFulfillmentForm((prev) => ({
          ...prev,
          note: "",
          status: recommendedFulfillmentAction(normalizedUpdatedOrder || {}),
        }));
      } else {
        await fetchOrderDetail(orderDetail.id);
      }
      await loadOrders();
    } catch (error) {
      const message = error?.response?.data?.error || error?.message || "Unable to update fulfillment";
      showMessage(message, "error");
    } finally {
      setFulfillmentSaving(false);
    }
  }, [orderDetail, fulfillmentForm, headers, showMessage, fetchOrderDetail, loadOrders]);
  const handleEventSubmit = useCallback(async () => {
    if (!orderDetail || !eventForm.note) {
      showMessage("Enter a note to add an event", "warning");
      return;
    }
    setEventSaving(true);
    try {
      const payload = {
        event_type: eventForm.type,
        note: eventForm.note,
      };
      await api.post(`/inventory/product-orders/${orderDetail.id}/events`, payload, { headers });
      showMessage("Timeline note added", "success");
      setEventForm({ type: eventForm.type, note: "" });
      await fetchOrderDetail(orderDetail.id);
    } catch (error) {
      const message = error?.response?.data?.error || error?.message || "Unable to add event";
      showMessage(message, "error");
    } finally {
      setEventSaving(false);
    }
  }, [orderDetail, eventForm, headers, showMessage, fetchOrderDetail]);
  const handleSaveShippingSettings = useCallback(async () => {
    if (!shippingSettings) return;
    setShippingSettingsSaving(true);
    try {
      const payload = {
        mode: "manual",
        enabled: Boolean(shippingSettings.enabled),
        allow_pickup: Boolean(shippingSettings.allow_pickup),
        allow_shipping: Boolean(shippingSettings.allow_shipping),
        allow_local_delivery: Boolean(shippingSettings.allow_local_delivery),
        origin_name: shippingSettings.origin_name || null,
        origin_phone: shippingSettings.origin_phone || null,
        origin_address1: shippingSettings.origin_address1 || null,
        origin_address2: shippingSettings.origin_address2 || null,
        origin_city: shippingSettings.origin_city || null,
        origin_region: shippingSettings.origin_region || null,
        origin_postal_code: shippingSettings.origin_postal_code || null,
        origin_country: shippingSettings.origin_country || null,
        shipping_label_pickup: shippingSettings.shipping_label_pickup || null,
        shipping_label_shipping: shippingSettings.shipping_label_shipping || null,
        shipping_label_local_delivery: shippingSettings.shipping_label_local_delivery || null,
      };
      const { data } = await api.patch("/inventory/shipping-settings", payload, { headers });
      setShippingSettings({
        mode: data?.mode || "manual",
        enabled: Boolean(data?.enabled),
        allow_pickup: data?.allow_pickup !== false,
        allow_shipping: data?.allow_shipping !== false,
        allow_local_delivery: Boolean(data?.allow_local_delivery),
        origin_name: data?.origin_name || "",
        origin_phone: data?.origin_phone || "",
        origin_address1: data?.origin_address1 || "",
        origin_address2: data?.origin_address2 || "",
        origin_city: data?.origin_city || "",
        origin_region: data?.origin_region || "",
        origin_postal_code: data?.origin_postal_code || "",
        origin_country: data?.origin_country || "",
        shipping_label_pickup: data?.shipping_label_pickup || "",
        shipping_label_shipping: data?.shipping_label_shipping || "",
        shipping_label_local_delivery: data?.shipping_label_local_delivery || "",
      });
      showMessage("Shipping settings updated", "success");
    } catch (error) {
      const message = error?.response?.data?.error || error?.message || "Unable to save shipping settings";
      showMessage(message, "error");
    } finally {
      setShippingSettingsSaving(false);
    }
  }, [shippingSettings, headers, showMessage]);
  const handleRefundSubmit = useCallback(async () => {
    if (!orderDetail) return;

    const amountValueRaw = (refundForm.amount ?? "").toString().trim();
    const hasAmount = amountValueRaw.length > 0;
    const numericAmount = Number(amountValueRaw);

    if (refundForm.auto && stripeEligible && connectWarning) {
      showMessage("Stripe onboarding incomplete - finish setup before issuing Stripe refunds.", "warning");
      return;
    }

    if (refundForm.auto && stripeEligible) {
      if (hasAmount) {
        if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
          showMessage("Enter a valid refund amount", "warning");
          return;
        }
        if (outstandingAmount > 0 && numericAmount > outstandingAmount + 0.0001) {
          showMessage("Refund amount exceeds remaining balance", "warning");
          return;
        }
      }
    } else {
      if (!hasAmount || !Number.isFinite(numericAmount) || numericAmount <= 0) {
        showMessage("Enter a valid refund amount", "warning");
        return;
      }
      if (outstandingAmount > 0 && numericAmount > outstandingAmount + 0.0001) {
        showMessage("Refund amount exceeds remaining balance", "warning");
        return;
      }
    }

    setRefundSaving(true);
    try {
      const normalizedCurrency = (normalizeCurrency(
        refundForm.currency ||
          orderDetail.currency ||
          orderDetail.stripe_currency ||
          detailCurrency ||
          displayCurrency ||
          "USD"
      ) || "USD").toUpperCase();

      const payload = {
        currency: normalizedCurrency,
      };

      const trimmedNote = refundForm.note?.trim();
      const trimmedReason = refundForm.reason?.trim();
      if (trimmedNote) payload.note = trimmedNote;
      if (trimmedReason) payload.reason = trimmedReason;

      if (refundForm.auto && stripeEligible) {
        payload.auto = true;
        if (hasAmount) {
          const cents = Math.round(numericAmount * 100);
          if (cents > 0) {
            payload.amount_cents = cents;
          }
        }
        if (refundForm.refundPlatformFee) {
          payload.refund_platform_fee = true;
        }
        if (refundForm.reverseTransfer) {
          payload.reverse_transfer = true;
        }
      } else {
        const cents = Math.round(numericAmount * 100);
        payload.amount_cents = cents;
        payload.provider = (refundForm.provider || "manual").trim() || "manual";
        const providerRef = refundForm.provider_ref?.trim();
        if (providerRef) {
          payload.provider_ref = providerRef;
        }
      }

      const restockEntries = Object.values(refundForm.items || {})
        .filter((item) => item.trackStock && item.selected && Number(item.quantity) > 0)
        .map((item) => ({
          order_item_id: item.id,
          product_id: item.productId,
          quantity: Number(item.quantity),
        }));
      if (restockEntries.length) {
        payload.restock_items = restockEntries;
      } else if (refundForm.restockAll) {
        payload.restock_all = true;
      }

      const response = await api.post(`/inventory/product-orders/${orderDetail.id}/refund`, payload, { headers });
      const successMessage = response?.data?.message || "Refund recorded";
      showMessage(successMessage, "success");

      const refundTxn = response?.data?.refund_transaction;
      if (refundTxn) {
        setOrderDetail((prev) => {
          if (!prev) return prev;
          const events = Array.isArray(prev.events) ? [...prev.events] : [];
          const amountCents =
            typeof refundTxn.amount_cents === "number"
              ? refundTxn.amount_cents
              : typeof refundTxn.amount === "number"
              ? Math.round(refundTxn.amount * 100)
              : null;
          const amountValue =
            amountCents != null ? amountCents / 100 : typeof refundTxn.amount === "number" ? refundTxn.amount : null;
          const txnCurrency =
            normalizeCurrency(
              refundTxn.currency || payload.currency || prev.currency || detailCurrency || displayCurrency || "USD"
            ) || "USD";
          const parts = [];
          if (amountValue != null) {
            parts.push(`Refund ${formatCurrencyWithCode(amountValue, txnCurrency)}`);
          } else {
            parts.push("Refund processed");
          }
          if (refundTxn.status) {
            parts.push(titleCase(String(refundTxn.status)));
          }
          if (refundTxn.provider) {
            parts.push(`via ${refundTxn.provider}`);
          }
          const event = {
            id: refundTxn.id || `refund-${Date.now()}`,
            event_type: "refund",
            created_at: refundTxn.timestamp || refundTxn.created_at || refundTxn.updated_at || new Date().toISOString(),
            note: parts.join(" - "),
            actor_name: refundTxn.actor_name || (refundForm.auto ? "Stripe" : "Manager"),
            data: { transaction: refundTxn },
          };
          return { ...prev, events: [...events, event] };
        });
      }

      setRefundForm((prev) => {
        const resetItems = {};
        Object.entries(prev.items || {}).forEach(([key, item]) => {
          resetItems[key] = {
            ...item,
            selected: false,
            quantity: item.maxQuantity ?? item.quantity ?? 0,
          };
        });
        return {
          ...prev,
          amount: "",
          provider_ref: "",
          note: "",
          reason: "",
          restockAll: false,
          refundPlatformFee: false,
          reverseTransfer: false,
          items: resetItems,
        };
      });
      await fetchOrderDetail(orderDetail.id);
      await loadOrders();
    } catch (error) {
      if (isStripeOnboardingIncomplete(error)) {
        showMessage("Stripe onboarding incomplete - finish setup before issuing Stripe refunds.", "warning");
        connectRefreshStatus?.();
      } else {
        const message = error?.response?.data?.error || error?.message || "Unable to record refund";
        showMessage(message, "error");
      }
    } finally {
      setRefundSaving(false);
    }
  }, [
    orderDetail,
    refundForm,
    headers,
    showMessage,
    fetchOrderDetail,
    loadOrders,
    outstandingAmount,
    stripeEligible,
    connectWarning,
    detailCurrency,
    displayCurrency,
  ]);
  const handleResolveInventoryIssue = useCallback(
    async (action) => {
      if (!orderDetail?.id || !action) return;
      setInventoryResolutionSaving(action);
      try {
        const response = await api.post(
          `/inventory/product-orders/${orderDetail.id}/resolve-inventory-issue`,
          { action },
          { headers }
        );
        const ok = response?.data?.ok;
        if (ok === false) {
          showMessage(response?.data?.message || response?.data?.error || "Resolution failed", "warning");
        } else {
          if (action === "refund") showMessage("Order resolved by refund.", "success");
          if (action === "backorder") showMessage("Order marked as backorder.", "success");
          if (action === "stock_corrected") showMessage("Inventory retry completed.", "success");
        }
        await fetchOrderDetail(orderDetail.id);
        await loadOrders();
      } catch (error) {
        const message = error?.response?.data?.error || error?.response?.data?.message || error?.message || "Unable to resolve inventory issue";
        showMessage(message, "error");
      } finally {
        setInventoryResolutionSaving("");
      }
    },
    [orderDetail, headers, showMessage, fetchOrderDetail, loadOrders]
  );
  const handleStripeAutoToggle = useCallback(
    (event) => {
      const checked = event.target.checked;
      setRefundForm((prev) => {
        const nextProvider = checked && stripeEligible
          ? "stripe"
          : prev.provider === "stripe"
          ? "manual"
          : prev.provider || "manual";
        return {
          ...prev,
          auto: checked && stripeEligible,
          provider: nextProvider,
          provider_ref: checked ? "" : prev.provider_ref,
          refundPlatformFee: checked ? prev.refundPlatformFee : false,
          reverseTransfer: checked ? prev.reverseTransfer : false,
        };
      });
    },
    [stripeEligible]
  );
  const handleRestockAllToggle = useCallback((event) => {
    const checked = event.target.checked;
    setRefundForm((prev) => {
      const items = { ...prev.items };
      Object.keys(items).forEach((key) => {
        const item = items[key];
        if (!item?.trackStock) return;
        items[key] = { ...item, selected: checked };
      });
      return { ...prev, restockAll: checked, items };
    });
  }, []);
  const handleRestockItemToggle = useCallback(
    (itemId) => (event) => {
      const checked = event.target.checked;
      setRefundForm((prev) => {
        const items = { ...prev.items };
        const existing = items[itemId];
        if (!existing) return prev;
        items[itemId] = { ...existing, selected: checked };
        const allSelected = Object.values(items)
          .filter((item) => item.trackStock)
          .every((item) => !item.trackStock || item.selected);
        return { ...prev, items, restockAll: allSelected };
      });
    },
    []
  );
  const handleRestockQuantityChange = useCallback(
    (itemId) => (event) => {
      const raw = Number(event.target.value);
      setRefundForm((prev) => {
        const items = { ...prev.items };
        const existing = items[itemId];
        if (!existing) return prev;
        const max = existing.maxQuantity ?? existing.quantity ?? 0;
        const next = Math.max(0, Math.min(Number.isFinite(raw) ? Math.round(raw) : 0, max));
        items[itemId] = { ...existing, quantity: next };
        return { ...prev, items };
      });
    },
    []
  );
  const handleFillOutstanding = useCallback(() => {
    if (outstandingAmount > 0) {
      setRefundForm((prev) => ({ ...prev, amount: outstandingAmount.toFixed(2) }));
    }
  }, [outstandingAmount]);
  const handleExportCsv = useCallback(() => {
    if (!orders.length) {
      showMessage("No orders to export", "info");
      return;
    }
    const headersRow = [
      "Order ID",
      "Created At",
      "Customer",
      "Email",
      "Total",
      "Currency",
      "Payment Status",
      "Fulfillment Status",
      "Delivery Method",
    ];
    const csvRows = orders.map((order) => {
      const createdAt = order.created_at ? formatTimestamp(order.created_at, order?.company?.timezone, "yyyy-MM-dd HH:mm") : "";
      const customer = order.client_name || "";
      const email = order.client_email || "";
      const total = order.total_amount != null
        ? formatCurrencyWithCode(order.total_amount, order.currency || detailCurrency)
        : "";
      const currency = (normalizeCurrency(order.currency || detailCurrency || displayCurrency || "USD") || "USD").toUpperCase();
      return [
        order.id,
        createdAt,
        customer,
        email,
        total,
        currency,
        order.payment_status_label || formatPaymentStatusLabel(order.payment_status),
        order.fulfillment_status_label || titleCase(order.fulfillment_status),
        order.delivery_method_label || titleCase(order.delivery_method),
      ];
    });
    const allRows = [headersRow, ...csvRows]
      .map((row) =>
        row
          .map((value) => {
            const cell = value == null ? "" : String(value);
            return `"${cell.replace(/"/g, '""')}"`;
          })
          .join(",")
      )
      .join("\r\n");
    downloadCsv(`product-orders-${formatCsvTimestamp()}.csv`, allRows);
  }, [orders, detailCurrency, displayCurrency, showMessage, formatTimestamp, formatCsvTimestamp]);
  const triggerImport = useCallback(() => {
    importInputRef.current?.click();
  }, []);
  const handleImportCsv = useCallback(
    async (event) => {
      const file = event.target.files?.[0];
      if (!file) return;
      setImporting(true);
      try {
        const textContent = await file.text();
        const rows = parseSimpleCsv(textContent);
        if (!rows.length) {
          showMessage("No rows found in CSV", "warning");
          return;
        }
        let successCount = 0;
        const errors = [];
        for (const row of rows) {
          const orderId = Number(row.order_id || row.id);
          if (!orderId) {
            errors.push("Missing order_id column");
            continue;
          }
          const payload = {};
          const statusValue = row.fulfillment_status || row.status;
          if (statusValue) {
            payload.status = String(statusValue).toLowerCase();
          }
          if (row.tracking_company) payload.tracking_company = row.tracking_company;
          if (row.tracking_number) payload.tracking_number = row.tracking_number;
          if (row.tracking_url) payload.tracking_url = row.tracking_url;
          if (!Object.keys(payload).length) {
            continue;
          }
          try {
            await api.post(`/inventory/product-orders/${orderId}/fulfill`, payload, { headers });
            successCount += 1;
          } catch (error) {
            const message = error?.response?.data?.error || error?.message || `Failed to update order ${orderId}`;
            errors.push(message);
          }
        }
        if (successCount) {
          showMessage(
            `Imported ${successCount} fulfillment update${successCount === 1 ? "" : "s"}.`,
            "success"
          );
          await loadOrders();
          if (detailOpen && selectedOrderId) {
            await fetchOrderDetail(selectedOrderId);
          }
        }
        if (errors.length) {
          showMessage(errors[0], successCount ? "warning" : "error");
        }
      } catch (error) {
        const message = error?.message || "Unable to import CSV";
        showMessage(message, "error");
      } finally {
        setImporting(false);
        if (event.target) {
          event.target.value = "";
        }
      }
    },
    [headers, loadOrders, showMessage, detailOpen, selectedOrderId, fetchOrderDetail]
  );
  return (
    <Box>
      <input
        ref={importInputRef}
        type="file"
        accept=".csv"
        style={{ display: "none" }}
        onChange={handleImportCsv}
      />
      <Toolbar />
      <Stack spacing={3}>
        {showConnectBanner ? (
          connectLoading ? (
            <Alert severity="info" sx={{ mb: 2 }}>
              Checking Stripe Connect status...
            </Alert>
          ) : connectWarning ? (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Stripe onboarding incomplete - Stripe-managed payments are disabled until setup is complete.
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mt: 1 }}>
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
                    {connectAction === "refresh" ? "Refreshing..." : "Resume onboarding"}
                  </Button>
                ) : null}
                {connectDashboard ? (
                  <Button
                    variant="text"
                    size="small"
                    onClick={connectDashboard}
                    disabled={connectAction === "dashboard"}
                  >
                    {connectAction === "dashboard" ? "Opening..." : "Stripe dashboard"}
                  </Button>
                ) : null}
              </Stack>
            </Alert>
          ) : (
            <Alert severity="success" sx={{ mb: 2 }}>
              Stripe Connect ready - charges enabled{connectPayoutsEnabled ? " and payouts enabled." : "; payouts pending."}
            </Alert>
          )
        ) : null}
        <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ xs: "stretch", md: "center" }}>
          <Typography variant="h5" fontWeight={700} sx={{ flexGrow: 1 }}>
            Product Orders
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              size="small"
              label="Search"
              placeholder="Name, email, tracking..."
              value={filters.search}
              onChange={handleFilterChange("search")}
            />
            <FormControl size="small">
              <Select value={filters.fulfillment} onChange={handleFilterChange("fulfillment")} displayEmpty>
                {fulfillmentOptions.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small">
              <Select value={filters.payment} onChange={handleFilterChange("payment")} displayEmpty>
                {paymentStatusOptions.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small">
              <Select value={filters.delivery} onChange={handleFilterChange("delivery")} displayEmpty>
                {deliveryOptions.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Tooltip title="Refresh">
              <IconButton color="primary" onClick={handleRefresh}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Button onClick={() => { setFilters(defaultFilters); setPagination((prev) => ({ ...prev, page: 0 })); }}>
              Clear filters
            </Button>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
              <Button variant="outlined" onClick={handleExportCsv} disabled={!orders.length}>
                Export CSV
              </Button>
              <Button variant="outlined" onClick={triggerImport} disabled={importing}>
                {importing ? <CircularProgress size={18} /> : "Import CSV"}
              </Button>
            </Stack>
          </Stack>/Stack>
        </Stack>
        <Paper sx={{ p: 2 }}>
          <div style={{ width: "100%" }}>
            <DataGrid
              autoHeight
              rows={rows}
              columns={columns}
              loading={loading}
              paginationMode="server"
              rowCount={pagination.total}
              paginationModel={{ page: pagination.page, pageSize: pagination.pageSize }}
              onPaginationModelChange={handlePaginationChange}
              pageSizeOptions={[10, 25, 50, 100]}
              disableRowSelectionOnClick
              sx={{ "& .MuiDataGrid-cell": { outline: "none" } }}
            />
          </div>
        </Paper>
      </Stack>
      <Dialog open={detailOpen} onClose={closeDetail} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Typography variant="h6" fontWeight={700}>
            Order #{orderDetail?.id}
          </Typography>
          <IconButton onClick={closeDetail}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ bgcolor: (theme) => theme.palette.background.default }}>
          {detailLoading ? (
            <Stack alignItems="center" justifyContent="center" py={6}>
              <CircularProgress />
            </Stack>
          ) : !orderDetail ? (
            <Typography variant="body2" color="text.secondary">
              Order details unavailable.
            </Typography>
          ) : (
            <Stack spacing={3}>
        {showConnectBanner ? (
          connectLoading ? (
            <Alert severity="info" sx={{ mb: 2 }}>
              Checking Stripe Connect status...
            </Alert>
          ) : connectWarning ? (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Stripe onboarding incomplete - Stripe-managed payments are disabled until setup is complete.
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mt: 1 }}>
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
                    {connectAction === "refresh" ? "Refreshing..." : "Resume onboarding"}
                  </Button>
                ) : null}
                {connectDashboard ? (
                  <Button
                    variant="text"
                    size="small"
                    onClick={connectDashboard}
                    disabled={connectAction === "dashboard"}
                  >
                    {connectAction === "dashboard" ? "Opening..." : "Stripe dashboard"}
                  </Button>
                ) : null}
              </Stack>
            </Alert>
          ) : (
            <Alert severity="success" sx={{ mb: 2 }}>
              Stripe Connect ready - charges enabled{connectPayoutsEnabled ? " and payouts enabled." : "; payouts pending."}
            </Alert>
          )
        ) : null}
              <Paper sx={{ p: 2 }}>
                <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={2}>
                  <Stack spacing={0.5}>
                    <Typography variant="h6" fontWeight={700}>
                      {orderDetail.client_name || "Guest"}
                    </Typography>
                    {orderDetail.client_email && (
                      <Typography variant="body2" color="text.secondary">
                        {orderDetail.client_email}
                      </Typography>
                    )}
                    {orderDetail.client_phone && (
                      <Typography variant="body2" color="text.secondary">
                        {orderDetail.client_phone}
                      </Typography>
                    )}
                    <Typography variant="body2" color="text.secondary">
                      Placed {formatTimestamp(orderDetail.created_at, orderDetail?.company?.timezone)}
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    <Chip label={`Delivery: ${orderDetail.delivery_method_label || titleCase(orderDetail.delivery_method)}`} />
                    <Chip label={`Fulfillment: ${orderDetail.fulfillment_status_label || titleCase(orderDetail.fulfillment_status)}`} color={statusColor(orderDetail.fulfillment_status)} />
                    <Chip label={`Payment: ${orderDetail.payment_status_label || formatPaymentStatusLabel(orderDetail.payment_status)}`} color={statusColor(orderDetail.payment_status)} />
                    <Chip label={`Customer status: ${orderDetail.status_label || "Processing"}`} color="default" variant="outlined" />
                    <Chip label={`Total ${formatCurrencyWithCode(orderDetail.total_amount, detailCurrency)}`} color="primary" variant="outlined" />
                    <Chip label={`Refunded ${formatCurrencyFromCents(orderDetail.refunded_cents, detailCurrency)}`} color={orderDetail.refunded_cents ? "warning" : "default"} variant="outlined" />
                  </Stack>
                </Stack>
                <Stack direction="row" spacing={1} sx={{ mt: 1 }} flexWrap="wrap">
                  <Chip
                    size="small"
                    color={orderDetail.inventory_committed ? "success" : "default"}
                    label={
                      orderDetail.inventory_committed
                        ? `Inventory committed${orderDetail.inventory_committed_at ? ` • ${formatTimestamp(orderDetail.inventory_committed_at, orderDetail?.company?.timezone)}` : ""}`
                        : "Inventory not yet committed"
                    }
                  />
                  {(Number(orderDetail.product_order_restock_total_units || 0) > 0 || Number(orderDetail.refunded_cents || 0) > 0) && (
                    <Chip
                      size="small"
                      color={Number(orderDetail.product_order_restock_total_units || 0) > 0 ? "info" : "default"}
                      label={
                        Number(orderDetail.product_order_restock_total_units || 0) > 0
                          ? `Restocked ${Number(orderDetail.product_order_restock_total_units || 0)} unit(s)`
                          : "No restock recorded"
                      }
                    />
                  )}
                  {orderDetail.tracking_status && (
                    <Chip
                      size="small"
                      color="info"
                      variant="outlined"
                      label={`Tracking: ${titleCase(orderDetail.tracking_status)}`}
                    />
                  )}
                  {orderDetail.tracking_url_public && (
                    <Button
                      size="small"
                      variant="text"
                      onClick={() => window.open(orderDetail.tracking_url_public, "_blank", "noopener,noreferrer")}
                    >
                      Open tracking link
                    </Button>
                  )}
                </Stack>
                {orderDetail.payment_status === "paid" && inventoryActionRequired && (
                  <Alert severity="warning" sx={{ mt: 1.5 }}>
                    Payment received, but inventory could not be committed. Action required.
                  </Alert>
                )}
              </Paper>
              <Tabs value={detailTab} onChange={(_, value) => setDetailTab(value)} variant="scrollable" scrollButtons allowScrollButtonsMobile>
                <Tab label="Summary" />
                <Tab label="Items" />
                <Tab label="Payments" />
                <Tab label="Timeline" />
                <Tab label="Actions" />
              </Tabs>
              {detailTab === 0 && (
                <Stack spacing={2}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                      Delivery Details
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <Stack spacing={1}>
                          <Typography variant="body2" color="text.secondary">
                            Delivery method
                          </Typography>
                          <Typography>{titleCase(orderDetail.delivery_method)}</Typography>
                          {orderDetail.fulfillment_notes && (
                            <Typography variant="body2" color="text.secondary">
                              Fulfillment notes: {orderDetail.fulfillment_notes}
                            </Typography>
                          )}
                        </Stack>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Stack spacing={1}>
                          <Typography variant="body2" color="text.secondary">
                            Shipping / pickup information
                          </Typography>
                          <ShippingSummary order={orderDetail} />
                        </Stack>
                      </Grid>
                    </Grid>
                  </Paper>
                  <Paper sx={{ p: 2 }}>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Typography variant="subtitle1" fontWeight={600}>Financials</Typography>
                      <Chip label={`Subtotal ${formatCurrencyFromCents(orderDetail.stripe_subtotal_cents, detailCurrency)}`} size="small" />
                      <Chip label={`Tax ${formatCurrencyFromCents(orderDetail.stripe_tax_cents, detailCurrency)}`} size="small" />
                      <Chip label={`Total ${formatCurrencyWithCode(orderDetail.total_amount, detailCurrency)}`} color="primary" size="small" />
                    </Stack>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      {orderDetail.notes ? `Customer note: ${orderDetail.notes}` : "No customer notes provided."}
                    </Typography>
                  </Paper>
                </Stack>
              )}
              {detailTab === 1 && (
                <Paper sx={{ p: 2 }}>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                    Items ({orderDetail.items?.length || 0})
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <TableView
                    headers={["Item", "Quantity", "Unit", "Total"]}
                    rows={(orderDetail.items || []).map((item) => ({
                      key: item.id,
                      cells: [
                        (
                          <Stack key="info" spacing={0.5}>
                            <Typography fontWeight={600}>{item.name}</Typography>
                            {item.sku && (
                              <Typography variant="caption" color="text.secondary">
                                SKU: {item.sku}
                              </Typography>
                            )}
                            {item.description && (
                              <Typography variant="caption" color="text.secondary">
                                {item.description}
                              </Typography>
                            )}
                          </Stack>
                        ),
                        item.quantity,
                        formatCurrencyWithCode(item.unit_price, detailCurrency),
                        formatCurrencyWithCode(item.total_price, detailCurrency),
                      ],
                    }))}
                    footer={
                      <Typography fontWeight={700} textAlign="right">
                        Items total: {formatCurrencyWithCode(itemsTotal, detailCurrency)}
                      </Typography>
                    }
                  />
                </Paper>
              )}
              {detailTab === 2 && (
                <Paper sx={{ p: 2 }}>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                    Payments
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  {(orderDetail.payments || []).length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      No payments recorded for this order yet.
                    </Typography>
                  ) : (
                    <TableView
                      headers={["Date", "Type", "Status", "Provider", "Amount"]}
                      rows={orderDetail.payments.map((payment) => ({
                        key: payment.id,
                        cells: [
                          formatTimestamp(payment.created_at, orderDetail?.company?.timezone),
                          titleCase(payment.type),
                          titleCase(payment.status),
                          payment.provider || "-",
                          formatCurrencyWithCode(payment.amount, payment.currency || detailCurrency),
                        ],
                      }))}
                    />
                  )}
                </Paper>
              )}
              {detailTab === 3 && (
                <Paper sx={{ p: 2 }}>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                    Timeline
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  {(orderDetail.events || []).length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      No timeline entries recorded yet.
                    </Typography>
                  ) : (
                    <List dense>
                      {(orderDetail.events || []).slice().reverse().map((event) => (
                        <ListItem key={event.id} alignItems="flex-start">
                          <ListItemText
                            primary={
                              <Stack direction="row" spacing={1} alignItems="center">
                                {timelineIcon(event.event_type)}
                                <Typography fontWeight={600}>{titleCase(event.event_type)}</Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {formatTimestamp(event.created_at, orderDetail?.company?.timezone)}
                                </Typography>
                              </Stack>
                            }
                            secondary={
                              <Stack spacing={0.5} sx={{ mt: 1 }}>
                                {event.note && <Typography variant="body2">{event.note}</Typography>}
                                {event.actor_name && (
                                  <Typography variant="caption" color="text.secondary">
                                    {event.actor_name} {event.actor_email ? `(${event.actor_email})` : ""}
                                  </Typography>
                                )}
                                {event.data && (
                                  <Typography variant="caption" color="text.secondary">
                                    {JSON.stringify(event.data)}
                                  </Typography>
                                )}
                              </Stack>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  )}
                </Paper>
              )}
              {detailTab === 4 && (
                <Stack spacing={3}>
        {showConnectBanner ? (
          connectLoading ? (
            <Alert severity="info" sx={{ mb: 2 }}>
              Checking Stripe Connect status...
            </Alert>
          ) : connectWarning ? (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Stripe onboarding incomplete - Stripe-managed payments are disabled until setup is complete.
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mt: 1 }}>
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
                    {connectAction === "refresh" ? "Refreshing..." : "Resume onboarding"}
                  </Button>
                ) : null}
                {connectDashboard ? (
                  <Button
                    variant="text"
                    size="small"
                    onClick={connectDashboard}
                    disabled={connectAction === "dashboard"}
                  >
                    {connectAction === "dashboard" ? "Opening..." : "Stripe dashboard"}
                  </Button>
                ) : null}
              </Stack>
            </Alert>
          ) : (
            <Alert severity="success" sx={{ mb: 2 }}>
              Stripe Connect ready - charges enabled{connectPayoutsEnabled ? " and payouts enabled." : "; payouts pending."}
            </Alert>
          )
        ) : null}
                  {inventoryActionRequired ? (
                    <Paper sx={{ p: 2 }}>
                      <Stack spacing={2}>
                        <Alert severity="warning">
                          Payment received, but inventory could not be committed. Choose one action to continue.
                        </Alert>
                        <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                          <Button
                            variant="contained"
                            color="error"
                            onClick={() => handleResolveInventoryIssue("refund")}
                            disabled={Boolean(inventoryResolutionSaving)}
                          >
                            {inventoryResolutionSaving === "refund" ? <CircularProgress size={18} /> : "Refund customer"}
                          </Button>
                          <Button
                            variant="outlined"
                            onClick={() => handleResolveInventoryIssue("backorder")}
                            disabled={Boolean(inventoryResolutionSaving)}
                          >
                            {inventoryResolutionSaving === "backorder" ? <CircularProgress size={18} /> : "Mark as backorder"}
                          </Button>
                          <Button
                            variant="outlined"
                            onClick={() => handleResolveInventoryIssue("stock_corrected")}
                            disabled={Boolean(inventoryResolutionSaving)}
                          >
                            {inventoryResolutionSaving === "stock_corrected" ? <CircularProgress size={18} /> : "Retry after stock correction"}
                          </Button>
                        </Stack>
                        <Button
                          size="small"
                          onClick={() => setShowInventoryFailureDetails((prev) => !prev)}
                          sx={{ alignSelf: "flex-start" }}
                        >
                          {showInventoryFailureDetails ? "Hide details" : "Show details"}
                        </Button>
                        {showInventoryFailureDetails && (
                          <Stack spacing={0.75}>
                            <Typography variant="body2" color="text.secondary">
                              {orderDetail.inventory_commit_failed_reason
                                ? `Reason: ${titleCase(orderDetail.inventory_commit_failed_reason)}`
                                : "Reason: Insufficient stock"}
                            </Typography>
                            {(orderDetail.inventory_commit_failed_items || []).map((item, idx) => (
                              <Typography key={`${item.product_id || "p"}-${idx}`} variant="caption" color="text.secondary">
                                {item.name || "Item"} (SKU: {item.sku || "-"}) - requested {item.requested}, available {item.available}
                              </Typography>
                            ))}
                          </Stack>
                        )}
                      </Stack>
                    </Paper>
                  ) : (
                  <>
                  <Accordion defaultExpanded disableGutters>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography variant="subtitle1" fontWeight={600}>Fulfillment</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                      Update fulfillment
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={4}>
                        <FormControl fullWidth size="small">
                          <FormLabel shrink>Next action</FormLabel>
                          <Select
                            value={fulfillmentForm.status}
                            onChange={(event) => setFulfillmentForm((prev) => ({ ...prev, status: event.target.value }))}
                          >
                            {fulfillmentActionOptions(orderDetail).map((opt) => (
                              <MenuItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Tracking company"
                          value={fulfillmentForm.tracking_company}
                          onChange={(event) => setFulfillmentForm((prev) => ({ ...prev, tracking_company: event.target.value }))}
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Tracking number"
                          value={fulfillmentForm.tracking_number}
                          onChange={(event) => setFulfillmentForm((prev) => ({ ...prev, tracking_number: event.target.value }))}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Tracking URL"
                          value={fulfillmentForm.tracking_url}
                          onChange={(event) => setFulfillmentForm((prev) => ({ ...prev, tracking_url: event.target.value }))}
                          helperText="Use a full http/https URL"
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Shipping instructions"
                          value={fulfillmentForm.shipping_instructions}
                          onChange={(event) => setFulfillmentForm((prev) => ({ ...prev, shipping_instructions: event.target.value }))}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Fulfillment notes"
                          value={fulfillmentForm.fulfillment_notes}
                          onChange={(event) => setFulfillmentForm((prev) => ({ ...prev, fulfillment_notes: event.target.value }))}
                          multiline
                          minRows={2}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Internal note"
                          value={fulfillmentForm.note}
                          onChange={(event) => setFulfillmentForm((prev) => ({ ...prev, note: event.target.value }))}
                          multiline
                          minRows={2}
                          helperText="Optional note that appears in the timeline"
                        />
                      </Grid>
                    </Grid>
                    <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 2 }}>
                      <Button
                        variant="contained"
                        onClick={handleFulfillmentSubmit}
                        disabled={fulfillmentSaving || inventoryActionRequired}
                      >
                        {fulfillmentSaving ? <CircularProgress size={20} /> : "Apply action"}
                      </Button>
                    </Stack>
                    {inventoryActionRequired && (
                      <Typography variant="caption" color="warning.main" sx={{ display: "block", mt: 1 }}>
                        Fulfillment is blocked until the inventory issue is resolved.
                      </Typography>
                    )}
                  </Paper>
                    </AccordionDetails>
                  </Accordion>
                  <Accordion defaultExpanded disableGutters>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography variant="subtitle1" fontWeight={600}>Timeline Note</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                      Add timeline note
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={4}>
                        <FormControl fullWidth size="small">
                          <FormLabel shrink>Event type</FormLabel>
                          <Select
                            value={eventForm.type}
                            onChange={(event) => setEventForm((prev) => ({ ...prev, type: event.target.value }))}
                          >
                            <MenuItem value="note">Note</MenuItem>
                            <MenuItem value="update">Update</MenuItem>
                            <MenuItem value="contact">Contacted customer</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Timeline note"
                          value={eventForm.note}
                          onChange={(event) => setEventForm((prev) => ({ ...prev, note: event.target.value }))}
                          multiline
                          minRows={2}
                        />
                      </Grid>
                    </Grid>
                    <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 2 }}>
                      <Button
                        variant="outlined"
                        onClick={handleEventSubmit}
                        disabled={eventSaving}
                        startIcon={<NoteAddIcon />}
                      >
                        {eventSaving ? <CircularProgress size={20} /> : "Add to timeline"}
                      </Button>
                    </Stack>
                  </Paper>
                    </AccordionDetails>
                  </Accordion>
                  <Accordion
                    disableGutters
                    expanded={refundSectionOpen}
                    onChange={(_, expanded) => setRefundSectionOpen(Boolean(expanded))}
                  >
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ width: "100%", pr: 1 }}>
                        <Typography variant="subtitle1" fontWeight={600}>Refund</Typography>
                        <Chip
                          size="small"
                          label={orderDetail.inventory_committed ? "Inventory committed" : "Inventory not committed"}
                          color={orderDetail.inventory_committed ? "success" : "default"}
                          variant="outlined"
                        />
                      </Stack>
                    </AccordionSummary>
                    <AccordionDetails>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                      Record refund
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2 }}>
                      Refund amount records payment reversal. Restock is optional and only available for orders with committed inventory.
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Amount"
                          type="number"
                          value={refundForm.amount}
                          onChange={(event) => setRefundForm((prev) => ({ ...prev, amount: event.target.value }))}
                          InputProps={{ startAdornment: <InputAdornment position="start">{detailCurrency}</InputAdornment> }}
                        />
                        <Typography variant="caption" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          Remaining balance: {outstandingDisplay}
                          {outstandingAmount > 0 && (
                            <Button size="small" onClick={handleFillOutstanding}>
                              Use balance
                            </Button>
                          )}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Currency"
                          value={refundForm.currency}
                          onChange={(event) =>
                            setRefundForm((prev) => ({ ...prev, currency: event.target.value.toUpperCase() }))
                          }
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={refundForm.auto && stripeEligible}
                              onChange={handleStripeAutoToggle}
                              disabled={!stripeEligible}
                            />
                          }
                          label="Refund via Stripe"
                        />
                        {!stripeEligible && (
                          <Typography variant="caption" color="text.secondary">
                            No Stripe payment captured for this order. The refund will be recorded manually.
                          </Typography>
                        )}
                      </Grid>
                      <Grid item xs={12}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={showRefundAdvanced}
                              onChange={(event) => setShowRefundAdvanced(event.target.checked)}
                            />
                          }
                          label="Show advanced refund options"
                        />
                      </Grid>
                      {showRefundAdvanced && refundForm.auto && stripeEligible ? (
                        <Grid item xs={12} md={4}>
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={refundForm.refundPlatformFee}
                                onChange={(event) =>
                                  setRefundForm((prev) => ({ ...prev, refundPlatformFee: event.target.checked }))
                                }
                                disabled={connectWarning}
                              />
                            }
                            label="Refund platform fee"
                          />
                          <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                            Returns the platform fee on this charge when issuing the refund.
                          </Typography>
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={refundForm.reverseTransfer}
                                onChange={(event) =>
                                  setRefundForm((prev) => ({ ...prev, reverseTransfer: event.target.checked }))
                                }
                                disabled={!stripeEligible}
                              />
                            }
                            label="Reverse transfer to connected account"
                          />
                          <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                            Requests Stripe to pull funds back from the connected account with this refund.
                          </Typography>
                        </Grid>
                      ) : null}
                      {showRefundAdvanced && !refundForm.auto && (
                        <>
                          <Grid item xs={12} md={4}>
                            <TextField
                              fullWidth
                              size="small"
                              label="Provider"
                              value={refundForm.provider}
                              onChange={(event) =>
                                setRefundForm((prev) => ({ ...prev, provider: event.target.value }))
                              }
                            />
                          </Grid>
                          <Grid item xs={12} md={8}>
                            <TextField
                              fullWidth
                              size="small"
                              label="Provider reference"
                              value={refundForm.provider_ref}
                              onChange={(event) =>
                                setRefundForm((prev) => ({ ...prev, provider_ref: event.target.value }))
                              }
                            />
                          </Grid>
                        </>
                      )}
                      {showRefundAdvanced && (
                      <Grid item xs={12}>
                        <FormLabel>Restock inventory</FormLabel>
                        {Object.values(refundForm.items || {}).length ? (
                          <Stack spacing={1} sx={{ mt: 1 }}>
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={refundForm.restockAll}
                                  indeterminate={
                                    !refundForm.restockAll &&
                                    Object.values(refundForm.items || {}).some((item) => item.trackStock && item.selected)
                                  }
                                  onChange={handleRestockAllToggle}
                                />
                              }
                              label="Select all tracked items"
                            />
                            {Object.values(refundForm.items || {}).map((item) => (
                              <Stack
                                key={item.id}
                                direction={{ xs: "column", sm: "row" }}
                                spacing={1}
                                alignItems={{ xs: "flex-start", sm: "center" }}
                              >
                                <FormControlLabel
                                  control={
                                    <Checkbox
                                      checked={item.selected}
                                      onChange={handleRestockItemToggle(item.id)}
                                      disabled={!item.trackStock}
                                    />
                                  }
                                  label={`${item.name || "Item"}${item.trackStock ? "" : " (not tracked)"}`}
                                />
                                <TextField
                                  size="small"
                                  type="number"
                                  label="Quantity"
                                  value={item.quantity}
                                  onChange={handleRestockQuantityChange(item.id)}
                                  inputProps={{ min: 0, max: item.maxQuantity }}
                                  disabled={!item.trackStock || !item.selected}
                                  sx={{ width: 140 }}
                                />
                                {item.trackStock && (
                                  <Typography variant="caption" color="text.secondary" sx={{ ml: { xs: 0, sm: 2 } }}>
                                    Sold: {item.maxQuantity}
                                    {typeof item.currentOnHand === "number" ? ` | On hand: ${item.currentOnHand}` : ""}
                                  </Typography>
                                )}
                              </Stack>
                            ))}
                          </Stack>
                        ) : (
                          <Typography variant="caption" color="text.secondary">No line items available to restock.</Typography>
                        )}
                      </Grid>
                      )}
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Reason"
                          value={refundForm.reason}
                          onChange={(event) => setRefundForm((prev) => ({ ...prev, reason: event.target.value }))}
                          placeholder="Optional reason for reporting"
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Internal note"
                          value={refundForm.note}
                          onChange={(event) => setRefundForm((prev) => ({ ...prev, note: event.target.value }))}
                          multiline
                          minRows={2}
                        />
                      </Grid>
                    </Grid>
                    <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 2 }}>
                      <Button
                        variant="outlined"
                        color="error"
                        onClick={handleRefundSubmit}
                        disabled={refundSaving || (refundForm.auto && stripeEligible && connectWarning)}
                        startIcon={<MonetizationOnIcon />}
                      >
                        {refundSaving ? <CircularProgress size={20} /> : "Record refund"}
                      </Button>
                    </Stack>
                  </Paper>
                    </AccordionDetails>
                  </Accordion>
                  <Accordion disableGutters>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography variant="subtitle1" fontWeight={600}>Shipping settings (manual)</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Paper variant="outlined" sx={{ p: 2 }}>
                        {shippingSettingsLoading || !shippingSettings ? (
                          <Stack direction="row" spacing={1} alignItems="center">
                            <CircularProgress size={18} />
                            <Typography variant="body2" color="text.secondary">Loading shipping settings...</Typography>
                          </Stack>
                        ) : (
                          <Grid container spacing={2}>
                            <Grid item xs={12} md={3}>
                              <FormControlLabel
                                control={
                                  <Switch
                                    checked={Boolean(shippingSettings.enabled)}
                                    onChange={(event) =>
                                      setShippingSettings((prev) => ({ ...prev, enabled: event.target.checked }))
                                    }
                                  />
                                }
                                label="Enabled"
                              />
                            </Grid>
                            <Grid item xs={12} md={3}>
                              <FormControlLabel
                                control={
                                  <Switch
                                    checked={Boolean(shippingSettings.allow_pickup)}
                                    onChange={(event) =>
                                      setShippingSettings((prev) => ({ ...prev, allow_pickup: event.target.checked }))
                                    }
                                  />
                                }
                                label="Allow pickup"
                              />
                            </Grid>
                            <Grid item xs={12} md={3}>
                              <FormControlLabel
                                control={
                                  <Switch
                                    checked={Boolean(shippingSettings.allow_shipping)}
                                    onChange={(event) =>
                                      setShippingSettings((prev) => ({ ...prev, allow_shipping: event.target.checked }))
                                    }
                                  />
                                }
                                label="Allow shipping"
                              />
                            </Grid>
                            <Grid item xs={12} md={3}>
                              <FormControlLabel
                                control={
                                  <Switch
                                    checked={Boolean(shippingSettings.allow_local_delivery)}
                                    onChange={(event) =>
                                      setShippingSettings((prev) => ({ ...prev, allow_local_delivery: event.target.checked }))
                                    }
                                  />
                                }
                                label="Allow local delivery"
                              />
                            </Grid>
                            <Grid item xs={12} md={4}>
                              <TextField
                                fullWidth
                                size="small"
                                label="Origin name"
                                value={shippingSettings.origin_name}
                                onChange={(event) =>
                                  setShippingSettings((prev) => ({ ...prev, origin_name: event.target.value }))
                                }
                              />
                            </Grid>
                            <Grid item xs={12} md={4}>
                              <TextField
                                fullWidth
                                size="small"
                                label="Origin phone"
                                value={shippingSettings.origin_phone}
                                onChange={(event) =>
                                  setShippingSettings((prev) => ({ ...prev, origin_phone: event.target.value }))
                                }
                              />
                            </Grid>
                            <Grid item xs={12} md={4}>
                              <TextField
                                fullWidth
                                size="small"
                                label="Country (ISO-2)"
                                value={shippingSettings.origin_country}
                                onChange={(event) =>
                                  setShippingSettings((prev) => ({ ...prev, origin_country: event.target.value.toUpperCase() }))
                                }
                              />
                            </Grid>
                            <Grid item xs={12} md={6}>
                              <TextField
                                fullWidth
                                size="small"
                                label="Address line 1"
                                value={shippingSettings.origin_address1}
                                onChange={(event) =>
                                  setShippingSettings((prev) => ({ ...prev, origin_address1: event.target.value }))
                                }
                              />
                            </Grid>
                            <Grid item xs={12} md={6}>
                              <TextField
                                fullWidth
                                size="small"
                                label="Address line 2"
                                value={shippingSettings.origin_address2}
                                onChange={(event) =>
                                  setShippingSettings((prev) => ({ ...prev, origin_address2: event.target.value }))
                                }
                              />
                            </Grid>
                            <Grid item xs={12} md={4}>
                              <TextField
                                fullWidth
                                size="small"
                                label="City"
                                value={shippingSettings.origin_city}
                                onChange={(event) =>
                                  setShippingSettings((prev) => ({ ...prev, origin_city: event.target.value }))
                                }
                              />
                            </Grid>
                            <Grid item xs={12} md={4}>
                              <TextField
                                fullWidth
                                size="small"
                                label="Region"
                                value={shippingSettings.origin_region}
                                onChange={(event) =>
                                  setShippingSettings((prev) => ({ ...prev, origin_region: event.target.value }))
                                }
                              />
                            </Grid>
                            <Grid item xs={12} md={4}>
                              <TextField
                                fullWidth
                                size="small"
                                label="Postal code"
                                value={shippingSettings.origin_postal_code}
                                onChange={(event) =>
                                  setShippingSettings((prev) => ({ ...prev, origin_postal_code: event.target.value }))
                                }
                              />
                            </Grid>
                            <Grid item xs={12} md={4}>
                              <TextField
                                fullWidth
                                size="small"
                                label="Pickup label"
                                value={shippingSettings.shipping_label_pickup}
                                onChange={(event) =>
                                  setShippingSettings((prev) => ({ ...prev, shipping_label_pickup: event.target.value }))
                                }
                              />
                            </Grid>
                            <Grid item xs={12} md={4}>
                              <TextField
                                fullWidth
                                size="small"
                                label="Shipping label"
                                value={shippingSettings.shipping_label_shipping}
                                onChange={(event) =>
                                  setShippingSettings((prev) => ({ ...prev, shipping_label_shipping: event.target.value }))
                                }
                              />
                            </Grid>
                            <Grid item xs={12} md={4}>
                              <TextField
                                fullWidth
                                size="small"
                                label="Local delivery label"
                                value={shippingSettings.shipping_label_local_delivery}
                                onChange={(event) =>
                                  setShippingSettings((prev) => ({ ...prev, shipping_label_local_delivery: event.target.value }))
                                }
                              />
                            </Grid>
                            <Grid item xs={12}>
                              <Stack direction="row" justifyContent="flex-end">
                                <Button variant="contained" onClick={handleSaveShippingSettings} disabled={shippingSettingsSaving}>
                                  {shippingSettingsSaving ? <CircularProgress size={20} /> : "Save shipping settings"}
                                </Button>
                              </Stack>
                            </Grid>
                          </Grid>
                        )}
                      </Paper>
                    </AccordionDetails>
                  </Accordion>
                  </>
                  )}
                </Stack>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDetail}>Close</Button>
        </DialogActions>
      </Dialog>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={closeSnackbar}
        message={snackbar.message}
      />
    </Box>
  );
};
const TableView = ({ headers, rows, footer }) => (
  <Box sx={{ overflowX: "auto" }}>
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead>
        <tr>
          {headers.map((header) => (
            <th key={header} style={{ textAlign: "left", padding: "8px", borderBottom: "1px solid rgba(0,0,0,0.12)" }}>
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? (
          <tr>
            <td colSpan={headers.length} style={{ padding: "12px", textAlign: "center", color: "rgba(0,0,0,0.54)" }}>
              No records found.
            </td>
          </tr>
        ) : (
          rows.map((row) => (
            <tr key={row.key}>
              {row.cells.map((cell, index) => (
                <td key={index} style={{ padding: "8px", borderBottom: "1px solid rgba(0,0,0,0.08)" }}>
                  {cell}
                </td>
              ))}
            </tr>
          ))
        )}
      </tbody>
      {footer && (
        <tfoot>
          <tr>
            <td colSpan={headers.length} style={{ padding: "12px" }}>
              {footer}
            </td>
          </tr>
        </tfoot>
      )}
    </table>
  </Box>
);
export default ManagerProductOrdersView;
