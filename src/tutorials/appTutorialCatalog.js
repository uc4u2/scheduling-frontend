export const APP_TUTORIALS = {
  business_finance_estimate_to_paid_job: {
    key: "business_finance_estimate_to_paid_job",
    title: "How to Turn an Estimate Into a Paid Job in Schedulaa",
    purpose:
      "Shows how a manager moves from approved pricing to invoice, payment link, and job execution in one connected workflow.",
    youtubeUrl: "https://youtu.be/OPw9ntgACxg",
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
  shift_management_plan_coverage: {
    key: "shift_management_plan_coverage",
    title: "How to Plan Shift Coverage with Smart Shift in Schedulaa",
    purpose:
      "Shows how managers set coverage, generate suggestions, and apply shifts while staying inside the scheduling workflow.",
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
  moreTutorialsUrl: APP_TUTORIALS.business_finance_estimate_to_paid_job.marketingUrl,
};

export const WEBSITE_BUILDER_TUTORIAL_GROUP = {
  featured: APP_TUTORIALS.website_builder_publish_site,
  moreTutorialsUrl: APP_TUTORIALS.website_builder_publish_site.marketingUrl,
};

export const SHIFT_MANAGEMENT_TUTORIAL_GROUP = {
  featured: APP_TUTORIALS.shift_management_plan_coverage,
  moreTutorialsUrl: APP_TUTORIALS.shift_management_plan_coverage.marketingUrl,
};

export const LEAVE_MANAGEMENT_TUTORIAL_GROUP = {
  featured: APP_TUTORIALS.leave_review_approvals,
  moreTutorialsUrl: APP_TUTORIALS.leave_review_approvals.marketingUrl,
};

export const PAYROLL_TUTORIAL_GROUP = {
  featured: APP_TUTORIALS.payroll_ready_handoff,
  moreTutorialsUrl: APP_TUTORIALS.payroll_ready_handoff.marketingUrl,
};

export const SERVICE_MANAGEMENT_TUTORIAL_GROUP = {
  featured: APP_TUTORIALS.services_setup_booking,
  moreTutorialsUrl: APP_TUTORIALS.services_setup_booking.marketingUrl,
};

export const EMPLOYEE_ACCESS_TUTORIAL_GROUP = {
  featured: APP_TUTORIALS.employee_access_roles,
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
