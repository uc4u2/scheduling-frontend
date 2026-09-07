import React from "react";
import { render, screen } from "@testing-library/react";

import TenantLegacySiteFrame from "./TenantLegacySiteFrame";

const mockSiteFrame = jest.fn(({ children }) => children);

jest.mock("../../components/website/SiteFrame", () => (props) => mockSiteFrame(props));

describe("TenantLegacySiteFrame", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSiteFrame.mockImplementation(({ children }) => children);
  });

  it("uses the published Website Builder frame and reuses the resolved shell payload", () => {
    const shellPayload = { company: { name: "Vanda Orchid Jewels" } };

    render(
      <TenantLegacySiteFrame slug="vanda-orchid-jewels" activeKey="__login" shellPayload={shellPayload}>
        <div>Client login</div>
      </TenantLegacySiteFrame>
    );

    expect(screen.getByText("Client login")).toBeInTheDocument();
    expect(mockSiteFrame).toHaveBeenCalledWith(
      expect.objectContaining({
        slug: "vanda-orchid-jewels",
        activeKey: "__login",
        initialSite: shellPayload,
        disableFetch: true,
        wrapChildrenInContainer: false,
      })
    );
  });

  it("leaves content unwrapped when no tenant was resolved", () => {
    render(
      <TenantLegacySiteFrame slug="" activeKey="__login">
        <div>Platform login</div>
      </TenantLegacySiteFrame>
    );

    expect(screen.getByText("Platform login")).toBeInTheDocument();
    expect(mockSiteFrame).not.toHaveBeenCalled();
  });
});
