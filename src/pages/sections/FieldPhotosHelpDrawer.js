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
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import SecurityOutlinedIcon from "@mui/icons-material/SecurityOutlined";
import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";
import StorageOutlinedIcon from "@mui/icons-material/StorageOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import TaskAltIcon from "@mui/icons-material/TaskAlt";

const SECTIONS = [
  {
    title: "What Field Photos is for",
    icon: <PhotoCameraIcon color="primary" />,
    items: [
      "Employees upload proof-of-work photos from their shift cards in My Time.",
      "Photos are grouped by employee and shift, so one shift session stays easy to review.",
      "Use the gallery to open a larger preview and move through all photos in the session.",
    ],
  },
  {
    title: "Security status",
    icon: <SecurityOutlinedIcon color="primary" />,
    items: [
      "Security check in progress means the photo is uploaded but not available to open yet.",
      "Ready means the photo passed the security check and can be previewed or downloaded.",
      "Blocked means the file was stopped by security scanning. Ask the employee to upload another photo.",
    ],
  },
  {
    title: "Finding photos faster",
    icon: <FilterAltOutlinedIcon color="primary" />,
    items: [
      "Filter by department, employee, date period, readiness, location, or archived status.",
      "Photos opened from a shift are automatically filtered to that shift. Use Clear to return to all photos.",
      "Open shift takes you back to the related shift context when you need scheduling details.",
    ],
  },
  {
    title: "Storage and billing",
    icon: <StorageOutlinedIcon color="primary" />,
    items: [
      "Field Photos includes 5 GB of storage and photos are kept for 90 days.",
      "If storage gets close to full, use Add 10 GB to expand storage from the manager billing flow.",
      "If the add-on is cancelled or unpaid, employees cannot upload new photos. Existing photos stay read-only during the grace period.",
    ],
  },
  {
    title: "Archive and delete",
    icon: <DeleteOutlineIcon color="primary" />,
    items: [
      "Archive hides a photo from the active view but keeps it available in the Archived filter.",
      "Delete removes the photo row and stored image.",
      "Employees can delete their own uploaded photos if they need to correct a mistake and upload again.",
    ],
  },
];

const Section = ({ title, icon, items }) => (
  <Box sx={{ mb: 2.5 }}>
    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
      {icon}
      <Typography variant="subtitle1" sx={{ fontWeight: 900 }}>
        {title}
      </Typography>
    </Stack>
    <List dense sx={{ py: 0 }}>
      {items.map((item) => (
        <ListItem key={item} alignItems="flex-start" sx={{ px: 0, py: 0.35 }}>
          <ListItemIcon sx={{ minWidth: 28, mt: 0.35 }}>
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

export default function FieldPhotosHelpDrawer({ open, onClose }) {
  const isSmall = useMediaQuery("(max-width:900px)");

  return (
    <Drawer
      anchor={isSmall ? "bottom" : "right"}
      open={open}
      onClose={onClose}
      ModalProps={{ keepMounted: true }}
      PaperProps={{
        sx: {
          width: isSmall ? "100%" : 460,
          maxWidth: "100vw",
          maxHeight: isSmall ? "88vh" : "100vh",
        },
      }}
    >
      <Box sx={{ p: 3 }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
          <HelpOutlineIcon />
          <Typography variant="h5" sx={{ fontWeight: 950 }}>
            Field Photos guide
          </Typography>
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Use this page to review shift-linked proof photos, check security readiness, and manage storage without leaving the manager dashboard.
        </Typography>

        {SECTIONS.map((section) => (
          <Section key={section.title} {...section} />
        ))}

        <Divider sx={{ my: 2 }} />
        <Stack direction="row" justifyContent="flex-end">
          <Button variant="outlined" onClick={onClose}>
            Close guide
          </Button>
        </Stack>
      </Box>
    </Drawer>
  );
}
