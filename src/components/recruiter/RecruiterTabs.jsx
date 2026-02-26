import React, { useMemo } from "react";
import PropTypes from "prop-types";
import { Box, Tabs, Tab, Stack } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { isMobileAppMode } from "../../utils/runtime";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import EventAvailableOutlinedIcon from "@mui/icons-material/EventAvailableOutlined";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";

const TAB_CONFIG = [
  { value: "calendar", labelKey: "recruiter.tabs.calendar", path: "/employee/dashboard?tab=calendar" },
  { value: "availability", labelKey: "recruiter.tabs.availability", path: "/employee/dashboard?tab=availability" },
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
const MOBILE_TAB_META = {
  calendar: {
    label: "Calendar",
    icon: <CalendarMonthOutlinedIcon sx={{ fontSize: 17 }} />,
  },
  availability: {
    label: "My Availability",
    icon: <EventAvailableOutlinedIcon sx={{ fontSize: 17 }} />,
  },
  "my-time": {
    label: "My Time",
    icon: <AccessTimeOutlinedIcon sx={{ fontSize: 17 }} />,
  },
};

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

const ACCESS_STORAGE_KEY = "recruiterTabsAccess";

const getCachedAccess = () => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(ACCESS_STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data || typeof data !== "object") return null;
    return {
      isManager: Boolean(data.isManager),
      canManageOnboarding: Boolean(data.canManageOnboarding),
    };
  } catch (_err) {
    return null;
  }
};

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
  const hideTabsInMobileAppMode = isMobileAppMode();
  const cachedAccess = useMemo(() => getCachedAccess(), []);
  const hrAccess =
    allowHrAccess !== null && allowHrAccess !== undefined
      ? Boolean(allowHrAccess)
      : Boolean(allowCandidateSearch);
  const canAccessJobPostings = Boolean(
    cachedAccess?.isManager || cachedAccess?.canManageOnboarding
  );
  const tabs = useMemo(() => {
    let nextTabs = hrAccess
      ? TAB_CONFIG
      : TAB_CONFIG.filter((tab) => ["calendar", "my-time"].includes(tab.value));

    if (!canAccessJobPostings) {
      nextTabs = nextTabs.filter((tab) => tab.value !== "job-postings");
    }

    return nextTabs;
  }, [hrAccess, canAccessJobPostings]);

  const value = useMemo(() => {
    return getPathValue(location.pathname, searchParams, localTab);
  }, [location.pathname, searchParams, localTab]);
  const resolvedValue = useMemo(() => {
    if (tabs.some((tab) => tab.value === value)) {
      return value;
    }
    return tabs[0]?.value || value;
  }, [tabs, value]);

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

  if (hideTabsInMobileAppMode) {
    const mobileTabs = tabs;
    const mobileValue =
      mobileTabs.some((tab) => tab.value === resolvedValue)
        ? resolvedValue
        : mobileTabs[0]?.value || "my-time";

    return (
      <Box sx={{ mb: 2 }}>
        <Box
          sx={{
            p: 0.75,
            borderRadius: 999,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.24)}`,
            backgroundColor: alpha(theme.palette.background.paper, 0.96),
            boxShadow: `0 10px 24px ${alpha(theme.palette.common.black, 0.08)}`,
          }}
        >
          <Tabs
            value={mobileValue}
            onChange={handleChange}
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
            aria-label="Employee mobile tabs"
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
            {mobileTabs.map((tab) => (
              <Tab
                key={`mobile-${tab.value}`}
                value={tab.value}
                label={
                  <Stack direction="row" spacing={0.75} alignItems="center">
                    {MOBILE_TAB_META[tab.value]?.icon || null}
                    <span>{MOBILE_TAB_META[tab.value]?.label || (tab.labelKey ? t(tab.labelKey) : tab.label)}</span>
                  </Stack>
                }
                sx={{
                  minHeight: 38,
                  minWidth: "auto",
                  px: 2.2,
                  borderRadius: 999,
                  textTransform: "none",
                  fontWeight: 700,
                  color: alpha(theme.palette.text.primary, 0.92),
                  border: `1px solid ${alpha(theme.palette.text.primary, 0.2)}`,
                  "&.Mui-selected": {
                    color: theme.palette.primary.contrastText,
                    borderColor: alpha(theme.palette.primary.main, 0.45),
                    backgroundColor: theme.palette.primary.main,
                    fontWeight: 700,
                  },
                }}
              />
            ))}
          </Tabs>
        </Box>
      </Box>
    );
  }

  if (isLoading) {
    return <Box sx={{ mb: 3, minHeight: 48 }} />;
  }

  return (
    <Box sx={{ mb: 3 }}>
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
