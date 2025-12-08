// src/components/zapier/ZapierApiKeysPanel.jsx
import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  Stack,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import api from "../../utils/api";

const ZapierApiKeysPanel = () => {
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [label, setLabel] = useState("");
  const [newKey, setNewKey] = useState(null);
  const [copyMessage, setCopyMessage] = useState("");

  const loadKeys = async () => {
    setLoading(true);
    try {
      const res = await api.get("/integrations/zapier/api-keys");
      setKeys(res.data?.api_keys || []);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Failed to load Zapier API keys", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadKeys();
  }, []);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const res = await api.post("/integrations/zapier/api-keys", {
        label: label.trim() || "Zapier integration key",
      });
      setNewKey(res.data?.api_key || null);
      setLabel("");
      await loadKeys();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Failed to create Zapier API key", err);
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (id) => {
    // eslint-disable-next-line no-alert
    const ok = window.confirm("Revoke this Zapier API key? Existing Zaps will stop working.");
    if (!ok) return;
    try {
      await api.delete(`/integrations/zapier/api-keys/${id}`);
      await loadKeys();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Failed to revoke Zapier API key", err);
    }
  };

  const handleCopy = (val) => {
    navigator.clipboard
      .writeText(val || "")
      .then(() => setCopyMessage("Copied"))
      .catch(() => setCopyMessage("Copy failed"));
    setTimeout(() => setCopyMessage(""), 1500);
  };

  const activeKey = keys.find((k) => !k.is_revoked);

  return (
    <Box>
      <Typography variant="h6" fontWeight={600} gutterBottom>
        Zapier API keys
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Use this key in Zapier when setting up Schedulaa actions. Keep it secret and do not share it publicly.
      </Typography>
      {activeKey && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          You already have an active key. Use it in your Zaps; create a new key only if you need to rotate it.
        </Typography>
      )}

      {!activeKey && (
        <Button variant="contained" onClick={handleCreate} disabled={creating} sx={{ mb: 2 }}>
          {creating ? "Creating..." : "Create my Zapier API key"}
        </Button>
      )}

      <Box sx={{ display: "flex", gap: 1, mb: 2, flexDirection: { xs: "column", sm: "row" } }}>
        <TextField
          size="small"
          label="Label"
          placeholder="e.g. HR onboarding zap"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          sx={{ flex: 1 }}
        />
        <Button variant="outlined" onClick={handleCreate} disabled={creating}>
          {creating ? "Creating..." : "Create key"}
        </Button>
      </Box>

      {activeKey && (
        <Box
          sx={{
            mb: 2,
            p: 1.5,
            borderRadius: 2,
            border: (theme) => `1px solid ${theme.palette.divider}`,
            backgroundColor: (theme) => (theme.palette.mode === "light" ? "#f9fafb" : "transparent"),
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1}>
            <Chip label="Active" color="success" size="small" />
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {activeKey.label}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Created {activeKey.created_at ? new Date(activeKey.created_at).toLocaleString() : "—"}
            </Typography>
          </Stack>
          <Typography variant="caption" color="text.secondary">
            Keys are only shown once on creation. Create a new key if you need to copy it again.
          </Typography>
        </Box>
      )}

      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Label</TableCell>
            <TableCell>Created</TableCell>
            <TableCell>Last used</TableCell>
            <TableCell>Status</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {keys.length === 0 && !loading && (
            <TableRow>
              <TableCell colSpan={5}>
                <Typography variant="body2" color="text.secondary">
                  No Zapier API keys yet. Create one to connect your Zaps.
                </Typography>
              </TableCell>
            </TableRow>
          )}
          {keys.map((k) => (
            <TableRow key={k.id}>
              <TableCell>{k.label}</TableCell>
              <TableCell>{k.created_at ? new Date(k.created_at).toLocaleString() : "—"}</TableCell>
              <TableCell>{k.last_used_at ? new Date(k.last_used_at).toLocaleString() : "Never"}</TableCell>
              <TableCell>
                {k.is_revoked ? (
                  <Chip label="Revoked" size="small" color="default" />
                ) : (
                  <Chip label="Active" size="small" color="success" />
                )}
              </TableCell>
              <TableCell align="right">
                {!k.is_revoked && (
                  <Tooltip title="Revoke key">
                    <IconButton size="small" onClick={() => handleRevoke(k.id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={!!newKey} onClose={() => setNewKey(null)} maxWidth="sm" fullWidth>
        <DialogTitle>New Zapier API key</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ mb: 1.5 }}>
            Copy this API key and paste it into your Zap. You won&apos;t be able to see it again later.
          </Typography>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              bgcolor: "background.default",
              p: 1,
              borderRadius: 1,
              border: (theme) => `1px solid ${theme.palette.divider}`,
              mb: 1,
            }}
          >
            <Typography variant="body2" sx={{ flex: 1, wordBreak: "break-all" }}>
              {newKey?.api_key}
            </Typography>
            <Tooltip title={copyMessage || "Copy"}>
              <IconButton size="small" onClick={() => handleCopy(newKey?.api_key)}>
                <ContentCopyIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
          <Typography variant="caption" color="text.secondary">
            Keep this value secret. Anyone with this key can perform Zapier actions for your company.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewKey(null)}>Done</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ZapierApiKeysPanel;
