// src/components/website/LayoutLabProPanel.js
import React from "react";
import {
  Box, Stack, Button, Typography, Divider, TextField, Slider, Select, MenuItem,
  ToggleButtonGroup, ToggleButton, FormControlLabel, Switch, Chip, Tooltip
} from "@mui/material";

const LAB_LS_KEY = "layout_tuning_lab_v1";
const PRESETS_LS_KEY = "lab_presets_v2";
const TYPE_DEFAULTS_LS_KEY = "lab_type_defaults_v1";

// ---------- Utils ----------
const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);
const sectionsOf = (page) => (page?.content?.sections && Array.isArray(page.content.sections)) ? page.content.sections : [];
const metaOf = (page) => (page?.content?.meta) || {};
const withMeta = (page, metaPatch) => ({
  ...page,
  content: { ...(page.content || {}), meta: { ...(page?.content?.meta || {}), ...(metaPatch || {}) } }
});
const withSections = (page, nextSections) => ({
  ...page,
  content: { ...(page.content || {}), sections: nextSections }
});
const clone = (x) => JSON.parse(JSON.stringify(x || {}));

/** Shallow diff of page meta + section props (for rollback UX) */
function diffPage(before, after) {
  const changes = [];
  // meta
  const bMeta = metaOf(before), aMeta = metaOf(after);
  for (const k of new Set([...Object.keys(bMeta), ...Object.keys(aMeta)])) {
    if (JSON.stringify(bMeta[k]) !== JSON.stringify(aMeta[k])) {
      changes.push({ path: `meta.${k}`, before: bMeta[k], after: aMeta[k] });
    }
  }
  // sections
  const bSecs = sectionsOf(before), aSecs = sectionsOf(after);
  const len = Math.max(bSecs.length, aSecs.length);
  for (let i = 0; i < len; i++) {
    const b = bSecs[i], a = aSecs[i];
    if (!b || !a) continue;
    const bp = b.props || {}, ap = a.props || {};
    for (const k of new Set([...Object.keys(bp), ...Object.keys(ap)])) {
      if (JSON.stringify(bp[k]) !== JSON.stringify(ap[k])) {
        changes.push({ path: `sections[${i}].props.${k}`, before: bp[k], after: ap[k] });
      }
    }
  }
  return changes;
}

// ---------- Defaults that match your renderer/inspector ----------
const PRESETS = [
  { name: "Default", layout: "boxed", sectionSpacing: 6, defaultGutterX: 16 },
  { name: "Compact", layout: "boxed", sectionSpacing: 4, defaultGutterX: 12 },
  { name: "Comfortable", layout: "boxed", sectionSpacing: 8, defaultGutterX: 24 },
  { name: "Full-bleed Showcase", layout: "full", sectionSpacing: 6, defaultGutterX: 24 },
];

const SCOPE_OPTIONS = [
  { key: "page", label: "Page meta" },
  { key: "selected", label: "Selected section" },
  { key: "all", label: "All sections" },
  { key: "type", label: "All of type…" },
];

// ---------- Overlays component (optional mount in preview) ----------
export function LayoutLabOverlays({ overlays = {} }) {
  const { showGrid, showGutters, showBleeds, containerPx = 16 } = overlays || {};
  return (
    <Box pointerEvents="none" sx={{ position: "absolute", inset: 0, zIndex: 10 }}>
      {showGrid && (
        <Box sx={{
          position: "absolute", inset: 0,
          backgroundImage:
            "linear-gradient(to bottom, rgba(0,0,0,.06) 1px, transparent 1px)",
          backgroundSize: "100% 8px",
        }} />
      )}
      {showGutters && (
        <Box sx={{ position: "absolute", inset: 0, display: "flex", justifyContent: "space-between" }}>
          <Box sx={{ width: `${containerPx}px`, bgcolor: "rgba(25,118,210,.12)", height: "100%" }} />
          <Box sx={{ width: `${containerPx}px`, bgcolor: "rgba(25,118,210,.12)", height: "100%" }} />
        </Box>
      )}
      {showBleeds && (
        <Box sx={{ position: "absolute", inset: 0, border: "2px dashed rgba(244,67,54,.5)" }} />
      )}
    </Box>
  );
}

// ---------- Main Panel ----------
export default function LayoutLabProPanel({
  page,                        // current page object (meta + sections)
  onChange,                    // (next) => void   — apply mutations live to preview
  selectedIndex = -1,          // optionally pass a selected section index from your page
  onOverlaysChange,            // (overlaysObj) => void
  onThemeOverridesChange,      // (muiOverrides) => void  (pass to ThemeRuntimeProvider)
}) {
  const [local, setLocal] = React.useState(() => {
    try { return JSON.parse(localStorage.getItem(LAB_LS_KEY)) || {}; } catch { return {}; }
  });
  const [scope, setScope] = React.useState("page");
  const [typeFilter, setTypeFilter] = React.useState("hero");
  const [overlays, setOverlays] = React.useState({ showGrid: false, showGutters: false, showBleeds: false, containerPx: 16 });
  // Seed theme state safely (no empty strings)
  const [theme, setTheme] = React.useState({ palette: {}, shape: { borderRadius: 10 } });

  // Keep parent informed (preview page can mount <LayoutLabOverlays overlays={…} />)
  React.useEffect(() => { onOverlaysChange?.(overlays); }, [overlays, onOverlaysChange]);
  React.useEffect(() => { onThemeOverridesChange?.(theme); }, [theme, onThemeOverridesChange]);

  const pageMeta = metaOf(page);
  const secList = sectionsOf(page);
  const selected = secList[selectedIndex];

  // ---------- Preset handling ----------
  const applyPresetToLocal = (preset) => {
    const next = { ...local,
      layout: preset.layout, sectionSpacing: preset.sectionSpacing,
      // allow responsive: object or number. Start with number; you can toggle "responsive" below.
      defaultGutterX: preset.defaultGutterX
    };
    setLocal(next);
    localStorage.setItem(LAB_LS_KEY, JSON.stringify(next));
  };

  // ---------- Scope application ----------
  const applyToPage = (patch) => onChange?.(withMeta(page, patch));
  const applyToSection = (idx, patch) => {
    if (idx < 0 || idx >= secList.length) return;
    const nextSecs = secList.map((s, i) => (i === idx ? { ...s, props: { ...(s.props || {}), ...patch } } : s));
    onChange?.(withSections(page, nextSecs));
  };
  const applyToAllSections = (patch) => {
    const nextSecs = secList.map((s) => ({ ...s, props: { ...(s.props || {}), ...patch } }));
    onChange?.(withSections(page, nextSecs));
  };
  const applyToType = (type, patch) => {
    const nextSecs = secList.map((s) => s?.type === type ? ({ ...s, props: { ...(s.props || {}), ...patch } }) : s);
    onChange?.(withSections(page, nextSecs));
  };

  // ---------- Batch knobs (non-hero too) ----------
  const [knobs, setKnobs] = React.useState({
    // page meta
    layout: pageMeta.layout || "boxed",
    sectionSpacing: pageMeta.sectionSpacing ?? 6,
    defaultGutterX: pageMeta.defaultGutterX ?? 16,
    // common per-section props
    gutterX: undefined,
    bleedLeft: undefined,
    bleedRight: undefined,
    maxWidth: undefined, // "xs"|"sm"|"md"|"lg"|"xl"|"full"|false
    // hero common
    heroHeight: undefined,
    safeTop: undefined,
    contentMaxWidth: undefined,
  });

  const commitScope = () => {
    // Build patch objects from current knobs/local
    const pagePatch = {};
    if (local.layout != null) pagePatch.layout = local.layout;
    if (local.sectionSpacing != null) pagePatch.sectionSpacing = local.sectionSpacing;
    if (local.defaultGutterX != null) pagePatch.defaultGutterX = local.defaultGutterX;

    // Section patch
    const sectionPatch = {};
    ["gutterX","bleedLeft","bleedRight","maxWidth","heroHeight","safeTop","contentMaxWidth"].forEach((k) => {
      if (knobs[k] !== undefined && knobs[k] !== null) sectionPatch[k] = knobs[k];
    });

    // Apply based on scope
    if (scope === "page") applyToPage(pagePatch);
    if (scope === "selected") applyToSection(selectedIndex, sectionPatch);
    if (scope === "all") applyToAllSections(sectionPatch);
    if (scope === "type") applyToType(typeFilter, sectionPatch);
  };

  // ---------- Diff / rollback ----------
  const [snapshot, setSnapshot] = React.useState(null);
  const takeSnapshot = () => setSnapshot(clone(page));
  const changes = React.useMemo(() => snapshot ? diffPage(snapshot, page) : [], [snapshot, page]);
  const revertChange = (c) => {
    const m = c.path.match(/^meta\.(.+)$/);
    if (m) return onChange?.(withMeta(page, { [m[1]]: c.before }));
    const s = c.path.match(/^sections\[(\d+)\]\.props\.(.+)$/);
    if (s) {
      const idx = Number(s[1]); const key = s[2];
      const nextSecs = secList.map((blk,i) => i===idx ? ({ ...blk, props: { ...(blk.props||{}), [key]: c.before }}) : blk);
      onChange?.(withSections(page, nextSecs));
    }
  };

  // ---------- Type defaults (global for new/existing blocks) ----------
  const [typeDefaults, setTypeDefaults] = React.useState(() => {
    try { return JSON.parse(localStorage.getItem(TYPE_DEFAULTS_LS_KEY)) || {}; } catch { return {}; }
  });
  const saveTypeDefaults = (type, obj) => {
    const next = { ...typeDefaults, [type]: obj };
    setTypeDefaults(next);
    localStorage.setItem(TYPE_DEFAULTS_LS_KEY, JSON.stringify(next));
  };
  const applyTypeDefaults = (type) => {
    const patch = typeDefaults[type] || {};
    applyToType(type, patch);
  };

  // ---------- Preset save/load ----------
  const [presetName, setPresetName] = React.useState("");
  const [presets, setPresets] = React.useState(() => {
    try { return JSON.parse(localStorage.getItem(PRESETS_LS_KEY)) || []; } catch { return []; }
  });
  const savePreset = () => {
    const item = { id: uid(), name: presetName || `Preset ${presets.length+1}`, data: local };
    const list = [item, ...presets];
    setPresets(list);
    localStorage.setItem(PRESETS_LS_KEY, JSON.stringify(list));
    setPresetName("");
  };
  const loadPreset = (id) => {
    const p = presets.find(x => x.id === id);
    if (!p) return;
    setLocal(p.data); localStorage.setItem(LAB_LS_KEY, JSON.stringify(p.data));
  };

  // ---------- UI ----------
  return (
    <Stack spacing={2}>
      {/* Presets quick bar */}
      <Box>
        <Typography variant="subtitle2" sx={{ mb: 1, opacity: .7 }}>Presets</Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap">
          {PRESETS.map((p) => (
            <Button key={p.name} size="small" variant="outlined" onClick={() => applyPresetToLocal(p)}>
              {p.name}
            </Button>
          ))}
        </Stack>
        <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
          <TextField size="small" label="Save current as…" value={presetName} onChange={(e)=>setPresetName(e.target.value)} />
          <Button size="small" variant="contained" onClick={savePreset} disabled={!presetName}>Save</Button>
          <Select size="small" value="" displayEmpty onChange={(e)=>loadPreset(e.target.value)}>
            <MenuItem value="">Load preset…</MenuItem>
            {presets.map((p)=> <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
          </Select>
        </Stack>
      </Box>

      {/* Page meta (enterprise-grade, not hero-only) */}
      <Divider />
      <Box>
        <Typography variant="subtitle2" sx={{ mb: 1, opacity: .7 }}>Page layout</Typography>
        <ToggleButtonGroup
          exclusive size="small"
          value={local.layout ?? pageMeta.layout ?? "boxed"}
          onChange={(_,v)=> v!=null && setLocal({...local, layout:v})}
        >
          <ToggleButton value="boxed">Boxed</ToggleButton>
          <ToggleButton value="full">Full-bleed</ToggleButton>
        </ToggleButtonGroup>
        <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
          <Box sx={{ width: 200 }}>
            <Typography variant="caption">Section spacing</Typography>
            <Slider value={Number(local.sectionSpacing ?? pageMeta.sectionSpacing ?? 6)}
                    min={0} max={16} step={1}
                    onChange={(_,x)=> setLocal({...local, sectionSpacing:Number(x)})}/>
          </Box>
          <Box sx={{ width: 220 }}>
            <Typography variant="caption">Default gutter (px)</Typography>
            <Slider value={Number(local.defaultGutterX ?? pageMeta.defaultGutterX ?? 16)}
                    min={0} max={48} step={2}
                    onChange={(_,x)=> setLocal({...local, defaultGutterX:Number(x)})}/>
          </Box>
        </Stack>
        <Typography variant="caption" color="text.secondary">
          Applies to the page frame and is inherited by sections unless overridden. {/* render logic supports this */}
        </Typography>
      </Box>

      {/* Common section knobs (work for any block type) */}
      <Divider />
      <Box>
        <Typography variant="subtitle2" sx={{ mb: 1, opacity: .7 }}>Common section settings</Typography>
        <Stack direction="row" spacing={2} flexWrap="wrap">
          <Select size="small" value={knobs.maxWidth ?? ""} displayEmpty
                  onChange={(e)=>setKnobs({...knobs, maxWidth: e.target.value || undefined})}>
            <MenuItem value=""><em>Inherit page</em></MenuItem>
            {["xs","sm","md","lg","xl","full"].map(x => <MenuItem key={x} value={x}>{x}</MenuItem>)}
          </Select>
          <TextField size="small" label="gutterX (px)" type="number"
                     value={knobs.gutterX ?? ""} onChange={(e)=>setKnobs({...knobs, gutterX:Number(e.target.value)})}/>
          <FormControlLabel control={<Switch checked={!!knobs.bleedLeft} onChange={(_,v)=>setKnobs({...knobs, bleedLeft:v})}/>} label="Bleed left" />
          <FormControlLabel control={<Switch checked={!!knobs.bleedRight} onChange={(_,v)=>setKnobs({...knobs, bleedRight:v})}/>} label="Bleed right" />
        </Stack>
        <Typography variant="caption" color="text.secondary">These apply to any section (not just Hero).</Typography>
      </Box>

      {/* Hero extras (optional) */}
      <Box>
        <Typography variant="subtitle2" sx={{ mb: .5, opacity: .7 }}>Hero extras</Typography>
        <Stack direction="row" spacing={2} flexWrap="wrap">
          <TextField size="small" label="heroHeight (vh)" type="number"
                     value={knobs.heroHeight ?? ""} onChange={(e)=>setKnobs({...knobs, heroHeight:Number(e.target.value)})}/>
          <FormControlLabel control={<Switch checked={!!knobs.safeTop} onChange={(_,v)=>setKnobs({...knobs, safeTop:v})}/>} label="Safe top" />
          <Select size="small" value={knobs.contentMaxWidth ?? ""} displayEmpty
                  onChange={(e)=>setKnobs({...knobs, contentMaxWidth: e.target.value || undefined})}>
            <MenuItem value=""><em>Inherit</em></MenuItem>
            {["sm","md","lg","xl","full",false].map(x => <MenuItem key={String(x)} value={x}>{String(x)}</MenuItem>)}
          </Select>
        </Stack>
      </Box>

      {/* Scope + Apply */}
      <Divider />
      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
        <Typography variant="subtitle2" sx={{ opacity: .7 }}>Apply to</Typography>
        <ToggleButtonGroup exclusive size="small" value={scope} onChange={(_,v)=>v && setScope(v)}>
          {SCOPE_OPTIONS.map(s => <ToggleButton key={s.key} value={s.key}>{s.label}</ToggleButton>)}
        </ToggleButtonGroup>
        {scope === "selected" && <Chip size="small" label={selectedIndex >= 0 ? `#${selectedIndex+1}` : "None selected"} />}
        {scope === "type" && (
          <Select size="small" value={typeFilter} onChange={(e)=>setTypeFilter(e.target.value)} sx={{ ml: 1 }}>
            {Array.from(new Set(sectionsOf(page).map(s=>s.type))).map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
          </Select>
        )}
        <Button variant="contained" size="small" onClick={commitScope}>Apply</Button>
        <Tooltip title="Saves these knobs to localStorage; your Builder’s Import will pick them up">
          <Button size="small" onClick={() => localStorage.setItem(LAB_LS_KEY, JSON.stringify(local))}>Save to Lab</Button>
        </Tooltip>
      </Stack>

      {/* Type defaults (enterprise: set once, apply everywhere) */}
      <Box>
        <Typography variant="subtitle2" sx={{ mb: .5, opacity: .7 }}>Block-type defaults</Typography>
        <Stack direction="row" spacing={1} alignItems="center">
          <Select size="small" value={typeFilter} onChange={(e)=>setTypeFilter(e.target.value)}>
            {Array.from(new Set(sectionsOf(page).map(s=>s.type))).map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
          </Select>
          <Button size="small" variant="outlined" onClick={()=>saveTypeDefaults(typeFilter, knobs)}>Save defaults</Button>
          <Button size="small" onClick={()=>applyTypeDefaults(typeFilter)}>Apply to all of type</Button>
        </Stack>
        <Typography variant="caption" color="text.secondary">Example: set `maxWidth="lg"`, `gutterX=24` for all galleries.</Typography>
      </Box>

      {/* Visual overlays for the preview */}
      <Divider />
      <Box>
        <Typography variant="subtitle2" sx={{ mb: .5, opacity: .7 }}>Preview overlays</Typography>
        <Stack direction="row" spacing={2} flexWrap="wrap">
          <FormControlLabel control={<Switch checked={!!overlays.showGrid} onChange={(_,v)=>setOverlays({...overlays, showGrid:v})}/>} label="Baseline grid" />
          <FormControlLabel control={<Switch checked={!!overlays.showGutters} onChange={(_,v)=>setOverlays({...overlays, showGutters:v})}/>} label="Show gutters" />
          <FormControlLabel control={<Switch checked={!!overlays.showBleeds} onChange={(_,v)=>setOverlays({...overlays, showBleeds:v})}/>} label="Show bleeds" />
          <TextField size="small" type="number" label="Gutter px" value={overlays.containerPx} onChange={(e)=>setOverlays({...overlays, containerPx:Number(e.target.value)})}/>
        </Stack>
      </Box>

      {/* Mini theme synergy */}
      <Divider />
      <Box>
        <Typography variant="subtitle2" sx={{ mb: .5, opacity: .7 }}>Theme (preview only)</Typography>
        <Stack direction="row" spacing={2} flexWrap="wrap">
          <TextField
            size="small"
            label="Primary color"
            type="color"
            value={theme?.palette?.primary?.main ?? "#1976d2"}
            onChange={(e)=>setTheme({
              ...theme,
              palette:{ ...(theme.palette||{}), primary:{ main:e.target.value || undefined } }
            })}
          />
          <TextField
            size="small"
            label="Secondary color"
            type="color"
            value={theme?.palette?.secondary?.main ?? "#9c27b0"}
            onChange={(e)=>setTheme({
              ...theme,
              palette:{ ...(theme.palette||{}), secondary:{ main:e.target.value || undefined } }
            })}
          />
          <Box sx={{ width: 220 }}>
            <Typography variant="caption">Radius</Typography>
            <Slider min={0} max={24} step={1}
                    value={Number(theme?.shape?.borderRadius ?? 10)}
                    onChange={(_,x)=>setTheme({...theme, shape:{ borderRadius:Number(x) }})}/>
          </Box>
        </Stack>
        <Typography variant="caption" color="text.secondary">
          Pass these overrides to &lt;ThemeRuntimeProvider /&gt; in your preview. CSS vars update too. 
        </Typography>
      </Box>

      {/* Snapshot / diff / rollback */}
      <Divider />
      <Stack direction="row" spacing={1} alignItems="center">
        <Button size="small" variant="outlined" onClick={takeSnapshot}>Take snapshot</Button>
        <Typography variant="body2" sx={{ opacity: .7 }}>
          {snapshot ? "Snapshot ready — make changes, then revert any item below." : "Take a snapshot before experimenting."}
        </Typography>
      </Stack>
      {!!changes.length && (
        <Stack spacing={1} sx={{ border: t=>`1px solid ${t.palette.divider}`, p:1.5, borderRadius: 1 }}>
          {changes.map((c, i) => (
            <Stack key={i} direction="row" spacing={1} alignItems="center">
              <Chip size="small" label={c.path} />
              <Typography variant="caption" color="text.secondary">→</Typography>
              <Typography variant="caption">{JSON.stringify(c.after)}</Typography>
              <Button size="small" onClick={()=>revertChange(c)}>Revert</Button>
            </Stack>
          ))}
        </Stack>
      )}
    </Stack>
  );
}
