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
  InputLabelProps,
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
      InputLabelProps={InputLabelProps}
      InputProps={{
        ...InputProps,
        endAdornment: (
          <InputAdornment position="end">
            <IconButton
              onClick={() => setShowPassword((prev) => !prev)}
              edge="end"
              aria-label={showPassword ? "Hide password" : "Show password"}
              sx={{
                mr: 0.25,
                width: { xs: 34, sm: 40 },
                height: { xs: 34, sm: 40 },
                color: "rgba(100,116,139,0.92)",
                backgroundColor: "rgba(255,255,255,0.72)",
                border: "1px solid rgba(226,232,240,0.92)",
                "&:hover": {
                  backgroundColor: "rgba(248,250,252,0.96)",
                },
              }}
            >
              {showPassword ? (
                <VisibilityOff sx={{ fontSize: { xs: 18, sm: 22 } }} />
              ) : (
                <Visibility sx={{ fontSize: { xs: 18, sm: 22 } }} />
              )}
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
