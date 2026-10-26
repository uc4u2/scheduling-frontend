import React, { Suspense } from "react";

import { isEmbeddedTransactionalLocation } from "./embeddedTransactionalRoutes";

const FullApplication = React.lazy(() => import("./App"));
const EmbeddedTransactionalApplication = React.lazy(() =>
  import("./EmbeddedTransactionalApp")
);
const ClientSessionBootstrap = React.lazy(() => import("./ClientSessionBootstrap"));

export function isClientSessionBootstrapLocation(locationLike) {
  const query = new URLSearchParams(locationLike?.search || "");
  return locationLike?.pathname === "/login"
    && query.get("bootstrap") === "1"
    && query.get("embed") === "1"
    && query.get("client") === "1"
    && Boolean(query.get("site"));
}

function ApplicationLoader() {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        alignItems: "center",
        display: "flex",
        justifyContent: "center",
        minHeight: "100vh",
        padding: 24,
      }}
    >
      Preparing your experience…
    </div>
  );
}

export default function AppBootstrap() {
  // A handoff receiver is not an interactive login page. Mounting the full
  // app can navigate away (for example for an existing client session) and
  // destroy the in-memory PKCE verifier while the parent creates its code.
  if (isClientSessionBootstrapLocation(typeof window !== "undefined" ? window.location : null)) {
    return <Suspense fallback={null}><ClientSessionBootstrap /></Suspense>;
  }
  const useTransactionalRuntime = isEmbeddedTransactionalLocation(
    typeof window !== "undefined" ? window.location : null
  );
  const SelectedApplication = useTransactionalRuntime
    ? EmbeddedTransactionalApplication
    : FullApplication;

  return (
    <Suspense fallback={<ApplicationLoader />}>
      <SelectedApplication />
    </Suspense>
  );
}

