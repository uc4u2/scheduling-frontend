import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import api from "../../utils/api";
import ManagerDashboardPreferencesCard from "./ManagerDashboardPreferencesCard";
import useManagerDashboardPreferences from "./useManagerDashboardPreferences";

jest.mock("../../utils/api", () => ({ get: jest.fn() }));
jest.mock("./useManagerDashboardPreferences");

const preferences = {
  action_ids: ["business-finance", "products", "dispatch"],
  available_action_ids: ["business-finance", "products", "dispatch", "shift-management"],
  default_action_ids: ["business-finance", "products", "dispatch"],
  show_workforce_cards: true,
  preset_key: "custom",
  max_actions: 10,
  version: 2,
};

beforeEach(() => {
  jest.clearAllMocks();
  api.get.mockResolvedValue({ data: { id: 7, is_manager: true } });
  useManagerDashboardPreferences.mockReturnValue({
    preferences,
    loading: false,
    saving: false,
    error: "",
    save: jest.fn(),
  });
});

test("keeps the settings section compact until the user chooses to customize", async () => {
  render(
    <ThemeProvider theme={createTheme()}>
      <ManagerDashboardPreferencesCard />
    </ThemeProvider>
  );

  const customize = await screen.findByRole("button", { name: /customize/i });
  expect(customize).toHaveAttribute("aria-expanded", "false");
  expect(screen.getByText("3 quick actions")).toBeInTheDocument();
  expect(screen.getByText("Workforce shortcuts on")).toBeInTheDocument();
  expect(screen.getByText("Start with a workspace preset")).not.toBeVisible();

  fireEvent.click(customize);
  expect(await screen.findByText("Start with a workspace preset")).toBeInTheDocument();
  expect(screen.getByRole("region", { name: "Start with a workspace preset" })).toBeInTheDocument();
  expect(screen.getByRole("region", { name: "Your quick actions" })).toBeInTheDocument();
  expect(screen.getByRole("region", { name: "Available tools" })).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: /collapse/i }));
  await waitFor(() => {
    expect(screen.getByText("Start with a workspace preset")).not.toBeVisible();
  });
});
