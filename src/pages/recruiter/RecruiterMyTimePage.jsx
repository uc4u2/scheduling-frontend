import React from "react";
import { Alert, Box, Button, Chip, Paper, Stack, Typography, useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useLocation, useNavigate } from "react-router-dom";
import RecruiterTabs from "../../components/recruiter/RecruiterTabs";
import SecondEmployeeShiftView from "../sections/SecondEmployeeShiftView";
import ManagementFrame from "../../components/ui/ManagementFrame";
import useRecruiterTabsAccess from "../../components/recruiter/useRecruiterTabsAccess";

const RecruiterMyTimePage = ({ token }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const role =
    typeof window !== "undefined"
      ? (localStorage.getItem("role") || "").toLowerCase()
      : "";
  const managerViewingEmployee =
    role === "manager" && location.pathname.startsWith("/employee");
  const { allowHrAccess, isLoading } = useRecruiterTabsAccess();
  const handleLocalTabChange = (value) => {
    const basePath = location.pathname.startsWith("/recruiter")
      ? "/recruiter/dashboard"
      : "/employee/dashboard";
    navigate(`${basePath}?tab=${value}`);
  };

  return (
    <ManagementFrame
      title="My Time"
      subtitle={isMobile ? null : "Review your time tracking and shift history."}
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
        {managerViewingEmployee && !isMobile && (
          <Alert
            severity="info"
            action={
              <Button
                color="inherit"
                size="small"
                onClick={() => navigate("/manager/dashboard")}
              >
                Back to Manager
              </Button>
            }
          >
            Viewing Employee Workspace (Manager Mode)
          </Alert>
        )}
        {managerViewingEmployee && isMobile && (
          <Paper
            elevation={0}
            sx={{
              p: 1.25,
              borderRadius: 1,
              border: (theme) => `1px solid ${theme.palette.primary.main}33`,
              background: (theme) =>
                `linear-gradient(135deg, ${theme.palette.primary.main}12 0%, ${theme.palette.background.paper} 100%)`,
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Chip
                  size="small"
                  label="Manager Mode"
                  color="primary"
                  sx={{ mb: 0.5, fontWeight: 700 }}
                />
                <Typography variant="body2" fontWeight={700} sx={{ lineHeight: 1.25 }}>
                  Viewing Employee Workspace
                </Typography>
              </Box>
              <Button
                variant="outlined"
                size="small"
                startIcon={<ArrowBackIcon />}
                onClick={() => navigate("/manager/dashboard")}
                sx={{ flexShrink: 0, minWidth: "fit-content", whiteSpace: "nowrap" }}
              >
                Back to Manager
              </Button>
            </Stack>
          </Paper>
        )}
        <SecondEmployeeShiftView employeePolish />
      </Stack>
    </ManagementFrame>
  );
};

export default RecruiterMyTimePage;
