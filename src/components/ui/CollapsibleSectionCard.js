import React, { useState } from "react";
import PropTypes from "prop-types";
import { Box, Button, Collapse, Typography } from "@mui/material";
import ExpandLessOutlinedIcon from "@mui/icons-material/ExpandLessOutlined";
import ExpandMoreOutlinedIcon from "@mui/icons-material/ExpandMoreOutlined";
import SectionCard from "./SectionCard";

export default function CollapsibleSectionCard({
  title,
  description,
  summary,
  children,
  contentId,
  defaultExpanded = false,
  expandLabel = "Review settings",
  collapseLabel = "Collapse",
  sx,
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <SectionCard
      title={title}
      description={description}
      actions={(
        <Button
          size="small"
          variant={expanded ? "text" : "outlined"}
          endIcon={expanded ? <ExpandLessOutlinedIcon /> : <ExpandMoreOutlinedIcon />}
          onClick={() => setExpanded((value) => !value)}
          aria-expanded={expanded}
          aria-controls={contentId}
          sx={{ minHeight: 40, whiteSpace: "nowrap" }}
        >
          {expanded ? collapseLabel : expandLabel}
        </Button>
      )}
      sx={{
        borderColor: expanded ? "primary.main" : "primary.light",
        borderLeftWidth: 3,
        boxShadow: expanded ? 1 : 0,
        transition: (theme) => theme.transitions.create(["border-color", "box-shadow"]),
        "& .MuiCardHeader-root": {
          borderBottom: expanded ? "1px solid" : 0,
          borderColor: "divider",
          flexDirection: { xs: "column", sm: "row" },
          alignItems: { xs: "stretch", sm: "flex-start" },
          gap: { xs: 1, sm: 2 },
        },
        "& .MuiCardHeader-content": {
          minWidth: 0,
          width: "100%",
        },
        "& .MuiCardHeader-action": {
          alignSelf: { xs: "stretch", sm: "flex-start" },
          m: 0,
          width: { xs: "100%", sm: "auto" },
        },
        "& .MuiCardHeader-action .MuiButton-root": {
          width: { xs: "100%", sm: "auto" },
          justifyContent: { xs: "space-between", sm: "center" },
        },
        "& .MuiCardContent-root": {
          pt: expanded ? 2.5 : 1.5,
          pb: expanded ? 3 : 1.5,
        },
        ...sx,
      }}
    >
      {!expanded && (
        <Box>
          {summary || (
            <Typography variant="body2" color="text.secondary">
              Open this section to review or change its settings.
            </Typography>
          )}
        </Box>
      )}
      <Collapse in={expanded} timeout="auto">
        <Box id={contentId}>{children}</Box>
      </Collapse>
    </SectionCard>
  );
}

CollapsibleSectionCard.propTypes = {
  title: PropTypes.node.isRequired,
  description: PropTypes.node,
  summary: PropTypes.node,
  children: PropTypes.node,
  contentId: PropTypes.string.isRequired,
  defaultExpanded: PropTypes.bool,
  expandLabel: PropTypes.string,
  collapseLabel: PropTypes.string,
  sx: PropTypes.object,
};
