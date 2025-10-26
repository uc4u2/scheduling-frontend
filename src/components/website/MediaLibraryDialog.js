// src/components/website/MediaLibraryDialog.js
import React, { useEffect, useState } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Grid, Box, Typography, CircularProgress, Alert
} from "@mui/material";
import { wb } from "../../utils/api";

export default function MediaLibraryDialog({ open, onClose, onPick, companyId }) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [items, setItems] = useState([]); // [{id,url,width,height,created_at}]

  const load = async () => {
    if (!open) return;
    setLoading(true);
    setErr("");
    try {
      const { data } = await wb.mediaList(companyId);
      setItems(Array.isArray(data?.items) ? data.items : []);
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
    setLoading(true);
    setErr("");
    try {
      await wb.mediaUpload(companyId, file);
      await load();
    } catch (e) {
      setErr("Upload failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Media Library</DialogTitle>
      <DialogContent dividers>
        <Box sx={{ mb: 2 }}>
          <Button component="label" variant="outlined">
            Upload…
            <input type="file" accept="image/*" hidden onChange={onUpload} />
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
                onClick={() => onPick?.(m.url)}
              >
                <Box component="img" src={m.url} alt="" sx={{ width: "100%", display: "block" }} />
              </Box>
            </Grid>
          ))}
        </Grid>

        {!loading && items.length === 0 && (
          <Typography color="text.secondary" sx={{ mt: 2 }}>
            No media yet. Upload an image to get started.
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
