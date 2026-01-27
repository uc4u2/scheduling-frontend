import React from "react";
import {
  Box,
  Button,
  Divider,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Stack,
  Typography,
  useMediaQuery,
} from "@mui/material";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import SecurityOutlinedIcon from "@mui/icons-material/SecurityOutlined";
import GroupWorkOutlinedIcon from "@mui/icons-material/GroupWorkOutlined";
import { Link as RouterLink } from "react-router-dom";

const Section = ({ title, icon, items }) => (
  <Box sx={{ mb: 3 }}>
    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
      {icon}
      <Typography variant="subtitle1" fontWeight={600}>
        {title}
      </Typography>
    </Stack>
    <List dense sx={{ pt: 0 }}>
      {items.map((item, index) => (
        <ListItem key={`${title}-${index}`} alignItems="flex-start" sx={{ py: 0.4 }}>
          <ListItemIcon sx={{ minWidth: 28, mt: 0.4 }}>
            <TaskAltIcon fontSize="small" color="primary" />
          </ListItemIcon>
          <ListItemText
            primary={item}
            primaryTypographyProps={{ variant: "body2", color: "text.secondary" }}
          />
        </ListItem>
      ))}
    </List>
  </Box>
);

export default function AddMemberHelpDrawer({ open, onClose, anchor, width }) {
  const isSmall = useMediaQuery("(max-width:900px)");
  const drawerAnchor = anchor || (isSmall ? "bottom" : "right");
  const drawerWidth = width ?? (isSmall ? "100%" : 420);

  return (
    <Drawer
      anchor={drawerAnchor}
      open={open}
      onClose={onClose}
      ModalProps={{ keepMounted: true }}
      sx={{
        zIndex: (theme) => theme.zIndex.modal + 2000,
        "& .MuiDrawer-paper": { zIndex: "inherit" },
      }}
      PaperProps={{
        sx: {
          width: drawerWidth,
          maxWidth: "100vw",
          p: 0,
          zIndex: "inherit",
        },
      }}
    >
      <Box sx={{ p: 3 }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
          <HelpOutlineIcon />
          <Typography variant="h5">Add Team Member Help</Typography>
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Fill in this form to create a staff account. Permissions are set later in Employee Management.
        </Typography>

        <Section
          title="Before you submit"
          icon={<ManageAccountsIcon color="primary" />}
          items={[
            "Use a work email the staff member can access.",
            "Pick Manager only if they need full admin access.",
            "Timezone matters for availability and appointment times.",
          ]}
        />

        <Section
          title="Permissions after creation"
          icon={<SecurityOutlinedIcon color="primary" />}
          items={[
            "HR onboarding access lets someone manage onboarding forms and candidate profiles.",
            "Supervisor access gives shift and availability tools.",
            "Collect payments (self only) lets an employee process payments for their own bookings.",
            "Payroll access opens payroll and tax tools.",
          ]}
        />

        <Section
          title="Availability & bookings"
          icon={<GroupWorkOutlinedIcon color="primary" />}
          items={[
            "Employees can edit their own availability only if HR onboarding access is enabled and workspace settings allow edits.",
            "Team availability and assigning slots to others require manager access.",
          ]}
        />

        <Divider sx={{ my: 2 }} />
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1}
          justifyContent="space-between"
          alignItems={{ xs: "stretch", sm: "center" }}
        >
          <Button variant="outlined" onClick={onClose}>
            Close guide
          </Button>
          <Button
            variant="contained"
            component={RouterLink}
            to="/manager/employee-management"
          >
            Go to Employee Management
          </Button>
        </Stack>
      </Box>
    </Drawer>
  );
}
