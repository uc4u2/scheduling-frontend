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
import { useTheme, alpha } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import CloseIcon from "@mui/icons-material/Close";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import FullscreenExitIcon from "@mui/icons-material/FullscreenExit";
import { useEmbedConfig } from "../../embed";
import PublicPageShell from "./PublicPageShell";

const ServiceList = () => {
  const { slug: routeSlug } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const effectiveSlug = useMemo(() => {
    const qs = new URLSearchParams(window.location.search || "");
    const byQs = (qs.get('site') || '').trim();
    let byPath = '';
    try { byPath = (window.location.pathname || '/').split('/')[1] || ''; } catch {}
    let byLs = '';
    try { byLs = localStorage.getItem('site') || ''; } catch {}
    return (routeSlug || byQs || byPath || byLs || '').trim();
  }, [routeSlug]);
  const theme = useTheme();
  const isMdDown = useMediaQuery(theme.breakpoints.down("md"));
  const embedCfg = useEmbedConfig();
  const embedMode = searchParams.get("embed") === "1";
  const isModalView = embedMode && searchParams.get("mode") === "modal";
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const disableModal = searchParams.get("dialog") === "1";

  const primaryBgVar = `var(--page-btn-bg, ${theme.palette.primary.main})`;
  const primaryTextVar = `var(--page-btn-color, ${theme.palette.getContrastText(theme.palette.primary.main)})`;
  const buttonRadiusVar = 'var(--page-btn-radius, 12px)';
  const buttonShadowVar = 'var(--page-btn-shadow, 0 16px 32px rgba(15,23,42,0.16))';
  const buttonShadowHoverVar = 'var(--page-btn-shadow-hover, 0 20px 40px rgba(15,23,42,0.2))';
  const buttonHoverBgVar = `var(--page-btn-bg-hover, ${theme.palette.primary.dark})`;
  const buttonSoftBgVar = `var(--page-btn-bg-soft, ${alpha(theme.palette.primary.main, 0.12)})`;

  const bookingButtonSx = {
    backgroundColor: primaryBgVar,
    color: primaryTextVar,
    borderRadius: buttonRadiusVar,
    fontWeight: 600,
    textTransform: 'none',
    py: 1.1,
    boxShadow: buttonShadowVar,
    '&:hover': {
      backgroundColor: buttonHoverBgVar,
      color: primaryTextVar,
      boxShadow: buttonShadowHoverVar,
    },
  };

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

  // Fetch departments
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

  // Fetch services (optionally filtered by department)
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

  // Helpers
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

  // Loading
  if (loading && !services.length) {
    return (
      <Container sx={{ textAlign: "center", mt: 6 }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading services…</Typography>
      </Container>
    );
  }

  const page = (
  <Container
    maxWidth="xl"
    disableGutters
    sx={{
      mt: isModalView ? 0 : { xs: 4, md: 6 },
      mb: isModalView ? 0 : { xs: 6, md: 8 },
      px: 0,
      bgcolor: "transparent",
    }}
  >
    <Box
      sx={{
        width: "100%",
        maxWidth: isModalView ? "100%" : "1200px",
        mx: "auto",
        px: isModalView ? 0 : { xs: 3, md: 6 },
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
        <Typography variant="h4" fontWeight={800}>
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
            return (
              <Grid item xs={12} md={6} lg={4} key={service.id}>
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
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" fontWeight={700} sx={{ color: "var(--page-heading-color, inherit)" }}>
                      {service.name}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1.2, minHeight: 56 }} color="text.secondary">
                      {service.description || "No description available."}
                    </Typography>
                    <Typography variant="subtitle2" sx={{ mt: 1.5, color: `var(--page-link-color, ${theme.palette.primary.main})`, fontWeight: 600 }}>
                      ⏱ {duration ? `${duration} min` : "—"} &nbsp; | &nbsp; {formatPrice(price)}
                    </Typography>
                  </CardContent>
                  <CardActions sx={{ p: 2, pt: 0 }}>
                    <Button fullWidth variant="contained" onClick={() => openService(service.id)} sx={bookingButtonSx}>
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
            <Box
              component="iframe"
              key={bookingUrl}
              src={bookingUrl}
              title="Service booking"
              allowFullScreen
              sx={{
                display: "block",
                border: 0,
                width: "100%",
                height: bookingFullScreen ? "100vh" : { xs: "75vh", md: "70vh" },
              }}
            />
          ) : (
            <Box sx={{ p: 4, textAlign: "center" }}>
              <CircularProgress />
            </Box>
          )}
        </DialogContent>
      </Dialog>
    )}
  </Container>
);

  const suppressShell = searchParams.has('page');
  if (suppressShell) {
    return page;
  }
  return <PublicPageShell activeKey="__services" slugOverride={effectiveSlug || undefined}>{page}</PublicPageShell>;
};

export default ServiceList;













