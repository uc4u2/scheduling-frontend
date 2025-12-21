import { useEffect, useState } from "react";
import { api } from "../../utils/api";

const ACCESS_STORAGE_KEY = "recruiterTabsAccess";

const getCachedAccess = () => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(ACCESS_STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data || typeof data !== "object") return null;
    return {
      isManager: Boolean(data.isManager),
      canManageOnboarding: Boolean(data.canManageOnboarding),
      canManageOnboardingLimited: Boolean(data.canManageOnboardingLimited),
      allowHrAccess: Boolean(data.allowHrAccess),
    };
  } catch (_err) {
    return null;
  }
};

const storeAccess = (payload) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(ACCESS_STORAGE_KEY, JSON.stringify(payload));
  } catch (_err) {
    // ignore storage failures
  }
};

const DEFAULT_ACCESS = {
  isManager: false,
  canManageOnboarding: false,
  canManageOnboardingLimited: false,
  allowHrAccess: false,
};

const useRecruiterTabsAccess = () => {
  const cached = getCachedAccess();
  const [isLoading, setIsLoading] = useState(!cached);
  const [access, setAccess] = useState(cached || DEFAULT_ACCESS);

  useEffect(() => {
    let mounted = true;
    api
      .get("/auth/me", { noCompanyHeader: true })
      .then((res) => {
        if (!mounted) return;
        const data = res?.data || {};
        const isManager = Boolean(data.is_manager);
        const canManageOnboarding = Boolean(data.can_manage_onboarding);
        const canManageOnboardingLimited = Boolean(data.can_manage_onboarding_limited);
        const allowHrAccess = isManager || canManageOnboarding || canManageOnboardingLimited;
        const nextAccess = {
          isManager,
          canManageOnboarding,
          canManageOnboardingLimited,
          allowHrAccess,
        };
        setAccess(nextAccess);
        storeAccess(nextAccess);
        setIsLoading(false);
      })
      .catch(() => {
        if (!mounted) return;
        if (!cached) {
          setAccess(DEFAULT_ACCESS);
        }
        setIsLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  return {
    isLoading,
    allowCandidateSearch: access.allowHrAccess,
    allowHrAccess: access.allowHrAccess,
    isManager: access.isManager,
    canManageOnboarding: access.canManageOnboarding,
    canManageOnboardingLimited: access.canManageOnboardingLimited,
  };
};

export default useRecruiterTabsAccess;
