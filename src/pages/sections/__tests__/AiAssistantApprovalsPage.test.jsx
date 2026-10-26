import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import AiAssistantApprovalsPage from "../AiAssistantApprovalsPage";

const mockOperations = jest.fn();
const mockDecide = jest.fn();

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (_key, fallback) => fallback || _key,
  }),
}));

jest.mock("../../../utils/api", () => ({
  tenantAssistant: {
    operations: (...args) => mockOperations(...args),
    decideOperation: (...args) => mockDecide(...args),
  },
}));

const pending = (overrides) => ({
  id: "op_1",
  tool_name: "bookings_refund",
  state: "pending_approval",
  preview: {
    action: "Refund booking payment",
    service_refund_cents: 4000,
    effect: "Refunds only up to the captured amount.",
    nested: { reason: "client requested" },
  },
  target: { type: "booking", id: "15" },
  result: {},
  ...overrides,
});

describe("AiAssistantApprovalsPage", () => {
  beforeEach(() => {
    mockOperations.mockReset();
    mockDecide.mockReset();
  });

  test("shows the reviewed effect and links the booking", async () => {
    mockOperations.mockResolvedValue({ items: [pending()] });
    render(<AiAssistantApprovalsPage />);
    expect(await screen.findByText(/Refunds only up to the captured amount/i)).toBeTruthy();
    expect(screen.getByText(/nested reason: client requested/i)).toBeTruthy();
    expect(screen.getByRole("link", { name: /booking #15/i }).getAttribute("href")).toBe("/manager/payments");
  });

  test("posts ownership confirmation without storing it in the page address", async () => {
    mockOperations.mockResolvedValue({
      items: [
        pending({
          id: "op_owner",
          tool_name: "ownership_transfer",
          preview: { action: "Transfer primary ownership", requires_transfer_confirmation: true, effect: "Password is not saved." },
          target: { type: "employee", id: "9" },
        }),
      ],
    });
    mockDecide.mockResolvedValue({ id: "op_owner", state: "succeeded", preview: { action: "Transfer primary ownership" }, result: {} });
    render(<AiAssistantApprovalsPage />);
    const approve = await screen.findByRole("button", { name: "Approve" });
    expect(approve.disabled).toBe(true);
    fireEvent.change(screen.getByLabelText(/Type TRANSFER/i), { target: { value: "TRANSFER" } });
    fireEvent.change(screen.getByLabelText(/Current password/i), { target: { value: "correct-horse" } });
    fireEvent.click(screen.getByRole("button", { name: "Approve" }));
    await waitFor(() => expect(mockDecide).toHaveBeenCalledWith("op_owner", {
      decision: "approve",
      execution_input: { confirmation: "TRANSFER", current_password: "correct-horse" },
    }));
    expect(window.location.href).not.toContain("correct-horse");
    expect(await screen.findByText(/Schedulaa finished that action/i)).toBeTruthy();
  });

  test("distinguishes finished, failed, rejected, and unconfirmed results", async () => {
    mockOperations.mockResolvedValue({
      items: [
        pending({ id: "ok", state: "succeeded", preview: { action: "Email invoice" }, result: { checkout_url: "https://pay.example.test/hosted" } }),
        pending({ id: "bad", state: "failed", error_code: "stale_invoice", preview: { action: "Refund invoice" } }),
        pending({ id: "no", state: "rejected", preview: { action: "Cancel appointment" } }),
        pending({ id: "maybe", state: "ambiguous", preview: { action: "Buy shipping label" } }),
        pending({ id: "plain", state: "succeeded", preview: { action: "Ignore insecure link" }, result: { url: "http://evil.example/link", checkout_url: "http://evil.example/pay" } }),
      ],
    });
    render(<AiAssistantApprovalsPage />);
    expect(await screen.findByRole("link", { name: /checkout page/i })).toBeTruthy();
    expect(screen.getByText("stale_invoice")).toBeTruthy();
    expect(screen.getByText(/rejected that action/i)).toBeTruthy();
    expect(screen.getByText(/could not confirm/i)).toBeTruthy();
    expect(screen.queryByRole("link", { name: "http://evil.example/link" })).toBeNull();
  });

  test("links employee permission and company-profile approvals to their working manager views", async () => {
    mockOperations.mockResolvedValue({
      items: [
        pending({ id: "employee", tool_name: "employees_update_permissions", target: { type: "employee_permissions", id: "19" }, preview: { action: "Update employee permissions", handoffs: { profile_image: "/manager/employee-profiles?employee_id=19" } } }),
        pending({ id: "company", tool_name: "company_profile_update", target: { type: "company_profile", id: "4" }, preview: { action: "Update Company Profile", handoffs: { logo_upload: "/manager/dashboard?view=settings" } } }),
      ],
    });
    render(<AiAssistantApprovalsPage />);
    expect((await screen.findByRole("link", { name: /employee_permissions #19/i })).getAttribute("href")).toBe("/manager/employee-profiles?employee_id=19");
    expect(screen.getByRole("link", { name: /company_profile #4/i }).getAttribute("href")).toBe("/manager/dashboard?view=settings");
    expect(screen.getByRole("link", { name: /Open logo upload/i }).getAttribute("href")).toBe("/manager/dashboard?view=settings");
  });
});
