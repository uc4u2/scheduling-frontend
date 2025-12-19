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
import { alpha } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import Meta from "../../../components/Meta";
import FloatingBlob from "../../../components/ui/FloatingBlob";

const CompareHubPage = () => {
  const { t, i18n } = useTranslation();
  const fallbackT = useMemo(() => i18n.getFixedT("en"), [i18n]);

  const comparisons = useMemo(() => {
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
        title="Schedulaa comparisons | Compare competitors"
        description="Compare Schedulaa with leading booking, scheduling, and payroll platforms for service teams."
        canonical="https://www.schedulaa.com/compare"
      />

      <FloatingBlob enableMotion color="#0ea5e9" size={1040} opacity={0.1} duration={32} sx={{ top: -220, left: -200 }} />
      <FloatingBlob enableMotion color="#34d399" size={960} opacity={0.08} duration={30} sx={{ bottom: -260, right: -220 }} />

      <Box sx={{ maxWidth: 1100, mx: "auto", px: { xs: 2, md: 6 }, py: { xs: 8, md: 12 } }}>
        <Stack spacing={2} textAlign="center">
          <Typography variant="overline" color="primary" fontWeight={700} letterSpacing={0.4}>
            Compare hub
          </Typography>
          <Typography variant="h3" fontWeight={800}>
            Schedulaa comparisons
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" maxWidth={760} mx="auto">
            Side-by-side comparison guides for teams evaluating Schedulaa against other platforms.
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="center">
            <Button component={RouterLink} to="/alternatives" variant="outlined" color="primary" sx={{ borderRadius: 999, px: 4 }}>
              View alternatives
            </Button>
          </Stack>
        </Stack>

        <Stack spacing={2.5} sx={{ mt: 6 }}>
          {comparisons.map((item) => (
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
                    Compare
                  </Typography>
                </Stack>
                <Typography variant="h6" fontWeight={700}>
                  {item.title}
                </Typography>
                {item.description ? (
                  <Typography variant="body2" color="text.secondary">
                    {item.description}
                  </Typography>
                ) : null}
                <MuiLink component={RouterLink} to={`/compare/${item.key}`} underline="hover" color="primary">
                  View comparison
                </MuiLink>
              </Stack>
            </Paper>
          ))}
        </Stack>
      </Box>
    </Box>
  );
};

export default CompareHubPage;
