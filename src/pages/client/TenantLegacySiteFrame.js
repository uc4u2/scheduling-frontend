import React from "react";

import SiteFrame from "../../components/website/SiteFrame";

/**
 * Reuses the published Website Builder shell around legacy-owned client
 * workflows. TenantTransactionalShell calls this only for legacy renderers;
 * Next renderers continue to use their existing branded bridge.
 */
export default function TenantLegacySiteFrame({
  slug,
  activeKey,
  shellPayload = null,
  children,
}) {
  if (!slug) return <>{children}</>;

  return (
    <SiteFrame
      slug={slug}
      activeKey={activeKey}
      initialSite={shellPayload || undefined}
      disableFetch={Boolean(shellPayload)}
      wrapChildrenInContainer={false}
    >
      {children}
    </SiteFrame>
  );
}
