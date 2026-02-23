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

const managerItems = [
  { label: "Employees", to: "/manager/employee-profiles" },
  { label: "Services", to: "/manager/service-management" },
  { label: "Payroll", to: "/manager/payroll" },
  { label: "Support", to: "/manager/support-consent" },
  { label: "Settings", to: "/admin/CompanyProfile" },
];

const employeeItems = [
  { label: "Employees", to: "/employee" },
  { label: "Services", to: "/employee/public-link" },
  { label: "Payroll", to: "/employee/my-time" },
  { label: "Support", to: "/client/support" },
  { label: "Settings", to: "/employee" },
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
        <Divider sx={{ mb: 1 }} />
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
