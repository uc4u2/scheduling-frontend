import React from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

export default function FinanceOverviewSection({
  sectionId,
  title,
  summary,
  expanded,
  onChange,
  children,
}) {
  const summaryId = `finance-overview-${sectionId}-header`;
  const detailsId = `finance-overview-${sectionId}-content`;

  return (
    <Accordion
      expanded={expanded}
      onChange={(_, nextExpanded) => onChange(nextExpanded)}
      disableGutters
      elevation={0}
      square={false}
      data-testid={`finance-section-${sectionId}`}
      sx={{
        width: "100%",
        maxWidth: "100%",
        minWidth: 0,
        overflow: "hidden",
        border: 1,
        borderColor: "divider",
        borderRadius: "12px !important",
        "&::before": { display: "none" },
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        aria-controls={detailsId}
        id={summaryId}
        sx={{
          minHeight: { xs: 58, sm: 64 },
          px: { xs: 1.75, sm: 2.5 },
          "& .MuiAccordionSummary-content": {
            minWidth: 0,
            my: 1.25,
          },
        }}
      >
        <Box sx={{ minWidth: 0, width: "100%" }}>
          <Typography variant="subtitle1" fontWeight={900}>
            {title}
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ overflowWrap: "anywhere" }}
          >
            {summary}
          </Typography>
        </Box>
      </AccordionSummary>
      <AccordionDetails
        id={detailsId}
        aria-labelledby={summaryId}
        sx={{
          minWidth: 0,
          overflowX: "hidden",
          px: { xs: 1.5, sm: 2.5 },
          pb: { xs: 2, sm: 2.5 },
          pt: 0.5,
        }}
      >
        {children}
      </AccordionDetails>
    </Accordion>
  );
}
