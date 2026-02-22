import TodayIcon from "@mui/icons-material/Today";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import ScheduleIcon from "@mui/icons-material/Schedule";
import BookOnlineIcon from "@mui/icons-material/BookOnline";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import DashboardIcon from "@mui/icons-material/Dashboard";
import GroupIcon from "@mui/icons-material/Group";
import PaymentsOutlinedIcon from "@mui/icons-material/PaymentsOutlined";
import SupportAgentIcon from "@mui/icons-material/SupportAgent";
import LinkIcon from "@mui/icons-material/Link";
import SettingsIcon from "@mui/icons-material/Settings";

export const getBottomTabs = (role) => {
  const base = `/app/${role}`;
  return [
    { key: "today", label: "Today", icon: TodayIcon, to: `${base}/today` },
    { key: "calendar", label: "Calendar", icon: CalendarMonthIcon, to: `${base}/calendar` },
    { key: "shifts", label: "Shifts", icon: ScheduleIcon, to: `${base}/shifts` },
    { key: "bookings", label: "Bookings", icon: BookOnlineIcon, to: `${base}/bookings` },
    { key: "more", label: "More", icon: MoreHorizIcon, to: null },
  ];
};

export const getDrawerItems = (role) => {
  if (role === "manager") {
    return [
      { label: "Overview", to: "/app/manager/today", icon: DashboardIcon },
      { label: "Employees", to: "/app/manager/employees", icon: GroupIcon },
      { label: "Shifts & Availability", to: "/app/manager/shifts", icon: ScheduleIcon },
      { label: "Payroll", to: "/app/manager/payroll", icon: PaymentsOutlinedIcon },
      { label: "Support Tickets", to: "/manager/support-consent", icon: SupportAgentIcon },
      { label: "Services & Bookings", to: "/app/manager/services-bookings", icon: BookOnlineIcon },
      { label: "Booking Checkout", to: "/manager/payments", icon: PaymentsOutlinedIcon },
      { label: "Settings", to: "/manager/dashboard?view=settings", icon: SettingsIcon },
    ];
  }

  return [
    { label: "Availability", to: "/app/employee/my-time", icon: ScheduleIcon },
    { label: "Meetings", to: "/app/employee/upcoming-meetings", icon: CalendarMonthIcon },
    { label: "Candidate Search", to: "/app/employee/candidate-search", icon: GroupIcon },
    { label: "Public Booking Link", to: "/app/employee/public-link", icon: LinkIcon },
    { label: "Shifts & Availability", to: "/app/employee/shifts", icon: ScheduleIcon },
    { label: "Settings", to: "/employee?tab=calendar", icon: SettingsIcon },
  ];
};
