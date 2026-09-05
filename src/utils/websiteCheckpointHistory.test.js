import {
  CHECKPOINT_EXCLUDED_ITEMS,
  CHECKPOINT_INCLUDED_ITEMS,
  checkpointCounts,
  checkpointKindLabel,
  checkpointPublishBlocked,
  formatCheckpointTimestamp,
  validateApprovedCheckpointName,
} from "./websiteCheckpointHistory";

describe("website checkpoint history helpers", () => {
  test("requires a meaningful approved design name", () => {
    expect(validateApprovedCheckpointName(" ")).toMatch(/meaningful/i);
    expect(validateApprovedCheckpointName("v1")).toMatch(/meaningful/i);
    expect(validateApprovedCheckpointName("Approved homepage v1")).toBe("");
  });

  test("labels all checkpoint kinds", () => {
    expect(["manual", "automatic", "approved", "rollback"].map(checkpointKindLabel)).toEqual([
      "Manual", "Automatic", "Approved", "Rollback",
    ]);
  });

  test("treats legacy UTC timestamps as UTC and rejects invalid values", () => {
    expect(formatCheckpointTimestamp("not-a-date")).toBe("—");
    expect(formatCheckpointTimestamp("2026-09-05T12:00:00", "en-CA")).toContain("2026");
  });

  test("blocks publish for missing media while keeping draft restore available", () => {
    expect(checkpointPublishBlocked({ publishable: false })).toBe(true);
    expect(checkpointPublishBlocked({ missing_tenant_media_count: 1 })).toBe(true);
    expect(checkpointPublishBlocked({ publishable: true, missing_tenant_media_count: 0 })).toBe(false);
  });

  test("normalizes counts and documents the design-only boundary", () => {
    expect(checkpointCounts({ page_count: 2, form_count: 1 })[0]).toEqual({ label: "Pages", value: 2 });
    expect(CHECKPOINT_INCLUDED_ITEMS).toContain("Forms and fields");
    expect(CHECKPOINT_EXCLUDED_ITEMS).toContain("Form submissions");
    expect(CHECKPOINT_EXCLUDED_ITEMS).toContain("Private credentials or integrations");
  });
});
