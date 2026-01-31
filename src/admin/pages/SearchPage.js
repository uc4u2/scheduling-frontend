import React, { useState } from "react";
import { Box, Button, Stack, TextField, Typography, Paper } from "@mui/material";
import { useNavigate } from "react-router-dom";
import platformAdminApi from "../../api/platformAdminApi";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const navigate = useNavigate();

  const search = async () => {
    const { data } = await platformAdminApi.get(`/search?q=${encodeURIComponent(query)}`);
    setResults(data?.tenants || []);
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2 }}>Tenant Search</Typography>
      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        <TextField
          fullWidth
          label="Search by name, slug, or email"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Button variant="contained" onClick={search}>Search</Button>
      </Stack>
      {results.map((tenant) => (
        <Paper key={tenant.id} sx={{ p: 2, mb: 1 }}>
          <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
            <Box>
              <Typography variant="subtitle1">{tenant.name}</Typography>
              <Typography variant="body2">{tenant.slug} • {tenant.email}</Typography>
            </Box>
            <Button variant="outlined" onClick={() => navigate(`/admin/tenants/${tenant.id}`)}>
              Open
            </Button>
          </Stack>
        </Paper>
      ))}
    </Box>
  );
}
