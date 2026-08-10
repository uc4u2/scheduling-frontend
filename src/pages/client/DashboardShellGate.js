// src/pages/client/DashboardShellGate.js
import React from "react";
import { useLocation } from "react-router-dom";
import PublicPageShell from "./PublicPageShell";
import TenantTransactionalShell from "./TenantTransactionalShell";
import ClientDashboard from "../ClientDashboard"; // adjust if your dashboard path differs

export default function DashboardShellGate() {
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const siteSlug = params.get("site"); // ?site=photo-artisto-corp

  if (!siteSlug) {
    // Normal dashboard (no site wrapper)
    return <ClientDashboard />;
  }

  // Site-wrapped dashboard (keeps menu + theme)
  return (
    <TenantTransactionalShell
      slugOverride={siteSlug}
      activeKey="__mybookings"
      pagePath=""
      legacyShell={(node) => (
        <PublicPageShell slugOverride={siteSlug} activeKey="__mybookings">
          {node}
        </PublicPageShell>
      )}
    >
      <ClientDashboard />
    </TenantTransactionalShell>
  );
}
