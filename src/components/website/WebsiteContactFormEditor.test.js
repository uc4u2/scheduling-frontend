import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import WebsiteContactFormEditor from "./WebsiteContactFormEditor";
import { api } from "../../utils/api";
import { normalizeWebsiteFormDraft } from "../../utils/websiteFormDefinition";

jest.mock("../../utils/api", () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
  },
}));

describe("WebsiteContactFormEditor", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

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

  it("edits and persists field metadata, required state, order, choices, and response copy through the WebsiteForm API", async () => {
    api.get.mockResolvedValue({
      data: [{
        id: 44,
        key: "contact",
        name: "Contact",
        success_msg: "Thanks.",
        fields: [
          { id: 1, name: "name", label: "Full name", type: "text", required: true, options: { placeholder: "Your name" }, sort_order: 0 },
          { id: 2, name: "training_format", label: "Training format", type: "select", required: false, options: { choices: ["Studio", "Online"] }, sort_order: 1 },
        ],
      }],
    });
    api.put.mockImplementation(async (_url, payload) => ({ data: { id: 44, ...payload } }));
    const onSaved = jest.fn();

    render(<WebsiteContactFormEditor companyId={7} formKey="contact" onSaved={onSaved} />);

    expect(await screen.findByDisplayValue("Full name")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Form name"), { target: { value: "Training inquiry" } });
    fireEvent.change(screen.getByLabelText("Success message"), { target: { value: "Your training note was received." } });
    fireEvent.change(screen.getAllByLabelText("Label")[0], { target: { value: "Your name" } });
    fireEvent.change(screen.getAllByLabelText("Field name")[0], { target: { value: "Lead Name" } });
    fireEvent.change(screen.getAllByLabelText("Placeholder")[0], { target: { value: "Tell us your name" } });
    fireEvent.click(screen.getAllByLabelText("Required")[0]);
    fireEvent.click(screen.getAllByRole("button", { name: "Move up" })[1]);
    fireEvent.click(screen.getByRole("button", { name: "Add field" }));
    expect(screen.getAllByRole("button", { name: "Remove" })).toHaveLength(3);
    fireEvent.click(screen.getAllByRole("button", { name: "Remove" })[2]);
    fireEvent.click(screen.getByRole("button", { name: "Save contact form" }));

    await waitFor(() => expect(api.put).toHaveBeenCalledTimes(1));
    expect(api.put).toHaveBeenCalledWith(
      "/api/website/forms/44",
      expect.objectContaining({
        name: "Training inquiry",
        key: "contact",
        success_msg: "Your training note was received.",
        fields: [
          expect.objectContaining({ name: "training_format", type: "select", required: false, sort_order: 0, options: expect.objectContaining({ choices: ["Studio", "Online"] }) }),
          expect.objectContaining({ name: "lead_name", label: "Your name", type: "text", required: false, sort_order: 1, options: expect.objectContaining({ placeholder: "Tell us your name" }) }),
        ],
      }),
      { headers: { "X-Company-Id": "7" } }
    );
    expect(onSaved).toHaveBeenCalledTimes(1);
    expect(await screen.findByText("Contact form definition saved. The preview is refreshing.")).toBeInTheDocument();
  });
});
