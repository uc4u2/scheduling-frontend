/* eslint-disable react-hooks/exhaustive-deps */
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api } from "../../utils/api";
import { formatCurrency } from "../../utils/formatters";
import { setActiveCurrency, normalizeCurrency, resolveCurrencyForCountry, resolveActiveCurrencyFromCompany, getActiveCurrency } from "../../utils/currency";
import { useParams, useSearchParams } from "react-router-dom";
import {
  Container,
  Typography,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Button,
  Box,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Paper,
  Chip,
  Stack,
  Card,
  CardContent,
  Avatar,
  Collapse,
  useMediaQuery,
  SwipeableDrawer,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useTheme, alpha } from "@mui/material/styles";
import { useNavWithEmbed } from "../../embed";
import PublicPageShell from "./PublicPageShell";

/* ───────────────── helpers ───────────────── */
/** Build "cart" JSON for the availability endpoint (filter by date and optional artist) */
function buildCartPayload({ date, artistId = null }) {
  try {
    const raw = JSON.parse(sessionStorage.getItem("booking_cart") || "[]");
    const filtered = raw
      .filter(
        (it) =>
          it &&
          it.date === date &&
          (!artistId || String(it.artist_id) === String(artistId))
      )
      .map((it) => ({
        artist_id: it.artist_id,
        service_id: it.service_id,
        date: it.date,
        start_time: it.start_time,
        // normalize to addon_ids array; backend also accepts it.addons with {id}, but we keep compact
        addon_ids:
          Array.isArray(it.addon_ids) && it.addon_ids.length
            ? it.addon_ids
            : Array.isArray(it.addons)
            ? it.addons.map((a) => a && a.id).filter(Boolean)
            : [],
      }));
    // canonical route accepts a raw array
    return JSON.stringify(filtered);
  } catch (e) {
    return "[]";
  }
}

const ymd = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;

const prettyDate = (yyyyMmDd) =>
  yyyyMmDd
    ? new Date(yyyyMmDd + "T00:00:00").toLocaleDateString(undefined, {
        weekday: "long",
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "";

/** format a UTC ISO string in the viewer's local time */
const timeFromUTCForViewer = (startUtc) => {
  if (!startUtc) return "";
  const dt = new Date(startUtc);
  return dt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
};

/** get YYYY-MM-DD in a specific TZ from a UTC ISO */
const dateYMDInTZ = (startUtc, tz) => {
  return new Date(startUtc).toLocaleDateString("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }); // "YYYY-MM-DD"
};

/** get HH:MM (24h) in a specific TZ from a UTC ISO */
const timeHMInTZ = (startUtc, tz) => {
  return new Date(startUtc).toLocaleTimeString("en-GB", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }); // "HH:MM"
};

const isoFromParts = (dateStr, timeStr, tz) => {
  try {
    const d = new Date(`${dateStr}T${timeStr || "00:00"}`);
    return d.toLocaleString("sv-SE", {
      timeZone: tz || "UTC",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).replace(" ", "T");
  } catch {
    return null;
  }
};

export default function ServiceDetails() {
  const { slug, serviceId } = useParams();
  const [searchParams] = useSearchParams();
  const departmentId = searchParams.get("department_id") || "";
  const navigate = useNavWithEmbed();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTabletDown = useMediaQuery(theme.breakpoints.down("md"));
  const buttonPalette = {
    bg: "var(--page-btn-bg, var(--sched-primary))",
    text: "var(--page-btn-color, #ffffff)",
    hover: "var(--page-btn-bg-hover, var(--page-btn-bg, var(--sched-primary)))",
    soft: "var(--page-btn-bg-soft, rgba(15,23,42,0.12))",
  };
  const buttonRadiusVar = "var(--page-btn-radius, 12px)";
  const buttonShadowVar = "var(--page-btn-shadow, 0 16px 32px rgba(15,23,42,0.16))";
  const buttonShadowHoverVar = "var(--page-btn-shadow-hover, 0 20px 40px rgba(15,23,42,0.2))";
  const buttonSoftBg = buttonPalette.soft;
  const calendarAccent = "var(--page-calendar-accent, var(--page-btn-bg, var(--sched-primary)))";
  const calendarAccentContrast = "var(--page-calendar-accent-contrast, var(--page-btn-color, #ffffff))";
  const pageSurface = "var(--page-surface-bg, #ffffff)";
  const calendarSurface = "var(--page-calendar-surface, var(--page-surface-bg, var(--page-card-bg, var(--page-secondary-bg, #ffffff))))";
  const calendarBorder = "var(--page-border-color, rgba(15,23,42,0.12))";
  const calendarFocus = "var(--page-focus-ring, var(--page-btn-bg, var(--sched-primary)))";
  const calendarText = "var(--page-body-color, inherit)";
  const focusRingStyles = {
    outline: `2px solid ${calendarFocus}`,
    outlineOffset: 2,
  };

  const bookingButtonSx = {
    backgroundColor: buttonPalette.bg,
    color: buttonPalette.text,
    borderRadius: buttonRadiusVar,
    fontWeight: 600,
    textTransform: 'none',
    px: 2.5,
    boxShadow: buttonShadowVar,
    '&:hover': {
      backgroundColor: buttonPalette.hover,
      color: buttonPalette.text,
      boxShadow: buttonShadowHoverVar,
    },
    '&:focus-visible': focusRingStyles,
  };

  const bookingButtonOutlinedSx = {
    borderColor: buttonPalette.bg,
    color: buttonPalette.bg,
    borderRadius: buttonRadiusVar,
    fontWeight: 600,
    textTransform: 'none',
    '&:hover': {
      backgroundColor: buttonSoftBg,
      borderColor: buttonPalette.hover,
      color: buttonPalette.text,
    },
    '&:focus-visible': focusRingStyles,
  };

  const dialogContentRef = useRef(null);
  const timesRef = useRef(null);
  const providersRef = useRef(null);
  const autoScrolledRef = useRef(false);
  const focusTimeoutRef = useRef(null);
  const closeGuardTimerRef = useRef(null);
  const fetchVersionRef = useRef(0);
  const [providerSheetOpen, setProviderSheetOpen] = useState(false);
  const [timeSheetOpen, setTimeSheetOpen] = useState(false);
  const [providerAnnounce, setProviderAnnounce] = useState("");
  const [timeAnnounce, setTimeAnnounce] = useState("");
  const AUTO_SELECT_FIRST_TIME = true;
  const [selectionLock, setSelectionLock] = useState(null); // 'auto' | 'user' | null
  const [flowStage, setFlowStage] = useState("idle");
  const [closeGuardActive, setCloseGuardActive] = useState(false);
  /* base data */
  const [service, setService] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* calendar modal + view state */
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [monthView, setMonthView] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);

  /**
   * daySlots: array of time-grouped slots keyed by start_utc, e.g.
   * {
   *   key: start_utc,
   *   date: selectedDate,
   *   start_utc: "...Z",
   *   providers: [{ id, full_name, timezone, start_time_local }...],
   *   count: n
   * }
   */
  const [daySlots, setDaySlots] = useState([]);
  const [isFetchingSlots, setIsFetchingSlots] = useState(false);

  /* inline provider picker under time */
  const [selectedTimeKey, setSelectedTimeKey] = useState(""); // start_utc key
  const selectedSlot = daySlots.find((s) => s.key === selectedTimeKey);

  /* month availability dots cache: { 'YYYY-MM-DD': true|false } */
  const [availableMap, setAvailableMap] = useState({});
  const [prefetchingMonth, setPrefetchingMonth] = useState(false);

  const [displayCurrency, setDisplayCurrency] = useState(() => getActiveCurrency());
  const money = (value, currencyCode) => formatCurrency(value, currencyCode || displayCurrency);
  const scrollMarginValue = useMemo(
    () => `calc(16px + env(safe-area-inset-bottom))`,
    []
  );

  const armCloseGuard = useCallback(() => {
    if (typeof window === "undefined") return;
    setCloseGuardActive(true);
    if (closeGuardTimerRef.current) {
      clearTimeout(closeGuardTimerRef.current);
    }
    closeGuardTimerRef.current = window.setTimeout(() => {
      setCloseGuardActive(false);
      closeGuardTimerRef.current = null;
    }, 600);
  }, []);

  const scrollSectionIntoView = useCallback(
    (target) => {
      if (isMobile || typeof window === "undefined") return;
      if (!target) return;
      armCloseGuard();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    },
    [armCloseGuard, isMobile]
  );

  const scrollProvidersIntoView = useCallback(() => {
    if (typeof window === "undefined" || isMobile) return;
    const target = providersRef.current;
    if (!target) return;
    scrollSectionIntoView(target);

    if (focusTimeoutRef.current) {
      clearTimeout(focusTimeoutRef.current);
    }
    focusTimeoutRef.current = window.setTimeout(() => {
      target.focus({ preventScroll: true });
      const firstFocusable = target.querySelector(
        "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])"
      );
      firstFocusable?.focus({ preventScroll: true });
    }, 250);
  }, [armCloseGuard, isMobile, scrollSectionIntoView]);

  useEffect(() => {
    return () => {
      if (focusTimeoutRef.current) {
        clearTimeout(focusTimeoutRef.current);
      }
      if (closeGuardTimerRef.current) {
        clearTimeout(closeGuardTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!calendarOpen) {
      setTimeSheetOpen(false);
      setProviderSheetOpen(false);
      setSelectionLock(null);
      setFlowStage("idle");
      setCloseGuardActive(false);
      if (closeGuardTimerRef.current) {
        clearTimeout(closeGuardTimerRef.current);
        closeGuardTimerRef.current = null;
      }
    } else {
      setFlowStage("date-select");
    }
  }, [calendarOpen]);

  /* ───────── load service + employees ───────── */
  useEffect(() => {
    if (!slug || !serviceId) {
      setError("Invalid URL parameters.");
      setLoading(false);
      return;
    }
    const deptQuery = departmentId ? `?department_id=${departmentId}` : "";
    Promise.all([
      api.get(`/public/${slug}/service/${serviceId}${deptQuery}`, { noCompanyHeader: true }),
      api.get(`/public/${slug}/service/${serviceId}/employees${deptQuery}`, { noCompanyHeader: true }),
    ])
      .then(([svc, empRes]) => {
        setService(svc.data);
        setEmployees(empRes.data || []);
      })
      .catch(() => setError("Failed to load service information."))
      .finally(() => setLoading(false));
  }, [slug, serviceId, departmentId]);

  /* open modal → default to today */
  useEffect(() => {
    if (!calendarOpen) return;
    const today = ymd(new Date());
    setMonthView(new Date());
    setSelectedDate(today);
    setSelectedTimeKey("");
    setProviderSheetOpen(false);
    setTimeSheetOpen(false);
  }, [calendarOpen]);

  /* helper: fetch availability for one employee + one date (canonical route, with safe fallback) */
  const fetchAvail = async (empId, dateStr) => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    const cartJSON = buildCartPayload({ date: dateStr, artistId: empId });

    // 1) canonical route (supports explicit + shift fallback; returns start_utc)
    const qs = new URLSearchParams({
      artist_id: empId,
      service_id: serviceId,
      date: dateStr,
      timezone: tz,
      explicit_only: 1,   // <- ONLY use explicit manager rows
      respect_rows: 1,    // <- DO NOT subdivide; one slot per manager row
    });
    if (departmentId) qs.set("department_id", departmentId);
    if (cartJSON) qs.set("cart", cartJSON);
    try {
      const { data } = await api.get(
        `/public/${slug}/availability?${qs.toString()}`,
        { noCompanyHeader: true }
      );
      const slots = Array.isArray(data?.slots)
        ? data.slots
        : (Array.isArray(data?.times) ? data.times : []);
      const clean = slots.filter(
        (s) =>
          !s.booked &&
          (s.type ? s.type === "available" : true) &&
          s.origin !== "shift"
      );
      
      if (clean.length) return clean;
    } catch {
      /* ignore and try fallback */
    }

    // 2) per-artist wrapper (if present)
    try {
      const alt = new URLSearchParams({
        service_id: serviceId,
        date: dateStr,
        timezone: tz,
        explicit_only: 1,
        respect_rows: 1,
        ...(departmentId ? { department_id: departmentId } : {}),
      });
      if (cartJSON) alt.set("cart", cartJSON);
        const { data } = await api.get(
          `/public/${slug}/artists/${empId}/availability?${alt.toString()}`,
          { noCompanyHeader: true }
        );
        const slots = Array.isArray(data?.slots)
          ? data.slots
          : Array.isArray(data?.times)
          ? data.times
          : [];
        return slots.filter((s) => {
          const typeOk = s.type ? s.type === "available" : true;
          const statusOk = s.status ? s.status === "available" : true;
          return !s.booked && typeOk && statusOk && s.origin !== "shift";
        });
      } catch {
        return [];
      }
    };

  /* helper: aggregate by start_utc (so TZ display is always correct) */
  const aggregateByUTC = (selectedDateStr, results) => {
    const map = new Map(); // key = start_utc
    for (const { emp, slots } of results) {
      for (const s of slots) {
        const tz = s.timezone || "UTC";
        const startUtc =
          s.start_utc ||
          (s.date && s.start_time ? isoFromParts(s.date, s.start_time, tz) : null);
        if (!startUtc || (s.type && s.type !== "available") || s.status === "unavailable") continue;

        const key = startUtc;
        const startLocal = s.start_time || timeHMInTZ(startUtc, tz);

        const profileImage = emp.profile_image_url || s.profile_image_url || "";
        if (!map.has(key)) {
          map.set(key, {
            key,
            date: selectedDateStr, // UI-selected day
            start_utc: startUtc,
            providers: [
              {
                id: emp.id,
                full_name: emp.full_name,
                timezone: tz,
                start_time_local: startLocal,
                profile_image_url: profileImage,
              },
            ],
          });
        } else {
          const curr = map.get(key);
          if (!curr.providers.some((p) => p.id === emp.id)) {
            curr.providers.push({
              id: emp.id,
              full_name: emp.full_name,
              timezone: tz,
              start_time_local: startLocal,
              profile_image_url: profileImage,
            });
          }
        }
      }
    }
    return Array.from(map.values())
      .map((x) => ({ ...x, count: x.providers.length }))
      .sort((a, b) => a.start_utc.localeCompare(b.start_utc));
  };

  /* prefetch month dots (any availability that day across any provider) */
  useEffect(() => {
    if (!calendarOpen || !employees.length) return;

    let cancelled = false;

    const dayHasAny = async (dStr) => {
      for (const emp of employees) {
        try {
          const slots = await fetchAvail(emp.id, dStr);
          if (slots.length > 0) return true;
        } catch {}
      }
      return false;
    };

    const prefetch = async (view) => {
      setPrefetchingMonth(true);
      try {
        const lastDay = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const localMap = { ...availableMap };
        for (let day = 1; day <= lastDay; day++) {
          if (cancelled) break;
          const d = new Date(view.getFullYear(), view.getMonth(), day);
          if (d < today) continue;
          const dStr = ymd(d);
          if (localMap[dStr] !== undefined) continue;

          const hasAny = await dayHasAny(dStr);
          localMap[dStr] = hasAny;
          if (!cancelled) setAvailableMap((prev) => ({ ...prev, [dStr]: hasAny }));
        }
      } finally {
        if (!cancelled) setPrefetchingMonth(false);
      }
    };

    prefetch(monthView);
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calendarOpen, monthView, employees, slug, serviceId, departmentId]);

  /* fetch per-day availability across ALL providers */
  useEffect(() => {
    if (!calendarOpen || !selectedDate || !employees.length) {
      setDaySlots([]);
      setSelectedTimeKey("");
      autoScrolledRef.current = false;
      return;
    }

    let cancelled = false;
    const version = ++fetchVersionRef.current;
    setFlowStage("slots-loading");
    (async () => {
      setIsFetchingSlots(true);
      try {
        const results = await Promise.all(
          employees.map(async (emp) => {
            const slots = await fetchAvail(emp.id, selectedDate);
            return { emp, slots };
          })
        );

        const unique = aggregateByUTC(selectedDate, results);

        if (!cancelled && fetchVersionRef.current === version) {
          setDaySlots(unique || []);
          setAvailableMap((prev) => ({
            ...prev,
            [selectedDate]: (unique?.length || 0) > 0,
          }));
          if (selectedTimeKey && !unique?.some((s) => s.key === selectedTimeKey)) {
            setSelectedTimeKey("");
            if (selectionLock !== "user") {
              setSelectionLock(null);
            }
          }
          setFlowStage((unique?.length || 0) > 0 ? "slots-ready" : "slots-empty");
        }
      } finally {
        if (!cancelled && fetchVersionRef.current === version) {
          setIsFetchingSlots(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [calendarOpen, selectedDate, employees, slug, serviceId, departmentId, selectedTimeKey, selectionLock]);

  const navigateToSlot = useCallback(
    (slot, artist) => {
      if (!slot || !artist) return false;
      const provTz = artist.timezone || "UTC";
      const provDate = dateYMDInTZ(slot.start_utc, provTz);
      const provTime = timeHMInTZ(slot.start_utc, provTz);

      setProviderSheetOpen(false);
      navigate({
        pathname: `/${slug}/book`,
        search:
          `?employee_id=${artist.id}` +
          `&service_id=${serviceId}` +
          `&date=${provDate}` +
          `&start_time=${provTime}` +
          `&timezone=${encodeURIComponent(provTz)}` +
          (departmentId ? `&department_id=${departmentId}` : ""),
      });
      setCalendarOpen(false);
      return true;
    },
    [departmentId, navigate, serviceId, slug]
  );

  const handleArtistSelect = useCallback(
    (artist, slotOverride = null) => {
      const slot = slotOverride || selectedSlot;
      if (!slot) return;
      navigateToSlot(slot, artist);
    },
    [navigateToSlot, selectedSlot]
  );

  /* time click → open/close inline provider picker */
  const selectTimeSlot = useCallback(
    (slot, { force = false, source = "user" } = {}) => {
      if (!slot) return;
      if (source === "auto" && selectionLock === "user") return;
      const key = slot.key;
      setSelectedTimeKey((prev) => {
        const same = prev === key;
        if (!force && same) {
          if (isMobile) {
            setTimeSheetOpen(false);
            setProviderSheetOpen(true);
          } else {
            scrollProvidersIntoView();
          }
          return prev;
        }
        if (isMobile) {
          setTimeSheetOpen(false);
          setProviderSheetOpen(true);
        } else {
          scrollProvidersIntoView();
        }
        return key;
      });
      if (source === "user") {
        setSelectionLock("user");
        setFlowStage("time-user-picked");

        if (slot.providers?.length === 1) {
          navigateToSlot(slot, slot.providers[0]);
          return;
        }
      } else if (source === "auto") {
        setSelectionLock("auto");
        setFlowStage("time-auto-picked");
      }
    },
    [isMobile, navigateToSlot, scrollProvidersIntoView, selectionLock]
  );

  const handleJumpToProviders = () => {
    if (!selectedSlot) return;
    if (isMobile) {
      setProviderSheetOpen(true);
      return;
    }
    scrollProvidersIntoView();
  };

  const timeDrawerOpen = Boolean(isMobile && timeSheetOpen && calendarOpen);
  const providerDrawerOpen = Boolean(isMobile && providerSheetOpen && selectedSlot);
  const handleTimeSheetClose = () => setTimeSheetOpen(false);
  const handleProviderSheetClose = () => setProviderSheetOpen(false);
  const handleCalendarClose = useCallback(
    (event, reason) => {
      if (
        closeGuardActive &&
        (reason === "backdropClick" || reason === "escapeKeyDown")
      ) {
        event?.preventDefault?.();
        return;
      }
      setCalendarOpen(false);
    },
    [closeGuardActive]
  );

  const buildTimeChipSx = (selected, variant = "inline") => ({
    borderRadius: 999,
    textTransform: "none",
    fontWeight: 700,
    border: `1px solid ${selected ? calendarAccent : calendarBorder}`,
    backgroundColor: selected ? calendarAccent : "transparent",
    color: selected ? calendarAccentContrast : calendarText,
    px: 2,
    boxShadow: selected ? buttonShadowVar : "none",
    transition: "all .2s ease",
    width: variant === "drawer" ? "100%" : "auto",
    "&:hover": {
      backgroundColor: selected ? calendarAccent : buttonSoftBg,
      borderColor: calendarAccent,
      color: selected ? calendarAccentContrast : calendarText,
    },
    "&:focus-visible": focusRingStyles,
    pointerEvents: "auto",
  });

  const ProviderListContent = ({ variant = "inline" }) => {
    if (!selectedSlot) {
      return (
        <Typography color="text.secondary" sx={{ p: 1 }}>
          Choose a time to see available providers.
        </Typography>
      );
    }

    const providerCount = selectedSlot.providers?.length || 0;
    const list = selectedSlot.providers || [];
    const headerBg = "var(--page-card-bg, var(--page-surface-bg, #ffffff))";

    return (
      <Paper
        elevation={0}
        sx={{
          p: 2,
          borderRadius: 2,
          width: "100%",
          border: variant === "inline" ? `1px solid ${calendarBorder}` : "none",
          backgroundColor:
            variant === "inline"
              ? "var(--page-secondary-bg, var(--page-card-bg, var(--page-surface-bg, #ffffff)))"
              : calendarSurface,
          maxHeight: variant === "drawer" ? "60vh" : "none",
          overflowY: variant === "drawer" ? "auto" : "visible",
          overflowX: "visible",
          boxSizing: "border-box",
          maxWidth: "100%",
        }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
          spacing={1.5}
          sx={{
            mb: 1.5,
            borderRadius: 2,
            border: `1px solid ${calendarBorder}`,
            backgroundColor: headerBg,
            px: 1.5,
            py: 1,
          }}
        >
          <Typography variant="subtitle1" fontWeight={700} color={calendarText}>
            Choose a Provider — {prettyDate(selectedSlot?.date)} · {timeFromUTCForViewer(selectedSlot?.start_utc)}
          </Typography>
          <Chip
            size="small"
            label={
              providerCount === 1
                ? "1 provider available"
                : `${providerCount} providers available`
            }
            sx={{
              borderRadius: 999,
              fontWeight: 600,
              backgroundColor: "var(--page-btn-bg-soft, rgba(15,23,42,0.12))",
              color: calendarText,
            }}
          />
        </Stack>

        {providerCount === 0 ? (
          <Alert severity="info">No providers available at this time. Please choose another slot.</Alert>
        ) : (
          <Stack spacing={1.25}>
            {list.map((p) => (
              <Stack
                key={p.id}
                direction="row"
                spacing={1.25}
                alignItems="center"
                justifyContent="space-between"
              >
                <Stack direction="row" spacing={1} alignItems="center" minWidth={0}>
                  <Avatar
                    src={p.profile_image_url || undefined}
                    alt={p.full_name || "Provider"}
                    sx={{ width: 44, height: 44, bgcolor: calendarAccent }}
                  >
                    {p.full_name?.[0] || "•"}
                  </Avatar>
                  <Box minWidth={0}>
                    <Typography noWrap fontWeight={700} title={p.full_name}>
                      {p.full_name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" noWrap>
                      {p.start_time_local} • {service?.name}
                    </Typography>
                  </Box>
                </Stack>
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => handleArtistSelect(p)}
                  sx={{
                    ...bookingButtonSx,
                    px: 1.75,
                    py: 0.75,
                    minWidth: 0,
                    width: "auto",
                  }}
                >
                  Select
                </Button>
              </Stack>
            ))}
          </Stack>
        )}
      </Paper>
    );
  };

  const TimeListContent = ({ variant = "inline" }) => {
    if (!selectedDate) {
      return (
        <Typography color="text.secondary" sx={{ p: 1 }}>
          Select a date to view available times.
        </Typography>
      );
    }

    if (daySlots.length === 0) {
      return (
        <Alert severity="info" sx={{ mb: variant === "drawer" ? 2 : 0 }}>
          No available times for this date. Choose another day.
        </Alert>
      );
    }

    return (
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 1.2,
          pb: variant === "drawer" ? 1 : 0,
          width: "100%",
          overflowX: "visible",
          maxWidth: "100%",
          boxSizing: "border-box",
        }}
      >
        {daySlots.map((s) => {
          const selected = s.key === selectedTimeKey;
          return (
            <Button
              key={s.key}
              size="small"
              onClick={() => selectTimeSlot(s)}
              sx={buildTimeChipSx(selected, variant)}
              title={
                s.count > 1
                  ? `${s.count} providers available at this time`
                  : "1 provider available at this time"
              }
            >
              {timeFromUTCForViewer(s.start_utc)}
              {s.count > 1 ? ` • ${s.count}` : ""}
            </Button>
          );
        })}
      </Box>
    );
  };

  /* month grid helpers */
  const weekdays = ["S", "M", "T", "W", "T", "F", "S"];
  const daysInMonth = (view) =>
    new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
  const firstWeekday = (view) =>
    new Date(view.getFullYear(), view.getMonth(), 1).getDay();

  const handleDateSelect = useCallback(
    (newDate) => {
      if (!newDate) return;
      setSelectedDate((prev) => (prev === newDate ? prev : newDate));
      setSelectedTimeKey("");
      setSelectionLock(null);
      setProviderSheetOpen(false);
      setTimeSheetOpen(false);
      setFlowStage("date-select");
    },
    []
  );

  const dayCell = (dNum) => {
    const d = new Date(monthView.getFullYear(), monthView.getMonth(), dNum);
    const ymdStr = ymd(d);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isPast = d < today;
    const isSelected = selectedDate === ymdStr;
    const hasAvail = availableMap[ymdStr] === true;

    const slotBg = "var(--page-btn-bg-soft, rgba(15,23,42,0.12))";
    const dotColor = calendarAccent;

    return (
      <Box
        key={dNum}
        onClick={() => {
          if (!isPast) {
            handleDateSelect(ymdStr); // triggers fetch for that day
          }
        }}
        sx={{
          position: "relative",
          aspectRatio: "1 / 1",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 1.2,
          cursor: isPast ? "default" : "pointer",
          border: `1px solid ${calendarBorder}`,
          bgcolor: isSelected ? calendarAccent : "transparent",
          color: isSelected ? calendarAccentContrast : isPast ? "text.disabled" : calendarText,
          "&:hover": {
            bgcolor: isPast
              ? "transparent"
              : slotBg,
          },
          transition: "background-color .15s ease, color .15s ease, border-color .15s ease",
        }}
      >
        <Typography variant="body2" sx={{ fontWeight: isSelected ? 700 : 500 }}>
          {dNum}
        </Typography>

        {/* Green dot for days with any availability */}
        {hasAvail && !isPast && (
          <Box
            sx={{
              position: "absolute",
              left: "50%",
              bottom: 6,
              transform: "translateX(-50%)",
              width: 6,
              height: 6,
              borderRadius: "50%",
              bgcolor: dotColor,
            }}
          />
        )}
      </Box>
    );
  };

  useEffect(() => {
    if (!selectedSlot || !calendarOpen) {
      setProviderSheetOpen(false);
      setProviderAnnounce("");
      return;
    }
    const count = selectedSlot.providers?.length || 0;
    if (!count) {
      setProviderAnnounce("No providers available for this time.");
    } else {
      setProviderAnnounce(count === 1 ? "1 provider available" : `${count} providers available`);
    }
  }, [selectedSlot, calendarOpen]);

  useEffect(() => {
    if (!calendarOpen || isMobile) return;
    if (selectedSlot?.providers?.length) {
      scrollProvidersIntoView();
    }
  }, [selectedSlot, calendarOpen, isMobile, scrollProvidersIntoView]);

  useEffect(() => {
    if (!calendarOpen || flowStage === "slots-loading") return;
    if (!daySlots.length) {
      if (selectionLock !== null) setSelectionLock(null);
      return;
    }
    if (selectionLock === "user") {
      const stillExists = daySlots.some((s) => s.key === selectedTimeKey);
      if (!stillExists) {
        setSelectionLock(null);
        setSelectedTimeKey("");
      }
      return;
    }
    if (!selectedTimeKey || !daySlots.some((s) => s.key === selectedTimeKey)) {
      const first = daySlots[0];
      if (first) {
        selectTimeSlot(first, { force: true, source: "auto" });
      }
    }
  }, [calendarOpen, daySlots, selectedTimeKey, selectionLock, selectTimeSlot, flowStage]);

  useEffect(() => {
    if (!calendarOpen || !selectedDate) {
      setTimeAnnounce("");
      return;
    }
    const count = daySlots.length;
    setTimeAnnounce(
      count ? `${count} time${count === 1 ? "" : "s"} available` : "No times available for this date"
    );

    if (!count) {
      if (isMobile) {
        setTimeSheetOpen(false);
      }
      return;
    }

    if (isMobile) {
      setTimeSheetOpen(true);
      return;
    }

    const target = timesRef.current;
    if (!target) return;
    // Only auto-scroll once per open cycle to avoid rubber-banding on desktop
    if (!autoScrolledRef.current) {
      scrollSectionIntoView(target);
      autoScrolledRef.current = true;
    }

    let focusTimer = typeof window !== "undefined" ? window.setTimeout(() => {
      const firstChip = target.querySelector(
        'button[role="radio"],button,[tabindex]:not([tabindex="-1"])'
      );
      firstChip?.focus({ preventScroll: true });
      if (AUTO_SELECT_FIRST_TIME && !selectedTimeKey && daySlots[0]) {
        selectTimeSlot(daySlots[0], { force: true });
      }
    }, 220) : null;

    return () => {
      if (focusTimer && typeof window !== "undefined") {
        window.clearTimeout(focusTimer);
      }
    };
  }, [daySlots, calendarOpen, selectedDate, isMobile, selectTimeSlot, selectedTimeKey, scrollSectionIntoView, armCloseGuard]);

  useEffect(() => {
    if (!calendarOpen) {
      autoScrolledRef.current = false;
    }
  }, [calendarOpen, selectedDate]);

  /* guards */
  if (loading) {
    return (
      <PublicPageShell activeKey="__services">
        <Container sx={{ textAlign: "center", mt: 5, color: buttonPalette.bg }}>
          <CircularProgress sx={{ color: "currentColor" }} />
        </Container>
      </PublicPageShell>
    );
  }
  if (error) {
    return (
      <PublicPageShell activeKey="__services">
        <Container sx={{ mt: 5 }}>
          <Alert severity="error">{error}</Alert>
        </Container>
      </PublicPageShell>
    );
  }
  if (!service) {
    return (
      <PublicPageShell activeKey="__services">
        <Container sx={{ mt: 5 }}>
          <Typography variant="h6" color="text.secondary">
            Service not found.
          </Typography>
        </Container>
      </PublicPageShell>
    );
  }

  /* UI */
  const page = (
    <Container maxWidth="md" sx={{ my: { xs: 3, md: 6 } }}>
      {/* Service header */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 3,
          border: `1px solid ${calendarBorder}`,
          overflow: "hidden",
          mb: 3,
          backgroundColor: calendarSurface,
        }}
      >
        <Box
          sx={{
            px: 3,
            py: 2.25,
            backgroundColor: "var(--page-secondary-bg, var(--page-card-bg, var(--page-surface-bg, #ffffff)))",
          }}
        >
          <Typography variant="h4" fontWeight={800}>
            {service.name}
          </Typography>
          <Stack direction="row" spacing={1} sx={{ mt: 1.25, flexWrap: "wrap" }}>
            <Chip
              label={`Duration: ${service.duration} min`}
              sx={{
                borderRadius: 999,
                fontWeight: 600,
                backgroundColor: "var(--page-btn-bg-soft, rgba(15,23,42,0.12))",
                color: calendarText,
              }}
            />
            <Chip
              label={`Price: ${money(service.base_price)}`}
              sx={{
                borderRadius: 999,
                fontWeight: 600,
                backgroundColor: calendarAccent,
                color: calendarAccentContrast,
              }}
            />
          </Stack>
        </Box>
        <Box sx={{ px: 3, py: 2 }}>
          <Typography variant="body1" sx={{ whiteSpace: "pre-line" }}>
            {service.description || "No description available."}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            You’ll be able to add extras during checkout.
          </Typography>
        </Box>
      </Paper>

      {/* Providers list */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom fontWeight="bold">
          Choose a Provider
        </Typography>
        {employees.length === 0 ? (
          <Typography>No providers available for this service.</Typography>
        ) : (
          <List disablePadding>
            {employees.map((emp) => (
              <ListItem
                key={emp.id}
                sx={{
                  borderRadius: 2,
                  border: `1px solid ${calendarBorder}`,
                  mb: 1.5,
                  alignItems: "flex-start",
                  display: "flex",
                  flexDirection: { xs: "column", sm: "row" },
                  gap: { xs: 1.5, sm: 0 },
                  backgroundColor: "var(--page-card-bg, transparent)",
                  transition: "background-color .2s ease, border-color .2s ease",
                  "&:hover": {
                    backgroundColor: "var(--page-btn-bg-soft, rgba(15,23,42,0.08))",
                    borderColor: calendarAccent,
                  },
                }}
              >
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flex: 1, width: "100%" }}>
                  <Avatar
                    src={emp.profile_image_url || undefined}
                    alt={emp.full_name || "Provider"}
                    sx={{ width: 48, height: 48, bgcolor: calendarAccent, flexShrink: 0 }}
                  >
                    {emp.full_name?.[0] || "•"}
                  </Avatar>
                  <ListItemText
                    primaryTypographyProps={{ fontWeight: 600 }}
                    primary={emp.full_name}
                    secondary={emp.bio || "No bio available."}
                  />
                </Stack>
                <Box sx={{ width: { xs: "100%", sm: "auto" } }}>
                  <Button
                    fullWidth={isMobile}
                    variant="outlined"
                    sx={bookingButtonOutlinedSx}
                    onClick={() =>
                      navigate({
                        pathname: `/${slug}/services/${serviceId}/employees/${emp.id}`,
                        search: departmentId ? `?department_id=${departmentId}` : "",
                      })
                    }
                  >
                    View & Book
                  </Button>
                </Box>
              </ListItem>
            ))}
          </List>
        )}
      </Box>

      {/* CTA */}
      <Box sx={{ textAlign: "center" }}>
        <Button
          variant="contained"
          size="large"
          sx={{ ...bookingButtonSx, px: 4, py: 1.5, fontSize: '1.05rem' }}
          onClick={() => setCalendarOpen(true)}
          disabled={employees.length === 0}
        >
          📅 Check Availability
        </Button>
      </Box>

      {/* Calendar modal */}
      <Dialog
        fullWidth
        maxWidth="md"
        scroll="paper"
        fullScreen={isTabletDown}
        open={calendarOpen}
        onClose={handleCalendarClose}
        disableEscapeKeyDown={closeGuardActive}
        PaperProps={{
          sx: {
            borderRadius: isTabletDown ? 0 : 3,
            backgroundColor: pageSurface,
            backgroundImage: "none",
            display: "flex",
            flexDirection: "column",
            maxHeight: "100dvh",
          },
        }}
        BackdropProps={{
          sx: { backgroundColor: alpha(theme.palette.common.black, 0.6) },
        }}
      >
        <DialogTitle
          sx={{
            fontWeight: 800,
            pr: 6,
            backgroundColor: pageSurface,
          }}
        >
          Select a Time Slot
          <IconButton
            onClick={() => setCalendarOpen(false)}
            sx={{ position: "absolute", right: 8, top: 8, color: calendarAccent }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent
          ref={dialogContentRef}
          dividers
          sx={{
            backgroundColor: pageSurface,
            px: 0,
            pb: scrollMarginValue,
            overflowX: "hidden",
            overflowY: "auto",
            maxHeight: "min(82dvh, 880px)",
            boxSizing: "border-box",
            position: "relative",
            flex: "1 1 auto",
            minHeight: 0,
            scrollPaddingTop: "16px",
            "&&": {
              width: "100%",
            },
            "& *": { boxSizing: "border-box", maxWidth: "100%" },
          }}
        >
          <Box
            sx={{
              maxWidth: 960,
              mx: "auto",
              px: { xs: 2, md: 3 },
              py: 2,
              backgroundColor: pageSurface,
              borderRadius: { xs: 0, sm: 2.5 },
              border: `1px solid ${calendarBorder}`,
              boxShadow: "var(--page-card-shadow, 0 18px 45px rgba(15,23,42,0.08))",
              width: "100%",
              overflow: "hidden",
              boxSizing: "border-box",
            }}
          >
            <Stack
              direction={{ xs: "column", sm: "row" }}
              alignItems={{ xs: "flex-start", sm: "center" }}
              justifyContent="space-between"
              spacing={1.5}
              sx={{ mb: 2 }}
            >
              <Box>
                <Typography variant="h5" fontWeight={800}>
                  Choose a time — {service?.name || "Selected service"}
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" sx={{ mt: 0.5 }}>
                  <Chip
                    size="small"
                    label={`TZ: ${Intl.DateTimeFormat().resolvedOptions().timeZone || "Local"}`}
                    sx={{
                      borderRadius: 999,
                      fontWeight: 600,
                      backgroundColor: "var(--page-btn-bg-soft, rgba(15,23,42,0.12))",
                      color: calendarText,
                    }}
                  />
                  <Chip
                    size="small"
                    label={`${employees.length} provider${employees.length === 1 ? "" : "s"}`}
                    sx={{
                      borderRadius: 999,
                      fontWeight: 600,
                      backgroundColor: calendarAccent,
                      color: calendarAccentContrast,
                    }}
                  />
                </Stack>
              </Box>
              <Chip
                size="small"
                variant="outlined"
                label="Setmore-style"
                sx={{
                  borderRadius: 999,
                  borderColor: calendarBorder,
                  color: calendarText,
                }}
              />
            </Stack>

          <Paper
            sx={{
              p: 2,
              mb: 3,
              borderRadius: 2,
              border: `1px solid ${calendarBorder}`,
              backgroundColor: calendarSurface,
              width: "100%",
              overflow: "hidden",
              boxSizing: "border-box",
            }}
          >
          {/* Month navigator */}
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              sx={{ mb: 1 }}
            >
              <Button
                onClick={() =>
                  setMonthView(
                    new Date(
                      monthView.getFullYear(),
                      monthView.getMonth() - 1,
                      1
                    )
                  )
                }
                sx={{
                  color: calendarAccent,
                  textTransform: "none",
                  fontWeight: 600,
                  "&:focus-visible": focusRingStyles,
                }}
              >
                ◀
              </Button>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                {monthView.toLocaleString("default", {
                  month: "long",
                  year: "numeric",
                })}
              </Typography>
              <Button
                onClick={() =>
                  setMonthView(
                    new Date(
                      monthView.getFullYear(),
                      monthView.getMonth() + 1,
                      1
                    )
                  )
                }
                sx={{
                  color: calendarAccent,
                  textTransform: "none",
                  fontWeight: 600,
                  "&:focus-visible": focusRingStyles,
                }}
              >
                ▶
              </Button>
            </Box>

            {/* Weekdays */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(7, 1fr)",
                gap: 0.5,
                mb: 0.5,
              }}
            >
              {["S", "M", "T", "W", "T", "F", "S"].map((d) => (
                <Box key={d} sx={{ textAlign: "center" }}>
                  <Typography variant="caption" color="text.secondary">
                    {d}
                  </Typography>
                </Box>
              ))}
            </Box>

            {/* Month grid with green dots */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(7, 1fr)",
                gap: 0.5,
              }}
            >
              {Array.from({ length: firstWeekday(monthView) }).map((_, i) => (
                <Box key={`blank-${i}`} />
              ))}
              {Array.from({ length: daysInMonth(monthView) }).map((_, i) => {
                const dNum = i + 1;
                return dayCell(dNum);
              })}
            </Box>
          </Paper>

          <Box
            ref={timesRef}
            id="times-section"
            role="region"
            aria-label="Available times"
            sx={{
              position: "relative",
              mb: 2,
              width: "100%",
              scrollMarginBottom: scrollMarginValue,
            }}
          >
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              sx={{
                mb: 2,
                flexWrap: "wrap",
                gap: 1,
                backgroundColor: calendarSurface,
                border: `1px solid ${calendarBorder}`,
                borderRadius: 2,
                px: 1.5,
                py: 1,
              }}
              className="section-header"
            >
              <Chip
                label={`Showing: ${prettyDate(selectedDate) || "—"}`}
                sx={{
                  borderRadius: 999,
                  fontWeight: 600,
                  border: `1px solid ${calendarBorder}`,
                  backgroundColor: "transparent",
                  color: calendarText,
                }}
              />
              <Chip
                label={
                  isFetchingSlots
                    ? "Loading…"
                    : `${daySlots.length} time${
                        daySlots.length === 1 ? "" : "s"
                      } available`
                }
                sx={{
                  borderRadius: 999,
                  fontWeight: 600,
                  backgroundColor: calendarAccent,
                  color: calendarAccentContrast,
                }}
              />
            </Stack>

            <TimeListContent />

            <Box
              sx={{
                position: "absolute",
                width: 1,
                height: 1,
                margin: -1,
                padding: 0,
                overflow: "hidden",
                clip: "rect(0 0 0 0)",
                border: 0,
              }}
              aria-live="polite"
            >
              {timeAnnounce}
            </Box>
          </Box>

          <Box
            sx={{
              position: "absolute",
              width: 1,
              height: 1,
              margin: -1,
              padding: 0,
              overflow: "hidden",
              clip: "rect(0 0 0 0)",
              border: 0,
            }}
            aria-live="polite"
          >
            {providerAnnounce}
          </Box>

          {selectedSlot && (
            <Button
              size="small"
              variant="text"
              onClick={handleJumpToProviders}
              sx={{
                textTransform: "none",
                fontWeight: 700,
                mb: 2,
                color: calendarAccent,
                "&:focus-visible": focusRingStyles,
              }}
            >
              Jump to providers
            </Button>
          )}

          <SwipeableDrawer
            anchor="bottom"
            open={timeDrawerOpen}
            onOpen={() => setTimeSheetOpen(true)}
            onClose={handleTimeSheetClose}
            disableSwipeToOpen={false}
            keepMounted
            PaperProps={{
              sx: {
                borderTopLeftRadius: 16,
                borderTopRightRadius: 16,
                maxHeight: "80dvh",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                backgroundColor: pageSurface,
              },
            }}
          >
            <Box
              sx={{
                p: 2,
                display: "flex",
                flexDirection: "column",
                height: "100%",
                boxSizing: "border-box",
              }}
              role="dialog"
              aria-label="Choose a time"
            >
              <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1.5} flexShrink={0}>
                <Typography variant="h6" fontWeight={800}>
                  Available times
                </Typography>
                <IconButton onClick={handleTimeSheetClose} sx={{ color: calendarAccent }}>
                  <CloseIcon />
                </IconButton>
              </Stack>
              <Box
                sx={{
                  flex: 1,
                  overflowY: "auto",
                  minHeight: 0,
                  overscrollBehavior: "contain",
                  pb: scrollMarginValue,
                }}
              >
                <TimeListContent variant="drawer" />
              </Box>
            </Box>
          </SwipeableDrawer>

          {/* Inline provider picker */}
          <Collapse in={!!selectedSlot && !isMobile} unmountOnExit>
            <Box
              ref={providersRef}
              tabIndex={-1}
              id="providers-section"
              sx={{
                outline: "none",
                scrollMarginBottom: scrollMarginValue,
              }}
            >
              <ProviderListContent />
            </Box>
          </Collapse>

          <SwipeableDrawer
            anchor="bottom"
            open={providerDrawerOpen}
            onOpen={() => setProviderSheetOpen(true)}
            onClose={handleProviderSheetClose}
            disableSwipeToOpen={false}
            keepMounted
            PaperProps={{
              sx: {
                borderTopLeftRadius: 16,
                borderTopRightRadius: 16,
                maxHeight: "85dvh",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                backgroundColor: pageSurface,
              },
            }}
          >
            <Box
              sx={{
                p: 2,
                display: "flex",
                flexDirection: "column",
                height: "100%",
                boxSizing: "border-box",
              }}
              role="dialog"
              aria-label="Choose a provider"
            >
              <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1.5} flexShrink={0}>
                <Typography variant="h6" fontWeight={800}>
                  Choose a provider
                </Typography>
                <IconButton onClick={handleProviderSheetClose} sx={{ color: calendarAccent }}>
                  <CloseIcon />
                </IconButton>
              </Stack>
              <Box
                sx={{
                  flex: 1,
                  overflowY: "auto",
                  minHeight: 0,
                  overscrollBehavior: "contain",
                  pb: scrollMarginValue,
                }}
              >
                <ProviderListContent variant="drawer" />
              </Box>
            </Box>
          </SwipeableDrawer>
          </Box>
        </DialogContent>
        <DialogActions
          sx={{
            backgroundColor: pageSurface,
            borderTop: `1px solid ${calendarBorder}`,
            py: 2,
            px: { xs: 2, md: 3 },
            gap: 1,
            flexWrap: { xs: "wrap", sm: "nowrap" },
            flex: "0 0 auto",
          }}
        >
          <Button
            variant="outlined"
            onClick={() => setCalendarOpen(false)}
            fullWidth={isMobile}
            sx={{
              ...bookingButtonOutlinedSx,
              width: isMobile ? "100%" : "auto",
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            fullWidth={isMobile}
            onClick={() => {
              if (selectedSlot) {
                handleJumpToProviders();
              } else if (isMobile) {
                setTimeSheetOpen(true);
              } else {
                const target = timesRef.current;
                if (target) {
                  scrollSectionIntoView(target);
                }
              }
            }}
            color="primary"
            sx={{
              ...bookingButtonSx,
              width: isMobile ? "100%" : "auto",
            }}
          >
            {selectedSlot ? "Go to providers" : "Select a time"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );

  return <PublicPageShell activeKey="__services">{page}</PublicPageShell>;
}
