import React, { useMemo } from "react";
import {
  Alert,
  Button,
  Checkbox,
  Chip,
  FormControlLabel,
  FormGroup,
  IconButton,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";

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
  const attachableDocuments = useMemo(
    () => (documents || []).filter((row) => row?.is_email_attachable),
    [documents]
  );

  if (!clientId) {
    return (
      <Alert severity="info">
        Attachments are available when this email is linked to a saved client profile.
      </Alert>
    );
  }

  return (
    <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 1.5, backgroundColor: "rgba(15,23,42,0.02)" }}>
      <Stack spacing={1}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
          <Typography fontWeight={700}>Attachments</Typography>
          <Stack direction="row" spacing={1} alignItems="center" useFlexGap flexWrap="wrap">
            <Chip
              size="small"
              label={selectedIds.length ? `${selectedIds.length} selected` : "No attachments"}
              variant="outlined"
              sx={attachmentChipSx(selectedIds.length ? "info" : "default")}
            />
            <Button component="label" size="small" variant="outlined" startIcon={<UploadFileOutlinedIcon fontSize="small" />} disabled={uploading}>
              {uploading ? "Uploading..." : "Upload from device"}
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
        </Stack>
        {attachableDocuments.length ? (
          <FormGroup>
            {attachableDocuments.slice(0, 6).map((row) => {
              const value = String(row.id);
              const checked = selectedIds.includes(value);
              return (
                <Stack
                  key={row.id}
                  direction="row"
                  spacing={0.5}
                  alignItems="flex-start"
                  justifyContent="space-between"
                >
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={checked}
                        onChange={(event) =>
                          onSelectedIdsChange?.(
                            event.target.checked
                              ? [...selectedIds, value]
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
                    sx={{ alignItems: "flex-start", m: 0, flex: 1 }}
                  />
                  <IconButton
                    size="small"
                    color="warning"
                    disabled={String(deletingDocumentId) === value}
                    onClick={() => onDeleteDocument?.(row)}
                    sx={{ mt: 0.5 }}
                  >
                    <DeleteOutlineOutlinedIcon fontSize="small" />
                  </IconButton>
                </Stack>
              );
            })}
          </FormGroup>
        ) : (
          <Alert severity="info">
            {documents.length
              ? "Some client vault documents exist but cannot be attached because they are legacy URL-only files or not scan-ready."
              : "No attachable client documents yet. Upload a new vault document, then attach it to this email."}
          </Alert>
        )}
      </Stack>
    </Paper>
  );
}
