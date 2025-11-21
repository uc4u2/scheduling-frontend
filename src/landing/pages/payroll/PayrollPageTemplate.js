import React from "react";
import {
  Box,
  Container,
 Typography,
  Stack,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Divider,
  Link as MuiLink,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import SecurityIcon from "@mui/icons-material/Security";
import AssessmentIcon from "@mui/icons-material/Assessment";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import TimelineIcon from "@mui/icons-material/Timeline";
import { Link } from "react-router-dom";
import Meta from "../../../components/Meta";
import JsonLd from "../../../components/seo/JsonLd";

const iconMap = {
  compliance: <SecurityIcon fontSize="small" />,
  analytics: <AssessmentIcon fontSize="small" />,
  document: <InsertDriveFileIcon fontSize="small" />,
  timeline: <TimelineIcon fontSize="small" />,
  info: <InfoOutlinedIcon fontSize="small" />,
};

const PayrollPageTemplate = ({ config }) => {
  const theme = useTheme();

  const {
    meta,
    schema,
    hero,
    features = [],
    highlights = [],
    steps = [],
    callouts = [],
    faq = [],
    cta,
    secondaryLinks = [],
    notice,
    nextSteps,
  } = config;
  const schemaEntries = Array.isArray(schema) ? schema : schema ? [schema] : [];
  const faqJsonLd =
    faq.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faq.map((item) => ({
            "@type": "Question",
            name: item.question,
            acceptedAnswer: {
              "@type": "Answer",
              text: item.answer,
            },
          })),
        }
      : null;

  return (
    <Box sx={{ backgroundColor: theme.palette.background.default, pb: { xs: 10, md: 14 } }}>
      <Meta
        title={meta.title}
        description={meta.description}
        canonical={meta.canonical}
        og={meta.og}
        twitter={meta.twitter}
      />
      {schemaEntries.map((entry, idx) => (
        <JsonLd key={`schema-${idx}`} data={entry} />
      ))}
      {faqJsonLd && <JsonLd data={faqJsonLd} />}

      <Container maxWidth="lg" sx={{ pt: { xs: 8, md: 10 } }}>
        <Box
          sx={{
            borderRadius: 4,
            px: { xs: 3, md: 6 },
            py: { xs: 6, md: 8 },
            background: `linear-gradient(120deg, ${alpha(theme.palette.primary.main, 0.92)}, ${alpha(
              theme.palette.secondary.main,
              0.7
            )})`,
            color: theme.palette.common.white,
            boxShadow: `0 28px 60px ${alpha(theme.palette.primary.main, 0.28)}`,
          }}
        >
          <Stack spacing={3} maxWidth={740}>
            {hero.badge && (
              <Chip
                label={hero.badge}
                sx={{
                  alignSelf: "flex-start",
                  fontWeight: 600,
                  backgroundColor: alpha(theme.palette.common.white, 0.16),
                  color: theme.palette.common.white,
                  letterSpacing: 0.5,
                  px: 1.5,
                }}
              />
            )}
            <Typography variant="h1" sx={{ fontWeight: 800, fontSize: { xs: "2.4rem", md: "3.2rem" }, lineHeight: 1.1 }}>
              {hero.title}
            </Typography>
            {hero.subtitle && (
              <Typography variant="h6" sx={{ opacity: 0.95 }}>
                {hero.subtitle}
              </Typography>
            )}
            {hero.bullets && (
              <Stack spacing={1.25}>
                {hero.bullets.map((bullet) => (
                  <Stack key={bullet} direction="row" spacing={1.25} alignItems="center">
                    <CheckCircleOutlineIcon fontSize="small" />
                    <Typography variant="body1">{bullet}</Typography>
                  </Stack>
                ))}
              </Stack>
            )}
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1.5}
              alignItems={{ xs: "stretch", sm: "center" }}
              sx={{ width: "100%", "& > *": { width: { xs: "100%", sm: "auto" } } }}
            >
              <Button
                component={Link}
                to={hero.primaryCta.href}
                variant="contained"
                color="secondary"
                size="large"
                endIcon={<ArrowForwardIcon />}
                sx={{ fontWeight: 700 }}
              >
                {hero.primaryCta.label}
              </Button>
              <Button
                component={Link}
                to={hero.secondaryCta.href}
                variant="outlined"
                color="inherit"
                size="large"
                sx={{
                  borderColor: alpha(theme.palette.common.white, 0.6),
                  color: theme.palette.common.white,
                  fontWeight: 600,
                  "&:hover": {
                    borderColor: theme.palette.common.white,
                    backgroundColor: alpha(theme.palette.common.white, 0.08),
                  },
                }}
              >
                {hero.secondaryCta.label}
              </Button>
            </Stack>
            {notice && (
              <Typography variant="body2" sx={{ opacity: 0.85, maxWidth: 520 }}>
                {notice}
              </Typography>
            )}
          </Stack>
        </Box>
      </Container>

      {features.length > 0 && (
        <Container maxWidth="lg" sx={{ mt: { xs: 8, md: 10 } }}>
          <Stack spacing={3} textAlign="center" alignItems="center">
            <Typography variant="overline" sx={{ letterSpacing: 2, color: theme.palette.text.secondary }}>
              {config.featuresHeading}
            </Typography>
            <Typography variant="h2" sx={{ fontWeight: 800 }}>
              {config.featuresTitle}
            </Typography>
            {config.featuresIntro && (
              <Typography variant="body1" sx={{ color: theme.palette.text.secondary, maxWidth: 720 }}>
                {config.featuresIntro}
              </Typography>
            )}
          </Stack>

          <Grid container spacing={3} sx={{ mt: { xs: 4, md: 6 } }}>
            {features.map((feature) => (
              <Grid item xs={12} sm={6} md={4} key={feature.title}>
                <Card
                  variant="outlined"
                  sx={{
                    height: "100%",
                    borderRadius: 3,
                    borderColor: alpha(theme.palette.primary.main, 0.18),
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                    p: 3,
                    boxShadow: "none",
                  }}
                >
                  <Chip
                    icon={iconMap[feature.icon] || <InfoOutlinedIcon fontSize="small" />}
                    label={feature.label}
                    sx={{
                      alignSelf: "flex-start",
                      backgroundColor: alpha(theme.palette.primary.main, 0.08),
                      color: theme.palette.primary.main,
                      fontWeight: 600,
                    }}
                  />
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary, flexGrow: 1 }}>
                    {feature.description}
                  </Typography>
                  {feature.link && (
                    <Button
                      component={Link}
                      to={feature.link}
                      size="small"
                      endIcon={<ArrowForwardIcon fontSize="small" />}
                      sx={{ alignSelf: "flex-start", textTransform: "none", fontWeight: 600 }}
                    >
                      {feature.linkLabel}
                    </Button>
                  )}
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      )}

      {highlights.length > 0 && (
        <Container maxWidth="lg" sx={{ mt: { xs: 9, md: 12 } }}>
          <Grid container spacing={6} alignItems="center">
            {highlights.map((row, index) => (
              <React.Fragment key={row.title}>
                <Grid item xs={12} md={6} order={{ xs: 1, md: index % 2 === 0 ? 1 : 2 }}>
                  <Stack spacing={2}>
                    <Typography variant="overline" sx={{ letterSpacing: 2, color: theme.palette.text.secondary }}>
                      {row.overline}
                    </Typography>
                    <Typography variant="h3" sx={{ fontWeight: 800 }}>
                      {row.title}
                    </Typography>
                    <Typography variant="body1" sx={{ color: theme.palette.text.secondary }}>
                      {row.body}
                    </Typography>
                    {row.points && (
                      <Stack spacing={1.25}>
                        {row.points.map((point) => (
                          <Stack key={point} direction="row" spacing={1.25} alignItems="center">
                            <CheckCircleOutlineIcon fontSize="small" color="primary" />
                            <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                              {point}
                            </Typography>
                          </Stack>
                        ))}
                      </Stack>
                    )}
                    {row.links && (
                      <Stack
                        direction={{ xs: "column", sm: "row" }}
                        spacing={1.5}
                        sx={{ width: "100%", "& > *": { width: { xs: "100%", sm: "auto" } } }}
                      >
                        {row.links.map((link) => (
                          <Button
                            key={link.href}
                            component={Link}
                            to={link.href}
                            variant="outlined"
                            size="small"
                            endIcon={<ArrowForwardIcon fontSize="small" />}
                            sx={{ textTransform: "none", fontWeight: 600 }}
                          >
                            {link.label}
                          </Button>
                        ))}
                      </Stack>
                    )}
                  </Stack>
                </Grid>
                {row.image?.src && (
                  <Grid item xs={12} md={6} order={{ xs: 2, md: index % 2 === 0 ? 2 : 1 }}>
                    <Box
                      component="img"
                      src={row.image.src}
                      alt={row.image.alt || row.title}
                      sx={{
                        width: "100%",
                        borderRadius: 4,
                        boxShadow: theme.shadows[10],
                      }}
                    />
                  </Grid>
                )}
              </React.Fragment>
            ))}
          </Grid>
        </Container>
      )}

      {steps.length > 0 && (
        <Container maxWidth="lg" sx={{ mt: { xs: 9, md: 12 } }}>
          <Box
            sx={{
              borderRadius: 4,
              p: { xs: 4, md: 6 },
              backgroundColor:
                theme.palette.mode === "dark"
                  ? alpha(theme.palette.grey[900], 0.7)
                  : alpha(theme.palette.primary.light, 0.1),
              border: `1px solid ${alpha(theme.palette.primary.main, 0.16)}`,
            }}
          >
            <Stack spacing={4}>
              <Stack spacing={1.5} textAlign="center">
                <Typography variant="overline" sx={{ letterSpacing: 2, color: theme.palette.text.secondary }}>
                  {config.stepsHeading}
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 800 }}>
                  {config.stepsTitle}
                </Typography>
                {config.stepsIntro && (
                  <Typography variant="body1" sx={{ color: theme.palette.text.secondary, maxWidth: 720, mx: "auto" }}>
                    {config.stepsIntro}
                  </Typography>
                )}
              </Stack>
              <Grid container spacing={3}>
                {steps.map((step, index) => (
                  <Grid item xs={12} md={4} key={step.title}>
                    <Card
                      variant="outlined"
                      sx={{
                        height: "100%",
                        borderRadius: 3,
                        borderColor: alpha(theme.palette.primary.main, 0.18),
                        p: 3,
                      }}
                    >
                      <Chip
                        label={`Step ${index + 1}`}
                        sx={{
                          alignSelf: "flex-start",
                          fontWeight: 600,
                          backgroundColor: alpha(theme.palette.primary.main, 0.12),
                          color: theme.palette.primary.main,
                          mb: 2,
                        }}
                      />
                      <Typography variant="h5" sx={{ fontWeight: 700, mb: 1.5 }}>
                        {step.title}
                      </Typography>
                      <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                        {step.description}
                      </Typography>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Stack>
          </Box>
        </Container>
      )}

      {callouts.length > 0 && (
        <Container maxWidth="lg" sx={{ mt: { xs: 9, md: 12 } }}>
          <Grid container spacing={3}>
            {callouts.map((callout) => (
              <Grid item xs={12} sm={6} md={6} key={callout.title}>
                <Card
                  sx={{
                    height: "100%",
                    borderRadius: 3,
                    backgroundColor:
                      theme.palette.mode === "dark"
                        ? alpha(theme.palette.primary.main, 0.16)
                        : alpha(theme.palette.primary.light, 0.15),
                    border: "none",
                    boxShadow: "none",
                    p: 4,
                  }}
                >
                  <Stack spacing={2}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Chip
                        icon={iconMap[callout.icon] || <InfoOutlinedIcon fontSize="small" />}
                        label={callout.label}
                        sx={{ fontWeight: 600 }}
                      />
                    </Stack>
                    <Typography variant="h4" sx={{ fontWeight: 800 }}>
                      {callout.title}
                    </Typography>
                    <Typography variant="body1" sx={{ color: theme.palette.text.secondary }}>
                      {callout.body}
                    </Typography>
                    {callout.links && (
                      <Stack
                        direction={{ xs: "column", sm: "row" }}
                        spacing={2}
                        sx={{ width: "100%", "& > *": { width: { xs: "100%", sm: "auto" } } }}
                      >
                        {callout.links.map((link) => (
                          <Button
                            key={link.href}
                            component={Link}
                            to={link.href}
                            variant="contained"
                            color="secondary"
                            endIcon={<ArrowForwardIcon />}
                            sx={{ fontWeight: 700 }}
                          >
                            {link.label}
                          </Button>
                        ))}
                      </Stack>
                    )}
                  </Stack>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      )}

      {nextSteps?.links?.length > 0 && (
        <Container maxWidth="lg" sx={{ mt: { xs: 9, md: 12 } }}>
          <Card
            variant="outlined"
            sx={{
              borderRadius: 4,
              p: { xs: 4, md: 6 },
              borderColor: alpha(theme.palette.primary.main, 0.18),
              boxShadow: "none",
            }}
          >
            <Stack spacing={2}>
              <Typography variant="overline" sx={{ letterSpacing: 2, color: theme.palette.text.secondary }}>
                {nextSteps.overline || "Next steps"}
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 800 }}>
                {nextSteps.title || "Explore the rest of payroll"}
              </Typography>
              {nextSteps.description && (
                <Typography variant="body1" sx={{ color: theme.palette.text.secondary, maxWidth: 720 }}>
                  {nextSteps.description}
                </Typography>
              )}
              <Grid container spacing={2} sx={{ mt: 1 }}>
                {nextSteps.links.map((link) => (
                  <Grid item xs={12} sm={6} md={3} key={link.href}>
                    <Card
                      variant="outlined"
                      sx={{
                        height: "100%",
                        borderRadius: 3,
                        borderColor: alpha(theme.palette.primary.main, 0.12),
                        boxShadow: "none",
                      }}
                    >
                      <CardContent>
                        <Stack spacing={1.5}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                            {link.label}
                          </Typography>
                          {link.description && (
                            <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                              {link.description}
                            </Typography>
                          )}
                          <Button
                            component={Link}
                            to={link.href}
                            size="small"
                            endIcon={<ArrowForwardIcon fontSize="small" />}
                            sx={{ alignSelf: "flex-start", fontWeight: 600, textTransform: "none" }}
                          >
                            {link.cta || "Open"}
                          </Button>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Stack>
          </Card>
        </Container>
      )}

      {faq.length > 0 && (
        <Container maxWidth="md" sx={{ mt: { xs: 9, md: 12 } }}>
          <Stack spacing={3} textAlign="center" alignItems="center">
            <Typography variant="overline" sx={{ letterSpacing: 2, color: theme.palette.text.secondary }}>
              {config.faqHeading}
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 800 }}>
              {config.faqTitle}
            </Typography>
            {config.faqIntro && (
              <Typography variant="body1" sx={{ color: theme.palette.text.secondary, maxWidth: 720 }}>
                {config.faqIntro}
              </Typography>
            )}
          </Stack>
          <Stack spacing={4} sx={{ mt: { xs: 4, md: 6 } }}>
            {faq.map((item) => (
              <Box key={item.question}>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  {item.question}
                </Typography>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mt: 1.5 }}>
                  {item.answer}
                </Typography>
                <Divider sx={{ mt: 3, opacity: 0.16 }} />
              </Box>
            ))}
          </Stack>
        </Container>
      )}

      {(cta || secondaryLinks.length > 0) && (
        <Container maxWidth="lg" sx={{ mt: { xs: 9, md: 12 } }}>
          <Box
            sx={{
              borderRadius: 4,
              p: { xs: 4, md: 6 },
              background: `linear-gradient(125deg, ${alpha(theme.palette.primary.main, 0.88)}, ${alpha(
                theme.palette.secondary.main,
                0.68
              )})`,
              color: theme.palette.common.white,
              textAlign: "center",
              boxShadow: `0 28px 60px ${alpha(theme.palette.primary.main, 0.24)}`,
            }}
          >
            <Stack spacing={2} alignItems="center">
              <Typography variant="overline" sx={{ letterSpacing: 3 }}>
                {cta.overline}
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 800 }}>
                {cta.title}
              </Typography>
              <Typography variant="body1" sx={{ maxWidth: 640, opacity: 0.9 }}>
                {cta.body}
              </Typography>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1.5}
                alignItems="center"
                sx={{ mt: 1, width: "100%", "& > *": { width: { xs: "100%", sm: "auto" } } }}
              >
                <Button
                  component={Link}
                  to={cta.primary.href}
                  variant="contained"
                  size="large"
                  color="secondary"
                  endIcon={<ArrowForwardIcon />}
                  sx={{ fontWeight: 700, px: 4 }}
                >
                  {cta.primary.label}
                </Button>
                <Button
                  component={Link}
                  to={cta.secondary.href}
                  variant="outlined"
                  size="large"
                  color="inherit"
                  sx={{
                    borderColor: alpha(theme.palette.common.white, 0.7),
                    color: theme.palette.common.white,
                    fontWeight: 600,
                    "&:hover": {
                      borderColor: theme.palette.common.white,
                      backgroundColor: alpha(theme.palette.common.white, 0.1),
                    },
                  }}
                >
                  {cta.secondary.label}
                </Button>
              </Stack>
              {secondaryLinks.length > 0 && (
                <Stack direction="row" spacing={2} flexWrap="wrap" justifyContent="center" sx={{ mt: 3 }}>
                  {secondaryLinks.map((link) => (
                    <MuiLink
                      key={link.href}
                      component={Link}
                      to={link.href}
                      underline="hover"
                      color="inherit"
                      sx={{ fontWeight: 600 }}
                    >
                      {link.label}
                    </MuiLink>
                  ))}
                </Stack>
              )}
            </Stack>
          </Box>
        </Container>
      )}
    </Box>
  );
};

export default PayrollPageTemplate;
