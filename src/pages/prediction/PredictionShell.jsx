import React, { useEffect, useMemo, useState } from "react";
import { Box, Button, Stack, Tab, Tabs, useMediaQuery } from "@mui/material";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useTheme } from "@mui/material/styles";
import ManagementFrame from "../../components/ui/ManagementFrame";
import PredictionHomePage from "./PredictionHomePage";
import PredictionTodayPage from "./PredictionTodayPage";
import PredictionWeeklyPage from "./PredictionWeeklyPage";
import PredictionMultiPickPage from "./PredictionMultiPickPage";
import PredictionFixturesPage from "./PredictionFixturesPage";
import PredictionMyPredictionsPage from "./PredictionMyPredictionsPage";
import PredictionLeaderboardPage from "./PredictionLeaderboardPage";
import PredictionReferralsPage from "./PredictionReferralsPage";
import PredictionPrizesPage from "./PredictionPrizesPage";
import PredictionRulesPage from "./PredictionRulesPage";
import { clearStoredPredictionReferral, getStoredPredictionReferral } from "../../utils/predictionReferral";
import { resolvePredictionReferral } from "./predictionApi";

const readInitialTab = () => {
  if (typeof window === "undefined") return "home";
  const stored = window.localStorage.getItem("prediction_initial_tab");
  if (stored) {
    window.localStorage.removeItem("prediction_initial_tab");
    return stored;
  }
  return "home";
};

const PredictionShell = () => {
  const { t, i18n } = useTranslation();
  const [tab, setTab] = useState(readInitialTab);
  const [selectedWeekKey, setSelectedWeekKey] = useState("");
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isRtl = i18n.dir() === "rtl";
  const tabs = useMemo(
    () => [
      { key: "home", label: t("prediction.tabs.home", "Home") },
      { key: "today", label: t("prediction.tabs.today", "Today") },
      { key: "weekly", label: t("prediction.tabs.weekly", "Weekly Challenge") },
      { key: "multipick", label: t("prediction.tabs.multipick", "Multi-Pick") },
      { key: "fixtures", label: t("prediction.tabs.fixtures", "Fixtures") },
      { key: "my-predictions", label: t("prediction.tabs.myPredictions", "My Predictions") },
      { key: "leaderboard", label: t("prediction.tabs.leaderboard", "Leaderboard") },
      { key: "referrals", label: t("prediction.tabs.referrals", "Referrals") },
      { key: "prizes", label: t("prediction.tabs.prizes", "Prizes") },
      { key: "rules", label: t("prediction.tabs.rules", "Rules") },
    ],
    [t]
  );

  const activeTab = tabs.some((item) => item.key === tab) ? tab : tabs[0].key;

  const openWeekly = (weekKey = "") => {
    if (weekKey) setSelectedWeekKey(weekKey);
    setTab("weekly");
  };

  const openFixtures = () => setTab("fixtures");

  const openMyPredictions = () => setTab("my-predictions");
  const openReferrals = () => setTab("referrals");
  const openPrizes = () => setTab("prizes");

  useEffect(() => {
    let active = true;
    const stored = getStoredPredictionReferral();
    if (!stored?.ref) return undefined;
    resolvePredictionReferral({ campaign: stored.campaign, ref: stored.ref })
      .then(() => {
        if (active) clearStoredPredictionReferral();
      })
      .catch((error) => {
        const code = error?.response?.data?.error;
        if (active && code) {
          clearStoredPredictionReferral();
        }
      });
    return () => {
      active = false;
    };
  }, [location.key]);

  const renderTab = () => {
    switch (activeTab) {
      case "today":
        return <PredictionTodayPage onOpenWeekly={openWeekly} />;
      case "weekly":
        return <PredictionWeeklyPage selectedWeekKey={selectedWeekKey} onSelectedWeekKeyChange={setSelectedWeekKey} />;
      case "multipick":
        return <PredictionMultiPickPage />;
      case "fixtures":
        return <PredictionFixturesPage onOpenWeekly={openWeekly} />;
      case "my-predictions":
        return <PredictionMyPredictionsPage onOpenWeekly={openWeekly} />;
      case "leaderboard":
        return <PredictionLeaderboardPage />;
      case "referrals":
        return <PredictionReferralsPage />;
      case "prizes":
        return <PredictionPrizesPage />;
      case "rules":
        return <PredictionRulesPage />;
      case "home":
      default:
        return <PredictionHomePage onOpenWeekly={openWeekly} onOpenFixtures={openFixtures} onOpenMyPredictions={openMyPredictions} onOpenReferrals={openReferrals} onOpenPrizes={openPrizes} onOpenToday={() => setTab("today")} />;
    }
  };

  return (
    <ManagementFrame
      title={t("prediction.shell.title", "Football Prediction Challenge")}
      subtitle={null}
    >
      <Box
        dir={i18n.dir()}
        sx={{
          textAlign: "start",
          "& .MuiTableCell-root": {
            textAlign: isRtl ? "right" : "left",
          },
          "& .MuiInputBase-input, & .MuiInputLabel-root, & .MuiFormLabel-root, & .MuiAlert-message": {
            textAlign: "start",
          },
          "& .MuiStack-root, & .MuiTypography-root": {
            textAlign: "start",
          },
        }}
      >
      <Stack spacing={2}>
        {isMobile ? (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: 1,
            }}
          >
            {tabs.map((item) => (
              <Button
                key={item.key}
                variant={activeTab === item.key ? "contained" : "outlined"}
                color={activeTab === item.key ? "primary" : "inherit"}
                onClick={() => setTab(item.key)}
                sx={{
                  minHeight: 40,
                  borderRadius: 1.5,
                  textTransform: "none",
                  fontWeight: 800,
                  fontSize: "0.82rem",
                }}
              >
                {item.label}
              </Button>
            ))}
          </Box>
        ) : (
          <Box
            sx={{
              borderBottom: 1,
              borderColor: "divider",
              overflowX: "auto",
              mx: { xs: -1, sm: 0 },
              px: { xs: 1, sm: 0 },
              "&::-webkit-scrollbar": { display: "none" },
              scrollbarWidth: "none",
            }}
          >
            <Tabs
              value={activeTab}
              onChange={(_event, next) => setTab(next)}
              variant="scrollable"
              scrollButtons="auto"
              allowScrollButtonsMobile
              sx={{
                minHeight: { xs: 44, sm: 48 },
                "& .MuiTabs-flexContainer": {
                  gap: { xs: 0.5, sm: 0 },
                },
                "& .MuiTab-root": {
                  minHeight: { xs: 44, sm: 48 },
                  textTransform: "none",
                  fontWeight: 700,
                  px: { xs: 1.5, sm: 2 },
                  minWidth: { xs: "auto", sm: 90 },
                  borderRadius: { xs: 2, sm: 0 },
                  mr: { xs: 0.25, sm: 0 },
                  fontSize: { xs: "0.8rem", sm: "0.875rem" },
                },
                "& .Mui-selected": {
                  backgroundColor: { xs: "action.selected", sm: "transparent" },
                },
              }}
            >
              {tabs.map((item) => (
                <Tab key={item.key} value={item.key} label={item.label} />
              ))}
            </Tabs>
          </Box>
        )}
        {renderTab()}
      </Stack>
      </Box>
    </ManagementFrame>
  );
};

export default PredictionShell;
