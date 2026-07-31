import React from "react";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";

import ManagerClientsWorkspace, { sanitizeBookingDisplayNote } from "./ManagerClientsWorkspace";

jest.setTimeout(60000);

const mockNavigate = jest.fn();
const mockSnackbar = jest.fn();
var mockFinanceApi;

jest.mock("notistack", () => ({
  useSnackbar: () => ({ enqueueSnackbar: mockSnackbar }),
}));

jest.mock("react-router-dom", () => {
  const mockReact = require("react");
  return {
    __esModule: true,
    Link: mockReact.forwardRef(({ children, to, ...props }, ref) => <a ref={ref} href={to} {...props}>{children}</a>),
    useNavigate: () => mockNavigate,
    useParams: () => ({ clientId: "42" }),
  };
}, { virtual: true });

jest.mock("../../../components/ui/ManagementFrame", () => ({
  __esModule: true,
  default: ({ children, title }) => (
    <div>
      <h1>{title}</h1>
      {children}
    </div>
  ),
}));

jest.mock("../../../components/ui/SectionCard", () => ({
  __esModule: true,
  default: ({ title, description, children }) => (
    <section>
      {title ? <h2>{title}</h2> : null}
      {description ? <p>{description}</p> : null}
      {children}
    </section>
  ),
}));

jest.mock("../../finance/components/FinanceMetricCard", () => ({
  __esModule: true,
  default: ({ label, value, helper }) => (
    <div>
      <div>{label}</div>
      <div>{value}</div>
      <div>{helper}</div>
    </div>
  ),
}));

jest.mock("../../finance/components/FinancePagination", () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock("../../finance/ClientQuickCreateDialog", () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock("./ClientBookingAccessDialog", () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock("../../../utils/timezone", () => ({
  getUserTimezone: () => "America/Toronto",
}));

jest.mock("../../../utils/datetime", () => ({
  formatDateTimeInTz: (value) => `formatted:${value}`,
}));

jest.mock("../../../utils/api", () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
    get: jest.fn(),
  },
}));

jest.mock("../../finance/financeApi", () => {
  mockFinanceApi = {
    listManagerClient360: jest.fn(),
    getManagerClient360: jest.fn(),
    listManagerClient360FieldPhotos: jest.fn(),
    getManagerClient360PhotoShareLink: jest.fn(),
    listManagerClient360Documents: jest.fn(),
    listManagerClient360DocumentRequests: jest.fn(),
    listManagerClient360EmailTemplates: jest.fn(),
    sendManagerClient360CardUpdateRequest: jest.fn(),
    archiveFinanceClient: jest.fn(),
    blockManagerClient360Bookings: jest.fn(),
    cancelManagerClient360DocumentRequest: jest.fn(),
    createManagerClient360EmailTemplate: jest.fn(),
    createManagerClient360Document: jest.fn(),
    createManagerClient360DocumentRequest: jest.fn(),
    createManagerClient360Note: jest.fn(),
    createManagerClient360PhotoShareLink: jest.fn(),
    createManagerClient360SessionNote: jest.fn(),
    deleteManagerClient360EmailTemplate: jest.fn(),
    deleteManagerClient360Document: jest.fn(),
    getManagerClient360ReviewRequestDraft: jest.fn(),
    revokeManagerClient360PhotoShareLink: jest.fn(),
    sendManagerClient360PhotoShareLinkEmail: jest.fn(),
    sendManagerClient360Email: jest.fn(),
    setManagerClient360EmailTemplateDefault: jest.fn(),
    unblockManagerClient360Bookings: jest.fn(),
    uploadManagerClient360PhotoFromDevice: jest.fn(),
    updateFinanceClient: jest.fn(),
    updateManagerClient360EmailTemplate: jest.fn(),
  };
  return mockFinanceApi;
});

jest.mock("react-transition-group", () => {
  const React = require("react");
  return {
    __esModule: true,
    Transition: ({ children, in: inProp = true }) =>
      typeof children === "function" ? children(inProp ? "entered" : "exited") : children,
    TransitionGroup: ({ children }) => <>{children}</>,
    CSSTransition: ({ children }) => <>{children}</>,
  };
});

jest.mock("recharts", () => {
  const React = require("react");
  const passthrough = ({ children }) => <div>{children}</div>;
  const leaf = ({ children }) => <>{children || null}</>;
  return {
    __esModule: true,
    ResponsiveContainer: passthrough,
    BarChart: passthrough,
    LineChart: passthrough,
    PieChart: passthrough,
    CartesianGrid: leaf,
    XAxis: leaf,
    YAxis: leaf,
    Tooltip: leaf,
    Legend: leaf,
    Bar: leaf,
    Line: leaf,
    Pie: leaf,
    Cell: leaf,
  };
});

const detailPayload = {
  client: {
    id: 42,
    first_name: "Yousef",
    last_name: "Jalali",
    email: "yousef@example.com",
    phone: "555-0100",
    status: "active",
    notes: "Prefers text reminders.",
    company_name: "Sale Co",
    booking_access: {
      blocked: false,
      reason_label: "",
      note: "",
    },
  },
  summary: {
    appointments: 5,
    upcoming_appointments: 1,
    unpaid_balance: 125,
    open_invoice_count: 2,
    open_work_order_count: 1,
    no_show_count: 1,
    cancelled_count: 2,
    next_appointment: null,
    last_appointment: "2026-07-30T10:00:00Z",
    ltv: 980,
    gross: 980,
    has_card_on_file: true,
  },
  auth: {
    has_login: true,
    auth_email: "portal@example.com",
    membership_id: "M-42",
  },
  card_on_file: {
    brand: "Visa",
    last4: "4242",
    status_label: "Verified",
    exp_month: 9,
    exp_year: 2027,
    verified_at: "2026-07-30T14:00:00Z",
    consent_accepted_at: "2026-07-30T13:30:00Z",
    expired: false,
    update_required: false,
  },
  action_readiness: {
    collect_payment: { state: "recommended", appointment_id: 201, reason: "Collect remaining balance." },
    create_invoice: { state: "ready", appointment_id: 301, reason: "Invoice can be created." },
    create_estimate: { state: "ready", reason: "Estimate available." },
    send_payment_link: { state: "ready", payment_url: "https://pay.example.com/invoice" },
    send_follow_up: { state: "ready", reason: "Follow-up can be sent." },
    mark_paid_offline: { state: "ready", appointment_id: 201, reason: "Mark offline if needed." },
    request_google_review: { state: "ready", reason: "Client is eligible." },
  },
  bookings: {
    upcoming: [
      {
        id: 201,
        service: "Upcoming service",
        provider: "Schedulaa",
        status: "booked",
        payment_status: "pending",
        start_iso: "2026-08-05T14:00:00Z",
        notes: "[setup_intent_id=seti_123]",
      },
    ],
    past: [
      {
        id: 301,
        service: "Recent service",
        provider: "Schedulaa",
        status: "completed",
        payment_status: "pending",
        start_iso: "2026-07-28T14:00:00Z",
        notes: "[setup_intent_id=seti_123] Client prefers morning",
      },
      {
        id: 302,
        service: "Older service",
        provider: "Schedulaa",
        status: "completed",
        payment_status: "paid",
        start_iso: "2026-07-20T14:00:00Z",
        notes: "[review_email_sent:2026-07-29] [bring warm towel]",
      },
    ],
  },
  finance: {
    quote_requests: [],
    estimates: [],
    invoices: [],
  },
  work_orders: [],
  notes: [],
  session_history: [],
  timeline: [],
};

function renderWorkspace() {
  mockFinanceApi.listManagerClient360.mockResolvedValue({
    items: [],
    pagination: { total: 0, page: 1, per_page: 25 },
  });
  mockFinanceApi.getManagerClient360.mockResolvedValue(detailPayload);
  mockFinanceApi.listManagerClient360FieldPhotos.mockResolvedValue({ items: [], summary: { total: 0, employee_uploaded: 0, manager_uploaded: 0, ready: 0, processing: 0 } });
  mockFinanceApi.getManagerClient360PhotoShareLink.mockResolvedValue({});
  mockFinanceApi.listManagerClient360Documents.mockResolvedValue({ documents: [] });
  mockFinanceApi.listManagerClient360DocumentRequests.mockResolvedValue({ requests: [] });
  mockFinanceApi.listManagerClient360EmailTemplates.mockResolvedValue({ templates: [] });
  mockFinanceApi.sendManagerClient360CardUpdateRequest.mockResolvedValue({ email: { sent_new: true } });

  return render(
    <ManagerClientsWorkspace />
  );
}

describe("sanitizeBookingDisplayNote", () => {
  test("removes known system markers but preserves human notes", () => {
    expect(sanitizeBookingDisplayNote("[setup_intent_id=abc] Client prefers morning")).toBe("Client prefers morning");
    expect(sanitizeBookingDisplayNote("[review_email_sent:2026-07-30] [bring warm towel]")).toBe("[bring warm towel]");
    expect(sanitizeBookingDisplayNote("[bring warm towel]")).toBe("[bring warm towel]");
    expect(sanitizeBookingDisplayNote("[setup_intent_id=abc]")).toBe("");
  });
});

describe("ManagerClientsWorkspace", () => {
  beforeAll(() => {
    global.ResizeObserver = class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("consolidates overview and removes duplicated summary blocks", async () => {
    renderWorkspace();

    expect(await screen.findByText("Client 360")).toBeInTheDocument();
    expect(await screen.findByText("Yousef Jalali")).toBeInTheDocument();
    expect(screen.getAllByText("Next appointment")).toHaveLength(1);
    expect(screen.getAllByText("Outstanding balance")).toHaveLength(1);
    expect(screen.queryByText("Linked summary")).not.toBeInTheDocument();
    expect(screen.queryByText("Visit & payment snapshot")).not.toBeInTheDocument();
    expect(screen.queryByText("Client flags & alerts")).not.toBeInTheDocument();
    expect(screen.queryByText("No next booking")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /request card update/i })).toBeInTheDocument();
  });

  test("shows compact primary actions, moved actions in menu, and billing readiness collapsed by default", async () => {
    renderWorkspace();

    await screen.findByText("Yousef Jalali");
    const quickActionsToggle = screen.getByRole("button", { name: /Quick Actions/i });
    if (quickActionsToggle.getAttribute("aria-expanded") !== "true") {
      fireEvent.click(quickActionsToggle);
    }
    const quickActionsSection = quickActionsToggle.closest(".MuiAccordion-root");
    expect(quickActionsSection).not.toBeNull();
    const quickActionsQueries = within(quickActionsSection);
    expect(quickActionsQueries.getByRole("link", { name: /^Book appointment$/i })).toBeInTheDocument();
    expect(quickActionsQueries.getByRole("button", { name: /^Collect payment$/i })).toBeInTheDocument();
    expect(quickActionsQueries.getByRole("button", { name: /^Create invoice$/i })).toBeInTheDocument();
    expect(quickActionsQueries.getByRole("button", { name: /More actions/i })).toBeInTheDocument();
    expect(quickActionsQueries.queryByRole("button", { name: /^Create estimate$/i })).not.toBeInTheDocument();

    const billingToggle = screen.getByRole("button", { name: /Billing readiness/i });
    expect(billingToggle).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(billingToggle);
    expect(await screen.findByText("Payment link")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /More actions/i }));
    const menu = await screen.findByRole("menu");
    expect(within(menu).getByText("Create estimate")).toBeInTheDocument();
    expect(within(menu).getByText("Create work order")).toBeInTheDocument();
    expect(within(menu).getByText("Send follow-up")).toBeInTheDocument();
    expect(within(menu).getByText("Request Google review")).toBeInTheDocument();
    expect(within(menu).getByText("Open Finance")).toBeInTheDocument();
    expect(screen.queryByText("Follow-up workflow")).not.toBeInTheDocument();
  });

  test("keeps upcoming open, recent collapsed by default, and hides internal booking markers", async () => {
    renderWorkspace();

    await screen.findByText("Yousef Jalali");
    const bookingsToggle = screen.getByRole("button", { name: /Bookings & Checkout/i });
    if (bookingsToggle.getAttribute("aria-expanded") !== "true") {
      fireEvent.click(bookingsToggle);
    }
    await screen.findByText("Upcoming service");
    const recentToggle = screen.getByRole("button", { name: /Recent bookings · 2/i });
    expect(recentToggle).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(recentToggle);
    expect(await screen.findByText("Recent service")).toBeInTheDocument();
    expect(screen.getByText("Client prefers morning")).toBeInTheDocument();
    expect(screen.getByText("[bring warm towel]")).toBeInTheDocument();
    expect(screen.queryByText(/setup_intent_id/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/review_email_sent/i)).not.toBeInTheDocument();
  });
});
