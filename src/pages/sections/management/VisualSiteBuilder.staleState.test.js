import fs from "fs";
import path from "path";

const source = fs.readFileSync(
  path.join(__dirname, "VisualSiteBuilder.js"),
  "utf8"
);

describe("Visual Site Builder stale-state protection", () => {
  it("reloads editor state as part of Refresh preview", () => {
    expect(source).toContain("const refreshEditorAndPreview = async () =>");
    expect(source).toContain("await loadAll(companyId, preferredPage)");
    expect(source).toContain("onClick={refreshEditorAndPreview}");
  });

  it("uses the loaded branding revision when saving and publishing", () => {
    expect(source).toContain("const brandingDraftUpdatedAtRef = useRef(null)");
    expect(source).toContain(
      "expectedDraftUpdatedAt: brandingDraftUpdatedAtRef.current"
    );
    expect(source).toContain(
      "latestPayload?.branding_draft_updated_at || null"
    );
  });

  it("does not overwrite an existing page from Publish", () => {
    const publishStart = source.indexOf("const onPublish = useCallback");
    const settingsStart = source.indexOf(
      "const latestSettings = await wb.getSettings",
      publishStart
    );
    const pagePublishBlock = source.slice(publishStart, settingsStart);

    expect(pagePublishBlock).toContain("if (!payload.id)");
    expect(pagePublishBlock).not.toContain(
      "await wb.updatePage(companyId, payload.id, payload)"
    );
  });
});
