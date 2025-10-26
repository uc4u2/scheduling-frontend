import axios from "axios";
import { api, questionnaireUploadsApi } from "./api";
import {
  QUESTIONNAIRE_ALLOWED_MIME,
  QUESTIONNAIRE_MAX_FILE_BYTES,
  QUESTIONNAIRE_LIMITS,
} from "../constants/questionnaireUploads";

const emit = (fn, ...args) => {
  if (typeof fn === "function") {
    try {
      fn(...args);
    } catch (err) {
      console.error("questionnaire upload callback error", err);
    }
  }
};

const normaliseContentType = (file) =>
  (file?.type && file.type !== "application/octet-stream")
    ? file.type
    : file?.name && file.name.endsWith(".pdf")
      ? "application/pdf"
      : file?.type || "application/octet-stream";

export const validateQuestionnaireFile = (file) => {
  if (!file) {
    return { ok: false, reason: "No file selected" };
  }
  if (QUESTIONNAIRE_MAX_FILE_BYTES && file.size > QUESTIONNAIRE_MAX_FILE_BYTES) {
    return {
      ok: false,
      reason: `File exceeds ${QUESTIONNAIRE_LIMITS.maxFileMb}MB limit`,
    };
  }
  if (
    Array.isArray(QUESTIONNAIRE_ALLOWED_MIME) &&
    QUESTIONNAIRE_ALLOWED_MIME.length > 0
  ) {
    const lowered = normaliseContentType(file).toLowerCase();
    if (lowered && !QUESTIONNAIRE_ALLOWED_MIME.includes(lowered)) {
      return {
        ok: false,
        reason: "File type is not allowed",
      };
    }
  }
  return { ok: true };
};

const buildReservePayload = ({ submissionId, fieldKey, file, extra = {} }) => ({
  submission_id: submissionId,
  field_key: fieldKey,
  filename: file?.name || "upload",
  content_type: normaliseContentType(file),
  size: file?.size || 0,
  ...extra,
});

const uploadToS3 = async ({ upload, file, onProgress }) => {
  const formData = new FormData();
  Object.entries(upload?.fields || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      formData.append(key, value);
    }
  });
  formData.append("file", file);
  const requestConfig = {
    method: upload?.method || "POST",
    url: upload?.url,
    data: formData,
    onUploadProgress: (evt) => {
      const total = evt?.total || file.size || 1;
      emit(onProgress, {
        stage: "upload",
        loaded: evt?.loaded ?? 0,
        total,
        percent: Math.min(100, Math.round(((evt?.loaded ?? 0) / total) * 100)),
      });
    },
  };
  if (upload?.headers) {
    requestConfig.headers = { ...upload.headers };
  }
  await axios(requestConfig);
};

const uploadToLocal = async ({ upload, file, fileId, isCandidate, onProgress }) => {
  const formData = new FormData();
  Object.entries(upload?.fields || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      formData.append(key, value);
    }
  });
  formData.append("file", file);
  formData.append("file_id", String(fileId));
  const config = {
    onUploadProgress: (evt) => {
      const total = evt?.total || file.size || 1;
      emit(onProgress, {
        stage: "upload",
        loaded: evt?.loaded ?? 0,
        total,
        percent: Math.min(100, Math.round(((evt?.loaded ?? 0) / total) * 100)),
      });
    },
    headers: {
      ...(upload?.headers || {}),
    },
  };
  if (isCandidate) {
    config.noCompanyHeader = true;
  }
  const targetUrl = upload?.url || "/api/questionnaires/uploads/local";
  const response = await api.post(targetUrl, formData, config);
  return response?.data;
};

export const uploadQuestionnaireFile = async ({
  context = "recruiter",
  submissionId,
  fieldKey,
  file,
  intakeToken,
  extra = {},
  onProgress,
  onError,
  onComplete,
}) => {
  const validation = validateQuestionnaireFile(file);
  if (!validation.ok) {
    const error = new Error(validation.reason || "Invalid file");
    emit(onError, error, "validation");
    throw error;
  }

  const reservePayload = buildReservePayload({ submissionId, fieldKey, file, extra });

  let reserve;
  try {
    reserve =
      context === "candidate"
        ? await questionnaireUploadsApi.reserveCandidate(intakeToken, reservePayload)
        : await questionnaireUploadsApi.reserveRecruiter(reservePayload);
  } catch (err) {
    emit(onError, err, "reserve");
    throw err;
  }

  const fileRecord = reserve?.file;
  const upload = reserve?.upload;

  emit(onProgress, { stage: "reserve", loaded: 0, total: file.size, percent: 0 });

  if (!upload) {
    emit(onProgress, { stage: "complete", loaded: file.size, total: file.size, percent: 100 });
    emit(onComplete, fileRecord);
    return fileRecord;
  }

  const provider = String(upload?.provider || "local").toLowerCase();

  try {
    if (provider === "s3") {
      await uploadToS3({ upload, file, onProgress });
      const completion =
        context === "candidate"
          ? await questionnaireUploadsApi.completeCandidate(intakeToken, fileRecord.id)
          : await questionnaireUploadsApi.completeRecruiter(fileRecord.id);
      const finalFile = completion?.file || fileRecord;
      emit(onProgress, { stage: "complete", loaded: file.size, total: file.size, percent: 100 });
      emit(onComplete, finalFile);
      return finalFile;
    }

    const localResponse = await uploadToLocal({
      upload,
      file,
      fileId: fileRecord.id,
      isCandidate: context === "candidate",
      onProgress,
    });
    const finalFile = localResponse?.file || fileRecord;
    emit(onProgress, { stage: "complete", loaded: file.size, total: file.size, percent: 100 });
    emit(onComplete, finalFile);
    return finalFile;
  } catch (err) {
    emit(onError, err, "upload");
    throw err;
  }
};

export const downloadQuestionnaireFile = async ({
  context = "recruiter",
  fileId,
  intakeToken,
  config = {},
}) => {
  const requestConfig = { responseType: config.responseType || "blob", ...config };
  if (context === "candidate") {
    requestConfig.noCompanyHeader = true;
  }
  const response =
    context === "candidate"
      ? await questionnaireUploadsApi.downloadCandidate(intakeToken, fileId, requestConfig)
      : await questionnaireUploadsApi.downloadRecruiter(fileId, requestConfig);
  return response;
};

const questionnaireUploads = {
  uploadQuestionnaireFile,
  validateQuestionnaireFile,
  downloadQuestionnaireFile,
};

export default questionnaireUploads;
