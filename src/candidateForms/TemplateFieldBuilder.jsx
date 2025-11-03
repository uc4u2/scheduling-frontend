import React, { useMemo, useState, useCallback } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";

const FIELD_TYPES = [
  { value: "text", label: "Short Text" },
  { value: "textarea", label: "Long Text" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "number", label: "Number" },
  { value: "date", label: "Date" },
  { value: "select", label: "Dropdown" },
  { value: "radio", label: "Radio Group" },
  { value: "checkbox", label: "Checkbox Group" },
  { value: "checkbox_single", label: "Single Checkbox" },
  { value: "file", label: "File Upload" },
];

const MULTI_OPTION_TYPES = new Set(["select", "radio", "checkbox"]);
const PLACEHOLDER_TYPES = new Set(["text", "textarea", "email", "phone", "number"]);
const MAX_LENGTH_TYPES = new Set(["text", "textarea"]);

const defaultFieldState = {
  key: "",
  label: "",
  type: "text",
  is_required: true,
  placeholder: "",
  helper_text: "",
  optionsInput: "",
  accept: "",
  max_length: "",
  initialKey: "",
  keyEdited: false,
};

const normaliseKey = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");

const formatOptionsToString = (options) => {
  if (!Array.isArray(options)) {
    return "";
  }
  return options
    .map((option) => {
      if (!option) return "";
      if (typeof option === "string") {
        return option;
      }
      if (typeof option === "object") {
        const value = option.value ?? option.id ?? option.label ?? "";
        const label = option.label ?? "";
        if (!value && !label) {
          return "";
        }
        return label && label !== value ? `${value}|${label}` : value;
      }
      return "";
    })
    .filter(Boolean)
    .join("\n");
};

const parseOptionsString = (value) => {
  if (!value) return [];
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      if (line.includes("|")) {
        const [rawValue, rawLabel] = line.split("|");
        const optionValue = rawValue.trim();
        const optionLabel = (rawLabel || "").trim();
        return { value: optionValue, label: optionLabel || optionValue, order_index: index };
      }
      return { value: line, label: line, order_index: index };
    });
};
const sanitiseFieldOrder = (items = []) =>
  items
    .map((item, index) => ({
      ...item,
      order_index: Number.isFinite(item?.order_index) ? item.order_index : index,
    }))
    .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
    .map((item, index) => ({ ...item, order_index: index }));

const TemplateFieldBuilder = ({ fields = [], onChange, reservedKeys = [] }) => {
  const orderedFields = useMemo(() => sanitiseFieldOrder(fields), [fields]);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorIndex, setEditorIndex] = useState(null);
  const [fieldState, setFieldState] = useState(defaultFieldState);
  const [fieldErrors, setFieldErrors] = useState({});

  const emitChange = useCallback(
    (nextFields) => {
      if (typeof onChange === "function") {
        onChange(sanitiseFieldOrder(nextFields));
      }
    },
    [onChange]
  );

  const closeEditor = () => {
    setEditorOpen(false);
    setEditorIndex(null);
    setFieldState(defaultFieldState);
    setFieldErrors({});
  };

  const openCreateDialog = () => {
    const nextKey = normaliseKey(`field_${orderedFields.length + 1}`) || "field";
    setFieldState({
      ...defaultFieldState,
      key: nextKey,
      initialKey: nextKey,
    });
    setEditorIndex(null);
    setEditorOpen(true);
    setFieldErrors({});
  };

  const openEditDialog = (index) => {
    const existing = orderedFields[index];
    if (!existing) return;
    setFieldState({
      key: existing.key || "",
      label: existing.label || "",
      type: existing.type || "text",
      is_required: existing.is_required !== false,
      placeholder: existing.config?.placeholder || "",
      helper_text: existing.config?.helper_text || "",
      optionsInput: formatOptionsToString(existing.config?.options),
      accept: existing.config?.accept || "",
      max_length: existing.config?.max_length ? String(existing.config.max_length) : "",
      initialKey: existing.key || "",
      keyEdited: false,
    });
    setEditorIndex(index);
    setEditorOpen(true);
    setFieldErrors({});
  };

  const handleFieldChange = (field, value) => {
    setFieldState((prev) => {
      if (field === "label" && !prev.keyEdited) {
        const nextKey = normaliseKey(value);
        return { ...prev, label: value, key: nextKey, initialKey: nextKey };
      }
      if (field === "key") {
        return { ...prev, key: value, keyEdited: true };
      }
      return { ...prev, [field]: value };
    });
  };

  const validateField = useCallback(
    (state) => {
      const errors = {};
      const trimmedLabel = state.label.trim();
      const rawKey = state.key.trim();
      const normalisedKey = normaliseKey(rawKey);
      if (!trimmedLabel) {
        errors.label = "Label is required";
      }
      if (!normalisedKey) {
        errors.key = "Key is required";
      } else if (!/^[a-z0-9_]+$/.test(normalisedKey)) {
        errors.key = "Use lowercase letters, numbers, or underscores";
      } else {
        const duplicate = orderedFields.find((item, index) =>
          item?.key === normalisedKey && index !== editorIndex
        );
        if (duplicate) {
          errors.key = "Key must be unique";
        } else if (reservedKeys.includes(normalisedKey) && normalisedKey !== state.initialKey) {
          errors.key = "This key is reserved";
        }
      }

      if (MULTI_OPTION_TYPES.has(state.type)) {
        const options = parseOptionsString(state.optionsInput);
        if (!options.length) {
          errors.optionsInput = "Provide at least one option";
        }
      }
      return { valid: Object.keys(errors).length === 0, errors, key: normaliseKey(rawKey), label: trimmedLabel };
    },
    [editorIndex, orderedFields, reservedKeys]
  );

  const buildFieldConfig = (state) => {
    const config = {};
    if (PLACEHOLDER_TYPES.has(state.type) && state.placeholder.trim()) {
      config.placeholder = state.placeholder.trim();
    }
    if (state.helper_text.trim()) {
      config.helper_text = state.helper_text.trim();
    }
    if (MULTI_OPTION_TYPES.has(state.type)) {
      const options = parseOptionsString(state.optionsInput);
      if (options.length) {
        config.options = options.map((option, index) => ({
          ...option,
          order_index: index,
        }));
      }
    }
    if (state.type === "file" && state.accept.trim()) {
      config.accept = state.accept.trim();
    }
    if (MAX_LENGTH_TYPES.has(state.type)) {
      const lengthValue = parseInt(state.max_length, 10);
      if (Number.isFinite(lengthValue) && lengthValue > 0) {
        config.max_length = lengthValue;
      }
    }
    return config;
  };

  const saveField = () => {
    const validation = validateField(fieldState);
    if (!validation.valid) {
      setFieldErrors(validation.errors);
      return;
    }

    const nextField = {
      id: editorIndex != null ? orderedFields[editorIndex]?.id ?? null : null,
      section: editorIndex != null ? orderedFields[editorIndex]?.section ?? null : null,
      key: validation.key,
      label: validation.label,
      type: fieldState.type,
      field_type: fieldState.type,
      is_required: Boolean(fieldState.is_required),
      config: buildFieldConfig(fieldState),
      order_index: editorIndex != null ? orderedFields[editorIndex].order_index : orderedFields.length,
    };

    if (editorIndex != null) {
      const nextFields = orderedFields.map((item, index) => (index === editorIndex ? nextField : item));
      emitChange(nextFields);
    } else {
      emitChange([...orderedFields, nextField]);
    }

    closeEditor();
  };

  const handleDeleteField = (index) => {
    const existing = orderedFields[index];
    if (!existing) return;
    const confirmed = window.confirm(`Delete field "${existing.label || existing.key}"?`);
    if (!confirmed) return;
    const nextFields = orderedFields.filter((_, idx) => idx !== index);
    emitChange(nextFields);
  };

  const moveField = (index, direction) => {
    const offset = direction === "up" ? -1 : 1;
    const targetIndex = index + offset;
    if (targetIndex < 0 || targetIndex >= orderedFields.length) {
      return;
    }
    const next = orderedFields.slice();
    const [item] = next.splice(index, 1);
    next.splice(targetIndex, 0, item);
    emitChange(next);
  };

  return (
    <Stack spacing={2}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          Fields
        </Typography>
        <Button variant="outlined" startIcon={<AddIcon />} onClick={openCreateDialog}>
          Add Field
        </Button>
      </Stack>

      {orderedFields.length === 0 ? (
        <Alert severity="info">No fields yet. Click "Add Field" to create one.</Alert>
      ) : (
        <Stack spacing={1.5}>
          {orderedFields.map((field, index) => {
            const summary = [];
            if (field.is_required) summary.push("Required");
            summary.push(field.type);
            return (
              <Box
                key={field.key || index}
                sx={{
                  border: (theme) => `1px solid ${theme.palette.divider}`,
                  borderRadius: 2,
                  p: 2,
                  backgroundColor: "background.paper",
                }}
              >
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ sm: "center" }} justifyContent="space-between">
                  <Stack spacing={0.5}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      {field.label || field.key}
                    </Typography>
                    <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                      <Chip size="small" label={field.key} />
                      {summary.map((item) => (
                        <Chip key={item} size="small" label={item} color={item === "Required" ? "error" : "default"} />
                      ))}
                      {field.config?.options && field.config.options.length > 0 && (
                        <Tooltip title="This field has custom options">
                          <Chip size="small" label={`${field.config.options.length} options`} />
                        </Tooltip>
                      )}
                    </Stack>
                    {field.config?.helper_text && (
                      <Typography variant="body2" color="text.secondary">
                        {field.config.helper_text}
                      </Typography>
                    )}
                  </Stack>

                  <Stack direction="row" spacing={1} alignItems="center">
                    <Tooltip title="Move up">
                      <span>
                        <IconButton
                          size="small"
                          onClick={() => moveField(index, "up")}
                          disabled={index === 0}
                        >
                          <ArrowUpwardIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title="Move down">
                      <span>
                        <IconButton
                          size="small"
                          onClick={() => moveField(index, "down")}
                          disabled={index === orderedFields.length - 1}
                        >
                          <ArrowDownwardIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => openEditDialog(index)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small" color="error" onClick={() => handleDeleteField(index)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </Stack>
              </Box>
            );
          })}
        </Stack>
      )}

      <Dialog open={editorOpen} onClose={closeEditor} fullWidth maxWidth="sm">
        <DialogTitle>{editorIndex != null ? "Edit Field" : "Add Field"}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <TextField
              label="Field Label"
              value={fieldState.label}
              onChange={(event) => handleFieldChange("label", event.target.value)}
              error={Boolean(fieldErrors.label)}
              helperText={fieldErrors.label || ""}
              required
              fullWidth
            />
            <TextField
              label="Field Key"
              value={fieldState.key}
              onChange={(event) => handleFieldChange("key", event.target.value)}
              error={Boolean(fieldErrors.key)}
              helperText={fieldErrors.key || "Lowercase letters, numbers, underscores"}
              required
              fullWidth
            />
            <TextField
              label="Field Type"
              value={fieldState.type}
              onChange={(event) => handleFieldChange("type", event.target.value)}
              select
              fullWidth
            >
              {FIELD_TYPES.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Required"
              value={fieldState.is_required ? "yes" : "no"}
              onChange={(event) => handleFieldChange("is_required", event.target.value === "yes")}
              select
              sx={{ width: 180 }}
            >
              <MenuItem value="yes">Yes</MenuItem>
              <MenuItem value="no">No</MenuItem>
            </TextField>

            {PLACEHOLDER_TYPES.has(fieldState.type) && (
              <TextField
                label="Placeholder"
                value={fieldState.placeholder}
                onChange={(event) => handleFieldChange("placeholder", event.target.value)}
                fullWidth
              />
            )}

            <TextField
              label="Helper Text"
              value={fieldState.helper_text}
              onChange={(event) => handleFieldChange("helper_text", event.target.value)}
              fullWidth
              multiline
              minRows={2}
            />

            {MULTI_OPTION_TYPES.has(fieldState.type) && (
              <TextField
                label="Options"
                value={fieldState.optionsInput}
                onChange={(event) => handleFieldChange("optionsInput", event.target.value)}
                helperText={fieldErrors.optionsInput || "One option per line. Use value|Label for custom labels."}
                error={Boolean(fieldErrors.optionsInput)}
                multiline
                minRows={3}
                fullWidth
              />
            )}

            {fieldState.type === "file" && (
              <TextField
                label="Accepted Types"
                value={fieldState.accept}
                onChange={(event) => handleFieldChange("accept", event.target.value)}
                helperText="Comma-separated MIME types or extensions (e.g. image/png,.pdf)"
                fullWidth
              />
            )}

            {MAX_LENGTH_TYPES.has(fieldState.type) && (
              <TextField
                label="Max Length"
                value={fieldState.max_length}
                onChange={(event) => handleFieldChange("max_length", event.target.value)}
                type="number"
                fullWidth
              />
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeEditor}>Cancel</Button>
          <Button variant="contained" onClick={saveField}>
            {editorIndex != null ? "Save Changes" : "Add Field"}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
};

export default TemplateFieldBuilder;
