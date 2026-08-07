import React from "react";
import { Box, Button, Divider, Drawer, Stack, Typography } from "@mui/material";
import ArrowOutwardIcon from "@mui/icons-material/ArrowOutward";
import { FamilyLinkButton } from "../../hvac-shared/runtime";

export default function ComfortMobileMenu({
  open,
  onClose,
  entries = [],
  brandName,
  ctaHref,
  ctaLabel,
  tokens,
}) {
  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box sx={{ width: 320, height: "100%", bgcolor: tokens.colors.bg, color: tokens.colors.text, p: 2 }}>
        <Typography sx={{ fontFamily: tokens.typography.headingFont, fontWeight: 700, fontSize: "1.35rem" }}>{brandName}</Typography>
        <Divider sx={{ my: 2, borderColor: tokens.colors.line }} />
        <Stack spacing={1}>
          {entries.map((entry) => (
            <Button key={entry.key} {...(entry.linkProps || {})} onClick={entry.onClick || onClose} sx={{ justifyContent: "flex-start", color: tokens.colors.text, borderRadius: 99, bgcolor: "#fff", border: `1px solid ${tokens.colors.line}`, py: 1.1, fontWeight: 700 }}>
              {entry.label}
            </Button>
          ))}
        </Stack>
        <FamilyLinkButton href={ctaHref} label={ctaLabel} endIcon={<ArrowOutwardIcon />} onClick={onClose} sx={{ mt: 2, width: "100%", minHeight: 52, borderRadius: 999, background: `linear-gradient(135deg, ${tokens.colors.navy} 0%, ${tokens.colors.teal} 100%)`, color: "#fff", fontWeight: 800 }} />
      </Box>
    </Drawer>
  );
}
