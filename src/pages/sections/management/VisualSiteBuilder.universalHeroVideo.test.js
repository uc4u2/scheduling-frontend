import fs from "fs";
import path from "path";

const source = fs.readFileSync(
  path.join(__dirname, "VisualSiteBuilder.js"),
  "utf8"
);

describe("universal Next.js hero media controls", () => {
  it("allows MP4/WebM hero media for every semantic Next.js theme", () => {
    expect(source).toContain("const allowsHeroVideoMedia = Boolean(normalizedNextThemeKey)");
    expect(source).toContain("allowVideo={allowsHeroVideoMedia}");
    expect(source).toContain('label={isQuietHarborTheme ? "Hero fallback image" : allowsHeroVideoMedia ? "Hero image or video" : "Hero image"}');
  });

  it("provides a poster and mobile fallback outside theme-specific inspectors", () => {
    expect(source).toContain(": allowsHeroVideoMedia ? <Box data-module-field-path={contentPath(\"posterImage\")}");
    expect(source).toContain('label="Video poster / mobile fallback"');
    expect(source).toContain("updateSelectedContent({ posterImage: url })");
  });

  it("keeps the dedicated video field synchronized with the universal hero picker", () => {
    expect(source).toContain("isWebsiteVideoReference(url) ? url : \"\"");
    expect(source).toContain("...(isQuietHarborTheme ? {} : { videoUrl:");
  });

  it("exposes AeroGrid's optional YouTube story URL without changing other themes", () => {
    expect(source).toContain('const isAeroGridTheme = normalizedNextThemeKey === "aerogrid-hvac"');
    expect(source).toContain('label="YouTube video URL (optional)"');
    expect(source).toContain('value={content.videoUrl || ""}');
    expect(source).toContain('updateSelectedContent({ videoUrl: event.target.value })');
  });
});
