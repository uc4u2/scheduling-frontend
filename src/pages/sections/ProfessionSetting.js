import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  Stack,
  Typography,
} from "@mui/material";

import { PROFESSION_OPTIONS } from "../../constants/professions";
import { settingsApi } from "../../utils/api";

const ProfessionSettings = ({ variant = "standalone" } = {}) => {
  const [profession, setProfession] = useState("");
  const [effectiveProfession, setEffectiveProfession] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isManager, setIsManager] = useState(false);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      try {
        const data = await settingsApi.get();
        if (!active) return;
        setProfession(data?.default_profession ?? "");
        const resolved =
          data?.effective_profession ?? data?.default_profession ?? data?.profession ?? "";
        setEffectiveProfession(resolved);
        setIsManager(Boolean(data?.is_manager));
        setError("");
      } catch (err) {
        if (!active) return;
        const msg =
          err?.displayMessage || err?.response?.data?.error || "Unable to load profession settings.";
        setError(msg);
      } finally {
        if (active) setLoading(false);
      }
    };

    load();

    return () => {
      active = false;
    };
  }, []);

  const handleSave = async () => {
    if (!isManager) {
      setError("Manager privileges are required to update the company default.");
      return;
    }

    setError("");
    setSaving(true);
    setMessage("");

    try {
      await settingsApi.update({ default_profession: profession || null });
      const refreshed = await settingsApi.get();
      setProfession(refreshed?.default_profession ?? "");
      const resolved =
        refreshed?.effective_profession ??
        refreshed?.default_profession ??
        refreshed?.profession ??
        "";
      setEffectiveProfession(resolved);
      setMessage("Default profession updated.");
      setError("");
    } catch (err) {
      const msg =
        err?.displayMessage ||
        err?.response?.data?.error ||
        "Unable to update the default profession.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const closeSnackbar = () => {
    setMessage("");
    setError("");
  };

  const notSetLabel = "Not set";
  const professionLabelMap = useMemo(() => new Map(PROFESSION_OPTIONS.map((option) => [option.value, option.label])), []);
  const resolveLabel = (value) => {
    if (!value) return notSetLabel;
    return professionLabelMap.get(value) || value;
  };
  const currentDefaultLabel = resolveLabel(profession);
  const currentEffectiveLabel = resolveLabel(effectiveProfession);
  const canEdit = isManager && !loading;
  const titleVariant = variant === "embedded" ? "subtitle1" : "h6";

  return (
    <Box>
      <Stack spacing={variant === "embedded" ? 2 : 3}>
        <Box>
          <Typography variant={titleVariant} fontWeight={600} gutterBottom>
            Company Default Profession
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Recruiters will see <strong>{currentEffectiveLabel}</strong> by default. Personal preferences still override the company default when set in the workspace tab.
          </Typography>
          {!isManager && !loading && (
            <Alert sx={{ mt: 2 }} severity="info">
              Only managers can change the company default.
            </Alert>
          )}
        </Box>

        <FormControl fullWidth disabled={!canEdit || saving}>
          <InputLabel id="default-profession-label">Default profession</InputLabel>
          <Select
            labelId="default-profession-label"
            label="Default profession"
            value={profession}
            onChange={(event) => setProfession(event.target.value)}
          >
            <MenuItem value="">
              <em>{notSetLabel}</em>
            </MenuItem>
            {PROFESSION_OPTIONS.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems="flex-start">
          <Typography variant="body2" color="text.secondary">
            Current company default: <strong>{currentDefaultLabel}</strong>
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Effective for you right now: <strong>{currentEffectiveLabel}</strong>
          </Typography>
        </Stack>

        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving || loading || !isManager}
        >
          {saving ? "Saving..." : "Save Default Profession"}
        </Button>
      </Stack>

      <Snackbar
        open={Boolean(message || error)}
        autoHideDuration={4000}
        onClose={closeSnackbar}
      >
        <Alert onClose={closeSnackbar} severity={error ? "error" : "success"} sx={{ width: "100%" }}>
          {error ? error : message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ProfessionSettings;
