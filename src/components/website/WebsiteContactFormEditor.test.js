import { normalizeWebsiteFormDraft } from "../../utils/websiteFormDefinition";

describe("WebsiteContactFormEditor", () => {
  it("normalizes the existing WebsiteForm record without creating a second content store", () => {
    const draft = normalizeWebsiteFormDraft({
      id: 44,
      key: "contact",
      name: "Studio contact",
      success_msg: "We received your note.",
      fields: [
        { id: 2, name: "Email Address", label: "Your email", type: "email", required: true, options: { placeholder: "name@example.com" } },
      ],
    });

    expect(draft).toMatchObject({ id: 44, key: "contact", name: "Studio contact", success_msg: "We received your note." });
    expect(draft.fields).toEqual([
      expect.objectContaining({ name: "email_address", label: "Your email", type: "email", required: true, sort_order: 0 }),
    ]);
  });

  it("provides the established safe contact fields when the WebsiteForm has not been created yet", () => {
    const draft = normalizeWebsiteFormDraft(null, "contact");
    expect(draft.key).toBe("contact");
    expect(draft.fields.map((field) => field.name)).toEqual(["name", "email", "phone", "message"]);
  });
});
