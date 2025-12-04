import React, { useMemo } from "react";
import PropTypes from "prop-types";
import { Tabs, Tab } from "@mui/material";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";

const TAB_CONFIG = [
  { value: "availability", label: "My Availability", path: "/recruiter?tab=availability" },
  { value: "invitations", label: "Invitations", path: "/recruiter/invitations" },
  { value: "candidate-forms", label: "Candidate Forms", path: "/recruiter/invitations?section=forms" },
  { value: "questionnaires", label: "Questionnaires", path: "/recruiter/questionnaires" },
  { value: "upcoming-meetings", label: "Upcoming Meetings", path: "/recruiter/upcoming-meetings" },
  { value: "my-time", label: "My Time", path: "/recruiter/my-time" },
  { value: "view-my-shift", label: "View My Shift", path: "/recruiter/my-shifts" },
  { value: "public-link", label: "Public Booking Link", path: "/recruiter/public-link" },
];

const LOCAL_TABS = new Set(["availability"]);

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
  return fallback;
};

const RecruiterTabs = ({ localTab = "availability", onLocalTabChange }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const value = useMemo(() => {
    return getPathValue(location.pathname, searchParams, localTab);
  }, [location.pathname, searchParams, localTab]);

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

  return (
    <Tabs
      value={value}
      onChange={handleChange}
      variant="scrollable"
      scrollButtons="auto"
      sx={{ mb: 3 }}
    >
      {TAB_CONFIG.map((tab) => (
        <Tab key={tab.value} value={tab.value} label={tab.label} />
      ))}
    </Tabs>
  );
};

RecruiterTabs.propTypes = {
  localTab: PropTypes.string,
  onLocalTabChange: PropTypes.func,
};

export default RecruiterTabs;
