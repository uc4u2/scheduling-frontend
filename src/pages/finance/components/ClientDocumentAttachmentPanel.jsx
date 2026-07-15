import React, { useMemo, useState } from "react";
import {
  Alert,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  FormGroup,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined";

const chipSxByTone = {
  success: {
    color: "#166534",
    backgroundColor: "#DCFCE7",
    borderColor: "#BBF7D0",
  },
  info: {
    color: "#075985",
    backgroundColor: "#E0F2FE",
    borderColor: "#BAE6FD",
  },
  default: {
    color: "#334155",
    backgroundColor: "#F8FAFC",
    borderColor: "#CBD5E1",
  },
};

const attachmentChipSx = (tone = "default") => ({
  height: 24,
  borderRadius: 999,
  borderWidth: 1,
  borderStyle: "solid",
  fontWeight: 700,
  ...chipSxByTone[tone],
  "& .MuiChip-label": {
    px: 1,
    fontWeight: 700,
  },
});

const categoryLabel = (value) => {
  const key = String(value || "").trim();
  if (!key) return "Other";
  return key
    .split("_")
    .map((part) => (part ? part.charAt(0).toUpperCase() + part.slice(1) : ""))
    .join(" ");
};

const formatDateTime = (value) => {
  if (!value) return "—";
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime())) return "—";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
};

export default function ClientDocumentAttachmentPanel({
  clientId,
  documents = [],
  selectedIds = [],
  onSelectedIdsChange,
  uploading = false,
  onUpload,
  deletingDocumentId = "",
  onDeleteDocument,
}) {
  const [existingPickerOpen, setExistingPickerOpen] = useState(false);
  const [existingSearch, setExistingSearch] = useState("");
  const attachableDocuments = useMemo(
    () => (documents || []).filter((row) => row?.is_email_attachable),
    [documents]
  );
  const selectedAttachableDocuments = useMemo(() => {
    const selectedSet = new Set((selectedIds || []).map((value) => String(value)));
    return attachableDocuments.filter((row) => selectedSet.has(String(row.id)));
  }, [attachableDocuments, selectedIds]);
  const filteredAttachableDocuments = useMemo(() => {
    const query = String(existingSearch || "").trim().toLowerCase();
    if (!query) return attachableDocuments.slice(0, 20);
    return attachableDocuments
      .filter((row) => {
        const filename = String(row?.original_filename || "").toLowerCase();
        const category = String(categoryLabel(row?.category) || "").toLowerCase();
        return filename.includes(query) || category.includes(query);
      })
      .slice(0, 20);
  }, [attachableDocuments, existingSearch]);

  if (!clientId) {
    return (
      <Alert severity="info">
        Attachments are available when this email is linked to a saved client profile.
      </Alert>
    );
  }

  return (
    <>
    <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 1.5, backgroundColor: "rgba(15,23,42,0.02)" }}>
      <Stack spacing={1}>
        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} spacing={1}>
          <Typography fontWeight={700}>Attachments</Typography>
          <Stack direction="row" spacing={1} alignItems="center" useFlexGap flexWrap="wrap">
            <Chip
              size="small"
              label={selectedIds.length ? `${selectedIds.length} attached` : "No attachments selected"}
              variant="outlined"
              sx={attachmentChipSx(selectedIds.length ? "info" : "default")}
            />
          </Stack>
        </Stack>
        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
          {documents.length ? (
            <Button size="small" variant="outlined" onClick={() => setExistingPickerOpen(true)}>
              Add existing file
            </Button>
          ) : null}
          <Button component="label" size="small" variant="outlined" startIcon={<UploadFileOutlinedIcon fontSize="small" />} disabled={uploading}>
            {uploading ? "Uploading..." : "Upload file"}
            <input
              hidden
              type="file"
              onChange={(event) => {
                const file = event.target.files?.[0] || null;
                event.target.value = "";
                if (file && onUpload) onUpload(file);
              }}
            />
          </Button>
        </Stack>
        {selectedAttachableDocuments.length ? (
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {selectedAttachableDocuments.map((row) => (
              <Chip
                key={`selected-${row.id}`}
                size="small"
                label={row.original_filename || `Document #${row.id}`}
                onDelete={() => onSelectedIdsChange?.(selectedIds.filter((item) => String(item) !== String(row.id)))}
                variant="outlined"
                sx={attachmentChipSx("info")}
              />
            ))}
          </Stack>
        ) : null}
      </Stack>
    </Paper>
    <Dialog open={existingPickerOpen} onClose={() => setExistingPickerOpen(false)} maxWidth="sm" fullWidth>
      <DialogTitle>Add existing file</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={1.5} sx={{ mt: 0.5 }}>
          {attachableDocuments.length ? (
            <>
              <TextField
                fullWidth
                size="small"
                label="Search files"
                value={existingSearch}
                onChange={(event) => setExistingSearch(event.target.value)}
              />
              <FormGroup>
                {filteredAttachableDocuments.map((row) => {
                  const value = String(row.id);
                  const checked = selectedIds.includes(value);
                  return (
                    <FormControlLabel
                      key={`picker-${row.id}`}
                      control={
                        <Checkbox
                          checked={checked}
                          onChange={(event) =>
                            onSelectedIdsChange?.(
                              event.target.checked
                                ? [...new Set([...selectedIds, value])]
                                : selectedIds.filter((item) => item !== value)
                            )
                          }
                        />
                      }
                      label={(
                        <Stack spacing={0.2}>
                          <Typography variant="body2">{row.original_filename || `Document #${row.id}`}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {categoryLabel(row.category)} • {formatDateTime(row.created_at)}
                          </Typography>
                        </Stack>
                      )}
                      sx={{ alignItems: "flex-start", m: 0 }}
                    />
                  );
                })}
              </FormGroup>
              {!filteredAttachableDocuments.length ? <Alert severity="info">No files match this search.</Alert> : null}
            </>
          ) : (
            <Alert severity="info">
              {documents.length ? "No saved client files are ready to attach yet." : "No saved client files yet."}
            </Alert>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setExistingPickerOpen(false)}>Done</Button>
      </DialogActions>
    </Dialog>
    </>
  );
}
