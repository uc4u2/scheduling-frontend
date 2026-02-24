import React from "react";
import {
  Card,
  CardContent,
  Typography,
  Stack,
  Button,
  Chip,
  Skeleton,
  Alert,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import api, { timeTracking } from "../../utils/api";
import { hapticSuccess } from "../../utils/mobileFeedback";

const MobileTodayPage = () => {
  const navigate = useNavigate();
  const role =
    typeof window !== "undefined" ? (localStorage.getItem("role") || "").toLowerCase() : "";
  const isEmployee = role === "employee" || role === "recruiter";
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [refreshing, setRefreshing] = React.useState(false);
  const [clockLoading, setClockLoading] = React.useState(false);
  const [hub, setHub] = React.useState({
    nextBooking: null,
    nextShift: null,
    pendingApprovals: 0,
  });

  const sIsActive = React.useCallback((shift) => {
    const status = String(shift?.status || "").toLowerCase();
    return status === "in_progress" || status === "assigned" || status === "pending";
  }, []);

  const fetchHub = React.useCallback(async () => {
    setError("");
    setRefreshing(true);
    try {
      const [availabilityRes, historyRes, approvalsRes] = await Promise.all([
        api.get("/my-availability").catch(() => ({ data: {} })),
        api.get("/employee/time-history", { params: { page: 1, per_page: 25 } }).catch(() => ({ data: {} })),
        api.get("/manager/time-entries", { params: { status: "completed", page: 1, per_page: 50 } }).catch(() => ({ data: {} })),
      ]);
      const now = new Date();
      const appointments = [
        ...(availabilityRes?.data?.appointment_blocks || []),
        ...(availabilityRes?.data?.candidate_blocks || []),
      ];
      const nextBooking = appointments
        .map((b) => ({ ...b, startAt: new Date(b.start || b.start_time || `${b.date || ""}T${b.start_time || ""}`) }))
        .filter((b) => b.startAt && !Number.isNaN(b.startAt.getTime()) && b.startAt >= now)
        .sort((a, b) => a.startAt - b.startAt)[0] || null;

      const historyItems = historyRes?.data?.entries || historyRes?.data?.items || historyRes?.data?.rows || [];
      const nextShift = historyItems
        .map((s) => {
          const start = s.clock_in || s.start || `${s.date || ""}T${s.start_time || ""}`;
          const startAt = new Date(start);
          return { ...s, startAt };
        })
        .filter((s) => s.startAt && !Number.isNaN(s.startAt.getTime()))
        .sort((a, b) => {
          const aActive = sIsActive(a);
          const bActive = sIsActive(b);
          if (aActive && !bActive) return -1;
          if (!aActive && bActive) return 1;
          return a.startAt - b.startAt;
        })[0] || null;

      const approvalsItems = approvalsRes?.data?.entries || approvalsRes?.data?.items || approvalsRes?.data?.rows || [];
      setHub({
        nextBooking,
        nextShift,
        pendingApprovals: Array.isArray(approvalsItems) ? approvalsItems.length : Number(approvalsRes?.data?.count || 0),
      });
    } catch (err) {
      setError(err?.response?.data?.error || "Unable to load dashboard data.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [sIsActive]);

  React.useEffect(() => {
    fetchHub();
  }, [fetchHub]);

  React.useEffect(() => {
    const onRefresh = () => {
      fetchHub();
    };
    window.addEventListener("mobile:refresh", onRefresh);
    return () => window.removeEventListener("mobile:refresh", onRefresh);
  }, [fetchHub]);

  const onClockAction = async (type) => {
    const shiftId = hub?.nextShift?.id || hub?.nextShift?.shift_id;
    if (!shiftId) return;
    setClockLoading(true);
    setError("");
    try {
      if (type === "in") {
        await timeTracking.clockIn(shiftId);
      } else {
        await timeTracking.clockOut(shiftId);
      }
      await hapticSuccess();
      await fetchHub();
    } catch (err) {
      setError(err?.response?.data?.error || "Clock action failed.");
    } finally {
      setClockLoading(false);
    }
  };

  return (
    <Stack spacing={1.5}>
      <Card variant="outlined">
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Today
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Next booking, next shift, and approvals in one view.
          </Typography>
          {error && <Alert severity="warning" sx={{ mt: 1 }}>{error}</Alert>}
        </CardContent>
      </Card>

      {loading ? (
        <Card variant="outlined">
          <CardContent>
            <Skeleton height={26} width="45%" />
            <Skeleton height={20} width="80%" />
            <Skeleton height={20} width="70%" />
          </CardContent>
        </Card>
      ) : (
        <>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>Next booking</Typography>
              {hub.nextBooking ? (
                <Stack spacing={0.75}>
                  <Typography variant="body2" fontWeight={600}>
                    {hub.nextBooking.client_name || hub.nextBooking.candidate_name || "Upcoming booking"}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {hub.nextBooking.startAt?.toLocaleString()}
                  </Typography>
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">No upcoming bookings.</Typography>
              )}
            </CardContent>
          </Card>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>Next shift</Typography>
              {hub.nextShift ? (
                <Stack spacing={0.75}>
                  <Typography variant="body2" fontWeight={600}>
                    {hub.nextShift.startAt?.toLocaleString()}
                  </Typography>
                  <Chip size="small" label={String(hub.nextShift.status || "scheduled")} sx={{ width: "fit-content" }} />
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">No active shift found.</Typography>
              )}
            </CardContent>
          </Card>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>Pending approvals</Typography>
              <Typography variant="h5">{hub.pendingApprovals}</Typography>
            </CardContent>
          </Card>
        </>
      )}

      <Stack direction="row" spacing={1} flexWrap="wrap">
        <Button variant="contained" onClick={() => navigate("/app/calendar")}>Calendar</Button>
        <Button variant="outlined" onClick={() => navigate("/app/shifts")}>Shifts</Button>
        {!isEmployee && <Button variant="outlined" onClick={() => navigate("/app/bookings")}>Bookings</Button>}
        <Button variant="outlined" onClick={fetchHub} disabled={refreshing}>
          {refreshing ? "Refreshing..." : "Refresh"}
        </Button>
        {isEmployee && (
          <>
            <Button variant="outlined" onClick={() => onClockAction("in")} disabled={clockLoading || !hub?.nextShift}>
              Clock in
            </Button>
            <Button variant="outlined" onClick={() => onClockAction("out")} disabled={clockLoading || !hub?.nextShift}>
              Clock out
            </Button>
          </>
        )}
      </Stack>

      <Card variant="outlined">
        <CardContent>
          <Typography variant="subtitle1" gutterBottom>
            Workspace shortcuts
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Button
              size="small"
              onClick={() => navigate(isEmployee ? "/employee/my-time" : "/manager/dashboard")}
            >
              Dashboard
            </Button>
            <Button size="small" onClick={() => navigate("/manager/payroll")}>
              Payroll
            </Button>
            <Button size="small" onClick={() => navigate("/manager/service-management")}>
              Services
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
};

export default MobileTodayPage;
