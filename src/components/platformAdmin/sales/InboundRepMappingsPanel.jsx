import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Chip,
  FormControlLabel,
  MenuItem,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";

function emptyCreateState(departments) {
  const next = {};
  (departments || []).forEach((department) => {
    next[department.department_key] = {
      sales_rep_id: "",
      priority: 0,
      is_primary: false,
      is_active: true,
    };
  });
  return next;
}

export default function InboundRepMappingsPanel({ departments, mappings, reps, onCreate, onUpdate, onDisable, savingKey }) {
  const [createState, setCreateState] = useState({});
  const [drafts, setDrafts] = useState({});

  useEffect(() => {
    setCreateState(emptyCreateState(departments));
  }, [departments]);

  useEffect(() => {
    const next = {};
    (mappings || []).forEach((row) => {
      next[row.id] = {
        priority: row.priority ?? 0,
        is_primary: Boolean(row.is_primary),
        is_active: Boolean(row.is_active),
      };
    });
    setDrafts(next);
  }, [mappings]);

  const grouped = useMemo(() => {
    const map = {};
    (departments || []).forEach((department) => {
      map[department.department_key] = [];
    });
    (mappings || []).forEach((row) => {
      if (!map[row.department_key]) map[row.department_key] = [];
      map[row.department_key].push(row);
    });
    Object.keys(map).forEach((key) => {
      map[key] = map[key].sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0));
    });
    return map;
  }, [departments, mappings]);

  return (
    <Paper sx={{ p: 2.5 }}>
      <Stack spacing={2}>
        <Stack spacing={0.5}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>Rep Assignments</Typography>
          <Typography variant="body2" color="text.secondary">
            Assign reps to inbound departments, control routing order, and mark primary coverage directly from the admin UI.
          </Typography>
        </Stack>

        {(departments || []).map((department) => {
          const rows = grouped[department.department_key] || [];
          const createDraft = createState[department.department_key] || { sales_rep_id: "", priority: 0, is_primary: false, is_active: true };
          return (
            <Paper key={department.department_key} variant="outlined" sx={{ p: 2 }}>
              <Stack spacing={1.5}>
                <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={1}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    {department.label || department.department_key}
                  </Typography>
                  <Chip size="small" variant="outlined" label={`${rows.length} mapping${rows.length === 1 ? "" : "s"}`} />
                </Stack>

                {!rows.length ? (
                  <Alert severity="info" variant="outlined">No reps are currently assigned to this inbound department.</Alert>
                ) : (
                  <Stack spacing={1}>
                    {rows.map((row) => {
                      const draft = drafts[row.id] || { priority: row.priority ?? 0, is_primary: row.is_primary, is_active: row.is_active };
                      return (
                        <Stack
                          key={row.id}
                          direction={{ xs: "column", lg: "row" }}
                          spacing={1.5}
                          justifyContent="space-between"
                          sx={{ p: 1.25, border: "1px solid", borderColor: "divider", borderRadius: 1.5 }}
                        >
                          <Stack spacing={0.25}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {row.sales_rep_name || `Rep #${row.sales_rep_id}`}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Rep #{row.sales_rep_id}
                            </Typography>
                          </Stack>
                          <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} alignItems={{ xs: "stretch", md: "center" }}>
                            <TextField
                              size="small"
                              type="number"
                              label="Priority"
                              value={draft.priority}
                              onChange={(e) => setDrafts((prev) => ({ ...prev, [row.id]: { ...prev[row.id], priority: e.target.value } }))}
                              sx={{ minWidth: 110 }}
                            />
                            <FormControlLabel
                              control={<Switch checked={Boolean(draft.is_primary)} onChange={(e) => setDrafts((prev) => ({ ...prev, [row.id]: { ...prev[row.id], is_primary: e.target.checked } }))} />}
                              label="Primary"
                            />
                            <FormControlLabel
                              control={<Switch checked={Boolean(draft.is_active)} onChange={(e) => setDrafts((prev) => ({ ...prev, [row.id]: { ...prev[row.id], is_active: e.target.checked } }))} />}
                              label="Active"
                            />
                            <Button
                              variant="outlined"
                              onClick={() => onUpdate?.(row.id, {
                                priority: Number(draft.priority || 0),
                                is_primary: Boolean(draft.is_primary),
                                is_active: Boolean(draft.is_active),
                              })}
                              disabled={savingKey === `mapping-${row.id}`}
                            >
                              {savingKey === `mapping-${row.id}` ? "Saving…" : "Save"}
                            </Button>
                            <Button
                              variant="text"
                              color="warning"
                              onClick={() => onDisable?.(row.id)}
                              disabled={savingKey === `mapping-${row.id}`}
                            >
                              Disable
                            </Button>
                          </Stack>
                        </Stack>
                      );
                    })}
                  </Stack>
                )}

                <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} alignItems={{ xs: "stretch", md: "center" }}>
                  <TextField
                    size="small"
                    select
                    label="Rep"
                    value={createDraft.sales_rep_id}
                    onChange={(e) => setCreateState((prev) => ({
                      ...prev,
                      [department.department_key]: { ...prev[department.department_key], sales_rep_id: e.target.value },
                    }))}
                    sx={{ minWidth: 220 }}
                  >
                    <MenuItem value="">Select rep</MenuItem>
                    {(reps || []).map((rep) => (
                      <MenuItem key={rep.id} value={String(rep.id)}>{rep.full_name}</MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    size="small"
                    type="number"
                    label="Priority"
                    value={createDraft.priority}
                    onChange={(e) => setCreateState((prev) => ({
                      ...prev,
                      [department.department_key]: { ...prev[department.department_key], priority: e.target.value },
                    }))}
                    sx={{ minWidth: 110 }}
                  />
                  <FormControlLabel
                    control={<Switch checked={Boolean(createDraft.is_primary)} onChange={(e) => setCreateState((prev) => ({
                      ...prev,
                      [department.department_key]: { ...prev[department.department_key], is_primary: e.target.checked },
                    }))} />}
                    label="Primary"
                  />
                  <FormControlLabel
                    control={<Switch checked={Boolean(createDraft.is_active)} onChange={(e) => setCreateState((prev) => ({
                      ...prev,
                      [department.department_key]: { ...prev[department.department_key], is_active: e.target.checked },
                    }))} />}
                    label="Active"
                  />
                  <Button
                    variant="contained"
                    onClick={async () => {
                      const created = await onCreate?.({
                        sales_rep_id: Number(createDraft.sales_rep_id),
                        department_key: department.department_key,
                        priority: Number(createDraft.priority || 0),
                        is_primary: Boolean(createDraft.is_primary),
                        is_active: Boolean(createDraft.is_active),
                      });
                      if (!created) return;
                      setCreateState((prev) => ({
                        ...prev,
                        [department.department_key]: { sales_rep_id: "", priority: 0, is_primary: false, is_active: true },
                      }));
                    }}
                    disabled={!createDraft.sales_rep_id || savingKey === `new-${department.department_key}`}
                  >
                    {savingKey === `new-${department.department_key}` ? "Adding…" : "Add mapping"}
                  </Button>
                </Stack>
              </Stack>
            </Paper>
          );
        })}
      </Stack>
    </Paper>
  );
}
