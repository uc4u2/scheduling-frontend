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
import PeopleOutlineIcon from "@mui/icons-material/PeopleOutline";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import GroupWorkOutlinedIcon from "@mui/icons-material/GroupWorkOutlined";
import SecurityOutlinedIcon from "@mui/icons-material/SecurityOutlined";

const normalizeItems = (items) => (Array.isArray(items) ? items : []);

const COPY = {
  title: "Employee Access Guide",
  subtitle: "Use this to decide which access toggles to enable for each team member.",
  sections: {
    quickSummary: {
      title: "Quick summary",
      items: [
        "Managers have full access to payroll, scheduling, settings, and the service catalog.",
        "Employees are limited by the toggles you enable below.",
        "HR onboarding access does not grant service, product, or add-on management.",
      ],
    },
    roles: {
      title: "Role basics",
      items: [
        "Employee: core staff tools (schedule, bookings, time clock).",
        "Manager: full admin access across settings, payroll, and catalog.",
      ],
    },
    toggles: {
      title: "Access toggles",
      items: [
        "HR onboarding access: manage onboarding forms and candidate profiles.",
        "Limited HR onboarding: view HR tabs and read candidate profiles only.",
        "Supervisor access: shift, time tracking, leaves, swap approvals, master calendar.",
        "Collect payments (self only): allows booking checkout for the employee's own clients.",
        "Payroll access: payroll runs, tax forms, ROE, T4/W-2, invoices.",
      ],
    },
    availability: {
      title: "Availability & slots",
      items: [
        "Employees can edit their own availability only when HR onboarding access is enabled and workspace settings allow it.",
        "Team availability views and assigning slots for other employees require manager access.",
      ],
    },
    examples: {
      title: "Common setups",
      items: [
        "Front desk coordinator: Employee + HR onboarding (no payroll).",
        "Team lead: Employee + Supervisor access.",
        "Payroll admin: Employee + Payroll access.",
      ],
    },
  },
  actions: {
    close: "Close guide",
  },
};

const Section = ({ title, icon, items }) => (
  <Box sx={{ mb: 3 }}>
    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
      {icon}
      <Typography variant="subtitle1" fontWeight={600}>
        {title}
      </Typography>
    </Stack>
    <List dense sx={{ pt: 0 }}>
      {normalizeItems(items).map((item, index) => (
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

export default function EmployeeManagementHelpDrawer({ open, onClose, anchor, width }) {
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
          <Typography variant="h5">{COPY.title}</Typography>
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {COPY.subtitle}
        </Typography>

        <Section
          title={COPY.sections.quickSummary.title}
          icon={<PeopleOutlineIcon color="primary" />}
          items={COPY.sections.quickSummary.items}
        />
        <Section
          title={COPY.sections.roles.title}
          icon={<ManageAccountsIcon color="primary" />}
          items={COPY.sections.roles.items}
        />
        <Section
          title={COPY.sections.toggles.title}
          icon={<SecurityOutlinedIcon color="primary" />}
          items={COPY.sections.toggles.items}
        />
        <Section
          title={COPY.sections.availability.title}
          icon={<GroupWorkOutlinedIcon color="primary" />}
          items={COPY.sections.availability.items}
        />
        <Section
          title={COPY.sections.examples.title}
          icon={<PeopleOutlineIcon color="primary" />}
          items={COPY.sections.examples.items}
        />

        <Divider sx={{ my: 2 }} />
        <Stack direction="row" justifyContent="flex-end">
          <Button variant="outlined" onClick={onClose}>
            {COPY.actions.close}
          </Button>
        </Stack>
      </Box>
    </Drawer>
  );
}
