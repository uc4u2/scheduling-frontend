import {
  attachmentLabel,
  canEmployeeDeleteLeaveAttachment,
  canEmployeeMutateLeaveAttachment,
  canEmployeeUploadLeaveAttachment,
  normalizeLeaveAttachment,
  parseAttachmentDownloadResponse,
} from "../leaveAttachments";

describe("leave attachment helpers", () => {
  test("normalizes nested attachment metadata without exposing storage keys", () => {
    const attachment = normalizeLeaveAttachment({
      attachment_storage_key: "company/1/leave-attachments/raw.pdf",
      attachment: {
        present: true,
        file_name: "doctor-note.pdf",
        content_type: "application/pdf",
        supporting_doc: "doctor-note.pdf",
      },
    });

    expect(attachment).toEqual({
      present: true,
      file_name: "doctor-note.pdf",
      content_type: "application/pdf",
      supporting_doc: "doctor-note.pdf",
    });
    expect(attachment.attachment_storage_key).toBeUndefined();
    expect(attachmentLabel(attachment)).toBe("doctor-note.pdf");
  });

  test("falls back to flat legacy attachment metadata", () => {
    expect(normalizeLeaveAttachment({
      attachment_present: true,
      attachment_file_name: "legacy.png",
      attachment_content_type: "image/png",
      supporting_doc: "legacy.png",
    })).toEqual({
      present: true,
      file_name: "legacy.png",
      content_type: "image/png",
      supporting_doc: "legacy.png",
    });
  });

  test("returns a safe empty shape when no attachment exists", () => {
    const attachment = normalizeLeaveAttachment({});
    expect(attachment).toEqual({
      present: false,
      file_name: null,
      content_type: null,
      supporting_doc: null,
    });
    expect(attachmentLabel(attachment)).toBe("No supporting document");
  });

  test("allows employee upload on pending and approved leave only", () => {
    expect(canEmployeeMutateLeaveAttachment({ status: "pending" })).toBe(true);
    expect(canEmployeeMutateLeaveAttachment({ status: "approved" })).toBe(true);
    expect(canEmployeeUploadLeaveAttachment({ status: "approved" })).toBe(true);
    expect(canEmployeeUploadLeaveAttachment({ status: "rejected" })).toBe(false);
    expect(canEmployeeUploadLeaveAttachment({ status: "cancelled" })).toBe(false);
    expect(canEmployeeUploadLeaveAttachment({ status: "withdrawn" })).toBe(false);
    expect(canEmployeeMutateLeaveAttachment({ status: "pending", withdrawn_at: "2026-04-11T10:00:00" })).toBe(false);
    expect(canEmployeeMutateLeaveAttachment({ status: "pending", cancelled_at: "2026-04-11T10:00:00" })).toBe(false);
  });

  test("allows employee delete only while leave is pending", () => {
    expect(canEmployeeDeleteLeaveAttachment({ status: "pending" })).toBe(true);
    expect(canEmployeeDeleteLeaveAttachment({ status: "approved" })).toBe(false);
    expect(canEmployeeDeleteLeaveAttachment({ status: "pending", cancelled_at: "2026-04-11T10:00:00" })).toBe(false);
  });

  test("parses JSON download response returned as a blob", async () => {
    const response = {
      headers: { "content-type": "application/json" },
      data: new Blob([JSON.stringify({ url: "https://example.test/doc", file_name: "doc.pdf" })], {
        type: "application/json",
      }),
    };

    await expect(parseAttachmentDownloadResponse(response)).resolves.toEqual({
      kind: "url",
      url: "https://example.test/doc",
      fileName: "doc.pdf",
    });
  });
});
