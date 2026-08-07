import React from "react";
import {
  Box,
  Button,
  Divider,
  Drawer,
  Stack,
  Typography,
} from "@mui/material";
import ArrowOutwardIcon from "@mui/icons-material/ArrowOutward";
import { FamilyLinkButton } from "../../hvac-shared/runtime";

export default function DispatchMobileMenu({
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
      <Box
        sx={{
          width: 320,
          height: "100%",
          bgcolor: tokens.colors.bg,
          color: tokens.colors.text,
          p: 2,
        }}
      >
        <Typography
          sx={{
            fontFamily: tokens.typography.headingFont,
            fontSize: "1.25rem",
            textTransform: "uppercase",
          }}
        >
          {brandName}
        </Typography>
        <Divider sx={{ my: 2, borderColor: tokens.colors.line }} />
        <Stack spacing={1}>
          {entries.map((entry) => (
            <Button
              key={entry.key}
              {...(entry.linkProps || {})}
              onClick={entry.onClick || onClose}
              sx={{
                justifyContent: "flex-start",
                color: tokens.colors.text,
                border: `1px solid ${tokens.colors.line}`,
                borderRadius: 0,
                py: 1.25,
                fontFamily: tokens.typography.headingFont,
                fontWeight: 800,
              }}
            >
              {entry.label}
            </Button>
          ))}
        </Stack>
        <FamilyLinkButton
          href={ctaHref}
          label={ctaLabel}
          endIcon={<ArrowOutwardIcon />}
          onClick={onClose}
          sx={{
            mt: 2,
            width: "100%",
            minHeight: 52,
            borderRadius: 0,
            background: tokens.colors.orange,
            color: "#16120f",
            fontFamily: tokens.typography.headingFont,
            fontWeight: 900,
          }}
        />
      </Box>
    </Drawer>
  );
}
