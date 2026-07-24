import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SettingsReviewsTips from "../SettingsReviewsTips";

const mockGet = jest.fn();
const mockPost = jest.fn();

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (_key, fallback) => fallback || _key,
  }),
}));

jest.mock("../../../utils/api", () => ({
  get: (...args) => mockGet(...args),
  post: (...args) => mockPost(...args),
}));

describe("SettingsReviewsTips", () => {
  beforeEach(() => {
    mockGet.mockReset();
    mockPost.mockReset();
    mockGet.mockResolvedValue({
      data: {
        enable_auto_review_emails: true,
        review_delay_hours: 24,
        require_manager_approval: false,
        include_tip_link: true,
        include_tip_checkout: true,
        tip_presets: [3, 5, 10],
        review_redirect_url: "https://g.page/r/example-review-link",
        google_review_cta_enabled: true,
        google_review_page_cta_enabled: true,
        google_review_cta_text: "Leave a Google review",
        invoice_review_cta_enabled: false,
        invoice_review_cta_eligibility: "paid_or_completed",
        email_subject_template: "",
        email_body_template: "",
        review_auto_publish: false,
        review_window_days: 14,
      },
    });
    mockPost.mockResolvedValue({
      data: {
        settings: {
          invoice_review_cta_enabled: true,
          invoice_review_cta_eligibility: "always",
        },
      },
    });
    window.localStorage.setItem("token", "test-token");
  });

  test("loads invoice review CTA defaults and disables policy selector while switch is off", async () => {
    render(<SettingsReviewsTips />);

    const toggle = await screen.findByRole("checkbox", {
      name: /Allow Google review CTA in invoice emails/i,
    });
    expect(toggle).not.toBeChecked();

    const policy = await screen.findByRole("combobox");
    expect(policy).toHaveTextContent(/After payment or completed work/i);
    expect(policy).toHaveAttribute("aria-disabled", "true");
  });

  test("save payload includes invoice review CTA settings", async () => {
    render(<SettingsReviewsTips />);

    const toggle = await screen.findByRole("checkbox", {
      name: /Allow Google review CTA in invoice emails/i,
    });
    await userEvent.click(toggle);

    const policy = await screen.findByRole("combobox");
    fireEvent.mouseDown(policy);
    await userEvent.click(await screen.findByRole("option", { name: /Any invoice — Advanced/i }));

    await userEvent.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => expect(mockPost).toHaveBeenCalledTimes(1));
    expect(mockPost.mock.calls[0][1]).toEqual(
      expect.objectContaining({
        invoice_review_cta_enabled: true,
        invoice_review_cta_eligibility: "always",
      })
    );
  });
});
