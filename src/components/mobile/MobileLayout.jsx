import React, { useMemo, useRef, useState } from "react";
import {
  Box,
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  Alert,
  Button,
  Collapse,
} from "@mui/material";
import TodayIcon from "@mui/icons-material/Today";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import EventNoteIcon from "@mui/icons-material/EventNote";
import BookOnlineIcon from "@mui/icons-material/BookOnline";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import MobileDrawer from "./MobileDrawer";
import MobileHeader from "./MobileHeader";
import { getNetworkStatus, subscribeNetworkStatus } from "../../utils/networkStatusStore";
import { hapticImpact } from "../../utils/mobileFeedback";

const tabToValue = (pathname) => {
  if (pathname.startsWith("/app/calendar")) return "calendar";
  if (pathname.startsWith("/app/shifts")) return "shifts";
  if (pathname.startsWith("/app/bookings")) return "bookings";
  if (pathname.startsWith("/app/more")) return "more";
  return "today";
};

const MobileLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [networkState, setNetworkState] = useState(getNetworkStatus);
  const [pullDistance, setPullDistance] = useState(0);
  const pullStartY = useRef(null);
  const pullArmed = useRef(false);
  const role = useMemo(
    () => (typeof window !== "undefined" ? (localStorage.getItem("role") || "").toLowerCase() : ""),
    []
  );
  React.useEffect(() => subscribeNetworkStatus(setNetworkState), []);
  React.useEffect(() => {
    const onOnline = () => setNetworkState({ status: "ok", message: "" });
    const onOffline = () => setNetworkState({ status: "offline", message: "No internet connection." });
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  const isEmployee = role === "employee" || role === "recruiter";
  const tabConfig = isEmployee
    ? [
        { label: "Today", value: "today", icon: <TodayIcon /> },
        { label: "Calendar", value: "calendar", icon: <CalendarMonthIcon /> },
        { label: "Shifts", value: "shifts", icon: <EventNoteIcon /> },
        { label: "More", value: "more", icon: <MoreHorizIcon /> },
      ]
    : [
        { label: "Today", value: "today", icon: <TodayIcon /> },
        { label: "Calendar", value: "calendar", icon: <CalendarMonthIcon /> },
        { label: "Shifts", value: "shifts", icon: <EventNoteIcon /> },
        { label: "Bookings", value: "bookings", icon: <BookOnlineIcon /> },
        { label: "More", value: "more", icon: <MoreHorizIcon /> },
      ];
  const title = role === "employee" || role === "recruiter" ? "Employee App" : "Manager App";
  const value = tabToValue(location.pathname);
  const canPullRefresh = value !== "more";

  const startPull = (event) => {
    if (!canPullRefresh) return;
    if (window.scrollY > 0) return;
    pullStartY.current = event.touches?.[0]?.clientY ?? null;
    pullArmed.current = false;
  };

  const movePull = (event) => {
    if (!canPullRefresh) return;
    if (pullStartY.current == null) return;
    const y = event.touches?.[0]?.clientY ?? pullStartY.current;
    const delta = Math.max(0, y - pullStartY.current);
    const capped = Math.min(delta, 110);
    setPullDistance(capped);
    if (capped > 72 && !pullArmed.current) {
      pullArmed.current = true;
      hapticImpact("light");
    }
  };

  const endPull = () => {
    if (!canPullRefresh) return;
    const shouldRefresh = pullDistance > 72;
    pullStartY.current = null;
    pullArmed.current = false;
    setPullDistance(0);
    if (shouldRefresh) {
      window.dispatchEvent(new Event("mobile:refresh"));
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "background.default" }}>
      <MobileHeader title={title} onMenuClick={() => setDrawerOpen(true)} />
      <Collapse in={networkState.status !== "ok"}>
        <Alert
          severity={networkState.status === "offline" ? "warning" : "error"}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          }
          sx={{ borderRadius: 0 }}
        >
          {networkState.message || "Connection issue detected."}
        </Alert>
      </Collapse>
      <Collapse in={pullDistance > 0}>
        <Alert
          severity="info"
          icon={false}
          sx={{ borderRadius: 0, py: 0.5 }}
        >
          {pullDistance > 72 ? "Release to refresh" : "Pull to refresh"}
        </Alert>
      </Collapse>

      <Box
        sx={{ p: 1.5, pb: "94px", pt: "max(12px, env(safe-area-inset-top))" }}
        onTouchStart={startPull}
        onTouchMove={movePull}
        onTouchEnd={endPull}
      >
        <Outlet />
      </Box>

      <Paper
        elevation={8}
        sx={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          pb: "env(safe-area-inset-bottom)",
          zIndex: 1200,
        }}
      >
        <BottomNavigation
          showLabels
          value={value}
          onChange={(_, next) => {
            if (next === "more") {
              setDrawerOpen(true);
              return;
            }
            navigate(`/app/${next}`);
          }}
        >
          {tabConfig.map((tab) => (
            <BottomNavigationAction
              key={tab.value}
              label={tab.label}
              value={tab.value}
              icon={tab.icon}
            />
          ))}
        </BottomNavigation>
      </Paper>

      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} navigate={navigate} />
    </Box>
  );
};

export default MobileLayout;
