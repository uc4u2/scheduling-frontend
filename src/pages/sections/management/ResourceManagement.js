// /src/pages/sections/management/ResourceManagement.js
import React, { useEffect, useState } from "react";
import {
  Box, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Typography, IconButton, Snackbar
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { Add, Edit, Delete } from "@mui/icons-material";
import api from "../../../utils/api";

const emptyForm = { name: "", description: "", capacity: 1 };

const ResourceManagement = ({ token }) => {
  const [rows, setRows]   = useState([]);
  const [loading, setL]   = useState(false);
  const [open, setOpen]   = useState(false);
  const [editing, setEdt] = useState(null);
  const [form, setForm]   = useState(emptyForm);
  const [snk, setSnk]     = useState({ open: false, msg: "" });

  const auth = { headers: { Authorization: `Bearer ${token}` } };

  const load = async () => {
    setL(true);
    try { const { data } = await api.get("/booking/resources", auth); setRows(data); }
    catch { setSnk({ open: true, msg: "Error loading resources" }); }
    setL(false);
  };
  useEffect(() => { load(); }, []);   // eslint-disable-line

  const save = async () => {
    try {
      if (editing) {
        await api.put(`/booking/resources/${editing.id}`, form, auth);
        setSnk({ open: true, msg: "Resource updated" });
      } else {
        await api.post("/booking/resources", form, auth);
        setSnk({ open: true, msg: "Resource added" });
      }
      setOpen(false); load();
    } catch {
      setSnk({ open: true, msg: "Save failed" });
    }
  };

  const del = async (id) => {
    if (!window.confirm("Delete this resource?")) return;
    try { await api.delete(`/booking/resources/${id}`, auth); load(); }
    catch { setSnk({ open: true, msg: "Delete failed" }); }
  };

  const show = (row = null) => {
    setEdt(row); setForm(row ? { ...row } : emptyForm); setOpen(true);
  };

  return (
    <Box p={3}>
      <Typography variant="h4" mb={2}>Resource Management</Typography>
      <Button startIcon={<Add />} variant="contained" sx={{ mb: 2 }} onClick={() => show()}>
        Add Resource
      </Button>

      <DataGrid
        rows={rows}
        loading={loading}
        autoHeight
        pageSize={10}
        disableSelectionOnClick
        columns={[
          { field: "name",       headerName: "Name",      flex: 1 },
          { field: "capacity",   headerName: "Capacity",  width: 110 },
          { field: "description",headerName: "Description", flex: 1 },
          {
            field: "actions", headerName: "", width: 140, renderCell: p => (
              <>
                <IconButton onClick={() => show(p.row)}><Edit /></IconButton>
                <IconButton color="error" onClick={() => del(p.row.id)}><Delete /></IconButton>
              </>
            )
          }
        ]}
      />

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? "Edit Resource" : "Add Resource"}</DialogTitle>
        <DialogContent>
          <TextField label="Name" fullWidth margin="dense" value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })} />
          <TextField label="Description" fullWidth margin="dense" value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })} />
          <TextField label="Capacity" type="number" fullWidth margin="dense" value={form.capacity}
            onChange={e => setForm({ ...form, capacity: e.target.value })} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={save} variant="contained">{editing ? "Update" : "Create"}</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snk.open} autoHideDuration={3000}
        message={snk.msg} onClose={() => setSnk({ ...snk, open: false })} />
    </Box>
  );
};
export default ResourceManagement;
