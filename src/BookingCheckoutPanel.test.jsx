import React from "react";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
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
        <div data-testid="calendar" data-timezone={props.timeZone}>
          <button onClick={() => props.dateClick?.({ dateStr: "2026-10-13" })}>
            Select October 13
          </button>
          <button onClick={() => props.moreLinkClick?.({ date: new Date("2026-10-13T12:00:00Z"), jsEvent: { preventDefault: jest.fn() } })}>
            More October 13 bookings
          </button>
          {props.events.map((event) => (
            <button
              key={event.id}
              onClick={() => props.eventClick?.({ event: { id: event.id, start: new Date(event.start) }, jsEvent: { preventDefault: jest.fn() } })}
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
    id: 12,
    status: "booked",
    payment_status: "unpaid",
    start_iso_local: "2026-10-14T00:30:00-04:00",
    end_iso_local: "2026-10-14T01:30:00-04:00",
    local_date: "2026-10-14",
    local_start_time: "00:30",
    local_end_time: "01:30",
    service: { id: 8, name: "Late service" },
    client: { id: 9, full_name: "Night Client", email: "night@example.com" },
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

const setMobileViewport = (mobile) => {
  window.matchMedia = jest.fn().mockImplementation((query) => ({
    matches: mobile && query.includes("max-width"),
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  }));
};

const renderPanel = (
  entry = "/manager/booking-checkout",
  currentUserInfo = { id: 1, is_manager: true, can_manage_shifts: true }
) => {
  const [pathname, search = ""] = entry.split("?");
  mockRouterLocation = { pathname, search: search ? `?${search}` : "" };
  return render(
    <ThemeProvider theme={createTheme()}>
      <BookingCheckoutPanel
        token="manager-token"
        currentUserInfo={currentUserInfo}
      />
    </ThemeProvider>
  );
};

describe("BookingCheckoutPanel", () => {
  beforeEach(() => {
    setMobileViewport(false);
    window.requestAnimationFrame = (callback) => callback();
    Element.prototype.scrollIntoView = jest.fn();
    api.get.mockImplementation((url) => {
      if (url === "/api/manager/bookings") return Promise.resolve({ data: bookings });
      if (url === "/api/departments") return Promise.resolve({ data: [{ id: 2, name: "Salon" }] });
      if (url === "/manager/recruiters") {
        return Promise.resolve({
          data: {
            recruiters: [{
              id: 7,
              first_name: "Riley",
              last_name: "Artist",
              department_id: 2,
              timezone: "America/Toronto",
              effective_timezone: "America/Toronto",
            }],
          },
        });
      }
      if (url === "/manager/calendar") {
        return Promise.resolve({
          data: {
            events: [
              { recruiter_id: 7, date: "2026-10-13", booked: false },
              { recruiter_id: 7, date: "2026-10-13", booked: true },
            ],
          },
        });
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

  it("selects and scrolls to mobile day bookings without opening the payment dialog", async () => {
    setMobileViewport(true);
    renderPanel();

    fireEvent.click(await screen.findByText("Calendar event Haircut"));

    expect(await screen.findByText(/Bookings for Tuesday, October 13, 2026/)).toBeInTheDocument();
    expect(screen.queryByRole("dialog", { name: "Collect Payment" })).not.toBeInTheDocument();
    expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth", block: "start" });

    Element.prototype.scrollIntoView.mockClear();
    fireEvent.click(screen.getByText("More October 13 bookings"));
    expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth", block: "start" });

    fireEvent.click(screen.getByText("Ada Client • Riley Artist"));
    expect(await screen.findByRole("dialog", { name: "Collect Payment" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Close payment details" })).toBeInTheDocument();
  });

  it("preserves the existing payment-link payload from a selected-day booking card", async () => {
    api.post.mockResolvedValueOnce({ data: { checkout_url: "https://payments.example.test/session" } });
    renderPanel();
    fireEvent.click(await screen.findByText("Select October 13"));
    fireEvent.click(await screen.findByText("Casey Client • Riley Artist"));
    const dialog = await screen.findByRole("dialog", { name: "Collect Payment" });
    fireEvent.change(within(dialog).getByLabelText("Base amount"), { target: { value: "25" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Create payment link", exact: true }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith("/api/manager/manual-payments", {
        appointment_id: 11,
        currency: "USD",
        description: "Booking #11 • Consultation",
        amount_cents: 2500,
        client_id: 6,
      });
    });
    expect(await within(dialog).findByDisplayValue("https://payments.example.test/session")).toBeInTheDocument();
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

  it("requires one employee and lets a shift manager close a day through the canonical endpoint", async () => {
    api.post.mockResolvedValueOnce({ data: { deleted: 0, skipped_booked: 2 } });
    renderPanel(
      "/manager/booking-checkout",
      { id: 8, is_manager: false, can_manage_shifts: true, can_collect_payments_self: false }
    );

    expect(await screen.findByText(/cannot be changed for All Employees/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Close Day" })).toBeDisabled();

    fireEvent.click(screen.getByText("Filters & calendar options"));
    fireEvent.mouseDown(screen.getByLabelText("Employee"));
    fireEvent.click(await screen.findByRole("option", { name: "Riley Artist" }));
    fireEvent.click(screen.getByText("Select October 13"));

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith("/manager/calendar", {
        params: { recruiter_id: 7, view: "fragments" },
      });
    });
    expect(await screen.findByText("1 available fragment")).toBeInTheDocument();
    expect(screen.getByText("1 booked fragment")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Close Day" }));
    const dialog = await screen.findByRole("dialog", { name: "Close availability for this day?" });
    expect(within(dialog).getByText(/Riley Artist.*America\/Toronto/)).toBeInTheDocument();
    expect(within(dialog).getByText(/Existing bookings are not cancelled/i)).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole("button", { name: "Close Day" }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith("/api/manager/availability/close-day", {
        recruiter_id: 7,
        date: "2026-10-13",
      });
    });
    expect(await screen.findByText(/0 free slots removed; 2 booked slots preserved/i)).toBeInTheDocument();
  });

  it("does not expose availability mutations to a self-payment-only employee", async () => {
    renderPanel(
      "/manager/booking-checkout",
      { id: 7, is_manager: false, can_manage_shifts: false, can_collect_payments_self: true }
    );
    await screen.findByText("Booking Checkout Calendar");
    expect(screen.queryByText(/Availability for/)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Close Day" })).not.toBeInTheDocument();
  });

  it("submits the employee-local keep range without legacy fallbacks", async () => {
    api.post.mockResolvedValueOnce({ data: { deleted: 3, skipped_booked: 1 } });
    renderPanel();
    fireEvent.click(screen.getByText("Filters & calendar options"));
    fireEvent.mouseDown(screen.getByLabelText("Employee"));
    fireEvent.click(await screen.findByRole("option", { name: "Riley Artist" }));
    fireEvent.click(screen.getByText("Select October 13"));

    fireEvent.click(screen.getByRole("button", { name: "Edit Available Window" }));
    const dialog = await screen.findByRole("dialog", { name: "Edit available window" });
    expect(within(dialog).getByText(/does not create, extend, or reopen availability/i)).toBeInTheDocument();
    fireEvent.change(within(dialog).getByLabelText("Start time"), { target: { value: "10:00" } });
    fireEvent.change(within(dialog).getByLabelText("End time"), { target: { value: "16:00" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Keep This Window" }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith("/api/manager/availability/keep-range", {
        recruiter_id: 7,
        date: "2026-10-13",
        start_time: "10:00",
        end_time: "16:00",
      });
    });
    expect(await screen.findByText(/3 free slots removed; 1 booked slot preserved/i)).toBeInTheDocument();
  });

  it("uses the employee timezone for a midnight booking and the availability date", async () => {
    api.post.mockResolvedValueOnce({ data: { deleted: 0, skipped_booked: 1 } });
    renderPanel();
    fireEvent.click(screen.getByText("Filters & calendar options"));
    fireEvent.mouseDown(screen.getByLabelText("Employee"));
    fireEvent.click(await screen.findByRole("option", { name: "Riley Artist" }));

    expect(screen.getByTestId("calendar")).toHaveAttribute(
      "data-timezone",
      "America/Toronto"
    );
    fireEvent.click(screen.getByText("Calendar event Late service"));
    const paymentDialog = await screen.findByRole("dialog", { name: "Collect Payment" });
    fireEvent.click(within(paymentDialog).getByRole("button", { name: "Close" }));
    await waitFor(() =>
      expect(screen.queryByRole("dialog", { name: "Collect Payment" })).not.toBeInTheDocument()
    );
    expect(
      await screen.findByText(/Bookings for Wednesday, October 14, 2026/)
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Close Day" }));
    const availabilityDialog = await screen.findByRole("dialog", {
      name: "Close availability for this day?",
    });
    fireEvent.click(within(availabilityDialog).getByRole("button", { name: "Close Day" }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith("/api/manager/availability/close-day", {
        recruiter_id: 7,
        date: "2026-10-14",
      });
    });
  });

  it("ignores an availability mutation response after the selected day changes", async () => {
    let resolveMutation;
    api.post.mockReturnValueOnce(new Promise((resolve) => { resolveMutation = resolve; }));
    renderPanel();
    fireEvent.click(screen.getByText("Filters & calendar options"));
    fireEvent.mouseDown(screen.getByLabelText("Employee"));
    fireEvent.click(await screen.findByRole("option", { name: "Riley Artist" }));

    fireEvent.click(screen.getByRole("button", { name: "Close Day" }));
    const dialog = await screen.findByRole("dialog", { name: "Close availability for this day?" });
    fireEvent.click(within(dialog).getByRole("button", { name: "Close Day" }));
    fireEvent.click(screen.getByText("Select October 13"));
    resolveMutation({ data: { deleted: 9, skipped_booked: 0 } });

    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Close availability for this day?" })).not.toBeInTheDocument());
    expect(screen.queryByText(/9 free slots removed/i)).not.toBeInTheDocument();
  });
});
