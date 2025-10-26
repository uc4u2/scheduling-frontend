import React, { useEffect, useMemo, useState } from "react";
import { api } from "../../utils/api";
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
import PublicPageShell from "./PublicPageShell";
import { addProductToCart, loadCart, CartErrorCodes } from "../../utils/cart";

const money = (v) => `$${Number(v || 0).toFixed(2)}`;

const ProductList = () => {
  const { slug: routeSlug } = useParams();
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

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [snack, setSnack] = useState({ open: false, msg: "" });
  const [sortKey, setSortKey] = useState("featured");
  const [inStockOnly, setInStockOnly] = useState(false);

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
    navigate(`/${slug}/products/${productId}${embedSuffix}`);
  };

  const goToBasket = () => {
    if (!slug) return;
    navigate(`/${slug}/basket${embedSuffix}`);
  };

  const hasCartItems = loadCart().length > 0;

  const content = (
    <Container sx={{ py: { xs: 4, md: 6 } }}>
      <Box sx={{ mb: 4, textAlign: "center" }}>
        <Typography variant="h3" fontWeight={800} gutterBottom>
          Products
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Browse items available for purchase. Add them to your basket and check out when you are ready.
        </Typography>
        {hasCartItems && (
          <Button
            variant="contained"
            sx={{ mt: 2 }}
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
              <Grid item xs={12} sm={6} md={4} key={product.id}>
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
                      <Button variant="outlined" fullWidth startIcon={<InfoIcon />} onClick={() => goToDetails(product.id)}>
                        Details
                      </Button>
                      <Button
                        variant="contained"
                        fullWidth
                        startIcon={<ShoppingCartCheckoutIcon />}
                        onClick={() => handleAdd(product)}
                        disabled={soldOut}
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

  return <PublicPageShell activeKey="__products">{content}</PublicPageShell>;
};

export default ProductList;
