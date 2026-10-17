import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import MobileManagerHome from "./MobileManagerHome";

jest.mock("../ui/ManagementFrame", () => ({ children }) => <div>{children}</div>);

const renderHome = (overrides = {}) => {
  const props = {
    currentUserInfo: {
      id: 7,
      email: "delegate@example.com",
      is_manager: false,
      can_manage_shifts: true,
    },
    swapRequests: [{ id: 1 }],
    dashboardPreferences: {
      action_ids: ["shift-management", "dispatch"],
      available_action_ids: ["shift-management", "time-tracking", "leaves", "swap-approvals", "dispatch"],
      default_action_ids: ["shift-management", "dispatch"],
      show_workforce_cards: true,
      max_actions: 10,
      preset_key: "custom",
      version: 1,
    },
    onOpenAction: jest.fn(),
    onSavePreferences: jest.fn().mockResolvedValue({ version: 2 }),
    onEmployeeView: jest.fn(),
    ...overrides,
  };
  return {
    props,
    ...render(
      <ThemeProvider theme={createTheme()}>
        <MobileManagerHome {...props} />
      </ThemeProvider>
    ),
  };
};

test("shows permission-scoped delegated actions without duplicating workforce shortcuts", () => {
  const { props } = renderHome();

  expect(screen.getByText("Supervisor workspace")).toBeInTheDocument();
  expect(screen.getAllByText("Shift Management")).toHaveLength(1);
  expect(screen.getByText("Dispatch")).toBeInTheDocument();
  expect(screen.queryByText("Business Finance")).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /employee view/i })).not.toBeInTheDocument();

  fireEvent.click(screen.getByText("Dispatch"));
  expect(props.onOpenAction).toHaveBeenCalledWith(expect.objectContaining({
    id: "dispatch",
    viewKey: "dispatch-tracking",
  }));
});

test("lets the account owner save a responsive shortcut layout", async () => {
  const { props } = renderHome({
    currentUserInfo: {
      id: 2,
      email: "manager@example.com",
      is_manager: true,
    },
    dashboardPreferences: {
      action_ids: ["business-finance", "products"],
      available_action_ids: ["business-finance", "products", "dispatch"],
      default_action_ids: ["business-finance", "products"],
      show_workforce_cards: false,
      max_actions: 10,
      preset_key: "custom",
      version: 3,
    },
    canUseEmployeeView: true,
  });

  fireEvent.click(screen.getByRole("button", { name: /customize/i }));
  expect(screen.getByText("Customize mobile dashboard")).toBeInTheDocument();
  expect(screen.getByText(/presets only arrange shortcuts/i)).toBeInTheDocument();

  fireEvent.click(screen.getByRole("checkbox", { name: /dispatch/i }));
  fireEvent.click(screen.getByRole("button", { name: /save mobile dashboard/i }));

  await waitFor(() => expect(props.onSavePreferences).toHaveBeenCalledWith({
    action_ids: ["business-finance", "products", "dispatch"],
    show_workforce_cards: false,
    preset_key: "custom",
  }));
  await waitFor(() => expect(screen.queryByText("Customize mobile dashboard")).not.toBeInTheDocument());
});
