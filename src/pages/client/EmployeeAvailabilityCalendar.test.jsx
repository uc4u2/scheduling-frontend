import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import EmployeeAvailabilityCalendar from "./EmployeeAvailabilityCalendar";
import { api } from "../../utils/api";

jest.mock(
  "react-router-dom",
  () => ({
    useParams: () => ({}),
    useNavigate: () => jest.fn(),
  }),
  { virtual: true }
);

jest.mock("../../utils/api", () => ({
  api: { get: jest.fn() },
}));

jest.mock("../../utils/timezone", () => ({
  getUserTimezone: () => "America/Toronto",
}));

const ymd = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;

describe("EmployeeAvailabilityCalendar", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    api.get.mockReset();
  });

  const mockAvailability = ({ timezone }) => {
    const todayKey = ymd(new Date());
    api.get.mockImplementation((url) => {
      if (url.endsWith("/availability")) {
        return Promise.resolve({
          data: {
            slots: [
              {
                date: todayKey,
                start_time: "09:00",
                end_time: "10:00",
                ...(timezone ? { timezone } : {}),
              },
            ],
          },
        });
      }
      if (url.includes("/availability-by-artist/")) {
        return Promise.resolve({ data: { slots: [] } });
      }
      if (url.includes("/service/")) {
        return Promise.resolve({ data: { name: "Consultation", base_price: 80 } });
      }
      return Promise.resolve({ data: {} });
    });
  };

  it("prefers the slot timezone over a different browser timezone", async () => {
    mockAvailability({ timezone: "America/Los_Angeles" });

    render(
      <EmployeeAvailabilityCalendar
        companySlug="test-studio"
        artistId="7"
        serviceId="12"
        serviceName="Consultation"
      />
    );

    expect(await screen.findByText("TZ: America/Los_Angeles")).toBeInTheDocument();
    expect(screen.queryByText("TZ: America/Toronto")).not.toBeInTheDocument();
  });

  it("falls back to the browser timezone when the slot timezone is missing", async () => {
    mockAvailability({ timezone: null });

    render(
      <EmployeeAvailabilityCalendar
        companySlug="test-studio"
        artistId="7"
        serviceId="12"
        serviceName="Consultation"
      />
    );

    expect(await screen.findByText("TZ: America/Toronto")).toBeInTheDocument();
  });

  it("keeps the calendar stable while another date loads and does not auto-scroll", async () => {
    const today = new Date();
    const todayKey = ymd(today);
    let dayRequestCount = 0;
    const pendingDayRequest = new Promise(() => {});
    const scrollIntoView = jest.fn();
    window.HTMLElement.prototype.scrollIntoView = scrollIntoView;

    api.get.mockImplementation((url) => {
      if (url.endsWith("/availability")) {
        dayRequestCount += 1;
        if (dayRequestCount > 1) return pendingDayRequest;
        return Promise.resolve({
          data: {
            slots: [
              {
                date: todayKey,
                start_time: "07:00",
                end_time: "08:00",
                timezone: "America/Toronto",
              },
            ],
          },
        });
      }
      if (url.includes("/availability-by-artist/")) {
        return Promise.resolve({ data: { slots: [] } });
      }
      if (url.includes("/service/")) {
        return Promise.resolve({ data: { name: "Consultation", base_price: 80 } });
      }
      return Promise.resolve({ data: {} });
    });

    render(
      <EmployeeAvailabilityCalendar
        companySlug="test-studio"
        artistId="7"
        serviceId="12"
        serviceName="Consultation"
      />
    );

    expect(await screen.findByText("Choose a time — Consultation")).toBeInTheDocument();
    expect(await screen.findByRole("button", { name: /^07:00/ })).toBeInTheDocument();
    expect(scrollIntoView).not.toHaveBeenCalled();

    const nextAvailableDateButton = screen
      .getAllByRole("button")
      .find((button) => button.getAttribute("aria-pressed") === "false" && !button.disabled);
    expect(nextAvailableDateButton).toBeTruthy();
    fireEvent.click(nextAvailableDateButton);

    expect(await screen.findByText("Checking this day…", {}, { timeout: 1500 })).toBeInTheDocument();
    expect(screen.getByLabelText("Previous month")).toBeInTheDocument();
    expect(screen.getByLabelText("Next month")).toBeInTheDocument();
    expect(scrollIntoView).not.toHaveBeenCalled();
    await waitFor(() => expect(dayRequestCount).toBe(2));
  });
});
