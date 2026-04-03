// src/ForgotPassword.js
import React, { useState } from "react";
import { Container, Button, Alert, Typography, TextField } from "@mui/material";
import { useLocation, useParams } from "react-router-dom";
import { api } from "./utils/api";

const ForgotPassword = ({ slugOverride = "" }) => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const location = useLocation();
  const params = useParams();
  const search = new URLSearchParams(location.search || "");
  const querySite = (search.get("site") || "").trim();
  const storedSite =
    typeof localStorage !== "undefined" ? (localStorage.getItem("site") || "").trim() : "";
  const tenantSite =
    String(slugOverride || "").trim() ||
    String(params.slug || "").trim() ||
    querySite ||
    storedSite;

  const handleSubmit = async () => {
    if (!email) {
      setError("Email is required");
      return;
    }
    try {
      const response = await api.post(
        "/forgot-password",
        { email, company_slug: tenantSite || undefined },
        { noAuth: true, noCompanyHeader: true }
      );
      setMessage(response.data.message);
      setError("");
    } catch (err) {
      setError(err.response?.data?.error || "Request failed!");
    }
  };

  return (
    <Container sx={{ mt: 5, maxWidth: "sm" }}>
      <Typography component="h1" variant="h4" gutterBottom>
        Forgot Password
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}
      <TextField
        label="Email"
        fullWidth
        margin="normal"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <Button variant="contained" fullWidth onClick={handleSubmit} sx={{ mt: 2 }}>
        Send Reset Email
      </Button>
    </Container>
  );
};

export default ForgotPassword;
