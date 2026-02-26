import React, { useMemo } from "react";
import {
  Drawer,
  Box,
  Typography,
  List,
  ListItemButton,
  ListItemText,
  Divider,
} from "@mui/material";
import useRecruiterTabsAccess from "../recruiter/useRecruiterTabsAccess";

const workspaceItems = [
  { label: "Manager Dashboard", to: "/manager/dashboard" },
  { label: "Employee Dashboard", to: "/employee/my-time" },
];

const managerItems = [
  { label: "Employees", to: "/manager/employee-profiles" },
  { label: "Services", to: "/manager/service-management" },
  { label: "Payroll", to: "/manager/payroll" },
  { label: "Support", to: "/manager/support-consent" },
  { label: "Settings", to: "/admin/CompanyProfile" },
  { label: "About", to: "/app/about" },
];

const employeeItems = [
  { label: "Calendar", to: "/employee/dashboard?tab=calendar" },
  { label: "My Time", to: "/recruiter/my-time" },
  { label: "My Availability", to: "/employee/dashboard?tab=availability", requiresHrAccess: true },
  { label: "Invitations", to: "/recruiter/invitations", requiresHrAccess: true },
  { label: "Candidate Forms", to: "/recruiter/invitations?section=forms", requiresHrAccess: true },
  { label: "Questionnaires", to: "/recruiter/questionnaires", requiresHrAccess: true },
  { label: "Upcoming Meetings", to: "/recruiter/upcoming-meetings", requiresHrAccess: true },
  { label: "Candidate Search", to: "/employee/candidate-search", requiresHrAccess: true },
  { label: "Public Booking Link", to: "/recruiter/public-link", requiresHrAccess: true },
  { label: "Job Postings", to: "/manager/job-openings", requiresOnboardingManager: true },
  { label: "About", to: "/app/about" },
];

const MobileDrawer = ({ open, onClose, navigate }) => {
  const {
    isManager,
    allowHrAccess,
    canManageOnboarding,
  } = useRecruiterTabsAccess();

  const role =
    typeof window !== "undefined"
      ? (localStorage.getItem("role") || "").toLowerCase()
      : "";
  const isEmployeeRole = role === "employee" || role === "recruiter";
  const items = useMemo(() => {
    if (!isEmployeeRole) {
      return managerItems;
    }

    return employeeItems.filter((item) => {
      if (item.requiresOnboardingManager) {
        return Boolean(isManager || canManageOnboarding);
      }
      if (item.requiresHrAccess) {
        return Boolean(allowHrAccess);
      }
      return true;
    });
  }, [allowHrAccess, canManageOnboarding, isEmployeeRole, isManager]);

  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box sx={{ width: 280, p: 2 }} role="presentation">
        <Typography variant="h6" sx={{ mb: 1 }}>
          More
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Quick access to additional modules
        </Typography>
        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>
          Switch Workspace
        </Typography>
        <List disablePadding sx={{ mb: 1.5 }}>
          {workspaceItems.map((item) => (
            <ListItemButton
              key={item.to}
              onClick={() => {
                onClose();
                navigate(item.to);
              }}
            >
              <ListItemText primary={item.label} />
            </ListItemButton>
          ))}
        </List>
        <Divider sx={{ mb: 1 }} />
        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>
          Modules
        </Typography>
        <List disablePadding>
          {items.map((item) => (
            <ListItemButton
              key={item.to}
              onClick={() => {
                onClose();
                navigate(item.to);
              }}
            >
              <ListItemText primary={item.label} />
            </ListItemButton>
          ))}
        </List>
      </Box>
    </Drawer>
  );
};

export default MobileDrawer;
