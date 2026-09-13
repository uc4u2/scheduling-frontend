import api from "./api";

export const FIELD_PHOTO_MAX_INPUT_BYTES = 25 * 1024 * 1024;
export const FIELD_PHOTO_ACCEPT = "image/png,image/jpeg,image/webp,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.heic,.heif";
export const FIELD_PHOTO_HELP = "JPG, PNG, WebP, HEIC, or HEIF. Photos up to 25 MB. Large photos are automatically optimized.";
export const FIELD_PHOTO_UNSUPPORTED = "This format is not supported. Upload JPG, PNG, WebP, HEIC, or HEIF. RAW, ProRAW, and video files are not supported.";

const allowedExtensions = new Set(["jpg", "jpeg", "png", "webp", "heic", "heif"]);
const activeUploads = new Map();

export const fieldPhotoAuthorizePath = Object.freeze({
  employeeShift: (shiftId) => `/employee/shifts/${shiftId}/field-photos/authorize`,
  employeeWorkOrder: (workOrderId) => `/finance/my-work-orders/${workOrderId}/field-photos/authorize`,
  managerClient: (clientId) => `/api/manager/client-360/${clientId}/field-photos/authorize`,
});

const extensionOf = (name = "") => String(name).split(".").pop().toLowerCase();

export function validateFieldPhoto(file, maxBytes = FIELD_PHOTO_MAX_INPUT_BYTES) {
  if (!file) throw new Error("Choose a photo to upload first.");
  if (!allowedExtensions.has(extensionOf(file.name))) {
    const error = new Error(FIELD_PHOTO_UNSUPPORTED);
    error.code = "photo_type_not_allowed";
    throw error;
  }
  if (Number(file.size || 0) > Number(maxBytes)) {
    const maxMb = Math.round(Number(maxBytes) / (1024 * 1024));
    const error = new Error(`This photo is too large to process. Maximum original size: ${maxMb} MB.`);
    error.code = "photo_too_large";
    throw error;
  }
  return file;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function pollFieldPhotoStatus(statusUrl, {
  apiClient = api,
  intervalMs = 1500,
  attempts = 30,
  onStatus,
} = {}) {
  let last;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    last = (await apiClient.get(statusUrl))?.data;
    const photo = last?.photo || last;
    onStatus?.(photo?.processing_status || "processing", photo);
    if (["ready", "failed", "blocked"].includes(photo?.processing_status)) return photo;
    await sleep(intervalMs);
  }
  return last?.photo || last;
}

export async function uploadFieldPhoto({
  file,
  directUploadEnabled,
  authorizePath,
  fallbackUpload,
  metadata = {},
  apiClient = api,
  fetchImpl = fetch,
  onStatus,
  poll = true,
}) {
  const maxBytes = directUploadEnabled ? FIELD_PHOTO_MAX_INPUT_BYTES : Number(metadata.fallbackMaxBytes || 10 * 1024 * 1024);
  validateFieldPhoto(file, maxBytes);
  if (!directUploadEnabled) {
    onStatus?.("uploading");
    return fallbackUpload(file, metadata);
  }

  const identity = `${authorizePath}:${file.name}:${file.size}:${file.lastModified || 0}`;
  if (activeUploads.has(identity)) return activeUploads.get(identity);
  const operation = (async () => {
    onStatus?.("authorizing");
    const authorization = (await apiClient.post(authorizePath, {
      filename: file.name,
      content_type: file.type || "application/octet-stream",
      file_size: file.size,
      note: metadata.note || "",
      location: metadata.location || {},
      ...(metadata.workOrderId ? { work_order_id: metadata.workOrderId } : {}),
    }))?.data;
    onStatus?.("uploading");
    const response = await fetchImpl(authorization.upload.url, {
      method: "PUT",
      headers: authorization.upload.headers || {},
      body: file,
    });
    if (!response.ok) {
      const error = new Error("The private photo upload could not be completed.");
      error.code = "quarantine_upload_failed";
      throw error;
    }
    onStatus?.("finalizing");
    const finalized = (await apiClient.post(authorization.finalize_url, {}))?.data;
    const initialPhoto = finalized?.photo || finalized;
    onStatus?.(initialPhoto?.processing_status || "pending_scan", initialPhoto);
    if (!poll || ["ready", "failed", "blocked"].includes(initialPhoto?.processing_status)) return initialPhoto;
    return pollFieldPhotoStatus(authorization.status_url, { apiClient, onStatus });
  })();
  activeUploads.set(identity, operation);
  try {
    return await operation;
  } finally {
    activeUploads.delete(identity);
  }
}
