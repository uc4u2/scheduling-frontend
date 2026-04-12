import {
  ACCRUAL_FREQUENCY_OPTIONS,
  buildLeaveBalancePolicyPatch,
  LEAVE_TYPE_OPTIONS,
  buildLeaveSettingsPatch,
  defaultLeaveSettings,
  formatLeaveTypeLabel,
  hasLeaveBalancePolicyChanges,
  hasLeaveSettingsChanges,
  normalizeLeaveBalancePolicies,
  normalizeLeaveSettings,
} from "../leaveSettings";

describe("leave settings helpers", () => {
  it("normalizes missing backend fields defensively", () => {
    const settings = normalizeLeaveSettings({ settings: { attachment_required_leave_types_json: ["SICK", "sick", "family", "compassionate"] } });

    expect(settings.allow_hourly_leave).toBe(true);
    expect(settings.default_day_count_strategy).toBe("business_days_only");
    expect(settings.attachment_required_leave_types_json).toEqual(["sick", "family", "compassionate"]);
  });

  it("includes compassionate as a first-class leave type option without adding unpaid", () => {
    expect(LEAVE_TYPE_OPTIONS).toContain("compassionate");
    expect(LEAVE_TYPE_OPTIONS).not.toContain("unpaid");
    expect(formatLeaveTypeLabel("compassionate")).toBe("Compassionate");
  });

  it("builds partial patches only for changed editable fields", () => {
    const original = defaultLeaveSettings();
    const current = {
      ...original,
      allow_hourly_leave: false,
      default_day_count_strategy: "shift_days_only",
      updated_by_name: "Mina Manager",
    };

    expect(buildLeaveSettingsPatch(current, original)).toEqual({
      allow_hourly_leave: false,
      default_day_count_strategy: "shift_days_only",
    });
    expect(hasLeaveSettingsChanges(current, original)).toBe(true);
    expect(hasLeaveSettingsChanges(original, original)).toBe(false);
  });

  it("normalizes inactive leave balance policies defensively", () => {
    const normalized = normalizeLeaveBalancePolicies({
      advisory_only: true,
      active_for_accruals: false,
      policies: [
        {
          leave_type: "vacation",
          accrual_enabled: true,
          accrual_rate: 1.5,
          accrual_frequency: "biweekly",
          max_balance_hours: 120,
        },
        {
          leave_type: "unpaid",
          accrual_enabled: true,
        },
      ],
    });

    expect(ACCRUAL_FREQUENCY_OPTIONS).toContain("biweekly");
    expect(normalized.active_for_accruals).toBe(false);
    expect(normalized.policies).toHaveLength(LEAVE_TYPE_OPTIONS.length);
    expect(normalized.policies.some((policy) => policy.leave_type === "unpaid")).toBe(false);
    expect(normalized.policies.find((policy) => policy.leave_type === "vacation")).toMatchObject({
      accrual_enabled: true,
      accrual_rate: 1.5,
      accrual_frequency: "biweekly",
      max_balance_hours: 120,
      advisory_only: true,
      active_for_accruals: false,
    });
    expect(normalized.policies.find((policy) => policy.leave_type === "sick")).toMatchObject({
      accrual_enabled: false,
      accrual_unit: "hours",
      accrual_rate: 0,
      accrual_frequency: "none",
      max_balance_hours: "",
    });
  });

  it("builds partial leave balance policy updates only for changed policy rows", () => {
    const original = normalizeLeaveBalancePolicies({
      policies: [
        { leave_type: "vacation", accrual_enabled: false, accrual_rate: 0, accrual_frequency: "none" },
      ],
    });
    const current = normalizeLeaveBalancePolicies({
      policies: [
        { leave_type: "vacation", accrual_enabled: true, accrual_rate: 2, accrual_frequency: "monthly" },
      ],
    });

    expect(buildLeaveBalancePolicyPatch(current, original)).toEqual({
      policies: [
        {
          leave_type: "vacation",
          accrual_enabled: true,
          accrual_rate: 2,
          accrual_frequency: "monthly",
        },
      ],
    });
    expect(hasLeaveBalancePolicyChanges(current, original)).toBe(true);
    expect(hasLeaveBalancePolicyChanges(original, original)).toBe(false);
  });
});
