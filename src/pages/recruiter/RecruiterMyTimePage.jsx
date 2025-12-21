import React from "react";
import { Stack, Paper } from "@mui/material";
import { useNavigate } from "react-router-dom";
import RecruiterTabs from "../../components/recruiter/RecruiterTabs";
import SecondEmployeeShiftView from "../sections/SecondEmployeeShiftView";
import ManagementFrame from "../../components/ui/ManagementFrame";
import useRecruiterTabsAccess from "../../components/recruiter/useRecruiterTabsAccess";

const RecruiterMyTimePage = ({ token }) => {
  const navigate = useNavigate();
  const { allowHrAccess, isLoading } = useRecruiterTabsAccess();
  const handleLocalTabChange = (value) => {
    navigate(`/employee?tab=${value}`);
  };

  return (
    <ManagementFrame
      title="My Time"
      subtitle="Review your time tracking and shift history."
      fullWidth
      sx={{ minHeight: "100vh", px: { xs: 1, md: 2 } }}
      contentSx={{ p: { xs: 1.5, md: 2.5 } }}
    >
      <RecruiterTabs
        localTab="my-time"
        onLocalTabChange={handleLocalTabChange}
        allowHrAccess={allowHrAccess}
        isLoading={isLoading}
      />
      <Paper sx={{ p: { xs: 2, md: 3 }, mt: 2 }} elevation={0}>
        <Stack spacing={2}>
          <SecondEmployeeShiftView />
        </Stack>
      </Paper>
    </ManagementFrame>
  );
};

export default RecruiterMyTimePage;
