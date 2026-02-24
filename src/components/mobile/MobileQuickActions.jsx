import React from "react";
import {
  Box,
  Button,
  Chip,
  Collapse,
  Drawer,
  IconButton,
  Fab,
  Stack,
  Typography,
} from "@mui/material";
import BoltIcon from "@mui/icons-material/Bolt";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import { useLocation, useNavigate } from "react-router-dom";
import { hapticImpact, hapticSuccess } from "../../utils/mobileFeedback";

const managerActions = [
  { label: "Shift", to: "/manager/team" },
  { label: "Checkout", to: "/manager/booking-checkout" },
  { label: "Services", to: "/manager/advanced-management" },
  { label: "Time Tracking", to: "/manager/time-tracking" },
];

const employeeActions = [
  { label: "Calendar", to: "/app/calendar" },
  { label: "My Time", to: "/app/shifts" },
  { label: "My Shifts", to: "/app/my-shifts" },
];

const MobileQuickActions = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = React.useState(false);
  const [dockOpen, setDockOpen] = React.useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("mobile.quickDockOpen") === "1";
  });
  const hasToken = typeof window !== "undefined" ? Boolean(localStorage.getItem("token")) : false;
  const role =
    typeof window !== "undefined"
      ? (localStorage.getItem("role") || "").toLowerCase()
      : "";
  const isAppRoute = location.pathname.startsWith("/app/");
  const isEmployee = role === "employee" || role === "recruiter";
  const actions = isEmployee ? employeeActions : managerActions;
  const bottomOffset = location.pathname.startsWith("/app/")
    ? "calc(env(safe-area-inset-bottom) + 84px)"
    : "calc(env(safe-area-inset-bottom) + 18px)";

  const openRoute = (path) => {
    setOpen(false);
    hapticSuccess();
    navigate(path);
  };

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("mobile.quickDockOpen", dockOpen ? "1" : "0");
  }, [dockOpen]);

  if (!isAppRoute || !hasToken || !role) {
    return null;
  }

  return (
    <>
      <Box
        sx={{
          position: "fixed",
          left: 12,
          right: 12,
          bottom: location.pathname.startsWith("/app/")
            ? "calc(env(safe-area-inset-bottom) + 84px)"
            : "calc(env(safe-area-inset-bottom) + 14px)",
          zIndex: 1299,
          pointerEvents: "none",
        }}
      >
        <Box
          sx={{
            pointerEvents: "auto",
            border: "1px solid",
            borderColor: "rgba(255,255,255,0.18)",
            bgcolor: "rgba(15, 23, 42, 0.88)",
            color: "white",
            backdropFilter: "blur(10px)",
            borderRadius: 2.5,
            px: 1.25,
            py: 0.75,
            boxShadow: "0 12px 28px rgba(0,0,0,0.35)",
          }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
            <Typography variant="caption" fontWeight={700} sx={{ letterSpacing: 0.5, textTransform: "uppercase", color: "rgba(255,255,255,0.8)" }}>
              Quick Links
            </Typography>
            <IconButton
              size="small"
              onClick={() => {
                hapticImpact("light");
                setDockOpen((prev) => !prev);
              }}
              aria-label="Toggle quick links"
              sx={{ color: "white" }}
            >
              {dockOpen ? <KeyboardArrowDownIcon fontSize="small" /> : <KeyboardArrowUpIcon fontSize="small" />}
            </IconButton>
          </Stack>
          <Collapse in={dockOpen}>
            <Stack direction="row" spacing={0.75} flexWrap="wrap" sx={{ pt: 0.5 }}>
              {actions.map((item) => (
                <Chip
                  key={`dock-${item.to}`}
                  size="small"
                  label={item.label}
                  onClick={() => openRoute(item.to)}
                  clickable
                  sx={{
                    color: "white",
                    borderColor: "rgba(255,255,255,0.22)",
                    bgcolor: "rgba(255,255,255,0.08)",
                    borderRadius: 99,
                    height: 31,
                    fontWeight: 700,
                    letterSpacing: 0.2,
                    "&:hover": { bgcolor: "rgba(255,255,255,0.16)" },
                  }}
                  variant="outlined"
                />
              ))}
            </Stack>
          </Collapse>
        </Box>
      </Box>

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
