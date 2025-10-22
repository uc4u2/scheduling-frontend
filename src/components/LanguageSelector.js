import React, { useMemo } from "react";
import { FormControl, MenuItem, Select } from "@mui/material";
import { useTranslation } from "react-i18next";

const options = [
  { code: "en", labelKey: "language.short.english", fallbackKey: "language.english" },
  { code: "ru", labelKey: "language.short.russian", fallbackKey: "language.russian" },
  { code: "fa", labelKey: "language.short.farsi", fallbackKey: "language.farsi" },
  { code: "zh", labelKey: "language.short.mandarin", fallbackKey: "language.mandarin" },
];

const LanguageSelector = ({ sx, size = "small" }) => {
  const { i18n, t } = useTranslation();

  const value = useMemo(() => {
    const raw = i18n.language || "en";
    const normalized = raw.split("-")[0];
    return options.some((opt) => opt.code === normalized) ? normalized : "en";
  }, [i18n.language]);

  const handleChange = (event) => {
    const lang = event.target.value;
    i18n.changeLanguage(lang);
  };

  const resolveLabel = (langCode) => {
    const option = options.find((opt) => opt.code === langCode);
    if (!option) {
      return (langCode || "").toUpperCase();
    }
    const shortLabel = t(option.labelKey);
    if (shortLabel === option.labelKey) {
      return t(option.fallbackKey);
    }
    return shortLabel;
  };

  return (
    <FormControl size={size} sx={{ minWidth: 92, ...sx }}>
      <Select
        value={value}
        onChange={handleChange}
        renderValue={(selected) => resolveLabel(selected)}
        inputProps={{ "aria-label": t("language.label") }}
      >
        {options.map((opt) => (
          <MenuItem dense key={opt.code} value={opt.code}>
            {resolveLabel(opt.code)}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default LanguageSelector;
