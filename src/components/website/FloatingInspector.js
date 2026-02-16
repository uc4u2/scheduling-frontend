// src/components/website/FloatingInspector.js
import * as React from "react";
import {
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
import CloseIcon from "@mui/icons-material/Close";
import OpenWithIcon from "@mui/icons-material/OpenWith";

import SchemaInspector from "./SchemaInspector"; // your existing inspector

/**
 * Hook that manages all floating inspector state + anchors.
 * Usage in VisualSiteBuilder:
 *   const fi = useFloatingInspector({ mode });
 *   <Box ref={fi.anchorRef(i)} ...> ...each section... </Box>
 */
export function useFloatingInspector({ mode }) {
  const sectionRefs = React.useRef({}); // index -> DOM node
  const STORAGE_KEY = "vsb_floating_inspector_offset_v1";
  const clampSavedOffset = React.useCallback((offset) => {
    const x = Number(offset?.x);
    const y = Number(offset?.y);
    const safeX = Number.isFinite(x) ? x : 0;
    const safeY = Number.isFinite(y) ? y : 0;
    if (typeof window === "undefined") return { x: safeX, y: safeY };
    // Keep restored offsets within a sane envelope of current viewport.
    const limitX = Math.max(200, window.innerWidth);
    const limitY = Math.max(200, window.innerHeight);
    return {
      x: Math.max(-limitX, Math.min(limitX, safeX)),
      y: Math.max(-limitY, Math.min(limitY, safeY)),
    };
  }, []);

  const [inspectorMode, setInspectorMode] = React.useState("dock"); // 'dock' | 'float'
  const [followSelection, setFollowSelection] = React.useState(true);
  const [placement, setPlacement] = React.useState({
    vertical: "bottom", // 'top' | 'bottom'
    horizontal: "start", // 'start' | 'end'
  });
  const [panelOffset, setPanelOffset] = React.useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { x: 0, y: 0 };
      const parsed = JSON.parse(raw);
      return clampSavedOffset(parsed);
    } catch {
      return { x: 0, y: 0 };
    }
  });

  React.useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(panelOffset));
    } catch {
      // ignore storage errors
    }
  }, [panelOffset]);

  React.useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const onResize = () => setPanelOffset((prev) => clampSavedOffset(prev));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [clampSavedOffset]);

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
    panelOffset,
    setPanelOffset,
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
  onClose,
}) {
  const { isFloatingActive, mode, panelOffset, setPanelOffset } = fi;
  const dragStateRef = React.useRef(null);
  const paperRef = React.useRef(null);

  const handleDragMove = React.useCallback((event) => {
    if (!dragStateRef.current) return;
    const point = event.touches ? event.touches[0] : event;
    if (!point) return;
    setPanelOffset({
      x: dragStateRef.current.baseX + (point.clientX - dragStateRef.current.startX),
      y: dragStateRef.current.baseY + (point.clientY - dragStateRef.current.startY),
    });
    if (event.cancelable) event.preventDefault();
  }, [setPanelOffset]);

  const stopDrag = React.useCallback(() => {
    dragStateRef.current = null;
    window.removeEventListener("mousemove", handleDragMove);
    window.removeEventListener("mouseup", stopDrag);
    window.removeEventListener("touchmove", handleDragMove);
    window.removeEventListener("touchend", stopDrag);
  }, [handleDragMove]);

  const startDrag = React.useCallback((event) => {
    const point = event.touches ? event.touches[0] : event;
    if (!point) return;
    dragStateRef.current = {
      startX: point.clientX,
      startY: point.clientY,
      baseX: panelOffset?.x || 0,
      baseY: panelOffset?.y || 0,
    };
    window.addEventListener("mousemove", handleDragMove);
    window.addEventListener("mouseup", stopDrag);
    window.addEventListener("touchmove", handleDragMove, { passive: false });
    window.addEventListener("touchend", stopDrag);
    if (event.cancelable) event.preventDefault();
  }, [panelOffset?.x, panelOffset?.y, handleDragMove, stopDrag]);

  React.useEffect(() => () => stopDrag(), [stopDrag]);

  // Keep the floating panel reachable even if a saved offset pushes it off-screen.
  React.useEffect(() => {
    if (!isFloatingActive || selectedIndex < 0) return;
    const node = paperRef.current;
    if (!node) return;

    const raf = window.requestAnimationFrame(() => {
      const rect = node.getBoundingClientRect();
      const margin = 12;
      const maxX = window.innerWidth - margin;
      const maxY = window.innerHeight - margin;
      let dx = 0;
      let dy = 0;

      // If the panel is substantially outside viewport, hard reset.
      const largelyOffscreen =
        rect.right < margin ||
        rect.left > window.innerWidth - margin ||
        rect.bottom < margin ||
        rect.top > window.innerHeight - margin;
      if (largelyOffscreen) {
        setPanelOffset({ x: 0, y: 0 });
        return;
      }

      if (rect.left < margin) dx = margin - rect.left;
      else if (rect.right > maxX) dx = maxX - rect.right;

      if (rect.top < margin) dy = margin - rect.top;
      else if (rect.bottom > maxY) dy = maxY - rect.bottom;

      if (dx || dy) {
        setPanelOffset((prev) => ({
          x: (prev?.x || 0) + dx,
          y: (prev?.y || 0) + dy,
        }));
      }
    });

    return () => window.cancelAnimationFrame(raf);
  }, [isFloatingActive, selectedIndex, panelOffset?.x, panelOffset?.y, setPanelOffset]);

  if (!isFloatingActive || selectedIndex < 0) return null;

  return (
    <Box
      sx={{
        position: "fixed",
        top: { xs: 92, md: 140 },
        left: { xs: 10, md: 24 },
        zIndex: 1300,
        pointerEvents: "none",
      }}
    >
      <ClickAwayListener onClickAway={() => { /* keep open; click away only dismisses if desired */ }}>
        <Paper
          ref={paperRef}
          elevation={8}
          sx={{
            width: { xs: 320, md: 380 },
            maxWidth: "90vw",
            maxHeight: "80vh",
            borderRadius: 2,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            transform: `translate(${panelOffset?.x || 0}px, ${panelOffset?.y || 0}px)`,
            pointerEvents: "auto",
          }}
        >
          <Box sx={{ p: 1, borderBottom: "1px solid", borderColor: "divider", display: "flex", alignItems: "center", gap: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, flex: 1 }}>
              Simple editor — #{selectedIndex + 1}
            </Typography>
            <Tooltip title="Move panel">
              <IconButton
                size="small"
                onMouseDown={startDrag}
                onTouchStart={startDrag}
                sx={{ cursor: "grab" }}
              >
                <OpenWithIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Close">
              <IconButton size="small" onClick={() => onClose?.()}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>

          <Box
            sx={{
              p: 2,
              overflowY: "auto",
              overflowX: "hidden",
              minHeight: 0,
              flex: 1,
              overscrollBehavior: "contain",
            }}
          >
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
    </Box>
  );
}

/** Public API: use like <FloatingInspector.Controls fi={fi} /> */
export const FloatingInspector = {
  Controls: ControlsInner,
  Panel: PanelInner,
};
