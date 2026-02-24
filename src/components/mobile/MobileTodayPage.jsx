import React from "react";
import { Card, CardContent, Typography, Stack, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";

const MobileTodayPage = () => {
  const navigate = useNavigate();
  const role =
    typeof window !== "undefined" ? (localStorage.getItem("role") || "").toLowerCase() : "";
  const isEmployee = role === "employee" || role === "recruiter";

  return (
    <Stack spacing={1.5}>
      <Card variant="outlined">
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Today
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Quick access for operational tasks.
          </Typography>
        </CardContent>
      </Card>

      <Stack direction="row" spacing={1} flexWrap="wrap">
        <Button variant="contained" onClick={() => navigate("/app/calendar")}>
          Calendar
        </Button>
        <Button variant="outlined" onClick={() => navigate("/app/shifts")}>
          Shifts
        </Button>
        <Button variant="outlined" onClick={() => navigate("/app/bookings")}>
          Bookings
        </Button>
      </Stack>

      <Card variant="outlined">
        <CardContent>
          <Typography variant="subtitle1" gutterBottom>
            Desktop modules
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Button
              size="small"
              onClick={() => navigate(isEmployee ? "/employee/my-time" : "/manager/dashboard")}
            >
              Dashboard
            </Button>
            <Button size="small" onClick={() => navigate("/manager/payroll")}>
              Payroll
            </Button>
            <Button size="small" onClick={() => navigate("/manager/service-management")}>
              Services
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
};

export default MobileTodayPage;

