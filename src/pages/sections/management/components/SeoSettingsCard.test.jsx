import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import SeoSettingsCard from "./SeoSettingsCard";
import { wb } from "../../../../utils/api";

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

const renderCard = (onSave = jest.fn(), overrides = {}) => {
  const baseSettings = {
    domain_verified_at: "2026-09-06T12:00:00Z",
    favicon_url: "https://media.example.com/favicon.png",
    seo: {
      metaTitle: "Example Studio",
      metaDescription: "Example description",
      canonicalMode: "custom",
      canonicalHost: "example.com",
    },
  };
  const settings = {
    ...baseSettings,
    ...(overrides.settings || {}),
    seo: { ...baseSettings.seo, ...(overrides.settings?.seo || {}) },
  };
  render(
    <SeoSettingsCard
      companyId={36}
      companySlug="web-design"
      domainStatus="verified"
      customDomain="example.com"
      primaryHost="schedulaa.com"
      settings={settings}
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
    wb.mediaUpload.mockReset();
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

  test("shows the effective custom-domain canonical and social fallback", () => {
    renderCard(jest.fn(), {
      settings: {
        seo: {
          effectiveOgImage: "https://media.example.com/homepage-hero.jpg",
          effectiveCanonicalUrl: "https://example.com",
        },
      },
    });

    expect(screen.getByText("Preview domain: example.com")).toBeInTheDocument();
    expect(screen.getByText("Canonical: https://example.com")).toBeInTheDocument();
    expect(screen.getByText(/Fallback image: https:\/\/media\.example\.com\/homepage-hero\.jpg/)).toBeInTheDocument();
    expect(screen.queryByText(/tattoo/i)).not.toBeInTheDocument();
  });

  test("rejects a newly uploaded rectangular favicon before media upload", async () => {
    const originalImage = global.Image;
    const originalCreateObjectURL = URL.createObjectURL;
    const originalRevokeObjectURL = URL.revokeObjectURL;
    URL.createObjectURL = jest.fn(() => "blob:favicon");
    URL.revokeObjectURL = jest.fn();
    global.Image = class {
      naturalWidth = 120;
      naturalHeight = 80;
      set src(_) {
        Promise.resolve().then(() => this.onload?.());
      }
    };

    try {
      renderCard();
      const input = document.querySelector('input[accept="image/png,image/webp,image/jpeg"]');
      const file = new File(["not-square"], "favicon.png", { type: "image/png" });
      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => expect(mockSnackbar).toHaveBeenCalledWith(
        expect.stringMatching(/square 1:1 image/),
        { variant: "error" }
      ));
      expect(wb.mediaUpload).not.toHaveBeenCalled();
    } finally {
      global.Image = originalImage;
      URL.createObjectURL = originalCreateObjectURL;
      URL.revokeObjectURL = originalRevokeObjectURL;
    }
  });
});
