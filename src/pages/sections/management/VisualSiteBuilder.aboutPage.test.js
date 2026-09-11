import fs from "fs";
import path from "path";

const source = fs.readFileSync(
  path.join(__dirname, "VisualSiteBuilder.js"),
  "utf8"
);

describe("Visual Site Builder About page provisioning", () => {
  it("recognizes the content-pack About Us route before creating a duplicate About page", () => {
    expect(source).toContain('about: ["about-us", "about", "our-team"]');
  });

  it("keeps the cross-industry About starter free of barber-specific copy", () => {
    const aboutStart = source.indexOf('if (entry.key === "about")');
    const contactStart = source.indexOf('if (entry.key === "contact")', aboutStart);
    const aboutStarter = source.slice(aboutStart, contactStart);

    expect(aboutStarter).toContain("The people behind the work.");
    expect(aboutStarter).toContain("Community & Client Support");
    expect(aboutStarter).not.toMatch(/barber|haircut|studio chair/i);
  });
});
