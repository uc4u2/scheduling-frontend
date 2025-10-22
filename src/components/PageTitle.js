import React from "react";
import { Typography, Box } from "@mui/material";
import { useTheme } from "@mui/material/styles";

const PageTitle = ({ title, subtitle }) => {
  const theme = useTheme();

  return (
    <Box mb={4}>
      <Typography
        variant="h3"
        component="h1"
        sx={{
          fontWeight: 700,
          fontFamily: "'Poppins', 'Roboto', sans-serif",
          color: theme.palette.text.primary,
          letterSpacing: "0.05em",
          mb: subtitle ? 0.5 : 2,
          textTransform: "capitalize",
        }}
      >
        {title}
      </Typography>
      {subtitle && (
        <Typography
          variant="subtitle1"
          sx={{
            fontWeight: 400,
            color: theme.palette.text.secondary,
            fontFamily: "'Poppins', 'Roboto', sans-serif",
            letterSpacing: "0.02em",
            textTransform: "capitalize",
          }}
        >
          {subtitle}
        </Typography>
      )}
    </Box>
  );
};

export default PageTitle;
