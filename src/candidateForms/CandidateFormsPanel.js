// src/candidateForms/CandidateFormsPanel.js
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  Collapse,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import ArchiveIcon from "@mui/icons-material/Archive";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import LaunchIcon from "@mui/icons-material/Launch";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import CloudDownloadIcon from "@mui/icons-material/CloudDownload";
import axios from "axios";
import { useSnackbar } from "notistack";
import QUESTIONNAIRE_LIMITS from "../constants/questionnaireUploads";
import { uploadQuestionnaireFile, downloadQuestionnaireFile, validateQuestionnaireFile } from "../utils/questionnaireUploads";
import { candidateIntakeApi, settingsApi } from "../utils/api";
import { PROFESSION_OPTIONS } from "../constants/professions";
import { getDefaultBlueprint } from "./defaultFormBlueprints";
import TemplateFieldBuilder from "./TemplateFieldBuilder";

const TEMPLATE_STATUS_OPTIONS = [
  { label: "All", value: "" },
  { label: "Draft", value: "draft" },
  { label: "Active", value: "active" },
  { label: "Archived", value: "archived" },
];

const SUBMISSION_STATUS_OPTIONS = [
  { label: "All", value: "" },
  { label: "Invited", value: "invited" },
  { label: "In Progress", value: "in_progress" },
  { label: "Submitted", value: "submitted" },
  { label: "Converted", value: "converted" },
];

const professionLabelMap = new Map(
  PROFESSION_OPTIONS.map((option) => [option.value, option.label])
);

const emptyTemplateForm = {
  id: null,
  professionKey: "",
  name: "",
  description: "",
  status: "active",
  locale: "en",
  emailSubject: "",
  emailBody: "",
  schemaText: JSON.stringify({ fields: [] }, null, 2),
  fieldsText: JSON.stringify(
    [
      {
        section: null,
        key: "candidate_name",
        label: "Candidate Name",
        type: "text",
        is_required: true,
        order_index: 0,
        config: {},
      },
    ],
    null,
    2
  ),
};

const EMPTY_SCHEMA_TEXT = emptyTemplateForm.schemaText.trim();
const EMPTY_FIELDS_TEXT = emptyTemplateForm.fieldsText.trim();

const RESERVED_FIELD_KEYS = [
  "candidate_name",
  "candidate_email",
  "candidate_phone",
];

const normaliseFieldKey = (value, fallback = "field") =>
  String(value || fallback)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");

const normaliseFieldDefinition = (field, index = 0) => {
  const key = field?.key ? normaliseFieldKey(field.key, `field_${index + 1}`) : `field_${index + 1}`;
  return {
    id: field?.id ?? null,
    section: field?.section ?? null,
    key: normaliseFieldKey(field?.key || key, key),
    label: field?.label || key,
    type: field?.type || field?.field_type || "text",
    field_type: field?.field_type || field?.type || "text",
    is_required: field?.is_required !== false,
    order_index: Number.isFinite(field?.order_index) ? field.order_index : index,
    config: field?.config && typeof field.config === "object" ? field.config : {},
  };
};

const parseTemplateFields = (value, existingMap = new Map()) => {
  if (!value) {
    return { fields: [], error: null };
  }
  try {
    const parsed = typeof value === "string" ? JSON.parse(value) : value;
    if (Array.isArray(parsed)) {
      const normalised = parsed.map((item, index) => {
        const key = item?.key ? normaliseFieldKey(item.key, `field_${index + 1}`) : `field_${index + 1}`;
        const existing = existingMap.get(key);
        const base = normaliseFieldDefinition(item, index);
        return existing ? { ...base, id: existing.id } : base;
      }).map((item, index) => ({
        ...item,
        order_index: index,
      }));
      const nextMap = new Map(normalised.map((item) => [item.key, item]));
      return { fields: normalised, error: null, map: nextMap };
    }
  } catch (error) {
    console.error("Failed to parse questionnaire fields", error);
    return { fields: [], error, map: existingMap };
  }
  return { fields: [], error: new Error('Invalid fields definition'), map: existingMap };
};

const serialiseTemplateFields = (fields = []) =>
  JSON.stringify(
    fields.map((field, index) => ({
      id: field.id ?? null,
      section: field.section ?? null,
      key: field.key,
      label: field.label,
      type: field.type || field.field_type || "text",
      field_type: field.field_type || field.type || "text",
      is_required: field.is_required !== false,
      order_index: index,
      config: field.config && typeof field.config === "object" ? field.config : {},
    })),
    null,
    2
  );


const formatBytes = (bytes) => {
  if (bytes === undefined || bytes === null) {
    return "";
  }
  const valueNumber = Number(bytes);
  if (!Number.isFinite(valueNumber)) {
    return "";
  }
  let value = valueNumber;
  const units = ["B", "KB", "MB", "GB"];
  let index = 0;
  while (value >= 1024 && index < units.length - 1) {
    value /= 1024;
    index += 1;
  }
  const display = Number.isInteger(value) ? value : value.toFixed(1);
  return `${display} ${units[index]}`;
};

const CandidateFormsPanel = ({ token, apiUrl }) => {
  const { enqueueSnackbar } = useSnackbar();
  const baseUrl = apiUrl || process.env.REACT_APP_API_URL || "http://localhost:5000";

  const [templates, setTemplates] = useState([]);
  const [templateLoading, setTemplateLoading] = useState(false);
  const [templateError, setTemplateError] = useState("");

  const [submissions, setSubmissions] = useState([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [submissionsError, setSubmissionsError] = useState("");

  const [templateStatus, setTemplateStatus] = useState("");
  const [templateProfession, setTemplateProfession] = useState("");
  const [includeArchived, setIncludeArchived] = useState(false);

  const [submissionStatus, setSubmissionStatus] = useState("submitted");
  const [submissionProfession, setSubmissionProfession] = useState("");

  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [templateDialogMode, setTemplateDialogMode] = useState("create");
  const [templateDialogLoading, setTemplateDialogLoading] = useState(false);
  const [templateForm, setTemplateForm] = useState(emptyTemplateForm);
  const [templateSaving, setTemplateSaving] = useState(false);
  const [templateDialogError, setTemplateDialogError] = useState("");

  const initialFieldsResult = parseTemplateFields(emptyTemplateForm.fieldsText);
  const [templateFields, setTemplateFields] = useState(initialFieldsResult.fields);
  const [templateFieldMap, settemplateFieldMap] = useState(initialFieldsResult.map || new Map());
  const [templateFieldsError, setTemplateFieldsError] = useState("");
  const [showAdvancedSchema, setShowAdvancedSchema] = useState(false);
  const [showAdvancedFields, setShowAdvancedFields] = useState(false);
  const [defaultProfessionKey, setDefaultProfessionKey] = useState("");
  const [effectiveProfessionKey, setEffectiveProfessionKey] = useState("");
  const [settingsError, setSettingsError] = useState("");

  const handleTemplateFieldsChange = useCallback((nextFields) => {
    const source = Array.isArray(nextFields) ? nextFields : [];
    const normalised = source.map((field, index) =>
      normaliseFieldDefinition({ ...templateFieldMap.get(field.key), ...field }, index)
    );
    const nextMap = new Map(normalised.map((field) => [field.key, field]));
    setTemplateFields(normalised);
    settemplateFieldMap(nextMap);
    setTemplateFieldsError("");
    setTemplateForm((prev) => ({
      ...prev,
      fieldsText: serialiseTemplateFields(normalised),
    }));
  }, [templateFieldMap]);

  const synchroniseTemplateFieldsFromText = useCallback((value) => {
    const result = parseTemplateFields(value, templateFieldMap);
    setTemplateFields(result.fields);
    settemplateFieldMap(result.map || new Map());
    if (result.error && String(value || "").trim()) {
      setTemplateFieldsError("Fields JSON is invalid");
    } else {
      setTemplateFieldsError("");
    }
  }, [templateFieldMap]);

  const [convertingId, setConvertingId] = useState(null);
  const [attachmentsDialogOpen, setAttachmentsDialogOpen] = useState(false);
  const [attachmentsDialogLoading, setAttachmentsDialogLoading] = useState(false);
  const [attachmentsDialogError, setAttachmentsDialogError] = useState("");
  const [attachmentsSubmission, setAttachmentsSubmission] = useState(null);
  const [attachmentsQuestionnaires, setAttachmentsQuestionnaires] = useState([]);
  const [attachmentsFiles, setAttachmentsFiles] = useState([]);
  const [attachmentsStorage, setAttachmentsStorage] = useState(QUESTIONNAIRE_LIMITS);
  const [attachmentsUploadState, setAttachmentsUploadState] = useState({});

  const attachmentsAllowedMime = useMemo(() => {
    const list = attachmentsStorage?.allowed_mime || attachmentsStorage?.allowedMime;
    return Array.isArray(list) && list.length ? list : QUESTIONNAIRE_LIMITS.allowedMime;
  }, [attachmentsStorage]);

  useEffect(() => {
    let active = true;

    const loadSettings = async () => {
      try {
        const data = await settingsApi.get();
        if (!active) return;
        const normalise = (value) => (typeof value === "string" ? value.trim() : value);
        const payload = (data && typeof data === "object") ? data : {};
        const companyDefault = normalise(payload.default_profession) || "";
        const effective = normalise(payload.effective_profession) || "";
        const personal = normalise(payload.profession) || "";
        const seedProfession = companyDefault || effective || personal || "custom";
        setDefaultProfessionKey(companyDefault);
        setEffectiveProfessionKey(effective || companyDefault);
        setSettingsError("");
        setTemplateProfession((prev) => prev || seedProfession);
        setSubmissionProfession((prev) => prev || seedProfession);
      } catch (err) {
        if (!active) return;
        const detail =
          err?.displayMessage ||
          err?.response?.data?.error ||
          err?.message ||
          "";
        setSettingsError(detail || "Unable to load company default profession.");
      }
    };

    loadSettings();

    return () => {
      active = false;
    };
  }, []);

  const defaultProfessionDisplay = defaultProfessionKey || effectiveProfessionKey;

  const attachmentsMaxFiles = useMemo(() => {
    const value = attachmentsStorage?.max_files ?? attachmentsStorage?.maxFilesPerSubmission;
    return typeof value === "number" && value > 0 ? value : QUESTIONNAIRE_LIMITS.maxFilesPerSubmission;
  }, [attachmentsStorage]);

  const attachmentsMaxFileMb = useMemo(() => {
    const value = (
      attachmentsStorage?.maxFileMb ??
      attachmentsStorage?.max_file_mb ??
      attachmentsStorage?.maxFileMb
    );
    return value || QUESTIONNAIRE_LIMITS.maxFileMb;
  }, [attachmentsStorage]);

  const attachmentsScanningEnabled =
    attachmentsStorage?.scanning_enabled ?? attachmentsStorage?.scanningEnabled ?? QUESTIONNAIRE_LIMITS.scanningEnabled;

  const authHeaders = useMemo(
    () => (token ? { Authorization: `Bearer ${token}` } : {}),
    [token]
  );

  const intakeBaseUrl = useMemo(() => {
    if (typeof window !== "undefined" && window.location?.origin) {
      return window.location.origin;
    }

    try {
      const parsed = new URL(baseUrl);
      return `${parsed.protocol}//${parsed.host}`;
    } catch (err) {
      return baseUrl;
    }
  }, [baseUrl]);

  const professionFilterOptions = useMemo(() => {
    const baseOptions = PROFESSION_OPTIONS.filter((opt) => opt.value !== "custom");
    const dynamic = new Set();
    templates.forEach((tpl) => {
      if (tpl.profession_key && !professionLabelMap.has(tpl.profession_key)) {
        dynamic.add(tpl.profession_key);
      }
    });
    submissions.forEach((sub) => {
      if (sub.profession_key && !professionLabelMap.has(sub.profession_key)) {
        dynamic.add(sub.profession_key);
      }
    });
    const dynamicOptions = Array.from(dynamic).map((value) => ({
      value,
      label: value,
    }));
    return [
      { value: "", label: "All Professions" },
      ...baseOptions,
      ...dynamicOptions,
    ];
  }, [templates, submissions]);

  const dialogProfessionOptions = useMemo(() => {
    const seeded = new Set(
      PROFESSION_OPTIONS.filter((opt) => opt.value !== "custom").map((opt) => opt.value)
    );
    templates.forEach((tpl) => {
      if (tpl.profession_key) {
        seeded.add(tpl.profession_key);
      }
    });
    submissions.forEach((sub) => {
      if (sub.profession_key) {
        seeded.add(sub.profession_key);
      }
    });
    return Array.from(seeded).sort();
  }, [templates, submissions]);

  const defaultBlueprint = useMemo(() => {
    if (!templateForm.professionKey) {
      return null;
    }
    return getDefaultBlueprint(templateForm.professionKey);
  }, [templateForm.professionKey]);

  const fetchTemplates = useCallback(async () => {
    if (!token) {
      setTemplates([]);
      setTemplateLoading(false);
      return;
    }

    setTemplateLoading(true);
    setTemplateError("");

    try {
      const params = new URLSearchParams();
      if (templateStatus) params.append("status", templateStatus);
      if (templateProfession) params.append("profession", templateProfession);
      if (includeArchived) params.append("include_archived", "true");
      const url = `${baseUrl}/api/form-templates${
        params.toString() ? `?${params.toString()}` : ""
      }`;
      const response = await axios.get(url, { headers: authHeaders });
      setTemplates(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      const detail =
        err.response?.data?.error || err.message || "Failed to load templates";
      setTemplateError(detail);
      enqueueSnackbar(detail, { variant: "error" });
    } finally {
      setTemplateLoading(false);
    }
  }, [authHeaders, baseUrl, enqueueSnackbar, includeArchived, templateProfession, templateStatus, token]);

  const fetchSubmissions = useCallback(async () => {

    if (!token) {

      setSubmissions([]);

      setSubmissionsLoading(false);

      return;

    }



    setSubmissionsLoading(true);

    setSubmissionsError("");



    try {

      const params = {};

      if (submissionStatus) params.status = submissionStatus;

      if (submissionProfession) params.profession = submissionProfession;



      const config = token ? { headers: authHeaders } : {};

      const data = await candidateIntakeApi.listSubmissions(params, config);

      let items = [];

      if (Array.isArray(data?.items)) {

        items = data.items;

      } else if (Array.isArray(data)) {

        items = data;

      }

      const normalized = items.map((item) => ({

        ...item,

        files: Array.isArray(item?.files) ? item.files : [],

      }));

      setSubmissions(normalized);

    } catch (err) {

      const detail = err?.response?.data?.error || err?.message || "Failed to load submissions";

      setSubmissionsError(detail);

      enqueueSnackbar(detail, { variant: "error" });

    } finally {

      setSubmissionsLoading(false);

    }

  }, [authHeaders, enqueueSnackbar, submissionProfession, submissionStatus, token]);



  const handleCloneTemplate = async () => {
    enqueueSnackbar("Clone functionality coming soon", { variant: "info" });
  };

  const handleArchiveTemplate = async (templateId) => {
    try {
      await axios.delete(`${baseUrl}/api/form-templates/${templateId}`, {
        headers: authHeaders,
      });
      enqueueSnackbar("Template archived", { variant: "success" });
      fetchTemplates();
    } catch (err) {
      enqueueSnackbar(
        err.response?.data?.error || "Failed to archive template",
        { variant: "error" }
      );
    }
  };

  const handleConvertSubmission = async (submissionId) => {
    try {
      setConvertingId(submissionId);
      await axios.post(
        `${baseUrl}/api/candidate-forms/submissions/${submissionId}/convert`,
        {},
        { headers: authHeaders }
      );
      enqueueSnackbar("Submission marked as converted", { variant: "success" });
      fetchSubmissions();
    } catch (err) {
      enqueueSnackbar(
        err.response?.data?.error || "Failed to convert submission",
        { variant: "error" }
      );
    } finally {
      setConvertingId(null);
    }
  };

  const handleCopyInviteLink = useCallback(
    async (intakeToken) => {
      if (!intakeToken) {
        enqueueSnackbar("No intake token available", { variant: "warning" });
        return;
      }

      const link = `${intakeBaseUrl}/apply/${intakeToken}`;

      try {
        if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(link);
          enqueueSnackbar("Intake link copied", { variant: "success" });
        } else {
          throw new Error("Clipboard API unavailable");
        }
      } catch (err) {
        window.prompt("Copy this intake link", link);
      }
    },
    [enqueueSnackbar, intakeBaseUrl]
  );

  const handleOpenIntakeLink = useCallback(
    (intakeToken) => {
      if (!intakeToken) {
        enqueueSnackbar("No intake token available", { variant: "warning" });
        return;
      }

      const link = `${intakeBaseUrl}/apply/${intakeToken}`;
      window.open(link, "_blank", "noopener,noreferrer");
    },
    [enqueueSnackbar, intakeBaseUrl]
  );


  const handleManageAttachments = useCallback(
    async (submission) => {
      if (!submission?.intake_token) {
        enqueueSnackbar("Intake link not available yet", { variant: "warning" });
        return;
      }

      setAttachmentsSubmission(submission);
      setAttachmentsDialogOpen(true);
      setAttachmentsDialogLoading(true);
      setAttachmentsDialogError("");

      try {
        const data = await candidateIntakeApi.get(submission.intake_token);
        const questionnairesList = Array.isArray(data?.questionnaires) ? data.questionnaires : [];
        const storage = data?.storage || {};
        const normalizedStorage = {
          ...QUESTIONNAIRE_LIMITS,
          ...storage,
        };
        if (storage?.max_files !== undefined) {
          normalizedStorage.max_files = storage.max_files;
        }
        if (storage?.maxFileMb !== undefined) {
          normalizedStorage.maxFileMb = storage.maxFileMb;
        }
        if (storage?.max_file_mb !== undefined) {
          normalizedStorage.maxFileMb = storage.max_file_mb;
        }
        if (storage?.allowed_mime) {
          normalizedStorage.allowed_mime = storage.allowed_mime;
        }
        if (storage?.allowedMime) {
          normalizedStorage.allowed_mime = storage.allowedMime;
        }
        if (storage?.scanning_enabled !== undefined) {
          normalizedStorage.scanning_enabled = storage.scanning_enabled;
        }
        if (storage?.scanningEnabled !== undefined) {
          normalizedStorage.scanning_enabled = storage.scanningEnabled;
        }

        const files = Array.isArray(data?.submission?.files)
          ? data.submission.files
          : Array.isArray(submission.files)
            ? submission.files
            : [];

        setAttachmentsQuestionnaires(questionnairesList);
        setAttachmentsStorage(normalizedStorage);
        setAttachmentsFiles(files);
        setAttachmentsUploadState({});
        setSubmissions((prev) =>
          prev.map((item) =>
            item.id === submission.id ? { ...item, files } : item
          )
        );
      } catch (err) {
        const detail = err?.response?.data?.error || err?.message || "Failed to load questionnaires";
        setAttachmentsDialogError(detail);
        enqueueSnackbar(detail, { variant: "error" });
      } finally {
        setAttachmentsDialogLoading(false);
      }
    },
    [enqueueSnackbar, token]
  );

  const handleCloseAttachments = useCallback(() => {
    setAttachmentsDialogOpen(false);
    setAttachmentsDialogLoading(false);
    setAttachmentsDialogError("");
    setAttachmentsSubmission(null);
    setAttachmentsQuestionnaires([]);
    setAttachmentsFiles([]);
    setAttachmentsUploadState({});
  }, []);

  const handleQuestionnaireFileSelect = useCallback(
    async (templateId, file) => {
      if (!attachmentsSubmission?.id || !file) {
        return;
      }

      const fieldKey = `questionnaire_${templateId}`;
      const submissionId = attachmentsSubmission.id;
      const existingFile = attachmentsFiles.find((item) => item.field_key === fieldKey);
      const normalizedType = (file.type || "").split(";")[0].toLowerCase();
      const maxBytesOverride = attachmentsMaxFileMb ? attachmentsMaxFileMb * 1024 * 1024 : null;

      const validation = validateQuestionnaireFile(file);
      if (!validation.ok) {
        setAttachmentsUploadState((prev) => ({
          ...prev,
          [fieldKey]: { stage: "error", percent: 0, loading: false, error: validation.reason || "Invalid file" },
        }));
        enqueueSnackbar(validation.reason || "Invalid file", { variant: "warning" });
        return;
      }

      if (attachmentsAllowedMime.length && normalizedType && !attachmentsAllowedMime.includes(normalizedType)) {
        const message = "File type is not permitted for this questionnaire.";
        setAttachmentsUploadState((prev) => ({
          ...prev,
          [fieldKey]: { stage: "error", percent: 0, loading: false, error: message },
        }));
        enqueueSnackbar(message, { variant: "warning" });
        return;
      }

      if (maxBytesOverride && file.size > maxBytesOverride) {
        const message = `File exceeds ${(attachmentsMaxFileMb || QUESTIONNAIRE_LIMITS.maxFileMb)}MB limit for this submission.`;
        setAttachmentsUploadState((prev) => ({
          ...prev,
          [fieldKey]: { stage: "error", percent: 0, loading: false, error: message },
        }));
        enqueueSnackbar(message, { variant: "warning" });
        return;
      }

      if (
        !existingFile &&
        attachmentsMaxFiles &&
        attachmentsMaxFiles > 0 &&
        attachmentsFiles.length >= attachmentsMaxFiles
      ) {
        const message = `Maximum of ${(attachmentsMaxFiles || QUESTIONNAIRE_LIMITS.maxFilesPerSubmission)} files reached for this submission.`;
        setAttachmentsUploadState((prev) => ({
          ...prev,
          [fieldKey]: { stage: "error", percent: 0, loading: false, error: message },
        }));
        enqueueSnackbar(message, { variant: "warning" });
        return;
      }

      setAttachmentsUploadState((prev) => ({
        ...prev,
        [fieldKey]: { stage: "reserve", percent: 0, loading: true, error: null },
      }));

      try {
        const uploaded = await uploadQuestionnaireFile({
          context: "recruiter",
          submissionId,
          fieldKey,
          file,
          onProgress: ({ percent }) => {
            const safePercent = Number.isFinite(percent) ? Math.round(percent) : 0;
            setAttachmentsUploadState((prev) => ({
              ...prev,
              [fieldKey]: {
                ...(prev[fieldKey] || {}),
                stage: "upload",
                percent: safePercent,
                loading: true,
                error: null,
              },
            }));
          },
        });

        const nextFiles = attachmentsFiles
          .filter((item) => item.field_key !== fieldKey)
          .concat(uploaded);

        setAttachmentsFiles(nextFiles);
        setAttachmentsSubmission((prev) =>
          prev && prev.id === submissionId ? { ...prev, files: nextFiles } : prev
        );
        setSubmissions((prev) =>
          prev.map((item) =>
            item.id === submissionId ? { ...item, files: nextFiles } : item
          )
        );
        setAttachmentsUploadState((prev) => ({
          ...prev,
          [fieldKey]: { stage: "complete", percent: 100, loading: false, error: null },
        }));
        enqueueSnackbar("File uploaded", { variant: "success" });
      } catch (err) {
        const detail = err?.response?.data?.error || err?.message || "Upload failed";
        setAttachmentsUploadState((prev) => ({
          ...prev,
          [fieldKey]: { stage: "error", percent: 0, loading: false, error: detail },
        }));
        enqueueSnackbar(detail, { variant: "error" });
      }
    },
    [
      attachmentsFiles,
      attachmentsAllowedMime,
      attachmentsMaxFileMb,
      attachmentsMaxFiles,
      attachmentsSubmission,
      enqueueSnackbar,
    ]
  );
  const handleDownloadQuestionnaireFile = useCallback(
    async (file) => {
      try {
        const response = await downloadQuestionnaireFile({
          context: "recruiter",
          fileId: file.id,
          config: { responseType: "blob" },
        });
        const headers = response?.headers || {};
        const contentType = headers["content-type"] || headers["Content-Type"] || "";

        if (contentType.includes("application/json") && typeof response?.data?.text === "function") {
          const textBody = await response.data.text();
          const payload = JSON.parse(textBody);
          const url = payload?.download?.url;
          if (url) {
            window.open(url, "_blank", "noopener,noreferrer");
            return;
          }
        }

        if (response?.data) {
          const blob = response.data;
          const downloadUrl = window.URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = downloadUrl;
          link.download = file.original_filename || "questionnaire-upload";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(downloadUrl);
          return;
        }

        enqueueSnackbar("Unable to download the file. Please try again.", { variant: "error" });
      } catch (err) {
        const detail = err?.response?.data?.error || err?.message || "Download failed.";
        enqueueSnackbar(detail, { variant: "error" });
      }
    },
    [enqueueSnackbar]
  );
  const formatDateTime = useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      }),
    []
  );

  const resolveProfessionLabel = useCallback(
    (value) => professionLabelMap.get(value) || value || "-",
    []
  );

  const templateNameById = useMemo(() => {
    const map = new Map();
    templates.forEach((tpl) => {
      if (tpl && typeof tpl.id !== "undefined") {
        map.set(tpl.id, tpl.name);
      }
    });
    return map;
  }, [templates]);

  const templateStatusColor = useCallback((status) => {
    switch (status) {
      case "active":
        return "success";
      case "archived":
        return "default";
      case "draft":
      default:
        return "default";
    }
  }, []);

  const submissionStatusColor = useCallback((status) => {
    switch (status) {
      case "submitted":
        return "success";
      case "in_progress":
        return "info";
      case "converted":
        return "primary";
      case "invited":
      default:
        return "default";
    }
  }, []);

  const handleTemplateDialogClose = () => {
    setTemplateDialogOpen(false);
    setTemplateDialogError("");
    setTemplateDialogLoading(false);
    setTemplateForm(emptyTemplateForm);
  };

  const openCreateTemplate = () => {
    const seededProfession =
      templateProfession || effectiveProfessionKey || defaultProfessionKey || "";
    const nextForm = { ...emptyTemplateForm, professionKey: seededProfession };

    setTemplateDialogMode("create");
    setTemplateForm(nextForm);
    setTemplateDialogError("");
    setTemplateDialogLoading(false);

    const result = parseTemplateFields(nextForm.fieldsText);
    setTemplateFields(result.fields);
    settemplateFieldMap(result.map || new Map());
    setTemplateFieldsError("");
    setShowAdvancedFields(false);
    setShowAdvancedSchema(false);
    setTemplateDialogOpen(true);
  };

  const openEditTemplate = async (template) => {
    if (!template?.id) {
      enqueueSnackbar("Template id missing", { variant: "error" });
      return;
    }

    setTemplateDialogMode("edit");
    setTemplateDialogError("");
    setTemplateForm({ ...emptyTemplateForm, id: template.id });
    setTemplateDialogLoading(true);
    const result = parseTemplateFields(emptyTemplateForm.fieldsText);
    setTemplateFields(result.fields);
    settemplateFieldMap(result.map || new Map());
    setTemplateFieldsError("");
    setShowAdvancedFields(false);
    setShowAdvancedSchema(false);
    setTemplateDialogOpen(true);

    try {
      const { data } = await axios.get(
        `${baseUrl}/api/form-templates/${template.id}`,
        { headers: authHeaders }
      );

      const fieldsResult = parseTemplateFields(data.fields || [], templateFieldMap);
      setTemplateFields(fieldsResult.fields);
    settemplateFieldMap(fieldsResult.map || new Map());
      settemplateFieldMap(fieldsResult.map || new Map());
      setTemplateFieldsError(fieldsResult.error ? "Fields JSON is invalid" : "");

      setTemplateForm({
        id: data.id,
        professionKey: data.profession_key || "",
        name: data.name || "",
        description: data.description || "",
        status: data.status || "draft",
        locale: data.locale || "en",
        emailSubject: data.email_subject || "",
        emailBody: data.email_body || "",
        schemaText: JSON.stringify(data.schema || {}, null, 2),
        fieldsText: serialiseTemplateFields(fieldsResult.fields),
      });
    } catch (err) {
      const detail = err.response?.data?.error || err.message || "Failed to load template";
      setTemplateDialogError(detail);
    } finally {
      setTemplateDialogLoading(false);
    }
  };

  const handleTemplateFormChange = (field) => (event) => {
    const value = event.target.value;
    setTemplateForm((prev) => ({ ...prev, [field]: value }));
    if (field === "fieldsText") {
      synchroniseTemplateFieldsFromText(value);
    }
  };

  const handleApplyDefaultTemplate = useCallback(() => {
    const professionKey = templateForm.professionKey;
    if (!professionKey) {
      setTemplateDialogError("Choose a profession to load defaults.");
      return;
    }

    const blueprint = defaultBlueprint || getDefaultBlueprint(professionKey);
    if (!blueprint) {
      setTemplateDialogError("No starter template is available for this profession yet.");
      return;
    }

    const nextSchema = JSON.stringify(blueprint.schema, null, 2);
    const fieldsResult = parseTemplateFields(blueprint.fields || [], templateFieldMap);
    const nextFieldsText = serialiseTemplateFields(fieldsResult.fields);
    const schemaMatches = (templateForm.schemaText || "").trim() === nextSchema.trim();
    const fieldsMatch = (templateForm.fieldsText || "").trim() === nextFieldsText.trim();
    const hasCustomContent = !schemaMatches || !fieldsMatch;

    if (hasCustomContent) {
      const confirmed = window.confirm(
        "Replace the current form definition with the recommended template? Any unsaved changes will be lost."
      );
      if (!confirmed) {
        return;
      }
    }

    setTemplateDialogError("");
    setTemplateFields(fieldsResult.fields);
    settemplateFieldMap(fieldsResult.map || new Map());
    setTemplateFieldsError(fieldsResult.error ? "Fields JSON is invalid" : "");
    setTemplateForm((prev) => ({
      ...prev,
      name: blueprint.name,
      description: blueprint.description,
      emailSubject: blueprint.emailSubject,
      emailBody: blueprint.emailBody,
      schemaText: nextSchema,
      fieldsText: nextFieldsText,
    }));
  }, [defaultBlueprint, templateForm.professionKey, templateForm.schemaText, templateForm.fieldsText]);
  const handleTemplateSubmit = async () => {
    const isEdit = templateDialogMode === "edit";

    if (!templateForm.name || !templateForm.professionKey) {
      setTemplateDialogError("Name and profession are required.");
      return;
    }

    if (templateFieldsError) {
      setTemplateDialogError(templateFieldsError);
      return;
    }

    let schema;
    try {
      schema = templateForm.schemaText ? JSON.parse(templateForm.schemaText) : {};
      if (schema && typeof schema !== "object") {
        throw new Error("Schema must be an object");
      }
    } catch (err) {
      setTemplateDialogError("Schema must be valid JSON.");
      return;
    }

    const normalisedFields = templateFields.map((field, index) => ({
      ...normaliseFieldDefinition(field, index),
      order_index: index,
    }));

    const keySet = new Set();
    for (const field of normalisedFields) {
      if (!field.key) {
        setTemplateDialogError("Each field requires a key.");
        return;
      }
      if (keySet.has(field.key)) {
        setTemplateDialogError(`Duplicate field key: ${field.key}`);
        return;
      }
      keySet.add(field.key);
    }

    if (normalisedFields.length === 0) {
      setTemplateDialogError("Add at least one field before saving.");
      return;
    }

    const fieldsTextValue = serialiseTemplateFields(normalisedFields);
    const fields = JSON.parse(fieldsTextValue);

    const schemaSectionFields = normalisedFields.map((field, index) => ({
      key: field.key,
      label: field.label,
      field_type: field.field_type || field.type || "text",
      type: field.type || field.field_type || "text",
      is_required: field.is_required !== false,
      required: field.is_required !== false,
      order_index: index,
      config: field.config && typeof field.config === "object" ? field.config : {},
    }));

    const schemaSections = [
      {
        key: normaliseFieldKey(templateForm.name, 'questionnaire') || "questionnaire",
        title: templateForm.name || "Questionnaire",
        description: templateForm.description || "",
        fields: schemaSectionFields,
      },
    ];

    const mergedSchema = {
      ...(schema && typeof schema === 'object' && !Array.isArray(schema) ? schema : {}),
      fields: schemaSectionFields,
      sections: schemaSections,
    };
    const schemaTextValue = JSON.stringify(mergedSchema, null, 2);

    setTemplateForm((prev) => ({
      ...prev,
      fieldsText: fieldsTextValue,
      schemaText: schemaTextValue,
    }));

    const payload = {
      profession_key: templateForm.professionKey,
      name: templateForm.name,
      description: templateForm.description,
      status: templateForm.status,
      locale: templateForm.locale,
      email_subject: templateForm.emailSubject,
      email_body: templateForm.emailBody,
      schema: mergedSchema,
      fields,
    };

    try {
      setTemplateSaving(true);
      setTemplateDialogError("");

      if (isEdit && templateForm.id !== null) {
        await axios.put(
          `${baseUrl}/api/form-templates/${templateForm.id}`,
          payload,
          { headers: authHeaders }
        );
        enqueueSnackbar("Template updated", { variant: "success" });
      } else {
        await axios.post(`${baseUrl}/api/form-templates`, payload, { headers: authHeaders });
        enqueueSnackbar("Template created", { variant: "success" });
      }

      handleTemplateDialogClose();
      fetchTemplates();
    } catch (err) {
      const detail = err.response?.data?.error || err.message || "Failed to save template";
      setTemplateDialogError(detail);
    } finally {
      setTemplateSaving(false);
    }
  };

  return (
    <Stack spacing={3}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
          <Typography variant="h6">Templates</Typography>
          <Stack direction="row" spacing={1}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={openCreateTemplate}
              disabled={!token}
            >
              New Template
            </Button>
            <Tooltip title="Refresh templates">
              <span>
                <IconButton onClick={fetchTemplates} disabled={templateLoading}>
                  <RefreshIcon />
                </IconButton>
              </span>
            </Tooltip>
          </Stack>
        </Stack>

        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" sx={{ mt: 2 }}>
          <TextField
            select
            size="small"
            label="Status"
            value={templateStatus}
            onChange={(event) => setTemplateStatus(event.target.value)}
            sx={{ minWidth: 160 }}
          >
            {TEMPLATE_STATUS_OPTIONS.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            size="small"
            label="Profession"
            value={templateProfession}
            onChange={(event) => setTemplateProfession(event.target.value)}
            sx={{ minWidth: 200 }}
          >
            {professionFilterOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>

          {defaultProfessionDisplay ? (
            <Chip
              color="primary"
              variant="outlined"
              size="small"
              label={`Default: ${resolveProfessionLabel(defaultProfessionDisplay)}`}
            />
          ) : null}

          <Chip
            color={includeArchived ? "primary" : "default"}
            variant={includeArchived ? "filled" : "outlined"}
            label={includeArchived ? "Including Archived" : "Exclude Archived"}
            onClick={() => setIncludeArchived((prev) => !prev)}
          />
        </Stack>

        {settingsError && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            {settingsError}
          </Alert>
        )}

        {templateError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {templateError}
          </Alert>
        )}

        <TableContainer sx={{ mt: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Profession</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">Fields</TableCell>
                <TableCell align="center">Submissions</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {templateLoading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <CircularProgress size={24} />
                  </TableCell>
                </TableRow>
              ) : templates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography variant="body2" color="text.secondary">
                      No templates yet. Create one to get started.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                templates.map((template) => (
                  <TableRow key={template.id} hover>
                    <TableCell>
                      <Stack spacing={0.5}>
                        <Typography variant="subtitle2">{template.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Version {template.version || "1.0"}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>{resolveProfessionLabel(template.profession_key)}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={template.status}
                        color={templateStatusColor(template.status)}
                      />
                    </TableCell>
                    <TableCell align="center">{template.fields ?? 0}</TableCell>
                    <TableCell align="center">{template.submissions ?? 0}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="Edit template">
                        <span>
                          <IconButton size="small" onClick={() => openEditTemplate(template)} disabled={!token}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="Clone (coming soon)">
                        <span>
                          <IconButton size="small" onClick={handleCloneTemplate} disabled={!token}>
                            <ContentCopyIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                      {template.status !== "archived" && (
                        <Tooltip title="Archive template">
                          <span>
                            <IconButton
                              size="small"
                              onClick={() => handleArchiveTemplate(template.id)}
                              disabled={!token}
                            >
                              <ArchiveIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Paper elevation={3} sx={{ p: 3 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
          <Typography variant="h6">Submissions</Typography>
          <Tooltip title="Refresh submissions">
            <span>
              <IconButton onClick={fetchSubmissions} disabled={submissionsLoading}>
                <RefreshIcon />
              </IconButton>
            </span>
          </Tooltip>
        </Stack>

        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" sx={{ mt: 2 }}>
          <TextField
            select
            size="small"
            label="Status"
            value={submissionStatus}
            onChange={(event) => setSubmissionStatus(event.target.value)}
            sx={{ minWidth: 160 }}
          >
            {SUBMISSION_STATUS_OPTIONS.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            size="small"
            label="Profession"
            value={submissionProfession}
            onChange={(event) => setSubmissionProfession(event.target.value)}
            sx={{ minWidth: 200 }}
          >
            {professionFilterOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>

          {defaultProfessionDisplay ? (
            <Chip
              color="primary"
              variant="outlined"
              size="small"
              label={`Default: ${resolveProfessionLabel(defaultProfessionDisplay)}`}
            />
          ) : null}
        </Stack>

        {submissionsError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {submissionsError}
          </Alert>
        )}

        <TableContainer sx={{ mt: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Candidate</TableCell>
                <TableCell>Profession</TableCell>
                <TableCell>Template</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Updated</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {submissionsLoading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <CircularProgress size={24} />
                  </TableCell>
                </TableRow>
              ) : submissions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography variant="body2" color="text.secondary">
                      No submissions yet. Invites sent with active templates will appear here.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                submissions.map((submission) => {
                  const updatedAt = submission.updated_at || submission.created_at;
                  return (
                    <TableRow key={submission.id} hover>
                      <TableCell>
                        <Stack spacing={0.5}>
                          <Typography variant="subtitle2">
                            {submission.invite_name || "Unnamed"}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {submission.invite_email || "No email"}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>{resolveProfessionLabel(submission.profession_key)}</TableCell>
                      <TableCell>
                        {templateNameById.get(submission.template_id) || `Template #${submission.template_id}`}
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={submission.status}
                          color={submissionStatusColor(submission.status)}
                        />
                        {Array.isArray(submission.files) && submission.files.length > 0 && (
                          <Chip
                            size="small"
                            variant="outlined"
                            sx={{ ml: 1 }}
                            label={`${submission.files.length} file${submission.files.length === 1 ? "" : "s"}`}
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        {updatedAt ? formatDateTime.format(new Date(updatedAt)) : "-"}
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Manage questionnaire files">

                          <span>

                            <IconButton

                              size="small"

                              onClick={() => handleManageAttachments(submission)}

                              disabled={!submission.intake_token || attachmentsDialogLoading}

                            >

                              <AttachFileIcon fontSize="small" />

                            </IconButton>

                          </span>

                        </Tooltip>

                        <Tooltip title="Open intake form">
                          <span>
                            <IconButton
                              size="small"
                              onClick={() => handleOpenIntakeLink(submission.intake_token)}
                              disabled={!submission.intake_token}
                            >
                              <LaunchIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Tooltip title="Copy intake link">
                          <span>
                            <IconButton
                              size="small"
                              onClick={() => handleCopyInviteLink(submission.intake_token)}
                              disabled={!submission.intake_token}
                            >
                              <ContentCopyIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Tooltip title="Mark as converted">
                          <span>
                            <IconButton
                              size="small"
                              onClick={() => handleConvertSubmission(submission.id)}
                              disabled={convertingId === submission.id || submission.status === "converted"}
                            >
                              {convertingId === submission.id ? (
                                <CircularProgress size={16} />
                              ) : (
                                <CheckCircleOutlineIcon fontSize="small" />
                              )}
                            </IconButton>
                          </span>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog open={attachmentsDialogOpen} onClose={handleCloseAttachments} maxWidth="md" fullWidth>
        <DialogTitle>Questionnaire Files</DialogTitle>
        <DialogContent dividers>
          {attachmentsDialogLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress />
            </Box>
          ) : attachmentsDialogError ? (
            <Alert severity="error">{attachmentsDialogError}</Alert>
          ) : attachmentsQuestionnaires.length === 0 ? (
            <Alert severity="info">No questionnaires assigned to this invitation yet.</Alert>
          ) : (
            <Stack spacing={3}>
              <Typography variant="body2" color="text.secondary">
                Allowed types: {attachmentsAllowedMime.join(", ")} - Max {(attachmentsMaxFileMb || QUESTIONNAIRE_LIMITS.maxFileMb)} MB per file
              </Typography>
              <Stack spacing={2}>
                {attachmentsQuestionnaires.map((assignment) => {
                  const template = assignment.template || {};
                  const fieldKey = `questionnaire_${assignment.template_id}`;
                  const existingFile = attachmentsFiles.find((file) => file.field_key === fieldKey);
                  const uploadState = attachmentsUploadState[fieldKey];
                  const isRequired = assignment?.required !== false;
                  const scanStatus = (existingFile?.scan_status || "").toLowerCase();
                  const isPending = scanStatus && scanStatus !== "clean" && scanStatus !== "blocked";
                  const isBlocked = scanStatus === "blocked";

                  return (
                    <Paper key={assignment.template_id} sx={{ p: { xs: 2, md: 3 }, borderRadius: 2 }} elevation={0}>
                      <Stack spacing={1.5}>
                        <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                            {template.name || `Questionnaire #${assignment.template_id}`}
                          </Typography>
                          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                            {isRequired && <Chip label="Required" size="small" color="error" />}
                            {template.form_kind && <Chip label={template.form_kind} size="small" />}
                          </Stack>
                        </Box>
                        {template.description && (
                          <Typography variant="body2" color="text.secondary">
                            {template.description}
                          </Typography>
                        )}
                        <Stack spacing={1} direction={{ xs: "column", sm: "row" }} alignItems={{ sm: "center" }}>
                          <Button
                            variant="outlined"
                            component="label"
                            size="small"
                            disabled={uploadState?.loading || attachmentsDialogLoading}
                          >
                            {existingFile ? "Replace file" : "Upload file"}
                            <input
                              hidden
                              type="file"
                              accept={attachmentsAllowedMime.length ? attachmentsAllowedMime.join(",") : undefined}
                              onChange={(event) => {
                                const nextFile = event.target.files?.[0];
                                if (nextFile) {
                                  handleQuestionnaireFileSelect(assignment.template_id, nextFile);
                                  event.target.value = "";
                                }
                              }}
                            />
                          </Button>
                          {existingFile && (
                            <Stack direction="row" spacing={1} alignItems="center" useFlexGap flexWrap="wrap">
                              <Typography variant="body2">
                                {existingFile.original_filename}
                                {existingFile.file_size ? ` - ${formatBytes(existingFile.file_size)}` : ""}
                              </Typography>
                              {scanStatus && (
                                <Chip
                                  size="small"
                                  color={
                                    scanStatus === "clean"
                                      ? "success"
                                      : scanStatus === "blocked"
                                      ? "error"
                                      : "warning"
                                  }
                                  label={`Scan: ${scanStatus}`}
                                />
                              )}
                              <Button
                                variant="outlined"
                                size="small"
                                startIcon={<CloudDownloadIcon fontSize="small" />}
                                onClick={() => handleDownloadQuestionnaireFile(existingFile)}
                                disabled={uploadState?.loading}
                              >
                                Download
                              </Button>
                            </Stack>
                          )}
                          {uploadState?.loading && (
                            <Stack direction="row" spacing={1} alignItems="center">
                              <CircularProgress size={16} />
                              <Typography variant="body2" color="text.secondary">
                                {Number.isFinite(uploadState?.percent) ? `${uploadState.percent}%` : "Uploading..."}
                              </Typography>
                            </Stack>
                          )}
                          {uploadState?.error && (
                            <Typography variant="body2" color="error">
                              {uploadState.error}
                            </Typography>
                          )}
                        </Stack>
                        {isBlocked && (
                          <Alert severity="error">
                            This file was blocked by antivirus scanning. Please upload a different file.
                          </Alert>
                        )}
                        {isPending && (
                          <Alert severity="info">Scanning in progress. You can submit once the scan finishes.</Alert>
                        )}
                        {!existingFile && isRequired && (
                          <Alert severity="warning">This questionnaire requires an uploaded document.</Alert>
                        )}
                      </Stack>
                    </Paper>
                  );
                })}
              </Stack>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAttachments}>Close</Button>
        </DialogActions>
      </Dialog>
      <Dialog open={templateDialogOpen} onClose={handleTemplateDialogClose} maxWidth="md" fullWidth>
        <DialogTitle>{templateDialogMode === "edit" ? "Edit Template" : "New Template"}</DialogTitle>
        <DialogContent dividers>
          {templateDialogLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Stack spacing={2}>
              {templateDialogError && (
                <Alert severity="error">{templateDialogError}</Alert>
              )}

              {defaultBlueprint && (
                <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<AutoAwesomeIcon />}
                    onClick={handleApplyDefaultTemplate}
                    disabled={templateDialogLoading}
                  >
                    Use {defaultBlueprint.label} defaults
                  </Button>
                </Box>
              )}

              <TextField
                label="Template Name"
                value={templateForm.name}
                onChange={handleTemplateFormChange("name")}
                required
                fullWidth
                margin="dense"
              />

              <Autocomplete
                freeSolo
                options={dialogProfessionOptions}
                value={templateForm.professionKey}
                onChange={(event, newValue) =>
                  setTemplateForm((prev) => ({ ...prev, professionKey: newValue || "" }))
                }
                onInputChange={(event, newInputValue) =>
                  setTemplateForm((prev) => ({ ...prev, professionKey: newInputValue || "" }))
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Profession"
                    required
                    margin="dense"
                    helperText="Choose from suggestions or type a new profession key"
                  />
                )}
                renderOption={(props, option) => (
                  <li {...props} key={option}>
                    {resolveProfessionLabel(option)}
                  </li>
                )}
              />

              <TextField
                label="Description"
                value={templateForm.description}
                onChange={handleTemplateFormChange("description")}
                fullWidth
                margin="dense"
                multiline
                minRows={2}
              />

              <Stack direction="row" spacing={2}>
                <TextField
                  label="Locale"
                  value={templateForm.locale}
                  onChange={handleTemplateFormChange("locale")}
                  margin="dense"
                  sx={{ width: 160 }}
                />
                <TextField
                  select
                  label="Status"
                  value={templateForm.status}
                  onChange={handleTemplateFormChange("status")}
                  margin="dense"
                  sx={{ width: 200 }}
                >
                  {TEMPLATE_STATUS_OPTIONS.filter((option) => option.value).map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Stack>

              <Divider flexItem />

              <TextField
                label="Email Subject"
                value={templateForm.emailSubject}
                onChange={handleTemplateFormChange("emailSubject")}
                fullWidth
                margin="dense"
              />

              <TextField
                label="Email Body"
                value={templateForm.emailBody}
                onChange={handleTemplateFormChange("emailBody")}
                fullWidth
                margin="dense"
                multiline
                minRows={4}
              />

              <Divider flexItem />

              <TemplateFieldBuilder
                fields={templateFields}
                onChange={handleTemplateFieldsChange}
                reservedKeys={RESERVED_FIELD_KEYS}
              />

              {templateFieldsError && (
                <Alert severity="error">{templateFieldsError}</Alert>
              )}

              <Stack spacing={1}>
                <Button
                  variant="text"
                  size="small"
                  onClick={() => setShowAdvancedFields((prev) => !prev)}
                  sx={{ alignSelf: "flex-start" }}
                >
                  {showAdvancedFields ? "Hide Fields JSON" : "Show Fields JSON"}
                </Button>
                <Collapse in={showAdvancedFields}>
                  <TextField
                    label="Fields (JSON array)"
                    value={templateForm.fieldsText}
                    onChange={handleTemplateFormChange("fieldsText")}
                    fullWidth
                    margin="dense"
                    multiline
                    minRows={6}
                    helperText="Optional normalized field definitions to assist with reporting."
                  />
                </Collapse>
              </Stack>

              <Stack spacing={1}>
                <Button
                  variant="text"
                  size="small"
                  onClick={() => setShowAdvancedSchema((prev) => !prev)}
                  sx={{ alignSelf: "flex-start" }}
                >
                  {showAdvancedSchema ? "Hide Schema JSON" : "Show Schema JSON"}
                </Button>
                <Collapse in={showAdvancedSchema}>
                  <TextField
                    label="Schema JSON"
                    value={templateForm.schemaText}
                    onChange={handleTemplateFormChange("schemaText")}
                    fullWidth
                    margin="dense"
                    multiline
                    minRows={6}
                    helperText="Define the template schema. Must be valid JSON."
                  />
                </Collapse>
              </Stack>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleTemplateDialogClose} disabled={templateSaving}>
            Cancel
          </Button>
          <Button onClick={handleTemplateSubmit} variant="contained" disabled={templateSaving || templateDialogLoading}>
            {templateSaving ? <CircularProgress size={20} /> : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
};

export default CandidateFormsPanel;



















