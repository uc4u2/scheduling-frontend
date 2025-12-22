// src/pages/manager/ManagerJobOpeningsPage.jsx
import React from "react";
import { Navigate } from "react-router-dom";
import ManagementFrame from "../../components/ui/ManagementFrame";
import RecruiterTabs from "../../components/recruiter/RecruiterTabs";
import useRecruiterTabsAccess from "../../components/recruiter/useRecruiterTabsAccess";
import ManagerJobOpeningsPanel from "./ManagerJobOpeningsPanel";

export default function ManagerJobOpeningsPage({ token }) {
  const { allowHrAccess, isLoading } = useRecruiterTabsAccess();

  if (!isLoading && !allowHrAccess) {
    return <Navigate to="/employee?tab=calendar" replace />;
  }

  return (
    <ManagementFrame
      title="Job Postings"
      subtitle="Create, publish, and track job openings."
      fullWidth
      sx={{ minHeight: "100vh", px: { xs: 1, md: 2 } }}
      contentSx={{ p: { xs: 1.5, md: 2.5 } }}
    >
      <RecruiterTabs localTab="job-postings" allowHrAccess={allowHrAccess} isLoading={isLoading} />
      <ManagerJobOpeningsPanel token={token} />
    </ManagementFrame>
  );
}
