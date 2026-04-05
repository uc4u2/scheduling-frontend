import React, { useMemo } from "react";
import { Autocomplete, TextField, Tooltip, Typography } from "@mui/material";

const RoleSelect = ({
  label = "Role",
  value,
  onChange,
  helperText,
  required,
  disabled,
  fullWidth = true,
  textFieldSx,
  options = [],
}) => {
  const selectedOption = useMemo(
    () => options.find((option) => option.value === value) || null,
    [options, value]
  );

  const handleChange = (_, newOption) => {
    if (!onChange) return;
    onChange(newOption?.value || "");
  };

  return (
    <Autocomplete
      disableClearable
      options={options}
      value={selectedOption}
      onChange={handleChange}
      disabled={disabled}
      fullWidth={fullWidth}
      getOptionLabel={(option) => option?.label || ""}
      isOptionEqualToValue={(option, current) => option?.value === current?.value}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          required={required}
          disabled={disabled}
          sx={textFieldSx}
          helperText={helperText}
          fullWidth={fullWidth}
        />
      )}
      renderOption={(props, option) => (
        <li {...props}>
          <Tooltip title={option.description} placement="right" arrow>
            <Typography variant="subtitle2" fontWeight={600}>
              {option.label}
            </Typography>
          </Tooltip>
        </li>
      )}
    />
  );
};

export default RoleSelect;
