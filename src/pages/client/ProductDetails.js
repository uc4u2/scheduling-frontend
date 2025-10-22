import React, { useEffect, useMemo, useState } from "react";
import { api } from "../../utils/api";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  Box,
  Breadcrumbs,
  Button,
  Chip,
  CircularProgress,
  Container,
  Grid,
  IconButton,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ShoppingCartCheckoutIcon from "@mui/icons-material/ShoppingCartCheckout";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import PublicPageShell from "./PublicPageShell";
import { addProductToCart, CartErrorCodes } from "../../utils/cart";

const money = (v) => `$${Number(v || 0).toFixed(2)}`;

const ProductDetails = () => {
  const { slug: routeSlug, productId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const slug = useMemo(() => {
    const qs = searchParams.get("site");
    if (qs) return qs;
    if (routeSlug) return routeSlug;
    try {
      return localStorage.getItem("site") || "";
    } catch (err) {
      return routeSlug || "";
    }
  }, [routeSlug, searchParams]);

  const embedSuffix = useMemo(() => {
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
  }, [searchParams]);

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [snack, setSnack] = useState({ open: false, msg: "" });

  useEffect(() => {
    if (!slug || !productId) return;
    let alive = true;
    setLoading(true);
    setError("");
    api
      .get(`/public/${slug}/products/${productId}`, { noCompanyHeader: true })
      .then(({ data }) => {
        if (!alive) return;
        setProduct(data);
        setQuantity(1);
        setActiveImageIndex(0);
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
  }, [slug, productId]);

  const handleAdd = () => {
    if (!product || soldOut) return;
    const qty = Math.max(1, Number(quantity) || 1);
    try {
      addProductToCart(product, qty);
      setSnack({ open: true, msg: `${product.name} added to basket` });
    } catch (error) {
      const mixed = error?.code === CartErrorCodes.MIXED_TYPES;
      const message = mixed
        ? "Please finish booking your service or clear the basket before adding retail products."
        : "Unable to add this product to your basket right now.";
      setSnack({ open: true, msg: message });
    }
  };

  const goBack = () => {
    if (!slug) return;
    navigate(`/${slug}/products${embedSuffix}`);
  };
  const goBasket = () => {
    if (!slug) return;
    navigate(`/${slug}/basket${embedSuffix}`);
  };

  const gallery = useMemo(() => (Array.isArray(product?.images) ? product.images : []), [product]);
  const activeImage = gallery[activeImageIndex] || gallery[0] || null;
  const quantityAvailable = Number(product?.qty_on_hand || 0);
  const soldOut = Boolean(product?.track_stock) && quantityAvailable <= 0;
  const lowStock = Boolean(product?.track_stock) && quantityAvailable > 0 && quantityAvailable <= 3;

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
      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <Stack spacing={3}>
            <Box
              sx={{
                position: "relative",
                width: "100%",
                pt: "75%",
                borderRadius: 3,
                overflow: "hidden",
                bgcolor: "action.hover",
              }}
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

              {soldOut && (
                <Chip
                  label="Sold out"
                  size="small"
                  sx={{ position: "absolute", top: 12, left: 12, bgcolor: "rgba(33,33,33,0.72)", color: "#fff" }}
                />
              )}
              {!soldOut && lowStock && (
                <Chip
                  label={`Only ${quantityAvailable} left`}
                  color="warning"
                  size="small"
                  sx={{ position: "absolute", top: 12, left: 12 }}
                />
              )}
            </Box>

            {gallery.length > 1 && (
              <Stack direction="row" spacing={1} sx={{ overflowX: "auto", pb: 1 }}>
                {gallery.map((img, index) => (
                  <Box
                    key={img.id || `${product.id}-thumb-${index}`}
                    component="img"
                    src={img.url}
                    alt={img.filename || product.name}
                    onClick={() => setActiveImageIndex(index)}
                    sx={{
                      width: 72,
                      height: 72,
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
            )}
          </Stack>
        </Grid>

        <Grid item xs={12} md={6}>
          <Stack spacing={3}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <IconButton onClick={goBack}>
                <ArrowBackIcon />
              </IconButton>
              <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />}>
                <Button variant="text" onClick={goBack} size="small">
                  Products
                </Button>
                <Typography color="text.primary">{product.name}</Typography>
              </Breadcrumbs>
            </Box>

            <Typography variant="h3" fontWeight={800}>
              {product.name}
            </Typography>
            <Typography variant="h5" color="primary" fontWeight={700}>
              {money(product.price)}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {product.description || ""}
            </Typography>
            {product.sku && (
              <Chip label={`SKU ${product.sku}`} variant="outlined" size="small" sx={{ alignSelf: "flex-start" }} />
            )}
            {Array.isArray(product.tags) && product.tags.length > 0 && (
              <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", rowGap: 1 }}>
                {product.tags.slice(0, 6).map((tag, index) => (
                  <Chip key={`${product.id}-detail-tag-${index}`} label={tag} size="small" variant="outlined" />
                ))}
              </Stack>
            )}
            {soldOut && (
              <Typography variant="body2" color="error">
                This item is currently out of stock.
              </Typography>
            )}

            <Stack direction="row" spacing={2} alignItems="center">
              <TextField
                label="Quantity"
                type="number"
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
                inputProps={{ min: 1 }}
                sx={{ width: 120 }}
                disabled={soldOut}
              />
              {product.track_stock && (
                <Chip
                  label={soldOut ? "Out of stock" : lowStock ? `Only ${quantityAvailable} left` : `${quantityAvailable} available`}
                  color={soldOut ? "default" : lowStock ? "warning" : "success"}
                />
              )}
            </Stack>

            <Stack direction="row" spacing={2}>
              <Button
                variant="contained"
                size="large"
                startIcon={<ShoppingCartCheckoutIcon />}
                onClick={handleAdd}
                disabled={soldOut}
              >
                Add to basket
              </Button>
              <Button variant="outlined" size="large" onClick={goBasket}>
                Go to basket
              </Button>
            </Stack>
          </Stack>
        </Grid>
      </Grid>
    );
  }

  const content = (
    <Container sx={{ py: { xs: 4, md: 6 } }}>
      {body}
      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={() => setSnack({ open: false, msg: "" })}
        message={snack.msg}
      />
    </Container>
  );

  return <PublicPageShell activeKey="__products">{content}</PublicPageShell>;
};

export default ProductDetails;
