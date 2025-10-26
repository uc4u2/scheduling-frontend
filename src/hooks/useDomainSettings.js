
// src/hooks/useDomainSettings.js
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { websiteDomains, wb } from "../utils/api";

const INITIAL_STATE = {
  status: "none",
  domain: "",
  verifiedAt: null,
  lastChecked: null,
  sslStatus: null,
  sslError: null,
  registrarHint: null,
  notifyEmailEnabled: false,
  cdnProvider: null,
  instructions: null,
  verificationToken: null,
  nextRetrySeconds: null,
  domainConnectSession: null,
  connectAuthorizationUrl: null,
};

const hasOwn = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);

const toDate = (value) => {
  if (!value) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  const instance = new Date(value);
  return Number.isNaN(instance.getTime()) ? null : instance;
};

const extractMessage = (error) => {
  if (!error) return "Unexpected error";
  return (
    error.displayMessage ||
    error?.response?.data?.user_message ||
    error?.response?.data?.message ||
    error?.message ||
    "Unexpected error"
  );
};

export default function useDomainSettings(companyId, { auto = true } = {}) {
  const mounted = useRef(true);
  const [state, setState] = useState(INITIAL_STATE);
  const [loading, setLoading] = useState(Boolean(companyId) && auto);
  const [refreshing, setRefreshing] = useState(false);
  const [activeAction, setActiveAction] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => () => {
    mounted.current = false;
  }, []);

  useEffect(() => {
    setState(INITIAL_STATE);
    setError(null);
    setLoading(Boolean(companyId) && auto);
  }, [companyId, auto]);

  const applyStatusPayload = useCallback((payload = {}) => {
    if (!mounted.current) return;
    setState((prev) => {
      if (!payload || (!Object.keys(payload).length && prev === INITIAL_STATE)) {
        return prev;
      }

      const next = { ...prev };

      const incomingStatus = payload.status ?? payload.domain_status;
      if (incomingStatus === "none") {
        return { ...INITIAL_STATE };
      }
      if (incomingStatus) {
        next.status = incomingStatus;
      }

      if (hasOwn(payload, "domain") || hasOwn(payload, "custom_domain")) {
        next.domain = payload.domain ?? payload.custom_domain ?? "";
      }

      if (hasOwn(payload, "verified_at") || hasOwn(payload, "domain_verified_at")) {
        next.verifiedAt = toDate(payload.verified_at ?? payload.domain_verified_at);
      }

      if (hasOwn(payload, "last_checked") || hasOwn(payload, "domain_last_checked_at")) {
        next.lastChecked = toDate(payload.last_checked ?? payload.domain_last_checked_at);
      }

      if (!next.lastChecked && (next.status && next.status !== "none")) {
        next.lastChecked = new Date();
      }

      if (hasOwn(payload, "ssl_status")) {
        next.sslStatus = payload.ssl_status ?? null;
      }

      if (hasOwn(payload, "ssl_error")) {
        next.sslError = payload.ssl_error ?? null;
      }

      if (hasOwn(payload, "registrar_hint")) {
        next.registrarHint = payload.registrar_hint ?? null;
      }

      if (hasOwn(payload, "notify_email_enabled")) {
        next.notifyEmailEnabled = Boolean(payload.notify_email_enabled);
      }

      if (hasOwn(payload, "cdn_provider")) {
        next.cdnProvider = payload.cdn_provider ?? null;
      }

      if (hasOwn(payload, "next_retry_seconds")) {
        next.nextRetrySeconds =
          typeof payload.next_retry_seconds === "number"
            ? payload.next_retry_seconds
            : null;
      }

      if (hasOwn(payload, "instructions")) {
        next.instructions = payload.instructions || null;
        next.verificationToken = payload.instructions?.TXT?.value || null;
      }

      if (hasOwn(payload, "verificationToken")) {
        next.verificationToken = payload.verificationToken || null;
      }

      if (hasOwn(payload, "domain_connect_session")) {
        next.domainConnectSession = payload.domain_connect_session || null;
      }

      if (hasOwn(payload, "authorization_url")) {
        next.connectAuthorizationUrl = payload.authorization_url || null;
      }

      return next;
    });
  }, []);

  const refresh = useCallback(
    async ({ initial = false } = {}) => {
      if (!companyId) {
        if (mounted.current) {
          setLoading(false);
          setRefreshing(false);
          setState(INITIAL_STATE);
        }
        return INITIAL_STATE;
      }

      if (initial) {
        if (mounted.current) setLoading(true);
      } else if (mounted.current) {
        setRefreshing(true);
      }

      try {
        const data = await websiteDomains.status(companyId);
        if (!mounted.current) {
          return data;
        }
        if (!data || data.status === "none") {
          setState(INITIAL_STATE);
        } else {
          applyStatusPayload(data);
        }
        setError(null);
        return data;
      } catch (err) {
        const message = extractMessage(err);
        if (mounted.current) {
          setError(message);
        }
        throw err;
      } finally {
        if (!mounted.current) return;
        setLoading(false);
        setRefreshing(false);
      }
    },
    [companyId, applyStatusPayload]
  );

  useEffect(() => {
    if (!auto || !companyId) return;
    refresh({ initial: true }).catch(() => {});
  }, [auto, companyId, refresh]);

  const requestDomain = useCallback(
    async (domainValue, options = {}) => {
      if (!companyId) {
        const message = "Missing company context";
        setError(message);
        throw new Error(message);
      }
      const trimmed = String(domainValue || "").trim();
      if (!trimmed) {
        const message = "Domain is required";
        setError(message);
        throw new Error(message);
      }

      const payload = {};
      if (hasOwn(options, "notifyEmailEnabled")) {
        payload.notify_email_enabled = Boolean(options.notifyEmailEnabled);
      }
      if (options.cdnProvider) {
        payload.cdn_provider = options.cdnProvider;
      }

      setActiveAction("request");
      try {
        const result = await websiteDomains.request(companyId, trimmed, payload);
        if (mounted.current && result) {
          applyStatusPayload({ ...result, domain: result.domain ?? trimmed });
          setError(null);
        }
        await refresh();
        return result;
      } catch (err) {
        const message = extractMessage(err);
        if (mounted.current) setError(message);
        throw err;
      } finally {
        if (mounted.current) setActiveAction(null);
      }
    },
    [companyId, applyStatusPayload, refresh]
  );

  const verifyDomain = useCallback(
    async () => {
      if (!companyId) {
        const message = "Missing company context";
        setError(message);
        throw new Error(message);
      }
      setActiveAction("verify");
      try {
        const result = await websiteDomains.verify(companyId);
        await refresh();
        if (mounted.current) setError(null);
        return result;
      } catch (err) {
        const message = extractMessage(err);
        if (mounted.current) setError(message);
        throw err;
      } finally {
        if (mounted.current) setActiveAction(null);
      }
    },
    [companyId, refresh]
  );

  const removeDomain = useCallback(
    async () => {
      if (!companyId) {
        const message = "Missing company context";
        setError(message);
        throw new Error(message);
      }
      setActiveAction("remove");
      try {
        const result = await websiteDomains.remove(companyId);
        if (mounted.current) {
          setState(INITIAL_STATE);
          setError(null);
        }
        await refresh();
        return result;
      } catch (err) {
        const message = extractMessage(err);
        if (mounted.current) setError(message);
        throw err;
      } finally {
        if (mounted.current) setActiveAction(null);
      }
    },
    [companyId, refresh]
  );

  const updateNotifyPreference = useCallback(
    async (enabled) => {
      if (!companyId) {
        const message = "Missing company context";
        setError(message);
        throw new Error(message);
      }
      setActiveAction("notify_opt_in");
      try {
        await wb.saveSettings(companyId, { domain_notify_email_enabled: Boolean(enabled) });
        if (mounted.current) {
          applyStatusPayload({ notify_email_enabled: Boolean(enabled) });
          setError(null);
        }
        return true;
      } catch (err) {
        const message = extractMessage(err);
        if (mounted.current) setError(message);
        throw err;
      } finally {
        if (mounted.current) setActiveAction(null);
      }
    },
    [companyId, applyStatusPayload]
  );

  const startDomainConnect = useCallback(
    async (domainValue, options = {}) => {
      if (!companyId) {
        const message = "Missing company context";
        setError(message);
        throw new Error(message);
      }
      const trimmed = String(domainValue || "").trim();
      if (!trimmed) {
        const message = "Domain is required";
        setError(message);
        throw new Error(message);
      }

      const payload = { domain: trimmed };
      if (options.registrar) {
        payload.registrar = options.registrar;
      }
      if (hasOwn(options, "notifyEmailEnabled")) {
        payload.notify_email_enabled = Boolean(options.notifyEmailEnabled);
      }
      if (options.cdnProvider) {
        payload.cdn_provider = options.cdnProvider;
      }

      setActiveAction("connect_start");
      try {
        const result = await websiteDomains.connectStart(companyId, payload);
        if (mounted.current && result) {
          applyStatusPayload({
            ...result,
            domain: result.domain ?? trimmed,
            registrar_hint: result.registrar ?? state.registrarHint,
            status: "pending_dns",
          });
          setError(null);
        }
        return result;
      } catch (err) {
        const message = extractMessage(err);
        if (mounted.current) setError(message);
        throw err;
      } finally {
        if (mounted.current) setActiveAction(null);
      }
    },
    [companyId, applyStatusPayload, state.registrarHint]
  );

  const fetchDomainConnectSession = useCallback(
    async (sessionId) => {
      if (!companyId || !sessionId) return null;
      try {
        const result = await websiteDomains.connectSession(companyId, sessionId);
        const session = result?.session || result;
        if (mounted.current) {
          applyStatusPayload({ domain_connect_session: session });
        }
        return session;
      } catch (err) {
        const message = extractMessage(err);
        if (mounted.current) setError(message);
        throw err;
      }
    },
    [companyId, applyStatusPayload]
  );

  const derived = useMemo(
    () => ({
      isVerified: state.status === "verified",
      isPending: state.status === "pending_dns",
      hasDomain: Boolean(state.domain),
      hasInstructions: Boolean(state.instructions),
    }),
    [state.status, state.domain, state.instructions]
  );

  return {
    ...state,
    ...derived,
    loading,
    refreshing,
    action: activeAction,
    processing: Boolean(activeAction),
    error,
    setError,
    refresh,
    requestDomain,
    verifyDomain,
    removeDomain,
    updateNotifyPreference,
    startDomainConnect,
    fetchDomainConnectSession,
  };
}
