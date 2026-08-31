import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import NextJsWebsiteStyleBrowser from "./NextJsWebsiteStyleBrowser";

const styles = [
  {
    key: "recommended-theme",
    version: 1,
    name: "Recommended Theme",
    description: "A profession-specific website style.",
    recommended: true,
    recommendedProfessionLabels: ["Salon & Beauty"],
    supportedPages: ["home", "about", "services", "contact"],
    previewAssets: {
      card: "/theme-previews/recommended-theme-card.webp",
      desktop: "/theme-previews/recommended-theme-desktop.png",
      mobile: "/theme-previews/recommended-theme-mobile.png",
    },
  },
  {
    key: "another-theme",
    version: 1,
    name: "Another Theme",
    description: "A second website style.",
    recommended: false,
    supportedPages: ["home", "services"],
    previewAssets: {
      card: "/theme-previews/another-theme-card.webp",
      desktop: "/theme-previews/another-theme-desktop.png",
      mobile: "/theme-previews/another-theme-mobile.png",
    },
  },
];

describe("NextJsWebsiteStyleBrowser", () => {
  it("renders each style once with one lazy optimized card image", () => {
    render(
      <NextJsWebsiteStyleBrowser
        styles={styles}
        currentStyleKey="another-theme"
        currentStyleVersion={1}
        liveStyleKey="another-theme"
        liveStyleVersion={1}
        saving={false}
        previewUrl=""
        previewError=""
        onPreview={jest.fn().mockResolvedValue(undefined)}
        onApply={jest.fn()}
      />
    );

    expect(screen.getAllByText("Recommended Theme")).toHaveLength(1);
    expect(screen.getAllByText("Another Theme")).toHaveLength(1);
    const images = screen.getAllByRole("img");
    expect(images).toHaveLength(2);
    expect(images[0]).toHaveAttribute("src", "/theme-previews/recommended-theme-card.webp");
    expect(images[0]).toHaveAttribute("loading", "lazy");
    expect(images[0]).toHaveAttribute("decoding", "async");
  });

  it("opens one live preview dialog and requests safe page paths", async () => {
    const onPreview = jest.fn().mockResolvedValue(undefined);
    render(
      <NextJsWebsiteStyleBrowser
        styles={styles}
        currentStyleKey="another-theme"
        currentStyleVersion={1}
        liveStyleKey="another-theme"
        liveStyleVersion={1}
        saving={false}
        previewUrl="http://localhost:3402/preview/t-token"
        previewError=""
        onPreview={onPreview}
        onApply={jest.fn()}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Preview Recommended Theme" }));
    await waitFor(() => expect(onPreview).toHaveBeenCalledWith(styles[0], []));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByTitle("Recommended Theme desktop preview")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Contact" }));
    await waitFor(() => expect(onPreview).toHaveBeenLastCalledWith(styles[0], ["contact"]));
  });
});
