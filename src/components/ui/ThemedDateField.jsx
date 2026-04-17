import React from "react";
import TextField from "@mui/material/TextField";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";

const parseDateValue = (value) => {
  if (!value) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;

  const [year, month, day] = String(value).split("-").map(Number);
  if (!year || !month || !day) return null;

  const parsed = new Date(year, month - 1, day);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatDateValue = (date) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseMonthValue = (value) => {
  if (!value) return null;
  const [year, month] = String(value).split("-").map(Number);
  if (!year || !month) return null;
  const parsed = new Date(year, month - 1, 1);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatMonthValue = (date) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
};

const parseTimeValue = (value) => {
  if (!value) return null;
  const [hours, minutes] = String(value).split(":").map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  const parsed = new Date();
  parsed.setHours(hours, minutes, 0, 0);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatTimeValue = (date) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "";
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
};

const ThemedDateField = ({
  value,
  onChange,
  name,
  label,
  fullWidth = true,
  InputLabelProps,
  inputProps,
  InputProps,
  ...textFieldProps
}) => {
  const handleChange = (date) => {
    const nextValue = formatDateValue(date);
    onChange?.({
      target: { name, value: nextValue },
      currentTarget: { name, value: nextValue },
    });
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <DatePicker
        label={label}
        value={parseDateValue(value)}
        onChange={handleChange}
        inputFormat="MM/dd/yyyy"
        renderInput={(params) => (
          <TextField
            {...params}
            {...textFieldProps}
            name={name}
            fullWidth={fullWidth}
            InputLabelProps={{
              ...params.InputLabelProps,
              ...InputLabelProps,
              shrink: true,
            }}
            inputProps={{
              ...params.inputProps,
              ...inputProps,
              placeholder: "mm/dd/yyyy",
            }}
            InputProps={{
              ...params.InputProps,
              ...InputProps,
            }}
          />
        )}
      />
    </LocalizationProvider>
  );
};

export const ThemedMonthField = ({
  value,
  onChange,
  name,
  label = "Month",
  fullWidth = true,
  InputLabelProps,
  inputProps,
  InputProps,
  ...textFieldProps
}) => {
  const handleChange = (date) => {
    const nextValue = formatMonthValue(date);
    onChange?.({
      target: { name, value: nextValue },
      currentTarget: { name, value: nextValue },
    });
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <DatePicker
        views={["year", "month"]}
        openTo="month"
        label={label}
        value={parseMonthValue(value)}
        onChange={handleChange}
        inputFormat="MMMM yyyy"
        renderInput={(params) => (
          <TextField
            {...params}
            {...textFieldProps}
            name={name}
            fullWidth={fullWidth}
            InputLabelProps={{
              ...params.InputLabelProps,
              ...InputLabelProps,
              shrink: true,
            }}
            inputProps={{
              ...params.inputProps,
              ...inputProps,
              placeholder: "Month yyyy",
            }}
            InputProps={{
              ...params.InputProps,
              ...InputProps,
            }}
          />
        )}
      />
    </LocalizationProvider>
  );
};

export const ThemedTimeField = ({
  value,
  onChange,
  name,
  label,
  fullWidth = true,
  InputLabelProps,
  inputProps,
  InputProps,
  ...textFieldProps
}) => {
  const handleChange = (date) => {
    const nextValue = formatTimeValue(date);
    onChange?.({
      target: { name, value: nextValue },
      currentTarget: { name, value: nextValue },
    });
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <TimePicker
        label={label}
        value={parseTimeValue(value)}
        onChange={handleChange}
        inputFormat="hh:mm a"
        renderInput={(params) => (
          <TextField
            {...params}
            {...textFieldProps}
            name={name}
            fullWidth={fullWidth}
            InputLabelProps={{
              ...params.InputLabelProps,
              ...InputLabelProps,
              shrink: true,
            }}
            inputProps={{
              ...params.inputProps,
              ...inputProps,
              placeholder: "hh:mm AM",
            }}
            InputProps={{
              ...params.InputProps,
              ...InputProps,
            }}
          />
        )}
      />
    </LocalizationProvider>
  );
};

export default ThemedDateField;
