import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import ManagerTicketsView from "./ManagerTicketsView";

const mockApiGet = jest.fn();
const mockApiPost = jest.fn();

jest.mock("react-router-dom", () => ({
  useLocation: () => ({ search: "" }),
}), { virtual: true });

jest.mock("../../../utils/api", () => ({
  __esModule: true,
  default: {
    get: (...args) => mockApiGet(...args),
    post: (...args) => mockApiPost(...args),
    delete: jest.fn(),
  },
}));

describe("ManagerTicketsView", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockApiGet.mockResolvedValue({ data: { tickets: [] } });
  });

  test("explains why a ticket with no description was not submitted", async () => {
    render(<ManagerTicketsView />);

    fireEvent.click(screen.getByRole("button", { name: "Create Ticket" }));

    expect(
      await screen.findByText("Describe what you need help with before creating the ticket.")
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Describe the issue/)).toHaveAttribute("aria-invalid", "true");
    expect(mockApiPost).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText(/Describe the issue/), {
      target: { value: "Please add a downloadable product." },
    });

    await waitFor(() => {
      expect(
        screen.queryByText("Describe what you need help with before creating the ticket.")
      ).not.toBeInTheDocument();
    });
  });
});
