import React from "react";
import { Box, Container, Paper, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

export const authInputSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: 2.5,
    backgroundColor: "rgba(255,255,255,0.88)",
  },
};

export const authButtonSx = {
  py: 1.4,
  borderRadius: 999,
  textTransform: "none",
  fontWeight: 700,
  letterSpacing: 0.1,
};

export default function AuthCardShell({ title, subtitle, children }) {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        py: { xs: 7, md: 10 },
        px: 2,
        background:
          "radial-gradient(circle at 10% 10%, rgba(34,197,94,0.12), transparent 45%), radial-gradient(circle at 85% 20%, rgba(14,165,233,0.16), transparent 42%), linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%)",
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={0}
          sx={(theme) => ({
            p: { xs: 3, md: 4 },
            borderRadius: 4,
            border: `1px solid ${alpha(theme.palette.divider, 0.45)}`,
            boxShadow:
              "0 20px 45px rgba(15, 23, 42, 0.09), 0 2px 10px rgba(15, 23, 42, 0.05)",
            background:
              theme.palette.mode === "dark"
                ? "linear-gradient(180deg, rgba(17,24,39,0.98), rgba(15,23,42,0.96))"
                : "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(248,250,252,0.98))",
          })}
        >
          <Box sx={{ height: 4, width: 84, borderRadius: 999, bgcolor: "#22c55e", mb: 2.5 }} />
          <Typography component="h1" variant="h4" fontWeight={800} gutterBottom>
            {title}
          </Typography>
          {subtitle ? (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {subtitle}
            </Typography>
          ) : null}
          {children}
        </Paper>
      </Container>
    </Box>
  );
}
