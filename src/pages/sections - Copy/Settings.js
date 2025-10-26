import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Stack,
  Divider,
  Snackbar,
  Alert,
} from "@mui/material";
import axios from "axios";

const Settings = () => {
  const [profession, setProfession] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");
  const [language, setLanguage] = useState("en");
  const [theme, setTheme] = useState("light");
  const [message, setMessage] = useState(null);
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/settings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const { profession, workspace_name, theme, language } = res.data;
      setProfession(profession || "");
      setWorkspaceName(workspace_name || "");
      setTheme(theme || "light");
      setLanguage(language || "en");
    } catch (err) {
      console.error("Failed to load settings:", err);
    }
  };

  const saveSettings = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${API_URL}/settings`,
        {
          profession,
          workspace_name: workspaceName,
          language,
          theme,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setMessage("Settings saved successfully");
    } catch (err) {
      console.error("Failed to save settings:", err);
      setMessage("Failed to save settings");
    }
  };

  return (
    <Box sx={{ p: 4, maxWidth: 800, mx: "auto" }}>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Workspace Settings
      </Typography>
      <Divider sx={{ mb: 3 }} />

      <Stack spacing={3}>
        <FormControl fullWidth>
          <InputLabel>Profession</InputLabel>
          <Select
            value={profession}
            label="Profession"
            onChange={(e) => setProfession(e.target.value)}
          >
            <MenuItem value="hr">HR / Recruitment</MenuItem>
            <MenuItem value="salon">Salon / Spa</MenuItem>
            <MenuItem value="clinic">Clinic / Healthcare</MenuItem>
            <MenuItem value="education">Education / Tutoring</MenuItem>
            <MenuItem value="other">Other</MenuItem>
          </Select>
        </FormControl>

        <TextField
          label="Workspace Name"
          fullWidth
          value={workspaceName}
          onChange={(e) => setWorkspaceName(e.target.value)}
        />

        <FormControl fullWidth>
          <InputLabel>Language</InputLabel>
          <Select
            value={language}
            label="Language"
            onChange={(e) => setLanguage(e.target.value)}
          >
            <MenuItem value="en">English</MenuItem>
            <MenuItem value="fr">French</MenuItem>
            <MenuItem value="es">Spanish</MenuItem>
            <MenuItem value="de">German</MenuItem>
            <MenuItem value="ar">Arabic</MenuItem>
          </Select>
        </FormControl>

        <FormControl fullWidth>
          <InputLabel>Theme</InputLabel>
          <Select
            value={theme}
            label="Theme"
            onChange={(e) => setTheme(e.target.value)}
          >
            <MenuItem value="light">Light</MenuItem>
            <MenuItem value="dark">Dark</MenuItem>
            <MenuItem value="blue">Blue</MenuItem>
            <MenuItem value="pastel">Pastel</MenuItem>
          </Select>
        </FormControl>

        <Button variant="contained" onClick={saveSettings}>
          Save Settings
        </Button>
      </Stack>

      <Snackbar
        open={!!message}
        autoHideDuration={3000}
        onClose={() => setMessage(null)}
      >
        <Alert
          onClose={() => setMessage(null)}
          severity="info"
          sx={{ width: "100%" }}
        >
          {message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Settings;
