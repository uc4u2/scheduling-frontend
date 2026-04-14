import {
  BALANCE_LEAVE_TYPES,
  buildLeaveBalanceAdjustmentPayload,
  formatBalanceHours,
  normalizeLeaveBalanceSummary,
} from "../leaveBalances";

describe("leave balance helpers", () => {
  it("normalizes ledger-derived balances and excludes unpaid as a balance type", () => {
    const summary = normalizeLeaveBalanceSummary({
      recruiter_id: 7,
      payroll_truth: false,
      source: "manual_ledger",
      balances: [
        { leave_type: "sick", balance_hours: 6, balance_managed: true },
        { leave_type: "unpaid", balance_hours: 99 },
      ],
      ledger: [
        { id: 1, leave_type: "sick", delta_hours: 8, reason: "Grant" },
        { id: 2, leave_type: "unpaid", delta_hours: 99, reason: "Ignore" },
      ],
    });

    expect(summary.recruiter_id).toBe(7);
    expect(summary.payroll_truth).toBe(false);
    expect(summary.source).toBe("manual_ledger");
    expect(summary.balances.find((row) => row.leave_type === "sick").balance_hours).toBe(6);
    expect(summary.balances.find((row) => row.leave_type === "sick").balance_managed).toBe(true);
    expect(summary.balances.find((row) => row.leave_type === "compassionate").balance_hours).toBe(0);
    expect(summary.balances.some((row) => row.leave_type === "unpaid")).toBe(false);
    expect(summary.ledger).toHaveLength(1);
  });

  it("supports positive and negative manual adjustment payloads", () => {
    expect(buildLeaveBalanceAdjustmentPayload({
      leave_type: "vacation",
      delta_hours: "8.5",
      reason: "Opening balance",
    })).toEqual({
      leave_type: "vacation",
      delta_hours: 8.5,
      reason: "Opening balance",
    });

    expect(buildLeaveBalanceAdjustmentPayload({
      leave_type: "sick",
      delta_hours: "-2",
      reason: "Correction",
    })).toMatchObject({
      leave_type: "sick",
      delta_hours: -2,
    });
  });

  it("rejects invalid adjustment drafts", () => {
    expect(BALANCE_LEAVE_TYPES).not.toContain("unpaid");
    expect(buildLeaveBalanceAdjustmentPayload({ leave_type: "unpaid", delta_hours: 1, reason: "No" }).error)
      .toMatch(/supported leave type/i);
    expect(buildLeaveBalanceAdjustmentPayload({ leave_type: "sick", delta_hours: 0, reason: "No-op" }).error)
      .toMatch(/adjustment hours/i);
    expect(buildLeaveBalanceAdjustmentPayload({ leave_type: "sick", delta_hours: 1, reason: " " }).error)
      .toMatch(/reason/i);
  });

  it("formats balance hours compactly", () => {
    expect(formatBalanceHours(8)).toBe("8h");
    expect(formatBalanceHours(2.25)).toBe("2.25h");
    expect(formatBalanceHours(undefined)).toBe("0h");
  });
});
