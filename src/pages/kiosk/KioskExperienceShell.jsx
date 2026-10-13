import React from "react";
import { Box, Stack, Typography } from "@mui/material";

export const kioskPalette = {
  navy: "#10243E",
  navyMuted: "#52647A",
  teal: "#0B8F83",
  tealDark: "#087269",
  tealSoft: "#E8F7F4",
  border: "#DCE5EE",
  background: "#F4F7FA",
  surface: "#FFFFFF",
};

export const formatKioskMoney = (cents, currency) =>
  `${(Number(cents || 0) / 100).toFixed(2)} ${currency || ""}`.trim();

const BusinessMark = ({ businessName }) => {
  const initial = String(businessName || "S").trim().charAt(0).toUpperCase() || "S";
  return (
    <Stack direction="row" spacing={1.5} alignItems="center" minWidth={0}>
      <Box
        aria-hidden="true"
        sx={{
          width: 44,
          height: 44,
          flex: "0 0 auto",
          borderRadius: "14px",
          display: "grid",
          placeItems: "center",
          bgcolor: kioskPalette.navy,
          color: "white",
          fontSize: 20,
          fontWeight: 800,
          boxShadow: "0 10px 24px rgba(16, 36, 62, 0.18)",
        }}
      >
        {initial}
      </Box>
      <Box minWidth={0}>
        <Typography
          component="div"
          fontWeight={800}
          color={kioskPalette.navy}
          noWrap
          sx={{ fontSize: { xs: 16, sm: 18 } }}
        >
          {businessName || "Secure checkout"}
        </Typography>
        <Typography variant="caption" color={kioskPalette.navyMuted}>
          Powered by Schedulaa
        </Typography>
      </Box>
    </Stack>
  );
};

const KioskExperienceShell = ({ businessName, eyebrow = "Customer checkout", children }) => (
  <Box
    sx={{
      minHeight: "100dvh",
      bgcolor: kioskPalette.background,
      color: kioskPalette.navy,
      backgroundImage:
        "radial-gradient(circle at 8% 0%, rgba(11,143,131,0.10), transparent 34%), radial-gradient(circle at 100% 100%, rgba(16,36,62,0.08), transparent 36%)",
      px: { xs: 1.5, sm: 3, md: 4 },
      py: { xs: 2, sm: 3 },
      overflowX: "hidden",
      "@media (prefers-reduced-motion: reduce)": {
        "&, & *": { scrollBehavior: "auto !important", transition: "none !important", animation: "none !important" },
      },
    }}
  >
    <Box sx={{ width: "100%", maxWidth: 1080, mx: "auto" }}>
      <Stack
        component="header"
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        spacing={2}
        sx={{ mb: { xs: 2, sm: 3 } }}
      >
        <BusinessMark businessName={businessName} />
        <Typography
          variant="overline"
          sx={{
            display: { xs: "none", sm: "block" },
            color: kioskPalette.tealDark,
            fontWeight: 800,
            letterSpacing: "0.12em",
          }}
        >
          {eyebrow}
        </Typography>
      </Stack>
      {children}
    </Box>
  </Box>
);

export default KioskExperienceShell;
