import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Box,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import platformAdminApi from "../../api/platformAdminApi";

export default function Tenant360Page() {
  const { companyId } = useParams();
  const [tenant, setTenant] = useState(null);
  const [users, setUsers] = useState([]);
  const [billing, setBilling] = useState(null);
  const [events, setEvents] = useState([]);
  const [notes, setNotes] = useState([]);
  const [noteDraft, setNoteDraft] = useState("");

  const load = async () => {
    const [tenantRes, usersRes, billingRes, eventsRes, notesRes] = await Promise.all([
      platformAdminApi.get(`/tenants/${companyId}`),
      platformAdminApi.get(`/tenants/${companyId}/users`),
      platformAdminApi.get(`/tenants/${companyId}/billing/subscription`),
      platformAdminApi.get(`/tenants/${companyId}/billing/events`),
      platformAdminApi.get(`/tenants/${companyId}/notes`),
    ]);
    setTenant(tenantRes.data || null);
    setUsers(usersRes.data?.users || []);
    setBilling(billingRes.data || null);
    setEvents(eventsRes.data?.events || []);
    setNotes(notesRes.data?.notes || []);
  };

  useEffect(() => {
    load();
  }, [companyId]);

  const disableUser = async (id) => {
    await platformAdminApi.post(`/tenants/${companyId}/users/${id}/disable`);
    load();
  };

  const republish = async () => {
    await platformAdminApi.post(`/tenants/${companyId}/website/republish`);
  };

  const clearCache = async () => {
    await platformAdminApi.post(`/tenants/${companyId}/website/clear-cache`);
  };

  const addNote = async () => {
    if (!noteDraft.trim()) return;
    await platformAdminApi.post(`/tenants/${companyId}/notes`, { note: noteDraft });
    setNoteDraft("");
    load();
  };

  if (!tenant) return null;

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2 }}>Tenant 360</Typography>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle1">{tenant.name}</Typography>
        <Typography variant="body2">{tenant.slug} • {tenant.email}</Typography>
        <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
          <Button variant="outlined" onClick={republish}>Republish website</Button>
          <Button variant="outlined" onClick={clearCache}>Clear cache</Button>
        </Stack>
      </Paper>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle1">Users</Typography>
        <List>
          {users.map((u) => (
            <ListItem key={u.id} secondaryAction={
              <Button size="small" variant="outlined" onClick={() => disableUser(u.id)}>Disable</Button>
            }>
              <ListItemText primary={`${u.full_name} (${u.role})`} secondary={`${u.email} • ${u.status}`} />
            </ListItem>
          ))}
        </List>
      </Paper>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle1">Billing</Typography>
        <pre style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify(billing, null, 2)}</pre>
      </Paper>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle1">Billing events</Typography>
        <List>
          {events.map((e) => (
            <ListItem key={e.id}>
              <ListItemText primary={e.type} secondary={e.processed_at} />
            </ListItem>
          ))}
        </List>
      </Paper>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle1">Notes</Typography>
        <Stack direction="row" spacing={2} sx={{ my: 2 }}>
          <TextField fullWidth value={noteDraft} onChange={(e) => setNoteDraft(e.target.value)} label="Add note" />
          <Button variant="contained" onClick={addNote}>Add</Button>
        </Stack>
        <Divider />
        <List>
          {notes.map((n) => (
            <ListItem key={n.id}>
              <ListItemText primary={n.note} secondary={n.created_at} />
            </ListItem>
          ))}
        </List>
      </Paper>
    </Box>
  );
}
