import { formatEmailSdrDateTime } from "./emailSdrDateTime";

describe("formatEmailSdrDateTime", () => {
  test("treats timezone-less API timestamps as UTC and displays Toronto time", () => {
    expect(
      formatEmailSdrDateTime("2026-09-25T22:06:31.321824", "America/Toronto")
    ).toBe("Sep 25, 2026, 6:06:31 PM (America/Toronto)");
  });

  test("respects daylight-saving offsets instead of applying a fixed offset", () => {
    expect(
      formatEmailSdrDateTime("2026-12-25T22:06:31", "America/Toronto")
    ).toBe("Dec 25, 2026, 5:06:31 PM (America/Toronto)");
  });

  test("preserves an explicit UTC timestamp contract", () => {
    expect(
      formatEmailSdrDateTime("2026-09-25T22:06:31Z", "America/Toronto")
    ).toBe("Sep 25, 2026, 6:06:31 PM (America/Toronto)");
  });

  test("returns a stable empty value", () => {
    expect(formatEmailSdrDateTime(null, "America/Toronto")).toBe("Not set");
  });
});
