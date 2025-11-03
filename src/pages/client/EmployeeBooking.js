// src/pages/EmployeeBooking.js
import React, { useEffect, useState } from "react";
import { useSearchParams, useParams } from "react-router-dom";
import { Box } from "@mui/material";
import BookingFlowContainer from "./BookingFlowContainer";
import PublicPageShell from "./PublicPageShell";

const EmployeeBooking = () => {
  const { slug } = useParams(); // e.g. company slug in route, if present
  const [searchParams] = useSearchParams();

  // Get query params for direct booking
  const employee_id = searchParams.get("employee_id") || searchParams.get("artist_id");

  const service_id = searchParams.get("service_id");
  const date = searchParams.get("date");
  const start_time = searchParams.get("start_time");

  // Preselection info for BookingFlowContainer
  const preselect = (employee_id && service_id && date && start_time)
    ? {
        employee_id,
        service_id,
        date,
        start_time,
      }
    : null;

  const isEmbed = searchParams.get("embed") === "1";

  const content = (
    <Box
      sx={{
        width: "100%",
        maxWidth: isEmbed ? "100%" : 1200,
        mx: "auto",
        px: isEmbed ? 0 : { xs: 2, md: 4 },
        py: isEmbed ? { xs: 2, md: 3 } : { xs: 4, md: 8 },
      }}
    >
      <BookingFlowContainer companySlug={slug} preselect={preselect} />
    </Box>
  );

  if (!slug) {
    return content;
  }

  return (
    <PublicPageShell activeKey="__services" slugOverride={slug}>
      {content}
    </PublicPageShell>
  );
};

export default EmployeeBooking;
