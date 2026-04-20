import React from "react";
import {
  Box,
  Button,
  Chip,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

export const UNCATEGORIZED_VALUE = "__uncategorized__";

const menuProps = {
  PaperProps: {
    sx: {
      bgcolor: "#fff",
      color: "text.primary",
      mt: 0.75,
      borderRadius: 1.5,
      border: "1px solid rgba(148,163,184,0.32)",
      boxShadow: "0 18px 42px rgba(15,23,42,0.16)",
      "& .MuiMenuItem-root": {
        minHeight: 38,
        fontSize: 14,
      },
    },
  },
};

const fieldSx = {
  minWidth: { xs: "100%", sm: 180 },
  "& .MuiInputLabel-root": {
    fontSize: 13,
    color: "rgba(51,65,85,0.78)",
  },
  "& .MuiOutlinedInput-root": {
    minHeight: 42,
    borderRadius: 1.25,
    bgcolor: "#fff",
    boxShadow: "0 1px 0 rgba(15,23,42,0.03)",
    "& fieldset": {
      borderColor: "rgba(148,163,184,0.34)",
    },
    "&:hover fieldset": {
      borderColor: "rgba(100,116,139,0.55)",
    },
    "&.Mui-focused fieldset": {
      borderWidth: 1,
      borderColor: "var(--page-btn-bg, #2563eb)",
    },
  },
  "& .MuiOutlinedInput-input": {
    fontSize: 14,
    fontWeight: 500,
  },
};

const normalizeOption = (option) => {
  if (!option) return null;
  if (typeof option === "string") return { value: option, label: option, count: null };
  return {
    value: option.value || option.name || "",
    label: option.label || option.name || option.value || "",
    count: option.count ?? null,
  };
};

const optionLabel = (option) => {
  if (!option) return "";
  if (option.count === null || option.count === undefined) return option.label;
  return `${option.label} (${option.count})`;
};

const renderOptionText = (option) => (
  <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between" sx={{ width: "100%" }}>
    <span>{option.label}</span>
    {option.count !== null && option.count !== undefined && (
      <Box
        component="span"
        sx={{
          px: 0.75,
          py: 0.1,
          minWidth: 22,
          borderRadius: 1,
          textAlign: "center",
          fontSize: 11,
          fontWeight: 700,
          color: "rgba(51,65,85,0.78)",
          bgcolor: "rgba(148,163,184,0.14)",
        }}
      >
        {option.count}
      </Box>
    )}
  </Stack>
);

const chipLabel = (option) => (
  <Stack direction="row" spacing={0.85} alignItems="center" component="span">
    <Box component="span">{option.label}</Box>
    {option.count !== null && option.count !== undefined && (
      <Box
        component="span"
        sx={{
          px: 0.65,
          py: "1px",
          minWidth: 20,
          borderRadius: "6px",
          fontSize: 11,
          lineHeight: 1.35,
          fontWeight: 800,
          color: "currentColor",
          bgcolor: "rgba(15,23,42,0.08)",
        }}
      >
        {option.count}
      </Box>
    )}
  </Stack>
);

const chipSx = (active) => ({
  flexShrink: 0,
  height: 32,
  borderRadius: "9px",
  fontWeight: 700,
  letterSpacing: "0.01em",
  borderColor: active ? "var(--page-btn-bg, #2563eb)" : "rgba(148,163,184,0.38)",
  color: active ? "var(--page-btn-color, #fff)" : "rgba(30,41,59,0.86)",
  bgcolor: active ? "var(--page-btn-bg, #2563eb)" : "rgba(255,255,255,0.72)",
  boxShadow: active ? "0 10px 24px rgba(15,23,42,0.14)" : "none",
  "&:hover": {
    bgcolor: active ? "var(--page-btn-bg, #2563eb)" : "rgba(255,255,255,0.95)",
    borderColor: active ? "var(--page-btn-bg, #2563eb)" : "rgba(100,116,139,0.56)",
  },
  "& .MuiChip-label": {
    px: 1.15,
  },
});

const PublicCatalogFilters = ({
  searchLabel = "Search",
  searchPlaceholder,
  searchValue,
  onSearchChange,
  showSearch = false,
  categoryValue = "all",
  onCategoryChange,
  categoryOptions = [],
  showCategory = true,
  departmentValue = "",
  onDepartmentChange,
  departmentOptions = [],
  showDepartment = false,
  sortValue,
  onSortChange,
  sortOptions = [],
  showSort = false,
  toggleNode = null,
  resultSummary = "",
  activeSummary = "",
  onClear,
  hasActiveFilters = false,
  showCategoryChips = true,
}) => {
  const normalizedCategories = categoryOptions.map(normalizeOption).filter((item) => item?.value);
  const normalizedDepartments = departmentOptions.map(normalizeOption).filter((item) => item?.value);

  return (
    <Box
      sx={{
        mb: { xs: 2.5, md: 3 },
        p: { xs: 1.5, md: 1.85 },
        borderRadius: "12px",
        border: "1px solid rgba(148,163,184,0.26)",
        bgcolor: "rgba(255,255,255,0.94)",
        boxShadow: "0 12px 28px rgba(15,23,42,0.065)",
      }}
    >
      <Stack spacing={1.2}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={1.25}
          alignItems={{ xs: "stretch", md: "center" }}
          justifyContent="space-between"
        >
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} sx={{ flex: 1, minWidth: 0 }}>
            {showSearch && (
              <TextField
                label={searchLabel}
                size="small"
                value={searchValue || ""}
                onChange={(event) => onSearchChange?.(event.target.value)}
                placeholder={searchPlaceholder}
                sx={{ ...fieldSx, minWidth: { xs: "100%", sm: 220 } }}
              />
            )}
            {showCategory && (
              <TextField
                select
                label="Category"
                size="small"
                value={categoryValue || "all"}
                onChange={(event) => onCategoryChange?.(event.target.value)}
                sx={fieldSx}
                SelectProps={{ MenuProps: menuProps }}
              >
                <MenuItem value="all">All categories</MenuItem>
                {normalizedCategories.map((category) => (
                  <MenuItem key={category.value} value={category.value}>
                    {renderOptionText(category)}
                  </MenuItem>
                ))}
              </TextField>
            )}
            {showDepartment && (
              <TextField
                select
                label="Department"
                size="small"
                value={departmentValue || ""}
                onChange={(event) => onDepartmentChange?.(event.target.value)}
                sx={fieldSx}
                SelectProps={{ MenuProps: menuProps }}
              >
                <MenuItem value="">All departments</MenuItem>
                {normalizedDepartments.map((department) => (
                  <MenuItem key={department.value} value={department.value}>
                    {renderOptionText(department)}
                  </MenuItem>
                ))}
              </TextField>
            )}
            {showSort && (
              <TextField
                select
                label="Sort by"
                size="small"
                value={sortValue || ""}
                onChange={(event) => onSortChange?.(event.target.value)}
                sx={fieldSx}
                SelectProps={{ MenuProps: menuProps }}
              >
                {sortOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            )}
          </Stack>
          {toggleNode && <Box sx={{ flexShrink: 0 }}>{toggleNode}</Box>}
        </Stack>

        {showCategoryChips && normalizedCategories.length > 0 && (
          <Stack
            direction="row"
            spacing={0.85}
            sx={{
              overflowX: "auto",
              pb: 0.35,
              pt: 0.1,
              scrollbarWidth: "thin",
            }}
          >
            <Chip
              label="All"
              clickable
              onClick={() => onCategoryChange?.("all")}
              variant={categoryValue === "all" ? "filled" : "outlined"}
              sx={chipSx(categoryValue === "all")}
            />
            {normalizedCategories.map((category) => (
              <Chip
                key={`chip-${category.value}`}
                label={chipLabel(category)}
                clickable
                onClick={() => onCategoryChange?.(category.value)}
                variant={categoryValue === category.value ? "filled" : "outlined"}
                sx={chipSx(categoryValue === category.value)}
              />
            ))}
          </Stack>
        )}

        {(resultSummary || activeSummary || hasActiveFilters) && (
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            alignItems={{ xs: "flex-start", sm: "center" }}
            justifyContent="space-between"
          >
            <Typography variant="body2" color="text.secondary">
              {activeSummary || resultSummary}
            </Typography>
            {hasActiveFilters && (
              <Button
                size="small"
                onClick={onClear}
                sx={{
                  textTransform: "none",
                  fontWeight: 700,
                  color: "rgba(30,41,59,0.82)",
                  borderRadius: 1,
                  px: 1.25,
                  "&:hover": { bgcolor: "rgba(148,163,184,0.12)" },
                }}
              >
                Clear filters
              </Button>
            )}
          </Stack>
        )}
      </Stack>
    </Box>
  );
};

export default PublicCatalogFilters;
