import React, { useMemo, useState } from "react";
import PropTypes from "prop-types";
import {
  Box,
  Tabs,
  Tab,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  Stack,
  Typography,
  Chip,
  useMediaQuery,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";

const TAB_CONFIG = [
  { value: "calendar", labelKey: "recruiter.tabs.calendar", path: "/employee?tab=calendar" },
  { value: "availability", labelKey: "recruiter.tabs.availability", path: "/employee?tab=availability" },
  { value: "invitations", labelKey: "recruiter.tabs.invitations", path: "/recruiter/invitations" },
  { value: "candidate-forms", labelKey: "recruiter.tabs.candidateForms", path: "/recruiter/invitations?section=forms" },
  { value: "questionnaires", labelKey: "recruiter.tabs.questionnaires", path: "/recruiter/questionnaires" },
  { value: "upcoming-meetings", labelKey: "recruiter.tabs.upcomingMeetings", path: "/recruiter/upcoming-meetings" },
  { value: "my-time", labelKey: "recruiter.tabs.myTime", path: "/recruiter/my-time" },
  { value: "my-training", labelKey: "recruiter.tabs.myTraining", path: "/recruiter/my-training" },
  { value: "communications", label: "Communications", path: "/recruiter/communications" },
  { value: "my-calendar", label: "My Calendar", path: "/recruiter/my-calendar" },
  { value: "field-photos", label: "Field Photos", path: "/recruiter/field-photos" },
  { value: "candidate-search", labelKey: "recruiter.tabs.candidateSearch", path: "/employee/candidate-search" },
  { value: "public-link", labelKey: "recruiter.tabs.publicLink", path: "/recruiter/public-link" },
  { value: "job-postings", labelKey: "recruiter.tabs.jobPostings", path: "/manager/job-openings" },
];

const LOCAL_TABS = new Set(["availability", "calendar"]);

const getPathValue = (locationPathname, searchParams, fallback) => {
  if (locationPathname.startsWith("/recruiter/home") || locationPathname.startsWith("/employee/home")) {
    return "home";
  }
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
  if (locationPathname.startsWith("/recruiter/my-time") || locationPathname.startsWith("/employee/my-time")) {
    return "my-time";
  }
  if (locationPathname.startsWith("/recruiter/my-training") || locationPathname.startsWith("/employee/my-training")) {
    return "my-training";
  }
  if (locationPathname.startsWith("/recruiter/communications") || locationPathname.startsWith("/employee/communications")) {
    return "communications";
  }
  if (locationPathname.startsWith("/recruiter/my-calendar") || locationPathname.startsWith("/employee/my-calendar")) {
    return "my-calendar";
  }
  if (locationPathname.startsWith("/recruiter/field-photos") || locationPathname.startsWith("/employee/field-photos")) {
    return "field-photos";
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

const resolveTabPath = (tabValue, locationPathname) => {
  const isEmployeeWorkspace = locationPathname.startsWith("/employee");
  const basePath = isEmployeeWorkspace ? "/employee" : "/recruiter";

  switch (tabValue) {
    case "invitations":
      return `${basePath}/invitations`;
    case "candidate-forms":
      return `${basePath}/invitations?section=forms`;
    case "questionnaires":
      return `${basePath}/questionnaires`;
    case "upcoming-meetings":
      return `${basePath}/upcoming-meetings`;
    case "my-time":
      return `${basePath}/my-time`;
    case "my-training":
      return `${basePath}/my-training`;
    case "communications":
      return `${basePath}/communications`;
    case "my-calendar":
      return `${basePath}/my-calendar`;
    case "field-photos":
      return `${basePath}/field-photos`;
    case "candidate-search":
      return isEmployeeWorkspace ? "/employee/candidate-search" : "/recruiter/candidate-search";
    case "public-link":
      return `${basePath}/public-link`;
    default: {
      const config = TAB_CONFIG.find((tab) => tab.value === tabValue);
      return config?.path || "/";
    }
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
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const hrAccess =
    allowHrAccess !== null && allowHrAccess !== undefined
      ? Boolean(allowHrAccess)
      : Boolean(allowCandidateSearch);
  const tabs = useMemo(() => {
    if (hrAccess) return TAB_CONFIG;
    return TAB_CONFIG.filter((tab) =>
      ["calendar", "my-time", "my-training", "communications", "my-calendar", "field-photos"].includes(tab.value)
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
      navigate(resolveTabPath(newValue, location.pathname));
    }
  };

  if (isLoading) {
    return <Box sx={{ mb: 3, minHeight: 48 }} />;
  }

  if (isMobile) {
    const activeTab = tabs.find((tab) => tab.value === resolvedValue) || tabs[0];
    const basePath = location.pathname.startsWith("/employee") ? "/employee" : "/recruiter";
    const isHomeRoute = location.pathname.startsWith("/employee/home") || location.pathname.startsWith("/recruiter/home");
    const activeLabel = isHomeRoute
      ? "Employee Home"
      : activeTab?.labelKey
      ? t(activeTab.labelKey)
      : activeTab?.label || "";

    return (
      <>
        <Paper
          variant="outlined"
          sx={{
            mb: 2,
            p: 1,
            borderRadius: 1,
            borderColor: alpha(theme.palette.primary.main, 0.18),
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)}, ${alpha(
              theme.palette.background.paper,
              0.98
            )})`,
          }}
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <IconButton
              color="primary"
              onClick={() => setMobileMenuOpen(true)}
              sx={{
                width: 42,
                height: 42,
                border: `1px solid ${alpha(theme.palette.primary.main, 0.18)}`,
                bgcolor: alpha(theme.palette.background.paper, 0.9),
              }}
              aria-label="Open employee workspace menu"
            >
              <MenuIcon />
            </IconButton>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="subtitle2" fontWeight={800}>
                Employee Menu
              </Typography>
              <Chip
                size="small"
                label={activeLabel}
                sx={{
                  mt: 0.35,
                  fontWeight: 700,
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  color: theme.palette.primary.main,
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                }}
              />
            </Box>
          </Stack>
        </Paper>

        <Drawer
          anchor="left"
          open={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
          PaperProps={{
            sx: {
              width: 280,
              p: 1.5,
              background: theme.palette.background.paper,
            },
          }}
        >
          <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
            <Typography variant="subtitle1" fontWeight={800}>
              Employee Workspace
            </Typography>
            <IconButton onClick={() => setMobileMenuOpen(false)} aria-label="Close employee workspace menu">
              <CloseIcon />
            </IconButton>
          </Stack>
          <List disablePadding>
            <ListItemButton
              selected={isHomeRoute}
              onClick={() => {
                navigate(`${basePath}/home`);
                setMobileMenuOpen(false);
              }}
              sx={{
                borderRadius: 1,
                mb: 1,
                border: `1px solid ${
                  isHomeRoute ? alpha(theme.palette.primary.main, 0.35) : alpha(theme.palette.divider, 0.9)
                }`,
                backgroundColor: isHomeRoute
                  ? alpha(theme.palette.primary.main, 0.1)
                  : alpha(theme.palette.background.paper, 0.85),
              }}
            >
              <ListItemText
                primary="Employee Home"
                primaryTypographyProps={{
                  fontWeight: isHomeRoute ? 800 : 600,
                  color: isHomeRoute ? theme.palette.primary.main : theme.palette.text.primary,
                }}
              />
            </ListItemButton>
            {tabs.map((tab) => {
              const label = tab.labelKey ? t(tab.labelKey) : tab.label;
              const selected = resolvedValue === tab.value;
              return (
                <ListItemButton
                  key={tab.value}
                  selected={selected}
                  onClick={(event) => {
                    handleChange(event, tab.value);
                    setMobileMenuOpen(false);
                  }}
                  sx={{
                    borderRadius: 1,
                    mb: 0.5,
                    border: `1px solid ${selected ? alpha(theme.palette.primary.main, 0.35) : alpha(theme.palette.divider, 0.9)}`,
                    backgroundColor: selected
                      ? alpha(theme.palette.primary.main, 0.1)
                      : alpha(theme.palette.background.paper, 0.85),
                  }}
                >
                  <ListItemText
                    primary={label}
                    primaryTypographyProps={{
                      fontWeight: selected ? 800 : 600,
                      color: selected ? theme.palette.primary.main : theme.palette.text.primary,
                    }}
                  />
                </ListItemButton>
              );
            })}
          </List>
        </Drawer>
      </>
    );
  }

  return (
    <Box
      sx={{
        mb: 3,
        p: 0.75,
        borderRadius: "6px",
        border: `1px solid ${alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.28 : 0.14)}`,
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.16 : 0.06)}, ${alpha(
          theme.palette.background.paper,
          theme.palette.mode === "dark" ? 0.9 : 0.96
        )})`,
        boxShadow: `0 12px 30px ${alpha(theme.palette.common.black, theme.palette.mode === "dark" ? 0.22 : 0.05)}`,
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
            borderRadius: "6px",
            textTransform: "none",
            fontWeight: 600,
            color: theme.palette.text.primary,
            border: `1px solid ${alpha(theme.palette.text.primary, 0.14)}`,
            backgroundColor: alpha(theme.palette.background.paper, theme.palette.mode === "dark" ? 0.22 : 0.58),
            "&.Mui-selected": {
              color: theme.palette.mode === "dark" ? theme.palette.primary.light : theme.palette.primary.dark || theme.palette.primary.main,
              borderColor: alpha(theme.palette.primary.main, 0.5),
              backgroundColor: alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.28 : 0.13),
              boxShadow: `inset 0 -2px 0 ${alpha(theme.palette.primary.main, 0.75)}`,
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
