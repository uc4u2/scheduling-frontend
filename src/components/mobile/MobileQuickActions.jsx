import React from "react";
import {
  Box,
  Button,
  Drawer,
  Fab,
  Stack,
  Typography,
} from "@mui/material";
import BoltIcon from "@mui/icons-material/Bolt";
import { useLocation, useNavigate } from "react-router-dom";
import { hapticSuccess } from "../../utils/mobileFeedback";
import { isMobileAppMode } from "../../utils/runtime";

const managerActions = [
  { label: "Shift", to: "/manager/team" },
  { label: "Checkout", to: "/manager/booking-checkout" },
  { label: "Services", to: "/manager/advanced-management" },
  { label: "Time Tracking", to: "/manager/time-tracking" },
];

const employeeActions = [
  { label: "Calendar", to: "/employee/dashboard?tab=calendar" },
  { label: "My Time", to: "/recruiter/my-time" },
  { label: "My Availability", to: "/employee/dashboard?tab=availability" },
];

const MobileQuickActions = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = React.useState(false);
  const hasToken =
    typeof window !== "undefined"
      ? Boolean(localStorage.getItem("token"))
      : false;
  const roleRaw =
    typeof window !== "undefined"
      ? (localStorage.getItem("role") ||
          localStorage.getItem("userRole") ||
          "").toLowerCase()
      : "";
  const isMobileDashboardRoute =
    location.pathname.startsWith("/app/") ||
    location.pathname.startsWith("/manager/") ||
    location.pathname.startsWith("/employee/") ||
    location.pathname.startsWith("/recruiter/") ||
    location.pathname === "/calendar";
  const employeeRouteContext =
    location.pathname.startsWith("/employee/") ||
    location.pathname.startsWith("/recruiter/") ||
    location.pathname.startsWith("/app/calendar") ||
    location.pathname.startsWith("/app/shifts") ||
    location.pathname.startsWith("/app/my-shifts");
  const isEmployeeRole = roleRaw === "employee" || roleRaw === "recruiter";
  const actions = employeeRouteContext || isEmployeeRole ? employeeActions : managerActions;
  const bottomOffset = location.pathname.startsWith("/app/")
    ? "calc(env(safe-area-inset-bottom) + 84px)"
    : "calc(env(safe-area-inset-bottom) + 18px)";

  const openRoute = (path) => {
    setOpen(false);
    hapticSuccess();
    navigate(path);
  };

  if (!isMobileAppMode() || !isMobileDashboardRoute || !hasToken || !roleRaw) {
    return null;
  }

  return (
    <>
      <Fab
        color="secondary"
        size="medium"
        onClick={() => setOpen(true)}
        sx={{
          display: open ? "none" : "inline-flex",
          position: "fixed",
          right: 16,
          bottom: `calc(${bottomOffset} + 64px)`,
          zIndex: 1301,
          textTransform: "none",
          fontWeight: 700,
          px: 1.5,
          gap: 0.75,
        }}
      >
        <BoltIcon fontSize="small" />
      </Fab>
      <Drawer
        anchor="bottom"
        open={open}
        onClose={() => setOpen(false)}
        PaperProps={{
          sx: {
            borderTopLeftRadius: 18,
            borderTopRightRadius: 18,
            bgcolor: "#0f172a",
            color: "white",
            borderTop: "1px solid rgba(255,255,255,0.12)",
          },
        }}
      >
        <Box sx={{ px: 2, pb: "max(16px, env(safe-area-inset-bottom))", pt: 2 }}>
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1, color: "white" }}>
            Quick Actions
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 2 }}>
            {actions.map((item) => (
              <Button
                key={item.to}
                size="small"
                variant="contained"
                onClick={() => openRoute(item.to)}
                sx={{
                  borderRadius: 99,
                  textTransform: "none",
                  bgcolor: "rgba(59,130,246,0.2)",
                  color: "#bfdbfe",
                  border: "1px solid rgba(96,165,250,0.35)",
                  "&:hover": { bgcolor: "rgba(59,130,246,0.32)" },
                }}
              >
                {item.label}
              </Button>
            ))}
          </Stack>
          <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1, color: "rgba(255,255,255,0.85)" }}>
            Switch Workspace
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Button
              size="small"
              variant="outlined"
              onClick={() => openRoute("/manager/dashboard")}
              sx={{
                borderRadius: 99,
                textTransform: "none",
                borderColor: "rgba(255,255,255,0.24)",
                color: "white",
              }}
            >
              Manager Dashboard
            </Button>
            <Button
              size="small"
              variant="outlined"
              onClick={() => openRoute("/employee/my-time?workspace=manager")}
              sx={{
                borderRadius: 99,
                textTransform: "none",
                borderColor: "rgba(255,255,255,0.24)",
                color: "white",
              }}
            >
              Employee Dashboard
            </Button>
          </Stack>
        </Box>
      </Drawer>
    </>
  );
};

export default MobileQuickActions;
