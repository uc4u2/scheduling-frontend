import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import SeoSettingsCard from "./SeoSettingsCard";

const mockSnackbar = jest.fn();

jest.mock("notistack", () => ({
  useSnackbar: () => ({ enqueueSnackbar: mockSnackbar }),
}));

jest.mock("react-router-dom", () => ({
  useNavigate: () => jest.fn(),
}), { virtual: true });

jest.mock("../../../../utils/api", () => ({
  API_BASE_URL: "https://api.example.com",
  wb: { mediaUpload: jest.fn() },
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key, options = {}) => options.defaultValue || key,
  }),
}));

const renderCard = (onSave = jest.fn()) => {
  render(
    <SeoSettingsCard
      companyId={36}
      companySlug="web-design"
      domainStatus="verified"
      customDomain="example.com"
      primaryHost="schedulaa.com"
      settings={{
        domain_verified_at: "2026-09-06T12:00:00Z",
        favicon_url: "https://media.example.com/favicon.png",
        seo: {
          metaTitle: "Example Studio",
          metaDescription: "Example description",
          canonicalMode: "custom",
          canonicalHost: "example.com",
        },
      }}
      publicUrlContract={{ canonical_url: "https://example.com" }}
      companyLogoUrl=""
      hasDraftChanges={false}
      onSave={onSave}
    />
  );
  return { saveHandler: onSave };
};

describe("SeoSettingsCard actions", () => {
  beforeEach(() => {
    mockSnackbar.mockClear();
  });

  test("saves from the action shown after favicon settings", async () => {
    const { saveHandler } = renderCard();

    fireEvent.click(screen.getByRole("button", { name: "Save SEO changes" }));

    await waitFor(() => expect(saveHandler).toHaveBeenCalledTimes(1));
    expect(saveHandler.mock.calls[0][0]).toMatchObject({
      favicon_url: "https://media.example.com/favicon.png",
      seo: {
        metaTitle: "Example Studio",
        metaDescription: "Example description",
      },
    });
  });

  test("allows the complete SEO section to be collapsed", () => {
    renderCard();
    const summary = screen.getByRole("button", { name: /SEO & Metadata/ });

    expect(summary).toHaveAttribute("aria-expanded", "true");
    fireEvent.click(summary);
    expect(summary).toHaveAttribute("aria-expanded", "false");
  });
});
