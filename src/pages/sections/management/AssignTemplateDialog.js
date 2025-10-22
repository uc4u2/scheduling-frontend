// src/pages/sections/management/AssignTemplateDialog.js
import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Checkbox,
  FormControlLabel,
  Chip,
  CircularProgress,
  Autocomplete,
  Box,
  Alert,
} from "@mui/material";
import axios from "axios";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000";

export default function AssignTemplateDialog({ token, template, onClose }) {
  const [employees, setEmployees] = useState([]);
  const [sel, setSel] = useState([]);
  const [range, setRange] = useState({ from: "", to: "" });
  const [dow, setDow] = useState([0, 1, 2, 3, 4]); // default Mon-Fri
  const [override, setOverride] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  useEffect(() => {
    axios
      .get(`${API}/manager/recruiters?active=true`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((r) => setEmployees(r.data.recruiters || r.data || []));
  }, [token]);

  const toggleDow = (d) =>
    setDow(dow.includes(d) ? dow.filter((x) => x !== d) : [...dow, d]);

  const handleSave = async () => {
    if (!sel.length || !range.from || !range.to) {
      setErr("Pick employees and date range");
      return;
    }
    setSaving(true);
    setErr("");
    setOk("");
    try {
      await axios.post(
        `${API}/api/shift-templates/${template.id}/assign`,
        {
          recruiter_ids: sel.map((e) => e.id),
          start_date: range.from,
          end_date: range.to,
          days_of_week: dow,
          override,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setOk("Assigned!");
    } catch (e) {
      setErr(e.response?.data?.error || "Failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Assign “{template.name}”</DialogTitle>
      <DialogContent dividers>
        {err && (
          <Alert severity="error" sx={{ mb: 1 }}>
            {err}
          </Alert>
        )}
        {ok && (
          <Alert severity="success" sx={{ mb: 1 }}>
            {ok}
          </Alert>
        )}

        <Autocomplete
          multiple
          options={employees}
          getOptionLabel={(o) => o.full_name}
          value={sel}
          onChange={(_, v) => setSel(v)}
          renderTags={(val, getTagProps) =>
            val.map((op, i) => (
              <Chip label={op.full_name} {...getTagProps({ index: i })} />
            ))
          }
          renderInput={(params) => <TextField {...params} label="Employees" />}
          sx={{ mb: 2 }}
        />

        <Box sx={{ display: "flex", gap: 2 }}>
          <TextField
            label="Start date"
            type="date"
            InputLabelProps={{ shrink: true }}
            value={range.from}
            onChange={(e) => setRange({ ...range, from: e.target.value })}
            sx={{ flex: 1 }}
          />
          <TextField
            label="End date"
            type="date"
            InputLabelProps={{ shrink: true }}
            value={range.to}
            onChange={(e) => setRange({ ...range, to: e.target.value })}
            sx={{ flex: 1 }}
          />
        </Box>

        <Box sx={{ mt: 2 }}>
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((lbl, i) => (
            <FormControlLabel
              key={i}
              control={
                <Checkbox
                  checked={dow.includes(i)}
                  onChange={() => toggleDow(i)}
                />
              }
              label={lbl}
            />
          ))}
        </Box>

        <FormControlLabel
          sx={{ mt: 1 }}
          control={
            <Checkbox
              checked={override}
              onChange={(e) => setOverride(e.target.checked)}
            />
          }
          label="Override existing shifts"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button variant="contained" disabled={saving} onClick={handleSave}>
          {saving ? <CircularProgress size={20} /> : "Assign"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
