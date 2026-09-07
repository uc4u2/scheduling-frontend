import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";

import WebsiteBrandingCard from "./WebsiteBrandingCard";
import { defaultFooterConfig, defaultHeaderConfig } from "../../utils/headerFooter";

jest.mock("../../utils/api", () => ({
  website: {},
}));

describe("WebsiteBrandingCard Modern theme surface", () => {
  it("shows Forge controls that affect the renderer and hides Classic-only utility controls", () => {
    const onChangeHeader = jest.fn();
    render(
      <WebsiteBrandingCard
        companyId={7}
        companySlug="forge-demo"
        companyName="Handoff Demo Spa"
        headerValue={{
          ...defaultHeaderConfig(),
          text: "",
          tagline: "Strength for real life",
        }}
        footerValue={defaultFooterConfig()}
        themeOverridesValue={{}}
        navOverridesValue={{}}
        surface="forge-motion"
        floatingSaveVisible={false}
        onChangeHeader={onChangeHeader}
        onChangeFooter={jest.fn()}
        onChangeThemeOverrides={jest.fn()}
        onChangeNavOverrides={jest.fn()}
        onSave={jest.fn()}
      />
    );

    expect(screen.getByTestId("forge-motion-branding-surface")).toBeInTheDocument();
    const textBrand = screen.getByLabelText("Text brand");
    expect(textBrand).toHaveValue("Handoff Demo Spa");
    expect(
      screen.getByText("Using the company name as the default. Editing this changes only the website header.")
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Text brand subtitle")).toHaveValue("Strength for real life");
    expect(screen.queryByLabelText("Utility bar left text")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save & refresh Canvas" })).toBeInTheDocument();

    fireEvent.change(textBrand, { target: { value: "Spa Header Only" } });
    expect(onChangeHeader).toHaveBeenCalledWith(
      expect.objectContaining({ text: "Spa Header Only" })
    );
  });
});
