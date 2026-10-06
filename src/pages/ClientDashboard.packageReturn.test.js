import React from "react";
import { render, screen, waitFor } from "@testing-library/react";

import api from "../utils/api";
import ClientDashboard from "./ClientDashboard";

jest.mock("../utils/api", () => ({
  __esModule: true,
  default: { get: jest.fn() },
}));

jest.mock("react-router-dom", () => ({
  useLocation: () => ({ search: "?site=studio" }),
  useNavigate: () => jest.fn(),
  useParams: () => ({ slug: "studio" }),
}), { virtual: true });

jest.mock("./client/ClientDashboardOverview", () => () => <div>Overview</div>);
jest.mock("./client/ClientBookings", () => () => <div>Bookings</div>);
jest.mock("./client/ClientNotifications", () => () => <div>Notifications</div>);
jest.mock("./client/ClientProfile", () => () => <div>Profile</div>);

describe("package-return dashboard acceptance", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    localStorage.setItem("token", "client-token");
    localStorage.setItem("role", "client");
    window.history.replaceState({}, "", "/dashboard?site=studio#packages");
  });

  it("selects Packages, loads the tenant package list, and does not create a recursive frame", async () => {
    api.get.mockResolvedValue({
      data: [{
        id: 7,
        remaining: 3,
        template: {
          name: "Salon Care Pack",
          session_qty: 3,
          service: { name: "Blow-Dry" },
        },
      }],
    });

    const { container } = render(<ClientDashboard />);

    await waitFor(() => expect(screen.getByRole("tab", { name: "Packages" })).toHaveAttribute(
      "aria-selected",
      "true",
    ));
    expect(await screen.findByRole("heading", { name: "My Packages" })).toBeInTheDocument();
    expect(await screen.findByText("Salon Care Pack")).toBeInTheDocument();
    expect(api.get).toHaveBeenCalledWith("/me/packages", { params: { slug: "studio" } });
    // A recursive frame can have any tenant-provided title, so assert the element itself is absent.
    // eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
    expect(container.querySelector("iframe")).toBeNull();
  });
});
