import React, { useEffect, useState } from "react";
import { Box, Button, Paper, Stack, TextField, Typography } from "@mui/material";
import platformAdminApi from "../../api/platformAdminApi";

export default function SalesRepsPage() {
  const [reps, setReps] = useState([]);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const load = async () => {
    const { data } = await platformAdminApi.get("/sales/reps");
    setReps(data?.reps || []);
  };

  useEffect(() => {
    load();
  }, []);

  const create = async () => {
    await platformAdminApi.post("/sales/reps", { full_name: fullName, email, phone });
    setFullName("");
    setEmail("");
    setPhone("");
    load();
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2 }}>Sales Reps</Typography>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction="row" spacing={2}>
          <TextField label="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          <TextField label="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <TextField label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <Button variant="contained" onClick={create}>Create</Button>
        </Stack>
      </Paper>
      {reps.map((r) => (
        <Paper key={r.id} sx={{ p: 2, mb: 1 }}>
          <Typography variant="subtitle1">{r.full_name}</Typography>
          <Typography variant="body2">{r.email} • {r.phone || "—"}</Typography>
        </Paper>
      ))}
    </Box>
  );
}
