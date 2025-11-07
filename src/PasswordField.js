// src/PasswordField.js
import React, { useState } from "react";
import { TextField, IconButton, InputAdornment } from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";

const PasswordField = ({
  label,
  value,
  onChange,
  autoComplete = "current-password",
  helperText,
  InputProps,
  inputProps,
  autoFocus,
  ...rest
}) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <TextField
      label={label}
      type={showPassword ? "text" : "password"}
      value={value}
      onChange={onChange}
      fullWidth
      autoComplete={autoComplete}
      helperText={helperText}
      autoFocus={autoFocus}
      InputProps={{
        ...InputProps,
        endAdornment: (
          <InputAdornment position="end">
            <IconButton
              onClick={() => setShowPassword((prev) => !prev)}
              edge="end"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <VisibilityOff /> : <Visibility />}
            </IconButton>
          </InputAdornment>
        ),
      }}
      inputProps={{ autoCapitalize: "none", ...inputProps }}
      {...rest}
    />
  );
};

export default PasswordField;
