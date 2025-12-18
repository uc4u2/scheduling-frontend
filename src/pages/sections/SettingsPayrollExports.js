import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  ListSubheader,
  MenuItem,
  Select,
  Snackbar,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";

import SectionCard from "../../components/ui/SectionCard";
import api from "../../utils/api";

const DEFAULT_DELIMITERS = [
  { label: "Comma (,)", value: "," },
  { label: "Tab (\\t)", value: "\t" },
  { label: "Semicolon (;)", value: ";" },
  { label: "Pipe (|)", value: "|" },
];

const emptyColumn = () => ({
  header: "",
  source: "",
  default: "",
  required: false,
});

const SettingsPayrollExports = () => {
  const [profiles, setProfiles] = useState([]);
  const [sources, setSources] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null);

  const [editOpen, setEditOpen] = useState(false);
  const [draft, setDraft] = useState({
    id: null,
    name: "",
    delimiter: ",",
    include_header: true,
    column_map_json: [emptyColumn()],
  });

  const selectedProfile = useMemo(
    () => profiles.find((p) => String(p.id) === String(selectedId)) || null,
    [profiles, selectedId]
  );

  const sourceGroups = useMemo(() => {
    const groups = new Map();
    for (const s of sources) {
      const group = s.group || "Other";
      if (!groups.has(group)) groups.set(group, []);
      groups.get(group).push(s);
    }
    return Array.from(groups.entries()).map(([group, items]) => ({
      group,
      items: items.slice().sort((a, b) => String(a.label).localeCompare(String(b.label))),
    }));
  }, [sources]);

  const loadAll = async () => {
    setBusy(true);
    try {
      const [pRes, sRes] = await Promise.all([
        api.get("/automation/payroll/provider-export/profiles"),
        api.get("/automation/payroll/provider-export/sources"),
      ]);
      const list = pRes?.data?.profiles || [];
      setProfiles(list);
      setSources(sRes?.data?.sources || []);
      if (!selectedId && list.length) setSelectedId(String(list[0].id));
    } catch (err) {
      console.error("Failed to load export profiles/sources", err);
      setToast({ severity: "error", message: err?.displayMessage || "Failed to load payroll export profiles." });
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openNew = () => {
    setDraft({
      id: null,
      name: "",
      delimiter: ",",
      include_header: true,
      column_map_json: [emptyColumn()],
    });
    setEditOpen(true);
  };

  const openEdit = () => {
    if (!selectedProfile) return;
    setDraft({
      id: selectedProfile.id,
      name: selectedProfile.name || "",
      delimiter: selectedProfile.delimiter || ",",
      include_header: !!selectedProfile.include_header,
      column_map_json:
        Array.isArray(selectedProfile.column_map_json) && selectedProfile.column_map_json.length
          ? selectedProfile.column_map_json.map((c) => ({
              header: c?.header ?? "",
              source: c?.source ?? "",
              default: c?.default ?? "",
              required: !!c?.required,
            }))
          : [emptyColumn()],
    });
    setEditOpen(true);
  };

  const saveDraft = async () => {
    const name = (draft.name || "").trim();
    if (!name) {
      setToast({ severity: "error", message: "Profile name is required." });
      return;
    }
    if (!Array.isArray(draft.column_map_json) || !draft.column_map_json.length) {
      setToast({ severity: "error", message: "Add at least one column." });
      return;
    }
    for (const col of draft.column_map_json) {
      if (!(col?.header || "").trim()) {
        setToast({ severity: "error", message: "Every column must have a header." });
        return;
      }
      if (!(col?.source || "").trim()) {
        setToast({ severity: "error", message: "Every column must choose a source field." });
        return;
      }
    }

    setBusy(true);
    try {
      const payload = {
        name,
        delimiter: draft.delimiter || ",",
        include_header: !!draft.include_header,
        column_map_json: draft.column_map_json.map((c) => ({
          header: (c?.header || "").trim(),
          source: (c?.source || "").trim(),
          default: c?.default ?? "",
          required: !!c?.required,
        })),
      };
      let res;
      if (draft.id) {
        res = await api.put(`/automation/payroll/provider-export/profiles/${draft.id}`, payload);
      } else {
        res = await api.post("/automation/payroll/provider-export/profiles", payload);
      }
      const saved = res?.data?.profile;
      await loadAll();
      setSelectedId(saved ? String(saved.id) : selectedId);
      setEditOpen(false);
      setToast({ severity: "success", message: "Export profile saved." });
    } catch (err) {
      console.error("Save export profile failed", err);
      setToast({ severity: "error", message: err?.response?.data?.error || err?.displayMessage || "Save failed." });
    } finally {
      setBusy(false);
    }
  };

  const deleteSelected = async () => {
    if (!selectedProfile) return;
    const ok = window.confirm(`Delete export profile "${selectedProfile.name}"?`);
    if (!ok) return;
    setBusy(true);
    try {
      await api.delete(`/automation/payroll/provider-export/profiles/${selectedProfile.id}`);
      setToast({ severity: "success", message: "Export profile deleted." });
      const remaining = profiles.filter((p) => p.id !== selectedProfile.id);
      setProfiles(remaining);
      setSelectedId(remaining.length ? String(remaining[0].id) : "");
    } catch (err) {
      console.error("Delete export profile failed", err);
      setToast({ severity: "error", message: err?.displayMessage || "Delete failed." });
    } finally {
      setBusy(false);
    }
  };

  const copyDownloadTemplate = async () => {
    if (!selectedProfile) return;
    const text =
      "Use this export profile in Payroll → Export payroll CSV (provider import). " +
      "Make sure each employee has an external payroll employee ID if your provider requires it.";
    try {
      await navigator.clipboard.writeText(text);
      setToast({ severity: "success", message: "Copied." });
    } catch {
      setToast({ severity: "info", message: "Copy failed (browser permissions)." });
    }
  };

  const updateCol = (idx, patch) => {
    setDraft((d) => {
      const next = d.column_map_json.slice();
      next[idx] = { ...next[idx], ...patch };
      return { ...d, column_map_json: next };
    });
  };

  const moveCol = (idx, direction) => {
    setDraft((d) => {
      const next = d.column_map_json.slice();
      const j = idx + direction;
      if (j < 0 || j >= next.length) return d;
      const tmp = next[idx];
      next[idx] = next[j];
      next[j] = tmp;
      return { ...d, column_map_json: next };
    });
  };

  const removeCol = (idx) => {
    setDraft((d) => {
      const next = d.column_map_json.slice();
      next.splice(idx, 1);
      return { ...d, column_map_json: next.length ? next : [emptyColumn()] };
    });
  };

  const addCol = () => {
    setDraft((d) => ({ ...d, column_map_json: [...(d.column_map_json || []), emptyColumn()] }));
  };

  return (
    <>
      <SectionCard title="Payroll exports (provider CSV)" subtitle="Create export profiles for payroll provider imports (Finalized payroll only).">
        <Stack spacing={2}>
          <Alert severity="info">
            Use these profiles to generate a provider-ready CSV from finalized payroll. If a required field is missing (for example, external employee ID), export will stop and show the missing employees.
          </Alert>

          <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ xs: "stretch", md: "center" }}>
            <Box sx={{ flex: 1, minWidth: 260 }}>
              <Typography variant="caption" sx={{ display: "block", mb: 0.5 }}>
                Export profile
              </Typography>
              <Select
                fullWidth
                size="small"
                value={selectedId}
                displayEmpty
                onChange={(e) => setSelectedId(e.target.value)}
              >
                <MenuItem value="">
                  <em>{profiles.length ? "Select…" : "No profiles yet"}</em>
                </MenuItem>
                {profiles.map((p) => (
                  <MenuItem key={p.id} value={String(p.id)}>
                    {p.name}
                  </MenuItem>
                ))}
              </Select>
            </Box>

            <Stack direction="row" spacing={1}>
              <Button startIcon={<AddIcon />} variant="contained" onClick={openNew} disabled={busy}>
                New
              </Button>
              <Button variant="outlined" onClick={openEdit} disabled={busy || !selectedProfile}>
                Edit
              </Button>
              <IconButton onClick={deleteSelected} disabled={busy || !selectedProfile} aria-label="Delete profile">
                <DeleteIcon />
              </IconButton>
              <IconButton onClick={copyDownloadTemplate} disabled={!selectedProfile} aria-label="Copy help">
                <ContentCopyIcon />
              </IconButton>
            </Stack>
          </Stack>
        </Stack>
      </SectionCard>

      <Dialog open={editOpen} onClose={() => setEditOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>{draft.id ? "Edit export profile" : "New export profile"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Profile name"
              value={draft.name}
              onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
              fullWidth
            />
            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="caption" sx={{ display: "block", mb: 0.5 }}>
                  Delimiter
                </Typography>
                <Select
                  fullWidth
                  size="small"
                  value={draft.delimiter}
                  onChange={(e) => setDraft((d) => ({ ...d, delimiter: e.target.value }))}
                >
                  {DEFAULT_DELIMITERS.map((d) => (
                    <MenuItem key={d.value} value={d.value}>
                      {d.label}
                    </MenuItem>
                  ))}
                </Select>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={!!draft.include_header}
                      onChange={(e) => setDraft((d) => ({ ...d, include_header: e.target.checked }))}
                    />
                  }
                  label="Include header row"
                />
              </Box>
            </Stack>

            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Columns
              </Typography>
              <Stack spacing={1.25}>
                {draft.column_map_json.map((c, idx) => (
                  <Box
                    key={idx}
                    sx={{
                      p: 1.25,
                      border: "1px solid",
                      borderColor: "divider",
                      borderRadius: 1,
                    }}
                  >
                    <Stack spacing={1} direction={{ xs: "column", md: "row" }} alignItems={{ md: "center" }}>
                      <TextField
                        label="Header"
                        size="small"
                        value={c.header}
                        onChange={(e) => updateCol(idx, { header: e.target.value })}
                        sx={{ flex: 1, minWidth: 180 }}
                      />
                      <Box sx={{ flex: 1, minWidth: 260 }}>
                        <Typography variant="caption" sx={{ display: "block", mb: 0.5 }}>
                          Source field
                        </Typography>
                        <Select
                          fullWidth
                          size="small"
                          value={c.source}
                          onChange={(e) => updateCol(idx, { source: e.target.value })}
                        >
                          <MenuItem value="">
                            <em>Select…</em>
                          </MenuItem>
                          {sourceGroups.flatMap((g) => [
                            <ListSubheader key={`h-${g.group}`}>{g.group}</ListSubheader>,
                            ...g.items.map((s) => (
                              <MenuItem key={s.key} value={s.key}>
                                {s.label}
                              </MenuItem>
                            )),
                          ])}
                        </Select>
                      </Box>
                      <TextField
                        label="Default"
                        size="small"
                        value={c.default ?? ""}
                        onChange={(e) => updateCol(idx, { default: e.target.value })}
                        sx={{ flex: 1, minWidth: 180 }}
                      />
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={!!c.required}
                            onChange={(e) => updateCol(idx, { required: e.target.checked })}
                          />
                        }
                        label="Required"
                      />
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <IconButton size="small" onClick={() => moveCol(idx, -1)} disabled={idx === 0}>
                          <ArrowUpwardIcon fontSize="inherit" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => moveCol(idx, +1)}
                          disabled={idx === draft.column_map_json.length - 1}
                        >
                          <ArrowDownwardIcon fontSize="inherit" />
                        </IconButton>
                        <IconButton size="small" onClick={() => removeCol(idx)} aria-label="Remove column">
                          <DeleteIcon fontSize="inherit" />
                        </IconButton>
                      </Stack>
                    </Stack>
                  </Box>
                ))}
                <Button startIcon={<AddIcon />} onClick={addCol} variant="outlined">
                  Add column
                </Button>
              </Stack>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>Cancel</Button>
          <Button onClick={saveDraft} variant="contained" disabled={busy}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!toast} autoHideDuration={3500} onClose={() => setToast(null)}>
        <Alert onClose={() => setToast(null)} severity={toast?.severity || "info"} sx={{ width: "100%" }}>
          {toast?.message || ""}
        </Alert>
      </Snackbar>
    </>
  );
};

export default SettingsPayrollExports;

