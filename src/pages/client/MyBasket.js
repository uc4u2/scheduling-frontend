import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams, useLocation } from "react-router-dom";
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Snackbar,
  Alert,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import ShoppingCartCheckoutIcon from "@mui/icons-material/ShoppingCartCheckout";
import PublicPageShell from "./PublicPageShell";
import { CartTypes, loadCart, removeCartItem, saveCart } from "../../utils/cart";
import { releasePendingCheckout } from "../../utils/hostedCheckout";

const money = (v) => `$${Number(v || 0).toFixed(2)}`;

const lineSubtotal = (item) => {
  if (item.type === CartTypes.PRODUCT) {
    return Number(item.price || 0) * (item.quantity || 1);
  }
  const base = Number(item.price || 0);
  const addonTotal = Array.isArray(item.addons)
    ? item.addons.reduce((sum, addon) => sum + Number(addon.base_price || 0), 0)
    : 0;
  return base + addonTotal;
};

const MyBasket = () => {
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

  const location = useLocation();

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

  const [items, setItems] = useState(() => loadCart());
  const [snack, setSnack] = useState({ open: false, msg: "" });

  const [cancelHandled, setCancelHandled] = useState(false);

  useEffect(() => {
    setItems(loadCart());
  }, []);

  useEffect(() => {
    if (cancelHandled) return;
    const canceledFlag = searchParams.get("canceled");
    if (canceledFlag === "1" && slug) {
      setCancelHandled(true);
      const cancelSession = async () => {
        try {
          const result = await releasePendingCheckout({ slug });
          setItems(loadCart());
          const message = result?.released
            ? "Checkout cancelled. Your items are still in the basket."
            : result?.status === "missing_id"
              ? "Checkout session already cleared."
              : "We attempted to release your pending checkout. Please try again if the problem persists.";
          setSnack({ open: true, msg: message });
        } catch (error) {
          setSnack({ open: true, msg: "We could not confirm the cancellation, but your items remain in the basket." });
        } finally {
          try {
            const params = new URLSearchParams(searchParams);
            params.delete("canceled");
            const nextSearch = params.toString();
            navigate({ pathname: location.pathname, search: nextSearch ? `?${nextSearch}` : "" }, { replace: true });
          } catch {
            // ignore navigation issues
          }
        }
      };
      cancelSession();
    }
  }, [cancelHandled, searchParams, slug, navigate, location]);

  const updateQuantity = (item, quantity) => {
    const qty = Math.max(1, Number(quantity) || 1);
    const next = items.map((it) =>
      it.id === item.id
        ? {
            ...it,
            quantity: qty,
          }
        : it
    );
    saveCart(next);
    setItems(next);
  };

  const removeItem = (id) => {
    const next = removeCartItem(id);
    setItems(next);
    setSnack({ open: true, msg: "Item removed" });
  };

  const hasServiceItems = items.some((it) => it.type !== CartTypes.PRODUCT);
  const hasProductItems = items.some((it) => it.type === CartTypes.PRODUCT);
  const mixedCart = hasServiceItems && hasProductItems;

  const proceed = () => {
    if (mixedCart) {
      setSnack({ open: true, msg: "Services and retail products must be checked out separately. Please complete one checkout before starting another." });
      return;
    }
    navigate(`/${slug}/checkout${embedSuffix}`);
  };
  const continueShopping = () => navigate(`/${slug}/products${embedSuffix}`);

  const totals = useMemo(() => {
    const serviceTotal = items
      .filter((it) => it.type !== CartTypes.PRODUCT)
      .reduce((sum, it) => sum + lineSubtotal(it), 0);
    const productTotal = items
      .filter((it) => it.type === CartTypes.PRODUCT)
      .reduce((sum, it) => sum + lineSubtotal(it), 0);
    return {
      serviceTotal,
      productTotal,
      grandTotal: serviceTotal + productTotal,
    };
  }, [items]);


  const content = (
    <Container sx={{ py: { xs: 4, md: 6 } }}>
      <Stack spacing={3}>
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", md: "center" }}>
          <Box>
            <Typography variant="h3" fontWeight={800}>
              Your Basket
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Review services and products before completing your purchase.
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" onClick={continueShopping}>
              Continue shopping
            </Button>
            <Button
              variant="contained"
              startIcon={<ShoppingCartCheckoutIcon />}
              onClick={proceed}
              disabled={items.length === 0 || mixedCart}
            >
              Proceed to checkout
            </Button>
          </Stack>
        </Stack>

        {mixedCart && (
          <Alert severity="warning">
            Services and retail products must be checked out separately. Please finish one purchase before starting the other.
          </Alert>
        )}

        {items.length === 0 ? (
          <Box sx={{ py: 6, textAlign: "center" }}>
            <Typography color="text.secondary">Your basket is empty.</Typography>
            <Button sx={{ mt: 2 }} variant="contained" onClick={continueShopping}>
              Browse products
            </Button>
          </Box>
        ) : (
          <Grid container spacing={4}>
            <Grid item xs={12} md={7}>
              <Stack spacing={2}>
                {items.map((item) => (
                  <Card key={item.id} variant="outlined" sx={{ borderRadius: 3 }}>
                    <CardContent>
                      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ xs: "flex-start", sm: "center" }}>
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="h6" fontWeight={700}>
                            {item.name}
                          </Typography>
                          {item.type === CartTypes.PRODUCT ? (
                            <Typography variant="body2" color="text.secondary">
                              {item.description || ""}
                            </Typography>
                          ) : (
                            <List dense sx={{ mt: 1 }}>
                              <ListItem disablePadding>
                                <ListItemText
                                  primary={`Service on ${item.date} at ${item.start_time}`}
                                  secondary={item.artist_name ? `With ${item.artist_name}` : null}
                                />
                              </ListItem>
                              {Array.isArray(item.addons) && item.addons.length > 0 && (
                                <ListItem disablePadding>
                                  <ListItemText
                                    primary="Add-ons"
                                    secondary={item.addons.map((addon) => addon.name).join(", ")}
                                  />
                                </ListItem>
                              )}
                            </List>
                          )}
                        </Box>

                        <Stack spacing={1} alignItems={{ xs: "stretch", sm: "flex-end" }}>
                          <Typography variant="subtitle1" fontWeight={700}>
                            {money(lineSubtotal(item))}
                          </Typography>
                          {item.type === CartTypes.PRODUCT ? (
                            <TextField
                              label="Qty"
                              type="number"
                              size="small"
                              value={item.quantity || 1}
                              onChange={(event) => updateQuantity(item, event.target.value)}
                              inputProps={{ min: 1 }}
                              sx={{ width: 100 }}
                            />
                          ) : (
                            <Typography variant="caption" color="text.secondary">
                              {item.artist_name || "Service"}
                            </Typography>
                          )}
                          <IconButton onClick={() => removeItem(item.id)}>
                            <DeleteIcon />
                          </IconButton>
                        </Stack>
                      </Stack>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            </Grid>

            <Grid item xs={12} md={5}>
              <Card variant="outlined" sx={{ borderRadius: 3 }}>
                <CardContent>
                  <Typography variant="h6" fontWeight={700} gutterBottom>
                    Order summary
                  </Typography>
                  <Stack spacing={1.5}>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography color="text.secondary">Services</Typography>
                      <Typography fontWeight={600}>{money(totals.serviceTotal)}</Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography color="text.secondary">Products</Typography>
                      <Typography fontWeight={600}>{money(totals.productTotal)}</Typography>
                    </Stack>
                    <Box sx={{ borderTop: "1px solid", borderColor: "divider", pt: 1.5 }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="h6" fontWeight={800}>
                          Total
                        </Typography>
                        <Typography variant="h6" fontWeight={800}>
                          {money(totals.grandTotal)}
                        </Typography>
                      </Stack>
                    </Box>
                    <Button
                      variant="contained"
                      startIcon={<ShoppingCartCheckoutIcon />}
                      onClick={proceed}
                      disabled={items.length === 0 || mixedCart}
                    >
                      Checkout
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
      </Stack>
      <Snackbar
        open={snack.open}
        autoHideDuration={2500}
        onClose={() => setSnack({ open: false, msg: "" })}
        message={snack.msg}
      />
    </Container>
  );

  return <PublicPageShell activeKey="__basket">{content}</PublicPageShell>;
};

export default MyBasket;
