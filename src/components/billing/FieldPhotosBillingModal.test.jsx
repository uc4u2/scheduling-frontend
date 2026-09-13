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
        included_storage_label: "25 GB",
        retention_policy: "90d",
        retention_label: "90 days",
        retention_options: [
          { code: "90d", label: "90 days" },
          { code: "1y", label: "1 year" },
          { code: "3y", label: "3 years" },
          { code: "7y", label: "7 years" },
        ],
        storage_expansion_label: "+50 GB",
        storage_expansion_amount_formatted: "10.00 USD",
        storage_expansion_interval: "month",
        amount_due_today_formatted: "29.00 USD",
      },
    });
    mockApiPost.mockResolvedValue({ data: {} });
  });

  it("renders authoritative recurring price and included storage from preview", async () => {
    renderModal();

    expect(await screen.findByText(/29\.00 USD\/month/i)).toBeInTheDocument();
    expect(screen.getByText(/Includes 25 GB · Retention options up to 7 years/i)).toBeInTheDocument();
    expect(screen.getByText(/\+50 GB additional storage: 10\.00 USD\/month/i)).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "90 days" })).not.toBeChecked();
    expect(screen.getByRole("button", { name: /confirm activation/i })).toBeDisabled();
  });

  it("shows neutral unavailable copy when preview omits storage and retention values", async () => {
    mockApiGet.mockResolvedValue({ data: {} });

    renderModal();

    expect((await screen.findAllByText(/Pricing unavailable/i)).length).toBeGreaterThan(0);
    expect(screen.getByText(/Includes Included storage unavailable · Retention options up to 7 years/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /confirm activation/i })).toBeDisabled();
  });

  it("does not activate until the manager confirms", async () => {
    renderModal();

    expect(await screen.findByRole("button", { name: /confirm activation/i })).toBeInTheDocument();
    expect(mockApiPost).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("radio", { name: "1 year" }));
    fireEvent.click(screen.getByRole("button", { name: /confirm activation/i }));

    await waitFor(() => {
      expect(mockApiPost).toHaveBeenCalledWith("/billing/field-photos/activate", { retention_policy: "1y" });
    });
  });

  it("shows the exact add-on price but blocks activation until a base plan exists", async () => {
    mockApiGet.mockResolvedValue({
      data: {
        recurring_amount_formatted: "29.00 CAD",
        interval: "month",
        included_storage_label: "25 GB",
        retention_policy: "90d",
        retention_label: "90 days",
        retention_options: [{ code: "90d", label: "90 days" }],
        amount_due_today_formatted: "29.00 CAD",
        requires_base_subscription: true,
        activation_message: "Start a Schedulaa plan before activating Field Photos.",
      },
    });

    renderModal();

    expect(await screen.findByText(/29\.00 CAD\/month/i)).toBeInTheDocument();
    expect(screen.getByText(/Start a Schedulaa plan before activating Field Photos/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /confirm activation/i })).toBeDisabled();
    expect(mockApiPost).not.toHaveBeenCalled();
  });
});
