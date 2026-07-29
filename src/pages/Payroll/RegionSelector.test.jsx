import React from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { ThemeProvider, createTheme } from "@mui/material/styles";

import RegionSelector from "./RegionSelector";

function renderSelector(props) {
  const onChange = jest.fn();
  render(
    <ThemeProvider theme={createTheme()}>
      <RegionSelector region="ca" province="on" onChange={onChange} {...props} />
    </ThemeProvider>
  );
  return { onChange };
}

describe("Payroll RegionSelector", () => {
  test("keeps the current payroll region branches intact", async () => {
    renderSelector();

    fireEvent.mouseDown(screen.getAllByRole("combobox")[0]);
    const listbox = await screen.findByRole("listbox");
    expect(within(listbox).getByText("🇨🇦 Canada (excluding Quebec)")).toBeInTheDocument();
    expect(within(listbox).getByText("🇨🇦 Quebec")).toBeInTheDocument();
    expect(within(listbox).getByText("🇺🇸 USA")).toBeInTheDocument();
    expect(within(listbox).getByText("🌍 International")).toBeInTheDocument();
  });

  test("selecting Quebec still routes to the Quebec payroll branch", async () => {
    const { onChange } = renderSelector();

    fireEvent.mouseDown(screen.getAllByRole("combobox")[0]);
    const listbox = await screen.findByRole("listbox");
    fireEvent.click(within(listbox).getByText("🇨🇦 Quebec"));

    expect(onChange).toHaveBeenCalledWith("qc", "qc");
  });
});
