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
import { api as apiClient } from "../../utils/api";
import { pageStyleToBackgroundSx, pageStyleToCssVars } from "./ServiceList";

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

const MyBasketBase = ({ slugOverride, disableShell = false, pageStyleOverride = null }) => {
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
  const [holdMinutes, setHoldMinutes] = useState(null);
  const [holdState, setHoldState] = useState({ overall: null, perItem: {} });
  const [cancelHandled, setCancelHandled] = useState(false);
  const serviceItems = useMemo(
    () => items.filter((item) => item.type !== CartTypes.PRODUCT),
    [items]
  );

  useEffect(() => {
    const saved = loadCart();
    let mutated = false;
    const normalized = saved.map((item) => {
      if (item.type === CartTypes.PRODUCT || item?.hold_started_at) return item;
      mutated = true;
      return { ...item, hold_started_at: new Date().toISOString() };
    });
    if (mutated) {
      saveCart(normalized);
    }
    setItems(normalized);
  }, []);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    (async () => {
      try {
        const { data } = await apiClient.get(`/public/${slug}/company-info`, { noCompanyHeader: true });
        if (cancelled) return;
        const hold = Number(data?.booking_hold_minutes ?? 0);
        setHoldMinutes(Number.isFinite(hold) && hold > 0 ? hold : null);
      } catch {
        if (!cancelled) setHoldMinutes(null);
      }
    })();
    return () => { cancelled = true; };
  }, [slug]);

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
        const filtered = items.filter((item) => !expiredIds.includes(item.id));
        if (filtered.length !== items.length) {
          saveCart(filtered);
          setItems(filtered);
          setSnack({ open: true, msg: "Service holds expired. Please reselect your appointment times." });
          const hasRemainingServices = filtered.some((item) => item.type !== CartTypes.PRODUCT);
          if (!hasRemainingServices && slug) {
            releasePendingCheckout({ slug }).catch(() => {});
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
  }, [holdMinutes, serviceItems, items, slug]);

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
  const formatHoldCountdown = (ms) => {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
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

  const styleVars = useMemo(
    () => (pageStyleOverride ? pageStyleToCssVars(pageStyleOverride) : null),
    [pageStyleOverride]
  );
  const backgroundSx = useMemo(
    () => (pageStyleOverride ? pageStyleToBackgroundSx(pageStyleOverride) : null),
    [pageStyleOverride]
  );


  const content = (
    <Box
      sx={{
        ...(backgroundSx || {}),
        ...(styleVars || {}),
      }}
    >
      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
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

        {typeof holdMinutes === "number" && holdMinutes > 0 && serviceItems.length > 0 && holdState.overall !== null && (
          <Card variant="outlined" sx={{ p: 2 }}>
            <Typography variant="body2" sx={{ mt: 1.5 }}>
              {holdState.overall > 0
                ? `We're holding your selected times for ${formatHoldCountdown(holdState.overall)}. Complete checkout before the timer runs out or the slots will be released.`
                : "The hold window has expired. If you continue, the selected times may no longer be available."}
            </Typography>
          </Card>
        )}

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
    </Box>
  );

  if (disableShell) {
    return content;
  }

  return <PublicPageShell activeKey="__basket">{content}</PublicPageShell>;
};

const MyBasket = (props) => <MyBasketBase {...props} />;

export default MyBasket;

export function MyBasketEmbedded({ slug, pageStyle }) {
  return <MyBasketBase slugOverride={slug} disableShell pageStyleOverride={pageStyle} />;
}
