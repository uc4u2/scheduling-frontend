import React from "react";
import {
  Drawer,
  Box,
  Typography,
  List,
  ListItemButton,
  ListItemText,
  Divider,
} from "@mui/material";

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
  { label: "My Time", to: "/employee/my-time" },
  { label: "My Meetings", to: "/recruiter/upcoming-meetings" },
  { label: "Public Link", to: "/employee/public-link" },
  { label: "About", to: "/app/about" },
];

const MobileDrawer = ({ open, onClose, navigate }) => {
  const role =
    typeof window !== "undefined"
      ? (localStorage.getItem("role") || "").toLowerCase()
      : "";
  const items = role === "employee" || role === "recruiter" ? employeeItems : managerItems;

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
