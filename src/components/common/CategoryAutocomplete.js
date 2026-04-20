import React, { useMemo } from "react";
import { Autocomplete, Box, Chip, Stack, TextField } from "@mui/material";

const cleanCategory = (value) => String(value || "").trim();

const normalizeOption = (option) => {
  if (!option) return null;
  if (typeof option === "string") {
    const name = cleanCategory(option);
    return name ? { name, count: null } : null;
  }
  const name = cleanCategory(option.name ?? option.category ?? option.label);
  if (!name) return null;
  return { name, count: option.count ?? null };
};

export default function CategoryAutocomplete({
  label = "Category",
  value,
  onChange,
  categories = [],
  helperText = "Select an existing category or type a new one.",
  placeholder = "Choose or type a category",
  quickChips = true,
  disabled = false,
  fullWidth = true,
  margin,
}) {
  const options = useMemo(() => {
    const seen = new Map();
    for (const raw of categories || []) {
      const option = normalizeOption(raw);
      if (!option) continue;
      const key = option.name.toLowerCase();
      if (!seen.has(key)) {
        seen.set(key, option);
      } else {
        const existing = seen.get(key);
        seen.set(key, {
          ...existing,
          count: Number(existing.count || 0) + Number(option.count || 0) || existing.count || option.count,
        });
      }
    }
    return Array.from(seen.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [categories]);

  const selected = cleanCategory(value);
  const optionNames = options.map((option) => option.name);
  const visibleChips = options
    .filter((option) => option.name.toLowerCase() !== selected.toLowerCase())
    .slice(0, 6);

  const commit = (nextValue) => {
    onChange?.(cleanCategory(nextValue));
  };

  return (
    <Box>
      <Autocomplete
        freeSolo
        disabled={disabled}
        options={optionNames}
        value={selected}
        onChange={(_event, nextValue) => commit(nextValue)}
        onInputChange={(_event, nextValue, reason) => {
          if (reason === "input" || reason === "clear") {
            onChange?.(nextValue);
          }
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            label={label}
            placeholder={placeholder}
            helperText={helperText}
            fullWidth={fullWidth}
            margin={margin}
            onBlur={(event) => commit(event.target.value)}
          />
        )}
      />
      {quickChips && visibleChips.length > 0 && (
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
          {visibleChips.map((option) => (
            <Chip
              key={option.name}
              size="small"
              variant="outlined"
              label={option.count != null ? `${option.name} (${option.count})` : option.name}
              onClick={() => commit(option.name)}
            />
          ))}
        </Stack>
      )}
    </Box>
  );
}

