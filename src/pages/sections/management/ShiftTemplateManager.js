// src/components/ShiftTemplateManager.js
import React, { useEffect, useState } from "react";
import {
  Box, Typography, Button, Table, TableHead, TableRow,
  TableCell, TableBody, IconButton, Dialog, DialogTitle,
  DialogContent, TextField, DialogActions, Checkbox,
  FormControlLabel, MenuItem, Chip, CircularProgress,
} from "@mui/material";
import { Delete, Edit, Assignment } from "@mui/icons-material";
import axios from "axios";
import AssignTemplateDialog from "./AssignTemplateDialog";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000";

export default function ShiftTemplateManager({ token }) {
  const [rows, setRows] = useState([]);
  const [openForm, setOpenForm] = useState(false);
  const [editTpl, setEditTpl] = useState(null);
  const [loading, setLoading]   = useState(false);
  const [assignTpl, setAssignTpl] = useState(null);

  /* fetch templates on mount */
  const load = () => {
    setLoading(true);
    axios.get(`${API}/api/shift-templates`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => setRows(r.data))
      .finally(() => setLoading(false));
  };
  useEffect(load, [token]);

  const handleSave = (tpl) => {
    const method = tpl.id ? "patch" : "post";
    const url    = tpl.id
      ? `${API}/api/shift-templates/${tpl.id}`
      : `${API}/api/shift-templates`;
    axios[method](url, tpl, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(load);
    setOpenForm(false);
    setEditTpl(null);
  };

  const handleDelete = (id) => {
    if (!window.confirm("Delete template?")) return;
    axios.delete(`${API}/api/shift-templates/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(load);
  };

  if (loading) return <CircularProgress />;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Shift Templates
      </Typography>

      <Button variant="contained"
              sx={{ mb: 2 }}
              onClick={() => { setEditTpl(null); setOpenForm(true);} }>
        New Template
      </Button>

      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Window</TableCell>
            <TableCell>Days</TableCell>
            <TableCell>Role</TableCell>
            <TableCell />
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.id}>
              <TableCell>{r.name}</TableCell>
              <TableCell>{r.start_time} – {r.end_time}</TableCell>
              <TableCell>
                {r.days.length === 0
                  ? <em>any</em>
                  : r.days.map((d) =>
                      <Chip key={d} size="small"
                            label={["Mon","Tue","Wed","Thu","Fri","Sat","Sun"][d]} />)}
              </TableCell>
              <TableCell>{r.role || <em>any</em>}</TableCell>
              <TableCell>
                <IconButton onClick={() => { setEditTpl(r); setOpenForm(true);} }>
                  <Edit fontSize="small" />
                </IconButton>
                <IconButton onClick={() => handleDelete(r.id)}>
                  <Delete fontSize="small" />
                </IconButton>
                <IconButton onClick={() => setAssignTpl(r)}>
                  <Assignment fontSize="small" />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {openForm &&
        <TemplateForm
          token={token}
          initial={editTpl}
          onClose={() => { setOpenForm(false); setEditTpl(null);} }
          onSave={handleSave}
        />}

      {assignTpl &&
        <AssignTemplateDialog
          token={token}
          template={assignTpl}
          onClose={() => setAssignTpl(null)}
        />}
    </Box>
  );
}

/* ------------------------------------------------------------- */
/* small inner component – create / edit form                    */
/* ------------------------------------------------------------- */
function TemplateForm({ token, initial, onClose, onSave }) {
  const [form, setForm] = useState(() => initial ? { ...initial } : {
    name:"", start_time:"08:00", end_time:"12:00",
    days:[], role:"", template_type:"private",
  });

  const handle = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const toggleDay = (idx) => {
    setForm({
      ...form,
      days: form.days.includes(idx)
        ? form.days.filter((d) => d !== idx)
        : [...form.days, idx],
    });
  };

  const save = () => onSave(form);

  return (
    <Dialog open maxWidth="sm" fullWidth onClose={onClose}>
      <DialogTitle>{initial ? "Edit" : "New"} Template</DialogTitle>
      <DialogContent dividers>
        <TextField label="Name" fullWidth sx={{ mt:1 }}
                   value={form.name} onChange={handle("name")} />
        <Box sx={{ display:"flex", gap:2, mt:2 }}>
          <TextField label="Start" type="time" sx={{ flex:1 }}
                     value={form.start_time} onChange={handle("start_time")}
                     InputLabelProps={{ shrink:true }} />
          <TextField label="End" type="time" sx={{ flex:1 }}
                     value={form.end_time} onChange={handle("end_time")}
                     InputLabelProps={{ shrink:true }} />
        </Box>
        <Box sx={{ mt:2 }}>
          {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((lbl,i)=>(
            <FormControlLabel
              key={i}
              control={
                <Checkbox checked={form.days.includes(i)}
                          onChange={()=>toggleDay(i)} />
              }
              label={lbl}
            />
          ))}
        </Box>
        <TextField label="Role (optional)" fullWidth sx={{ mt:2 }}
                   value={form.role || ""} onChange={handle("role")} />

        <TextField label="Template type" select fullWidth sx={{ mt:2 }}
                   value={form.template_type}
                   onChange={handle("template_type")}>
          {["private","team","default"].map(t=>(
            <MenuItem key={t} value={t}>{t}</MenuItem>
          ))}
        </TextField>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={save}>Save</Button>
      </DialogActions>
    </Dialog>
  );
}
