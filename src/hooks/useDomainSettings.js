
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
  ownershipVerification: null,
  registrarHint: null,
  notifyEmailEnabled: false,
  cdnProvider: null,
  cnameTarget: null,
  cnameMatches: null,
  cnameWarning: null,
  dnsTxtOk: null,
  dnsCnameOk: null,
  instructions: null,
  verificationToken: null,
  nextRetrySeconds: null,
  domainConnectSession: null,
  connectAuthorizationUrl: null,
  rootRedirectOk: null,
  rootRedirectCheckedAt: null,
  rootRedirectStatusCode: null,
  rootRedirectExpectedTarget: null,
  rootRedirectObservedLocation: null,
  rootRedirectError: null,
  rootRedirectCheckedScheme: null,
  rootRedirectState: null,
  rootRedirectDetails: null,
  workerRouteState: null,
  workerRouteRequiredPattern: null,
  workerRouteWorkerName: null,
  workerRouteError: null,
  workerRouteCheckedAt: null,
  workerRouteDetectionMode: null,
  requestedDomain: null,
  canonicalDomain: null,
  cloudflareHostnameId: null,
  connectionSummary: null,
  guidance: null,
  domainDetails: null,
  dnsDetails: null,
  cloudflareDetails: null,
  bootstrapDetails: null,
  workerRouteDetails: null,
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

      if (
        hasOwn(payload, "last_checked") ||
        hasOwn(payload, "domain_last_checked_at") ||
        hasOwn(payload, "checked_at")
      ) {
        next.lastChecked = toDate(
          payload.last_checked ?? payload.domain_last_checked_at ?? payload.checked_at
        );
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

      if (hasOwn(payload, "ownership_verification")) {
        const ownership = payload.ownership_verification || null;
        if (ownership?.name && ownership?.value) {
          next.ownershipVerification = {
            name: ownership.name,
            value: ownership.value,
          };
        } else {
          next.ownershipVerification = null;
        }
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

      if (hasOwn(payload, "cname_target")) {
        next.cnameTarget = payload.cname_target ?? null;
      }

      if (hasOwn(payload, "cname_matches")) {
        next.cnameMatches =
          typeof payload.cname_matches === "boolean" ? payload.cname_matches : null;
      }

      if (hasOwn(payload, "cname_warning")) {
        next.cnameWarning = payload.cname_warning || null;
      }

      if (hasOwn(payload, "dns")) {
        const dns = payload.dns || {};
        next.dnsTxtOk =
          typeof dns.txt === "boolean"
            ? dns.txt
            : typeof dns.txt_ok === "boolean"
              ? dns.txt_ok
              : null;
        next.dnsCnameOk =
          typeof dns.cname === "boolean"
            ? dns.cname
            : typeof dns.cname_ok === "boolean"
              ? dns.cname_ok
              : null;
        next.dnsDetails = dns || null;
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

      if (hasOwn(payload, "root_redirect_ok")) {
        next.rootRedirectOk =
          typeof payload.root_redirect_ok === "boolean" ? payload.root_redirect_ok : null;
      }

      if (hasOwn(payload, "root_redirect_checked_at")) {
        next.rootRedirectCheckedAt = toDate(payload.root_redirect_checked_at);
      }

      if (hasOwn(payload, "root_redirect_status_code")) {
        next.rootRedirectStatusCode =
          typeof payload.root_redirect_status_code === "number"
            ? payload.root_redirect_status_code
            : null;
      }

      if (hasOwn(payload, "root_redirect_expected_target")) {
        next.rootRedirectExpectedTarget = payload.root_redirect_expected_target || null;
      }

      if (hasOwn(payload, "root_redirect_observed_location")) {
        next.rootRedirectObservedLocation = payload.root_redirect_observed_location || null;
      }

      if (hasOwn(payload, "root_redirect_error")) {
        next.rootRedirectError = payload.root_redirect_error || null;
      }

      if (hasOwn(payload, "root_redirect_checked_scheme")) {
        next.rootRedirectCheckedScheme = payload.root_redirect_checked_scheme || null;
      }

      if (hasOwn(payload, "root_redirect_state")) {
        next.rootRedirectState = payload.root_redirect_state || null;
      }

      if (hasOwn(payload, "worker_route_state")) {
        next.workerRouteState = payload.worker_route_state || null;
      }

      if (hasOwn(payload, "worker_route_required_pattern")) {
        next.workerRouteRequiredPattern = payload.worker_route_required_pattern || null;
      }

      if (hasOwn(payload, "worker_route_worker_name")) {
        next.workerRouteWorkerName = payload.worker_route_worker_name || null;
      }

      if (hasOwn(payload, "worker_route_error")) {
        next.workerRouteError = payload.worker_route_error || null;
      }

      if (hasOwn(payload, "worker_route_checked_at")) {
        next.workerRouteCheckedAt = toDate(payload.worker_route_checked_at);
      }

      if (hasOwn(payload, "worker_route_detection_mode")) {
        next.workerRouteDetectionMode = payload.worker_route_detection_mode || null;
      }

      if (hasOwn(payload, "requested_domain")) {
        next.requestedDomain = payload.requested_domain || null;
      }

      if (hasOwn(payload, "canonical_domain")) {
        next.canonicalDomain = payload.canonical_domain || null;
      }

      if (hasOwn(payload, "cloudflare_hostname_id")) {
        next.cloudflareHostnameId = payload.cloudflare_hostname_id || null;
      }

      if (hasOwn(payload, "connection_summary")) {
        next.connectionSummary = payload.connection_summary || null;
      }

      if (hasOwn(payload, "guidance")) {
        next.guidance = payload.guidance || null;
      }

      if (hasOwn(payload, "domain_details")) {
        next.domainDetails = payload.domain_details || null;
        next.verifiedAt =
          toDate(payload.domain_details?.verified_at) || next.verifiedAt || null;
        next.requestedDomain = payload.domain_details?.requested || next.requestedDomain || null;
        next.canonicalDomain = payload.domain_details?.canonical || next.canonicalDomain || null;
        next.domain = payload.domain_details?.canonical || next.domain || "";
        next.cloudflareHostnameId =
          payload.domain_details?.cloudflare_hostname_id || next.cloudflareHostnameId || null;
      }

      if (hasOwn(payload, "cloudflare")) {
        next.cloudflareDetails = payload.cloudflare || null;
        if (hasOwn(payload.cloudflare || {}, "ssl_status")) {
          next.sslStatus = payload.cloudflare?.ssl_status ?? null;
        }
        if (hasOwn(payload.cloudflare || {}, "ssl_error")) {
          next.sslError = payload.cloudflare?.ssl_error ?? null;
        }
        if (hasOwn(payload.cloudflare || {}, "hostname_id")) {
          next.cloudflareHostnameId = payload.cloudflare?.hostname_id || next.cloudflareHostnameId || null;
        }
      }

      if (hasOwn(payload, "bootstrap")) {
        next.bootstrapDetails = payload.bootstrap || null;
      }

      if (hasOwn(payload, "root_redirect")) {
        next.rootRedirectDetails = payload.root_redirect || null;
        next.rootRedirectOk =
          typeof payload.root_redirect?.ok === "boolean" ? payload.root_redirect.ok : next.rootRedirectOk;
        next.rootRedirectCheckedAt =
          toDate(payload.root_redirect?.checked_at) || next.rootRedirectCheckedAt || null;
        next.rootRedirectStatusCode =
          typeof payload.root_redirect?.status_code === "number"
            ? payload.root_redirect.status_code
            : next.rootRedirectStatusCode;
        next.rootRedirectExpectedTarget =
          payload.root_redirect?.expected_target || next.rootRedirectExpectedTarget || null;
        next.rootRedirectObservedLocation =
          payload.root_redirect?.observed_location || next.rootRedirectObservedLocation || null;
        next.rootRedirectError = payload.root_redirect?.error || next.rootRedirectError || null;
        next.rootRedirectCheckedScheme =
          payload.root_redirect?.checked_scheme || next.rootRedirectCheckedScheme || null;
        next.rootRedirectState = payload.root_redirect?.state || next.rootRedirectState || null;
      }

      if (hasOwn(payload, "worker_route")) {
        next.workerRouteDetails = payload.worker_route || null;
        next.workerRouteState = payload.worker_route?.state || next.workerRouteState || null;
        next.workerRouteRequiredPattern =
          payload.worker_route?.required_pattern || next.workerRouteRequiredPattern || null;
        next.workerRouteWorkerName =
          payload.worker_route?.worker_name || next.workerRouteWorkerName || null;
        next.workerRouteError = payload.worker_route?.error || next.workerRouteError || null;
        next.workerRouteCheckedAt =
          toDate(payload.worker_route?.checked_at) || next.workerRouteCheckedAt || null;
        next.workerRouteDetectionMode =
          payload.worker_route?.detection_mode || next.workerRouteDetectionMode || null;
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

  const diagnoseDomain = useCallback(
    async () => {
      if (!companyId) {
        const message = "Missing company context";
        setError(message);
        throw new Error(message);
      }
      setActiveAction("diagnose");
      try {
        const result = await websiteDomains.diagnose(companyId);
        if (mounted.current && result) {
          applyStatusPayload(result);
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
    [companyId, applyStatusPayload]
  );

  const retrySsl = useCallback(
    async () => {
      if (!companyId) {
        const message = "Missing company context";
        setError(message);
        throw new Error(message);
      }
      setActiveAction("ssl_retry");
      try {
        const result = await websiteDomains.sslRetry(companyId);
        if (mounted.current && result) {
          applyStatusPayload(result);
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
    [companyId, applyStatusPayload]
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
        if (websiteDomains?.notify) {
          await websiteDomains.notify(companyId, enabled);
        } else {
          await wb.saveSettings(companyId, { domain_notify_email_enabled: Boolean(enabled) });
        }
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
      isVerified: Boolean(state.verifiedAt) || state.connectionSummary === "connected" || ["verified", "ssl_active"].includes(state.status),
      isPending:
        !state.verifiedAt &&
        state.connectionSummary !== "connected" &&
        ["pending_dns", "verified_dns", "provisioning_ssl"].includes(state.status),
      hasDomain: Boolean(state.domain),
      hasInstructions: Boolean(state.instructions),
    }),
    [state.status, state.verifiedAt, state.connectionSummary, state.domain, state.instructions]
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
    diagnoseDomain,
    retrySsl,
  };
}
