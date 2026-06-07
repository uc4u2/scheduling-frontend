import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Grid,
  Paper,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import GroupAddOutlinedIcon from "@mui/icons-material/GroupAddOutlined";
import HourglassEmptyOutlinedIcon from "@mui/icons-material/HourglassEmptyOutlined";
import WorkspacePremiumOutlinedIcon from "@mui/icons-material/WorkspacePremiumOutlined";
import CardGiftcardOutlinedIcon from "@mui/icons-material/CardGiftcardOutlined";
import { getPredictionReferralsMe } from "./predictionApi";
import { formatUtcLabel } from "./predictionViewUtils";
import PredictionHero from "./components/PredictionHero";
import PredictionStatCard from "./components/PredictionStatCard";
import PredictionProgressBar from "./components/PredictionProgressBar";
import PredictionEmptyState from "./components/PredictionEmptyState";

const openShareWindow = (url) => {
  if (typeof window === "undefined") return;
  window.open(url, "_blank", "noopener,noreferrer");
};

const formatReferralStatus = (status, t) => {
  const key = String(status || "").toLowerCase();
  const mapping = {
    pending: t("prediction.referrals.status.pending", "Pending"),
    qualified: t("prediction.referrals.status.qualified", "Qualified"),
    rejected: t("prediction.referrals.status.rejected", "Rejected"),
    disqualified: t("prediction.referrals.status.disqualified", "Disqualified"),
  };
  return mapping[key] || String(status || "")
    .split("_")
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
};

export default function PredictionReferralsPage() {
  const { t } = useTranslation();
  const [state, setState] = useState({ loading: true, error: "", data: null, copied: false });

  useEffect(() => {
    let active = true;
    getPredictionReferralsMe()
      .then((data) => {
        if (active) setState({ loading: false, error: "", data, copied: false });
      })
      .catch((error) => {
        if (active) {
          setState({
            loading: false,
            error: error?.response?.data?.error || error?.message || t("prediction.referrals.errors.load", "Failed to load referrals."),
            data: null,
            copied: false,
          });
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const referralLink = state.data?.referral_link || "";
  const weekly = state.data?.weekly_draw_progress;
  const grand = state.data?.grand_draw_progress;

  const shareUrls = useMemo(() => {
    const encoded = encodeURIComponent(referralLink);
    const message = encodeURIComponent(t("prediction.referrals.share.message", "Join the Schedulaa Football Prediction Challenge and make your picks."));
    return {
      whatsapp: `https://wa.me/?text=${message}%20${encoded}`,
      sms: `sms:?&body=${message}%20${encoded}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encoded}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encoded}`,
    };
  }, [referralLink, t]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setState((prev) => ({ ...prev, copied: true, error: "" }));
    } catch (_error) {
      setState((prev) => ({ ...prev, copied: false, error: t("prediction.referrals.errors.clipboard", "Clipboard access is not available in this browser.") }));
    }
  };

  if (state.loading) return <Skeleton variant="rounded" height={340} />;
  if (state.error && !state.data) return <Alert severity="error">{state.error}</Alert>;

  return (
    <Stack spacing={2}>
      {state.error ? <Alert severity="warning">{state.error}</Alert> : null}
      {state.copied ? <Alert severity="success">{t("prediction.referrals.success.copied", "Referral link copied.")}</Alert> : null}

      <PredictionHero
        title={t("prediction.referrals.hero.title", "Invite Friends")}
        subtitle={t("prediction.referrals.hero.subtitle", "When a friend registers through your link and makes at least one prediction before the cutoff, your referral counts toward weekly and grand prize progress.")}
        primaryActionLabel={t("prediction.referrals.actions.copyLink", "Copy Link")}
        onPrimaryAction={handleCopy}
        secondaryActionLabel={t("prediction.referrals.actions.whatsapp", "WhatsApp")}
        onSecondaryAction={() => openShareWindow(shareUrls.whatsapp)}
        tertiaryActionLabel={t("prediction.referrals.actions.sms", "SMS")}
        onTertiaryAction={() => openShareWindow(shareUrls.sms)}
        stats={[
          { label: t("prediction.referrals.hero.stats.qualified", "Qualified"), value: state.data?.qualified_referrals_count || 0 },
          { label: t("prediction.referrals.hero.stats.pending", "Pending"), value: state.data?.pending_referrals_count || 0 },
          { label: t("prediction.referrals.hero.stats.grandProgress", "Grand progress"), value: `${grand?.current_qualified_referrals ?? 0}/${grand?.required_qualified_referrals ?? 5}` },
        ]}
      />

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} lg={3}>
          <PredictionStatCard
            label={t("prediction.referrals.cards.qualified", "Qualified referrals")}
            value={state.data?.qualified_referrals_count || 0}
            helper={t("prediction.referrals.cards.qualifiedHelper", "These friends registered and saved at least one prediction before the cutoff.")}
            tone="success"
            icon={<GroupAddOutlinedIcon fontSize="small" />}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <PredictionStatCard
            label={t("prediction.referrals.cards.pending", "Pending referrals")}
            value={state.data?.pending_referrals_count || 0}
            helper={t("prediction.referrals.cards.pendingHelper", "These friends still need to complete their first prediction before they count.")}
            tone="warning"
            icon={<HourglassEmptyOutlinedIcon fontSize="small" />}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <PredictionStatCard
            label={t("prediction.referrals.cards.weekly", "Weekly prize progress")}
            value={`${weekly?.current_qualified_referrals ?? 0}/${weekly?.required_qualified_referrals ?? 1}`}
            helper={t("prediction.referrals.cards.weeklyHelper", "Qualified friends needed for the next weekly share prize.")}
            tone="info"
            icon={<CardGiftcardOutlinedIcon fontSize="small" />}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <PredictionStatCard
            label={t("prediction.referrals.cards.grand", "Grand prize progress")}
            value={`${grand?.current_qualified_referrals ?? 0}/${grand?.required_qualified_referrals ?? 5}`}
            helper={t("prediction.referrals.cards.grandHelper", "Qualified friends toward the sponsor-supported grand prize.")}
            tone="primary"
            icon={<WorkspacePremiumOutlinedIcon fontSize="small" />}
          />
        </Grid>
      </Grid>

      <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2.5, border: "1px solid", borderColor: "divider" }}>
        <Stack spacing={1.5}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {t("prediction.referrals.share.title", "Share your referral link")}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t("prediction.referrals.share.body", "Share your personal link with friends. Once they register and make one prediction before the cutoff, they count toward your prize progress.")}
          </Typography>
          <TextField
            label={t("prediction.referrals.share.linkLabel", "Referral link")}
            value={referralLink}
            InputProps={{ readOnly: true }}
            fullWidth
          />
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Button variant="contained" onClick={handleCopy}>
              {t("prediction.referrals.actions.copyLink", "Copy Link")}
            </Button>
            <Button variant="outlined" onClick={() => openShareWindow(shareUrls.whatsapp)}>
              {t("prediction.referrals.actions.whatsapp", "WhatsApp")}
            </Button>
            <Button variant="outlined" onClick={() => openShareWindow(shareUrls.sms)}>
              {t("prediction.referrals.actions.sms", "SMS")}
            </Button>
            <Button variant="outlined" onClick={() => openShareWindow(shareUrls.linkedin)}>
              {t("prediction.referrals.actions.linkedin", "LinkedIn")}
            </Button>
            <Button variant="outlined" onClick={() => openShareWindow(shareUrls.facebook)}>
              {t("prediction.referrals.actions.facebook", "Facebook")}
            </Button>
          </Stack>
        </Stack>
      </Paper>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2.5, border: "1px solid", borderColor: "divider", height: "100%" }}>
            <Stack spacing={1.5}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {t("prediction.referrals.weekly.title", "Weekly Share Prize Progress")}
              </Typography>
              <PredictionProgressBar
                current={weekly?.current_qualified_referrals ?? 0}
                target={weekly?.required_qualified_referrals ?? 1}
                label={t("prediction.referrals.weekly.qualified", "Qualified referrals")}
                helper={t("prediction.referrals.weekly.qualifiedHelper", "Invite friends who register and save one prediction before the weekly prize cutoff.")}
                tone="primary"
              />
              <PredictionProgressBar
                current={weekly?.current_predictions ?? 0}
                target={weekly?.required_predictions ?? 3}
                label={t("prediction.referrals.progress.predictionsSaved", "Predictions saved")}
                helper={t("prediction.referrals.weekly.predictionsHelper", "Keep your weekly picks active before the prize cutoff.")}
                tone="success"
              />
              <Typography variant="caption" color="text.secondary">
                {t("prediction.referrals.cutoff", "Prize cutoff UTC")}: {weekly?.cutoff_at_utc ? formatUtcLabel(weekly.cutoff_at_utc) : t("prediction.referrals.cutoffPending", "Announced before this prize window opens.")}
              </Typography>
            </Stack>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2.5, border: "1px solid", borderColor: "divider", height: "100%" }}>
            <Stack spacing={1.5}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {t("prediction.referrals.grand.title", "Grand Prize Progress")}
              </Typography>
              <PredictionProgressBar
                current={grand?.current_qualified_referrals ?? 0}
                target={grand?.required_qualified_referrals ?? 5}
                label={t("prediction.referrals.grand.qualifiedFriends", "Qualified friends")}
                helper={t("prediction.referrals.grand.qualifiedHelper", "Reach the friend target before the grand prize cutoff.")}
                tone="primary"
              />
              <PredictionProgressBar
                current={grand?.current_predictions ?? 0}
                target={grand?.required_predictions ?? 10}
                label={t("prediction.referrals.progress.predictionsSaved", "Predictions saved")}
                helper={t("prediction.referrals.grand.predictionsHelper", "Keep predicting across the campaign to stay eligible.")}
                tone="success"
              />
              <Typography variant="caption" color="text.secondary">
                {t("prediction.referrals.cutoff", "Prize cutoff UTC")}: {grand?.cutoff_at_utc ? formatUtcLabel(grand.cutoff_at_utc) : t("prediction.referrals.cutoffPending", "Announced before this prize window opens.")}
              </Typography>
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2.5, border: "1px solid", borderColor: "divider" }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>
          {t("prediction.referrals.activity.title", "Referral Activity")}
        </Typography>
        {(state.data?.referrals || []).length ? (
          <Stack spacing={1.25}>
            {state.data.referrals.map((row) => (
              <Paper key={row.id} variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                <Stack spacing={0.5}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    {row.referred_display_name || row.referral_code_snapshot || t("prediction.referrals.activity.friendReferral", "Friend referral")}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t("prediction.referrals.activity.status", "Referral status")}: {formatReferralStatus(row.status, t)}
                  </Typography>
                  {row.qualified_at_utc ? (
                    <Typography variant="body2" color="text.secondary">
                      {t("prediction.referrals.activity.qualifiedOn", "Qualified on")}: {formatUtcLabel(row.qualified_at_utc)}
                    </Typography>
                  ) : null}
                  {!row.qualified_at_utc && row.registered_at_utc ? (
                    <Typography variant="body2" color="text.secondary">
                      {t("prediction.referrals.activity.registered", "Registered")}: {formatUtcLabel(row.registered_at_utc)}
                    </Typography>
                  ) : null}
                </Stack>
              </Paper>
            ))}
          </Stack>
        ) : (
          <PredictionEmptyState
            title={t("prediction.referrals.empty.title", "No referrals yet")}
            body={t("prediction.referrals.empty.body", "Share your link with friends. Once they register and make one prediction, they count toward your prize progress.")}
          />
        )}
      </Paper>
    </Stack>
  );
}
