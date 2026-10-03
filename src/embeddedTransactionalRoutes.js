const TRANSACTIONAL_TAILS = [
  /^services\/[^/]+(?:\/employees\/[^/]+)?$/,
  /^products\/[^/]+$/,
  /^basket$/,
  /^checkout(?:\/return)?$/,
  /^book(?:\/[^/]+\/[^/]+)?$/,
  /^booking-confirmation\/[^/]+$/,
];

const matchesTransactionalTail = (value) =>
  TRANSACTIONAL_TAILS.some((pattern) => pattern.test(value));

/**
 * The published Next.js websites open legacy booking and commerce surfaces in
 * an iframe with embed=1. Keep those routes on a deliberately small runtime so
 * a client does not download the manager, admin, payroll, and marketing app.
 */
export function isEmbeddedTransactionalLocation(locationLike) {
  const pathname = String(locationLike?.pathname || "/");
  const search = String(locationLike?.search || "");
  const params = new URLSearchParams(search);
  if (params.get("embed") !== "1") return false;

  const segments = pathname.split("/").filter(Boolean);
  if (!segments.length) return false;

  const direct = segments.join("/");
  if (matchesTransactionalTail(direct)) return true;

  // Standard app-host routes include the tenant slug as their first segment.
  if (segments.length > 1 && matchesTransactionalTail(segments.slice(1).join("/"))) {
    return true;
  }

  // Historical direct-book and confirmation aliases remain valid hand-off
  // targets from the booking flow.
  if (/^client\/book\/[^/]+\/[^/]+\/[^/]+$/.test(direct)) return true;
  if (/^client\/booking-confirmation\/[^/]+$/.test(direct)) return true;

  return false;
}

