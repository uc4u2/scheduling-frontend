export const parseApiErrorPayload = async (data) => {
  if (!data) return null;
  if (data instanceof Blob || typeof data.text === "function") {
    try {
      const text = await data.text();
      return text ? JSON.parse(text) : null;
    } catch {
      return null;
    }
  }
  if (typeof data === "object") return data;
  if (typeof data === "string") {
    try {
      return JSON.parse(data);
    } catch {
      return { message: data };
    }
  }
  return null;
};

export const extractApiErrorMessage = async (err, fallback = "Request failed.") => {
  const payload = await parseApiErrorPayload(err?.response?.data);
  if (payload) {
    return (
      payload.message ||
      payload.error_description ||
      payload.error ||
      payload.error_code ||
      fallback
    );
  }
  return err?.message || fallback;
};

export const isLikelyDownloadHandoffError = (err) => {
  if (err?.response) return false;
  const message = String(err?.message || "").trim().toLowerCase();
  return message === "network error" || message === "failed to fetch";
};
