import React from "react";
import { Grid, TextField, MenuItem, Typography } from "@mui/material";

const REGION_OPTIONS = [
  { label: "🇨🇦 Canada (excluding Quebec)", value: "ca" },
  { label: "🇨🇦 Quebec", value: "qc" },
  { label: "🇺🇸 USA", value: "us" },
  { label: "🌍 International", value: "intl" },
];

const PROVINCES_CA = [
  "AB", "BC", "MB", "NB", "NL", "NS", "NT", "NU", "ON", "PE", "QC", "SK", "YT"
];

const STATES_US = [
  "CA", "NY", "TX", "FL", "IL", "PA", "OH", "GA", "NC", "MI" // sample
];

export default function RegionSelector({ region, province, onChange }) {
  const handleRegionChange = (e) => {
    const newRegion = e.target.value;
    let defaultProvince = "on";
    if (newRegion === "qc") defaultProvince = "qc";
    else if (newRegion === "us") defaultProvince = "CA";
    else if (newRegion === "intl") defaultProvince = "";

    onChange(newRegion, defaultProvince);
  };

  const handleProvinceChange = (e) => {
    onChange(region, e.target.value);
  };

  const getProvinceOptions = () => {
    if (region === "ca" || region === "qc") return PROVINCES_CA;
    if (region === "us") return STATES_US;
    return [];
  };

  return (
    <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
      <Grid item xs={12} sm={6}>
        <Typography variant="subtitle2" gutterBottom>
          Region / Country
        </Typography>
        <TextField
          select
          fullWidth
          value={region}
          onChange={handleRegionChange}
        >
          {REGION_OPTIONS.map((opt) => (
            <MenuItem key={opt.value} value={opt.value}>
              {opt.label}
            </MenuItem>
          ))}
        </TextField>
      </Grid>

      {getProvinceOptions().length > 0 && (
        <Grid item xs={12} sm={6}>
          <Typography variant="subtitle2" gutterBottom>
            Province / State
          </Typography>
          <TextField
            select
            fullWidth
            value={province}
            onChange={handleProvinceChange}
          >
            {getProvinceOptions().map((prov) => (
              <MenuItem key={prov} value={prov.toLowerCase()}>
                {prov}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
      )}
    </Grid>
  );
}
