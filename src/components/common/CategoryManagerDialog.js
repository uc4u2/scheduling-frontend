import React, { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

const clean = (value) => String(value || "").trim();

const pluralize = (count, singular, plural) => (Number(count || 0) === 1 ? singular : plural);

export default function CategoryManagerDialog({
  open,
  title = "Manage Categories",
  categories = [],
  itemLabelSingular = "item",
  itemLabelPlural = "items",
  loading = false,
  onClose,
  onRename,
  onRemove,
}) {
  const [renaming, setRenaming] = useState(null);
  const [renameValue, setRenameValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirmAction, setConfirmAction] = useState(null);

  const rows = useMemo(() => {
    const seen = new Map();
    for (const raw of categories || []) {
      const name = clean(raw?.name ?? raw);
      if (!name) continue;
      const key = name.toLowerCase();
      const count = Number(raw?.count || 0);
      if (!seen.has(key)) {
        seen.set(key, { name, count });
      } else {
        const existing = seen.get(key);
        seen.set(key, { ...existing, count: existing.count + count });
      }
    }
    return Array.from(seen.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [categories]);

  const resetRename = () => {
    setRenaming(null);
    setRenameValue("");
    setError("");
  };

  const startRename = (row) => {
    setRenaming(row.name);
    setRenameValue(row.name);
    setError("");
  };

  const submitRename = async (row) => {
    const nextName = clean(renameValue);
    if (!nextName) {
      setError("Category name is required.");
      return;
    }
    if (nextName === row.name) {
      setError("Enter a different category name.");
      return;
    }
    setError("");
    setConfirmAction({ type: "rename", row, nextName });
  };

  const submitRemove = async (row) => {
    setError("");
    setConfirmAction({ type: "remove", row });
  };

  const closeConfirmation = () => {
    if (!busy) setConfirmAction(null);
  };

  const executeConfirmedAction = async () => {
    if (!confirmAction || busy) return;
    setBusy(true);
    setError("");
    try {
      if (confirmAction.type === "rename") {
        await onRename?.(confirmAction.row.name, confirmAction.nextName);
      } else {
        await onRemove?.(confirmAction.row.name);
      }
      setConfirmAction(null);
      resetRename();
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Category update failed.");
    } finally {
      setBusy(false);
    }
  };

  const affectedCount = Number(confirmAction?.row?.count || 0);
  const affectedLabel = pluralize(affectedCount, itemLabelSingular, itemLabelPlural);

  return (
    <>
      <Dialog open={open} onClose={busy ? undefined : onClose} maxWidth="sm" fullWidth>
        <DialogTitle>{title}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <Typography variant="body2" color="text.secondary">
              Rename a category or remove it from affected items. Removing a category keeps the items and marks them as Uncategorized.
            </Typography>
            {error && <Alert severity="error">{error}</Alert>}
            {loading ? (
              <Stack alignItems="center" spacing={1.5} sx={{ py: 4 }}>
                <CircularProgress size={28} />
                <Typography variant="body2" color="text.secondary">
                  Loading categories...
                </Typography>
              </Stack>
            ) : rows.length === 0 ? (
              <Box
                sx={{
                  py: 4,
                  px: 2,
                  textAlign: "center",
                  border: "1px dashed",
                  borderColor: "divider",
                  borderRadius: 2,
                  backgroundColor: "action.hover",
                }}
              >
                <Typography variant="subtitle2">No categories yet</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  Add a category while creating or editing an item.
                </Typography>
              </Box>
            ) : (
              <Stack spacing={1.5}>
                {rows.map((row) => {
                  const isRenaming = renaming === row.name;
                  return (
                    <Box
                      key={row.name}
                      sx={{
                        border: "1px solid",
                        borderColor: isRenaming ? "primary.light" : "divider",
                        borderRadius: 2,
                        p: 1.5,
                        backgroundColor: isRenaming ? "action.hover" : "background.paper",
                      }}
                    >
                      <Stack
                        direction={{ xs: "column", sm: "row" }}
                        spacing={1.5}
                        alignItems={{ xs: "stretch", sm: "center" }}
                        justifyContent="space-between"
                      >
                        <Stack spacing={0.5}>
                          <Typography variant="subtitle2">{row.name}</Typography>
                          <Chip
                            size="small"
                            variant="outlined"
                            label={`${row.count} ${pluralize(row.count, itemLabelSingular, itemLabelPlural)}`}
                            sx={{ alignSelf: "flex-start" }}
                          />
                        </Stack>
                        {isRenaming ? (
                          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems="center">
                            <TextField
                              size="small"
                              label="New category name"
                              value={renameValue}
                              autoFocus
                              disabled={busy}
                              onChange={(event) => setRenameValue(event.target.value)}
                              onKeyDown={(event) => {
                                if (event.key === "Enter") submitRename(row);
                                if (event.key === "Escape") resetRename();
                              }}
                            />
                            <Button size="small" variant="contained" disabled={busy} onClick={() => submitRename(row)}>
                              Review
                            </Button>
                            <Button size="small" disabled={busy} onClick={resetRename}>
                              Cancel
                            </Button>
                          </Stack>
                        ) : (
                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <Button size="small" variant="outlined" disabled={busy} onClick={() => startRename(row)}>
                              Rename
                            </Button>
                            <Button size="small" color="error" variant="outlined" disabled={busy} onClick={() => submitRemove(row)}>
                              Remove
                            </Button>
                          </Stack>
                        )}
                      </Stack>
                    </Box>
                  );
                })}
              </Stack>
            )}
            <Divider />
            <Typography variant="caption" color="text.secondary">
              Categories are stored on each item. This does not create a separate category library.
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={busy}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(confirmAction)} onClose={closeConfirmation} maxWidth="xs" fullWidth>
        <DialogTitle>
          {confirmAction?.type === "rename" ? "Confirm category rename" : "Confirm category removal"}
        </DialogTitle>
        <DialogContent dividers>
          {confirmAction?.type === "rename" ? (
            <Stack spacing={1.5}>
              <Typography variant="body2">
                {affectedCount} {affectedLabel} will move from <strong>{confirmAction.row.name}</strong> to{" "}
                <strong>{confirmAction.nextName}</strong>.
              </Typography>
              <Alert severity="info">
                Items stay active. Only their category name changes.
              </Alert>
            </Stack>
          ) : (
            <Stack spacing={1.5}>
              <Typography variant="body2">
                {affectedCount} {affectedLabel} will become <strong>Uncategorized</strong>.
              </Typography>
              <Alert severity="warning">
                No items will be deleted. This only clears the category from affected items.
              </Alert>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeConfirmation} disabled={busy}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color={confirmAction?.type === "remove" ? "error" : "primary"}
            disabled={busy}
            onClick={executeConfirmedAction}
            startIcon={busy ? <CircularProgress size={16} color="inherit" /> : null}
          >
            {confirmAction?.type === "rename" ? "Confirm rename" : "Remove category"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
