import React, { useMemo } from "react";
import {
  Avatar,
  Box,
  Button,
  Grid,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import EventAvailableOutlinedIcon from "@mui/icons-material/EventAvailableOutlined";
import AssignmentTurnedInOutlinedIcon from "@mui/icons-material/AssignmentTurnedInOutlined";
import BeachAccessOutlinedIcon from "@mui/icons-material/BeachAccessOutlined";
import SwapHorizOutlinedIcon from "@mui/icons-material/SwapHorizOutlined";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";
import ForumOutlinedIcon from "@mui/icons-material/ForumOutlined";

const resolveGreeting = (date = new Date()) => {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
};

const ShortcutCard = ({ label, icon, onClick }) => {
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
        backgroundColor: alpha(theme.palette.background.paper, 0.96),
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1}>
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
        <Typography sx={{ fontSize: 14, fontWeight: 700, color: "text.primary", lineHeight: 1.2 }}>
          {label}
        </Typography>
      </Stack>
    </Paper>
  );
};

const MobileEmployeeHome = ({
  displayName,
  profileImageUrl = "",
  managerViewingEmployee = false,
  onBackToManager,
  shortcuts = [],
}) => {
  const theme = useTheme();
  const greeting = resolveGreeting();

  const greetingName = useMemo(() => {
    const text = String(displayName || "").trim();
    return text || "Employee";
  }, [displayName]);

  return (
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
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Avatar
            src={profileImageUrl || undefined}
            alt={greetingName}
            sx={{
              width: 58,
              height: 58,
              border: `2px solid ${alpha(theme.palette.common.white, 0.68)}`,
              backgroundColor: alpha(theme.palette.common.white, 0.2),
              color: theme.palette.common.white,
              fontWeight: 800,
              boxShadow: `0 10px 24px ${alpha(theme.palette.common.black, 0.16)}`,
            }}
          >
            {greetingName?.[0] || "E"}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontSize: 13, fontWeight: 700, opacity: 0.82 }}>{greeting}</Typography>
            <Typography sx={{ mt: 0.35, fontSize: 26, fontWeight: 800, lineHeight: 1.05 }}>
              {greetingName}
            </Typography>
            <Typography sx={{ mt: 0.75, fontSize: 13, fontWeight: 600, opacity: 0.84 }}>
              Employee Home
            </Typography>
          </Box>
        </Stack>
      </Paper>

      {managerViewingEmployee && (
        <Paper
          elevation={0}
          sx={{
            p: 1.25,
            borderRadius: 2,
            border: (theme) => `1px solid ${theme.palette.primary.main}33`,
            background: (theme) =>
              `linear-gradient(135deg, ${theme.palette.primary.main}12 0%, ${theme.palette.background.paper} 100%)`,
          }}
        >
          <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography variant="body2" fontWeight={700} sx={{ lineHeight: 1.25 }}>
                Viewing Employee Workspace
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Manager Mode
              </Typography>
            </Box>
            <Button
              variant="outlined"
              size="small"
              startIcon={<ArrowBackIcon />}
              onClick={onBackToManager}
              sx={{ flexShrink: 0, minWidth: "fit-content", whiteSpace: "nowrap" }}
            >
              Back to Manager
            </Button>
          </Stack>
        </Paper>
      )}

      <Box>
        <Typography sx={{ mb: 1, fontSize: 12, fontWeight: 800, color: "text.secondary", letterSpacing: 0.3 }}>
          Quick actions
        </Typography>
        <Grid container spacing={1.25}>
          {shortcuts.map((item) => (
            <Grid item xs={6} key={item.label}>
              <ShortcutCard label={item.label} icon={item.icon} onClick={item.onClick} />
            </Grid>
          ))}
        </Grid>
      </Box>
    </Stack>
  );
};

export const employeeShortcutIconMap = {
  "my-time": <AccessTimeOutlinedIcon fontSize="small" />,
  calendar: <CalendarMonthOutlinedIcon fontSize="small" />,
  availability: <EventAvailableOutlinedIcon fontSize="small" />,
  "my-shift": <AssignmentTurnedInOutlinedIcon fontSize="small" />,
  "time-off": <BeachAccessOutlinedIcon fontSize="small" />,
  "shift-swap": <SwapHorizOutlinedIcon fontSize="small" />,
  training: <SchoolOutlinedIcon fontSize="small" />,
  communications: <ForumOutlinedIcon fontSize="small" />,
};

export default MobileEmployeeHome;
