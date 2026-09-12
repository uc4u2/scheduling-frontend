import React from "react";
import { render, screen } from "@testing-library/react";
import { ThemeProvider, createTheme } from "@mui/material/styles";

import PublicEstimatePage from "./PublicEstimatePage";

const mockGetPublicEstimate = jest.fn();

jest.mock(
  "react-router-dom",
  () => ({
    useParams: () => ({ token: "public-token" }),
    useSearchParams: () => [new URLSearchParams()],
  }),
  { virtual: true }
);

jest.mock("../financeApi", () => ({
  getPublicEstimate: (...args) => mockGetPublicEstimate(...args),
  respondPublicEstimate: jest.fn(),
}));

function renderPage() {
  return render(
    <ThemeProvider theme={createTheme()}>
      <PublicEstimatePage />
    </ThemeProvider>
  );
}

describe("PublicEstimatePage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetPublicEstimate.mockResolvedValue({
      estimate: {
        title: "Website design",
        estimate_number: "EST-000001",
        status: "viewed",
        currency: "CAD",
        subtotal: 1500,
        tax_total: 0,
        discount_total: 0,
        total: 1500,
        issue_date: "2026-09-12",
        expiry_date: "2026-09-26",
        public_viewed_at: "2026-09-12T15:23:13.655511",
        company_name: "Schedulaa Web Design",
        company_phone: "5144300970",
        company_email: "webdesign@schedulaa.com",
        company_website: "www.schedulaa.com",
        company_address_zip: "L3Z 2E4",
        company_address_state: "ON",
        company_country: "CA",
        company_timezone: "America/Toronto",
        client_name: "Jeremy Macleod",
        client_email: "jeremy@example.com",
        line_items: [],
      },
    });
  });

  it("presents seller identity and dates without exposing raw audit timestamps", async () => {
    renderPage();

    expect(await screen.findByText("Schedulaa Web Design")).toBeInTheDocument();
    expect(screen.getByText("Ontario, Canada")).toBeInTheDocument();
    expect(screen.queryByText("L3Z 2E4")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "514-430-0970" })).toHaveAttribute(
      "href",
      "tel:5144300970"
    );
    expect(screen.getByRole("link", { name: "webdesign@schedulaa.com" })).toHaveAttribute(
      "href",
      "mailto:webdesign@schedulaa.com"
    );
    expect(screen.getByRole("link", { name: "www.schedulaa.com" })).toHaveAttribute(
      "href",
      "https://www.schedulaa.com"
    );
    expect(screen.getByText("Issue date: Sep 12, 2026")).toBeInTheDocument();
    expect(screen.getByText("Expiry date: Sep 26, 2026")).toBeInTheDocument();
    expect(screen.queryByText(/Viewed:/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/2026-09-12T15:23:13/i)).not.toBeInTheDocument();
  });
});
