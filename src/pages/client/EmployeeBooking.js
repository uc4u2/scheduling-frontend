// src/pages/EmployeeBooking.js
import React, { useEffect, useState } from "react";
import { useSearchParams, useParams } from "react-router-dom";
import { Box } from "@mui/material";
import BookingFlowContainer from "./BookingFlowContainer";
import PublicPageShell from "./PublicPageShell";
import TenantTransactionalShell from "./TenantTransactionalShell";

const EmployeeBooking = ({ slugOverride }) => {
  const { slug: routeSlug } = useParams(); // e.g. company slug in route, if present
  const slug = slugOverride || routeSlug;
  const [searchParams] = useSearchParams();

  // Get query params for direct booking
  const employee_id = searchParams.get("employee_id") || searchParams.get("artist_id");

  const service_id = searchParams.get("service_id");
  const date = searchParams.get("date");
  const start_time = searchParams.get("start_time");
  const end_time = searchParams.get("end_time");
  const start_utc = searchParams.get("start_utc");
  const end_utc = searchParams.get("end_utc");
  const availability_id = searchParams.get("availability_id");
  const timezone = searchParams.get("timezone");

  // Preselection info for BookingFlowContainer
  const preselect = (employee_id && service_id && date && start_time)
    ? {
        employee_id,
        service_id,
        date,
        start_time,
        end_time,
        start_utc,
        end_utc,
        availability_id,
        timezone,
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
      <BookingFlowContainer
        companySlug={slug}
        preselect={preselect}
        initialServiceId={service_id || null}
      />
    </Box>
  );

  if (!slug) {
    return content;
  }

  return (
    <TenantTransactionalShell
      slugOverride={slug}
      activeKey="__services"
      pagePath="services"
      returnTo={searchParams.get("return_to") || searchParams.get("returnTo") || ""}
      legacyShell={(node) => (
        <PublicPageShell activeKey="__services" slugOverride={slug}>
          {node}
        </PublicPageShell>
      )}
    >
      {content}
    </TenantTransactionalShell>
  );
};

export default EmployeeBooking;
