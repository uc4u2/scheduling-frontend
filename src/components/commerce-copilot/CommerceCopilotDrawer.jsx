import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Checkbox,
  Chip,
  Collapse,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Drawer,
  Divider,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import SmartToyOutlinedIcon from "@mui/icons-material/SmartToyOutlined";
import RefreshIcon from "@mui/icons-material/Refresh";
import api from "../../utils/api";

const QUICK_STARTS = [
  {
    workflow: "improve_product_content",
    title: "Improve a product listing",
    description: "Generate storefront content suggestions for an existing product listing.",
  },
  {
    workflow: "create_physical_product",
    title: "Create a physical product",
    description: "Start a product draft for something customers receive by shipping, pickup, or local delivery.",
    example: "Example: I sell handmade silver necklaces for $85 and want to ship them across Canada.",
  },
  {
    workflow: "create_digital_product",
    title: "Create a digital product",
    description: "Prepare a draft for files, links, or license-based delivery.",
  },
  {
    workflow: "repair_product",
    title: "Make a product ready to ship",
    description: "Review what is missing and prepare a safer product draft.",
  },
  {
    workflow: "prepare_international_shipping",
    title: "Prepare a product for international sales",
    description: "Review customs and destination readiness without applying changes.",
  },
  {
    workflow: "review_shipping_setup",
    title: "Review my shipping setup",
    description: "Explain what is configured and what is still missing for shipping.",
  },
  {
    workflow: "explain_order",
    title: "Explain a product order",
    description: "Read the order state and explain the safest next manual step.",
  },
];

const COPILOT_OVERLAY_Z_INDEX = (theme) => theme.zIndex.modal + 3000;
const HUMAN_LABELS = {
  domestic_shipping_intent: "Shipping within your home country",
  domestic_destination_country: "Shipping area",
  is_digital: "Product type",
  shipping_weight_grams: "Product weight",
  track_stock: "Track inventory",
  quantity: "Starting inventory",
  qty_on_hand: "Starting inventory",
  package_profile_ready: "Shipping package",
  package_length_mm: "Package length",
  package_width_mm: "Package width",
  package_height_mm: "Package height",
  package_tare_weight_grams: "Package empty weight",
  package_dimensions: "Package dimensions",
  package_profile_name: "Package name",
  package_set_as_default: "Use as default package",
  product_name: "Product name",
  product_title_candidate: "Product type/name suggestion",
  description: "Description",
  category: "Category",
  sku: "SKU",
  slug: "Slug",
  meta_title: "Meta title",
  meta_description: "Meta description",
  short_storefront_copy: "Storefront summary",
  image_alt_text: "Image alt text",
};

const STATUS_LABELS = {
  global_feature_disabled: "Commerce Copilot is currently disabled.",
  tenant_access_disabled: "Commerce Copilot is disabled by platform settings.",
  openai_not_configured: "Commerce Copilot setup is incomplete. Ask a platform administrator to configure the AI provider.",
  openai_model_not_configured: "Commerce Copilot setup is incomplete. Ask a platform administrator to configure the AI provider model.",
  subscription_inactive: "An active subscription is required to use Schedulaa Commerce Copilot.",
  risk_hold: "Commerce Copilot is unavailable while this account is under billing review or suspension.",
  addon_required: "AI Commerce Copilot add-on required.",
  monthly_allowance_exhausted: "Monthly AI action allowance used for this billing period.",
  starter_upgrade_required: "Pro or Business is required before Commerce Copilot can be used in paid mode.",
};

const workflowLabel = (workflow) => {
  const row = QUICK_STARTS.find((item) => item.workflow === workflow);
  return row?.title || "Commerce Copilot";
};

const humanizeStatus = (value, fallback = "draft") => String(value || fallback).replace(/_/g, " ");

const humanizeFactKey = (value) => HUMAN_LABELS[value] || String(value || "").replace(/_/g, " ");
const factKeyFromQuestion = (question) => String(question?.fact_key || question?.question_id || "");

const questionFieldLabel = (question) => {
  const key = String(question?.fact_key || question?.question_id || "");
  if (key === "product_name") return "Product name";
  if (key === "quantity") return "Starting inventory";
  if (key === "shipping_weight_grams") return "Product weight";
  if (key === "currency") return "Currency";
  return humanizeFactKey(key) || "Your answer";
};

const questionPlaceholder = (question) => {
  const key = String(question?.fact_key || question?.question_id || "");
  if (key === "product_name") return "Example: Smoky-Lemon Quartz Necklace";
  if (key === "quantity") return "Example: 20";
  if (key === "shipping_weight_grams") return "Example: 50 g";
  return "";
};

const summarizeDraftForCopy = (presentation = {}) => {
  const sections = presentation.sections || {};
  const lines = [];
  ["confirmed", "package", "needs_confirmation", "suggested", "missing"].forEach((sectionKey) => {
    const rows = Array.isArray(sections[sectionKey]) ? sections[sectionKey] : [];
    if (!rows.length) return;
    lines.push(sectionKey.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase()));
    rows.forEach((row) => {
      lines.push(`- ${row.label}: ${row.display_value || "Still needed"}`);
    });
    lines.push("");
  });
  return lines.join("\n").trim();
};

const summarizeConversationForCopy = (messages = []) =>
  messages
    .map((row) => `${row.role === "manager" ? "You" : row.role === "assistant" ? "Copilot" : "System"}: ${row.message_text || ""}`)
    .join("\n\n")
    .trim();

const wizardStepForState = ({ currentQuestions, plan, execution, session }) => {
  if (session?.current_step === "published") return { number: 4, label: "Published" };
  if (session?.current_step === "publish_review") return { number: 4, label: "Publish review" };
  if (session?.current_step === "publish") return { number: 4, label: "Publish" };
  if (session?.current_step === "finish_setup") return { number: 4, label: "Finish setup" };
  if (execution) return { number: 4, label: "Create" };
  if (plan) return { number: 4, label: "Create" };
  if (Array.isArray(currentQuestions) && currentQuestions.some((question) => {
    const key = String(question.fact_key || "");
    return ["package_profile_bundle", "package_reuse_choice", "package_length_mm", "package_width_mm", "package_height_mm", "package_tare_weight_grams", "quantity"].includes(key);
  })) {
    return { number: 2, label: "Package" };
  }
  if (Array.isArray(currentQuestions) && currentQuestions.length) return { number: 1, label: "Product" };
  return { number: 3, label: "Review" };
};

const completionStatusTone = (status) => {
  if (status === "ready") return "success";
  if (status === "not_applicable") return "info";
  if (status === "warning") return "warning";
  return "warning";
};

const copyText = async (text) => {
  const rendered = String(text || "").trim();
  if (!rendered) return false;
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(rendered);
      return true;
    }
  } catch (error) {
    // fall through to fallback
  }
  try {
    const element = document.createElement("textarea");
    element.value = rendered;
    element.setAttribute("readonly", "");
    element.style.position = "absolute";
    element.style.left = "-9999px";
    document.body.appendChild(element);
    element.select();
    document.execCommand("copy");
    document.body.removeChild(element);
    return true;
  } catch (error) {
    return false;
  }
};

const planSummarySections = (action, draftPresentation = {}) => {
  const values = action?.proposed_input_json || {};
  const sections = [];
  const productPayload = values.product_payload || {};
  const packagePayload = values.package_profile_payload || {};
  const settingsPayload = values.settings_payload || {};
  const confirmedRows = Array.isArray(draftPresentation?.sections?.confirmed) ? draftPresentation.sections.confirmed : [];
  const suggestedRows = Array.isArray(draftPresentation?.sections?.suggested) ? draftPresentation.sections.suggested : [];
  const displayFor = (factKey) => {
    const row = [...confirmedRows, ...suggestedRows].find((item) => item.fact_key === factKey);
    return row?.display_value || null;
  };

  if (Object.keys(productPayload).length) {
    sections.push({
      title: "Product details",
      rows: [
        ["Name", productPayload.name],
        ["Category", productPayload.category || displayFor("category")],
        ["Price", displayFor("price") || (productPayload.price != null ? `${productPayload.price}` : null)],
        ["Track inventory", productPayload.track_stock ? "Yes" : "No"],
        ["Starting inventory", productPayload.track_stock && productPayload.qty_on_hand != null ? `${productPayload.qty_on_hand}` : null],
        ["Product weight", displayFor("shipping_weight_grams") || (productPayload.shipping_weight_grams != null ? `${productPayload.shipping_weight_grams} g` : null)],
        ["International selling", productPayload.allow_international_shipping ? "Yes" : "No"],
        ["Visibility after creation", productPayload.is_active ? "Visible" : "Hidden"],
      ].filter(([, value]) => value !== null && value !== undefined && value !== ""),
    });
  }

  if (Object.keys(packagePayload).length) {
    sections.push({
      title: "Shipping package",
      rows: [
        ["Name", packagePayload.name],
        [
          "Dimensions",
          packagePayload.length_mm && packagePayload.width_mm && packagePayload.height_mm
            ? `${packagePayload.length_mm / 10} × ${packagePayload.width_mm / 10} × ${packagePayload.height_mm / 10} cm`
            : null,
        ],
        ["Empty weight", packagePayload.tare_weight_grams != null ? `${packagePayload.tare_weight_grams} g` : null],
        ["Default status", packagePayload.is_default ? "Yes" : "No"],
      ].filter(([, value]) => value !== null && value !== undefined && value !== ""),
    });
  }

  if (Object.keys(settingsPayload).length || values.package_profile_id) {
    const packageSummary = values.package_profile_summary || {};
    sections.push({
      title: "Shipping",
      rows: [
        ["Destination policy", settingsPayload.destination_policy_mode ? humanizeStatus(settingsPayload.destination_policy_mode, "policy") : null],
        ["Package selection", packageSummary.name ? `Use existing package “${packageSummary.name}”` : null],
        ["Package dimensions", packageSummary.display_dimensions || null],
        ["Empty package weight", packageSummary.tare_weight_display || null],
        ["Workspace impact", packageSummary.workspace_scope === "default_package_profile" && values.package_profile_id ? (packageSummary.is_default ? "Already the workspace default package" : "This change makes the saved package the workspace default for future shipping quotes") : null],
      ].filter(([, value]) => value !== null && value !== undefined && value !== ""),
    });
  }
  return sections;
};

const newPackageBundleValue = (defaults = {}) => ({
  package_profile_name: defaults.package_name || "",
  length: defaults.length || "",
  width: defaults.width || "",
  height: defaults.height || "",
  length_unit: defaults.length_unit || "cm",
  package_tare_weight_input: defaults.tare_weight || "",
  weight_unit: defaults.weight_unit || "g",
  package_set_as_default: defaults.set_as_default !== false,
});

const PackageBundleControl = ({ question, value, fieldErrors = {}, onChange, onShowHelp, onSaveIncomplete, disabled }) => {
  const bundle = value && typeof value === "object" ? value : newPackageBundleValue(question?.defaults || {});

  const updateBundle = (key, nextValue) => onChange({ ...bundle, [key]: nextValue });
  const sharedInputProps = {
    autoComplete: "off",
    spellCheck: false,
    sx: {
      "& input": {
        userSelect: "text",
        WebkitUserSelect: "text",
      },
    },
  };

  return (
    <Stack spacing={1.25}>
      <TextField
        fullWidth
        size="small"
        label="Package name"
        value={bundle.package_profile_name || ""}
        onChange={(event) => updateBundle("package_profile_name", event.target.value)}
        disabled={disabled}
        {...sharedInputProps}
        inputProps={{ "aria-label": "Package name" }}
      />
      <Typography variant="body2" sx={{ fontWeight: 700 }}>Package dimensions</Typography>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ minWidth: 0 }}>
        <TextField
          fullWidth
          size="small"
          label="Length"
          placeholder="10"
          value={bundle.length || ""}
          onChange={(event) => updateBundle("length", event.target.value)}
          disabled={disabled}
          error={Boolean(fieldErrors.package_length_mm)}
          helperText={fieldErrors.package_length_mm || ""}
          {...sharedInputProps}
          inputProps={{ "aria-label": "Package length", inputMode: "decimal" }}
        />
        <TextField
          fullWidth
          size="small"
          label="Width"
          placeholder="5"
          value={bundle.width || ""}
          onChange={(event) => updateBundle("width", event.target.value)}
          disabled={disabled}
          error={Boolean(fieldErrors.package_width_mm)}
          helperText={fieldErrors.package_width_mm || ""}
          {...sharedInputProps}
          inputProps={{ "aria-label": "Package width", inputMode: "decimal" }}
        />
        <TextField
          fullWidth
          size="small"
          label="Height"
          placeholder="5"
          value={bundle.height || ""}
          onChange={(event) => updateBundle("height", event.target.value)}
          disabled={disabled}
          error={Boolean(fieldErrors.package_height_mm)}
          helperText={fieldErrors.package_height_mm || ""}
          {...sharedInputProps}
          inputProps={{ "aria-label": "Package height", inputMode: "decimal" }}
        />
        <FormControl fullWidth size="small">
          <InputLabel id={`${question.question_id}-length-unit-label`}>Size unit</InputLabel>
          <Select
            labelId={`${question.question_id}-length-unit-label`}
            value={bundle.length_unit || "cm"}
            label="Size unit"
            onChange={(event) => updateBundle("length_unit", event.target.value)}
            disabled={disabled}
          >
            <MenuItem value="mm">mm</MenuItem>
            <MenuItem value="cm">cm</MenuItem>
            <MenuItem value="in">in</MenuItem>
          </Select>
        </FormControl>
      </Stack>
      <Typography variant="body2" sx={{ fontWeight: 700 }}>Empty package weight</Typography>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ minWidth: 0 }}>
        <TextField
          fullWidth
          size="small"
          label="Weight"
          placeholder="Example: 15"
          value={bundle.package_tare_weight_input || ""}
          onChange={(event) => updateBundle("package_tare_weight_input", event.target.value)}
          disabled={disabled}
          error={Boolean(fieldErrors.package_tare_weight_grams)}
          helperText={fieldErrors.package_tare_weight_grams || ""}
          {...sharedInputProps}
          inputProps={{ "aria-label": "Empty package weight", inputMode: "decimal" }}
        />
        <FormControl fullWidth size="small">
          <InputLabel id={`${question.question_id}-weight-unit-label`}>Weight unit</InputLabel>
          <Select
            labelId={`${question.question_id}-weight-unit-label`}
            value={bundle.weight_unit || "g"}
            label="Weight unit"
            onChange={(event) => updateBundle("weight_unit", event.target.value)}
            disabled={disabled}
          >
            <MenuItem value="g">g</MenuItem>
            <MenuItem value="oz">oz</MenuItem>
          </Select>
        </FormControl>
      </Stack>
      <Typography variant="caption" color="text.secondary">
        Measure the box or mailer customers will receive. Empty package weight means the box, envelope and packing material without the product.
      </Typography>
      <FormControlLabel
        control={
          <Checkbox
            checked={Boolean(bundle.package_set_as_default)}
            onChange={(event) => updateBundle("package_set_as_default", event.target.checked)}
            disabled={disabled}
          />
        }
        label="Use this package as the default"
      />
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
        <Button size="small" variant="text" onClick={onShowHelp} disabled={disabled}>
          Help me find or measure this
        </Button>
        <Button size="small" variant="text" onClick={onSaveIncomplete} disabled={disabled}>
          I don't know - save incomplete for now
        </Button>
      </Stack>
    </Stack>
  );
};

const PackageChoiceControl = ({ question, value, fieldErrors = {}, onChange, disabled }) => {
  const defaults = question?.defaults || {};
  const matches = Array.isArray(defaults.matches) ? defaults.matches : [];
  const selectedMatch = matches.find((row) => row.public_reference === value?.selected_package_profile_reference) || matches[0] || null;
  const selectedChoice = value?.choice || defaults.choice || defaults.recommended_action || "";
  const makeDefault = Boolean(value?.package_make_workspace_default);
  const update = (next) => onChange({
    choice: selectedChoice,
    selected_package_profile_reference: selectedMatch?.public_reference || defaults.selected_package_profile_reference || "",
    package_make_workspace_default: makeDefault,
    ...next,
  });
  return (
    <Stack spacing={1.25}>
      <Alert severity={defaults.decision_status === "close_match" ? "warning" : "info"} sx={{ py: 0 }}>
        {defaults.plain_language_reason}
      </Alert>
      {selectedMatch ? (
        <Card variant="outlined">
          <CardContent sx={{ "&:last-child": { pb: 2 } }}>
            <Stack spacing={0.6}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{selectedMatch.name}</Typography>
              <Typography variant="body2">Dimensions: {selectedMatch.display_dimensions}</Typography>
              <Typography variant="body2">Empty-package weight: {selectedMatch.tare_weight_display}</Typography>
              <Typography variant="body2">Workspace default: {selectedMatch.is_default ? "Yes" : "No"}</Typography>
              {(selectedMatch.match_details || []).map((detail) => (
                <Typography key={detail} variant="caption" color="text.secondary">{detail}</Typography>
              ))}
            </Stack>
          </CardContent>
        </Card>
      ) : null}
      {matches.length > 1 ? (
        <FormControl fullWidth size="small">
          <InputLabel id={`${question.question_id}-profile-label`}>Saved package</InputLabel>
          <Select
            labelId={`${question.question_id}-profile-label`}
            value={selectedMatch?.public_reference || ""}
            label="Saved package"
            onChange={(event) => {
              const match = matches.find((row) => row.public_reference === event.target.value) || null;
              update({
                selected_package_profile_reference: match?.public_reference || "",
                package_make_workspace_default: Boolean(match?.is_default) ? false : makeDefault,
              });
            }}
            disabled={disabled}
          >
            {matches.map((match) => (
              <MenuItem key={match.public_reference} value={match.public_reference}>
                {match.name} · {match.display_dimensions} · {match.tare_weight_display}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      ) : null}
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
        <Button variant={selectedChoice === "use_existing" ? "contained" : "outlined"} onClick={() => update({ choice: "use_existing" })} disabled={disabled}>
          Use existing package
        </Button>
        <Button variant={selectedChoice === "create_new" ? "contained" : "outlined"} onClick={() => update({ choice: "create_new" })} disabled={disabled}>
          Create a new package
        </Button>
      </Stack>
      {selectedChoice === "use_existing" && selectedMatch && !selectedMatch.is_default ? (
        <FormControlLabel
          control={<Checkbox checked={makeDefault} onChange={(event) => update({ package_make_workspace_default: event.target.checked })} disabled={disabled} />}
          label="Make this the workspace default package. This may affect shipping quotes for other products."
        />
      ) : null}
      <Button size="small" variant="text" onClick={() => update({})} disabled={disabled}>
        View package details
      </Button>
      {fieldErrors.package_make_workspace_default ? (
        <Typography variant="caption" color="error">{fieldErrors.package_make_workspace_default}</Typography>
      ) : null}
      {fieldErrors.selected_package_profile_reference ? (
        <Typography variant="caption" color="error">{fieldErrors.selected_package_profile_reference}</Typography>
      ) : null}
      {fieldErrors.package_reuse_choice ? (
        <Typography variant="caption" color="error">{fieldErrors.package_reuse_choice}</Typography>
      ) : null}
    </Stack>
  );
};

const QuestionControl = ({ question, value, fieldErrors = {}, onChange, onUseSuggestion, onShowHelp, onSaveIncomplete, disabled }) => {
  const inputType = String(question?.input_type || "text").toLowerCase();
  const choices = Array.isArray(question?.choices) ? question.choices : [];

  const sharedActions = (
    <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
      {question?.show_help_measure || question?.help_text ? (
        <Button size="small" variant="text" onClick={onShowHelp} disabled={disabled}>
          Help me find or measure this
        </Button>
      ) : null}
      {inputType === "choice" && choices.some((choice) => /suggest/i.test(String(choice))) ? (
        <Button size="small" variant="text" onClick={onUseSuggestion} disabled={disabled}>
          Ask AI for a suggestion
        </Button>
      ) : null}
      {question?.allow_unknown ? (
        <Button size="small" variant="text" onClick={onSaveIncomplete} disabled={disabled}>
          I don't know - save incomplete for now
        </Button>
      ) : null}
    </Stack>
  );

  if (inputType === "package_bundle") {
    return (
        <PackageBundleControl
          question={question}
          value={value}
          fieldErrors={fieldErrors}
          onChange={onChange}
          onShowHelp={onShowHelp}
          onSaveIncomplete={onSaveIncomplete}
          disabled={disabled}
      />
    );
  }

  if (inputType === "package_choice") {
    return (
      <PackageChoiceControl
        question={question}
        value={value}
        fieldErrors={fieldErrors}
        onChange={onChange}
        disabled={disabled}
      />
    );
  }

  if (inputType === "choice" && choices.length) {
    return (
      <Stack spacing={1}>
        <FormControl fullWidth size="small">
          <InputLabel id={`${question.question_id}-label`}>
            {questionFieldLabel(question)}
          </InputLabel>
          <Select
            labelId={`${question.question_id}-label`}
            value={value ?? ""}
            label={questionFieldLabel(question)}
            onChange={(event) => onChange(event.target.value)}
            disabled={disabled}
          >
            {choices.map((choice) => (
              <MenuItem key={choice} value={choice}>{choice}</MenuItem>
            ))}
          </Select>
        </FormControl>
        {sharedActions}
      </Stack>
    );
  }

  if (inputType === "choice" && !choices.length) {
    return (
      <Stack spacing={1}>
        <Alert severity="warning" sx={{ py: 0 }}>
          This question arrived without choices. Enter the value directly instead.
        </Alert>
        <TextField
          fullWidth
          size="small"
          label={questionFieldLabel(question)}
          placeholder={questionPlaceholder(question)}
          value={value ?? ""}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          error={Boolean(fieldErrors[factKeyFromQuestion(question)])}
          helperText={fieldErrors[factKeyFromQuestion(question)] || ""}
          inputProps={{ "aria-label": questionFieldLabel(question) }}
        />
        {sharedActions}
      </Stack>
    );
  }

  if (inputType === "boolean" || inputType === "yes_no") {
    return (
      <Stack spacing={1}>
        <Stack direction="row" spacing={1}>
          <Button variant={value === "yes" ? "contained" : "outlined"} onClick={() => onChange("yes")} disabled={disabled}>Yes</Button>
          <Button variant={value === "no" ? "contained" : "outlined"} onClick={() => onChange("no")} disabled={disabled}>No</Button>
        </Stack>
        {sharedActions}
      </Stack>
    );
  }

  const typeMap = {
    number: "number",
    currency: "number",
    country: "text",
    text: "text",
  };

  return (
    <Stack spacing={1}>
      <TextField
        fullWidth
        size="small"
        type={typeMap[inputType] || "text"}
        label={questionFieldLabel(question)}
        placeholder={questionPlaceholder(question) || (inputType === "country" ? "Example: Canada" : "")}
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        error={Boolean(fieldErrors[factKeyFromQuestion(question)])}
        helperText={fieldErrors[factKeyFromQuestion(question)] || ""}
        inputProps={{ "aria-label": questionFieldLabel(question) }}
      />
      {sharedActions}
    </Stack>
  );
};

const DraftSection = ({ title, rows, editingKey, editValue, onEdit, onChange, onSave, onCancel }) => {
  if (!Array.isArray(rows) || !rows.length) return null;
  return (
    <Stack spacing={1}>
      <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{title}</Typography>
      {rows.map((row) => {
        const isEditing = editingKey === row.fact_key;
        return (
          <Card key={`${title}-${row.fact_key}`} variant="outlined">
            <CardContent sx={{ "&:last-child": { pb: 2 } }}>
              <Stack spacing={1}>
                <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="flex-start" sx={{ minWidth: 0 }}>
                  <Stack spacing={0.35} sx={{ minWidth: 0, flex: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{row.label}</Typography>
                    <Typography variant="body2" color={row.display_value ? "text.primary" : "text.secondary"} sx={{ wordBreak: "break-word" }}>
                      {row.display_value || "Still needed"}
                    </Typography>
                  </Stack>
                  {row.editable ? (
                    <Button size="small" variant="text" onClick={() => onEdit(row)}>
                      Edit
                    </Button>
                  ) : null}
                </Stack>
                {isEditing ? (
                  <Stack spacing={1}>
                    <TextField
                      fullWidth
                      size="small"
                      label={row.label}
                      value={editValue ?? ""}
                      onChange={(event) => onChange(event.target.value)}
                    />
                    <Stack direction="row" spacing={1}>
                      <Button size="small" variant="contained" onClick={onSave}>Save</Button>
                      <Button size="small" variant="text" onClick={onCancel}>Cancel</Button>
                    </Stack>
                  </Stack>
                ) : null}
              </Stack>
            </CardContent>
          </Card>
        );
      })}
    </Stack>
  );
};

const inferWorkflowFromText = (message, { targetProductId, targetProductOrderId }) => {
  const text = String(message || "").toLowerCase();
  if (!text.trim()) return null;
  if (targetProductOrderId || /\border\b|\btracking\b|\bpickup\b|\blabel\b/.test(text)) return "explain_order";
  if (/\bpdf\b|\bdownload\b|\bdigital\b|\bebook\b|\bguide\b|\blicense\b|\bfile\b/.test(text)) return "create_digital_product";
  if (targetProductId && /\brepair\b|\bfix\b|\bmissing\b|\bready to ship\b/.test(text)) return "repair_product";
  if (/\bshipping setup\b|\bdelivery setup\b|\beasypost\b|\bshipping policy\b/.test(text)) return "review_shipping_setup";
  if (targetProductId && /\binternational\b|\bcustoms\b|\bworldwide\b|\bunited states\b|\boutside canada\b/.test(text)) return "prepare_international_shipping";
  if (/\bsell\b|\bproduct\b|\bship\b|\bcanada\b|\bunited states\b|\bprice\b/.test(text)) return "create_physical_product";
  return null;
};

const CommerceCopilotDrawer = ({
  open,
  onClose,
  token,
  initialWorkflow = "",
  targetProductId = null,
  targetProductOrderId = null,
}) => {
  const auth = useMemo(() => (token ? { headers: { Authorization: `Bearer ${token}` } } : {}), [token]);
  const isMobile = typeof window !== "undefined" ? window.innerWidth < 900 : false;
  const [loadingCapabilities, setLoadingCapabilities] = useState(false);
  const [capabilities, setCapabilities] = useState(null);
  const [capabilityError, setCapabilityError] = useState("");
  const [busy, setBusy] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [questionAnswers, setQuestionAnswers] = useState({});
  const [recentSessions, setRecentSessions] = useState([]);
  const [sessionData, setSessionData] = useState(null);
  const [draftEdits, setDraftEdits] = useState({});
  const [selectedActions, setSelectedActions] = useState({});
  const [actionValueEdits, setActionValueEdits] = useState({});
  const [confirmationKeys, setConfirmationKeys] = useState({});
  const [approval, setApproval] = useState(null);
  const [execution, setExecution] = useState(null);
  const [statusMessage, setStatusMessage] = useState({ type: "", text: "" });
  const [questionDetailsOpen, setQuestionDetailsOpen] = useState(false);
  const [editingDraftFact, setEditingDraftFact] = useState(null);
  const [answerFieldErrors, setAnswerFieldErrors] = useState({});
  const [conversationOpen, setConversationOpen] = useState(false);
  const [draftDetailsOpen, setDraftDetailsOpen] = useState(false);
  const [appliedChangesOpen, setAppliedChangesOpen] = useState(false);
  const [contentProducts, setContentProducts] = useState([]);
  const [contentProductId, setContentProductId] = useState(targetProductId || "");
  const [contentFieldSelections, setContentFieldSelections] = useState({});
  const [contentFieldEdits, setContentFieldEdits] = useState({});
  const [editingContentField, setEditingContentField] = useState(null);
  const questionCardRef = useRef(null);

  const session = sessionData?.session || null;
  const draft = sessionData?.draft || null;
  const plan = sessionData?.plan || null;
  const completion = sessionData?.completion || null;
  const contentPack = draft?.draft_payload_json?.content_pack || null;
  const isContentWorkflow = session?.workflow === "improve_product_content";
  const usageSummary = sessionData?.usage_summary || {};
  const messages = Array.isArray(sessionData?.messages) ? sessionData.messages : [];
  const availability = capabilities?.availability || {};
  const blockers = Array.isArray(capabilities?.blockers) ? capabilities.blockers : [];
  const copilotBilling = capabilities?.billing?.ai_commerce_copilot || capabilities?.copilot || {};
  const progress = draft?.validation_results_json?.progress_percent ?? session?.context_summary_json?.progress_percent ?? 0;
  const quickStartWorkflow = initialWorkflow || "";
  const monetizationMode = availability?.monetization_mode || copilotBilling?.monetization_mode || "free_launch";
  const writeActionsAvailable = Boolean(availability?.write_actions_available);
  const chatAvailable = Boolean(availability?.chat_available);
  const draftsAvailable = Boolean(availability?.drafts_available);
  const overallAvailable = Boolean(availability?.available);
  const addonActive = Boolean(copilotBilling?.addon_active);
  const activationAvailable = Boolean(copilotBilling?.activation_available);
  const allowanceRemaining = copilotBilling?.successful_actions_remaining;
  const generationLocked = !chatAvailable;
  const executionLocked = !writeActionsAvailable || allowanceRemaining === 0;
  const latestAssistantMessage = [...messages].reverse().find((row) => row.role === "assistant");
  const currentQuestions = Array.isArray(latestAssistantMessage?.safe_metadata_json?.questions)
    ? latestAssistantMessage.safe_metadata_json.questions.slice(0, 3)
    : [];
  const wizardStep = wizardStepForState({ currentQuestions, plan, execution, session });
  const completionVisible = Boolean(completion?.product?.created) && session?.current_step !== "publish_review" && !isContentWorkflow;
  const showPlanSection = Boolean(!isContentWorkflow && !currentQuestions.length && plan && (!completionVisible || session?.current_step === "publish_review"));
  const completionHeading = session?.current_step === "published"
    ? "Product is live"
    : completion?.available_actions?.prepare_publish
      ? "Ready to publish"
      : "Product created";

  const resetState = useCallback(() => {
    setSessionData(null);
    setMessageText("");
    setQuestionAnswers({});
    setRecentSessions([]);
    setDraftEdits({});
    setSelectedActions({});
    setActionValueEdits({});
    setConfirmationKeys({});
    setApproval(null);
    setExecution(null);
    setStatusMessage({ type: "", text: "" });
    setQuestionDetailsOpen(false);
    setEditingDraftFact(null);
    setAnswerFieldErrors({});
    setConversationOpen(false);
    setDraftDetailsOpen(false);
    setAppliedChangesOpen(false);
    setContentProducts([]);
    setContentProductId(targetProductId || "");
    setContentFieldSelections({});
    setContentFieldEdits({});
    setEditingContentField(null);
  }, [targetProductId]);

  const loadCapabilities = useCallback(async () => {
    setLoadingCapabilities(true);
    setCapabilityError("");
    try {
      const { data } = await api.get("/inventory/commerce-copilot/capabilities", auth);
      setCapabilities(data);
      if (!data?.availability?.write_actions_available) {
        setExecution((prev) => prev);
      }
    } catch (error) {
      setCapabilityError(error?.response?.data?.message || error?.message || "Unable to load Commerce Copilot.");
      setCapabilities(null);
    } finally {
      setLoadingCapabilities(false);
    }
  }, [auth]);

  const loadRecentSessions = useCallback(async () => {
    try {
      const { data } = await api.get("/inventory/commerce-copilot/sessions?page=1&page_size=6", auth);
      setRecentSessions(Array.isArray(data?.items) ? data.items : []);
    } catch (error) {
      setRecentSessions([]);
    }
  }, [auth]);

  const loadContentProducts = useCallback(async () => {
    try {
      const { data } = await api.get("/inventory/products", auth);
      setContentProducts(Array.isArray(data) ? data : []);
    } catch (error) {
      setContentProducts([]);
    }
  }, [auth]);

  const createSession = useCallback(async (workflow) => {
    setBusy(true);
    try {
      const { data } = await api.post(
        "/inventory/commerce-copilot/sessions",
        {
          workflow,
          mode: workflow === "explain_order" ? "guide" : "draft",
          target_product_id: targetProductId,
          target_product_order_id: targetProductOrderId,
        },
        auth
      );
      setSessionData(data);
      setApproval(data?.approval || null);
      setExecution(data?.execution || null);
      return data;
    } catch (error) {
      setStatusMessage({ type: "error", text: error?.response?.data?.message || "Unable to start Commerce Copilot." });
      return null;
    } finally {
      setBusy(false);
    }
  }, [auth, targetProductId, targetProductOrderId]);

  const generateContentPack = useCallback(async (sessionPublicId, payload = {}) => {
    setBusy(true);
    try {
      const { data } = await api.post(`/inventory/commerce-copilot/sessions/${sessionPublicId}/generate-content`, payload, auth);
      setSessionData(data);
      setApproval(data?.approval || null);
      setExecution(data?.execution || null);
      return data;
    } catch (error) {
      setStatusMessage({ type: "error", text: error?.response?.data?.message || "Unable to prepare storefront content." });
      return null;
    } finally {
      setBusy(false);
    }
  }, [auth]);

  const startContentWorkflow = useCallback(async (productId) => {
    const effectiveProductId = Number(productId || targetProductId || contentProductId || 0);
    if (!effectiveProductId) {
      setStatusMessage({ type: "warning", text: "Select a product first." });
      return;
    }
    const created = await createSession("improve_product_content");
    if (created?.session?.public_id) {
      await generateContentPack(created.session.public_id, { target_product_id: effectiveProductId });
    }
  }, [contentProductId, createSession, generateContentPack, targetProductId]);

  const pushSessionTurn = useCallback(async (sessionPublicId, text, answers = []) => {
    setBusy(true);
    setStatusMessage({ type: "", text: "" });
    try {
      const { data } = await api.post(
        `/inventory/commerce-copilot/sessions/${sessionPublicId}/messages`,
        { message: text, answers },
        auth
      );
      setSessionData(data);
      setApproval(data?.approval || null);
      setExecution(data?.execution || null);
      const nextQuestions = Array.isArray(data?.questions)
        ? data.questions
        : Array.isArray(data?.messages)
          ? (([...data.messages].reverse().find((row) => row.role === "assistant")?.safe_metadata_json?.questions) || [])
          : [];
      const fieldErrors = {};
      const answerResults = Array.isArray(data?.answer_results) ? data.answer_results : [];
      answerResults.forEach((result) => {
        const errors = result?.field_errors || {};
        if (Object.keys(errors).length) {
          fieldErrors[result.question_id] = errors;
        }
      });
      setAnswerFieldErrors(fieldErrors);
      setQuestionAnswers((prev) => {
        const next = {};
        nextQuestions.forEach((question) => {
          if (prev[question.question_id] !== undefined) {
            next[question.question_id] = prev[question.question_id];
          }
        });
        return next;
      });
      setQuestionDetailsOpen(false);
      if (data?.answer_feedback_message) {
        setStatusMessage({ type: Object.keys(fieldErrors).length ? "warning" : "success", text: data.answer_feedback_message });
      }
      return true;
    } catch (error) {
      setStatusMessage({ type: "error", text: error?.response?.data?.message || "AI is temporarily unavailable. Try again." });
      return false;
    } finally {
      setBusy(false);
    }
  }, [auth]);

  const submitFirstMessage = useCallback(async () => {
    const text = String(messageText || "").trim();
    if (!text || busy) return;
    const workflow = quickStartWorkflow || inferWorkflowFromText(text, { targetProductId, targetProductOrderId });
    if (!workflow) {
      setStatusMessage({
        type: "info",
        text: "Tell Commerce Copilot whether you want help creating a product, fixing shipping setup, or explaining an order.",
      });
      return;
    }
    const created = await createSession(workflow);
    if (created?.session?.public_id) {
      setMessageText("");
      await pushSessionTurn(created.session.public_id, text);
    }
  }, [busy, createSession, messageText, pushSessionTurn, quickStartWorkflow, targetProductId, targetProductOrderId]);

  useEffect(() => {
    if (!open) {
      resetState();
      setCapabilities(null);
      setCapabilityError("");
      return;
    }
    loadCapabilities();
    loadRecentSessions();
    if (quickStartWorkflow === "improve_product_content" || !targetProductId) {
      loadContentProducts();
    }
  }, [open, loadCapabilities, loadRecentSessions, loadContentProducts, quickStartWorkflow, resetState, targetProductId]);

  useEffect(() => {
    if (!open || !capabilities || !quickStartWorkflow || sessionData || !availability.chat_available) return;
    if (quickStartWorkflow === "improve_product_content") {
      if (targetProductId) {
        startContentWorkflow(targetProductId);
      }
      return;
    }
    createSession(quickStartWorkflow);
  }, [open, capabilities, quickStartWorkflow, sessionData, availability.chat_available, createSession, startContentWorkflow, targetProductId]);

  useEffect(() => {
    if (!contentPack) return;
    const suggestions = contentPack.suggestions || {};
    setContentFieldSelections((prev) => {
      const nextSelections = {};
      Object.entries(suggestions).forEach(([key, row]) => {
        if ((prev[key] === undefined) && row?.status === "suggested" && row?.value) {
          nextSelections[key] = true;
        }
      });
      return Object.keys(nextSelections).length ? { ...prev, ...nextSelections } : prev;
    });
  }, [contentPack]);

  const submitMessage = async () => {
    if (session?.public_id && String(messageText || "").trim()) {
      const next = String(messageText || "").trim();
      setMessageText("");
      await pushSessionTurn(session.public_id, next);
      return;
    }
    if (!session) {
      await submitFirstMessage();
    }
  };

  const submitQuestionAnswers = async () => {
    if (!session?.public_id || !currentQuestions.length) return;
    const answers = currentQuestions
      .map((question) => {
        const value = questionAnswers[question.question_id];
        if (value == null || value === "") return null;
        return {
          question_id: question.question_id,
          fact_key: question.fact_key || question.question_id,
          value,
          confirmation_status: "confirmed",
        };
      })
      .filter(Boolean);
    if (!answers.length) {
      setStatusMessage({ type: "warning", text: "Answer at least one question before sending." });
      return;
    }
    await pushSessionTurn(session.public_id, questionDetailsOpen ? messageText : "", answers);
    if (questionDetailsOpen) setMessageText("");
  };

  const loadSessionDetail = useCallback(async (publicId) => {
    if (!publicId) return;
    setBusy(true);
    try {
      const { data } = await api.get(`/inventory/commerce-copilot/sessions/${publicId}`, auth);
      setSessionData(data);
      setApproval(data?.approval || null);
      setExecution(data?.execution || null);
    } catch (error) {
      setStatusMessage({ type: "error", text: error?.response?.data?.message || "Unable to resume this draft." });
    } finally {
      setBusy(false);
    }
  }, [auth]);

  const saveIncomplete = async () => {
    if (!session?.public_id) {
      setStatusMessage({ type: "info", text: "Start a conversation first, then you can save an incomplete draft." });
      return;
    }
    setBusy(true);
    try {
      const { data } = await api.post(`/inventory/commerce-copilot/sessions/${session.public_id}/save-incomplete`, {}, auth);
      setSessionData(data);
      setApproval(data?.approval || null);
      setExecution(data?.execution || null);
      setStatusMessage({ type: "success", text: "Incomplete draft saved." });
    } catch (error) {
      setStatusMessage({ type: "error", text: error?.response?.data?.message || "Unable to save this draft yet." });
    } finally {
      setBusy(false);
    }
  };

  const cancelSession = async () => {
    if (!session?.public_id) {
      onClose?.();
      return;
    }
    setBusy(true);
    try {
      const { data } = await api.post(`/inventory/commerce-copilot/sessions/${session.public_id}/cancel`, {}, auth);
      setSessionData(data);
      setApproval(data?.approval || null);
      setExecution(data?.execution || null);
      setStatusMessage({ type: "success", text: "Commerce Copilot session cancelled." });
    } catch (error) {
      setStatusMessage({ type: "error", text: error?.response?.data?.message || "Unable to cancel this session." });
    } finally {
      setBusy(false);
    }
  };

  const saveDraftEdits = async () => {
    if (!draft?.public_id) return;
    setBusy(true);
    try {
      const { data } = await api.patch(`/inventory/commerce-copilot/drafts/${draft.public_id}`, draftEdits, auth);
      setSessionData(data);
      setApproval(data?.approval || null);
      setExecution(data?.execution || null);
      setDraftEdits({});
      setEditingDraftFact(null);
      setStatusMessage({ type: "success", text: "Draft changes saved for review." });
    } catch (error) {
      setStatusMessage({ type: "error", text: error?.response?.data?.message || "Unable to save draft edits." });
    } finally {
      setBusy(false);
    }
  };

  const validateDraft = async () => {
    if (!draft?.public_id) return;
    setBusy(true);
    try {
      const { data } = await api.post(`/inventory/commerce-copilot/drafts/${draft.public_id}/validate`, {}, auth);
      setSessionData(data);
      setApproval(data?.approval || null);
      setExecution(data?.execution || null);
      setStatusMessage({ type: "success", text: "Draft validation updated." });
    } catch (error) {
      setStatusMessage({ type: "error", text: error?.response?.data?.message || "Unable to validate this draft." });
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (!currentQuestions.length || !questionCardRef.current || typeof questionCardRef.current.scrollIntoView !== "function") return;
    questionCardRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [currentQuestions.length, latestAssistantMessage?.id]);

  const updatePlanActionStatus = async (publicId, status) => {
    if (!plan?.public_id) return;
    setBusy(true);
    try {
      const { data } = await api.patch(`/inventory/commerce-copilot/plans/${plan.public_id}`, { actions: [{ public_id: publicId, status }] }, auth);
      setSessionData(data);
      setApproval(data?.approval || null);
      setExecution(data?.execution || null);
    } catch (error) {
      setStatusMessage({ type: "error", text: error?.response?.data?.message || "Unable to update this action." });
    } finally {
      setBusy(false);
    }
  };

  const draftPayload = draft?.draft_payload_json || {};
  const draftPresentation = draft?.presentation || draftPayload.presentation || { sections: {} };
  const planActions = useMemo(() => (Array.isArray(plan?.actions) ? plan.actions.slice(0, 5) : []), [plan?.actions]);
  const confirmationRequirements = useMemo(
    () => (Array.isArray(plan?.confirmation_requirements) ? plan.confirmation_requirements : []),
    [plan?.confirmation_requirements]
  );
  const progressKnown = Array.isArray(draft?.validation_results_json?.known) ? draft.validation_results_json.known : [];
  const progressMissing = Array.isArray(draft?.validation_results_json?.missing_required) ? draft.validation_results_json.missing_required : [];
  const progressNeedsConfirmation = Array.isArray(draft?.validation_results_json?.needs_confirmation)
    ? draft.validation_results_json.needs_confirmation
    : [];

  useEffect(() => {
    if (!planActions.length) {
      setSelectedActions({});
      setActionValueEdits({});
      setConfirmationKeys({});
      return;
    }
    setSelectedActions((prev) => {
      const next = {};
      planActions.forEach((action) => {
        next[action.public_id] = prev[action.public_id] ?? (action.status !== "rejected" && action.risk_level !== "high_risk_guide_only");
      });
      return next;
    });
  }, [plan?.public_id, planActions]);

  const setActionSelected = (publicId, checked) => setSelectedActions((prev) => ({ ...prev, [publicId]: checked }));
  const toggleConfirmationKey = (key, checked) => setConfirmationKeys((prev) => ({ ...prev, [key]: checked }));

  const selectedActionIds = useMemo(
    () => planActions.filter((action) => selectedActions[action.public_id]).map((action) => action.public_id),
    [planActions, selectedActions]
  );
  const selectedConfirmationRequirements = useMemo(
    () => confirmationRequirements.filter((row) => selectedActionIds.includes(row.action_public_id)),
    [confirmationRequirements, selectedActionIds]
  );
  const checkboxRequirements = useMemo(
    () => selectedConfirmationRequirements.filter((row) => row.requires_checkbox),
    [selectedConfirmationRequirements]
  );
  const alreadyConfirmedRequirements = useMemo(
    () => selectedConfirmationRequirements.filter((row) => !row.requires_checkbox),
    [selectedConfirmationRequirements]
  );
  const contentAction = useMemo(
    () => planActions.find((action) => action.action_type === "update_product_content") || null,
    [planActions]
  );
  const contentSuggestions = useMemo(() => (contentPack?.suggestions || {}), [contentPack?.suggestions]);
  const contentSupportedFields = useMemo(
    () => (Array.isArray(contentPack?.supported_fields) ? contentPack.supported_fields : []),
    [contentPack?.supported_fields]
  );

  const buildSelectedContentPayload = useCallback(() => {
    const productPayload = {};
    contentSupportedFields.forEach((field) => {
      if (!contentFieldSelections[field]) return;
      const edited = contentFieldEdits[field];
      const suggestion = contentSuggestions[field];
      const finalValue = edited != null && edited !== "" ? edited : suggestion?.value;
      if (finalValue != null && finalValue !== "") {
        productPayload[field] = finalValue;
      }
    });
    return productPayload;
  }, [contentFieldEdits, contentFieldSelections, contentSuggestions, contentSupportedFields]);

  const approveSelectedChanges = async () => {
    if (!plan?.public_id) return;
    const selectedActionIds = planActions.filter((action) => selectedActions[action.public_id]).map((action) => action.public_id);
    if (!selectedActionIds.length) {
      setStatusMessage({ type: "warning", text: "Select at least one action to approve." });
      return;
    }
    setBusy(true);
    try {
      const { data } = await api.post(
        `/inventory/commerce-copilot/plans/${plan.public_id}/approve`,
        {
          plan_version: plan.version,
          selected_action_ids: selectedActionIds,
          action_value_edits: actionValueEdits,
          confirmation_keys: Object.keys(confirmationKeys).filter((key) => confirmationKeys[key]),
        },
        auth
      );
      setApproval(data);
      setExecution(null);
      setStatusMessage({ type: "success", text: "Changes approved. Review once more before applying them." });
    } catch (error) {
      setStatusMessage({ type: "error", text: error?.response?.data?.message || "Unable to approve these changes." });
    } finally {
      setBusy(false);
    }
  };

  const approveSelectedContent = async () => {
    if (!plan?.public_id || !contentAction) return;
    const productPayload = buildSelectedContentPayload();
    if (!Object.keys(productPayload).length) {
      setStatusMessage({ type: "warning", text: "Select at least one storefront content field to apply." });
      return;
    }
    setBusy(true);
    try {
      const { data } = await api.post(
        `/inventory/commerce-copilot/plans/${plan.public_id}/approve`,
        {
          plan_version: plan.version,
          selected_action_ids: [contentAction.public_id],
          action_value_edits: {
            [contentAction.public_id]: {
              product_id: contentPack?.product_id,
              product_payload: productPayload,
            },
          },
          confirmation_keys: Object.keys(confirmationKeys).filter((key) => confirmationKeys[key]),
        },
        auth
      );
      setApproval(data);
      setExecution(null);
      setStatusMessage({ type: "success", text: "Storefront content approved. Apply it when you are ready." });
    } catch (error) {
      setStatusMessage({ type: "error", text: error?.response?.data?.message || "Unable to approve this storefront content." });
    } finally {
      setBusy(false);
    }
  };

  const applyApprovedChanges = async () => {
    if (!approval?.public_id) return;
    setBusy(true);
    try {
      const { data } = await api.post(
        `/inventory/commerce-copilot/approvals/${approval.public_id}/execute`,
        {
          request_idempotency_key: `copilot-ui-${Date.now()}`,
          final_confirmation: true,
        },
        auth
      );
      setExecution(data);
      if (session?.public_id) {
        await loadSessionDetail(session.public_id);
      }
      setStatusMessage({
        type: "success",
        text: data?.status === "completed" ? "Approved changes were applied." : "Execution finished with follow-up items.",
      });
    } catch (error) {
      setStatusMessage({ type: "error", text: error?.response?.data?.message || "Unable to apply approved changes." });
    } finally {
      setBusy(false);
    }
  };

  const continueProductSetup = async () => {
    if (!session?.public_id) return;
    setBusy(true);
    try {
      const { data } = await api.post(`/inventory/commerce-copilot/sessions/${session.public_id}/continue-product-setup`, {}, auth);
      setSessionData(data);
      setApproval(data?.approval || null);
      setExecution(data?.execution || null);
      setStatusMessage({ type: "success", text: "Commerce Copilot refreshed the remaining setup for this product." });
    } catch (error) {
      setStatusMessage({ type: "error", text: error?.response?.data?.message || "Unable to continue this product setup." });
    } finally {
      setBusy(false);
    }
  };

  const preparePublish = async () => {
    if (!session?.public_id) return;
    setBusy(true);
    try {
      const { data } = await api.post(`/inventory/commerce-copilot/sessions/${session.public_id}/prepare-publish`, {}, auth);
      setSessionData(data);
      setApproval(data?.approval || null);
      setExecution(data?.execution || null);
      setStatusMessage({ type: "success", text: "Publish review is ready. Approve the activation change to continue." });
    } catch (error) {
      setStatusMessage({ type: "error", text: error?.response?.data?.message || "Finish setup before publishing." });
    } finally {
      setBusy(false);
    }
  };

  const regenerateContentField = async (field) => {
    if (!session?.public_id || !field) return;
    const loaded = await generateContentPack(session.public_id, { fields: [field] });
    if (loaded) {
      setContentFieldEdits((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
      setStatusMessage({ type: "success", text: `A new ${humanizeFactKey(field).toLowerCase()} suggestion is ready.` });
    }
  };

  const renderPrimaryBanner = () => {
    if (capabilityError) return <Alert severity="warning">{capabilityError}</Alert>;
    if (!capabilities) return null;
    if (!overallAvailable) {
      const primary = blockers[0];
      return <Alert severity="warning">{capabilities.safe_message || STATUS_LABELS[primary] || "Commerce Copilot is not available right now."}</Alert>;
    }
    if (chatAvailable && !writeActionsAvailable) {
      return <Alert severity="info">Commerce Copilot can create drafts and plans. Applying changes is currently disabled.</Alert>;
    }
    if (!chatAvailable && blockers.includes("openai_not_configured")) {
      return <Alert severity="warning">Commerce Copilot setup is incomplete. Ask a platform administrator to configure the AI provider.</Alert>;
    }
    return null;
  };

  const content = (
    <Box sx={{ width: { xs: "100vw", md: 640 }, p: 2.25 }}>
      <Stack spacing={2}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack spacing={0.25}>
            <Typography variant="h6" sx={{ fontWeight: 900 }}>Schedulaa Commerce Copilot</Typography>
            <Typography variant="body2" color="text.secondary">
              {session ? workflowLabel(session.workflow) : "Ask in plain language. Commerce Copilot will prepare drafts, plans, and approved safe changes when available."}
            </Typography>
          </Stack>
          <Stack direction="row" spacing={1}>
            <Button size="small" variant="outlined" startIcon={<RefreshIcon />} onClick={loadCapabilities} disabled={loadingCapabilities || busy}>
              Refresh
            </Button>
            <Button size="small" onClick={onClose}>Close</Button>
          </Stack>
        </Stack>

        {loadingCapabilities && !capabilities ? (
          <Stack direction="row" spacing={1} alignItems="center">
            <CircularProgress size={18} />
            <Typography variant="body2" color="text.secondary">Loading Commerce Copilot...</Typography>
          </Stack>
        ) : null}

        {renderPrimaryBanner()}

        {monetizationMode === "free_launch" && capabilities ? (
          <Chip label="Included during free launch" color="success" variant="outlined" sx={{ alignSelf: "flex-start" }} />
        ) : null}

        {monetizationMode === "paid_addon_required" && !addonActive && activationAvailable ? (
          <Alert severity="warning">AI Commerce Copilot add-on required. Existing history remains visible, but new sessions and approved changes are locked until billing is activated.</Alert>
        ) : null}

        {copilotBilling?.warning ? <Alert severity="warning">{copilotBilling.warning}</Alert> : null}
        {statusMessage.text ? <Alert severity={statusMessage.type || "info"}>{statusMessage.text}</Alert> : null}

        {!session && capabilities && overallAvailable ? (
          <Stack spacing={2}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.5 }}>What would you like help with?</Typography>
              <Typography variant="body2" color="text.secondary">Pick a workflow or describe what you need in plain language.</Typography>
            </Box>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                gap: 1.5,
              }}
            >
              {QUICK_STARTS.map((card) => (
                <Box key={card.workflow}>
                  <Card variant="outlined">
                    <CardActionArea
                      onClick={() => {
                        if (!chatAvailable) return;
                        if (card.workflow === "improve_product_content" && !targetProductId) {
                          loadContentProducts();
                          setContentProductId((prev) => prev || "");
                          return;
                        }
                        if (card.workflow === "improve_product_content") {
                          startContentWorkflow(targetProductId);
                          return;
                        }
                        createSession(card.workflow);
                      }}
                    >
                      <Box sx={{ pointerEvents: chatAvailable ? "auto" : "none", opacity: chatAvailable ? 1 : 0.65 }}>
                        <CardContent>
                          <Stack spacing={0.75}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>{card.title}</Typography>
                            <Typography variant="body2" color="text.secondary">{card.description}</Typography>
                            {card.example ? (
                              <Typography variant="caption" color="text.secondary">{card.example}</Typography>
                            ) : null}
                          </Stack>
                        </CardContent>
                      </Box>
                    </CardActionArea>
                  </Card>
                </Box>
              ))}
            </Box>
            {(quickStartWorkflow === "improve_product_content" || contentProducts.length) && !targetProductId ? (
              <Card variant="outlined">
                <CardContent>
                  <Stack spacing={1.25}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>Select a product to improve</Typography>
                    <TextField
                      select
                      fullWidth
                      label="Product"
                      value={contentProductId}
                      onChange={(event) => setContentProductId(event.target.value)}
                    >
                      <MenuItem value="">Choose a product</MenuItem>
                      {contentProducts.map((product) => (
                        <MenuItem key={product.id} value={product.id}>
                          {product.name} {product.sku ? `(${product.sku})` : ""}
                        </MenuItem>
                      ))}
                    </TextField>
                    <Button
                      variant="contained"
                      onClick={() => startContentWorkflow(contentProductId)}
                      disabled={busy || !contentProductId || !chatAvailable}
                    >
                      Improve storefront content
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            ) : null}
            <Card variant="outlined">
              <CardContent>
                <Stack spacing={1.25}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>Or describe what you need</Typography>
                  <TextField
                    multiline
                    minRows={3}
                    label="Tell Commerce Copilot what you need"
                    placeholder="Example: I sell handmade bracelets for $45 and want to ship within Canada."
                    value={messageText}
                    onChange={(event) => setMessageText(event.target.value)}
                    disabled={!chatAvailable || busy}
                    fullWidth
                  />
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                    <Button variant="contained" startIcon={<SmartToyOutlinedIcon />} onClick={submitMessage} disabled={busy || !messageText.trim() || !chatAvailable}>
                      {busy ? "Working..." : "Send"}
                    </Button>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
            {recentSessions.length ? (
              <Card variant="outlined">
                <CardContent>
                  <Stack spacing={1.25}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>Resume recent draft</Typography>
                    {recentSessions.map((item) => (
                      <Button
                        key={item.public_id}
                        variant="text"
                        sx={{ justifyContent: "space-between", textAlign: "left", px: 0 }}
                        onClick={() => loadSessionDetail(item.public_id)}
                        disabled={busy}
                      >
                        <Stack spacing={0.25} sx={{ alignItems: "flex-start" }}>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>{item.title || workflowLabel(item.workflow)}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {workflowLabel(item.workflow)} · {item.progress_percent ?? 0}% · {humanizeStatus(item.status, "draft")}
                          </Typography>
                        </Stack>
                        <Typography variant="caption" color="text.secondary">Resume</Typography>
                      </Button>
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            ) : null}
          </Stack>
        ) : null}

        {!session && capabilities && !overallAvailable && availability.provider_ready === false ? (
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1 }}>Commerce Copilot setup is incomplete</Typography>
              <Typography variant="body2" color="text.secondary">
                Ask a platform administrator to configure the AI provider, then refresh this drawer.
              </Typography>
            </CardContent>
          </Card>
        ) : null}

        {session ? (
          <>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ xs: "stretch", sm: "center" }}>
              <Chip label={`Status: ${humanizeStatus(session.status, "active")}`} color="primary" variant="outlined" />
              <Chip label={`Step ${wizardStep.number} of 4 - ${wizardStep.label}`} variant="outlined" />
              <Chip label={`Progress: ${progress}%`} variant="outlined" />
              <Chip label={`Turns: ${usageSummary.requests || 0} AI request${(usageSummary.requests || 0) === 1 ? "" : "s"}`} variant="outlined" />
              {monetizationMode === "paid_addon_required" ? <Chip label={`Actions remaining: ${allowanceRemaining ?? 0}`} variant="outlined" /> : null}
            </Stack>

            <Stack spacing={2} sx={{ minWidth: 0, overflowX: "hidden" }}>
              {!isContentWorkflow && currentQuestions.length ? (
                <Card variant="outlined">
                  <CardContent>
                    <Stack spacing={1}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>What Schedulaa understood</Typography>
                      <Stack spacing={0.75} sx={{ userSelect: "text", WebkitUserSelect: "text" }}>
                        {(draftPresentation.sections?.confirmed || []).slice(0, 4).map((row) => (
                          <Typography key={row.fact_key} variant="body2">
                            <strong>{row.label}:</strong> {row.display_value}
                          </Typography>
                        ))}
                        {(draftPresentation.sections?.suggested || []).slice(0, 2).map((row) => (
                          <Typography key={row.fact_key} variant="body2" color="text.secondary">
                            <strong>{row.label}:</strong> {row.display_value}
                          </Typography>
                        ))}
                      </Stack>
                      <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                        <Button size="small" variant="text" onClick={() => setConversationOpen((prev) => !prev)}>
                          {conversationOpen ? "Hide conversation" : "View conversation"}
                        </Button>
                        <Button size="small" variant="text" onClick={() => setDraftDetailsOpen((prev) => !prev)}>
                          {draftDetailsOpen ? "Hide draft details" : "View current draft details"}
                        </Button>
                        <Button
                          size="small"
                          variant="text"
                          onClick={async () => {
                            const copied = await copyText(summarizeConversationForCopy(messages));
                            setStatusMessage({ type: copied ? "success" : "warning", text: copied ? "Conversation summary copied." : "Unable to copy conversation summary." });
                          }}
                        >
                          Copy conversation summary
                        </Button>
                        <Button
                          size="small"
                          variant="text"
                          onClick={async () => {
                            const copied = await copyText(summarizeDraftForCopy(draftPresentation));
                            setStatusMessage({ type: copied ? "success" : "warning", text: copied ? "Product draft summary copied." : "Unable to copy product draft summary." });
                          }}
                        >
                          Copy product draft summary
                        </Button>
                      </Stack>
                    </Stack>
                  </CardContent>
                </Card>
              ) : null}

              {((( !currentQuestions.length && !completionVisible) || conversationOpen) && !isContentWorkflow) || (isContentWorkflow && conversationOpen) ? (
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1 }}>Conversation summary</Typography>
                    <Stack spacing={1.25} sx={{ maxHeight: 280, overflowY: "auto", pr: 0.5, minWidth: 0 }}>
                      {messages.map((row) => (
                        <Box
                          key={row.id}
                          sx={{
                            p: 1.25,
                            borderRadius: 1.5,
                            bgcolor: row.role === "manager" ? "action.selected" : row.role === "assistant" ? "background.default" : "action.hover",
                            border: (theme) => `1px solid ${theme.palette.divider}`,
                            minWidth: 0,
                            userSelect: "text",
                            WebkitUserSelect: "text",
                          }}
                        >
                          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.25 }}>
                            {row.role === "manager" ? "You" : row.role === "assistant" ? "Copilot" : "System"}
                          </Typography>
                          <Typography variant="body2" sx={{ whiteSpace: "pre-line", wordBreak: "break-word", userSelect: "text", WebkitUserSelect: "text" }}>
                            {row.message_text}
                          </Typography>
                        </Box>
                      ))}
                    </Stack>
                  </CardContent>
                </Card>
              ) : null}

              {isContentWorkflow && contentPack ? (
                <Card variant="outlined">
                  <CardContent>
                    <Stack spacing={1.5}>
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>Storefront content suggestions</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Review the current and suggested storefront content. Select only the fields you want to apply.
                        </Typography>
                      </Box>
                      <Alert severity={contentPack?.product_state?.is_active ? "warning" : "info"}>
                        {contentPack?.product_state?.visibility_message}
                      </Alert>
                      {(contentPack?.warnings || []).map((warning) => (
                        <Alert key={warning} severity="warning" sx={{ py: 0 }}>{warning}</Alert>
                      ))}
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>Product preview</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>{contentPack?.product_preview?.title || completion?.product?.name}</Typography>
                          {contentPack?.product_preview?.price != null ? (
                            <Typography variant="body2" color="text.secondary">
                              {contentPack?.product_preview?.currency || ""} {contentPack?.product_preview?.price}
                            </Typography>
                          ) : null}
                          {contentPack?.product_preview?.description ? (
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                              {contentPack.product_preview.description}
                            </Typography>
                          ) : null}
                        </CardContent>
                      </Card>
                      {Object.entries(contentSuggestions).map(([fieldKey, row]) => (
                        <Card key={fieldKey} variant="outlined">
                          <CardContent>
                            <Stack spacing={1}>
                              <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={1}>
                                <Stack spacing={0.35} sx={{ minWidth: 0, flex: 1 }}>
                                  <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{humanizeFactKey(fieldKey)}</Typography>
                                  <Typography variant="caption" color="text.secondary">{row?.reason}</Typography>
                                </Stack>
                                {contentSupportedFields.includes(fieldKey) ? (
                                  <FormControlLabel
                                    control={<Checkbox checked={Boolean(contentFieldSelections[fieldKey])} onChange={(event) => setContentFieldSelections((prev) => ({ ...prev, [fieldKey]: event.target.checked }))} />}
                                    label="Use suggestion"
                                    sx={{ mr: 0 }}
                                  />
                                ) : null}
                              </Stack>
                              <Typography variant="caption" color="text.secondary">Current</Typography>
                              <Typography variant="body2" sx={{ whiteSpace: "pre-line", userSelect: "text", WebkitUserSelect: "text" }}>
                                {row?.current_value || "Empty"}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">Suggested</Typography>
                              {editingContentField === fieldKey ? (
                                <TextField
                                  fullWidth
                                  size="small"
                                  multiline={fieldKey === "description" || fieldKey === "meta_description"}
                                  minRows={fieldKey === "description" ? 4 : 2}
                                  value={contentFieldEdits[fieldKey] ?? row?.value ?? ""}
                                  onChange={(event) => setContentFieldEdits((prev) => ({ ...prev, [fieldKey]: event.target.value }))}
                                />
                              ) : (
                                <Typography variant="body2" sx={{ whiteSpace: "pre-line", userSelect: "text", WebkitUserSelect: "text" }}>
                                  {contentFieldEdits[fieldKey] ?? row?.value ?? row?.reason}
                                </Typography>
                              )}
                              {contentSupportedFields.includes(fieldKey) ? (
                                <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                                  <Button size="small" variant="text" onClick={() => setContentFieldSelections((prev) => ({ ...prev, [fieldKey]: true }))}>
                                    Use suggestion
                                  </Button>
                                  <Button size="small" variant="text" onClick={() => setContentFieldSelections((prev) => ({ ...prev, [fieldKey]: false }))}>
                                    Keep current
                                  </Button>
                                  <Button size="small" variant="text" onClick={() => setEditingContentField((prev) => (prev === fieldKey ? null : fieldKey))}>
                                    {editingContentField === fieldKey ? "Done editing" : "Edit"}
                                  </Button>
                                  <Button size="small" variant="text" onClick={() => regenerateContentField(fieldKey)} disabled={busy}>
                                    Regenerate
                                  </Button>
                                </Stack>
                              ) : null}
                            </Stack>
                          </CardContent>
                        </Card>
                      ))}
                      <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                        <Button
                          variant="outlined"
                          onClick={() => {
                            const next = {};
                            contentSupportedFields.forEach((field) => {
                              if ((contentSuggestions[field] || {}).value) next[field] = true;
                            });
                            setContentFieldSelections(next);
                          }}
                        >
                          Use all suggestions
                        </Button>
                        <Button variant="text" onClick={() => setDraftDetailsOpen((prev) => !prev)}>
                          {draftDetailsOpen ? "Hide current draft details" : "View current draft details"}
                        </Button>
                        <Button variant="text" onClick={() => setConversationOpen((prev) => !prev)}>
                          {conversationOpen ? "Hide conversation" : "View conversation"}
                        </Button>
                      </Stack>
                      <Stack spacing={1.25}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Approve selected content</Typography>
                        {checkboxRequirements.map((requirement) => (
                          <FormControlLabel
                            key={requirement.requirement_id}
                            control={<Checkbox checked={Boolean(confirmationKeys[requirement.requirement_id])} onChange={(event) => toggleConfirmationKey(requirement.requirement_id, event.target.checked)} />}
                            label={`Review and confirm ${requirement.label}${requirement.display_value ? `: ${requirement.display_value}` : ""}.`}
                          />
                        ))}
                        <Alert severity="info" sx={{ py: 0 }}>
                          I reviewed the selected storefront content and want to apply it.
                        </Alert>
                        <FormControlLabel
                          control={<Checkbox checked={Boolean(confirmationKeys.__account_confirmed__)} onChange={(event) => toggleConfirmationKey("__account_confirmed__", event.target.checked)} disabled={busy} />}
                          label="I understand that the selected storefront content will be applied to my Schedulaa account."
                        />
                        <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                          <Button variant="contained" onClick={approveSelectedContent} disabled={busy || !confirmationKeys.__account_confirmed__}>
                            Approve selected content
                          </Button>
                          <Button variant="outlined" onClick={applyApprovedChanges} disabled={busy || !approval?.public_id || executionLocked}>
                            Apply approved content
                          </Button>
                          {completion?.links?.product ? (
                            <Button variant="text" component="a" href={completion.links.product}>
                              Open Product
                            </Button>
                          ) : null}
                          {completion?.available_actions?.prepare_publish ? (
                            <Button variant="text" onClick={preparePublish} disabled={busy}>
                              Publish when ready
                            </Button>
                          ) : null}
                        </Stack>
                      </Stack>
                    </Stack>
                  </CardContent>
                </Card>
              ) : currentQuestions.length ? (
                <Card variant="outlined" ref={questionCardRef}>
                  <CardContent>
                    <Stack spacing={1.5}>
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>Step {wizardStep.number} of 4 - {wizardStep.label}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Answer these and Commerce Copilot will continue the draft.
                        </Typography>
                      </Box>
                      {currentQuestions.map((question) => (
                        <Stack key={question.question_id} spacing={0.75}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{question.plain_language_question}</Typography>
                          <Typography variant="caption" color="text.secondary">{question.why_needed}</Typography>
                          <QuestionControl
                            question={question}
                            value={questionAnswers[question.question_id] ?? ""}
                            fieldErrors={answerFieldErrors[question.question_id] || {}}
                            onChange={(value) => setQuestionAnswers((prev) => ({ ...prev, [question.question_id]: value }))}
                            onUseSuggestion={() => setQuestionAnswers((prev) => ({ ...prev, [question.question_id]: "Ask AI for a suggestion" }))}
                            onShowHelp={() => setStatusMessage({ type: "info", text: question.help_text || "Use a simple measurement or product reference and Schedulaa will normalize it." })}
                            onSaveIncomplete={saveIncomplete}
                            disabled={busy || generationLocked}
                          />
                          <Divider />
                        </Stack>
                      ))}
                      <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                        <Button variant="contained" onClick={submitQuestionAnswers} disabled={busy || generationLocked}>
                          Continue
                        </Button>
                        <Button variant="text" onClick={() => setQuestionDetailsOpen((prev) => !prev)} disabled={busy || generationLocked}>
                          {questionDetailsOpen ? "Hide extra details" : "Add more details instead"}
                        </Button>
                        <Button variant="outlined" onClick={saveIncomplete} disabled={busy}>
                          Save incomplete draft
                        </Button>
                      </Stack>
                      <Collapse in={questionDetailsOpen}>
                        <Stack spacing={1} sx={{ pt: 1 }}>
                          <TextField
                            multiline
                            minRows={3}
                            label="Additional details"
                            value={messageText}
                            onChange={(event) => setMessageText(event.target.value)}
                            placeholder="Add anything else Commerce Copilot should consider."
                            fullWidth
                            disabled={busy || generationLocked}
                          />
                        </Stack>
                      </Collapse>
                    </Stack>
                  </CardContent>
                </Card>
              ) : !completionVisible && !isContentWorkflow ? (
                <Card variant="outlined">
                  <CardContent>
                    <Stack spacing={1}>
                      <TextField
                        multiline
                        minRows={3}
                        label="Tell Commerce Copilot what you need"
                        value={messageText}
                        onChange={(event) => setMessageText(event.target.value)}
                        placeholder="Example: I sell handmade silver necklaces in Canada and want to ship them internationally later."
                        fullWidth
                        disabled={generationLocked}
                      />
                      <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                        <Button variant="contained" startIcon={<SmartToyOutlinedIcon />} disabled={busy || !messageText.trim() || generationLocked} onClick={submitMessage}>
                          {busy ? "Working..." : "Send"}
                        </Button>
                        <Button variant="outlined" onClick={saveIncomplete} disabled={busy}>
                          Save incomplete draft
                        </Button>
                        <Button variant="text" color="inherit" onClick={cancelSession} disabled={busy}>
                          Cancel
                        </Button>
                      </Stack>
                    </Stack>
                  </CardContent>
                </Card>
              ) : null}

              {!isContentWorkflow && !currentQuestions.length && !completionVisible ? (
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1 }}>Progress</Typography>
                  <Stack spacing={0.75}>
                    <Typography variant="body2"><strong>Known:</strong> {progressKnown.length}</Typography>
                    <Typography variant="body2"><strong>Still needed:</strong> {progressMissing.length}</Typography>
                    <Typography variant="body2"><strong>Needs confirmation:</strong> {progressNeedsConfirmation.length}</Typography>
                  </Stack>
                </CardContent>
              </Card>
              ) : null}

              {draft && (((!currentQuestions.length && !completionVisible && !isContentWorkflow) || draftDetailsOpen)) ? (
                <Card variant="outlined">
                  <CardContent>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>Draft preview</Typography>
                      <Chip label={humanizeStatus(draft.status, "draft")} variant="outlined" />
                    </Stack>
                    <Stack spacing={1.5}>
                      <DraftSection
                        title="Confirmed"
                        rows={draftPresentation.sections?.confirmed || []}
                        editingKey={editingDraftFact?.fact_key}
                        editValue={editingDraftFact ? draftEdits[editingDraftFact.fact_key] ?? "" : ""}
                        onEdit={(row) => {
                          setEditingDraftFact(row);
                          setDraftEdits((prev) => ({ ...prev, [row.fact_key]: row.raw_value ?? "" }));
                        }}
                        onChange={(value) => editingDraftFact && setDraftEdits((prev) => ({ ...prev, [editingDraftFact.fact_key]: value }))}
                        onSave={saveDraftEdits}
                        onCancel={() => {
                          setEditingDraftFact(null);
                          setDraftEdits({});
                        }}
                      />
                      <DraftSection
                        title="Package"
                        rows={draftPresentation.sections?.package || []}
                        editingKey={editingDraftFact?.fact_key}
                        editValue={editingDraftFact ? draftEdits[editingDraftFact.fact_key] ?? "" : ""}
                        onEdit={(row) => {
                          setEditingDraftFact(row);
                          setDraftEdits((prev) => ({ ...prev, [row.fact_key]: row.raw_value ?? "" }));
                        }}
                        onChange={(value) => editingDraftFact && setDraftEdits((prev) => ({ ...prev, [editingDraftFact.fact_key]: value }))}
                        onSave={saveDraftEdits}
                        onCancel={() => {
                          setEditingDraftFact(null);
                          setDraftEdits({});
                        }}
                      />
                      <DraftSection
                        title="Needs confirmation"
                        rows={draftPresentation.sections?.needs_confirmation || []}
                        editingKey={editingDraftFact?.fact_key}
                        editValue={editingDraftFact ? draftEdits[editingDraftFact.fact_key] ?? "" : ""}
                        onEdit={(row) => {
                          setEditingDraftFact(row);
                          setDraftEdits((prev) => ({ ...prev, [row.fact_key]: row.raw_value ?? "" }));
                        }}
                        onChange={(value) => editingDraftFact && setDraftEdits((prev) => ({ ...prev, [editingDraftFact.fact_key]: value }))}
                        onSave={saveDraftEdits}
                        onCancel={() => {
                          setEditingDraftFact(null);
                          setDraftEdits({});
                        }}
                      />
                      <DraftSection
                        title="Suggested"
                        rows={draftPresentation.sections?.suggested || []}
                        editingKey={editingDraftFact?.fact_key}
                        editValue={editingDraftFact ? draftEdits[editingDraftFact.fact_key] ?? "" : ""}
                        onEdit={(row) => {
                          setEditingDraftFact(row);
                          setDraftEdits((prev) => ({ ...prev, [row.fact_key]: row.raw_value ?? "" }));
                        }}
                        onChange={(value) => editingDraftFact && setDraftEdits((prev) => ({ ...prev, [editingDraftFact.fact_key]: value }))}
                        onSave={saveDraftEdits}
                        onCancel={() => {
                          setEditingDraftFact(null);
                          setDraftEdits({});
                        }}
                      />
                      <DraftSection
                        title="Still needed"
                        rows={draftPresentation.sections?.missing || []}
                        editingKey={editingDraftFact?.fact_key}
                        editValue={editingDraftFact ? draftEdits[editingDraftFact.fact_key] ?? "" : ""}
                        onEdit={(row) => {
                          setEditingDraftFact(row);
                          setDraftEdits((prev) => ({ ...prev, [row.fact_key]: "" }));
                        }}
                        onChange={(value) => editingDraftFact && setDraftEdits((prev) => ({ ...prev, [editingDraftFact.fact_key]: value }))}
                        onSave={saveDraftEdits}
                        onCancel={() => {
                          setEditingDraftFact(null);
                          setDraftEdits({});
                        }}
                      />
                      {(draftPresentation.activation_blockers || []).length > 0 ? (
                        <Alert severity="warning">
                          {(draftPresentation.activation_blockers || []).map((blocker) => blocker.plain_language_message).join(" ")}
                        </Alert>
                      ) : null}
                      <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                        <Button variant="outlined" onClick={validateDraft} disabled={busy || !draftsAvailable}>
                          Validate draft
                        </Button>
                      </Stack>
                    </Stack>
                  </CardContent>
                </Card>
              ) : null}

            {completionVisible ? (
              <Card variant="outlined">
                <CardContent>
                  <Stack spacing={1.5}>
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>{completionHeading}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {completion?.product?.name || "Your product"}
                      </Typography>
                    </Box>
                    <Alert severity={completion?.product?.is_active ? "success" : "info"}>
                      {completion?.product?.is_active ? "Visible on your storefront." : "Hidden until you publish it."}
                    </Alert>
                    <Stack spacing={1}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Readiness</Typography>
                      {(completion?.readiness?.items || []).map((item) => (
                        <Alert key={item.code} severity={completionStatusTone(item.status)} sx={{ py: 0 }}>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>{item.label}</Typography>
                          <Typography variant="caption" color="text.secondary">{item.message}</Typography>
                        </Alert>
                      ))}
                    </Stack>
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                      <Button variant="contained" onClick={continueProductSetup} disabled={busy || !completion?.available_actions?.help_finish_setup}>
                        Help me finish setup
                      </Button>
                      <Button variant="outlined" onClick={() => startContentWorkflow(completion?.product?.product_id)} disabled={busy || !completion?.product?.product_id}>
                        Improve storefront content
                      </Button>
                      {completion?.links?.product ? (
                        <Button variant="outlined" component="a" href={completion.links.product}>
                          Open product
                        </Button>
                      ) : null}
                      {completion?.available_actions?.open_digital_products && completion?.links?.digital_products ? (
                        <Button variant="outlined" component="a" href={completion.links.digital_products}>
                          Open Digital Products
                        </Button>
                      ) : completion?.links?.delivery_setup ? (
                        <Button variant="outlined" component="a" href={completion.links.delivery_setup}>
                          Open delivery setup
                        </Button>
                      ) : null}
                      <Button
                        variant="text"
                        onClick={preparePublish}
                        disabled={busy || !completion?.available_actions?.prepare_publish}
                      >
                        {completion?.available_actions?.prepare_publish ? "Publish when ready" : "Finish setup before publishing"}
                      </Button>
                    </Stack>
                    {execution ? (
                      <Accordion expanded={appliedChangesOpen} onChange={(_, next) => setAppliedChangesOpen(next)}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>View actions applied</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                          <Stack spacing={1}>
                            {(execution.summary?.actions || []).map((row) => (
                              <Alert
                                key={row.public_id || `${row.action_id}-${row.attempt_number}`}
                                severity={row.status === "succeeded" ? "success" : row.status === "skipped_dependency" ? "info" : "warning"}
                              >
                                <Typography variant="body2" sx={{ fontWeight: 700 }}>{humanizeStatus(row.status, "result")}</Typography>
                                {row.result_summary_json?.title ? (
                                  <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                                    {row.result_summary_json.title}
                                  </Typography>
                                ) : null}
                                {row.safe_error_message ? (
                                  <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                                    {row.safe_error_message}
                                  </Typography>
                                ) : null}
                              </Alert>
                            ))}
                          </Stack>
                        </AccordionDetails>
                      </Accordion>
                    ) : null}
                  </Stack>
                </CardContent>
              </Card>
            ) : null}

            {showPlanSection ? (
              <Card variant="outlined">
                <CardContent>
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} sx={{ mb: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>{writeActionsAvailable ? "Review selected changes" : "Plan preview"}</Typography>
                    {!writeActionsAvailable ? (
                      <Alert severity="info" sx={{ py: 0 }}>Commerce Copilot can create drafts and plans. Applying changes is currently disabled.</Alert>
                    ) : null}
                  </Stack>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                    {plan.summary || "Commerce Copilot prepared a plan based on your current draft."}
                  </Typography>
                  <Stack spacing={1.25}>
                    {planActions.map((action) => (
                      <Card key={action.public_id} variant="outlined">
                        <CardContent>
                          <Stack spacing={1}>
                            <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={1}>
                              <Stack spacing={0.5}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{action.title}</Typography>
                                {writeActionsAvailable ? (
                                  <FormControlLabel
                                    control={(
                                      <Checkbox
                                        checked={Boolean(selectedActions[action.public_id])}
                                        onChange={(event) => setActionSelected(action.public_id, event.target.checked)}
                                        disabled={busy || action.status === "unsupported" || action.risk_level === "high_risk_guide_only"}
                                      />
                                    )}
                                    label="Include this change"
                                  />
                                ) : null}
                              </Stack>
                              <Stack direction="row" spacing={1}>
                                <Chip size="small" label={humanizeStatus(action.risk_level, "preview")} variant="outlined" />
                                <Chip size="small" label={writeActionsAvailable ? "Ready for approval" : "Preview only"} color={writeActionsAvailable ? "success" : "default"} variant="outlined" />
                              </Stack>
                            </Stack>
                            <Typography variant="body2">{action.plain_language_description}</Typography>
                            <Stack spacing={1}>
                              {planSummarySections(action, draftPresentation).map((section) => (
                                <Box key={`${action.public_id}-${section.title}`}>
                                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                                    {section.title}
                                  </Typography>
                                  <Stack spacing={0.5}>
                                    {section.rows.map(([label, value]) => (
                                      <Typography key={`${section.title}-${label}`} variant="body2">
                                        <strong>{label}:</strong> {value}
                                      </Typography>
                                    ))}
                                  </Stack>
                                </Box>
                              ))}
                            </Stack>
                            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                              <Button size="small" variant="outlined" onClick={() => updatePlanActionStatus(action.public_id, "rejected")} disabled={busy}>
                                Reject
                              </Button>
                              <Button size="small" variant="text" onClick={() => setMessageText(`Please change the plan action "${action.title}".`)} disabled={busy}>
                                Ask AI to change
                              </Button>
                            </Stack>
                          </Stack>
                        </CardContent>
                      </Card>
                    ))}
                  </Stack>

                  {writeActionsAvailable ? (
                    <Stack spacing={1.25} sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Approve selected changes</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Selected actions: {planActions.filter((action) => selectedActions[action.public_id]).length}
                      </Typography>
                      {alreadyConfirmedRequirements.map((requirement) => (
                        <Alert key={requirement.requirement_id} severity="success" sx={{ py: 0 }}>
                          Confirmed by you: {requirement.label}{requirement.display_value ? ` - ${requirement.display_value}` : ""}
                        </Alert>
                      ))}
                      {checkboxRequirements.map((requirement) => (
                        <FormControlLabel
                          key={requirement.requirement_id}
                          control={
                            <Checkbox
                              checked={Boolean(confirmationKeys[requirement.requirement_id] || confirmationKeys[requirement.fact_key] || confirmationKeys[requirement.payload_key])}
                              onChange={(event) => toggleConfirmationKey(requirement.requirement_id, event.target.checked)}
                              disabled={busy}
                            />
                          }
                          label={`Review and confirm ${requirement.label}${requirement.display_value ? `: ${requirement.display_value}` : ""}.`}
                        />
                      ))}
                      {!checkboxRequirements.length ? (
                        <Alert severity="info" sx={{ py: 0 }}>
                          I reviewed these changes and want to apply them to my Schedulaa account.
                        </Alert>
                      ) : null}
                      <FormControlLabel
                        control={<Checkbox checked={Boolean(confirmationKeys.__account_confirmed__)} onChange={(event) => toggleConfirmationKey("__account_confirmed__", event.target.checked)} disabled={busy} />}
                        label="I understand that these changes will be applied to my Schedulaa account."
                      />
                      <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                        <Button variant="contained" onClick={approveSelectedChanges} disabled={busy || !confirmationKeys.__account_confirmed__}>
                          Approve selected changes
                        </Button>
                        <Button variant="outlined" onClick={applyApprovedChanges} disabled={busy || !approval?.public_id || executionLocked}>
                          Apply approved changes
                        </Button>
                      </Stack>
                    </Stack>
                  ) : null}
                </CardContent>
              </Card>
            ) : null}

            {approval && showPlanSection ? (
              <Alert severity="info">
                Approved {Array.isArray(approval.approved_actions) ? approval.approved_actions.length : 0} change{Array.isArray(approval.approved_actions) && approval.approved_actions.length === 1 ? "" : "s"}.
                {approval.execution_available ? " You can now apply them." : " Changes were reviewed, but applying them is currently disabled."}
              </Alert>
            ) : null}

            {approval && isContentWorkflow ? (
              <Alert severity="info">
                Approved {Array.isArray(approval.approved_actions) ? approval.approved_actions.length : 0} content action{Array.isArray(approval.approved_actions) && approval.approved_actions.length === 1 ? "" : "s"}.
                {approval.execution_available ? " You can now apply the selected storefront content." : " Content was reviewed, but applying it is currently disabled."}
              </Alert>
            ) : null}

            {execution && !completionVisible ? (
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1 }}>Execution results</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                    Status: {humanizeStatus(execution.status, "completed")}
                  </Typography>
                  <Stack spacing={1}>
                    {(execution.summary?.actions || []).map((row) => (
                      <Alert
                        key={row.public_id || `${row.action_id}-${row.attempt_number}`}
                        severity={row.status === "succeeded" ? "success" : row.status === "skipped_dependency" ? "info" : "warning"}
                      >
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{humanizeStatus(row.status, "result")}</Typography>
                        {row.result_summary_json?.deep_link ? (
                          <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                            Open: {row.result_summary_json.deep_link}
                          </Typography>
                        ) : null}
                        {row.safe_error_message ? (
                          <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                            {row.safe_error_message}
                          </Typography>
                        ) : null}
                      </Alert>
                    ))}
                  </Stack>
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mt: 1.5 }}>
                    <Button variant="contained" onClick={() => session?.public_id && loadSessionDetail(session.public_id)} disabled={busy}>
                      Help me finish setup
                    </Button>
                    {execution.summary?.actions?.find((row) => row.result_summary_json?.deep_link)?.result_summary_json?.deep_link ? (
                      <Button
                        variant="outlined"
                        component="a"
                        href={execution.summary.actions.find((row) => row.result_summary_json?.deep_link)?.result_summary_json?.deep_link}
                      >
                        Open Product
                      </Button>
                    ) : null}
                    <Button variant="text" component="a" href="/manager/advanced-management?panel=easypost-shipping">
                      Open Delivery Setup
                    </Button>
                    <Button variant="text" onClick={onClose}>
                      Finish later
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            ) : null}
            </Stack>
          </>
        ) : null}
      </Stack>
    </Box>
  );

  if (isMobile) {
    return (
      <Dialog
        open={open}
        onClose={onClose}
        fullScreen
        sx={{ zIndex: COPILOT_OVERLAY_Z_INDEX, "& .MuiDialog-paper": { zIndex: "inherit" } }}
      >
        <DialogTitle sx={{ p: 0 }}><Box /></DialogTitle>
        <DialogContent sx={{ p: 0 }}>{content}</DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      sx={{
        zIndex: COPILOT_OVERLAY_Z_INDEX,
        "& .MuiDrawer-paper": {
          zIndex: "inherit",
          width: 640,
          maxWidth: "100vw",
        },
      }}
    >
      {content}
    </Drawer>
  );
};

export default CommerceCopilotDrawer;
