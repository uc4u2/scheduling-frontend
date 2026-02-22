import React from "react";
import {
  Card,
  CardActionArea,
  CardContent,
  Grid,
  Stack,
  Typography,
} from "@mui/material";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import VideoCallIcon from "@mui/icons-material/VideoCall";
import LinkIcon from "@mui/icons-material/Link";
import { useNavigate } from "react-router-dom";

const items = [
  {
    title: "My Time",
    subtitle: "Clock-ins, breaks, and shift history",
    to: "/app/employee/my-time",
    icon: AccessTimeIcon,
  },
  {
    title: "Today's Shifts",
    subtitle: "Review your assigned shifts",
    to: "/app/employee/shifts",
    icon: EventAvailableIcon,
  },
  {
    title: "Upcoming Meetings",
    subtitle: "View and join scheduled meetings",
    to: "/app/employee/upcoming-meetings",
    icon: VideoCallIcon,
  },
  {
    title: "Public Booking Link",
    subtitle: "Share your booking URL",
    to: "/app/employee/public-link",
    icon: LinkIcon,
  },
];

export default function EmployeeTodayPage() {
  const navigate = useNavigate();

  return (
    <Stack spacing={2}>
      <Typography variant="h5" fontWeight={800}>Today</Typography>
      <Typography variant="body2" color="text.secondary">
        Quick access to your daily workflows.
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
