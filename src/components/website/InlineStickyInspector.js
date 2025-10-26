// src/components/website/InlineStickyInspector.js
import * as React from "react";
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Divider,
  Tooltip,
} from "@mui/material";
import PushPinIcon from "@mui/icons-material/PushPin";           // Dock
import CloseFullscreenIcon from "@mui/icons-material/CloseFullscreen"; // Float

import SchemaInspector from "./SchemaInspector";
import { SCHEMA_REGISTRY } from "./schemas";

/**
 * A sticky inline inspector that appears BETWEEN sections.
 * Use inside your map() of sections:
 *
 *   <Box>...section...</Box>
 *   <InlineStickyInspector.Slot
 *     index={i}
 *     selectedIndex={selectedBlock}
 *     block={blk}
 *     fi={fi}
 *     mode={mode}
 *     companyId={companyId}
 *     onChangeProps={(np) => setBlockPropsAll(i, np)}
 *     onChangeProp={(k,v) => setBlockProp(i, k, v)}
 *     renderAdvancedEditor={({ block, onChangeProps, onChangeProp }) => (
 *       <SectionInspector .../>
 *     )}
 *   />
 */
function Slot({
  index,
  selectedIndex,
  block,
  fi,
  mode = "simple",
  companyId,
  onChangeProps,
  onChangeProp,
  renderAdvancedEditor,
  topOffset = 80, // distance from top when sticking
}) {
  const isInline = mode === "simple" && fi?.inspectorMode === "inline";
  const isActive = isInline && index === selectedIndex;
  if (!isActive || !block) return null;

  const type = block?.type;
  const schemaForBlock = (type && SCHEMA_REGISTRY[type]) || block?.schema || null;

  return (
    <Box
      // keeps natural flow (so it truly shows between sections)
      sx={{ position: "relative", my: 1 }}
      onClick={(e) => e.stopPropagation()} // avoid re-selecting parent
    >
      <Paper
        elevation={8}
        sx={{
          position: "sticky",
          top: (theme) => `calc(${topOffset}px + ${theme.spacing(1)})`,
          zIndex: (theme) => theme.zIndex.appBar, // stays above canvas
          borderRadius: 2,
          overflow: "hidden",
          maxWidth: { xs: "100%", md: 780 },
          ml: { xs: 0, md: 4 }, // indent a bit so it doesn't fully cover the block
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            px: 1.5,
            py: 1,
            borderBottom: "1px solid",
            borderColor: "divider",
            bgcolor: "background.paper",
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 700, flex: 1 }}>
            Simple editor — {type || "block"} #{index + 1}
          </Typography>

          <Tooltip title="Float beside the block">
            <IconButton size="small" onClick={() => fi?.setInspectorMode?.("float")}>
              <CloseFullscreenIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Dock to the right panel">
            <IconButton size="small" onClick={() => fi?.setInspectorMode?.("dock")}>
              <PushPinIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>

        <Box sx={{ p: 2, bgcolor: "background.default" }}>
          {mode === "simple" && schemaForBlock ? (
            <SchemaInspector
              schema={schemaForBlock}
              value={block?.props || {}}
              onChange={onChangeProps}
              companyId={companyId}
              mode={mode}
            />
          ) : (
            <>
              {renderAdvancedEditor?.({
                block,
                onChangeProps,
                onChangeProp,
              }) || null}
            </>
          )}
        </Box>

        <Divider />
        <Box sx={{ p: 1, textAlign: "right" }}>
          <Typography variant="caption" color="text.secondary">
            Tip: drag to scroll while hovering outside this card.
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}

export const InlineStickyInspector = { Slot };
export default InlineStickyInspector;
