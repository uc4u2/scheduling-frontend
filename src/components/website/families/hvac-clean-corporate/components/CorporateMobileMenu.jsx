import React from "react";
import { Box, Button, Divider, Drawer, IconButton, Stack, Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

export default function CorporateMobileMenu({ open, onClose, navEntries = [], tokens }) {
  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box
        sx={{
          width: 340,
          minHeight: "100%",
          bgcolor: tokens.colors.bgAlt,
          color: tokens.colors.text,
          px: 3,
          py: 2,
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(244,248,251,1) 100%)",
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography sx={{ fontFamily: tokens.typography.headingFont, fontWeight: 800 }}>
            Navigation
          </Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Stack>
        <Divider sx={{ my: 2, borderColor: tokens.colors.line }} />
        <Stack spacing={1}>
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
                py: 1.2,
                color: entry.active ? tokens.colors.navy : tokens.colors.textSoft,
                fontFamily: tokens.typography.headingFont,
                fontWeight: 700,
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
