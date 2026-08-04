import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  Grid,
  IconButton,
  LinearProgress,
  Menu,
  MenuItem,
  Paper,
  Stack,
  Switch,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
} from "@mui/material";
import {
  Add,
  CheckCircleOutline,
  CloudUpload,
  ContentCopy,
  DeleteOutline,
  ExpandMore,
  HelpOutline,
  ImageOutlined,
  InfoOutlined,
  MoreHoriz,
  PauseCircleOutline,
  RadioButtonUnchecked,
} from "@mui/icons-material";

import api from "../../utils/api";
import { formatCurrency } from "../../utils/formatters";

const MAX_OPTIONS = 2;
const MAX_VALUES_PER_OPTION = 20;
const SAFE_SWATCH_RE = /^#[0-9A-F]{6}$/;
const VISUAL_OPTION_NAMES = new Set(["colour", "color", "shade", "finish", "pattern", "style"]);

const emptyConfig = {
  configuration_version: null,
  variant_mode: "none",
  runtime_selling_enabled: false,
  options: [],
  variants: [],
  readiness: {
    complete: false,
    sellable: false,
    expected_combinations: 0,
    configured_variants: 0,
    blockers: [],
  },
  activation_readiness: {
    ready_for_activation: false,
    blockers: [],
    warnings: [],
  },
  variant_summary: {
    option_count: 0,
    variant_count: 0,
    active_variant_count: 0,
    configuration_complete: false,
    selling_enabled: false,
  },
};

const createClientKey = (prefix) => `${prefix}-${Math.random().toString(36).slice(2, 10)}`;

const createOptionDraft = ({ name = "", preset = "custom" } = {}) => ({
  id: null,
  client_key: createClientKey("option"),
  name,
  preset,
  values: [
    {
      id: null,
      client_key: createClientKey("value"),
      value: "",
      swatch_color: "",
      image_id: null,
      appearance_open: preset === "colour",
    },
  ],
});

const normalizeText = (value) => String(value || "").trim();
const normalizeFold = (value) => normalizeText(value).toLocaleLowerCase();
const isColourOption = (name) => ["colour", "color"].includes(normalizeFold(name));

const isVisualRecommendationOption = (option) => {
  const preset = normalizeFold(option?.preset);
  const name = normalizeFold(option?.name);
  const hasSwatch = (option?.values || []).some((value) => normalizeText(value?.swatch_color));
  const hasImages = (option?.values || []).some((value) => value?.image_id);
  return preset === "colour" || VISUAL_OPTION_NAMES.has(name) || hasSwatch || hasImages;
};

const optionToken = (option) => (option?.id ? `id:${option.id}` : `client:${option.client_key}`);
const valueToken = (option, value) =>
  value?.id ? `id:${value.id}` : `client:${optionToken(option)}:${value.client_key}`;

const selectionSignature = (selection) =>
  selection
    .map((item) => `${item.option_token}:${item.value_token}`)
    .join("|");

const normalizeSkuPart = (value) =>
  String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24);

const defaultVariantSku = (parentSku, labels) => {
  const suffix = labels.map(normalizeSkuPart).filter(Boolean).join("-");
  return [normalizeSkuPart(parentSku || "PRODUCT"), suffix].filter(Boolean).join("-").slice(0, 120);
};

const dedupeMessages = (items) => {
  const seen = new Set();
  return (items || []).filter((item) => {
    const key = String(item || "");
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const normalizeConfigForEditor = (payload) => {
  const options = (payload?.options || []).map((option) => ({
    id: option.id || null,
    client_key: option.client_key || createClientKey("option"),
    name: option.name || "",
    preset: isColourOption(option.name) ? "colour" : normalizeFold(option.name) === "size" ? "size" : "custom",
    display_order: option.display_order || 0,
    values: (option.values || []).map((value) => ({
      id: value.id || null,
      client_key: value.client_key || createClientKey("value"),
      value: value.value || "",
      display_order: value.display_order || 0,
      swatch_color: value.swatch_color || "",
      image_id: value.image_id ?? null,
      appearance_open: isColourOption(option.name),
    })),
  }));
  const optionById = new Map(options.filter((option) => option.id).map((option) => [option.id, option]));
  const variants = (payload?.variants || []).map((variant) => {
    const mappedSelection = (variant.selection || []).map((selection) => {
      const option = selection.option_id ? optionById.get(selection.option_id) : null;
      const value = option?.values?.find((row) => row.id === selection.value_id) || null;
      return {
        option_id: selection.option_id || null,
        option_client_key: selection.option_client_key || option?.client_key || null,
        option_name: selection.option_name || option?.name || "",
        value_id: selection.value_id || null,
        value_client_key: selection.value_client_key || value?.client_key || null,
        value: selection.value || value?.value || "",
      };
    });
    const signature = selectionSignature(
      mappedSelection.map((selection) => ({
        option_token: selection.option_id ? `id:${selection.option_id}` : `client:${selection.option_client_key}`,
        value_token: selection.value_id
          ? `id:${selection.value_id}`
          : `client:${selection.option_id ? `id:${selection.option_id}` : `client:${selection.option_client_key}`}:${selection.value_client_key}`,
      }))
    );
    return {
      id: variant.id || null,
      client_key: variant.client_key || createClientKey("variant"),
      selection: mappedSelection,
      signature,
      combination_label: mappedSelection.map((selection) => selection.value).join(" / "),
      sku: variant.sku || "",
      sku_dirty: true,
      qty_on_hand: variant.qty_on_hand ?? 0,
      price_override: variant.price_override ?? "",
      is_active: variant.is_active !== false,
      primary_image_id: variant.primary_image_id ?? null,
    };
  });
  return {
    ...emptyConfig,
    ...payload,
    options,
    variants,
  };
};

const serializeDraftOptions = (options) =>
  JSON.stringify(
    (options || []).map((option) => ({
      id: option.id || null,
      name: option.name || "",
      preset: option.preset || "custom",
      display_order: option.display_order || 0,
      values: (option.values || []).map((value) => ({
        id: value.id || null,
        value: value.value || "",
        display_order: value.display_order || 0,
        swatch_color: value.swatch_color || "",
        image_id: value.image_id ?? null,
      })),
    }))
  );

const serializeDraftVariants = (variants) =>
  JSON.stringify(
    (variants || []).map((variant) => ({
      id: variant.id || null,
      selection: (variant.selection || []).map((selection) => ({
        option_id: selection.option_id || null,
        option_client_key: selection.option_id ? null : selection.option_client_key || null,
        option_name: selection.option_name || "",
        value_id: selection.value_id || null,
        value_client_key: selection.value_id ? null : selection.value_client_key || null,
        value: selection.value || "",
      })),
      sku: variant.sku || "",
      qty_on_hand: variant.qty_on_hand ?? 0,
      price_override: variant.price_override ?? "",
      is_active: variant.is_active !== false,
      primary_image_id: variant.primary_image_id ?? null,
    }))
  );

const buildCombinationDrafts = ({ options, existingVariants, product }) => {
  if (!options.length || options.some((option) => !(option.values || []).length)) {
    return [];
  }
  const existingBySignature = new Map(
    (existingVariants || []).map((variant) => [
      selectionSignature(
        (variant.selection || []).map((selection) => ({
          option_token: selection.option_id ? `id:${selection.option_id}` : `client:${selection.option_client_key}`,
          value_token: selection.value_id
            ? `id:${selection.value_id}`
            : `client:${selection.option_id ? `id:${selection.option_id}` : `client:${selection.option_client_key}`}:${selection.value_client_key}`,
        }))
      ),
      variant,
    ])
  );

  const combine = (index, partial) => {
    if (index >= options.length) return [partial];
    const option = options[index];
    return (option.values || []).flatMap((value) =>
      combine(index + 1, [
        ...partial,
        {
          option_id: option.id || null,
          option_client_key: option.client_key,
          option_name: option.name,
          value_id: value.id || null,
          value_client_key: value.client_key,
          value: value.value,
          option_token: optionToken(option),
          value_token: valueToken(option, value),
        },
      ])
    );
  };

  return combine(0, []).map((selection) => {
    const signature = selectionSignature(selection);
    const existing = existingBySignature.get(signature);
    const labels = selection.map((item) => item.value);
    return {
      id: existing?.id || null,
      client_key: existing?.client_key || createClientKey("variant"),
      selection,
      signature,
      combination_label: labels.join(" / "),
      sku:
        existing?.id || existing?.sku_dirty
          ? existing?.sku || defaultVariantSku(product?.sku, labels)
          : defaultVariantSku(product?.sku, labels),
      sku_dirty: Boolean(existing?.id || existing?.sku_dirty),
      qty_on_hand: existing?.qty_on_hand ?? 0,
      price_override: existing?.price_override ?? "",
      is_active: existing?.is_active !== false,
      primary_image_id: existing?.primary_image_id ?? null,
    };
  });
};

const HelpTooltip = ({ title, ariaLabel }) => (
  <Tooltip title={title} arrow>
    <IconButton size="small" aria-label={ariaLabel || title} sx={{ p: 0.25 }}>
      <InfoOutlined fontSize="inherit" sx={{ fontSize: 16 }} />
    </IconButton>
  </Tooltip>
);

const statusChipColor = (value) => {
  if (value === "Active" || value === "Ready") return "success";
  if (value === "Not ready" || value === "Draft") return "warning";
  return "default";
};

const fieldRefKey = (...parts) => parts.join(":");

const groupActivationItems = (messages) => {
  const grouped = {
    Product: [],
    Configuration: [],
    Environment: [],
  };
  dedupeMessages(messages).forEach((message) => {
    const normalized = String(message || "").toLowerCase();
    if (normalized.includes("runtime") || normalized.includes("environment")) {
      grouped.Environment.push(message);
    } else if (
      normalized.includes("product must be active") ||
      normalized.includes("digital") ||
      normalized.includes("finance inventory") ||
      normalized.includes("inventory link")
    ) {
      grouped.Product.push(message);
    } else {
      grouped.Configuration.push(message);
    }
  });
  return Object.entries(grouped).filter(([, rows]) => rows.length);
};

const ImageAssignmentField = ({
  title,
  assignedImageId,
  galleryImages,
  onAssign,
  onUpload,
  onRemove,
  disabled,
  helperText,
  emptyLabel = "Upload image",
  uploadTestId,
}) => {
  const inputRef = useRef(null);
  const selectedImage = galleryImages.find((image) => Number(image.id) === Number(assignedImageId || 0));

  return (
    <Stack spacing={1}>
      <Stack direction="row" spacing={1} alignItems="center">
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {title}
        </Typography>
        <HelpTooltip
          title="Choose a Product gallery image or upload a new one. Removing the assignment does not delete the gallery image."
        />
      </Stack>
      {helperText ? (
        <Typography variant="caption" color="text.secondary">
          {helperText}
        </Typography>
      ) : null}
      {selectedImage ? (
        <Stack direction="row" spacing={1} alignItems="center">
          <Box
            component="img"
            src={selectedImage.url_public || selectedImage.url}
            alt={selectedImage.filename || `Product image ${selectedImage.id}`}
            sx={{ width: 56, height: 56, borderRadius: 1, objectFit: "cover", border: "1px solid rgba(0,0,0,0.12)" }}
          />
          <Stack spacing={0.5}>
            <Typography variant="body2">{selectedImage.filename || `Image ${selectedImage.id}`}</Typography>
            <Stack direction="row" spacing={1}>
              <Button size="small" variant="outlined" onClick={() => inputRef.current?.click()} disabled={disabled}>
                Upload new image
              </Button>
              <Button size="small" color="inherit" onClick={onRemove} disabled={disabled}>
                Remove assignment
              </Button>
            </Stack>
          </Stack>
        </Stack>
      ) : (
        <Button
          size="small"
          variant="outlined"
          startIcon={<CloudUpload />}
          onClick={() => inputRef.current?.click()}
          disabled={disabled}
          sx={{ alignSelf: "flex-start" }}
        >
          {emptyLabel}
        </Button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        data-testid={uploadTestId}
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) onUpload(file);
        }}
      />
      {galleryImages.length ? (
        <Grid container spacing={1}>
          {galleryImages.map((image) => {
            const selected = Number(image.id) === Number(assignedImageId || 0);
            return (
              <Grid item xs={4} sm={3} md={3} key={image.id}>
                <Button
                  fullWidth
                  variant={selected ? "contained" : "outlined"}
                  color={selected ? "primary" : "inherit"}
                  onClick={() => onAssign(image.id)}
                  disabled={disabled}
                  sx={{
                    p: 0.75,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "stretch",
                    gap: 0.75,
                    textTransform: "none",
                  }}
                  aria-pressed={selected}
                  aria-label={`Choose ${image.filename || `product image ${image.id}`}`}
                >
                  <Box
                    component="img"
                    src={image.url_public || image.url}
                    alt={image.filename || `Product image ${image.id}`}
                    sx={{ width: "100%", height: 72, objectFit: "cover", borderRadius: 1 }}
                  />
                  <Typography variant="caption" sx={{ lineHeight: 1.2 }}>
                    {image.filename || `Image ${image.id}`}
                  </Typography>
                </Button>
              </Grid>
            );
          })}
        </Grid>
      ) : null}
    </Stack>
  );
};

export default function ProductVariantConfigurationDialog({
  open,
  onClose,
  token,
  product,
  onSaved,
  notify,
  businessSellingCurrency = "USD",
}) {
  const auth = useMemo(() => ({ headers: { Authorization: `Bearer ${token}` } }), [token]);
  const isMobile = useMediaQuery((theme) => theme.breakpoints.down("sm"));
  const fieldRefs = useRef(new Map());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activating, setActivating] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [config, setConfig] = useState(emptyConfig);
  const [draftOptions, setDraftOptions] = useState([]);
  const [draftVariants, setDraftVariants] = useState([]);
  const [galleryImages, setGalleryImages] = useState([]);
  const [error, setError] = useState("");
  const [currentStep, setCurrentStep] = useState(0);
  const [moreActionsAnchor, setMoreActionsAnchor] = useState(null);
  const [bulkStockValue, setBulkStockValue] = useState("");
  const initializedRef = useRef(false);

  const currency = product?.selling_currency || businessSellingCurrency || "USD";
  const isActiveMode = String(config?.variant_mode || "none").toLowerCase() === "active";

  const registerFieldRef = (key) => (element) => {
    if (element) {
      fieldRefs.current.set(key, element);
    } else {
      fieldRefs.current.delete(key);
    }
  };

  const focusField = (key) => {
    requestAnimationFrame(() => {
      const target = fieldRefs.current.get(key);
      target?.focus?.();
    });
  };

  useEffect(() => {
    if (!open || !product?.id) return undefined;
    let alive = true;
    initializedRef.current = false;
    setLoading(true);
    setError("");
    setCurrentStep(0);
    api
      .get(`/inventory/products/${product.id}/variant-configuration`, auth)
      .then(({ data }) => {
        if (!alive) return;
        const next = normalizeConfigForEditor(data || emptyConfig);
        setConfig(next);
        setDraftOptions(next.options);
        setDraftVariants(next.variants);
        setGalleryImages(Array.isArray(product?.images) ? product.images : []);
        initializedRef.current = true;
      })
      .catch((err) => {
        if (!alive) return;
        setError(err?.response?.data?.error || "Failed to load variant configuration.");
      })
      .finally(() => {
        if (!alive) return;
        setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [auth, open, product]);

  const analysis = useMemo(() => {
    const nonBlankOptionNames = new Map();
    draftOptions.forEach((option, index) => {
      const normalized = normalizeFold(option.name);
      if (!normalized) return;
      const rows = nonBlankOptionNames.get(normalized) || [];
      rows.push(index);
      nonBlankOptionNames.set(normalized, rows);
    });

    const optionErrors = {};
    const valueErrors = {};
    const validOptions = [];
    let firstInvalidKey = null;

    draftOptions.forEach((option, optionIndex) => {
      const optionKey = fieldRefKey("option", option.id || option.client_key, "name");
      const optionName = normalizeText(option.name);
      const errors = [];
      if (!optionName) {
        errors.push("Enter an option name.");
        firstInvalidKey = firstInvalidKey || optionKey;
      } else if ((nonBlankOptionNames.get(normalizeFold(option.name)) || []).length > 1) {
        errors.push("Option names must be unique.");
        firstInvalidKey = firstInvalidKey || optionKey;
      }
      optionErrors[optionIndex] = errors;

      const nonBlankValues = new Map();
      (option.values || []).forEach((value, valueIndex) => {
        const normalized = normalizeFold(value.value);
        if (!normalized) return;
        const rows = nonBlankValues.get(normalized) || [];
        rows.push(valueIndex);
        nonBlankValues.set(normalized, rows);
      });

      const validValues = [];
      (option.values || []).forEach((value, valueIndex) => {
        const valueKey = fieldRefKey("value", option.id || option.client_key, value.id || value.client_key, "value");
        const errorsForValue = [];
        if (!normalizeText(value.value)) {
          errorsForValue.push("Enter a value.");
          firstInvalidKey = firstInvalidKey || valueKey;
        } else if ((nonBlankValues.get(normalizeFold(value.value)) || []).length > 1) {
          errorsForValue.push("Values must be unique within this option.");
          firstInvalidKey = firstInvalidKey || valueKey;
        }
        if (normalizeText(value.swatch_color) && !SAFE_SWATCH_RE.test(String(value.swatch_color || "").trim().toUpperCase())) {
          errorsForValue.push("Use a swatch like #000000.");
          firstInvalidKey = firstInvalidKey || valueKey;
        }
        valueErrors[`${optionIndex}:${valueIndex}`] = errorsForValue;
        if (!errorsForValue.length) {
          validValues.push({
            ...value,
            value: normalizeText(value.value),
            swatch_color: normalizeText(value.swatch_color).toUpperCase(),
          });
        }
      });

      if (optionName && validValues.length > 0 && !errors.length) {
        validOptions.push({
          ...option,
          name: optionName,
          values: validValues,
        });
      }
    });

    const allConfiguredOptionsValid = draftOptions.length > 0 && validOptions.length === draftOptions.length;
    return {
      optionErrors,
      valueErrors,
      validOptions,
      validOptionCount: validOptions.length,
      allConfiguredOptionsValid,
      firstInvalidKey,
      visualWarnings: dedupeMessages(
        validOptions.flatMap((option) => {
          if (!isVisualRecommendationOption(option)) return [];
          return (option.values || [])
            .filter((value) => !value.image_id)
            .map((value) => `Add an image for ${value.value} so customers can see this choice.`);
        })
      ),
    };
  }, [draftOptions]);

  const generatedVariants = useMemo(() => {
    if (!analysis.allConfiguredOptionsValid) return [];
    return buildCombinationDrafts({
      options: analysis.validOptions,
      existingVariants: draftVariants,
      product,
    });
  }, [analysis.allConfiguredOptionsValid, analysis.validOptions, draftVariants, product]);

  const dirty = useMemo(() => {
    if (!initializedRef.current) return false;
    return (
      serializeDraftOptions(draftOptions) !== serializeDraftOptions(config?.options || []) ||
      serializeDraftVariants(draftVariants) !== serializeDraftVariants(config?.variants || [])
    );
  }, [config?.options, config?.variants, draftOptions, draftVariants]);

  useEffect(() => {
    if (!open || !dirty) return undefined;
    const handler = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty, open]);

  useEffect(() => {
    if (!initializedRef.current) return;
    const currentSignatures = new Set(generatedVariants.map((variant) => variant.signature));
    const hasSameSet =
      generatedVariants.length === draftVariants.length &&
      draftVariants.every((variant) => currentSignatures.has(variant.signature));
    if (!hasSameSet) {
      setDraftVariants(generatedVariants);
    }
  }, [generatedVariants]);

  const variantIssuesBySignature = useMemo(() => {
    const issues = {};
    (draftVariants || []).forEach((variant) => {
      const rows = [];
      if (!normalizeText(variant.sku)) rows.push("SKU required");
      if (!/^\d+$/.test(String(variant.qty_on_hand ?? "").trim())) rows.push("Stock must be 0 or greater");
      if (String(variant.price_override || "").trim()) {
        const parsed = Number(variant.price_override);
        if (!Number.isFinite(parsed) || parsed < 0) rows.push("Price must be 0 or greater");
      }
      issues[variant.signature] = rows;
    });
    return issues;
  }, [draftVariants]);

  const hasVariantClientErrors = useMemo(
    () => Object.values(variantIssuesBySignature).some((rows) => rows.length),
    [variantIssuesBySignature]
  );

  const currentModeLabel = isActiveMode
    ? "Active"
    : draftOptions.length
    ? "Draft"
    : "None";

  const modeMessage =
    currentModeLabel === "None"
      ? "No options are configured for this Product."
      : currentModeLabel === "Active"
      ? "Active — customers must choose an available option combination before adding this Product to their basket."
      : "Draft — customers still see the current Product until Variant selling is activated.";

  const runtimeSellingEnabled = Boolean(config?.runtime_selling_enabled);
  const activationReadiness = config?.activation_readiness || emptyConfig.activation_readiness;
  const activationBlockers = activationReadiness?.blockers || [];
  const activationWarnings = activationReadiness?.warnings || [];
  const activationStatus = isActiveMode
    ? "Active"
    : dirty
    ? "Not ready"
    : activationReadiness?.ready_for_activation
    ? "Ready"
    : "Not ready";

  const activeVariantCount = draftVariants.filter((variant) => variant.is_active).length;
  const soldOutVariantCount = draftVariants.filter(
    (variant) => variant.is_active && Number(variant.qty_on_hand || 0) <= 0 && product?.track_stock
  ).length;
  const imageCoverage = useMemo(() => {
    const visualValues = analysis.validOptions.flatMap((option) =>
      isVisualRecommendationOption(option) ? option.values || [] : []
    );
    if (!visualValues.length) return null;
    const withImages = visualValues.filter((value) => value.image_id).length;
    return { total: visualValues.length, covered: withImages };
  }, [analysis.validOptions]);

  const optionStepReady = analysis.allConfiguredOptionsValid;
  const reviewStepReady = optionStepReady && draftVariants.length > 0;

  const dirtySummaryText = dirty ? "Save your changes to refresh the activation check." : null;
  const activationDisableReason = dirty
    ? "Save your changes before activation."
    : !runtimeSellingEnabled
    ? "Variant selling is disabled by runtime configuration."
    : activationBlockers[0] || (activeVariantCount <= 0 ? "Add at least one active Variant." : "");

  const handleRequestClose = () => {
    if (dirty && !window.confirm("Discard unsaved variant draft changes?")) {
      return;
    }
    setError("");
    setMoreActionsAnchor(null);
    onClose?.();
  };

  const updateOptions = (nextOptions) => {
    setDraftOptions(nextOptions);
  };

  const setPresetOption = (preset) => {
    if (draftOptions.length >= MAX_OPTIONS) return;
    const name = preset === "colour" ? "Colour" : preset === "size" ? "Size" : "";
    const nextOption = createOptionDraft({ name, preset });
    updateOptions([...draftOptions, nextOption]);
    focusField(fieldRefKey("value", nextOption.client_key, nextOption.values[0].client_key, "value"));
  };

  const updateOptionField = (optionIndex, field, value) => {
    updateOptions(draftOptions.map((option, index) => (index === optionIndex ? { ...option, [field]: value } : option)));
  };

  const removeOption = (optionIndex) => {
    updateOptions(draftOptions.filter((_, index) => index !== optionIndex));
  };

  const addValue = (optionIndex) => {
    const newValue = {
      id: null,
      client_key: createClientKey("value"),
      value: "",
      swatch_color: "",
      image_id: null,
      appearance_open: draftOptions[optionIndex]?.preset === "colour",
    };
    updateOptions(
      draftOptions.map((option, index) =>
        index === optionIndex
          ? {
              ...option,
              values: [...(option.values || []), newValue],
            }
          : option
      )
    );
    focusField(fieldRefKey("value", draftOptions[optionIndex].id || draftOptions[optionIndex].client_key, newValue.client_key, "value"));
  };

  const duplicateValue = (optionIndex, valueIndex) => {
    const original = draftOptions[optionIndex]?.values?.[valueIndex];
    if (!original) return;
    const duplicate = {
      ...original,
      id: null,
      client_key: createClientKey("value"),
      value: original.value ? `${original.value} copy` : "",
    };
    updateOptions(
      draftOptions.map((option, index) =>
        index === optionIndex
          ? {
              ...option,
              values: [
                ...(option.values || []).slice(0, valueIndex + 1),
                duplicate,
                ...(option.values || []).slice(valueIndex + 1),
              ],
            }
          : option
      )
    );
  };

  const updateValueField = (optionIndex, valueIndex, field, value) => {
    updateOptions(
      draftOptions.map((option, index) =>
        index === optionIndex
          ? {
              ...option,
              values: (option.values || []).map((row, rowIndex) =>
                rowIndex === valueIndex ? { ...row, [field]: value } : row
              ),
            }
          : option
      )
    );
  };

  const removeValue = (optionIndex, valueIndex) => {
    updateOptions(
      draftOptions.map((option, index) =>
        index === optionIndex
          ? {
              ...option,
              values: (option.values || []).filter((_, rowIndex) => rowIndex !== valueIndex),
            }
          : option
      )
    );
  };

  const updateVariantField = (signature, field, value) => {
    setDraftVariants((current) =>
      current.map((variant) =>
        variant.signature === signature
          ? {
              ...variant,
              [field]: value,
              ...(field === "sku" ? { sku_dirty: true } : null),
            }
          : variant
      )
    );
  };

  const refreshGallery = async () => {
    const { data } = await api.get(`/inventory/products/${product.id}/image-ids`, auth);
    setGalleryImages(data?.images || []);
    return data?.images || [];
  };

  const uploadGalleryImage = async (file, assign) => {
    const formData = new FormData();
    formData.append("file", file);
    const { data } = await api.post(`/inventory/products/${product.id}/images`, formData, {
      ...auth,
      headers: {
        ...auth.headers,
        "Content-Type": "multipart/form-data",
      },
    });
    const nextImages = await refreshGallery();
    const uploadedId = Number(data?.id || 0) || Number(nextImages[nextImages.length - 1]?.id || 0);
    if (uploadedId) {
      assign(uploadedId);
    }
    notify?.("Product image uploaded.");
  };

  const variantPayload = useMemo(
    () => ({
      configuration_version: config.configuration_version,
      variant_mode: draftOptions.length ? "draft" : "none",
      options: draftOptions.map((option) => ({
        id: option.id || undefined,
        client_key: option.id ? undefined : option.client_key,
        name: option.name,
        values: (option.values || []).map((value) => ({
          id: value.id || undefined,
          client_key: value.id ? undefined : value.client_key,
          value: value.value,
          swatch_color: value.swatch_color || null,
          image_id: value.image_id || null,
        })),
      })),
      variants: draftVariants.map((variant) => ({
        id: variant.id || undefined,
        client_key: variant.id ? undefined : variant.client_key,
        selection: (variant.selection || []).map((selection) => ({
          option_id: selection.option_id || undefined,
          option_client_key: selection.option_id ? undefined : selection.option_client_key,
          value_id: selection.value_id || undefined,
          value_client_key: selection.value_id ? undefined : selection.value_client_key,
        })),
        sku: variant.sku,
        qty_on_hand: Number(variant.qty_on_hand || 0),
        price_override: String(variant.price_override || "").trim() || null,
        is_active: Boolean(variant.is_active),
        primary_image_id: variant.primary_image_id || null,
      })),
    }),
    [config.configuration_version, draftOptions, draftVariants]
  );

  const focusFirstInvalid = (stepIndex, fieldKey) => {
    setCurrentStep(stepIndex);
    if (fieldKey) {
      focusField(fieldKey);
    }
  };

  const validateBeforeSave = () => {
    if (!draftOptions.length) return true;
    if (!analysis.allConfiguredOptionsValid) {
      focusFirstInvalid(0, analysis.firstInvalidKey);
      return false;
    }
    if (hasVariantClientErrors) {
      setCurrentStep(1);
      return false;
    }
    return true;
  };

  const applyServerConfiguration = (data) => {
    const next = normalizeConfigForEditor(data || emptyConfig);
    setConfig(next);
    setDraftOptions(next.options);
    setDraftVariants(next.variants);
    onSaved?.(next);
  };

  const handleSave = async () => {
    if (!validateBeforeSave()) return;
    setSaving(true);
    setError("");
    try {
      const { data } = await api.put(`/inventory/products/${product.id}/variant-configuration`, variantPayload, auth);
      applyServerConfiguration(data);
      notify?.(isActiveMode ? "Active variant changes saved." : "Variant draft saved.");
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to save variant draft.");
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    if (
      !window.confirm(
        "This removes the prepared option and variant configuration. The Product itself, its current orders, shipping, and public details will not change."
      )
    ) {
      return;
    }
    setRemoving(true);
    setError("");
    try {
      const { data } = await api.delete(`/inventory/products/${product.id}/variant-configuration`, {
        ...auth,
        data: { configuration_version: config.configuration_version },
      });
      applyServerConfiguration(data);
      setMoreActionsAnchor(null);
      notify?.("Variant configuration removed.");
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to remove variant configuration.");
    } finally {
      setRemoving(false);
    }
  };

  const handleActivation = async (activate) => {
    const confirmation = activate
      ? "Customers will be required to choose an available option combination before adding this Product to their basket. Variant Price, SKU, and Stock will become authoritative."
      : "Customers will no longer be able to purchase this Product until variant selling is activated again.";
    if (!window.confirm(confirmation)) return;
    setActivating(true);
    setError("");
    try {
      const { data } = await api.post(
        `/inventory/products/${product.id}/variant-activation`,
        { activate, configuration_version: config.configuration_version },
        auth
      );
      applyServerConfiguration(data);
      notify?.(activate ? "Variant selling activated." : "Variant selling paused.");
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to update variant selling.");
    } finally {
      setActivating(false);
    }
  };

  const bulkSetAllActive = (nextActive) => {
    if (!nextActive && !window.confirm("Mark every combination inactive? Customers will not be able to buy any Variant until you reactivate one or more combinations.")) {
      return;
    }
    setDraftVariants((current) => current.map((variant) => ({ ...variant, is_active: nextActive })));
  };

  const bulkSetStock = () => {
    if (!/^\d+$/.test(String(bulkStockValue || "").trim())) return;
    setDraftVariants((current) =>
      current.map((variant) => ({
        ...variant,
        qty_on_hand: String(bulkStockValue).trim(),
      }))
    );
  };

  const bulkGenerateSkus = () => {
    setDraftVariants((current) =>
      current.map((variant) => {
        if (normalizeText(variant.sku)) return variant;
        return {
          ...variant,
          sku: defaultVariantSku(
            product?.sku,
            (variant.selection || []).map((selection) => selection.value)
          ),
        };
      })
    );
  };

  const clearImageOverrides = () => {
    setDraftVariants((current) => current.map((variant) => ({ ...variant, primary_image_id: null })));
  };

  const getInheritedImageText = (variant) => {
    if (variant.primary_image_id) {
      const image = galleryImages.find((row) => Number(row.id) === Number(variant.primary_image_id));
      return `Overrides with ${image?.filename || "selected image"}`;
    }
    const selection = variant.selection || [];
    const selectedValues = selection
      .map((row) => {
        const option = draftOptions.find((item) => Number(item.id || 0) === Number(row.option_id || 0) || item.client_key === row.option_client_key);
        const value = option?.values?.find(
          (item) => Number(item.id || 0) === Number(row.value_id || 0) || item.client_key === row.value_client_key
        );
        return { option, value };
      })
      .filter((row) => row.option && row.value);

    const colourValue = selectedValues.find((row) => isColourOption(row.option.name) && row.value.image_id);
    if (colourValue) {
      return `Uses ${colourValue.value.value} image`;
    }
    const firstValue = selectedValues.find((row) => row.value.image_id);
    if (firstValue) {
      return `Uses ${firstValue.value.value} image`;
    }
    return "Uses Product gallery image";
  };

  const renderStatusHeader = () => (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Stack spacing={1}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} justifyContent="space-between" alignItems={{ sm: "center" }}>
          <Box>
            <Typography variant="h6">{product?.name || "Product"}</Typography>
            <Typography variant="body2" color="text.secondary">
              {currentModeLabel} · {analysis.validOptionCount} option{analysis.validOptionCount === 1 ? "" : "s"} · {draftVariants.length} combination{draftVariants.length === 1 ? "" : "s"}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
            <Chip label={currentModeLabel} size="small" color={statusChipColor(currentModeLabel)} />
            <Chip
              label={runtimeSellingEnabled ? "Runtime on" : "Runtime off"}
              size="small"
              icon={runtimeSellingEnabled ? <CheckCircleOutline /> : <RadioButtonUnchecked />}
              variant="outlined"
            />
            <Chip label={activationStatus} size="small" color={statusChipColor(activationStatus)} />
          </Stack>
        </Stack>
        <Typography variant="body2" color="text.secondary">
          {modeMessage}
        </Typography>
        {dirty ? (
          <Chip
            size="small"
            color="warning"
            variant="outlined"
            label="Unsaved changes"
            sx={{ alignSelf: "flex-start" }}
          />
        ) : null}
      </Stack>
    </Paper>
  );

  const renderHowItWorks = () => (
    <Accordion disableGutters>
      <AccordionSummary expandIcon={<ExpandMore />}>
        <Stack direction="row" spacing={1} alignItems="center">
          <HelpOutline fontSize="small" />
          <Typography variant="subtitle2">How variants work</Typography>
        </Stack>
      </AccordionSummary>
      <AccordionDetails>
        <Stack spacing={0.75}>
          {[
            "Add the choices customers need to make.",
            "Add the available values.",
            "Review generated combinations.",
            "Set SKU, stock and optional price.",
            "Add images for visual choices.",
            "Save and activate.",
          ].map((row, index) => (
            <Typography key={row} variant="body2">
              {index + 1}. {row}
            </Typography>
          ))}
        </Stack>
      </AccordionDetails>
    </Accordion>
  );

  const renderOptionStep = () => (
    <Stack spacing={2}>
      {!draftOptions.length ? (
        <Paper variant="outlined" sx={{ p: 3, textAlign: "center" }}>
          <Stack spacing={2} alignItems="center">
            <Typography variant="h6">Add the choices customers need to make.</Typography>
            <Typography variant="body2" color="text.secondary">
              Start with Colour, Size, or a custom option.
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
              <Button variant="contained" onClick={() => setPresetOption("colour")}>
                Add Colour
              </Button>
              <Button variant="outlined" onClick={() => setPresetOption("size")}>
                Add Size
              </Button>
              <Button variant="outlined" onClick={() => setPresetOption("custom")}>
                Add custom option
              </Button>
            </Stack>
          </Stack>
        </Paper>
      ) : null}

      {draftOptions.length ? (
        <Stack spacing={2}>
          {draftOptions.map((option, optionIndex) => {
            const optionError = analysis.optionErrors[optionIndex] || [];
            const showAppearanceByDefault = option.preset === "colour" || isColourOption(option.name);
            return (
              <Paper key={option.id || option.client_key} variant="outlined" sx={{ p: 2 }}>
                <Stack spacing={2}>
                  <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ md: "center" }}>
                    <TextField
                      fullWidth
                      label="Option name"
                      value={option.name}
                      onChange={(event) => updateOptionField(optionIndex, "name", event.target.value)}
                      error={Boolean(optionError.length)}
                      helperText={optionError[0] || "This is the choice customers see, such as Colour, Size, Material or Style."}
                      inputRef={registerFieldRef(fieldRefKey("option", option.id || option.client_key, "name"))}
                    />
                    <Stack spacing={0.5}>
                      <Typography variant="caption" color="text.secondary">
                        Quick option types
                      </Typography>
                      <Stack direction="row" spacing={1} flexWrap="wrap">
                        <Button size="small" variant="outlined" onClick={() => updateOptions(draftOptions.map((row, index) => index === optionIndex ? { ...row, name: "Colour", preset: "colour" } : row))}>
                          Colour
                        </Button>
                        <Button size="small" variant="outlined" onClick={() => updateOptions(draftOptions.map((row, index) => index === optionIndex ? { ...row, name: "Size", preset: "size" } : row))}>
                          Size
                        </Button>
                        <Button size="small" variant="text" color="error" onClick={() => removeOption(optionIndex)} aria-label={`Remove option ${optionIndex + 1}`}>
                          Remove option
                        </Button>
                      </Stack>
                    </Stack>
                  </Stack>

                  <Stack spacing={1}>
                    {(option.values || []).map((value, valueIndex) => {
                      const valueError = analysis.valueErrors[`${optionIndex}:${valueIndex}`] || [];
                      const appearanceOpen = showAppearanceByDefault || value.appearance_open;
                      return (
                        <Card key={value.id || value.client_key} variant="outlined">
                          <CardContent>
                            <Stack spacing={1.5}>
                              <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} alignItems={{ md: "flex-start" }}>
                                <TextField
                                  fullWidth
                                  label="Value"
                                  value={value.value}
                                  onChange={(event) => updateValueField(optionIndex, valueIndex, "value", event.target.value)}
                                  error={Boolean(valueError.length)}
                                  helperText={valueError[0] || "This is one customer-selectable choice, such as Black, Medium or Cotton."}
                                  inputRef={registerFieldRef(fieldRefKey("value", option.id || option.client_key, value.id || value.client_key, "value"))}
                                />
                                <Stack direction="row" spacing={1} alignItems="center">
                                  <Tooltip title="Duplicate value" arrow>
                                    <IconButton
                                      aria-label={`Duplicate value ${value.value || valueIndex + 1}`}
                                      onClick={() => duplicateValue(optionIndex, valueIndex)}
                                    >
                                      <ContentCopy />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Remove value" arrow>
                                    <IconButton
                                      aria-label={`Remove value ${value.value || valueIndex + 1}`}
                                      onClick={() => removeValue(optionIndex, valueIndex)}
                                    >
                                      <DeleteOutline />
                                    </IconButton>
                                  </Tooltip>
                                </Stack>
                              </Stack>

                              {appearanceOpen ? (
                                <Grid container spacing={2}>
                                  <Grid item xs={12} md={4}>
                                    <TextField
                                      fullWidth
                                      label="Swatch"
                                      value={value.swatch_color || ""}
                                      placeholder="#000000"
                                      onChange={(event) => updateValueField(optionIndex, valueIndex, "swatch_color", event.target.value)}
                                      helperText="Optional. Use a hex colour like #000000."
                                    />
                                  </Grid>
                                  <Grid item xs={12} md={8}>
                                    <ImageAssignmentField
                                      title="Assigned image"
                                      assignedImageId={value.image_id}
                                      galleryImages={galleryImages}
                                      helperText="An image assigned to a value is used for every Variant containing that value. A Variant-specific image can override it."
                                      emptyLabel={galleryImages.length ? "Upload new image" : "Upload image"}
                                      uploadTestId={`value-image-upload-${optionIndex}-${valueIndex}`}
                                      onAssign={(imageId) => updateValueField(optionIndex, valueIndex, "image_id", imageId)}
                                      onRemove={() => updateValueField(optionIndex, valueIndex, "image_id", null)}
                                      onUpload={async (file) => {
                                        try {
                                          await uploadGalleryImage(file, (imageId) => updateValueField(optionIndex, valueIndex, "image_id", imageId));
                                        } catch (err) {
                                          setError(err?.response?.data?.error || "Failed to upload image.");
                                        }
                                      }}
                                    />
                                  </Grid>
                                </Grid>
                              ) : (
                                <Button
                                  size="small"
                                  variant="text"
                                  startIcon={<ImageOutlined />}
                                  onClick={() => updateValueField(optionIndex, valueIndex, "appearance_open", true)}
                                  sx={{ alignSelf: "flex-start" }}
                                >
                                  Add image or swatch
                                </Button>
                              )}
                            </Stack>
                          </CardContent>
                        </Card>
                      );
                    })}
                    <Button
                      size="small"
                      variant="text"
                      startIcon={<Add />}
                      onClick={() => addValue(optionIndex)}
                      disabled={(option.values || []).length >= MAX_VALUES_PER_OPTION}
                      sx={{ alignSelf: "flex-start" }}
                    >
                      Add value
                    </Button>
                  </Stack>
                </Stack>
              </Paper>
            );
          })}
          {draftOptions.length < MAX_OPTIONS ? (
            <Button variant="outlined" startIcon={<Add />} onClick={() => setPresetOption(draftOptions.length === 0 ? "colour" : "custom")}>
              Add another option
            </Button>
          ) : null}
        </Stack>
      ) : null}
    </Stack>
  );

  const renderMobileVariantCard = (variant) => {
    const issues = variantIssuesBySignature[variant.signature] || [];
    const inheritedPriceText = String(variant.price_override || "").trim()
      ? null
      : `Uses Product price · ${formatCurrency(product?.price || 0, currency)}`;
    const imageText = getInheritedImageText(variant);

    return (
      <Card key={variant.signature} variant="outlined">
        <CardContent>
          <Stack spacing={1.25}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
              <Box>
                <Typography sx={{ fontWeight: 700 }}>{variant.combination_label}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {imageText}
                </Typography>
              </Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={Boolean(variant.is_active)}
                    onChange={(event) => updateVariantField(variant.signature, "is_active", event.target.checked)}
                  />
                }
                label={variant.is_active ? "Active" : "Inactive"}
              />
            </Stack>
            <TextField
              fullWidth
              label="SKU"
              value={variant.sku}
              onChange={(event) => updateVariantField(variant.signature, "sku", event.target.value)}
              helperText="Unique inventory identifier used for this exact combination."
            />
            <TextField
              fullWidth
              label="Stock"
              value={variant.qty_on_hand}
              onChange={(event) => updateVariantField(variant.signature, "qty_on_hand", event.target.value)}
              helperText="Available quantity for this combination when inventory tracking is enabled."
            />
            <TextField
              fullWidth
              label="Price override"
              value={variant.price_override}
              onChange={(event) => updateVariantField(variant.signature, "price_override", event.target.value)}
              helperText={inheritedPriceText || "Optional. Leave blank to use the Product price."}
            />
            <ImageAssignmentField
              title="Image override"
              assignedImageId={variant.primary_image_id}
              galleryImages={galleryImages}
              helperText="Optional. Overrides the image inherited from Colour or another Option Value."
              emptyLabel={galleryImages.length ? "Upload new image" : "Upload image"}
              uploadTestId={`variant-image-upload-${variant.signature}`}
              onAssign={(imageId) => updateVariantField(variant.signature, "primary_image_id", imageId)}
              onRemove={() => updateVariantField(variant.signature, "primary_image_id", null)}
              onUpload={async (file) => {
                try {
                  await uploadGalleryImage(file, (imageId) => updateVariantField(variant.signature, "primary_image_id", imageId));
                } catch (err) {
                  setError(err?.response?.data?.error || "Failed to upload image.");
                }
              }}
            />
            {issues.length ? (
              <Alert severity="warning">{issues.join(" · ")}</Alert>
            ) : null}
          </Stack>
        </CardContent>
      </Card>
    );
  };

  const renderDesktopVariantRow = (variant) => {
    const issues = variantIssuesBySignature[variant.signature] || [];
    const inheritedPriceText = String(variant.price_override || "").trim()
      ? null
      : `Uses Product price · ${formatCurrency(product?.price || 0, currency)}`;
    const imageText = getInheritedImageText(variant);

    return (
      <TableRow key={variant.signature}>
        <TableCell>
          <Stack spacing={0.25}>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              {variant.combination_label}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {imageText}
            </Typography>
          </Stack>
        </TableCell>
        <TableCell>
          <Switch
            checked={Boolean(variant.is_active)}
            onChange={(event) => updateVariantField(variant.signature, "is_active", event.target.checked)}
            inputProps={{ "aria-label": `Toggle ${variant.combination_label}` }}
          />
        </TableCell>
        <TableCell>
          <TextField
            size="small"
            value={variant.sku}
            onChange={(event) => updateVariantField(variant.signature, "sku", event.target.value)}
          />
        </TableCell>
        <TableCell>
          <TextField
            size="small"
            value={variant.qty_on_hand}
            onChange={(event) => updateVariantField(variant.signature, "qty_on_hand", event.target.value)}
            sx={{ width: 120 }}
          />
        </TableCell>
        <TableCell>
          <Stack spacing={0.5}>
            <TextField
              size="small"
              value={variant.price_override}
              onChange={(event) => updateVariantField(variant.signature, "price_override", event.target.value)}
            />
            <Typography variant="caption" color="text.secondary">
              {inheritedPriceText || "Uses override"}
            </Typography>
          </Stack>
        </TableCell>
        <TableCell>
          <Stack spacing={0.5}>
            <Button
              size="small"
              variant="outlined"
              onClick={() => {
                const nextId = variant.primary_image_id ? null : galleryImages[0]?.id || null;
                updateVariantField(variant.signature, "primary_image_id", nextId);
              }}
            >
              {variant.primary_image_id ? "Clear override" : "Use first image"}
            </Button>
            <Typography variant="caption" color="text.secondary">
              {imageText}
            </Typography>
          </Stack>
        </TableCell>
        <TableCell>
          <Typography variant="caption" color={issues.length ? "warning.main" : "text.secondary"}>
            {issues.length ? issues.join(" · ") : "No issues"}
          </Typography>
        </TableCell>
      </TableRow>
    );
  };

  const renderVariantStep = () => (
    <Stack spacing={2}>
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack spacing={1.5}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} justifyContent="space-between" alignItems={{ md: "center" }}>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Variants
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Review the generated combinations and set SKU, stock, price, and optional image overrides.
              </Typography>
            </Box>
            <Chip label={`${draftVariants.length} combinations`} size="small" />
          </Stack>

          <Stack direction={{ xs: "column", md: "row" }} spacing={1} flexWrap="wrap">
            <Button size="small" variant="outlined" onClick={() => bulkSetAllActive(true)}>
              Set all active
            </Button>
            <Button size="small" variant="outlined" color="warning" onClick={() => bulkSetAllActive(false)}>
              Set all inactive
            </Button>
            <Button size="small" variant="outlined" onClick={() => setDraftVariants((current) => current.map((variant) => ({ ...variant, price_override: "" })))}>
              Use Product price for all
            </Button>
            <Stack direction="row" spacing={1}>
              <TextField
                size="small"
                label="Set stock for all"
                value={bulkStockValue}
                onChange={(event) => setBulkStockValue(event.target.value)}
                sx={{ width: 140 }}
              />
              <Button size="small" variant="outlined" onClick={bulkSetStock} disabled={!/^\d+$/.test(String(bulkStockValue || "").trim())}>
                Apply
              </Button>
            </Stack>
            <Button size="small" variant="outlined" onClick={bulkGenerateSkus}>
              Generate missing SKUs
            </Button>
            <Button size="small" variant="outlined" onClick={clearImageOverrides}>
              Clear image overrides
            </Button>
          </Stack>
        </Stack>
      </Paper>

      {!draftVariants.length ? (
        <Alert severity="info">Add valid option values to generate combinations.</Alert>
      ) : isMobile ? (
        <Stack spacing={1.5} data-testid="variant-mobile-cards">
          {draftVariants.map((variant) => renderMobileVariantCard(variant))}
        </Stack>
      ) : (
        <Paper variant="outlined" sx={{ overflowX: "auto" }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Combination</TableCell>
                <TableCell>Selling status</TableCell>
                <TableCell>SKU</TableCell>
                <TableCell>Stock</TableCell>
                <TableCell>Price</TableCell>
                <TableCell>Image override</TableCell>
                <TableCell>Issues</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {draftVariants.map((variant) => renderDesktopVariantRow(variant))}
            </TableBody>
          </Table>
        </Paper>
      )}
    </Stack>
  );

  const renderReviewStep = () => (
    <Stack spacing={2}>
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack spacing={1}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Configuration summary
          </Typography>
          <Grid container spacing={1.5}>
            <Grid item xs={6} md={3}>
              <Typography variant="caption" color="text.secondary">Options</Typography>
              <Typography>{analysis.validOptionCount}</Typography>
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="caption" color="text.secondary">Values</Typography>
              <Typography>{analysis.validOptions.reduce((sum, option) => sum + (option.values || []).length, 0)}</Typography>
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="caption" color="text.secondary">Combinations</Typography>
              <Typography>{draftVariants.length}</Typography>
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="caption" color="text.secondary">Active Variants</Typography>
              <Typography>{activeVariantCount}</Typography>
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="caption" color="text.secondary">Sold-out Variants</Typography>
              <Typography>{soldOutVariantCount}</Typography>
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="caption" color="text.secondary">Price range</Typography>
              <Typography>
                {draftVariants.length
                  ? (() => {
                      const prices = draftVariants.map((variant) =>
                        Number(String(variant.price_override || "").trim() || product?.price || 0)
                      );
                      return `${formatCurrency(Math.min(...prices), currency)} - ${formatCurrency(Math.max(...prices), currency)}`;
                    })()
                  : formatCurrency(product?.price || 0, currency)}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="caption" color="text.secondary">Image coverage</Typography>
              <Typography>
                {imageCoverage ? `${imageCoverage.covered} of ${imageCoverage.total} recommended value images` : "Uses Product gallery fallback"}
              </Typography>
            </Grid>
          </Grid>
        </Stack>
      </Paper>

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack spacing={1.5}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Activation requirements
          </Typography>
          {!runtimeSellingEnabled ? (
            <Alert severity="info">
              Activation is currently unavailable in this environment. You can continue editing and saving the Variant draft.
            </Alert>
          ) : null}
          {dirtySummaryText ? (
            <Alert severity="info">{dirtySummaryText}</Alert>
          ) : (
            <>
              {groupActivationItems([
                ...(activationReadiness?.blockers || []),
                ...(!runtimeSellingEnabled ? ["Variant selling is disabled by runtime configuration."] : []),
              ]).map(([category, items]) => (
                <Box key={category}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.75 }}>
                    {category}
                  </Typography>
                  <Stack spacing={1}>
                    {items.map((item) => (
                      <Alert key={item} severity={category === "Environment" ? "info" : "warning"}>
                        {item.includes("linked Finance inventory")
                          ? "Variant stock cannot be activated while this Product uses linked Materials & Supplies inventory. Linked inventory tracks one quantity for the whole Product. Variants require separate stock for each combination."
                          : item}
                      </Alert>
                    ))}
                  </Stack>
                </Box>
              ))}
              {activationWarnings.length ? (
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.75 }}>
                    Warnings
                  </Typography>
                  <Stack spacing={1}>
                    {dedupeMessages([...activationWarnings, ...analysis.visualWarnings]).map((warning) => (
                      <Alert key={warning} severity="info">
                        {warning}
                      </Alert>
                    ))}
                  </Stack>
                </Box>
              ) : analysis.visualWarnings.length ? (
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.75 }}>
                    Warnings
                  </Typography>
                  <Stack spacing={1}>
                    {analysis.visualWarnings.map((warning) => (
                      <Alert key={warning} severity="info">
                        {warning}
                      </Alert>
                    ))}
                  </Stack>
                </Box>
              ) : null}
            </>
          )}
        </Stack>
      </Paper>
    </Stack>
  );

  const saveLabel = isActiveMode ? "Save active changes" : "Save draft";

  return (
    <Dialog open={open} onClose={handleRequestClose} maxWidth="lg" fullWidth fullScreen={isMobile}>
      <DialogTitle>Configure Product options and variants</DialogTitle>
      <DialogContent dividers sx={{ pb: 2 }}>
        <Stack spacing={2}>
          {renderStatusHeader()}
          {renderHowItWorks()}
          {error ? <Alert severity="error">{error}</Alert> : null}
          {(saving || activating || removing) ? <LinearProgress /> : null}

          <Tabs
            value={currentStep}
            onChange={(_, nextStep) => {
              if (nextStep === 1 && !optionStepReady) return;
              if (nextStep === 2 && !reviewStepReady) return;
              setCurrentStep(nextStep);
            }}
            variant={isMobile ? "fullWidth" : "standard"}
            aria-label="Variant configuration steps"
          >
            <Tab label="1. Options and values" />
            <Tab label="2. Variants" disabled={!optionStepReady} />
            <Tab label="3. Review and activate" disabled={!reviewStepReady} />
          </Tabs>

          {currentStep === 0 ? renderOptionStep() : null}
          {currentStep === 1 ? renderVariantStep() : null}
          {currentStep === 2 ? renderReviewStep() : null}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ position: "sticky", bottom: 0, bgcolor: "background.paper", borderTop: "1px solid rgba(0,0,0,0.08)", px: 3, py: 2 }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} justifyContent="space-between" width="100%">
          <Stack direction="row" spacing={1}>
            <Button onClick={handleRequestClose}>Close</Button>
            {dirty ? (
              <Button color="inherit" onClick={() => {
                const next = normalizeConfigForEditor(config);
                setDraftOptions(next.options);
                setDraftVariants(next.variants);
                setDirty(false);
              }}>
                Discard changes
              </Button>
            ) : null}
          </Stack>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ sm: "center" }}>
            <Button
              variant="text"
              startIcon={<MoreHoriz />}
              onClick={(event) => setMoreActionsAnchor(event.currentTarget)}
              disabled={!config.options.length}
            >
              More actions
            </Button>
            <Menu
              anchorEl={moreActionsAnchor}
              open={Boolean(moreActionsAnchor)}
              onClose={() => setMoreActionsAnchor(null)}
            >
              <MenuItem
                onClick={handleRemove}
                disabled={removing || loading || !config.options.length}
              >
                Remove configuration
              </MenuItem>
            </Menu>

            {currentStep > 0 ? (
              <Button variant="outlined" onClick={() => setCurrentStep((step) => Math.max(step - 1, 0))}>
                Back
              </Button>
            ) : null}
            {currentStep < 2 ? (
              <Button
                variant="outlined"
                onClick={() => setCurrentStep((step) => step + 1)}
                disabled={(currentStep === 0 && !optionStepReady) || (currentStep === 1 && !reviewStepReady)}
              >
                Next
              </Button>
            ) : null}

            {isActiveMode ? (
              <Tooltip title="Customers will no longer be able to purchase this Product until variant selling is activated again." arrow>
                <span>
                  <Button
                    variant="outlined"
                    color="warning"
                    startIcon={<PauseCircleOutline />}
                    onClick={() => handleActivation(false)}
                    disabled={activating || saving || loading}
                  >
                    Pause Variant selling
                  </Button>
                </span>
              </Tooltip>
            ) : null}

            {!isActiveMode ? (
              <Tooltip title={activationDisableReason || "Activate Variant selling"} arrow>
                <span>
                  <Button
                    variant="outlined"
                    onClick={() => handleActivation(true)}
                    disabled={activating || saving || loading || dirty || !runtimeSellingEnabled || !activationReadiness?.ready_for_activation}
                  >
                    Activate Variant selling
                  </Button>
                </span>
              </Tooltip>
            ) : null}

            <Button variant="contained" onClick={handleSave} disabled={saving || activating || loading}>
              {saveLabel}
            </Button>
          </Stack>
        </Stack>
      </DialogActions>
    </Dialog>
  );
}
