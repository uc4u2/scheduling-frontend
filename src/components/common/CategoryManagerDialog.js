import React, { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
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
  onClose,
  onRename,
  onRemove,
}) {
  const [renaming, setRenaming] = useState(null);
  const [renameValue, setRenameValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

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
    const affected = Number(row.count || 0);
    const label = pluralize(affected, itemLabelSingular, itemLabelPlural);
    if (!window.confirm(`${affected} ${label} will move from ${row.name} to ${nextName}.`)) return;
    setBusy(true);
    setError("");
    try {
      await onRename?.(row.name, nextName);
      resetRename();
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Category rename failed.");
    } finally {
      setBusy(false);
    }
  };

  const submitRemove = async (row) => {
    const affected = Number(row.count || 0);
    const label = pluralize(affected, itemLabelSingular, itemLabelPlural);
    if (!window.confirm(`${affected} ${label} will become Uncategorized.`)) return;
    setBusy(true);
    setError("");
    try {
      await onRemove?.(row.name);
      resetRename();
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Category remove failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onClose={busy ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <Typography variant="body2" color="text.secondary">
            Rename a category or remove it from affected items. Removing a category keeps the items and marks them as Uncategorized.
          </Typography>
          {error && <Alert severity="error">{error}</Alert>}
          {rows.length === 0 ? (
            <Box sx={{ py: 3, textAlign: "center" }}>
              <Typography variant="body2" color="text.secondary">
                No categories yet. Add one while creating or editing an item.
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
                      borderColor: "divider",
                      borderRadius: 2,
                      p: 1.5,
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
                            Save
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
            Categories are still stored on each item. This does not create a separate category library.
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={busy}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
