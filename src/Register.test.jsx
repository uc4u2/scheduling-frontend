import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import Register from "./Register";
import api from "./utils/api";

jest.mock(
  "react-router-dom",
  () => {
    const mockReact = require("react");
    return {
      Link: mockReact.forwardRef(({ children, ...props }, ref) => <a ref={ref} {...props}>{children}</a>),
      useNavigate: () => jest.fn(),
      useSearchParams: () => [new URLSearchParams()],
    };
  },
  { virtual: true },
);

jest.mock("./utils/api", () => ({
  __esModule: true,
  default: { post: jest.fn() },
}));

jest.mock("./utils/authRedirect", () => ({
  getSessionUser: jest.fn().mockResolvedValue(null),
  getAuthRedirectTarget: jest.fn(),
}));

jest.mock("./analytics/ga", () => ({
  trackGAEvent: jest.fn(),
  trackGAEventOnce: jest.fn(),
}));

jest.mock("./config/origins", () => ({
  buildMarketingLegalUrl: (path) => `https://schedulaa.com${path}`,
  buildMarketingUrl: (path) => `https://schedulaa.com${path}`,
}));

const renderRegister = () => render(<Register />);

describe("Register", () => {
  beforeEach(() => {
    api.post.mockReset();
  });

  it("shows a server phone validation error beside the phone field", async () => {
    api.post.mockRejectedValue({
      response: {
        data: {
          error: "validation_error",
          field_errors: { phone: "Enter a valid phone number using numbers and optional +, spaces, parentheses, or hyphens." },
        },
      },
    });

    renderRegister();
    await screen.findByText("Start with business owner for full billing and operations access.");

    fireEvent.change(screen.getByLabelText(/First Name/), { target: { value: "Avery" } });
    fireEvent.change(screen.getByLabelText(/Last Name/), { target: { value: "Taylor" } });
    fireEvent.change(screen.getByLabelText(/Email/), { target: { value: "avery@example.com" } });
    fireEvent.change(screen.getByLabelText(/Phone/), { target: { value: "+1 416 555 0123" } });
    fireEvent.change(screen.getByLabelText(/^Password/), { target: { value: "StrongPassword123!" } });
    fireEvent.change(screen.getByLabelText(/Confirm Password/), { target: { value: "StrongPassword123!" } });
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));

    await waitFor(() => expect(api.post).toHaveBeenCalled());
    expect(await screen.findByText("A few details need your attention.")).toBeInTheDocument();
    expect(
      screen.getByText("Enter a valid phone number using numbers and optional +, spaces, parentheses, or hyphens."),
    ).toBeInTheDocument();
    expect(screen.queryByText("validation_error")).not.toBeInTheDocument();
  });
});
