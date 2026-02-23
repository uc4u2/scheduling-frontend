import React, { useMemo, useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  IconButton,
} from "@mui/material";
import TodayIcon from "@mui/icons-material/Today";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import EventNoteIcon from "@mui/icons-material/EventNote";
import BookOnlineIcon from "@mui/icons-material/BookOnline";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import MenuIcon from "@mui/icons-material/Menu";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import MobileDrawer from "./MobileDrawer";

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
  const role = useMemo(
    () => (typeof window !== "undefined" ? (localStorage.getItem("role") || "").toLowerCase() : ""),
    []
  );
  const title = role === "employee" || role === "recruiter" ? "Employee App" : "Manager App";
  const value = tabToValue(location.pathname);

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "background.default" }}>
      <AppBar position="sticky" color="inherit" elevation={1}>
        <Toolbar sx={{ minHeight: "56px !important" }}>
          <Typography variant="h6" sx={{ flexGrow: 1, fontSize: 18 }}>
            {title}
          </Typography>
          <IconButton edge="end" onClick={() => setDrawerOpen(true)}>
            <MenuIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Box sx={{ p: 1.5, pb: "92px" }}>
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
              navigate("/app/more");
              return;
            }
            navigate(`/app/${next}`);
          }}
        >
          <BottomNavigationAction label="Today" value="today" icon={<TodayIcon />} />
          <BottomNavigationAction label="Calendar" value="calendar" icon={<CalendarMonthIcon />} />
          <BottomNavigationAction label="Shifts" value="shifts" icon={<EventNoteIcon />} />
          <BottomNavigationAction label="Bookings" value="bookings" icon={<BookOnlineIcon />} />
          <BottomNavigationAction label="More" value="more" icon={<MoreHorizIcon />} />
        </BottomNavigation>
      </Paper>

      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} navigate={navigate} />
    </Box>
  );
};

export default MobileLayout;

