import { revealEmbeddedApplication } from "./embeddedApplicationVisibility";

describe("revealEmbeddedApplication", () => {
  it("releases the custom-domain boot guard for embedded transactions", () => {
    const root = document.createElement("html");
    root.classList.add("company-boot");

    revealEmbeddedApplication(root);

    expect(root).not.toHaveClass("company-boot");
  });
});
