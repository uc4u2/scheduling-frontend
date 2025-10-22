import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Alert, Box, Button, Card, CardContent, CardHeader, Divider,
  LinearProgress, Stack, TextField, Typography
} from "@mui/material";
import dayjs from "dayjs";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000";

export default function ClientInbox() {
  const token = useMemo(() => localStorage.getItem("token") || "", []);
  const auth  = useMemo(() => ({ headers: { Authorization: `Bearer ${token}` } }), [token]);

  const [messages, setMessages] = useState([]);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState("");

  const load = async () => {
    setErr(""); setLoading(true);
    try {
      const { data } = await axios.get(`${API}/api/client/messages`, auth);
      setMessages(data?.messages || []);
    } catch (e) {
      setErr(e?.response?.data?.error || "Failed to load messages");
    } finally {
      setLoading(false);
    }
  };

  const reply = async () => {
    if (!body.trim()) return;
    setSending(true);
    try {
      await axios.post(`${API}/api/client/messages/reply`, { body: body.trim() }, auth);
      setBody("");
      await load();
    } catch (e) {
      setErr(e?.response?.data?.error || "Failed to send reply");
    } finally {
      setSending(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable */ }, []);

  return (
    <Box p={2}>
      <Card variant="outlined">
        <CardHeader title="Messages" subheader="Chat with your service provider" />
        <CardContent>
          {loading && <LinearProgress sx={{ mb: 2 }} />}
          {err && <Alert severity="error" sx={{ mb: 2 }}>{err}</Alert>}

          <Stack spacing={1} sx={{ mb: 2 }}>
            {messages.map(m => (
              <Box key={m.id} sx={{ p: 1, border: "1px solid #eee", borderRadius: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  {dayjs(m.created_at).format("YYYY-MM-DD HH:mm")} • {m.sender}
                </Typography>
                <Typography variant="body2">{m.body}</Typography>
              </Box>
            ))}
            {(!messages || messages.length === 0) && (
              <Typography variant="body2" color="text.secondary">No messages yet.</Typography>
            )}
          </Stack>

          <Divider sx={{ my: 2 }} />

          <Stack spacing={1} direction="row">
            <TextField
              fullWidth
              label="Write a reply"
              value={body}
              onChange={(e)=>setBody(e.target.value)}
            />
            <Button variant="contained" disabled={sending || !body.trim()} onClick={reply}>
              {sending ? "Sending..." : "Send"}
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
