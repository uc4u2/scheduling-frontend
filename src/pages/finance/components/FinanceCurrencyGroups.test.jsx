import React from "react";
import { render, screen } from "@testing-library/react";
import FinanceCurrencyGroups from "./FinanceCurrencyGroups";

test("renders original currencies separately and surfaces incomplete legacy payment evidence", () => {
  render(
    <FinanceCurrencyGroups
      groups={[
        { currency: "CAD", issued_invoice_amount: 125, net_collected_amount: 80, net_collected_amount_complete: true },
        { currency: "USD", issued_invoice_amount: 50, net_collected_amount: 0, net_collected_amount_complete: false },
      ]}
      metrics={[
        { key: "issued_invoice_amount", label: "Issued invoice amount" },
        { key: "net_collected_amount", label: "Net collected amount" },
      ]}
    />
  );

  expect(screen.getByText("CAD")).toBeInTheDocument();
  expect(screen.getByText("USD")).toBeInTheDocument();
  expect(screen.getByText(/125\.00/)).toBeInTheDocument();
  expect(screen.getByText(/50\.00/)).toBeInTheDocument();
  expect(screen.getByText(/not silently counted as cash/i)).toBeInTheDocument();
});
