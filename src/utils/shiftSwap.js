// src/utils/shiftSwap.js

export const STATUS = {
  pending:        { chip: "warning",  label: "Pending" },
  peer_accepted:  { chip: "info",     label: "Accepted by peer" },
  denied:         { chip: "error",    label: "Denied" },
  executed:       { chip: "success",  label: "Swap executed" },
  cancelled:      { chip: "default",  label: "Cancelled" }
};

// Centralized polling interval for all shift-swap polling
export const POLL_MS = 30_000;
