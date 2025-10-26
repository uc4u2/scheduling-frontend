import React from "react";
import { Grid, Paper, Typography, Box, Stack } from "@mui/material";

const TestimonialCard = ({ quote, name, title }) => (
  <Paper elevation={0} sx={{ p: 4, height: "100%", borderRadius: 3, border: (theme) => `1px solid ${theme.palette.divider}` }}>
    <Stack spacing={2}>
      <Typography variant="body1" color="text.primary">
        “{quote}”
      </Typography>
      <Box>
        <Typography variant="subtitle1" fontWeight={600}>
          {name}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {title}
        </Typography>
      </Box>
    </Stack>
  </Paper>
);

const Testimonials = ({ testimonials = [] }) => (
  <Box component="section" sx={{ py: { xs: 8, md: 10 }, px: { xs: 2, md: 6 } }}>
    <Stack spacing={3} textAlign="center" mb={4}>
      <Typography variant="overline" color="text.secondary">
        Testimonials
      </Typography>
      <Typography variant="h4" component="h2" fontWeight={700}>
        Trusted by creative teams everywhere
      </Typography>
      <Typography variant="subtitle1" color="text.secondary">
        See how fast-growing studios unify booking, payroll, and client experiences with Schedulaa.
      </Typography>
    </Stack>
    <Grid container spacing={3}>
      {testimonials.map((testimonial) => (
        <Grid item xs={12} md={4} key={testimonial.name}>
          <TestimonialCard {...testimonial} />
        </Grid>
      ))}
    </Grid>
  </Box>
);

export default Testimonials;
