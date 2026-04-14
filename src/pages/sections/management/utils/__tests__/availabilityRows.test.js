import {
  filterAvailabilityRows,
  formatAvailabilityLeaveTooltip,
  isAvailabilityBlockedByLeave,
} from "../availabilityRows";

describe("availability row helpers", () => {
  const rows = [
    { id: 1, blocked_by_leave: true, leave_id: 10, leave_overlap_minutes: 30 },
    { id: 2, leave_conflict: true },
    { id: 3, blocked_by_leave: false, leave_conflict: false },
  ];

  it("identifies rows blocked by approved leave metadata", () => {
    expect(isAvailabilityBlockedByLeave(rows[0])).toBe(true);
    expect(isAvailabilityBlockedByLeave(rows[1])).toBe(true);
    expect(isAvailabilityBlockedByLeave(rows[2])).toBe(false);
  });

  it("filters all, blocked, and available rows", () => {
    expect(filterAvailabilityRows(rows, "all").map((row) => row.id)).toEqual([1, 2, 3]);
    expect(filterAvailabilityRows(rows, "blocked").map((row) => row.id)).toEqual([1, 2]);
    expect(filterAvailabilityRows(rows, "available").map((row) => row.id)).toEqual([3]);
  });

  it("formats compact leave tooltip details", () => {
    expect(formatAvailabilityLeaveTooltip(rows[0])).toContain("Leave #10");
    expect(formatAvailabilityLeaveTooltip(rows[0])).toContain("30 min overlap");
  });
});
