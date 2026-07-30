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

import { mergeAvailabilityResponse } from "./ServiceDetails";

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
});
