import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useMediaQuery } from "@mui/material";

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
      getCheckLaunchReadiness: jest.fn(),
      getCheckOnboardingOverview: jest.fn(),
      startCheckEmployerOnboarding: jest.fn(),
      sendCheckEmployeeOnboardingInvite: jest.fn(),
      resendCheckEmployeeOnboardingInvite: jest.fn(),
      refreshCheckEmployeeOnboardingStatus: jest.fn(),
      listCheckOnboardingAuditEvents: jest.fn(),
      listCheckComponentSessions: jest.fn(),
      createCheckComponentSessionPlaceholder: jest.fn(),
      getCheckConfig: jest.fn(),
      getCheckCompanyPayload: jest.fn(),
      getCheckWorkplacePayloads: jest.fn(),
      getCheckEmployeePayloads: jest.fn(),
      syncCheckSandboxCompany: jest.fn(),
      syncCheckSandboxWorkplaces: jest.fn(),
      syncCheckSandboxEmployees: jest.fn(),
      listEmployeeWorkLocations: jest.fn(),
      updateEmployeePrimaryWorkLocation: jest.fn(),
      getEmployeeCheckOnboarding: jest.fn(),
      startEmployeeCheckOnboarding: jest.fn(),
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
    useLocation: () => ({ pathname: "/employee/home" }),
    Navigate: ({ to }) => <div>Navigate {to}</div>,
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
jest.mock("@mui/material", () => {
  const actual = jest.requireActual("@mui/material");
  return {
    ...actual,
    useMediaQuery: jest.fn(() => true),
  };
});
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
const RecruiterHomePage = require("../../recruiter/RecruiterHomePage").default;

jest.mock("../../../components/recruiter/RecruiterTabs", () => () => <div>Recruiter tabs</div>);
jest.mock("../../../components/employee/MobileEmployeeHome", () => {
  const Component = () => <div>Employee home shortcuts</div>;
  return {
    __esModule: true,
    default: Component,
    employeeShortcutIconMap: {
      "my-time": <span>time</span>,
      calendar: <span>calendar</span>,
      availability: <span>availability</span>,
      "my-shift": <span>shift</span>,
      "time-off": <span>timeoff</span>,
      "shift-swap": <span>swap</span>,
      "work-orders": <span>workorders</span>,
      "field-reports": <span>fieldreports</span>,
      training: <span>training</span>,
      communications: <span>communications</span>,
    },
  };
});
jest.mock("../../../components/recruiter/useRecruiterTabsAccess", () => () => ({
  allowHrAccess: false,
  isLoading: false,
}));

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
    if (url === "/auth/me") {
      return Promise.resolve({ data: { id: 55, email: "taylor@example.com" } });
    }
    if (url === "/profile") {
      return Promise.resolve({ data: { first_name: "Taylor", last_name: "North" } });
    }
    if (url === "/recruiter/profile") {
      return Promise.resolve({ data: { recruiter: { first_name: "Taylor", last_name: "North" } } });
    }
    if (url === "/api/recruiters/55") {
      return Promise.resolve({ data: { id: 55, first_name: "Taylor", last_name: "North" } });
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
    check_onboard_enabled: false,
  });
  mockPayrollSetupApi.getCheckLaunchReadiness.mockResolvedValue({
    ready_for_sandbox_payload_preview: true,
    ready_for_sandbox_company_sync: false,
    ready_for_sandbox_workplace_sync: false,
    ready_for_sandbox_employee_sync: false,
    ready_for_real_onboarding_generation: false,
    ready_for_payroll_preview: false,
    company_checklist: [
      { key: "company_profile_exists", value: true, ok: true, severity: "info" },
      { key: "company_fein_present", value: false, ok: false, severity: "error" },
    ],
    workplace_checklist: [
      { key: "active_work_locations_count", value: 1, ok: true, severity: "info" },
    ],
    employee_checklist: [
      { key: "eligible_employee_count", value: 1, ok: true, severity: "info" },
    ],
    onboarding_checklist: [
      { key: "check_onboard_enabled", value: false, ok: false, severity: "warning" },
    ],
    blockers: [{ code: "MISSING_COMPANY_FEIN", message: "Add FEIN/EIN", severity: "error" }],
    warnings: ["Configure Check sandbox API key before sandbox sync."],
    next_steps: ["Add FEIN/EIN in Company Profile.", "Preview company payload."],
    counts: {
      active_work_locations_count: 1,
      eligible_employee_count: 1,
      employees_missing_primary_work_location_count: 0,
      mapped_workplaces_count: 0,
      mapped_employee_count: 0,
      recent_audit_events_count: 0,
    },
    employee_rows: [],
    check_configured: false,
    check_connected: false,
    check_mode: "not_connected",
    environment: "sandbox",
  });
  mockPayrollSetupApi.getCheckOnboardingOverview.mockResolvedValue({
    check_configured: false,
    check_connected: false,
    check_mode: "not_connected",
    environment: "sandbox",
    company_mapping_status: "not_ready",
    workplace_mapping_status: "not_mapped",
    employee_mapping_status: "not_mapped",
    company_onboard_status: "not_connected",
    employee_onboard_summary: {
      total: 1,
      mapped: 0,
      completed: 0,
      needs_attention: 0,
      blocking: 0,
      items: [
        {
          employee_id: 55,
          employee_name: "Taylor North",
          primary_work_location_name: "HQ",
          check_employee_id: null,
          onboard_status: "not_started",
          blocking_steps: [],
        },
      ],
    },
    requirements_summary: { total: 0, blocking: 0, items: [] },
    component_sessions_summary: { total: 0, latest: [] },
    next_steps: ["Sync the company to Check sandbox or production before employer onboarding."],
    warnings: [],
    blockers: [],
  });
  mockPayrollSetupApi.listCheckComponentSessions.mockResolvedValue({ items: [] });
  mockPayrollSetupApi.createCheckComponentSessionPlaceholder.mockResolvedValue({
    item: {
      id: 1,
      component_type: "employee_onboard",
      entity_type: "employee",
      local_entity_id: 55,
      status: "pending_config",
    },
  });
  mockPayrollSetupApi.startCheckEmployerOnboarding.mockResolvedValue({});
  mockPayrollSetupApi.sendCheckEmployeeOnboardingInvite.mockResolvedValue({});
  mockPayrollSetupApi.resendCheckEmployeeOnboardingInvite.mockResolvedValue({});
  mockPayrollSetupApi.refreshCheckEmployeeOnboardingStatus.mockResolvedValue({});
  mockPayrollSetupApi.listCheckOnboardingAuditEvents.mockResolvedValue({ items: [] });
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
  mockPayrollSetupApi.getEmployeeCheckOnboarding.mockResolvedValue({
    payroll_intent: "check_embedded_us",
    check_enabled: false,
    check_configured: false,
    check_employee_mapped: false,
    should_show_card: true,
    employee_id: 55,
    employee_name: "Taylor North",
    primary_payroll_location: { id: 11, name: "HQ" },
    onboard_status: "not_started",
    blocking_steps: [],
    remaining_steps: [],
    last_session_status: null,
    can_start_onboarding: false,
    disabled_reason: "Payroll onboarding will be available once your employer connects Check payroll.",
    message: "Sensitive payroll setup, including tax forms and bank details, will be completed through Check's secure payroll onboarding flow later.",
  });
  mockPayrollSetupApi.startEmployeeCheckOnboarding.mockResolvedValue({});
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
  expect(screen.getByText(/Check Launch Readiness/i)).toBeInTheDocument();
  expect(screen.getByText(/Use this checklist to prepare for Check sandbox testing/i)).toBeInTheDocument();
  expect(screen.getByText(/Add FEIN\/EIN in Company Profile/i)).toBeInTheDocument();
  expect(screen.getAllByText(/Check embedded payroll is not live yet/i).length).toBeGreaterThan(0);
  expect(screen.getByText(/Check coming later/i)).toBeInTheDocument();
  expect(mockPayrollSetupApi.getCheckReadiness).toHaveBeenCalled();
  expect(mockPayrollSetupApi.getCheckStatus).toHaveBeenCalled();
  expect(mockPayrollSetupApi.getCheckLaunchReadiness).toHaveBeenCalled();
  expect(mockPayrollSetupApi.getCheckOnboardingOverview).toHaveBeenCalled();
  expect(screen.getByRole("button", { name: /Preview company payload/i })).toBeDisabled();
  expect(screen.getByRole("button", { name: /Sync company to sandbox/i })).toBeDisabled();
  expect(screen.getByText(/Check Payroll Onboarding/i)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /Start employer onboarding/i })).toBeDisabled();
  expect(screen.getAllByRole("button", { name: /Send invite/i })[0]).toBeDisabled();
  expect(screen.getAllByRole("button", { name: /Resend invite/i })[0]).toBeDisabled();
  expect(screen.getByText(/Payroll-sensitive onboarding, including SSN, tax forms, and bank details/i)).toBeInTheDocument();
  expect(screen.queryByText(/direct deposit/i)).not.toBeInTheDocument();
  expect(screen.queryByText(/Check submit/i)).not.toBeInTheDocument();
  expect(screen.getByText(/Recent onboarding activity/i)).toBeInTheDocument();
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

test("RecruiterHomePage shows employee payroll setup card with disabled onboarding action", async () => {
  useMediaQuery.mockReturnValue(true);
  renderWithRouter(<RecruiterHomePage />);
  expect(await screen.findByText(/Payroll Setup/i)).toBeInTheDocument();
  expect(screen.getByText(/Sensitive payroll onboarding, including SSN, tax forms, and bank details/i)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /Complete payroll setup/i })).toBeDisabled();
  expect(screen.queryByText(/direct deposit/i)).not.toBeInTheDocument();
});
