import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

jest.mock("../../../utils/api", () => {
  const api = {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } },
  };
  return {
    __esModule: true,
    default: api,
    api,
    wb: { publicBySlug: jest.fn() },
    payrollSetupApi: {
      listWorkLocations: jest.fn(),
      createWorkLocation: jest.fn(),
      updateWorkLocation: jest.fn(),
      deactivateWorkLocation: jest.fn(),
      backfillDefaultWorkLocation: jest.fn(),
      getPayrollSetupProfile: jest.fn(),
      updatePayrollSetupProfile: jest.fn(),
      getCheckReadiness: jest.fn(),
      getCheckStatus: jest.fn(),
      getCheckConfig: jest.fn(),
      getCheckCompanyPayload: jest.fn(),
      getCheckWorkplacePayloads: jest.fn(),
      getCheckEmployeePayloads: jest.fn(),
      syncCheckSandboxCompany: jest.fn(),
      syncCheckSandboxWorkplaces: jest.fn(),
      syncCheckSandboxEmployees: jest.fn(),
      listEmployeeWorkLocations: jest.fn(),
      updateEmployeePrimaryWorkLocation: jest.fn(),
    },
    payrollProviderSyncApi: {
      setupStatus: jest.fn(),
      listRuns: jest.fn(),
      listEmployeeMappings: jest.fn(),
      listPayItemMappings: jest.fn(),
      listQuickBooksEmployeeCandidates: jest.fn(),
      listQuickBooksPayItemCandidates: jest.fn(),
    },
  };
});

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: { language: "en" },
  }),
}));

jest.mock(
  "react-router-dom",
  () => ({
    MemoryRouter: ({ children }) => <div>{children}</div>,
    useNavigate: () => jest.fn(),
  }),
  { virtual: true }
);

jest.mock("../CompanySlugManager", () => () => <div>Slug manager</div>);
jest.mock("../../../components/ui/ManagementFrame", () => ({ children, title, subtitle }) => (
  <div>
    <h1>{title}</h1>
    <p>{subtitle}</p>
    {children}
  </div>
));
jest.mock("../../../components/billing/UpgradeNoticeBanner", () => () => <div>Upgrade notice</div>);
jest.mock("../../../pages/sections/hooks/useRecruiterDepartments", () => ({
  useDepartments: () => [{ id: 4, name: "Operations" }],
}));
jest.mock("../../../components/billing/useBillingStatus", () => () => ({
  status: { trial_end: null },
}));
jest.mock("../../../components/billing/billingLabels", () => ({
  formatBillingNextDateLabel: jest.fn(() => "Next billing date"),
}));
jest.mock("../../../pages/sections/management/components/AddMemberHelpDrawer", () => () => <div>Add member help</div>);
jest.mock("../../../utils/mobileCompliance", () => ({
  isMobileComplianceMode: () => false,
  MOBILE_PAYMENTS_MESSAGE: "Mobile billing disabled",
}));
jest.mock("../../../components/TimezoneSelect", () => ({ value, onChange }) => (
  <input
    aria-label="Timezone"
    value={value || ""}
    onChange={(event) => onChange?.(event.target.value)}
  />
));
jest.mock("../../../utils/currency", () => ({
  getCurrencyOptions: () => [{ code: "USD", label: "USD" }],
  resolveCurrencyForCountry: () => "USD",
  normalizeCurrency: (value) => value,
  setActiveCurrency: jest.fn(),
  isSupportedCurrency: () => true,
}));
jest.mock("../../../utils/apiError", () => ({
  extractApiErrorMessage: jest.fn(async (err, fallback) => err?.message || fallback),
}));

const { MemoryRouter } = require("react-router-dom");
const apiModule = require("../../../utils/api");
const mockApi = apiModule.default;
const mockPayrollSetupApi = apiModule.payrollSetupApi;
const mockPayrollProviderSyncApi = apiModule.payrollProviderSyncApi;
const CompanyProfile = require("../CompanyProfile").default;
const PayrollProviderSync = require("../PayrollProviderSync").default;
const EmployeeProfileForm = require("../../Payroll/EmployeeProfileForm").default;
const AddRecruiter = require("../../../AddRecruiter").default;

const renderWithRouter = (node) => render(<MemoryRouter>{node}</MemoryRouter>);

beforeEach(() => {
  jest.clearAllMocks();
  mockApi.get.mockImplementation((url) => {
    if (url === "/admin/company-profile") {
      return Promise.resolve({
        data: {
          id: 1,
          name: "Schedulaa",
          slug: "schedulaa",
          email: "team@schedulaa.com",
          country_code: "US",
          address_street: "123 Main St",
          address_city: "Buffalo",
          address_state: "NY",
          address_zip: "14201",
          timezone: "America/New_York",
        },
      });
    }
    if (url === "/api/departments") {
      return Promise.resolve({ data: [] });
    }
    if (url === "/api/website/forms") {
      return Promise.resolve({ data: [{ id: 1, key: "contact", notify_emails: "" }] });
    }
    return Promise.resolve({ data: [] });
  });
  mockApi.post.mockResolvedValue({ data: {} });
  mockApi.put.mockResolvedValue({ data: {} });
  mockApi.patch.mockResolvedValue({ data: {} });

  mockPayrollSetupApi.getPayrollSetupProfile.mockResolvedValue({
    profile: {
      payroll_intent: "csv_handoff",
      payroll_country: "US",
      average_employee_count: 5,
      current_payroll_provider: "ADP",
    },
  });
  mockPayrollSetupApi.listWorkLocations.mockResolvedValue({
    items: [
      {
        id: 11,
        name: "HQ",
        location_type: "main",
        address_line1: "123 Main St",
        city: "Buffalo",
        state: "NY",
        postal_code: "14201",
        country: "US",
        timezone: "America/New_York",
        is_default: true,
        is_active: true,
      },
    ],
  });
  mockPayrollSetupApi.updatePayrollSetupProfile.mockResolvedValue({
    profile: {
      payroll_intent: "csv_handoff",
      payroll_country: "US",
      average_employee_count: 5,
      current_payroll_provider: "ADP",
    },
  });
  mockPayrollSetupApi.getCheckReadiness.mockResolvedValue({
    check_mode: "not_connected",
    check_configured: false,
    check_company_mapped: false,
    mapped_workplaces_count: 0,
    mapped_employees_count: 0,
    ready_for_local_check_setup: false,
    ready_for_check_setup: false,
    counts: {
      active_work_locations: 1,
      employees_total: 2,
      employees_missing_primary_work_location: 0,
      multi_state_employee_count: 0,
    },
    unsupported_conditions: [
      { code: "CHECK_NOT_ENABLED_LOCALLY", message: "Not live yet", severity: "info" },
    ],
    warnings: [],
    setup_profile: {
      payroll_intent: "csv_handoff",
      payroll_country: "US",
    },
    missing_work_location_address: [],
    missing_employee_primary_work_location: [],
  });
  mockPayrollSetupApi.getCheckStatus.mockResolvedValue({
    configured: false,
    environment: "sandbox",
    status: "not_configured",
    sandbox_sync_enabled: false,
  });
  mockPayrollSetupApi.getCheckCompanyPayload.mockResolvedValue({ payload: { name: "Schedulaa" }, missing_fields: [], warnings: [] });
  mockPayrollSetupApi.getCheckWorkplacePayloads.mockResolvedValue({ items: [] });
  mockPayrollSetupApi.getCheckEmployeePayloads.mockResolvedValue({ items: [] });
  mockPayrollSetupApi.syncCheckSandboxCompany.mockResolvedValue({});
  mockPayrollSetupApi.syncCheckSandboxWorkplaces.mockResolvedValue({});
  mockPayrollSetupApi.syncCheckSandboxEmployees.mockResolvedValue({});
  mockPayrollSetupApi.listEmployeeWorkLocations.mockResolvedValue({
    items: [
      {
        id: 11,
        name: "HQ",
        is_active: true,
      },
    ],
  });
  mockPayrollProviderSyncApi.setupStatus.mockResolvedValue({
    connection_status: "not_connected",
    readiness: "setup_required",
    capabilities: {},
    employee_mapping_count: 0,
    pay_item_mapping_count: 0,
  });
  mockPayrollProviderSyncApi.listRuns.mockResolvedValue({
    items: [],
    pagination: { limit: 10, offset: 0, has_more: false },
  });
  mockPayrollProviderSyncApi.listEmployeeMappings.mockResolvedValue({ items: [] });
  mockPayrollProviderSyncApi.listPayItemMappings.mockResolvedValue({ items: [] });
  mockPayrollProviderSyncApi.listQuickBooksEmployeeCandidates.mockResolvedValue({ available: false, items: [] });
  mockPayrollProviderSyncApi.listQuickBooksPayItemCandidates.mockResolvedValue({ available: false, items: [] });
});

test("CompanyProfile loads payroll setup profile and work locations and can save payroll setup", async () => {
  renderWithRouter(<CompanyProfile token="test-token" />);

  expect(await screen.findByText("manager.companyProfile.title")).toBeInTheDocument();
  fireEvent.click(screen.getByText(/Payroll Settings \(optional\)/i));

  await waitFor(() => expect(mockPayrollSetupApi.getPayrollSetupProfile).toHaveBeenCalled());
  await waitFor(() => expect(mockPayrollSetupApi.listWorkLocations).toHaveBeenCalled());
  expect(await screen.findByText(/^HQ$/i)).toBeInTheDocument();
  expect(screen.getAllByLabelText(/ZIP Code/i).length).toBeGreaterThan(0);

  fireEvent.click(screen.getByRole("button", { name: /Save payroll setup/i }));
  await waitFor(() => expect(mockPayrollSetupApi.updatePayrollSetupProfile).toHaveBeenCalled());
});

test("CompanyProfile shows Canadian labels when company country is Canada", async () => {
  mockApi.get.mockImplementation((url) => {
    if (url === "/admin/company-profile") {
      return Promise.resolve({
        data: {
          id: 1,
          name: "Schedulaa CA",
          slug: "schedulaa-ca",
          email: "team-ca@schedulaa.com",
          country_code: "CA",
          address_street: "123 Main St",
          address_city: "Toronto",
          address_state: "ON",
          address_zip: "M5V 2T6",
          timezone: "America/Toronto",
        },
      });
    }
    if (url === "/api/departments") return Promise.resolve({ data: [] });
    if (url === "/api/website/forms") return Promise.resolve({ data: [{ id: 1, key: "contact", notify_emails: "" }] });
    return Promise.resolve({ data: [] });
  });
  mockPayrollSetupApi.getPayrollSetupProfile.mockResolvedValue({ profile: { payroll_intent: "none", payroll_country: "CA" } });

  renderWithRouter(<CompanyProfile token="test-token" />);
  fireEvent.click(await screen.findByText(/Payroll Settings \(optional\)/i));
  expect(await screen.findByLabelText(/Postal Code/i)).toBeInTheDocument();
});

test("PayrollProviderSync renders local Check readiness panel and keeps Check in coming-soon mode", async () => {
  mockPayrollSetupApi.getCheckReadiness.mockResolvedValueOnce({
    check_mode: "not_connected",
    check_configured: false,
    check_company_mapped: false,
    mapped_workplaces_count: 0,
    mapped_employees_count: 0,
    ready_for_local_check_setup: false,
    ready_for_check_setup: false,
    counts: {
      active_work_locations: 1,
      employees_total: 2,
      employees_missing_primary_work_location: 0,
      multi_state_employee_count: 0,
    },
    unsupported_conditions: [{ code: "CHECK_NOT_ENABLED_LOCALLY", message: "Not live yet", severity: "info" }],
    warnings: [],
    setup_profile: { payroll_intent: "check_embedded_us", payroll_country: "US" },
    missing_work_location_address: [],
    missing_employee_primary_work_location: [],
  });
  renderWithRouter(
    <PayrollProviderSync
      departmentFilter=""
      selectedRecruiter=""
      exportAllEmployees={false}
      exportEmployeeIds={[]}
      region="us"
      startDate="2026-05-04"
      endDate="2026-05-10"
      payFrequency="weekly"
      payroll={{ state: "NY" }}
      recruiters={[]}
      filteredRecruiters={[]}
      setSnackbar={jest.fn()}
    />
  );

  expect(await screen.findByText(/Check Payroll Readiness/i)).toBeInTheDocument();
  expect(screen.getAllByText(/Check embedded payroll is not live yet/i).length).toBeGreaterThan(0);
  expect(screen.getByText(/Check coming later/i)).toBeInTheDocument();
  expect(mockPayrollSetupApi.getCheckReadiness).toHaveBeenCalled();
  expect(mockPayrollSetupApi.getCheckStatus).toHaveBeenCalled();
  expect(screen.getByRole("button", { name: /Preview company payload/i })).toBeDisabled();
  expect(screen.getByRole("button", { name: /Sync company to sandbox/i })).toBeDisabled();
  expect(screen.queryByText(/Check submit/i)).not.toBeInTheDocument();
});

test("EmployeeProfileForm shows Primary Payroll Location in Payroll & compliance", async () => {
  mockApi.get.mockImplementation((url) => {
    if (url === "/api/departments") return Promise.resolve({ data: [] });
    if (url === "/manager/recruiters") {
      return Promise.resolve({
        data: {
          recruiters: [{ id: 7, first_name: "Ava", last_name: "Worker", email: "ava@example.com", role: "recruiter", status: "active" }],
          total: 1,
        },
      });
    }
    if (url === "/api/recruiters/7") {
      return Promise.resolve({
        data: {
          id: 7,
          first_name: "Ava",
          last_name: "Worker",
          email: "ava@example.com",
          role: "recruiter",
          company_id: 1,
          country: "USA",
          province: "NY",
          timezone: "America/New_York",
          address: { street: "", city: "", state: "", zip: "" },
          primary_work_location_id: "",
        },
      });
    }
    return Promise.resolve({ data: [] });
  });

  renderWithRouter(<EmployeeProfileForm token="test-token" isManager />);
  fireEvent.mouseDown(await screen.findByLabelText(/manager.employeeProfiles.filters.employee/i));
  fireEvent.click(await screen.findByText(/Ava Worker/));
  fireEvent.click(await screen.findByText(/Payroll & compliance/i));
  expect((await screen.findAllByText(/Primary Payroll Location/i)).length).toBeGreaterThan(0);
});

test("AddRecruiter shows country dropdown, uses TimezoneSelect, and auto-selects the only payroll location", async () => {
  renderWithRouter(<AddRecruiter />);

  expect(await screen.findByRole("heading", { name: /Add Team Member/i })).toBeInTheDocument();
  expect(screen.getByLabelText(/^Country$/i)).toBeInTheDocument();
  expect(screen.queryByText(/Canada - Quebec/i)).not.toBeInTheDocument();
  expect(screen.getByLabelText(/^Timezone$/i)).toBeInTheDocument();
  expect(await screen.findByDisplayValue(/HQ/i)).toBeInTheDocument();
  expect(screen.getByText(/Payroll Location is the physical work location used for payroll setup/i)).toBeInTheDocument();
});

test("AddRecruiter shows Canadian labels and payroll-location dropdown when multiple active locations exist", async () => {
  mockApi.get.mockImplementation((url) => {
    if (url === "/admin/company-profile") {
      return Promise.resolve({
        data: {
          id: 1,
          name: "Schedulaa CA",
          email: "team@schedulaa.com",
          country_code: "CA",
          province_code: "ON",
          address_street: "123 King St",
          address_city: "Toronto",
          address_zip: "M5V 2T6",
          timezone: "America/Toronto",
        },
      });
    }
    if (url === "/api/departments") return Promise.resolve({ data: [] });
    return Promise.resolve({ data: [] });
  });
  mockPayrollSetupApi.getPayrollSetupProfile.mockResolvedValue({
    profile: { payroll_intent: "check_embedded_us", payroll_country: "US" },
  });
  mockPayrollSetupApi.listWorkLocations.mockResolvedValue({
    items: [
      { id: 11, name: "Toronto HQ", is_active: true, country: "CA", state: "ON", timezone: "America/Toronto" },
      { id: 12, name: "Ottawa Office", is_active: true, country: "CA", state: "ON", timezone: "America/Toronto" },
    ],
  });

  renderWithRouter(<AddRecruiter />);

  expect(await screen.findByLabelText(/Postal Code/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/Primary Payroll Location/i)).toBeInTheDocument();
});
