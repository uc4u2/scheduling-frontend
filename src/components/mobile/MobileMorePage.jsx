import React from "react";
import { Card, CardContent, Typography, Stack, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";

const MobileMorePage = () => {
  const navigate = useNavigate();
  const role =
    typeof window !== "undefined" ? (localStorage.getItem("role") || "").toLowerCase() : "";
  const isEmployee = role === "employee" || role === "recruiter";

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h6" gutterBottom>
          More
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Open the drawer for full modules, or use quick actions below.
        </Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 1.5 }}>
          <Button size="small" variant="outlined" onClick={() => navigate("/app/about")}>
            About
          </Button>
          <Button
            size="small"
            variant="outlined"
            onClick={() => navigate(isEmployee ? "/employee/my-time" : "/manager/dashboard")}
          >
            Dashboard
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default MobileMorePage;
