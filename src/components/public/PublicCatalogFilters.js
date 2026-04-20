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
      border: "1px solid rgba(148,163,184,0.28)",
      boxShadow: "0 18px 48px rgba(15,23,42,0.18)",
    },
  },
};

const fieldSx = {
  minWidth: { xs: "100%", sm: 180 },
  "& .MuiOutlinedInput-root": {
    bgcolor: "rgba(255,255,255,0.92)",
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
        mb: 3,
        p: { xs: 2, md: 2.5 },
        borderRadius: "var(--page-card-radius, 18px)",
        border: "1px solid rgba(148,163,184,0.22)",
        bgcolor: "rgba(255,255,255,0.78)",
        backdropFilter: "blur(12px)",
        boxShadow: "0 18px 44px rgba(15,23,42,0.08)",
      }}
    >
      <Stack spacing={1.75}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={1.5}
          alignItems={{ xs: "stretch", md: "center" }}
          justifyContent="space-between"
        >
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ flex: 1, minWidth: 0 }}>
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
                    {optionLabel(category)}
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
                    {optionLabel(department)}
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
            spacing={1}
            sx={{
              overflowX: "auto",
              pb: 0.5,
              scrollbarWidth: "thin",
            }}
          >
            <Chip
              label="All"
              clickable
              onClick={() => onCategoryChange?.("all")}
              color={categoryValue === "all" ? "primary" : "default"}
              variant={categoryValue === "all" ? "filled" : "outlined"}
              sx={{ flexShrink: 0, borderRadius: 999 }}
            />
            {normalizedCategories.map((category) => (
              <Chip
                key={`chip-${category.value}`}
                label={optionLabel(category)}
                clickable
                onClick={() => onCategoryChange?.(category.value)}
                color={categoryValue === category.value ? "primary" : "default"}
                variant={categoryValue === category.value ? "filled" : "outlined"}
                sx={{ flexShrink: 0, borderRadius: 999 }}
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
              <Button size="small" onClick={onClear} sx={{ textTransform: "none" }}>
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
