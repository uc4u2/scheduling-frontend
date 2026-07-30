import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";

import {
  CLIENT_BOOKING_BLOCK_REASON_OPTIONS,
} from "./ClientBookingAccessDialog";
import ClientBookingAccessDialog from "./ClientBookingAccessDialog";

describe("ClientBookingAccessDialog", () => {
  it("renders the lightweight booking-block workflow and submits reason plus note", () => {
    const onConfirm = jest.fn();
    render(
      <ClientBookingAccessDialog
        open
        saving={false}
        onClose={() => {}}
        onConfirm={onConfirm}
      />
    );

    expect(screen.getByText("Block new bookings?")).toBeInTheDocument();
    expect(screen.getByText("Manager only.")).toBeInTheDocument();

    fireEvent.mouseDown(screen.getByRole("combobox"));
    expect(screen.getAllByText(CLIENT_BOOKING_BLOCK_REASON_OPTIONS[0].label).length).toBeGreaterThan(0);
    fireEvent.click(screen.getByText("Payment issue"));

    fireEvent.change(screen.getByLabelText("Internal note"), {
      target: { value: "Chargeback review in progress" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Block new bookings" }));

    expect(onConfirm).toHaveBeenCalledWith({
      reason_code: "payment_issue",
      note: "Chargeback review in progress",
    });
  });
});
