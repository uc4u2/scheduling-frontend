import React from "react";
import {
  Alert,
  Button,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
} from "@mui/material";

export default function FinanceEmailTemplatePicker({
  value = "",
  options = [],
  loading = false,
  error = "",
  onChange,
  selectedTemplate = null,
  customTemplateCount = 0,
  onOpenTemplateManager,
}) {
  const readableChipSx = (tone = "default") => {
    if (tone === "primary") {
      return {
        fontWeight: 700,
        color: "#13315c",
        backgroundColor: "#dbe7ff",
        border: "1px solid #9db8ff",
        "& .MuiChip-label": { color: "#13315c" },
        "&:hover": { backgroundColor: "#cfe0ff" },
      };
    }
    if (tone === "info") {
      return {
        color: "#155e75",
        borderColor: "#67e8f9",
        backgroundColor: "#ecfeff",
        "& .MuiChip-label": { color: "#155e75", fontWeight: 700 },
      };
    }
    if (tone === "success") {
      return {
        color: "#166534",
        borderColor: "#86efac",
        backgroundColor: "#f0fdf4",
        "& .MuiChip-label": { color: "#166534", fontWeight: 700 },
      };
    }
    return undefined;
  };

  return (
    <Stack spacing={1.25}>
      <FormControl fullWidth>
        <InputLabel>Use template</InputLabel>
        <Select
          label="Use template"
          value={value}
          onChange={(event) => onChange?.(event.target.value)}
        >
          <MenuItem value="">
            <em>Start from current draft</em>
          </MenuItem>
          {options.map((template) => (
            <MenuItem key={template.key} value={template.key}>
              {template.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      {loading ? <Alert severity="info">Loading custom templates…</Alert> : null}
      {error ? <Alert severity="warning">{error}</Alert> : null}
      {options.length ? (
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {options.slice(0, 4).map((template) => (
            <Chip
              key={template.key}
              size="small"
              label={template.label}
              variant="outlined"
              color="default"
              onClick={() => onChange?.(template.key)}
              sx={value === template.key ? readableChipSx("primary") : undefined}
            />
          ))}
        </Stack>
      ) : null}
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }}>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {selectedTemplate ? (
            <Chip
              size="small"
              label={selectedTemplate.is_custom ? `Custom: ${selectedTemplate.name || selectedTemplate.label}` : `Built-in: ${selectedTemplate.label}`}
              variant="outlined"
              sx={readableChipSx(selectedTemplate.is_custom ? "info" : "default")}
            />
          ) : (
            <Chip size="small" label="No template selected" variant="outlined" />
          )}
          {selectedTemplate?.is_default ? (
            <Chip size="small" label="Default template" variant="outlined" sx={readableChipSx("success")} />
          ) : null}
          {customTemplateCount ? (
            <Chip size="small" label={`${customTemplateCount} custom`} variant="outlined" sx={readableChipSx("primary")} />
          ) : null}
        </Stack>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Button
            size="small"
            variant="outlined"
            onClick={() => onOpenTemplateManager?.("create")}
          >
            Save as template
          </Button>
          {selectedTemplate?.is_custom ? (
            <>
              <Button size="small" onClick={() => onOpenTemplateManager?.("edit", selectedTemplate)}>
                Edit selected
              </Button>
              <Button
                size="small"
                color="warning"
                onClick={() => onOpenTemplateManager?.("default", selectedTemplate)}
                disabled={selectedTemplate.is_default}
              >
                {selectedTemplate.is_default ? "Default" : "Set default"}
              </Button>
              <Button size="small" color="error" onClick={() => onOpenTemplateManager?.("delete", selectedTemplate)}>
                Delete
              </Button>
            </>
          ) : null}
        </Stack>
      </Stack>
    </Stack>
  );
}
