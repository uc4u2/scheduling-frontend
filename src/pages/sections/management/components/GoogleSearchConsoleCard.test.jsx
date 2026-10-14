import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import GoogleSearchConsoleCard from "./GoogleSearchConsoleCard";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (_key, options = {}) => options.defaultValue || _key,
  }),
}));

const baseContract = {
  custom_domain_active: true,
  custom_domain_url: "https://www.example.ca",
  canonical_url: "https://www.example.ca",
  primary_public_url: "https://www.example.ca",
};

const setupCard = (overrides = {}) => {
  const setup = {
    settings: {
      is_live: true,
      settings: { seo: {} },
      published_settings: { seo: {} },
      branding_draft_updated_at: "2026-10-13T20:00:00",
    },
    publicUrlContract: baseContract,
    canPublish: true,
    onSave: jest.fn().mockResolvedValue({}),
    onRefresh: jest.fn().mockResolvedValue({
      is_live: true,
      settings: { seo: { googleSiteVerification: "abcToken_123", googleDnsVerification: null } },
      branding_draft_updated_at: "2026-10-13T20:01:00",
    }),
    onPublish: jest.fn().mockResolvedValue({}),
    onReviewChanges: jest.fn(),
    ...overrides,
  };
  render(<GoogleSearchConsoleCard {...setup} />);
  return setup;
};

describe("GoogleSearchConsoleCard", () => {
  test("saves a normalized full meta tag as draft without publishing", async () => {
    const handlers = setupCard();
    fireEvent.change(screen.getByLabelText("HTML verification tag or token"), {
      target: { value: '<meta content="abcToken_123" name="google-site-verification">' },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save verification settings" }));

    await waitFor(() => expect(handlers.onSave).toHaveBeenCalledWith({
      googleSiteVerification: "abcToken_123",
      googleDnsVerification: null,
    }));
    expect(await screen.findByRole("dialog", { name: "Google verification settings saved as draft." })).toBeInTheDocument();
    expect(handlers.onPublish).not.toHaveBeenCalled();
  });

  test("keeps a saved token as draft when the manager declines publication", async () => {
    const handlers = setupCard();
    fireEvent.change(screen.getByLabelText("HTML verification tag or token"), {
      target: { value: "draftToken_123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save verification settings" }));
    await screen.findByRole("dialog", { name: "Google verification settings saved as draft." });

    fireEvent.click(screen.getByRole("button", { name: "Keep as draft" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(handlers.onPublish).not.toHaveBeenCalled();
  });

  test("requires the whole-draft warning before publishing with a concurrency token", async () => {
    const handlers = setupCard();
    fireEvent.change(screen.getByLabelText("HTML verification tag or token"), {
      target: { value: "abcToken_123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save verification settings" }));
    await screen.findByRole("dialog", { name: "Google verification settings saved as draft." });

    fireEvent.click(screen.getByRole("button", { name: "Publish now" }));
    expect(await screen.findByText(/not only the Google verification tag/i)).toBeInTheDocument();
    expect(handlers.onPublish).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Confirm publish" }));
    await waitFor(() => expect(handlers.onPublish).toHaveBeenCalledWith({
      expectedDraftUpdatedAt: "2026-10-13T20:01:00",
    }));
  });

  test("distinguishes published, replacement-pending, and removal-pending states", () => {
    const { rerender } = render(
      <GoogleSearchConsoleCard
        settings={{ is_live: true, settings: { seo: { googleSiteVerification: "sameToken_123" } }, published_settings: { seo: { googleSiteVerification: "sameToken_123" } } }}
        publicUrlContract={baseContract}
        canPublish
      />
    );
    expect(screen.getByText("Verification tag published")).toBeInTheDocument();

    rerender(
      <GoogleSearchConsoleCard
        settings={{ is_live: true, settings: { seo: { googleSiteVerification: "newToken_123" } }, published_settings: { seo: { googleSiteVerification: "oldToken_123" } } }}
        publicUrlContract={baseContract}
        canPublish
      />
    );
    expect(screen.getByText("Replacement saved as draft")).toBeInTheDocument();

    rerender(
      <GoogleSearchConsoleCard
        settings={{ is_live: true, settings: { seo: { googleSiteVerification: null } }, published_settings: { seo: { googleSiteVerification: "oldToken_123" } } }}
        publicUrlContract={baseContract}
        canPublish
      />
    );
    expect(screen.getByText("Removal saved as draft")).toBeInTheDocument();
  });

  test("does not claim the tag is live without an authoritative public URL", () => {
    render(
      <GoogleSearchConsoleCard
        settings={{ is_live: true, settings: { seo: { googleSiteVerification: "sameToken_123" } }, published_settings: { seo: { googleSiteVerification: "sameToken_123" } } }}
        publicUrlContract={{ publicly_available: false }}
        canPublish
      />
    );
    expect(screen.getByText("Saved as draft — publish required")).toBeInTheDocument();
    expect(screen.queryByText("Verification tag published")).not.toBeInTheDocument();
  });

  test("keeps the saved draft and reports a failed publish", async () => {
    const handlers = setupCard({ onPublish: jest.fn().mockRejectedValue(new Error("Publish unavailable")) });
    fireEvent.change(screen.getByLabelText("HTML verification tag or token"), { target: { value: "abcToken_123" } });
    fireEvent.click(screen.getByRole("button", { name: "Save verification settings" }));
    await screen.findByRole("dialog", { name: "Google verification settings saved as draft." });
    fireEvent.click(screen.getByRole("button", { name: "Publish now" }));
    await screen.findByText(/not only the Google verification tag/i);
    fireEvent.click(screen.getByRole("button", { name: "Confirm publish" }));
    expect(await screen.findByText("Publish unavailable")).toBeInTheDocument();
    expect(handlers.onSave).toHaveBeenCalledTimes(1);
  });

  test("blocks inline publishing when the manager lacks a publishable site", async () => {
    const handlers = setupCard({ canPublish: false });
    fireEvent.change(screen.getByLabelText("HTML verification tag or token"), { target: { value: "abcToken_123" } });
    fireEvent.click(screen.getByRole("button", { name: "Save verification settings" }));
    await screen.findByRole("dialog", { name: "Google verification settings saved as draft." });
    expect(screen.getByRole("button", { name: "Publish now" })).toBeDisabled();
    expect(handlers.onPublish).not.toHaveBeenCalled();
  });

  test("does not claim publication when authoritative refresh fails", async () => {
    const handlers = setupCard({ onRefresh: jest.fn().mockRejectedValue(new Error("Refresh unavailable")) });
    fireEvent.change(screen.getByLabelText("HTML verification tag or token"), { target: { value: "abcToken_123" } });
    fireEvent.click(screen.getByRole("button", { name: "Save verification settings" }));
    await screen.findByRole("dialog", { name: "Google verification settings saved as draft." });
    fireEvent.click(screen.getByRole("button", { name: "Publish now" }));

    expect(await screen.findByText("Refresh unavailable")).toBeInTheDocument();
    expect(screen.queryByText("Verification tag published")).not.toBeInTheDocument();
    expect(handlers.onPublish).not.toHaveBeenCalled();
  });

  test("stops when another manager changed the authoritative draft", async () => {
    const handlers = setupCard({
      onRefresh: jest.fn().mockResolvedValue({
        is_live: true,
        settings: { seo: { googleSiteVerification: "otherManagerToken_123" } },
        branding_draft_updated_at: "2026-10-13T20:03:00",
      }),
    });
    fireEvent.change(screen.getByLabelText("HTML verification tag or token"), { target: { value: "abcToken_123" } });
    fireEvent.click(screen.getByRole("button", { name: "Save verification settings" }));
    await screen.findByRole("dialog", { name: "Google verification settings saved as draft." });
    fireEvent.click(screen.getByRole("button", { name: "Publish now" }));

    expect(await screen.findByText(/draft changed after you saved/i)).toBeInTheDocument();
    expect(handlers.onPublish).not.toHaveBeenCalled();
  });

  test("review changes exits the warning without publishing", async () => {
    const handlers = setupCard();
    fireEvent.change(screen.getByLabelText("HTML verification tag or token"), { target: { value: "abcToken_123" } });
    fireEvent.click(screen.getByRole("button", { name: "Save verification settings" }));
    await screen.findByRole("dialog", { name: "Google verification settings saved as draft." });
    fireEvent.click(screen.getByRole("button", { name: "Publish now" }));
    await screen.findByText(/not only the Google verification tag/i);
    fireEvent.click(screen.getByRole("button", { name: "Review changes" }));

    expect(handlers.onReviewChanges).toHaveBeenCalledTimes(1);
    expect(handlers.onPublish).not.toHaveBeenCalled();
  });
});
