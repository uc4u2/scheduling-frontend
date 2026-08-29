// src/components/website/MediaLibraryDialog.js
import React, { useEffect, useState } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Grid, Box, Typography, CircularProgress, Alert
} from "@mui/material";
import { wb } from "../../utils/api";
import { isWebsiteVideoReference } from "../../utils/websiteSemanticModules";

export default function MediaLibraryDialog({ open, onClose, onPick, companyId, allowVideo = false }) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [items, setItems] = useState([]); // [{id,url,width,height,created_at}]

  const load = async () => {
    if (!open) return;
    setLoading(true);
    setErr("");
    try {
      const { data } = await wb.mediaList(companyId);
      const media = Array.isArray(data?.items) ? data.items : [];
      setItems(allowVideo ? media : media.filter((item) => !isWebsiteVideoReference(item)));
    } catch (e) {
      setErr("Could not load media (backend not wired yet).");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [open]);

  const onUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isVideo = isWebsiteVideoReference({ url: file.name, content_type: file.type });
    if (isVideo && !allowVideo) {
      setErr("This field accepts images only.");
      return;
    }
    if (allowVideo && String(file.type || "").startsWith("video/") && !isVideo) {
      setErr("Unsupported video format. Use MP4 or WebM.");
      return;
    }
    const maxBytes = isVideo ? 12 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxBytes) {
      setErr(isVideo ? "Video is too large. Maximum size is 12 MB." : "Image is too large. Maximum size is 5 MB.");
      return;
    }
    setLoading(true);
    setErr("");
    try {
      await wb.mediaUpload(companyId, file);
      await load();
    } catch (e) {
      if (e?.response?.status === 413) {
        setErr(isVideo ? "Video is too large. Maximum size is 12 MB." : "Image is too large. Maximum size is 5 MB.");
      } else {
        setErr("Upload failed. Check the file type and try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      aria-labelledby="website-media-library-title"
    >
      <DialogTitle id="website-media-library-title">Media Library</DialogTitle>
      <DialogContent dividers>
        <Box sx={{ mb: 2 }}>
          <Button component="label" variant="outlined">
            Upload…
            <input type="file" accept={allowVideo ? "image/*,.mp4,.webm,video/mp4,video/webm" : "image/*"} hidden onChange={onUpload} />
          </Button>
        </Box>

        {loading && <Box sx={{ textAlign: "center", p: 3 }}><CircularProgress /></Box>}
        {err && <Alert severity="error">{err}</Alert>}

        <Grid container spacing={2}>
          {items.map((m) => (
            <Grid item xs={6} sm={4} md={3} key={m.id}>
              <Box
                sx={{
                  border: "1px solid #eee",
                  borderRadius: 1,
                  overflow: "hidden",
                  cursor: "pointer",
                }}
                onClick={() => onPick?.(m)}
              >
                {isWebsiteVideoReference(m) ? (
                  <Box component="video" src={m.url} muted playsInline preload="metadata" aria-label="Video in media library" sx={{ width: "100%", aspectRatio: "4 / 3", objectFit: "cover", display: "block", bgcolor: "#000" }} />
                ) : (
                  <Box component="img" src={m.url} alt="" sx={{ width: "100%", display: "block" }} />
                )}
              </Box>
            </Grid>
          ))}
        </Grid>

        {!loading && items.length === 0 && (
          <Typography color="text.secondary" sx={{ mt: 2 }}>
            No media yet. Upload {allowVideo ? "an image or video" : "an image"} to get started.
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
