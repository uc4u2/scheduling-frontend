// src/components/website/WebsiteNavSettingsCard.js
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Card,
  CardHeader,
  CardContent,
  Divider,
  Stack,
  TextField,
  Switch,
  FormControlLabel,
  Button,
  Alert,
  MenuItem,
  Typography,
} from "@mui/material";
import { wb } from "../../utils/api";
import { getAuthedCompanyId } from "../../utils/authedCompany";

/**
 * Website navigation + title controls.
 * Fixes "toggle flips back on" by normalizing stringy booleans and never
 * overwriting local state with bad defaults.
 */
export default function WebsiteNavSettingsCard({
  companyId: propCompanyId,
  initialSettings,
  onSaved,
}) {
  const companyId = useMemo(
    () => Number(propCompanyId || getAuthedCompanyId() || 0),
    [propCompanyId]
  );

  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const [siteTitle, setSiteTitle] = useState("");

  const [nav, setNav] = useState({
    show_services_tab: true,
    services_tab_target: "builtin", // builtin | page
    services_page_slug: "services",
    show_reviews_tab: true,
    reviews_tab_target: "builtin", // builtin | page
    reviews_page_slug: "reviews",
  });

  // Track the last applied settings hash to avoid redundant re-applies.
  const lastAppliedHashRef = useRef("");

  // ---------- helpers ----------
  const toBool = (v, def = true) => {
    if (v === true || v === false) return v;
    if (v === 1 || v === 0) return Boolean(v);
    if (typeof v === "string") {
      return !/^(0|false|no|off|null|undefined)$/i.test(v.trim());
    }
    return v == null ? def : Boolean(v);
  };

  const sanitizeNav = (raw = {}, prev = undefined) => {
    const prior = prev || {};
    const svcTarget = (raw.services_tab_target || prior.services_tab_target || "builtin").toLowerCase() === "page" ? "page" : "builtin";
    const revTarget = (raw.reviews_tab_target || prior.reviews_tab_target || "builtin").toLowerCase() === "page" ? "page" : "builtin";

    const svcSlug = (raw.services_page_slug || prior.services_page_slug || "services").toString().trim() || "services";
    const revSlug = (raw.reviews_page_slug || prior.reviews_page_slug || "reviews").toString().trim() || "reviews";

    return {
      show_services_tab: toBool(raw.show_services_tab, prior.show_services_tab ?? true),
      services_tab_target: svcTarget,
      services_page_slug: svcSlug,
      show_reviews_tab: toBool(raw.show_reviews_tab, prior.show_reviews_tab ?? true),
      reviews_tab_target: revTarget,
      reviews_page_slug: revSlug,
    };
  };

  const hashSettings = (obj) => {
    try {
      return JSON.stringify(obj || {});
    } catch {
      return "";
    }
  };

  // ---------- apply from initialSettings (if provided by parent) ----------
  useEffect(() => {
    if (!initialSettings) return;

    const incoming = {
      site_title:
        initialSettings?.site_title ??
        initialSettings?.settings?.site_title ??
        "",
      nav_overrides:
        initialSettings?.nav_overrides ??
        initialSettings?.settings?.nav_overrides ??
        {},
    };

    const nextHash = hashSettings(incoming);
    if (nextHash && nextHash !== lastAppliedHashRef.current) {
      setSiteTitle(incoming.site_title || "");
      setNav((prev) => sanitizeNav(incoming.nav_overrides || {}, prev));
      lastAppliedHashRef.current = nextHash;
    }
  }, [initialSettings]);

  // ---------- initial load from API (manager endpoint adds X-Company-Id) ----------
  useEffect(() => {
    if (!companyId) return;
    let alive = true;

    (async () => {
      setLoading(true);
      setErr("");
      try {
        const res = await wb.getSettings(companyId);
        const data = res?.data || res || {};

        const incoming = {
          site_title: data?.site_title || data?.settings?.site_title || "",
          nav_overrides: data?.nav_overrides || data?.settings?.nav_overrides || {},
        };

        if (!alive) return;

        const nextHash = hashSettings(incoming);
        if (nextHash && nextHash !== lastAppliedHashRef.current) {
          setSiteTitle(incoming.site_title || "");
          setNav((prev) => sanitizeNav(incoming.nav_overrides || {}, prev));
          lastAppliedHashRef.current = nextHash;
        }
      } catch (e) {
        if (!alive) return;
        setErr(e?.response?.data?.error || "Failed to load website settings.");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [companyId]);

  // ---------- save ----------
  const save = async () => {
    if (!companyId) {
      setErr("company id missing");
      return;
    }

    setBusy(true);
    setMsg("");
    setErr("");

    try {
      const payload = {
        site_title: (siteTitle || "").trim() || null,
        nav_overrides: {
          show_services_tab: !!nav.show_services_tab,
          services_tab_target: nav.services_tab_target === "page" ? "page" : "builtin",
          services_page_slug: (nav.services_page_slug || "services").trim() || "services",
          show_reviews_tab: !!nav.show_reviews_tab,
          reviews_tab_target: nav.reviews_tab_target === "page" ? "page" : "builtin",
          reviews_page_slug: (nav.reviews_page_slug || "reviews").trim() || "reviews",
        },
      };

      const res = await wb.saveSettings(companyId, payload);
      const data = res?.data || res || {};

      // Prefer server echo if present, else keep our payload (prevents flip-flop)
      const returnedNav =
        data?.nav_overrides ||
        data?.settings?.nav_overrides ||
        payload.nav_overrides;

      setSiteTitle(
        data?.site_title || data?.settings?.site_title || payload.site_title || ""
      );
      setNav((prev) => sanitizeNav(returnedNav || {}, prev));

      // Advance the applied-hash, so future GETs don’t overwrite what we just saved.
      const nextHash = hashSettings({
        site_title:
          data?.site_title || data?.settings?.site_title || payload.site_title,
        nav_overrides: returnedNav,
      });
      if (nextHash) lastAppliedHashRef.current = nextHash;

      setMsg("Saved ✔");
      onSaved?.(data);
    } catch (e) {
      const server = e?.response?.data;
      setErr(server?.error || server?.message || e.message || "Save failed.");
      // eslint-disable-next-line no-console
      console.error("[WebsiteNavSettingsCard] save error", e?.response || e);
    } finally {
      setBusy(false);
      if (!err) setTimeout(() => setMsg(""), 3000);
    }
  };

  const onChange = (key, val) => {
    setNav((prev) => {
      const next = { ...prev, [key]: val };
      return sanitizeNav(next, prev); // ensure booleans stay booleans
    });
  };

  return (
    <Card variant="outlined">
      <CardHeader
        title="Website Navigation / Title"
        subheader={
          <Typography variant="caption" color="text.secondary">
            {companyId ? `company_id=${companyId}` : "company id missing"}
          </Typography>
        }
      />
      <Divider />
      <CardContent>
        <Stack spacing={2}>
          {msg && <Alert severity="success">{msg}</Alert>}
          {err && <Alert severity="error">{err}</Alert>}
          {loading && <Alert severity="info">Loading…</Alert>}

          <TextField
            label="Site title"
            size="small"
            value={siteTitle}
            onChange={(e) => setSiteTitle(e.target.value)}
          />

          {/* Services tab controls */}
          <FormControlLabel
            control={
              <Switch
                checked={!!nav.show_services_tab}
                onChange={(_, v) => onChange("show_services_tab", v)}
              />
            }
            label="Show Services tab"
          />

          <TextField
            select
            label="Services tab target"
            size="small"
            value={nav.services_tab_target}
            onChange={(e) => onChange("services_tab_target", e.target.value)}
            helperText='Choose "builtin" for booking UI or "page" to link to a custom page'
          >
            <MenuItem value="builtin">Built-in booking</MenuItem>
            <MenuItem value="page">Custom page</MenuItem>
          </TextField>

          {nav.services_tab_target === "page" && (
            <TextField
              label="Services page slug"
              size="small"
              value={nav.services_page_slug}
              onChange={(e) => onChange("services_page_slug", e.target.value)}
              helperText="Example: services"
            />
          )}

          <Divider sx={{ my: 1 }} />

          {/* Reviews tab controls */}
          <FormControlLabel
            control={
              <Switch
                checked={!!nav.show_reviews_tab}
                onChange={(_, v) => onChange("show_reviews_tab", v)}
              />
            }
            label="Show Reviews tab"
          />

          <TextField
            select
            label="Reviews tab target"
            size="small"
            value={nav.reviews_tab_target}
            onChange={(e) => onChange("reviews_tab_target", e.target.value)}
            helperText='Choose "builtin" for the native reviews page or "page" to link to a custom page'
          >
            <MenuItem value="builtin">Built-in reviews</MenuItem>
            <MenuItem value="page">Custom page</MenuItem>
          </TextField>

          {nav.reviews_tab_target === "page" && (
            <TextField
              label="Reviews page slug"
              size="small"
              value={nav.reviews_page_slug}
              onChange={(e) => onChange("reviews_page_slug", e.target.value)}
              helperText="Example: reviews"
            />
          )}

          <Button variant="contained" disabled={busy} onClick={save}>
            {busy ? "Saving…" : "Save"}
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}
