import React from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { ThemeProvider, createTheme } from "@mui/material/styles";

import MainNav from "./MainNav";
import { OPEN_MANAGER_NAVIGATION_EVENT } from "../../utils/managerNavigation";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key) => key }),
}));
jest.mock(
  "react-router-dom",
  () => {
    const ReactModule = require("react");
    return {
      useLocation: () => ({ pathname: "/manager/booking-checkout", search: "" }),
      Link: ReactModule.forwardRef(({ children, to, ...props }, ref) => (
        <a ref={ref} href={to} {...props}>{children}</a>
      )),
    };
  },
  { virtual: true }
);
jest.mock("../../components/LanguageSelector", () => () => <div>Language</div>);

describe("MainNav mobile manager toolbar", () => {
  beforeEach(() => {
    window.matchMedia = jest.fn().mockImplementation((query) => ({
      matches: query.includes("max-width"),
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));
  });

  it("keeps manager and account navigation controls in the shared top toolbar", () => {
    const onManagerNavigation = jest.fn();
    window.addEventListener(OPEN_MANAGER_NAVIGATION_EVENT, onManagerNavigation);

    render(
      <ThemeProvider theme={createTheme()}>
        <MainNav token="manager-token" setToken={jest.fn()} />
      </ThemeProvider>
    );

    const toolbar = screen.getByTestId("global-mobile-toolbar");
    expect(within(toolbar).getByAltText("Schedulaa")).toBeInTheDocument();
    expect(within(toolbar).getByRole("button", { name: "Open manager navigation" })).toBeInTheDocument();
    expect(within(toolbar).getByRole("button", { name: "Open account navigation" })).toBeInTheDocument();

    fireEvent.click(within(toolbar).getByRole("button", { name: "Open manager navigation" }));
    expect(onManagerNavigation).toHaveBeenCalledTimes(1);

    window.removeEventListener(OPEN_MANAGER_NAVIGATION_EVENT, onManagerNavigation);
  });
});
