import React, { useEffect, useMemo, useState } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
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

const formatMoney = (value, currency) => formatCurrency(Number(value || 0), currency || "USD");

export const buildProductCheckoutPreviewSummary = (preview) => {
  if (!preview) return "";
  const lines = [
    "Product checkout preview",
    "",
    `Currency: ${preview.currency || "USD"}`,
    `Products: ${formatMoney(preview?.customer_view?.product_subtotal, preview.currency)}`,
  ];
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
    `Final customer total: ${preview?.customer_view?.final_total_status === "provider_calculated" ? "Finalized during checkout" : formatMoney(preview?.customer_view?.final_total, preview.currency)}`
  );
  if (preview?.international?.cross_border) {
    lines.push("");
    lines.push("Import duties and taxes: Not included");
  }
  if (preview?.delivery?.selected_rate?.carrier || preview?.delivery?.selected_rate?.service) {
    lines.push("");
    lines.push("Delivery:");
    lines.push(
      `${preview.delivery.selected_rate.carrier || ""} ${preview.delivery.selected_rate.service || ""}`.trim()
    );
    lines.push("Test rate only");
  }
  lines.push("");
  lines.push("Preview only. No Product Order, payment, or label was created.");
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

export default function ProductCheckoutPreviewDialog({
  open,
  onClose,
  token,
  products = [],
  initialProductId = null,
  globalDeliveryPolicy = null,
  title = "Preview customer checkout",
  onNotify,
  externalStateFingerprint = "",
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

  const selectedProduct = useMemo(
    () => productOptions.find((row) => Number(row.id) === Number(selectedProductId)) || null,
    [productOptions, selectedProductId]
  );
  const allowedMethods = useMemo(
    () => effectiveProductPreviewMethods(selectedProduct, globalDeliveryPolicy),
    [selectedProduct, globalDeliveryPolicy]
  );
  const currentInputSignature = useMemo(
    () => JSON.stringify({
      productId: selectedProductId || null,
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
    [acceptedAddressChoice, deliveryMethod, destination, externalStateFingerprint, quantity, selectedProduct, selectedProductId, selectedRateReference]
  );
  const [lastPreviewSignature, setLastPreviewSignature] = useState("");

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
      return;
    }
    setStale(Boolean(preview) && lastPreviewSignature !== currentInputSignature);
  }, [currentInputSignature, lastPreviewSignature, open, preview]);

  const requestPreview = async () => {
    if (!selectedProduct) {
      setError("Select a Product before previewing checkout.");
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
      setError(
        requestError?.response?.data?.error
        || requestError?.message
        || "Unable to preview customer checkout."
      );
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

  const handleRateSelection = async (event) => {
    const nextReference = event.target.value;
    setSelectedRateReference(nextReference);
    setStale(true);
  };

  const customerView = preview?.customer_view || {};
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
                  disabled={loading || !selectedProduct}
                  sx={{ ml: { md: "auto" } }}
                >
                  {preview ? "Refresh preview" : "Preview customer checkout"}
                </Button>
              </Stack>
            </Grid>
          </Grid>

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
              onChange={handleRateSelection}
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
                <Stack spacing={0.75}>
                  {(preview.product_lines || []).map((line) => (
                    <Stack key={`${line.product_id}-${line.quantity}`} direction="row" justifyContent="space-between" spacing={2}>
                      <Box>
                        <Typography variant="body2" fontWeight={700}>{line.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Qty {line.quantity} • {formatMoney(line.unit_price, preview.currency)}
                        </Typography>
                      </Box>
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
            </>
          ) : null}
        </Stack>
      </DialogContent>
      <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1, p: 2, flexWrap: "wrap" }}>
        <Button
          variant="outlined"
          startIcon={<ContentCopyOutlinedIcon />}
          onClick={handleCopySummary}
          disabled={!preview}
        >
          Copy summary
        </Button>
        <Stack direction="row" spacing={1} sx={{ ml: "auto" }}>
          <Button variant="outlined" startIcon={<RefreshOutlinedIcon />} onClick={requestPreview} disabled={loading || !selectedProduct}>
            Refresh preview
          </Button>
          <Button onClick={onClose}>Close</Button>
        </Stack>
      </Box>
    </Dialog>
  );
}
