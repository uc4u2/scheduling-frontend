import React from "react";
import { render, screen } from "@testing-library/react";
import AppBootstrap, { isClientSessionBootstrapLocation } from "./AppBootstrap";

jest.mock("./ClientSessionBootstrap", () => ({ __esModule: true, default: () => <div>Session receiver</div> }));
jest.mock("./App", () => ({ __esModule: true, default: () => <div>Interactive login application</div> }));

afterEach(() => window.history.replaceState({}, "", "/"));

test("bootstrap never mounts the interactive login application", async () => {
  window.history.replaceState({}, "", "/login?site=beauty-salon&client=1&embed=1&bootstrap=1");
  render(<AppBootstrap />);
  expect(await screen.findByText("Session receiver")).toBeInTheDocument();
  expect(screen.queryByText("Interactive login application")).not.toBeInTheDocument();
});

test("ordinary client login keeps its interactive application", async () => {
  window.history.replaceState({}, "", "/login?site=beauty-salon&client=1&embed=1");
  render(<AppBootstrap />);
  expect(await screen.findByText("Interactive login application")).toBeInTheDocument();
});

test("bootstrap selection requires the exact receiver route and flags", () => {
  expect(isClientSessionBootstrapLocation({ pathname: "/dashboard", search: "?site=salon&client=1&embed=1&bootstrap=1" })).toBe(false);
  expect(isClientSessionBootstrapLocation({ pathname: "/login", search: "?site=salon&client=1&bootstrap=1" })).toBe(false);
});
