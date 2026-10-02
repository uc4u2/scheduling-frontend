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
      show_company_logo: false,
    },
    resolved_logo: {
      url: "https://cdn.example.com/company-logo.png",
      source: "company_profile",
      source_label: "Company Profile logo",
      manage_path: "/manager/dashboard?view=company-profile",
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

  test("previews unsaved content and allows an active manager to save it", async () => {
    renderScreen();

    const opening = await screen.findByLabelText("Customer opening message");
    expect(screen.getByText("Saved")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save changes" })).toBeDisabled();
    fireEvent.change(opening, { target: { value: "Welcome to our studio" } });
    expect(screen.getByText("Unsaved changes")).toBeInTheDocument();

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

  test("keeps hidden unsaved fields when switching preview tabs and saving", async () => {
    renderScreen();

    const customerOpening = await screen.findByLabelText("Customer opening message");
    fireEvent.change(customerOpening, { target: { value: "Customer draft" } });
    fireEvent.click(screen.getByRole("tab", { name: "Artist/manager notification" }));

    expect(screen.queryByLabelText("Customer opening message")).not.toBeInTheDocument();
    const operationalOpening = screen.getByLabelText("Artist/manager opening message");
    fireEvent.change(operationalOpening, { target: { value: "Artist draft" } });

    fireEvent.click(screen.getByRole("tab", { name: "Customer confirmation" }));
    expect(screen.getByLabelText("Customer opening message")).toHaveValue("Customer draft");

    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    await waitFor(() => expect(mockPut).toHaveBeenCalled());
    expect(mockPut.mock.calls[0][1]).toEqual(expect.objectContaining({
      customer_opening_message: "Customer draft",
      operational_opening_message: "Artist draft",
    }));
  });

  test("keeps newer edits dirty when an older save response arrives", async () => {
    let resolveSave;
    mockPut.mockReturnValue(new Promise((resolve) => { resolveSave = resolve; }));
    renderScreen();

    const opening = await screen.findByLabelText("Customer opening message");
    fireEvent.change(opening, { target: { value: "Submitted value" } });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    fireEvent.change(opening, { target: { value: "Newer unsaved value" } });
    resolveSave({
      ...settingsResponse(true),
      data: {
        ...settingsResponse(true).data,
        settings: {
          ...settingsResponse(true).data.settings,
          customer_opening_message: "Submitted value",
        },
      },
    });

    await waitFor(() => expect(screen.getByRole("button", { name: "Save changes" })).not.toBeDisabled());
    expect(screen.getByLabelText("Customer opening message")).toHaveValue("Newer unsaved value");
    expect(screen.getByText("Unsaved changes")).toBeInTheDocument();
  });

  test("retains edits after a failed save", async () => {
    mockPut.mockRejectedValueOnce(new Error("network down"));
    renderScreen();

    const opening = await screen.findByLabelText("Customer opening message");
    fireEvent.change(opening, { target: { value: "Keep this draft" } });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

    expect(await screen.findByText("network down")).toBeInTheDocument();
    expect(opening).toHaveValue("Keep this draft");
    expect(screen.getByText("Unsaved changes")).toBeInTheDocument();
  });

  test("previews and resets the shared logo toggle without deleting branding", async () => {
    renderScreen();

    const logoToggle = await screen.findByRole("checkbox", { name: "Show company logo in booking emails" });
    expect(screen.getByRole("link", { name: "Manage logo" })).toHaveAttribute(
      "href",
      "/manager/dashboard?view=company-profile"
    );
    fireEvent.click(logoToggle);
    expect(screen.getByText("Unsaved changes")).toBeInTheDocument();

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith(
        "/api/manager/booking-email-settings/preview",
        expect.objectContaining({
          settings: expect.objectContaining({ show_company_logo: true }),
        }),
        expect.any(Object)
      );
    });

    fireEvent.click(screen.getByRole("button", { name: "Reset to Schedulaa defaults" }));
    expect(screen.getByText(/turns off the booking-email logo/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Reset" }));
    await waitFor(() => expect(mockDelete).toHaveBeenCalled());
    await waitFor(() => expect(logoToggle).not.toBeChecked());
    expect(screen.getByText("Saved")).toBeInTheDocument();
  });

  test("allows a non-primary active manager to save and reset", async () => {
    mockGet.mockResolvedValue(settingsResponse(true));
    renderScreen();

    const opening = await screen.findByLabelText("Customer opening message");
    fireEvent.change(opening, { target: { value: "Shared manager update" } });

    await waitFor(() => expect(mockPost).toHaveBeenCalled());
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    await waitFor(() => expect(mockPut).toHaveBeenCalled());
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Reset to Schedulaa defaults" })).not.toBeDisabled();
    });

    fireEvent.click(screen.getByRole("button", { name: "Reset to Schedulaa defaults" }));
    fireEvent.click(screen.getByRole("button", { name: "Reset" }));
    await waitFor(() => expect(mockDelete).toHaveBeenCalled());
    expect(screen.queryByText(/Only the current primary owner/i)).not.toBeInTheDocument();
  });

  test("requires confirmation before resetting only the shared messages", async () => {
    renderScreen();
    await screen.findByLabelText("Customer opening message");

    fireEvent.click(screen.getByRole("button", { name: "Reset to Schedulaa defaults" }));
    expect(screen.getByText(/clears the five shared messages/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Reset" }));

    await waitFor(() => {
      expect(mockDelete).toHaveBeenCalledWith(
        "/api/manager/booking-email-settings",
        expect.any(Object)
      );
    });
  });
});
