import React, { useEffect, useMemo, useState } from "react";
import { Autocomplete, CircularProgress, TextField } from "@mui/material";
import { listManagerClients } from "./financeApi";
import { getClientDisplayName } from "./clientUtils";

export default function ClientLookupField({
  label = "Client",
  value,
  onChange,
  helperText = "",
  placeholder = "Search by client name, email, or phone",
  disabled = false,
  initialOptions = [],
  fallbackLabel = "Client",
}) {
  const [options, setOptions] = useState(initialOptions || []);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setOptions((prev) => {
      const merged = [...(initialOptions || []), ...prev];
      const deduped = [];
      const seen = new Set();
      for (const item of merged) {
        const key = String(item?.id || "");
        if (!key || seen.has(key)) continue;
        seen.add(key);
        deduped.push(item);
      }
      return deduped;
    });
  }, [initialOptions]);

  useEffect(() => {
    let active = true;
    const timer = setTimeout(async () => {
      if (disabled) return;
      setLoading(true);
      try {
        const rows = await listManagerClients({ q: inputValue || undefined, limit: 20 });
        if (active) setOptions(rows || []);
      } catch {
        if (active && !inputValue) {
          setOptions(initialOptions || []);
        }
      } finally {
        if (active) setLoading(false);
      }
    }, inputValue ? 250 : 0);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [disabled, initialOptions, inputValue]);

  const selected = useMemo(
    () => options.find((item) => String(item?.id) === String(value || "")) || null,
    [options, value]
  );

  return (
    <Autocomplete
      fullWidth
      disabled={disabled}
      options={options}
      value={selected}
      loading={loading}
      inputValue={inputValue}
      onInputChange={(_event, next) => setInputValue(next)}
      onChange={(_event, next) => onChange?.(next?.id || "", next || null)}
      getOptionLabel={(option) => getClientDisplayName(option, fallbackLabel)}
      isOptionEqualToValue={(option, current) => String(option?.id) === String(current?.id)}
      noOptionsText={inputValue ? "No matching clients" : "Start typing to search clients"}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={placeholder}
          helperText={helperText}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {loading ? <CircularProgress color="inherit" size={18} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
    />
  );
}
