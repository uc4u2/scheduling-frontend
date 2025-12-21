import React from "react";
import { Typography, Stack, Paper } from "@mui/material";
import { useNavigate } from "react-router-dom";
import RecruiterTabs from "../../components/recruiter/RecruiterTabs";
import SecondEmployeeShiftView from "../sections/SecondEmployeeShiftView";
import ManagementFrame from "../../components/ui/ManagementFrame";
import useRecruiterTabsAccess from "../../components/recruiter/useRecruiterTabsAccess";

const RecruiterMyShiftsPage = ({ token }) => {
  const navigate = useNavigate();
  const { allowHrAccess, isLoading } = useRecruiterTabsAccess();
  const handleLocalTabChange = (value) => {
    navigate(`/employee?tab=${value}`);
  };

  return (
    <ManagementFrame
      title="View My Shift"
      subtitle="Review scheduled shifts, clock-ins, and breaks."
      fullWidth
      sx={{ minHeight: "100vh", px: { xs: 1, md: 2 } }}
      contentSx={{ p: { xs: 1.5, md: 2.5 } }}
    >
      <RecruiterTabs
        localTab="view-my-shift"
        onLocalTabChange={handleLocalTabChange}
        allowHrAccess={allowHrAccess}
        isLoading={isLoading}
      />
      <Paper sx={{ p: { xs: 2, md: 3 }, mt: 2 }} elevation={0}>
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
    </ManagementFrame>
  );
};

export default RecruiterMyShiftsPage;
