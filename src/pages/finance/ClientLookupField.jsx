import React, { useEffect, useMemo, useState } from "react";
import { Autocomplete, CircularProgress, TextField } from "@mui/material";
import { getManagerClient, listManagerClients } from "./financeApi";
import { getClientDisplayName } from "./clientUtils";

const mergeClientOptions = (...groups) => {
  const deduped = [];
  const seen = new Set();
  groups.flat().forEach((item) => {
    const key = String(item?.id || "");
    if (!key || seen.has(key)) return;
    seen.add(key);
    deduped.push(item);
  });
  return deduped;
};

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
  const [selectedClient, setSelectedClient] = useState(null);

  const selected = useMemo(() => {
    const matchId = String(value || "");
    if (!matchId) return null;
    return (
      (selectedClient && String(selectedClient?.id) === matchId ? selectedClient : null) ||
      options.find((item) => String(item?.id) === matchId) ||
      (initialOptions || []).find((item) => String(item?.id) === matchId) ||
      null
    );
  }, [initialOptions, options, selectedClient, value]);

  useEffect(() => {
    setOptions((prev) => mergeClientOptions(initialOptions || [], prev, selected ? [selected] : []));
  }, [initialOptions, selected]);

  useEffect(() => {
    if (!selected) {
      setInputValue("");
      return;
    }
    setInputValue(getClientDisplayName(selected, fallbackLabel));
  }, [fallbackLabel, selected]);

  useEffect(() => {
    let active = true;
    const matchId = String(value || "");
    if (!matchId || selected) {
      if (!matchId && active) setSelectedClient(null);
      return () => {
        active = false;
      };
    }
    setLoading(true);
    getManagerClient(matchId)
      .then((row) => {
        if (!active || !row?.id) return;
        setSelectedClient(row);
        setOptions((prev) => mergeClientOptions([row], prev, initialOptions || []));
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [initialOptions, selected, value]);

  useEffect(() => {
    let active = true;
    const timer = setTimeout(async () => {
      if (disabled) return;
      setLoading(true);
      try {
        const rows = await listManagerClients({ q: inputValue || undefined, limit: 20 });
        if (active) {
          setOptions((prev) =>
            mergeClientOptions(rows || [], selected ? [selected] : [], prev, initialOptions || [])
          );
        }
      } catch {
        if (active && !inputValue) {
          setOptions(mergeClientOptions(initialOptions || [], selected ? [selected] : []));
        }
      } finally {
        if (active) setLoading(false);
      }
    }, inputValue ? 250 : 0);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [disabled, initialOptions, inputValue, selected]);

  return (
    <Autocomplete
      fullWidth
      disabled={disabled}
      options={options}
      value={selected}
      loading={loading}
      inputValue={inputValue}
      onInputChange={(_event, next, reason) => {
        if (reason === "reset") return;
        setInputValue(next);
      }}
      onChange={(_event, next) => {
        setSelectedClient(next || null);
        setInputValue(next ? getClientDisplayName(next, fallbackLabel) : "");
        onChange?.(next?.id || "", next || null);
      }}
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
