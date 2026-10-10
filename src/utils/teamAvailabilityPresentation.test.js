import {
  buildRecruiterNameMap,
  groupSlotsByEmployee,
  recruiterDisplayName,
  resolveSlotEmployeeName,
  resolveTeamAvailabilityTimezone,
} from "./teamAvailabilityPresentation";

describe("team availability presentation helpers", () => {
  const recruiters = [
    { id: 19, first_name: "Lily", last_name: "Rahjoo", email: "lily@example.test" },
    { id: 20, full_name: "Mina Pakdaman", email: "mina@example.test" },
  ];

  it("uses readable employee names without exposing an internal id fallback", () => {
    const names = buildRecruiterNameMap(recruiters);

    expect(recruiterDisplayName(recruiters[0])).toBe("Lily Rahjoo");
    expect(resolveSlotEmployeeName({ recruiter_id: 19 }, names)).toBe("Lily Rahjoo");
    expect(resolveSlotEmployeeName({ recruiter_id: 999 }, names)).toBe("Employee");
    expect(resolveSlotEmployeeName({ recruiter_id: 19, recruiter_name: "Published Name" }, names)).toBe("Published Name");
  });

  it("groups selected-day slots under their resolved employee names", () => {
    const names = buildRecruiterNameMap(recruiters);
    const groups = groupSlotsByEmployee([
      { id: 1, recruiter_id: 19 },
      { id: 2, recruiter_id: 19 },
      { id: 3, recruiter_id: 20 },
    ], names);

    expect(groups).toEqual([
      expect.objectContaining({ key: "19", employeeName: "Lily Rahjoo", slots: [{ id: 1, recruiter_id: 19 }, { id: 2, recruiter_id: 19 }] }),
      expect.objectContaining({ key: "20", employeeName: "Mina Pakdaman", slots: [{ id: 3, recruiter_id: 20 }] }),
    ]);
  });

  it("uses the backend effective employee timezone and preserves a compatible fallback", () => {
    expect(resolveTeamAvailabilityTimezone({
      timezone: null,
      effective_timezone: "America/Toronto",
    }, "America/Los_Angeles")).toBe("America/Toronto");
    expect(resolveTeamAvailabilityTimezone({ timezone: "Europe/Paris" }, "UTC")).toBe("Europe/Paris");
    expect(resolveTeamAvailabilityTimezone({ timezone: null }, "America/Chicago")).toBe("America/Chicago");
  });
});
