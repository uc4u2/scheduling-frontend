import React, { useEffect, useState } from "react";
import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Stack,
  TextField,
} from "@mui/material";

export default function FinanceEmailTemplateManagerDialog({
  open,
  mode = "create",
  saving = false,
  initialValues = null,
  onClose,
  onSubmit,
}) {
  const [form, setForm] = useState({
    name: "",
    subject: "",
    body: "",
    category: "custom",
    is_default: false,
  });

  useEffect(() => {
    if (!open) return;
    setForm({
      name: initialValues?.name || "",
      subject: initialValues?.subject || "",
      body: initialValues?.body || "",
      category: initialValues?.category || "custom",
      is_default: Boolean(initialValues?.is_default),
    });
  }, [initialValues, open]);

  const title = mode === "edit" ? "Edit email template" : "Save email template";

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={1.5} sx={{ mt: 0.5 }}>
          <TextField
            fullWidth
            label="Template name"
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
          />
          <TextField
            fullWidth
            label="Subject"
            value={form.subject}
            onChange={(event) => setForm((prev) => ({ ...prev, subject: event.target.value }))}
          />
          <TextField
            fullWidth
            multiline
            minRows={6}
            label="Body"
            value={form.body}
            onChange={(event) => setForm((prev) => ({ ...prev, body: event.target.value }))}
          />
          <FormControlLabel
            control={(
              <Checkbox
                checked={form.is_default}
                onChange={(event) => setForm((prev) => ({ ...prev, is_default: event.target.checked }))}
              />
            )}
            label="Set as the default email template"
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Cancel</Button>
        <Button
          variant="contained"
          onClick={() => onSubmit?.(form)}
          disabled={saving || !form.name.trim() || !form.subject.trim() || !form.body.trim()}
        >
          {saving ? "Saving..." : mode === "edit" ? "Save changes" : "Save template"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
