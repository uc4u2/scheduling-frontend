import React, { useEffect, useState } from "react";
import { Alert, Card, CardContent, Chip, CircularProgress, Stack, Typography } from "@mui/material";
import api from "../../utils/api";

export default function ManagerEmployeesListPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    api
      .get("/api/manager/employees")
      .then((res) => {
        if (!alive) return;
        const data = Array.isArray(res?.data) ? res.data : res?.data?.employees || [];
        setRows(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        if (!alive) return;
        setError(err?.response?.data?.error || "Failed to load employees.");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <Stack spacing={1.25}>
      <Typography variant="h5" fontWeight={800}>Employees</Typography>
      <Typography variant="body2" color="text.secondary">
        Mobile card list for quick employee lookup.
      </Typography>
      {loading ? <CircularProgress size={24} /> : null}
      {error ? <Alert severity="error">{error}</Alert> : null}
      {!loading && !error && rows.length === 0 ? <Alert severity="info">No employees found.</Alert> : null}
      {rows.map((row) => (
        <Card key={row.id || `${row.email}-${row.first_name || ""}`} variant="outlined">
          <CardContent>
            <Stack spacing={0.75}>
              <Typography variant="subtitle1" fontWeight={700}>
                {`${row.first_name || ""} ${row.last_name || ""}`.trim() || row.email || "Employee"}
              </Typography>
              {row.email ? <Typography variant="body2" color="text.secondary">{row.email}</Typography> : null}
              <Stack direction="row" spacing={1}>
                {row.role ? <Chip size="small" label={String(row.role)} /> : null}
                {row.status ? <Chip size="small" variant="outlined" label={String(row.status)} /> : null}
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      ))}
    </Stack>
  );
}
