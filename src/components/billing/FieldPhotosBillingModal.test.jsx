import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ThemeProvider, createTheme } from "@mui/material/styles";

import FieldPhotosBillingModal from "./FieldPhotosBillingModal";

const mockApiGet = jest.fn();
const mockApiPost = jest.fn();
const mockOpenBillingPortal = jest.fn(() => Promise.resolve());

jest.mock("../../utils/api", () => ({
  __esModule: true,
  default: {
    get: (...args) => mockApiGet(...args),
    post: (...args) => mockApiPost(...args),
  },
}));

jest.mock("./billingHelpers", () => ({
  openBillingPortal: (...args) => mockOpenBillingPortal(...args),
}));

jest.mock("../../utils/mobileCompliance", () => ({
  isMobileComplianceMode: () => false,
}));

const renderModal = (props = {}) =>
  render(
    <ThemeProvider theme={createTheme()}>
      <FieldPhotosBillingModal
        open
        mode="activate"
        currentStorageQty={0}
        onClose={jest.fn()}
        onSuccess={jest.fn()}
        {...props}
      />
    </ThemeProvider>
  );

describe("FieldPhotosBillingModal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockApiGet.mockResolvedValue({
      data: {
        recurring_amount_formatted: "29.00 USD",
        interval: "month",
        included_storage_label: "5 GB",
        retention_days: 90,
        amount_due_today_formatted: "29.00 USD",
      },
    });
    mockApiPost.mockResolvedValue({ data: {} });
  });

  it("renders authoritative recurring price and included storage from preview", async () => {
    renderModal();

    expect(await screen.findByText(/29\.00 USD\/month/i)).toBeInTheDocument();
    expect(screen.getByText(/Includes 5 GB · 90-day retention/i)).toBeInTheDocument();
  });

  it("shows neutral unavailable copy when preview omits storage and retention values", async () => {
    mockApiGet.mockResolvedValue({ data: {} });

    renderModal();

    expect(await screen.findByText(/Pricing unavailable/i)).toBeInTheDocument();
    expect(screen.getByText(/Includes Included storage unavailable · Retention information unavailable/i)).toBeInTheDocument();
  });

  it("does not activate until the manager confirms", async () => {
    renderModal();

    expect(await screen.findByRole("button", { name: /confirm activation/i })).toBeInTheDocument();
    expect(mockApiPost).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: /confirm activation/i }));

    await waitFor(() => {
      expect(mockApiPost).toHaveBeenCalledWith("/billing/field-photos/activate", {});
    });
  });
});
