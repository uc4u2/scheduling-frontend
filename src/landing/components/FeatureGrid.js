import React from "react";
import { Grid, Box, Typography, Paper, Stack, List, ListItem, ListItemIcon, ListItemText, Divider } from "@mui/material";
import CheckIcon from "@mui/icons-material/CheckCircleOutline";

const FeatureBullet = ({ text }) => (
  <ListItem sx={{ alignItems: "flex-start", px: 0 }}>
    <ListItemIcon sx={{ minWidth: 36, color: (theme) => theme.palette.primary.main }}>
      <CheckIcon fontSize="small" />
    </ListItemIcon>
    <ListItemText
      primary={text}
      primaryTypographyProps={{ variant: "body2", color: "text.secondary" }}
    />
  </ListItem>
);

const FeatureCard = ({ icon, title, description }) => (
  <Paper
    elevation={0}
    sx={{
      p: 3,
      height: "100%",
      borderRadius: 3,
      border: (theme) => `1px solid ${theme.palette.divider}`,
      background: (theme) =>
        theme.palette.mode === "dark"
          ? "linear-gradient(135deg, rgba(30,41,59,0.9), rgba(15,23,42,0.9))"
          : "linear-gradient(135deg, rgba(255,255,255,0.9), rgba(248,250,252,0.9))",
      backdropFilter: "blur(12px)",
    }}
  >
    <Stack spacing={2}>
      <Stack direction="row" spacing={1.5} alignItems="center">
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: 2,
            backgroundColor: (theme) => theme.palette.primary.main,
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 700,
            fontSize: 18,
            boxShadow: (theme) => theme.shadows[4],
          }}
        >
          {icon}
        </Box>
        <Typography variant="h6" component="h3" fontWeight={600}>
          {title}
        </Typography>
      </Stack>

      {Array.isArray(description) ? (
        <List dense disablePadding sx={{ pl: 0 }}>
          {description.map((item) => (
            <FeatureBullet key={item} text={item} />
          ))}
        </List>
      ) : (
        <Typography variant="body1" color="text.secondary">
          {description}
        </Typography>
      )}
    </Stack>
  </Paper>
);

const FeatureGrid = ({ title, subtitle, features = [], footer }) => (
  <Box component="section" id="features" sx={{ py: { xs: 8, md: 10 }, px: { xs: 2, md: 6 }, position: "relative" }}>
    <Stack spacing={6}>
      <Stack spacing={1.5} textAlign="center" maxWidth={820} mx="auto">
        {title && (
          <Typography variant="h4" component="h2" fontWeight={700}>
            {title}
          </Typography>
        )}
        {subtitle && (
          <Typography variant="subtitle1" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </Stack>

      <Grid container spacing={3}>
        {features.map((feature) => (
          <Grid item xs={12} md={4} key={feature.title}>
            <FeatureCard {...feature} />
          </Grid>
        ))}
      </Grid>

      {footer && (
        <Box>
          <Divider sx={{ mb: 4 }} />
          <Stack spacing={2} textAlign="center" maxWidth={720} mx="auto">
            <Typography variant="h5" component="h3" fontWeight={700}>
              {footer.title}
            </Typography>
            <List dense disablePadding>
              {footer.description.map((item) => (
                <FeatureBullet key={item} text={item} />
              ))}
            </List>
          </Stack>
        </Box>
      )}
    </Stack>
  </Box>
);

export default FeatureGrid;
