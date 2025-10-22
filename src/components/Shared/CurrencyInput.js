import React, { useState } from "react";
import {
  TextField,
  InputAdornment,
  IconButton,
  Tooltip,
} from "@mui/material";
import PercentIcon from "@mui/icons-material/Percent";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";

const CurrencyInput = ({
  value = 0,
  onChange,
  label = "Amount",
  baseAmount = 0,        // used when toggling % ↔ $
  allowToggle = false,   // enable $ ↔ % mode
  fullWidth = true,
  disabled = false,
  showZeroAsEmpty = true,
}) => {
  const [mode, setMode] = useState("currency"); // or 'percent'
  const isPercent = mode === "percent";

  const displayValue = (() => {
    if (isPercent) return ((parseFloat(value || 0) * 100).toFixed(2));
    if (value === 0 && showZeroAsEmpty) return "";
    return parseFloat(value || 0).toFixed(2);
  })();

  const formatValue = (num) => {
    if (isPercent) return num + "%";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(parseFloat(num || 0));
  };

  const handleChange = (e) => {
    const raw = e.target.value.replace(/[^0-9.]/g, "");
    const num = parseFloat(raw);
    if (isNaN(num)) return onChange(0);
    const val = isPercent ? num / 100 : num;
    onChange(val);
  };

  const toggleMode = () => {
    if (!allowToggle || baseAmount === 0) return;
    setMode((prev) => (prev === "currency" ? "percent" : "currency"));
  };

  return (
    <TextField
      label={label}
      value={displayValue}
      onChange={handleChange}
      disabled={disabled}
      fullWidth={fullWidth}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            {isPercent ? <PercentIcon fontSize="small" /> : <AttachMoneyIcon fontSize="small" />}
          </InputAdornment>
        ),
        endAdornment: allowToggle && baseAmount > 0 && (
          <InputAdornment position="end">
            <Tooltip title="Toggle between % and $">
              <IconButton onClick={toggleMode} size="small">
                <SwapHorizIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </InputAdornment>
        )
      }}
      inputProps={{
        inputMode: "decimal",
        pattern: "[0-9.]*",
      }}
    />
  );
};

export default CurrencyInput;
