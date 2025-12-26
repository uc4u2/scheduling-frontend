import React, { useState, useEffect } from "react";
import {
  Box, Typography, Paper, TextField, Button, Snackbar
} from "@mui/material";
import api from "../../../utils/api";
import { getUserTimezone } from "../../../utils/timezone";
const WorkspaceSettings = () => {
  const [settings, setSettings] = useState({
    workspaceName: "",
    timezone: getUserTimezone(""),
    defaultView: "month"
  });
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, msg: "" });

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        // Replace with your settings API endpoint
        const res = await api.get("/api/settings/workspace");
        setSettings(res.data);
      } catch {
        // fallback
      }
      setLoading(false);
    };
    fetchSettings();
  }, []);

  const handleChange = e => {
    setSettings({ ...settings, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    try {
      await api.put("/api/settings/workspace", settings);
      setSnackbar({ open: true, msg: "Settings updated!" });
    } catch {
      setSnackbar({ open: true, msg: "Update failed." });
    }
  };

  return (
    <Box p={3}>
      <Typography variant="h4" mb={2}>Workspace Settings</Typography>
      <Paper sx={{ p: 3, maxWidth: 500 }}>
        <TextField
          label="Workspace Name"
          name="workspaceName"
          value={settings.workspaceName}
          onChange={handleChange}
          fullWidth
          margin="normal"
        />
        <TextField
          label="Timezone"
          name="timezone"
          value={settings.timezone}
          onChange={handleChange}
          fullWidth
          margin="normal"
          placeholder="e.g. America/New_York"
        />
        <TextField
          label="Default View"
          name="defaultView"
          value={settings.defaultView}
          onChange={handleChange}
          fullWidth
          margin="normal"
        />
        <Button onClick={handleSave} variant="contained" sx={{ mt: 2 }} disabled={loading}>
          Save Changes
        </Button>
      </Paper>
      <Snackbar open={snackbar.open} autoHideDuration={3000} message={snackbar.msg}
        onClose={() => setSnackbar({ ...snackbar, open: false })} />
    </Box>
  );
};

export default WorkspaceSettings;
