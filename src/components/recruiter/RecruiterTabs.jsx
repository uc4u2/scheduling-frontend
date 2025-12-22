import React, { useMemo } from "react";
import PropTypes from "prop-types";
import { Box, Tabs, Tab } from "@mui/material";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";

const TAB_CONFIG = [
  { value: "calendar", label: "Calendar", path: "/employee?tab=calendar" },
  { value: "availability", label: "My Availability", path: "/employee?tab=availability" },
  { value: "invitations", label: "Invitations", path: "/recruiter/invitations" },
  { value: "candidate-forms", label: "Candidate Forms", path: "/recruiter/invitations?section=forms" },
  { value: "questionnaires", label: "Questionnaires", path: "/recruiter/questionnaires" },
  { value: "upcoming-meetings", label: "Upcoming Meetings", path: "/recruiter/upcoming-meetings" },
  { value: "my-time", label: "My Time", path: "/recruiter/my-time" },
  { value: "view-my-shift", label: "View My Shift", path: "/recruiter/my-shifts" },
  { value: "candidate-search", label: "Candidate Search", path: "/employee/candidate-search" },
  { value: "public-link", label: "Public Booking Link", path: "/recruiter/public-link" },
  { value: "job-postings", label: "Job Postings", path: "/manager/job-openings" },
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
  if (locationPathname.startsWith("/recruiter/my-shifts")) {
    return "view-my-shift";
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
  const [searchParams] = useSearchParams();
  const hrAccess =
    allowHrAccess !== null && allowHrAccess !== undefined
      ? Boolean(allowHrAccess)
      : Boolean(allowCandidateSearch);
  const tabs = useMemo(() => {
    if (hrAccess) return TAB_CONFIG;
    return TAB_CONFIG.filter((tab) =>
      ["calendar", "my-time", "view-my-shift"].includes(tab.value)
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
      if (config.path) {
        navigate(config.path);
      }
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
    <Tabs
      value={resolvedValue}
      onChange={handleChange}
      variant="scrollable"
      scrollButtons="auto"
      sx={{ mb: 3 }}
    >
      {tabs.map((tab) => (
        <Tab key={tab.value} value={tab.value} label={tab.label} />
      ))}
    </Tabs>
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
