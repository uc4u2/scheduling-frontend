import React, { useEffect } from "react";
import { Box, Button, Paper, Stack, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";

const BillingCancelPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const token =
      typeof window !== "undefined" ? window.localStorage.getItem("token") : null;
    if (!token) {
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  return (
    <Box sx={{ minHeight: "70vh", display: "flex", alignItems: "center", justifyContent: "center", px: 2 }}>
      <Paper sx={{ maxWidth: 520, width: "100%", p: { xs: 3, md: 4 }, borderRadius: 3 }}>
        <Stack spacing={2} textAlign="center">
          <Typography variant="h5" fontWeight={700}>
            Checkout canceled
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Your checkout was canceled. You can try again or return to your dashboard.
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
            <Button variant="outlined" fullWidth onClick={() => navigate("/pricing")}>
              Back to Pricing
            </Button>
            <Button variant="contained" fullWidth onClick={() => navigate("/manager/dashboard")}>
              Go to Dashboard
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Box>
  );
};

export default BillingCancelPage;
