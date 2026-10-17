import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CollapsibleSectionCard from "./CollapsibleSectionCard";

test("shows a compact summary and preserves mounted settings while collapsed", async () => {
  render(
    <ThemeProvider theme={createTheme()}>
      <CollapsibleSectionCard
        title="Time tracking"
        description="Control employee time settings."
        contentId="time-settings"
        summary={<span>Clock-in enabled</span>}
      >
        <label htmlFor="grace-window">Grace window</label>
        <input id="grace-window" defaultValue="15" />
      </CollapsibleSectionCard>
    </ThemeProvider>
  );

  const reviewButton = screen.getByRole("button", { name: /review settings/i });
  expect(reviewButton).toHaveAttribute("aria-expanded", "false");
  expect(screen.getByText("Clock-in enabled")).toBeInTheDocument();
  expect(screen.getByLabelText("Grace window")).not.toBeVisible();

  fireEvent.click(reviewButton);
  expect(await screen.findByLabelText("Grace window")).toBeVisible();
  fireEvent.change(screen.getByLabelText("Grace window"), { target: { value: "30" } });

  fireEvent.click(screen.getByRole("button", { name: /collapse/i }));
  await waitFor(() => expect(screen.getByLabelText("Grace window")).not.toBeVisible());
  expect(screen.getByLabelText("Grace window")).toHaveValue("30");
});
