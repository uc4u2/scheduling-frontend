// src/components/website/FloatingInspector.js
import * as React from "react";
import {
  Popper,
  Paper,
  Box,
  Typography,
  IconButton,
  ClickAwayListener,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Switch,
  FormControlLabel,
} from "@mui/material";
import PushPinIcon from "@mui/icons-material/PushPin"; // dock
import CloseFullscreenIcon from "@mui/icons-material/CloseFullscreen"; // float
import VerticalAlignTopIcon from "@mui/icons-material/VerticalAlignTop";
import VerticalAlignBottomIcon from "@mui/icons-material/VerticalAlignBottom";
import WestIcon from "@mui/icons-material/West";   // start
import EastIcon from "@mui/icons-material/East";   // end

import SchemaInspector from "./SchemaInspector"; // your existing inspector

/**
 * Hook that manages all floating inspector state + anchors.
 * Usage in VisualSiteBuilder:
 *   const fi = useFloatingInspector({ mode });
 *   <Box ref={fi.anchorRef(i)} ...> ...each section... </Box>
 */
export function useFloatingInspector({ mode }) {
  const sectionRefs = React.useRef({}); // index -> DOM node

  const [inspectorMode, setInspectorMode] = React.useState("dock"); // 'dock' | 'float'
  const [followSelection, setFollowSelection] = React.useState(true);
  const [placement, setPlacement] = React.useState({
    vertical: "bottom", // 'top' | 'bottom'
    horizontal: "start", // 'start' | 'end'
  });

  const anchorRef = React.useCallback(
    (index) => (el) => {
      sectionRefs.current[index] = el || null;
    },
    []
  );

  const getAnchorEl = React.useCallback(
    (index) => sectionRefs.current[index] || null,
    []
  );

  const isFloatingActive = mode === "simple" && inspectorMode === "float";

  return {
    // state
    inspectorMode,
    setInspectorMode,
    followSelection,
    setFollowSelection,
    placement,
    setPlacement,
    // anchors
    anchorRef,
    getAnchorEl,
    // helpers
    isFloatingActive,
    mode,
  };
}

/**
 * Controls for the top toolbar (Dock/Float, Follow, Placement).
 * Drop this inline inside your VisualSiteBuilder toolbar.
 */
function ControlsInner({ fi }) {
  const { mode, inspectorMode, setInspectorMode, followSelection, setFollowSelection, placement, setPlacement } = fi;
  const disabled = mode !== "simple";

  return (
    <>
      <Tooltip title={disabled ? "Enable Simple mode to float the editor" : "Inspector mode"}>
        <span>
          <ToggleButtonGroup
            size="small"
            exclusive
            value={inspectorMode}
            onChange={(_, v) => v && setInspectorMode(v)}
            sx={{ ml: 1 }}
            disabled={disabled}
          >
            <ToggleButton value="dock"><PushPinIcon fontSize="small" /></ToggleButton>
            <ToggleButton value="float"><CloseFullscreenIcon fontSize="small" /></ToggleButton>
          </ToggleButtonGroup>
        </span>
      </Tooltip>

      <FormControlLabel
        sx={{ ml: 1 }}
        label="Follow selection"
        control={
          <Switch
            checked={followSelection}
            onChange={(_, v) => setFollowSelection(v)}
            disabled={disabled || inspectorMode !== "float"}
          />
        }
      />

      <ToggleButtonGroup
        size="small"
        exclusive
        value={placement.vertical}
        onChange={(_, v) => v && setPlacement((p) => ({ ...p, vertical: v }))}
        sx={{ ml: 1 }}
        disabled={disabled || inspectorMode !== "float"}
      >
        <ToggleButton value="top"><VerticalAlignTopIcon fontSize="small" /></ToggleButton>
        <ToggleButton value="bottom"><VerticalAlignBottomIcon fontSize="small" /></ToggleButton>
      </ToggleButtonGroup>

      <ToggleButtonGroup
        size="small"
        exclusive
        value={placement.horizontal}
        onChange={(_, v) => v && setPlacement((p) => ({ ...p, horizontal: v }))}
        sx={{ ml: 1 }}
        disabled={disabled || inspectorMode !== "float"}
      >
        <ToggleButton value="start"><WestIcon fontSize="small" /></ToggleButton>
        <ToggleButton value="end"><EastIcon fontSize="small" /></ToggleButton>
      </ToggleButtonGroup>
    </>
  );
}

/**
 * Floating panel that renders next to the selected section when in float mode.
 * If schemaForBlock exists and mode==='simple' => renders SchemaInspector.
 * Otherwise, it will render your provided advanced editor (renderAdvancedEditor).
 */
function PanelInner({
  fi,
  selectedIndex,
  selectedBlockObj,
  schemaForBlock,
  companyId,
  onChangeProps,
  onChangeProp,
  renderAdvancedEditor,
}) {
  const { getAnchorEl, isFloatingActive, placement, followSelection, setInspectorMode, mode } = fi;
  const anchorEl = getAnchorEl(selectedIndex);

  // auto-scroll to selection if enabled
  React.useEffect(() => {
    if (!followSelection || !anchorEl) return;
    try {
      anchorEl.scrollIntoView({ behavior: "smooth", block: "center" });
    } catch {}
  }, [anchorEl, followSelection]);

  if (!isFloatingActive || selectedIndex < 0) return null;
  if (!anchorEl) return null;

  const popperPlacement = `${placement.vertical}-${placement.horizontal}`;

  return (
    <Popper
      open
      anchorEl={anchorEl}
      placement={popperPlacement}
      modifiers={[
        { name: "offset", options: { offset: [0, 12] } },
        { name: "preventOverflow", options: { boundary: "viewport", tether: true } },
        { name: "flip", options: { fallbackPlacements: ["bottom", "top", "right", "left"] } },
      ]}
      style={{ zIndex: 1300 }}
    >
      <ClickAwayListener onClickAway={() => { /* keep open; click away only dismisses if desired */ }}>
        <Paper elevation={8} sx={{ width: { xs: 320, md: 380 }, maxWidth: "90vw", borderRadius: 2, overflow: "hidden" }}>
          <Box sx={{ p: 1, borderBottom: "1px solid", borderColor: "divider", display: "flex", alignItems: "center", gap: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, flex: 1 }}>
              Simple editor — #{selectedIndex + 1}
            </Typography>
            <Tooltip title="Dock to right">
              <IconButton size="small" onClick={() => setInspectorMode("dock")}>
                <PushPinIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>

          <Box sx={{ p: 2 }}>
            {mode === "simple" && schemaForBlock ? (
              <SchemaInspector
                schema={schemaForBlock}
                value={selectedBlockObj?.props || {}}
                onChange={onChangeProps}
                companyId={companyId}
                mode={mode}
              />
            ) : (
              // Fall back to the "advanced" editor provided by VisualSiteBuilder
              renderAdvancedEditor?.({ block: selectedBlockObj, onChangeProps, onChangeProp }) || null
            )}
          </Box>
        </Paper>
      </ClickAwayListener>
    </Popper>
  );
}

/** Public API: use like <FloatingInspector.Controls fi={fi} /> */
export const FloatingInspector = {
  Controls: ControlsInner,
  Panel: PanelInner,
};
