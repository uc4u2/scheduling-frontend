import React from "react";
import {
  Card,
  CardActionArea,
  CardContent,
  Grid,
  Stack,
  Typography,
} from "@mui/material";
import GroupsIcon from "@mui/icons-material/Groups";
import EventIcon from "@mui/icons-material/Event";
import ScheduleIcon from "@mui/icons-material/Schedule";
import BookOnlineIcon from "@mui/icons-material/BookOnline";
import PaymentsIcon from "@mui/icons-material/Payments";
import { useNavigate } from "react-router-dom";

const items = [
  {
    title: "Team Calendar",
    subtitle: "Review team shifts and staffing",
    to: "/app/manager/calendar",
    icon: EventIcon,
  },
  {
    title: "Approvals & Availability",
    subtitle: "Approve changes and update slots",
    to: "/app/manager/shifts",
    icon: ScheduleIcon,
  },
  {
    title: "Bookings",
    subtitle: "Manage recent bookings quickly",
    to: "/app/manager/bookings",
    icon: BookOnlineIcon,
  },
  {
    title: "Employees",
    subtitle: "Open employee roster and actions",
    to: "/app/manager/employees",
    icon: GroupsIcon,
  },
  {
    title: "Services & Checkout",
    subtitle: "Services, bookings, and payment links",
    to: "/app/manager/services-bookings",
    icon: BookOnlineIcon,
  },
  {
    title: "Payroll",
    subtitle: "Open payroll workflows",
    to: "/app/manager/payroll",
    icon: PaymentsIcon,
  },
];

export default function ManagerTodayPage() {
  const navigate = useNavigate();

  return (
    <Stack spacing={2}>
      <Typography variant="h5" fontWeight={800}>Today</Typography>
      <Typography variant="body2" color="text.secondary">
        Prioritized manager actions for mobile app mode.
      </Typography>
      <Grid container spacing={1.25}>
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Grid item xs={12} sm={6} key={item.to}>
              <Card variant="outlined">
                <CardActionArea onClick={() => navigate(item.to)}>
                  <CardContent>
                    <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 1 }}>
                      <Icon color="primary" fontSize="small" />
                      <Typography variant="subtitle1" fontWeight={700}>{item.title}</Typography>
                    </Stack>
                    <Typography variant="body2" color="text.secondary">{item.subtitle}</Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Stack>
  );
}
