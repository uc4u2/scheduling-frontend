import React from "react";
import { Avatar, Box, Chip, Container, Paper, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";

export const authInputSx = {
  "& .MuiInputLabel-root": {
    color: "rgba(71,85,105,0.88)",
    fontWeight: 500,
  },
  "& .MuiFormHelperText-root": {
    mx: 0.5,
    mt: 0.85,
  },
  "& .MuiOutlinedInput-root": {
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.9)",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.7), 0 10px 20px rgba(148,163,184,0.12)",
    transition: "box-shadow 180ms ease, transform 180ms ease, border-color 180ms ease",
    "& fieldset": {
      borderColor: "rgba(226,232,240,0.95)",
      borderWidth: 1.2,
    },
    "&:hover fieldset": {
      borderColor: "rgba(203,213,225,1)",
    },
    "&.Mui-focused": {
      boxShadow: "0 0 0 4px rgba(249,115,22,0.16), 0 14px 30px rgba(148,163,184,0.16)",
      transform: "translateY(-1px)",
    },
    "&.Mui-focused fieldset": {
      borderColor: "#f97316",
    },
    "& .MuiOutlinedInput-input": {
      py: 1.55,
    },
  },
};

export const authButtonSx = {
  py: 1.5,
  borderRadius: 999,
  textTransform: "none",
  fontWeight: 800,
  letterSpacing: 0.1,
  color: "#f8fafc",
  background: "linear-gradient(135deg, #fb923c 0%, #f97316 52%, #ea580c 100%)",
  boxShadow: "0 18px 34px rgba(249,115,22,0.24), inset 0 1px 0 rgba(255,255,255,0.14)",
  "&:hover": {
    background: "linear-gradient(135deg, #f88a2c 0%, #ea6a0c 52%, #c2410c 100%)",
    boxShadow: "0 22px 40px rgba(234,88,12,0.28), inset 0 1px 0 rgba(255,255,255,0.14)",
  },
  "&.Mui-disabled": {
    color: "rgba(51,65,85,0.72)",
    background: "linear-gradient(135deg, rgba(241,245,249,1) 0%, rgba(226,232,240,1) 100%)",
    boxShadow: "none",
  },
};

const defaultHeroCards = [
  {
    label: "Client booking",
    value: "Tenant-aware auth",
    tone: "accent",
    position: { top: 24, left: 24 },
  },
  {
    label: "Portal",
    value: "My Bookings access",
    tone: "dark",
    position: { bottom: 34, right: 28 },
  },
];

export default function AuthCardShell({
  title,
  subtitle,
  eyebrow = "Schedulaa",
  children,
  heroImage = "/images/auth/lumen-auth-reference.jpeg",
  heroTitle = "Unified booking, staffing, payroll, and client access.",
  heroSubtitle = "Built for teams that need premium scheduling without losing operational control.",
  heroCards = defaultHeroCards,
}) {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        py: { xs: 4, md: 6 },
        px: { xs: 1.5, sm: 2.5, md: 3.5 },
        background:
          "radial-gradient(circle at 12% 18%, rgba(249,115,22,0.12), transparent 34%), radial-gradient(circle at 88% 14%, rgba(251,191,36,0.12), transparent 28%), linear-gradient(180deg, #f8fafc 0%, #f7f5f2 46%, #eef2f7 100%)",
      }}
    >
      <Container maxWidth="lg" sx={{ px: { xs: 0, sm: 1 } }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 0.92fr) minmax(360px, 1.08fr)" },
            gap: { xs: 0, lg: 0 },
            alignItems: "stretch",
            borderRadius: { xs: 4, lg: 5 },
            overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.64)",
            boxShadow: "0 30px 60px rgba(15,23,42,0.14), 0 8px 26px rgba(15,23,42,0.08)",
            backdropFilter: "blur(18px)",
            background: "linear-gradient(180deg, rgba(255,255,255,0.62), rgba(255,255,255,0.4))",
          }}
        >
          <Paper
            elevation={0}
            sx={(theme) => ({
              p: { xs: 3, sm: 4, lg: 5.25 },
              borderRadius: 0,
              minHeight: { xs: "auto", lg: 760 },
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              background:
                theme.palette.mode === "dark"
                  ? "linear-gradient(180deg, rgba(17,24,39,0.96), rgba(15,23,42,0.92))"
                  : "linear-gradient(180deg, rgba(255,255,255,0.97), rgba(247,250,252,0.95))",
              borderRight: { xs: "none", lg: `1px solid ${alpha(theme.palette.common.white, 0.44)}` },
            })}
          >
            <Stack spacing={3}>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Chip
                  label={eyebrow}
                  sx={{
                    alignSelf: "flex-start",
                    px: 0.5,
                    borderRadius: 999,
                    fontWeight: 700,
                    letterSpacing: 0.2,
                    color: "#1e293b",
                    backgroundColor: "rgba(255,255,255,0.74)",
                    border: "1px solid rgba(148,163,184,0.24)",
                    boxShadow: "0 10px 24px rgba(148,163,184,0.12)",
                  }}
                />
                <Avatar
                  sx={{
                    width: 52,
                    height: 52,
                    bgcolor: "rgba(255,255,255,0.82)",
                    color: "#6b7280",
                    boxShadow: "0 14px 26px rgba(148,163,184,0.18)",
                    border: "1px solid rgba(255,255,255,0.68)",
                  }}
                >
                  <LockOutlinedIcon />
                </Avatar>
              </Stack>

              <Box
                sx={{
                  display: { xs: "block", lg: "none" },
                  position: "relative",
                  minHeight: 180,
                  borderRadius: 4,
                  overflow: "hidden",
                  backgroundImage: `linear-gradient(180deg, rgba(15,23,42,0.2), rgba(15,23,42,0.46)), url(${heroImage})`,
                  backgroundSize: "contain",
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "center 25%",
                  boxShadow: "0 18px 34px rgba(15,23,42,0.14)",
                }}
              >
                <Box
                  sx={{
                    position: "absolute",
                    inset: 0,
                    p: 2.25,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    color: "#fffaf0",
                  }}
                >
                  <Chip
                    label="Operations OS"
                    size="small"
                    sx={{
                      alignSelf: "flex-start",
                      bgcolor: "rgba(249,115,22,0.94)",
                      color: "#f8fafc",
                      fontWeight: 700,
                    }}
                  />
                  <Box>
                    <Typography variant="h6" fontWeight={800}>
                      {heroTitle}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.5, color: "rgba(255,250,240,0.84)" }}>
                      {heroSubtitle}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <Box>
                <Typography
                  component="h1"
                  variant="h3"
                  fontWeight={800}
                  sx={{
                    letterSpacing: "-0.03em",
                    color: "#1f2937",
                    fontSize: { xs: "2rem", md: "2.55rem" },
                    lineHeight: 1.05,
                  }}
                >
                  {title}
                </Typography>
                {subtitle ? (
                  <Typography
                    variant="body1"
                    color="text.secondary"
                    sx={{ mt: 1.2, maxWidth: 470, lineHeight: 1.7 }}
                  >
                    {subtitle}
                  </Typography>
                ) : null}
              </Box>

              <Box sx={{ maxWidth: 470 }}>{children}</Box>
            </Stack>
          </Paper>

          <Box
            sx={{
              display: { xs: "none", lg: "block" },
              position: "relative",
              minHeight: 760,
              overflow: "hidden",
              backgroundColor: "#edf0f4",
            }}
          >
            <Box
              sx={{
                position: "absolute",
                inset: 20,
                borderRadius: 5,
                overflow: "hidden",
                backgroundImage: `linear-gradient(180deg, rgba(15,23,42,0.16), rgba(15,23,42,0.34)), url(${heroImage})`,
                backgroundSize: "contain",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "center 24%",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.24)",
              }}
            />

            <Box
              sx={{
                position: "absolute",
                left: 20,
                right: 20,
                bottom: 20,
                height: 220,
                borderBottomLeftRadius: 40,
                borderBottomRightRadius: 40,
                background: "linear-gradient(180deg, rgba(15,23,42,0) 0%, rgba(15,23,42,0.58) 55%, rgba(15,23,42,0.76) 100%)",
                pointerEvents: "none",
              }}
            />

            <Box
              sx={{
                position: "absolute",
                inset: 0,
                p: 3.5,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <Stack spacing={2} sx={{ maxWidth: 320, ml: "auto", mt: 2, mr: 2 }}>
                {heroCards.map((card) => {
                  const isAccent = card.tone === "accent";
                  const isDark = card.tone === "dark";
                  return (
                    <Paper
                      key={`${card.label}-${card.value}`}
                      elevation={0}
                      sx={{
                        position: "absolute",
                        top: card.position?.top,
                        left: card.position?.left,
                        right: card.position?.right,
                        bottom: card.position?.bottom,
                        px: 2,
                        py: 1.35,
                        minWidth: isDark ? 214 : 190,
                        borderRadius: 3,
                        background: isAccent
                          ? "linear-gradient(135deg, rgba(249,115,22,0.96), rgba(234,88,12,0.96))"
                          : isDark
                          ? "linear-gradient(180deg, rgba(25,30,40,0.88), rgba(17,24,39,0.84))"
                          : "linear-gradient(180deg, rgba(255,255,255,0.9), rgba(248,250,252,0.86))",
                        color: isDark || isAccent ? "#f8fafc" : "#1f2937",
                        boxShadow: "0 18px 32px rgba(15,23,42,0.18)",
                        border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.5)"}`,
                      }}
                    >
                      <Typography variant="overline" sx={{ display: "block", lineHeight: 1.1, opacity: 0.86 }}>
                        {card.label}
                      </Typography>
                      <Typography variant="subtitle1" fontWeight={800}>
                        {card.value}
                      </Typography>
                    </Paper>
                  );
                })}
              </Stack>

              <Box
                sx={{
                  mt: "auto",
                  ml: 4,
                  mr: 6,
                  mb: 4,
                  maxWidth: 330,
                  color: "#fffaf0",
                  textShadow: "0 6px 18px rgba(15,23,42,0.18)",
                }}
              >
                <Typography variant="h4" fontWeight={800} sx={{ lineHeight: 1.12, letterSpacing: "-0.03em" }}>
                  {heroTitle}
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    mt: 1.2,
                    color: "rgba(255,250,240,0.84)",
                    lineHeight: 1.7,
                    display: "-webkit-box",
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {heroSubtitle}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
