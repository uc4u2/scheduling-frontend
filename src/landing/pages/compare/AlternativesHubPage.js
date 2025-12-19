import React, { useMemo } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Box,
  Typography,
  Stack,
  Paper,
  Chip,
  Link as MuiLink,
  Button,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import Meta from "../../../components/Meta";
import FloatingBlob from "../../../components/ui/FloatingBlob";

const AlternativesHubPage = () => {
  const theme = useTheme();
  const { t, i18n } = useTranslation();
  const fallbackT = useMemo(() => i18n.getFixedT("en"), [i18n]);

  const alternatives = useMemo(() => {
    const data = fallbackT("landing.compare", { returnObjects: true, defaultValue: {} });
    return Object.keys(data || {}).map((key) => {
      const entry = t(`landing.compare.${key}`, { returnObjects: true, defaultValue: data[key] });
      const altSlug = key.startsWith("schedulaa-vs-") ? key.replace(/^schedulaa-vs-/, "") : key;
      return {
        key,
        altSlug,
        competitor: entry?.competitor || key,
        title: entry?.heroTitle || `Schedulaa vs ${entry?.competitor || key}`,
        description: entry?.metaDescription || "",
      };
    });
  }, [t, fallbackT]);

  return (
    <Box sx={{ position: "relative", overflow: "hidden" }}>
      <Meta
        title="Schedulaa alternatives | Compare competitors"
        description="Explore Schedulaa alternatives to popular scheduling, payroll, and booking platforms. Compare features, compliance, and operations workflows."
        canonical="https://www.schedulaa.com/alternatives"
      />

      <FloatingBlob enableMotion color="#0ea5e9" size={1040} opacity={0.1} duration={32} sx={{ top: -220, left: -200 }} />
      <FloatingBlob enableMotion color="#34d399" size={960} opacity={0.08} duration={30} sx={{ bottom: -260, right: -220 }} />

      <Box sx={{ maxWidth: 1100, mx: "auto", px: { xs: 2, md: 6 }, py: { xs: 8, md: 12 } }}>
        <Stack spacing={2} textAlign="center">
          <Typography variant="overline" color="primary" fontWeight={700} letterSpacing={0.4}>
            Alternatives hub
          </Typography>
          <Typography variant="h3" fontWeight={800}>
            Schedulaa alternatives
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" maxWidth={760} mx="auto">
            Compare Schedulaa with popular booking, scheduling, and payroll platforms. Each guide focuses on
            operations, compliance, and service-team workflows.
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="center">
            <Button component={RouterLink} to="/compare" variant="outlined" color="primary" sx={{ borderRadius: 999, px: 4 }}>
              View comparisons
            </Button>
          </Stack>
        </Stack>

        <Stack spacing={2.5} sx={{ mt: 6 }}>
          {alternatives.map((item) => (
            <Paper
              key={item.key}
              variant="outlined"
              sx={{
                p: { xs: 2.5, md: 3 },
                borderRadius: 4,
                borderColor: (theme) => alpha(theme.palette.divider, 0.8),
              }}
            >
              <Stack spacing={1}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Chip size="small" label={item.competitor} />
                  <Typography variant="caption" color="text.secondary">
                    Alternatives
                  </Typography>
                </Stack>
                <Typography variant="h6" fontWeight={700}>
                  {item.competitor} alternatives
                </Typography>
                {item.description ? (
                  <Typography variant="body2" color="text.secondary">
                    {item.description}
                  </Typography>
                ) : null}
                <MuiLink component={RouterLink} to={`/alternatives/${item.altSlug}`} underline="hover" color="primary">
                  View alternatives guide
                </MuiLink>
              </Stack>
            </Paper>
          ))}
        </Stack>
      </Box>
    </Box>
  );
};

export default AlternativesHubPage;
