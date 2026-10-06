import React from "react";
import { render, screen, waitFor } from "@testing-library/react";

import ClientDashboard from "./ClientDashboard";

jest.mock("react-router-dom", () => ({
  useLocation: () => ({ search: "?site=studio&view=orders&order_id=901" }),
  useNavigate: () => jest.fn(),
}), { virtual: true });

jest.mock("./client/ClientDashboardOverview", () => () => <div>Overview</div>);
jest.mock("./client/ClientBookings", () => ({ tenantSlug }) => (
  <div>Order destination for {tenantSlug}</div>
));
jest.mock("./client/ClientNotifications", () => () => <div>Notifications</div>);
jest.mock("./client/ClientProfile", () => () => <div>Profile</div>);
jest.mock("./client/ClientPackages", () => () => <div>Packages</div>);

describe("ClientDashboard order destination", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("token", "client-token");
    localStorage.setItem("role", "client");
  });

  it("selects the outer Bookings tab and propagates the tenant", async () => {
    render(<ClientDashboard />);

    await waitFor(() => expect(screen.getByRole("tab", { name: "Bookings" }))
      .toHaveAttribute("aria-selected", "true"));
    expect(screen.getByText("Order destination for studio")).toBeInTheDocument();
  });
});
