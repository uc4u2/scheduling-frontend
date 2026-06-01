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
    xeroIntegration: {
      status: jest.fn(),
      validate: jest.fn(),
    },
    quickbooksIntegration: {
      status: jest.fn(),
      validate: jest.fn(),
    },
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
      getCheckPayrollPackagePreview: jest.fn(),
      getCheckOnboardingOverview: jest.fn(),
      startCheckEmployerOnboarding: jest.fn(),
      sendCheckEmployeeOnboardingInvite: jest.fn(),
      resendCheckEmployeeOnboardingInvite: jest.fn(),
      refreshCheckEmployeeOnboardingStatus: jest.fn(),
      bulkSendCheckEmployeeOnboardingInvites: jest.fn(),
      bulkResendCheckEmployeeOnboardingInvites: jest.fn(),
      bulkRefreshCheckEmployeeOnboardingStatus: jest.fn(),
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
      runDetail: jest.fn(),
      getCheckProviderDataPackage: jest.fn(),
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
const mockXeroIntegration = apiModule.xeroIntegration;
const mockQuickbooksIntegration = apiModule.quickbooksIntegration;
const CompanyProfile = require("../CompanyProfile").default;
const PayrollProviderSync = require("../PayrollProviderSync").default;
const PayrollPreview = require("../PayrollPreview").default;
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
  mockXeroIntegration.status.mockResolvedValue({ connected: false });
  mockXeroIntegration.validate.mockResolvedValue({ payroll: { ok: false } });
  mockQuickbooksIntegration.status.mockResolvedValue({ connected: false });
  mockQuickbooksIntegration.validate.mockResolvedValue({ payroll: { ok: false } });

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
      { key: "total_employee_records_reviewed", value: 1, ok: true, severity: "info" },
      { key: "eligible_payroll_employee_count", value: 1, ok: true, severity: "info" },
    ],
    onboarding_checklist: [
      { key: "check_onboard_enabled", value: false, ok: false, severity: "warning" },
      { key: "latest_employer_session_status", value: "created_placeholder", ok: false, severity: "warning" },
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
  mockPayrollSetupApi.getCheckPayrollPackagePreview.mockResolvedValue({
    provider: "check",
    mode: "preview_only",
    check_api_called: false,
    payroll: {
      provider_run_id: 321,
      period_start: "2026-05-04",
      period_end: "2026-05-10",
      payday: "2026-05-10",
      pay_frequency: "weekly",
      source_hash: "checkpkg1234567890",
    },
    items: [
      {
        employee_id: 55,
        employee_name: "Taylor North",
        check_employee_id: null,
        primary_work_location_id: 11,
        check_workplace_id: null,
        earnings: [
          { line_id: 1, earning_key: "regular_hours", check_type_code: "hourly", amount: 200, hours: 8, work_location_id: 11, notes: "Regular hours map to hourly earnings." },
        ],
        reimbursements: [],
        not_sent: [{ code: "NOT_SENT_TO_CHECK_MVP", message: "Local net pay remains informational. Check calculates official net pay later." }],
        warnings: [{ code: "TIP_TYPE_AMBIGUOUS", message: "Treating period tips as simple paycheck tips for preview only." }],
        blockers: [{ code: "CHECK_EMPLOYEE_NOT_MAPPED", message: "Employee does not have a Check employee mapping yet." }],
      },
    ],
    field_mapping_rows: [
      { schedulaa_field: "regular_hours", check_object: "earnings", check_type_code: "hourly", status: "supported", notes: "Regular approved hours become structured hourly earnings with workplace." },
    ],
    warnings: [
      { code: "CHECK_CALCULATES_TAX_NET_PAY", message: "Local Payroll Preview is an input screen. Check will later calculate official taxes, net pay, and cash requirement from the structured package.", severity: "info" },
      { code: "TIP_TYPE_AMBIGUOUS", message: "Treating period tips as simple paycheck tips for preview only.", severity: "warning" },
    ],
    blockers: [{ code: "CHECK_EMPLOYEE_NOT_MAPPED", message: "Employee does not have a Check employee mapping yet.", severity: "error" }],
    unsupported_fields: [{ code: "NOT_SENT_TO_CHECK_MVP", message: "Local net pay remains informational. Check calculates official net pay later." }],
    summary: { employees_count: 1, earnings_count: 1, reimbursements_count: 0, blocker_count: 1, warning_count: 2 },
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
    employee_counts: {
      total_employee_records_reviewed: 1,
      eligible_payroll_employees: 1,
      eligible_employees_not_synced_to_check: 1,
      employees_missing_primary_payroll_location: 0,
      employees_with_onboarding_complete: 0,
      employees_needing_attention: 0,
      employees_blocking_onboarding: 0,
    },
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
  mockPayrollSetupApi.bulkSendCheckEmployeeOnboardingInvites.mockResolvedValue({ ok: false, error: "CHECK_ONBOARD_NOT_ENABLED", summary: { selected: 1, ready: 0, blocked: 0, disabled: 1 }, rows: [] });
  mockPayrollSetupApi.bulkResendCheckEmployeeOnboardingInvites.mockResolvedValue({ ok: false, error: "CHECK_ONBOARD_NOT_ENABLED", summary: { selected: 1, ready: 0, blocked: 0, disabled: 1 }, rows: [] });
  mockPayrollSetupApi.bulkRefreshCheckEmployeeOnboardingStatus.mockResolvedValue({ ok: false, error: "CHECK_ONBOARD_NOT_ENABLED", summary: { selected: 1, ready: 0, blocked: 0, disabled: 1 }, rows: [] });
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
    payroll_intent: "csv_handoff",
    payroll_country: "US",
    current_payroll_provider: "ADP",
    setup_profile: {
      payroll_intent: "csv_handoff",
      payroll_country: "US",
      current_payroll_provider: "ADP",
    },
  });
  mockPayrollProviderSyncApi.listRuns.mockResolvedValue({
    items: [
      {
        id: 321,
        provider: "generic_csv",
        start_date: "2026-05-04",
        end_date: "2026-05-10",
        status: "draft",
        employee_rows: [],
      },
    ],
    pagination: { limit: 10, offset: 0, has_more: false },
  });
  mockPayrollProviderSyncApi.runDetail.mockResolvedValue({
    run: {
      id: 321,
      provider: "generic_csv",
      start_date: "2026-05-04",
      end_date: "2026-05-10",
      employee_rows: [],
      status: "draft",
    },
  });
  mockPayrollProviderSyncApi.getCheckProviderDataPackage.mockResolvedValue({
    provider: "check",
    mode: "preview_only",
    check_api_called: false,
    payroll: {
      provider_run_id: 321,
      period_start: "2026-05-04",
      period_end: "2026-05-10",
      payday: "2026-05-10",
      pay_frequency: "weekly",
      source_hash: "checkpkg1234567890",
    },
    items: [
      {
        employee_id: 55,
        employee_name: "Taylor North",
        check_employee_id: null,
        primary_work_location_id: 11,
        check_workplace_id: null,
        earnings: [
          { line_id: 1, earning_key: "regular_hours", check_type_code: "hourly", amount: 200, hours: 8, work_location_id: 11, notes: "Regular hours map to hourly earnings." },
          { line_id: 2, earning_key: "tips", check_type_code: "paycheck_tips", amount: 50, hours: 0, work_location_id: 11, notes: "Treating period tips as simple paycheck tips for preview only." },
        ],
        reimbursements: [
          { line_id: 3, earning_key: "non_taxable_reimbursement", amount: 40, description: "Non-taxable reimbursement from Schedulaa payroll preview adjustment" },
        ],
        not_sent: [{ code: "NOT_SENT_TO_CHECK_MVP", message: "Local net pay remains informational. Check calculates official net pay later." }],
        warnings: [{ code: "TIP_TYPE_AMBIGUOUS", message: "Treating period tips as simple paycheck tips for preview only." }],
        blockers: [{ code: "CHECK_EMPLOYEE_NOT_MAPPED", message: "Employee does not have a Check employee mapping yet." }],
      },
    ],
    field_mapping_rows: [
      { schedulaa_field: "regular_hours", check_object: "earnings", check_type_code: "hourly", status: "supported", notes: "Regular approved hours become structured hourly earnings with workplace." },
      { schedulaa_field: "tips", check_object: "earnings", check_type_code: "paycheck_tips", status: "warning", notes: "Only simple paycheck tips are in MVP. Cash tips and tip credit need dedicated future handling." },
      { schedulaa_field: "non_taxable_reimbursement", check_object: "reimbursements", check_type_code: "non_taxable_reimbursement", status: "supported", notes: "Non-taxable reimbursements map to reimbursements, not earnings." },
      { schedulaa_field: "local_net_pay", check_object: "net_pay", check_type_code: null, status: "not_sent", notes: "Local net pay remains informational. Check calculates official net pay later." },
    ],
    warnings: [
      { code: "CHECK_CALCULATES_TAX_NET_PAY", message: "Local Payroll Preview is an input screen. Check will later calculate official taxes, net pay, and cash requirement from the structured package.", severity: "info" },
      { code: "TIP_TYPE_AMBIGUOUS", message: "Treating period tips as simple paycheck tips for preview only.", severity: "warning" },
    ],
    blockers: [{ code: "CHECK_EMPLOYEE_NOT_MAPPED", message: "Employee does not have a Check employee mapping yet.", severity: "error" }],
    unsupported_fields: [{ code: "NOT_SENT_TO_CHECK_MVP", message: "Local net pay remains informational. Check calculates official net pay later." }],
    summary: {
      employees_count: 1,
      earnings_count: 2,
      reimbursements_count: 1,
      blocker_count: 1,
      warning_count: 2,
    },
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

test("PayrollProviderSync renders Check Payroll Control Center for Check intent", async () => {
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
  mockPayrollProviderSyncApi.setupStatus.mockResolvedValueOnce({
    connection_status: "not_connected",
    readiness: "setup_required",
    capabilities: {},
    employee_mapping_count: 0,
    pay_item_mapping_count: 0,
    payroll_intent: "check_embedded_us",
    payroll_country: "US",
    current_payroll_provider: "ADP",
    setup_profile: {
      payroll_intent: "check_embedded_us",
      payroll_country: "US",
      current_payroll_provider: "ADP",
    },
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

  expect(await screen.findByText(/Check Payroll Control Center/i)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /Embedded Payroll/i })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /Fallback Handoff/i })).toBeInTheDocument();
  expect(screen.getByText(/Prepare your company, employees, onboarding, and payroll package for Check-powered payroll/i)).toBeInTheDocument();
  expect(screen.getAllByText(/Add FEIN\/EIN/i).length).toBeGreaterThan(0);
  expect(screen.queryByText(/CHECK_EMPLOYEE_NOT_MAPPED/i)).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: /Setup checklist/i }));
  expect(await screen.findByText(/Refresh launch readiness/i)).toBeInTheDocument();
  expect(screen.getByText(/Company FEIN\/EIN is present/i)).toBeInTheDocument();
  expect(screen.getByText(/^Prepared$/i)).toBeInTheDocument();
  expect(screen.queryByText(/created_placeholder/i)).not.toBeInTheDocument();
  expect(mockPayrollSetupApi.getCheckReadiness).toHaveBeenCalled();
  expect(mockPayrollSetupApi.getCheckStatus).toHaveBeenCalled();
  expect(mockPayrollSetupApi.getCheckLaunchReadiness).toHaveBeenCalled();
  expect(mockPayrollSetupApi.getCheckOnboardingOverview).toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: /Sandbox sync/i }));
  expect(await screen.findByText(/Check Connection/i)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /Preview company data for Check/i })).toBeDisabled();
  expect(screen.getByRole("button", { name: /Sync company to Check sandbox/i })).toBeDisabled();
  fireEvent.click(screen.getByRole("button", { name: /Onboarding/i }));
  expect(await screen.findByText(/Check Payroll Onboarding/i)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /^Send invites$/i })).toBeDisabled();
  expect(screen.getByRole("button", { name: /^Resend invites$/i })).toBeDisabled();
  fireEvent.click(screen.getByRole("button", { name: /Payroll package/i }));
  expect(await screen.findByText(/Check Payroll Package Preview/i)).toBeInTheDocument();
  expect(screen.getByText(/It does not call Check and does not submit payroll/i)).toBeInTheDocument();
  expect(screen.getByText(/CHECK_EMPLOYEE_NOT_MAPPED/i)).not.toBeVisible();
  fireEvent.click(screen.getByText(/Show technical package details/i));
  expect(await screen.findByText(/CHECK_EMPLOYEE_NOT_MAPPED/i)).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: /Payroll guide/i }));
  expect(await screen.findByText(/Payroll Operations Guide/i)).toBeInTheDocument();
  expect(screen.getByRole("tab", { name: /Check Payroll/i })).toHaveAttribute("aria-selected", "true");
  expect(screen.getByText(/What this workspace covers/i)).toBeInTheDocument();
  expect(screen.queryByLabelText(/SSN/i)).not.toBeInTheDocument();
  expect(screen.queryByLabelText(/W-4/i)).not.toBeInTheDocument();
  expect(screen.queryByLabelText(/direct deposit/i)).not.toBeInTheDocument();
  expect(screen.queryByText(/Check submit/i)).not.toBeInTheDocument();
  expect(screen.queryByText(/Check approve/i)).not.toBeInTheDocument();
  await waitFor(() => {
    expect(mockPayrollSetupApi.getCheckPayrollPackagePreview).toHaveBeenCalledWith({ provider_run_id: 321 });
  });
}, 15000);

test("PayrollProviderSync hides full Check workspace for csv handoff intent", async () => {
  renderWithRouter(
    <PayrollProviderSync
      departmentFilter=""
      selectedRecruiter=""
      exportAllEmployees={false}
      exportEmployeeIds={[]}
      region="ca"
      startDate="2026-05-04"
      endDate="2026-05-10"
      payFrequency="bi_weekly"
      payroll={{ province: "ON" }}
      recruiters={[]}
      filteredRecruiters={[]}
      setSnackbar={jest.fn()}
    />
  );

  expect(await screen.findByRole("heading", { name: /Payroll Handoff/i })).toBeInTheDocument();
  expect(screen.getAllByText(/This company is currently using payroll handoff\/export mode/i).length).toBeGreaterThan(0);
  expect(screen.getByRole("combobox", { name: /Provider/i })).toBeInTheDocument();
  expect(screen.queryByText(/Check Payroll Control Center/i)).not.toBeInTheDocument();
  expect(screen.getByText(/Embedded U\.S\. payroll tools become relevant only if payroll intent is switched later/i)).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: /Payroll guide/i }));
  expect(await screen.findByText(/Payroll Operations Guide/i)).toBeInTheDocument();
  expect(screen.getByRole("tab", { name: /CSV Handoff/i })).toHaveAttribute("aria-selected", "true");
});

test("PayrollProviderSync shows setup-first state when payroll intent is not configured", async () => {
  mockPayrollProviderSyncApi.setupStatus.mockResolvedValueOnce({
    connection_status: "not_connected",
    readiness: "setup_required",
    capabilities: {},
    employee_mapping_count: 0,
    pay_item_mapping_count: 0,
    payroll_intent: "none",
    payroll_country: "CA",
    current_payroll_provider: "",
    setup_profile: {
      payroll_intent: "none",
      payroll_country: "CA",
      current_payroll_provider: "",
    },
  });
  renderWithRouter(
    <PayrollProviderSync
      departmentFilter=""
      selectedRecruiter=""
      exportAllEmployees={false}
      exportEmployeeIds={[]}
      region="ca"
      startDate="2026-05-04"
      endDate="2026-05-10"
      payFrequency="bi_weekly"
      payroll={{ province: "ON" }}
      recruiters={[]}
      filteredRecruiters={[]}
      setSnackbar={jest.fn()}
    />
  );

  expect((await screen.findAllByText(/Choose a payroll path in Company Profile before using provider-specific payroll tools/i)).length).toBeGreaterThan(0);
  expect(screen.queryByText(/Check Payroll Readiness/i)).not.toBeInTheDocument();
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

test("PayrollPreview shows embedded payroll input-preview note for Check intent", async () => {
  renderWithRouter(
    <PayrollPreview
      payroll={{
        recruiter_id: 55,
        employee_name: "Taylor North",
        start_date: "2026-05-04",
        end_date: "2026-05-10",
        region: "us",
        pay_date: "2026-05-10",
      }}
      region="us"
      payrollSetupProfile={{ payroll_intent: "check_embedded_us" }}
      companyPayDateRule="end_date"
      companyPayDateOffsetDays={0}
      autoRecalc
      setAutoRecalc={jest.fn()}
      handleFieldChange={jest.fn(() => jest.fn())}
      setPayroll={jest.fn()}
      ytdTotals={null}
      selectedRecruiter={55}
      month="2026-05"
      setSnackbar={jest.fn()}
    />
  );

  expect(await screen.findByText(/official provider tax, deduction, net pay, and cash requirement calculations will happen later through embedded payroll preview/i)).toBeInTheDocument();
});

test("PayrollPreview shows handoff note for csv_handoff intent", async () => {
  renderWithRouter(
    <PayrollPreview
      payroll={{
        recruiter_id: 55,
        employee_name: "Taylor North",
        start_date: "2026-05-04",
        end_date: "2026-05-10",
        region: "ca",
      }}
      region="ca"
      payrollSetupProfile={{ payroll_intent: "csv_handoff" }}
      companyPayDateRule="end_date"
      companyPayDateOffsetDays={0}
      autoRecalc
      setAutoRecalc={jest.fn()}
      handleFieldChange={jest.fn(() => jest.fn())}
      setPayroll={jest.fn()}
      ytdTotals={null}
      selectedRecruiter={55}
      month="2026-05"
      setSnackbar={jest.fn()}
    />
  );

  expect(await screen.findByText(/This preview supports payroll handoff and accounting exports/i)).toBeInTheDocument();
});

test("PayrollPreview shows setup note when payroll intent is not configured", async () => {
  renderWithRouter(
    <PayrollPreview
      payroll={{
        recruiter_id: 55,
        employee_name: "Taylor North",
        start_date: "2026-05-04",
        end_date: "2026-05-10",
        region: "ca",
      }}
      region="ca"
      payrollSetupProfile={{ payroll_intent: "none" }}
      companyPayDateRule="end_date"
      companyPayDateOffsetDays={0}
      autoRecalc
      setAutoRecalc={jest.fn()}
      handleFieldChange={jest.fn(() => jest.fn())}
      setPayroll={jest.fn()}
      ytdTotals={null}
      selectedRecruiter={55}
      month="2026-05"
      setSnackbar={jest.fn()}
    />
  );

  expect(await screen.findByText(/Payroll path is not configured yet/i)).toBeInTheDocument();
});
