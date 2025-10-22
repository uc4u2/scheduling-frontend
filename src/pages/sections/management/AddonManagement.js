import React, { useEffect, useState } from "react";
import {
  Box, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Typography, Snackbar, Paper, IconButton, CircularProgress,
  Autocomplete, Stack
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { Add, Edit, Delete } from "@mui/icons-material";
import axios from "axios";

const API  = process.env.REACT_APP_API_URL || "";

const empty = { name: "", description: "", base_price: 0, duration: 15, service: null };

export default function AddonManagement({ token }) {
  /* remote data */
  const [rows,     setRows]     = useState([]);
  const [services, setServices] = useState([]);
  const [loading,  setLoading]  = useState(true);

  /* dialog */
  const [open, setOpen]   = useState(false);
  const [edit, setEdit]   = useState(null);
  const [form, setForm]   = useState(empty);

  /* misc */
  const [snk,  setSnk]    = useState({ open:false, msg:"" });
  const auth = { headers: { Authorization: `Bearer ${token}` } };

  /* ------------------------------------------------ Fetch */
  const fetchAll = async () => {
    setLoading(true);
    try {
      const [addonRes, svcRes] = await Promise.all([
        axios.get(`${API}/manager/addons`,       auth),
        axios.get(`${API}/booking/services`,     auth)
      ]);
      setRows(addonRes.data || []);
      setServices((svcRes.data || []).filter(s => s.is_active));
    } catch { setSnk({ open:true, msg:"Load failed" }); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchAll(); }, []);             // eslint-disable-line

  /* ------------------------------------------------ Helpers */
  const save = async () => {
    if (!form.name) { setSnk({ open:true, msg:"Name required"}); return; }

    const payload = {
      name:        form.name,
      description: form.description,
      base_price:  Number(form.base_price),
      duration:    Number(form.duration),
      service_id:  form.service ? form.service.id : null   // 👈 the magic
    };

    try {
      if (edit) {
        await axios.put(`${API}/manager/addons/${edit.id}`, payload, auth);
        setSnk({ open:true, msg:"Updated" });
      } else {
        await axios.post(`${API}/manager/addons`, payload, auth);
        setSnk({ open:true, msg:"Created" });
      }
      setOpen(false); fetchAll();
    } catch { setSnk({ open:true, msg:"Save failed"}); }
  };

  const del = async (id) => {
    if (!window.confirm("Delete this add-on?")) return;
    try {
      await axios.delete(`${API}/manager/addons/${id}`, auth);
      fetchAll();
    } catch { setSnk({ open:true, msg:"Delete failed"}); }
  };

  const show = (row=null) => {
    setEdit(row);
    setForm(row ? {
      name:        row.name,
      description: row.description,
      base_price:  row.base_price,
      duration:    row.duration,
      service:     services.find(s => s.id === row.service_id) || null
    } : empty);
    setOpen(true);
  };

  /* ------------------------------------------------ UI */
  return (
    <Box p={3}>
      <Typography variant="h4" mb={2}>Add-ons</Typography>

      <Button startIcon={<Add />} variant="contained" sx={{ mb:2 }} onClick={() => show()}>
        Add Add-on
      </Button>

      <Paper sx={{ mb:3 }}>
        <DataGrid
          rows={rows}
          loading={loading}
          autoHeight
          pageSizeOptions={[10,25]}
          columns={[
            { field:"name",        headerName:"Name",        flex:1 },
            { field:"service_name",headerName:"Linked Service", flex:1 },
            { field:"base_price",  headerName:"Price", width:100,
              valueFormatter:p=>`$${Number(p.value).toFixed(2)}` },
            { field:"duration",    headerName:"Min", width:90 },
            {
              field:"actions", headerName:"", width:140, renderCell:p=>(
                <>
                  <IconButton onClick={()=>show(p.row)}><Edit/></IconButton>
                  <IconButton color="error" onClick={()=>del(p.row.id)}><Delete/></IconButton>
                </>
              )
            }
          ]}
        />
      </Paper>

      {/* dialog */}
      <Dialog open={open} onClose={()=>setOpen(false)}>
        <DialogTitle>{edit?"Edit":"Add"} Add-on</DialogTitle>
        <DialogContent>
          {!services.length && <CircularProgress />}
          {!!services.length && (
            <>
              <TextField label="Name" fullWidth margin="dense"
                value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/>
              <TextField label="Description" fullWidth multiline rows={3} margin="dense"
                value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/>
              <TextField label="Base Price ($)" type="number" fullWidth margin="dense"
                value={form.base_price} onChange={e=>setForm({...form,base_price:e.target.value})}/>
              <TextField label="Duration (min)" type="number" fullWidth margin="dense"
                value={form.duration} onChange={e=>setForm({...form,duration:e.target.value})}/>

              {/* 🔽 pick service by NAME */}
              <Autocomplete
                sx={{ mt:2 }}
                options={services}
                getOptionLabel={o=>o.name}
                value={form.service}
                onChange={(_,v)=>setForm({...form,service:v})}
                renderInput={params=><TextField {...params} label="Link to Service" />}
                isOptionEqualToValue={(o,v)=>o.id===v.id}
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={()=>setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={save}>
            {edit?"Update":"Create"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snk.open} autoHideDuration={3000}
                message={snk.msg}
                onClose={()=>setSnk({...snk,open:false})}/>
    </Box>
  );
}
