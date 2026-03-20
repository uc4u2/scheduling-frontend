// src/components/TimezoneSelect.js
import React, { useMemo } from "react";
import { Autocomplete, TextField, Stack, Button } from "@mui/material";
import RoomIcon from "@mui/icons-material/Room";
import { TOP_TIMEZONES, ALL_TIMEZONES } from "../constants/timezones";
import { detectBrowserTimezone, formatTimezoneLabel } from "../utils/timezone";

const TimezoneSelect = ({
  label = "Timezone",
  value,
  onChange,
  helperText,
  required,
  disabled,
  fullWidth = true,
  textFieldSx,
}) => {
  const detected = useMemo(detectBrowserTimezone, []);

  const options = useMemo(() => {
    const set = new Set(TOP_TIMEZONES);
    const list = [...set];
    if (detected && !set.has(detected)) list.unshift(detected);
    return list;
  }, [detected]);

  const handleSelect = (_, newValue) => {
    if (onChange) onChange(newValue || "");
  };

  return (
    <Stack spacing={1}>
      <Autocomplete
        freeSolo
        options={options}
        value={value || ""}
        onChange={handleSelect}
        onInputChange={(_, newInput) => onChange && onChange(newInput || "")}
        filterOptions={(opts, state) => {
          const input = (state.inputValue || "").toLowerCase();
          if (!input) return opts;
          const matched = ALL_TIMEZONES.filter((tz) => tz.toLowerCase().includes(input));
          const merged = Array.from(new Set([...(matched.length ? matched : opts)]));
          return merged;
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            label={label}
            required={required}
            disabled={disabled}
            sx={textFieldSx}
            helperText={helperText || "Detected automatically when possible. You can still search any IANA timezone if needed."}
            fullWidth={fullWidth}
          />
        )}
        getOptionLabel={(option) => formatTimezoneLabel(option) || ""}
      />
      <Stack direction="row" spacing={1}>
        <Button
          size="small"
          startIcon={<RoomIcon fontSize="small" />}
          onClick={() => onChange && onChange(detected || "")}
          disabled={!detected || disabled}
        >
          Use my timezone
        </Button>
      </Stack>
    </Stack>
  );
};

export default TimezoneSelect;
