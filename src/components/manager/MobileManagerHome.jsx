import React, { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import EventBusyOutlinedIcon from "@mui/icons-material/EventBusyOutlined";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import SwapHorizOutlinedIcon from "@mui/icons-material/SwapHorizOutlined";
import ManagementFrame from "../ui/ManagementFrame";
import ManagerDashboardActionIcon from "./ManagerDashboardActionIcon";
import ManagerDashboardPreferencesEditor from "./ManagerDashboardPreferencesEditor";
import {
  WORKFORCE_DASHBOARD_ACTION_IDS,
  resolveManagerDashboardAction,
} from "./managerDashboardActions";

const resolveGreeting = (date = new Date()) => {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
};

const getManagerName = (currentUserInfo) => {
  const fullName = [currentUserInfo?.first_name, currentUserInfo?.last_name].filter(Boolean).join(" ").trim();
  return fullName || currentUserInfo?.full_name || currentUserInfo?.name || currentUserInfo?.email?.split("@")[0] || "Workspace";
};

const getAccessLabel = (user) => {
  if (user?.is_manager) return "Manager workspace";
  if (user?.can_manage_payroll) return "Payroll & finance workspace";
  if (user?.can_manage_shifts) return "Supervisor workspace";
  if (user?.can_manage_onboarding || user?.can_manage_onboarding_limited) return "People workspace";
  if (user?.can_collect_payments_self) return "Booking checkout workspace";
  return "Authorized workspace";
};

const ShortcutCard = ({ action, onClick }) => {
  const theme = useTheme();
  return (
    <Paper
      component="button"
      type="button"
      variant="outlined"
      onClick={onClick}
      sx={{
        width: "100%",
        minHeight: { xs: 92, sm: 104 },
        p: 1.5,
        borderRadius: 1,
        cursor: "pointer",
        textAlign: "left",
        color: "text.primary",
        borderColor: alpha(theme.palette.primary.main, 0.2),
        backgroundColor: alpha(theme.palette.background.paper, 0.98),
        transition: "border-color 120ms ease, box-shadow 120ms ease, transform 120ms ease",
        "&:hover": {
          borderColor: alpha(theme.palette.primary.main, 0.48),
          boxShadow: `0 8px 18px ${alpha(theme.palette.primary.main, 0.1)}`,
        },
        "&:active": { transform: "translateY(1px)" },
        "&:focus-visible": { outline: `3px solid ${alpha(theme.palette.primary.main, 0.35)}`, outlineOffset: 2 },
      }}
    >
      <Stack direction="row" alignItems="flex-start" spacing={1.1}>
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: 1,
            display: "grid",
            placeItems: "center",
            color: "primary.main",
            backgroundColor: alpha(theme.palette.primary.main, 0.1),
            flexShrink: 0,
          }}
        >
          <ManagerDashboardActionIcon icon={action.icon} fontSize="small" />
        </Box>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography sx={{ fontSize: 13.5, fontWeight: 800, lineHeight: 1.25 }}>{action.label}</Typography>
          <Typography
            sx={{
              mt: 0.45,
              fontSize: 11.5,
              color: "text.secondary",
              lineHeight: 1.35,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {action.description}
          </Typography>
        </Box>
        <ArrowForwardRoundedIcon sx={{ color: alpha(theme.palette.text.primary, 0.38), fontSize: 18, flexShrink: 0 }} />
      </Stack>
    </Paper>
  );
};

const WorkforceCard = ({ label, helper, value, icon, onClick }) => {
  const theme = useTheme();
  return (
    <Paper
      component="button"
      type="button"
      variant="outlined"
      onClick={onClick}
      sx={{
        width: "100%",
        minHeight: 102,
        p: 1.4,
        borderRadius: 1,
        cursor: "pointer",
        textAlign: "left",
        color: "text.primary",
        borderColor: alpha(theme.palette.primary.main, 0.16),
        background: `linear-gradient(180deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.background.paper, 0.98)} 100%)`,
        "&:focus-visible": { outline: `3px solid ${alpha(theme.palette.primary.main, 0.35)}`, outlineOffset: 2 },
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
        <Box sx={{ color: "primary.main", display: "grid", placeItems: "center" }}>{icon}</Box>
        <ArrowForwardRoundedIcon sx={{ color: alpha(theme.palette.text.primary, 0.34), fontSize: 18 }} />
      </Stack>
      <Typography sx={{ mt: 1, fontSize: 12.5, fontWeight: 800 }}>{label}</Typography>
      <Typography sx={{ mt: 0.25, fontSize: 12, color: "text.secondary" }}>{value || helper}</Typography>
    </Paper>
  );
};

const MobileManagerHome = ({
  currentUserInfo,
  swapRequests,
  dashboardPreferences,
  preferencesLoading = false,
  preferencesSaving = false,
  preferencesError = "",
  onSavePreferences,
  onOpenAction,
  onEmployeeView,
  canUseEmployeeView = false,
}) => {
  const theme = useTheme();
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const greeting = resolveGreeting();
  const managerName = getManagerName(currentUserInfo);
  const swapCount = Array.isArray(swapRequests) ? swapRequests.length : null;
  const availableIds = useMemo(
    () => dashboardPreferences?.available_action_ids || [],
    [dashboardPreferences?.available_action_ids]
  );
  const available = useMemo(() => new Set(availableIds), [availableIds]);
  const actions = useMemo(
    () => (dashboardPreferences?.action_ids || [])
      .filter((id) => !(
        dashboardPreferences?.show_workforce_cards
        && WORKFORCE_DASHBOARD_ACTION_IDS.has(id)
      ))
      .map((id) => resolveManagerDashboardAction(id, currentUserInfo))
      .filter(Boolean),
    [currentUserInfo, dashboardPreferences?.action_ids, dashboardPreferences?.show_workforce_cards]
  );

  const workforceCards = [
    { actionId: "shift-management", label: "Shift Management", helper: "Open scheduling", icon: <GroupsOutlinedIcon fontSize="small" /> },
    { actionId: "time-tracking", label: "Time Tracking", helper: "Review time clock", icon: <AccessTimeOutlinedIcon fontSize="small" /> },
    { actionId: "leaves", label: "Leave Requests", helper: "Review requests", icon: <EventBusyOutlinedIcon fontSize="small" /> },
    { actionId: "swap-approvals", label: "Swap Approvals", helper: "Review requests", value: swapCount !== null ? `${swapCount} open` : "Review requests", icon: <SwapHorizOutlinedIcon fontSize="small" /> },
  ].filter((item) => available.has(item.actionId));

  const handleSave = async (draft) => {
    const result = await onSavePreferences?.(draft);
    if (result) setCustomizeOpen(false);
    return result;
  };

  return (
    <ManagementFrame>
      <Stack spacing={2}>
        <Paper
          variant="outlined"
          sx={{
            p: { xs: 1.75, sm: 2 },
            borderRadius: 1,
            borderColor: alpha(theme.palette.primary.main, 0.24),
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.dark, 0.94)} 0%, ${alpha(theme.palette.primary.main, 0.86)} 68%, ${alpha(theme.palette.info.main, 0.72)} 100%)`,
            boxShadow: `0 14px 30px ${alpha(theme.palette.primary.main, 0.16)}`,
            color: "common.white",
          }}
        >
          <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "stretch", sm: "flex-start" }} gap={1.5}>
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontSize: 12.5, fontWeight: 700, opacity: 0.84 }}>{greeting}</Typography>
              <Typography sx={{ mt: 0.3, fontSize: { xs: 24, sm: 27 }, fontWeight: 850, lineHeight: 1.08 }} noWrap>
                {managerName}
              </Typography>
              <Typography sx={{ mt: 0.7, fontSize: 12.5, fontWeight: 650, opacity: 0.88 }}>
                {getAccessLabel(currentUserInfo)}
              </Typography>
            </Box>
            <Stack direction="row" spacing={1}>
              <Button
                size="small"
                variant="contained"
                onClick={() => setCustomizeOpen(true)}
                startIcon={<SettingsOutlinedIcon />}
                sx={{
                  minHeight: 40,
                  borderRadius: 1,
                  textTransform: "none",
                  fontWeight: 750,
                  color: theme.palette.primary.dark,
                  backgroundColor: alpha(theme.palette.common.white, 0.95),
                  boxShadow: "none",
                  "&:hover": { backgroundColor: theme.palette.common.white, boxShadow: "none" },
                }}
              >
                Customize
              </Button>
              {canUseEmployeeView && (
                <Button
                  size="small"
                  variant="outlined"
                  onClick={onEmployeeView}
                  startIcon={<PeopleAltOutlinedIcon />}
                  sx={{
                    minHeight: 40,
                    borderRadius: 1,
                    textTransform: "none",
                    fontWeight: 750,
                    color: "common.white",
                    borderColor: alpha(theme.palette.common.white, 0.72),
                    "&:hover": { borderColor: "common.white", backgroundColor: alpha(theme.palette.common.white, 0.08) },
                  }}
                >
                  Employee view
                </Button>
              )}
            </Stack>
          </Stack>
        </Paper>

        {preferencesError && <Alert severity="warning">{preferencesError}</Alert>}

        {dashboardPreferences?.show_workforce_cards && workforceCards.length > 0 && (
          <Box>
            <Typography sx={{ mb: 1, fontSize: 12.5, fontWeight: 850, color: "text.secondary", letterSpacing: 0.25 }}>
              Workforce
            </Typography>
            <Grid container spacing={1.1}>
              {workforceCards.map((item) => (
                <Grid item xs={6} sm={3} key={item.actionId}>
                  <WorkforceCard
                    {...item}
                    onClick={() => onOpenAction(resolveManagerDashboardAction(item.actionId, currentUserInfo))}
                  />
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        <Box>
          <Stack direction="row" justifyContent="space-between" alignItems="baseline" sx={{ mb: 1 }}>
            <Typography sx={{ fontSize: 12.5, fontWeight: 850, color: "text.secondary", letterSpacing: 0.25 }}>
              Quick actions
            </Typography>
            <Typography variant="caption" color="text.secondary">Your workspace</Typography>
          </Stack>
          {preferencesLoading ? (
            <Stack alignItems="center" sx={{ py: 5 }} spacing={1}>
              <CircularProgress size={28} />
              <Typography variant="body2" color="text.secondary">Loading your shortcuts…</Typography>
            </Stack>
          ) : (
            actions.length > 0 ? (
              <Grid container spacing={1.1}>
                {actions.map((action) => (
                  <Grid item xs={6} sm={4} md={3} key={action.id}>
                    <ShortcutCard action={action} onClick={() => onOpenAction(action)} />
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Alert severity="info">
                Add a non-workforce shortcut, or turn off Workforce shortcuts in Customize.
              </Alert>
            )
          )}
        </Box>
      </Stack>

      <Dialog open={customizeOpen} onClose={() => !preferencesSaving && setCustomizeOpen(false)} fullWidth maxWidth="md">
        <DialogTitle sx={{ pr: 6 }}>
          Customize mobile dashboard
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.4 }}>
            This layout follows your account across phones and tablets.
          </Typography>
          <IconButton
            aria-label="Close dashboard customization"
            onClick={() => setCustomizeOpen(false)}
            disabled={preferencesSaving}
            sx={{ position: "absolute", right: 12, top: 12 }}
          >
            <CloseOutlinedIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <ManagerDashboardPreferencesEditor
            preferences={dashboardPreferences}
            loading={preferencesLoading}
            saving={preferencesSaving}
            error={preferencesError}
            onSave={handleSave}
          />
        </DialogContent>
      </Dialog>
    </ManagementFrame>
  );
};

export default MobileManagerHome;
