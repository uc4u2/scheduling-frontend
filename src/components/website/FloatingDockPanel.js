// src/components/website/FloatingDockPanel.js
import React from "react";
import {
  Box,
  Paper,
  Drawer,
  ToggleButtonGroup,
  ToggleButton,
  IconButton,
  Typography,
  Stack,
  Divider,
  Portal,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import OpenInFullIcon from "@mui/icons-material/OpenInFull";
import WebAssetIcon from "@mui/icons-material/WebAsset";
import VerticalSplitIcon from "@mui/icons-material/VerticalSplit";
import SpaceBarIcon from "@mui/icons-material/SpaceBar";

const LS_KEY = "layout_lab_dock_v1";

function usePersistedState(key, initial) {
  const [state, setState] = React.useState(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : initial;
    } catch {
      return initial;
    }
  });
  React.useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {}
  }, [key, state]);
  return [state, setState];
}

export default function FloatingDockPanel({
  title = "Tuning",
  initialMode = "right",               // 'left' | 'right' | 'bottom' | 'float'
  defaultSize = { w: 380, h: 560 },
  onClose,
  children,
  forceOpenSignal,                     // NEW: number; bump to force open
  anchorRef,                           // NEW: ref to preview container for smart positioning
}) {
  const [dock, setDock] = usePersistedState(LS_KEY, {
    mode: initialMode,
    w: defaultSize.w,
    h: defaultSize.h,
    x: window.innerWidth - (defaultSize.w + 24),
    y: 96,
    open: true,
  });

  const setMode = (mode) => setDock((d) => ({ ...d, mode, open: true }));
  const setOpen = (open) => setDock((d) => ({ ...d, open }));

  // drag/resize only for float mode
  const panelRef = React.useRef(null);
  const dragRef = React.useRef(null);
  const isFloat = dock.mode === "float";


  // Open on demand + snap near anchor
 React.useEffect(() => {
   if (forceOpenSignal == null) return;
   setDock((d) => {
     let next = { ...d, open: true };
     if (anchorRef?.current && d.mode === "float") {
       const rect = anchorRef.current.getBoundingClientRect();
       // place panel to the right of preview, with small gap
       const gap = 12;
       const nx = Math.min(
         window.innerWidth - (d.w + 24),
         Math.max(0, rect.right + gap)
       );
       const ny = Math.max(80, rect.top);
       next.x = nx;
       next.y = ny;
     }
     return next;
   });
   // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [forceOpenSignal]);

  React.useEffect(() => {
    if (!isFloat) return;
    const panel = panelRef.current;
    const drag = dragRef.current;
    if (!panel || !drag) return;

    let startX = 0;
    let startY = 0;
    let startLeft = dock.x;
    let startTop = dock.y;
    let dragging = false;

    const onDown = (e) => {
      dragging = true;
      startX = e.clientX;
      startY = e.clientY;
      startLeft = dock.x;
      startTop = dock.y;
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    };
    const onMove = (e) => {
      if (!dragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      const nx = Math.min(window.innerWidth - 80, Math.max(0, startLeft + dx));
      const ny = Math.min(window.innerHeight - 80, Math.max(0, startTop + dy));
      setDock((d) => ({ ...d, x: nx, y: ny }));
    };
    const onUp = () => {
      dragging = false;
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
    drag.addEventListener("mousedown", onDown);
    return () => {
      drag.removeEventListener("mousedown", onDown);
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
  }, [isFloat, dock.x, dock.y, setDock]);

  // resize handle (bottom-right) for float
  React.useEffect(() => {
    if (!isFloat) return;
    const panel = panelRef.current;
    if (!panel) return;

    const resizer = panel.querySelector("[data-resizer]");
    if (!resizer) return;

    let startX = 0, startY = 0, startW = dock.w, startH = dock.h, resizing = false;
    const onDown = (e) => {
      e.preventDefault();
      resizing = true;
      startX = e.clientX;
      startY = e.clientY;
      startW = dock.w;
      startH = dock.h;
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    };
    const onMove = (e) => {
      if (!resizing) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      setDock((d) => ({
        ...d,
        w: Math.max(300, startW + dx),
        h: Math.max(360, startH + dy),
      }));
    };
    const onUp = () => {
      resizing = false;
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
    resizer.addEventListener("mousedown", onDown);
    return () => {
      resizer.removeEventListener("mousedown", onDown);
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
  }, [isFloat, dock.w, dock.h, setDock]);

  const Header = (
    <Stack
      direction="row"
      alignItems="center"
      spacing={1}
      sx={{
        px: 1,
        py: 0.5,
        cursor: isFloat ? "move" : "default",
        bgcolor: "background.paper",
        borderBottom: "1px solid",
        borderColor: "divider",
      }}
      ref={isFloat ? dragRef : undefined}
    >
      <Typography variant="subtitle2" sx={{ flex: 1, userSelect: "none" }}>
        {title}
      </Typography>
      <ToggleButtonGroup
        exclusive
        size="small"
        value={dock.mode}
        onChange={(_, v) => v && setMode(v)}
      >
        <ToggleButton value="left" title="Dock left">
          <VerticalSplitIcon fontSize="small" />
        </ToggleButton>
        <ToggleButton value="right" title="Dock right">
          <VerticalSplitIcon sx={{ transform: "scaleX(-1)" }} fontSize="small" />
        </ToggleButton>
        <ToggleButton value="bottom" title="Dock bottom">
          <SpaceBarIcon fontSize="small" />
        </ToggleButton>
        <ToggleButton value="float" title="Float">
          <OpenInFullIcon fontSize="small" />
        </ToggleButton>
      </ToggleButtonGroup>
      <IconButton size="small" onClick={() => setOpen(false)} title="Close">
        <CloseIcon fontSize="small" />
      </IconButton>
    </Stack>
  );

  if (!dock.open) return null;

  if (dock.mode === "left" || dock.mode === "right" || dock.mode === "bottom") {
    const anchor = dock.mode === "bottom" ? "bottom" : dock.mode;
    return (
      <Drawer
        open
        onClose={() => setOpen(false)}
        anchor={anchor}
        PaperProps={{
          sx: {
            width: dock.mode === "bottom" ? "100%" : dock.w,
            height: dock.mode === "bottom" ? dock.h : "100%",
            zIndex: (t) => t.zIndex.drawer + 5,
          },
        }}
      >
        {Header}
        <Box sx={{ p: 1, height: "100%", overflow: "auto" }}>{children}</Box>
      </Drawer>
    );
  }

  // Float mode
  return (
    <Portal>
      <Paper
        ref={panelRef}
        elevation={8}
        sx={{
          position: "fixed",
          zIndex: (t) => t.zIndex.modal + 5,
          left: dock.x,
          top: dock.y,
          width: dock.w,
          height: dock.h,
          display: "flex",
          flexDirection: "column",
          borderRadius: 2,
          overflow: "hidden",
        }}
      >
        {Header}
        <Box sx={{ p: 1, flex: 1, overflow: "auto" }}>{children}</Box>
        {/* resizer */}
        <Box
          data-resizer
          sx={{
            position: "absolute",
            right: 0,
            bottom: 0,
            width: 16,
            height: 16,
            cursor: "nwse-resize",
            bgcolor: "transparent",
          }}
        />
      </Paper>
    </Portal>
  );
}
