import React from "react";
import {
  Box,
  Button,
  Grid,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

const WebsiteSetupCards = ({
  title,
  subtitle,
  note,
  services = [],
  onSelect,
  loadingKey,
}) => (
  <Box id="website-setup" sx={{ mt: { xs: 4, md: 5 } }}>
    <Stack spacing={1} sx={{ mb: 3 }}>
      <Typography variant="h5" component="h3" fontWeight={800}>
        {title}
      </Typography>
      {subtitle && (
        <Typography variant="body1" color="text.secondary">
          {subtitle}
        </Typography>
      )}
    </Stack>

    <Grid container spacing={3}>
      {services.map((service) => (
        <Grid item xs={12} md={4} key={service.key}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              height: "100%",
              borderRadius: 4,
              border: (theme) => `1px solid ${theme.palette.divider}`,
            }}
          >
            <Stack spacing={2} sx={{ height: "100%" }}>
              <Box>
                <Typography variant="h6" fontWeight={800}>
                  {service.name}
                </Typography>
                <Typography variant="h4" fontWeight={800} sx={{ mt: 1 }}>
                  {service.price}
                </Typography>
                {service.priceNote && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {service.priceNote}
                  </Typography>
                )}
                <Typography variant="subtitle2" sx={{ mt: 1.5 }}>
                  {service.bestFor}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {service.description}
                </Typography>
              </Box>

              <Stack component="ul" spacing={1} sx={{ pl: 2, m: 0, flexGrow: 1 }}>
                {service.includes.map((item) => (
                  <Typography key={item} component="li" variant="body2">
                    {item}
                  </Typography>
                ))}
              </Stack>

              <Button
                variant={service.ctaMode === "checkout" ? "contained" : "outlined"}
                onClick={() => onSelect?.(service)}
                disabled={Boolean(loadingKey)}
              >
                {loadingKey === service.key && service.ctaMode === "checkout"
                  ? "Starting checkout..."
                  : service.ctaLabel}
              </Button>
            </Stack>
          </Paper>
        </Grid>
      ))}
    </Grid>

    {note && (
      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
        {note}
      </Typography>
    )}
  </Box>
);

export default WebsiteSetupCards;
