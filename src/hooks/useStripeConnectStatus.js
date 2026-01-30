// src/hooks/useStripeConnectStatus.js
import { useCallback, useEffect, useMemo, useState } from "react";
import { stripeConnect } from "../utils/api";

const EMPTY_STATUS = {
  connected: false,
  charges_enabled: false,
  payouts_enabled: false,
  details_submitted: false,
  requirements_due: [],
  disabled_reason: null,
  error: null,
  updated_at: null,
};

const normalize = (data = {}) => {
  const payload = { ...EMPTY_STATUS, ...(data || {}) };
  payload.connected = Boolean(
    data?.connected ?? data?.charges_enabled ?? payload.connected
  );
  payload.charges_enabled = Boolean(data?.charges_enabled ?? payload.charges_enabled);
  payload.payouts_enabled = Boolean(data?.payouts_enabled ?? payload.payouts_enabled);
  payload.details_submitted = Boolean(
    data?.details_submitted ?? payload.details_submitted
  );
  payload.requirements_due = Array.isArray(data?.requirements_due)
    ? data.requirements_due
    : payload.requirements_due;
  payload.disabled_reason = data?.disabled_reason ?? payload.disabled_reason;
  payload.error = data?.error ?? payload.error;
  payload.updated_at = data?.updated_at ?? payload.updated_at;
  return payload;
};

export default function useStripeConnectStatus({ auto = true } = {}) {
  const [status, setStatus] = useState(EMPTY_STATUS);
  const [loading, setLoading] = useState(Boolean(auto));
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await stripeConnect.getStatus();
      setStatus(normalize(data));
      setError(null);
    } catch (err) {
      if (err?.stripeOnboardingIncomplete) {
        setStatus({ ...EMPTY_STATUS });
        setError(err);
      } else {
        setError(err);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (auto) refresh();
  }, [auto, refresh]);

  const chargesReady = useMemo(
    () => Boolean(status?.charges_enabled),
    [status?.charges_enabled]
  );

  const needsOnboarding = useMemo(
    () => !chargesReady,
    [chargesReady]
  );

  return {
    status,
    loading,
    error,
    refresh,
    chargesReady,
    needsOnboarding,
  };
}
