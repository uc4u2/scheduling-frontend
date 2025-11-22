/* eslint-disable react-hooks/exhaustive-deps */
/* ────────────────────────────────────────────────────────────── */
/*  /src/pages/sections/management/ServiceAssignment.js           */
/* ────────────────────────────────────────────────────────────── */
import React, { useEffect, useMemo, useState } from "react";
import {
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Paper,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import { DataGrid } from "@mui/x-data-grid";
import { Add, Edit, Delete } from "@mui/icons-material";
import axios from "axios";

/* =================================================================
   COMPONENT
================================================================= */
const ServiceAssignment = ({ token }) => {
  const theme = useTheme();
  const isSmDown = useMediaQuery(theme.breakpoints.down("sm"));
  /* ─────────── remote data ─────────── */
  const [employees, setEmployees]   = useState([]); // recruiters
  const [services, setServices]     = useState([]);
  const [departments, setDepartments] = useState([]);
  const [rawRows, setRawRows]       = useState([]); // EmployeeService links
  const [loading, setLoading]       = useState(true);

  /* ─────────── filters ─────────── */
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedEmployee,   setSelectedEmployee]   = useState("");

  /* ─────────── dialog state ─────────── */
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing,    setEditing]    = useState(null);
  const [form, setForm] = useState({
    recruiter: null,
    service: null,
    price_override:    "",
    duration_override: "",
    cooling_override:  "",
  });

  /* ─────────── service‑slot state ─────────── */
  const [slotDate, setSlotDate]         = useState("");
  const [slotStartTime, setSlotStartTime] = useState("");

  /* ─────────── misc ui ─────────── */
  const [snackbar, setSnackbar] = useState({ open: false, msg: "" });

  /* ─────────── helpers ─────────── */
  const auth = { headers: { Authorization: `Bearer ${token}` } };
  const API  = process.env.REACT_APP_API_URL || "";

  /* =================================================================
     FETCH ALL DATA
  ================================================================= */
  const fetchAll = async () => {
    setLoading(true);
    try {
      const [recRes, svcRes, depRes, linkRes] = await Promise.all([
        axios.get(`${API}/manager/recruiters`,       auth),
        axios.get(`${API}/booking/services`,         auth),
        axios.get(`${API}/api/departments`,          auth),
        axios.get(`${API}/booking/employee-services`,auth),
      ]);

      setEmployees(recRes.data.recruiters || recRes.data || []);
      setServices (svcRes.data || []);
      setDepartments(depRes.data || []);

      /* flatten links for the grid */
      setRawRows(
        (linkRes.data || []).map((x) => ({
          id:             Number(x.id),
          recruiter_id:   x.recruiter.id,
          recruiter_name: x.recruiter.full_name,
          recruiter_dept: x.recruiter.department_id ?? null,
          service_id:     x.service.id,
          service_name:   x.service.name,
          price:          Number(x.price_override ?? x.service.base_price ?? 0),
          duration:       x.duration_override ?? x.service.duration,
          cooling:        x.cooling_override  ?? x.service.cooling_time ?? 0,
        }))
      );
    } catch {
      setSnackbar({ open: true, msg: "Error loading data." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  /* =================================================================
     DERIVED DATA
  ================================================================= */
  const filteredEmployees = useMemo(
    () =>
      selectedDepartment
        ? employees.filter(e => String(e.department_id) === String(selectedDepartment))
        : employees,
    [employees, selectedDepartment]
  );

  const rows = useMemo(() => {
    let r = [...rawRows];
    if (selectedDepartment)
      r = r.filter(row => String(row.recruiter_dept) === String(selectedDepartment));
    if (selectedEmployee)
      r = r.filter(row => String(row.recruiter_id) === String(selectedEmployee));
    return r;
  }, [rawRows, selectedDepartment, selectedEmployee]);

  /* =================================================================
     CRUD HELPERS
  ================================================================= */
  const openDialog = (row = null) => {
    setEditing(row);
    if (row) {
      setForm({
        recruiter:         employees.find(e => e.id === row.recruiter_id) || null,
        service:           services.find(s => s.id === row.service_id)    || null,
        price_override:    row.price,
        duration_override: row.duration,
        cooling_override:  row.cooling,
      });
    } else {
      setForm({
        recruiter: null,
        service:   null,
        price_override:    "",
        duration_override: "",
        cooling_override:  "",
      });
    }
    setSlotDate("");
    setSlotStartTime("");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.recruiter || !form.service) return;

    const payload = {
      recruiter_id:            form.recruiter.id,
      service_id:              form.service.id,
      price_override:          form.price_override    === "" ? null : Number(form.price_override),
      duration_override:       form.duration_override === "" ? null : Number(form.duration_override),
      cooling_time_override:   form.cooling_override  === "" ? null : Number(form.cooling_override),
    };

    try {
      if (editing) {
        await axios.put(`${API}/booking/employee-services/${editing.id}`, payload, auth);
        setSnackbar({ open: true, msg: "Updated!" });
      } else {
        await axios.post(`${API}/booking/employee-services`, payload, auth);
        setSnackbar({ open: true, msg: "Added!" });
      }
      setDialogOpen(false);
      fetchAll();
    } catch {
      setSnackbar({ open: true, msg: "Save failed." });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this assignment?")) return;
    try {
      await axios.delete(`${API}/booking/employee-services`, { ...auth, params: { id } });
      setSnackbar({ open: true, msg: "Deleted." });
      fetchAll();
    } catch {
      setSnackbar({ open: true, msg: "Delete failed." });
    }
  };

  /* =================================================================
     ADD ONE‑OFF SERVICE SLOT
  ================================================================= */
  const handleAddServiceSlot = async () => {
    if (!form.recruiter || !form.service || !slotDate || !slotStartTime) {
      setSnackbar({ open: true, msg: "Please fill all service slot fields." });
      return;
    }
    try {
      await axios.post(
        `${API}/api/manager/employees/${form.recruiter.id}/add-service-slot`,
        { service_id: form.service.id, date: slotDate, start_time: slotStartTime },
        auth
      );
      setSnackbar({ open: true, msg: "Service slot added!" });
      setSlotDate("");
      setSlotStartTime("");
    } catch {
      setSnackbar({ open: true, msg: "Failed to add service slot." });
    }
  };

  /* =================================================================
     FILTER HANDLERS
  ================================================================= */
  const handleDeptChange = (e) => {
    setSelectedDepartment(e.target.value);
    setSelectedEmployee("");
  };

  /* =================================================================
     RENDER
  ================================================================= */
  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h4" sx={{ mb: 2 }}>
        Service&nbsp;Assignments
      </Typography>

      {/* ───────────── Filter bar ───────────── */}
      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          alignItems={{ xs: "stretch", md: "center" }}
          flexWrap="wrap"
        >
          {/* Department */}
          <TextField
            select
            label="Department"
            value={selectedDepartment}
            onChange={handleDeptChange}
            sx={{ minWidth: { md: 220 } }}
            fullWidth={isSmDown}
          >
            <MenuItem value="">
              <em>All Departments</em>
            </MenuItem>
            {departments.map(d => (
              <MenuItem key={d.id} value={String(d.id)}>
                {d.name}
              </MenuItem>
            ))}
          </TextField>

          {/* Employee */}
          <TextField
            select
            label="Employee"
            value={selectedEmployee}
            onChange={e => setSelectedEmployee(e.target.value)}
            sx={{ minWidth: { md: 220 } }}
            fullWidth={isSmDown}
            disabled={!filteredEmployees.length}
          >
            <MenuItem value="">
              <em>{selectedDepartment ? "All in Department" : "All Employees"}</em>
            </MenuItem>
            {filteredEmployees.map(r => (
              <MenuItem key={r.id} value={String(r.id)}>
                {r.full_name || `${r.first_name} ${r.last_name}`}
              </MenuItem>
            ))}
          </TextField>

          <Box sx={{ flexGrow: 1, display: { xs: "none", md: "block" } }} />

          <Button
            startIcon={<Add />}
            onClick={() => openDialog()}
            variant="contained"
            fullWidth={isSmDown}
          >
            Add Assignment
          </Button>
        </Stack>
      </Paper>

      {/* ───────────── Grid ───────────── */}
      <DataGrid
        rows={rows}
        columns={[
          { field: "recruiter_name", headerName: "Employee",       flex: 1 },
          { field: "service_name",   headerName: "Service",        flex: 1 },
          { field: "price",          headerName: "Price ($)",      width: 120,
            valueFormatter: p => `$${Number(p.value).toFixed(2)}` },
          { field: "duration",       headerName: "Duration (min)", width: 140 },
          { field: "cooling",        headerName: "Cooling (min)",  width: 140 }, // NEW
          {
            field: "actions",
            headerName: "Actions",
            width: 160,
            sortable: false,
            renderCell: ({ row }) => (
              <>
                <IconButton onClick={e => { e.stopPropagation(); openDialog(row); }}>
                  <Edit fontSize="small" />
                </IconButton>
                <IconButton color="error" onClick={e => { e.stopPropagation(); handleDelete(row.id); }}>
                  <Delete fontSize="small" />
                </IconButton>
              </>
            ),
          },
        ]}
        autoHeight
        loading={loading}
        disableSelectionOnClick
        initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
        pageSizeOptions={[10, 25, 50]}
      />

      {/* ───────────── Dialog ───────────── */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? "Edit Assignment" : "Add Assignment"}</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {!employees.length || !services.length ? (
            <CircularProgress />
          ) : (
            <>
              <Autocomplete
                options={filteredEmployees}
                getOptionLabel={o => o.full_name || `${o.first_name} ${o.last_name}`}
                value={form.recruiter}
                onChange={(_, v) => setForm({ ...form, recruiter: v })}
                renderInput={params => <TextField {...params} label="Employee" margin="dense" />}
                sx={{ mt: 1 }}
              />

              <Autocomplete
                options={services}
                getOptionLabel={o => o.name}
                value={form.service}
                onChange={(_, v) =>
                  setForm({
                    ...form,
                    service: v,
                    price_override:    v ? v.base_price    : "",
                    duration_override: v ? v.duration      : "",
                    cooling_override:  v ? v.cooling_time  : "",
                  })
                }
                renderInput={params => <TextField {...params} label="Service" margin="dense" />}
                sx={{ mt: 2 }}
              />

              <TextField
                label="Price Override ($)"
                type="number"
                fullWidth
                margin="dense"
                value={form.price_override}
                onChange={e => setForm({ ...form, price_override: e.target.value })}
              />

              <TextField
                label="Duration Override (min)"
                type="number"
                fullWidth
                margin="dense"
                value={form.duration_override}
                onChange={e => setForm({ ...form, duration_override: e.target.value })}
              />

              <TextField
                label="Cooling Time Override (min)"
                type="number"
                fullWidth
                margin="dense"
                value={form.cooling_override}
                onChange={e => setForm({ ...form, cooling_override: e.target.value })}
              />

              {/* one‑off slot */}
              <Typography variant="subtitle1" sx={{ mt: 3 }}>
                Add Service Slot&nbsp;(optional)
              </Typography>

              <TextField
                label="Slot Date"
                type="date"
                fullWidth
                margin="dense"
                InputLabelProps={{ shrink: true }}
                value={slotDate}
                onChange={e => setSlotDate(e.target.value)}
              />

              <TextField
                label="Slot Start Time"
                type="time"
                fullWidth
                margin="dense"
                InputLabelProps={{ shrink: true }}
                value={slotStartTime}
                onChange={e => setSlotStartTime(e.target.value)}
              />

              <Button
                sx={{ mt: 1 }}
                variant="outlined"
                onClick={handleAddServiceSlot}
                disabled={!form.recruiter || !form.service || !slotDate || !slotStartTime}
              >
                Add Service Slot
              </Button>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">
            {editing ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        message={snackbar.msg}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      />
    </Box>
  );
};

export default ServiceAssignment;
