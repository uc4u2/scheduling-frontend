const DIRECT_UPLOAD_UNAVAILABLE = new Set([404, 405, 409, 501]);

export async function uploadWebsiteMediaFile({
  file,
  requestPresign,
  uploadDirect,
  finalizeDirect,
  uploadMultipart,
}) {
  try {
    const presign = await requestPresign(file);
    if (presign?.direct_upload && presign?.upload_url && presign?.key) {
      await uploadDirect(presign, file);
      return finalizeDirect(presign, file);
    }
  } catch (error) {
    if (!DIRECT_UPLOAD_UNAVAILABLE.has(error?.response?.status)) {
      throw error;
    }
  }
  return uploadMultipart(file);
}
