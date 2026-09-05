export const getWebsiteDesignWorkspaceAction = (supportSession) => {
  const status = String(supportSession?.status || "").toLowerCase();
  if (!supportSession || status === "ended" || status === "expired") {
    return { kind: "request", label: "Request website access" };
  }
  if (status === "pending" && !supportSession.approved_at) {
    return { kind: "waiting", label: "Awaiting manager approval" };
  }
  if (status === "pending" && supportSession.approved_at) {
    return { kind: "start", label: "Launch design workspace" };
  }
  if (status === "active") {
    return { kind: "open", label: "Open design workspace" };
  }
  return { kind: "unavailable", label: "Design workspace unavailable" };
};

export const getSupportCapabilities = (supportSession) => {
  if (Array.isArray(supportSession?.capabilities)) return supportSession.capabilities;
  if (supportSession?.scope === "website_all") return ["website_builder", "domain_connect"];
  return supportSession?.scope ? [supportSession.scope] : [];
};

export const buildSupportWorkspacePath = (
  path,
  supportSession,
  companyId,
  origin = "https://app.schedulaa.com"
) => {
  if (!supportSession?.id || !companyId) return "";
  const url = new URL(path, origin);
  url.searchParams.set("support_session", String(supportSession.id));
  url.searchParams.set("company_id", String(companyId));
  return `${url.pathname}${url.search}${url.hash}`;
};

export const websiteDesignHandoffFilename = (handoff) => {
  const ticket = String(handoff?.ticket_id || "ticket").replace(/[^a-zA-Z0-9_-]/g, "-");
  const slug = String(handoff?.company_slug || handoff?.company_id || "tenant")
    .replace(/[^a-zA-Z0-9_-]/g, "-")
    .toLowerCase();
  return `schedulaa-design-${slug}-ticket-${ticket}.json`;
};

export const downloadWebsiteDesignHandoff = (handoff, documentRef = document) => {
  if (!handoff || !documentRef?.body) return false;
  const blob = new Blob([`${JSON.stringify(handoff, null, 2)}\n`], {
    type: "application/json",
  });
  const href = URL.createObjectURL(blob);
  const anchor = documentRef.createElement("a");
  anchor.href = href;
  anchor.download = websiteDesignHandoffFilename(handoff);
  anchor.style.display = "none";
  documentRef.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(href);
  return true;
};
