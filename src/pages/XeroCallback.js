import React, { useEffect } from "react";
import { Box, Button, CircularProgress, Stack, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";

const XeroCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/manager/settings", { replace: true });
    }, 4000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", p: 3 }}>
      <Stack spacing={3} maxWidth={420} textAlign="center">
        <CircularProgress />
        <Typography variant="h5">Finishing Xero connection…</Typography>
        <Typography color="text.secondary">
          You can close this tab. We’ll redirect you back to the manager dashboard automatically.
        </Typography>
        <Button variant="contained" onClick={() => navigate("/manager/settings", { replace: true })}>
          Go to Settings
        </Button>
      </Stack>
    </Box>
  );
};

export default XeroCallback;
