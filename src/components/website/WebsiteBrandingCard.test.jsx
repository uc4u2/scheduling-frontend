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

  it("shows Quiet Harbor footer visibility controls, resolved values, duplicate warnings, and draft status", () => {
    const onChangeFooter = jest.fn();
    render(
      <WebsiteBrandingCard
        companyId={37}
        companySlug="dr-behnaz"
        companyName="Dr. Behnaz"
        siteTitle="Bridge of Care Community Services"
        resolvedContact={{
          email: "owner@example.com",
          phone: "4165550110",
          address: "100 Community Way, Toronto, ON",
        }}
        headerValue={defaultHeaderConfig()}
        footerValue={{
          ...defaultFooterConfig(),
          columns: [{ title: "Connect", links: [{ label: "Email", href: "mailto:owner@example.com" }] }],
          contact_eyebrow: "Reach out",
          contact_introduction: "We are here to listen.",
          contact_cta_label: "Contact our team",
          contact_cta_href: "/contact",
        }}
        themeOverridesValue={{}}
        navOverridesValue={{}}
        surface="quiet-harbor"
        floatingSaveVisible={false}
        hasUnpublishedChanges
        onChangeHeader={jest.fn()}
        onChangeFooter={onChangeFooter}
        onChangeThemeOverrides={jest.fn()}
        onChangeNavOverrides={jest.fn()}
        onRequestContactJump={jest.fn()}
        onSave={jest.fn()}
      />
    );

    expect(screen.getByTestId("footer-draft-status")).toHaveTextContent("differs from the currently published");
    expect(screen.getByLabelText("Show contact card")).toBeChecked();
    expect(screen.getByLabelText("Show public email")).toBeChecked();
    expect(screen.getByLabelText("Show phone")).toBeChecked();
    expect(screen.getByLabelText("Show address")).toBeChecked();
    expect(screen.getAllByDisplayValue("owner@example.com").length).toBeGreaterThan(0);
    expect(screen.getByText(/same email as Company Profile/i)).toBeInTheDocument();
    expect(screen.getAllByText("Reach out").length).toBeGreaterThan(0);
    expect(screen.getByDisplayValue("Contact our team")).toBeInTheDocument();
    expect(screen.getByText(/\{\{siteTitle\}\}/)).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("Show phone"));
    expect(onChangeFooter).toHaveBeenCalledWith(expect.objectContaining({ show_phone: false }));
  });

  it("distinguishes unsaved local settings from saved draft and published settings", () => {
    const baseProps = {
      companyId: 37,
      companySlug: "dr-behnaz",
      companyName: "Dr. Behnaz",
      headerValue: defaultHeaderConfig(),
      footerValue: defaultFooterConfig(),
      themeOverridesValue: {},
      navOverridesValue: {},
      surface: "quiet-harbor",
      floatingSaveVisible: false,
      onChangeHeader: jest.fn(),
      onChangeFooter: jest.fn(),
      onChangeThemeOverrides: jest.fn(),
      onChangeNavOverrides: jest.fn(),
      onSave: jest.fn(),
    };
    const { rerender } = render(<WebsiteBrandingCard {...baseProps} hasUnsavedChanges />);
    expect(screen.getByTestId("footer-unsaved-status")).toBeInTheDocument();

    rerender(<WebsiteBrandingCard {...baseProps} hasUnpublishedChanges />);
    expect(screen.getByTestId("footer-draft-status")).toBeInTheDocument();

    rerender(<WebsiteBrandingCard {...baseProps} />);
    expect(screen.getByTestId("footer-published-status")).toBeInTheDocument();
  });
});
