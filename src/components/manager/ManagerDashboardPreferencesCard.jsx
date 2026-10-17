import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Chip,
  Stack,
  Typography,
} from "@mui/material";
import api from "../../utils/api";
import CollapsibleSectionCard from "../ui/CollapsibleSectionCard";
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

  if (!authLoaded) {
    return (
      <SectionCard
        title="My mobile dashboard"
        description="Choose the shortcuts shown on your manager workspace on phones and tablets. This changes only your layout, not your permissions."
      >
        <Typography color="text.secondary">Loading your dashboard layout…</Typography>
      </SectionCard>
    );
  }

  if (!enabled) {
    return (
      <SectionCard
        title="My mobile dashboard"
        description="Choose the shortcuts shown on your manager workspace on phones and tablets. This changes only your layout, not your permissions."
      >
        <Alert severity="info">This account does not currently have access to the manager workspace.</Alert>
      </SectionCard>
    );
  }

  return (
    <CollapsibleSectionCard
      title="My mobile dashboard"
      description="Choose the shortcuts shown on your manager workspace on phones and tablets. This changes only your layout, not your permissions."
      contentId="manager-dashboard-preferences-editor"
      expandLabel="Customize"
      summary={dashboard.loading ? (
        <Chip size="small" variant="outlined" label="Loading layout…" />
      ) : (
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
      )}
    >
      <ManagerDashboardPreferencesEditor
        preferences={dashboard.preferences}
        loading={dashboard.loading}
        saving={dashboard.saving}
        error={dashboard.error}
        onSave={dashboard.save}
      />
    </CollapsibleSectionCard>
  );
}
