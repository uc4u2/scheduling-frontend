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
      <Fab
        color="primary"
        size="medium"
        onClick={() => setOpen(true)}
        sx={{
          position: "fixed",
          right: 16,
          bottom: bottomOffset,
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
