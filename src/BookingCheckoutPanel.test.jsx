import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ThemeProvider, createTheme } from "@mui/material/styles";

import api from "./utils/api";
import { BookingCheckoutPanel } from "./NewManagementDashboard";

jest.mock("./utils/api", () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
}));
jest.mock("jspdf", () => jest.fn());
jest.mock("html2canvas", () => jest.fn());
jest.mock("react-leaflet", () => ({}));
jest.mock("leaflet", () => ({}));
jest.mock("supercluster", () => jest.fn());
jest.mock("./pages/sections/management/WebsiteSuite", () => () => null);
jest.mock("axios", () => ({
  get: jest.fn(),
  post: jest.fn(),
  create: () => ({ get: jest.fn(), post: jest.fn(), interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } } }),
}));

let mockRouterLocation = { pathname: "/manager/booking-checkout", search: "" };
jest.mock(
  "react-router-dom",
  () => ({
    useNavigate: () => jest.fn(),
    useLocation: () => mockRouterLocation,
    Link: ({ children, ...props }) => <a {...props}>{children}</a>,
  }),
  { virtual: true }
);

jest.mock("@fullcalendar/react", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: React.forwardRef((props, ref) => {
      React.useImperativeHandle(ref, () => ({
        getApi: () => ({ today: jest.fn(), gotoDate: jest.fn(), changeView: jest.fn() }),
      }));
      return (
        <div data-testid="calendar">
          <button onClick={() => props.dateClick?.({ dateStr: "2026-10-13" })}>
            Select October 13
          </button>
          {props.events.map((event) => (
            <button
              key={event.id}
              onClick={() => props.eventClick?.({ event: { id: event.id, start: new Date(event.start) } })}
            >
              Calendar event {event.title}
            </button>
          ))}
        </div>
      );
    }),
  };
});

const bookings = [
  {
    id: 10,
    status: "completed",
    payment_status: "paid",
    start_iso_local: "2026-10-13T09:00:00-04:00",
    end_iso_local: "2026-10-13T10:00:00-04:00",
    local_date: "2026-10-13",
    local_start_time: "09:00",
    local_end_time: "10:00",
    service: { id: 3, name: "Haircut", base_price: 50 },
    client: { id: 4, full_name: "Ada Client", email: "ada@example.com" },
    recruiter: { id: 7, full_name: "Riley Artist" },
  },
  {
    id: 11,
    status: "cancelled",
    payment_status: "unpaid",
    start_iso_local: "2026-10-13T11:00:00-04:00",
    end_iso_local: "2026-10-13T12:00:00-04:00",
    local_date: "2026-10-13",
    local_start_time: "11:00",
    local_end_time: "12:00",
    service: { id: 5, name: "Consultation" },
    client: { id: 6, full_name: "Casey Client", email: "casey@example.com" },
    recruiter: { id: 7, full_name: "Riley Artist" },
  },
];

const renderPanel = (entry = "/manager/booking-checkout") => {
  const [pathname, search = ""] = entry.split("?");
  mockRouterLocation = { pathname, search: search ? `?${search}` : "" };
  return render(
    <ThemeProvider theme={createTheme()}>
      <BookingCheckoutPanel
        token="manager-token"
        currentUserInfo={{ id: 1, is_manager: true, can_manage_shifts: true }}
      />
    </ThemeProvider>
  );
};

describe("BookingCheckoutPanel", () => {
  beforeEach(() => {
    api.get.mockImplementation((url) => {
      if (url === "/api/manager/bookings") return Promise.resolve({ data: bookings });
      if (url === "/api/departments") return Promise.resolve({ data: [{ id: 2, name: "Salon" }] });
      if (url === "/manager/recruiters") {
        return Promise.resolve({ data: { recruiters: [{ id: 7, full_name: "Riley Artist", department_id: 2 }] } });
      }
      return Promise.reject(new Error(`Unexpected GET ${url}`));
    });
  });

  afterEach(() => jest.clearAllMocks());

  it("keeps filters collapsed and shows completed and cancelled bookings for the selected day", async () => {
    renderPanel();
    expect(screen.getByText("Filters & calendar options")).toBeInTheDocument();
    expect(screen.queryByLabelText("Department")).not.toBeVisible();

    fireEvent.click(await screen.findByText("Select October 13"));

    expect(await screen.findByText(/Bookings for Tuesday, October 13, 2026/)).toBeInTheDocument();
    expect(screen.getByText("Ada Client • Riley Artist")).toBeInTheDocument();
    expect(screen.getByText("Casey Client • Riley Artist")).toBeInTheDocument();
    expect(screen.getByText("completed")).toBeInTheDocument();
    expect(screen.getByText("cancelled")).toBeInTheDocument();
    expect(screen.getByText("paid")).toBeInTheDocument();
    expect(screen.getByText("unpaid")).toBeInTheDocument();
  });

  it("opens the same payment dialog from a day card and calendar event", async () => {
    renderPanel();
    fireEvent.click(await screen.findByText("Select October 13"));
    fireEvent.click(await screen.findByText("Ada Client • Riley Artist"));
    expect(await screen.findByRole("dialog", { name: "Collect Payment" })).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole("button", { name: "Close" })[0]);

    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Collect Payment" })).not.toBeInTheDocument());
    fireEvent.click(screen.getByText("Calendar event Haircut"));
    expect(await screen.findByRole("dialog", { name: "Collect Payment" })).toBeInTheDocument();
  });

  it("auto-opens an appointment deep link only once", async () => {
    renderPanel("/manager/booking-checkout?appointmentId=10");
    expect(await screen.findByRole("dialog", { name: "Collect Payment" })).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole("button", { name: "Close" })[0]);
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Collect Payment" })).not.toBeInTheDocument());
    fireEvent.click(screen.getByText("Refresh"));
    await waitFor(() => expect(api.get).toHaveBeenCalledWith("/api/manager/bookings"));
    expect(screen.queryByRole("dialog", { name: "Collect Payment" })).not.toBeInTheDocument();
  });
});
