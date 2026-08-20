jest.mock("../../utils/api", () => ({
  __esModule: true,
  api: {},
  publicSite: {},
}));

jest.mock("react-router-dom", () => ({
  useParams: () => ({ slug: "sale", serviceId: "39" }),
  useSearchParams: () => [new URLSearchParams("")],
}), { virtual: true });

jest.mock("../../embed", () => ({
  useNavWithEmbed: () => jest.fn(),
}));

jest.mock("../../utils/tenant", () => ({
  getTenantHostMode: () => "custom",
}));

jest.mock("../../utils/timezone", () => ({
  getUserTimezone: () => "America/Toronto",
}));

import {
  buildServiceDetailsBookingParams,
  mergeAvailabilityResponse,
  aggregateAvailabilityByUTC,
} from "./ServiceDetails";

describe("ServiceDetails availability helpers", () => {
  test("keeps available group slots when seats are still left", () => {
    const merged = mergeAvailabilityResponse(
      {
        slots: [
          {
            date: "2026-08-01",
            start_time: "10:00",
            end_time: "14:00",
            timezone: "America/Toronto",
            start_utc: "2026-08-01T14:00:00Z",
            end_utc: "2026-08-01T18:00:00Z",
            mode: "group",
            seats_left: 6,
            type: "available",
          },
        ],
        booked: [],
        service_duration: 240,
      },
      240,
    );

    expect(merged).toHaveLength(1);
    expect(merged[0].type).toBe("available");
    expect(merged[0].seats_left).toBe(6);
  });

  test("preserves canonical provider availability fields through aggregation and booking handoff", () => {
    const aggregated = aggregateAvailabilityByUTC(
      "2026-09-19",
      [
        {
          emp: {
            id: 16,
            full_name: "Zahra",
            profile_image_url: "",
          },
          slots: [
            {
              availability_id: 5112,
              date: "2026-09-19",
              start_time: "10:00",
              end_time: "22:00",
              start_utc: "2026-09-19T14:00:00Z",
              end_utc: "2026-09-20T02:00:00Z",
              timezone: "America/Toronto",
              type: "available",
              mode: "group",
              seats_left: 1,
              service_id: 105,
            },
          ],
        },
      ],
      105,
    );

    expect(aggregated).toHaveLength(1);
    expect(aggregated[0].providers).toHaveLength(1);
    expect(aggregated[0].providers[0].availability_id).toBe(5112);
    expect(aggregated[0].providers[0].end_utc).toBe("2026-09-20T02:00:00Z");
    expect(aggregated[0].providers[0].end_time).toBe("22:00");

    const params = buildServiceDetailsBookingParams({
      slot: aggregated[0],
      artist: { id: 16, timezone: "America/Toronto" },
      serviceId: 105,
      departmentId: "",
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
  });
});
