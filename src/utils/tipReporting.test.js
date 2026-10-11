import {
  normalizeTipReportRow,
  tipLeaderboardProgress,
} from "./tipReporting";

test("explicit unknown net is never replaced with a calculated legacy fallback", () => {
  const row = normalizeTipReportRow({
    currency: "CAD",
    gross_tip_total: 20,
    refunded_tip_total: 0,
    net_tip_total: null,
    net_tip_complete: false,
  });

  expect(row.netTipTotal).toBeNull();
  expect(row.netUnavailableLabel).toBe(
    "Net unavailable—refund allocation unknown",
  );
  expect(tipLeaderboardProgress(row, [row])).toBeNull();
});

test("a missing legacy net field retains the compatible gross-minus-refunds fallback", () => {
  const row = normalizeTipReportRow({
    currency: "USD",
    tip_total: 20,
    refunded_tip_total: 5,
  });

  expect(row.netTipTotal).toBe(15);
  expect(row.netTipAvailable).toBe(true);
});

test("negative refund-period activity stays truthful while progress stays bounded", () => {
  const row = {
    currency: "CAD",
    gross_tip_total: 0,
    refunded_tip_total: 10,
    net_tip_total: -10,
    net_tip_complete: true,
  };

  expect(normalizeTipReportRow(row).netTipTotal).toBe(-10);
  expect(tipLeaderboardProgress(row, [row])).toBe(0);
});
