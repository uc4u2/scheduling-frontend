// DirectDepositAdmin.js
import React, { useEffect, useState } from "react";
import { Box, Typography, Table, TableHead, TableRow, TableCell, TableBody, Button, TextField, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions, Alert } from "@mui/material";
import axios from "axios";

const DirectDepositAdmin = () => {
  const [list, setList] = useState([]);
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState({
    employee_id: "",
    routing_number: "",
    account_number: "",
    bank_name: "",
    branch: "",
    account_type: "checking",
    currency: "USD"
  });
  const [recruiters, setRecruiters] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchList();
    fetchRecruiters();
  }, []);

  const fetchList = async () => {
    const res = await axios.get("/direct_deposit/list");
    setList(res.data);
  };

  const fetchRecruiters = async () => {
    try {
      const res = await axios.get("/manager/recruiters");
      setRecruiters(res.data.recruiters || []);
    } catch (e) {}
  };

  const openDialog = () => setShowDialog(true);
  const closeDialog = () => {
    setShowDialog(false);
    setForm({
      employee_id: "",
      routing_number: "",
      account_number: "",
      bank_name: "",
      branch: "",
      account_type: "checking",
      currency: "USD"
    });
    setMessage("");
  };

  const handleChange = e =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSave = async () => {
    try {
      await axios.post("/direct_deposit/setup", form);
      setMessage("Saved!");
      fetchList();
      setTimeout(closeDialog, 1200);
    } catch (e) {
      setMessage("Failed to save.");
    }
  };

  const deactivate = async (id) => {
    await axios.post(`/direct_deposit/${id}/deactivate`);
    fetchList();
  };

  return (
    <Box>
      <Typography variant="h6" mb={2}>Direct Deposit Administration</Typography>
      <Button onClick={openDialog} variant="contained" sx={{ mb: 2 }}>Add Bank Info</Button>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Employee</TableCell>
            <TableCell>Bank</TableCell>
            <TableCell>Routing #</TableCell>
            <TableCell>Account #</TableCell>
            <TableCell>Type</TableCell>
            <TableCell>Currency</TableCell>
            <TableCell>Active</TableCell>
            <TableCell>Action</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {list.map(row => (
            <TableRow key={row.id}>
              <TableCell>
                {recruiters.find(r => r.id === row.employee_id)?.name || row.employee_id}
              </TableCell>
              <TableCell>{row.bank_name}</TableCell>
              <TableCell>{row.routing_number}</TableCell>
              <TableCell>****{row.account_number}</TableCell>
              <TableCell>{row.account_type}</TableCell>
              <TableCell>{row.currency}</TableCell>
              <TableCell>{row.is_active ? "Yes" : "No"}</TableCell>
              <TableCell>
                {row.is_active && (
                  <Button color="error" onClick={() => deactivate(row.id)} size="small">Deactivate</Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onClose={closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Add Direct Deposit Info</DialogTitle>
        <DialogContent>
          <TextField
            select
            label="Employee"
            name="employee_id"
            value={form.employee_id}
            onChange={handleChange}
            fullWidth
            sx={{ mb: 2 }}
            required
          >
            <MenuItem value="">Select...</MenuItem>
            {recruiters.map(r => (
              <MenuItem key={r.id} value={r.id}>{r.name} ({r.email})</MenuItem>
            ))}
          </TextField>
          <TextField
            label="Bank Name"
            name="bank_name"
            value={form.bank_name}
            onChange={handleChange}
            fullWidth
            sx={{ mb: 2 }}
          />
          <TextField
            label="Routing Number"
            name="routing_number"
            value={form.routing_number}
            onChange={handleChange}
            fullWidth
            sx={{ mb: 2 }}
            required
          />
          <TextField
            label="Account Number"
            name="account_number"
            value={form.account_number}
            onChange={handleChange}
            fullWidth
            sx={{ mb: 2 }}
            required
          />
          <TextField
            label="Branch"
            name="branch"
            value={form.branch}
            onChange={handleChange}
            fullWidth
            sx={{ mb: 2 }}
          />
          <TextField
            select
            label="Account Type"
            name="account_type"
            value={form.account_type}
            onChange={handleChange}
            fullWidth
            sx={{ mb: 2 }}
          >
            <MenuItem value="checking">Checking</MenuItem>
            <MenuItem value="savings">Savings</MenuItem>
          </TextField>
          <TextField
            select
            label="Currency"
            name="currency"
            value={form.currency}
            onChange={handleChange}
            fullWidth
            sx={{ mb: 2 }}
          >
            <MenuItem value="USD">USD</MenuItem>
            <MenuItem value="CAD">CAD</MenuItem>
          </TextField>
          {message && <Alert severity={message === "Saved!" ? "success" : "error"}>{message}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
export default DirectDepositAdmin;
