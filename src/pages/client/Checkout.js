// src/pages/client/Checkout.js
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { formatCurrency } from "../../utils/formatters";
import { setActiveCurrency, normalizeCurrency, resolveCurrencyForCountry, getActiveCurrency } from "../../utils/currency";
import { api as apiClient, API_BASE_URL } from "../../utils/api";

import { releasePendingCheckout, getOrCreateCheckoutRequestKey } from "../../utils/hostedCheckout";
import { CartTypes, loadCart, saveCart, setCartTenantContext } from "../../utils/cart";
import { getTenantHostMode } from "../../utils/tenant";
import {
  clientSessionLoggedOut,
  issueClientSessionHandoff,
  publishClientSessionState,
  verifyClientSessionForTenant,
} from "../../utils/clientSession";

import { Box, Typography, Stack, CircularProgress } from "@mui/material";

import { useTheme } from "@mui/material/styles";

import SiteFrame from "../../components/website/SiteFrame";
import { publicSite } from "../../utils/api";

import TenantTransactionalShell from "./TenantTransactionalShell";

import { normalizeTransactionalReturnPath } from "../../utils/transactionalFrameBridge";
import { useCheckoutContinuation } from "./useCheckoutContinuation";
import { CheckoutFormView } from "./CheckoutFormView";

const stashProductOrder = (order, sessionId) => {
  if (!order) return;
  const normalized = { ...order };
  if (sessionId && !normalized.stripe_session_id) {
    normalized.stripe_session_id = sessionId;
  }
  try {
    sessionStorage.setItem("checkout_products", JSON.stringify({ order: normalized, at: Date.now() }));
    if (sessionId) {
      sessionStorage.setItem("checkout_stripe_session_id", sessionId);
    } else if (!normalized.stripe_session_id) {
      sessionStorage.removeItem("checkout_stripe_session_id");
    }
  } catch (err) {
    // best effort only
  }
};

const clearProductOrderStash = () => {
  try {
    sessionStorage.removeItem("checkout_products");
    sessionStorage.removeItem("checkout_stripe_session_id");
  } catch (err) {
    // ignore storage failures
  }
};

const normalizeProductOrder = (payload) => {
  if (!payload) return null;
  if (payload.order && typeof payload.order === 'object') return payload.order;
  if (payload.product_order && typeof payload.product_order === 'object') return payload.product_order;
  return payload;
};

const FALLBACK_COUNTRY_LABELS = {
  CA: "Canada",
  US: "United States",
};

const CHECKOUT_SELECT_MENU_PROPS = {
  PaperProps: {
    sx: {
      backgroundColor: "var(--checkout-card-bg, var(--page-card-bg, #ffffff))",
      backgroundImage: "none",
      opacity: 1,
      backdropFilter: "none",
      boxShadow: "0 12px 30px rgba(15, 23, 42, 0.18)",
      border: "1px solid var(--page-border, rgba(2, 6, 23, 0.08))",
    },
  },
};

const normalizeDeliveryCountryCode = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const token = raw.toUpperCase();
  if (token === "CA" || token === "CANADA") return "CA";
  if (token === "US" || token === "USA" || token === "UNITED STATES" || token === "UNITED STATES OF AMERICA") return "US";
  if (token.length === 2 && /^[A-Z]{2}$/.test(token)) return token;
  return "";
};

const EMPTY_SHIPPING_RATES = {
  loading: false,
  available: false,
  fallbackManual: false,
  message: "",
  rates: [],
  selectedRateId: "",
  quoteToken: "",
  quoteExpiresAt: "",
  manualDecision: null,
  manualEstimateToken: "",
  dutiesIncluded: false,
  importChargesNoticeVersion: "",
  importChargesNoticeSnapshot: null,
  requireImportChargesAcknowledgement: false,
  incompatibleItems: [],
};

const EMPTY_ADDRESS_VERIFICATION = {
  loading: false,
  status: "idle",
  token: "",
  acceptedAddress: null,
  originalAddress: null,
  suggestedAddress: null,
  differences: [],
  messages: [],
  retryable: false,
  residential: null,
  verificationLevel: "",
};

const emptyImportNoticeConfig = {
  internationalDutiesPolicy: "",
  dutiesIncluded: false,
  importChargesNoticeVersion: "",
  importChargesNoticeSnapshot: null,
  requireImportChargesAcknowledgement: false,
};

/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
export function CheckoutFormCore({
  companySlug,
  slugOverride,
  businessName,
  onRequestAddService,
  service,
  artist,
  slot,
  onSuccess,
  onBack,
  paymentsEnabled,
  tipEnabled,
  cardOnFileEnabled,
  productCheckout,
  displayCurrency,
  policy,
  holdMinutes,
  contactEmail,
  contactPhone,
}) {
  const theme = useTheme();
  const accentColor = "var(--page-btn-bg, var(--sched-primary))";
  const accentContrast = "var(--page-btn-color, #ffffff)";
  const borderColor = "var(--page-border-color, rgba(15,23,42,0.12))";
  const checkoutTextColor = "var(--checkout-text-color, var(--page-content-color, #5f4a56))";
  const checkoutHeadingColor = "var(--checkout-heading-color, #5f4a56)";
  const checkoutSectionColor = "var(--checkout-section-color, #5f4a56)";
  const softBg = "var(--page-btn-bg-soft, rgba(15,23,42,0.12))";
  const buttonShadow = "var(--page-btn-shadow, 0 16px 32px rgba(15,23,42,0.16))";
  const buttonShadowHover = "var(--page-btn-shadow-hover, 0 20px 40px rgba(15,23,42,0.2))";
  const focusRingColor = "var(--page-focus-ring, var(--page-btn-bg, var(--sched-primary)))";
  const focusRing = {
    outline: `2px solid ${focusRingColor}`,
    outlineOffset: 2,
  };
  const primaryButtonSx = {
    backgroundColor: accentColor,
    color: accentContrast,
    textTransform: "none",
    fontWeight: 700,
    borderRadius: "var(--page-btn-radius, 12px)",
    boxShadow: buttonShadow,
    "&:hover": {
      backgroundColor: `var(--page-btn-bg-hover, ${accentColor})`,
      color: accentContrast,
      boxShadow: buttonShadowHover,
    },
    "&:focus-visible": focusRing,
  };
  const outlineButtonSx = {
    borderColor: accentColor,
    color: accentColor,
    textTransform: "none",
    fontWeight: 600,
    borderRadius: "var(--page-btn-radius, 12px)",
    "&:hover": {
      backgroundColor: softBg,
      borderColor: accentColor,
      color: accentColor,
    },
    "&:focus-visible": focusRing,
  };
  const textButtonSx = {
    color: accentColor,
    textTransform: "none",
    fontWeight: 600,
    "&:focus-visible": focusRing,
  };
  const infoAlertSx = {
    backgroundColor: softBg,
    color: checkoutTextColor,
    border: `1px solid ${borderColor}`,
    "& .MuiAlert-icon": { color: accentColor },
  };
  const mobileCheckoutActionSx = {
    position: { xs: "sticky", sm: "static" },
    bottom: { xs: 0, sm: "auto" },
    zIndex: 4,
    mt: 1,
    mx: { xs: -1, sm: 0 },
    px: { xs: 1, sm: 0 },
    py: { xs: 1.25, sm: 0 },
    borderTop: { xs: `1px solid ${borderColor}`, sm: "none" },
    backgroundColor: {
      xs: "var(--checkout-card-bg, var(--page-card-bg, var(--page-body-bg, #ffffff)))",
      sm: "transparent",
    },
    boxShadow: { xs: "0 -12px 28px rgba(15,23,42,0.08)", sm: "none" },
  };
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = useMemo(
    () => new URLSearchParams(location.search || ""),
    [location.search]
  );
  const productCheckoutEnabled = Boolean(productCheckout?.enabled ?? paymentsEnabled);

  const basePaymentMode = useMemo(() => {
    const mode = String(policy?.booking_payment?.mode || policy?.mode || "").toLowerCase();
    if (mode === "capture" && cardOnFileEnabled) return "capture";
    if (mode === "deposit" && paymentsEnabled) return "deposit";
    if (mode === "pay" && paymentsEnabled) return "pay";
    if (mode === "off") return "off";
    if (cardOnFileEnabled) return "capture";
    if (paymentsEnabled) return "pay";
    return "off";
  }, [paymentsEnabled, cardOnFileEnabled, policy]);
  const tipAllowedNow = (basePaymentMode === "pay" || basePaymentMode === "deposit") && tipEnabled;

  // Resolve a reliable slug for API calls, even if props/params are missing
  const slugLocal = useMemo(() => {
    const pick = (...cands) => {
      for (const c of cands) {
        if (!c) continue;
        const s = String(c).trim();
        if (!s || s === 'undefined' || s === 'null' || s === '(unknown)') continue;
        return s;
      }
      return null;
    };
    let qsSlug = null;
    try { qsSlug = new URLSearchParams(window.location.search || '').get('site'); } catch {}
    let pathSlug = null;
    try { pathSlug = (window.location.pathname || '').split('/').filter(Boolean)[0] || null; } catch {}
    return pick(slugOverride, companySlug, qsSlug, pathSlug);
  }, [companySlug, slugOverride]);
  setCartTenantContext(slugLocal);
  const isCustomDomain = getTenantHostMode() === "custom";
  const basePath = isCustomDomain ? "" : `/${slugLocal || ""}`;
  const currencyCode = useMemo(() => (displayCurrency || "USD").toUpperCase(), [displayCurrency]);
  const embedSuffix = useMemo(() => {
    try {
      const qs = new URLSearchParams(location.search || "");
      const keys = ["embed", "mode", "dialog", "site", "primary", "text", "return_to", "returnTo", "services_return_to"];
      const entries = keys
        .map((key) => {
          const val = qs.get(key);
          return val ? [key, val] : null;
        })
        .filter(Boolean);
      if (!entries.length) return "";
      const next = new URLSearchParams();
      entries.forEach(([key, val]) => next.set(key, val));
      const query = next.toString();
      return query ? `?${query}` : "";
    } catch {
      return "";
    }
  }, [location.search]);
  const productsReturnTo = useMemo(
    () => normalizeTransactionalReturnPath(
      searchParams.get("return_to") || searchParams.get("returnTo") || ""
    ),
    [searchParams]
  );
  const servicesReturnTo = useMemo(
    () => normalizeTransactionalReturnPath(searchParams.get("services_return_to") || ""),
    [searchParams]
  );
  const servicesBrowsePath = useMemo(() => {
    if (servicesReturnTo) return servicesReturnTo;
    const target = slugLocal || companySlug;
    if (isCustomDomain) return "/services";
    return target ? `/${target}/services` : "";
  }, [companySlug, isCustomDomain, servicesReturnTo, slugLocal]);

  const [client, setClient] = useState(null);
  const [guest, setGuest] = useState({ name: "", email: "" });
  const [productDelivery, setProductDelivery] = useState({
    delivery_method: "",
    pickup_instructions: "",
    shipping: {
      name: "",
      phone: "",
      address1: "",
      address2: "",
      city: "",
      region: "",
      postal_code: "",
      country: "",
      instructions: "",
    },
  });
  const [shippingRates, setShippingRates] = useState({ ...EMPTY_SHIPPING_RATES });
  const [shippingEstimateRefreshNonce, setShippingEstimateRefreshNonce] = useState(0);
  const [addressVerification, setAddressVerification] = useState({ ...EMPTY_ADDRESS_VERIFICATION });
  const [addressConfirmationChecked, setAddressConfirmationChecked] = useState(false);
  const [deliveryMethodPolicy, setDeliveryMethodPolicy] = useState({
    loading: false,
    source: "default",
    deliveryEnabled: false,
    automationMode: "manual",
    methods: [],
    allowedMethods: [],
    allowedDestinationCountries: [],
    allowedDestinationCountryOptions: [],
    countryCatalog: [],
    addressVerificationEnabled: false,
    internationalAddressVerificationMode: "best_effort",
    originCountry: "",
    manualShippingPricing: {
      enabled: false,
      currency: null,
      flatRateCents: null,
      freeThresholdCents: null,
    },
    ...emptyImportNoticeConfig,
  });
  const [importChargesAcknowledged, setImportChargesAcknowledged] = useState(false);
  const [cart, setCart] = useState([]);
  const [productMetadataLoading, setProductMetadataLoading] = useState(false);
  const [clientPackages, setClientPackages] = useState([]);
  const [packagesLoading, setPackagesLoading] = useState(false);
  const [packagesError, setPackagesError] = useState("");

  const [dlgSvcOpen, setDlgSvcOpen] = useState(false);
  const [dlgAddonOpen, setDlgAddonOpen] = useState(false);
  const [activeItemId, setActiveItemId] = useState(null);
  const [addonOpts, setAddonOpts] = useState({});

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState(null);

  const [couponCode, setCouponCode] = useState("");
  const [couponError, setCouponError] = useState("");
  const [couponExpanded, setCouponExpanded] = useState(false);
  const [publicUpgradeOpen, setPublicUpgradeOpen] = useState(false);
  const [publicUpgradeMessage, setPublicUpgradeMessage] = useState("");
  const [cardOnFileConsentAccepted, setCardOnFileConsentAccepted] = useState(false);
  const [cardOnFileConsentError, setCardOnFileConsentError] = useState("");
  const lastAckDependencyRef = useRef("");

  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [registerDialogOpen, setRegisterDialogOpen] = useState(false);
  const [forgotDialogOpen, setForgotDialogOpen] = useState(false);
  const companyContactEmail = contactEmail || "";
  const companyContactPhone = contactPhone || "";

  // A tenant's billing status is an internal concern. Public checkout must not
  // expose the API error key or plan requirements to the tenant's client.
  const showPublicBookingUnavailable = () => {
    setErr("");
    setPublicUpgradeMessage("");
    setPublicUpgradeOpen(true);
  };

  useEffect(() => {
    if (!slugLocal) return undefined;
    if (clientSessionLoggedOut(slugLocal)) {
      try {
        localStorage.removeItem("token");
        localStorage.removeItem("clientToken");
        localStorage.removeItem("role");
        localStorage.removeItem("company_id");
      } catch {}
      setClient(null);
      setGuest({ name: "", email: "" });
      return undefined;
    }
    let active = true;
    (async () => {
      const result = await verifyClientSessionForTenant(slugLocal, { apiClient });
      if (!active) return;
      if (result.signedIn && result.profile?.email) {
        setClient(result.profile);
        setGuest({ name: result.profile.name || "", email: result.profile.email });
        publishClientSessionState(true, {
          reason: "verified-client-session",
          tenantSlug: slugLocal,
        });
        issueClientSessionHandoff(slugLocal, { apiClient });
        return;
      }
      setClient(null);
      if (result.reason && result.reason !== "missing-token") {
        publishClientSessionState(false, {
          reason: result.reason,
          tenantSlug: slugLocal,
        });
      }
    })();
    return () => {
      active = false;
    };
  }, [slugLocal]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("checkout_product_delivery_prefill");
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return;
      const parsedShipping = parsed.shipping && typeof parsed.shipping === "object" ? parsed.shipping : {};
      const normalizedPrefillCountry = normalizeDeliveryCountryCode(
        parsedShipping.country || parsed.shipping_country || parsed.country
      );
      setProductDelivery((prev) => ({
        delivery_method: ["pickup", "shipping", "local_delivery"].includes(parsed.delivery_method)
          ? parsed.delivery_method
          : prev.delivery_method,
        pickup_instructions: parsed.pickup_instructions || prev.pickup_instructions || "",
        shipping: {
          ...prev.shipping,
          ...parsedShipping,
          country: normalizedPrefillCountry || prev.shipping.country || "",
        },
      }));
    } catch {
      // ignore parse/storage errors
    }
  }, []);

  useEffect(() => {
    setProductDelivery((prev) => {
      const next = {
        ...prev,
        shipping: {
          ...prev.shipping,
          name: prev.shipping.name || client?.full_name || `${client?.first_name || ""} ${client?.last_name || ""}`.trim(),
          phone: prev.shipping.phone || client?.phone || "",
        },
      };
      return next;
    });
  }, [client?.id, client?.full_name, client?.first_name, client?.last_name, client?.phone]);

  useEffect(() => {
    if (!client?.id) {
      setClientPackages([]);
      setPackagesLoading(false);
      setPackagesError("");
      return;
    }
    let active = true;
    setPackagesLoading(true);
    setPackagesError("");
    apiClient
      .get("/me/packages")
      .then(({ data }) => {
        if (!active) return;
        setClientPackages(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!active) return;
        setPackagesError("Unable to load packages.");
        setClientPackages([]);
      })
      .finally(() => {
        if (!active) return;
        setPackagesLoading(false);
      });
    return () => {
      active = false;
    };
  }, [client?.id]);

  useEffect(() => {
    const saved = loadCart();
    let mutated = false;
    const normalized = saved.map((item) => {
      if (isProduct(item) || isPackage(item) || item?.hold_started_at) return item;
      mutated = true;
      return { ...item, hold_started_at: new Date().toISOString() };
    });
    if (mutated) {
      saveCart(normalized);
    }
    setCart(normalized);
  }, []);

  useEffect(() => {
    if (!service || !slot) return;
    const saved = loadCart();
    const hasProducts = saved.some((item) => (item?.type || CartTypes.SERVICE) === CartTypes.PRODUCT);
    if (hasProducts) {
      setErr("Please complete or clear your product purchase before booking a service.");
      setCart(saved);
      return;
    }

    const newItem = {
      id: `${service.id}-${slot.date}-${slot.start_time}`,
      type: CartTypes.SERVICE,
      service_id: service.id,
      service_name: service.name,
      price: Number(service.base_price ?? 0),
      allow_packages: Boolean(service.allow_packages),
      artist_name: artist?.full_name || artist?.name || "Provider",
      artist_id: artist?.id,
      date: slot.date,
      start_time: slot.start_time,
      end_time: slot.end_time,
      start_utc: slot.start_utc || null,
      end_utc: slot.end_utc || null,
      availability_id: slot.availability_id ?? slot.id ?? null,
      timezone: slot.timezone || null,
      addon_ids: slot.addon_ids || [],
      addons: slot.addons || [],
      couponApplied: false,
      coupon: null,
      tip_mode: "percent",
      tip_value: 0,
      tip_amount: 0,
      quantity: 1,
      hold_started_at: new Date().toISOString(),
    };

    const merged = [...saved.filter((i) => i.id !== newItem.id), newItem];
    saveCart(merged);
    setCart(merged);
  }, [service, artist, slot]);

  useEffect(() => {
    const svcIds = [...new Set(cart.map((c) => c.service_id))];
    const base =
      !API_BASE_URL || API_BASE_URL === "/"
        ? ""
        : String(API_BASE_URL).replace(/\/$/, "");
    const buildAddonImageUrl = (img) => {
      if (!img || typeof img !== "object") return null;
      if (img.url_public) return img.url_public;
      if (img.external_url) return img.external_url;
      if (img.id == null) return null;
      return `${base}/public/addon-images/${img.id}`;
    };

    svcIds.forEach(async (sid) => {
      if (addonOpts[sid]) return;
      try {
        if (!slugLocal) return;
        const { data } = await apiClient.get(`/public/${slugLocal}/service/${sid}/addons`);
        const normalized = Array.isArray(data)
          ? data.map((addon) => ({
              ...addon,
              images: Array.isArray(addon?.images)
                ? addon.images.map((img) => ({
                    ...img,
                    url_public: buildAddonImageUrl(img),
                  }))
                : [],
            }))
          : [];
        setAddonOpts((prev) => ({ ...prev, [sid]: normalized }));
      } catch { /* ignore */ }
    });
  }, [cart, slugLocal, addonOpts]);

  const ensureArray = (value) => (Array.isArray(value) ? value : []);
  const getAddons = (item) => ensureArray(item?.addons);
  const getAddonIds = (item) => ensureArray(item?.addon_ids);

  const getQuantity = (item) => Math.max(1, Number(item?.quantity || 1));
  const isProduct = (item) => (item?.type || CartTypes.SERVICE) === CartTypes.PRODUCT;
  const isPackage = (item) => (item?.type || CartTypes.SERVICE) === CartTypes.PACKAGE;
  const isPackageActive = (pkg) => {
    const remaining = Number(pkg?.remaining ?? 0);
    if (!Number.isFinite(remaining) || remaining <= 0) return false;
    const expiresAt = pkg?.expires_at || pkg?.expiresAt;
    if (!expiresAt) return true;
    const ts = Date.parse(expiresAt);
    if (!Number.isFinite(ts)) return true;
    return ts > Date.now();
  };
  const packagesForService = (serviceId) =>
    clientPackages.filter((pkg) => {
      const svcId =
        pkg?.template?.service_id ??
        pkg?.package_template?.service_id ??
        pkg?.service_id;
      return Number(svcId) === Number(serviceId) && isPackageActive(pkg);
    });

  const lineSubtotal = (item) => {
    if (isProduct(item)) {
      return Number(item.price || 0) * getQuantity(item);
    }
    if (isPackage(item)) {
      return Number(item.price || 0) * getQuantity(item);
    }
    const base = item.client_package_id ? 0 : Number(item.price || 0);
    return base + getAddons(item).reduce((s, a) => s + Number(a.base_price || 0), 0);
  };

  const lineDiscount = (item) => {
    if (isProduct(item) || isPackage(item)) return 0;
    if (item.client_package_id) return 0;
    if (!item.couponApplied || !item.coupon) return 0;
    const base = lineSubtotal(item);
    if (item.coupon.discount_percent != null && Number(item.coupon.discount_percent) > 0) {
      return (Number(item.coupon.discount_percent) / 100) * base;
    }
    if (item.coupon.discount_fixed != null && Number(item.coupon.discount_fixed) > 0) {
      return Math.min(Number(item.coupon.discount_fixed), base);
    }
    return 0;
  };

  const recomputeTip = (item) => {
    if (isProduct(item) || isPackage(item)) return { ...item };
    const i = { ...item };
    if (i.tip_mode === "percent") {
      i.tip_amount = Math.max(0, (Number(i.tip_value || 0) / 100) * lineSubtotal(i));
    }
    return i;
  };

  const serviceItems = useMemo(
    () => cart.filter((item) => !isProduct(item) && !isPackage(item)),
    [cart]
  );
  const productItems = useMemo(
    () => cart.filter((item) => isProduct(item)),
    [cart]
  );
  const physicalProductItems = useMemo(
    () => productItems.filter((item) => item.is_digital !== true),
    [productItems]
  );
  const productIdsKey = useMemo(
    () => productItems
      .map((item) => Number(item.product_id ?? String(item.id || "").replace(/^product-/, "")))
      .filter((value) => Number.isFinite(value) && value > 0)
      .sort((a, b) => a - b)
      .join(","),
    [productItems]
  );
  const packageItems = useMemo(
    () => cart.filter((item) => isPackage(item)),
    [cart]
  );
  const productOnlyCheckout =
    productItems.length > 0 && serviceItems.length === 0 && packageItems.length === 0;
  const serviceOnlyCheckout =
    serviceItems.length > 0 && productItems.length === 0 && packageItems.length === 0;

  useEffect(() => {
    if (!slugLocal || !productIdsKey) {
      setProductMetadataLoading(false);
      return undefined;
    }
    const unresolved = productItems.filter((item) => typeof item.is_digital !== "boolean");
    if (unresolved.length === 0) {
      setProductMetadataLoading(false);
      return undefined;
    }
    let cancelled = false;
    setProductMetadataLoading(true);
    Promise.all(
      unresolved.map(async (item) => {
        const productId = Number(item.product_id ?? String(item.id || "").replace(/^product-/, ""));
        if (!Number.isFinite(productId) || productId <= 0) return null;
        try {
          const { data } = await apiClient.get(`/public/${slugLocal}/products/${productId}`, {
            noCompanyHeader: true,
          });
          return [productId, Boolean(data?.is_digital)];
        } catch {
          return null;
        }
      })
    )
      .then((entries) => {
        if (cancelled) return;
        const metadata = new Map(entries.filter(Boolean));
        if (metadata.size === 0) return;
        setCart((currentCart) => {
          let changed = false;
          const nextCart = currentCart.map((item) => {
            if (!isProduct(item)) return item;
            const productId = Number(item.product_id ?? String(item.id || "").replace(/^product-/, ""));
            if (!metadata.has(productId) || item.is_digital === metadata.get(productId)) return item;
            changed = true;
            return { ...item, is_digital: metadata.get(productId) };
          });
          if (changed) saveCart(nextCart);
          return changed ? nextCart : currentCart;
        });
      })
      .finally(() => {
        if (!cancelled) setProductMetadataLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slugLocal, productIdsKey, productItems]);

  const selectedShippingRateSnapshot = useMemo(() => {
    if (!shippingRates?.selectedRateId) return null;
    const selected = (shippingRates?.rates || []).find(
      (rate) => String(rate?.rate_id || rate?.id || "") === String(shippingRates.selectedRateId)
    );
    return selected || null;
  }, [shippingRates]);
  useEffect(() => {
    if (!slugLocal || physicalProductItems.length === 0) {
      setDeliveryMethodPolicy({
        loading: false,
        source: "default",
        deliveryEnabled: false,
        automationMode: "manual",
        methods: [],
        allowedMethods: [],
        allowedDestinationCountries: [],
        allowedDestinationCountryOptions: [],
        countryCatalog: [],
        addressVerificationEnabled: false,
        internationalAddressVerificationMode: "best_effort",
        originCountry: "",
        ...emptyImportNoticeConfig,
      });
      return;
    }
    let cancelled = false;
    setDeliveryMethodPolicy((prev) => ({ ...prev, loading: true }));
    apiClient
      .get(`/public/${slugLocal}/delivery-methods`)
      .then(({ data }) => {
        if (cancelled) return;
        const methods = Array.isArray(data?.methods)
          ? data.methods
              .filter((row) => row && ["pickup", "shipping", "local_delivery"].includes(String(row.code)))
              .map((row) => ({
                code: String(row.code),
                label: String(row.label || row.code),
                enabled: row.enabled !== false,
              }))
          : [];
        const allowedMethods = Array.isArray(data?.effective_method_codes)
          ? data.effective_method_codes.filter((m) => ["pickup", "shipping", "local_delivery"].includes(String(m)))
          : Array.isArray(data?.allowed_methods)
            ? data.allowed_methods.filter((m) => ["pickup", "shipping", "local_delivery"].includes(String(m)))
            : [];
        const normalizedMethods = methods.length > 0
          ? methods
          : allowedMethods.map((code) => ({
              code,
              label: code === "pickup" ? "Pickup" : code === "shipping" ? "Shipping" : "Local delivery",
              enabled: true,
            }));
        const allowedDestinationCountries = Array.isArray(data?.allowed_destination_countries)
          ? data.allowed_destination_countries
              .map((country) => normalizeDeliveryCountryCode(country))
              .filter(Boolean)
          : [];
        const allowedDestinationCountryOptions = Array.isArray(data?.allowed_destination_country_options)
          ? data.allowed_destination_country_options
              .filter((row) => row && row.code)
              .map((row) => ({
                code: normalizeDeliveryCountryCode(row.code),
                label: row.label || normalizeDeliveryCountryCode(row.code),
              }))
              .filter((row) => row.code)
          : [];
        const countryCatalog = Array.isArray(data?.country_catalog)
          ? data.country_catalog
              .filter((row) => row && row.code)
              .map((row) => ({
                code: normalizeDeliveryCountryCode(row.code),
                label: row.label || normalizeDeliveryCountryCode(row.code),
              }))
              .filter((row) => row.code)
          : [];
        setDeliveryMethodPolicy({
          loading: false,
          source: "api",
          deliveryEnabled: Boolean(data?.delivery_enabled),
          automationMode: String(data?.automation_mode || "manual"),
          methods: normalizedMethods,
          allowedMethods,
          allowedDestinationCountries,
          allowedDestinationCountryOptions,
          countryCatalog,
          addressVerificationEnabled: Boolean(data?.address_verification_enabled),
          internationalAddressVerificationMode: String(data?.international_address_verification_mode || "best_effort"),
          originCountry: normalizeDeliveryCountryCode(data?.origin_country || ""),
          manualShippingPricing: {
            enabled: Boolean(data?.manual_shipping_pricing?.enabled),
            currency: data?.manual_shipping_pricing?.currency || null,
            flatRateCents: data?.manual_shipping_pricing?.flat_rate_cents ?? null,
            freeThresholdCents: data?.manual_shipping_pricing?.free_threshold_cents ?? null,
          },
          internationalDutiesPolicy: String(data?.international_duties_policy || "").trim(),
          dutiesIncluded: Boolean(data?.duties_included),
          importChargesNoticeVersion: String(data?.import_charges_notice_version || "").trim(),
          importChargesNoticeSnapshot:
            data?.import_charges_notice_snapshot && typeof data.import_charges_notice_snapshot === "object"
              ? data.import_charges_notice_snapshot
              : null,
          requireImportChargesAcknowledgement: Boolean(data?.require_import_charges_acknowledgement),
        });
      })
      .catch(() => {
        if (cancelled) return;
        setDeliveryMethodPolicy({
          loading: false,
          source: "fallback",
          deliveryEnabled: false,
          automationMode: "manual",
          methods: [],
          allowedMethods: [],
          allowedDestinationCountries: [],
          allowedDestinationCountryOptions: [],
          countryCatalog: [],
          addressVerificationEnabled: false,
          internationalAddressVerificationMode: "best_effort",
          originCountry: "",
          manualShippingPricing: {
            enabled: false,
            currency: null,
            flatRateCents: null,
            freeThresholdCents: null,
          },
          ...emptyImportNoticeConfig,
        });
      });
    return () => {
      cancelled = true;
    };
  }, [slugLocal, physicalProductItems.length]);

  const serviceSubtotal = serviceItems.reduce((sum, item) => sum + lineSubtotal(item), 0);
  const productSubtotal = productItems.reduce((sum, item) => sum + lineSubtotal(item), 0);
  const packageSubtotal = packageItems.reduce((sum, item) => sum + lineSubtotal(item), 0);
  const totalDiscount = serviceItems.reduce((sum, item) => sum + lineDiscount(item), 0);

  const totalTip = tipAllowedNow
    ? serviceItems.reduce((sum, item) => sum + Number(item.tip_amount || 0), 0)
    : 0;
  const manualShippingDecision = shippingRates?.manualDecision;
  const manualShippingKnown = Boolean(
    manualShippingDecision &&
      manualShippingDecision.eligible &&
      manualShippingDecision.shipping_amount_cents != null
  );
  const shippingRateTotal = manualShippingKnown
    ? Number(manualShippingDecision.shipping_amount_cents || 0) / 100
    : physicalProductItems.length > 0 && selectedShippingRateSnapshot?.amount != null
      ? Number(selectedShippingRateSnapshot.amount || 0)
      : 0;
  const shippingAmountKnown = manualShippingKnown || Boolean(selectedShippingRateSnapshot?.amount != null);

  const totalBeforeDiscount = serviceSubtotal + productSubtotal + packageSubtotal;
  const finalTotal =
    Math.max(0, serviceSubtotal - totalDiscount) +
    totalTip +
    productSubtotal +
    packageSubtotal +
    shippingRateTotal;
  const showOrderBreakdown =
    totalDiscount > 0 ||
    totalTip > 0 ||
    shippingAmountKnown ||
    Math.abs(finalTotal - totalBeforeDiscount) > 0.005;
  const hasPackageRedemptions = serviceItems.some((item) => Boolean(item.client_package_id));
  const packageOnlyTotal = hasPackageRedemptions && productItems.length === 0 && finalTotal <= 0;
  const hasPackagePurchase = packageItems.length > 0;
  const effectivePaymentMode = useMemo(() => {
    if (productItems.length > 0 || packageItems.length > 0) {
      return productCheckoutEnabled ? "pay" : "off";
    }
    return basePaymentMode;
  }, [productItems.length, packageItems.length, productCheckoutEnabled, basePaymentMode]);
  const showCaptureOption = effectivePaymentMode === "capture";
  const showPayOption = effectivePaymentMode === "pay" || effectivePaymentMode === "deposit";
  const showOnlinePayment = effectivePaymentMode !== "off";
  const payButtonLabel = (() => {
    if (productItems.length > 0 || packageItems.length > 0) return "Pay now";
    if (effectivePaymentMode === "deposit") return "Pay Deposit & Book";
    return "Pay & Book";
  })();
  const bookButtonLabel = productItems.length > 0 && serviceItems.length === 0
    ? "Place order"
    : serviceItems.length > 1
    ? "Book appointments"
    : "Book appointment";

  const [holdState, setHoldState] = useState({ overall: null, perItem: {} });

  useEffect(() => {
    if (!holdMinutes || holdMinutes <= 0 || serviceItems.length === 0) {
      setHoldState({ overall: null, perItem: {} });
      return;
    }

    let cancelled = false;

    const runTick = () => {
      const now = Date.now();
      const perItem = {};
      const expiredIds = [];
      let minPositive = null;

      serviceItems.forEach((item) => {
        const started = Date.parse(item?.hold_started_at);
        if (!Number.isFinite(started)) return;
        const remaining = started + holdMinutes * 60 * 1000 - now;
        perItem[item.id] = remaining;
        if (remaining <= 0) {
          expiredIds.push(item.id);
        } else {
          minPositive = minPositive === null ? remaining : Math.min(minPositive, remaining);
        }
      });

      if (expiredIds.length && !cancelled) {
        const filtered = cart.filter((item) => !expiredIds.includes(item.id));
        if (filtered.length !== cart.length) {
          persist(filtered);
          setErr("The hold window expired. Please reselect your service time before checking out.");
          const hasRemainingServices = filtered.some((item) => !isProduct(item));
          if (!hasRemainingServices && slugLocal) {
            releasePendingCheckout({ slug: slugLocal }).catch(() => {});
          }
        }
      }

      if (!cancelled) {
        const overall =
          minPositive !== null
            ? Math.max(0, minPositive)
            : Object.keys(perItem).length
            ? 0
            : null;
        setHoldState({ overall, perItem });
      }

      return expiredIds.length === 0 && minPositive !== null;
    };

    const keepRunning = runTick();
    if (!keepRunning) {
      return;
    }

    const timer = setInterval(() => {
      const active = runTick();
      if (!active) {
        clearInterval(timer);
      }
    }, 1000);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [holdMinutes, serviceItems, cart, slugLocal]);

  const formatHoldCountdown = (ms) => {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  };

  const persist = (newCart) => {
    saveCart(newCart);
    setCart(newCart);
  };

  const resetShippingVerificationState = () => {
    setAddressVerification({ ...EMPTY_ADDRESS_VERIFICATION });
    setAddressConfirmationChecked(false);
  };

  const clearShippingRatesState = () => {
    setShippingRates({ ...EMPTY_SHIPPING_RATES });
  };

  const removeItem = (id) => {
    const newCart = cart.filter((c) => c.id !== id);
    const hasRemainingServices = newCart.some((item) => !isProduct(item) && !isPackage(item));
    setLoading(false);
    setErr("");
    persist(newCart);
    if (!hasRemainingServices && slugLocal) {
      releasePendingCheckout({ slug: slugLocal }).catch(() => {});
    }
    if (newCart.length === 0) {
      onRequestAddService?.();
    }
  };

  const updatePackageQuantity = (id, nextQuantity) => {
    const quantity = Math.max(1, Number(nextQuantity || 1));
    const newCart = cart.map((item) =>
      item.id === id && isPackage(item) ? { ...item, quantity } : item
    );
    persist(newCart);
  };

  const guestOk =
    guest.name.trim() && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(guest.email.trim());
  const allowedDeliveryMethods = useMemo(() => {
    if (physicalProductItems.length === 0) return [];
    let allowed = Array.isArray(deliveryMethodPolicy.allowedMethods)
      ? [...deliveryMethodPolicy.allowedMethods]
      : [];
    allowed = allowed.filter((m) => ["pickup", "shipping", "local_delivery"].includes(m));
    for (const item of physicalProductItems) {
      if (!item?.delivery_methods_override_enabled) continue;
      const itemAllowed = [];
      if (item.delivery_allow_pickup) itemAllowed.push("pickup");
      if (item.delivery_allow_shipping) itemAllowed.push("shipping");
      if (item.delivery_allow_local_delivery) itemAllowed.push("local_delivery");
      allowed = allowed.filter((method) => itemAllowed.includes(method));
    }
    return Array.from(new Set(allowed));
  }, [physicalProductItems, deliveryMethodPolicy.allowedMethods, deliveryMethodPolicy.source]);
  const deliveryMethodOptions = useMemo(() => {
    const labelsFromApi = new Map(
      (Array.isArray(deliveryMethodPolicy.methods) ? deliveryMethodPolicy.methods : []).map((row) => [
        row.code,
        row.label || row.code,
      ])
    );
    return allowedDeliveryMethods.map((value) => [
      value,
      labelsFromApi.get(value) || (
        value === "pickup"
          ? "Pickup"
          : value === "shipping"
            ? "Shipping"
            : "Local delivery"
      ),
    ]);
  }, [allowedDeliveryMethods, deliveryMethodPolicy.methods]);
  const policyIsApiLoadedEmpty =
    physicalProductItems.length > 0 &&
    deliveryMethodPolicy.source === "api" &&
    allowedDeliveryMethods.length === 0;
  const safeDeliveryMethodValue = allowedDeliveryMethods.includes(String(productDelivery.delivery_method || "").toLowerCase())
    ? productDelivery.delivery_method || ""
    : "";
  useEffect(() => {
    if (physicalProductItems.length === 0) return;
    if (allowedDeliveryMethods.length === 0) return;
    const current = String(productDelivery.delivery_method || "").toLowerCase();
    if (allowedDeliveryMethods.includes(current)) return;
    const fallback = allowedDeliveryMethods.length === 1 ? (deliveryMethodOptions[0]?.[0] || "") : "";
    setProductDelivery((prev) => ({ ...prev, delivery_method: fallback }));
  }, [physicalProductItems.length, productDelivery.delivery_method, allowedDeliveryMethods, deliveryMethodOptions]);

  const requiresShippingAddress =
    physicalProductItems.length > 0 &&
    allowedDeliveryMethods.length > 0 &&
    ["shipping", "local_delivery"].includes((productDelivery.delivery_method || "").toLowerCase());
  const currentShippingCountry = normalizeDeliveryCountryCode(productDelivery.shipping?.country || "");
  const isDomesticVerificationCountry = ["CA", "US"].includes(currentShippingCountry);
  const shippingRegionRequired = currentShippingCountry === "CA" || currentShippingCountry === "US";
  const shippingPostalRequired = currentShippingCountry === "CA" || currentShippingCountry === "US";
  const verificationEnabled =
    requiresShippingAddress &&
    (productDelivery.delivery_method || "").toLowerCase() === "shipping" &&
    (
      (isDomesticVerificationCountry && Boolean(deliveryMethodPolicy.addressVerificationEnabled)) ||
      (!isDomesticVerificationCountry && ["best_effort", "required", "disabled"].includes(String(deliveryMethodPolicy.internationalAddressVerificationMode || "")))
    );
  const hasAcceptedShippingVerification = !verificationEnabled || addressVerification.status === "verified";
  const deliveryErrors = useMemo(() => {
    if (physicalProductItems.length === 0) return [];
    const errors = [];
    if (productMetadataLoading) {
      errors.push("Checking product delivery requirements.");
      return errors;
    }
    if (!allowedDeliveryMethods.length) {
      errors.push("This Product is not currently available for delivery or pickup.");
      return errors;
    }
    if (allowedDeliveryMethods.length > 1 && !String(productDelivery.delivery_method || "").trim()) {
      errors.push("Choose how you would like to receive your order.");
      return errors;
    }
    const shipping = productDelivery.shipping || {};
    if (requiresShippingAddress) {
      const countryCode = normalizeDeliveryCountryCode(shipping.country);
      const required = [
        ["name", "Full name"],
        ["phone", "Phone"],
        ["address1", "Address line 1"],
        ["city", "City"],
        ["country", "Country"],
      ];
      if (countryCode === "CA" || countryCode === "US") {
        required.push(["region", "State/Province/Region"]);
        required.push(["postal_code", "Postal/ZIP code"]);
      }
      required.forEach(([field, label]) => {
        if (!String(shipping[field] || "").trim()) errors.push(`${label} is required for shipping.`);
      });
      const postalCode = String(shipping.postal_code || "").trim();
      const allowedDestinationCountries = Array.isArray(deliveryMethodPolicy.allowedDestinationCountries)
        ? deliveryMethodPolicy.allowedDestinationCountries
        : [];
      if (countryCode && allowedDestinationCountries.length > 0 && !allowedDestinationCountries.includes(countryCode)) {
        errors.push("Shipping is not currently available to this destination.");
      }
      if (countryCode === "CA" && postalCode && !/^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/.test(postalCode)) {
        errors.push("Enter a valid Canadian postal code.");
      }
      if (countryCode === "US" && postalCode && !/^\d{5}(-\d{4})?$/.test(postalCode)) {
        errors.push("Enter a valid US ZIP code.");
      }
    }
    return errors;
  }, [physicalProductItems.length, productMetadataLoading, productDelivery, requiresShippingAddress, allowedDeliveryMethods, deliveryMethodPolicy.allowedDestinationCountries]);

  const deliveryCountryOptions = useMemo(() => {
    const countries = Array.isArray(deliveryMethodPolicy.allowedDestinationCountryOptions) &&
      deliveryMethodPolicy.allowedDestinationCountryOptions.length > 0
      ? deliveryMethodPolicy.allowedDestinationCountryOptions
      : Array.isArray(deliveryMethodPolicy.allowedDestinationCountries)
        ? deliveryMethodPolicy.allowedDestinationCountries.map((code) => ({
            code,
            label: FALLBACK_COUNTRY_LABELS[code] || code,
          }))
        : [];
    return countries.map((country) => ({
      code: normalizeDeliveryCountryCode(country.code),
      label: country.label || FALLBACK_COUNTRY_LABELS[country.code] || country.code,
    })).filter((country) => country.code);
  }, [deliveryMethodPolicy.allowedDestinationCountries, deliveryMethodPolicy.allowedDestinationCountryOptions]);
  const isCrossBorderShipping = useMemo(() => {
    if (!requiresShippingAddress) return false;
    const origin = normalizeDeliveryCountryCode(deliveryMethodPolicy.originCountry || "");
    const destination = currentShippingCountry;
    if (!origin || !destination) return false;
    return origin !== destination;
  }, [requiresShippingAddress, deliveryMethodPolicy.originCountry, currentShippingCountry]);
  const checkoutTotalLabel = isCrossBorderShipping && shippingRateTotal > 0
    ? "Total charged now"
    : !showOnlinePayment && serviceItems.length > 0
    ? "Amount due"
    : "Total";
  const mobileCheckoutTotal = (
    <Stack
      direction="row"
      justifyContent="space-between"
      alignItems="center"
      sx={{ display: { xs: "flex", sm: "none" }, mb: 1 }}
    >
      <Typography variant="body2" sx={{ fontWeight: 700 }}>{checkoutTotalLabel}</Typography>
      <Typography variant="body2" sx={{ fontWeight: 800 }}>
        {formatCurrency(finalTotal, currencyCode)}
      </Typography>
    </Stack>
  );
  const currentImportChargesNotice = useMemo(
    () => shippingRates.importChargesNoticeSnapshot || deliveryMethodPolicy.importChargesNoticeSnapshot || null,
    [shippingRates.importChargesNoticeSnapshot, deliveryMethodPolicy.importChargesNoticeSnapshot]
  );
  const requireImportChargesAcknowledgement = Boolean(
    isCrossBorderShipping &&
      (shippingRates.requireImportChargesAcknowledgement ||
        deliveryMethodPolicy.requireImportChargesAcknowledgement)
  );
  const importChargesNoticeVersion = String(
    shippingRates.importChargesNoticeVersion ||
      deliveryMethodPolicy.importChargesNoticeVersion ||
      currentImportChargesNotice?.version ||
      ""
  ).trim();
  const importChargesAcknowledgementQuotePublicId = String(
    selectedShippingRateSnapshot?.quote_public_id || ""
  ).trim();
  const importChargesAcknowledgementCustomsHash = String(
    selectedShippingRateSnapshot?.customs_snapshot_hash || ""
  ).trim();
  const productCartFingerprintValue = useMemo(() => {
    const rows = productItems
      .map((item) => ({
        product_id: Number(item.product_id ?? String(item.id).replace(/^product-/, "")),
        variant_id: item.variant_id != null ? Number(item.variant_id) : null,
        quantity: getQuantity(item),
      }))
      .filter((row) => Number.isFinite(row.product_id) && row.product_id > 0 && row.quantity > 0)
      .sort((a, b) => (a.product_id - b.product_id) || ((a.variant_id || 0) - (b.variant_id || 0)) || (a.quantity - b.quantity));
    return JSON.stringify(rows);
  }, [productItems]);
  const manualShippingPricingActive = Boolean(
    deliveryMethodPolicy.automationMode === "manual" &&
      deliveryMethodPolicy.manualShippingPricing?.enabled
  );
  const checkoutRequestFingerprint = useMemo(() => JSON.stringify({
    slug: slugLocal || companySlug || "",
    customer: {
      name: client?.full_name || guest.name || "",
      email: client?.email || guest.email || "",
      phone: client?.phone || productDelivery.shipping?.phone || "",
    },
    cart: cart.map((item) => ({
      id: item.id,
      type: item.type,
      quantity: getQuantity(item),
      product_id: item.product_id,
      variant_id: item.variant_id,
      service_id: item.service_id,
      artist_id: item.artist_id,
      date: item.date,
      start_time: item.start_time,
      addon_ids: item.addon_ids,
      tip_amount: item.tip_amount,
      package_template_id: item.package_template_id,
    })),
    delivery_method: productDelivery.delivery_method || "",
    shipping: requiresShippingAddress ? {
      name: productDelivery.shipping?.name || "",
      phone: productDelivery.shipping?.phone || "",
      address1: productDelivery.shipping?.address1 || "",
      address2: productDelivery.shipping?.address2 || "",
      city: productDelivery.shipping?.city || "",
      region: productDelivery.shipping?.region || "",
      postal_code: productDelivery.shipping?.postal_code || "",
      country: normalizeDeliveryCountryCode(productDelivery.shipping?.country || ""),
      instructions: productDelivery.shipping?.instructions || "",
    } : null,
  }), [
    slugLocal,
    companySlug,
    cart,
    client?.full_name,
    client?.email,
    client?.phone,
    guest.name,
    guest.email,
    productDelivery.delivery_method,
    productDelivery.shipping?.name,
    productDelivery.shipping?.phone,
    productDelivery.shipping?.address1,
    productDelivery.shipping?.address2,
    productDelivery.shipping?.city,
    productDelivery.shipping?.region,
    productDelivery.shipping?.postal_code,
    productDelivery.shipping?.country,
    productDelivery.shipping?.instructions,
    requiresShippingAddress,
  ]);
  const [checkoutRequestGeneration, setCheckoutRequestGeneration] = useState(0);
  const checkoutRequestKey = useMemo(
    () => getOrCreateCheckoutRequestKey({
      scope: slugLocal || companySlug,
      fingerprint: checkoutRequestFingerprint,
    }),
    [slugLocal, companySlug, checkoutRequestFingerprint, checkoutRequestGeneration]
  );
  const currentDeliveryCountryValue = useMemo(() => {
    const current = normalizeDeliveryCountryCode(productDelivery.shipping?.country);
    if (!current) return "";
    if (!deliveryCountryOptions.length) return "";
    return deliveryCountryOptions.some((country) => country.code === current) ? current : "";
  }, [deliveryCountryOptions, productDelivery.shipping?.country]);
  useEffect(() => {
    if (!requiresShippingAddress) return;
    if (!deliveryCountryOptions.length) return;
    const current = normalizeDeliveryCountryCode(productDelivery.shipping?.country);
    if (current && deliveryCountryOptions.some((country) => country.code === current)) return;
    const fallback = deliveryCountryOptions[0]?.code || "";
    if (!fallback) return;
    setProductDelivery((prev) => ({
      ...prev,
      shipping: {
        ...(prev.shipping || {}),
        country: fallback,
      },
    }));
  }, [requiresShippingAddress, deliveryCountryOptions, productDelivery.shipping?.country]);
  const deliveryOk = deliveryErrors.length === 0;

  useEffect(() => {
    const dependency = [
      currentShippingCountry,
      productCartFingerprintValue,
      shippingRates.quoteToken || "",
      importChargesAcknowledgementCustomsHash,
    ].join("|");
    if (!lastAckDependencyRef.current) {
      lastAckDependencyRef.current = dependency;
      return;
    }
    if (lastAckDependencyRef.current !== dependency) {
      lastAckDependencyRef.current = dependency;
      setImportChargesAcknowledged(false);
    }
  }, [
    currentShippingCountry,
    productCartFingerprintValue,
    shippingRates.quoteToken,
    importChargesAcknowledgementCustomsHash,
  ]);

  const continuation = useCheckoutContinuation({
    physicalProductItems,
    deliveryMethodPolicy,
    requiresShippingAddress,
    deliveryOk,
    slugLocal,
    verificationEnabled,
    hasAcceptedShippingVerification,
    setShippingRates,
    EMPTY_SHIPPING_RATES,
    productDelivery,
    deliveryMethodOptions,
    normalizeDeliveryCountryCode,
    productItems,
    getQuantity,
    addressVerification,
    manualShippingPricingActive,
    shippingEstimateRefreshNonce,
    productMetadataLoading,
    setErr,
    deliveryErrors,
    shippingRates,
    manualShippingKnown,
    isCrossBorderShipping,
    requireImportChargesAcknowledgement,
    importChargesAcknowledged,
    setProductDelivery,
    allowedDeliveryMethods,
    clearShippingRatesState,
    resetShippingVerificationState,
    setImportChargesAcknowledged,
    setAddressVerification,
    setGuest,
    guest,
    serviceItems,
    setActiveItemId,
    setDlgAddonOpen,
    setDlgSvcOpen,
    activeItemId,
    cart,
    getAddonIds,
    getAddons,
    recomputeTip,
    persist,
    couponCode,
    setCouponError,
    isProduct,
    isPackage,
    setCouponCode,
    client,
    clientPackages,
    packagesForService,
    finalTotal,
    tipAllowedNow,
    showPublicBookingUnavailable,
    displayCurrency,
    selectedShippingRateSnapshot,
    importChargesNoticeVersion,
    importChargesAcknowledgementQuotePublicId,
    currentShippingCountry,
    importChargesAcknowledgementCustomsHash,
    stashProductOrder,
    clearProductOrderStash,
    setCart,
    setDone,
    onSuccess,
    loading,
    packageItems,
    productCheckoutEnabled,
    packageOnlyTotal,
    setLoading,
    normalizeProductOrder,
    companySlug,
    showPayOption,
    effectivePaymentMode,
    checkoutRequestKey,
    setCheckoutRequestGeneration,
    setShippingEstimateRefreshNonce,
    showCaptureOption,
    cardOnFileEnabled,
    cardOnFileConsentAccepted,
    setCardOnFileConsentError,
    policy,
    setClient,
    onRequestAddService,
    productsReturnTo,
    isCustomDomain,
    navigate,
    done,
    embedSuffix,
    basePath,
    primaryButtonSx,
    outlineButtonSx,
    textButtonSx,
    borderColor,
    checkoutTextColor,
    infoAlertSx,
    onBack,
  });
  if (continuation.early) return continuation.early;
  return (
    <CheckoutFormView
      borderColor={borderColor}
      checkoutTextColor={checkoutTextColor}
      checkoutHeadingColor={checkoutHeadingColor}
      holdMinutes={holdMinutes}
      serviceItems={serviceItems}
      holdState={holdState}
      infoAlertSx={infoAlertSx}
      formatHoldCountdown={formatHoldCountdown}
      checkoutSectionColor={checkoutSectionColor}
      cart={cart}
      lineSubtotal={lineSubtotal}
      client={client}
      packagesForService={packagesForService}
      isProduct={isProduct}
      getQuantity={getQuantity}
      removeItem={removeItem}
      currencyCode={currencyCode}
      isPackage={isPackage}
      updatePackageQuantity={updatePackageQuantity}
      lineDiscount={lineDiscount}
      tipAllowedNow={tipAllowedNow}
      getAddons={getAddons}
      packagesLoading={packagesLoading}
      packagesError={packagesError}
      setCouponExpanded={setCouponExpanded}
      couponExpanded={couponExpanded}
      couponError={couponError}
      textButtonSx={textButtonSx}
      couponCode={couponCode}
      setCouponCode={setCouponCode}
      loading={loading}
      outlineButtonSx={outlineButtonSx}
      showOrderBreakdown={showOrderBreakdown}
      totalBeforeDiscount={totalBeforeDiscount}
      totalDiscount={totalDiscount}
      totalTip={totalTip}
      shippingAmountKnown={shippingAmountKnown}
      shippingRateTotal={shippingRateTotal}
      isCrossBorderShipping={isCrossBorderShipping}
      paymentsEnabled={paymentsEnabled}
      checkoutTotalLabel={checkoutTotalLabel}
      finalTotal={finalTotal}
      requireImportChargesAcknowledgement={requireImportChargesAcknowledgement}
      importChargesAcknowledged={importChargesAcknowledged}
      setImportChargesAcknowledged={setImportChargesAcknowledged}
      physicalProductItems={physicalProductItems}
      safeDeliveryMethodValue={safeDeliveryMethodValue}
      CHECKOUT_SELECT_MENU_PROPS={CHECKOUT_SELECT_MENU_PROPS}
      deliveryMethodPolicy={deliveryMethodPolicy}
      deliveryMethodOptions={deliveryMethodOptions}
      policyIsApiLoadedEmpty={policyIsApiLoadedEmpty}
      requiresShippingAddress={requiresShippingAddress}
      productDelivery={productDelivery}
      shippingRegionRequired={shippingRegionRequired}
      shippingPostalRequired={shippingPostalRequired}
      normalizeDeliveryCountryCode={normalizeDeliveryCountryCode}
      deliveryCountryOptions={deliveryCountryOptions}
      currentDeliveryCountryValue={currentDeliveryCountryValue}
      verificationEnabled={verificationEnabled}
      addressVerification={addressVerification}
      deliveryOk={deliveryOk}
      resetShippingVerificationState={resetShippingVerificationState}
      clearShippingRatesState={clearShippingRatesState}
      addressConfirmationChecked={addressConfirmationChecked}
      setAddressConfirmationChecked={setAddressConfirmationChecked}
      currentImportChargesNotice={currentImportChargesNotice}
      manualShippingPricingActive={manualShippingPricingActive}
      manualShippingKnown={manualShippingKnown}
      manualShippingDecision={manualShippingDecision}
      shippingRates={shippingRates}
      setShippingRates={setShippingRates}
      setProductDelivery={setProductDelivery}
      err={err}
      packageOnlyTotal={packageOnlyTotal}
      effectivePaymentMode={effectivePaymentMode}
      productItems={productItems}
      hasPackagePurchase={hasPackagePurchase}
      businessName={businessName}
      showCaptureOption={showCaptureOption}
      packageItems={packageItems}
      cardOnFileConsentAccepted={cardOnFileConsentAccepted}
      setCardOnFileConsentAccepted={setCardOnFileConsentAccepted}
      setCardOnFileConsentError={setCardOnFileConsentError}
      companySlug={companySlug}
      policy={policy}
      cardOnFileConsentError={cardOnFileConsentError}
      mobileCheckoutActionSx={mobileCheckoutActionSx}
      mobileCheckoutTotal={mobileCheckoutTotal}
      primaryButtonSx={primaryButtonSx}
      showOnlinePayment={showOnlinePayment}
      showPayOption={showPayOption}
      payButtonLabel={payButtonLabel}
      bookButtonLabel={bookButtonLabel}
      guest={guest}
      setLoginDialogOpen={setLoginDialogOpen}
      setRegisterDialogOpen={setRegisterDialogOpen}
      guestOk={guestOk}
      productOnlyCheckout={productOnlyCheckout}
      serviceOnlyCheckout={serviceOnlyCheckout}
      onRequestAddService={onRequestAddService}
      servicesBrowsePath={servicesBrowsePath}
      navigate={navigate}
      onBack={onBack}
      dlgSvcOpen={dlgSvcOpen}
      setDlgSvcOpen={setDlgSvcOpen}
      dlgAddonOpen={dlgAddonOpen}
      setDlgAddonOpen={setDlgAddonOpen}
      addonOpts={addonOpts}
      getAddonIds={getAddonIds}
      loginDialogOpen={loginDialogOpen}
      registerDialogOpen={registerDialogOpen}
      setForgotDialogOpen={setForgotDialogOpen}
      forgotDialogOpen={forgotDialogOpen}
      publicUpgradeOpen={publicUpgradeOpen}
      publicUpgradeMessage={publicUpgradeMessage}
      companyContactEmail={companyContactEmail}
      companyContactPhone={companyContactPhone}
      setPublicUpgradeOpen={setPublicUpgradeOpen}
      handleDeliveryMethod={continuation.handleDeliveryMethod}
      handleShippingField={continuation.handleShippingField}
      verifyAddressForShipping={continuation.verifyAddressForShipping}
      acceptVerifiedAddress={continuation.acceptVerifiedAddress}
      handleGuest={continuation.handleGuest}
      openAddons={continuation.openAddons}
      pickService={continuation.pickService}
      activeItem={continuation.activeItem}
      toggleAddon={continuation.toggleAddon}
      applyCoupon={continuation.applyCoupon}
      removeCouponFromItem={continuation.removeCouponFromItem}
      setTipPercent={continuation.setTipPercent}
      setTipCustomPercent={continuation.setTipCustomPercent}
      setTipAmount={continuation.setTipAmount}
      setPackageForItem={continuation.setPackageForItem}
      bookWithoutPayment={continuation.bookWithoutPayment}
      payAndBook={continuation.payAndBook}
      saveCardAndBook={continuation.saveCardAndBook}
      handleLoginSuccess={continuation.handleLoginSuccess}
      handleRegisterSuccess={continuation.handleRegisterSuccess}
      handleContinueProductShopping={continuation.handleContinueProductShopping}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Wrapper: initialize Stripe for pay-now OR card-on-file */
export default function Checkout(props) {
  const { disableShell = false, slugOverride } = props;
  const params = useParams();
  const location = useLocation();
  const searchParams = useMemo(
    () => new URLSearchParams(location.search || ""),
    [location.search]
  );
  const urlPathFirst = (() => {
    try {
      const seg = (window.location.pathname || '').split('/').filter(Boolean)[0];
      return seg || null;
    } catch { return null; }
  })();
  const lsSite = (() => { try { return localStorage.getItem('site'); } catch { return null; } })();
  const pickSlug = (...cands) => {
    for (const c of cands) {
      if (!c) continue;
      return c;
    }
    return null;
  };
  const companySlug = pickSlug(props.companySlug, params.slug, lsSite, urlPathFirst);

  const [ready, setReady] = useState(false);
  const [sitePayload, setSitePayload] = useState(null);
  const [siteLoading, setSiteLoading] = useState(false);
  const [paymentsEnabled, setPaymentsEnabled] = useState(false);
  const [cardOnFileEnabled, setCardOnFileEnabled] = useState(false);
  const [tipEnabled, setTipEnabled] = useState(true);
  const [displayCurrency, setDisplayCurrency] = useState(() => getActiveCurrency());
  const [policy, setPolicy] = useState(null);
  const [productCheckoutPolicy, setProductCheckoutPolicy] = useState(null);
  const [holdMinutes, setHoldMinutes] = useState(null);
  const [companyContactEmail, setCompanyContactEmail] = useState("");
  const [companyContactPhone, setCompanyContactPhone] = useState("");

  useEffect(() => {
    let mounted = true;

    if (!companySlug) {
      setReady(true);
      return () => { mounted = false; };
    }

    (async () => {
      try {
        const [infoRes, policyRes, reviewsRes] = await Promise.all([
          apiClient.get(`/public/${companySlug}/company-info`),
          apiClient.get(`/public/${companySlug}/payments-policy`).catch(() => ({ data: null })),
          apiClient.get(`/public/${companySlug}/reviews-settings`).catch(() => ({ data: null })),
        ]);
        if (!mounted) return;

        const info = infoRes?.data || {};
        const policyData = policyRes?.data || null;
        const reviewsData = reviewsRes?.data || null;

        const legacyEnable = Boolean(info?.enable_stripe_payments);
        const legacyProductEnable =
          info?.enable_product_payments == null
            ? legacyEnable
            : Boolean(info?.enable_product_payments);
        const legacyAllowCard = Boolean(info?.allow_card_on_file);
        const bookingMode = String(
          policyData?.booking_payment?.mode ||
          policyData?.mode ||
          (legacyAllowCard ? "capture" : legacyEnable ? "pay" : "off")
        ).toLowerCase();
        const cardOnFile = bookingMode === "capture";
        const payNow = bookingMode === "pay" || bookingMode === "deposit";
        const productPolicy = policyData?.product_checkout && typeof policyData.product_checkout === "object"
              ? policyData.product_checkout
              : {
                  enabled: legacyProductEnable,
                  mode: "pay",
                  requires_payment_during_checkout: true,
                  card_on_file_supported: false,
                };
        const hold = Number(info?.booking_hold_minutes ?? 0);

        setPaymentsEnabled(payNow);
        setCardOnFileEnabled(cardOnFile);
        setPolicy(policyData);
        setProductCheckoutPolicy(productPolicy);
        setHoldMinutes(Number.isFinite(hold) && hold > 0 ? hold : null);
        setCompanyContactEmail(String(info?.contact_email || info?.email || "").trim());
        setCompanyContactPhone(String(info?.phone || "").trim());
        setTipEnabled(reviewsData?.include_tip_checkout !== false);

        const rawCurrency = normalizeCurrency(info?.display_currency);
        const inferredCurrency = resolveCurrencyForCountry(info?.country_code || info?.tax_country_code || '');
        const effectiveCurrency = rawCurrency || inferredCurrency || 'USD';
        setDisplayCurrency(effectiveCurrency);
        setActiveCurrency(effectiveCurrency);
      } catch {
        if (!mounted) return;
        setPaymentsEnabled(false);
        setCardOnFileEnabled(false);
        setPolicy(null);
        setProductCheckoutPolicy(null);
        setHoldMinutes(null);
        setTipEnabled(true);
      } finally {
        if (mounted) setReady(true);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [companySlug]);

  useEffect(() => {
    let mounted = true;
    if (!companySlug) {
      setSitePayload(null);
      setSiteLoading(false);
      return () => {
        mounted = false;
      };
    }
    setSiteLoading(true);
    publicSite
      .getWebsiteShell(companySlug)
      .then((data) => {
        if (!mounted) return;
        setSitePayload(data || null);
      })
      .catch(() => {
        if (!mounted) return;
        setSitePayload(null);
      })
      .finally(() => {
        if (!mounted) return;
        setSiteLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [companySlug]);

  const renderShell = (node) => {
    if (disableShell) {
      return node;
    }
    if (!companySlug) {
      return node;
    }
    return (
      <TenantTransactionalShell
        slugOverride={companySlug}
        activeKey="__basket"
        pagePath="products"
        returnTo={searchParams.get("return_to") || searchParams.get("returnTo") || ""}
        legacyShell={(child) => (
          <SiteFrame
            slug={companySlug}
            activeKey="__basket"
            initialSite={sitePayload || undefined}
            disableFetch={Boolean(sitePayload)}
            wrapChildrenInContainer={false}
          >
            {child}
          </SiteFrame>
        )}
      >
        {node}
      </TenantTransactionalShell>
    );
  };

  if (!ready || (siteLoading && !sitePayload)) {
    return renderShell(
      <Box p={3} maxWidth={600} mx="auto">
        <CircularProgress />
      </Box>
    );
  }

  return renderShell(
    <CheckoutFormCore
      {...props}
      companySlug={companySlug}
      slugOverride={slugOverride}
      businessName={
        sitePayload?.company_name ||
        sitePayload?.company?.name ||
        sitePayload?.name ||
        sitePayload?.site_title ||
        undefined
      }
      paymentsEnabled={paymentsEnabled}
      tipEnabled={tipEnabled}
      cardOnFileEnabled={cardOnFileEnabled}
      displayCurrency={displayCurrency}
        policy={policy}
        productCheckout={productCheckoutPolicy}
        holdMinutes={holdMinutes}
      contactEmail={companyContactEmail}
      contactPhone={companyContactPhone}
    />
  );
}
