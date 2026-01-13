import React, { useEffect, useMemo, useState } from "react";
import { api, publicSite } from "../../utils/api";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  Chip,
  CircularProgress,
  Container,
  FormControlLabel,
  Grid,
  MenuItem,
  Snackbar,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import ShoppingCartCheckoutIcon from "@mui/icons-material/ShoppingCartCheckout";
import InfoIcon from "@mui/icons-material/Info";
import SiteFrame from "../../components/website/SiteFrame";
import { pageStyleToCssVars, pageStyleToBackgroundSx } from "./ServiceList";
import { addProductToCart, loadCart, CartErrorCodes } from "../../utils/cart";
import { getTenantHostMode } from "../../utils/tenant";

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
  const [loading, setLoading] = useState(true);
  const [siteLoading, setSiteLoading] = useState(false);
  const [sitePayload, setSitePayload] = useState(null);
  const [error, setError] = useState("");
  const [snack, setSnack] = useState({ open: false, msg: "" });
  const [sortKey, setSortKey] = useState("featured");
  const [inStockOnly, setInStockOnly] = useState(false);

  const productsPage = useMemo(() => {
    const pages = Array.isArray(sitePayload?.pages) ? sitePayload.pages : [];
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
    api
      .get(`/public/${slug}/products`, { noCompanyHeader: true })
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
    return () => {
      alive = false;
    };
  }, [slug]);

  useEffect(() => {
    if (!slug || disableShell) return;
    let mounted = true;
    setSiteLoading(true);
    publicSite
      .getBySlug(slug)
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

  const visibleProducts = useMemo(() => {
    let list = Array.isArray(products) ? [...products] : [];
    if (inStockOnly) {
      list = list.filter((item) => !item.track_stock || Number(item.qty_on_hand || 0) > 0);
    }
    switch (sortKey) {
      case 'price-asc':
        list.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
        break;
      case 'price-desc':
        list.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
        break;
      case 'name-desc':
        list.sort((a, b) => String(b.name || '').localeCompare(String(a.name || '')));
        break;
      case 'name-asc':
        list.sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
        break;
      default:
        break;
    }
    return list;
  }, [products, inStockOnly, sortKey]);

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

  const goToBasket = () => {
    if (!basketHref) return;
    navigate(basketHref);
  };

  const hasCartItems = loadCart().length > 0;

  const pageStyleCssVars = useMemo(() => (pageStyleOverride ? pageStyleToCssVars(pageStyleOverride) : undefined), [pageStyleOverride]);
  const pageStyleBackground = useMemo(() => (pageStyleOverride ? pageStyleToBackgroundSx(pageStyleOverride) : {}), [pageStyleOverride]);
  const primaryButtonSx = {
    borderRadius: "var(--page-btn-radius, 12px)",
    backgroundColor: "var(--page-btn-bg, #2563eb)",
    color: "var(--page-btn-color, #fff)",
    boxShadow: "var(--page-btn-shadow, none)",
    "&:hover": {
      backgroundColor: "var(--page-btn-bg, #2563eb)",
      filter: "brightness(0.95)",
    },
  };
  const outlineButtonSx = {
    borderRadius: "var(--page-btn-radius, 12px)",
    color: "var(--page-link-color, inherit)",
    borderColor: "var(--page-link-color, rgba(148,163,184,0.6))",
    "&:hover": {
      borderColor: "var(--page-link-color, currentColor)",
      backgroundColor: "rgba(255,255,255,0.04)",
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

      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={2}
        justifyContent={{ xs: "flex-start", md: "space-between" }}
        alignItems={{ xs: "stretch", md: "center" }}
        sx={{ mb: 3 }}
      >
        <TextField
          select
          label="Sort by"
          size="small"
          value={sortKey}
          onChange={(event) => setSortKey(event.target.value)}
          sx={{ minWidth: { xs: 180, md: 220 } }}
        >
          <MenuItem value="featured">Featured</MenuItem>
          <MenuItem value="price-asc">Price: Low to High</MenuItem>
          <MenuItem value="price-desc">Price: High to Low</MenuItem>
          <MenuItem value="name-asc">Name: A to Z</MenuItem>
          <MenuItem value="name-desc">Name: Z to A</MenuItem>
        </TextField>
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
      </Stack>

      {loading ? (
        <Box sx={{ py: 8, textAlign: "center" }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Typography color="error" textAlign="center">
          {error}
        </Typography>
      ) : visibleProducts.length === 0 ? (
        <Typography textAlign="center">
          {inStockOnly ? "No products currently in stock." : "No products available right now."}
        </Typography>
      ) : (
        <Grid container spacing={3}>
          {visibleProducts.map((product) => {
            const quantity = Number(product.qty_on_hand || 0);
            const soldOut = Boolean(product.track_stock) && quantity <= 0;
            const lowStock = Boolean(product.track_stock) && quantity > 0 && quantity <= 3;

            return (
              <Grid item xs={12} sm={6} md={4} lg={3} xl={2} key={product.id}>
                <Card sx={{ height: "100%", display: "flex", flexDirection: "column", borderRadius: 3 }}>
                  <Box sx={{ position: "relative" }}>
                    {product.images && product.images.length > 0 ? (
                      <CardMedia
                        component="img"
                        height="220"
                        image={product.images[0].url}
                        alt={product.name}
                        sx={{ objectFit: "cover" }}
                      />
                    ) : (
                      <Box
                        sx={{
                          height: 220,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          bgcolor: "action.hover",
                        }}
                      >
                        <Typography variant="overline" color="text.secondary">
                          No image
                        </Typography>
                      </Box>
                    )}

                    {soldOut && (
                      <Chip
                        label="Sold out"
                        size="small"
                        sx={{ position: "absolute", top: 12, left: 12, bgcolor: "rgba(33,33,33,0.72)", color: "#fff" }}
                      />
                    )}
                    {!soldOut && lowStock && (
                      <Chip
                        label={`Only ${quantity} left`}
                        color="warning"
                        size="small"
                        sx={{ position: "absolute", top: 12, left: 12 }}
                      />
                    )}
                  </Box>

                  <CardContent sx={{ flexGrow: 1, display: "flex", flexDirection: "column", gap: 1.5 }}>
                    <Typography variant="h6" fontWeight={700} noWrap>
                      {product.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ minHeight: 60 }}>
                      {product.description || ""}
                    </Typography>

                    {Array.isArray(product.tags) && product.tags.length > 0 && (
                      <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", rowGap: 1 }}>
                        {product.tags.slice(0, 4).map((tag, index) => (
                          <Chip key={`${product.id}-tag-${index}`} label={tag} size="small" variant="outlined" />
                        ))}
                      </Stack>
                    )}

                    <Box sx={{ mt: "auto" }}>
                      <Typography variant="subtitle1" fontWeight={700}>
                        {money(product.price)}
                      </Typography>
                      {product.track_stock && (
                        <Chip
                          label={soldOut ? "Out of stock" : lowStock ? `Only ${quantity} left` : `${quantity} in stock`}
                          color={soldOut ? "default" : lowStock ? "warning" : "success"}
                          size="small"
                          sx={{ mt: 1 }}
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
                        sx={primaryButtonSx}
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
