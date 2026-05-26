export const APP_TUTORIALS = {
  business_finance_estimate_to_paid_job: {
    key: "business_finance_estimate_to_paid_job",
    title: "How to Turn an Estimate Into a Paid Job in Schedulaa",
    purpose:
      "Shows how a manager moves from approved pricing to invoice, payment link, and job execution in one connected workflow.",
    youtubeUrl: "https://youtu.be/OPw9ntgACxg",
    marketingUrl: "https://www.schedulaa.com/en/business-finance",
  },
  business_finance_create_work_order: {
    key: "business_finance_create_work_order",
    title: "How to Create a Work Order and Assign Your Team",
    purpose:
      "Walk through creating the job record, setting the planned schedule, and assigning the team before field work starts.",
    youtubeUrl: null,
    marketingUrl: "https://www.schedulaa.com/en/business-finance",
  },
  business_finance_review_field_work: {
    key: "business_finance_review_field_work",
    title: "How Managers Review Field Work Before Billing",
    purpose:
      "Explain how submitted field reports and manager reviews decide what becomes official for materials, billing, and close-out.",
    youtubeUrl: null,
    marketingUrl: "https://www.schedulaa.com/en/business-finance",
  },
  business_finance_create_track_invoices: {
    key: "business_finance_create_track_invoices",
    title: "How to Create and Track Invoices",
    purpose:
      "Show how finance teams issue invoices, share payment links, and track what is still waiting for payment or follow-up.",
    youtubeUrl: null,
    marketingUrl: "https://www.schedulaa.com/en/business-finance",
  },
  website_builder_publish_site: {
    key: "website_builder_publish_site",
    title: "How to Publish Your Website Builder Changes in Schedulaa",
    purpose:
      "Walk through editing content, reviewing page styling, saving changes, and publishing a branded booking site.",
    youtubeUrl: "https://youtu.be/OPw9ntgACxg",
    marketingUrl: "https://www.schedulaa.com/en/website-builder",
  },
  website_builder_edit_sections: {
    key: "website_builder_edit_sections",
    title: "How to Edit Website Sections and Text",
    purpose:
      "Show how managers update hero copy, section content, and branding without leaving the visual builder.",
    youtubeUrl: null,
    marketingUrl: "https://www.schedulaa.com/en/website-builder",
  },
  website_builder_booking_widgets: {
    key: "website_builder_booking_widgets",
    title: "How to Update Booking Widgets and Service Links",
    purpose:
      "Walk through booking widgets, page links, and client-facing actions that connect the website to scheduling.",
    youtubeUrl: null,
    marketingUrl: "https://www.schedulaa.com/en/website-builder",
  },
  website_builder_domain_ssl: {
    key: "website_builder_domain_ssl",
    title: "How to Connect Domain and SSL",
    purpose:
      "Explain the domain connection flow, DNS checks, and final publish steps for a live branded site.",
    youtubeUrl: null,
    marketingUrl: "https://www.schedulaa.com/en/website-builder",
  },
  shift_management_plan_coverage: {
    key: "shift_management_plan_coverage",
    title: "How to Plan Shift Coverage with Smart Shift in Schedulaa",
    purpose:
      "Shows how managers set coverage, generate suggestions, and apply shifts while staying inside the scheduling workflow.",
    youtubeUrl: "https://youtu.be/OPw9ntgACxg",
    marketingUrl: "https://www.schedulaa.com/en/workforce",
  },
  shift_management_assign_shift: {
    key: "shift_management_assign_shift",
    title: "How to Assign and Manage Shifts in Schedulaa",
    purpose:
      "Shows how managers assign a shift, edit scheduled work, handle time off, and keep the calendar accurate for day-to-day operations.",
    youtubeUrl: "https://youtu.be/OPw9ntgACxg",
    marketingUrl: "https://www.schedulaa.com/en/workforce",
  },
  leave_review_approvals: {
    key: "leave_review_approvals",
    title: "How to Review and Approve Leave Requests in Schedulaa",
    purpose:
      "Shows how managers review requests, confirm payroll-ready hours, and keep leave balances and scheduling aligned.",
    youtubeUrl: "https://youtu.be/OPw9ntgACxg",
    marketingUrl: "https://www.schedulaa.com/en/workforce",
  },
  payroll_ready_handoff: {
    key: "payroll_ready_handoff",
    title: "How Payroll-Ready Handoff Works in Schedulaa",
    purpose:
      "Shows how managers move from approved time and payroll preview into payslips, exports, and accountant-ready handoff files.",
    youtubeUrl: "https://youtu.be/OPw9ntgACxg",
    marketingUrl: "https://www.schedulaa.com/en/payroll",
  },
  services_setup_booking: {
    key: "services_setup_booking",
    title: "How to Set Up Services and Booking Options in Schedulaa",
    purpose:
      "Walk through creating bookable services, choosing booking types, and preparing clean client-facing service details.",
    youtubeUrl: "https://youtu.be/OPw9ntgACxg",
    marketingUrl: "https://www.schedulaa.com/en/booking",
  },
  employee_access_roles: {
    key: "employee_access_roles",
    title: "How to Set Employee Access and Team Permissions in Schedulaa",
    purpose:
      "Shows how managers decide which access toggles to enable for staff, supervisors, HR, and payroll users.",
    youtubeUrl: "https://youtu.be/OPw9ntgACxg",
    marketingUrl: "https://www.schedulaa.com/en/workforce",
  },
};

export const BUSINESS_FINANCE_TUTORIAL_GROUP = {
  featured: APP_TUTORIALS.business_finance_estimate_to_paid_job,
  items: [
    APP_TUTORIALS.business_finance_estimate_to_paid_job,
    APP_TUTORIALS.business_finance_create_work_order,
    APP_TUTORIALS.business_finance_review_field_work,
    APP_TUTORIALS.business_finance_create_track_invoices,
  ],
  moreTutorialsUrl: APP_TUTORIALS.business_finance_estimate_to_paid_job.marketingUrl,
};

export const WEBSITE_BUILDER_TUTORIAL_GROUP = {
  featured: APP_TUTORIALS.website_builder_publish_site,
  items: [
    APP_TUTORIALS.website_builder_publish_site,
    APP_TUTORIALS.website_builder_edit_sections,
    APP_TUTORIALS.website_builder_booking_widgets,
    APP_TUTORIALS.website_builder_domain_ssl,
  ],
  moreTutorialsUrl: APP_TUTORIALS.website_builder_publish_site.marketingUrl,
};

export const SHIFT_MANAGEMENT_TUTORIAL_GROUP = {
  featured: APP_TUTORIALS.shift_management_plan_coverage,
  items: [APP_TUTORIALS.shift_management_plan_coverage],
  moreTutorialsUrl: APP_TUTORIALS.shift_management_plan_coverage.marketingUrl,
};

export const SHIFT_SCHEDULE_TUTORIAL_GROUP = {
  featured: APP_TUTORIALS.shift_management_assign_shift,
  items: [APP_TUTORIALS.shift_management_assign_shift],
  moreTutorialsUrl: APP_TUTORIALS.shift_management_assign_shift.marketingUrl,
};

export const LEAVE_MANAGEMENT_TUTORIAL_GROUP = {
  featured: APP_TUTORIALS.leave_review_approvals,
  items: [APP_TUTORIALS.leave_review_approvals],
  moreTutorialsUrl: APP_TUTORIALS.leave_review_approvals.marketingUrl,
};

export const PAYROLL_TUTORIAL_GROUP = {
  featured: APP_TUTORIALS.payroll_ready_handoff,
  items: [APP_TUTORIALS.payroll_ready_handoff],
  moreTutorialsUrl: APP_TUTORIALS.payroll_ready_handoff.marketingUrl,
};

export const SERVICE_MANAGEMENT_TUTORIAL_GROUP = {
  featured: APP_TUTORIALS.services_setup_booking,
  items: [APP_TUTORIALS.services_setup_booking],
  moreTutorialsUrl: APP_TUTORIALS.services_setup_booking.marketingUrl,
};

export const EMPLOYEE_ACCESS_TUTORIAL_GROUP = {
  featured: APP_TUTORIALS.employee_access_roles,
  items: [APP_TUTORIALS.employee_access_roles],
  moreTutorialsUrl: APP_TUTORIALS.employee_access_roles.marketingUrl,
};

export const toYouTubeEmbedUrl = (url = "") => {
  const value = String(url || "").trim();
  if (!value) return "";
  const shortMatch = value.match(/youtu\.be\/([^?&/]+)/i);
  if (shortMatch?.[1]) return `https://www.youtube.com/embed/${shortMatch[1]}`;
  const watchMatch = value.match(/[?&]v=([^?&/]+)/i);
  if (watchMatch?.[1]) return `https://www.youtube.com/embed/${watchMatch[1]}`;
  return value;
};
