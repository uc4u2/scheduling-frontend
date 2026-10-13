import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ThemeProvider, createTheme } from "@mui/material/styles";

import SettingsAppointmentReminders from "./SettingsAppointmentReminders";

const mockGet = jest.fn();
const mockPost = jest.fn();
const mockPut = jest.fn();

jest.mock("../../utils/api", () => ({
  __esModule: true,
  default: {
    get: (...args) => mockGet(...args),
    post: (...args) => mockPost(...args),
    put: (...args) => mockPut(...args),
  },
}));

const response = {
  data: {
    settings: {
      email_enabled: false,
      first_enabled: true,
      first_hours_before: 24,
      second_enabled: true,
      second_hours_before: 2,
    },
    company_timezone: "America/Toronto",
    timezone_behavior: "Appointment times use the provider timezone, then the company timezone, then UTC.",
    bounds: { minimum_hours: 1, maximum_hours: 336 },
    updated_at: "2026-10-13T12:00:00Z",
    runtime_enabled: false,
    history: [
      {
        id: 1,
        appointment_id: 41,
        stage: "first",
        scheduled_for: "2026-10-14T12:00:00Z",
        status: "provider_accepted",
        reason_code: null,
      },
    ],
  },
};

const renderScreen = () => render(
  <ThemeProvider theme={createTheme()}>
    <SettingsAppointmentReminders />
  </ThemeProvider>
);

describe("SettingsAppointmentReminders", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.localStorage.setItem("token", "manager-token-a");
    window.localStorage.setItem("company_id", "36");
    mockGet.mockResolvedValue(response);
    mockPut.mockResolvedValue({
      data: {
        ...response.data,
        settings: { ...response.data.settings, email_enabled: true },
        updated_at: "2026-10-13T12:05:00Z",
      },
    });
    mockPost.mockResolvedValue({
      data: {
        subject: "Appointment reminder: Signature Service",
        text: "Hi Jordan,\nAppointment details",
      },
    });
  });

  test("loads disabled-by-default policy and distinguishes accepted from delivered", async () => {
    renderScreen();
    expect(await screen.findByText("Appointment reminders")).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Enable appointment email reminders" })).not.toBeChecked();
    expect(screen.getByText("Not configured / Coming soon")).toBeInTheDocument();
    expect(screen.getByText("Provider accepted")).toBeInTheDocument();
    expect(screen.getByText(/not the same as confirmed delivery/i)).toBeInTheDocument();
    expect(screen.getByText(/delivery is not active/i)).toBeInTheDocument();
    expect(screen.queryByText(/worker\/beat/i)).not.toBeInTheDocument();
  });

  test("saves an explicit two-stage policy with optimistic version", async () => {
    renderScreen();
    const toggle = await screen.findByRole("checkbox", { name: "Enable appointment email reminders" });
    fireEvent.click(toggle);
    fireEvent.click(screen.getByRole("button", { name: "Save reminder settings" }));
    await waitFor(() => {
      expect(mockPut).toHaveBeenCalledWith(
        "/api/manager/appointment-reminder-settings",
        expect.objectContaining({
          email_enabled: true,
          first_hours_before: 24,
          second_hours_before: 2,
          expected_updated_at: "2026-10-13T12:00:00Z",
        })
      );
    });
  });

  test("previews without sending and keeps the timezone contract visible", async () => {
    renderScreen();
    await screen.findByText("Timezone: America/Toronto");
    expect(mockPost).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Preview email" }));
    await waitFor(() => expect(mockPost).toHaveBeenCalledWith(
      "/api/manager/appointment-reminder-settings/preview",
      expect.objectContaining({ email_enabled: false, first_hours_before: 24 })
    ));
    expect(await screen.findByText("Preview — no email sent")).toBeInTheDocument();
    expect(screen.getByText("Appointment times use the provider timezone, then the company timezone, then UTC.")).toBeInTheDocument();
  });

  test("does not apply a delayed response after unmount", async () => {
    let resolveLoad;
    mockGet.mockReturnValue(new Promise((resolve) => { resolveLoad = resolve; }));
    const view = renderScreen();
    view.unmount();
    resolveLoad(response);
    await Promise.resolve();
    expect(mockPut).not.toHaveBeenCalled();
  });

  test("does not apply a save response after the active company changes", async () => {
    let resolveSave;
    mockPut.mockReturnValue(new Promise((resolve) => { resolveSave = resolve; }));
    renderScreen();
    const toggle = await screen.findByRole("checkbox", { name: "Enable appointment email reminders" });
    fireEvent.click(toggle);
    fireEvent.click(screen.getByRole("button", { name: "Save reminder settings" }));
    window.localStorage.setItem("company_id", "99");
    resolveSave({
      data: {
        ...response.data,
        settings: { ...response.data.settings, email_enabled: true },
      },
    });
    await Promise.resolve();
    expect(screen.queryByText("Appointment reminder settings saved.")).not.toBeInTheDocument();
  });
});
