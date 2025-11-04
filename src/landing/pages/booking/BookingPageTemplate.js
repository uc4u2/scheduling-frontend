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
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import PaymentIcon from "@mui/icons-material/Payment";
import AssignmentIcon from "@mui/icons-material/Assignment";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { Link } from "react-router-dom";

import Meta from "../../../components/Meta";
import JsonLd from "../../../components/seo/JsonLd";

const iconMap = {
  availability: <EventAvailableIcon fontSize="small" />,
  calendar: <CalendarMonthIcon fontSize="small" />,
  payment: <PaymentIcon fontSize="small" />,
  form: <AssignmentIcon fontSize="small" />,
  team: <PeopleAltIcon fontSize="small" />,
};

const BookingPageTemplate = ({ config }) => {
  const theme = useTheme();
  const {
    meta,
    schema,
    hero,
    features = [],
    highlights = [],
    howItWorks,
    managerControls,
    invitations,
    checkout,
    faq = [],
    cta,
    secondaryLinks = [],
  } = config;

  return (
    <Box sx={{ backgroundColor: theme.palette.background.default, pb: { xs: 10, md: 14 } }}>
      <Meta
        title={meta.title}
        description={meta.description}
        canonical={meta.canonical}
        og={meta.og}
        twitter={meta.twitter}
      />
      <JsonLd data={schema} />

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
          <Stack spacing={3} maxWidth={760}>
            {hero.badge && (
              <Chip
                label={hero.badge}
                sx={{
                  alignSelf: "flex-start",
                  fontWeight: 600,
                  backgroundColor: alpha(theme.palette.common.white, 0.18),
                  color: theme.palette.common.white,
                  letterSpacing: 0.5,
                }}
              />
            )}
            <Typography variant="h1" sx={{ fontWeight: 800, fontSize: { xs: "2.5rem", md: "3.2rem" }, lineHeight: 1.08 }}>
              {hero.title}
            </Typography>
            {hero.subtitle && (
              <Typography variant="h6" sx={{ opacity: 0.96 }}>
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
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ xs: "stretch", sm: "center" }}>
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
                  borderColor: alpha(theme.palette.common.white, 0.65),
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
              <Typography variant="body1" sx={{ maxWidth: 720, color: theme.palette.text.secondary }}>
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
                      sx={{ textTransform: "none", fontWeight: 600, alignSelf: "flex-start" }}
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
            {highlights.map((section, index) => (
              <React.Fragment key={section.title}>
                <Grid item xs={12} md={6} order={{ xs: 1, md: index % 2 === 0 ? 1 : 2 }}>
                  <Stack spacing={2}>
                    <Typography variant="overline" sx={{ letterSpacing: 2, color: theme.palette.text.secondary }}>
                      {section.overline}
                    </Typography>
                    <Typography variant="h3" sx={{ fontWeight: 800 }}>
                      {section.title}
                    </Typography>
                    <Typography variant="body1" sx={{ color: theme.palette.text.secondary }}>
                      {section.body}
                    </Typography>
                    {section.points && (
                      <Stack spacing={1.25}>
                        {section.points.map((point) => (
                          <Stack key={point} direction="row" spacing={1.25} alignItems="center">
                            <CheckCircleOutlineIcon fontSize="small" color="primary" />
                            <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                              {point}
                            </Typography>
                          </Stack>
                        ))}
                      </Stack>
                    )}
                    {section.links && (
                      <Stack direction="row" spacing={1.5} flexWrap="wrap">
                        {section.links.map((link) => (
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
                <Grid item xs={12} md={6} order={{ xs: 2, md: index % 2 === 0 ? 2 : 1 }}>
                  <Box
                    component="img"
                    src={section.image.src}
                    alt={section.image.alt}
                    sx={{
                      width: "100%",
                      borderRadius: 4,
                      boxShadow: theme.shadows[10],
                    }}
                  />
                </Grid>
              </React.Fragment>
            ))}
          </Grid>
        </Container>
      )}

      {howItWorks && (
        <Container maxWidth="lg" sx={{ mt: { xs: 9, md: 12 } }}>
          <Box
            sx={{
              borderRadius: 4,
              p: { xs: 4, md: 6 },
              backgroundColor:
                theme.palette.mode === "dark"
                  ? alpha(theme.palette.primary.main, 0.14)
                  : alpha(theme.palette.primary.light, 0.12),
              border: `1px solid ${alpha(theme.palette.primary.main, 0.16)}`,
            }}
          >
            <Stack spacing={3} alignItems="center" textAlign="center">
              <Typography variant="overline" sx={{ letterSpacing: 2, color: theme.palette.text.secondary }}>
                {howItWorks.overline}
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 800 }}>
                {howItWorks.title}
              </Typography>
              <Typography variant="body1" sx={{ color: theme.palette.text.secondary, maxWidth: 780 }}>
                {howItWorks.intro}
              </Typography>
            </Stack>
            <Grid container spacing={3} sx={{ mt: { xs: 4, md: 6 } }}>
              {howItWorks.steps.map((step, index) => (
                <Grid item xs={12} md={4} key={step.title}>
                  <Card
                    variant="outlined"
                    sx={{
                      height: "100%",
                      borderRadius: 3,
                      borderColor: alpha(theme.palette.primary.main, 0.2),
                      p: 3,
                    }}
                  >
                    <Chip
                      label={`Step ${index + 1}`}
                      sx={{
                        alignSelf: "flex-start",
                        backgroundColor: alpha(theme.palette.primary.main, 0.12),
                        color: theme.palette.primary.main,
                        fontWeight: 600,
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
          </Box>
        </Container>
      )}

      {managerControls && (
        <Container maxWidth="lg" sx={{ mt: { xs: 9, md: 12 } }}>
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={6}>
              <Stack spacing={2}>
                <Typography variant="overline" sx={{ letterSpacing: 2, color: theme.palette.text.secondary }}>
                  {managerControls.overline}
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 800 }}>
                  {managerControls.title}
                </Typography>
                <Typography variant="body1" sx={{ color: theme.palette.text.secondary }}>
                  {managerControls.body}
                </Typography>
                <Stack spacing={1.25}>
                  {managerControls.points.map((point) => (
                    <Stack key={point} direction="row" spacing={1.25} alignItems="center">
                      <CheckCircleOutlineIcon fontSize="small" color="primary" />
                      <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                        {point}
                      </Typography>
                    </Stack>
                  ))}
                </Stack>
              </Stack>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box
                component="img"
                src={managerControls.image.src}
                alt={managerControls.image.alt}
                sx={{
                  width: "100%",
                  borderRadius: 4,
                  boxShadow: theme.shadows[10],
                }}
              />
            </Grid>
          </Grid>
        </Container>
      )}

      {invitations && (
        <Container maxWidth="lg" sx={{ mt: { xs: 9, md: 12 } }}>
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={6} order={{ xs: 1, md: 2 }}>
              <Stack spacing={2}>
                <Typography variant="overline" sx={{ letterSpacing: 2, color: theme.palette.text.secondary }}>
                  {invitations.overline}
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 800 }}>
                  {invitations.title}
                </Typography>
                <Typography variant="body1" sx={{ color: theme.palette.text.secondary }}>
                  {invitations.body}
                </Typography>
                <Stack spacing={1.25}>
                  {invitations.points.map((point) => (
                    <Stack key={point} direction="row" spacing={1.25} alignItems="center">
                      <CheckCircleOutlineIcon fontSize="small" color="primary" />
                      <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                        {point}
                      </Typography>
                    </Stack>
                  ))}
                </Stack>
              </Stack>
            </Grid>
            <Grid item xs={12} md={6} order={{ xs: 2, md: 1 }}>
              <Box
                component="img"
                src={invitations.image.src}
                alt={invitations.image.alt}
                sx={{
                  width: "100%",
                  borderRadius: 4,
                  boxShadow: theme.shadows[10],
                }}
              />
            </Grid>
          </Grid>
        </Container>
      )}

      {checkout && (
        <Container maxWidth="lg" sx={{ mt: { xs: 9, md: 12 } }}>
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={6}>
              <Box
                component="img"
                src={checkout.image.src}
                alt={checkout.image.alt}
                sx={{
                  width: "100%",
                  borderRadius: 4,
                  boxShadow: theme.shadows[10],
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Stack spacing={2}>
                <Typography variant="overline" sx={{ letterSpacing: 2, color: theme.palette.text.secondary }}>
                  {checkout.overline}
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 800 }}>
                  {checkout.title}
                </Typography>
                <Typography variant="body1" sx={{ color: theme.palette.text.secondary }}>
                  {checkout.body}
                </Typography>
                <Stack spacing={1.25}>
                  {checkout.points.map((point) => (
                    <Stack key={point} direction="row" spacing={1.25} alignItems="center">
                      <CheckCircleOutlineIcon fontSize="small" color="primary" />
                      <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                        {point}
                      </Typography>
                    </Stack>
                  ))}
                </Stack>
              </Stack>
            </Grid>
          </Grid>
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

      {cta && (
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
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems="center" sx={{ mt: 1 }}>
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

export default BookingPageTemplate;

