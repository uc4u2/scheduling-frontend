import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ThemeProvider, createTheme } from "@mui/material/styles";

import api from "../../utils/api";
import AllEmployeeSlotsCalendar from "./AllEmployeeSlotsCalendar";

let mockFullCalendarProps;

jest.mock("../../utils/api", () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  patch: jest.fn(),
  delete: jest.fn(),
}));

jest.mock("./SecondMasterCalendar", () => ({
  useRecruiterMeetingHandler: () => ({
    handleRecruiterSaveMeeting: jest.fn(),
    handleRecruiterDirectBooking: jest.fn(),
  }),
}));

jest.mock("@fullcalendar/react", () => {
  const ReactModule = require("react");
  return ReactModule.forwardRef((props, ref) => {
    mockFullCalendarProps = props;
    ReactModule.useImperativeHandle(ref, () => ({
      getApi: () => ({ changeView: jest.fn(), today: jest.fn() }),
    }));
    return (
      <div data-testid="team-calendar">
        <div data-testid="calendar-timezone">{props.timeZone}</div>
        <button
          type="button"
          data-testid="select-october-14"
          onClick={() => props.dateClick({
            date: new Date("2026-10-14T04:00:00.000Z"),
            dateStr: "2026-10-14T00:00:00-04:00",
          })}
        >
          Select October 14
        </button>
        {props.events.map((event) => (
          <div key={event.id}>
            {props.eventContent({
              event: { id: event.id, extendedProps: event.extendedProps },
              timeText: "11:00",
            })}
          </div>
        ))}
      </div>
    );
  });
});

jest.mock("xlsx", () => ({
  utils: { json_to_sheet: jest.fn(), book_new: jest.fn(), book_append_sheet: jest.fn() },
  writeFile: jest.fn(),
}));
jest.mock("jspdf", () => jest.fn());
jest.mock("jspdf-autotable", () => ({}));

describe("AllEmployeeSlotsCalendar presentation", () => {
  beforeEach(() => {
    mockFullCalendarProps = null;
    window.matchMedia = jest.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));
    localStorage.setItem("timezone", "America/Toronto");
    api.get.mockImplementation((url) => {
      if (url === "/api/departments") return Promise.resolve({ data: [{ id: 7, name: "Salon" }] });
      if (url === "/manager/recruiters") {
        return Promise.resolve({ data: { recruiters: [{ id: 19, first_name: "Lily", last_name: "Rahjoo", department_id: 7 }] } });
      }
      if (url === "/manager/calendar") {
        return Promise.resolve({
          data: {
            events: [{
              id: "avail-1-free-0",
              booked: false,
              recruiter_id: 19,
              department_id: 7,
              date: "2026-10-09",
              start_time: "11:00",
              end_time: "11:30",
              start: "2026-10-09T11:00:00-04:00",
              end: "2026-10-09T11:30:00-04:00",
              timezone: "America/Toronto",
            }],
          },
        });
      }
      if (url === "/api/manager/bookings") return Promise.resolve({ data: [] });
      if (url === "/recruiter/profile") return Promise.resolve({ data: { recruiter: { is_manager: true } } });
      if (url === "/api/employee/permissions") return Promise.resolve({ data: { can_close_slots: true, can_edit_availability: true } });
      return Promise.resolve({ data: {} });
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    window.history.replaceState({}, "", "/");
  });

  it("shows employee names instead of internal ids and keeps filters collapsed", async () => {
    render(
      <ThemeProvider theme={createTheme()}>
        <AllEmployeeSlotsCalendar token="manager-token" timezone="America/Toronto" />
      </ThemeProvider>
    );

    expect((await screen.findAllByText("Lily Rahjoo")).length).toBeGreaterThan(0);
    expect(screen.queryByText(/Emp 19/)).not.toBeInTheDocument();
    expect(screen.queryByText(/• 19(?:\s|$)/)).not.toBeInTheDocument();
    expect(screen.getByText("Filters & calendar options")).toBeInTheDocument();
    expect(screen.getByText("Calendar timezone: America/Toronto")).toBeInTheDocument();
    expect(await screen.findByTestId("team-calendar")).toBeInTheDocument();
    expect(mockFullCalendarProps.height).toBe(540);
    expect(mockFullCalendarProps.expandRows).toBe(true);
    expect(mockFullCalendarProps.dayMaxEvents).toBe(true);
  });

  it("opens a mobile deep link on the requested employee/day and scrolls to daily slots", async () => {
    window.history.replaceState(
      {},
      "",
      "/manager/advanced-management?panel=slots&recruiterId=19&date=2026-10-09&focus=day-slots"
    );
    window.matchMedia = jest.fn().mockImplementation((query) => ({
      matches: query.includes("max-width"),
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));
    window.requestAnimationFrame = (callback) => callback();
    Element.prototype.scrollIntoView = jest.fn();

    render(
      <ThemeProvider theme={createTheme()}>
        <AllEmployeeSlotsCalendar token="manager-token" timezone="America/Toronto" />
      </ThemeProvider>
    );

    await waitFor(() => expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({
      behavior: "smooth",
      block: "start",
    }));
    fireEvent.click(screen.getByText("Filters & calendar options"));
    expect(screen.getByLabelText("Employee")).toHaveTextContent("Lily Rahjoo");
    expect(screen.getByText(/Friday, October 9, 2026/)).toBeInTheDocument();
  });

  it("uses the selected employee timezone for display, day grouping, and mutation dates", async () => {
    localStorage.setItem("timezone", "America/Los_Angeles");
    api.get.mockImplementation((url) => {
      if (url === "/api/departments") return Promise.resolve({ data: [{ id: 7, name: "Salon" }] });
      if (url === "/manager/recruiters") {
        return Promise.resolve({ data: { recruiters: [{
          id: 19,
          first_name: "Lily",
          last_name: "Rahjoo",
          department_id: 7,
          timezone: null,
          effective_timezone: "America/Toronto",
        }] } });
      }
      if (url === "/manager/calendar") {
        return Promise.resolve({ data: { events: [{
          id: "avail-midnight",
          booked: false,
          recruiter_id: 19,
          department_id: 7,
          date: "2026-10-14",
          start_time: "00:30",
          end_time: "01:00",
          start: "2026-10-14T00:30:00-04:00",
          end: "2026-10-14T01:00:00-04:00",
          timezone: "America/Toronto",
        }] } });
      }
      if (url === "/api/manager/bookings") return Promise.resolve({ data: [] });
      if (url === "/recruiter/profile") return Promise.resolve({ data: { recruiter: { is_manager: true } } });
      if (url === "/api/employee/permissions") return Promise.resolve({ data: { can_close_slots: true, can_edit_availability: true } });
      return Promise.resolve({ data: {} });
    });
    api.post.mockResolvedValue({ data: { deleted: 1, skipped_booked: 0 } });

    render(
      <ThemeProvider theme={createTheme()}>
        <AllEmployeeSlotsCalendar token="manager-token" timezone="America/Los_Angeles" />
      </ThemeProvider>
    );

    await screen.findByTestId("team-calendar");
    fireEvent.click(screen.getByText("Filters & calendar options"));
    fireEvent.mouseDown(screen.getByLabelText("Employee"));
    fireEvent.click(await screen.findByRole("option", { name: "Lily Rahjoo" }));

    await waitFor(() => expect(screen.getByTestId("calendar-timezone")).toHaveTextContent("America/Toronto"));
    expect(mockFullCalendarProps.events[0].start).toBe("2026-10-14T00:30:00-04:00");

    fireEvent.click(screen.getByTestId("select-october-14"));
    expect(await screen.findByText(/Wednesday, October 14, 2026/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Close day" }));
    fireEvent.click(screen.getByRole("button", { name: "Apply" }));
    await waitFor(() => expect(api.post).toHaveBeenCalledWith(
      "/api/manager/availability/close-day",
      { recruiter_id: 19, date: "2026-10-14" },
      expect.any(Object)
    ));
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Close entire day" })).not.toBeInTheDocument());
    expect(api.delete).not.toHaveBeenCalled();

    api.post.mockRejectedValueOnce({ response: { data: { error: "Protection check failed" } } });
    fireEvent.click(screen.getByRole("button", { name: "Close day" }));
    fireEvent.click(screen.getByRole("button", { name: "Apply" }));
    expect(await screen.findByText("Protection check failed")).toBeInTheDocument();
    expect(api.delete).not.toHaveBeenCalled();
  });
});
