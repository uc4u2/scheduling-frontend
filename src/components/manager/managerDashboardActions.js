export const MANAGER_DASHBOARD_ACTIONS = [
  { id: "business-finance", label: "Business Finance", description: "Quotes, jobs, invoices, expenses, and reports", section: "Finance", icon: "finance", viewKey: "finance-overview" },
  { id: "services-bookings", label: "Services & Bookings", description: "Services, schedules, and booking tools", section: "Commerce", icon: "services", viewKey: "advanced-management" },
  { id: "booking-checkout", label: "Booking Checkout", description: "Review appointments and collect supported payments", section: "Commerce", icon: "checkout", viewKey: "booking-checkout" },
  { id: "clients", label: "Clients", description: "Open Client 360 records and activity", section: "Customers", icon: "clients", viewKey: "clients" },
  { id: "products", label: "Products", description: "Catalog, variants, stock, and product setup", section: "Commerce", icon: "products", viewKey: "advanced-management", href: "/manager/advanced-management?panel=products" },
  { id: "product-orders", label: "Product Orders", description: "Orders, fulfillment, shipping, and refunds", section: "Commerce", icon: "orders", viewKey: "advanced-management", href: "/manager/advanced-management?panel=product-orders" },
  { id: "master-calendar", label: "Master Calendar", description: "Company schedule and booking overview", section: "Operations", icon: "calendar", viewKey: "master-calendar" },
  { id: "dispatch", label: "Dispatch", description: "Trips, on-my-way status, and field visibility", section: "Operations", icon: "dispatch", viewKey: "dispatch-tracking" },
  { id: "employees", label: "Employees", description: "Team profiles and permitted employee controls", section: "People", icon: "employees", viewKey: "employee-management", delegatedViewKey: "employee-profiles" },
  { id: "field-photos", label: "Field Photos", description: "Private proof-of-work photos and storage", section: "Operations", icon: "photos", viewKey: "field-photos", addon: true },
  { id: "payroll", label: "Payroll", description: "Payroll runs and authorized payroll records", section: "Finance", icon: "payroll", viewKey: "payroll" },
  { id: "shift-management", label: "Shift Management", description: "Build and maintain employee shifts", section: "Workforce", icon: "shifts", viewKey: "team" },
  { id: "time-tracking", label: "Time Tracking", description: "Review punches, breaks, and hours", section: "Workforce", icon: "time", viewKey: "time-tracking" },
  { id: "leaves", label: "Leaves", description: "Review permitted leave requests", section: "Workforce", icon: "leave", viewKey: "leaves" },
  { id: "swap-approvals", label: "Swap Approvals", description: "Review employee shift swaps", section: "Workforce", icon: "swap", viewKey: "swap-approvals" },
  { id: "training", label: "Training", description: "Training library, assignments, and progress", section: "People", icon: "training", viewKey: "training" },
  { id: "communications", label: "Communications", description: "Tenant communication tools and files", section: "Customers", icon: "communications", viewKey: "communications" },
  { id: "quotes", label: "Quotes", description: "Review customer quote requests", section: "Finance", icon: "quotes", viewKey: "finance-quotes" },
  { id: "estimates", label: "Estimates", description: "Create and manage customer estimates", section: "Finance", icon: "estimates", viewKey: "finance-estimates" },
  { id: "work-orders", label: "Work Orders", description: "Plan and review field work", section: "Finance", icon: "workOrders", viewKey: "finance-work-orders" },
  { id: "invoices", label: "Invoices", description: "Issue and manage Business Finance invoices", section: "Finance", icon: "invoices", viewKey: "finance-invoices" },
];

export const MANAGER_DASHBOARD_ACTION_BY_ID = Object.fromEntries(
  MANAGER_DASHBOARD_ACTIONS.map((action) => [action.id, action])
);

export const MANAGER_DASHBOARD_PRESETS = [
  {
    id: "balanced",
    label: "Balanced",
    description: "Bookings, customers, products, finance, and daily operations.",
    actionIds: ["business-finance", "services-bookings", "booking-checkout", "clients", "products", "master-calendar", "dispatch", "employees"],
  },
  {
    id: "services-retail",
    label: "Services & retail",
    description: "Customer bookings, products, orders, and communication.",
    actionIds: ["services-bookings", "booking-checkout", "products", "product-orders", "clients", "business-finance", "communications", "master-calendar"],
  },
  {
    id: "contractor-field",
    label: "Contractor & field",
    description: "Financial workflow, dispatch, work orders, and field evidence.",
    actionIds: ["business-finance", "estimates", "work-orders", "invoices", "dispatch", "field-photos", "clients", "time-tracking"],
  },
  {
    id: "team-shifts",
    label: "Team & shifts",
    description: "Scheduling, attendance, employees, leave, and payroll.",
    actionIds: ["shift-management", "time-tracking", "employees", "leaves", "swap-approvals", "payroll", "master-calendar", "communications"],
  },
];

export const WORKFORCE_DASHBOARD_ACTION_IDS = new Set([
  "shift-management",
  "time-tracking",
  "leaves",
  "swap-approvals",
]);

export const resolveManagerDashboardAction = (actionId, currentUserInfo) => {
  const action = MANAGER_DASHBOARD_ACTION_BY_ID[actionId];
  if (!action) return null;
  if (!currentUserInfo?.is_manager && action.delegatedViewKey) {
    return { ...action, viewKey: action.delegatedViewKey };
  }
  return action;
};

export const availableManagerDashboardActions = (availableActionIds = []) => {
  const allowed = new Set(availableActionIds);
  return MANAGER_DASHBOARD_ACTIONS.filter((action) => allowed.has(action.id));
};
