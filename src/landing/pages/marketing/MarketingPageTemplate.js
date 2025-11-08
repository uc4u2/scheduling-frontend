import React from "react";
import {
  Box,
  Container,
  Typography,
  Stack,
  Grid,
  Card,
  CardContent,
  Chip,
  Button,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Link as MuiLink,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import CampaignIcon from "@mui/icons-material/Campaign";
import TimelineIcon from "@mui/icons-material/Timeline";
import GroupsIcon from "@mui/icons-material/Groups";
import InsightsIcon from "@mui/icons-material/Insights";
import AssessmentIcon from "@mui/icons-material/Assessment";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import LaunchIcon from "@mui/icons-material/Launch";
import { Link } from "react-router-dom";
import Meta from "../../../components/Meta";
import JsonLd from "../../../components/seo/JsonLd";

const iconMap = {
  campaign: <CampaignIcon fontSize="small" />,
  lifecycle: <GroupsIcon fontSize="small" />,
  analytics: <AssessmentIcon fontSize="small" />,
  insights: <InsightsIcon fontSize="small" />,
  timeline: <TimelineIcon fontSize="small" />,
};

const MarketingPageTemplate = ({ config }) => {
  const theme = useTheme();
  const {
    meta,
    schema,
    hero,
    sections = [],
    lists = [],
    highlights = [],
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
            <Typography variant="h1" sx={{ fontWeight: 800, fontSize: { xs: "2.6rem", md: "3.3rem" }, lineHeight: 1.08 }}>
              {hero.title}
            </Typography>
            {hero.subtitle && (
              <Typography variant="h6" sx={{ opacity: 0.96 }}>
                {hero.subtitle}
              </Typography>
            )}
            {hero.body && (
              <Typography variant="body1" sx={{ opacity: 0.9 }}>
                {hero.body}
              </Typography>
            )}
            {hero.points && (
              <Stack spacing={1.25}>
                {hero.points.map((point) => (
                  <Stack key={point} direction="row" spacing={1.25} alignItems="center">
                    <CheckCircleOutlineIcon fontSize="small" />
                    <Typography variant="body1">{point}</Typography>
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
              {hero.primaryCta && (
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
              )}
              {hero.secondaryCta && (
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
              )}
            </Stack>
          </Stack>
        </Box>
      </Container>

      {sections.map((section) => (
        <Container
          key={section.title}
          id={section.id}
          component="section"
          maxWidth="lg"
          sx={{ mt: { xs: 8, md: 10 } }}
        >
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={section.image ? 6 : 12}>
              <Stack spacing={2}>
                <Typography variant="overline" sx={{ letterSpacing: 2, color: theme.palette.text.secondary }}>
                  {section.overline}
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 800 }}>
                  {section.title}
                </Typography>
                {section.body && (
                  <Typography variant="body1" sx={{ color: theme.palette.text.secondary }}>
                    {section.body}
                  </Typography>
                )}
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
                {section.buttons && (
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={1.5}
                    flexWrap="wrap"
                    sx={{ width: "100%", "& > *": { width: { xs: "100%", sm: "auto" } } }}
                  >
                    {section.buttons.map((btn) => (
                      <Button
                        key={btn.href}
                        component={Link}
                        to={btn.href}
                        variant={btn.variant || "outlined"}
                        endIcon={<ArrowForwardIcon fontSize="small" />}
                        sx={{ textTransform: "none", fontWeight: 600 }}
                      >
                        {btn.label}
                      </Button>
                    ))}
                  </Stack>
                )}
              </Stack>
            </Grid>
            {section.image && (
              <Grid item xs={12} md={6}>
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
            )}
          </Grid>
        </Container>
      ))}

      {lists.map((block) => (
        <Container key={block.title} maxWidth="lg" sx={{ mt: { xs: 9, md: 12 } }}>
          <Stack spacing={3} textAlign="center" alignItems="center">
            <Typography variant="overline" sx={{ letterSpacing: 2, color: theme.palette.text.secondary }}>
              {block.overline}
            </Typography>
            <Typography variant="h2" sx={{ fontWeight: 800 }}>
              {block.title}
            </Typography>
            {block.intro && (
              <Typography variant="body1" sx={{ color: theme.palette.text.secondary, maxWidth: 760 }}>
                {block.intro}
              </Typography>
            )}
          </Stack>

          <Grid container spacing={3} sx={{ mt: { xs: 4, md: 6 } }}>
            {block.items.map((item) => (
              <Grid
                item
                xs={12}
                sm={block.columns === 2 ? 6 : 6}
                md={block.columns === 2 ? 6 : 4}
                key={item.title}
              >
                <Card
                  variant="outlined"
                  sx={{
                    height: "100%",
                    borderRadius: 3,
                    borderColor: alpha(theme.palette.primary.main, 0.18),
                    display: "flex",
                    flexDirection: "column",
                    p: 3,
                    gap: 2,
                  }}
                >
                  <Chip
                    icon={iconMap[item.icon] || <InfoOutlinedIcon fontSize="small" />}
                    label={item.label}
                    sx={{
                      alignSelf: "flex-start",
                      backgroundColor: alpha(theme.palette.primary.main, 0.08),
                      color: theme.palette.primary.main,
                      fontWeight: 600,
                    }}
                  />
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {item.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                    {item.body}
                  </Typography>
                  {item.points && (
                    <List dense>
                      {item.points.map((point) => (
                        <ListItem key={point} sx={{ py: 0 }}>
                          <ListItemIcon sx={{ minWidth: 28 }}>
                            <CheckCircleOutlineIcon fontSize="small" color="primary" />
                          </ListItemIcon>
                          <ListItemText
                            primaryTypographyProps={{ variant: "body2", color: "text.secondary" }}
                            primary={point}
                          />
                        </ListItem>
                      ))}
                    </List>
                  )}
                  {item.link && (
                    <Button
                      component={Link}
                      to={item.link.href}
                      variant="outlined"
                      size="small"
                      endIcon={<ArrowForwardIcon fontSize="small" />}
                      sx={{ textTransform: "none", fontWeight: 600, mt: "auto" }}
                    >
                      {item.link.label}
                    </Button>
                  )}
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      ))}

      {highlights.map((highlight) => (
        <Container key={highlight.title} maxWidth="lg" sx={{ mt: { xs: 9, md: 12 } }}>
          <Card
            sx={{
              borderRadius: 4,
              p: { xs: 4, md: 6 },
              backgroundColor:
                theme.palette.mode === "dark"
                  ? alpha(theme.palette.primary.main, 0.16)
                  : alpha(theme.palette.primary.light, 0.15),
              border: "none",
              boxShadow: "none",
            }}
          >
            <Stack spacing={3}>
              <Stack direction={{ xs: "column", md: "row" }} spacing={3} alignItems={{ xs: "flex-start", md: "center" }} justifyContent="space-between">
                <Stack spacing={1.25}>
                  <Typography variant="overline" sx={{ letterSpacing: 2, color: theme.palette.text.secondary }}>
                    {highlight.overline}
                  </Typography>
                  <Typography variant="h3" sx={{ fontWeight: 800 }}>
                    {highlight.title}
                  </Typography>
                </Stack>
                {highlight.actions && (
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={1.5}
                    flexWrap="wrap"
                    sx={{ width: "100%", "& > *": { width: { xs: "100%", sm: "auto" } } }}
                  >
                    {highlight.actions.map((action) => (
                      <Button
                        key={action.href}
                        component={Link}
                        to={action.href}
                        variant={action.variant || "contained"}
                        color={action.variant === "outlined" ? "primary" : "secondary"}
                        endIcon={<ArrowForwardIcon fontSize="small" />}
                        sx={{ textTransform: "none", fontWeight: 600 }}
                      >
                        {action.label}
                      </Button>
                    ))}
                  </Stack>
                )}
              </Stack>
              {highlight.content && (
                <Typography variant="body1" sx={{ color: theme.palette.text.secondary }}>
                  {highlight.content}
                </Typography>
              )}
              {highlight.list && (
                <List
                  dense
                  sx={{
                    pl: { xs: 0, sm: 2 },
                    "& .MuiListItem-root": { alignItems: "flex-start" },
                  }}
                >
                  {highlight.list.map((item) => (
                    <ListItem key={item} sx={{ pl: 0 }}>
                      <ListItemIcon sx={{ minWidth: 28 }}>
                        <CheckCircleOutlineIcon fontSize="small" color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primaryTypographyProps={{ variant: "body1", color: "text.secondary" }}
                        primary={item}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </Stack>
          </Card>
        </Container>
      ))}

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
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1.5}
                alignItems="center"
                sx={{ mt: 1, width: "100%", "& > *": { width: { xs: "100%", sm: "auto" } } }}
              >
                {cta.primary && (
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
                )}
                {cta.secondary && (
                  <Button
                    component={Link}
                    to={cta.secondary.href}
                    variant="outlined"
                    size="large"
                    color="inherit"
                    endIcon={<LaunchIcon />}
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
                )}
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

export default MarketingPageTemplate;
