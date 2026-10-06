import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import ClientBookings from "./ClientBookings";
import api from "../../utils/api";

let mockSearch = "?site=studio&view=orders&order_id=901";
let mockRouteSlug = "";

jest.mock("react-router-dom", () => ({
  useNavigate: () => jest.fn(),
  useLocation: () => ({ search: mockSearch }),
  useParams: () => ({ slug: mockRouteSlug }),
}), { virtual: true });

jest.mock("../../utils/api", () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
}));

jest.mock("../../utils/timezone", () => ({ getUserTimezone: () => "America/Toronto" }));
jest.mock("../../utils/datetime", () => ({
  isoFromParts: jest.fn(),
  formatDate: (value) => value,
  formatTime: (value) => value,
}));
jest.mock("@mui/x-data-grid", () => ({
  DataGrid: ({ rows = [], columns = [] }) => (
    <div>
      {rows.map((row) => <div key={row.id}>{columns.map((column) => (
        typeof column.renderCell === "function"
          ? <div key={column.field}>{column.renderCell({ row, value: row[column.field] })}</div>
          : null
      ))}</div>)}
    </div>
  ),
}));

const order = (id, name = `Order item ${id}`) => ({
  id,
  display_number: `#${id}`,
  created_at: "2026-10-06T12:00:00Z",
  payment_status: "paid",
  payment_status_label: "Payment received",
  fulfillment_status: "pending",
  fulfillment_status_label: "Pending",
  delivery_method: "pickup",
  delivery_method_label: "Pickup",
  total_amount: "25.00",
  currency: "CAD",
  items: [{ id: id * 10, name, quantity: 1, unit_price: "25.00", total_price: "25.00" }],
  events: [],
});

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

function defaultApi(path) {
  if (path === "/api/client/bookings") return Promise.resolve({ data: { bookings: [] } });
  if (path === "/api/client/product-orders") return Promise.resolve({ data: { orders: [] } });
  if (path.endsWith("/digital-access")) return Promise.resolve({ data: { entitlements: [] } });
  const match = path.match(/^\/api\/client\/product-orders\/(\d+)$/);
  if (match) return Promise.resolve({ data: order(Number(match[1])) });
  return Promise.reject(new Error(`Unexpected request: ${path}`));
}

describe("ClientBookings order destinations", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSearch = "?site=studio&view=orders&order_id=901";
    mockRouteSlug = "";
    localStorage.clear();
    localStorage.setItem("token", "client-token-a");
    localStorage.setItem("role", "client");
    api.get.mockImplementation((path) => defaultApi(path));
  });

  it("fetches an order directly even when it is absent from the first list page", async () => {
    render(<ClientBookings />);

    expect(await screen.findByText("Order item 901")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Orders", hidden: true })).toHaveAttribute("aria-selected", "true");
    expect(api.get).toHaveBeenCalledWith(
      "/api/client/product-orders/901",
      expect.objectContaining({ params: { slug: "studio" } }),
    );
    expect(api.get).toHaveBeenCalledWith(
      "/api/client/product-orders/901/digital-access",
      expect.objectContaining({ params: { slug: "studio" } }),
    );
  });

  it.each([
    ["?site=studio&view=orders", "missing"],
    ["?site=studio&view=orders&order_id=0", "invalid"],
    ["?site=other&view=orders&order_id=901", "wrong tenant"],
  ])("shows a generic unavailable state for a %s order destination", async (search) => {
    mockSearch = search;
    render(<ClientBookings tenantSlug="studio" />);

    expect(await screen.findByText("This order is unavailable.")).toBeInTheDocument();
    expect(api.get).not.toHaveBeenCalledWith(
      expect.stringMatching(/^\/api\/client\/product-orders\/\d+$/),
      expect.anything(),
    );
  });

  it("does not make unscoped order requests when tenant context is missing", async () => {
    mockSearch = "?view=orders&order_id=901";
    render(<ClientBookings />);

    expect(await screen.findByText("This order is unavailable.")).toBeInTheDocument();
    expect(api.get).not.toHaveBeenCalledWith(
      expect.stringMatching(/^\/api\/client\/product-orders/),
      expect.anything(),
    );
  });

  it("uses a generic state for unauthorized or unavailable order details", async () => {
    api.get.mockImplementation((path) => {
      if (path === "/api/client/product-orders/901") {
        return Promise.reject({ response: { status: 403, data: { error: "private tenant detail" } } });
      }
      return defaultApi(path);
    });
    render(<ClientBookings />);

    expect(await screen.findByText("This order is unavailable.")).toBeInTheDocument();
    expect(screen.queryByText("private tenant detail")).not.toBeInTheDocument();
  });

  it("ignores stale responses after the tenant and requested order change", async () => {
    const oldRequest = deferred();
    api.get.mockImplementation((path) => {
      if (path === "/api/client/product-orders/901") return oldRequest.promise;
      if (path === "/api/client/product-orders/902") return Promise.resolve({ data: order(902) });
      return defaultApi(path);
    });
    const view = render(<ClientBookings />);
    await waitFor(() => expect(api.get).toHaveBeenCalledWith(
      "/api/client/product-orders/901",
      expect.objectContaining({ params: { slug: "studio" } }),
    ));

    mockSearch = "?site=other-studio&view=orders&order_id=902";
    view.rerender(<ClientBookings />);
    expect(await screen.findByText("Order item 902")).toBeInTheDocument();

    oldRequest.resolve({ data: order(901) });
    await waitFor(() => expect(screen.queryByText("Order item 901")).not.toBeInTheDocument());
    expect(screen.getByText("Order item 902")).toBeInTheDocument();
  });

  it("does not reopen a dismissed destination when its delayed response finishes", async () => {
    const detail = deferred();
    api.get.mockImplementation((path) => {
      if (path === "/api/client/product-orders/901") return detail.promise;
      return defaultApi(path);
    });
    const view = render(<ClientBookings />);
    await screen.findByRole("progressbar");
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    await waitFor(() => expect(screen.queryByRole("progressbar")).not.toBeInTheDocument());

    detail.resolve({ data: order(901) });
    view.rerender(<ClientBookings />);
    await waitFor(() => expect(screen.queryByText("Order item 901")).not.toBeInTheDocument());
    expect(api.get.mock.calls.filter(([path]) => path === "/api/client/product-orders/901")).toHaveLength(1);
  });
});
