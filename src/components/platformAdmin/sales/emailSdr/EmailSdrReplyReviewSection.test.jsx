import { render, screen } from "@testing-library/react";
import EmailSdrReplyReviewSection from "./EmailSdrReplyReviewSection";

jest.mock("./emailSdrDateTime", () => ({
  formatEmailSdrDateTime: () => "Sep 25, 2026, 6:06:31 PM (America/Toronto)",
}));

test("renders the original message timestamp through the viewer-timezone formatter", () => {
  render(
    <EmailSdrReplyReviewSection
      newReplyRows={[
        {
          issues: ["needs_classification"],
          event: {
            id: 6,
            from_email: "photoartisto.ca@gmail.com",
            body_text: "Final Email SDR test received.",
            suggested_classification: "auto_reply",
            suggested_next_action: "reply_manually",
            matched_lead: {
              company_name: "Photo Artisto",
              email: "photoartisto.ca@gmail.com",
            },
            matched_message: {
              subject: "[FINAL TEST] Schedulaa Email SDR enterprise delivery",
              sent_at: "2026-09-25T22:06:31.321824",
            },
          },
        },
      ]}
      unmatchedRows={[]}
      bounceRows={[]}
      needsActionRows={[]}
      classificationOptions={["auto_reply"]}
      inboundReplyClass={{}}
      inboundReplyText={{}}
      setInboundReplyClass={jest.fn()}
      setInboundReplyText={jest.fn()}
    />
  );

  expect(
    screen.getByText(/sent Sep 25, 2026, 6:06:31 PM \(America\/Toronto\)/)
  ).toBeInTheDocument();
  expect(screen.queryByText(/2026-09-25T22:06:31\.321824/)).not.toBeInTheDocument();
});
