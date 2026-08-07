import React from "react";
import { Box, Container, Grid, Stack, Typography } from "@mui/material";
import comfortTokens from "../tokens";
import { useComfortReveal } from "../motion";
import { getZigzagItems } from "../../hvac-shared/canonicalHvacAdapter";

export default function ComfortProcess({ websiteSectionAdapter: adapter = {} }) {
  const items = getZigzagItems(adapter?.props || {});
  const [ref, revealStyle] = useComfortReveal({ delay: 14 });
  if (!items.length) return null;
  return (
    <Box ref={ref} sx={{ ...revealStyle, bgcolor: comfortTokens.colors.bg }}>
      <Container maxWidth={false} sx={{ maxWidth: `${comfortTokens.layout.shellMax}px`, px: { xs: 2, md: 4 }, py: 4 }}>
        <Grid container spacing={2}>
          {items.slice(0, 4).map((item, idx) => (
            <Grid item xs={12} md={6} key={item.id}>
              <Stack spacing={1} sx={{ p: 2.2, height: "100%", borderRadius: "24px 24px 64px 24px", bgcolor: "#fff", border: `1px solid ${comfortTokens.colors.line}` }}>
                <Typography sx={{ color: comfortTokens.colors.sky, fontWeight: 700 }}>{String(idx + 1).padStart(2, "0")}</Typography>
                <Typography sx={{ color: comfortTokens.colors.text, fontFamily: comfortTokens.typography.headingFont, fontWeight: 700, fontSize: "1.5rem", lineHeight: 1 }}>{item.title}</Typography>
                {item.body ? <Typography sx={{ color: comfortTokens.colors.textSoft, lineHeight: 1.76 }}>{item.body}</Typography> : null}
              </Stack>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}
