import React from "react";
import { Box, Typography, Stack, Paper } from "@mui/material";
import { useNavigate } from "react-router-dom";
import RecruiterTabs from "../../components/recruiter/RecruiterTabs";
import SecondEmployeeShiftView from "../sections/SecondEmployeeShiftView";

const RecruiterMyTimePage = () => {
  const navigate = useNavigate();
  const handleLocalTabChange = (value) => {
    navigate(`/recruiter?tab=${value}`);
  };

  return (
    <Box sx={{ p: { xs: 1.5, md: 3 } }}>
      <RecruiterTabs localTab="my-time" onLocalTabChange={handleLocalTabChange} />
      <Paper sx={{ p: { xs: 2, md: 3 }, mt: 2 }}>
        <Stack spacing={2}>
          <SecondEmployeeShiftView />
        </Stack>
      </Paper>
    </Box>
  );
};

export default RecruiterMyTimePage;
