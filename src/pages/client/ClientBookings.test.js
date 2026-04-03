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
});
