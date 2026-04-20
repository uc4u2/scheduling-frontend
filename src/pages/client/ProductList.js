import React, { useEffect, useMemo, useState } from "react";
import { api, publicSite } from "../../utils/api";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  FormControlLabel,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Snackbar,
  Stack,
  Switch,
  Tooltip,
  Typography,
} from "@mui/material";
import ShoppingCartCheckoutIcon from "@mui/icons-material/ShoppingCartCheckout";
import InfoIcon from "@mui/icons-material/Info";
import CloseIcon from "@mui/icons-material/Close";
import SiteFrame from "../../components/website/SiteFrame";
import { pageStyleToCssVars, pageStyleToBackgroundSx } from "./ServiceList";
import { addProductToCart, loadCart, CartErrorCodes } from "../../utils/cart";
import { getTenantHostMode } from "../../utils/tenant";
import PublicCatalogFilters, { UNCATEGORIZED_VALUE } from "../../components/public/PublicCatalogFilters";

const money = (v) => `$${Number(v || 0).toFixed(2)}`;

const ProductListBase = ({
  slugOverride,
  disableShell = false,
  pageStyleOverride = null,
  headingOverride,
  subheadingOverride,
}) => {
  const { slug: routeSlug } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const slug = useMemo(() => {
    if (slugOverride) return slugOverride;
    const qs = searchParams.get("site");
    if (qs) return qs;
    if (routeSlug) return routeSlug;
    try {
      return localStorage.getItem("site") || "";
    } catch (err) {
      return routeSlug || "";
    }
  }, [slugOverride, routeSlug, searchParams]);
  const isCustomDomain = getTenantHostMode() === "custom";
  const basePath = isCustomDomain ? "" : `/${slug}`;

  const embedSuffix = useMemo(() => {
    if (disableShell) return "";
    const keys = ["embed", "mode", "dialog", "primary", "text"];
    const pairs = keys
      .map((key) => {
        const val = searchParams.get(key);
        return val ? [key, val] : null;
      })
      .filter(Boolean);
    if (!pairs.length) return "";
    const qs = new URLSearchParams();
    pairs.forEach(([key, val]) => qs.set(key, val));
    return `?${qs.toString()}`;
  }, [disableShell, searchParams]);
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

  const [products, setProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [siteLoading, setSiteLoading] = useState(false);
  const [sitePayload, setSitePayload] = useState(null);
  const [error, setError] = useState("");
  const [snack, setSnack] = useState({ open: false, msg: "" });
  const [sortKey, setSortKey] = useState("featured");
  const [searchText, setSearchText] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);

  const productsPage = useMemo(() => {
    const pages = Array.isArray(sitePayload?.pages)
      ? sitePayload.pages
      : Array.isArray(sitePayload?.pages_meta)
      ? sitePayload.pages_meta
      : [];
    return (
      pages.find((p) => String(p?.slug || "").toLowerCase() === "products") ||
      pages.find((p) => String(p?.slug || "").toLowerCase() === "products-classic") ||
      null
    );
  }, [sitePayload]);

  const productsMeta = useMemo(() => {
    const meta = productsPage?.content?.meta || {};
    return meta && typeof meta === "object" ? meta : {};
  }, [productsPage]);

  const productsHeading = useMemo(() => {
    const override = String(headingOverride || "").trim();
    if (override) return override;
    const metaHeading = String(
      productsMeta.productsHeading ||
        productsMeta.products_heading ||
        productsMeta.productsTitle ||
        productsMeta.products_title ||
        ""
    ).trim();
    if (metaHeading) return metaHeading;
    return productsPage?.menu_title || productsPage?.title || "Products";
  }, [headingOverride, productsMeta, productsPage]);

  const productsSubheading = useMemo(() => {
    const override = String(subheadingOverride || "").trim();
    if (override) return override;
    const metaSub = String(
      productsMeta.productsSubheading ||
        productsMeta.products_subheading ||
        productsMeta.productsSubtitle ||
        productsMeta.products_subtitle ||
        ""
    ).trim();
    if (metaSub) return metaSub;
    return "Browse items available for purchase. Add them to your basket and check out when you are ready.";
  }, [subheadingOverride, productsMeta]);

  useEffect(() => {
    if (!slug) return;
    let alive = true;
    setLoading(true);
    setError("");
    const params = {};
    const query = String(searchText || "").trim();
    if (query) params.q = query;
    if (categoryFilter !== "all") params.category = categoryFilter;
    params.sort = sortKey === "featured" ? "newest" : sortKey;
    params.stock = inStockOnly ? "in" : "all";
    const timer = setTimeout(() => {
      api
        .get(`/public/${slug}/products`, { noCompanyHeader: true, params })
        .then(({ data }) => {
          if (!alive) return;
          setProducts(Array.isArray(data) ? data : []);
        })
        .catch(() => {
          if (!alive) return;
          setError("Unable to load products");
          setProducts([]);
        })
        .finally(() => alive && setLoading(false));
    }, 150);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [slug, searchText, categoryFilter, sortKey, inStockOnly]);

  useEffect(() => {
    if (!slug) return;
    let alive = true;
    api
      .get(`/public/${slug}/products`, {
        noCompanyHeader: true,
        params: { stock: "all", sort: "name-asc" },
      })
      .then(({ data }) => {
        if (!alive) return;
        setAllProducts(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!alive) return;
        setAllProducts([]);
      });
    return () => {
      alive = false;
    };
  }, [slug]);

  useEffect(() => {
    if (!slug || disableShell) return;
    let mounted = true;
    setSiteLoading(true);
    publicSite
      .getWebsiteShell(slug)
      .then((data) => {
        if (!mounted) return;
        setSitePayload(data);
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
  }, [slug, disableShell]);

  const categoryOptions = useMemo(() => {
    const source = Array.isArray(allProducts) && allProducts.length ? allProducts : products;
    const counts = new Map();
    (Array.isArray(source) ? source : []).forEach((item) => {
      const name = String(item?.category || "").trim();
      if (!name) {
        counts.set(UNCATEGORIZED_VALUE, (counts.get(UNCATEGORIZED_VALUE) || 0) + 1);
        return;
      }
      counts.set(name, (counts.get(name) || 0) + 1);
    });
    const named = Array.from(counts.entries())
      .filter(([name]) => name !== UNCATEGORIZED_VALUE)
      .map(([name, count]) => ({ value: name, label: name, count }))
      .sort((a, b) => a.label.localeCompare(b.label));
    if (counts.has(UNCATEGORIZED_VALUE)) {
      named.push({ value: UNCATEGORIZED_VALUE, label: "Uncategorized", count: counts.get(UNCATEGORIZED_VALUE) });
    }
    return named;
  }, [allProducts, products]);

  const visibleProducts = useMemo(() => {
    return Array.isArray(products) ? products : [];
  }, [products]);

  const handleAdd = (product) => {
    try {
      const next = addProductToCart(product, 1);
      const entry = next.find((i) => i.id === `product-${product.id}`);
      const qty = entry?.quantity || 1;
      setSnack({ open: true, msg: `${product.name} added to basket (${qty})` });
    } catch (error) {
      const mixed = error?.code === CartErrorCodes.MIXED_TYPES;
      const message = mixed
        ? "Please finish booking your service or clear the basket before adding retail products."
        : "Unable to add this product to your basket right now.";
      setSnack({ open: true, msg: message });
    }
  };

  const goToDetails = (productId) => {
    if (!slug) return;
    navigate(`${basePath}/products/${productId}${embedSuffix}`);
  };

  const openImagePreview = (src, alt) => {
    if (!src) return;
    setImagePreview({ src, alt: alt || "Preview" });
  };

  const closeImagePreview = () => setImagePreview(null);

  const goToBasket = () => {
    if (!basketHref) return;
    navigate(basketHref);
  };

  const hasCartItems = loadCart().length > 0;
  const productSortOptions = [
    { value: "featured", label: "Featured" },
    { value: "newest", label: "Newest" },
    { value: "price-asc", label: "Price: Low to High" },
    { value: "price-desc", label: "Price: High to Low" },
    { value: "name-asc", label: "Name: A to Z" },
    { value: "name-desc", label: "Name: Z to A" },
  ];
  const selectedCategoryLabel = useMemo(() => {
    if (categoryFilter === "all") return "";
    return categoryOptions.find((item) => item.value === categoryFilter)?.label || categoryFilter;
  }, [categoryFilter, categoryOptions]);
  const productFiltersActive = Boolean(
    String(searchText || "").trim() ||
      categoryFilter !== "all" ||
      sortKey !== "featured" ||
      inStockOnly
  );
  const clearProductFilters = () => {
    setSearchText("");
    setCategoryFilter("all");
    setSortKey("featured");
    setInStockOnly(false);
  };

  const pageStyleCssVars = useMemo(() => (pageStyleOverride ? pageStyleToCssVars(pageStyleOverride) : undefined), [pageStyleOverride]);
  const pageStyleBackground = useMemo(() => (pageStyleOverride ? pageStyleToBackgroundSx(pageStyleOverride) : {}), [pageStyleOverride]);
  const catalogCardSx = {
    height: "100%",
    display: "flex",
    flexDirection: "column",
    borderRadius: "14px",
    backgroundColor: "var(--page-card-bg, rgba(255,255,255,0.96))",
    boxShadow: "0 14px 34px rgba(15,23,42,0.075)",
    border: "1px solid rgba(148,163,184,0.2)",
    color: "var(--page-body-color)",
    overflow: "hidden",
    transition: "transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease",
    "&:hover": {
      transform: "translateY(-2px)",
      boxShadow: "0 18px 42px rgba(15,23,42,0.11)",
      borderColor: "rgba(100,116,139,0.28)",
    },
  };
  const catalogBadgeSx = {
    height: 24,
    borderRadius: "7px",
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: "0.015em",
    "& .MuiChip-label": { px: 0.9 },
  };
  const primaryButtonSx = {
    borderRadius: "10px",
    backgroundColor: "var(--page-btn-bg, #2563eb)",
    color: "var(--page-btn-color, #fff)",
    minHeight: 42,
    fontWeight: 750,
    textTransform: "none",
    boxShadow: "0 10px 22px rgba(15,23,42,0.12)",
    "&:hover": {
      backgroundColor: "var(--page-btn-bg, #2563eb)",
      filter: "brightness(0.95)",
      boxShadow: "0 14px 28px rgba(15,23,42,0.16)",
    },
  };
  const outlineButtonSx = {
    borderRadius: "10px",
    color: "var(--page-link-color, inherit)",
    borderColor: "var(--page-link-color, rgba(148,163,184,0.6))",
    minHeight: 42,
    fontWeight: 700,
    textTransform: "none",
    "&:hover": {
      borderColor: "var(--page-link-color, currentColor)",
      backgroundColor: "rgba(148,163,184,0.08)",
    },
  };

  const content = (
    <Container
      maxWidth={false}
      sx={{
        py: { xs: 4, md: 6 },
        px: { xs: 2, md: 4, xl: 6 },
        maxWidth: 1600,
        mx: "auto",
        ...pageStyleBackground,
      }}
      style={pageStyleCssVars}
    >
      <Box sx={{ mb: 4, textAlign: "center" }}>
        <Typography variant="h3" fontWeight={800} gutterBottom>
          {productsHeading}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {productsSubheading}
        </Typography>
        {hasCartItems && (
          <Button
            variant="contained"
            sx={{ mt: 2, ...primaryButtonSx }}
            startIcon={<ShoppingCartCheckoutIcon />}
            onClick={goToBasket}
          >
            View Basket
          </Button>
        )}
      </Box>

      <PublicCatalogFilters
        showSearch
        searchLabel="Search products"
        searchPlaceholder="Search by name or SKU"
        searchValue={searchText}
        onSearchChange={setSearchText}
        categoryValue={categoryFilter}
        onCategoryChange={setCategoryFilter}
        categoryOptions={categoryOptions}
        showCategory={categoryOptions.length > 0}
        showSort
        sortValue={sortKey}
        onSortChange={setSortKey}
        sortOptions={productSortOptions}
        toggleNode={
          <FormControlLabel
            control={
              <Switch
                checked={inStockOnly}
                onChange={(event) => setInStockOnly(event.target.checked)}
                color="primary"
              />
            }
            label="Hide out-of-stock"
            sx={{ mr: 0 }}
          />
        }
        resultSummary={`Showing ${visibleProducts.length} ${visibleProducts.length === 1 ? "product" : "products"}`}
        activeSummary={
          productFiltersActive
            ? `Showing ${visibleProducts.length} ${visibleProducts.length === 1 ? "product" : "products"}${
                selectedCategoryLabel ? ` in ${selectedCategoryLabel}` : ""
              }`
            : ""
        }
        hasActiveFilters={productFiltersActive}
        onClear={clearProductFilters}
        showCategoryChips={categoryOptions.length > 0}
      />

      {loading ? (
        <Box sx={{ py: 8, textAlign: "center" }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Typography color="error" textAlign="center">
          {error}
        </Typography>
      ) : visibleProducts.length === 0 ? (
        <Box sx={{ py: 6, textAlign: "center" }}>
          <Typography textAlign="center" color="text.secondary" sx={{ mb: 2 }}>
            No products match these filters.
          </Typography>
          {productFiltersActive && (
            <Button variant="outlined" onClick={clearProductFilters} sx={{ textTransform: "none" }}>
              Clear filters
            </Button>
          )}
        </Box>
      ) : (
        <Grid container spacing={3} justifyContent="center">
          {visibleProducts.map((product) => {
            const quantity = Number(product.qty_on_hand || 0);
            const soldOut = Boolean(product.track_stock) && quantity <= 0;
            const threshold = Number(product.low_stock_threshold || 0);
            const lowStock = Boolean(product.track_stock) && quantity > 0 && ((threshold > 0 && quantity <= threshold) || (threshold <= 0 && quantity <= 3));

            return (
              <Grid item xs={12} sm={6} md={4} lg={3} xl={2} key={product.id}>
                <Card
                  variant="outlined"
                  sx={catalogCardSx}
                >
                  <Box sx={{ position: "relative" }}>
                    {product.images && product.images.length > 0 ? (
                      <Box
                        sx={{
                          position: "relative",
                          pt: "56.25%",
                          overflow: "hidden",
                          cursor: "zoom-in",
                          "& img": {
                            transition: "transform 0.35s ease",
                            transform: "scale(1)",
                          },
                          "&:hover img": {
                            transform: "scale(1.12)",
                          },
                        }}
                        onClick={() => openImagePreview(product.images[0].url, product.name)}
                      >
                        <Box
                          component="img"
                          src={product.images[0].url}
                          alt={product.name}
                          loading="lazy"
                          sx={{
                            position: "absolute",
                            inset: 0,
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            objectPosition: "center 56%",
                          }}
                        />
                      </Box>
                    ) : (
                      <Box
                        sx={{
                          pt: "56.25%",
                          position: "relative",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          bgcolor: "action.hover",
                        }}
                      >
                        <Box
                          sx={{
                            position: "absolute",
                            inset: 0,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Typography variant="overline" color="text.secondary">
                            No image
                          </Typography>
                        </Box>
                      </Box>
                    )}

                    {soldOut && (
                      <Chip
                        label="Sold out"
                        size="small"
                        sx={{
                          ...catalogBadgeSx,
                          position: "absolute",
                          top: 12,
                          left: 12,
                          bgcolor: "rgba(15,23,42,0.78)",
                          color: "#fff",
                        }}
                      />
                    )}
                    {!soldOut && lowStock && (
                      <Chip
                        label={`Only ${quantity} left`}
                        size="small"
                        sx={{
                          ...catalogBadgeSx,
                          position: "absolute",
                          top: 12,
                          left: 12,
                          bgcolor: "rgba(245,158,11,0.92)",
                          color: "#fff",
                        }}
                      />
                    )}
                  </Box>

                  <CardContent sx={{ flexGrow: 1, display: "flex", flexDirection: "column", p: 2.25 }}>
                    <Typography
                      variant="h6"
                      sx={{
                        color: "var(--page-heading-color, inherit)",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        minHeight: "2.6em",
                        maxHeight: "2.6em",
                        lineHeight: 1.25,
                        fontWeight: 760,
                        letterSpacing: "-0.01em",
                      }}
                    >
                      {product.name}
                    </Typography>
                    <Stack direction="row" spacing={0.75} sx={{ flexWrap: "wrap", rowGap: 0.75, mt: 0.75 }}>
                      {product.category && (
                        <Chip
                          label={product.category}
                          size="small"
                          variant="outlined"
                          sx={{
                            ...catalogBadgeSx,
                            bgcolor: "rgba(255,255,255,0.66)",
                            borderColor: "rgba(148,163,184,0.42)",
                            color: "rgba(51,65,85,0.86)",
                          }}
                        />
                      )}
                      {product.is_digital && (
                        <Chip
                          label="Digital"
                          size="small"
                          sx={{
                            ...catalogBadgeSx,
                            bgcolor: "rgba(14,165,233,0.12)",
                            color: "rgba(3,105,161,0.95)",
                          }}
                        />
                      )}
                    </Stack>
                    <Typography
                      variant="body2"
                      sx={{
                        mt: 1.2,
                        minHeight: 78,
                        color: "color-mix(in srgb, var(--page-body-color, #475569) 78%, transparent)",
                        display: "-webkit-box",
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        lineHeight: 1.45,
                      }}
                    >
                      {product.description || ""}
                    </Typography>

                    {Array.isArray(product.tags) && product.tags.length > 0 && (
                      <Stack direction="row" spacing={0.75} sx={{ flexWrap: "wrap", rowGap: 0.75, mt: 1 }}>
                        {product.tags.slice(0, 4).map((tag, index) => (
                          <Chip key={`${product.id}-tag-${index}`} label={tag} size="small" variant="outlined" sx={catalogBadgeSx} />
                        ))}
                      </Stack>
                    )}

                    <Box sx={{ mt: "auto" }}>
                      <Typography
                        variant="subtitle2"
                        sx={{
                          mt: 1.5,
                          color: "var(--page-link-color, inherit)",
                          fontWeight: 800,
                          fontSize: 14,
                        }}
                      >
                        {money(product.price)}
                      </Typography>
                      {product.track_stock && (
                        <Chip
                          label={soldOut ? "Out of stock" : lowStock ? `Only ${quantity} left` : `${quantity} in stock`}
                          size="small"
                          sx={{
                            ...catalogBadgeSx,
                            mt: 1,
                            bgcolor: soldOut
                              ? "rgba(15,23,42,0.08)"
                              : lowStock
                              ? "rgba(245,158,11,0.14)"
                              : "rgba(16,185,129,0.12)",
                            color: soldOut
                              ? "rgba(51,65,85,0.78)"
                              : lowStock
                              ? "rgba(146,64,14,0.95)"
                              : "rgba(6,95,70,0.95)",
                          }}
                        />
                      )}
                    </Box>

                    <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
                      <Button
                        variant="outlined"
                        fullWidth
                        startIcon={<InfoIcon />}
                        onClick={() => goToDetails(product.id)}
                        sx={outlineButtonSx}
                      >
                        Details
                      </Button>
                      <Button
                        variant="contained"
                        fullWidth
                        startIcon={<ShoppingCartCheckoutIcon />}
                        onClick={() => handleAdd(product)}
                        disabled={soldOut}
                        sx={{
                          ...primaryButtonSx,
                          fontWeight: 600,
                          textTransform: "none",
                          py: 1.1,
                        }}
                      >
                        Add
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={() => setSnack({ open: false, msg: "" })}
        message={snack.msg}
      />

      {!!imagePreview && (
        <Dialog
          open={Boolean(imagePreview)}
          onClose={closeImagePreview}
          fullWidth
          maxWidth="sm"
          PaperProps={{
            sx: {
              maxWidth: 560,
              borderRadius: 2,
              overflow: "hidden",
            },
          }}
        >
          <DialogTitle sx={{ py: 1.5 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Typography variant="h6" fontWeight={700} noWrap>
                {imagePreview?.alt || "Image preview"}
              </Typography>
              <Tooltip title="Close">
                <IconButton onClick={closeImagePreview} size="small">
                  <CloseIcon />
                </IconButton>
              </Tooltip>
            </Stack>
          </DialogTitle>
          <DialogContent dividers sx={{ p: 0 }}>
            <Box
              component="img"
              src={imagePreview?.src}
              alt={imagePreview?.alt || "Preview"}
              loading="lazy"
              sx={{
                width: "100%",
                height: "auto",
                display: "block",
                maxHeight: "70vh",
                objectFit: "contain",
                bgcolor: "background.paper",
              }}
            />
          </DialogContent>
        </Dialog>
      )}
    </Container>
  );

  if (disableShell) {
    return content;
  }

  const renderShell = (node) => {
    if (!slug) return node;
    return (
      <SiteFrame
        slug={slug}
        activeKey="products"
        initialSite={sitePayload || undefined}
        disableFetch={Boolean(sitePayload)}
        wrapChildrenInContainer={false}
      >
        {node}
      </SiteFrame>
    );
  };

  if (siteLoading && !sitePayload) {
    return renderShell(
      <Box sx={{ py: 8, textAlign: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  return renderShell(content);
};

const ProductList = (props) => <ProductListBase {...props} />;

export default ProductList;

export function ProductListEmbedded({ slug, pageStyle, heading, subheading }) {
  return (
    <ProductListBase
      slugOverride={slug}
      disableShell
      pageStyleOverride={pageStyle}
      headingOverride={heading}
      subheadingOverride={subheading}
    />
  );
}
