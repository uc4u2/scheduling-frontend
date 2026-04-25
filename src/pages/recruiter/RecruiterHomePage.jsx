import React, { useEffect, useMemo, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { Stack, useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import RecruiterTabs from "../../components/recruiter/RecruiterTabs";
import ManagementFrame from "../../components/ui/ManagementFrame";
import useRecruiterTabsAccess from "../../components/recruiter/useRecruiterTabsAccess";
import MobileEmployeeHome, { employeeShortcutIconMap } from "../../components/employee/MobileEmployeeHome";
import api from "../../utils/api";

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
    { label: "Training", icon: employeeShortcutIconMap.training, onClick: () => navigate(`${basePath}/my-training`) },
    { label: "Communications", icon: employeeShortcutIconMap.communications, onClick: () => navigate(`${basePath}/communications`) },
  ], [allowHrAccess, basePath, navigate]);

  if (!isMobile) {
    return <Navigate to={`${basePath}/my-time`} replace />;
  }

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
        <MobileEmployeeHome
          displayName={displayName}
          profileImageUrl={profileImageUrl}
          managerViewingEmployee={managerViewingEmployee}
          onBackToManager={() => navigate("/manager/dashboard")}
          shortcuts={shortcuts}
        />
      </Stack>
    </ManagementFrame>
  );
};

export default RecruiterHomePage;
