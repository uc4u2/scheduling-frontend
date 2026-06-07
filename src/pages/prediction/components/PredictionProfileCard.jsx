import React, { useEffect, useState } from "react";
import { Alert, Autocomplete, Box, Button, Grid, MenuItem, Paper, Stack, TextField, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { getPredictionProfile, savePredictionProfile } from "../predictionApi";
import { getAllPredictionTeamOptions } from "../predictionTeamIdentity";
import PredictionTeamBadge from "./PredictionTeamBadge";
import "flag-icons/css/flag-icons.min.css";

const teamOptions = getAllPredictionTeamOptions();

export default function PredictionProfileCard({ onSaved }) {
  const { t } = useTranslation();
  const [state, setState] = useState({
    loading: true,
    saving: false,
    error: "",
    success: "",
    data: null,
    form: { displayName: "", emojiAvatar: "", favoriteTeamName: "" },
  });

  useEffect(() => {
    let active = true;
    getPredictionProfile()
      .then((data) => {
        if (!active) return;
        const profile = data?.profile || {};
        setState({
          loading: false,
          saving: false,
          error: "",
          success: "",
          data,
          form: {
            displayName: profile.display_name || "",
            emojiAvatar: profile.emoji_avatar || "",
            favoriteTeamName: profile.favorite_team_name || "",
          },
        });
      })
      .catch((error) => {
        if (!active) return;
        setState((prev) => ({
          ...prev,
          loading: false,
          error: error?.response?.data?.error || error?.message || t("prediction.profile.errors.load", "Failed to load leaderboard profile."),
        }));
      });
    return () => {
      active = false;
    };
  }, []);

  const handleSave = async () => {
    setState((prev) => ({ ...prev, saving: true, error: "", success: "" }));
    try {
      const data = await savePredictionProfile({
        displayName: state.form.displayName,
        emojiAvatar: state.form.emojiAvatar,
        favoriteTeamName: state.form.favoriteTeamName,
      });
      setState((prev) => ({
        ...prev,
        saving: false,
        data,
        success: t("prediction.profile.success.saved", "Leaderboard profile saved."),
      }));
      onSaved?.(data);
    } catch (error) {
      setState((prev) => ({
        ...prev,
        saving: false,
        error: error?.response?.data?.error || error?.message || t("prediction.profile.errors.save", "Failed to save leaderboard profile."),
      }));
    }
  };

  const selectedFavoriteTeam =
    teamOptions.find((option) => option.teamName === state.form.favoriteTeamName) || null;
  const previewDisplayName = state.form.displayName.trim() || "Player";
  const previewEmoji = state.form.emojiAvatar || "⚽";

  return (
    <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2.5, border: "1px solid", borderColor: "divider" }}>
      <Stack spacing={1.5}>
        <Stack spacing={0.5}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {t("prediction.profile.title", "How you appear on the leaderboard")}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t("prediction.profile.subtitle", "Choose your display name, emoji, and favorite team for leaderboard and winner cards.")}
          </Typography>
        </Stack>
        {state.error ? <Alert severity="error">{state.error}</Alert> : null}
        {state.success ? <Alert severity="success">{state.success}</Alert> : null}
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label={t("prediction.profile.fields.displayName", "Display name")}
              value={state.form.displayName}
              onChange={(event) => setState((prev) => ({
                ...prev,
                form: { ...prev.form, displayName: event.target.value },
              }))}
              inputProps={{ maxLength: 32 }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              select
              fullWidth
              label={t("prediction.profile.fields.emoji", "Choose your emoji")}
              value={state.form.emojiAvatar}
              onChange={(event) => setState((prev) => ({
                ...prev,
                form: { ...prev.form, emojiAvatar: event.target.value },
              }))}
            >
              <MenuItem value="">{t("prediction.profile.fields.noEmoji", "No emoji")}</MenuItem>
              {(state.data?.allowed_emoji_avatars || []).map((emoji) => (
                <MenuItem key={emoji} value={emoji}>
                  {emoji}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={5}>
            <Autocomplete
              fullWidth
              options={teamOptions}
              value={selectedFavoriteTeam}
              onChange={(_event, option) =>
                setState((prev) => ({
                  ...prev,
                  form: { ...prev.form, favoriteTeamName: option?.teamName || "" },
                }))
              }
              autoHighlight
              getOptionLabel={(option) => option?.teamName || ""}
              isOptionEqualToValue={(option, value) => option.teamName === value.teamName}
              renderOption={(props, option) => (
                <Box component="li" {...props} sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
                  {option.flagClass ? (
                    <Box
                      component="span"
                      className={`fi ${option.flagClass}`}
                      aria-hidden="true"
                      sx={{ width: 20, height: 14, borderRadius: 0.5, overflow: "hidden", flexShrink: 0 }}
                    />
                  ) : null}
                  <Typography variant="body2" sx={{ fontWeight: 700, minWidth: 36 }}>
                    {option.shortCode}
                  </Typography>
                  <Typography variant="body2">{option.teamName}</Typography>
                </Box>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={t("prediction.profile.fields.favoriteTeam", "Favorite team")}
                  placeholder={t("prediction.profile.fields.favoriteTeamPlaceholder", "Select a team")}
                />
              )}
            />
          </Grid>
        </Grid>
        <Paper
          variant="outlined"
          sx={{
            p: 2,
            borderRadius: 2,
            bgcolor: "background.default",
          }}
        >
          <Stack spacing={1.25}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              {t("prediction.profile.preview.title", "Leaderboard preview")}
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ xs: "flex-start", sm: "center" }}>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                {previewEmoji} {previewDisplayName}
              </Typography>
              {selectedFavoriteTeam ? (
                <Box sx={{ minWidth: { xs: "100%", sm: 220 } }}>
                  <PredictionTeamBadge
                    teamName={selectedFavoriteTeam.teamName}
                    shortName={selectedFavoriteTeam.shortCode}
                    compact
                    align="left"
                  />
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  {t("prediction.profile.preview.noTeam", "No favorite team selected yet.")}
                </Typography>
              )}
            </Stack>
          </Stack>
        </Paper>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
          <Button variant="contained" onClick={handleSave} disabled={state.saving || state.loading}>
            {t("prediction.profile.actions.save", "Save Profile")}
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
}
