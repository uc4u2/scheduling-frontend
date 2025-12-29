// src/pages/sections/management/WebsiteTemplates.js
import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Grid,
  Typography,
  Button,
  Select,
  MenuItem,
  Stack,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  ToggleButton,
  ToggleButtonGroup,
  Divider,
  Tooltip,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import CheckIcon from "@mui/icons-material/Check";
import PhoneIphoneIcon from "@mui/icons-material/PhoneIphone";
import TabletMacIcon from "@mui/icons-material/TabletMac";
import DesktopWindowsIcon from "@mui/icons-material/DesktopWindows";

import TemplatePreviewPane from "../../../components/website/TemplatePreviewPane";
import { RenderSections } from "../../../components/website/RenderSections";
import { ensureCompanyId } from "../../../utils/company";
import { wb as website } from "../../../utils/api";
import { useNavigate } from "react-router-dom";

import SectionCard from "../../../components/ui/SectionCard";
import TabShell from "../../../components/ui/TabShell";

const DEFAULT_VERSION = "1.0.0";

export default function WebsiteTemplates({ companyId: companyIdProp }) {
  const navigate = useNavigate();
  const [companyId, setCompanyId] = useState(companyIdProp || null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [templates, setTemplates] = useState([]);
  const [selectedKey, setSelectedKey] = useState(null);
  const [selectedVersion, setSelectedVersion] = useState(null);

  const [mini, setMini] = useState({});
  const [hoverKey, setHoverKey] = useState(null);

  // Popup preview (not full screen)
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [device, setDevice] = useState("desktop");
  const [pageSlug, setPageSlug] = useState("");

  // Import status
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);

  // ---------- Detect company once ----------
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (companyIdProp) return;
      try {
        const cid = await ensureCompanyId();
        if (mounted) setCompanyId(cid || null);
      } catch {
        // ignore; UI will warn
      }
    })();
    return () => {
      mounted = false;
    };
  }, [companyIdProp]);

  // ---------- Load manifest ----------
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const res = await website.listTemplates();
        const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        if (!mounted) return;
        setTemplates(list);
        if (list.length) {
          setSelectedKey(list[0].key);
          const v =
            list[0].latest ||
            (Array.isArray(list[0].versions) && list[0].versions[0]) ||
            DEFAULT_VERSION;
          setSelectedVersion(v);
        }
      } catch {
        if (mounted) setErr("Failed to load templates.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const currentTemplate = useMemo(
    () => templates.find((t) => t.key === selectedKey) || null,
    [templates, selectedKey]
  );

  // When the selected card changes, default its version
  useEffect(() => {
    if (!currentTemplate) return;
    const v =
      currentTemplate.latest ||
      (Array.isArray(currentTemplate.versions) && currentTemplate.versions[0]) ||
      DEFAULT_VERSION;
    setSelectedVersion(v);
  }, [currentTemplate]);

  // ---------- Hover mini preview ----------
  const cacheKey = (key, ver) => `${key}@${ver || DEFAULT_VERSION}`;
  const preloadMini = async (key, ver) => {
    const ck = cacheKey(key, ver);
    if (mini[ck]) return;
    try {
      const res = await website.getTemplate(key, ver);
      const data = res?.data ?? res;
      setMini((m) => ({ ...m, [ck]: data || null }));
    } catch {
      // swallow; just no inline preview
    }
  };

  // ---------- Popup preview (now takes explicit key & version to avoid stale state) ----------
  const openPreview = async (keyArg, verArg) => {
    const k = keyArg || selectedKey;
    const v = verArg || selectedVersion || DEFAULT_VERSION;
    if (!k) return;

    setPreviewOpen(true);
    setPreviewLoading(true);
    setPreviewData(null);
    setPageSlug(""); // reset to homepage

    try {
      const res = await website.getTemplate(k, v);
      const data = res?.data ?? res;
      setPreviewData(data);
    } catch {
      setPreviewData({ error: "Failed to load template preview." });
    } finally {
      setPreviewLoading(false);
    }
  };

  // ---------- Import (then redirect to builder) ----------
  const goToBuilder = () => navigate("/manage/website/builder");

  const runImport = async (keyOverride, versionOverride) => {
    const key = keyOverride || selectedKey;
    const version = versionOverride || selectedVersion || DEFAULT_VERSION;
    if (!companyId || !key) return;
    setImporting(true);
    setImportResult(null);
    try {
      const payload = {
        key,
        template_key: key,
        version,
        clear_existing: true,
        publish: true,
        set_theme_from_template: true,
      };
      const res = await website.importTemplate(companyId, payload);
      const data = res?.data ?? res;
      setImportResult({ ok: true, data });

      // Redirect to the builder after a successful import
      goToBuilder();
    } catch (e) {
      const detail =
        e?.response?.data?.error ||
        e?.response?.data?.message ||
        e?.message ||
        "Import failed.";
      setImportResult({ ok: false, error: detail });
    } finally {
      setImporting(false);
    }
  };

  const deviceWidth = device === "mobile" ? 390 : device === "tablet" ? 768 : 1200;

  // ---------- UI ----------
  if (loading) {
    return (
      <Box sx={{ p: 3, textAlign: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  const Alerts = (
    <Stack spacing={2}>
      {!companyId && (
        <Alert severity="warning">
          We’ll import once we detect your company automatically (make sure you’re logged in as a manager).
        </Alert>
      )}
      {err && <Alert severity="error">{err}</Alert>}
      {!templates.length && (
        <Alert severity="info">
          No templates found yet. Place JSON files in <code>app/website_templates</code>.
        </Alert>
      )}
    </Stack>
  );

  const TemplatesGrid = (
    <Grid container spacing={2}>
      {templates.map((t) => {
        const isSelected = t.key === selectedKey;
        const v = isSelected
          ? selectedVersion || t.latest || DEFAULT_VERSION
          : t.latest || (t.versions?.[0] ?? DEFAULT_VERSION);
        const ck = cacheKey(t.key, v);
        const miniTpl = mini[ck];

        return (
          <Grid item xs={12} sm={6} md={4} key={t.key}>
            <SectionCard
              title={t.name || t.key}
              description={`Key: ${t.key}`}
              actions={
                isSelected ? (
                  <Stack direction="row" spacing={1}>
                    {/* pass explicit key & version to avoid reading stale state */}
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => openPreview(t.key, v)}
                    >
                      Preview
                    </Button>
                    <Tooltip
                      title={!companyId ? "Sign in as a manager first" : "Import and go to the editor"}
                    >
                      <span>
                        <Button
                          size="small"
                          variant="contained"
                          onClick={runImport}
                          disabled={!companyId || importing}
                        >
                          {importing ? "Importing…" : "Use"}
                        </Button>
                      </span>
                    </Tooltip>
                  </Stack>
                ) : (
                  <Button size="small" onClick={() => setSelectedKey(t.key)}>
                    Select
                  </Button>
                )
              }
            >
              <Box
                sx={{
                  borderRadius: 1,
                  overflow: "hidden",
                  border: "1px solid rgba(0,0,0,0.08)",
                  position: "relative",
                  height: 180,
                  bgcolor: "background.paper",
                }}
                onMouseEnter={() => {
                  setHoverKey(t.key);
                  preloadMini(t.key, v);
                }}
                onMouseLeave={() => setHoverKey((k) => (k === t.key ? null : k))}
              >
                {t.preview ? (
                  <img
                    src={t.preview}
                    alt={`${t.name || t.key} preview`}
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                    onError={(e) => (e.currentTarget.style.display = "none")}
                  />
                ) : miniTpl?.pages?.[0]?.content?.sections ? (
                  <Box sx={{ p: 1, transform: "scale(0.9)", transformOrigin: "top left" }}>
                    <RenderSections sections={miniTpl.pages[0].content.sections} />
                  </Box>
                ) : (
                  <Box sx={{ width: "100%", height: "100%", display: "grid", placeItems: "center" }}>
                    <Typography variant="caption" color="text.secondary">
                      Hover to load preview…
                    </Typography>
                  </Box>
                )}

                {/* Hover overlay */}
                <Box
                  sx={{
                    position: "absolute",
                    inset: 0,
                    bgcolor: "rgba(0,0,0,0.35)",
                    opacity: hoverKey === t.key ? 1 : 0,
                    transition: "opacity 180ms ease",
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  <Stack direction="row" spacing={1}>
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={<PlayArrowIcon />}
                      onClick={() => {
                        // Keep UI selection in sync...
                        setSelectedKey(t.key);
                        setSelectedVersion(v);
                        // ...but preview uses explicit key/version to avoid “previous template” bug
                        openPreview(t.key, v);
                      }}
                    >
                      Preview
                    </Button>
                    <Tooltip
                      title={!companyId ? "Sign in as a manager first" : "Import and go to the editor"}
                    >
                          <span>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<CheckIcon />}
                          onClick={() => {
                            setSelectedKey(t.key);
                            setSelectedVersion(v);
                            runImport(t.key, v);
                          }}
                          disabled={!companyId || importing}
                        >
                          Use
                        </Button>
                      </span>
                    </Tooltip>
                  </Stack>
                </Box>
              </Box>

              {isSelected && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                    Version
                  </Typography>
                  <Select
                    size="small"
                    fullWidth
                    value={selectedVersion || DEFAULT_VERSION}
                    onChange={(e) => setSelectedVersion(e.target.value)}
                  >
                    {(t.versions && t.versions.length ? t.versions : [DEFAULT_VERSION]).map((ver) => (
                      <MenuItem key={ver} value={ver}>
                        v{ver}
                      </MenuItem>
                    ))}
                  </Select>
                </Box>
              )}
            </SectionCard>
          </Grid>
        );
      })}
    </Grid>
  );

  const ImportStatus = importResult && (
    <SectionCard title="Import Status">
      {importResult.ok ? (
        <Alert severity="success">
          Imported {importResult.data?.imported_pages ?? 0} pages.{" "}
          {importResult.data?.theme_applied ? "Theme applied. " : ""}
          Site live: {String(importResult.data?.is_live)}.{" "}
          <Button
            color="inherit"
            size="small"
            onClick={goToBuilder}
            sx={{ ml: 1, textDecoration: "underline" }}
          >
            Start editing
          </Button>
        </Alert>
      ) : (
        <Alert severity="error">{importResult.error || "Import failed."}</Alert>
      )}
    </SectionCard>
  );

  const tabs = [
    {
      label: "Templates",
      content: (
        <Stack spacing={2}>
          {Alerts}
          {TemplatesGrid}
          {ImportStatus}
        </Stack>
      ),
    },
  ];

  return (
    <>
      <TabShell
        title="Website Templates"
        description="Browse and import ready-made designs"
        tabs={tabs}
      />

      {/* Popup Preview (centered dialog) */}
      <Dialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        fullWidth
        maxWidth="xl"
        keepMounted
      >
        <DialogTitle sx={{ pr: 6 }}>
          {selectedKey}
          {selectedVersion ? ` (v${selectedVersion})` : ""}
          <IconButton onClick={() => setPreviewOpen(false)} sx={{ position: "absolute", right: 16, top: 12 }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ bgcolor: "background.default" }}>
          {previewLoading && (
            <Box sx={{ textAlign: "center", p: 6 }}>
              <CircularProgress />
            </Box>
          )}

          {!previewLoading && previewData?.error && <Alert severity="error">{previewData.error}</Alert>}

          {!previewLoading && previewData && !previewData.error && (
            <Box sx={{ display: "grid", gridTemplateColumns: { md: "260px 1fr" }, gap: 2 }}>
              {/* Left rail: version, pages, device, actions */}
              <Box sx={{ p: 2, borderRight: { md: "1px solid rgba(0,0,0,0.08)" } }}>
                <Typography variant="subtitle2" sx={{ mb: 1, opacity: 0.7 }}>
                  Version
                </Typography>
                <Select
                  size="small"
                  fullWidth
                  value={selectedVersion || DEFAULT_VERSION}
                  onChange={(e) => setSelectedVersion(e.target.value)}
                  sx={{ mb: 2 }}
                >
                  {(previewData?.versions && previewData.versions.length
                    ? previewData.versions
                    : [selectedVersion || DEFAULT_VERSION]
                  ).map((ver) => (
                    <MenuItem key={ver} value={ver}>
                      v{ver}
                    </MenuItem>
                  ))}
                </Select>

                <Divider sx={{ my: 1 }} />

                <Typography variant="subtitle2" sx={{ mb: 1, opacity: 0.7 }}>
                  Pages
                </Typography>
                <Stack spacing={1}>
                  {(previewData.pages || []).map((p) => (
                    <Button
                      key={p.slug}
                      size="small"
                      variant={
                        pageSlug ? (pageSlug === p.slug ? "contained" : "outlined") : p.is_homepage ? "contained" : "outlined"
                      }
                      onClick={() => setPageSlug(p.slug)}
                    >
                      {p.menu_title || p.title}
                    </Button>
                  ))}
                </Stack>

                <Divider sx={{ my: 2 }} />

                <Typography variant="subtitle2" sx={{ mb: 1, opacity: 0.7 }}>
                  Device
                </Typography>
                <ToggleButtonGroup size="small" exclusive value={device} onChange={(_, v) => v && setDevice(v)}>
                  <ToggleButton value="mobile">
                    <PhoneIphoneIcon fontSize="small" />
                  </ToggleButton>
                  <ToggleButton value="tablet">
                    <TabletMacIcon fontSize="small" />
                  </ToggleButton>
                  <ToggleButton value="desktop">
                    <DesktopWindowsIcon fontSize="small" />
                  </ToggleButton>
                </ToggleButtonGroup>

                <Divider sx={{ my: 2 }} />

                <Stack spacing={1}>
                  <Tooltip title={!companyId ? "Sign in as a manager first" : "Import and go to the editor"}>
                    <span>
                      <Button variant="contained" onClick={runImport} disabled={!companyId || importing}>
                        {importing ? "Importing…" : "Use this template"}
                      </Button>
                    </span>
                  </Tooltip>
                  <Button variant="outlined" onClick={() => setPreviewOpen(false)}>
                    Close
                  </Button>
                </Stack>
              </Box>

              {/* Right: live preview surface */}
              <Box sx={{ p: { xs: 0, md: 2 } }}>
                <Box
                  sx={{
                    mx: "auto",
                    width: deviceWidth,
                    maxWidth: "100%",
                    border: "1px solid rgba(0,0,0,0.12)",
                    borderRadius: 2,
                    bgcolor: "background.paper",
                    overflow: "hidden",
                  }}
                >
                  {(() => {
                    const pages = previewData.pages || [];
                    const pg =
                      (pageSlug && pages.find((p) => p.slug === pageSlug)) ||
                      pages.find((p) => p.is_homepage) ||
                      pages[0];
                    return pg ? (
                      <RenderSections sections={pg?.content?.sections || []} />
                    ) : (
                      <TemplatePreviewPane template={previewData} />
                    );
                  })()}
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ display: { xs: "flex", md: "none" } }}>
          <Button onClick={() => setPreviewOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
