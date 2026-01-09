import React, { useEffect, useMemo, useRef, useState } from "react";
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
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import ShoppingCartCheckoutIcon from "@mui/icons-material/ShoppingCartCheckout";
import CloseIcon from "@mui/icons-material/Close";
import SiteFrame from "../../components/website/SiteFrame";
import Checkout from "./Checkout";
import { CartTypes, loadCart, removeCartItem, saveCart } from "../../utils/cart";
import { releasePendingCheckout } from "../../utils/hostedCheckout";
import { api as apiClient, publicSite } from "../../utils/api";
import { pageStyleToBackgroundSx, pageStyleToCssVars } from "./ServiceList";

const money = (v) => `$${Number(v || 0).toFixed(2)}`;

const toSolidColor = (value) => {
  if (!value) return null;
  const raw = String(value).trim();
  if (!raw) return null;
  if (raw.toLowerCase() === "transparent") return null;
  if (raw.startsWith("rgba(")) {
    const parts = raw
      .slice(5, -1)
      .split(",")
      .map((v) => v.trim());
    if (parts.length >= 3) {
      const [r, g, b] = parts;
      return `rgb(${r}, ${g}, ${b})`;
    }
  }
  if (raw.startsWith("hsla(")) {
    return `hsl(${raw.slice(5, -1).split(",").slice(0, 3).join(",")})`;
  }
  if (raw.startsWith("#")) {
    const hex = raw.slice(1);
    if (hex.length === 4) {
      return `#${hex[0]}${hex[0]}${hex[1]}${hex[1]}${hex[2]}${hex[2]}`;
    }
    if (hex.length === 8) {
      return `#${hex.slice(0, 6)}`;
    }
  }
  return raw;
};

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
    return query ? `/${slug}?${query}` : `/${slug}`;
  }, [slug, searchParams]);

  const [items, setItems] = useState(() => loadCart());
  const [snack, setSnack] = useState({ open: false, msg: "" });
  const [siteLoading, setSiteLoading] = useState(false);
  const [sitePayload, setSitePayload] = useState(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutBg, setCheckoutBg] = useState(null);
  const [checkoutCardBg, setCheckoutCardBg] = useState(null);
  const [pageScopeVars, setPageScopeVars] = useState(null);
  const checkoutStyleRef = useRef(null);
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
    setCheckoutOpen(true);
  };
  const continueShopping = () => {
    if (!productsHref) return;
    navigate(productsHref);
  };

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
  const modalCardBg = useMemo(() => {
    const candidate = pageStyleOverride?.cardColor || pageStyleOverride?.cardBg;
    return toSolidColor(candidate);
  }, [pageStyleOverride]);
  const modalPageBg = useMemo(() => {
    const candidate = pageStyleOverride?.backgroundColor;
    return toSolidColor(candidate);
  }, [pageStyleOverride]);
  const modalPageBgImage = useMemo(() => {
    const candidate = backgroundSx?.backgroundImage;
    return candidate || null;
  }, [backgroundSx]);
  useEffect(() => {
    if (!checkoutOpen) return;
    try {
      const root = document.documentElement;
      const computed = getComputedStyle(root).getPropertyValue("--page-card-bg");
      const solid = toSolidColor(computed) || modalCardBg || modalPageBg;
      setCheckoutBg(solid || null);
    } catch {
      setCheckoutBg(modalCardBg || modalPageBg || null);
    }
    setCheckoutCardBg(modalCardBg || modalPageBg || null);
  }, [checkoutOpen, modalCardBg, modalPageBg]);
  useEffect(() => {
    if (!checkoutOpen) {
      setPageScopeVars(null);
      return;
    }
    const scopeEl = document.querySelector(".page-scope");
    if (!scopeEl) {
      setPageScopeVars(null);
      return;
    }
    const computed = getComputedStyle(scopeEl);
    const readVar = (key) => {
      const raw = computed.getPropertyValue(key);
      return raw ? raw.trim() : "";
    };
    const vars = {
      "--page-card-bg": readVar("--page-card-bg"),
      "--page-body-color": readVar("--page-body-color"),
      "--page-heading-color": readVar("--page-heading-color"),
      "--page-link-color": readVar("--page-link-color"),
      "--page-heading-font": readVar("--page-heading-font"),
      "--page-body-font": readVar("--page-body-font"),
      "--page-btn-bg": readVar("--page-btn-bg"),
      "--page-btn-color": readVar("--page-btn-color"),
      "--page-btn-radius": readVar("--page-btn-radius"),
      "--page-card-radius": readVar("--page-card-radius"),
      "--page-card-shadow": readVar("--page-card-shadow"),
      "--page-card-blur": readVar("--page-card-blur"),
      "--page-body-bg": readVar("--page-body-bg"),
    };
    const bg = computed.backgroundColor;
    if (!vars["--page-body-bg"] && bg && bg !== "transparent") {
      vars["--page-body-bg"] = bg;
    }
    const bgImage = computed.backgroundImage;
    if (bgImage && bgImage !== "none") {
      vars["--checkout-modal-bg-image"] = bgImage;
    }
    setPageScopeVars(vars);
  }, [checkoutOpen]);
  const modalVars = useMemo(() => {
    if (!checkoutOpen) return null;
    const vars = styleVars ? { ...styleVars } : {};
    if (pageScopeVars) {
      Object.entries(pageScopeVars).forEach(([key, value]) => {
        if (value !== undefined && value !== null && String(value).trim() !== "") {
          vars[key] = value;
        }
      });
    }
    const fallback = "rgba(255,255,255,0.95)";
    const modalBg = modalPageBg || null;
    const cardBg = checkoutBg || checkoutCardBg || modalCardBg || vars["--page-card-bg"] || modalBg || null;
    vars["--checkout-modal-bg"] = modalBg || cardBg || fallback;
    vars["--checkout-card-bg"] = cardBg || fallback;
    vars["--checkout-modal-bg-image"] = modalPageBgImage || "none";
    return vars;
  }, [
    checkoutOpen,
    styleVars,
    pageScopeVars,
    checkoutCardBg,
    checkoutBg,
    modalCardBg,
    modalPageBg,
    modalPageBgImage,
  ]);
  useEffect(() => {
    if (!checkoutOpen || !modalVars) return;
    const root = document.documentElement;
    const prev = {};
    Object.entries(modalVars).forEach(([key, value]) => {
      prev[key] = root.style.getPropertyValue(key);
      root.style.setProperty(key, value);
    });
    checkoutStyleRef.current = prev;
    return () => {
      const restore = checkoutStyleRef.current || {};
      Object.entries(modalVars).forEach(([key]) => {
        if (Object.prototype.hasOwnProperty.call(restore, key)) {
          root.style.setProperty(key, restore[key]);
        } else {
          root.style.removeProperty(key);
        }
      });
      checkoutStyleRef.current = null;
    };
  }, [checkoutOpen, modalVars]);


  const content = (
    <Box
      sx={{
        ...(backgroundSx || {}),
        ...(styleVars || {}),
      }}
    >
      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
        <Stack spacing={3}>
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", md: "center" }} spacing={2}>
          <Box>
            <Typography variant="h3" fontWeight={800}>
              Your Basket
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Review services and products before completing your purchase.
            </Typography>
          </Box>
          {items.length > 0 && (
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ width: { xs: "100%", md: "auto" } }}>
              <Button
                variant="outlined"
                onClick={continueShopping}
                sx={{
                  width: { xs: "100%", sm: "auto" },
                  borderRadius: "var(--page-btn-radius, 12px)",
                  color: "var(--page-link-color, inherit)",
                  borderColor: "var(--page-link-color, rgba(148,163,184,0.6))",
                  "&:hover": {
                    borderColor: "var(--page-link-color, currentColor)",
                    backgroundColor: "rgba(255,255,255,0.04)",
                  },
                }}
              >
                Continue shopping
              </Button>
              <Button
                variant="contained"
                startIcon={<ShoppingCartCheckoutIcon />}
                onClick={proceed}
                disabled={mixedCart}
                sx={{
                  width: { xs: "100%", sm: "auto" },
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
                Proceed to checkout
              </Button>
            </Stack>
          )}
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
            <Button
              sx={{
                mt: 2,
                borderRadius: "var(--page-btn-radius, 12px)",
                backgroundColor: "var(--page-btn-bg, #2563eb)",
                color: "var(--page-btn-color, #fff)",
                boxShadow: "var(--page-btn-shadow, none)",
                "&:hover": {
                  backgroundColor: "var(--page-btn-bg, #2563eb)",
                  filter: "brightness(0.95)",
                },
              }}
              variant="contained"
              onClick={continueShopping}
            >
              Browse products
            </Button>
          </Box>
        ) : (
          <Grid container spacing={{ xs: 3, md: 4 }}>
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
                              sx={{ width: { xs: "100%", sm: 100 } }}
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
      <Dialog
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        fullWidth
        maxWidth="lg"
        sx={modalVars || undefined}
        PaperProps={{
          sx: {
            width: "100%",
            maxWidth: 1200,
            mx: 0,
            borderRadius: 2,
            backgroundColor: "var(--checkout-modal-bg, var(--page-card-bg, rgba(255,255,255,0.95)))",
            backgroundImage: "var(--checkout-modal-bg-image, none)",
            color: "var(--page-body-color, #111827)",
          },
        }}
      >
        <DialogTitle
          sx={{
            py: 1.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "var(--checkout-modal-bg, var(--page-card-bg, #ffffff))",
            backgroundImage: "var(--checkout-modal-bg-image, none)",
          }}
        >
          <Typography variant="h6" fontWeight={700} noWrap>
            Checkout
          </Typography>
          <IconButton onClick={() => setCheckoutOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent
          dividers
          sx={{
            p: 0,
            backgroundColor: "var(--checkout-modal-bg, var(--page-card-bg, #ffffff))",
            backgroundImage: "var(--checkout-modal-bg-image, none)",
          }}
        >
          <Checkout disableShell companySlug={slug} />
        </DialogContent>
      </Dialog>
      </Container>
    </Box>
  );

  if (disableShell) {
    return content;
  }

  if (disableShell) {
    return content;
  }

  const renderShell = (node) => {
    if (!slug) return node;
    return (
      <SiteFrame
        slug={slug}
        activeKey="basket"
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

const MyBasket = (props) => <MyBasketBase {...props} />;

export default MyBasket;

export function MyBasketEmbedded({ slug, pageStyle }) {
  return <MyBasketBase slugOverride={slug} disableShell pageStyleOverride={pageStyle} />;
}
