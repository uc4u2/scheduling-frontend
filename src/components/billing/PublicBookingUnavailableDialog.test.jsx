import React from "react";
import { render, screen } from "@testing-library/react";
import { ThemeProvider, createTheme } from "@mui/material/styles";

import PublicBookingUnavailableDialog from "./PublicBookingUnavailableDialog";

describe("PublicBookingUnavailableDialog", () => {
  it("uses client-safe wording when online booking is unavailable", () => {
    render(
      <ThemeProvider theme={createTheme()}>
        <PublicBookingUnavailableDialog
          open
          onClose={jest.fn()}
          onBack={jest.fn()}
        />
      </ThemeProvider>
    );

    expect(screen.getByText("Online booking is unavailable")).toBeInTheDocument();
    expect(
      screen.getByText(
        "This business is not able to accept online bookings right now. Please contact them directly to arrange your appointment."
      )
    ).toBeInTheDocument();
    expect(screen.queryByText(/subscription_required/i)).not.toBeInTheDocument();
  });
});
