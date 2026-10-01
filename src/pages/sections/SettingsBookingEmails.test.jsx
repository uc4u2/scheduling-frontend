import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ThemeProvider, createTheme } from "@mui/material/styles";

import SettingsBookingEmails from "./SettingsBookingEmails";

const mockGet = jest.fn();
const mockPost = jest.fn();
const mockPut = jest.fn();
const mockDelete = jest.fn();

jest.mock("../../utils/api", () => ({
  __esModule: true,
  default: {
    get: (...args) => mockGet(...args),
    post: (...args) => mockPost(...args),
    put: (...args) => mockPut(...args),
    delete: (...args) => mockDelete(...args),
  },
}));

const settingsResponse = (editable = true) => ({
  data: {
    editable,
    settings: {
      customer_opening_message: "",
      customer_preparation_instructions: "",
      customer_closing_message: "",
      operational_opening_message: "",
      operational_closing_message: "",
    },
    limits: {
      customer_opening_message: 600,
      customer_preparation_instructions: 1200,
      customer_closing_message: 600,
      operational_opening_message: 600,
      operational_closing_message: 600,
    },
  },
});

const renderScreen = () => render(
  <ThemeProvider theme={createTheme()}>
    <SettingsBookingEmails />
  </ThemeProvider>
);

describe("SettingsBookingEmails", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.setItem("token", "manager-token");
    mockGet.mockResolvedValue(settingsResponse(true));
    mockPost.mockResolvedValue({
      data: { subject: "Sample confirmation", html: "<p>Preview</p>", text: "Preview" },
    });
    mockPut.mockResolvedValue(settingsResponse(true));
    mockDelete.mockResolvedValue(settingsResponse(true));
  });

  test("previews unsaved content and allows an owner to save it", async () => {
    renderScreen();

    const opening = await screen.findByLabelText("Customer opening message");
    fireEvent.change(opening, { target: { value: "Welcome to our studio" } });

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith(
        "/api/manager/booking-email-settings/preview",
        expect.objectContaining({
          audience: "customer",
          settings: expect.objectContaining({ customer_opening_message: "Welcome to our studio" }),
        }),
        expect.any(Object)
      );
    });

    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    await waitFor(() => {
      expect(mockPut).toHaveBeenCalledWith(
        "/api/manager/booking-email-settings",
        expect.objectContaining({ customer_opening_message: "Welcome to our studio" }),
        expect.any(Object)
      );
    });
  });

  test("lets a non-owner preview but not save or reset", async () => {
    mockGet.mockResolvedValue(settingsResponse(false));
    renderScreen();

    const opening = await screen.findByLabelText("Customer opening message");
    fireEvent.change(opening, { target: { value: "Unsaved manager preview" } });

    await waitFor(() => expect(mockPost).toHaveBeenCalled());
    expect(screen.getByRole("button", { name: "Save changes" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Reset to Schedulaa defaults" })).toBeDisabled();
    expect(screen.getByText(/Only the current primary owner can save or reset/i)).toBeInTheDocument();
  });

  test("requires confirmation before resetting only the shared messages", async () => {
    renderScreen();
    await screen.findByLabelText("Customer opening message");

    fireEvent.click(screen.getByRole("button", { name: "Reset to Schedulaa defaults" }));
    expect(screen.getByText(/clears only these five shared messages/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Reset" }));

    await waitFor(() => {
      expect(mockDelete).toHaveBeenCalledWith(
        "/api/manager/booking-email-settings",
        expect.any(Object)
      );
    });
  });
});
