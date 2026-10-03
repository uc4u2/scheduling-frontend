import React, { Suspense } from "react";

import { isEmbeddedTransactionalLocation } from "./embeddedTransactionalRoutes";

const FullApplication = React.lazy(() => import("./App"));
const EmbeddedTransactionalApplication = React.lazy(() =>
  import("./EmbeddedTransactionalApp")
);

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

