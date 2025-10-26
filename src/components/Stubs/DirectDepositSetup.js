// DirectDepositSetup.js
import React, { useState, useEffect } from "react";
import { Box, Typography, TextField, Button, Alert, MenuItem, Select, InputLabel, FormControl } from "@mui/material";
import axios from "axios";

const DirectDepositSetup = () => {
  const [info, setInfo] = useState({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    axios.get("/direct_deposit/list")
      .then(res => {
        // Use the first item for current user (backend gives all if manager, only self otherwise)
        if (Array.isArray(res.data) && res.data.length > 0) {
          setInfo(res.data[0]);
        }
      });
  }, []);

  const handleChange = (e) => setInfo({ ...info, [e.target.name]: e.target.value });

  const save = async () => {
    await axios.post("/direct_deposit/setup", info);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <Box>
      <Typography variant="h6">Direct Deposit / Bank Info</Typography>
      <TextField
        label="Account Number"
        name="account_number"
        value={info.account_number || ""}
        onChange={handleChange}
        fullWidth margin="normal"
        inputProps={{ maxLength: 20 }}
      />
      <TextField
        label="Routing Number"
        name="routing_number"
        value={info.routing_number || ""}
        onChange={handleChange}
        fullWidth margin="normal"
        helperText="Transit + Institution (Canada), Routing (US)"
      />
      <TextField
        label="Bank Name"
        name="bank_name"
        value={info.bank_name || ""}
        onChange={handleChange}
        fullWidth margin="normal"
      />
      <TextField
        label="Branch"
        name="branch"
        value={info.branch || ""}
        onChange={handleChange}
        fullWidth margin="normal"
      />
      <FormControl fullWidth margin="normal">
        <InputLabel>Account Type</InputLabel>
        <Select
          name="account_type"
          value={info.account_type || "checking"}
          label="Account Type"
          onChange={handleChange}
        >
          <MenuItem value="checking">Checking</MenuItem>
          <MenuItem value="savings">Savings</MenuItem>
        </Select>
      </FormControl>
      <FormControl fullWidth margin="normal">
        <InputLabel>Currency</InputLabel>
        <Select
          name="currency"
          value={info.currency || "USD"}
          label="Currency"
          onChange={handleChange}
        >
          <MenuItem value="USD">USD</MenuItem>
          <MenuItem value="CAD">CAD</MenuItem>
        </Select>
      </FormControl>
      <Button variant="contained" color="primary" onClick={save}>Save</Button>
      {saved && <Alert severity="success" sx={{ mt: 2 }}>Saved!</Alert>}
      {info.account_number &&
        <Typography sx={{ mt: 2, color: 'gray', fontSize: 13 }}>
          <b>Note:</b> Account number ending in ****{(info.account_number || '').slice(-4)}
        </Typography>
      }
    </Box>
  );
};

export default DirectDepositSetup;
