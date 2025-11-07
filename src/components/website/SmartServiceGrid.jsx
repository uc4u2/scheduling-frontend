import React from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  Stack,
  Typography,
} from "@mui/material";
import { useDataSource } from "../../hooks/useDataSource";
import { toPlain } from "../../utils/html";
import { sanitizeHtml } from "../../utils/sanitizeHtml";

export default function SmartServiceGrid({
  title,
  subtitle,
  items = [],
  ctaText,
  ctaLink,
  dataSource,
  titleAlign = "left",
}) {
  const data = useDataSource(dataSource);
  const svcs = Array.isArray(data) && data?.length ? data : items;
  const align = titleAlign;

  return (
    <Box>
      <Stack spacing={1} sx={{ textAlign: align }}>
        {title && (
          <Typography variant="h4" fontWeight={800}>
            {toPlain(title)}
          </Typography>
        )}
        {subtitle && (
          <Typography
            variant="body1"
            color="var(--page-body-color, rgba(248,250,252,0.85))"
            component="div"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(String(subtitle)) }}
          >
          </Typography>
        )}
      </Stack>

      <Grid container spacing={{ xs: 2, md: 3 }} sx={{ mt: 4 }}>
        {svcs.map((svc, i) => (
          <Grid item xs={12} sm={6} md={4} key={`${svc.name || svc.title || i}-${i}`}>
            <Card
              sx={{
                height: "100%",
                background: "var(--page-card-bg, rgba(6,10,18,0.78))",
                borderRadius: "var(--page-card-radius, 18px)",
                boxShadow: "var(--page-card-shadow, 0 32px 72px rgba(2,4,7,0.55))",
                color: "var(--page-heading-color, #f8fafc)",
                backdropFilter: "blur(var(--page-card-blur, 14px))",
                border: "1px solid rgba(255,255,255,0.12)",
              }}
            >
              <CardContent sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                <Typography fontWeight={700} variant="h6">
                  {svc.name || svc.title}
                </Typography>
                {svc.description && (
                  <Typography
                    variant="body2"
                    sx={{ color: "var(--page-body-color, rgba(248,250,252,0.85))" }}
                  >
                    {svc.description}
                  </Typography>
                )}

                {(svc.price || svc.meta) && (
                  <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
                    {svc.price && (
                      <Chip
                        label={svc.price}
                        sx={{
                          background: "rgba(255,255,255,0.14)",
                          color: "var(--page-heading-color, #f8fafc)",
                          fontWeight: 600,
                        }}
                      />
                    )}
                    {svc.meta && (
                      <Chip
                        variant="outlined"
                        label={svc.meta}
                        sx={{
                          borderColor: "rgba(255,255,255,0.4)",
                          color: "var(--page-heading-color, #f8fafc)",
                          fontWeight: 600,
                        }}
                      />
                    )}
                  </Stack>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {ctaText && (
        <Stack
          alignItems={
            align === "left"
              ? "flex-start"
              : align === "right"
              ? "flex-end"
              : "center"
          }
          sx={{ mt: 4 }}
        >
          <Button href={ctaLink || "#"} variant="contained">
            {ctaText}
          </Button>
        </Stack>
      )}
    </Box>
  );
}
