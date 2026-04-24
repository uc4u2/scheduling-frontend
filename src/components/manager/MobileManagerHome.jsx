import React, { useMemo } from "react";
import {
  Box,
  Button,
  Grid,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import EventBusyOutlinedIcon from "@mui/icons-material/EventBusyOutlined";
import SwapHorizOutlinedIcon from "@mui/icons-material/SwapHorizOutlined";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import ChecklistOutlinedIcon from "@mui/icons-material/ChecklistOutlined";
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";
import PointOfSaleOutlinedIcon from "@mui/icons-material/PointOfSaleOutlined";
import PaymentsOutlinedIcon from "@mui/icons-material/PaymentsOutlined";
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import ForumOutlinedIcon from "@mui/icons-material/ForumOutlined";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import ManagementFrame from "../../components/ui/ManagementFrame";

const resolveGreeting = (date = new Date()) => {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
};

const getManagerName = (currentUserInfo) => {
  const fullName = [currentUserInfo?.first_name, currentUserInfo?.last_name].filter(Boolean).join(" ").trim();
  return (
    fullName ||
    currentUserInfo?.full_name ||
    currentUserInfo?.name ||
    currentUserInfo?.email?.split("@")[0] ||
    "Manager"
  );
};

const shortcutIconMap = {
  team: <GroupsOutlinedIcon fontSize="small" />,
  "time-tracking": <AccessTimeOutlinedIcon fontSize="small" />,
  "employee-management": <BadgeOutlinedIcon fontSize="small" />,
  leaves: <EventBusyOutlinedIcon fontSize="small" />,
  "swap-approvals": <SwapHorizOutlinedIcon fontSize="small" />,
  "advanced-management": <StorefrontOutlinedIcon fontSize="small" />,
  "booking-checkout": <PointOfSaleOutlinedIcon fontSize="small" />,
  payroll: <PaymentsOutlinedIcon fontSize="small" />,
  overview: <DashboardOutlinedIcon fontSize="small" />,
  "master-calendar": <CalendarMonthOutlinedIcon fontSize="small" />,
  communications: <ForumOutlinedIcon fontSize="small" />,
  training: <SchoolOutlinedIcon fontSize="small" />,
};

const ShortcutCard = ({ label, icon, onClick, compact = false }) => {
  const theme = useTheme();

  return (
    <Paper
      variant="outlined"
      onClick={onClick}
      sx={{
        p: compact ? 1.35 : 1.5,
        borderRadius: 2.5,
        cursor: "pointer",
        borderColor: alpha(theme.palette.primary.main, 0.14),
        backgroundColor: alpha(theme.palette.background.paper, 0.96),
        transition: "transform 120ms ease, box-shadow 120ms ease, border-color 120ms ease",
        "&:active": { transform: "scale(0.985)" },
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1}>
        <Box
          sx={{
            width: compact ? 30 : 34,
            height: compact ? 30 : 34,
            borderRadius: 1.75,
            display: "grid",
            placeItems: "center",
            color: "primary.main",
            backgroundColor: alpha(theme.palette.primary.main, 0.1),
            flexShrink: 0,
          }}
        >
          {icon}
        </Box>
        <Typography
          sx={{
            fontSize: compact ? 13 : 14,
            fontWeight: 700,
            color: "text.primary",
            lineHeight: 1.2,
          }}
        >
          {label}
        </Typography>
      </Stack>
    </Paper>
  );
};

const StatusCard = ({ label, value, icon, onClick }) => {
  const theme = useTheme();

  return (
    <Paper
      variant="outlined"
      onClick={onClick}
      sx={{
        p: 1.5,
        borderRadius: 2.5,
        cursor: "pointer",
        borderColor: alpha(theme.palette.primary.main, 0.14),
        background: `linear-gradient(180deg, ${alpha(theme.palette.primary.main, 0.04)} 0%, ${alpha(
          theme.palette.background.paper,
          0.98
        )} 100%)`,
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
        <Box
          sx={{
            width: 34,
            height: 34,
            borderRadius: 1.75,
            display: "grid",
            placeItems: "center",
            color: "primary.main",
            backgroundColor: alpha(theme.palette.primary.main, 0.1),
            flexShrink: 0,
          }}
        >
          {icon}
        </Box>
        <ArrowForwardRoundedIcon sx={{ color: alpha(theme.palette.text.primary, 0.35), fontSize: 18, mt: 0.25 }} />
      </Stack>
      <Typography sx={{ mt: 1.2, fontSize: 12, fontWeight: 700, color: "text.secondary", letterSpacing: 0.2 }}>
        {label}
      </Typography>
      <Typography sx={{ mt: 0.35, fontSize: 18, fontWeight: 800, color: "text.primary", lineHeight: 1.1 }}>
        {value}
      </Typography>
    </Paper>
  );
};

const MobileManagerHome = ({
  currentUserInfo,
  swapRequests,
  allowedViewKeys = [],
  onOpenView,
  onEmployeeView,
  canUseEmployeeView = false,
}) => {
  const theme = useTheme();
  const greeting = resolveGreeting();
  const managerName = getManagerName(currentUserInfo);
  const swapCount = Array.isArray(swapRequests) ? swapRequests.length : null;

  const primaryShortcuts = useMemo(
    () =>
      [
        { key: "team", label: "Shift Management" },
        { key: "time-tracking", label: "Time Tracking" },
        { key: "employee-management", label: "Employees" },
        { key: "leaves", label: "Leaves" },
        { key: "swap-approvals", label: "Swap Approvals" },
        { key: "advanced-management", label: "Services & Bookings" },
        { key: "booking-checkout", label: "Booking Checkout" },
        { key: "payroll", label: "Payroll" },
      ].filter((item) => allowedViewKeys.includes(item.key)),
    [allowedViewKeys]
  );

  const secondaryShortcuts = useMemo(
    () =>
      [
        { key: "overview", label: "Overview" },
        { key: "master-calendar", label: "Master Calendar" },
        { key: "communications", label: "Communications" },
        { key: "training", label: "Training" },
      ].filter((item) => allowedViewKeys.includes(item.key)),
    [allowedViewKeys]
  );

  const statusCards = [
    { label: "Shifts Today", value: "Open", key: "team", icon: <GroupsOutlinedIcon fontSize="small" /> },
    { label: "Checked In", value: "View", key: "time-tracking", icon: <AccessTimeOutlinedIcon fontSize="small" /> },
    { label: "Pending Leaves", value: "Review", key: "leaves", icon: <EventBusyOutlinedIcon fontSize="small" /> },
    {
      label: "Open Swaps",
      value: swapCount !== null ? String(swapCount) : "View",
      key: "swap-approvals",
      icon: <SwapHorizOutlinedIcon fontSize="small" />,
    },
  ];

  return (
    <ManagementFrame>
      <Stack spacing={2}>
        <Paper
          sx={{
            p: 2,
            borderRadius: 3,
            color: "common.white",
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.dark, 0.92)} 0%, ${alpha(
              theme.palette.primary.main,
              0.82
            )} 58%, ${alpha(theme.palette.info.light, 0.75)} 100%)`,
            boxShadow: `0 20px 40px ${alpha(theme.palette.primary.main, 0.18)}`,
          }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1.5}>
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontSize: 13, fontWeight: 700, opacity: 0.82 }}>
                {greeting}
              </Typography>
              <Typography sx={{ mt: 0.35, fontSize: 26, fontWeight: 800, lineHeight: 1.05 }}>
                {managerName}
              </Typography>
              <Typography sx={{ mt: 0.75, fontSize: 13, fontWeight: 600, opacity: 0.84 }}>
                Manager Home
              </Typography>
            </Box>
            {canUseEmployeeView && (
              <Button
                size="small"
                variant="contained"
                onClick={onEmployeeView}
                startIcon={<PeopleAltOutlinedIcon />}
                sx={{
                  flexShrink: 0,
                  borderRadius: 999,
                  px: 1.35,
                  py: 0.6,
                  fontWeight: 700,
                  textTransform: "none",
                  color: theme.palette.primary.dark,
                  backgroundColor: alpha(theme.palette.common.white, 0.94),
                  boxShadow: "none",
                  "&:hover": {
                    backgroundColor: theme.palette.common.white,
                    boxShadow: "none",
                  },
                }}
              >
                Employee View
              </Button>
            )}
          </Stack>
        </Paper>

        <Grid container spacing={1.25}>
          {statusCards.map((item) => (
            <Grid item xs={6} key={item.label}>
              <StatusCard label={item.label} value={item.value} icon={item.icon} onClick={() => onOpenView(item.key)} />
            </Grid>
          ))}
        </Grid>

        <Box>
          <Typography sx={{ mb: 1, fontSize: 12, fontWeight: 800, color: "text.secondary", letterSpacing: 0.3 }}>
            Quick actions
          </Typography>
          <Grid container spacing={1.25}>
            {primaryShortcuts.map((item) => (
              <Grid item xs={6} key={item.key}>
                <ShortcutCard
                  label={item.label}
                  icon={shortcutIconMap[item.key]}
                  onClick={() => onOpenView(item.key)}
                />
              </Grid>
            ))}
          </Grid>
        </Box>

        {secondaryShortcuts.length > 0 && (
          <Box>
            <Typography sx={{ mb: 1, fontSize: 12, fontWeight: 800, color: "text.secondary", letterSpacing: 0.3 }}>
              More
            </Typography>
            <Grid container spacing={1}>
              {secondaryShortcuts.map((item) => (
                <Grid item xs={6} key={item.key}>
                  <ShortcutCard
                    compact
                    label={item.label}
                    icon={shortcutIconMap[item.key]}
                    onClick={() => onOpenView(item.key)}
                  />
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
      </Stack>
    </ManagementFrame>
  );
};

export default MobileManagerHome;
