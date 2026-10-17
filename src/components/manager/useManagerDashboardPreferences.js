import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import api from "../../utils/api";

const EMPTY_STATE = {
  action_ids: [],
  available_action_ids: [],
  default_action_ids: [],
  show_workforce_cards: false,
  version: 0,
  preset_key: "custom",
  max_actions: 10,
};

const preferenceScope = (currentUserInfo) => {
  const userId = currentUserInfo?.id;
  const companyId = currentUserInfo?.company?.id || currentUserInfo?.company_id;
  return userId && companyId ? `${companyId}:${userId}` : "";
};

export default function useManagerDashboardPreferences({ currentUserInfo, enabled = true } = {}) {
  const scope = useMemo(() => preferenceScope(currentUserInfo), [currentUserInfo]);
  const requestRef = useRef(0);
  const [state, setState] = useState({
    preferences: EMPTY_STATE,
    loading: Boolean(enabled),
    saving: false,
    error: "",
  });

  const load = useCallback(async () => {
    if (!enabled || !scope) {
      setState({ preferences: EMPTY_STATE, loading: false, saving: false, error: "" });
      return null;
    }
    const requestId = ++requestRef.current;
    setState((previous) => ({ ...previous, loading: true, error: "" }));
    try {
      const { data } = await api.get("/api/manager-workspace/dashboard-preferences");
      if (requestRef.current !== requestId || preferenceScope(currentUserInfo) !== scope) return null;
      setState({ preferences: { ...EMPTY_STATE, ...(data || {}) }, loading: false, saving: false, error: "" });
      return data || null;
    } catch (error) {
      if (requestRef.current !== requestId || preferenceScope(currentUserInfo) !== scope) return null;
      setState((previous) => ({
        ...previous,
        loading: false,
        saving: false,
        error: error?.response?.data?.message || error?.response?.data?.error || "Unable to load dashboard preferences.",
      }));
      return null;
    }
  }, [currentUserInfo, enabled, scope]);

  useEffect(() => {
    load();
    return () => {
      requestRef.current += 1;
    };
  }, [load]);

  const save = useCallback(async (draft) => {
    if (!enabled || !scope) throw new Error("Dashboard preferences are unavailable.");
    const requestId = ++requestRef.current;
    const submittedScope = scope;
    const exactPayload = {
      action_ids: [...(draft?.action_ids || [])],
      show_workforce_cards: Boolean(draft?.show_workforce_cards),
      expected_version: state.preferences.version,
      preset_key: draft?.preset_key || "custom",
    };
    setState((previous) => ({ ...previous, saving: true, error: "" }));
    try {
      const { data } = await api.put(
        "/api/manager-workspace/dashboard-preferences",
        exactPayload
      );
      if (requestRef.current !== requestId || preferenceScope(currentUserInfo) !== submittedScope) return null;
      setState({ preferences: { ...EMPTY_STATE, ...(data || {}) }, loading: false, saving: false, error: "" });
      return data || null;
    } catch (error) {
      if (requestRef.current !== requestId || preferenceScope(currentUserInfo) !== submittedScope) return null;
      const conflict = error?.response?.status === 409;
      const authoritative = error?.response?.data?.preferences;
      setState((previous) => ({
        preferences: conflict && authoritative
          ? { ...EMPTY_STATE, ...authoritative }
          : previous.preferences,
        loading: false,
        saving: false,
        error: conflict
          ? "Your dashboard changed in another session. The latest version is shown; review it before saving again."
          : error?.response?.data?.message || "Unable to save dashboard preferences.",
      }));
      throw error;
    }
  }, [currentUserInfo, enabled, scope, state.preferences.version]);

  return {
    ...state,
    reload: load,
    save,
    scope,
  };
}
