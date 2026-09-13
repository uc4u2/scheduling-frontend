import React from "react";
import { render, screen } from "@testing-library/react";
import { ThemeProvider, createTheme } from "@mui/material/styles";

import FieldPhotosHelpDrawer from "./FieldPhotosHelpDrawer";

describe("FieldPhotosHelpDrawer", () => {
  it("uses authoritative storage, retention, expansion, and cancellation wording", () => {
    render(
      <ThemeProvider theme={createTheme()}>
        <FieldPhotosHelpDrawer
          open
          onClose={jest.fn()}
          summary={{ retention_label: "7 years" }}
          preview={{ included_storage_label: "25 GB", storage_expansion_label: "+50 GB" }}
        />
      </ThemeProvider>
    );

    expect(screen.getByText(/Field Photos includes 25 GB/i)).toBeInTheDocument();
    expect(screen.getByText(/currently uses 7 years/i)).toBeInTheDocument();
    expect(screen.getByText(/add \+50 GB/i)).toBeInTheDocument();
    expect(screen.getByText(/read-only for download for 30 days/i)).toBeInTheDocument();
    expect(screen.queryByText(/photos are kept for 90 days/i)).not.toBeInTheDocument();
  });
});
