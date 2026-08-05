import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ThemeProvider, createTheme } from "@mui/material/styles";

import FieldPhotos from "./FieldPhotos";

const mockApiGet = jest.fn();
const mockNavigate = jest.fn();

jest.mock("../../utils/api", () => ({
  __esModule: true,
  default: {
    get: (...args) => mockApiGet(...args),
    post: jest.fn(() => Promise.resolve({ data: {} })),
    delete: jest.fn(() => Promise.resolve({ data: {} })),
  },
}));

jest.mock("../../components/ui/ManagementFrame", () => ({
  __esModule: true,
  default: ({ children }) => <div>{children}</div>,
}));

jest.mock("./FieldPhotosHelpDrawer", () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock("../../components/billing/FieldPhotosBillingModal", () => ({
  __esModule: true,
  default: ({ open }) => (open ? <div>Field Photos billing modal</div> : null),
}));

jest.mock("react-router-dom", () => ({
  useLocation: () => ({ search: "" }),
  useNavigate: () => mockNavigate,
}), { virtual: true });

const renderPage = () =>
  render(
    <ThemeProvider theme={createTheme()}>
      <FieldPhotos />
    </ThemeProvider>
  );

describe("FieldPhotos manager page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockReset();
    mockApiGet.mockImplementation((url) => {
      if (url === "/billing/status") {
        return Promise.resolve({
          data: {
            field_photos: {
              addon_active: false,
              read_only: false,
              price_configured: true,
              storage_addon_qty: 0,
              storage_used_bytes: 0,
              storage_quota_bytes: 5 * 1024 * 1024 * 1024,
              retention_days: 90,
              quota_status: {
                used_bytes: 0,
                quota_bytes: 5 * 1024 * 1024 * 1024,
                usage_percent: 0,
                state: "NORMAL",
                uploads_enabled: true,
                next_threshold_percent: 80,
                storage_expansion_quantity: 0,
                can_manage_storage: true,
              },
            },
          },
        });
      }
      if (url === "/manager/field-photos") {
        return Promise.resolve({
          data: {
            items: [],
            context: { employees: [], departments: [] },
            pagination: { total: 0, total_pages: 0, page: 1, page_size: 12 },
            summary: {
              addon_active: false,
              read_only: false,
              price_configured: true,
              storage_addon_qty: 0,
              storage_used_bytes: 0,
              storage_quota_bytes: 5 * 1024 * 1024 * 1024,
              retention_days: 90,
              quota_status: {
                used_bytes: 0,
                quota_bytes: 5 * 1024 * 1024 * 1024,
                usage_percent: 0,
                state: "NORMAL",
                uploads_enabled: true,
                next_threshold_percent: 80,
                storage_expansion_quantity: 0,
                can_manage_storage: true,
              },
            },
          },
        });
      }
      if (url === "/billing/field-photos/preview") {
        return Promise.resolve({
          data: {
            recurring_amount_formatted: "29.00 USD",
            interval: "month",
            included_storage_label: "5 GB",
            retention_days: 90,
          },
        });
      }
      return Promise.resolve({ data: {} });
    });
  });

  it("shows authoritative inactive pricing and activation path", async () => {
    renderPage();

    expect(await screen.findByText(/Starts at 29\.00 USD\/month/i)).toBeInTheDocument();
    expect(screen.getByText(/Includes 5 GB · 90-day retention/i)).toBeInTheDocument();
    expect(screen.getByText(/No charge is created until you review and confirm the billing preview\./i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /view pricing & activate/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /open billing settings/i })).toBeInTheDocument();
  });

  it("uses canonical client navigation for opening billing settings", async () => {
    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: /open billing settings/i }));

    expect(mockNavigate).toHaveBeenCalledWith("/manager/dashboard?view=settings&tab=billing");
  });

  it("shows neutral unavailable copy instead of hardcoded commercial defaults when preview data is missing", async () => {
    mockApiGet.mockImplementation((url) => {
      if (url === "/billing/status") {
        return Promise.resolve({
          data: {
            field_photos: {
              addon_active: false,
              read_only: false,
              storage_addon_qty: 0,
              storage_used_bytes: 0,
              storage_quota_bytes: null,
              retention_days: null,
              price_configured: false,
              quota_status: {
                used_bytes: 0,
                quota_bytes: 0,
                usage_percent: 0,
                state: "NORMAL",
                uploads_enabled: true,
                next_threshold_percent: 80,
                storage_expansion_quantity: 0,
                can_manage_storage: true,
              },
            },
          },
        });
      }
      if (url === "/manager/field-photos") {
        return Promise.resolve({
          data: {
            items: [],
            context: { employees: [], departments: [] },
            pagination: { total: 0, total_pages: 0, page: 1, page_size: 12 },
            summary: {
              addon_active: false,
              read_only: false,
              storage_addon_qty: 0,
              storage_used_bytes: 0,
              storage_quota_bytes: null,
              retention_days: null,
              price_configured: false,
              quota_status: {
                used_bytes: 0,
                quota_bytes: 0,
                usage_percent: 0,
                state: "NORMAL",
                uploads_enabled: true,
                next_threshold_percent: 80,
                storage_expansion_quantity: 0,
                can_manage_storage: true,
              },
            },
          },
        });
      }
      if (url === "/billing/field-photos/preview") {
        return Promise.resolve({ data: {} });
      }
      return Promise.resolve({ data: {} });
    });

    renderPage();

    expect(await screen.findByText(/Starts at Pricing unavailable/i)).toBeInTheDocument();
    expect(screen.getByText(/Includes Included storage unavailable · Retention information unavailable/i)).toBeInTheDocument();
    expect(screen.getByText(/Field Photos billing is not configured yet\. Contact support to activate this add-on\./i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /view pricing & activate/i })).not.toBeInTheDocument();
  });

  it("shows authoritative full warning state on the manager page", async () => {
    mockApiGet.mockImplementation((url) => {
      if (url === "/billing/status") {
        return Promise.resolve({
          data: {
            field_photos: {
              addon_active: true,
              read_only: false,
              price_configured: true,
              storage_addon_qty: 1,
              storage_used_bytes: 5 * 1024 * 1024 * 1024,
              storage_quota_bytes: 5 * 1024 * 1024 * 1024,
              retention_days: 90,
              quota_status: {
                used_bytes: 5 * 1024 * 1024 * 1024,
                quota_bytes: 5 * 1024 * 1024 * 1024,
                usage_percent: 100,
                state: "FULL",
                uploads_enabled: false,
                next_threshold_percent: null,
                storage_expansion_quantity: 1,
                can_manage_storage: true,
              },
            },
          },
        });
      }
      if (url === "/manager/field-photos") {
        return Promise.resolve({
          data: {
            items: [],
            context: { employees: [], departments: [] },
            pagination: { total: 0, total_pages: 0, page: 1, page_size: 12 },
            summary: {
              addon_active: true,
              read_only: false,
              price_configured: true,
              storage_addon_qty: 1,
              storage_used_bytes: 5 * 1024 * 1024 * 1024,
              storage_quota_bytes: 5 * 1024 * 1024 * 1024,
              retention_days: 90,
              quota_status: {
                used_bytes: 5 * 1024 * 1024 * 1024,
                quota_bytes: 5 * 1024 * 1024 * 1024,
                usage_percent: 100,
                state: "FULL",
                uploads_enabled: false,
                next_threshold_percent: null,
                storage_expansion_quantity: 1,
                can_manage_storage: true,
              },
            },
          },
        });
      }
      if (url === "/billing/field-photos/preview") {
        return Promise.resolve({ data: {} });
      }
      return Promise.resolve({ data: {} });
    });

    renderPage();

    expect(await screen.findByText(/Storage is full\. Employee photo uploads are blocked until storage is increased or files are removed\./i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /review storage upgrade/i })).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText(/Storage used: 100%/i)).toBeInTheDocument();
    });
  });
});
