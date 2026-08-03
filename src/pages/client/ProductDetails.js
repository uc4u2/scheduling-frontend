import React, { useEffect, useMemo, useState } from "react";
import { api } from "../../utils/api";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Breadcrumbs,
  Button,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogContent,
  Grid,
  IconButton,
  Snackbar,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  TextField,
  Typography,
  useMediaQuery,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ShoppingCartCheckoutIcon from "@mui/icons-material/ShoppingCartCheckout";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import ShareIcon from "@mui/icons-material/Share";
import CloseIcon from "@mui/icons-material/Close";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { useTheme } from "@mui/material/styles";
import { formatCurrency } from "../../utils/formatters";
import { addProductToCart, CartErrorCodes } from "../../utils/cart";
import { getTenantHostMode } from "../../utils/tenant";
import { getActiveCurrency } from "../../utils/currency";
import CompanyPublic from "./CompanyPublic";

const isPlainObject = (val) => !!val && typeof val === "object" && !Array.isArray(val);

const cloneStyle = (val) => {
  if (!isPlainObject(val)) return null;
  try {
    return JSON.parse(JSON.stringify(val));
  } catch {
    return { ...val };
  }
};

const extractPageStyleProps = (page) => {
  if (!page) return null;
  const sections = Array.isArray(page?.content?.sections) ? page.content.sections : [];
  const section = sections.find((s) => s?.type === "pageStyle");
  if (section?.props && isPlainObject(section.props)) {
    const copy = cloneStyle(section.props);
    if (copy && Object.keys(copy).length) return copy;
  }
  const meta = cloneStyle(page?.content?.meta?.pageStyle);
  if (meta && Object.keys(meta).length) return meta;
  return null;
};

const hasMeaningfulText = (value) => Boolean(String(value || "").trim());

const isNewArrival = (createdAt) => {
  const parsed = Date.parse(createdAt || "");
  if (!Number.isFinite(parsed)) return false;
  const ageMs = Date.now() - parsed;
  return ageMs >= 0 && ageMs <= 30 * 24 * 60 * 60 * 1000;
};

const safeLines = (value) =>
  String(value || "")
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter((line, index, rows) => line || rows.some((row) => row));

const SAFE_SHARE_QUERY_KEYS = new Set(["embed", "mode", "dialog", "primary", "text"]);

const isPublicProductPath = (pathname) => {
  const path = String(pathname || "");
  return /^\/products\/[^/]+\/?$/.test(path) || /^\/[^/]+\/products\/[^/]+\/?$/.test(path);
};

const sanitizeShareUrl = (rawUrl) => {
  if (!rawUrl) return "";
  try {
    const parsed = new URL(rawUrl, typeof window !== "undefined" ? window.location.origin : "https://app.schedulaa.com");
    if (!isPublicProductPath(parsed.pathname)) return "";
    const sanitized = new URL(parsed.toString());
    Array.from(sanitized.searchParams.keys()).forEach((key) => {
      if (!SAFE_SHARE_QUERY_KEYS.has(key)) sanitized.searchParams.delete(key);
    });
    sanitized.hash = "";
    return sanitized.toString();
  } catch {
    return "";
  }
};

const ProductDetails = ({ slugOverride }) => {
  const { slug: routeSlug, productId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const pathname = typeof window !== "undefined" ? window.location.pathname || "" : "";
  const pathParts = useMemo(() => pathname.split("/").filter(Boolean), [pathname]);

  const slug = useMemo(() => {
    const qs = searchParams.get("site");
    if (qs) return qs;
    if (slugOverride) return slugOverride;
    if (routeSlug) return routeSlug;
    if (pathParts.length >= 3 && pathParts[1] === "products") {
      return pathParts[0] || "";
    }
    try {
      return localStorage.getItem("site") || "";
    } catch {
      return routeSlug || "";
    }
  }, [routeSlug, searchParams, slugOverride, pathParts]);
  const effectiveProductId = useMemo(() => {
    if (productId) return productId;
    if (pathParts.length >= 3 && pathParts[1] === "products") {
      return pathParts[2] || "";
    }
    return "";
  }, [productId, pathParts]);
  const isCustomDomain = getTenantHostMode() === "custom";

  const basketHref = useMemo(() => {
    if (!slug) return "";
    const keys = ["embed", "mode", "dialog", "primary", "text"];
    const qs = new URLSearchParams();
    qs.set("page", "basket");
    keys.forEach((key) => {
      const val = searchParams.get(key);
      if (val) qs.set(key, val);
    });
    const query = qs.toString();
    if (isCustomDomain) {
      return query ? `/basket?${query}` : "/basket";
    }
    return query ? `/${slug}?${query}` : `/${slug}`;
  }, [slug, searchParams, isCustomDomain]);

  const productsHref = useMemo(() => {
    if (!slug) return "";
    const keys = ["embed", "mode", "dialog", "primary", "text"];
    const qs = new URLSearchParams();
    qs.set("page", "products");
    keys.forEach((key) => {
      const val = searchParams.get(key);
      if (val) qs.set(key, val);
    });
    const query = qs.toString();
    if (isCustomDomain) {
      return query ? `/products?${query}` : "/products";
    }
    return query ? `/${slug}?${query}` : `/${slug}`;
  }, [slug, searchParams, isCustomDomain]);

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [snack, setSnack] = useState({ open: false, msg: "" });
  const [selectedOptions, setSelectedOptions] = useState({});

  useEffect(() => {
    if (!slug || !effectiveProductId) return;
    let alive = true;
    setLoading(true);
    setError("");
    api
      .get(`/public/${slug}/products/${effectiveProductId}`, { noCompanyHeader: true })
      .then(({ data }) => {
        if (!alive) return;
        setProduct(data);
        setQuantity(1);
        setActiveImageIndex(0);
        setSelectedOptions({});
      })
      .catch(() => {
        if (!alive) return;
        setError("Product not found");
        setProduct(null);
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [slug, effectiveProductId]);

  const handleAdd = () => {
    if (!product || soldOut || variantPurchaseUnavailable || (variantSellingActive && !selectedVariant)) return;
    const qty = Math.max(1, Number(quantity) || 1);
    try {
      addProductToCart(product, qty, selectedVariant);
      setSnack({ open: true, msg: `${product.name} added to basket` });
    } catch (error) {
      const mixed = error?.code === CartErrorCodes.MIXED_TYPES;
      setSnack({
        open: true,
        msg: mixed
          ? "Please finish booking your service or clear the basket before adding retail products."
          : "Unable to add this product to your basket right now.",
      });
    }
  };

  const handleShare = async () => {
    const currentUrl = typeof window !== "undefined" ? sanitizeShareUrl(window.location.href) : "";
    const fallbackUrl = sanitizeShareUrl(product?.product_url);
    const url = currentUrl || fallbackUrl;
    if (!url) {
      setSnack({ open: true, msg: "Unable to share this product right now." });
      return;
    }
    try {
      if (navigator?.share) {
        await navigator.share({ title: product?.name || "Product", url });
      } else if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        throw new Error("Share unavailable");
      }
      setSnack({ open: true, msg: navigator?.share ? "Share opened" : "Product link copied" });
    } catch {
      setSnack({ open: true, msg: "Unable to share this product right now." });
    }
  };

  const goBack = () => {
    if (productsHref) navigate(productsHref);
  };

  const goBasket = () => {
    if (basketHref) navigate(basketHref);
  };

  const gallery = useMemo(() => (Array.isArray(product?.images) ? product.images : []), [product]);
  const variantCatalog = product?.variant_catalog || null;
  const variantSellingActive = Boolean(product?.variant_selling_enabled && variantCatalog);
  const variantPurchaseUnavailable = Boolean(product?.variant_purchase_unavailable);
  const variantOptions = Array.isArray(variantCatalog?.options) ? variantCatalog.options : [];
  const variantRows = Array.isArray(variantCatalog?.variants) ? variantCatalog.variants : [];
  const selectedVariant = useMemo(() => {
    if (!variantSellingActive) return null;
    return (
      variantRows.find((variant) => {
        const selection = Array.isArray(variant.selection) ? variant.selection : [];
        return (
          selection.length === variantOptions.length &&
          selection.every((row) => String(selectedOptions[row.option_id] || "") === String(row.value_id))
        );
      }) || null
    );
  }, [selectedOptions, variantOptions, variantRows, variantSellingActive]);
  const variantRange = useMemo(() => {
    if (!variantSellingActive) return null;
    const summary = variantCatalog?.price_summary || {};
    return summary;
  }, [variantSellingActive, variantCatalog]);
  const activeImage = useMemo(() => {
    if (selectedVariant?.image) {
      return {
        ...selectedVariant.image,
        url: selectedVariant.image.url_public || selectedVariant.image.url,
      };
    }
    return gallery[activeImageIndex] || gallery[0] || null;
  }, [selectedVariant, gallery, activeImageIndex]);
  const simpleQuantityAvailable = Number(product?.qty_on_hand || 0);
  const soldOut = variantSellingActive
    ? selectedVariant
      ? Boolean(selectedVariant.out_of_stock)
      : Boolean(variantCatalog?.availability?.sold_out)
    : Boolean(product?.track_stock) && simpleQuantityAvailable <= 0;
  const lowStock =
    !variantSellingActive && Boolean(product?.track_stock) && simpleQuantityAvailable > 0 && simpleQuantityAvailable <= 3;
  const currency = product?.selling_currency || getActiveCurrency();
  const displayPrice = selectedVariant
    ? formatCurrency(selectedVariant.effective_price, currency)
    : variantSellingActive && variantRange?.varies
    ? `From ${formatCurrency(variantRange.minimum, currency)}`
    : formatCurrency(variantRange?.minimum || product?.price, currency);
  const displaySku = selectedVariant?.sku || product?.sku;

  useEffect(() => {
    if (!variantSellingActive) return;
    const nextSelections = {};
    variantOptions.forEach((option) => {
      const values = Array.isArray(option.values) ? option.values : [];
      if (values.length === 1) {
        nextSelections[option.id] = values[0].id;
      }
    });
    if (Object.keys(nextSelections).length) {
      setSelectedOptions((current) => ({ ...nextSelections, ...current }));
    }
  }, [variantSellingActive, variantOptions]);

  useEffect(() => {
    if (!selectedVariant?.image) return;
    const nextIndex = gallery.findIndex((image) => {
      const left = image?.url_public || image?.url;
      const right = selectedVariant?.image?.url_public || selectedVariant?.image?.url;
      return left && right && left === right;
    });
    if (nextIndex >= 0) setActiveImageIndex(nextIndex);
  }, [selectedVariant, gallery]);

  const optionAvailability = useMemo(() => {
    if (!variantSellingActive) return {};
    const availability = {};
    variantOptions.forEach((option) => {
      availability[option.id] = {};
      (option.values || []).forEach((value) => {
        const candidateSelections = { ...selectedOptions, [option.id]: value.id };
        const matching = variantRows.filter((variant) => {
          if (variant.out_of_stock || !variant.available) return false;
          return (variant.selection || []).every((row) => {
            const chosen = candidateSelections[row.option_id];
            return !chosen || String(chosen) === String(row.value_id);
          });
        });
        availability[option.id][value.id] = matching.length > 0;
      });
    });
    return availability;
  }, [variantSellingActive, variantOptions, variantRows, selectedOptions]);

  const handleOptionSelect = (optionId, valueId) => {
    setSelectedOptions((current) => ({
      ...current,
      [optionId]: valueId,
    }));
  };
  const detailSections = useMemo(() => {
    const rows = [];
    if (hasMeaningfulText(product?.details_text)) {
      rows.push({
        key: "details",
        label: "Product details",
        content: (
          <Stack spacing={0.75}>
            {safeLines(product.details_text).map((line, index) => (
              <Typography key={`detail-line-${index}`} variant="body2" color="text.secondary">
                {line || "\u00A0"}
              </Typography>
            ))}
          </Stack>
        ),
      });
    }
    const specs = Array.isArray(product?.specifications_json)
      ? product.specifications_json.filter(
          (row) => hasMeaningfulText(row?.label) && hasMeaningfulText(row?.value)
        )
      : [];
    if (specs.length > 0) {
      rows.push({
        key: "specifications",
        label: "Specifications",
        content: (
          <Box
            component="dl"
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "minmax(160px, 220px) 1fr" },
              gap: 1.25,
              m: 0,
            }}
          >
            {specs.map((row, index) => (
              <React.Fragment key={`spec-${index}`}>
                <Typography component="dt" variant="body2" sx={{ fontWeight: 700 }}>
                  {row.label}
                </Typography>
                <Typography component="dd" variant="body2" color="text.secondary" sx={{ m: 0 }}>
                  {row.value}
                </Typography>
              </React.Fragment>
            ))}
          </Box>
        ),
      });
    }
    if (hasMeaningfulText(product?.materials_care_text)) {
      rows.push({
        key: "materials-care",
        label: "Materials & care",
        content: (
          <Stack spacing={0.75}>
            {safeLines(product.materials_care_text).map((line, index) => (
              <Typography key={`materials-line-${index}`} variant="body2" color="text.secondary">
                {line || "\u00A0"}
              </Typography>
            ))}
          </Stack>
        ),
      });
    }
    if (hasMeaningfulText(product?.packaging_text)) {
      rows.push({
        key: "packaging",
        label: "Packaging",
        content: (
          <Stack spacing={0.75}>
            {safeLines(product.packaging_text).map((line, index) => (
              <Typography key={`packaging-line-${index}`} variant="body2" color="text.secondary">
                {line || "\u00A0"}
              </Typography>
            ))}
          </Stack>
        ),
      });
    }
    const shippingReturns = product?.customer_shipping_returns || null;
    const hasShippingReturns =
      Array.isArray(shippingReturns?.delivery_methods) && shippingReturns.delivery_methods.length > 0
      || hasMeaningfulText(shippingReturns?.policy_text)
      || hasMeaningfulText(shippingReturns?.policy_url)
      || hasMeaningfulText(shippingReturns?.international_note)
      || hasMeaningfulText(shippingReturns?.duties_notice)
      || hasMeaningfulText(shippingReturns?.fallback_text);
    if (hasShippingReturns) {
      rows.push({
        key: "shipping-returns",
        label: "Shipping & returns",
        content: (
          <Stack spacing={1.25}>
            {Array.isArray(shippingReturns?.delivery_methods) && shippingReturns.delivery_methods.length > 0 ? (
              <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", rowGap: 1 }}>
                {shippingReturns.delivery_methods.map((item) => (
                  <Chip key={item.code} label={item.label} size="small" variant="outlined" />
                ))}
              </Stack>
            ) : null}
            {shippingReturns?.domestic_only ? (
              <Typography variant="body2" color="text.secondary">
                Available delivery options are domestic only.
              </Typography>
            ) : null}
            {safeLines(shippingReturns?.policy_text).map((line, index) => (
              <Typography key={`shipping-policy-line-${index}`} variant="body2" color="text.secondary">
                {line || "\u00A0"}
              </Typography>
            ))}
            {shippingReturns?.policy_url ? (
              <Button
                component="a"
                href={shippingReturns.policy_url}
                target="_blank"
                rel="noopener noreferrer"
                variant="text"
                sx={{ alignSelf: "flex-start", px: 0 }}
              >
                Read full shipping & returns policy
              </Button>
            ) : null}
            {hasMeaningfulText(shippingReturns?.international_note) ? (
              <Typography variant="body2" color="text.secondary">
                {shippingReturns.international_note}
              </Typography>
            ) : null}
            {hasMeaningfulText(shippingReturns?.duties_notice) ? (
              <Typography variant="body2" color="text.secondary">
                {shippingReturns.duties_notice}
              </Typography>
            ) : null}
            {!hasMeaningfulText(shippingReturns?.policy_text) &&
            !hasMeaningfulText(shippingReturns?.policy_url) &&
            hasMeaningfulText(shippingReturns?.fallback_text) ? (
              <Typography variant="body2" color="text.secondary">
                {shippingReturns.fallback_text}
              </Typography>
            ) : null}
          </Stack>
        ),
      });
    }
    return rows;
  }, [product]);

  let body;
  if (loading) {
    body = (
      <Box sx={{ py: 8, textAlign: "center" }}>
        <CircularProgress />
      </Box>
    );
  } else if (error) {
    body = (
      <Box sx={{ py: 6, textAlign: "center" }}>
        <Typography color="error" gutterBottom>
          {error}
        </Typography>
        <Button variant="outlined" onClick={goBack} startIcon={<ArrowBackIcon />}>
          Back to products
        </Button>
      </Box>
    );
  } else if (!product) {
    body = null;
  } else {
    body = (
      <Stack spacing={4}>
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Stack spacing={2}>
              <Box
                sx={{
                  position: "relative",
                  width: "100%",
                  pt: "75%",
                  borderRadius: 3,
                  overflow: "hidden",
                  bgcolor: "action.hover",
                  cursor: activeImage ? "zoom-in" : "default",
                }}
                onClick={() => activeImage && setLightboxOpen(true)}
              >
                {activeImage ? (
                  <Box
                    component="img"
                    src={activeImage.url}
                    alt={activeImage.alt || product.name}
                    sx={{
                      position: "absolute",
                      inset: 0,
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <Typography
                    variant="overline"
                    color="text.secondary"
                    sx={{ position: "absolute", inset: "40% 0", textAlign: "center" }}
                  >
                    No image
                  </Typography>
                )}
                <Stack direction="row" spacing={1} sx={{ position: "absolute", top: 12, left: 12, flexWrap: "wrap" }}>
                  {isNewArrival(product.created_at) ? <Chip label="New" size="small" color="secondary" /> : null}
                  {soldOut ? (
                    <Chip label="Sold out" size="small" sx={{ bgcolor: "rgba(33,33,33,0.72)", color: "#fff" }} />
                  ) : null}
                  {!soldOut && lowStock ? <Chip label={`Only ${simpleQuantityAvailable} left`} color="warning" size="small" /> : null}
                </Stack>
              </Box>
              {gallery.length > 1 ? (
                <Stack direction="row" spacing={1} sx={{ overflowX: "auto", pb: 1 }}>
                  {gallery.map((img, index) => (
                    <Box
                      key={img.id || `${product.id}-thumb-${index}`}
                      component="img"
                      src={img.url}
                      alt={img.alt || img.filename || product.name}
                      onClick={() => setActiveImageIndex(index)}
                      sx={{
                        width: 76,
                        height: 76,
                        objectFit: "cover",
                        borderRadius: 1,
                        cursor: "pointer",
                        border: index === activeImageIndex ? "2px solid" : "1px solid",
                        borderColor: index === activeImageIndex ? "primary.main" : "divider",
                        opacity: index === activeImageIndex ? 1 : 0.75,
                      }}
                    />
                  ))}
                </Stack>
              ) : null}
            </Stack>
          </Grid>
          <Grid item xs={12} md={6}>
            <Stack spacing={2.25}>
              <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
                  <IconButton onClick={goBack} aria-label="Back to products">
                    <ArrowBackIcon />
                  </IconButton>
                  <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />}>
                    <Button variant="text" onClick={goBack} size="small">
                      Products
                    </Button>
                    <Typography color="text.primary">{product.name}</Typography>
                  </Breadcrumbs>
                </Stack>
                <IconButton onClick={handleShare} aria-label="Share product">
                  <ShareIcon />
                </IconButton>
              </Stack>
              {isNewArrival(product.created_at) ? (
                <Chip label="New arrival" color="secondary" size="small" sx={{ alignSelf: "flex-start" }} />
              ) : null}
              <Typography variant="h3" fontWeight={800}>
                {product.name}
              </Typography>
              <Typography variant="h5" color="primary" fontWeight={700}>
                {displayPrice}
              </Typography>
              {hasMeaningfulText(product.description) ? (
                <Typography variant="body1" color="text.secondary">
                  {product.description}
                </Typography>
              ) : null}
              <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", rowGap: 1 }}>
                {displaySku ? <Chip label={`SKU ${displaySku}`} variant="outlined" size="small" /> : null}
                {product.is_digital ? <Chip label="Digital product" color="info" size="small" /> : null}
                {!product.is_digital ? (
                  <Chip
                    label={product.allow_international_shipping ? "International shipping available" : "Domestic shipping only"}
                    variant="outlined"
                    size="small"
                  />
                ) : null}
              </Stack>
              {Array.isArray(product.tags) && product.tags.length > 0 ? (
                <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", rowGap: 1 }}>
                  {product.tags.slice(0, 6).map((tag, index) => (
                    <Chip key={`${product.id}-detail-tag-${index}`} label={tag} size="small" variant="outlined" />
                  ))}
                </Stack>
              ) : null}
              {variantSellingActive ? (
                <Stack spacing={2}>
                  {variantOptions.map((option) => (
                    <Stack key={option.id} spacing={1}>
                      <Typography variant="subtitle2" fontWeight={700}>
                        {option.name}
                      </Typography>
                      <ToggleButtonGroup
                        value={selectedOptions[option.id] || null}
                        exclusive
                        onChange={(_, value) => value && handleOptionSelect(option.id, value)}
                        sx={{ flexWrap: "wrap", gap: 1 }}
                      >
                        {(option.values || []).map((value) => {
                          const enabled = Boolean(optionAvailability?.[option.id]?.[value.id]);
                          return (
                            <ToggleButton
                              key={value.id}
                              value={value.id}
                              disabled={!enabled}
                              aria-label={`${option.name}: ${value.value}`}
                              sx={{ textTransform: "none", borderRadius: 2 }}
                            >
                              <Stack direction="row" spacing={1} alignItems="center">
                                {value.swatch_color ? (
                                  <Box
                                    sx={{
                                      width: 14,
                                      height: 14,
                                      borderRadius: "50%",
                                      border: "1px solid",
                                      borderColor: "divider",
                                      bgcolor: value.swatch_color,
                                    }}
                                  />
                                ) : null}
                                <span>{value.value}</span>
                              </Stack>
                            </ToggleButton>
                          );
                        })}
                      </ToggleButtonGroup>
                    </Stack>
                  ))}
                  {!selectedVariant ? (
                    <Typography variant="body2" color="text.secondary">
                      Choose your options
                    </Typography>
                  ) : null}
                </Stack>
              ) : null}
              <Typography variant="body2" color={soldOut ? "error" : lowStock ? "warning.main" : "success.main"}>
                {variantSellingActive && !selectedVariant
                  ? "Choose options to view exact availability."
                  : variantSellingActive && selectedVariant
                  ? soldOut
                    ? "This option combination is currently out of stock."
                    : "This option combination is available."
                  : soldOut
                  ? "This item is currently out of stock."
                  : product.track_stock
                  ? lowStock
                    ? `Only ${simpleQuantityAvailable} left in stock.`
                    : `${simpleQuantityAvailable} available.`
                  : "Available"}
              </Typography>
              {variantPurchaseUnavailable ? (
                <Typography variant="body2" color="error">
                  {product?.variant_purchase_unavailable_reason || "This product is temporarily unavailable."}
                </Typography>
              ) : null}
              <Stack direction="row" spacing={2} alignItems="center">
                <TextField
                  label="Quantity"
                  type="number"
                  value={quantity}
                  onChange={(event) => setQuantity(event.target.value)}
                  inputProps={{ min: 1 }}
                  sx={{ width: 120 }}
                  disabled={soldOut || variantPurchaseUnavailable || (variantSellingActive && !selectedVariant)}
                />
                {product.track_stock && !variantSellingActive ? (
                  <Chip
                    label={
                      soldOut
                        ? "Out of stock"
                        : lowStock
                        ? `Only ${simpleQuantityAvailable} left`
                        : `${simpleQuantityAvailable} available`
                    }
                    color={soldOut ? "default" : lowStock ? "warning" : "success"}
                  />
                ) : null}
                {variantSellingActive && selectedVariant ? (
                  <Chip
                    label={soldOut ? "Out of stock" : "Available"}
                    color={soldOut ? "default" : "success"}
                  />
                ) : null}
              </Stack>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<ShoppingCartCheckoutIcon />}
                  onClick={handleAdd}
                  disabled={soldOut || variantPurchaseUnavailable || (variantSellingActive && !selectedVariant)}
                  sx={{
                    borderRadius: "var(--page-btn-radius, 12px)",
                    backgroundColor: "var(--page-btn-bg, #2563eb)",
                    color: "var(--page-btn-color, #fff)",
                    boxShadow: "var(--page-btn-shadow, none)",
                    "&:hover": {
                      backgroundColor: "var(--page-btn-bg, #2563eb)",
                      filter: "brightness(0.95)",
                    },
                  }}
                >
                  Add to basket
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={goBasket}
                  sx={{
                    borderRadius: "var(--page-btn-radius, 12px)",
                    color: "var(--page-link-color, inherit)",
                    borderColor: "var(--page-link-color, rgba(148,163,184,0.6))",
                    "&:hover": {
                      borderColor: "var(--page-link-color, currentColor)",
                      backgroundColor: "rgba(255,255,255,0.04)",
                    },
                  }}
                >
                  Go to basket
                </Button>
              </Stack>
            </Stack>
          </Grid>
        </Grid>

        {detailSections.length > 0 ? (
          <Stack spacing={1.25}>
            {detailSections.map((section, index) => (
              <Accordion key={section.key} defaultExpanded={index === 0} disableGutters>
                <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls={`${section.key}-content`} id={`${section.key}-header`}>
                  <Typography variant="subtitle1" fontWeight={700}>
                    {section.label}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>{section.content}</AccordionDetails>
              </Accordion>
            ))}
          </Stack>
        ) : null}
      </Stack>
    );
  }

  const content = (
    <Box sx={{ minHeight: "70vh", pb: isMobile ? "92px" : 0 }}>
      <Box sx={{ py: { xs: 4, md: 6 } }}>
        <Container sx={{ py: 0 }}>
          {body}
        </Container>
        <Snackbar
          open={snack.open}
          autoHideDuration={3000}
          onClose={() => setSnack({ open: false, msg: "" })}
          message={snack.msg}
        />
      </Box>

      {isMobile && product ? (
        <Box
          sx={{
            position: "fixed",
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: theme.zIndex.appBar,
            bgcolor: "background.paper",
            borderTop: "1px solid",
            borderColor: "divider",
            px: 2,
            py: 1.25,
            pb: "calc(env(safe-area-inset-bottom, 0px) + 10px)",
            boxShadow: "0 -10px 24px rgba(15,23,42,0.08)",
          }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="space-between">
            <Stack spacing={0.25}>
                <Typography variant="subtitle2" fontWeight={800}>
                {displayPrice}
                </Typography>
              <Typography variant="caption" color="text.secondary">
                {variantPurchaseUnavailable
                  ? "Temporarily unavailable"
                  : variantSellingActive && !selectedVariant
                  ? "Choose options"
                  : soldOut
                  ? "Out of stock"
                  : "Ready to add"}
              </Typography>
            </Stack>
            <Button
              variant="contained"
              startIcon={<ShoppingCartCheckoutIcon />}
              onClick={handleAdd}
              disabled={soldOut || variantPurchaseUnavailable || (variantSellingActive && !selectedVariant)}
              sx={{
                minWidth: 180,
                borderRadius: "var(--page-btn-radius, 12px)",
                backgroundColor: "var(--page-btn-bg, #2563eb)",
                color: "var(--page-btn-color, #fff)",
              }}
            >
              Add to basket
            </Button>
          </Stack>
        </Box>
      ) : null}

      <Dialog
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        fullScreen={isMobile}
        fullWidth
        maxWidth="md"
      >
        <DialogContent sx={{ p: 0, bgcolor: "background.paper", position: "relative" }}>
          <IconButton
            onClick={() => setLightboxOpen(false)}
            aria-label="Close image viewer"
            sx={{ position: "absolute", top: 8, right: 8, zIndex: 2, bgcolor: "rgba(255,255,255,0.88)" }}
          >
            <CloseIcon />
          </IconButton>
          {gallery.length > 1 ? (
            <>
              <IconButton
                onClick={() => setActiveImageIndex((prev) => (prev - 1 + gallery.length) % gallery.length)}
                aria-label="Previous image"
                sx={{ position: "absolute", top: "50%", left: 8, transform: "translateY(-50%)", zIndex: 2, bgcolor: "rgba(255,255,255,0.88)" }}
              >
                <ChevronLeftIcon />
              </IconButton>
              <IconButton
                onClick={() => setActiveImageIndex((prev) => (prev + 1) % gallery.length)}
                aria-label="Next image"
                sx={{ position: "absolute", top: "50%", right: 8, transform: "translateY(-50%)", zIndex: 2, bgcolor: "rgba(255,255,255,0.88)" }}
              >
                <ChevronRightIcon />
              </IconButton>
            </>
          ) : null}
          {activeImage ? (
            <Box
              component="img"
              src={activeImage.url}
              alt={activeImage.alt || product?.name || "Product image"}
              sx={{
                width: "100%",
                maxHeight: isMobile ? "100vh" : "80vh",
                objectFit: "contain",
                display: "block",
                bgcolor: "background.paper",
              }}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </Box>
  );

  return (
    <CompanyPublic
      slugOverride={slug || undefined}
      forcedPageSlug="products"
      externalRenderOverride={{
        type: "products-detail",
        node: content,
      }}
    />
  );
};

export default ProductDetails;
