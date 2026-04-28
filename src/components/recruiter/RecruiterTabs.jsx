import React, { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import {
  Box,
  Tabs,
  Tab,
  Button,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Menu,
  MenuItem,
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
import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import ArticleOutlinedIcon from "@mui/icons-material/ArticleOutlined";

const TAB_CONFIG = [
  { value: "calendar", labelKey: "recruiter.tabs.calendar", path: "/employee?tab=calendar", primary: true },
  { value: "availability", label: "Availability", path: "/employee?tab=availability", primary: true },
  { value: "my-time", labelKey: "recruiter.tabs.myTime", path: "/recruiter/my-time", primary: true },
  { value: "work-orders", label: "My Work Orders", path: "/recruiter/work-orders", primary: true, mobileIcon: <AssignmentOutlinedIcon fontSize="small" /> },
  { value: "field-reports", label: "My Field Reports", path: "/recruiter/field-reports", primary: true, mobileIcon: <ArticleOutlinedIcon fontSize="small" /> },
  { value: "my-training", label: "Training", path: "/recruiter/my-training", primary: true },
  { value: "communications", label: "Communications", path: "/recruiter/communications", primary: true },
  { value: "field-photos", label: "Field Photos", path: "/recruiter/field-photos", primary: true },
  { value: "invitations", labelKey: "recruiter.tabs.invitations", path: "/recruiter/invitations", hrOnly: true, secondary: true },
  { value: "upcoming-meetings", label: "Meetings", path: "/recruiter/upcoming-meetings", hrOnly: true, secondary: true },
  { value: "my-calendar", label: "Google Calendar", path: "/recruiter/my-calendar", secondary: true },
  { value: "candidate-search", labelKey: "recruiter.tabs.candidateSearch", path: "/employee/candidate-search", hrOnly: true, secondary: true },
  { value: "public-link", label: "Booking Link", path: "/recruiter/public-link", hrOnly: true, secondary: true },
  { value: "job-postings", labelKey: "recruiter.tabs.jobPostings", path: "/manager/job-openings", hrOnly: true, secondary: true },
];

const LOCAL_TABS = new Set(["availability", "calendar"]);

const getPathValue = (locationPathname, searchParams, fallback) => {
  if (locationPathname.startsWith("/recruiter/home") || locationPathname.startsWith("/employee/home")) {
    return "home";
  }
  if (locationPathname.startsWith("/recruiter/invitations")) {
    return "invitations";
  }
  if (locationPathname.startsWith("/recruiter/upcoming-meetings")) {
    return "upcoming-meetings";
  }
  if (locationPathname.startsWith("/recruiter/my-time") || locationPathname.startsWith("/employee/my-time")) {
    return "my-time";
  }
  if (locationPathname.startsWith("/recruiter/work-orders") || locationPathname.startsWith("/employee/work-orders")) {
    return "work-orders";
  }
  if (locationPathname.startsWith("/recruiter/field-reports") || locationPathname.startsWith("/employee/field-reports")) {
    return "field-reports";
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

const resolveTabPath = (tabValue, locationPathname) => {
  const isEmployeeWorkspace = locationPathname.startsWith("/employee");
  const basePath = isEmployeeWorkspace ? "/employee" : "/recruiter";

  switch (tabValue) {
    case "invitations":
      return `${basePath}/invitations`;
    case "upcoming-meetings":
      return `${basePath}/upcoming-meetings`;
    case "my-time":
      return `${basePath}/my-time`;
    case "work-orders":
      return `${basePath}/work-orders`;
    case "field-reports":
      return `${basePath}/field-reports`;
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
  const [moreAnchorEl, setMoreAnchorEl] = useState(null);
  const hrAccess =
    allowHrAccess !== null && allowHrAccess !== undefined
      ? Boolean(allowHrAccess)
      : Boolean(allowCandidateSearch);
  const tabs = useMemo(() => {
    return TAB_CONFIG.filter((tab) => !tab.hrOnly || hrAccess);
  }, [hrAccess]);
  const primaryTabs = useMemo(() => tabs.filter((tab) => tab.primary), [tabs]);
  const secondaryTabs = useMemo(() => tabs.filter((tab) => tab.secondary), [tabs]);

  const value = useMemo(() => {
    return getPathValue(location.pathname, searchParams, localTab);
  }, [location.pathname, searchParams, localTab]);
  const resolvedValue = useMemo(() => {
    if (tabs.some((tab) => tab.value === value)) {
      return value;
    }
    return tabs[0]?.value || value;
  }, [tabs, value]);
  const selectedSecondaryTab = useMemo(
    () => secondaryTabs.find((tab) => tab.value === value) || null,
    [secondaryTabs, value]
  );
  const selectedPrimaryValue = useMemo(() => {
    if (primaryTabs.some((tab) => tab.value === value)) {
      return value;
    }
    return false;
  }, [primaryTabs, value]);

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

  useEffect(() => {
    const isKnownTab = TAB_CONFIG.some((tab) => tab.value === value);
    const isAllowedTab = tabs.some((tab) => tab.value === value);
    if (!isLoading && isKnownTab && !isAllowedTab) {
      const localBasePath = location.pathname.startsWith("/recruiter") ? "/recruiter/dashboard" : "/employee/dashboard";
      navigate(`${localBasePath}?tab=calendar`, { replace: true });
    }
  }, [isLoading, location.pathname, navigate, tabs, value]);

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
      <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
        <Tabs
          value={selectedPrimaryValue}
          onChange={handleChange}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          aria-label="Employee dashboard tabs"
          sx={{
            minHeight: 40,
            flex: 1,
            minWidth: 0,
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
          {primaryTabs.map((tab) => (
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
                  color:
                    theme.palette.mode === "dark" ? theme.palette.primary.light : theme.palette.primary.dark || theme.palette.primary.main,
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
        {secondaryTabs.length > 0 ? (
          <>
            <Button
              onClick={(event) => setMoreAnchorEl(event.currentTarget)}
              variant={selectedSecondaryTab ? "contained" : "outlined"}
              color="primary"
              sx={{
                minWidth: 88,
                alignSelf: "stretch",
                borderRadius: "6px",
                textTransform: "none",
                fontWeight: selectedSecondaryTab ? 700 : 600,
                whiteSpace: "nowrap",
              }}
            >
              {selectedSecondaryTab ? `More: ${selectedSecondaryTab.labelKey ? t(selectedSecondaryTab.labelKey) : selectedSecondaryTab.label}` : "More"}
            </Button>
            <Menu
              anchorEl={moreAnchorEl}
              open={Boolean(moreAnchorEl)}
              onClose={() => setMoreAnchorEl(null)}
              keepMounted
              anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
              transformOrigin={{ vertical: "top", horizontal: "right" }}
            >
              {secondaryTabs.map((tab) => {
                const label = tab.labelKey ? t(tab.labelKey) : tab.label;
                const selected = value === tab.value;
                return (
                  <MenuItem
                    key={tab.value}
                    selected={selected}
                    onClick={(event) => {
                      handleChange(event, tab.value);
                      setMoreAnchorEl(null);
                    }}
                    sx={{ minWidth: 220, fontWeight: selected ? 700 : 500 }}
                  >
                    {label}
                  </MenuItem>
                );
              })}
            </Menu>
          </>
        ) : null}
      </Stack>
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
