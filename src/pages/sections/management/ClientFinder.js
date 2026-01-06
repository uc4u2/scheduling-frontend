// src/pages/sections/management/ClientFinder.js
import React, { useEffect, useMemo, useState } from "react";
import {
  Autocomplete,
  Box,
  Card,
  CardContent,
  CardHeader,
  Chip,
  CircularProgress,
  Grid,
  MenuItem,
  Stack,
  TextField,
  Typography,
  Alert,
  LinearProgress,
  Button,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import api from "../../../utils/api";

const nameOfRecruiter = (r) =>
  r?.full_name ||
  r?.name ||
  [r?.first_name, r?.last_name].filter(Boolean).join(" ") ||
  (r?.id ? `Employee #${r.id}` : "—");

/**
 * Normalize a booking row into a consistent shape we can use for scoping:
 * - date: "YYYY-MM-DD"
 * - client: { id, full_name, email, phone }
 * - recruiter_id, department_id
 */
const normalizeBooking = (b) => {
  const date = b?.date || b?.start_date || null;

  const clientRaw = b?.client_info || b?.client || {};
  const client = {
    id: clientRaw?.id,
    full_name:
      clientRaw?.full_name ||
      [clientRaw?.first_name, clientRaw?.last_name].filter(Boolean).join(" ") ||
      clientRaw?.name ||
      "",
    email: clientRaw?.email || "",
    phone: clientRaw?.phone || "",
  };

  const recruiter_id =
    b?.recruiter_id ||
    b?.employee_id ||
    (b?.recruiter && b?.recruiter?.id) ||
    null;

  const department_id =
    b?.department_id ||
    (b?.department && b?.department?.id) ||
    (b?.recruiter && b?.recruiter?.department_id) ||
    null;

  const start_time = b?.start_time || b?.start || null;

  return { date, client, recruiter_id, department_id, start_time };
};

export default function ClientFinder({
  token: tokenProp,
  from,
  to,
  tz,
  onSelect, // (clientObj) => void
  dense = false,
  showHeader = true,
}) {
  const token = tokenProp || localStorage.getItem("token") || "";
  const auth = { headers: { Authorization: `Bearer ${token}` } };

  // Directory
  const [departments, setDepartments] = useState([]);
  const [recruiters, setRecruiters] = useState([]);

  // Filters
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedRecruiter, setSelectedRecruiter] = useState("");
  const [includeArchived, setIncludeArchived] = useState(false);

  // Data
  const [allClients, setAllClients] = useState([]); // from /booking/clients
  const [bookings, setBookings] = useState([]); // from /api/manager/bookings

  // UI state
  const [loadingDir, setLoadingDir] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState("");
  const [value, setValue] = useState(null); // selected client object
  const [search, setSearch] = useState(""); // text in autocomplete

  /* ───────── Load directory (departments + employees) ───────── */
  const loadDirectory = async () => {
    setLoadingDir(true);
    setError("");
    try {
      const recruiterParams = includeArchived ? { include_archived: 1 } : {};
      const [depRes, recRes] = await Promise.all([
        api.get(`/api/departments`, auth),
        api.get(`/manager/recruiters`, { ...auth, params: recruiterParams }),
      ]);
      setDepartments(depRes?.data || []);
      setRecruiters(recRes?.data?.recruiters || []);
    } catch (e) {
      setDepartments([]);
      setRecruiters([]);
      setError("Failed to load departments/employees.");
    } finally {
      setLoadingDir(false);
    }
  };

  /* ───────── Load clients + bookings (refreshes when date window changes) ───────── */
  const loadClientsAndBookings = async () => {
    setLoadingData(true);
    setError("");
    try {
      const [cliRes, bkgRes] = await Promise.all([
        api.get(`/booking/clients`, auth), // full client list
        api.get(`/api/manager/bookings`, auth), // we will scope/filter by date/emp/dep
      ]);
      setAllClients(Array.isArray(cliRes?.data) ? cliRes.data : []);
      setBookings(Array.isArray(bkgRes?.data) ? bkgRes.data : []);
    } catch (e) {
      setAllClients([]);
      setBookings([]);
      setError(e?.response?.data?.error || "Failed to load clients/bookings.");
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    loadDirectory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [includeArchived]);

  useEffect(() => {
    loadClientsAndBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to, tz]);

  /* ───────── Helpers ───────── */

  const deptMap = useMemo(() => {
    const m = new Map();
    departments.forEach((d) => m.set(String(d.id), d));
    return m;
  }, [departments]);

  const filteredRecruiters = useMemo(() => {
    return selectedDepartment
      ? recruiters.filter(
          (r) => String(r.department_id) === String(selectedDepartment)
        )
      : recruiters;
  }, [recruiters, selectedDepartment]);

  /**
   * Merge allClients with bookings (in-window) to build a rich client directory that:
   * - always includes existing clients
   * - adds department_ids / recruiter_ids sets based on bookings in the window
   * - carries last_booking_at for sorting
   */
  const clientDirectory = useMemo(() => {
    const byId = new Map();

    // Seed from full clients list so the directory is never empty
    for (const c of allClients) {
      const id = c?.id;
      if (!id) continue;
      const full_name =
        c?.full_name ||
        [c?.first_name, c?.last_name].filter(Boolean).join(" ") ||
        c?.name ||
        "";
      byId.set(String(id), {
        id,
        full_name,
        email: c?.email || "",
        phone: c?.phone || "",
        recruiter_ids: new Set(),
        department_ids: new Set(),
        last_booking_at: null,
      });
    }

    // Enhance with bookings that fall within the date window
    for (const raw of bookings) {
      const b = normalizeBooking(raw);
      if (!b?.client?.id) continue;

      // Window filter on YYYY-MM-DD strings
      if (from && b.date && b.date < from) continue;
      if (to && b.date && b.date > to) continue;

      const idStr = String(b.client.id);
      const current =
        byId.get(idStr) ||
        {
          id: b.client.id,
          full_name: b.client.full_name,
          email: b.client.email,
          phone: b.client.phone,
          recruiter_ids: new Set(),
          department_ids: new Set(),
          last_booking_at: null,
        };

      if (b.recruiter_id) current.recruiter_ids.add(String(b.recruiter_id));
      if (b.department_id) current.department_ids.add(String(b.department_id));

      // last booking
      const dt = `${b.date || ""}T${(b.start_time || "00:00")}:00`;
      if (!current.last_booking_at || new Date(dt) > new Date(current.last_booking_at)) {
        current.last_booking_at = dt;
      }
      byId.set(idStr, current);
    }

    // flatten sets
    return Array.from(byId.values()).map((row) => ({
      ...row,
      recruiter_ids: Array.from(row.recruiter_ids),
      department_ids: Array.from(row.department_ids),
    }));
  }, [allClients, bookings, from, to]);

  // Apply Department → Employee filters and text search
  const scopedClients = useMemo(() => {
    let list = clientDirectory;

    if (selectedDepartment) {
      const depId = String(selectedDepartment);
      list = list.filter((c) => c.department_ids.includes(depId));
    }

    if (selectedRecruiter) {
      const rId = String(selectedRecruiter);
      list = list.filter((c) => c.recruiter_ids.includes(rId));
    }

    const q = (search || "").trim().toLowerCase();
    if (q) {
      list = list.filter((c) => {
        const name = (c.full_name || "").toLowerCase();
        return (
          name.includes(q) ||
          (c.email || "").toLowerCase().includes(q) ||
          (c.phone || "").toLowerCase().includes(q)
        );
      });
    }

    // Sort: latest booking first, then name
    list.sort((a, b) => {
      const ta = a.last_booking_at ? new Date(a.last_booking_at).getTime() : 0;
      const tb = b.last_booking_at ? new Date(b.last_booking_at).getTime() : 0;
      if (tb !== ta) return tb - ta;
      return (a.full_name || "").localeCompare(b.full_name || "");
    });

    // keep the list manageable
    return list.slice(0, 100);
  }, [clientDirectory, selectedDepartment, selectedRecruiter, search]);

  const selectedDeptLabel = selectedDepartment
    ? deptMap.get(String(selectedDepartment))?.name || `Dept #${selectedDepartment}`
    : "All Departments";

  /* ───────── RENDER ───────── */

  return (
    <Card variant="outlined" sx={{ mb: 2 }}>
      {showHeader && (
        <CardHeader
          title="Find a Client"
          subheader="Scope by Department/Employee, then search by name/email/phone."
        />
      )}
      <CardContent>
        <Grid container spacing={2} alignItems="center">
          {/* Department */}
          <Grid item xs={12} md={3}>
            <TextField
              select
              fullWidth
              size={dense ? "small" : "medium"}
              label="Department"
              value={selectedDepartment}
              onChange={(e) => {
                setSelectedDepartment(e.target.value);
                setSelectedRecruiter("");
              }}
            >
              <MenuItem value="">
                <em>All Departments</em>
              </MenuItem>
              {departments.map((d) => (
                <MenuItem key={d.id} value={String(d.id)}>
                  {d.name || `Dept #${d.id}`}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* Employee */}
          <Grid item xs={12} md={3}>
            <TextField
              select
              fullWidth
              size={dense ? "small" : "medium"}
              label="Employee"
              value={selectedRecruiter}
              onChange={(e) => setSelectedRecruiter(e.target.value)}
              helperText={
                selectedDepartment ? `In ${selectedDeptLabel}` : "Optional"
              }
            >
              <MenuItem value="">
                <em>All Employees</em>
              </MenuItem>
              {filteredRecruiters.map((r) => (
                <MenuItem key={r.id} value={String(r.id)}>
                  {nameOfRecruiter(r)}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md="auto">
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

          {/* Search + results */}
          <Grid item xs={12} md={6}>
            <Autocomplete
              fullWidth
              size={dense ? "small" : "medium"}
              loading={loadingDir || loadingData}
              value={value}
              onChange={(_, v) => {
                setValue(v);
                if (v && onSelect) onSelect(v);
              }}
              inputValue={search}
              onInputChange={(_, v) => setSearch(v)}
              options={scopedClients}
              getOptionLabel={(o) => o?.full_name || ""}
              noOptionsText={
                loadingDir || loadingData ? "Loading…" : "No matching clients"
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Search client (name, email, phone)"
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {loadingDir || loadingData ? (
                          <CircularProgress size={18} />
                        ) : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
              renderOption={(props, option) => (
                <li {...props} key={option.id}>
                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    sx={{ width: "100%", justifyContent: "space-between" }}
                  >
                    <Stack>
                      <Typography variant="body2" sx={{ lineHeight: 1.2 }}>
                        {option.full_name || `Client #${option.id}`}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {option.email || option.phone || "—"}
                      </Typography>
                    </Stack>
                    <Stack direction="row" spacing={0.5}>
                      {option.department_ids?.slice(0, 2).map((d) => (
                        <Chip
                          key={d}
                          size="small"
                          variant="outlined"
                          label={deptMap.get(String(d))?.name || `Dept #${d}`}
                        />
                      ))}
                      {option.department_ids &&
                        option.department_ids.length > 2 && (
                          <Chip
                            size="small"
                            variant="outlined"
                            label={`+${option.department_ids.length - 2}`}
                          />
                        )}
                    </Stack>
                  </Stack>
                </li>
              )}
            />
          </Grid>
        </Grid>

        {(loadingDir || loadingData) && <LinearProgress sx={{ mt: 2 }} />}
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ mt: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Scoped to {from} → {to} ({tz}). Change the range at the top of
            Enterprise Analytics.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
          <Button variant="outlined" size="small" onClick={loadClientsAndBookings}>
            Refresh
          </Button>
          <Button
            size="small"
            onClick={() => {
              setSelectedDepartment("");
              setSelectedRecruiter("");
              setSearch("");
              setValue(null);
            }}
          >
            Clear
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}
