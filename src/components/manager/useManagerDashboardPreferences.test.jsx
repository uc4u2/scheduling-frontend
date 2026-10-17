import React from "react";
import { act, render, screen } from "@testing-library/react";
import api from "../../utils/api";
import useManagerDashboardPreferences from "./useManagerDashboardPreferences";

jest.mock("../../utils/api", () => ({
  get: jest.fn(),
  put: jest.fn(),
}));

const preference = (overrides = {}) => ({
  action_ids: ["business-finance"],
  available_action_ids: ["business-finance", "products"],
  default_action_ids: ["business-finance"],
  show_workforce_cards: false,
  preset_key: "custom",
  max_actions: 10,
  version: 4,
  ...overrides,
});

let latestHook;
const Harness = ({ user }) => {
  latestHook = useManagerDashboardPreferences({ currentUserInfo: user, enabled: true });
  return <div>{latestHook.loading ? "loading" : latestHook.preferences.action_ids.join(",")}</div>;
};

beforeEach(() => {
  jest.clearAllMocks();
  latestHook = null;
});

test("loads and saves with the current tenant/account version", async () => {
  api.get.mockResolvedValue({ data: preference() });
  api.put.mockResolvedValue({ data: preference({ action_ids: ["products"], version: 5 }) });
  render(<Harness user={{ id: 9, company: { id: 3 } }} />);

  await screen.findByText("business-finance");
  await act(async () => {
    await latestHook.save({
      action_ids: ["products"],
      show_workforce_cards: false,
      preset_key: "custom",
    });
  });

  expect(api.put).toHaveBeenCalledWith(
    "/api/manager-workspace/dashboard-preferences",
    {
      action_ids: ["products"],
      show_workforce_cards: false,
      expected_version: 4,
      preset_key: "custom",
    }
  );
  expect(screen.getByText("products")).toBeInTheDocument();
});

test("ignores a delayed response after the account or tenant changes", async () => {
  let resolveFirst;
  const first = new Promise((resolve) => { resolveFirst = resolve; });
  api.get
    .mockReturnValueOnce(first)
    .mockResolvedValueOnce({ data: preference({ action_ids: ["products"] }) });

  const view = render(<Harness user={{ id: 1, company: { id: 10 } }} />);
  view.rerender(<Harness user={{ id: 2, company: { id: 20 } }} />);

  await screen.findByText("products");
  await act(async () => {
    resolveFirst({ data: preference({ action_ids: ["business-finance"] }) });
    await first;
  });

  expect(await screen.findByText("products")).toBeInTheDocument();
  expect(screen.queryByText("business-finance")).not.toBeInTheDocument();
});
