import React from "react";
import { Stack } from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import RecruiterTabs from "../../components/recruiter/RecruiterTabs";
import SecondEmployeeShiftView from "../sections/SecondEmployeeShiftView";
import ManagementFrame from "../../components/ui/ManagementFrame";
import useRecruiterTabsAccess from "../../components/recruiter/useRecruiterTabsAccess";

const RecruiterMyTimePage = ({ token }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { allowHrAccess, isLoading } = useRecruiterTabsAccess();
  const handleLocalTabChange = (value) => {
    const basePath = location.pathname.startsWith("/recruiter")
      ? "/recruiter"
      : "/employee";
    navigate(`${basePath}?tab=${value}`);
  };

  return (
    <ManagementFrame
      title="My Time"
      subtitle="Review your time tracking and shift history."
      fullWidth
      sx={{ minHeight: "100vh", px: { xs: 1, md: 2 } }}
      disableContentCard
      contentSx={{
        p: 0,
      }}
    >
      <RecruiterTabs
        localTab="my-time"
        onLocalTabChange={handleLocalTabChange}
        allowHrAccess={allowHrAccess}
        isLoading={isLoading}
      />
      <Stack spacing={2} sx={{ mt: 2 }}>
        <SecondEmployeeShiftView />
      </Stack>
    </ManagementFrame>
  );
};

export default RecruiterMyTimePage;
