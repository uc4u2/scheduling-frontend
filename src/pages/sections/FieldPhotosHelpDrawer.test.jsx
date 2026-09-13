import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { ThemeProvider, createTheme } from "@mui/material/styles";

import FieldPhotosHelpDrawer from "./FieldPhotosHelpDrawer";

describe("FieldPhotosHelpDrawer", () => {
  const renderDrawer = () => render(
    <ThemeProvider theme={createTheme()}>
      <FieldPhotosHelpDrawer
        open
        onClose={jest.fn()}
        summary={{ retention_label: "7 years" }}
        preview={{
          recurring_amount_formatted: "29.00 CAD",
          interval: "month",
          included_storage_label: "25 GB",
          storage_expansion_label: "+50 GB",
          storage_expansion_amount_formatted: "10.00 CAD",
          storage_expansion_interval: "month",
          retention_options: [
            { code: "90d", label: "90 days" },
            { code: "1y", label: "1 year" },
            { code: "3y", label: "3 years" },
            { code: "7y", label: "7 years" },
          ],
        }}
      />
    </ThemeProvider>
  );

  it("uses authoritative storage, retention, expansion, and cancellation wording", () => {
    renderDrawer();

    expect(screen.getByText(/Field Photos includes 25 GB/i)).toBeInTheDocument();
    expect(screen.getByText(/currently uses 7 years/i)).toBeInTheDocument();
    expect(screen.getByText(/add \+50 GB/i)).toBeInTheDocument();
    expect(screen.getAllByText(/read-only for download for 30 days/i).length).toBeGreaterThan(0);
    expect(screen.queryByText(/photos are kept for 90 days/i)).not.toBeInTheDocument();
  });

  it("renders accessible collapsed FAQs and reveals authoritative answers", () => {
    renderDrawer();

    expect(screen.getByRole("heading", { name: /frequently asked questions/i })).toBeInTheDocument();
    const questions = [
      "What are Field Photos?",
      "How much does Field Photos cost?",
      "Does choosing 7-year retention cost more than 90 days?",
      "What happens if I need more than 25 GB?",
      "What does photo retention mean?",
      "If I change retention later, what happens to my existing photos?",
      "Does a gallery link expiration delete my photos?",
      "Are Field Photos private?",
      "What do Security check, Ready, and Blocked mean?",
      "Can a manager delete a photo before its retention period ends?",
      "What happens if I cancel Field Photos?",
      "What photo types and sizes can I upload?",
    ];

    questions.forEach((question) => {
      expect(screen.getByRole("button", { name: question })).toHaveAttribute("aria-expanded", "false");
    });

    const priceQuestion = screen.getByRole("button", { name: "How much does Field Photos cost?" });
    fireEvent.click(priceQuestion);
    expect(priceQuestion).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText(/Field Photos costs 29\.00 CAD\/month per company and includes 25 GB/i)).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Does choosing 7-year retention cost more than 90 days?" }));
    expect(screen.getByText(/retention choice does not change the base Field Photos monthly price/i)).toBeVisible();
    expect(screen.getByText(/may use more storage over time/i)).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "What happens if I need more than 25 GB?" }));
    expect(screen.getByText(/Each storage pack adds 50 GB for 10\.00 CAD\/month/i)).toBeVisible();
  });

  it("explains retention snapshots, privacy, gallery links, cancellation, and current upload controls", () => {
    renderDrawer();

    [
      "If I change retention later, what happens to my existing photos?",
      "Does a gallery link expiration delete my photos?",
      "Are Field Photos private?",
      "What happens if I cancel Field Photos?",
      "What photo types and sizes can I upload?",
    ].forEach((question) => fireEvent.click(screen.getByRole("button", { name: question })));

    expect(screen.getByText(/new retention setting applies to new photos/i)).toBeVisible();
    expect(screen.getByText(/does not delete the underlying Field Photos/i)).toBeVisible();
    expect(screen.getByText(/stored privately and protected by access controls/i)).toBeVisible();
    expect(screen.getAllByText(/read-only for download for 30 days/i)[1]).toBeVisible();
    expect(screen.getByText(/current maximum file size is shown where you choose a photo/i)).toBeVisible();

    expect(screen.queryByText(/25 MB/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/(^|[^0-9])5 GB/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/(^|[^0-9])10 GB included/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/90-day retention/i)).not.toBeInTheDocument();
  });

  it("retains existing guide content", () => {
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

    expect(screen.getByText(/What Field Photos is for/i)).toBeInTheDocument();
    expect(screen.getByText(/Security status/i)).toBeInTheDocument();
    expect(screen.getByText(/Finding photos faster/i)).toBeInTheDocument();
    expect(screen.getByText(/Archive and delete/i)).toBeInTheDocument();
  });
});
