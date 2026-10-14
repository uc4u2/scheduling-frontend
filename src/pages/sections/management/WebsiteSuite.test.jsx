import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";

import WebsiteSuite from "./WebsiteSuite";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key, options = {}) => options.defaultValue || key }),
}));
jest.mock("../../../components/ui/ManagementFrame", () => ({ children }) => <div>{children}</div>);
jest.mock("./WebsiteManager", () => ({ focusSeo }) => <div>{focusSeo ? "SEO manager content" : "Website manager content"}</div>);
jest.mock("./WebsiteTemplates", () => () => <div>Template content</div>);
jest.mock("./VisualSiteBuilder", () => () => <div>Builder content</div>);
jest.mock("./InlineSiteEditor", () => () => <div>Editor content</div>);

describe("WebsiteSuite tool reopening", () => {
  beforeEach(() => {
    window.history.replaceState(null, "", "/manager/dashboard?view=website-pages");
  });

  test("reopens the already-selected Website Manager after closing", async () => {
    render(<WebsiteSuite />);
    const managerTab = screen.getByRole("tab", { name: "manager.websiteSuite.tabs.manager.label" });

    fireEvent.click(managerTab);
    expect(screen.getByText("Website manager content")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "close" }));
    await waitFor(() => expect(screen.queryByText("Website manager content")).not.toBeInTheDocument());
    await waitFor(() => expect(managerTab).toHaveFocus());

    fireEvent.click(managerTab);
    expect(screen.getByText("Website manager content")).toBeInTheDocument();
  });

  test("closes and reopens SEO and switches tools without double invocation", async () => {
    render(<WebsiteSuite />);
    const seoTab = screen.getByRole("tab", { name: "management.domainSettings.seo.title" });
    fireEvent.click(seoTab);
    expect(screen.getByText("SEO manager content")).toBeInTheDocument();
    expect(window.location.search).toContain("websiteTab=seo");

    fireEvent.click(screen.getByRole("button", { name: "close" }));
    await waitFor(() => expect(screen.queryByText("SEO manager content")).not.toBeInTheDocument());
    expect(window.location.search).not.toContain("websiteTab");
    fireEvent.click(seoTab);
    expect(screen.getByText("SEO manager content")).toBeInTheDocument();
  });

  test("opens the next tool with keyboard tab navigation", async () => {
    render(<WebsiteSuite />);
    const managerTab = screen.getByRole("tab", { name: "manager.websiteSuite.tabs.manager.label" });
    act(() => managerTab.focus());
    fireEvent.keyDown(managerTab, { key: "ArrowRight", code: "ArrowRight" });
    const editorTab = screen.getByRole("tab", { name: "manager.websiteSuite.tabs.editor.label" });
    await waitFor(() => expect(editorTab).toHaveFocus());
    fireEvent.click(editorTab);

    expect(await screen.findByText("Editor content")).toBeInTheDocument();
    expect(window.location.search).toContain("websiteTab=editor");
  });
});
