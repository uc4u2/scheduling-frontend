import React from "react";
import { Box, Typography, Stack, Paper } from "@mui/material";
import { useNavigate } from "react-router-dom";
import RecruiterTabs from "../../components/recruiter/RecruiterTabs";
import SecondEmployeeShiftView from "../sections/SecondEmployeeShiftView";

const RecruiterMyShiftsPage = () => {
  const navigate = useNavigate();
  const handleLocalTabChange = (value) => {
    navigate(`/recruiter?tab=${value}`);
  };

  return (
    <Box sx={{ p: { xs: 1.5, md: 3 } }}>
      <RecruiterTabs localTab="view-my-shift" onLocalTabChange={handleLocalTabChange} />
      <Paper sx={{ p: { xs: 2, md: 3 }, mt: 2 }}>
        <Stack spacing={2}>
          <Typography variant="h5" fontWeight={700}>
            View My Shift
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Review your scheduled shifts, clock, and logged breaks. This mirrors the dashboard panel but
            gives you a dedicated workspace when you don't need the other widgets.
          </Typography>
          <SecondEmployeeShiftView />
        </Stack>
      </Paper>
    </Box>
  );
};

export default RecruiterMyShiftsPage;
