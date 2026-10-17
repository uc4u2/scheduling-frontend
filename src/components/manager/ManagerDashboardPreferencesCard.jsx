import React, { useEffect, useMemo, useState } from "react";
import { Alert } from "@mui/material";
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

  return (
    <SectionCard
      title="My mobile dashboard"
      description="Choose the shortcuts shown on your manager workspace on phones and tablets. This changes only your layout, not your permissions."
    >
      {authLoaded && !enabled ? (
        <Alert severity="info">This account does not currently have access to the manager workspace.</Alert>
      ) : (
        <ManagerDashboardPreferencesEditor
          preferences={dashboard.preferences}
          loading={!authLoaded || dashboard.loading}
          saving={dashboard.saving}
          error={dashboard.error}
          onSave={dashboard.save}
        />
      )}
    </SectionCard>
  );
}
