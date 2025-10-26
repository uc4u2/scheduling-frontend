// src/components/website/ThemeDesignerDialog.js
import React from "react";
import {
  Dialog, DialogTitle, DialogContent, IconButton
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ThemeDesigner from "./ThemeDesigner";

export default function ThemeDesignerDialog({ open, onClose, companyId, previewPage = "home" }) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        Theme
        <IconButton
          aria-label="close" onClick={onClose}
          sx={{ position: "absolute", right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ p: 0 }}>
        <ThemeDesigner companyId={companyId} page={previewPage} />
      </DialogContent>
    </Dialog>
  );
}
