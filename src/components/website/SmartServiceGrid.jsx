import React from "react";
import {
  Button,
  Card,
  CardContent,
  CardMedia,
  Chip,
  Container,
  Grid,
  Stack,
  Typography,
} from "@mui/material";
import { useDataSource } from "../../hooks/useDataSource";
import { toPlain, normalizeInlineHtml } from "../../utils/html";
import { safeHtml } from "../../utils/safeHtml";

const ALIGN_RE = /text-align\s*:\s*(left|center|right|justify)/i;

export default function SmartServiceGrid({
  title,
  items = [],
  ctaText,
  ctaLink,
  dataSource,
  titleAlign,
}) {
  const data = useDataSource(dataSource);
  const svcs = Array.isArray(data) && data?.length ? data : items;

  const resolvedAlign = (() => {
    if (!title) return titleAlign || "left";
    const match = ALIGN_RE.exec(title);
    return (match ? match[1] : titleAlign || "left").toLowerCase();
  })();

  const normalizedTitle = title ? safeHtml(normalizeInlineHtml(title)) : "";

  return (
    <Container maxWidth="lg">
      {title && (
        <Typography
          variant="h4"
          sx={{ mb: 2, fontWeight: 800, textAlign: resolvedAlign }}
          dangerouslySetInnerHTML={{ __html: normalizedTitle }}
        />
      )}

      <Grid container spacing={2}>
        {svcs.map((s, i) => (
          <Grid item xs={12} sm={6} md={4} key={i}>
            <Card sx={{ height: "100%" }}>
              {s.image && (
                <CardMedia component="img" height="160" image={s.image} alt="" />
              )}
              <CardContent>
                <Typography fontWeight={700}>
                  {s.name || s.title}
                </Typography>
                {s.description && (
                  <Typography
                    color="text.secondary"
                    variant="body2"
                    sx={{ mt: 0.5 }}
                  >
                    {s.description}
                  </Typography>
                )}
                {(s.price || s.meta) && (
                  <Stack
                    direction="row"
                    spacing={1}
                    sx={{ mt: 1, flexWrap: "wrap" }}
                  >
                    {s.price && <Chip label={s.price} />}
                    {s.meta && <Chip variant="outlined" label={s.meta} />}
                  </Stack>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {ctaText && (
        <Stack alignItems="center" sx={{ mt: 3 }}>
          <Button href={ctaLink || "#"} variant="contained">
            {toPlain(ctaText)}
          </Button>
        </Stack>
      )}
    </Container>
  );
}
