import React from "react";
import {
  Box,
  Divider,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
} from "@mui/material";
import { getDrawerItems } from "./navConfig";

export default function MoreDrawer({ open, onClose, role, onNavigate }) {
  const items = getDrawerItems(role);

  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box sx={{ width: 320, p: 2 }}>
        <Typography variant="h6" fontWeight={700}>More</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Schedulaa Staff {role === "manager" ? "Manager" : "Employee"}
        </Typography>
        <Divider sx={{ my: 2 }} />
        <List>
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <ListItemButton
                key={item.to}
                onClick={() => {
                  onNavigate(item.to);
                  onClose();
                }}
              >
                <ListItemIcon><Icon fontSize="small" /></ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItemButton>
            );
          })}
        </List>
      </Box>
    </Drawer>
  );
}
