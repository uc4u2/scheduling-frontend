// src/pages/sections/management/ServiceSlotCreator.js
import React, { useEffect, useState, useMemo } from "react";
import {
  Box,
  Typography,
  TextField,
  MenuItem,
  Button,
  Alert,
  CircularProgress,
  Grid,
  Snackbar,
  useMediaQuery,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import api from "../../../utils/api";

const ServiceSlotCreator = ({ token }) => {
  const theme = useTheme();
  const isSmDown = useMediaQuery(theme.breakpoints.down("sm"));
  // ✅ State
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [services, setServices] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [selectedService, setSelectedService] = useState("");
  const [includeArchived, setIncludeArchived] = useState(false);
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, msg: "", severity: "success" });

  const auth = { headers: { Authorization: `Bearer ${token}` } };

  // ✅ Fetch required data
  useEffect(() => {
    if (!token) return;

    const fetchData = async () => {
      try {
        const recruiterParams = includeArchived ? { include_archived: 1 } : { active: true };
        const [depRes, empRes, svcRes] = await Promise.all([
          api.get(`/api/departments`, auth),
          api.get(`/manager/recruiters`, { ...auth, params: recruiterParams }),
          api.get(`/booking/services`, auth),
        ]);

        setDepartments(depRes.data || []);
        setEmployees(empRes.data.recruiters || empRes.data || []);
        setServices(svcRes.data || []);
      } catch (err) {
        setSnackbar({ open: true, msg: "Failed to load data.", severity: "error" });
      }
    };

    fetchData();
  }, [token, includeArchived]);

  // ✅ Filter employees by department
  const filteredEmployees = useMemo(() => {
    if (!selectedDepartment) return employees;
    return employees.filter((e) => String(e.department_id) === String(selectedDepartment));
  }, [employees, selectedDepartment]);

  // ✅ Handle slot creation
  const handleCreateSlot = async () => {
    if (!selectedEmployee || !selectedService || !date || !startTime) {
      setSnackbar({ open: true, msg: "Please fill all required fields.", severity: "error" });
      return;
    }

    setLoading(true);
    try {
      const service = services.find((s) => s.id === Number(selectedService));
      const payload = {
        service_id: Number(selectedService),
        date,
        start_time: startTime,
      };

      await api.post(`/api/manager/employees/${selectedEmployee}/add-service-slot`, payload, auth);

      setSnackbar({
        open: true,
        msg: `Slot created for ${service?.name || "service"} successfully.`,
        severity: "success",
      });

      // reset fields
      setDate("");
      setStartTime("");
      setSelectedService("");
    } catch (err) {
      setSnackbar({ open: true, msg: err.response?.data?.error || "Failed to create slot.", severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Service-Based Slot Creation
      </Typography>

      <Grid container spacing={2} sx={{ mt: 1 }}>
        {/* Department Selector */}
        <Grid item xs={12} sm={6}>
          <TextField
            select
            label="Department"
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            fullWidth
          >
            <MenuItem value="">
              <em>All Departments</em>
            </MenuItem>
            {departments.map((d) => (
              <MenuItem key={d.id} value={String(d.id)}>
                {d.name}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        {/* Employee Selector */}
        <Grid item xs={12} sm={6}>
          <TextField
            select
            label="Employee"
            value={selectedEmployee}
            onChange={(e) => setSelectedEmployee(e.target.value)}
            fullWidth
          >
            <MenuItem value="">
              <em>Select Employee</em>
            </MenuItem>
            {filteredEmployees.map((emp) => (
              <MenuItem key={emp.id} value={emp.id}>
                {emp.full_name || `${emp.first_name} ${emp.last_name}`}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Checkbox
                checked={includeArchived}
                onChange={(e) => setIncludeArchived(e.target.checked)}
              />
            }
            label="Show archived employees"
          />
        </Grid>

        {/* Service Selector */}
        <Grid item xs={12} sm={6}>
          <TextField
            select
            label="Service"
            value={selectedService}
            onChange={(e) => setSelectedService(e.target.value)}
            fullWidth
          >
            <MenuItem value="">
              <em>Select Service</em>
            </MenuItem>
            {services.map((svc) => (
              <MenuItem key={svc.id} value={svc.id}>
                {svc.name} ({svc.duration} min)
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        {/* Date */}
        <Grid item xs={12} sm={3}>
          <TextField
            label="Date"
            type="date"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </Grid>

        {/* Start Time */}
        <Grid item xs={12} sm={3}>
          <TextField
            label="Start Time"
            type="time"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
          />
        </Grid>
      </Grid>

      {/* Submit Button */}
      <Button
        variant="contained"
        sx={{ mt: 3 }}
        disabled={loading}
        onClick={handleCreateSlot}
        fullWidth={isSmDown}
      >
        {loading ? <CircularProgress size={24} /> : "Create Slot"}
      </Button>

      {/* Snackbar Notification */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        message={snackbar.msg}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      />

      {snackbar.severity === "error" && (
        <Alert severity="error" sx={{ mt: 2 }}>{snackbar.msg}</Alert>
      )}
    </Box>
  );
};

export default ServiceSlotCreator;
