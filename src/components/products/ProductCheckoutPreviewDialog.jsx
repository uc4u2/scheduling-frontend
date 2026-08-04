import React, { useEffect, useMemo, useState } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  Grid,
  IconButton,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import CloseIcon from "@mui/icons-material/Close";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ContentCopyOutlinedIcon from "@mui/icons-material/ContentCopyOutlined";
import RefreshOutlinedIcon from "@mui/icons-material/RefreshOutlined";

import api from "../../utils/api";
import { formatCurrency } from "../../utils/formatters";
import { getActiveCurrency } from "../../utils/currency";

const defaultDestination = {
  address1: "",
  city: "",
  region: "",
  postal_code: "",
  country: "",
};

const methodLabel = {
  pickup: "Pickup",
  shipping: "Shipping",
  local_delivery: "Local delivery",
  digital: "Digital delivery",
};

const previewModeLabel = {
  simple_product_preview: "Simple Product preview",
  draft_variant_preview: "Draft Variant preview",
  active_selling_preview: "Active selling preview",
};

const priceSourceLabel = {
  variant_override: "Variant price",
  product_price: "Uses Product price",
};

const resolvedPreviewCurrency = (currency) => currency || getActiveCurrency();
const formatMoney = (value, currency) => formatCurrency(Number(value || 0), resolvedPreviewCurrency(currency));
const asArray = (value) => (Array.isArray(value) ? value : []);

export const buildProductCheckoutPreviewSummary = (preview) => {
  if (!preview) return "";
  const lines = [
    "Product checkout preview",
    "",
    `Currency: ${resolvedPreviewCurrency(preview.currency)}`,
    `Products: ${formatMoney(preview?.customer_view?.product_subtotal, preview.currency)}`,
  ];
  (preview?.product_lines || []).forEach((line) => {
    const variantSuffix = line?.variant_label ? ` — ${line.variant_label}` : "";
    lines.push(
      `${line.name || "Product"}${variantSuffix} x${line.quantity || 0}: ${formatMoney(line.line_total, preview.currency)}`
    );
  });
  if (preview?.delivery?.method === "pickup") {
    lines.push(`Pickup: ${formatMoney(preview?.customer_view?.shipping_amount, preview.currency)}`);
  } else if (preview?.delivery?.method === "local_delivery") {
    lines.push(`Local delivery: ${formatMoney(preview?.customer_view?.shipping_amount, preview.currency)}`);
  } else if (preview?.delivery?.method === "shipping") {
    lines.push(`Shipping: ${formatMoney(preview?.customer_view?.shipping_amount, preview.currency)}`);
  }
  lines.push(`Known amount before tax: ${formatMoney(preview?.customer_view?.known_amount_before_tax, preview.currency)}`);
  lines.push(
    `Tax: ${preview?.tax?.handling_mode === "stripe_checkout_automatic_tax" ? "Calculated during Stripe Checkout" : preview?.tax?.message || "Not configured"}`
  );
  lines.push(
    `Final customer total: ${
      preview?.customer_view?.final_total_status === "provider_calculated"
        ? "Finalized during checkout"
        : formatMoney(preview?.customer_view?.final_total, preview.currency)
    }`
  );
  lines.push("");
  lines.push("Preview only. No Product Order, payment, label, stock reservation, or customer email was created.");
  return lines.join("\n");
};

export const buildProductSellerEstimateSummary = (preview) => {
  const seller = preview?.seller_view;
  if (!preview || !seller) return "";
  const currency = resolvedPreviewCurrency(seller.currency || preview.currency);
  const lines = [
    "Seller estimate",
    "",
    `Currency: ${currency}`,
    `Estimate status: ${seller.status || "unavailable"}`,
    "",
  ];
  (seller.lines || []).forEach((line) => {
    lines.push(`${line.name || "Product"}${line.variant_label ? ` — ${line.variant_label}` : ""}`);
    if (line.variant_sku) lines.push(`Variant SKU: ${line.variant_sku}`);
    lines.push(`Quantity: ${line.quantity || 0}`);
    lines.push(`Selling price: ${formatMoney(line.unit_price, currency)}`);
    lines.push(`Revenue: ${formatMoney(line.line_total, currency)}`);
    lines.push(`Product cost: ${line.product_cost_total != null ? formatMoney(line.product_cost_total, currency) : "Unavailable"}`);
    lines.push(`Price source: ${line.price_source_label || "Uses Product price"}`);
    lines.push("");
  });
  lines.push(`Estimated order contribution: ${seller?.margin?.estimated_order_contribution != null ? formatMoney(seller.margin.estimated_order_contribution, currency) : "Unavailable"}`);
  lines.push(`Excluded: ${(seller?.excluded_costs || []).join(", ")}`);
  return lines.join("\n");
};

export const effectiveProductPreviewMethods = (product, globalDeliveryPolicy) => {
  if (!product) return [];
  if (product.is_digital) return ["digital"];
  if (!globalDeliveryPolicy?.enabled) return [];
  const workspace = [
    globalDeliveryPolicy.allow_shipping ? "shipping" : null,
    globalDeliveryPolicy.allow_pickup ? "pickup" : null,
    globalDeliveryPolicy.allow_local_delivery ? "local_delivery" : null,
  ].filter(Boolean);
  if (!product.delivery_methods_override_enabled) return workspace;
  const productAllowed = [
    product.delivery_allow_shipping ? "shipping" : null,
    product.delivery_allow_pickup ? "pickup" : null,
    product.delivery_allow_local_delivery ? "local_delivery" : null,
  ].filter(Boolean);
  return workspace.filter((code) => productAllowed.includes(code));
};

const defaultMethodForProduct = (product, globalDeliveryPolicy) => {
  const methods = effectiveProductPreviewMethods(product, globalDeliveryPolicy);
  if (methods.includes("shipping")) return "shipping";
  if (methods.includes("pickup")) return "pickup";
  if (methods.includes("local_delivery")) return "local_delivery";
  return methods[0] || (product?.is_digital ? "digital" : "");
};

const normalizePreviewError = (message) => {
  const text = String(message || "").trim();
  switch (text) {
    case "PRODUCT_VARIANT_REQUIRED":
      return "Choose a complete Variant combination before previewing checkout.";
    case "PRODUCT_VARIANT_NOT_FOUND":
      return "That Variant is no longer available for this Product.";
    case "PRODUCT_VARIANT_UNAVAILABLE":
      return "This Variant is not currently sellable.";
    case "PRODUCT_VARIANT_OUT_OF_STOCK":
      return "This Variant is out of stock for the requested quantity.";
    case "PRODUCT_VARIANT_SELLING_DISABLED":
      return "Variant selling is temporarily disabled by runtime configuration.";
    case "PRODUCT_VARIANT_CONFIGURATION_INVALID":
      return "This Variant configuration is no longer valid. Refresh the Product configuration and try again.";
    default:
      return text || "Unable to preview customer checkout.";
  }
};

const normalizeVariantConfig = (payload) => ({
  variant_mode: String(payload?.variant_mode || "none").toLowerCase(),
  runtime_selling_enabled: Boolean(payload?.runtime_selling_enabled),
  options: asArray(payload?.options).map((option) => ({
    id: option.id,
    name: option.name || "Option",
    values: asArray(option.values).map((value) => ({
      id: value.id,
      value: value.value || "",
      swatch_color: value.swatch_color || "",
      image_id: value.image_id ?? null,
    })),
  })),
  variants: asArray(payload?.variants).map((variant) => ({
    id: variant.id,
    selection: asArray(variant.selection).map((row) => ({
      option_id: row.option_id,
      option_name: row.option_name || "",
      value_id: row.value_id,
      value: row.value || "",
    })),
    sku: variant.sku || "",
    effective_price: variant.effective_price,
    price_override: variant.price_override,
    qty_on_hand: variant.qty_on_hand,
    is_active: variant.is_active !== false,
    primary_image_id: variant.primary_image_id ?? null,
  })),
});

const formatVariantOptions = (options) =>
  asArray(options)
    .map((row) => `${row.option_name}: ${row.value}`)
    .join(" • ");

const variantAvailabilityLabel = (variant, trackStock = true) => {
  if (!variant) return "Variant required";
  if (variant.is_active === false) return "Not currently sellable";
  if (trackStock && Number(variant.qty_on_hand || 0) <= 0) return "Out of stock";
  return "Available";
};

const productSupportsVariants = (product) => ["draft", "active"].includes(String(product?.variant_mode || "none").toLowerCase());

const PreviewLineImage = ({ image, alt }) => {
  const src = image?.url_public || image?.url || image?.src || "";
  if (!src) return null;
  return (
    <Box
      component="img"
      src={src}
      alt={alt}
      sx={{
        width: 56,
        height: 56,
        objectFit: "cover",
        borderRadius: 1.5,
        border: "1px solid",
        borderColor: "divider",
      }}
    />
  );
};

export default function ProductCheckoutPreviewDialog({
  open,
  onClose,
  token,
  products = [],
  initialProductId = null,
  initialVariantId = null,
  globalDeliveryPolicy = null,
  title = "Preview customer checkout",
  onNotify,
  externalStateFingerprint = "",
  onOpenProductCost = null,
  onOpenProduct = null,
  deliverySetupHref = "/manager/advanced-management?panel=easypost-shipping",
}) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const auth = useMemo(() => ({ headers: { Authorization: `Bearer ${token}` } }), [token]);
  const productOptions = useMemo(
    () => (Array.isArray(products) ? products.filter((row) => row && row.id != null) : []),
    [products]
  );
  const [selectedProductId, setSelectedProductId] = useState(initialProductId || productOptions[0]?.id || "");
  const [quantity, setQuantity] = useState("1");
  const [deliveryMethod, setDeliveryMethod] = useState("");
  const [destination, setDestination] = useState(defaultDestination);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [stale, setStale] = useState(false);
  const [selectedRateReference, setSelectedRateReference] = useState("");
  const [acceptedAddressChoice, setAcceptedAddressChoice] = useState("");
  const [variantConfig, setVariantConfig] = useState(null);
  const [variantLoading, setVariantLoading] = useState(false);
  const [variantSelection, setVariantSelection] = useState({});

  const selectedProduct = useMemo(
    () => productOptions.find((row) => Number(row.id) === Number(selectedProductId)) || null,
    [productOptions, selectedProductId]
  );
  const allowedMethods = useMemo(
    () => effectiveProductPreviewMethods(selectedProduct, globalDeliveryPolicy),
    [selectedProduct, globalDeliveryPolicy]
  );

  useEffect(() => {
    if (!open) return;
    const nextProductId = initialProductId || productOptions[0]?.id || "";
    setSelectedProductId(nextProductId);
  }, [initialProductId, open, productOptions]);

  useEffect(() => {
    if (!selectedProduct) return;
    const nextMethod = defaultMethodForProduct(selectedProduct, globalDeliveryPolicy);
    setDeliveryMethod((prev) => (allowedMethods.includes(prev) || prev === "digital" ? prev : nextMethod));
  }, [allowedMethods, globalDeliveryPolicy, selectedProduct]);

  useEffect(() => {
    if (!open || !selectedProduct || !productSupportsVariants(selectedProduct)) {
      setVariantConfig(null);
      setVariantSelection({});
      return;
    }
    let alive = true;
    setVariantLoading(true);
    api
      .get(`/inventory/products/${selectedProduct.id}/variant-configuration`, auth)
      .then(({ data }) => {
        if (!alive) return;
        const nextConfig = normalizeVariantConfig(data || {});
        setVariantConfig(nextConfig);
        setVariantSelection((current) => {
          const next = {};
          nextConfig.options.forEach((option) => {
            if (current[option.id]) next[option.id] = current[option.id];
          });
          return next;
        });
      })
      .catch(() => {
        if (!alive) return;
        setVariantConfig(null);
      })
      .finally(() => {
        if (alive) setVariantLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [auth, open, selectedProduct]);

  const variantOptions = asArray(variantConfig?.options);
  const variantRows = asArray(variantConfig?.variants);
  const variantMode = String(variantConfig?.variant_mode || selectedProduct?.variant_mode || "none").toLowerCase();
  const draftPreviewEnabled = variantMode === "draft";
  const trackStock = Boolean(selectedProduct?.track_stock);
  const variantCandidates = useMemo(() => {
    if (!productSupportsVariants(selectedProduct)) return [];
    if (draftPreviewEnabled) return variantRows;
    return variantRows.filter((variant) => variant.is_active !== false);
  }, [draftPreviewEnabled, selectedProduct, variantRows]);

  useEffect(() => {
    if (!open || !initialVariantId || !variantOptions.length) return;
    const matchedVariant = variantRows.find((variant) => Number(variant.id) === Number(initialVariantId));
    if (!matchedVariant) {
      setVariantSelection((current) => (Object.keys(current).length ? {} : current));
      return;
    }
    const nextSelection = {};
    asArray(matchedVariant.selection).forEach((row) => {
      nextSelection[row.option_id] = row.value_id;
    });
    setVariantSelection(nextSelection);
  }, [initialVariantId, open, variantOptions.length, variantRows]);

  useEffect(() => {
    if (!variantOptions.length) return;
    const singleSelections = {};
    variantOptions.forEach((option) => {
      const values = asArray(option.values);
      if (values.length === 1) {
        singleSelections[option.id] = values[0].id;
      }
    });
    if (Object.keys(singleSelections).length) {
      setVariantSelection((current) => ({ ...singleSelections, ...current }));
    }
  }, [variantOptions]);

  const optionAvailability = useMemo(() => {
    if (!variantOptions.length) return {};
    const map = {};
    variantOptions.forEach((option) => {
      map[option.id] = {};
      asArray(option.values).forEach((value) => {
        const nextSelection = { ...variantSelection, [option.id]: value.id };
        const matches = variantCandidates.filter((variant) =>
          asArray(variant.selection).every((row) => {
            const chosen = nextSelection[row.option_id];
            return !chosen || String(chosen) === String(row.value_id);
          })
        );
        map[option.id][value.id] = matches.length > 0;
      });
    });
    return map;
  }, [variantCandidates, variantOptions, variantSelection]);

  const selectedVariant = useMemo(() => {
    if (!variantOptions.length) return null;
    return (
      variantRows.find((variant) =>
        asArray(variant.selection).length === variantOptions.length &&
        asArray(variant.selection).every((row) => String(variantSelection[row.option_id] || "") === String(row.value_id))
      ) || null
    );
  }, [variantOptions.length, variantRows, variantSelection]);

  const currentInputSignature = useMemo(
    () =>
      JSON.stringify({
        productId: selectedProductId || null,
        variantId: selectedVariant?.id || null,
        quantity: String(quantity || ""),
        deliveryMethod,
        destination,
        selectedRateReference,
        acceptedAddressChoice,
        productUpdatedAt: selectedProduct?.updated_at || null,
        shippingWeight: selectedProduct?.shipping_weight_grams || null,
        productPrice: selectedProduct?.price || null,
        externalStateFingerprint: externalStateFingerprint || "",
      }),
    [
      acceptedAddressChoice,
      deliveryMethod,
      destination,
      externalStateFingerprint,
      quantity,
      selectedProduct,
      selectedProductId,
      selectedRateReference,
      selectedVariant,
    ]
  );
  const [lastPreviewSignature, setLastPreviewSignature] = useState("");

  useEffect(() => {
    if (!open) {
      setPreview(null);
      setError("");
      setLoading(false);
      setStale(false);
      setSelectedRateReference("");
      setAcceptedAddressChoice("");
      setLastPreviewSignature("");
      setDestination(defaultDestination);
      setQuantity("1");
      setVariantSelection({});
      return;
    }
    setStale(Boolean(preview) && lastPreviewSignature !== currentInputSignature);
  }, [currentInputSignature, lastPreviewSignature, open, preview]);

  const requestPreview = async () => {
    if (!selectedProduct) {
      setError("Select a Product before previewing checkout.");
      return;
    }
    if (productSupportsVariants(selectedProduct) && !selectedVariant) {
      setError("Choose a complete Variant combination before previewing checkout.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      if (!selectedProduct?.is_digital && !deliveryMethod) {
        setError("Select a delivery method before previewing checkout.");
        return;
      }
      const payload = {
        product_lines: [
          {
            product_id: selectedProduct.id,
            variant_id: selectedVariant?.id || undefined,
            quantity: Number(quantity || 1),
          },
        ],
      };
      if (deliveryMethod !== "digital") {
        payload.delivery_method = deliveryMethod;
      }
      if (deliveryMethod === "shipping" || deliveryMethod === "local_delivery") {
        payload.destination = destination;
      }
      if (deliveryMethod === "shipping" && destination.country && destination.address1 && destination.city) {
        payload.request_test_rates = true;
      }
      if (selectedRateReference) {
        payload.selected_test_rate_reference = selectedRateReference;
      }
      if (acceptedAddressChoice) {
        payload.accepted_address_choice = acceptedAddressChoice;
      }
      const { data } = await api.post("/inventory/product-checkout-preview", payload, auth);
      setPreview(data || null);
      setSelectedRateReference(data?.delivery?.selected_rate?.rate_reference || "");
      setLastPreviewSignature(currentInputSignature);
      setStale(false);
    } catch (requestError) {
      setError(normalizePreviewError(requestError?.response?.data?.error || requestError?.message));
    } finally {
      setLoading(false);
    }
  };

  const handleCopySummary = async () => {
    try {
      const summary = buildProductCheckoutPreviewSummary(preview);
      if (!summary) return;
      await navigator.clipboard.writeText(summary);
      onNotify?.("Preview summary copied.");
    } catch {
      onNotify?.("Unable to copy preview summary.");
    }
  };

  const handleCopySellerEstimate = async () => {
    try {
      const summary = buildProductSellerEstimateSummary(preview);
      if (!summary) return;
      await navigator.clipboard.writeText(summary);
      onNotify?.("Seller estimate copied.");
    } catch {
      onNotify?.("Unable to copy Seller estimate.");
    }
  };

  const handleRecommendedAction = (code) => {
    if (code === "open_product_cost") {
      onOpenProductCost?.(selectedProduct?.id || selectedProductId);
      return;
    }
    if (code === "open_product") {
      onOpenProduct?.(selectedProduct?.id || selectedProductId);
      return;
    }
    if (code === "open_delivery_setup") {
      if (typeof window !== "undefined") window.location.assign(deliverySetupHref);
      return;
    }
    if (code === "test_easypost_shipping") {
      setDeliveryMethod("shipping");
    }
  };

  const customerView = preview?.customer_view || {};
  const sellerView = preview?.seller_view || null;
  const readinessItems = Array.isArray(preview?.readiness?.items) ? preview.readiness.items : [];
  const rateOptions = Array.isArray(preview?.delivery?.test_rates) ? preview.delivery.test_rates : [];
  const addressReview = preview?.address_review || null;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg" fullScreen={fullScreen}>
      <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
        <Typography component="span" variant="h6" sx={{ fontWeight: 800 }}>{title}</Typography>
        <IconButton onClick={onClose} aria-label="Close Product checkout preview">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ p: 0 }}>
        <Stack spacing={2} sx={{ p: 2 }}>
          <Alert severity="info">
            Preview only — no Product Order, inventory reservation, payment, shipping label, or customer notification will be created.
          </Alert>
          {stale ? (
            <Alert severity="warning">
              Product checkout settings changed after this preview. Refresh to see the current customer experience.
            </Alert>
          ) : null}
          {error ? <Alert severity="error">{error}</Alert> : null}
          {selectedProduct && !selectedProduct.is_active ? (
            <Alert severity="info">
              Manager preview — this Product is currently hidden.
            </Alert>
          ) : null}

          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField
                select
                fullWidth
                label="Product"
                value={selectedProductId}
                onChange={(event) => setSelectedProductId(event.target.value)}
              >
                {productOptions.map((row) => (
                  <MenuItem key={row.id} value={row.id}>
                    {row.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                fullWidth
                type="number"
                inputProps={{ min: 1, max: 99 }}
                label="Quantity"
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <Select
                  value={deliveryMethod}
                  onChange={(event) => setDeliveryMethod(event.target.value)}
                  displayEmpty
                  inputProps={{ "aria-label": "Delivery method" }}
                >
                  {(selectedProduct?.is_digital ? ["digital"] : allowedMethods).map((code) => (
                    <MenuItem key={code} value={code}>
                      {methodLabel[code] || code}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <Stack direction="row" spacing={1} justifyContent={{ xs: "stretch", md: "flex-end" }} sx={{ height: "100%" }}>
                <Button
                  variant="outlined"
                  startIcon={<RefreshOutlinedIcon />}
                  onClick={requestPreview}
                  disabled={loading || !selectedProduct || (productSupportsVariants(selectedProduct) && !selectedVariant)}
                  sx={{ ml: { md: "auto" } }}
                >
                  {preview ? "Refresh preview" : "Preview customer checkout"}
                </Button>
              </Stack>
            </Grid>
          </Grid>

          {productSupportsVariants(selectedProduct) ? (
            <Box sx={{ p: 2, border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
              <Stack spacing={1.5}>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ xs: "flex-start", sm: "center" }}>
                  <Typography variant="subtitle1" fontWeight={800}>Variant selection</Typography>
                  <Chip
                    size="small"
                    label={variantMode === "draft" ? "Draft" : "Active"}
                    color={variantMode === "draft" ? "warning" : "success"}
                    variant="outlined"
                  />
                  <Chip
                    size="small"
                    label={variantMode === "draft" ? "Draft Variant preview" : "Active selling preview"}
                    variant="outlined"
                  />
                </Stack>
                {variantLoading ? (
                  <Typography variant="body2" color="text.secondary">Loading Variant configuration…</Typography>
                ) : (
                  <>
                    {!variantConfig?.runtime_selling_enabled && variantMode === "active" ? (
                      <Alert severity="warning">
                        Variant selling is temporarily disabled by runtime configuration.
                      </Alert>
                    ) : null}
                    {variantMode === "draft" ? (
                      <Alert severity="info">
                        Draft Variant preview — customers cannot purchase this Variant yet.
                      </Alert>
                    ) : null}
                    {variantOptions.map((option) => (
                      <Box key={option.id}>
                        <Typography variant="body2" fontWeight={700} sx={{ mb: 0.75 }}>
                          {option.name}
                        </Typography>
                        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                          {asArray(option.values).map((value) => {
                            const available = Boolean(optionAvailability?.[option.id]?.[value.id]);
                            const selected = String(variantSelection[option.id] || "") === String(value.id);
                            return (
                              <Button
                                key={value.id}
                                variant={selected ? "contained" : "outlined"}
                                color={selected ? "primary" : "inherit"}
                                onClick={() => setVariantSelection((current) => ({ ...current, [option.id]: value.id }))}
                                disabled={!available}
                                aria-pressed={selected}
                                startIcon={
                                  value.swatch_color ? (
                                    <Box
                                      component="span"
                                      sx={{
                                        width: 14,
                                        height: 14,
                                        borderRadius: "50%",
                                        border: "1px solid rgba(0,0,0,0.2)",
                                        backgroundColor: value.swatch_color,
                                      }}
                                    />
                                  ) : null
                                }
                              >
                                {value.value}
                              </Button>
                            );
                          })}
                        </Stack>
                      </Box>
                    ))}
                    <Box sx={{ p: 1.5, borderRadius: 1.5, backgroundColor: "action.hover" }}>
                      <Typography variant="body2" fontWeight={700}>
                        {selectedProduct?.name || "Product"}
                        {selectedVariant?.selection?.length ? ` — ${selectedVariant.selection.map((row) => row.value).join(" / ")}` : ""}
                      </Typography>
                      {selectedVariant ? (
                        <Stack spacing={0.5} sx={{ mt: 0.75 }}>
                          <Typography variant="body2" color="text.secondary">
                            Variant SKU: {selectedVariant.sku || "—"}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Selling price: {formatMoney(selectedVariant.effective_price || selectedProduct?.price, selectedProduct?.selling_currency || selectedProduct?.currency)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Price source: {selectedVariant.price_override != null && selectedVariant.price_override !== "" ? "Variant price" : "Uses Product price"}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Availability: {variantAvailabilityLabel(selectedVariant, trackStock)}
                          </Typography>
                        </Stack>
                      ) : (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                          Choose a complete Variant combination before previewing checkout.
                        </Typography>
                      )}
                    </Box>
                  </>
                )}
              </Stack>
            </Box>
          ) : null}

          {deliveryMethod === "shipping" || deliveryMethod === "local_delivery" ? (
            <Grid container spacing={1.5}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Address"
                  value={destination.address1}
                  onChange={(event) => setDestination((prev) => ({ ...prev, address1: event.target.value }))}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="City"
                  value={destination.city}
                  onChange={(event) => setDestination((prev) => ({ ...prev, city: event.target.value }))}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Region"
                  value={destination.region}
                  onChange={(event) => setDestination((prev) => ({ ...prev, region: event.target.value }))}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Postal code"
                  value={destination.postal_code}
                  onChange={(event) => setDestination((prev) => ({ ...prev, postal_code: event.target.value }))}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Country"
                  value={destination.country}
                  onChange={(event) => setDestination((prev) => ({ ...prev, country: event.target.value.toUpperCase() }))}
                />
              </Grid>
            </Grid>
          ) : null}

          {addressReview?.requires_acceptance ? (
            <Alert severity="warning">
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                EasyPost suggested a corrected shipping address for this preview.
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.5 }}>
                Choose which address to use, then refresh the preview.
              </Typography>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mt: 1 }}>
                <Button variant="outlined" onClick={() => setAcceptedAddressChoice("suggested")}>
                  Use suggested address
                </Button>
                <Button variant="outlined" onClick={() => setAcceptedAddressChoice("original")}>
                  Use original address
                </Button>
              </Stack>
            </Alert>
          ) : null}

          {rateOptions.length ? (
            <TextField
              select
              fullWidth
              label="Test shipping rate"
              value={selectedRateReference}
              onChange={(event) => {
                setSelectedRateReference(event.target.value);
                setStale(true);
              }}
              helperText="Test rate only. Actual checkout rates may change with the cart, address, package, carrier availability, or time."
            >
              {rateOptions.map((rate) => (
                <MenuItem key={rate.rate_reference} value={rate.rate_reference} disabled={!rate.available}>
                  {`${rate.carrier} ${rate.service} — ${rate.currency} ${rate.amount}${rate.available ? "" : " (Unavailable)"}`}
                </MenuItem>
              ))}
            </TextField>
          ) : null}

          {preview ? (
            <>
              <Box>
                <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 1 }}>
                  What the customer would see
                </Typography>
                <Stack spacing={1}>
                  {(preview.product_lines || []).map((line, index) => (
                    <Stack
                      key={`${line.product_id}-${line.variant_id || "simple"}-${index}`}
                      direction={{ xs: "column", sm: "row" }}
                      justifyContent="space-between"
                      spacing={2}
                      sx={{ p: 1.25, border: "1px solid", borderColor: "divider", borderRadius: 1.5 }}
                    >
                      <Stack direction="row" spacing={1.25} alignItems="flex-start">
                        <PreviewLineImage image={line.image} alt={`${line.name || "Product"} preview`} />
                        <Box>
                          <Typography variant="body2" fontWeight={700}>{line.name}</Typography>
                          {line.variant_label ? (
                            <Typography variant="body2" color="text.secondary">{line.variant_label}</Typography>
                          ) : null}
                          {line.variant_options?.length ? (
                            <Typography variant="caption" color="text.secondary">
                              {formatVariantOptions(line.variant_options)}
                            </Typography>
                          ) : null}
                          {line.variant_sku ? (
                            <Typography variant="caption" display="block" color="text.secondary">
                              Variant SKU: {line.variant_sku}
                            </Typography>
                          ) : null}
                          <Typography variant="caption" display="block" color="text.secondary">
                            Qty {line.quantity} • {formatMoney(line.unit_price, preview.currency)}
                          </Typography>
                          {line.effective_price_source ? (
                            <Typography variant="caption" display="block" color="text.secondary">
                              Price source: {priceSourceLabel[line.effective_price_source] || "Uses Product price"}
                            </Typography>
                          ) : null}
                          {line.image_source_label ? (
                            <Typography variant="caption" display="block" color="text.secondary">
                              Image: {line.image_source_label}
                            </Typography>
                          ) : null}
                          {line.variant_preview_mode ? (
                            <Chip
                              size="small"
                              sx={{ mt: 0.75 }}
                              label={previewModeLabel[line.variant_preview_mode] || line.variant_preview_mode}
                              variant="outlined"
                            />
                          ) : null}
                        </Box>
                      </Stack>
                      <Typography variant="body2">{formatMoney(line.line_total, preview.currency)}</Typography>
                    </Stack>
                  ))}
                  <Divider flexItem sx={{ my: 0.5 }} />
                  <Stack direction="row" justifyContent="space-between"><Typography variant="body2">Product subtotal</Typography><Typography variant="body2">{formatMoney(customerView.product_subtotal, preview.currency)}</Typography></Stack>
                  <Stack direction="row" justifyContent="space-between"><Typography variant="body2">{preview.delivery?.customer_label || "Delivery"}</Typography><Typography variant="body2">{formatMoney(customerView.shipping_amount, preview.currency)}</Typography></Stack>
                  <Stack direction="row" justifyContent="space-between"><Typography variant="body2">Tax</Typography><Typography variant="body2">{preview.tax?.handling_mode === "stripe_checkout_automatic_tax" ? "Calculated during Stripe Checkout" : preview.tax?.message || "Not configured"}</Typography></Stack>
                  <Stack direction="row" justifyContent="space-between"><Typography variant="subtitle2" fontWeight={800}>Known amount before tax</Typography><Typography variant="subtitle2" fontWeight={800}>{formatMoney(customerView.known_amount_before_tax, preview.currency)}</Typography></Stack>
                  <Stack direction="row" justifyContent="space-between"><Typography variant="subtitle2" fontWeight={800}>Final customer total</Typography><Typography variant="subtitle2" fontWeight={800}>{customerView.final_total_status === "provider_calculated" ? "Finalized during checkout" : formatMoney(customerView.final_total, preview.currency)}</Typography></Stack>
                </Stack>
              </Box>

              {preview.international?.customer_notice ? (
                <Alert severity="info">
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    Import duties and taxes: Not included
                  </Typography>
                  <Typography variant="body2">{preview.international.customer_notice}</Typography>
                </Alert>
              ) : null}

              {readinessItems.length ? (
                <Stack spacing={1}>
                  {readinessItems.map((item) => (
                    <Alert key={`${item.code}-${item.message}`} severity={item.severity === "error" ? "error" : "warning"}>
                      {item.message}
                    </Alert>
                  ))}
                </Stack>
              ) : null}

              <Accordion disableGutters sx={{ boxShadow: "none", border: 1, borderColor: "divider", borderRadius: 1.5, overflow: "hidden" }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle2" fontWeight={700}>Manager details</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Stack spacing={0.75}>
                    <Stack direction="row" justifyContent="space-between"><Typography variant="body2">Product currency source</Typography><Typography variant="body2">{preview?.settings_source?.currency || "Company currency settings"}</Typography></Stack>
                    <Stack direction="row" justifyContent="space-between"><Typography variant="body2">Delivery policy source</Typography><Typography variant="body2">{preview?.settings_source?.delivery_policy || "Product and Delivery Setup settings"}</Typography></Stack>
                    <Stack direction="row" justifyContent="space-between"><Typography variant="body2">Stripe Automatic Tax</Typography><Typography variant="body2">{preview?.tax?.handling_mode === "stripe_checkout_automatic_tax" ? "Enabled" : "Not applied"}</Typography></Stack>
                    <Stack direction="row" justifyContent="space-between"><Typography variant="body2">Prices include tax</Typography><Typography variant="body2">{preview?.tax?.prices_include_tax ? "Yes" : "No"}</Typography></Stack>
                    {preview?.delivery?.package_summary ? (
                      <Stack direction="row" justifyContent="space-between"><Typography variant="body2">Package summary</Typography><Typography variant="body2">{`${preview.delivery.package_summary.profile_name || "Package"} • ${preview.delivery.package_summary.total_weight_grams || 0} g`}</Typography></Stack>
                    ) : null}
                    {preview?.delivery?.selected_rate ? (
                      <Stack direction="row" justifyContent="space-between"><Typography variant="body2">Provider test rate</Typography><Typography variant="body2">{`${preview.delivery.selected_rate.carrier} ${preview.delivery.selected_rate.service}`}</Typography></Stack>
                    ) : null}
                    <Typography variant="caption" color="text.secondary">
                      Preview timestamp: {preview.preview_timestamp || "—"}
                    </Typography>
                  </Stack>
                </AccordionDetails>
              </Accordion>

              {sellerView ? (
                <Accordion disableGutters sx={{ boxShadow: "none", border: 1, borderColor: "divider", borderRadius: 1.5, overflow: "hidden" }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="subtitle2" fontWeight={700}>Seller estimate</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Stack spacing={1.25}>
                      <Alert severity={sellerView.status === "complete" ? "success" : sellerView.status === "partial" ? "warning" : "info"}>
                        {sellerView.status === "complete"
                          ? "Known estimate"
                          : sellerView.status === "partial"
                          ? "Partial estimate"
                          : "Estimate unavailable"}
                      </Alert>
                      {(sellerView.warnings || []).map((warning) => (
                        <Alert key={warning} severity="warning">
                          {warning}
                        </Alert>
                      ))}
                      {(sellerView.recommended_actions || []).length ? (
                        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} flexWrap="wrap" useFlexGap>
                          {sellerView.recommended_actions.map((action) => (
                            <Button key={action.code} variant="outlined" size="small" onClick={() => handleRecommendedAction(action.code)}>
                              {action.label}
                            </Button>
                          ))}
                        </Stack>
                      ) : null}
                      {(sellerView.lines || []).length ? (
                        <Stack spacing={1}>
                          {(sellerView.lines || []).map((line, index) => (
                            <Box
                              key={`${line.product_id}-${line.variant_id || "simple"}-${index}`}
                              sx={{ p: 1.25, border: "1px solid", borderColor: "divider", borderRadius: 1.5 }}
                            >
                              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25}>
                                <PreviewLineImage image={line.image} alt={`${line.name || "Product"} seller estimate`} />
                                <Box>
                                  <Typography variant="body2" fontWeight={700}>{line.name}</Typography>
                                  {line.variant_label ? <Typography variant="body2" color="text.secondary">{line.variant_label}</Typography> : null}
                                  {line.variant_sku ? <Typography variant="caption" display="block" color="text.secondary">Variant SKU: {line.variant_sku}</Typography> : null}
                                  {line.variant_options?.length ? (
                                    <Typography variant="caption" display="block" color="text.secondary">
                                      {formatVariantOptions(line.variant_options)}
                                    </Typography>
                                  ) : null}
                                  <Typography variant="caption" display="block" color="text.secondary">
                                    Selling price: {formatMoney(line.unit_price, sellerView.currency)}
                                  </Typography>
                                  <Typography variant="caption" display="block" color="text.secondary">
                                    Quantity: {line.quantity}
                                  </Typography>
                                  <Typography variant="caption" display="block" color="text.secondary">
                                    Revenue: {formatMoney(line.line_total, sellerView.currency)}
                                  </Typography>
                                  <Typography variant="caption" display="block" color="text.secondary">
                                    Product cost: {line.product_unit_cost != null ? `${formatMoney(line.product_unit_cost, sellerView.currency)} each` : "Unavailable"}
                                  </Typography>
                                  <Typography variant="caption" display="block" color="text.secondary">
                                    Product cost total: {line.product_cost_total != null ? formatMoney(line.product_cost_total, sellerView.currency) : "Unavailable"}
                                  </Typography>
                                  <Typography variant="caption" display="block" color="text.secondary">
                                    Price source: {line.price_source_label || "Uses Product price"}
                                  </Typography>
                                </Box>
                              </Stack>
                            </Box>
                          ))}
                        </Stack>
                      ) : null}
                      <Stack spacing={0.75}>
                        <Typography variant="subtitle2" fontWeight={800}>Revenue</Typography>
                        <Stack direction="row" justifyContent="space-between"><Typography variant="body2">Product revenue before tax</Typography><Typography variant="body2">{sellerView?.revenue?.product_revenue_before_tax != null ? formatMoney(sellerView.revenue.product_revenue_before_tax, sellerView.currency) : "Unavailable"}</Typography></Stack>
                        <Stack direction="row" justifyContent="space-between"><Typography variant="body2">Customer shipping collected</Typography><Typography variant="body2">{formatMoney(sellerView?.revenue?.shipping_collected, sellerView.currency)}</Typography></Stack>
                        <Stack direction="row" justifyContent="space-between"><Typography variant="body2">Known customer amount before tax</Typography><Typography variant="body2">{formatMoney(sellerView?.revenue?.known_customer_amount_before_tax, sellerView.currency)}</Typography></Stack>
                      </Stack>
                      <Divider flexItem />
                      <Stack spacing={0.75}>
                        <Typography variant="subtitle2" fontWeight={800}>Known costs</Typography>
                        <Stack direction="row" justifyContent="space-between"><Typography variant="body2">Product cost</Typography><Typography variant="body2">{sellerView?.costs?.product_cost_total != null ? formatMoney(sellerView.costs.product_cost_total, sellerView.currency) : "Unavailable"}</Typography></Stack>
                        <Stack direction="row" justifyContent="space-between"><Typography variant="body2">Estimated shipping-label cost</Typography><Typography variant="body2">{sellerView?.costs?.estimated_shipping_label_cost != null ? formatMoney(sellerView.costs.estimated_shipping_label_cost, sellerView.currency) : "Unavailable"}</Typography></Stack>
                        <Stack direction="row" justifyContent="space-between"><Typography variant="body2">Known costs</Typography><Typography variant="body2">{sellerView?.costs?.known_costs_total != null ? formatMoney(sellerView.costs.known_costs_total, sellerView.currency) : "Unavailable"}</Typography></Stack>
                      </Stack>
                      <Divider flexItem />
                      <Stack spacing={0.75}>
                        <Typography variant="subtitle2" fontWeight={800}>Estimate</Typography>
                        <Stack direction="row" justifyContent="space-between"><Typography variant="body2">Product gross margin</Typography><Typography variant="body2">{sellerView?.margin?.product_gross_margin != null ? formatMoney(sellerView.margin.product_gross_margin, sellerView.currency) : "Unavailable"}</Typography></Stack>
                        <Stack direction="row" justifyContent="space-between"><Typography variant="body2">Estimated shipping difference</Typography><Typography variant="body2">{sellerView?.margin?.shipping_difference != null ? formatMoney(sellerView.margin.shipping_difference, sellerView.currency) : "Unavailable"}</Typography></Stack>
                        <Stack direction="row" justifyContent="space-between"><Typography variant="subtitle2" fontWeight={800}>Estimated order contribution</Typography><Typography variant="subtitle2" fontWeight={800}>{sellerView?.margin?.estimated_order_contribution != null ? formatMoney(sellerView.margin.estimated_order_contribution, sellerView.currency) : "Unavailable"}</Typography></Stack>
                        <Stack direction="row" justifyContent="space-between"><Typography variant="body2">Estimated contribution rate</Typography><Typography variant="body2">{sellerView?.margin?.estimated_contribution_rate_percent != null ? `${sellerView.margin.estimated_contribution_rate_percent}%` : "Unavailable"}</Typography></Stack>
                      </Stack>
                      <Divider flexItem />
                      <Stack spacing={0.5}>
                        <Typography variant="subtitle2" fontWeight={800}>Excluded</Typography>
                        {(sellerView.excluded_costs || []).map((item) => (
                          <Typography key={item} variant="body2" color="text.secondary">
                            - {item}
                          </Typography>
                        ))}
                      </Stack>
                      <Alert severity="info">
                        {sellerView.disclaimer}
                      </Alert>
                    </Stack>
                  </AccordionDetails>
                </Accordion>
              ) : null}
            </>
          ) : null}
        </Stack>
      </DialogContent>
      <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1, p: 2, flexWrap: "wrap" }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
          <Button variant="outlined" startIcon={<ContentCopyOutlinedIcon />} onClick={handleCopySummary} disabled={!preview}>
            Copy summary
          </Button>
          <Button variant="outlined" startIcon={<ContentCopyOutlinedIcon />} onClick={handleCopySellerEstimate} disabled={!preview?.seller_view}>
            Copy Seller estimate
          </Button>
        </Stack>
        <Stack direction="row" spacing={1} sx={{ ml: "auto" }}>
          <Button variant="outlined" startIcon={<RefreshOutlinedIcon />} onClick={requestPreview} disabled={loading || !selectedProduct || (productSupportsVariants(selectedProduct) && !selectedVariant)}>
            Refresh preview
          </Button>
          <Button onClick={onClose}>Close</Button>
        </Stack>
      </Box>
    </Dialog>
  );
}
