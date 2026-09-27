import { normalizePage } from "./BuilderPageUtils";

describe("BuilderPageUtils", () => {
  it("preserves server timestamps used by article save-state labels", () => {
    const page = normalizePage({
      id: 42,
      title: "Community update",
      slug: "blog/community-update",
      created_at: "2026-09-27T10:00:00Z",
      updated_at: "2026-09-27T10:05:00Z",
      deleted_at: null,
    });

    expect(page.created_at).toBe("2026-09-27T10:00:00Z");
    expect(page.updated_at).toBe("2026-09-27T10:05:00Z");
    expect(page.deleted_at).toBeNull();
  });
});
