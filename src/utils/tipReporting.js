const hasOwn = (value, key) =>
  Object.prototype.hasOwnProperty.call(value || {}, key);

const asMoneyNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const normalizeTipReportRow = (row = {}) => {
  const grossTipTotal = asMoneyNumber(
    row.gross_tip_total ?? row.tip_total,
    0,
  );
  const refundedTipTotal = asMoneyNumber(row.refunded_tip_total, 0);
  const hasExplicitNet = hasOwn(row, "net_tip_total");
  const explicitlyUnavailable =
    row.net_tip_complete === false ||
    (hasExplicitNet && row.net_tip_total === null);
  const netTipTotal = explicitlyUnavailable
    ? null
    : hasExplicitNet
      ? asMoneyNumber(row.net_tip_total, grossTipTotal - refundedTipTotal)
      : grossTipTotal - refundedTipTotal;

  return {
    ...row,
    grossTipTotal,
    refundedTipTotal,
    netTipTotal,
    netTipAvailable: netTipTotal !== null,
    netUnavailableLabel: explicitlyUnavailable
      ? "Net unavailable—refund allocation unknown"
      : null,
    showLeaderboardProgress:
      netTipTotal !== null && row.recipient_attribution !== "unallocated",
  };
};

export const tipLeaderboardProgress = (row, rows = []) => {
  const current = normalizeTipReportRow(row);
  if (!current.showLeaderboardProgress) return null;
  const availablePeers = rows
    .map(normalizeTipReportRow)
    .filter(
      (peer) =>
        peer.showLeaderboardProgress &&
        (peer.currency || "USD") === (current.currency || "USD"),
    );
  const maximum = Math.max(
    0,
    ...availablePeers.map((peer) => Math.max(0, peer.netTipTotal)),
  );
  if (maximum <= 0) return 0;
  return Math.max(
    0,
    Math.min(100, Math.round((100 * current.netTipTotal) / maximum)),
  );
};
