import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import FinanceOverviewPage from "./FinanceOverviewPage";

const mockGetFinanceOverview = jest.fn();
const mockGetFinanceSummary = jest.fn();
const mockGetFinanceTaxContext = jest.fn();
const mockGetFinanceOwnerSnapshot = jest.fn();
const mockGetFinanceDocumentSettings = jest.fn();
const mockUpdateFinanceDocumentSettings = jest.fn();
const mockListMedia = jest.fn();
const mockTranslate = jest.fn((_key, options = {}) => options.defaultValue || _key);

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: mockTranslate,
  }),
}));

jest.mock("./financeApi", () => ({
  getFinanceOverview: (...args) => mockGetFinanceOverview(...args),
  getFinanceSummary: (...args) => mockGetFinanceSummary(...args),
  getFinanceTaxContext: (...args) => mockGetFinanceTaxContext(...args),
  getFinanceOwnerSnapshot: (...args) => mockGetFinanceOwnerSnapshot(...args),
  getFinanceDocumentSettings: (...args) => mockGetFinanceDocumentSettings(...args),
  updateFinanceDocumentSettings: (...args) => mockUpdateFinanceDocumentSettings(...args),
}));

jest.mock("../../utils/api", () => ({
  website: {
    listMedia: (...args) => mockListMedia(...args),
    uploadMedia: jest.fn(),
  },
}));

jest.mock("../../utils/authedCompany", () => ({
  getAuthedCompanyId: () => 36,
}));

jest.mock("../../components/ui/ThemedDateField", () => (props) => (
  <label>
    {props.label}
    <input aria-label={props.label} value={props.value} onChange={props.onChange} />
  </label>
));

jest.mock("./components/FinanceSettingsSnapshotCard", () => () => (
  <div>Finance settings snapshot controls</div>
));

jest.mock("./components/FinanceSalesTaxProfileCard", () => () => (
  <div>Business Finance Sales Tax controls</div>
));

const taxContext = {
  display_currency: "CAD",
  tax_country_code: "CA",
  tax_region_code: "ON",
  default_tax_rate: 13,
  tax_label: "HST",
  prices_include_tax: false,
};

const identityPayload = {
  finance_document_identity: {
    overrides: {},
    logo_media_id: null,
    show_email: true,
    show_phone: true,
    show_website: true,
    address_mode: "full",
    needs_review: false,
    resolved: {
      business_name: "Schedulaa Web Design",
      logo_url: "https://cdn.example.com/logo.png",
      public_email: "webdesign@schedulaa.com",
      public_phone: "5144300970",
      website: "www.schedulaa.com",
      address_street: "",
      address_city: "Toronto",
      address_state: "ON",
      address_zip: "",
      country_code: "CA",
      fields: {
        business_name: { value: "Schedulaa Web Design", source: "finance_document_profile", inherited_value: "Schedulaa" },
        logo: { value: "https://cdn.example.com/logo.png", source: "website_header_published", inherited_value: "https://cdn.example.com/logo.png" },
        public_email: { value: "webdesign@schedulaa.com", source: "company_profile", inherited_value: "webdesign@schedulaa.com" },
        public_phone: { value: "5144300970", source: "company_profile", inherited_value: "5144300970" },
        website: { value: "www.schedulaa.com", source: "company_profile", inherited_value: "www.schedulaa.com" },
        address_street: { value: "", source: "unavailable", inherited_value: "" },
        address_city: { value: "Toronto", source: "company_profile", inherited_value: "Toronto" },
        address_state: { value: "ON", source: "company_profile", inherited_value: "ON" },
        address_zip: { value: "", source: "unavailable", inherited_value: "" },
        country_code: { value: "CA", source: "company_profile", inherited_value: "CA" },
      },
    },
  },
};

const zeroOverview = {
  today_action_list: [],
  estimate_counts: { draft: 0 },
  work_orders_active_count: 0,
  work_orders_needing_scheduling_count: 0,
  field_reports_pending_review_count: 0,
  low_stock_count: 0,
  expenses_missing_receipt_count: 0,
  month_end_missing_items_count: 0,
};

const setViewport = (matches) => {
  window.matchMedia = jest.fn().mockImplementation((query) => ({
    matches,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  }));
};

const sectionButton = (name) => screen.getByRole("button", { name: new RegExp(name, "i") });

describe("FinanceOverviewPage progressive disclosure", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockTranslate.mockImplementation((_key, options = {}) => options.defaultValue || _key);
    window.localStorage.clear();
    window.localStorage.setItem("user_id", "77");
    setViewport(false);
    mockGetFinanceOverview.mockResolvedValue(zeroOverview);
    mockGetFinanceSummary.mockResolvedValue({
      currency: "CAD",
      estimate_total: 1500,
      gross_invoice_total: 0,
      expense_total: 0,
    });
    mockGetFinanceTaxContext.mockResolvedValue({ tax_context: taxContext });
    mockGetFinanceOwnerSnapshot.mockResolvedValue({
      currency: "CAD",
      revenue: {},
      expenses: {},
      operations: {},
      profitability: {},
      tax: {},
      readiness: { status: "ready", score: 100 },
    });
    mockGetFinanceDocumentSettings.mockResolvedValue(identityPayload);
    mockUpdateFinanceDocumentSettings.mockResolvedValue(identityPayload);
    mockListMedia.mockResolvedValue({ items: [] });
  });

  test("uses compact default states and keeps money expanded", async () => {
    render(<FinanceOverviewPage />);
    expect(await screen.findByText("Business Finance overview")).toBeInTheDocument();

    await waitFor(() => expect(sectionButton("Finance Setup & Configuration")).toHaveAttribute("aria-expanded", "false"));
    expect(sectionButton("Today Needs Your Attention")).toHaveAttribute("aria-expanded", "false");
    expect(sectionButton("Money Snapshot")).toHaveAttribute("aria-expanded", "true");
    expect(sectionButton("Operations Snapshot")).toHaveAttribute("aria-expanded", "false");
    expect(sectionButton("Owner / Reporting Snapshot")).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByText(/Estimates CA\$1,500/)).toBeInTheDocument();
    expect(screen.getByText(/Finance Identity: Schedulaa Web Design/)).toBeInTheDocument();
  });

  test("auto-expands attention only when actionable counts are non-zero", async () => {
    mockGetFinanceOverview.mockResolvedValue({
      ...zeroOverview,
      estimate_counts: { draft: 1 },
    });
    render(<FinanceOverviewPage />);

    await waitFor(() => {
      expect(sectionButton("Today Needs Your Attention")).toHaveAttribute("aria-expanded", "true");
    });
    expect(screen.getByText("1 draft estimate")).toBeInTheDocument();
  });

  test("independent toggles work by mouse and keyboard", async () => {
    render(<FinanceOverviewPage />);
    await screen.findByText("Business Finance overview");

    const setup = sectionButton("Finance Setup & Configuration");
    fireEvent.click(setup);
    expect(setup).toHaveAttribute("aria-expanded", "true");

    const owner = sectionButton("Owner / Reporting Snapshot");
    fireEvent.keyDown(owner, { key: "Enter", code: "Enter", charCode: 13 });
    await waitFor(() => expect(owner).toHaveAttribute("aria-expanded", "true"));
    expect(setup).toHaveAttribute("aria-expanded", "true");
  });

  test("restores saved manager preferences", async () => {
    window.localStorage.setItem(
      "finance-overview-sections:v1:36:77",
      JSON.stringify({ setup: true, attention: true, money: false, operations: false, owner: true })
    );
    render(<FinanceOverviewPage />);
    await screen.findByText("Business Finance overview");

    await waitFor(() => expect(sectionButton("Finance Setup & Configuration")).toHaveAttribute("aria-expanded", "true"));
    expect(sectionButton("Money Snapshot")).toHaveAttribute("aria-expanded", "false");
    expect(sectionButton("Owner / Reporting Snapshot")).toHaveAttribute("aria-expanded", "true");
    expect(sectionButton("Today Needs Your Attention")).toHaveAttribute("aria-expanded", "false");
  });

  test("keeps Finance Identity controls functional inside expanded setup", async () => {
    render(<FinanceOverviewPage />);
    await screen.findByText("Business Finance overview");
    fireEvent.click(sectionButton("Finance Setup & Configuration"));

    const nameInput = await screen.findByLabelText("Document business name override");
    fireEvent.change(nameInput, { target: { value: "Customer Documents Brand" } });
    fireEvent.click(screen.getByRole("button", { name: "Save Finance identity" }));

    await waitFor(() => expect(mockUpdateFinanceDocumentSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        finance_document_identity: expect.objectContaining({
          overrides: expect.objectContaining({ business_name: "Customer Documents Brand" }),
        }),
      })
    ));
  });

  test("mobile starts configuration collapsed and contains horizontal overflow", async () => {
    setViewport(true);
    window.localStorage.setItem(
      "finance-overview-sections:v1:36:77",
      JSON.stringify({ ...zeroOverview, setup: true })
    );
    render(<FinanceOverviewPage />);
    await screen.findByText("Business Finance overview");

    await waitFor(() => expect(sectionButton("Finance Setup & Configuration")).toHaveAttribute("aria-expanded", "false"));
    expect(screen.getByTestId("finance-overview-dashboard")).toHaveStyle({
      maxWidth: "100%",
      overflowX: "hidden",
    });
  });
});
