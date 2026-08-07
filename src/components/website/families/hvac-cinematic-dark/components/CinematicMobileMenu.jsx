import React from "react";
import {
  Box,
  Button,
  Divider,
  Drawer,
  Stack,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import IconButton from "@mui/material/IconButton";

export default function CinematicMobileMenu({
  open,
  onClose,
  navEntries = [],
  tokens,
}) {
  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box
        sx={{
          width: 320,
          minHeight: "100%",
          bgcolor: "#071019",
          color: tokens.colors.text,
          px: 3,
          py: 2,
          backgroundImage: tokens.graphics.grid,
          backgroundSize: tokens.graphics.gridSize,
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography
            sx={{
              fontFamily: tokens.typography.headingFont,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              fontWeight: 800,
            }}
          >
            Menu
          </Typography>
          <IconButton onClick={onClose} sx={{ color: tokens.colors.text }}>
            <CloseIcon />
          </IconButton>
        </Stack>
        <Divider sx={{ my: 2, borderColor: tokens.colors.line }} />
        <Stack spacing={1.1}>
          {navEntries.map((entry) => (
            <Button
              key={entry.key}
              {...(entry.linkProps || {})}
              onClick={(event) => {
                entry.onClick?.(event);
                onClose?.();
              }}
              sx={{
                justifyContent: "space-between",
                px: 0,
                py: 1.25,
                color: entry.active ? tokens.colors.text : tokens.colors.textSoft,
                fontFamily: tokens.typography.headingFont,
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                borderBottom: `1px solid ${tokens.colors.line}`,
              }}
            >
              {entry.label}
            </Button>
          ))}
        </Stack>
      </Box>
    </Drawer>
  );
}
