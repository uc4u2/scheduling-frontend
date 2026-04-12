export const normalizeLeaveAttachment = (leave = {}) => {
  const nested = leave?.attachment && typeof leave.attachment === "object" ? leave.attachment : {};
  const fileName = nested.file_name ?? leave.attachment_file_name ?? leave.supporting_doc ?? null;
  const contentType = nested.content_type ?? leave.attachment_content_type ?? null;
  const supportingDoc = nested.supporting_doc ?? leave.supporting_doc ?? fileName ?? null;
  const present = Boolean(
    nested.present ??
      leave.attachment_present ??
      fileName ??
      contentType ??
      supportingDoc
  );

  return {
    present,
    file_name: fileName || null,
    content_type: contentType || null,
    supporting_doc: supportingDoc || null,
  };
};

export const canEmployeeMutateLeaveAttachment = (leave = {}) => {
  return canEmployeeUploadLeaveAttachment(leave);
};

export const canEmployeeUploadLeaveAttachment = (leave = {}) => {
  const status = String(leave.status || "").toLowerCase();
  return (status === "pending" || status === "approved") && !leave.withdrawn_at && !leave.cancelled_at;
};

export const canEmployeeDeleteLeaveAttachment = (leave = {}) => {
  const status = String(leave.status || "").toLowerCase();
  return status === "pending" && !leave.withdrawn_at && !leave.cancelled_at;
};

export const attachmentLabel = (attachment = {}) => {
  if (!attachment?.present) return "No supporting document";
  return attachment.file_name || attachment.supporting_doc || "Supporting document attached";
};

const headerValue = (headers = {}, key) => {
  if (!headers) return "";
  return headers[key] || headers[key.toLowerCase()] || "";
};

export const getDownloadFileName = (response, fallback = "leave-attachment") => {
  const disposition = headerValue(response?.headers, "content-disposition");
  const match = /filename\*?=(?:UTF-8''|\")?([^\";]+)/i.exec(disposition || "");
  if (match?.[1]) {
    try {
      return decodeURIComponent(match[1].replace(/\"/g, ""));
    } catch {
      return match[1].replace(/\"/g, "");
    }
  }
  return fallback;
};

const blobToText = (blob) => {
  if (blob && typeof blob.text === "function") {
    return blob.text();
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error || new Error("Could not read response"));
    reader.readAsText(blob);
  });
};

export const parseAttachmentDownloadResponse = async (response) => {
  const contentType = headerValue(response?.headers, "content-type") || response?.data?.type || "";
  const data = response?.data;

  if (data?.url) {
    return { kind: "url", url: data.url, fileName: data.file_name || data.attachment?.file_name || "leave-attachment" };
  }

  if (typeof Blob !== "undefined" && data instanceof Blob) {
    if (String(contentType).includes("application/json")) {
      const text = await blobToText(data);
      const parsed = JSON.parse(text || "{}");
      return { kind: "url", url: parsed.url, fileName: parsed.file_name || parsed.attachment?.file_name || "leave-attachment" };
    }
    return { kind: "blob", blob: data, fileName: getDownloadFileName(response) };
  }

  return { kind: "unknown" };
};

export const openAttachmentDownload = (download) => {
  if (!download) return false;
  if (download.kind === "url" && download.url) {
    window.open(download.url, "_blank", "noopener,noreferrer");
    return true;
  }
  if (download.kind === "blob" && download.blob) {
    const url = URL.createObjectURL(download.blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = download.fileName || "leave-attachment";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    return true;
  }
  return false;
};
