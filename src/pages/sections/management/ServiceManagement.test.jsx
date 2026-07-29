import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ThemeProvider, createTheme } from "@mui/material/styles";

import ServiceManagement from "./ServiceManagement";

const mockApiGet = jest.fn();
const mockApiPost = jest.fn();
const mockApiDelete = jest.fn();

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key, fallback) => fallback || key,
    i18n: { language: "en" },
  }),
}));

jest.mock("../../../utils/api", () => ({
  __esModule: true,
  default: {
    get: (...args) => mockApiGet(...args),
    post: (...args) => mockApiPost(...args),
    delete: (...args) => mockApiDelete(...args),
  },
}));

jest.mock("@mui/x-data-grid", () => ({
  DataGrid: () => <div data-testid="services-grid" />,
}));

jest.mock("../../../components/common/CategoryAutocomplete", () => (props) => (
  <input
    aria-label={typeof props.label === "string" ? props.label : "Category"}
    value={props.value || ""}
    onChange={(event) => props.onChange(event.target.value)}
  />
));

jest.mock("../../../components/common/CategoryManagerDialog", () => () => null);
jest.mock("../../../components/tutorials/TutorialHelpCard", () => () => null);

function renderPage() {
  return render(
    <ThemeProvider theme={createTheme()}>
      <ServiceManagement token="token-123" />
    </ThemeProvider>
  );
}

describe("ServiceManagement booking preview", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockApiDelete.mockResolvedValue({ data: {} });
    mockApiGet.mockImplementation((url) => {
      if (url.startsWith("/booking/services?active=true")) return Promise.resolve({ data: [] });
      if (url === "/manager/recruiters") return Promise.resolve({ data: { recruiters: [] } });
      if (url === "/booking/employee-services") return Promise.resolve({ data: [] });
      if (url === "/booking/service-categories") return Promise.resolve({ data: [] });
      return Promise.resolve({ data: [] });
    });
    mockApiPost.mockImplementation((url) => {
      if (url === "/api/manager/booking-payment-preview") {
        return Promise.resolve({
          data: {
            domain: "booking",
            preview_only: true,
            source: { type: "service_draft", id: null },
            payment_mode: "offline",
            currency: "CAD",
            customer_view: {
              service_subtotal: "120.00",
              addons_total: "0.00",
              discount_total: "0.00",
              subtotal_before_tax: "120.00",
              tax_amount: null,
              tax_amount_status: "manual",
              amount_due_now: "0.00",
              amount_due_now_status: "none",
              amount_due_later: "120.00",
              total_expected: "120.00",
            },
            payment: {
              card_collected: false,
              card_saved: false,
              online_charge_created: false,
              collection_timing: "outside_schedulaa",
              stripe_automatic_tax: false,
            },
            tax: {
              handling_mode: "manual",
              prices_include_tax: false,
              exact_amount_available: false,
              message: "Schedulaa does not calculate offline booking tax automatically.",
            },
            settings_source: {
              payment_mode: "Checkout Pro & Payments",
              currency: "Company currency settings",
              tax: "Checkout Pro / Stripe checkout",
            },
            warnings: ["This service preview uses unsaved form values."],
            line_items: [{ code: "service", label: "Preview Service", amount: "120.00" }],
            side_effects: {
              booking_created: false,
              slot_reserved: false,
              card_saved: false,
              payment_created: false,
              stripe_object_created: false,
              email_sent: false,
            },
          },
        });
      }
      return Promise.resolve({ data: {} });
    });
  });

  test("previews unsaved service values and marks stale after edits", async () => {
    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: /manager\.service\.buttonAdd/i }));

    const nameInput = screen.getByLabelText(/name/i);
    const priceInput = screen.getByLabelText(/manager\.service\.dialog\.basePrice/i);

    fireEvent.change(nameInput, { target: { value: "Preview Service" } });
    fireEvent.change(priceInput, { target: { value: "120" } });

    fireEvent.click(screen.getByRole("button", { name: /preview customer payment/i }));

    expect(await screen.findByRole("heading", { name: /preview customer payment/i })).toBeInTheDocument();
    expect(await screen.findByText(/Customer pays later/i)).toBeInTheDocument();

    fireEvent.change(priceInput, { target: { value: "130" } });

    await waitFor(() =>
      expect(
        screen.getByText(/The Service changed after this preview\. Refresh to see current payment behavior\./i)
      ).toBeInTheDocument()
    );
  });
});
