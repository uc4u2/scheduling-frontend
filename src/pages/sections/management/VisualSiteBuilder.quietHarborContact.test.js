import fs from "fs";
import path from "path";

const source = fs.readFileSync(
  path.join(__dirname, "VisualSiteBuilder.js"),
  "utf8"
);

describe("Quiet Harbor contact Canvas and Inspector parity", () => {
  it("edits the same Quiet Harbor hero video and fallback fields rendered by the tenant site", () => {
    expect(source).toContain('import SectionInspector, { ImageField, VideoField }');
    expect(source).toContain('isQuietHarborTheme ? "Hero fallback image"');
    expect(source).toContain('label="Hero background video (optional)"');
    expect(source).toContain('value={content.videoUrl || ""}');
    expect(source).toContain('updateSelectedContent({ videoUrl: url })');
    expect(source).toContain('label="Video poster / mobile fallback"');
    expect(source).toContain('value={content.posterImage || content.image || content.imageUrl || ""}');
  });

  it("exposes the authored contact-panel content rendered by the theme", () => {
    expect(source).toContain('const isQuietHarborTheme = normalizedNextThemeKey === "quiet-harbor"');
    expect(source).toContain('label="Contact panel image"');
    expect(source).toContain('label="Contact panel image alt text"');
    expect(source).toContain('label="Media panel statement"');
    expect(source).toContain('content.mediaTitle ?? content.mediaCaption ?? "Support starts with a conversation."');
    expect(source).toContain('updateSelectedContent({ mediaTitle: event.target.value })');
  });

  it("keeps legacy contact and CTA media aliases editable without duplicating content", () => {
    expect(source).toContain('{ mediaImage: url, image: url, imageUrl: url }');
    expect(source).toContain('{ mediaAlt: event.target.value, imageAlt: event.target.value }');
    expect(source).toContain('? { image: url, imageUrl: url, backgroundImage: url }');
    expect(source).toContain('label="CTA image alt text"');
    expect(source).toContain('renderQuietHarborAdditionalCtaFields()');
  });

  it("keeps Quiet Harbor contact intros copy-only and exposes rendered detail links", () => {
    expect(source).toContain('!(isQuietHarborTheme && selectedSemanticModule.type === "contactIntro")');
    expect(source).toContain('selectedSemanticModule.type === "contactIntro" ? (');
    expect(source).toContain('value={content.intro || content.body || ""}');
    expect(source).toContain('label="Link (optional)"');
    expect(source).toContain('helperText="Use mailto: for email, tel: for phone, or a page/website URL."');
  });

  it("exposes a scoped article hero height control only where Quiet Harbor consumes it", () => {
    expect(source).toContain('const isQuietHarborBlogArticleHero =');
    expect(source).toContain('normalizedEditingPath.startsWith("blog/")');
    expect(source).toContain('label="Article hero image height (px)"');
    expect(source).toContain('? Math.max(280, Math.min(720, Number(event.target.value)))');
    expect(source).toContain('helperText="Use 0 for the responsive theme default, or 280–720 px for a shorter or taller article image."');
  });
});
