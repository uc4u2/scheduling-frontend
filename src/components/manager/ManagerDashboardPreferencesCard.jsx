import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Collapse,
  Stack,
  Typography,
} from "@mui/material";
import ExpandLessOutlinedIcon from "@mui/icons-material/ExpandLessOutlined";
import ExpandMoreOutlinedIcon from "@mui/icons-material/ExpandMoreOutlined";
import api from "../../utils/api";
import SectionCard from "../ui/SectionCard";
import ManagerDashboardPreferencesEditor from "./ManagerDashboardPreferencesEditor";
import useManagerDashboardPreferences from "./useManagerDashboardPreferences";

const hasWorkspaceAccess = (user) => Boolean(
  user?.is_manager
  || user?.can_manage_onboarding
  || user?.can_manage_onboarding_limited
  || user?.can_manage_shifts
  || user?.can_manage_payroll
  || user?.can_collect_payments_self
);

export default function ManagerDashboardPreferencesCard() {
  const [currentUserInfo, setCurrentUserInfo] = useState(null);
  const [authLoaded, setAuthLoaded] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    let active = true;
    api.get("/auth/me")
      .then(({ data }) => {
        if (active) setCurrentUserInfo(data || null);
      })
      .catch(() => {
        if (active) setCurrentUserInfo(null);
      })
      .finally(() => {
        if (active) setAuthLoaded(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const enabled = useMemo(
    () => authLoaded && hasWorkspaceAccess(currentUserInfo),
    [authLoaded, currentUserInfo]
  );
  const dashboard = useManagerDashboardPreferences({ currentUserInfo, enabled });
  const actionCount = dashboard.preferences?.action_ids?.length || 0;
  const presetLabel = dashboard.preferences?.preset_key === "custom"
    ? "Custom layout"
    : "Workspace preset";

  return (
    <SectionCard
      title="My mobile dashboard"
      description="Choose the shortcuts shown on your manager workspace on phones and tablets. This changes only your layout, not your permissions."
      actions={enabled ? (
        <Button
          size="small"
          variant={expanded ? "text" : "outlined"}
          endIcon={expanded ? <ExpandLessOutlinedIcon /> : <ExpandMoreOutlinedIcon />}
          onClick={() => setExpanded((value) => !value)}
          aria-expanded={expanded}
          aria-controls="manager-dashboard-preferences-editor"
          sx={{ minHeight: 40, whiteSpace: "nowrap" }}
        >
          {expanded ? "Collapse" : "Customize"}
        </Button>
      ) : null}
      sx={{
        borderColor: "primary.light",
        "& .MuiCardHeader-root": {
          borderBottom: expanded ? "1px solid" : 0,
          borderColor: "divider",
          flexDirection: { xs: "column", sm: "row" },
          alignItems: { xs: "stretch", sm: "flex-start" },
          gap: { xs: 1, sm: 2 },
        },
        "& .MuiCardHeader-content": {
          minWidth: 0,
          width: "100%",
        },
        "& .MuiCardHeader-action": {
          alignSelf: { xs: "stretch", sm: "flex-start" },
          m: 0,
          width: { xs: "100%", sm: "auto" },
        },
        "& .MuiCardHeader-action .MuiButton-root": {
          width: { xs: "100%", sm: "auto" },
          justifyContent: { xs: "space-between", sm: "center" },
        },
        "& .MuiCardContent-root": {
          pt: expanded ? 2.5 : 1.5,
          pb: expanded ? 3 : 1.5,
        },
      }}
    >
      {!authLoaded ? (
        <Typography color="text.secondary">Loading your dashboard layout…</Typography>
      ) : !enabled ? (
        <Alert severity="info">This account does not currently have access to the manager workspace.</Alert>
      ) : (
        <>
          {!expanded && (
            <Stack
              direction={{ xs: "column", sm: "row" }}
              alignItems={{ xs: "stretch", sm: "center" }}
              justifyContent="space-between"
              gap={1.25}
            >
              <Box>
                <Typography fontWeight={750}>Your workspace is ready</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                  Expand this section only when you want to change your phone or tablet shortcuts.
                </Typography>
              </Box>
              <Stack direction="row" gap={0.75} flexWrap="wrap" useFlexGap>
                <Chip size="small" variant="outlined" label={presetLabel} />
                <Chip
                  size="small"
                  color="primary"
                  variant="outlined"
                  label={`${actionCount} quick actions`}
                />
                {dashboard.preferences?.show_workforce_cards && (
                  <Chip size="small" variant="outlined" label="Workforce shortcuts on" />
                )}
              </Stack>
            </Stack>
          )}
          <Collapse in={expanded} timeout="auto" unmountOnExit>
            <Box id="manager-dashboard-preferences-editor">
              <ManagerDashboardPreferencesEditor
                preferences={dashboard.preferences}
                loading={!authLoaded || dashboard.loading}
                saving={dashboard.saving}
                error={dashboard.error}
                onSave={dashboard.save}
              />
            </Box>
          </Collapse>
        </>
      )}
    </SectionCard>
  );
}
