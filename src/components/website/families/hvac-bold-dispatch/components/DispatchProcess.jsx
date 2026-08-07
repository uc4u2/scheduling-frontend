import React from "react";
import { alpha, Box, Container, Grid, Typography } from "@mui/material";
import dispatchTokens from "../tokens";
import { useDispatchReveal } from "../motion";
import { getZigzagItems } from "../../hvac-shared/canonicalHvacAdapter";
import { sanitizeDispatchProcess } from "./contentSanitizer";

export default function DispatchProcessBoard({ websiteSectionAdapter: adapter = {} }) {
  const items = sanitizeDispatchProcess(getZigzagItems(adapter?.props || {}));
  const [ref, revealStyle] = useDispatchReveal({ delay: 16 });
  if (!items.length) return null;
  return (
    <Box ref={ref} sx={{ ...revealStyle, bgcolor: dispatchTokens.colors.cream }}>
      <Container maxWidth={false} sx={{ maxWidth: `${dispatchTokens.layout.shellMax}px`, px: { xs: 2, md: 4 }, py: 4 }}>
        <Grid container spacing={2}>
          {items.slice(0, 4).map((item, idx) => (
            <Grid item xs={12} md={6} key={item.id}>
              <Box sx={{ p: 2.4, height: "100%", bgcolor: "#fff", borderLeft: `8px solid ${idx % 2 === 0 ? dispatchTokens.colors.red : dispatchTokens.colors.orange}` }}>
                <Typography sx={{ color: alpha(dispatchTokens.colors.ink, 0.34), fontFamily: dispatchTokens.typography.headingFont, fontWeight: 900, fontSize: "2rem" }}>{String(idx + 1).padStart(2, "0")}</Typography>
                <Typography sx={{ fontFamily: dispatchTokens.typography.headingFont, fontWeight: 900, textTransform: "uppercase", fontSize: "1.45rem", lineHeight: 0.98 }}>{item.title}</Typography>
                {item.body ? <Typography sx={{ mt: 1, color: alpha(dispatchTokens.colors.ink, 0.76), lineHeight: 1.74 }}>{item.body}</Typography> : null}
              </Box>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}
