import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import Register from "./Register";
import api from "./utils/api";

jest.mock(
  "react-router-dom",
  () => {
    const ReactModule = require("react");
    return {
      Link: ReactModule.forwardRef(({ to, children, ...props }, ref) => (
        <a ref={ref} href={typeof to === "string" ? to : "/"} {...props}>
          {children}
        </a>
      )),
      useNavigate: () => jest.fn(),
      useSearchParams: () => [new URLSearchParams(), jest.fn()],
    };
  },
  { virtual: true }
);

jest.mock("./utils/api", () => ({
  __esModule: true,
  default: { post: jest.fn() },
}));

jest.mock("./utils/timezone", () => ({
  detectBrowserTimezone: () => "America/Toronto",
  formatTimezoneLabel: () => "Toronto (America/Toronto)",
  getUserTimezone: () => "America/Toronto",
  normalizeTimezoneValue: (value) => value,
}));

const renderRegister = () => render(<Register />);
const getPasswordInput = () =>
  screen.getAllByLabelText(/^Password/i).find((element) => element.tagName === "INPUT");

const fillValidRegistration = () => {
  fireEvent.change(screen.getByLabelText(/First Name/i), { target: { value: "Yosef" } });
  fireEvent.change(screen.getByLabelText(/Last Name/i), { target: { value: "Mak" } });
  fireEvent.change(screen.getByLabelText(/^Email/i), { target: { value: "yosef@example.com" } });
  fireEvent.change(screen.getByLabelText(/^Phone/i), { target: { value: "+1 (416) 444-8839" } });
  fireEvent.change(getPasswordInput(), { target: { value: "StrongPass123!" } });
  fireEvent.change(screen.getByLabelText(/Confirm Password/i), { target: { value: "StrongPass123!" } });
  fireEvent.click(screen.getByRole("checkbox"));
};

describe("Register", () => {
  beforeEach(() => {
    api.post.mockReset();
    localStorage.clear();
  });

  it("shows an immediate inline phone error without clearing entered values", () => {
    renderRegister();
    const phone = screen.getByLabelText(/^Phone/i);
    fireEvent.change(phone, { target: { value: "yosef@example.com" } });
    fireEvent.blur(phone);

    expect(screen.getByText(/Enter a valid phone number/i)).toBeInTheDocument();
    expect(phone).toHaveAttribute("aria-invalid", "true");
    expect(phone).toHaveValue("yosef@example.com");
  });

  it("shows backend field errors, a friendly summary, and focuses the first invalid field", async () => {
    api.post.mockRejectedValueOnce({
      response: {
        data: {
          error: "validation_error",
          field_errors: { phone: "This phone number cannot be used." },
        },
      },
    });
    renderRegister();
    fillValidRegistration();
    fireEvent.click(screen.getByRole("button", { name: /Create account/i }));

    expect(await screen.findByText("Please correct the highlighted fields and try again.")).toBeInTheDocument();
    expect(screen.getByText("This phone number cannot be used.")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByLabelText(/^Phone/i)).toHaveFocus());
    expect(screen.getByLabelText(/^Email/i)).toHaveValue("yosef@example.com");
  });

  it("normalizes a formatted phone number before submission", async () => {
    api.post.mockRejectedValueOnce({ response: { data: { error: "server_error" } } });
    renderRegister();
    fillValidRegistration();
    fireEvent.click(screen.getByRole("button", { name: /Create account/i }));

    await waitFor(() => expect(api.post).toHaveBeenCalled());
    expect(api.post.mock.calls[0][1]).toEqual(expect.objectContaining({ phone: "+14164448839" }));
  });

  it("shows the live 12-character password checklist", () => {
    renderRegister();
    expect(screen.getByText("At least 12 characters")).toBeInTheDocument();
    fireEvent.change(getPasswordInput(), { target: { value: "StrongPass123!" } });
    expect(screen.getAllByRole("listitem")[0]).toHaveTextContent("✓At least 12 characters");
  });
});
