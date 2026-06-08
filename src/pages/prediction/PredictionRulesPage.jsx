import React, { useEffect, useState } from "react";
import { Alert, Chip, Grid, Paper, Skeleton, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { getPredictionRules } from "./predictionApi";

const ruleSectionKeyMap = {
  "free-entry": "free-entry",
  "how-to-play": "how-to-play",
  locking: "locking",
  scoring: "scoring",
  referrals: "referrals",
  draws: "draws",
  prizes: "prizes",
  "grand-prize": "grand-prize",
  "daily-bonus": "daily-bonus",
  streaks: "streaks",
  sponsors: "sponsors",
  "following-sponsors": "following-sponsors",
};

const PredictionRulesPage = () => {
  const { t } = useTranslation();
  const [state, setState] = useState({ loading: true, error: "", data: null });

  useEffect(() => {
    let active = true;
    getPredictionRules()
      .then((data) => {
        if (active) setState({ loading: false, error: "", data });
      })
      .catch((error) => {
        if (active) {
          setState({
            loading: false,
            error: error?.response?.data?.error || error?.message || t("prediction.rules.errors.load", "Failed to load rules."),
            data: null,
          });
        }
      });
    return () => {
      active = false;
    };
  }, []);

  if (state.loading) return <Skeleton variant="rounded" height={220} />;
  if (state.error) return <Alert severity="error">{state.error}</Alert>;

  const howToPlaySteps = [1, 2, 3].map((index) =>
    t(`prediction.rules.howToPlay.step${index}`, `Step ${index}`)
  );
  const scoringRows = [1, 2, 3, 4, 5].map((index) => ({
    result: t(`prediction.rules.scoring.rows.${index}.result`, ""),
    points: t(`prediction.rules.scoring.rows.${index}.points`, ""),
    notes: t(`prediction.rules.scoring.rows.${index}.notes`, ""),
  }));
  const scoringExamples = [1, 2, 3, 4].map((index) =>
    t(`prediction.rules.scoring.examples.${index}`, `Example ${index}`)
  );
  const weeklyShareExamples = [1, 2, 3].map((index) =>
    t(`prediction.rules.weeklyExamples.${index}`, `Example ${index}`)
  );
  const quickFaq = [1, 2, 3, 4].map((index) => ({
    question: t(`prediction.rules.faq.${index}.q`, ""),
    answer: t(`prediction.rules.faq.${index}.a`, ""),
  }));

  return (
    <Stack spacing={2}>
      <Typography variant="h5" sx={{ fontWeight: 700 }}>
        {t("prediction.rules.title", "Rules")}
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2.5, border: "1px solid", borderColor: "divider", height: "100%" }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
              {t("prediction.rules.howToPlay.title", "How to play")}
            </Typography>
            <Chip size="small" label={t("prediction.rules.chips.startHere", "Start here")} color="primary" variant="outlined" sx={{ alignSelf: "flex-start", mb: 0.5 }} />
            <Stack spacing={1}>
              {howToPlaySteps.map((step, index) => (
                <Typography key={step} variant="body2" color="text.secondary">
                  {index + 1}. {step}
                </Typography>
              ))}
            </Stack>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2.5, border: "1px solid", borderColor: "divider", height: "100%" }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
              {t("prediction.rules.points.title", "Points per match")}
            </Typography>
            <Chip size="small" label={t("prediction.rules.chips.scoringSummary", "Scoring summary")} color="success" variant="outlined" sx={{ alignSelf: "flex-start", mb: 0.5 }} />
            <Typography variant="body2" color="text.secondary">
              {t("prediction.rules.points.body", "Points are awarded per match after the final result is entered and scoring runs.")}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      <Paper elevation={0} sx={{ borderRadius: 2.5, border: "1px solid", borderColor: "divider", overflow: "hidden" }}>
        <Stack spacing={1} sx={{ p: 2.5, pb: 1.5 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {t("prediction.rules.scoring.title", "Scoring table")}
          </Typography>
          <Chip size="small" label={t("prediction.rules.chips.quickReference", "Quick reference")} color="success" variant="outlined" sx={{ alignSelf: "flex-start" }} />
          <Typography variant="body2" color="text.secondary">
            {t("prediction.rules.scoring.body", "Use this table as the quick reference for how points are awarded.")}
          </Typography>
        </Stack>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>{t("prediction.rules.scoring.columns.result", "Scoring result")}</TableCell>
                <TableCell width="120">{t("prediction.rules.scoring.columns.points", "Points")}</TableCell>
                <TableCell>{t("prediction.rules.scoring.columns.notes", "Notes")}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {scoringRows.map((row) => (
                <TableRow key={row.result}>
                  <TableCell>{row.result}</TableCell>
                  <TableCell>{row.points}</TableCell>
                  <TableCell>{row.notes}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2.5, border: "1px solid", borderColor: "divider" }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ sm: "center" }} sx={{ mb: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {t("prediction.rules.examples.title", "Scoring examples")}
          </Typography>
          <Chip size="small" label={t("prediction.rules.chips.examples", "Examples")} color="info" variant="outlined" />
        </Stack>
        <Stack spacing={1}>
          {scoringExamples.map((example) => (
            <Typography key={example} variant="body2" color="text.secondary">
              • {example}
            </Typography>
          ))}
        </Stack>
      </Paper>

      <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2.5, border: "1px solid", borderColor: "divider" }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ sm: "center" }} sx={{ mb: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {t("prediction.rules.weekly.title", "Weekly Share Prize examples")}
          </Typography>
          <Chip size="small" label={t("prediction.rules.chips.prizeQualification", "Prize qualification")} color="warning" variant="outlined" />
        </Stack>
        <Stack spacing={1}>
          {weeklyShareExamples.map((example) => (
            <Typography key={example} variant="body2" color="text.secondary">
              • {example}
            </Typography>
          ))}
        </Stack>
      </Paper>

      <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2.5, border: "1px solid", borderColor: "divider" }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ sm: "center" }} sx={{ mb: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {t("prediction.rules.faq.title", "Quick FAQ")}
          </Typography>
          <Chip size="small" label={t("prediction.rules.chips.commonQuestions", "Common questions")} color="primary" variant="outlined" />
        </Stack>
        <Stack spacing={1.5}>
          {quickFaq.map((item) => (
            <Stack key={item.question} spacing={0.35}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                {item.question}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {item.answer}
              </Typography>
            </Stack>
          ))}
        </Stack>
      </Paper>

      <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2.5, border: "1px solid", borderColor: "divider" }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ sm: "center" }} sx={{ mb: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {t("prediction.rules.multipick.title", "Multi-Pick Challenge")}
          </Typography>
          <Chip size="small" label={t("prediction.rules.multipick.chip", "Separate mode")} color="info" variant="outlined" />
        </Stack>
        <Stack spacing={1}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((index) => (
            <Typography key={`multipick-rule-${index}`} variant="body2" color="text.secondary">
              • {t(`prediction.rules.multipick.points.${index}`, `Multi-Pick rule ${index}`)}
            </Typography>
          ))}
        </Stack>
      </Paper>

      {(state.data?.sections || []).map((section) => (
        <Paper key={section.key} elevation={0} sx={{ p: 2.5, borderRadius: 2.5, border: "1px solid", borderColor: "divider" }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.75 }}>
            {t(`prediction.rules.sections.${ruleSectionKeyMap[section.key] || section.key}.title`, section.title)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t(`prediction.rules.sections.${ruleSectionKeyMap[section.key] || section.key}.body`, section.body)}
          </Typography>
        </Paper>
      ))}
      <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2.5, border: "1px solid", borderColor: "divider" }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.75 }}>
          {t("prediction.rules.extra.prizeCategories.title", "Prize categories")}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t("prediction.rules.extra.prizeCategories.body", "Daily Prize: daily prizes start at $25, and some matchdays may feature larger sponsor-supported prizes. Weekly Share Prize: invite friends and make weekly predictions before cutoff. Grand Prize: meet the referral and prediction requirements before the grand cutoff.")}
        </Typography>
      </Paper>
      <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2.5, border: "1px solid", borderColor: "divider" }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.75 }}>
          {t("prediction.rules.extra.grandPrize.title", "Grand Prize")}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t("prediction.rules.extra.grandPrize.body", "Grand Prize value will be announced before the draw and is expected to be approximately $500-$1,000 CAD. The prize may be a drone, gift card, or equivalent sponsor-supported prize. Schedulaa may substitute an equivalent gift card if shipping, availability, sponsor contribution, or local rules prevent delivery of the original prize.")}
        </Typography>
      </Paper>
      <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2.5, border: "1px solid", borderColor: "divider" }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.75 }}>
          {t("prediction.rules.extra.compliance.title", "Prize and compliance notes")}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t("prediction.rules.extra.compliance.body", "Daily prizes start at $25. Some matchdays may feature larger sponsor-supported prizes. Selected prize days may be supported by local businesses. Sponsor support does not change the no-purchase-necessary nature of the challenge. Schedulaa administers the challenge and winner selection unless otherwise stated.")}
        </Typography>
      </Paper>
      <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2.5, border: "1px solid", borderColor: "divider" }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.75 }}>
          {t("prediction.rules.extra.following.title", "Following sponsors")}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t("prediction.rules.extra.following.body", "Participants may be encouraged to follow Schedulaa or participating sponsors for updates and winner announcements, but following is not required to enter or win unless a specific sponsor promotion clearly states otherwise.")}
        </Typography>
      </Paper>
    </Stack>
  );
};

export default PredictionRulesPage;
