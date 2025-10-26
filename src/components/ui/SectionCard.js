// src/components/ui/SectionCard.js
import React from "react";
import PropTypes from "prop-types";
import { Card, CardHeader, CardContent, Typography } from "@mui/material";

/**
 * SectionCard
 * - Consistent card/frame for sections
 * - Accepts title, description, and actions
 */
export default function SectionCard({
  title,
  description,
  actions,
  children,
  sx,
  ...rest
}) {
  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 3,
        border: (theme) => `1px solid ${theme.palette.divider}`,
        overflow: "hidden",
        ...sx,
      }}
      {...rest}
    >
      {(title || description || actions) && (
        <CardHeader
          title={
            typeof title === "string" ? (
              <Typography variant="h6" fontWeight={700}>
                {title}
              </Typography>
            ) : (
              title
            )
          }
          subheader={
            description ? (
              typeof description === "string" ? (
                <Typography variant="body2" color="text.secondary">
                  {description}
                </Typography>
              ) : (
                description
              )
            ) : undefined
          }
          action={actions || null}
          sx={{
            px: 3,
            py: 2,
          }}
        />
      )}
      <CardContent sx={{ p: 3 }}>{children}</CardContent>
    </Card>
  );
}

SectionCard.propTypes = {
  title: PropTypes.node,
  description: PropTypes.node,
  actions: PropTypes.node,
  children: PropTypes.node,
  sx: PropTypes.object,
};
