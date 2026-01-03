import React from "react";
import {
  Grid,
  Paper,
  Typography,
  Stack,
  Button,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Box,
  Chip,
} from "@mui/material";
import { Link } from "react-router-dom";

const PricingCard = ({
  planKey,
  name,
  price,
  positioning,
  description,
  trialNote,
  features = [],
  ctaLabel,
  ctaTo,
  highlight,
  badge,
  onCtaClick,
  ctaLoadingKey,
}) => (
  <Paper
    elevation={highlight ? 8 : 2}
    sx={{
      p: 4,
      height: "100%",
      borderRadius: 4,
      border: (theme) => (highlight ? `2px solid ${theme.palette.primary.main}` : `1px solid ${theme.palette.divider}`),
      transform: highlight ? "scale(1.02)" : "none",
      transition: "transform 0.2s ease",
      background: highlight ? (theme) => theme.palette.background.paper : undefined,
    }}
  >
    <Stack spacing={2}>
      {badge && (
        <Chip
          label={badge}
          color={highlight ? "primary" : "default"}
          size="small"
          sx={{ alignSelf: "flex-start", fontWeight: 600 }}
        />
      )}
      <Box>
        <Typography variant="h6" component="h3" fontWeight={700}>
          {name}
        </Typography>
        {positioning && (
          <Typography variant="subtitle2" color="text.secondary" mt={0.5}>
            {positioning}
          </Typography>
        )}
        <Typography variant="h3" component="p" fontWeight={700} mt={1}>
          {price}
        </Typography>
        <Typography variant="body1" color="text.secondary" mt={1}>
          {description}
        </Typography>
        {trialNote && (
          <Typography variant="body2" color="text.secondary" mt={1}>
            {trialNote}
          </Typography>
        )}
      </Box>
      <Stack component="ul" spacing={1.2} sx={{ pl: 2, m: 0 }}>
        {features.map((feature, index) => {
          if (feature && typeof feature === "object" && feature.type === "heading") {
            return (
              <Typography
                component="li"
                variant="overline"
                color="text.secondary"
                key={`${feature.text}-${index}`}
                sx={{ fontWeight: 700, listStyleType: "none", pl: 0, mt: 1 }}
              >
                {feature.text}
              </Typography>
            );
          }
          return (
            <Typography component="li" variant="body2" color="text.primary" key={`${feature}-${index}`}>
              {feature}
            </Typography>
          );
        })}
      </Stack>
      <Button
        component={onCtaClick ? "button" : Link}
        to={onCtaClick ? undefined : ctaTo}
        onClick={onCtaClick ? () => onCtaClick(planKey) : undefined}
        variant={highlight ? "contained" : "outlined"}
        color="primary"
        sx={{ textTransform: "none", borderRadius: 999 }}
        type={onCtaClick ? "button" : undefined}
        disabled={Boolean(ctaLoadingKey)}
      >
        {ctaLabel}
      </Button>
    </Stack>
  </Paper>
);

const PricingTable = ({ plans = [], addons = [], addonsTitle, addonHeaders = {}, onCtaClick, ctaLoadingKey }) => (
  <Stack spacing={6}>
    <Grid container spacing={3}>
      {plans.map((plan) => {
        const card = <PricingCard {...plan} planKey={plan.key} onCtaClick={onCtaClick} ctaLoadingKey={ctaLoadingKey} />;
        return (
          <Grid
            item
            xs={12}
            md={4}
            key={plan.key || plan.name}
            id={plan.anchorId || plan.key || undefined}
            component="section"
          >
            {card}
          </Grid>
        );
      })}
    </Grid>
    {addons.length > 0 && (
      <Box>
        {addonsTitle && (
          <Typography variant="h6" component="h4" fontWeight={700} mb={2}>
            {addonsTitle}
          </Typography>
        )}
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>{addonHeaders.addon || ""}</TableCell>
              <TableCell>{addonHeaders.price || ""}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {addons.map((addon) => (
              <TableRow key={addon.key || addon.name}>
                <TableCell>{addon.name}</TableCell>
                <TableCell>{addon.price}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
    )}
  </Stack>
);

export default PricingTable;
