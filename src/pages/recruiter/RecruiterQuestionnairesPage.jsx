import React from "react";
import { Navigate, useLocation } from "react-router-dom";

const RecruiterQuestionnairesPage = ({ token }) => {
  const location = useLocation();
  const isEmployeeWorkspace = location.pathname.startsWith("/employee");
  const target = isEmployeeWorkspace ? "/employee/invitations?section=forms" : "/recruiter/invitations?section=forms";
  return <Navigate to={target} replace />;
};

export default RecruiterQuestionnairesPage;
