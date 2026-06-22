import React from "react";
import {
  Alert,
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
}) {
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
              variant={value === template.key ? "filled" : "outlined"}
              color={value === template.key ? "primary" : "default"}
              onClick={() => onChange?.(template.key)}
            />
          ))}
        </Stack>
      ) : null}
    </Stack>
  );
}
