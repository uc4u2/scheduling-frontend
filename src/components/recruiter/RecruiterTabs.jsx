import React, { useMemo } from "react";
import PropTypes from "prop-types";
import { Box, Tabs, Tab, Button, Stack } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";

const TAB_CONFIG = [
  { value: "calendar", labelKey: "recruiter.tabs.calendar", path: "/employee?tab=calendar" },
  { value: "availability", labelKey: "recruiter.tabs.availability", path: "/employee?tab=availability" },
  { value: "invitations", labelKey: "recruiter.tabs.invitations", path: "/recruiter/invitations" },
  { value: "candidate-forms", labelKey: "recruiter.tabs.candidateForms", path: "/recruiter/invitations?section=forms" },
  { value: "questionnaires", labelKey: "recruiter.tabs.questionnaires", path: "/recruiter/questionnaires" },
  { value: "upcoming-meetings", labelKey: "recruiter.tabs.upcomingMeetings", path: "/recruiter/upcoming-meetings" },
  { value: "my-time", labelKey: "recruiter.tabs.myTime", path: "/recruiter/my-time" },
  { value: "candidate-search", labelKey: "recruiter.tabs.candidateSearch", path: "/employee/candidate-search" },
  { value: "public-link", labelKey: "recruiter.tabs.publicLink", path: "/recruiter/public-link" },
  { value: "job-postings", labelKey: "recruiter.tabs.jobPostings", path: "/manager/job-openings" },
];

const LOCAL_TABS = new Set(["availability", "calendar"]);

const getPathValue = (locationPathname, searchParams, fallback) => {
  if (locationPathname.startsWith("/recruiter/invitations")) {
    const section = searchParams.get("section");
    return section === "forms" ? "candidate-forms" : "invitations";
  }
  if (locationPathname.startsWith("/recruiter/questionnaires")) {
    return "questionnaires";
  }
  if (locationPathname.startsWith("/recruiter/upcoming-meetings")) {
    return "upcoming-meetings";
  }
  if (locationPathname.startsWith("/recruiter/my-time")) {
    return "my-time";
  }
  if (locationPathname.startsWith("/recruiter/candidate-search") || locationPathname.startsWith("/employee/candidate-search")) {
    return "candidate-search";
  }
  return fallback;
};

const HR_ONLY_TABS = new Set([
  "availability",
  "invitations",
  "candidate-forms",
  "questionnaires",
  "upcoming-meetings",
  "candidate-search",
  "public-link",
  "job-postings",
]);

const RecruiterTabs = ({
  localTab = "calendar",
  onLocalTabChange,
  allowCandidateSearch = false,
  allowHrAccess = null,
  isLoading = false,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const hrAccess =
    allowHrAccess !== null && allowHrAccess !== undefined
      ? Boolean(allowHrAccess)
      : Boolean(allowCandidateSearch);
  const tabs = useMemo(() => {
    if (hrAccess) return TAB_CONFIG;
    return TAB_CONFIG.filter((tab) =>
      ["calendar", "my-time"].includes(tab.value)
    );
  }, [hrAccess]);

  const value = useMemo(() => {
    return getPathValue(location.pathname, searchParams, localTab);
  }, [location.pathname, searchParams, localTab]);
  const resolvedValue = useMemo(() => {
    if (tabs.some((tab) => tab.value === value)) {
      return value;
    }
    return tabs[0]?.value || value;
  }, [tabs, value]);
  const quickBasePath = location.pathname.startsWith("/recruiter")
    ? "/recruiter"
    : "/employee";
  const quickSwitchItems = [
    { value: "calendar", label: "Calendar", path: `${quickBasePath}?tab=calendar` },
    { value: "my-time", label: "My Time", path: `${quickBasePath}/my-time` },
    { value: "my-shifts", label: "View My Shift", path: `${quickBasePath}/my-shifts` },
  ];
  const quickSwitchValue = useMemo(() => {
    if (location.pathname.startsWith("/recruiter/my-shifts") || location.pathname.startsWith("/employee/my-shifts")) {
      return "my-shifts";
    }
    if (location.pathname.startsWith("/recruiter/my-time") || location.pathname.startsWith("/employee/my-time")) {
      return "my-time";
    }
    const localTabValue = searchParams.get("tab");
    if (localTabValue === "calendar") {
      return "calendar";
    }
    return null;
  }, [location.pathname, searchParams]);

  const handleChange = (_event, newValue) => {
    const config = TAB_CONFIG.find((tab) => tab.value === newValue);
    if (!config) {
      return;
    }

    if (LOCAL_TABS.has(newValue)) {
      if (onLocalTabChange) {
        onLocalTabChange(newValue);
        return;
      }
      const localBasePath = location.pathname.startsWith("/recruiter")
        ? "/recruiter/dashboard"
        : "/employee/dashboard";
      navigate(`${localBasePath}?tab=${newValue}`);
      return;
    }

    if (config.path) {
      navigate(config.path);
    }
  };

  if (isLoading) {
    return <Box sx={{ mb: 3, minHeight: 48 }} />;
  }

  return (
    <Box sx={{ mb: 3 }}>
      <Stack
        sx={{
          display: { xs: "none", md: "flex" },
          mb: 1.25,
          p: 0.75,
          borderRadius: 999,
          border: `1px solid ${alpha(theme.palette.primary.main, 0.18)}`,
          backgroundColor: alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.18 : 0.08),
        }}
        direction="row"
        spacing={1}
      >
        {quickSwitchItems.map((item) => (
          <Button
            key={item.value}
            onClick={() => navigate(item.path)}
            sx={{
              minHeight: 34,
              px: 2,
              borderRadius: 999,
              textTransform: "none",
              fontWeight: 700,
              border: "1px solid",
              borderColor:
                quickSwitchValue === item.value
                  ? alpha(theme.palette.primary.main, 0.5)
                  : alpha(theme.palette.text.primary, 0.22),
              color:
                quickSwitchValue === item.value
                  ? theme.palette.primary.main
                  : theme.palette.text.primary,
              backgroundColor:
                quickSwitchValue === item.value
                  ? alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.26 : 0.12)
                  : alpha(theme.palette.background.paper, 0.92),
              "&:hover": {
                borderColor: alpha(theme.palette.primary.main, 0.42),
                backgroundColor: alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.28 : 0.12),
              },
            }}
          >
            {item.label}
          </Button>
        ))}
      </Stack>
      <Box
        sx={{
          p: 0.75,
          borderRadius: 999,
          border: `1px solid ${alpha(theme.palette.text.primary, 0.12)}`,
          backgroundColor: alpha(theme.palette.background.paper, 0.8),
        }}
      >
        <Tabs
          value={resolvedValue}
          onChange={handleChange}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          aria-label="Employee dashboard tabs"
          sx={{
            minHeight: 40,
            "& .MuiTabs-flexContainer": {
              flexWrap: "nowrap",
              gap: 0.5,
            },
            "& .MuiTabs-indicator": {
              display: "none",
            },
            "& .MuiTabs-scrollButtons": {
              display: { xs: "flex", md: "flex" },
            },
          }}
        >
          {tabs.map((tab) => (
            <Tab
              key={tab.value}
              value={tab.value}
              label={tab.labelKey ? t(tab.labelKey) : tab.label}
              aria-label={tab.labelKey ? t(tab.labelKey) : tab.label}
              sx={{
                minHeight: 36,
                minWidth: "auto",
                px: 2.5,
                borderRadius: 999,
                textTransform: "none",
                fontWeight: 600,
                color: theme.palette.text.primary,
                border: `1px solid ${alpha(theme.palette.text.primary, 0.2)}`,
                "&.Mui-selected": {
                  color: theme.palette.primary.main,
                  borderColor: alpha(theme.palette.primary.main, 0.45),
                  backgroundColor: alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.32 : 0.14),
                  fontWeight: 700,
                },
                "&:hover": {
                  borderColor: alpha(theme.palette.primary.main, 0.4),
                  backgroundColor: alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.28 : 0.12),
                },
                "&:focus-visible": {
                  outline: `2px solid ${theme.palette.primary.main}`,
                  outlineOffset: 2,
                },
              }}
            />
          ))}
        </Tabs>
      </Box>
    </Box>
  );
};

RecruiterTabs.propTypes = {
  localTab: PropTypes.string,
  onLocalTabChange: PropTypes.func,
  allowCandidateSearch: PropTypes.bool,
  allowHrAccess: PropTypes.bool,
  isLoading: PropTypes.bool,
};

export default RecruiterTabs;
