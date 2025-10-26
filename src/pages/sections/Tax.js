import React, { useState, useEffect } from "react";
import {
  Container, Typography, TextField, Grid, Button, IconButton,
  Box, MenuItem, FormControl, Select, InputLabel,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper
} from "@mui/material";
import { AddCircle, RemoveCircle } from "@mui/icons-material";
import axios from "axios";
import ManagementFrame from "../../components/ui/ManagementFrame";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const CA_PROVINCES = [
  "AB", "BC", "MB", "NB", "NL", "NS", "NT", "NU",
  "ON", "PE", "SK", "YT"
];

const US_STATES = [
  "CA", "NY", "TX", "FL", "IL", "PA", "OH", "MI", "GA", "NC",
  "NJ", "VA", "WA", "AZ", "MA", "IN", "TN", "MO", "WI", "CO",
  "MD", "MN", "SC", "AL", "KY", "OR", "OK", "CT", "IA", "MS"
];

export default function Tax() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [country, setCountry] = useState("ca");
  const [level, setLevel] = useState("federal");
  const [region, setRegion] = useState("");
  const [brackets, setBrackets] = useState([{ from: 0, to: "", rate: "" }]);
  const [existingConfigs, setExistingConfigs] = useState([]);
  const [selectedConfigs, setSelectedConfigs] = useState([]);

  const handleAddBracket = () => {
    setBrackets([...brackets, { from: "", to: "", rate: "" }]);
  };

  const handleRemoveBracket = (index) => {
    const updated = [...brackets];
    updated.splice(index, 1);
    setBrackets(updated);
  };

  const handleBracketChange = (index, field, value) => {
    const updated = [...brackets];
    updated[index][field] = value;
    setBrackets(updated);
  };

  const handleSave = async () => {
    const regionKey =
    level === "federal"
      ? country === "ca"
        ? "canada_federal"
        : country === "qc"
          ? "quebec_federal"
          : "us_federal"
      : country === "qc"
        ? "qc_qpp"
        : country === "us"
          ? `${region.toLowerCase()}_state`
          : region.toLowerCase();
  

    const cleanedBrackets = brackets.map(b => ({
      from: Number(b.from),
      to: Number(b.to),
      rate: Number(b.rate) / 100
    }));

    try {
      const token = localStorage.getItem("token");
      await axios.post(`${API_URL}/automation/tax/config`, {
        year: Number(year),
        region: regionKey,
        brackets: cleanedBrackets
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("✅ Tax configuration saved.");
      fetchExistingConfigs();
    } catch (err) {
      console.error("Error saving tax config", err);
      alert("Failed to save tax config. Check console.");
    }
  };

  const handleDeleteConfig = async (year, region) => {
    if (!window.confirm(`Delete config for ${region} - ${year}?`)) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_URL}/automation/tax/config`, {
        params: { year, region },
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("🗑️ Deleted.");
      fetchExistingConfigs();
    } catch (err) {
      console.error("Delete failed", err);
      alert("Failed to delete tax config.");
    }
  };

  const handleToggleSelect = (year, region, checked) => {
    if (checked) {
      setSelectedConfigs([...selectedConfigs, { year, region }]);
    } else {
      setSelectedConfigs(
        selectedConfigs.filter((cfg) => !(cfg.year === year && cfg.region === region))
      );
    }
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedConfigs(existingConfigs.map((cfg) => ({ year: cfg.year, region: cfg.region })));
    } else {
      setSelectedConfigs([]);
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selectedConfigs.length} tax config(s)?`)) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_URL}/automation/tax/config`, {
        data: { items: selectedConfigs },
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("🧹 Selected configs deleted");
      setSelectedConfigs([]);
      fetchExistingConfigs();
    } catch (err) {
      console.error("Bulk delete failed", err);
      alert("Failed to delete selected tax configs.");
    }
  };

  const fetchExistingConfigs = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/automation/tax/config/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setExistingConfigs(res.data || []);
    } catch (err) {
      console.error("Failed to load existing tax configs", err);
    }
  };

  useEffect(() => {
    fetchExistingConfigs();
  }, []);

  return (
  <ManagementFrame title="Tax Configuration" subtitle="Configure federal and regional tax brackets and rates.">
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Typography variant="h5" gutterBottom>
        Tax Configuration
      </Typography>

      <Grid container spacing={2} mb={2}>
        <Grid item xs={4}>
          <TextField
            label="Year"
            type="number"
            fullWidth
            value={year}
            onChange={(e) => setYear(e.target.value)}
          />
        </Grid>
        <Grid item xs={4}>
          <FormControl fullWidth>
            <InputLabel>Region</InputLabel>
            <Select
              value={country}
              onChange={(e) => {
                setCountry(e.target.value);
                setRegion("");
              }}
            >
              <MenuItem value="ca">Canada</MenuItem>
              <MenuItem value="qc">Québec</MenuItem>
              <MenuItem value="us">United States</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={4}>
          <FormControl fullWidth>
            <InputLabel>Level</InputLabel>
            <Select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
            >
              <MenuItem value="federal">Federal</MenuItem>
              <MenuItem value="region">Province / State</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        {level === "region" && (
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>
                {country === "ca"
                  ? "Province"
                  : country === "us"
                    ? "State"
                    : "Region"}
              </InputLabel>
              <Select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
              >
                {country === "ca" && CA_PROVINCES.map((p) => (
                  <MenuItem key={p} value={p}>{p}</MenuItem>
                ))}
                {country === "us" && US_STATES.map((s) => (
                  <MenuItem key={s} value={s}>{s}</MenuItem>
                ))}
                {country === "qc" && (
                  <MenuItem value="qc">QC (Québec)</MenuItem>
                )}
              </Select>
            </FormControl>
          </Grid>
        )}
      </Grid>

      <Typography variant="subtitle1">Brackets</Typography>
      {brackets.map((b, i) => (
        <Grid container spacing={2} key={i} alignItems="center" mb={1}>
          <Grid item xs={4}>
            <TextField
              label="From ($)"
              type="number"
              fullWidth
              value={b.from}
              onChange={(e) => handleBracketChange(i, "from", e.target.value)}
            />
          </Grid>
          <Grid item xs={4}>
            <TextField
              label="To ($)"
              type="number"
              fullWidth
              value={b.to}
              onChange={(e) => handleBracketChange(i, "to", e.target.value)}
            />
          </Grid>
          <Grid item xs={3}>
            <TextField
              label="Rate (%)"
              type="number"
              fullWidth
              value={b.rate}
              onChange={(e) => handleBracketChange(i, "rate", e.target.value)}
            />
          </Grid>
          <Grid item xs={1}>
            <IconButton onClick={() => handleRemoveBracket(i)} disabled={brackets.length === 1}>
              <RemoveCircle />
            </IconButton>
          </Grid>
        </Grid>
      ))}

      <Box mt={2}>
        <Button startIcon={<AddCircle />} onClick={handleAddBracket}>
          Add Bracket
        </Button>
      </Box>

      <Box mt={4}>
        <Button variant="contained" onClick={handleSave}>
          Save Configuration
        </Button>
      </Box>

      <Box mt={6}>
        <Typography variant="h6">📋 Existing Tax Configurations</Typography>
        {selectedConfigs.length > 0 && (
          <Box mb={2}>
            <Button
              variant="outlined"
              color="error"
              onClick={handleBulkDelete}
            >
              Delete Selected ({selectedConfigs.length})
            </Button>
          </Box>
        )}
        <TableContainer component={Paper} sx={{ mt: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <input
                    type="checkbox"
                    checked={
                      selectedConfigs.length > 0 &&
                      selectedConfigs.length === existingConfigs.length
                    }
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                </TableCell>
                <TableCell>Year</TableCell>
                <TableCell>Region</TableCell>
                <TableCell># of Brackets</TableCell>
                <TableCell>Last Updated</TableCell>
                <TableCell>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {existingConfigs.map((cfg, idx) => {
                const selected = selectedConfigs.some(
                  (s) => s.year === cfg.year && s.region === cfg.region
                );
                return (
                  <TableRow key={idx}>
                    <TableCell padding="checkbox">
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={(e) =>
                          handleToggleSelect(cfg.year, cfg.region, e.target.checked)
                        }
                      />
                    </TableCell>
                    <TableCell>{cfg.year}</TableCell>
                    <TableCell>{cfg.region}</TableCell>
                    <TableCell>{cfg.brackets?.length || 0}</TableCell>
                    <TableCell>{new Date(cfg.updated_at).toLocaleString()}</TableCell>
                    <TableCell>
                      <Button
                        color="error"
                        size="small"
                        onClick={() => handleDeleteConfig(cfg.year, cfg.region)}
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Container>
  </ManagementFrame>
);
}

