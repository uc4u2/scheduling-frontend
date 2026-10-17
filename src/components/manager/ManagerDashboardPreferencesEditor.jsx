import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  FormControlLabel,
  Grid,
  IconButton,
  Paper,
  Stack,
  Switch,
  Typography,
} from "@mui/material";
import ArrowDownwardOutlinedIcon from "@mui/icons-material/ArrowDownwardOutlined";
import ArrowUpwardOutlinedIcon from "@mui/icons-material/ArrowUpwardOutlined";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import RestartAltOutlinedIcon from "@mui/icons-material/RestartAltOutlined";
import ManagerDashboardActionIcon from "./ManagerDashboardActionIcon";
import {
  MANAGER_DASHBOARD_ACTION_BY_ID,
  MANAGER_DASHBOARD_PRESETS,
  WORKFORCE_DASHBOARD_ACTION_IDS,
  availableManagerDashboardActions,
} from "./managerDashboardActions";

const orderedIntersection = (actionIds, availableIds, maxActions) => {
  const available = new Set(availableIds);
  return actionIds.filter((id, index) => available.has(id) && actionIds.indexOf(id) === index).slice(0, maxActions);
};

const EditorSection = ({ children, ...props }) => (
  <Paper
    variant="outlined"
    {...props}
    sx={(theme) => ({
      p: { xs: 1.5, sm: 2 },
      borderRadius: 1,
      borderColor: theme.palette.divider,
      backgroundColor: theme.palette.background.paper,
      boxShadow: `inset 3px 0 0 ${theme.palette.primary.light}`,
      ...(typeof props.sx === "object" ? props.sx : {}),
    })}
  >
    {children}
  </Paper>
);

export default function ManagerDashboardPreferencesEditor({
  preferences,
  loading = false,
  saving = false,
  error = "",
  onSave,
}) {
  const maxActions = Number(preferences?.max_actions || 10);
  const availableIds = useMemo(
    () => preferences?.available_action_ids || [],
    [preferences?.available_action_ids]
  );
  const availableActions = useMemo(
    () => availableManagerDashboardActions(availableIds),
    [availableIds]
  );
  const [actionIds, setActionIds] = useState([]);
  const [showWorkforceCards, setShowWorkforceCards] = useState(false);
  const [presetKey, setPresetKey] = useState("custom");
  const [localError, setLocalError] = useState("");

  useEffect(() => {
    setActionIds(orderedIntersection(preferences?.action_ids || [], availableIds, maxActions));
    setShowWorkforceCards(Boolean(preferences?.show_workforce_cards));
    setPresetKey(preferences?.preset_key || "custom");
    setLocalError("");
  }, [availableIds, maxActions, preferences?.action_ids, preferences?.preset_key, preferences?.show_workforce_cards, preferences?.version]);

  const selected = new Set(actionIds);
  const workforceAvailable = availableIds.some((id) => WORKFORCE_DASHBOARD_ACTION_IDS.has(id));

  const toggleAction = (actionId) => {
    setPresetKey("custom");
    setLocalError("");
    setActionIds((current) => {
      if (current.includes(actionId)) return current.filter((id) => id !== actionId);
      if (current.length >= maxActions) {
        setLocalError(`Choose no more than ${maxActions} quick actions.`);
        return current;
      }
      return [...current, actionId];
    });
  };

  const move = (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= actionIds.length) return;
    setPresetKey("custom");
    setActionIds((current) => {
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const applyPreset = (preset) => {
    const next = orderedIntersection(preset.actionIds, availableIds, maxActions);
    if (!next.length) {
      setLocalError("This preset has no actions available for your current permissions.");
      return;
    }
    setActionIds(next);
    setPresetKey(preset.id);
    setLocalError("");
  };

  const restoreDefault = () => {
    setActionIds(orderedIntersection(preferences?.default_action_ids || [], availableIds, maxActions));
    setShowWorkforceCards(workforceAvailable);
    setPresetKey("balanced");
    setLocalError("");
  };

  const submit = async () => {
    if (!actionIds.length) {
      setLocalError("Choose at least one quick action.");
      return;
    }
    try {
      await onSave?.({
        action_ids: actionIds,
        show_workforce_cards: showWorkforceCards,
        preset_key: presetKey,
      });
    } catch {
      // The shared hook exposes a scoped, manager-safe message.
    }
  };

  if (loading) {
    return <Typography color="text.secondary">Loading your dashboard layout…</Typography>;
  }

  return (
    <Stack spacing={1.5}>
      {(error || localError) && <Alert severity="warning">{localError || error}</Alert>}

      <EditorSection component="section" aria-labelledby="dashboard-presets-heading">
        <Typography id="dashboard-presets-heading" variant="subtitle1" fontWeight={800}>Start with a workspace preset</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Presets only arrange shortcuts. They never change permissions.
        </Typography>
        <Grid container spacing={1.25} sx={{ mt: 0.5 }}>
          {MANAGER_DASHBOARD_PRESETS.map((preset) => {
            const supportedCount = orderedIntersection(preset.actionIds, availableIds, maxActions).length;
            if (!supportedCount) return null;
            const active = presetKey === preset.id;
            return (
              <Grid item xs={12} sm={6} lg={3} key={preset.id}>
                <Paper
                  component="button"
                  type="button"
                  variant="outlined"
                  onClick={() => applyPreset(preset)}
                  aria-pressed={active}
                  sx={(theme) => ({
                    width: "100%",
                    minHeight: 84,
                    p: 1.25,
                    textAlign: "left",
                    cursor: "pointer",
                    borderRadius: 1,
                    borderColor: active ? theme.palette.primary.main : theme.palette.divider,
                    backgroundColor: active
                      ? theme.palette.action.selected
                      : theme.palette.background.paper,
                    color: theme.palette.text.primary,
                  })}
                >
                  <Typography fontWeight={800}>{preset.label}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.35 }}>
                    {preset.description}
                  </Typography>
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      </EditorSection>

      <EditorSection component="section" aria-labelledby="dashboard-actions-heading">
        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" gap={1}>
          <Box>
            <Typography id="dashboard-actions-heading" variant="subtitle1" fontWeight={800}>Your quick actions</Typography>
            <Typography variant="body2" color="text.secondary">
              Choose and order up to {maxActions}. Only actions allowed for your account are available.
            </Typography>
          </Box>
          <Chip
            label={`${actionIds.length} of ${maxActions} selected`}
            size="small"
            sx={(theme) => ({
              alignSelf: { xs: "flex-start", sm: "center" },
              borderRadius: 1,
              color: theme.palette.info.dark,
              backgroundColor: theme.palette.info.light,
              border: `1px solid ${theme.palette.info.main}`,
              fontWeight: 700,
            })}
          />
        </Stack>

        <Grid container spacing={0.75} sx={{ mt: 0.75 }}>
          {actionIds.map((actionId, index) => {
            const action = MANAGER_DASHBOARD_ACTION_BY_ID[actionId];
            if (!action) return null;
            return (
              <Grid item xs={12} md={6} key={actionId}>
                <Paper variant="outlined" sx={{ p: 1, borderRadius: 1, height: "100%" }}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Box sx={{ color: "primary.main", display: "grid", placeItems: "center" }}>
                      <ManagerDashboardActionIcon icon={action.icon} fontSize="small" />
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography fontWeight={750}>{action.label}</Typography>
                      <Typography variant="caption" color="text.secondary">{action.section}</Typography>
                    </Box>
                    <IconButton size="small" aria-label={`Move ${action.label} up`} onClick={() => move(index, -1)} disabled={index === 0}>
                      <ArrowUpwardOutlinedIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" aria-label={`Move ${action.label} down`} onClick={() => move(index, 1)} disabled={index === actionIds.length - 1}>
                      <ArrowDownwardOutlinedIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" aria-label={`Remove ${action.label}`} onClick={() => toggleAction(actionId)}>
                      <CloseOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      </EditorSection>

      <EditorSection component="section" aria-labelledby="dashboard-tools-heading">
        <Typography id="dashboard-tools-heading" variant="subtitle1" fontWeight={800}>Available tools</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25, mb: 1 }}>
          Select tools to add them to your ordered quick actions above.
        </Typography>
        <Grid container spacing={0.75}>
          {availableActions.map((action) => (
            <Grid item xs={12} sm={6} lg={4} key={action.id}>
              <FormControlLabel
                sx={{
                  width: "100%",
                  m: 0,
                  px: 1,
                  py: 0.5,
                  minHeight: 44,
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 1,
                  alignItems: "center",
                }}
                control={<Checkbox checked={selected.has(action.id)} onChange={() => toggleAction(action.id)} />}
                label={
                  <Stack direction="row" spacing={0.75} alignItems="center">
                    <Typography variant="body2" fontWeight={700}>{action.label}</Typography>
                    {action.addon && (
                      <Chip
                        label="Add-on"
                        size="small"
                        sx={(theme) => ({
                          height: 22,
                          borderRadius: 1,
                          color: theme.palette.warning.dark,
                          backgroundColor: theme.palette.warning.light,
                          border: `1px solid ${theme.palette.warning.main}`,
                          fontWeight: 700,
                        })}
                      />
                    )}
                  </Stack>
                }
              />
            </Grid>
          ))}
        </Grid>
      </EditorSection>

      {workforceAvailable && (
        <EditorSection component="section" aria-labelledby="dashboard-workforce-heading">
          <FormControlLabel
            sx={{ m: 0, alignItems: "center" }}
            control={
              <Switch
                checked={showWorkforceCards}
                onChange={(event) => {
                  setShowWorkforceCards(event.target.checked);
                  setPresetKey("custom");
                }}
              />
            }
            label={
              <Box>
                <Typography id="dashboard-workforce-heading" fontWeight={750}>Show workforce shortcuts</Typography>
                <Typography variant="body2" color="text.secondary">
                  Shows Shift Management, Time Tracking, Leaves, and Swap Approvals when your permissions allow them.
                </Typography>
              </Box>
            }
          />
        </EditorSection>
      )}

      <Stack
        direction={{ xs: "column-reverse", sm: "row" }}
        justifyContent="space-between"
        gap={1}
        sx={{ pt: 0.5 }}
      >
        <Button startIcon={<RestartAltOutlinedIcon />} onClick={restoreDefault} disabled={saving}>
          Restore recommended layout
        </Button>
        <Button variant="contained" onClick={submit} disabled={saving || !actionIds.length}>
          {saving ? "Saving…" : "Save mobile dashboard"}
        </Button>
      </Stack>
    </Stack>
  );
}
