import React from "react";
import {
  Box,
  Grid,
  Typography,
  Stack,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import CheckIcon from "@mui/icons-material/CheckCircleOutline";

const FeatureComparison = ({ sections = [] }) => (
  <Box component="section" sx={{ py: { xs: 8, md: 12 }, px: { xs: 2, md: 6 } }}>
    <Stack spacing={{ xs: 6, md: 8 }}>
      {sections.map((section, index) => (
        <Paper
          key={section.title}
          elevation={0}
          sx={{
            borderRadius: 4,
            border: (theme) => `1px solid ${theme.palette.divider}`,
            overflow: "hidden",
            backdropFilter: "blur(10px)",
          }}
        >
          <Grid
            container
            spacing={{ xs: 3, md: 6 }}
            alignItems="stretch"
            direction={index % 2 === 0 ? "row" : "row-reverse"}
          >
            <Grid item xs={12} md={6}>
              <Box
                component="img"
                src={section.imageUrl}
                alt={section.title}
                sx={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  minHeight: { xs: 220, md: 320 },
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Stack spacing={2} sx={{ p: { xs: 3, md: 4 } }}>
                <Typography variant="overline" color="primary" fontWeight={600}>
                  Workflow Spotlight
                </Typography>
                <Typography variant="h5" component="h3" fontWeight={700}>
                  {section.title}
                </Typography>
                <List dense disablePadding>
                  {section.bullets.map((bullet) => (
                    <ListItem key={bullet} sx={{ px: 0 }}>
                      <ListItemIcon sx={{ minWidth: 36, color: (theme) => theme.palette.success.main }}>
                        <CheckIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText
                        primary={bullet}
                        primaryTypographyProps={{ variant: "body2", color: "text.secondary" }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Stack>
            </Grid>
          </Grid>
        </Paper>
      ))}
    </Stack>
  </Box>
);

export default FeatureComparison;
