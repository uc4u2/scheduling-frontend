import { useMemo } from "react";
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
import { useTranslation } from "react-i18next";

const normalizeItems = (items) => (Array.isArray(items) ? items : []);

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
  const { t, i18n } = useTranslation();
  const isSmall = useMediaQuery("(max-width:900px)");
  const drawerAnchor = anchor || (isSmall ? "bottom" : "right");
  const drawerWidth = width ?? (isSmall ? "100%" : 420);
  const fallbackT = useMemo(() => i18n.getFixedT("en"), [i18n]);
  const safeT = (key, options) => {
    const value = t(key, options);
    return value === key ? fallbackT(key, options) : value;
  };

  const quickSummary = useMemo(
    () => safeT("management.employeeHelp.quickSummary.items", { returnObjects: true }) || [],
    [safeT]
  );
  const roles = useMemo(
    () => safeT("management.employeeHelp.roles.items", { returnObjects: true }) || [],
    [safeT]
  );
  const toggles = useMemo(
    () => safeT("management.employeeHelp.toggles.items", { returnObjects: true }) || [],
    [safeT]
  );
  const availability = useMemo(
    () => safeT("management.employeeHelp.availability.items", { returnObjects: true }) || [],
    [safeT]
  );
  const examples = useMemo(
    () => safeT("management.employeeHelp.examples.items", { returnObjects: true }) || [],
    [safeT]
  );

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
          <Typography variant="h5">{safeT("management.employeeHelp.title")}</Typography>
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {safeT("management.employeeHelp.subtitle")}
        </Typography>

        <Section
          title={safeT("management.employeeHelp.quickSummary.title")}
          icon={<PeopleOutlineIcon color="primary" />}
          items={quickSummary}
        />
        <Section
          title={safeT("management.employeeHelp.roles.title")}
          icon={<ManageAccountsIcon color="primary" />}
          items={roles}
        />
        <Section
          title={safeT("management.employeeHelp.toggles.title")}
          icon={<SecurityOutlinedIcon color="primary" />}
          items={toggles}
        />
        <Section
          title={safeT("management.employeeHelp.availability.title")}
          icon={<GroupWorkOutlinedIcon color="primary" />}
          items={availability}
        />
        <Section
          title={safeT("management.employeeHelp.examples.title")}
          icon={<PeopleOutlineIcon color="primary" />}
          items={examples}
        />

        <Divider sx={{ my: 2 }} />
        <Stack direction="row" justifyContent="flex-end">
          <Button variant="outlined" onClick={onClose}>
            {safeT("management.employeeHelp.actions.close")}
          </Button>
        </Stack>
      </Box>
    </Drawer>
  );
}
