// src/pages/client/ServiceList.js
import React, { useEffect, useMemo, useState } from "react";
import { api } from "../../utils/api";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import {
  Container,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Typography,
  CircularProgress,
  TextField,
  MenuItem,
  Alert,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Stack,
  Tooltip,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import CloseIcon from "@mui/icons-material/Close";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import FullscreenExitIcon from "@mui/icons-material/FullscreenExit";
import { useEmbedConfig } from "../../embed";
import PublicPageShell, { usePublicSite } from "./PublicPageShell";

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

const clamp01 = (n) => {
  const num = Number(n);
  if (!Number.isFinite(num)) return 0;
  return Math.max(0, Math.min(1, num));
};

const hexToRgba = (hex, alpha = 1) => {
  if (!hex) return undefined;
  let h = String(hex).replace("#", "").trim();
  if (!h) return undefined;
  if (h.length === 3) {
    h = h.split("").map((c) => c + c).join("");
  } else if (h.length === 4) {
    alpha = parseInt(h[3] + h[3], 16) / 255;
    h = h.slice(0, 3).split("").map((c) => c + c).join("");
  } else if (h.length === 8) {
    alpha = parseInt(h.slice(6, 8), 16) / 255;
    h = h.slice(0, 6);
  }
  if (h.length !== 6) return undefined;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${clamp01(alpha)})`;
};

const overlayColor = (color, opacity) => {
  if (!color) return null;
  const alpha = clamp01(opacity ?? 0);
  if (alpha <= 0) return null;
  const trimmed = String(color).trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("#")) {
    return hexToRgba(trimmed, alpha);
  }
  return trimmed;
};

const getSiteDefaultPageStyle = (site) => {
  if (!site) return null;
  const candidates = [
    site?.settings?.settings?.page_style_default,
    site?.settings?.page_style_default,
    site?.settings?.settings?.pageStyleDefault,
    site?.settings?.pageStyleDefault,
  ];
  for (const candidate of candidates) {
    const copy = cloneStyle(candidate);
    if (copy && Object.keys(copy).length) return copy;
  }
  return null;
};

const resolveServicePageStyle = (context) => {
  if (!context) return null;
  const pages = Array.isArray(context.pages) ? context.pages : [];
  const site = context.site || null;
  const target = pages.find(
    (p) => String(p?.slug || "").toLowerCase() === "services-classic"
  );
  const home = pages.find((p) => p?.is_homepage) || pages[0] || null;

  const candidates = [
    extractPageStyleProps(target),
    extractPageStyleProps(home),
    getSiteDefaultPageStyle(site),
  ];

  for (const candidate of candidates) {
    if (candidate && Object.keys(candidate).length) return candidate;
  }
  return null;
};

const toPx = (val) => (val === 0 || Number.isFinite(val) ? `${val}px` : undefined);

const pageStyleToCssVars = (style) => {
  if (!style) return {};
  const vars = {};
  const assign = (key, value) => {
    if (value !== undefined && value !== null && value !== "") {
      vars[key] = value;
    }
  };
  assign("--page-heading-color", style.headingColor);
  assign("--page-body-color", style.bodyColor);
  assign("--page-link-color", style.linkColor);
  assign("--page-heading-font", style.headingFont);
  assign("--page-body-font", style.bodyFont);
  assign("--page-hero-heading-shadow", style.heroHeadingShadow);
  assign("--page-body-bg", style.backgroundColor);
  assign("--page-card-bg", style.cardBg || style.cardColor);
  assign("--page-card-radius", toPx(style.cardRadius));
  assign("--page-card-shadow", style.cardShadow);
  assign("--page-card-blur", toPx(style.cardBlur));
  assign("--page-btn-bg", style.btnBg);
  assign("--page-btn-color", style.btnColor);
  assign("--page-btn-radius", toPx(style.btnRadius));
  return vars;
};

const pageStyleToBackgroundSx = (style) => {
  if (!style) return {};
  const sx = {};
  if (style.backgroundColor) sx.backgroundColor = style.backgroundColor;
  if (style.bodyColor) sx.color = style.bodyColor;
  const overlay = overlayColor(style.overlayColor, style.overlayOpacity);
  if (style.backgroundImage) {
    const layers = [];
    if (overlay) layers.push(`linear-gradient(${overlay}, ${overlay})`);
    layers.push(`url(${style.backgroundImage})`);
    sx.backgroundImage = layers.join(", ");
  } else if (overlay) {
    sx.backgroundImage = `linear-gradient(${overlay}, ${overlay})`;
  }
  if (style.backgroundRepeat) sx.backgroundRepeat = style.backgroundRepeat;
  if (style.backgroundSize) sx.backgroundSize = style.backgroundSize;
  if (style.backgroundPosition) sx.backgroundPosition = style.backgroundPosition;
  if (style.backgroundAttachment) sx.backgroundAttachment = style.backgroundAttachment;
  return sx;
};

const ServiceListContent = ({ effectiveSlug, isModalView, disableModal, origin, pageStyleOverride }) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMdDown = useMediaQuery(theme.breakpoints.down("md"));
  const embedCfg = useEmbedConfig();
  const siteContext = usePublicSite();
  const pageStyle = useMemo(
    () => pageStyleOverride || resolveServicePageStyle(siteContext),
    [pageStyleOverride, siteContext]
  );
  const cssVarStyle = useMemo(() => {
    const vars = pageStyleToCssVars(pageStyle);
    return Object.keys(vars).length ? vars : undefined;
  }, [pageStyle]);
  const backgroundSx = useMemo(
    () => pageStyleToBackgroundSx(pageStyle),
    [pageStyle]
  );

  const buttonRadiusVar = "var(--page-btn-radius, 12px)";
  const buttonShadowVar = "var(--page-btn-shadow, 0 16px 32px rgba(15,23,42,0.16))";
  const buttonShadowHoverVar = "var(--page-btn-shadow-hover, 0 20px 40px rgba(15,23,42,0.2))";

  useEffect(() => {
    if (!isModalView) return;
    const { style } = document.body;
    const { style: rootStyle } = document.documentElement;
    const prevBodyBg = style.backgroundColor;
    const prevRootBg = rootStyle.backgroundColor;
    style.backgroundColor = "transparent";
    rootStyle.backgroundColor = "transparent";
    return () => {
      style.backgroundColor = prevBodyBg;
      rootStyle.backgroundColor = prevRootBg;
    };
  }, [isModalView]);

  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState("");
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deptLoading, setDeptLoading] = useState(true);
  const [error, setError] = useState("");
  const [bookingOpen, setBookingOpen] = useState(false);
  const [bookingServiceId, setBookingServiceId] = useState(null);
  const [bookingFullScreen, setBookingFullScreen] = useState(isMdDown);

  useEffect(() => {
    if (bookingOpen) {
      setBookingFullScreen(isMdDown);
    }
  }, [isMdDown, bookingOpen]);

  useEffect(() => {
    let active = true;
    setDeptLoading(true);

    if (!effectiveSlug) {
      if (active) {
        setDepartments([]);
        setDeptLoading(false);
      }
      return () => {
        active = false;
      };
    }

    api
      .get(`/public/${effectiveSlug}/departments`, { noCompanyHeader: true })
      .then((res) => {
        if (!active) return;
        setDepartments(Array.isArray(res.data) ? res.data : []);
      })
      .catch(() => {
        if (!active) return;
        setDepartments([]);
      })
      .finally(() => active && setDeptLoading(false));
    return () => {
      active = false;
    };
  }, [effectiveSlug]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");

    if (!effectiveSlug) {
      if (active) {
        setServices([]);
        setError("Failed to load services. Please try again.");
        setLoading(false);
      }
      return () => {
        active = false;
      };
    }

    const url = selectedDept
      ? `/public/${effectiveSlug}/services?department_id=${selectedDept}`
      : `/public/${effectiveSlug}/services`;

    api
      .get(url, { noCompanyHeader: true })
      .then((res) => {
        if (!active) return;
        setServices(Array.isArray(res.data) ? res.data : []);
      })
      .catch(() => {
        if (!active) return;
        setError("Failed to load services. Please try again.");
        setServices([]);
      })
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
  }, [effectiveSlug, selectedDept]);

  const numOr = (v, d) => (v === null || v === undefined || v === "" ? d : Number(v));
  const formatPrice = (val) => {
    const n = Number(val);
    if (Number.isNaN(n)) return "N/A";
    return `💲${n.toFixed(2)}`;
  };

  const openService = (serviceId) => {
    const dept = selectedDept ? `?department_id=${selectedDept}` : "";
    const targetPath = `/${effectiveSlug}/services/${serviceId}${dept}`;

    if (disableModal) {
      try {
        if (typeof window !== "undefined" && window.self !== window.top) {
          window.top.location.href = targetPath;
          return;
        }
      } catch {}
      navigate(targetPath);
      return;
    }

    setBookingServiceId(serviceId);
    setBookingFullScreen(isMdDown);
    setBookingOpen(true);
  };

  const closeServiceModal = () => {
    setBookingOpen(false);
    setBookingServiceId(null);
  };

  const bookingService = useMemo(
    () => services.find((svc) => String(svc.id) === String(bookingServiceId)) || null,
    [services, bookingServiceId]
  );

  const [bookingLoaded, setBookingLoaded] = useState(false);

  const bookingUrl = useMemo(() => {
    if (!bookingServiceId) return "";
    const params = new URLSearchParams();
    params.set("embed", "1");
    params.set("site", effectiveSlug);
    if (embedCfg.primary) params.set("primary", embedCfg.primary);
    if (embedCfg.text) params.set("text", embedCfg.text);
    params.set("mode", "modal");
    params.set("dialog", "1");
    if (selectedDept) params.set("department_id", selectedDept);
    const base = `${origin}/${effectiveSlug}/services/${bookingServiceId}`;
    return `${base}?${params.toString()}`;
  }, [bookingServiceId, embedCfg, effectiveSlug, selectedDept, origin]);

  useEffect(() => {
    setBookingLoaded(false);
  }, [bookingUrl]);

  if (loading && !services.length) {
    return (
      <Container
        maxWidth={false}
        sx={{
          textAlign: "center",
          mt: 6,
          color: "var(--page-btn-bg, var(--sched-primary))",
          px: { xs: 3, md: 6 },
        }}
        style={cssVarStyle}
      >
        <CircularProgress sx={{ color: "currentColor" }} />
        <Typography sx={{ mt: 2 }}>Loading services…</Typography>
      </Container>
    );
  }

  return (
    <Box
      sx={{
        position: "relative",
        width: "100%",
        py: isModalView ? 0 : { xs: 4, md: 6 },
        px: isModalView ? 0 : { xs: 2, md: 4, xl: 6 },
        ...backgroundSx,
      }}
      style={cssVarStyle}
    >
      <Box
        sx={{
          position: "relative",
          zIndex: 1,
          maxWidth: isModalView ? "100%" : 1600,
          mx: "auto",
        }}
      >
        <Box
          sx={{
            mb: 3,
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 2,
            justifyContent: "space-between",
          }}
        >
          <Typography variant="h4" fontWeight={800} sx={{ color: "var(--page-heading-color, inherit)" }}>
            Available Services
          </Typography>

          {departments.length > 0 && (
            <TextField
              select
              size="small"
              label="Department"
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              sx={{ minWidth: 220 }}
              disabled={deptLoading}
            >
              <MenuItem value="">All Departments</MenuItem>
              {departments.map((d) => (
                <MenuItem key={d.id} value={d.id}>
                  {d.name}
                </MenuItem>
              ))}
            </TextField>
          )}
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {services.length === 0 ? (
          <Typography color="text.secondary">
            No services available{selectedDept ? " in this department" : ""}.
          </Typography>
        ) : (
          <Grid container spacing={3}>
            {services.map((service) => {
              const duration = numOr(service.duration, null);
              const price = service.base_price;
              const imageUrl = Array.isArray(service.images) && service.images.length > 0
                ? service.images[0]?.url_public || service.images[0]?.url || service.images[0]?.source
                : null;
              return (
                <Grid item xs={12} sm={6} md={4} lg={3} xl={2} key={service.id}>
                  <Card
                    variant="outlined"
                    sx={{
                      height: "100%",
                      borderRadius: "var(--page-card-radius, 18px)",
                      backgroundColor: "var(--page-card-bg, rgba(255,255,255,0.95))",
                      boxShadow: "var(--page-card-shadow, 0 12px 32px rgba(15,23,42,0.08))",
                      border: "1px solid rgba(148,163,184,0.18)",
                      transition: "0.25s",
                      display: "flex",
                      flexDirection: "column",
                      color: "var(--page-body-color)",
                      "&:hover": { transform: "translateY(-2px)" },
                    }}
                  >
                    {imageUrl && (
                      <Box sx={{ position: "relative", pt: "56.25%" }}>
                        <Box
                          component="img"
                          src={imageUrl}
                          alt={service.name || "Service"}
                          loading="lazy"
                          sx={{
                            position: "absolute",
                            inset: 0,
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            borderTopLeftRadius: "var(--page-card-radius, 18px)",
                            borderTopRightRadius: "var(--page-card-radius, 18px)",
                          }}
                        />
                      </Box>
                    )}
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" fontWeight={700} sx={{ color: "var(--page-heading-color, inherit)" }}>
                        {service.name}
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 1.2, minHeight: 56, color: "var(--page-body-color, inherit)" }}>
                        {service.description || "No description available."}
                      </Typography>
                      <Typography
                        variant="subtitle2"
                        sx={{
                          mt: 1.5,
                          color: `var(--page-link-color, ${theme.palette.primary.main})`,
                          fontWeight: 600,
                        }}
                      >
                        ⏱ {duration ? `${duration} min` : "—"} &nbsp; | &nbsp; {formatPrice(price)}
                      </Typography>
                    </CardContent>
                    <CardActions sx={{ p: 2, pt: 0 }}>
                      <Button
                        fullWidth
                        variant="contained"
                        onClick={() => openService(service.id)}
                        sx={{
                          backgroundColor: "var(--page-btn-bg, var(--sched-primary))",
                          color: "var(--page-btn-color, #ffffff)",
                          borderRadius: buttonRadiusVar,
                          fontWeight: 600,
                          textTransform: "none",
                          py: 1.1,
                          boxShadow: buttonShadowVar,
                          "&:hover": {
                            backgroundColor: "var(--page-btn-bg-hover, var(--page-btn-bg, var(--sched-primary)))",
                            color: "var(--page-btn-color, #ffffff)",
                            boxShadow: buttonShadowHoverVar,
                          },
                        }}
                      >
                        View & Book
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}
      </Box>

      {!disableModal && (
        <Dialog
          fullScreen={bookingFullScreen}
          fullWidth
          maxWidth="lg"
          open={bookingOpen}
          onClose={closeServiceModal}
          PaperProps={{
            sx: {
              width: "100%",
              maxWidth: bookingFullScreen ? "100%" : 1200,
              mx: 0,
              borderRadius: bookingFullScreen ? 0 : 2,
              minHeight: bookingFullScreen ? "100vh" : undefined,
            },
          }}
        >
          <DialogTitle sx={{ py: 1.5 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Typography variant="h6" fontWeight={700} noWrap>
                {bookingService?.name || "View & Book"}
              </Typography>
              <Stack direction="row" spacing={0.5} alignItems="center">
                <Tooltip title={bookingFullScreen ? "Exit full screen" : "Full screen"}>
                  <IconButton onClick={() => setBookingFullScreen((prev) => !prev)} size="small">
                    {bookingFullScreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
                  </IconButton>
                </Tooltip>
                <Tooltip title="Close">
                  <IconButton onClick={closeServiceModal} size="small">
                    <CloseIcon />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Stack>
          </DialogTitle>
          <DialogContent dividers sx={{ p: 0 }}>
            {bookingUrl ? (
              <Box sx={{ position: "relative" }}>
                {!bookingLoaded && (
                  <Box
                    sx={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      bgcolor: "background.paper",
                      color: "var(--page-btn-bg, var(--sched-primary))",
                      zIndex: 1,
                    }}
                  >
                    <CircularProgress sx={{ color: "currentColor" }} />
                  </Box>
                )}
                <Box
                  component="iframe"
                  key={bookingUrl}
                  src={bookingUrl}
                  title="Service booking"
                  allowFullScreen
                  onLoad={() => setBookingLoaded(true)}
                  sx={{
                    display: "block",
                    border: 0,
                    width: "100%",
                    height: bookingFullScreen ? "100vh" : { xs: "75vh", md: "70vh" },
                    opacity: bookingLoaded ? 1 : 0,
                  }}
                />
              </Box>
            ) : (
              <Box sx={{ p: 4, textAlign: "center", color: "var(--page-btn-bg, var(--sched-primary))" }}>
                <CircularProgress sx={{ color: "currentColor" }} />
              </Box>
            )}
          </DialogContent>
        </Dialog>
      )}
    </Box>
  );
};

const ServiceList = () => {
  const { slug: routeSlug } = useParams();
  const [searchParams] = useSearchParams();
  const effectiveSlug = useMemo(() => {
    const qs = new URLSearchParams(window.location.search || "");
    const byQs = (qs.get("site") || "").trim();
    let byPath = "";
    try {
      byPath = (window.location.pathname || "/").split("/")[1] || "";
    } catch {}
    let byLs = "";
    try {
      byLs = localStorage.getItem("site") || "";
    } catch {}
    return (routeSlug || byQs || byPath || byLs || "").trim();
  }, [routeSlug]);

  const isEmbed = searchParams.get("embed") === "1";
  const isModalView = isEmbed && searchParams.get("mode") === "modal";
  const disableModal = searchParams.get("dialog") === "1";
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const navigate = useNavigate();

  useEffect(() => {
    if (!isEmbed && effectiveSlug) {
      navigate(`/${effectiveSlug}?page=services-classic`, { replace: true });
    }
  }, [isEmbed, effectiveSlug, navigate]);

  const content = (
    <ServiceListContent
      effectiveSlug={effectiveSlug}
      isModalView={isModalView}
      disableModal={disableModal}
      origin={origin}
    />
  );

  return (
    <PublicPageShell activeKey="__services" slugOverride={effectiveSlug || undefined}>
      {content}
    </PublicPageShell>
  );
};

export default ServiceList;

export function ServiceListEmbedded({ slug, pageStyle }) {
  const origin =
    typeof window !== "undefined" ? window.location.origin : "";
  return (
    <ServiceListContent
      effectiveSlug={slug}
      isModalView={false}
      origin={origin}
      pageStyleOverride={pageStyle}
    />
  );
}

export { ServiceListContent, pageStyleToCssVars, pageStyleToBackgroundSx };
