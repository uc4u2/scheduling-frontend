// DirectDepositBatchExport.js
import React, { useState } from "react";
import { Box, Typography, Button, Grid, TextField, IconButton, Alert } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import axios from "axios";

const DirectDepositBatchExport = () => {
  const [periods, setPeriods] = useState([{ start: "", end: "" }]);
  const [downloading, setDownloading] = useState(false);
  const [zipUrl, setZipUrl] = useState(null);
  const [error, setError] = useState("");

  const addPeriod = () => setPeriods([...periods, { start: "", end: "" }]);
  const removePeriod = (idx) => setPeriods(periods.filter((_, i) => i !== idx));
  const updatePeriod = (idx, key, value) =>
    setPeriods(periods.map((p, i) => (i === idx ? { ...p, [key]: value } : p)));

  const handleDownload = async () => {
    setDownloading(true);
    setError("");
    setZipUrl(null);
    try {
      const res = await axios.post(
        "/payroll/direct_deposit/batch_zip",
        { periods },
        { responseType: "blob" }
      );
      const url = window.URL.createObjectURL(new Blob([res.data]));
      setZipUrl(url);
    } catch (e) {
      setError("Failed to generate ZIP file.");
    }
    setDownloading(false);
  };

  return (
    <Box>
      <Typography variant="h6" mb={2}>Batch Export Direct Deposit (CSV ZIP)</Typography>
      <Grid container spacing={2}>
        {periods.map((p, idx) => (
          <React.Fragment key={idx}>
            <Grid item xs={5}>
              <TextField
                label="Start Date"
                type="date"
                value={p.start}
                onChange={e => updatePeriod(idx, "start", e.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            </Grid>
            <Grid item xs={5}>
              <TextField
                label="End Date"
                type="date"
                value={p.end}
                onChange={e => updatePeriod(idx, "end", e.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            </Grid>
            <Grid item xs={2} sx={{ display: "flex", alignItems: "center" }}>
              <IconButton onClick={() => removePeriod(idx)} disabled={periods.length === 1}>
                <RemoveIcon />
              </IconButton>
              {idx === periods.length - 1 && (
                <IconButton onClick={addPeriod}>
                  <AddIcon />
                </IconButton>
              )}
            </Grid>
          </React.Fragment>
        ))}
      </Grid>
      <Button
        variant="contained"
        color="primary"
        sx={{ mt: 2 }}
        onClick={handleDownload}
        disabled={downloading}
      >
        {downloading ? "Generating..." : "Download ZIP"}
      </Button>
      {zipUrl && (
        <Alert severity="info" sx={{ mt: 2 }}>
          <a href={zipUrl} download="direct_deposit_exports.zip">
            Download Direct Deposit ZIP
          </a>
        </Alert>
      )}
      {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
    </Box>
  );
};
export default DirectDepositBatchExport;
