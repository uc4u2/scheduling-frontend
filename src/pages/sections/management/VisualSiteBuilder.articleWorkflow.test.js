import fs from "fs";
import path from "path";

const source = fs.readFileSync(
  path.join(__dirname, "VisualSiteBuilder.js"),
  "utf8"
);

describe("Visual Site Builder article workflow", () => {
  it("offers a single-step article workflow without technical approval gates", () => {
    expect(source).toContain("Save draft");
    expect(source).toContain("Publish article");
    expect(source).toContain("Ready to publish");
    expect(source).toContain("no manual mobile approval is required");
    expect(source).not.toContain(">SEO reviewed<");
    expect(source).not.toContain(">Mobile preview reviewed<");
  });

  it("offers guarded recoverable trash from both page-action menus", () => {
    const deleteActionCalls = source.match(
      /openArticleDeleteDialog\((?:articleWorkflowPage|pageMenuTarget)\)/g
    );
    expect(deleteActionCalls).toHaveLength(2);
    expect(source).toContain("canDeleteWebsiteBlogArticle(target)");
    expect(source).toContain('await refreshNextJsPreview(null, ["blog"])');
    expect(source).toContain("Unpublish and move to trash");
    expect(source).toContain("Move draft to trash");
    expect(source).toContain("restoreWebsiteBlogArticle");
    expect(source).toContain("permanentlyDeletePage");
  });

  it("includes article search, status filters, save state, and slug protection", () => {
    expect(source).toContain('label="Search articles"');
    expect(source).toContain('value="published"');
    expect(source).toContain('value="trash"');
    expect(source).toContain("Unsaved changes");
    expect(source).toContain("Published URL change:");
    expect(source).toContain("handleArticleChecklistItemClick");
    expect(source).toContain("withSyncedWebsiteBlogArticleMetadata");
  });

  it("keeps page-only actions out of the article-specific menu branch", () => {
    const menuStart = source.indexOf(
      "{isCurrentBlogArticle ? (",
      source.indexOf("anchorEl={canvasPageMenuAnchor}")
    );
    const menuEnd = source.indexOf("Open all pages & menu", menuStart);
    const articleMenu = source.slice(menuStart, menuEnd);

    const articleBranchEnd = articleMenu.indexOf(") : (");
    const articleOnlyControls = articleMenu.slice(0, articleBranchEnd);
    expect(articleOnlyControls).toContain("Unpublish article");
    expect(articleOnlyControls).not.toContain("Set as homepage");
    expect(articleOnlyControls).not.toContain("Show in menu");
  });
});
