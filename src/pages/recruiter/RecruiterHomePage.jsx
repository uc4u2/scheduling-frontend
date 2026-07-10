import React, { useEffect, useMemo, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { Alert, Button, CircularProgress, Paper, Stack, Typography, useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import RecruiterTabs from "../../components/recruiter/RecruiterTabs";
import ManagementFrame from "../../components/ui/ManagementFrame";
import useRecruiterTabsAccess from "../../components/recruiter/useRecruiterTabsAccess";
import MobileEmployeeHome, { employeeShortcutIconMap } from "../../components/employee/MobileEmployeeHome";
import EmployeeWorkOrderDetailDialog from "../finance/employee/EmployeeWorkOrderDetailDialog";
import api from "../../utils/api";
import { payrollSetupApi } from "../../utils/api";
import { listMyWorkOrders, updateMyWorkOrderDispatchStatus } from "../finance/financeApi";

const getStoredDisplayName = () => {
  if (typeof window === "undefined") return "";
  const preferred = [
    localStorage.getItem("full_name"),
    localStorage.getItem("name"),
    localStorage.getItem("first_name"),
    localStorage.getItem("email")?.split("@")[0],
  ].find((value) => String(value || "").trim());
  return String(preferred || "").trim();
};

const normalizeApiUrl = (url) => {
  const value = String(url || "").trim();
  if (!value) return "";
  if (/^https?:\/\//i.test(value) || value.startsWith("data:")) return value;
  const apiBase = String(process.env.REACT_APP_API_URL || "").trim().replace(/\/$/, "");
  if (!apiBase) return value;
  return `${apiBase}${value.startsWith("/") ? value : `/${value}`}`;
};

const RecruiterHomePage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const navigate = useNavigate();
  const location = useLocation();
  const { allowHrAccess, isLoading } = useRecruiterTabsAccess();
  const role =
    typeof window !== "undefined"
      ? (localStorage.getItem("role") || "").toLowerCase()
      : "";
  const managerViewingEmployee =
    role === "manager" && location.pathname.startsWith("/employee");
  const basePath = location.pathname.startsWith("/recruiter") ? "/recruiter" : "/employee";
  const [displayName, setDisplayName] = useState(getStoredDisplayName());
  const [profileImageUrl, setProfileImageUrl] = useState("");
  const [payrollOnboarding, setPayrollOnboarding] = useState(null);
  const [payrollOnboardingLoading, setPayrollOnboardingLoading] = useState(false);
  const [payrollOnboardingError, setPayrollOnboardingError] = useState("");
  const [payrollOnboardingActionLoading, setPayrollOnboardingActionLoading] = useState(false);
  const [todayJobs, setTodayJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [selectedWorkOrderId, setSelectedWorkOrderId] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailSection, setDetailSection] = useState("");

  useEffect(() => {
    let mounted = true;
    const loadIdentity = async () => {
      try {
        const [meRes, profileRes, recruiterRes] = await Promise.allSettled([
          api.get("/auth/me", { noCompanyHeader: true }),
          api.get("/profile"),
          api.get("/recruiter/profile"),
        ]);
        if (!mounted) return;

        const me = meRes.status === "fulfilled" ? meRes.value?.data || {} : {};
        const profile = profileRes.status === "fulfilled" ? profileRes.value?.data || {} : {};
        const recruiterLite =
          recruiterRes.status === "fulfilled"
            ? recruiterRes.value?.data?.recruiter || recruiterRes.value?.data || {}
            : {};
        let recruiterFull = {};

        if (me?.id) {
          try {
            const recruiterFullRes = await api.get(`/api/recruiters/${me.id}`);
            recruiterFull = recruiterFullRes?.data || {};
          } catch {
            recruiterFull = {};
          }
        }

        const resolvedName =
          [recruiterFull.first_name, recruiterFull.last_name].filter(Boolean).join(" ").trim() ||
          recruiterFull.full_name ||
          recruiterFull.name ||
          [recruiterLite.first_name, recruiterLite.last_name].filter(Boolean).join(" ").trim() ||
          recruiterLite.full_name ||
          recruiterLite.name ||
          [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim() ||
          profile.full_name ||
          profile.name ||
          [me.first_name, me.last_name].filter(Boolean).join(" ").trim() ||
          me.full_name ||
          me.name ||
          getStoredDisplayName() ||
          "Employee";

        const resolvedImage = normalizeApiUrl(
          recruiterFull.profile_image_url ||
          recruiterLite.profile_image_url ||
          profile.profile_image_url ||
          me.profile_image_url ||
          recruiterFull.avatar ||
          recruiterLite.avatar ||
          profile.avatar ||
          me.avatar ||
          ""
        );

        setDisplayName(resolvedName);
        setProfileImageUrl(resolvedImage);
      } catch {
        if (!mounted) return;
        setDisplayName(getStoredDisplayName() || "Employee");
        setProfileImageUrl("");
      }
    };
    loadIdentity();
    return () => {
      mounted = false;
    };
  }, []);

  const assignmentPreview = (assignments = [], timezone = "") => {
    if (!assignments.length) return "No assignment details";
    const first = assignments[0];
    return `${first.work_date || "No date"}${first.start_time ? ` • ${first.start_time}` : ""}${first.end_time ? ` to ${first.end_time}` : ""}${first.timezone || timezone ? ` • ${first.timezone || timezone}` : ""}`;
  };

  useEffect(() => {
    let mounted = true;
    const loadJobs = async () => {
      setJobsLoading(true);
      try {
        const res = await listMyWorkOrders({ page: 1, per_page: 10 });
        if (!mounted) return;
        const today = new Date().toISOString().slice(0, 10);
        const rows = Array.isArray(res?.items) ? res.items : [];
        const todayOnly = rows.filter((row) => Array.isArray(row.assignments) && row.assignments.some((assignment) => assignment.work_date === today));
        setTodayJobs(todayOnly.slice(0, 3));
      } catch {
        if (mounted) setTodayJobs([]);
      } finally {
        if (mounted) setJobsLoading(false);
      }
    };
    loadJobs();
    return () => {
      mounted = false;
    };
  }, []);

  const openJobDetail = (job, section = "") => {
    setSelectedWorkOrderId(job?.id || null);
    setDetailSection(section);
    setDetailOpen(true);
  };

  const handleDispatchJob = async (job, status) => {
    if (!job?.id) return;
    try {
      await updateMyWorkOrderDispatchStatus(job.id, { status });
      const today = new Date().toISOString().slice(0, 10);
      const res = await listMyWorkOrders({ page: 1, per_page: 10 });
      const rows = Array.isArray(res?.items) ? res.items : [];
      const todayOnly = rows.filter((row) => Array.isArray(row.assignments) && row.assignments.some((assignment) => assignment.work_date === today));
      setTodayJobs(todayOnly.slice(0, 3));
    } catch {
      // leave existing UI state unchanged
    }
  };

  useEffect(() => {
    let mounted = true;
    const loadPayrollOnboarding = async () => {
      setPayrollOnboardingLoading(true);
      setPayrollOnboardingError("");
      try {
        const data = await payrollSetupApi.getEmployeeCheckOnboarding();
        if (mounted) setPayrollOnboarding(data || null);
      } catch (err) {
        if (mounted) {
          setPayrollOnboarding(null);
          setPayrollOnboardingError(err?.response?.data?.message || "Payroll onboarding status is not available yet.");
        }
      } finally {
        if (mounted) setPayrollOnboardingLoading(false);
      }
    };
    loadPayrollOnboarding();
    return () => {
      mounted = false;
    };
  }, []);

  const handlePayrollOnboardingStart = async () => {
    setPayrollOnboardingActionLoading(true);
    try {
      await payrollSetupApi.startEmployeeCheckOnboarding();
      const refreshed = await payrollSetupApi.getEmployeeCheckOnboarding();
      setPayrollOnboarding(refreshed || null);
    } catch (err) {
      setPayrollOnboardingError(err?.response?.data?.message || "Payroll onboarding is not available yet.");
    } finally {
      setPayrollOnboardingActionLoading(false);
    }
  };

  const shortcuts = useMemo(() => [
    { label: "My Time", icon: employeeShortcutIconMap["my-time"], onClick: () => navigate(`${basePath}/my-time`) },
    { label: "Calendar", icon: employeeShortcutIconMap.calendar, onClick: () => navigate(`${basePath}/dashboard?tab=calendar`) },
    {
      label: "Availability",
      icon: employeeShortcutIconMap.availability,
      onClick: () => navigate(allowHrAccess ? `${basePath}/dashboard?tab=availability` : `${basePath}/my-time`),
    },
    { label: "My Shift", icon: employeeShortcutIconMap["my-shift"], onClick: () => navigate(`${basePath}/my-time`) },
    { label: "Time Off", icon: employeeShortcutIconMap["time-off"], onClick: () => navigate(`${basePath}/my-time`) },
    { label: "Shift Swap", icon: employeeShortcutIconMap["shift-swap"], onClick: () => navigate(`${basePath}/my-time`) },
    { label: "My Work Orders", icon: employeeShortcutIconMap["work-orders"], onClick: () => navigate(`${basePath}/work-orders`) },
    { label: "Add Job Photo", icon: employeeShortcutIconMap["work-orders"], onClick: () => navigate(`${basePath}/work-orders`) },
    { label: "My Field Reports", icon: employeeShortcutIconMap["field-reports"], onClick: () => navigate(`${basePath}/field-reports`) },
    { label: "Training", icon: employeeShortcutIconMap.training, onClick: () => navigate(`${basePath}/my-training`) },
    { label: "Communications", icon: employeeShortcutIconMap.communications, onClick: () => navigate(`${basePath}/communications`) },
  ], [allowHrAccess, basePath, navigate]);

  if (!isMobile) {
    return <Navigate to={`${basePath}/my-time`} replace />;
  }

  const showPayrollSetupCard = Boolean(
    payrollOnboardingLoading ||
    payrollOnboardingError ||
    (
      payrollOnboarding &&
      (
        payrollOnboarding.should_show_card ||
        payrollOnboarding.check_employee_mapped ||
        (payrollOnboarding.onboard_status && payrollOnboarding.onboard_status !== "not_started") ||
        payrollOnboarding.last_session_status
      )
    )
  );

  return (
    <ManagementFrame
      title=""
      subtitle=""
      fullWidth
      sx={{ minHeight: "100vh", px: { xs: 1, md: 2 } }}
      disableContentCard
      contentSx={{ p: 0 }}
    >
      <RecruiterTabs
        localTab="calendar"
        allowHrAccess={allowHrAccess}
        isLoading={isLoading}
      />
      <Stack spacing={2} sx={{ mt: 2 }}>
        {showPayrollSetupCard ? (
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
            <Stack spacing={1}>
              <Typography variant="h6">Payroll Setup</Typography>
              <Typography variant="body2" color="text.secondary">
                Sensitive payroll onboarding, including SSN, tax forms, and bank details, will be completed through Check&apos;s secure onboarding flow.
              </Typography>
              {payrollOnboardingLoading ? (
                <CircularProgress size={20} />
              ) : payrollOnboarding ? (
                <>
                  <Typography variant="body2"><strong>Status:</strong> {payrollOnboarding.onboard_status || "Not started"}</Typography>
                  <Typography variant="body2"><strong>Primary payroll location:</strong> {payrollOnboarding.primary_payroll_location?.name || "Not assigned"}</Typography>
                  <Typography variant="body2"><strong>Check mapping:</strong> {payrollOnboarding.check_employee_mapped ? "Ready" : "Not ready"}</Typography>
                  <Button
                    variant="contained"
                    onClick={handlePayrollOnboardingStart}
                    disabled={payrollOnboardingActionLoading || !payrollOnboarding.can_start_onboarding}
                  >
                    {payrollOnboardingActionLoading
                      ? "Preparing..."
                      : payrollOnboarding.onboard_status === "completed"
                        ? "Resume payroll setup"
                        : "Complete payroll setup"}
                  </Button>
                  {!payrollOnboarding.can_start_onboarding && payrollOnboarding.disabled_reason ? (
                    <Alert severity="info">{payrollOnboarding.disabled_reason}</Alert>
                  ) : null}
                </>
              ) : (
                <Alert severity="info">{payrollOnboardingError || "Payroll onboarding will be available once your employer connects Check payroll."}</Alert>
              )}
            </Stack>
          </Paper>
        ) : null}
        <MobileEmployeeHome
          displayName={displayName}
          profileImageUrl={profileImageUrl}
          managerViewingEmployee={managerViewingEmployee}
          onBackToManager={() => navigate("/manager/dashboard")}
          shortcuts={shortcuts}
          todaysJobs={jobsLoading ? [] : todayJobs.map((job) => ({
            ...job,
            dispatch_status: String(job?.dispatch?.status || "not_started").toLowerCase(),
            assignment_preview: assignmentPreview(job.assignments, job.timezone),
          }))}
          onOpenJob={(job) => openJobDetail(job)}
          onAddPhoto={(job) => openJobDetail(job, "photos")}
          onDispatchJob={handleDispatchJob}
        />
      </Stack>

      <EmployeeWorkOrderDetailDialog
        open={detailOpen}
        workOrderId={selectedWorkOrderId}
        initialSection={detailSection}
        onClose={() => {
          setDetailOpen(false);
          setDetailSection("");
          setSelectedWorkOrderId(null);
        }}
      />
    </ManagementFrame>
  );
};

export default RecruiterHomePage;
