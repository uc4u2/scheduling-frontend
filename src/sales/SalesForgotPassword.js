import React, { useState } from "react";
import { Box, Button, Paper, Stack, TextField, Typography } from "@mui/material";
import salesRepApi from "../api/salesRepApi";

export default function SalesForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    await salesRepApi.post("/auth/forgot", { email });
    setSent(true);
  };

  return (
    <Box sx={{ maxWidth: 420, mx: "auto", mt: 8 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" sx={{ mb: 2 }}>Reset password</Typography>
        <Stack spacing={2}>
          <TextField label="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Button variant="contained" onClick={handleSend}>Send reset link</Button>
          {sent && (
            <Typography variant="body2">
              If that email exists, a reset link has been sent.
            </Typography>
          )}
        </Stack>
      </Paper>
    </Box>
  );
}
