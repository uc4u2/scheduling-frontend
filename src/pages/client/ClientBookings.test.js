import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import ClientBookings from "./ClientBookings";
import api from "../../utils/api";

jest.mock(
  "react-router-dom",
  () => ({
    useNavigate: () => jest.fn(),
    useLocation: () => ({ search: "?page=my-bookings" }),
    useParams: () => ({ slug: "sale" }),
  }),
  { virtual: true }
);

jest.mock("../../utils/api", () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

jest.mock("../../utils/timezone", () => ({
  getUserTimezone: () => "America/Toronto",
}));

jest.mock("../../utils/datetime", () => ({
  isoFromParts: jest.fn(),
  formatDate: (value) => value,
  formatTime: (value) => value,
}));

jest.mock("@mui/x-data-grid", () => ({
  DataGrid: ({ rows = [], columns = [] }) => (
    <div>
      {rows.map((row) => (
        <div key={row.id}>
          {columns.map((column) => {
            if (typeof column.renderCell === "function") {
              return (
                <div key={column.field}>
                  {column.renderCell({ row, value: row[column.field] })}
                </div>
              );
            }
            return null;
          })}
        </div>
      ))}
    </div>
  ),
}));

describe("ClientBookings", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.localStorage.clear();
    window.localStorage.setItem("token", "token-123");
    window.localStorage.setItem("role", "client");
  });

  test("sends tenant slug when posting a booking note", async () => {
    api.get
      .mockResolvedValueOnce({
        data: {
          bookings: [
            {
              id: 7,
              status: "booked",
              local_date: "2026-04-10",
              local_start_time: "10:00",
              local_end_time: "11:00",
              recruiter: "Ava Artist",
            },
          ],
        },
      })
      .mockResolvedValueOnce({ data: { orders: [] } })
      .mockResolvedValueOnce({
        data: {
          id: 7,
          status: "booked",
          local_date: "2026-04-10",
          local_start_time: "10:00",
          local_end_time: "11:00",
          recruiter: "Ava Artist",
        },
      });
    api.post.mockResolvedValueOnce({ data: { message: "ok" } });

    render(
      <ClientBookings />
    );

    await waitFor(() => expect(api.get).toHaveBeenCalledWith(
      "/api/client/bookings",
      expect.objectContaining({ params: { slug: "sale" } })
    ));

    fireEvent.click(screen.getByRole("button", { name: /view/i }));

    await screen.findByLabelText(/send a note to your provider/i);
    fireEvent.change(screen.getByLabelText(/send a note to your provider/i), {
      target: { value: "Please ring the bell." },
    });
    fireEvent.click(screen.getByRole("button", { name: /send note/i }));

    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith(
        "/api/client/bookings/7/note",
        { note: "Please ring the bell." },
        expect.objectContaining({ params: { slug: "sale" } })
      )
    );
  });

  test("renders variant snapshot details in the client order detail dialog", async () => {
    api.get
      .mockResolvedValueOnce({
        data: {
          bookings: [],
        },
      })
      .mockResolvedValueOnce({
        data: {
          orders: [
            {
              id: 51,
              display_number: "#51",
              created_at: "2026-08-03T13:00:00Z",
              payment_status: "paid",
              payment_status_label: "Payment received",
              fulfillment_status: "pending",
              fulfillment_status_label: "Pending",
              delivery_method: "shipping",
              delivery_method_label: "Shipping",
              total_amount: "158.00",
              currency: "CAD",
            },
          ],
        },
      })
      .mockResolvedValueOnce({
        data: {
          id: 51,
          display_number: "#51",
          created_at: "2026-08-03T13:00:00Z",
          payment_status: "paid",
          payment_status_label: "Payment received",
          fulfillment_status: "pending",
          fulfillment_status_label: "Pending",
          delivery_method: "shipping",
          delivery_method_label: "Shipping",
          total_amount: "158.00",
          currency: "CAD",
          shipping: {
            name: "Ava Client",
            address1: "10 Queen St",
            city: "Toronto",
            region: "ON",
            postal_code: "M5H 2N2",
            country: "CA",
          },
          items: [
            {
              id: 701,
              name: "Carry Bag",
              quantity: 2,
              unit_price: "79.00",
              total_price: "158.00",
              variant_label_snapshot: "Black / Mini",
              variant_sku_snapshot: "BAG-BLACK-MINI",
              variant_options_snapshot: [
                { option_name: "Colour", value: "Black" },
                { option_name: "Size", value: "Mini" },
              ],
            },
          ],
          events: [
            { id: 1, event_type: "checkout.session.completed", created_at: "2026-08-03T13:00:30Z" },
            { id: 2, event_type: "inventory.committed", created_at: "2026-08-03T13:01:00Z" },
          ],
        },
      })
      .mockResolvedValueOnce({
        data: {
          entitlements: [],
        },
      });

    render(<ClientBookings />);

    await waitFor(() =>
      expect(api.get).toHaveBeenCalledWith(
        "/api/client/product-orders",
        expect.objectContaining({
          headers: expect.any(Object),
          params: expect.objectContaining({ slug: "sale" }),
        })
      )
    );

    fireEvent.click(screen.getByRole("tab", { name: /orders/i }));
    expect(await screen.findByText(/payment received/i)).toBeInTheDocument();
    const viewButtons = await screen.findAllByRole("button", { name: /view/i });
    fireEvent.click(viewButtons[0]);

    expect(await screen.findByText(/black \/ mini/i)).toBeInTheDocument();
    expect(screen.getByText(/variant sku:\s*bag-black-mini/i)).toBeInTheDocument();
    expect(screen.getByText(/colour: black • size: mini/i)).toBeInTheDocument();
    expect(screen.getByText(/line total:\s*CA\$158\.00/i)).toBeInTheDocument();
    expect(screen.getByText(/payment confirmed/i)).toBeInTheDocument();
    expect(screen.getByText(/order confirmed/i)).toBeInTheDocument();
    expect(screen.queryByText(/checkout\.session\.completed/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/inventory\.committed/i)).not.toBeInTheDocument();
  });

  test("shows clearer pickup guidance when pickup instructions are not provided", async () => {
    api.get
      .mockResolvedValueOnce({ data: { bookings: [] } })
      .mockResolvedValueOnce({
        data: {
          orders: [
            {
              id: 52,
              display_number: "#52",
              created_at: "2026-08-05T19:05:00Z",
              payment_status: "paid",
              payment_status_label: "Payment received",
              fulfillment_status: "pending",
              fulfillment_status_label: "Pending",
              delivery_method: "pickup",
              delivery_method_label: "Pickup",
              total_amount: "1.00",
              currency: "CAD",
            },
          ],
        },
      })
      .mockResolvedValueOnce({
        data: {
          id: 52,
          display_number: "#52",
          created_at: "2026-08-05T19:05:00Z",
          payment_status: "paid",
          payment_status_label: "Payment received",
          fulfillment_status: "pending",
          fulfillment_status_label: "Pending",
          delivery_method: "pickup",
          delivery_method_label: "Pickup",
          total_amount: "1.00",
          currency: "CAD",
          items: [
            {
              id: 702,
              name: "Live QA Physical Product 2026-08-05",
              quantity: 1,
              unit_price: "1.00",
              total_price: "1.00",
            },
          ],
          events: [],
        },
      })
      .mockResolvedValueOnce({ data: { entitlements: [] } });

    render(<ClientBookings />);

    fireEvent.click(await screen.findByRole("tab", { name: /orders/i }));
    const viewButtons = await screen.findAllByRole("button", { name: /view/i });
    fireEvent.click(viewButtons[0]);

    expect(await screen.findByText(/this order is marked for pickup\./i)).toBeInTheDocument();
    expect(screen.getByText(/we’ll update this page when it is ready\./i)).toBeInTheDocument();
  });
});
