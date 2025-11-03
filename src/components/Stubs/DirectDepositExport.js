// DirectDepositExport.js
import React, { useState } from "react";
import { Box, Typography, Button, TextField, Alert, MenuItem, Select, InputLabel, FormControl } from "@mui/material";
import axios from "axios";

const DirectDepositExport = () => {
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [format, setFormat] = useState("csv");
  const [fileUrl, setFileUrl] = useState(null);

  const generate = async () => {
    if (!start || !end) return;
    let endpoint = "";
    let params = `start=${start}&end=${end}&format=${format}`;
    if (format === "csv") {
      endpoint = `/payroll/direct_deposit/csv?${params}`;
    } else {
      endpoint = `/payroll/direct_deposit/nacha?start=${start}&end=${end}`;
    }
    const res = await axios.get(endpoint, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    setFileUrl(url);
  };

  return (
    <Box>
      <Typography variant="h6">Generate Direct Deposit NACHA/CSV for Bank Upload</Typography>
      <Box sx={{ display: "flex", gap: 2, my: 2 }}>
        <TextField
          label="Period Start"
          type="date"
          value={start}
          onChange={e => setStart(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          label="Period End"
          type="date"
          value={end}
          onChange={e => setEnd(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
        <FormControl>
          <InputLabel>Format</InputLabel>
          <Select value={format} label="Format" onChange={e => setFormat(e.target.value)}>
            <MenuItem value="csv">CSV</MenuItem>
            <MenuItem value="nacha">NACHA</MenuItem>
          </Select>
        </FormControl>
        <Button variant="contained" onClick={generate}>Generate</Button>
      </Box>
      {fileUrl && (
        <Alert severity="info" sx={{ mt: 2 }}>
          <a href={fileUrl} download={format === "csv" ? "direct_deposit.csv" : "nacha.txt"}>
            Download {format.toUpperCase()} File
          </a>
        </Alert>
      )}
    </Box>
  );
};
export default DirectDepositExport;
