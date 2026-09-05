import {
  buildSupportWorkspacePath,
  downloadWebsiteDesignHandoff,
  getSupportCapabilities,
  getWebsiteDesignWorkspaceAction,
  websiteDesignHandoffFilename,
} from "./websiteDesignWorkspace";

describe("website design workspace helpers", () => {
  test("maps the existing consent lifecycle to one primary action", () => {
    expect(getWebsiteDesignWorkspaceAction(null).kind).toBe("request");
    expect(getWebsiteDesignWorkspaceAction({ status: "pending" }).kind).toBe("waiting");
    expect(
      getWebsiteDesignWorkspaceAction({ status: "pending", approved_at: "2026-09-05T12:00:00Z" }).kind
    ).toBe("start");
    expect(getWebsiteDesignWorkspaceAction({ status: "active" }).kind).toBe("open");
    expect(getWebsiteDesignWorkspaceAction({ status: "ended" }).kind).toBe("request");
  });

  test("uses a predictable tenant-and-ticket handoff filename", () => {
    expect(
      websiteDesignHandoffFilename({ company_slug: "Web Design", ticket_id: 5 })
    ).toBe("schedulaa-design-web-design-ticket-5.json");
  });

  test("downloads the backend-issued handoff without changing its contents", () => {
    const click = jest.fn();
    const remove = jest.fn();
    const appendChild = jest.fn();
    const anchor = { click, remove, style: {} };
    const documentRef = {
      body: { appendChild },
      createElement: jest.fn(() => anchor),
    };
    const originalCreateObjectURL = URL.createObjectURL;
    const originalRevokeObjectURL = URL.revokeObjectURL;
    URL.createObjectURL = jest.fn(() => "blob:handoff");
    URL.revokeObjectURL = jest.fn();
    const handoff = { ticket_id: 5, company_slug: "web-design", support_session_id: 9 };

    expect(downloadWebsiteDesignHandoff(handoff, documentRef)).toBe(true);
    expect(anchor.download).toBe("schedulaa-design-web-design-ticket-5.json");
    expect(click).toHaveBeenCalledTimes(1);
    expect(remove).toHaveBeenCalledTimes(1);
    expect(appendChild).toHaveBeenCalledWith(anchor);

    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
  });

  test("treats historical website_all as website-only rather than an operational wildcard", () => {
    expect(getSupportCapabilities({ scope: "website_all" })).toEqual([
      "website_builder",
      "domain_connect",
    ]);
    expect(
      getSupportCapabilities({
        scope: "website_commerce",
        capabilities: ["website_builder", "services_manage", "products_manage", "shipping_manage"],
      })
    ).toContain("shipping_manage");
  });

  test("keeps panel selection when adding support-session context", () => {
    expect(
      buildSupportWorkspacePath(
        "/manager/advanced-management?panel=products",
        { id: 9 },
        36,
        "https://app.schedulaa.com"
      )
    ).toBe("/manager/advanced-management?panel=products&support_session=9&company_id=36");
  });
});
