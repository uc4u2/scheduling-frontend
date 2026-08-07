import React from "react";
import { render } from "@testing-library/react";

import SiteFrame from "../SiteFrame";
import {
  normalizeWebsiteDesignMetadata,
} from "../websiteDesign";
import {
  partitionRuntimeSections,
} from "../RenderSections";
import { resolveSectionRole } from "../roles/sectionRoleResolver";
import { adaptSectionForRole } from "../adapters/sectionAdapters";
import { loadWebsiteFamilyModule } from "../families/manifest";

jest.mock(
  "react-router-dom",
  () => ({
    MemoryRouter: ({ children }) => <div>{children}</div>,
    Link: ({ children, to, ...rest }) => (
      <a href={to || "#"} {...rest}>
        {children}
      </a>
    ),
    useLocation: () => ({
      pathname: "/preview",
      search: "",
    }),
    useNavigate: () => jest.fn(),
  }),
  { virtual: true }
);

jest.mock("../families/manifest", () => ({
  loadWebsiteFamilyModule: jest.fn(() => Promise.resolve(null)),
}));

jest.mock(
  "../../../utils/api",
  () => ({
    api: {},
    publicSite: {
      getBySlug: jest.fn(),
      invalidate: jest.fn(),
      setVersion: jest.fn(),
    },
  }),
  { virtual: true }
);

describe("website design phase 1 infrastructure", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("keeps classic sites on legacy motion when metadata is missing or invalid", () => {
    expect(normalizeWebsiteDesignMetadata({})).toEqual(
      expect.objectContaining({
        design_family: "classic",
        composition: "default",
        motion_profile: "legacy",
        design_family_version: 1,
      })
    );

    expect(
      normalizeWebsiteDesignMetadata({
        design_family: "unknown-family",
        composition: "homepage-b",
        motion_profile: "cinematic",
      })
    ).toEqual(
      expect.objectContaining({
        design_family: "classic",
        composition: "default",
        motion_profile: "legacy",
      })
    );
  });

  it("does not change runtime section ordering based on composition metadata", () => {
    const sections = [
      { id: "a", type: "hero" },
      { id: "b", type: "serviceGrid" },
      { id: "c", type: "popupCta" },
      { id: "d", type: "faq" },
    ];

    const first = partitionRuntimeSections(sections);
    const second = partitionRuntimeSections(sections);

    expect(first.flowSections.map((section) => section.id)).toEqual(["a", "b", "d"]);
    expect(second.flowSections.map((section) => section.id)).toEqual(["a", "b", "d"]);
    expect(first.popupSections.map((section) => section.id)).toEqual(["c"]);
  });

  it("keeps functional blocks on distinct semantic roles and preserves props in adapters", () => {
    const cases = [
      ["popupCta", "cta.popup"],
      ["bookingCtaBar", "cta.booking_bar"],
      ["mapEmbed", "contact.map"],
      ["contactForm", "contact.form"],
      ["videoStorySplit", "story.video"],
    ];

    cases.forEach(([type, role]) => {
      const section = {
        type,
        props: { sentinel: `${type}-value` },
      };
      expect(resolveSectionRole(section)).toBe(role);
      expect(adaptSectionForRole(section)).toEqual(
        expect.objectContaining({
          role,
          props: expect.objectContaining({ sentinel: `${type}-value` }),
        })
      );
    });
  });

  it("does not lazy-load non-classic family chunks for classic sites", () => {
    render(
      <div>
        <SiteFrame
          slug="classic-co"
          disableFetch
          initialSite={{
            slug: "classic-co",
            company: { name: "Classic Co", slug: "classic-co" },
            pages: [],
            design_family: "classic",
            motion_profile: "legacy",
          }}
        >
          <div>content</div>
        </SiteFrame>
      </div>
    );

    expect(loadWebsiteFamilyModule).not.toHaveBeenCalled();
  });

  it("continues normalizing stored deprecated family values without crashing classic fallback logic", () => {
    expect(
      normalizeWebsiteDesignMetadata({
        design_family: "hvac-clean-corporate",
        design_family_version: 1,
        motion_profile: "corporate",
      })
    ).toEqual(
      expect.objectContaining({
        design_family: "hvac-clean-corporate",
        design_family_version: 1,
        motion_profile: "corporate",
      })
    );
  });
});
