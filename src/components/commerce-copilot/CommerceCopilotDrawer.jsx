import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Autocomplete,
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
  Radio,
  RadioGroup,
  Select,
  Snackbar,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import SmartToyOutlinedIcon from "@mui/icons-material/SmartToyOutlined";
import RefreshIcon from "@mui/icons-material/Refresh";
import api from "../../utils/api";
import { formatCurrency } from "../../utils/formatters";

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
    workflow: "international_expansion_assistant",
    title: "Expand a product internationally",
    description: "Review common setup, selected destinations, and safe destination enablement.",
  },
  {
    workflow: "review_shipping_setup",
    title: "Review my shipping setup",
    description: "Explain what is configured and what is still missing for shipping.",
  },
  {
    workflow: "test_shipping_setup",
    title: "Test my shipping setup",
    description: "Request live carrier test rates for a product, package, and destination without buying a label.",
  },
  {
    workflow: "explain_order",
    title: "Explain a product order",
    description: "Read the order state and explain the safest next manual step.",
  },
  {
    workflow: "review_product_variants",
    title: "Review Product variants",
    description: "Explain Product options, activation blockers, selected Variant details, and preview-ready checkout facts.",
  },
];

const COPILOT_OVERLAY_Z_INDEX = (theme) => theme.zIndex.modal + 3000;
const DRAWER_MENU_PROPS = {
  disablePortal: true,
  PaperProps: {
    sx: {
      zIndex: COPILOT_OVERLAY_Z_INDEX,
    },
  },
};
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
const emptyShippingTestDestination = () => ({
  address1: "",
  address2: "",
  city: "",
  region: "",
  postal_code: "",
  country: "",
});

const buildShippingTestForm = (view, fallbackProductId = null) => {
  const draft = view?.draft || {};
  const destination = draft.saved_destination && Object.keys(draft.saved_destination).length
    ? draft.saved_destination
    : view?.result?.destination_address || view?.address_review?.original_address || {};
  return {
    product_id: String(draft.product_id || view?.selected_product_id || fallbackProductId || ""),
    package_profile_id: String(draft.package_profile_id || view?.selected_package_profile_id || ""),
    quantity: String(draft.quantity || 1),
    save_destination: Boolean(draft.save_destination),
    destination: {
      ...emptyShippingTestDestination(),
      ...(destination || {}),
    },
  };
};

const buildInternationalExpansionForm = (view, fallbackProductId = null) => ({
  product_id: String(view?.draft?.product_id || view?.selected_product_id || fallbackProductId || ""),
  destinations: Array.isArray(view?.draft?.destinations) ? view.draft.destinations : [],
  enable_destinations: [],
});

const shippingTestStatusTone = (status) => {
  if (status === "passed") return "success";
  if (status === "provider_unavailable") return "warning";
  if (status === "no_rates") return "info";
  return "warning";
};

const humanizeFactKey = (value) => HUMAN_LABELS[value] || String(value || "").replace(/_/g, " ");
const humanizeContentCapabilityStatus = (value) => ({
  suggestion_available: "Suggestion available",
  no_suggestion: "Needs attention",
  unsupported: "Not managed here",
  not_applicable: "Not applicable",
  generation_error: "Generation failed",
}[String(value || "").trim().toLowerCase()] || "Needs review");
const factKeyFromQuestion = (question) => String(question?.fact_key || question?.question_id || "");

const PRODUCT_STEP_KEYS = new Set([
  "product_name",
  "price",
  "currency",
  "business_selling_currency",
  "business_currency_mode",
  "is_digital",
  "track_stock",
  "quantity",
  "shipping_weight_grams",
  "category",
  "product_title_candidate",
]);

const PACKAGE_STEP_KEYS = new Set([
  "package_profile_bundle",
  "package_reuse_choice",
  "package_length_mm",
  "package_width_mm",
  "package_height_mm",
  "package_tare_weight_grams",
  "package_profile_name",
  "package_set_as_default",
]);

const PACKAGE_DRAFT_FACT_KEYS = new Set([
  "package_profile_bundle",
  "package_profile_name",
  "package_length_mm",
  "package_width_mm",
  "package_height_mm",
  "package_tare_weight_grams",
  "package_set_as_default",
  "package_reuse_choice",
  "selected_package_profile_reference",
  "package_make_workspace_default",
]);

const isPackageDraftRow = (row) => PACKAGE_DRAFT_FACT_KEYS.has(String(row?.fact_key || ""));

const formatPackageDimensionDisplay = (facts = {}) => {
  const length = Number(facts.package_length_mm || 0);
  const width = Number(facts.package_width_mm || 0);
  const height = Number(facts.package_height_mm || 0);
  if (!(length > 0 && width > 0 && height > 0)) return "Still needed";
  return `${length / 10} × ${width / 10} × ${height / 10} cm`;
};

const buildPackageDraftSummaryRows = (facts = {}, draftPresentation = {}) => {
  const packageRows = Array.isArray(draftPresentation?.sections?.package) ? draftPresentation.sections.package : [];
  const packageNameRow = packageRows.find((row) => row.fact_key === "package_profile_name");
  const tareRow = packageRows.find((row) => row.fact_key === "package_tare_weight_grams");
  const defaultRow = packageRows.find((row) => row.fact_key === "package_set_as_default");
  const reuseRow = packageRows.find((row) => row.fact_key === "package_reuse_choice");
  return [
    {
      label: "Package name",
      display_value: packageNameRow?.display_value || facts.package_profile_name || "Still needed",
    },
    {
      label: "Package dimensions",
      display_value: formatPackageDimensionDisplay(facts),
    },
    {
      label: "Package empty weight",
      display_value: tareRow?.display_value || (facts.package_tare_weight_grams ? `${facts.package_tare_weight_grams} g` : "Still needed"),
    },
    {
      label: "Use as default package",
      display_value: defaultRow?.display_value || (facts.package_set_as_default == null ? "Still needed" : facts.package_set_as_default ? "Yes" : "No"),
    },
    ...(reuseRow?.display_value ? [{ label: reuseRow.label || "Package choice", display_value: reuseRow.display_value }] : []),
  ];
};

const questionFieldLabel = (question) => {
  const key = String(question?.fact_key || question?.question_id || "");
  if (key === "product_name") return "Product name";
  if (key === "quantity") return "Starting inventory";
  if (key === "shipping_weight_grams") return "Product weight";
  if (key === "currency") return "Currency";
  if (key === "business_selling_currency") return "Business selling currency";
  return humanizeFactKey(key) || "Your answer";
};

const formatVariantOptionSummary = (rows) => (Array.isArray(rows) ? rows.map((row) => `${row.option_name || row.option || "Option"}: ${row.value || ""}`).join(" • ") : "");
const variantImageSrc = (image) => image?.url_public || image?.url || image?.src || "";
const formatCopilotMoney = (value, currency, fallbackCurrency) => {
  if (value == null || value === "") return "Not calculated";
  return formatCurrency(Number(value), currency, { fallbackCurrency });
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
  if (session?.workflow === "test_shipping_setup") {
    if (session?.current_step === "shipping_test_results") return { number: 4, label: "Results" };
    if (session?.current_step === "shipping_test_destination") return { number: 3, label: "Destination" };
    if (session?.current_step === "shipping_test_setup") return { number: 2, label: "Package" };
    return { number: 1, label: "Product" };
  }
  if (session?.current_step === "published") return { number: 4, label: "Published" };
  if (session?.current_step === "publish_review") return { number: 4, label: "Publish review" };
  if (session?.current_step === "publish") return { number: 4, label: "Publish" };
  if (session?.current_step === "finish_setup") return { number: 4, label: "Finish setup" };
  if (execution) return { number: 4, label: "Create" };
  if (plan) return { number: 4, label: "Create" };
  if (Array.isArray(currentQuestions) && currentQuestions.some((question) => PRODUCT_STEP_KEYS.has(String(question.fact_key || "")))) {
    return { number: 1, label: "Product" };
  }
  if (Array.isArray(currentQuestions) && currentQuestions.some((question) => PACKAGE_STEP_KEYS.has(String(question.fact_key || "")))) {
    return { number: 2, label: "Package" };
  }
  if (Array.isArray(currentQuestions) && currentQuestions.length) return { number: 1, label: "Product" };
  return { number: 3, label: "Review" };
};

const completionStatusTone = (status) => {
  if (status === "ready") return "success";
  if (status === "missing") return "warning";
  if (status === "blocked") return "error";
  if (status === "warning") return "warning";
  if (["not_applicable", "informational", "pending"].includes(status)) return "info";
  return "info";
};

const readinessGroups = (items = []) => ({
  needsAttention: items.filter((item) => item?.blocking && ["missing", "blocked"].includes(item?.status)),
  warnings: items.filter((item) => item?.status === "warning" && !item?.blocking),
  completed: items.filter((item) => item?.status === "ready"),
  information: items.filter((item) => ["not_applicable", "informational", "pending"].includes(item?.status)),
});

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

const defaultAnswerForQuestion = (question) => {
  const inputType = String(question?.input_type || "").toLowerCase();
  if (inputType === "package_bundle") return newPackageBundleValue(question?.defaults || {});
  if (inputType === "package_choice") {
    const defaults = question?.defaults || {};
    return {
      choice: defaults.choice || "",
      selected_package_profile_reference: defaults.selected_package_profile_reference || "",
      package_make_workspace_default: Boolean(defaults.package_make_workspace_default),
    };
  }
  return "";
};

const seedPackageBundleFromFacts = (facts = {}) => ({
  package_profile_name: facts.package_profile_name || "",
  length: facts.package_length_input || "",
  width: facts.package_width_input || "",
  height: facts.package_height_input || "",
  length_unit: facts.package_length_unit || "cm",
  package_tare_weight_input: facts.package_tare_weight_input || "",
  weight_unit: facts.package_weight_unit || "g",
  package_set_as_default: facts.package_set_as_default !== false,
});

const PackageFieldsEditor = ({
  editorId,
  bundle,
  fieldErrors = {},
  disabled,
  onChange,
  allowUnknown = false,
  onMarkUnknown,
}) => {
  const [helpOpen, setHelpOpen] = useState(false);
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
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" },
          gap: 1,
          minWidth: 0,
        }}
      >
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
          <InputLabel id={`${editorId}-length-unit-label`}>Size unit</InputLabel>
          <Select
            labelId={`${editorId}-length-unit-label`}
            value={bundle.length_unit || "cm"}
            label="Size unit"
            onChange={(event) => updateBundle("length_unit", event.target.value)}
            disabled={disabled}
            MenuProps={DRAWER_MENU_PROPS}
          >
            <MenuItem value="mm">mm</MenuItem>
            <MenuItem value="cm">cm</MenuItem>
            <MenuItem value="in">in</MenuItem>
          </Select>
        </FormControl>
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
          <InputLabel id={`${editorId}-weight-unit-label`}>Weight unit</InputLabel>
          <Select
            labelId={`${editorId}-weight-unit-label`}
            value={bundle.weight_unit || "g"}
            label="Weight unit"
            onChange={(event) => updateBundle("weight_unit", event.target.value)}
            disabled={disabled}
            MenuProps={DRAWER_MENU_PROPS}
          >
            <MenuItem value="g">g</MenuItem>
            <MenuItem value="oz">oz</MenuItem>
          </Select>
        </FormControl>
      </Box>
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
        <Button size="small" variant="text" onClick={() => setHelpOpen((prev) => !prev)} disabled={disabled}>
          {helpOpen ? "Close help" : "Help me find or measure this"}
        </Button>
        {allowUnknown ? (
          <Button size="small" variant="text" onClick={onMarkUnknown} disabled={disabled}>
            I don't know yet
          </Button>
        ) : null}
      </Stack>
      <Collapse in={helpOpen}>
        <Card variant="outlined" sx={{ backgroundColor: "background.default" }}>
          <CardContent sx={{ "&:last-child": { pb: 2 } }}>
            <Stack spacing={0.75}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>How to measure your package</Typography>
              <Typography variant="body2">1. Measure the outside length of the box or mailer.</Typography>
              <Typography variant="body2">2. Measure the outside width.</Typography>
              <Typography variant="body2">3. Measure the outside height.</Typography>
              <Typography variant="body2">4. Weigh the empty box, envelope and packing material without the Product.</Typography>
              <Typography variant="body2">5. Choose cm, mm or inches and Schedulaa will convert it safely.</Typography>
              <Typography variant="body2" color="text.secondary">Example: 10 × 5 × 5 cm · Empty package weight: 15 g</Typography>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => onChange({ ...bundle, length: "10", width: "5", height: "5", length_unit: "cm", package_tare_weight_input: "15", weight_unit: "g" })}
                  disabled={disabled}
                >
                  Use example values
                </Button>
                <Button size="small" variant="text" onClick={() => setHelpOpen(false)} disabled={disabled}>
                  Close help
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      </Collapse>
    </Stack>
  );
};

const PackageBundleControl = ({ question, value, fieldErrors = {}, onChange, onMarkUnknown, disabled }) => {
  const bundle = value && typeof value === "object" ? value : newPackageBundleValue(question?.defaults || {});
  return (
    <PackageFieldsEditor
      editorId={question?.question_id || "package-bundle"}
      bundle={bundle}
      fieldErrors={fieldErrors}
      disabled={disabled}
      onChange={onChange}
      allowUnknown
      onMarkUnknown={onMarkUnknown}
    />
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
            MenuProps={DRAWER_MENU_PROPS}
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

const QuestionControl = ({ question, value, fieldErrors = {}, onChange, onUseSuggestion, onShowHelp, onMarkUnknown, disabled }) => {
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
        <Button size="small" variant="text" onClick={onMarkUnknown} disabled={disabled}>
          I don't know yet
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
          onMarkUnknown={onMarkUnknown}
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
            MenuProps={DRAWER_MENU_PROPS}
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

const PackageDraftSection = ({
  facts,
  draftPresentation,
  editing,
  editValue,
  fieldErrors = {},
  busy,
  onEdit,
  onChange,
  onSave,
  onCancel,
}) => {
  const summaryRows = buildPackageDraftSummaryRows(facts, draftPresentation);
  return (
    <Stack spacing={1}>
      <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Package</Typography>
      <Card variant="outlined">
        <CardContent sx={{ "&:last-child": { pb: 2 } }}>
          <Stack spacing={1}>
            {summaryRows.map((row) => (
              <Box key={row.label}>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>{row.label}</Typography>
                <Typography variant="body2" color={row.display_value === "Still needed" ? "text.secondary" : "text.primary"}>
                  {row.display_value}
                </Typography>
              </Box>
            ))}
            {editing ? (
              <Stack spacing={1}>
                <PackageFieldsEditor
                  editorId="draft-package-editor"
                  bundle={editValue}
                  fieldErrors={fieldErrors}
                  disabled={busy}
                  onChange={onChange}
                />
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                  <Button size="small" variant="contained" onClick={onSave} disabled={busy}>
                    Save package changes
                  </Button>
                  <Button size="small" variant="text" onClick={onCancel} disabled={busy}>
                    Cancel
                  </Button>
                </Stack>
              </Stack>
            ) : (
              <Button size="small" variant="text" onClick={onEdit}>
                Edit package
              </Button>
            )}
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
};

const inferWorkflowFromText = (message, { targetProductId, targetProductOrderId }) => {
  const text = String(message || "").toLowerCase();
  if (!text.trim()) return null;
  if (targetProductOrderId || /\border\b|\btracking\b|\bpickup\b|\blabel\b/.test(text)) return "explain_order";
  if (targetProductId && /\bvariant\b|\bvariants\b|\bcolour\b|\bcolor\b|\bsize\b|\bsku\b|\bactivate\b|\bactivation\b/.test(text)) return "review_product_variants";
  if (/\bpdf\b|\bdownload\b|\bdigital\b|\bebook\b|\bguide\b|\blicense\b|\bfile\b/.test(text)) return "create_digital_product";
  if (targetProductId && /\brepair\b|\bfix\b|\bmissing\b|\bready to ship\b/.test(text)) return "repair_product";
  if (/\btest shipping\b|\brate test\b|\bcarrier rate\b|\bshipping quote\b/.test(text)) return "test_shipping_setup";
  if (/\bshipping setup\b|\bdelivery setup\b|\beasypost\b|\bshipping policy\b/.test(text)) return "review_shipping_setup";
  if (targetProductId && /\binternational\b|\bcustoms\b|\bworldwide\b|\bunited states\b|\boutside canada\b/.test(text)) return "international_expansion_assistant";
  if (/\bsell\b|\bproduct\b|\bship\b|\bcanada\b|\bunited states\b|\bprice\b/.test(text)) return "create_physical_product";
  return null;
};

const CommerceCopilotDrawer = ({
  open,
  onClose,
  token,
  initialWorkflow = "",
  targetProductId = null,
  targetVariantId = null,
  targetProductOrderId = null,
  onOpenProductCheckoutPreview = null,
  onOpenProductVariantConfiguration = null,
  onOpenProductEditor = null,
  businessSellingCurrency = null,
}) => {
  const auth = useMemo(() => (token ? { headers: { Authorization: `Bearer ${token}` } } : {}), [token]);
  const isMobile = typeof window !== "undefined" ? window.innerWidth < 900 : false;
  const [loadingCapabilities, setLoadingCapabilities] = useState(false);
  const [capabilities, setCapabilities] = useState(null);
  const [capabilityError, setCapabilityError] = useState("");
  const [busy, setBusy] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [questionAnswers, setQuestionAnswers] = useState({});
  const [unknownQuestionIds, setUnknownQuestionIds] = useState({});
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
  const [editingPackageDraft, setEditingPackageDraft] = useState(false);
  const [packageDraftValue, setPackageDraftValue] = useState(newPackageBundleValue());
  const [answerFieldErrors, setAnswerFieldErrors] = useState({});
  const [conversationOpen, setConversationOpen] = useState(false);
  const [draftDetailsOpen, setDraftDetailsOpen] = useState(false);
  const [appliedChangesOpen, setAppliedChangesOpen] = useState(false);
  const [completionCompletedOpen, setCompletionCompletedOpen] = useState(false);
  const [completionInformationOpen, setCompletionInformationOpen] = useState(false);
  const [completionMoreActionsOpen, setCompletionMoreActionsOpen] = useState(false);
  const [guidedSetupOpen, setGuidedSetupOpen] = useState(false);
  const [expandedCompletionGuidance, setExpandedCompletionGuidance] = useState({});
  const [contentProducts, setContentProducts] = useState([]);
  const [contentProductId, setContentProductId] = useState(targetProductId || "");
  const [contentFieldDecisions, setContentFieldDecisions] = useState({});
  const [contentFieldEdits, setContentFieldEdits] = useState({});
  const [contentFieldEditBuffers, setContentFieldEditBuffers] = useState({});
  const [contentFieldActivity, setContentFieldActivity] = useState({});
  const [contentFieldRegenerating, setContentFieldRegenerating] = useState({});
  const [editingContentField, setEditingContentField] = useState(null);
  const [contentFilter, setContentFilter] = useState("all");
  const [unsupportedContentOpen, setUnsupportedContentOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState({ open: false, severity: "success", text: "" });
  const [shippingTestForm, setShippingTestForm] = useState(buildShippingTestForm(null, targetProductId));
  const [internationalExpansionForm, setInternationalExpansionForm] = useState(buildInternationalExpansionForm(null, targetProductId));
  const isMobileDialog = useMediaQuery((theme) => theme.breakpoints.down("sm"));
  const questionCardRef = useRef(null);
  const questionSeedRef = useRef({});
  const shippingTestSeedRef = useRef("");
  const internationalExpansionSeedRef = useRef("");
  const completionRefreshPendingRef = useRef(false);

  const session = sessionData?.session || null;
  const draft = sessionData?.draft || null;
  const plan = sessionData?.plan || null;
  const completion = sessionData?.completion || null;
  const shippingTest = sessionData?.shipping_test || null;
  const internationalExpansion = sessionData?.international_expansion || null;
  const contentPack = draft?.draft_payload_json?.content_pack || null;
  const isContentWorkflow = session?.workflow === "improve_product_content";
  const isShippingTestWorkflow = session?.workflow === "test_shipping_setup";
  const isInternationalExpansionWorkflow = session?.workflow === "international_expansion_assistant";
  const usageSummary = sessionData?.usage_summary || {};
  const messages = Array.isArray(sessionData?.messages) ? sessionData.messages : [];
  const availability = capabilities?.availability || {};
  const blockers = Array.isArray(capabilities?.blockers) ? capabilities.blockers : [];
  const copilotBilling = capabilities?.billing?.ai_commerce_copilot || capabilities?.copilot || {};
  const progress = draft?.validation_results_json?.progress_percent ?? session?.context_summary_json?.progress_percent ?? 0;
  const quickStartWorkflow = initialWorkflow || "";
  const quickStartRequiresProductSelection = quickStartWorkflow === "improve_product_content" && !targetProductId;
  const quickStartAutoStarts = Boolean(quickStartWorkflow) && !quickStartRequiresProductSelection;
  const monetizationMode = availability?.monetization_mode || copilotBilling?.monetization_mode || "free_launch";
  const writeActionsAvailable = Boolean(availability?.write_actions_available);
  const chatAvailable = Boolean(availability?.chat_available);
  const overallAvailable = Boolean(availability?.available);
  const addonActive = Boolean(copilotBilling?.addon_active);
  const activationAvailable = Boolean(copilotBilling?.activation_available);
  const allowanceRemaining = copilotBilling?.successful_actions_remaining;
  const generationLocked = !chatAvailable;
  const executionLocked = !writeActionsAvailable || allowanceRemaining === 0;
  const latestAssistantMessage = [...messages].reverse().find((row) => row.role === "assistant");
  const latestVariantCards = Array.isArray(latestAssistantMessage?.safe_metadata_json?.variant_cards)
    ? latestAssistantMessage.safe_metadata_json.variant_cards
    : [];
  const currentQuestions = useMemo(
    () => (Array.isArray(latestAssistantMessage?.safe_metadata_json?.questions)
      ? latestAssistantMessage.safe_metadata_json.questions.slice(0, 3)
      : []),
    [latestAssistantMessage?.safe_metadata_json?.questions]
  );
  const currentQuestionSeedSignature = useMemo(
    () => JSON.stringify(
      currentQuestions.map((question) => ({
        question_id: question?.question_id || "",
        input_type: question?.input_type || "",
        defaults: question?.defaults || {},
        plain_language_question: question?.plain_language_question || "",
      }))
    ),
    [currentQuestions]
  );
  const sessionFacts = useMemo(() => {
    const rows = Array.isArray(sessionData?.facts) ? sessionData.facts : [];
    return rows.reduce((accumulator, row) => {
      accumulator[row.fact_key] = row.normalized_value_json;
      return accumulator;
    }, {});
  }, [sessionData?.facts]);
  const wizardStep = wizardStepForState({ currentQuestions, plan, execution, session });
  const completionVisible = Boolean(completion?.product?.created) && session?.current_step !== "publish_review" && !isContentWorkflow && !isShippingTestWorkflow && !isInternationalExpansionWorkflow;
  const showPlanSection = Boolean(!isContentWorkflow && !isShippingTestWorkflow && !isInternationalExpansionWorkflow && !currentQuestions.length && plan && (!completionVisible || session?.current_step === "publish_review"));
  const completionHeading = session?.current_step === "published"
    ? "Product is live"
    : completion?.available_actions?.prepare_publish
      ? "Ready to publish"
      : "Product created";
  const completionSummary = completion?.readiness?.summary || {};
  const completionGroupedItems = useMemo(
    () => readinessGroups(completion?.readiness?.items || []),
    [completion?.readiness?.items]
  );
  const completionNextAction = completion?.next_best_action || null;
  const completionShippingTestAction = completion?.available_actions?.shipping_test || { enabled: false, label: "Test shipping setup", message: "" };
  const completionBlockerCount = Number(completionSummary.blocking_count || 0);

  useEffect(() => {
    if (!currentQuestions.length) {
      questionSeedRef.current = {};
      setQuestionAnswers({});
      setUnknownQuestionIds({});
      return;
    }
    const activeIds = new Set(currentQuestions.map((question) => question.question_id));
    setQuestionAnswers((prev) => {
      let changed = false;
      const next = { ...prev };
      currentQuestions.forEach((question) => {
        const signature = JSON.stringify({
          input_type: question?.input_type || "",
          defaults: question?.defaults || {},
          plain_language_question: question?.plain_language_question || "",
        });
        if (questionSeedRef.current[question.question_id] !== signature || next[question.question_id] === undefined) {
          questionSeedRef.current[question.question_id] = signature;
          next[question.question_id] = defaultAnswerForQuestion(question);
          changed = true;
        }
      });
      Object.keys(next).forEach((questionId) => {
        if (!activeIds.has(questionId)) {
          delete next[questionId];
          changed = true;
        }
      });
      return changed ? next : prev;
    });
    setUnknownQuestionIds((prev) => {
      let changed = false;
      const next = {};
      Object.keys(prev).forEach((questionId) => {
        if (activeIds.has(questionId)) next[questionId] = prev[questionId];
        else changed = true;
      });
      if (!changed && Object.keys(next).length === Object.keys(prev).length) return prev;
      return next;
    });
  }, [currentQuestionSeedSignature, currentQuestions]);

  useEffect(() => {
    if (!isShippingTestWorkflow) return;
    const signature = JSON.stringify({
      session_public_id: session?.public_id || "",
      selected_product_id: shippingTest?.selected_product_id || null,
      selected_package_profile_id: shippingTest?.selected_package_profile_id || null,
      draft: shippingTest?.draft || {},
      address_review: shippingTest?.address_review || null,
    });
    if (shippingTestSeedRef.current === signature) return;
    shippingTestSeedRef.current = signature;
    setShippingTestForm(buildShippingTestForm(shippingTest, targetProductId));
  }, [
    isShippingTestWorkflow,
    session?.public_id,
    shippingTest,
    targetProductId,
  ]);

  useEffect(() => {
    if (!isInternationalExpansionWorkflow) return;
    const signature = JSON.stringify({
      session_public_id: session?.public_id || "",
      selected_product_id: internationalExpansion?.selected_product_id || null,
      draft: internationalExpansion?.draft || {},
    });
    if (internationalExpansionSeedRef.current === signature) return;
    internationalExpansionSeedRef.current = signature;
    setInternationalExpansionForm(buildInternationalExpansionForm(internationalExpansion, targetProductId));
  }, [
    isInternationalExpansionWorkflow,
    session?.public_id,
    internationalExpansion,
    targetProductId,
  ]);

  const resetState = useCallback(() => {
    setSessionData(null);
    setMessageText("");
    setQuestionAnswers({});
    setUnknownQuestionIds({});
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
    setEditingPackageDraft(false);
    setPackageDraftValue(newPackageBundleValue());
    setAnswerFieldErrors({});
    setConversationOpen(false);
    setDraftDetailsOpen(false);
    setAppliedChangesOpen(false);
    setCompletionCompletedOpen(false);
    setCompletionInformationOpen(false);
    setCompletionMoreActionsOpen(false);
    setGuidedSetupOpen(false);
    setExpandedCompletionGuidance({});
    setContentProducts([]);
    setContentProductId(targetProductId || "");
    setContentFieldSelections({});
    setContentFieldEdits({});
    setEditingContentField(null);
    setShippingTestForm(buildShippingTestForm(null, targetProductId));
    setInternationalExpansionForm(buildInternationalExpansionForm(null, targetProductId));
    questionSeedRef.current = {};
    shippingTestSeedRef.current = "";
    internationalExpansionSeedRef.current = "";
    completionRefreshPendingRef.current = false;
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

  const createSession = useCallback(async (workflow, options = {}) => {
    const effectiveProductId = options.productId ?? targetProductId;
    const effectiveProductOrderId = options.productOrderId ?? targetProductOrderId;
    setBusy(true);
    try {
      const { data } = await api.post(
        "/inventory/commerce-copilot/sessions",
        {
          workflow,
          mode: workflow === "explain_order" ? "guide" : "draft",
          target_product_id: effectiveProductId,
          target_variant_id: options.variantId ?? targetVariantId ?? null,
          target_product_order_id: effectiveProductOrderId,
          initial_destination_country: options.initialDestinationCountry || null,
          current_surface: options.currentSurface || null,
        },
        auth
      );
      setSessionData(data);
      setApproval(data?.approval || null);
      setExecution(data?.execution || null);
      if (workflow === "test_shipping_setup" && options.initialDestinationCountry) {
        setShippingTestForm({
          ...buildShippingTestForm(data?.shipping_test, effectiveProductId),
          destination: {
            ...emptyShippingTestDestination(),
            ...(data?.shipping_test?.draft?.saved_destination || {}),
            country: options.initialDestinationCountry,
          },
        });
      }
      return data;
    } catch (error) {
      setStatusMessage({ type: "error", text: error?.response?.data?.message || "Unable to start Commerce Copilot." });
      return null;
    } finally {
      setBusy(false);
    }
  }, [auth, targetProductId, targetProductOrderId, targetVariantId]);

  const runVariantCardAction = useCallback((action) => {
    const type = String(action?.type || "");
    const productId = action?.product_id ?? null;
    if (type === "open_product_variant_configuration") {
      onOpenProductVariantConfiguration?.(productId);
      return;
    }
    if (type === "open_product_checkout_preview") {
      if (action?.variant_id != null) {
        onOpenProductCheckoutPreview?.(productId, { variantId: action.variant_id });
      } else {
        onOpenProductCheckoutPreview?.(productId);
      }
      return;
    }
    if (type === "open_product_editor") {
      onOpenProductEditor?.(productId);
    }
  }, [onOpenProductCheckoutPreview, onOpenProductEditor, onOpenProductVariantConfiguration]);

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

  const buildCurrentQuestionAnswers = useCallback(() => (
    currentQuestions
      .map((question) => {
        const value = questionAnswers[question.question_id];
        if (unknownQuestionIds[question.question_id]) {
          return {
            question_id: question.question_id,
            fact_key: question.fact_key || question.question_id,
            value: {
              ...(value && typeof value === "object" ? value : {}),
              __intentionally_unresolved: true,
            },
            confirmation_status: "unknown",
          };
        }
        if (value == null || value === "") return null;
        return {
          question_id: question.question_id,
          fact_key: question.fact_key || question.question_id,
          value,
          confirmation_status: "confirmed",
        };
      })
      .filter(Boolean)
  ), [currentQuestions, questionAnswers, unknownQuestionIds]);

  const submitQuestionAnswers = async () => {
    if (!session?.public_id || !currentQuestions.length) return;
    const answers = buildCurrentQuestionAnswers();
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

  const refreshCompletionStatus = useCallback(async (message = "Setup status refreshed.") => {
    if (!session?.public_id) return;
    await loadSessionDetail(session.public_id);
    setStatusMessage({ type: "success", text: message });
  }, [loadSessionDetail, session?.public_id]);

  const openCompletionLink = useCallback((url) => {
    if (!url) return;
    completionRefreshPendingRef.current = true;
    if (typeof window !== "undefined") {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const handleFocus = () => {
      if (!completionRefreshPendingRef.current || !session?.public_id) return;
      completionRefreshPendingRef.current = false;
      refreshCompletionStatus();
    };
    if (typeof window !== "undefined") {
      window.addEventListener("focus", handleFocus);
      return () => window.removeEventListener("focus", handleFocus);
    }
    return undefined;
  }, [open, refreshCompletionStatus, session?.public_id]);

  const saveIncomplete = useCallback(async () => {
    if (!session?.public_id) {
      setStatusMessage({ type: "info", text: "Start a conversation first, then you can save an incomplete draft." });
      return;
    }
    const pendingAnswers = currentQuestions.length ? buildCurrentQuestionAnswers() : [];
    if (pendingAnswers.length) {
      const preserved = await pushSessionTurn(session.public_id, "", pendingAnswers);
      if (!preserved) return;
    }
    setBusy(true);
    try {
      const { data } = await api.post(`/inventory/commerce-copilot/sessions/${session.public_id}/save-incomplete`, {}, auth);
      setSessionData(data);
      setApproval(data?.approval || null);
      setExecution(data?.execution || null);
      setStatusMessage({ type: "success", text: "Draft saved. You can finish this setup later." });
    } catch (error) {
      setStatusMessage({ type: "error", text: error?.response?.data?.message || "Unable to save this draft yet." });
    } finally {
      setBusy(false);
    }
  }, [auth, buildCurrentQuestionAnswers, currentQuestions.length, pushSessionTurn, session?.public_id]);

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

  const savePackageDraftEdits = async () => {
    if (!draft?.public_id) return;
    setBusy(true);
    try {
      const { data } = await api.patch(
        `/inventory/commerce-copilot/drafts/${draft.public_id}`,
        { package_profile_bundle: packageDraftValue },
        auth
      );
      setSessionData(data);
      setApproval(data?.approval || null);
      setExecution(data?.execution || null);
      setEditingPackageDraft(false);
      setStatusMessage({ type: "success", text: "Package changes saved for review." });
    } catch (error) {
      setStatusMessage({ type: "error", text: error?.response?.data?.message || "Unable to save package changes." });
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
  const filteredConfirmedRows = useMemo(
    () => (draftPresentation.sections?.confirmed || []).filter((row) => !isPackageDraftRow(row)),
    [draftPresentation.sections]
  );
  const filteredNeedsConfirmationRows = useMemo(
    () => (draftPresentation.sections?.needs_confirmation || []).filter((row) => !isPackageDraftRow(row)),
    [draftPresentation.sections]
  );
  const filteredSuggestedRows = useMemo(
    () => (draftPresentation.sections?.suggested || []).filter((row) => !isPackageDraftRow(row)),
    [draftPresentation.sections]
  );
  const filteredMissingRows = useMemo(
    () => (draftPresentation.sections?.missing || []).filter((row) => !isPackageDraftRow(row)),
    [draftPresentation.sections]
  );
  const hasPackageDraftSection = useMemo(() => {
    const sectionGroups = ["package", "needs_confirmation", "missing"];
    return sectionGroups.some((key) => (draftPresentation.sections?.[key] || []).some(isPackageDraftRow))
      || Boolean(
        sessionFacts.package_profile_name
        || sessionFacts.package_length_mm
        || sessionFacts.package_width_mm
        || sessionFacts.package_height_mm
        || sessionFacts.package_tare_weight_grams
      );
  }, [draftPresentation.sections, sessionFacts]);
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
  const packageReuseDecision = draft?.validation_results_json?.package_reuse?.reuse_decision || null;
  const showNoMatchPackageInfo = Boolean(
    !currentQuestions.some((question) => String(question?.fact_key || "") === "package_reuse_choice")
    && packageReuseDecision?.status === "no_match"
    && sessionFacts.package_length_mm
    && sessionFacts.package_width_mm
    && sessionFacts.package_height_mm
    && sessionFacts.package_tare_weight_grams
  );

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
  const contentFields = useMemo(
    () => Object.entries(contentSuggestions).map(([fieldKey, row]) => {
      const proposedValue = contentFieldEdits[fieldKey] ?? row?.value ?? "";
      const capabilityStatus = String(row?.capability_status || "").trim().toLowerCase()
        || (contentSupportedFields.includes(fieldKey) ? "suggestion_available" : "unsupported");
      const hasCommittedEdit = Object.prototype.hasOwnProperty.call(contentFieldEdits, fieldKey);
      const actionable = Boolean(
        hasCommittedEdit
        || row?.actionable
        || (capabilityStatus === "suggestion_available" && proposedValue !== "" && proposedValue != null)
      );
      return {
        fieldKey,
        ...row,
        capability_status: capabilityStatus,
        actionable,
        proposed_value: proposedValue,
        current_display: row?.current_value || "Empty",
        suggested_display: proposedValue || null,
        decision: contentFieldDecisions[fieldKey] || "",
        activity: contentFieldActivity[fieldKey] || {},
        is_regenerating: Boolean(contentFieldRegenerating[fieldKey]),
        has_committed_edit: hasCommittedEdit,
      };
    }),
    [contentFieldActivity, contentFieldDecisions, contentFieldEdits, contentFieldRegenerating, contentSuggestions, contentSupportedFields]
  );
  const actionableContentFields = useMemo(
    () => contentFields.filter((row) => row.actionable && row.capability_status !== "generation_error"),
    [contentFields]
  );
  const needsAttentionContentFields = useMemo(
    () => contentFields.filter((row) => {
      if (row.capability_status === "generation_error") return true;
      if (row.capability_status !== "no_suggestion") return false;
      return !row.has_committed_edit;
    }),
    [contentFields]
  );
  const unsupportedContentFields = useMemo(
    () => contentFields.filter((row) => ["unsupported", "not_applicable"].includes(row.capability_status)),
    [contentFields]
  );
  const selectedContentFields = useMemo(
    () => actionableContentFields.filter((row) => row.decision === "selected_suggestion"),
    [actionableContentFields]
  );
  const selectedContentCount = selectedContentFields.length;
  const actionableSuggestionCount = actionableContentFields.length;
  const approvedContentFields = useMemo(
    () => contentFields.filter((row) => row.activity?.approved),
    [contentFields]
  );
  const appliedContentFields = useMemo(
    () => contentFields.filter((row) => row.activity?.applied),
    [contentFields]
  );
  const contentFieldsForFilter = useMemo(() => {
    if (contentFilter === "selected") return selectedContentFields;
    if (contentFilter === "needs_attention") return [...needsAttentionContentFields];
    return [...actionableContentFields, ...needsAttentionContentFields];
  }, [actionableContentFields, contentFilter, needsAttentionContentFields, selectedContentFields]);
  const shippingTestProductOptions = useMemo(
    () => (Array.isArray(shippingTest?.product_options) ? shippingTest.product_options : []),
    [shippingTest?.product_options]
  );
  const shippingTestPackageOptions = useMemo(
    () => (Array.isArray(shippingTest?.package_options) ? shippingTest.package_options : []),
    [shippingTest?.package_options]
  );
  const internationalCountryOptions = useMemo(
    () => (Array.isArray(internationalExpansion?.country_catalog) ? internationalExpansion.country_catalog : []),
    [internationalExpansion?.country_catalog]
  );
  const internationalOriginCode = useMemo(
    () => String(internationalExpansion?.result?.origin?.code || internationalExpansion?.product_summary?.origin_code || "").toUpperCase(),
    [internationalExpansion?.product_summary?.origin_code, internationalExpansion?.result?.origin?.code]
  );
  const internationalEligibleEnablementRows = useMemo(() => {
    const eligibleCodes = new Set(Array.isArray(internationalExpansion?.result?.eligible_destination_codes)
      ? internationalExpansion.result.eligible_destination_codes
      : []);
    return (internationalExpansion?.result?.reviewed_destinations || []).filter(
      (row) => row.status === "not_enabled" && eligibleCodes.has(row.code)
    );
  }, [internationalExpansion?.result?.eligible_destination_codes, internationalExpansion?.result?.reviewed_destinations]);
  const selectedInternationalCountryOptions = useMemo(
    () => internationalCountryOptions.filter((row) => (internationalExpansionForm.destinations || []).includes(row.code)),
    [internationalCountryOptions, internationalExpansionForm.destinations]
  );
  const selectedShippingTestProduct = useMemo(
    () => shippingTestProductOptions.find((row) => String(row.id) === String(shippingTestForm.product_id || "")) || null,
    [shippingTestForm.product_id, shippingTestProductOptions]
  );
  const selectedShippingTestPackage = useMemo(
    () => shippingTestPackageOptions.find((row) => String(row.id) === String(shippingTestForm.package_profile_id || "")) || null,
    [shippingTestForm.package_profile_id, shippingTestPackageOptions]
  );
  const shippingTestQuantity = useMemo(() => {
    const parsed = Number(shippingTestForm.quantity || 0);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  }, [shippingTestForm.quantity]);
  const shippingTestPreview = useMemo(() => {
    if (!selectedShippingTestProduct || !selectedShippingTestPackage || !shippingTestQuantity) return null;
    const productWeight = Number(selectedShippingTestProduct.shipping_weight_grams || 0);
    const tareWeight = Number(selectedShippingTestPackage.tare_weight_grams || 0);
    const totalWeight = tareWeight + (productWeight * shippingTestQuantity);
    return {
      product_weight_display: `${productWeight} g × ${shippingTestQuantity}`,
      tare_weight_display: `${tareWeight} g`,
      total_weight_display: `${totalWeight} g`,
    };
  }, [selectedShippingTestPackage, selectedShippingTestProduct, shippingTestQuantity]);
  const internationalDestinationLimitReached = (internationalExpansionForm.destinations || []).length >= 10;

  useEffect(() => {
    const validKeys = new Set(Object.keys(contentSuggestions));
    if (!validKeys.size) {
      setContentFieldDecisions({});
      setContentFieldEdits({});
      setContentFieldEditBuffers({});
      setContentFieldActivity({});
      setContentFieldRegenerating({});
      setEditingContentField(null);
      return;
    }
    const prune = (previous) => Object.fromEntries(
      Object.entries(previous || {}).filter(([key]) => validKeys.has(key))
    );
    setContentFieldDecisions((prev) => prune(prev));
    setContentFieldEdits((prev) => prune(prev));
    setContentFieldEditBuffers((prev) => prune(prev));
    setContentFieldActivity((prev) => prune(prev));
    setContentFieldRegenerating((prev) => prune(prev));
    setEditingContentField((prev) => (prev && validKeys.has(prev) ? prev : null));
  }, [contentSuggestions]);

  const showToastMessage = useCallback((severity, text) => {
    setToastMessage({ open: true, severity, text });
  }, []);

  const mergeContentFieldActivity = useCallback((field, patch) => {
    setContentFieldActivity((prev) => ({
      ...prev,
      [field]: {
        ...(prev[field] || {}),
        ...patch,
      },
    }));
  }, []);

  const setContentDecision = useCallback((field, decision, options = {}) => {
    setContentFieldDecisions((prev) => ({ ...prev, [field]: decision }));
    if (decision === "selected_suggestion") {
      mergeContentFieldActivity(field, { generationError: "", approved: false, applied: false });
      if (options.announce !== false) {
        const label = humanizeFactKey(field);
        setStatusMessage({ type: "success", text: `${label} selected for application.` });
        showToastMessage("success", `${label} selected for application.`);
      }
      return;
    }
    if (decision === "keeping_current") {
      mergeContentFieldActivity(field, { approved: false, applied: false });
      if (options.announce !== false) {
        setStatusMessage({ type: "info", text: `${humanizeFactKey(field)} will keep the current Product value.` });
      }
      return;
    }
    mergeContentFieldActivity(field, { approved: false, applied: false });
  }, [mergeContentFieldActivity, showToastMessage]);

  const startEditingContentField = useCallback((field, row) => {
    setContentFieldEditBuffers((prev) => ({
      ...prev,
      [field]: prev[field] ?? contentFieldEdits[field] ?? row?.value ?? "",
    }));
    setEditingContentField(field);
  }, [contentFieldEdits]);

  const cancelEditingContentField = useCallback((field) => {
    setContentFieldEditBuffers((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
    setEditingContentField((prev) => (prev === field ? null : prev));
  }, []);

  const saveEditingContentField = useCallback((field) => {
    const nextValue = String(contentFieldEditBuffers[field] ?? "").trim();
    if (!nextValue) {
      mergeContentFieldActivity(field, { generationError: "Enter a value before saving your edit." });
      return;
    }
    setContentFieldEdits((prev) => ({ ...prev, [field]: nextValue }));
    setContentFieldEditBuffers((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
    setEditingContentField((prev) => (prev === field ? null : prev));
    mergeContentFieldActivity(field, {
      edited: true,
      generationError: "",
      approved: false,
      applied: false,
    });
    setContentDecision(field, "selected_suggestion", { announce: false });
    setStatusMessage({ type: "success", text: `${humanizeFactKey(field)} edit selected for application.` });
    showToastMessage("success", `${humanizeFactKey(field)} edited and selected for application.`);
  }, [contentFieldEditBuffers, mergeContentFieldActivity, setContentDecision, showToastMessage]);

  const buildSelectedContentPayload = useCallback(() => {
    const productPayload = {};
    contentSupportedFields.forEach((field) => {
      if (contentFieldDecisions[field] !== "selected_suggestion") return;
      const edited = contentFieldEdits[field];
      const suggestion = contentSuggestions[field];
      const finalValue = edited != null && edited !== "" ? edited : suggestion?.value;
      if (finalValue != null && finalValue !== "") {
        productPayload[field] = finalValue;
      }
    });
    return productPayload;
  }, [contentFieldDecisions, contentFieldEdits, contentSuggestions, contentSupportedFields]);

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
      Object.keys(productPayload).forEach((field) => {
        mergeContentFieldActivity(field, { approved: true, applied: false, generationError: "" });
      });
      setStatusMessage({ type: "success", text: `Approved — ${Object.keys(productPayload).length} field${Object.keys(productPayload).length === 1 ? "" : "s"} are ready to apply.` });
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
      const approvedKeys = Object.keys(buildSelectedContentPayload());
      if (data?.status === "completed") {
        approvedKeys.forEach((field) => {
          mergeContentFieldActivity(field, { applied: true, approved: false, generationError: "" });
        });
        setContentFieldDecisions({});
        setContentFieldEdits({});
        setContentFieldEditBuffers({});
      }
      if (session?.public_id) {
        await loadSessionDetail(session.public_id);
      }
      setStatusMessage({
        type: data?.status === "completed" ? "success" : "warning",
        text: data?.status === "completed"
          ? `${approvedKeys.length} Product field${approvedKeys.length === 1 ? "" : "s"} were updated successfully.`
          : "Approved changes finished with follow-up items.",
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

  const handleCompletionPrimaryAction = async () => {
    switch (completionNextAction?.type) {
      case "answer_product_questions":
        await continueProductSetup();
        break;
      case "fix_setup":
        setGuidedSetupOpen(true);
        break;
      case "publish":
        await preparePublish();
        break;
      case "view_product":
      case "open_product":
        if (completion?.links?.product) openCompletionLink(completion.links.product);
        break;
      default:
        break;
    }
  };

  const requestShippingTest = async (options = {}) => {
    if (!session?.public_id) return;
    const payload = {
      product_id: Number(shippingTestForm.product_id || 0) || null,
      package_profile_id: Number(shippingTestForm.package_profile_id || 0) || null,
      quantity: Number(shippingTestForm.quantity || 0) || 0,
      destination: shippingTestForm.destination,
      save_destination: Boolean(shippingTestForm.save_destination),
      ...(options.verificationChoice ? { verification_choice: options.verificationChoice } : {}),
    };
    setBusy(true);
    try {
      const { data } = await api.post(`/inventory/commerce-copilot/sessions/${session.public_id}/test-shipping`, payload, auth);
      setSessionData(data);
      setApproval(data?.approval || null);
      setExecution(data?.execution || null);
      const resultStatus = data?.shipping_test?.result?.status;
      setStatusMessage({
        type: resultStatus === "passed" ? "success" : "info",
        text: resultStatus === "passed"
          ? "Shipping test rates were returned."
          : "Shipping setup was checked. Review the result below.",
      });
      return data;
    } catch (error) {
      setStatusMessage({ type: "error", text: error?.response?.data?.message || "Unable to request shipping test rates." });
      return null;
    } finally {
      setBusy(false);
    }
  };

  const requestInternationalReview = async () => {
    if (!session?.public_id) return null;
    setBusy(true);
    try {
      const { data } = await api.post(
        `/inventory/commerce-copilot/sessions/${session.public_id}/review-international`,
        {
          product_id: Number(internationalExpansionForm.product_id || 0) || null,
          destinations: internationalExpansionForm.destinations,
        },
        auth
      );
      setSessionData(data);
      setApproval(data?.approval || null);
      setExecution(data?.execution || null);
      setStatusMessage({ type: "success", text: "International expansion review is ready below." });
      return data;
    } catch (error) {
      setStatusMessage({ type: "error", text: error?.response?.data?.message || "Unable to review international selling right now." });
      return null;
    } finally {
      setBusy(false);
    }
  };

  const continueInternationalSetup = async () => {
    if (!session?.public_id) return;
    setBusy(true);
    try {
      const { data } = await api.post(`/inventory/commerce-copilot/sessions/${session.public_id}/continue-international-setup`, {}, auth);
      setSessionData(data);
      setApproval(data?.approval || null);
      setExecution(data?.execution || null);
      setStatusMessage({ type: "success", text: "Commerce Copilot refreshed the remaining international setup for this Product." });
    } catch (error) {
      setStatusMessage({ type: "error", text: error?.response?.data?.message || "Unable to continue this international setup." });
    } finally {
      setBusy(false);
    }
  };

  const prepareDestinationEnablement = async () => {
    if (!session?.public_id) return;
    const selected = Array.isArray(internationalExpansionForm.enable_destinations)
      ? internationalExpansionForm.enable_destinations
      : [];
    if (!selected.length) {
      setStatusMessage({ type: "warning", text: "Select at least one eligible destination to prepare." });
      return;
    }
    setBusy(true);
    try {
      const { data } = await api.post(
        `/inventory/commerce-copilot/sessions/${session.public_id}/prepare-destination-enablement`,
        { destinations: selected },
        auth
      );
      setSessionData(data);
      setApproval(data?.approval || null);
      setExecution(data?.execution || null);
      setStatusMessage({ type: "success", text: "Destination enablement review is ready. Approve the selected changes when you are ready." });
    } catch (error) {
      setStatusMessage({ type: "error", text: error?.response?.data?.message || "Unable to prepare destination changes." });
    } finally {
      setBusy(false);
    }
  };

  const copyInternationalSummary = async () => {
    const payload = internationalExpansion?.result;
    if (!payload) return;
      const lines = [
      `Product: ${payload?.product?.name || "Unknown"}`,
      `Origin: ${payload?.origin?.label || "Not set"}`,
      "",
      "Common Product setup:",
      ...((payload?.common_readiness?.items || []).map((item) => `- ${item.label}: ${item.message}`)),
      "",
      "Reviewed destinations:",
      ...((payload?.reviewed_destinations || []).flatMap((row) => [
        `- ${row.label}: ${row.manager_label}`,
        ...(row?.shipping_test?.status ? [`  - Shipping test: ${humanizeStatus(row.shipping_test.status, "status")}${row.shipping_test.safe_summary ? ` — ${row.shipping_test.safe_summary}` : ""}`] : []),
        ...(row?.items || []).map((item) => `  - ${item.label}: ${item.message}`),
      ])),
      "",
      payload?.disclaimer || "",
    ];
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setStatusMessage({ type: "success", text: "International readiness summary copied." });
    } catch (error) {
      setStatusMessage({ type: "error", text: "Unable to copy the international readiness summary." });
    }
  };

  const regenerateContentField = async (field) => {
    if (!session?.public_id || !field) return;
    setContentFieldRegenerating((prev) => ({ ...prev, [field]: true }));
    mergeContentFieldActivity(field, { generationError: "", approved: false, applied: false });
    const loaded = await generateContentPack(session.public_id, { fields: [field] });
    if (loaded) {
      setContentFieldDecisions((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
      setContentFieldEdits((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
      mergeContentFieldActivity(field, {
        regenerated: true,
        regeneratedLabel: "Regenerated just now",
        generationError: "",
        edited: false,
        approved: false,
        applied: false,
      });
      setStatusMessage({ type: "success", text: "New suggestion generated." });
      showToastMessage("success", `${humanizeFactKey(field)} regenerated successfully.`);
    } else {
      mergeContentFieldActivity(field, {
        generationError: `Unable to regenerate ${humanizeFactKey(field).toLowerCase()} right now. Retry when you are ready.`,
      });
    }
    setContentFieldRegenerating((prev) => ({ ...prev, [field]: false }));
  };

  const refreshContentReview = useCallback(async () => {
    if (!session?.public_id) {
      await loadCapabilities();
      return;
    }
    const hasUnsavedContentReviewChanges = Boolean(
      editingContentField
      || Object.keys(contentFieldEditBuffers).length
      || Object.keys(contentFieldEdits).length
      || Object.values(contentFieldDecisions).some(Boolean)
    );
    if (hasUnsavedContentReviewChanges && typeof window !== "undefined") {
      const confirmed = window.confirm("Refresh and discard unsaved content-review edits and selections?");
      if (!confirmed) return;
    }
    setContentFieldDecisions({});
    setContentFieldEdits({});
    setContentFieldEditBuffers({});
    setEditingContentField(null);
    await loadSessionDetail(session.public_id);
    setStatusMessage({ type: "success", text: "Content review refreshed." });
  }, [contentFieldDecisions, contentFieldEditBuffers, contentFieldEdits, editingContentField, loadCapabilities, loadSessionDetail, session?.public_id]);

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
            <Button
              size="small"
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={isContentWorkflow && session?.public_id ? refreshContentReview : loadCapabilities}
              disabled={loadingCapabilities || busy}
            >
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

        {!session && capabilities && overallAvailable && quickStartAutoStarts ? (
          <Card variant="outlined">
            <CardContent>
              <Stack direction="row" spacing={1.25} alignItems="center">
                <CircularProgress size={18} />
                <Stack spacing={0.25}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                    Opening Commerce Copilot
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {workflowLabel(quickStartWorkflow)}
                  </Typography>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        ) : null}

        {!session && capabilities && overallAvailable && !quickStartAutoStarts ? (
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
                              SelectProps={{ MenuProps: DRAWER_MENU_PROPS }}
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

              {latestVariantCards.length ? (
                <Stack spacing={1.5}>
                  {latestVariantCards.map((card, index) => (
                    <Card key={`${card.type || "variant-card"}-${index}`} variant="outlined">
                      <CardContent>
                        <Stack spacing={1.25}>
                          <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                              {card.product_name ? `${card.product_name}${card.title && card.title !== card.product_name ? ` — ${card.title}` : ""}` : card.title || "Product Variants"}
                            </Typography>
                            {card.mode ? (
                              <Typography variant="body2" color="text.secondary">
                                Variant mode: {humanizeStatus(card.mode, "none")}
                              </Typography>
                            ) : null}
                          </Box>
                          {card.type === "variant_summary" ? (
                            <Stack spacing={0.5}>
                              <Typography variant="body2">Options: {(card.option_names || []).join(" / ") || "None configured"}</Typography>
                              <Typography variant="body2">
                                Variants: {card.counts?.variants || 0} · Active: {card.counts?.active || 0} · Available: {card.counts?.available || 0} · Sold out: {card.counts?.sold_out || 0}
                              </Typography>
                              <Typography variant="body2">
                                Price range: {card.price_summary?.minimum
                                  ? card.price_summary?.varies
                                    ? `${formatCopilotMoney(card.price_summary?.minimum, card.price_summary?.currency, businessSellingCurrency)} to ${formatCopilotMoney(card.price_summary?.maximum, card.price_summary?.currency, businessSellingCurrency)}`
                                    : formatCopilotMoney(card.price_summary?.minimum || card.price_summary?.maximum, card.price_summary?.currency, businessSellingCurrency)
                                  : "Not available"}
                              </Typography>
                              <Typography variant="body2">
                                Activation readiness: {card.activation_readiness?.ready_for_activation ? "Ready" : "Blocked"}
                              </Typography>
                              {(card.activation_readiness?.blockers || []).length ? (
                                <Alert severity="warning" sx={{ py: 0 }}>
                                  {(card.activation_readiness.blockers || []).join(" ")}
                                </Alert>
                              ) : null}
                            </Stack>
                          ) : null}
                          {card.type === "selected_variant" ? (
                            <Stack spacing={0.5}>
                              {variantImageSrc(card.image) ? (
                                <Box
                                  component="img"
                                  src={variantImageSrc(card.image)}
                                  alt={`${card.product_name || "Product"}${card.title ? ` ${card.title}` : ""} preview`}
                                  sx={{ width: 72, height: 72, objectFit: "cover", borderRadius: 1.5, border: "1px solid", borderColor: "divider" }}
                                />
                              ) : null}
                              <Typography variant="body2">Options: {formatVariantOptionSummary(card.selected_options)}</Typography>
                              <Typography variant="body2">SKU: {card.sku || "—"}</Typography>
                              <Typography variant="body2">Price: {card.effective_price != null && card.effective_price !== "" ? formatCopilotMoney(card.effective_price, card.currency, businessSellingCurrency) : "Not available"} · {card.price_source === "variant_override" ? "Variant price" : "Uses Product price"}</Typography>
                              <Typography variant="body2">
                                Availability: {card.available ? "Available" : card.out_of_stock ? "Out of stock" : "Not currently sellable"}
                              </Typography>
                              {card.image_source_label ? <Typography variant="caption" color="text.secondary">{card.image_source_label}</Typography> : null}
                            </Stack>
                          ) : null}
                          {card.type === "variant_preview" ? (
                            <Stack spacing={0.5}>
                              {card.variant_label ? <Typography variant="body2">Variant: {card.variant_label}</Typography> : null}
                              {card.variant_options?.length ? <Typography variant="body2">Options: {formatVariantOptionSummary(card.variant_options)}</Typography> : null}
                              {card.variant_sku ? <Typography variant="body2">SKU: {card.variant_sku}</Typography> : null}
                              <Typography variant="body2">Quantity: {card.quantity || 0}</Typography>
                              <Typography variant="body2">Customer subtotal: {card.subtotal != null ? formatCopilotMoney(card.subtotal, card.currency, businessSellingCurrency) : "Not calculated"}</Typography>
                              <Typography variant="body2">Shipping: {card.delivery_method === "shipping" && (card.shipping_amount == null || card.shipping_amount === "") ? "Requires destination" : formatCopilotMoney(card.shipping_amount, card.currency, businessSellingCurrency)}</Typography>
                              <Typography variant="body2">Tax: {card.tax_message || "Not available"}</Typography>
                              <Typography variant="body2">
                                Estimated total: {card.final_total_status === "provider_calculated" ? "Finalized during checkout" : card.final_total != null ? formatCopilotMoney(card.final_total, card.currency, businessSellingCurrency) : card.known_amount_before_tax != null ? formatCopilotMoney(card.known_amount_before_tax, card.currency, businessSellingCurrency) : "Not calculated"}
                              </Typography>
                              {card.seller_view ? (
                                <Typography variant="body2">
                                  Seller estimate: {card.seller_view.status || "unavailable"}{card.seller_view?.margin?.estimated_order_contribution != null ? ` · Known margin ${formatCopilotMoney(card.seller_view.margin.estimated_order_contribution, card.seller_view.currency || card.currency, businessSellingCurrency)}` : ""}
                                </Typography>
                              ) : null}
                              {(card.warnings || []).length ? (
                                <Alert severity="info" sx={{ py: 0 }}>
                                  {(card.warnings || []).join(" ")}
                                </Alert>
                              ) : null}
                            </Stack>
                          ) : null}
                          {(card.actions || []).length ? (
                            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} useFlexGap flexWrap="wrap">
                              {(card.actions || []).map((action, actionIndex) => (
                                <Button key={`${action.type || "action"}-${actionIndex}`} variant="outlined" onClick={() => runVariantCardAction(action)}>
                                  {action.label || "Open"}
                                </Button>
                              ))}
                            </Stack>
                          ) : null}
                        </Stack>
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              ) : null}

              {isShippingTestWorkflow && shippingTest ? (
                <Card variant="outlined">
                  <CardContent>
                    <Stack spacing={1.5}>
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>Test shipping setup</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Request live carrier test rates for this product setup without purchasing a label.
                        </Typography>
                      </Box>
                      <Alert severity="info" sx={{ py: 0 }}>
                        {shippingTest.workspace_scope_note}
                      </Alert>
                      {shippingTest.result_stale ? (
                        <Alert severity="warning" sx={{ py: 0 }}>
                          {shippingTest.stale_message}
                        </Alert>
                      ) : null}
                      <Card variant="outlined">
                        <CardContent>
                          <Stack spacing={1}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Step 1 of 4 - Product</Typography>
                            <TextField
                              select
                              fullWidth
                              size="small"
                              label="Product"
                              value={shippingTestForm.product_id}
                              onChange={(event) => setShippingTestForm((prev) => ({ ...prev, product_id: event.target.value }))}
                              SelectProps={{ MenuProps: DRAWER_MENU_PROPS }}
                            >
                              <MenuItem value="">Choose a product</MenuItem>
                              {shippingTestProductOptions.map((product) => (
                                <MenuItem key={product.id} value={String(product.id)}>
                                  {product.name} {product.sku ? `(${product.sku})` : ""}
                                </MenuItem>
                              ))}
                            </TextField>
                            {selectedShippingTestProduct ? (
                              <Alert severity={selectedShippingTestProduct.is_digital ? "warning" : "info"} sx={{ py: 0 }}>
                                {selectedShippingTestProduct.is_digital
                                  ? "Digital products do not use carrier shipping tests. Choose a physical product instead."
                                  : `${selectedShippingTestProduct.name} · Product weight ${selectedShippingTestProduct.shipping_weight_grams || 0} g`}
                              </Alert>
                            ) : null}
                          </Stack>
                        </CardContent>
                      </Card>
                      <Card variant="outlined">
                        <CardContent>
                          <Stack spacing={1}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Step 2 of 4 - Package</Typography>
                            <TextField
                              select
                              fullWidth
                              size="small"
                              label="Package used for this test"
                              value={shippingTestForm.package_profile_id}
                              onChange={(event) => setShippingTestForm((prev) => ({ ...prev, package_profile_id: event.target.value }))}
                              SelectProps={{ MenuProps: DRAWER_MENU_PROPS }}
                            >
                              <MenuItem value="">Choose a package</MenuItem>
                              {shippingTestPackageOptions.map((pkg) => (
                                <MenuItem key={pkg.id} value={String(pkg.id)}>
                                  {pkg.name} · {pkg.display_dimensions} · {pkg.tare_weight_display}{pkg.is_default ? " · Default" : ""}
                                </MenuItem>
                              ))}
                            </TextField>
                            {selectedShippingTestPackage ? (
                              <Alert severity="info" sx={{ py: 0 }}>
                                {selectedShippingTestPackage.name} · {selectedShippingTestPackage.display_dimensions} · Empty-package weight {selectedShippingTestPackage.tare_weight_display} · Workspace default: {selectedShippingTestPackage.is_default ? "Yes" : "No"}
                              </Alert>
                            ) : null}
                            <TextField
                              fullWidth
                              size="small"
                              type="number"
                              label="Test quantity"
                              value={shippingTestForm.quantity}
                              onChange={(event) => setShippingTestForm((prev) => ({ ...prev, quantity: event.target.value }))}
                              inputProps={{ min: 1, max: 99, step: 1 }}
                            />
                            {shippingTestPreview ? (
                              <Alert severity="info" sx={{ py: 0 }}>
                                Product weight: {shippingTestPreview.product_weight_display} · Empty package: {shippingTestPreview.tare_weight_display} · Total: {shippingTestPreview.total_weight_display}
                              </Alert>
                            ) : null}
                            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                              {shippingTest.links?.delivery_setup ? (
                                <Button variant="text" component="a" href={shippingTest.links.delivery_setup}>
                                  Open Delivery Setup
                                </Button>
                              ) : null}
                              {shippingTest.links?.product ? (
                                <Button variant="text" component="a" href={shippingTest.links.product}>
                                  Open Product
                                </Button>
                              ) : null}
                            </Stack>
                          </Stack>
                        </CardContent>
                      </Card>
                      <Card variant="outlined">
                        <CardContent>
                          <Stack spacing={1}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Step 3 of 4 - Destination</Typography>
                            <Box
                              sx={{
                                display: "grid",
                                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                                gap: 1,
                              }}
                            >
                              <TextField
                                select
                                size="small"
                                label="Destination country"
                                value={shippingTestForm.destination.country}
                                onChange={(event) => setShippingTestForm((prev) => ({ ...prev, destination: { ...prev.destination, country: event.target.value } }))}
                                SelectProps={{ MenuProps: DRAWER_MENU_PROPS }}
                              >
                                <MenuItem value="">Choose a country</MenuItem>
                                {(shippingTest.country_catalog || []).map((row) => (
                                  <MenuItem key={row.code} value={row.code}>{row.label}</MenuItem>
                                ))}
                              </TextField>
                              <TextField
                                size="small"
                                label="Address line 1"
                                value={shippingTestForm.destination.address1}
                                onChange={(event) => setShippingTestForm((prev) => ({ ...prev, destination: { ...prev.destination, address1: event.target.value } }))}
                              />
                              <TextField
                                size="small"
                                label="Address line 2"
                                value={shippingTestForm.destination.address2}
                                onChange={(event) => setShippingTestForm((prev) => ({ ...prev, destination: { ...prev.destination, address2: event.target.value } }))}
                              />
                              <TextField
                                size="small"
                                label="City"
                                value={shippingTestForm.destination.city}
                                onChange={(event) => setShippingTestForm((prev) => ({ ...prev, destination: { ...prev.destination, city: event.target.value } }))}
                              />
                              <TextField
                                size="small"
                                label="Region / state / province"
                                value={shippingTestForm.destination.region}
                                onChange={(event) => setShippingTestForm((prev) => ({ ...prev, destination: { ...prev.destination, region: event.target.value } }))}
                              />
                              <TextField
                                size="small"
                                label="Postal / ZIP code"
                                value={shippingTestForm.destination.postal_code}
                                onChange={(event) => setShippingTestForm((prev) => ({ ...prev, destination: { ...prev.destination, postal_code: event.target.value } }))}
                              />
                            </Box>
                            <FormControlLabel
                              control={(
                                <Checkbox
                                  checked={Boolean(shippingTestForm.save_destination)}
                                  onChange={(event) => setShippingTestForm((prev) => ({ ...prev, save_destination: event.target.checked }))}
                                />
                              )}
                              label="Save this test destination for this Commerce Copilot session"
                            />
                            {shippingTest.address_review ? (
                              <Card variant="outlined">
                                <CardContent>
                                  <Stack spacing={1}>
                                    <Alert severity="warning" sx={{ py: 0 }}>
                                      {shippingTest.address_review.status === "customer_confirmation_required"
                                        ? "Please confirm that this international delivery address is complete and correct."
                                        : "Please review the suggested address before requesting test rates."}
                                    </Alert>
                                    <Typography variant="caption" color="text.secondary">
                                      Original: {[
                                        shippingTest.address_review.original_address?.address1,
                                        shippingTest.address_review.original_address?.city,
                                        shippingTest.address_review.original_address?.region,
                                        shippingTest.address_review.original_address?.postal_code,
                                        shippingTest.address_review.original_address?.country,
                                      ].filter(Boolean).join(", ")}
                                    </Typography>
                                    {shippingTest.address_review.suggested_address ? (
                                      <Typography variant="caption" color="text.secondary">
                                        Suggested: {[
                                          shippingTest.address_review.suggested_address?.address1,
                                          shippingTest.address_review.suggested_address?.city,
                                          shippingTest.address_review.suggested_address?.region,
                                          shippingTest.address_review.suggested_address?.postal_code,
                                          shippingTest.address_review.suggested_address?.country,
                                        ].filter(Boolean).join(", ")}
                                      </Typography>
                                    ) : null}
                                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                                      {shippingTest.address_review.status === "customer_confirmation_required" ? (
                                        <>
                                          <Button variant="contained" onClick={() => requestShippingTest({ verificationChoice: "confirm" })} disabled={busy}>
                                            Confirm address
                                          </Button>
                                          <Button variant="outlined" onClick={() => requestShippingTest({ verificationChoice: "confirmed_unverified" })} disabled={busy}>
                                            Continue without provider verification
                                          </Button>
                                        </>
                                      ) : (
                                        <>
                                          <Button variant="contained" onClick={() => requestShippingTest({ verificationChoice: "suggested" })} disabled={busy}>
                                            Use suggested address
                                          </Button>
                                          <Button variant="outlined" onClick={() => requestShippingTest({ verificationChoice: "original" })} disabled={busy}>
                                            Keep entered address
                                          </Button>
                                        </>
                                      )}
                                    </Stack>
                                  </Stack>
                                </CardContent>
                              </Card>
                            ) : null}
                          </Stack>
                        </CardContent>
                      </Card>
                      <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                        <Button
                          variant="contained"
                          onClick={() => requestShippingTest()}
                          disabled={busy || !shippingTestForm.product_id || !shippingTestForm.package_profile_id || !shippingTestForm.destination.country || Boolean(selectedShippingTestProduct?.is_digital)}
                        >
                          Request test rates
                        </Button>
                        {shippingTest.result ? (
                          <Button variant="outlined" onClick={() => requestShippingTest()} disabled={busy}>
                            Retry test
                          </Button>
                        ) : null}
                      </Stack>
                      <Card variant="outlined">
                        <CardContent>
                          <Stack spacing={1}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Step 4 of 4 - Results</Typography>
                            {shippingTest.result ? (
                              <>
                                <Alert severity={shippingTestStatusTone(shippingTest.result.status)} sx={{ py: 0 }}>
                                  {shippingTest.result.status === "passed" ? "Shipping test passed" : shippingTest.result.failure_message || "Shipping setup needs attention"}
                                </Alert>
                                {shippingTest.result.product ? (
                                  <Typography variant="body2">Product: {shippingTest.result.product.name}</Typography>
                                ) : null}
                                {shippingTest.result.product?.quantity ? (
                                  <Typography variant="body2">Quantity tested: {shippingTest.result.product.quantity}</Typography>
                                ) : null}
                                {shippingTest.result.package ? (
                                  <Typography variant="body2">Package: {shippingTest.result.package.name} · {shippingTest.result.package.display_dimensions} · {shippingTest.result.package.total_test_weight}</Typography>
                                ) : null}
                                {shippingTest.result.destination ? (
                                  <Typography variant="body2">
                                    Destination: {[shippingTest.result.destination.city, shippingTest.result.destination.region, shippingTest.result.destination.country].filter(Boolean).join(", ")}
                                  </Typography>
                                ) : null}
                                {(shippingTest.result.readiness?.items || []).map((item) => (
                                  <Alert key={item.code} severity={item.status === "ready" ? "success" : "warning"} sx={{ py: 0 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{item.label}</Typography>
                                    <Typography variant="caption" color="text.secondary">{item.message}</Typography>
                                  </Alert>
                                ))}
                                {shippingTest.result.summary?.rate_count ? (
                                  <>
                                    <Typography variant="body2">Carrier services returned: {shippingTest.result.summary.rate_count}</Typography>
                                    {shippingTest.result.summary.lowest_rate ? (
                                      <Typography variant="body2">
                                        Lowest test rate: {shippingTest.result.summary.lowest_rate.currency} {shippingTest.result.summary.lowest_rate.amount}
                                      </Typography>
                                    ) : null}
                                    {shippingTest.result.summary.fastest_rate?.delivery_days != null ? (
                                      <Typography variant="body2">
                                        Fastest estimated transit: {shippingTest.result.summary.fastest_rate.delivery_days} business day{shippingTest.result.summary.fastest_rate.delivery_days === 1 ? "" : "s"}
                                      </Typography>
                                    ) : null}
                                  </>
                                ) : null}
                                {(shippingTest.result.rates || []).length ? (
                                  <Stack spacing={1}>
                                    {(shippingTest.result.rates || []).slice(0, 5).map((rate) => (
                                      <Card key={`${rate.carrier}-${rate.service}-${rate.amount}`} variant="outlined">
                                        <CardContent sx={{ "&:last-child": { pb: 2 } }}>
                                          <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                            {rate.carrier} · {rate.service}
                                          </Typography>
                                          <Typography variant="body2">
                                            {rate.currency} {rate.amount}
                                          </Typography>
                                          <Typography variant="caption" color="text.secondary">
                                            {rate.delivery_estimate_label}
                                          </Typography>
                                        </CardContent>
                                      </Card>
                                    ))}
                                  </Stack>
                                ) : null}
                                {(shippingTest.result.notices || []).map((notice) => (
                                  <Alert key={notice} severity="info" sx={{ py: 0 }}>
                                    {notice}
                                  </Alert>
                                ))}
                              </>
                            ) : (
                              <Typography variant="body2" color="text.secondary">
                                Choose a product, package, quantity, and destination, then request test rates.
                              </Typography>
                            )}
                          </Stack>
                        </CardContent>
                      </Card>
                    </Stack>
                  </CardContent>
                </Card>
              ) : isContentWorkflow && contentPack ? (
                <Card variant="outlined">
                  <CardContent>
                    <Stack spacing={1.5}>
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>Storefront content suggestions</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Review the current and suggested storefront content. Select only the fields you want to apply.
                        </Typography>
                      </Box>
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
                      <Card variant="outlined">
                        <CardContent>
                          <Stack spacing={1.25}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Review summary</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {contentFields.length} content fields reviewed
                        </Typography>
                        <Alert severity={contentPack?.product_state?.is_active ? "warning" : "info"} sx={{ py: 0 }}>
                          {contentPack?.product_state?.visibility_message}
                        </Alert>
                        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} flexWrap="wrap" useFlexGap>
                              <Chip size="small" label={`${actionableSuggestionCount} suggestions available`} />
                              <Chip size="small" label={`${needsAttentionContentFields.length} needs attention`} />
                              <Chip size="small" label={`${unsupportedContentFields.length} not managed here`} />
                              <Chip size="small" color={selectedContentCount ? "success" : "default"} label={`Selected for application: ${selectedContentCount}`} />
                            </Stack>
                            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                              <Button variant={contentFilter === "all" ? "contained" : "outlined"} size="small" onClick={() => setContentFilter("all")}>
                                All
                              </Button>
                              <Button variant={contentFilter === "selected" ? "contained" : "outlined"} size="small" onClick={() => setContentFilter("selected")}>
                                Selected
                              </Button>
                              <Button variant={contentFilter === "needs_attention" ? "contained" : "outlined"} size="small" onClick={() => setContentFilter("needs_attention")}>
                                Needs attention
                              </Button>
                            </Stack>
                          </Stack>
                        </CardContent>
                      </Card>
                      {(contentFilter === "all" || contentFilter === "selected") && contentFieldsForFilter.filter((row) => row.actionable && row.capability_status !== "generation_error").length ? (
                        <Stack spacing={1.25}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Actionable suggestions</Typography>
                          {contentFieldsForFilter.filter((row) => row.actionable && row.capability_status !== "generation_error").map((row) => {
                            const fieldStateChips = [
                              row.decision === "selected_suggestion" ? { label: "Selected", color: "success" } : null,
                              row.decision === "keeping_current" ? { label: "Keeping current", color: "default" } : null,
                              row.activity?.edited ? { label: "Edited", color: "success" } : null,
                              row.activity?.regenerated ? { label: "Regenerated", color: "success" } : null,
                              row.activity?.approved ? { label: "Approved", color: "success" } : null,
                              row.activity?.applied ? { label: "Applied", color: "success" } : null,
                              row.activity?.generationError ? { label: "Failed", color: "error" } : null,
                            ].filter(Boolean);
                            return (
                              <Card key={row.fieldKey} variant="outlined">
                                <CardContent>
                                  <Stack spacing={1}>
                                    <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={1}>
                                      <Stack spacing={0.35} sx={{ minWidth: 0, flex: 1 }}>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{humanizeFactKey(row.fieldKey)}</Typography>
                                        <Typography variant="caption" color="text.secondary">{row.reason}</Typography>
                                      </Stack>
                                      <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                                        <Chip size="small" label={humanizeContentCapabilityStatus(row.capability_status)} />
                                        {fieldStateChips.map((chip) => (
                                          <Chip key={`${row.fieldKey}-${chip.label}`} size="small" color={chip.color} label={chip.label} />
                                        ))}
                                      </Stack>
                                    </Stack>
                                    <Typography variant="caption" color="text.secondary">Current</Typography>
                                    <Typography variant="body2" sx={{ whiteSpace: "pre-line", userSelect: "text", WebkitUserSelect: "text" }}>
                                      {row.current_display}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">Suggested</Typography>
                                    {editingContentField === row.fieldKey ? (
                                      <TextField
                                        fullWidth
                                        size="small"
                                        multiline={row.fieldKey === "description" || row.fieldKey === "meta_description"}
                                        minRows={row.fieldKey === "description" ? 4 : 2}
                                        value={contentFieldEditBuffers[row.fieldKey] ?? row.proposed_value ?? ""}
                                        onChange={(event) => setContentFieldEditBuffers((prev) => ({ ...prev, [row.fieldKey]: event.target.value }))}
                                      />
                                    ) : (
                                      <Typography variant="body2" sx={{ whiteSpace: "pre-line", userSelect: "text", WebkitUserSelect: "text" }}>
                                        {row.suggested_display || "No suggestion available"}
                                      </Typography>
                                    )}
                                    <FormControl component="fieldset" size="small">
                                      <Typography variant="caption" color="text.secondary">Review decision</Typography>
                                      <RadioGroup
                                        row
                                        value={row.decision || ""}
                                        onChange={(event) => setContentDecision(row.fieldKey, event.target.value)}
                                      >
                                        <FormControlLabel value="selected_suggestion" control={<Radio />} label="Use suggested value" />
                                        <FormControlLabel value="keeping_current" control={<Radio />} label="Keep current value" />
                                      </RadioGroup>
                                    </FormControl>
                                    {row.decision === "selected_suggestion" ? (
                                      <Typography variant="caption" color="success.main">Selected for application.</Typography>
                                    ) : null}
                                    {row.activity?.regeneratedLabel ? (
                                      <Typography variant="caption" color="success.main">{row.activity.regeneratedLabel}</Typography>
                                    ) : null}
                                    {row.activity?.generationError ? (
                                      <Alert severity="error" sx={{ py: 0 }}>
                                        {row.activity.generationError}
                                      </Alert>
                                    ) : null}
                                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                                      {editingContentField === row.fieldKey ? (
                                        <>
                                          <Button size="small" variant="contained" onClick={() => saveEditingContentField(row.fieldKey)}>
                                            Save edit
                                          </Button>
                                          <Button size="small" variant="text" onClick={() => cancelEditingContentField(row.fieldKey)}>
                                            Cancel edit
                                          </Button>
                                        </>
                                      ) : (
                                        <Button size="small" variant="text" onClick={() => startEditingContentField(row.fieldKey, row)}>
                                          Edit
                                        </Button>
                                      )}
                                      <Button
                                        size="small"
                                        variant="text"
                                        onClick={() => regenerateContentField(row.fieldKey)}
                                        disabled={busy || row.is_regenerating || !row.can_regenerate}
                                      >
                                        {row.is_regenerating ? "Regenerating..." : "Regenerate"}
                                      </Button>
                                      {row.activity?.generationError ? (
                                        <Button size="small" variant="text" onClick={() => regenerateContentField(row.fieldKey)} disabled={busy || row.is_regenerating}>
                                          Retry
                                        </Button>
                                      ) : null}
                                    </Stack>
                                  </Stack>
                                </CardContent>
                              </Card>
                            );
                          })}
                        </Stack>
                      ) : null}
                      {(contentFilter === "all" || contentFilter === "needs_attention") && needsAttentionContentFields.length ? (
                        <Stack spacing={1.25}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Needs attention</Typography>
                          {needsAttentionContentFields.map((row) => (
                            <Card key={row.fieldKey} variant="outlined">
                              <CardContent>
                                <Stack spacing={1}>
                                  <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={1}>
                                    <Stack spacing={0.35}>
                                      <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{humanizeFactKey(row.fieldKey)}</Typography>
                                      <Typography variant="caption" color="text.secondary">{row.reason}</Typography>
                                    </Stack>
                                    <Chip size="small" label={humanizeContentCapabilityStatus(row.capability_status)} />
                                  </Stack>
                                  {row.activity?.generationError ? (
                                    <Alert severity="error" sx={{ py: 0 }}>{row.activity.generationError}</Alert>
                                  ) : null}
                                  {editingContentField === row.fieldKey ? (
                                    <TextField
                                      fullWidth
                                      size="small"
                                      multiline={row.fieldKey === "description" || row.fieldKey === "meta_description"}
                                      minRows={row.fieldKey === "description" ? 4 : 2}
                                      value={contentFieldEditBuffers[row.fieldKey] ?? ""}
                                      onChange={(event) => setContentFieldEditBuffers((prev) => ({ ...prev, [row.fieldKey]: event.target.value }))}
                                    />
                                  ) : null}
                                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                                    {editingContentField === row.fieldKey ? (
                                      <>
                                        <Button size="small" variant="contained" onClick={() => saveEditingContentField(row.fieldKey)}>
                                          Save edit
                                        </Button>
                                        <Button size="small" variant="text" onClick={() => cancelEditingContentField(row.fieldKey)}>
                                          Cancel edit
                                        </Button>
                                      </>
                                    ) : (
                                      <Button size="small" variant="text" onClick={() => startEditingContentField(row.fieldKey, row)} disabled={!row.can_edit_manually}>
                                        Edit manually
                                      </Button>
                                    )}
                                    <Button
                                      size="small"
                                      variant="text"
                                      onClick={() => regenerateContentField(row.fieldKey)}
                                      disabled={busy || row.is_regenerating || !row.can_regenerate}
                                    >
                                      {row.is_regenerating ? "Regenerating..." : "Regenerate"}
                                    </Button>
                                  </Stack>
                                </Stack>
                              </CardContent>
                            </Card>
                          ))}
                        </Stack>
                      ) : null}
                      {unsupportedContentFields.length ? (
                        <Accordion
                          expanded={unsupportedContentOpen}
                          onChange={(_, expanded) => setUnsupportedContentOpen(expanded)}
                          TransitionProps={{ unmountOnExit: true }}
                        >
                          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Stack spacing={0.35}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Not managed by Commerce Copilot</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {unsupportedContentFields.length} field{unsupportedContentFields.length === 1 ? "" : "s"} are not editable from this workflow.
                              </Typography>
                            </Stack>
                          </AccordionSummary>
                          <AccordionDetails>
                            <Stack spacing={1}>
                              {unsupportedContentFields.map((row) => (
                                <Card key={row.fieldKey} variant="outlined">
                                  <CardContent>
                                    <Stack spacing={0.5}>
                                      <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{humanizeFactKey(row.fieldKey)}</Typography>
                                      <Typography variant="body2" color="text.secondary">{row.reason}</Typography>
                                    </Stack>
                                  </CardContent>
                                </Card>
                              ))}
                            </Stack>
                          </AccordionDetails>
                        </Accordion>
                      ) : null}
                      <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                        <Button
                          variant="outlined"
                          onClick={() => {
                            if (!actionableContentFields.length) return;
                            const next = {};
                            actionableContentFields.forEach((field) => {
                              next[field.fieldKey] = "selected_suggestion";
                            });
                            setContentFieldDecisions(next);
                            setStatusMessage({ type: "success", text: `${actionableContentFields.length} available suggestion${actionableContentFields.length === 1 ? "" : "s"} selected.` });
                            showToastMessage("success", `${actionableContentFields.length} available suggestion${actionableContentFields.length === 1 ? "" : "s"} selected.`);
                          }}
                          disabled={!actionableContentFields.length}
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
                        <Typography variant="body2" color="text.secondary">
                          {selectedContentCount} field{selectedContentCount === 1 ? "" : "s"} selected and ready for review.
                        </Typography>
                        {selectedContentFields.length ? (
                          <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                            {selectedContentFields.map((row) => (
                              <Chip key={`selected-${row.fieldKey}`} size="small" color="success" label={humanizeFactKey(row.fieldKey)} />
                            ))}
                          </Stack>
                        ) : null}
                        {checkboxRequirements.map((requirement) => (
                          <FormControlLabel
                            key={requirement.requirement_id}
                            control={<Checkbox checked={Boolean(confirmationKeys[requirement.requirement_id])} onChange={(event) => toggleConfirmationKey(requirement.requirement_id, event.target.checked)} />}
                            label={`${requirement.label}: ${requirement.display_value || "Confirmation required."}`}
                          />
                        ))}
                        <FormControlLabel
                          control={<Checkbox checked={Boolean(confirmationKeys.__account_confirmed__)} onChange={(event) => toggleConfirmationKey("__account_confirmed__", event.target.checked)} disabled={busy} />}
                          label="I reviewed the selected changes and understand they will update the live Product when applied."
                        />
                        {approvedContentFields.length ? (
                          <Alert severity="success" sx={{ py: 0 }}>
                            Approved — {approvedContentFields.length} field{approvedContentFields.length === 1 ? "" : "s"} are ready to apply.
                          </Alert>
                        ) : null}
                        {appliedContentFields.length ? (
                          <Alert severity="success" sx={{ py: 0 }}>
                            {appliedContentFields.length} Product field{appliedContentFields.length === 1 ? "" : "s"} were updated successfully.
                          </Alert>
                        ) : null}
                        <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                          <Button variant="contained" onClick={approveSelectedContent} disabled={busy || !confirmationKeys.__account_confirmed__ || !selectedContentCount}>
                            {selectedContentCount ? `Approve ${selectedContentCount} selected field${selectedContentCount === 1 ? "" : "s"}` : "Approve selected content"}
                          </Button>
                          <Button variant="outlined" onClick={applyApprovedChanges} disabled={busy || !approval?.public_id || executionLocked}>
                            {approvedContentFields.length ? `Apply ${approvedContentFields.length} approved change${approvedContentFields.length === 1 ? "" : "s"}` : "Apply approved content"}
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
                      {showNoMatchPackageInfo ? (
                        <Alert severity="info" sx={{ py: 0 }}>
                          No saved package matches these confirmed dimensions and empty-package weight. A new Package Profile will be created.
                        </Alert>
                      ) : null}
                      {currentQuestions.map((question) => (
                        <Stack key={question.question_id} spacing={0.75}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{question.plain_language_question}</Typography>
                          <Typography variant="caption" color="text.secondary">{question.why_needed}</Typography>
                          <QuestionControl
                            question={question}
                            value={questionAnswers[question.question_id] ?? ""}
                            fieldErrors={answerFieldErrors[question.question_id] || {}}
                            onChange={(value) => {
                              setUnknownQuestionIds((prev) => ({ ...prev, [question.question_id]: false }));
                              setQuestionAnswers((prev) => ({ ...prev, [question.question_id]: value }));
                            }}
                            onUseSuggestion={() => setQuestionAnswers((prev) => ({ ...prev, [question.question_id]: "Ask AI for a suggestion" }))}
                            onShowHelp={() => setStatusMessage({ type: "info", text: question.help_text || "Use a simple measurement or product reference and Schedulaa will normalize it." })}
                            onMarkUnknown={() => {
                              setUnknownQuestionIds((prev) => ({ ...prev, [question.question_id]: true }));
                              setStatusMessage({ type: "info", text: "I left this question incomplete for now. Continue when you are ready, or save and finish later." });
                            }}
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
                          Save and finish later
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
                          Save and finish later
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
                        rows={filteredConfirmedRows}
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
                      {hasPackageDraftSection ? (
                        <PackageDraftSection
                          facts={sessionFacts}
                          draftPresentation={draftPresentation}
                          editing={editingPackageDraft}
                          editValue={packageDraftValue}
                          fieldErrors={answerFieldErrors.package_profile_bundle || {}}
                          busy={busy}
                          onEdit={() => {
                            setEditingDraftFact(null);
                            setEditingPackageDraft(true);
                            setPackageDraftValue(seedPackageBundleFromFacts(sessionFacts));
                          }}
                          onChange={setPackageDraftValue}
                          onSave={savePackageDraftEdits}
                          onCancel={() => {
                            setEditingPackageDraft(false);
                            setPackageDraftValue(seedPackageBundleFromFacts(sessionFacts));
                          }}
                        />
                      ) : null}
                      <DraftSection
                        title="Needs confirmation"
                        rows={filteredNeedsConfirmationRows}
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
                        rows={filteredSuggestedRows}
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
                        rows={filteredMissingRows}
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
                    </Stack>
                  </CardContent>
                </Card>
              ) : null}

            {completionVisible ? (
              <Card variant="outlined">
                <CardContent>
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>{completionHeading}</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 800 }}>
                        {completion?.product?.name || "Your product"}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {completion?.product?.is_active ? "Visible on your storefront" : "Hidden until you publish it"}
                      </Typography>
                    </Box>
                    <Stack spacing={0.5}>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {completionBlockerCount > 0
                          ? `${completionBlockerCount} setup item${completionBlockerCount === 1 ? "" : "s"} need attention`
                          : completion?.product?.is_active
                            ? "Product is published"
                            : "Product is ready to publish"}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {Number(completionSummary.completed_count || 0) > 0 ? `${Number(completionSummary.completed_count || 0)} setup item${Number(completionSummary.completed_count || 0) === 1 ? "" : "s"} complete` : "No setup items complete yet"}
                      </Typography>
                    </Stack>

                    <Stack spacing={1.25}>
                      {completionGroupedItems.needsAttention.length ? (
                        <Stack spacing={1}>
                          {completionGroupedItems.needsAttention.map((item) => (
                            <Card key={item.code} variant="outlined">
                              <CardContent sx={{ "&:last-child": { pb: 2 } }}>
                                <Stack spacing={1}>
                                  <Alert severity={completionStatusTone(item.status)} sx={{ py: 0 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{item.label}</Typography>
                                    <Typography variant="caption" color="text.secondary">{item.message}</Typography>
                                  </Alert>
                                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                                    {item?.action?.url ? (
                                      <Button
                                        size="small"
                                        variant="outlined"
                                        onClick={() => openCompletionLink(item.action.url)}
                                      >
                                        {item?.action?.label || "Fix now"}
                                      </Button>
                                    ) : null}
                                    {item?.guidance?.steps?.length ? (
                                      <Button
                                        size="small"
                                        variant="text"
                                        onClick={() => setExpandedCompletionGuidance((prev) => ({ ...prev, [item.code]: !prev[item.code] }))}
                                      >
                                        How to fix
                                      </Button>
                                    ) : null}
                                  </Stack>
                                  <Collapse in={Boolean(expandedCompletionGuidance[item.code])}>
                                    <Stack spacing={1} sx={{ pt: 0.5 }}>
                                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                        {item?.guidance?.title || item.label}
                                      </Typography>
                                      {(item?.guidance?.steps || []).map((step, index) => (
                                        <Typography key={`${item.code}-step-${index}`} variant="body2" color="text.secondary">
                                          {index + 1}. {step}
                                        </Typography>
                                      ))}
                                      <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                                        {(item?.guidance?.links || []).map((link) => (
                                          <Button
                                            key={`${item.code}-${link.label}`}
                                            size="small"
                                            variant="text"
                                            onClick={() => openCompletionLink(link.url)}
                                          >
                                            {link.label}
                                          </Button>
                                        ))}
                                      </Stack>
                                    </Stack>
                                  </Collapse>
                                </Stack>
                              </CardContent>
                            </Card>
                          ))}
                        </Stack>
                      ) : null}

                      {completionGroupedItems.warnings.length ? (
                        <Stack spacing={1}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Warnings</Typography>
                          {completionGroupedItems.warnings.map((item) => (
                            <Alert key={item.code} severity="warning" sx={{ py: 0 }}>
                              <Typography variant="body2" sx={{ fontWeight: 700 }}>{item.label}</Typography>
                              <Typography variant="caption" color="text.secondary">{item.message}</Typography>
                            </Alert>
                          ))}
                        </Stack>
                      ) : null}

                      {completionGroupedItems.completed.length ? (
                        <Accordion expanded={completionCompletedOpen} onChange={(_, next) => setCompletionCompletedOpen(next)}>
                          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>
                              Completed setup ({completionGroupedItems.completed.length})
                            </Typography>
                          </AccordionSummary>
                          <AccordionDetails>
                            <Stack spacing={1}>
                              {completionGroupedItems.completed.map((item) => (
                                <Alert key={item.code} severity="success" sx={{ py: 0 }}>
                                  <Typography variant="body2" sx={{ fontWeight: 700 }}>{item.label}</Typography>
                                  <Typography variant="caption" color="text.secondary">{item.message}</Typography>
                                </Alert>
                              ))}
                            </Stack>
                          </AccordionDetails>
                        </Accordion>
                      ) : null}

                      {completionGroupedItems.information.length ? (
                        <Accordion expanded={completionInformationOpen} onChange={(_, next) => setCompletionInformationOpen(next)}>
                          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>Information</Typography>
                          </AccordionSummary>
                          <AccordionDetails>
                            <Stack spacing={1}>
                              {completionGroupedItems.information.map((item) => (
                                <Alert key={item.code} severity="info" sx={{ py: 0 }}>
                                  <Typography variant="body2" sx={{ fontWeight: 700 }}>{item.label}</Typography>
                                  <Typography variant="caption" color="text.secondary">{item.message}</Typography>
                                </Alert>
                              ))}
                            </Stack>
                          </AccordionDetails>
                        </Accordion>
                      ) : null}
                    </Stack>

                    <Stack spacing={1}>
                      {completionNextAction ? (
                        <Button variant="contained" onClick={handleCompletionPrimaryAction} disabled={busy}>
                          {completionNextAction.label}
                        </Button>
                      ) : null}
                      <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                        {completion?.links?.product ? (
                          <Button variant="outlined" onClick={() => openCompletionLink(completion.links.product)}>
                            Open Product
                          </Button>
                        ) : null}
                        <Button variant="outlined" startIcon={<RefreshIcon />} onClick={() => refreshCompletionStatus()} disabled={busy || !session?.public_id}>
                          Refresh status
                        </Button>
                      </Stack>
                      {!completion?.available_actions?.prepare_publish ? (
                        <Typography variant="caption" color="text.secondary">
                          Publish Product{completionBlockerCount > 0 ? ` is available after ${completionBlockerCount} setup item${completionBlockerCount === 1 ? "" : "s"}.` : " requires a readiness refresh."}
                        </Typography>
                      ) : null}
                    </Stack>

                    <Accordion expanded={completionMoreActionsOpen} onChange={(_, next) => setCompletionMoreActionsOpen(next)}>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>More actions</Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} flexWrap="wrap" useFlexGap>
                          {completion?.product?.product_id ? (
                            <>
                              <Button
                                variant="outlined"
                                onClick={() => onOpenProductCheckoutPreview?.(completion.product.product_id)}
                                disabled={busy || !onOpenProductCheckoutPreview}
                              >
                                Explain customer checkout
                              </Button>
                              <Button
                                variant="outlined"
                                onClick={() => onOpenProductCheckoutPreview?.(completion.product.product_id)}
                                disabled={busy || !onOpenProductCheckoutPreview}
                              >
                                What could I make on this sale?
                              </Button>
                            </>
                          ) : null}
                          {!completion?.product?.is_digital ? (
                            <Button
                              variant="outlined"
                              onClick={() => createSession("test_shipping_setup", { productId: completion?.product?.product_id })}
                              disabled={busy || !completion?.product?.product_id || !completionShippingTestAction.enabled}
                            >
                              {completionShippingTestAction.label || "Test shipping setup"}
                            </Button>
                          ) : null}
                          {!completionShippingTestAction.enabled && completionShippingTestAction.message ? (
                            <Typography variant="caption" color="text.secondary">
                              {completionShippingTestAction.message}
                            </Typography>
                          ) : null}
                          {!completion?.product?.is_digital ? (
                            <Button
                              variant="outlined"
                              onClick={() => createSession("international_expansion_assistant", { productId: completion?.product?.product_id })}
                              disabled={busy || !completion?.product?.product_id}
                            >
                              Expand internationally
                            </Button>
                          ) : null}
                          <Button variant="outlined" onClick={() => startContentWorkflow(completion?.product?.product_id)} disabled={busy || !completion?.product?.product_id}>
                            Improve storefront content
                          </Button>
                          {completion?.available_actions?.open_digital_products && completion?.links?.digital_products ? (
                            <Button variant="outlined" onClick={() => openCompletionLink(completion.links.digital_products)}>
                              Open Digital Products
                            </Button>
                          ) : completion?.links?.delivery_setup ? (
                            <Button variant="outlined" onClick={() => openCompletionLink(completion.links.delivery_setup)}>
                              Open Delivery Setup
                            </Button>
                          ) : null}
                        </Stack>
                      </AccordionDetails>
                    </Accordion>
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

            {completionVisible ? (
              <Dialog
                open={guidedSetupOpen}
                onClose={() => setGuidedSetupOpen(false)}
                fullScreen={isMobileDialog}
                fullWidth
                maxWidth="md"
                scroll="paper"
              >
                <DialogTitle sx={{ fontWeight: 800 }}>Finish Product setup</DialogTitle>
                <DialogContent dividers>
                  <Stack spacing={2}>
                    {completionGroupedItems.needsAttention.map((item, index) => (
                      <Card key={`guided-${item.code}`} variant="outlined">
                        <CardContent>
                          <Stack spacing={1.25}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                              Step {index + 1} of {completionGroupedItems.needsAttention.length} - {item.label}
                            </Typography>
                            <Typography variant="body2">{item.message}</Typography>
                            {item?.guidance?.title ? (
                              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                {item.guidance.title}
                              </Typography>
                            ) : null}
                            {(item?.guidance?.steps || []).map((step, stepIndex) => (
                              <Typography key={`guided-${item.code}-${stepIndex}`} variant="body2" color="text.secondary">
                                {stepIndex + 1}. {step}
                              </Typography>
                            ))}
                            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                              {(item?.guidance?.links || []).map((link) => (
                                <Button
                                  key={`guided-link-${item.code}-${link.label}`}
                                  variant="outlined"
                                  size="small"
                                  onClick={() => openCompletionLink(link.url)}
                                >
                                  {link.label}
                                </Button>
                              ))}
                              {item?.action?.url ? (
                                <Button
                                  variant="text"
                                  size="small"
                                  onClick={() => openCompletionLink(item.action.url)}
                                >
                                  {item.action.label || "Fix now"}
                                </Button>
                              ) : null}
                            </Stack>
                          </Stack>
                        </CardContent>
                      </Card>
                    ))}
                  </Stack>
                </DialogContent>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ p: 2, justifyContent: "flex-end" }}>
                  <Button variant="outlined" startIcon={<RefreshIcon />} onClick={() => refreshCompletionStatus()} disabled={busy || !session?.public_id}>
                    Refresh status
                  </Button>
                  <Button variant="text" onClick={() => setGuidedSetupOpen(false)}>
                    Close and finish later
                  </Button>
                </Stack>
              </Dialog>
            ) : null}

            {isInternationalExpansionWorkflow ? (
              <Card variant="outlined">
                <CardContent>
                  <Stack spacing={2}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>International expansion review</Typography>
                    <Alert severity="info">
                      Configuration ready means Product and Schedulaa settings are complete under the current supported checks. Carrier rates, Customs acceptance, and legal eligibility are not guaranteed.
                    </Alert>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>Step 1 of 4 - Product</Typography>
                      <TextField
                        select
                        fullWidth
                        label="Product"
                        value={internationalExpansionForm.product_id}
                        onChange={(event) => setInternationalExpansionForm((prev) => ({ ...prev, product_id: event.target.value }))}
                        SelectProps={{ MenuProps: DRAWER_MENU_PROPS }}
                      >
                        <MenuItem value="">Choose a Product</MenuItem>
                        {(internationalExpansion?.product_options || []).map((product) => (
                          <MenuItem key={product.id} value={String(product.id)}>
                            {product.name} {product.sku ? `(${product.sku})` : ""}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>Step 2 of 4 - Destinations</Typography>
                      <Autocomplete
                        multiple
                        disablePortal
                        options={internationalCountryOptions}
                        value={selectedInternationalCountryOptions}
                        filterSelectedOptions
                        getOptionDisabled={(option) => option.code === internationalOriginCode || !(internationalExpansionForm.destinations || []).includes(option.code) && internationalDestinationLimitReached}
                        isOptionEqualToValue={(option, value) => option.code === value.code}
                        getOptionLabel={(option) => `${option.label} (${option.code})`}
                        onChange={(_, value) => {
                          const next = value
                            .map((row) => row.code)
                            .filter((code, index, array) => array.indexOf(code) === index)
                            .slice(0, 10);
                          setInternationalExpansionForm((prev) => ({
                            ...prev,
                            destinations: next,
                            enable_destinations: (prev.enable_destinations || []).filter((code) => next.includes(code)),
                          }));
                        }}
                        filterOptions={(options, state) => {
                          const term = String(state.inputValue || "").trim().toLowerCase();
                          return options.filter((option) => {
                            const haystack = `${option.label} ${option.code}`.toLowerCase();
                            return haystack.includes(term);
                          });
                        }}
                        renderTags={(value, getTagProps) => value.map((option, index) => (
                          <Chip
                            {...getTagProps({ index })}
                            key={option.code}
                            size="small"
                            label={option.label}
                          />
                        ))}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            fullWidth
                            label="Destinations to review"
                            placeholder="Search by country or code"
                            helperText={
                              internationalDestinationLimitReached
                                ? "Review up to 10 countries at a time."
                                : internationalOriginCode
                                  ? `${internationalExpansion?.result?.origin?.label || "Your domestic origin country"} is excluded from the international review list.`
                                  : "Search by country name or two-letter code."
                            }
                          />
                        )}
                        slotProps={{
                          paper: {
                            sx: { zIndex: COPILOT_OVERLAY_Z_INDEX },
                          },
                        }}
                      />
                      <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: "wrap" }}>
                        {(internationalExpansion?.recommended_destinations || []).map((group) => (
                          <Button
                            key={group.label}
                            size="small"
                            variant="text"
                            onClick={() => setInternationalExpansionForm((prev) => ({
                              ...prev,
                              destinations: Array.from(new Set([...(prev.destinations || []), ...((group.codes || []).filter((code) => code !== internationalOriginCode))])).slice(0, 10),
                              enable_destinations: (prev.enable_destinations || []).filter((code) => Array.from(new Set([...(prev.destinations || []), ...((group.codes || []).filter((nextCode) => nextCode !== internationalOriginCode))])).slice(0, 10).includes(code)),
                            }))}
                          >
                            {group.label}
                          </Button>
                        ))}
                      </Stack>
                    </Box>
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                      <Button variant="contained" onClick={requestInternationalReview} disabled={busy || !internationalExpansionForm.product_id || !(internationalExpansionForm.destinations || []).length}>
                        Review selected countries
                      </Button>
                      {internationalExpansion?.links?.product ? (
                        <Button variant="outlined" component="a" href={internationalExpansion.links.product}>
                          Open Product
                        </Button>
                      ) : null}
                      {internationalExpansion?.links?.delivery_setup ? (
                        <Button variant="outlined" component="a" href={internationalExpansion.links.delivery_setup}>
                          Open Delivery Setup
                        </Button>
                      ) : null}
                    </Stack>
                    {internationalExpansion?.result_stale ? (
                      <Alert severity="warning">{internationalExpansion?.stale_message}</Alert>
                    ) : null}
                    {internationalExpansion?.result ? (
                      <Stack spacing={2}>
                        {internationalExpansion.result.product?.is_digital ? (
                          <Alert severity="info">
                            This is a Digital Product. International parcel shipping and Customs do not apply.
                          </Alert>
                        ) : null}
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>Step 3 of 4 - Review</Typography>
                          <Card variant="outlined">
                            <CardContent>
                              <Stack spacing={1}>
                                <Typography variant="body2" sx={{ fontWeight: 700 }}>Common Product setup</Typography>
                                {(internationalExpansion.result.common_readiness?.items || []).map((item) => (
                                  <Alert key={item.code} severity={item.status === "ready" ? "success" : item.status === "blocked" ? "warning" : "info"} sx={{ py: 0 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{item.label}</Typography>
                                    <Typography variant="caption" color="text.secondary">{item.message}</Typography>
                                  </Alert>
                                ))}
                              </Stack>
                            </CardContent>
                          </Card>
                        </Box>
                        {["ready_now", "needs_setup", "not_enabled", "blocked", "not_applicable"].map((groupStatus) => {
                          const rows = (internationalExpansion.result.reviewed_destinations || []).filter((row) => row.status === groupStatus);
                          if (!rows.length) return null;
                          const title = {
                            ready_now: "Configuration ready",
                            needs_setup: "Needs setup",
                            not_enabled: "Not enabled",
                            blocked: "Blocked",
                            not_applicable: "Not applicable",
                          }[groupStatus];
                          return (
                            <Box key={groupStatus}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>{title}</Typography>
                              <Stack spacing={1}>
                                {rows.map((row) => (
                                  <Card key={row.code} variant="outlined">
                                    <CardContent>
                                      <Stack spacing={0.75}>
                                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{row.label}</Typography>
                                        <Typography variant="caption" color="text.secondary">{row.summary}</Typography>
                                        <Alert severity={row.shipping_test?.status === "passed" ? "success" : row.shipping_test?.status === "not_tested" ? "info" : "warning"} sx={{ py: 0 }}>
                                          Carrier test: {row.shipping_test?.status === "passed" ? "Passed" : row.shipping_test?.status === "failed" ? "Failed" : row.shipping_test?.status === "stale" ? "Stale" : "Not tested"}
                                          {row.shipping_test?.safe_summary ? ` — ${row.shipping_test.safe_summary}` : ""}
                                          {row.shipping_test?.last_tested_at ? ` · Last tested ${new Date(row.shipping_test.last_tested_at).toLocaleDateString()}` : ""}
                                        </Alert>
                                        {(row.items || []).map((item) => (
                                          <Typography key={`${row.code}-${item.code}`} variant="body2">
                                            <strong>{item.label}:</strong> {item.message}
                                          </Typography>
                                        ))}
                                        {groupStatus === "ready_now" ? (
                                          <Button
                                            size="small"
                                            variant="text"
                                            onClick={() => createSession("test_shipping_setup", { productId: Number(internationalExpansionForm.product_id || 0), initialDestinationCountry: row.code })}
                                            disabled={busy}
                                          >
                                            Test shipping to this country
                                          </Button>
                                        ) : null}
                                      </Stack>
                                    </CardContent>
                                  </Card>
                                ))}
                              </Stack>
                            </Box>
                          );
                        })}
                        {internationalExpansion?.result?.buyer_notice_preview?.display_lines?.length ? (
                          <Card variant="outlined">
                            <CardContent>
                              <Stack spacing={0.75}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>What your international customer will see</Typography>
                                <Typography variant="body2">Shipping: Calculated at checkout</Typography>
                                <Typography variant="body2">Import duties and taxes: Not included</Typography>
                                {(internationalExpansion.result.buyer_notice_preview.display_lines || []).map((line) => (
                                  <Typography key={line} variant="caption" color="text.secondary">{line}</Typography>
                                ))}
                              </Stack>
                            </CardContent>
                          </Card>
                        ) : null}
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>Step 4 of 4 - Next actions</Typography>
                          {internationalEligibleEnablementRows.length ? (
                            <Card variant="outlined" sx={{ mb: 1.5 }}>
                              <CardContent>
                                <Stack spacing={1}>
                                  <Typography variant="body2" sx={{ fontWeight: 700 }}>Destinations eligible to enable</Typography>
                                  {internationalEligibleEnablementRows.map((row) => (
                                    <FormControlLabel
                                      key={row.code}
                                      control={(
                                        <Checkbox
                                          checked={(internationalExpansionForm.enable_destinations || []).includes(row.code)}
                                          onChange={(event) => setInternationalExpansionForm((prev) => ({
                                            ...prev,
                                            enable_destinations: event.target.checked
                                              ? [...new Set([...(prev.enable_destinations || []), row.code])]
                                              : (prev.enable_destinations || []).filter((code) => code !== row.code),
                                          }))}
                                          disabled={busy || internationalExpansion?.result_stale}
                                        />
                                      )}
                                      label={row.label}
                                    />
                                  ))}
                                  {internationalExpansion?.result_stale ? (
                                    <Typography variant="caption" color="text.secondary">Refresh this review before preparing destination changes.</Typography>
                                  ) : null}
                                </Stack>
                              </CardContent>
                            </Card>
                          ) : null}
                          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} flexWrap="wrap">
                            <Button variant="contained" onClick={continueInternationalSetup} disabled={busy || !internationalExpansion.result.available_actions?.help_finish_setup}>
                              Help me finish international setup
                            </Button>
                            <Button variant="outlined" onClick={prepareDestinationEnablement} disabled={busy || internationalExpansion?.result_stale || !internationalExpansion.result.available_actions?.prepare_destination_enablement || !(internationalExpansionForm.enable_destinations || []).length}>
                              Prepare selected destination changes
                            </Button>
                            <Button variant="outlined" onClick={copyInternationalSummary} disabled={busy || !internationalExpansion.result.available_actions?.copy_summary}>
                              Copy review summary
                            </Button>
                            <Button variant="text" onClick={requestInternationalReview} disabled={busy}>
                              {internationalExpansion?.result_stale ? "Refresh review" : "Review another country"}
                            </Button>
                          </Stack>
                        </Box>
                      </Stack>
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
      <Snackbar
        open={toastMessage.open}
        autoHideDuration={3500}
        onClose={() => setToastMessage((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={toastMessage.severity || "success"}
          onClose={() => setToastMessage((prev) => ({ ...prev, open: false }))}
          sx={{ width: "100%" }}
        >
          {toastMessage.text}
        </Alert>
      </Snackbar>
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
