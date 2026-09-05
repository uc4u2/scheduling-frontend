import fs from "fs";
import path from "path";

const builderSource = fs.readFileSync(
  path.join(__dirname, "VisualSiteBuilder.js"),
  "utf8"
);
const apiSource = fs.readFileSync(
  path.join(__dirname, "../../../utils/api.js"),
  "utf8"
);

describe("Visual Site Builder design history contract", () => {
  test("uses the approved customer-facing terminology", () => {
    expect(builderSource).toContain('title="Design history & restore"');
    expect(builderSource).toContain("Save version");
    expect(builderSource).toContain("Save approved design");
    expect(builderSource).toContain("Inspect version");
    expect(builderSource).toContain("Restore to draft");
    expect(builderSource).toContain("Restore & Publish");
    expect(builderSource).not.toContain("Checkpoint preview");
  });

  test("sends explicit approved and protected-delete intent", () => {
    expect(builderSource).toContain('onSaveCheckpoint("approved")');
    expect(builderSource).toContain("confirmProtected: Boolean(checkpoint.protected)");
    expect(apiSource).toContain("confirm_protected: Boolean(confirmProtected)");
  });

  test("does not create client-side automatic checkpoints", () => {
    expect(builderSource).toContain("automatic_checkpoint");
    expect(builderSource).not.toMatch(/createCheckpoint\([^)]*automatic/);
  });

  test("blocks publish for missing media and preserves the current page on restore", () => {
    expect(builderSource).toContain("checkpointPublishBlocked(cp)");
    expect(builderSource).toContain("preferredPage?.slug");
    expect(builderSource).toContain("Rollback saved:");
  });
});
