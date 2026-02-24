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

const managerActions = [
  { label: "Shift", to: "/manager/team" },
  { label: "Checkout", to: "/manager/booking-checkout" },
  { label: "Services", to: "/manager/advanced-management" },
  { label: "Time Tracking", to: "/manager/time-tracking" },
];

const employeeActions = [
  { label: "Calendar", to: "/employee?tab=calendar" },
  { label: "My Time", to: "/employee/my-time" },
  { label: "My Shifts", to: "/employee/my-shifts" },
];

const MobileQuickActions = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = React.useState(false);
  const [dockOpen, setDockOpen] = React.useState(false);
  const role =
    typeof window !== "undefined"
      ? (localStorage.getItem("role") || "").toLowerCase()
      : "";
  const isEmployee = role === "employee" || role === "recruiter";
  const actions = isEmployee ? employeeActions : managerActions;
  const bottomOffset = location.pathname.startsWith("/app/")
    ? "calc(env(safe-area-inset-bottom) + 84px)"
    : "calc(env(safe-area-inset-bottom) + 18px)";

  const openRoute = (path) => {
    setOpen(false);
    navigate(path);
  };

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
            borderColor: "divider",
            bgcolor: "background.paper",
            borderRadius: 2,
            px: 1,
            py: 0.5,
            boxShadow: 2,
          }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
            <Typography variant="caption" fontWeight={700}>
              Quick Links
            </Typography>
            <IconButton
              size="small"
              onClick={() => setDockOpen((prev) => !prev)}
              aria-label="Toggle quick links"
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
                />
              ))}
            </Stack>
          </Collapse>
        </Box>
      </Box>

      <Fab
        color="primary"
        size="medium"
        onClick={() => setOpen(true)}
        sx={{
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
      >
        <Box sx={{ px: 2, pb: "max(16px, env(safe-area-inset-bottom))", pt: 2 }}>
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
            Quick Actions
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 2 }}>
            {actions.map((item) => (
              <Button
                key={item.to}
                size="small"
                variant="outlined"
                onClick={() => openRoute(item.to)}
              >
                {item.label}
              </Button>
            ))}
          </Stack>
          <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
            Switch Workspace
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Button size="small" variant="text" onClick={() => openRoute("/manager/dashboard")}>
              Manager Dashboard
            </Button>
            <Button size="small" variant="text" onClick={() => openRoute("/employee/my-time?workspace=manager")}>
              Employee Dashboard
            </Button>
          </Stack>
        </Box>
      </Drawer>
    </>
  );
};

export default MobileQuickActions;
