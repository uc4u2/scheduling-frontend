import { buildEmployeeProfileBookingParams } from "../../utils/employeeBookingParams";

describe("buildEmployeeProfileBookingParams", () => {
  it("preserves canonical availability fields for the /book handoff", () => {
    const params = buildEmployeeProfileBookingParams({
      searchParams: new URLSearchParams("embed=1&primary=%231976d2&text=light"),
      employeeId: 16,
      serviceId: 105,
      departmentId: "9",
      slot: {
        date: "2026-09-19",
        start_time: "10:00",
        end_time: "22:00",
        start_utc: "2026-09-19T14:00:00Z",
        end_utc: "2026-09-20T02:00:00Z",
        availability_id: 5112,
        timezone: "America/Toronto",
      },
    });

    expect(params.get("employee_id")).toBe("16");
    expect(params.get("service_id")).toBe("105");
    expect(params.get("date")).toBe("2026-09-19");
    expect(params.get("start_time")).toBe("10:00");
    expect(params.get("end_time")).toBe("22:00");
    expect(params.get("start_utc")).toBe("2026-09-19T14:00:00Z");
    expect(params.get("end_utc")).toBe("2026-09-20T02:00:00Z");
    expect(params.get("availability_id")).toBe("5112");
    expect(params.get("timezone")).toBe("America/Toronto");
    expect(params.get("department_id")).toBe("9");
    expect(params.get("embed")).toBe("1");
    expect(params.get("primary")).toBe("#1976d2");
    expect(params.get("text")).toBe("light");
  });
});
